$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"
$VenvDir = Join-Path $ProjectRoot ".venv"
$VenvPython = Join-Path $VenvDir "Scripts\python.exe"

Set-Location $ProjectRoot

if (-not (Test-Path $VenvPython)) {
    Write-Host "Creating Python virtual environment..."
    & py -3 -m venv $VenvDir
    if ($LASTEXITCODE -ne 0) {
        throw "Could not create the Python virtual environment."
    }
} else {
    $PyvenvConfig = Join-Path $VenvDir "pyvenv.cfg"
    $OriginalExecutable = ""
    if (Test-Path $PyvenvConfig) {
        $ExecutableLine = Get-Content $PyvenvConfig | Where-Object { $_ -match "^executable\s*=" } | Select-Object -First 1
        if ($ExecutableLine) {
            $OriginalExecutable = ($ExecutableLine -split "=", 2)[1].Trim()
        }
    }
    if (($OriginalExecutable -and -not (Test-Path $OriginalExecutable)) -or -not (Test-Path $VenvPython)) {
        Write-Host "Recreating stale Python virtual environment..."
        Remove-Item -LiteralPath $VenvDir -Recurse -Force
        & py -3 -m venv $VenvDir
        if ($LASTEXITCODE -ne 0) {
            throw "Could not recreate the Python virtual environment."
        }
    }
}

Write-Host "Installing backend dependencies..."
& $VenvPython -m pip install -r (Join-Path $BackendDir "requirements.txt")
if ($LASTEXITCODE -ne 0) {
    throw "Backend dependency installation failed."
}

Write-Host "Installing frontend dependencies..."
Push-Location $FrontendDir
& npm install
if ($LASTEXITCODE -ne 0) {
    throw "Frontend dependency installation failed."
}
Pop-Location

Write-Host "Starting ActuariaAI..."

$BackendProcess = Start-Process -FilePath $VenvPython `
    -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000" `
    -WorkingDirectory $BackendDir `
    -PassThru

$FrontendProcess = Start-Process -FilePath "npm.cmd" `
    -ArgumentList "run", "dev", "--", "--host", "127.0.0.1", "--port", "5173" `
    -WorkingDirectory $FrontendDir `
    -PassThru

$ready = $false
for ($attempt = 0; $attempt -lt 30; $attempt++) {
    Start-Sleep -Seconds 1
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:8000/api/v1/health" -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            $ready = $true
            break
        }
    } catch {
        if ($BackendProcess.HasExited) {
            throw "Backend stopped while starting."
        }
        if ($FrontendProcess.HasExited) {
            throw "Frontend stopped while starting."
        }
    }
}

if (-not $ready) {
    throw "The backend did not become ready."
}

Start-Process "http://127.0.0.1:5173"
Write-Host "ActuariaAI is ready at http://127.0.0.1:5173"
