@echo off
setlocal

set "PORT=4173"
set "ROOT=%~dp0"
set "PY_CMD="

cd /d "%ROOT%"

powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing http://127.0.0.1:%PORT%/ -TimeoutSec 1 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1

if "%errorlevel%"=="0" (
  start "" "http://127.0.0.1:%PORT%/"
  exit /b 0
)

where py >nul 2>&1
if "%errorlevel%"=="0" (
  set "PY_CMD=py"
) else (
  where python >nul 2>&1
  if "%errorlevel%"=="0" (
    set "PY_CMD=python"
  ) else (
    echo Python nao foi encontrado no PATH.
    echo Instale Python ou ajuste o PATH para usar este atalho.
    pause
    exit /b 1
  )
)

start "Treino-Servidor" cmd /k "cd /d ""%ROOT%"" && %PY_CMD% -m http.server %PORT% --bind 127.0.0.1"
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:%PORT%/"
