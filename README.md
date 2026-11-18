# ML Project

An insurance analytics application with a FastAPI backend and React/Vite frontend.

## Features

- Insurance claim prediction
- Actuarial insights
- Risk segmentation
- Portfolio simulation
- Model comparison
- Data exploration

## Run locally

### Windows

```powershell
.\run-project.ps1
```

Or:

```bat
run-project.bat
```

### Manual setup

Backend:

```powershell
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```
