#Persistent
Menu, Tray, Icon, shell32.dll, 110  ; Use a system tray icon
Menu, Tray, Tip, Close Electron & Discord Bot  ; Tooltip
Menu, Tray, Add, CloseProcesses, KillProcesses
Menu, Tray, Default , CloseProcesses
Menu, Tray, Click, 1
return

KillProcesses() {
    Run, "C:/Users/Jeremy/Documents/GitHub/jg_node_api/assets/helperscripts/killcmds.bat"
    ExitApp  ; Close the AutoHotkey script
}