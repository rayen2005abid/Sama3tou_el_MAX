import torch
import torch.nn as nn

class OptimizedLSTM(nn.Module):
    def __init__(self, input_dim, hidden_dim=128, num_layers=2, output_dim=2, dropout=0.3):
        super(OptimizedLSTM, self).__init__()
        
        self.lstm = nn.LSTM(
            input_dim, 
            hidden_dim, 
            num_layers, 
            batch_first=True, 
            dropout=dropout,
            bidirectional=True 
        )
        
        # Bidirectional doubles the hidden dimension
        self.fc_head = nn.Sequential(
            nn.Linear(hidden_dim * 2, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, output_dim)
        )
        
    def forward(self, x):
        # x: (batch, seq, feature)
        # self.lstm(x) returns (out, (h_n, c_n))
        # out: (batch, seq, hidden*2) because bidirectional=True
        out, _ = self.lstm(x) 
        
        # Take the last time step output
        last_step = out[:, -1, :]
        
        # Regression head
        prediction = self.fc_head(last_step)
        return prediction
