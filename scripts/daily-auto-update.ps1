# Napi auto-update: build-data.js + git commit/push, ha van valtozas
# Fut: Windows Task Scheduler, naponta 04:30 magyar idoben

$repoRoot = "C:\Projects\hunor-trafik-kerinfo"
$logDir   = "$env:LOCALAPPDATA\hunor-trafik-kerinfo-logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Force -Path $logDir | Out-Null }
$log = Join-Path $logDir ("daily-{0}.log" -f (Get-Date -Format "yyyy-MM-dd"))

function Log($msg) {
  $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  Add-Content -Path $log -Value "[$ts] $msg" -Encoding utf8
}

# Csendes native-exe futtatas: stderr-t elnyeli, exit-kodot vissza adja
function Run-Silent($cmd, [string[]]$argv) {
  # PowerShell 5.1-kompatibilis: sima idezojelezett argv-string
  $argStr = ($argv | ForEach-Object { '"' + ($_ -replace '"','\"') + '"' }) -join " "
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $cmd
  $psi.Arguments = $argStr
  $psi.WorkingDirectory = (Get-Location).Path
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.UseShellExecute = $false
  $p = [System.Diagnostics.Process]::Start($psi)
  $stdout = $p.StandardOutput.ReadToEnd()
  $stderr = $p.StandardError.ReadToEnd()
  $p.WaitForExit()
  return @{ exit = $p.ExitCode; stdout = $stdout; stderr = $stderr }
}

try {
  Log "===== Start ====="
  Set-Location $repoRoot

  Log "build-data.js indul..."
  $r = Run-Silent "node" @("scripts\build-data.js")
  Log ("build exit=" + $r.exit + " out=" + $r.stdout.Trim())
  if ($r.exit -ne 0) { Log ("build stderr=" + $r.stderr); throw "build-data.js failed" }

  Log "git add..."
  $r = Run-Silent "git" @("add", "public/data/trafik.json")
  if ($r.exit -ne 0) { Log ("git add HIBA: " + $r.stderr); throw "git add failed" }

  Log "git diff-cached..."
  $r = Run-Silent "git" @("diff", "--cached", "--quiet")
  if ($r.exit -eq 0) {
    Log "Nincs valtozas - nincs commit"
  } else {
    $today = Get-Date -Format "yyyy-MM-dd"
    Log "git commit..."
    $r = Run-Silent "git" @("commit", "-m", "Napi auto-update ($today)")
    Log ("commit exit=" + $r.exit + " " + $r.stdout.Trim())
    if ($r.exit -ne 0) { Log ("commit stderr=" + $r.stderr); throw "git commit failed" }

    Log "git push..."
    $r = Run-Silent "git" @("push", "origin", "main")
    Log ("push exit=" + $r.exit + " " + $r.stdout.Trim())
    if ($r.exit -ne 0) { Log ("push stderr=" + $r.stderr); throw "git push failed" }
    Log "OK: pushed"
  }
  Log "===== Kesz ====="
} catch {
  Log ("HIBA: " + $_.Exception.Message)
  exit 1
}
