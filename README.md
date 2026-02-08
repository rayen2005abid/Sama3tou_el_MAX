# Sama3tou Max Project

## Project Structure
- `backend/`: FastAPI backend
- `frontend/`: React frontend
- `venv/`: Shared virtual environment for backend

## Prerequisites
- Python 3.14+
- Node.js (for frontend)

## Quick Start

### 1. Backend Setup & Run

The virtual environment is located in the root `venv` folder.

**Terminals:** PowerShell

```powershell
# 1. Activate Virtual Environment
.\venv\Scripts\Activate.ps1

# 2. Run Backend Server (from root directory)
uvicorn backend.main:app --reload
```
The backend will run at `http://127.0.0.1:8000`.

### 2. Frontend Setup & Run

Open a **new** terminal for the frontend.

```powershell
# 1. Navigate to frontend
cd frontend

# 2. Install Dependencies (if not already installed)
npm install

# 3. Run Frontend
npm run dev
```
The frontend will typically run at `http://localhost:5173`.

## Troubleshooting

- **"uvicorn is not recognized"**: Ensure you have activated the virtual environment (`.\venv\Scripts\Activate.ps1`) before running the command.
- **Import errors**: Ensure you are running `uvicorn` from the **root** directory (`c:\Users\user\Downloads\sama3tou max`), NOT inside `backend/`.
