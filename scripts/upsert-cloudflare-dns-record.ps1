[CmdletBinding(SupportsShouldProcess = $true)]
param(
  [Parameter(Mandatory = $true)]
  [string]$ZoneName,

  [Parameter(Mandatory = $true)]
  [string]$RecordName,

  [Parameter(Mandatory = $true)]
  [string]$Content,

  [ValidateSet("A", "AAAA", "CNAME", "TXT", "MX", "CAA")]
  [string]$Type = "CNAME",

  [int]$Ttl = 120,

  [bool]$Proxied = $false,

  [string]$ApiToken = $env:CLOUDFLARE_API_TOKEN,

  [string]$AuthEmail = $env:CLOUDFLARE_API_EMAIL,

  [string]$GlobalApiKey = $env:CLOUDFLARE_GLOBAL_API_KEY,

  [string]$CredentialsFile = (Join-Path $env:USERPROFILE ".cloudflare\codex-cloudflare-credentials.json")
)

$ErrorActionPreference = "Stop"

if ((-not $ApiToken -or -not $AuthEmail -or -not $GlobalApiKey) -and (Test-Path $CredentialsFile)) {
  $storedCredentials = Get-Content $CredentialsFile -Raw | ConvertFrom-Json

  if (-not $ApiToken -and $storedCredentials.apiToken) {
    $ApiToken = $storedCredentials.apiToken
  }

  if (-not $AuthEmail -and $storedCredentials.email) {
    $AuthEmail = $storedCredentials.email
  }

  if (-not $GlobalApiKey -and $storedCredentials.globalApiKey) {
    $GlobalApiKey = $storedCredentials.globalApiKey
  }
}

if (-not $ApiToken -and (-not $AuthEmail -or -not $GlobalApiKey)) {
  throw "Cloudflare auth required. Provide CLOUDFLARE_API_TOKEN or both CLOUDFLARE_API_EMAIL and CLOUDFLARE_GLOBAL_API_KEY, or save them in $CredentialsFile."
}

function Invoke-CloudflareJson {
  param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("GET", "POST", "PUT")]
    [string]$Method,

    [Parameter(Mandatory = $true)]
    [string]$Uri,

    [object]$Body
  )

  $headers = @{
    "Content-Type" = "application/json"
  }

  if ($ApiToken) {
    $headers.Authorization = "Bearer $ApiToken"
  }
  else {
    $headers["X-Auth-Email"] = $AuthEmail
    $headers["X-Auth-Key"] = $GlobalApiKey
  }

  $request = @{
    Method  = $Method
    Uri     = $Uri
    Headers = $headers
  }

  if ($null -ne $Body) {
    $request.Body = ($Body | ConvertTo-Json -Depth 8)
  }

  $response = Invoke-RestMethod @request
  if (-not $response.success) {
    $errors = ($response.errors | ForEach-Object { "$($_.code): $($_.message)" }) -join "; "
    throw "Cloudflare API request failed: $errors"
  }

  return $response
}

function Get-FullRecordName {
  param(
    [string]$Zone,
    [string]$Name
  )

  if ($Name -eq "@") {
    return $Zone
  }

  if ($Name.EndsWith(".$Zone")) {
    return $Name
  }

  return "$Name.$Zone"
}

$fullRecordName = Get-FullRecordName -Zone $ZoneName -Name $RecordName

$zoneResponse = Invoke-CloudflareJson -Method GET -Uri "https://api.cloudflare.com/client/v4/zones?name=$([uri]::EscapeDataString($ZoneName))&status=active"
if (-not $zoneResponse.result -or $zoneResponse.result.Count -lt 1) {
  throw "Active Cloudflare zone '$ZoneName' not found."
}

$zone = $zoneResponse.result[0]
$zoneId = $zone.id

$existingResponse = Invoke-CloudflareJson -Method GET -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records?type=$Type&name=$([uri]::EscapeDataString($fullRecordName))"
$existing = $existingResponse.result | Select-Object -First 1

$payload = @{
  type    = $Type
  name    = $fullRecordName
  content = $Content
  ttl     = $Ttl
}

if ($Type -in @("A", "AAAA", "CNAME")) {
  $payload.proxied = $Proxied
}

if ($existing) {
  if ($PSCmdlet.ShouldProcess($fullRecordName, "Update Cloudflare DNS record")) {
    $updateResponse = Invoke-CloudflareJson -Method PUT -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records/$($existing.id)" -Body $payload
    [pscustomobject]@{
      Action   = "updated"
      ZoneId   = $zoneId
      RecordId = $updateResponse.result.id
      Name     = $updateResponse.result.name
      Type     = $updateResponse.result.type
      Content  = $updateResponse.result.content
      Proxied  = $updateResponse.result.proxied
      Ttl      = $updateResponse.result.ttl
    }
  }

  return
}

if ($PSCmdlet.ShouldProcess($fullRecordName, "Create Cloudflare DNS record")) {
  $createResponse = Invoke-CloudflareJson -Method POST -Uri "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records" -Body $payload
  [pscustomobject]@{
    Action   = "created"
    ZoneId   = $zoneId
    RecordId = $createResponse.result.id
    Name     = $createResponse.result.name
    Type     = $createResponse.result.type
    Content  = $createResponse.result.content
    Proxied  = $createResponse.result.proxied
    Ttl      = $createResponse.result.ttl
  }
}
