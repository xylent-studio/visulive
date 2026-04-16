$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$watchCommand = "Set-Location '$repoRoot'; npm run watch:captures"

Start-Process powershell -ArgumentList @(
  '-NoExit',
  '-Command',
  $watchCommand
)

Set-Location $repoRoot
npm run dev
