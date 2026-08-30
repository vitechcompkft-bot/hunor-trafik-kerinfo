# Windows Task Scheduler regisztráció — napi 04:30 magyar időben
# Futtasd egyszer, admin PowerShell-ből:
#   powershell -ExecutionPolicy Bypass -File C:\Projects\hunor-trafik-kerinfo\scripts\install-daily-task.ps1

$taskName = "HUNOR-Trafik-DailyUpdate"
$script   = "C:\Projects\hunor-trafik-kerinfo\scripts\daily-auto-update.ps1"

if (-not (Test-Path $script)) { throw "Nem található: $script" }

$action  = New-ScheduledTaskAction -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$script`""
$trigger = New-ScheduledTaskTrigger -Daily -At "04:30"
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -StartWhenAvailable -RunOnlyIfNetworkAvailable `
  -ExecutionTimeLimit ([TimeSpan]::FromMinutes(10))
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" `
  -LogonType Interactive -RunLevel Highest

# Ha már létezik, töröljük
try { Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction Stop } catch {}

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger `
  -Settings $settings -Principal $principal `
  -Description "Napi trafik-adatfrissítés + git push (04:30 magyar időben)"

Write-Host "OK: '$taskName' regisztrálva. Napi 04:30-kor fut."
Write-Host "Naplók: $env:LOCALAPPDATA\hunor-trafik-kerinfo-logs\"
Write-Host ""
Write-Host "Kézi próba most:"
Write-Host "  Start-ScheduledTask -TaskName '$taskName'"
