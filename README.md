# Sama3tou Max Project

## Project Structure
- `backend/`: FastAPI backend
- `frontend/`: React frontend
- `venv/`: Shared virtual environment for backend

## Prerequisites
- Python 3.10+
- Node.js (for frontend)

## Quick Start (From Scratch)

### 1. Clone & Environment
```powershell
git clone https://github.com/rayen2005abid/Sama3tou_el_MAX.git
cd "Sama3tou_el_MAX"
```

### 2. Backend Setup
The backend runs on Python/FastAPI.

```powershell
# 1. Create Virtual Environment
python -m venv venv

# 2. Activate Virtual Environment
.\venv\Scripts\Activate

# 3. Install Dependencies
pip install -r requirements.txt

# 4. Run Server
uvicorn backend.main:app --reload
```
*Backend runs at: `http://127.0.0.1:8000`*

### 3. Frontend Setup
The frontend runs on React/Vite. Open a **new** terminal window.

```powershell
# 1. Navigate to frontend
cd frontend

# 2. Install Dependencies
npm install

# 3. Run Dev Server
npm run dev
```
*Frontend runs at: `http://localhost:5173`*

## Troubleshooting

- **"uvicorn is not recognized"**: Ensure you have activated the virtual environment (`.\venv\Scripts\Activate.ps1`) before running the command.
- **Import errors**: Ensure you are running `uvicorn` from the **root** directory (`c:\Users\user\Downloads\sama3tou max`), NOT inside `backend/`.
