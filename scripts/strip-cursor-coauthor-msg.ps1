# Strips Cursor co-author trailers from commit messages (stdin -> stdout).
$text = [System.Console]::In.ReadToEnd()
$lines = $text -split "`r?`n" | Where-Object {
  $_ -notmatch '^\s*Co-authored-by:\s*Cursor\s*<cursoragent@cursor\.com>\s*$'
}
$clean = ($lines -join "`n").TrimEnd()
if ($clean.Length -gt 0) { Write-Output $clean }
