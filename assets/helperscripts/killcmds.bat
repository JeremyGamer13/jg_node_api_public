@echo off

for /f "tokens=2 delims==" %%i in (
    'wmic process where "CommandLine like '%%helperscripts\\electron.bat%%'" get ProcessId /format:list ^| findstr /r "^ProcessId="'
) do (
    echo Killing process with PID: %%i
    set JG_AIUGFEWLIUBFAIUGDIUABFLIEWBA=%%i
    start "" cmd /k "taskkill /PID %%JG_AIUGFEWLIUBFAIUGDIUABFLIEWBA%% && exit"
)

for /f "tokens=2 delims==" %%i in (
    'wmic process where "CommandLine like '%%helperscripts\\discordbot.bat%%'" get ProcessId /format:list ^| findstr /r "^ProcessId="'
) do (
    echo Killing process with PID: %%i
    set JG_AIUGFEWLIUBFAIUGDIUABFLIEWBA=%%i
    start "" cmd /k "taskkill /PID %%JG_AIUGFEWLIUBFAIUGDIUABFLIEWBA%% && exit"
)