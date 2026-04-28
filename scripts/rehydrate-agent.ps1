param(
  [string]$Trigger = 'start here',
  [switch]$Quiet
)

$ErrorActionPreference = 'Stop'

function Write-RehydrateMessage {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Message
  )

  if (-not $Quiet) {
    Write-Host $Message
  }
}

$repoRoot = Split-Path -Path $PSScriptRoot -Parent
$intelScriptRoot = 'C:\dev\_intel\scripts'
$resolveScript = Join-Path $intelScriptRoot 'Resolve-AgentContext.ps1'
$restoreScript = Join-Path $intelScriptRoot 'Build-RestoreAnchor.ps1'
$recallScript = Join-Path $intelScriptRoot 'Resolve-RoutedRecall.ps1'
$registerScript = Join-Path $intelScriptRoot 'Register-AgentReentry.ps1'

if (-not (Test-Path -LiteralPath $resolveScript)) {
  Write-RehydrateMessage 'Local intel workspace not found on this machine.'
  Write-RehydrateMessage 'Fallback: read AGENTS.md, README.md, project-status.md, and current-program.md before deeper work.'
  exit 0
}

& $resolveScript -TargetPath $repoRoot -Profile 'operator-fast' -Quiet | Out-Null

if (Test-Path -LiteralPath $restoreScript) {
  & $restoreScript -TargetPath $repoRoot -Profile 'operator-fast' -Quiet | Out-Null
}

if (-not [string]::IsNullOrWhiteSpace($Trigger) -and (Test-Path -LiteralPath $recallScript)) {
  & $recallScript -TargetPath $repoRoot -Trigger $Trigger -Profile 'operator-fast' -Quiet | Out-Null
}

if (Test-Path -LiteralPath $registerScript) {
  & $registerScript -TargetPath $repoRoot -Trigger $Trigger -Profile 'operator-fast' -EntryPoint 'visulive-rehydrate-helper' -Quiet | Out-Null
  & $resolveScript -TargetPath $repoRoot -Profile 'operator-fast' -Quiet | Out-Null
  if (Test-Path -LiteralPath $restoreScript) {
    & $restoreScript -TargetPath $repoRoot -Profile 'operator-fast' -Quiet | Out-Null
  }
}

$runtimeRoot = 'C:\dev\_intel\ops\local-machine-ops'
$contextPath = Join-Path $runtimeRoot 'context-resolutions\visulive\operator-fast\latest.md'
$restorePath = Join-Path $runtimeRoot 'restore-anchors\visulive\operator-fast\latest.md'
$recallPath = Join-Path $runtimeRoot 'recall-resolutions\visulive\operator-fast\latest.md'
$checkpointPath = Join-Path $runtimeRoot 'checkpoints\visulive\latest.md'
$activityPath = Join-Path $runtimeRoot 'activity-snapshots\visulive\latest.md'
$driftPath = Join-Path $runtimeRoot 'drift-reports\visulive\latest.md'
$externalContextPath = Join-Path $runtimeRoot 'external-context\visulive\latest.md'
$externalContextInbox = 'C:\dev\_intel\incoming-context\visulive\pending'

Write-RehydrateMessage 'VisuLive agent context refreshed.'
Write-RehydrateMessage ('Target: {0}' -f $repoRoot)

foreach ($path in @($contextPath, $restorePath, $recallPath, $checkpointPath, $activityPath, $driftPath, $externalContextPath)) {
  if (Test-Path -LiteralPath $path) {
    Write-RehydrateMessage ('- {0}' -f $path)
  }
}

if (-not (Test-Path -LiteralPath $externalContextPath)) {
  Write-RehydrateMessage ('- external context inbox: {0}' -f $externalContextInbox)
}
