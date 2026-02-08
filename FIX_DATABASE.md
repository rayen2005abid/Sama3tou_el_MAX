# Quick Fix: Database Schema Issue

## Problem
The old `trading.db` file has the wrong schema (uses `knowledge_score` instead of `trading_experience`).

## Solution
I've deleted the database file. Now you need to:

1. **Stop the backend server** (press Ctrl+C in the terminal running uvicorn)
2. **Restart it**:
   ```powershell
   uvicorn backend.main:app --reload
   ```

The server will automatically create a new `trading.db` with the correct schema and seed the admin user.

## Credentials
- Username: `admin`
- Password: `samatou`
