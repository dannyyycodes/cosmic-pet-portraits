param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$IngestArgs
)

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $repoRoot

foreach ($envFile in @('.env', '.env.local')) {
  $path = Join-Path $repoRoot $envFile
  if (-not (Test-Path -LiteralPath $path)) {
    continue
  }

  Get-Content -LiteralPath $path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#') -or -not $line.Contains('=')) {
      return
    }

    $parts = $line -split '=', 2
    $key = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"').Trim("'")
    if ($key) {
      [Environment]::SetEnvironmentVariable($key, $value, 'Process')
    }
  }
}

$existingNodeOptions = $env:NODE_OPTIONS
if ($existingNodeOptions -notmatch '--experimental-global-webcrypto') {
  $env:NODE_OPTIONS = "$existingNodeOptions --experimental-global-webcrypto".Trim()
}

& npx -y tsx scripts/library/ingest.ts @IngestArgs
exit $LASTEXITCODE
