@cd /d "%~dp0"

call pnpm install

@cd electron

call npm install
call npm install @types/node@18

@cd /d "%~dp0"
