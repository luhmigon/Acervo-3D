@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 18 ou superior e necessario para iniciar o site.
  echo Baixe em https://nodejs.org/
  start "" "https://nodejs.org/"
  pause
  exit /b 1
)

node -e "if (Number(process.versions.node.split('.')[0]) < 18) process.exit(1)"
if errorlevel 1 (
  echo Esta versao do Node.js e antiga. Instale a versao 18 ou superior.
  start "" "https://nodejs.org/"
  pause
  exit /b 1
)

if not exist "node_modules\dotenv\package.json" (
  echo Instalando as dependencias do projeto...
  call npm install
  if errorlevel 1 (
    echo Nao foi possivel instalar as dependencias.
    pause
    exit /b 1
  )
)

set "PORT="
for /f "delims=" %%P in ('node -e "const net=require('node:net');function probe(port){if(port>3010){process.exit(1);return}const server=net.createServer();server.once('error',()=>probe(port+1));server.listen(port,()=>server.close(()=>console.log(port)))}probe(3000)"') do set "PORT=%%P"
if not defined PORT (
  echo Nao foi encontrada uma porta livre entre 3000 e 3010.
  pause
  exit /b 1
)

echo Iniciando o site na porta %PORT%...
start "Meu Acervo 3D - servidor" /D "%~dp0" cmd /k "set PORT=%PORT%&& node server.js"
timeout /t 2 /nobreak >nul
start "" "http://localhost:%PORT%"
