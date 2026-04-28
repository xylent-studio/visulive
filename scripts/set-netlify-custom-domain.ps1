[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [Parameter(Mandatory = $true)]
  [string]$SiteId,

  [Parameter(Mandatory = $true)]
  [string]$CustomDomain,

  [string]$ApiToken = $env:NETLIFY_AUTH_TOKEN
)

$ErrorActionPreference = "Stop"

if (-not $ApiToken) {
  $configPath = Join-Path $env:APPDATA "Netlify\Config\config.json"
  if (Test-Path $configPath) {
    $config = Get-Content $configPath -Raw | ConvertFrom-Json
    if ($config.userId -and $config.users.$($config.userId).auth.token) {
      $ApiToken = $config.users.$($config.userId).auth.token
    }
  }
}

if (-not $ApiToken) {
  throw "Netlify API token required. Set NETLIFY_AUTH_TOKEN or sign in via Netlify CLI on this machine."
}

$headers = @{
  Authorization = "Bearer $ApiToken"
  "Content-Type" = "application/json"
}

$body = @{
  custom_domain = $CustomDomain
} | ConvertTo-Json

if ($PSCmdlet.ShouldProcess($CustomDomain, "Bind Netlify custom domain to site $SiteId")) {
  try {
    $response = Invoke-RestMethod -Method Patch -Uri "https://api.netlify.com/api/v1/sites/$SiteId" -Headers $headers -Body $body
  }
  catch {
    $message = $_.Exception.Message
    if ($_.ErrorDetails.Message) {
      $message = $_.ErrorDetails.Message
    }

    throw "Netlify custom-domain update failed: $message"
  }

  [pscustomobject]@{
    SiteId       = $response.id
    SiteName     = $response.name
    CustomDomain = $response.custom_domain
    Url          = $response.url
    SslUrl       = $response.ssl_url
  }
}
