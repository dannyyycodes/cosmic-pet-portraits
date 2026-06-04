$targets = Get-CimInstance Win32_Process -Filter "name='chrome.exe'" | Where-Object {
  $_.CommandLine -match 'playwright|--headless|localhost:419|--test-type|--use-angle|--enable-unsafe-swiftshader'
}
foreach ($p in $targets) {
  Write-Output ("kill " + $p.ProcessId)
  Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
}
Get-CimInstance Win32_Process -Filter "name='node.exe'" | Where-Object { $_.CommandLine -match 'vite' } | ForEach-Object {
  Write-Output ("kill-node " + $_.ProcessId)
  Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 2
$dist = 'C:\Users\danie\cosmic-pet-portraits\dist'
if (Test-Path $dist) { Remove-Item $dist -Recurse -Force -ErrorAction SilentlyContinue }
if (Test-Path $dist) { 'dist STILL EXISTS' } else { 'dist removed OK' }
