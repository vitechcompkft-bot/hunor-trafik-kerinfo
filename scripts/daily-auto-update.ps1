# Napi auto-update: build-data.js + git commit/push, ha van valtozas
# Fut: Windows Task Scheduler, naponta 04:30 magyar idoben

$ErrorActionPreference = "Stop"
$repoRoot = "C:\Projects\hunor-trafik-kerinfo"
$logDir   = "$env:LOCALAPPDATA\hunor-trafik-kerinfo-logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Force -Path $logDir | Out-Null }
$log = Join-Path $logDir ("daily-{0}.log" -f (Get-Date -Format "yyyy-MM-dd"))

function Log($msg) {
  $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Add-Content -Path $log -Value "[$ts] $msg" -Encoding utf8
}

try {
  Log "===== Start ====="
  Set-Location $repoRoot

  Log "build-data.js indul..."
  $buildOut = & node scripts\build-data.js 2>&1 | Out-String
  Log $buildOut

  Log "git add + commit + push..."
  & git add public/data/trafik.json 2>&1 | Out-Null
  & git diff --cached --quiet
  if ($LASTEXITCODE -ne 0) {
    $today = Get-Date -Format "yyyy-MM-dd"
    & git commit -m "Napi auto-update ($today)" 2>&1 | Tee-Object -FilePath $log -Append | Out-Null
    & git push origin main 2>&1 | Tee-Object -FilePath $log -Append | Out-Null
    Log "OK: pushed"
  } else {
    Log "Nincs valtozas - nincs commit"
  }
  Log "===== Kesz ====="
} catch {
  Log ("HIBA: " + $_.Exception.Message)
  exit 1
}
