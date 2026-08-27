# Spaced GitHub pushes — one branch every $GapMinutes minutes
param(
  [int]$GapMinutes = 20,
  [string[]]$Branches = @(
    "feature/course-discussions",
    "feature/real-lms-extensions"
  )
)

Set-Location "e:\CPS-LMS"
$log = Join-Path $PSScriptRoot "spaced-push-log.txt"
function Write-Log($msg) {
  $line = "{0:u}  {1}" -f (Get-Date).ToUniversalTime(), $msg
  Add-Content -Path $log -Value $line
  Write-Host $line
}

Write-Log "Starting spaced push (gap=$GapMinutes min)"
$i = 0
foreach ($b in $Branches) {
  $i++
  Write-Log "[$i/$($Branches.Count)] Pushing $b"
  git push -u origin $b 2>&1 | Tee-Object -FilePath $log -Append
  if ($LASTEXITCODE -ne 0) {
    Write-Log "Push failed for $b — trying force-with-lease"
    git push --force-with-lease -u origin $b 2>&1 | Tee-Object -FilePath $log -Append
  }
  if ($i -lt $Branches.Count) {
    $sec = $GapMinutes * 60
    Write-Log "Sleeping $GapMinutes minutes before next push..."
    Start-Sleep -Seconds $sec
  }
}
Write-Log "Done."
