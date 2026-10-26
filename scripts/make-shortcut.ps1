# Creates the Desktop shortcut "إيجنت سهل" for the Sahel agent demo (Windows).
# Run: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\make-shortcut.ps1
# This file is UTF-8 with BOM so Windows PowerShell 5.1 reads the Arabic name correctly.
$ErrorActionPreference = 'Stop'

$project = Split-Path -Parent $PSScriptRoot
$bat = Join-Path $project 'start-demo.bat'
$icon = Join-Path $project 'assets\sahel.ico'
if (-not (Test-Path $bat)) { throw "start-demo.bat not found in $project" }
if (-not (Test-Path $icon)) { throw "assets\sahel.ico not found in $project" }

# Handles a Desktop redirected to OneDrive.
$desktop = [Environment]::GetFolderPath('Desktop')
$link = Join-Path $desktop 'إيجنت سهل.lnk'

# WScript.Shell cannot save to a non-ASCII file name, so save under an ASCII name, then rename.
$tmp = Join-Path $desktop 'sahel-agent-demo-shortcut.lnk'
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($tmp)
$shortcut.TargetPath = $bat
$shortcut.WorkingDirectory = $project
$shortcut.WindowStyle = 7   # minimized
$shortcut.IconLocation = "$icon,0"
$shortcut.Description = 'Sahel agent demo (independent demo, not the official app)'
$shortcut.Save()
Move-Item -LiteralPath $tmp -Destination $link -Force

Write-Output "Desktop shortcut ready: $link"
