param([Parameter(Mandatory=$true)][string]$Link, [Parameter(Mandatory=$true)][string]$Target)
$ErrorActionPreference = 'Stop'
if (Test-Path -LiteralPath $Link) { throw 'Link path already exists' }
New-Item -ItemType Junction -Path $Link -Target $Target | Out-Null
