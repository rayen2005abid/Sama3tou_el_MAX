import pandas as pd
import os

def load_and_merge_data(data_dir):
    dfs = []
    print(f"Loading data from {data_dir}...", flush=True)
    
    if not os.path.exists(data_dir):
        print(f"ERROR: Directory {data_dir} does not exist!", flush=True)
        return pd.DataFrame()

    all_files = os.listdir(data_dir)
    # Filter for relevant files (histo_cotation_YYYY) and exclude 2016-2021
    files = []
    for f in all_files:
        if f.startswith("histo_cotation"):
            try:
                # Extract year from filename (e.g. histo_cotation_2016.txt -> 2016)
                parts = f.replace('.', '_').split('_')
                if len(parts) >= 3:
                     year = int(parts[2])
                     if year >= 2022:
                         files.append(f)
            except ValueError:
                continue

    files = sorted(files)
    print(f"Selected files (2022+): {files}", flush=True)
    
    col_mapping = {
        "D_SEANCE": "SEANCE", "F_SEANCE": "SEANCE", "DATE": "SEANCE",
        "C_MEMO": "CODE", "MEMO": "CODE", "TICKER": "CODE",
        "C_OUV": "OUVERTURE", "OPEN": "OUVERTURE",
        "C_CLOT": "CLOTURE", "CLOSE": "CLOTURE",
        "C_HAUT": "PLUS_HAUT", "HIGH": "PLUS_HAUT",
        "C_BAS": "PLUS_BAS", "LOW": "PLUS_BAS",
        "Q_ECH": "QUANTITE_NEGOCIEE", "VOLUME": "QUANTITE_NEGOCIEE",
        "V_ECH": "CAPITAUX", "VALUE": "CAPITAUX",
        "NB_TR": "NB_TRANSACTION", "TRADES": "NB_TRANSACTION"
    }

    for file in files:
        path = os.path.join(data_dir, file)
        try:
            if file.endswith(".txt") or file.endswith(".csv"):
                # Try multiple encodings and separators
                encodings = ['utf-8', 'latin-1', 'cp1252']
                df = None
                for enc in encodings:
                    try:
                        # CSV files typically use semicolon separator
                        if file.endswith(".csv"):
                            df = pd.read_csv(path, sep=';', encoding=enc, skipinitialspace=True)
                        else:
                            # TXT files use whitespace (multiple spaces)
                            df = pd.read_csv(path, sep=r'\s+', engine='python', encoding=enc)
                        break
                    except Exception as read_err:
                        continue
                
                if df is None:
                     print(f"Failed to read {file} with standard encodings.")
                     continue
            else:
                continue # Skip non-text files
            
            # Strip whitespace from column names first!
            df.columns = df.columns.str.strip()
            
            # Standardize columns
            df.rename(columns=lambda x: col_mapping.get(x.upper(), x.upper()), inplace=True)
            
            required = ["CODE", "SEANCE", "OUVERTURE", "CLOTURE", "PLUS_HAUT", "PLUS_BAS", "QUANTITE_NEGOCIEE"]
            missing = [c for c in required if c not in df.columns]
            if not missing:
                dfs.append(df[required])
            else:
                print(f"Skipping {file}: Missing columns {missing}")
                
        except Exception as e:
            print(f"Error loading {file}: {e}")
            
    if not dfs:
        # Fallback to empty DF if nothing loaded to prevent crash
        print("No valid data files found.")
        return pd.DataFrame()
        
    final_df = pd.concat(dfs, ignore_index=True)
    
    # Clean Format
    final_df["SEANCE"] = pd.to_datetime(final_df["SEANCE"], errors='coerce')
    final_df = final_df.dropna(subset=["SEANCE"])
    final_df = final_df.sort_values(["CODE", "SEANCE"]).reset_index(drop=True)
    
    # Parsing numeric errors
    cols = ["OUVERTURE", "CLOTURE", "PLUS_HAUT", "PLUS_BAS", "QUANTITE_NEGOCIEE"]
    for c in cols:
        final_df[c] = pd.to_numeric(final_df[c], errors='coerce')
        
    final_df = final_df.dropna().reset_index(drop=True)
    print(f"Total rows loaded: {len(final_df)}")
    return final_df
