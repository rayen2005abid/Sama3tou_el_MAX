import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
import numpy as np
import os
import joblib

from forecasting.data.loader import load_and_merge_data
from forecasting.sequences.creation import create_dataset
from forecasting.models.lstm import OptimizedLSTM

# Configuration
DATA_DIR = r"C:\Users\user\Downloads\sama3tou max\Datasets"
ARTIFACTS_DIR = r"C:\Users\user\Downloads\sama3tou max\forecasting\artifacts"
SEQ_LEN = 60
BATCH_SIZE = 128
EPOCHS = 20
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

def train():
    if not os.path.exists(ARTIFACTS_DIR):
        os.makedirs(ARTIFACTS_DIR)

    # 1. Load Data
    final_df = load_and_merge_data(DATA_DIR)
    if final_df.empty:
        print("Training aborted: No data.")
        return

    # 2. Create Dataset
    X, y, scaler = create_dataset(final_df, seq_len=SEQ_LEN)
    if X is None:
        print("Training aborted: Failed to create sequences.")
        return
        
    # Save Scaler for Inference
    joblib.dump(scaler, os.path.join(ARTIFACTS_DIR, "scaler.pkl"))

    # 3. Split Data
    split_idx = int(0.8 * len(X))
    X_train, y_train = X[:split_idx], y[:split_idx]
    X_val, y_val = X[split_idx:], y[split_idx:]
    
    train_dataset = TensorDataset(torch.tensor(X_train, dtype=torch.float32), torch.tensor(y_train, dtype=torch.float32))
    val_dataset = TensorDataset(torch.tensor(X_val, dtype=torch.float32), torch.tensor(y_val, dtype=torch.float32))
    
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)
    
    # 4. Initialize Model
    model = OptimizedLSTM(input_dim=X.shape[2]).to(device)
    criterion = nn.HuberLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, 'min', patience=3, factor=0.5)
    
    # 5. Training Loop
    best_loss = float('inf')
    early_stop_count = 0
    patience = 5
    
    print(f"Starting training on {device}...")
    
    for epoch in range(EPOCHS):
        model.train()
        train_loss = 0
        for X_batch, y_batch in train_loader:
            X_batch, y_batch = X_batch.to(device), y_batch.to(device)
            
            optimizer.zero_grad()
            preds = model(X_batch)
            loss = criterion(preds, y_batch)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            train_loss += loss.item()
            
        avg_train_loss = train_loss / len(train_loader)
        
        # Validation
        model.eval()
        val_loss = 0
        with torch.no_grad():
            for X_batch, y_batch in val_loader:
                X_batch, y_batch = X_batch.to(device), y_batch.to(device)
                preds = model(X_batch)
                loss = criterion(preds, y_batch)
                val_loss += loss.item()
        
        avg_val_loss = val_loss / len(val_loader)
        scheduler.step(avg_val_loss)
        
        print(f"Epoch {epoch+1}: Train Loss={avg_train_loss:.6f}, Val Loss={avg_val_loss:.6f}")
        
        if avg_val_loss < best_loss:
            best_loss = avg_val_loss
            early_stop_count = 0
            torch.save(model.state_dict(), os.path.join(ARTIFACTS_DIR, "best_lstm_model.pth"))
            print("Saved best model.")
        else:
            early_stop_count += 1
            if early_stop_count >= patience:
                print("Early stopping triggered.")
                break
                
    print("Training finished.")

if __name__ == "__main__":
    train()
