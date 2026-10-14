@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if %errorlevel% equ 0 (
  node scripts\serve.mjs
) else (
  set "DATAVIZ_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
  if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
    "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" scripts\serve.mjs
  ) else (
    echo Install Node.js from https://nodejs.org/ to start the local preview.
  )
)
pause
