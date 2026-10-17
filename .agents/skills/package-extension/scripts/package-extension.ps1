$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# Resolve from the skill location, so invocation does not depend on the caller's cwd.
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '../../../..')).Path
$dist = Join-Path $repoRoot 'apps/extension/dist'
$outputDir = Join-Path $repoRoot 'dist/store'
$zipPath = $null
$complete = $false

function Get-StreamHash($Stream) {
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try { return [BitConverter]::ToString($sha.ComputeHash($Stream)).Replace('-', '') }
    finally { $sha.Dispose() }
}

Push-Location $repoRoot
try {
    if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
        throw 'pnpm is required. Use the pnpm version declared in package.json.'
    }
    foreach ($task in @('check:manifest', 'test', 'build:extension')) {
        & pnpm $task
        if ($LASTEXITCODE -ne 0) { throw "pnpm $task failed (exit $LASTEXITCODE). No ZIP produced." }
    }

    $manifestPath = Join-Path $dist 'manifest.json'
    $manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $sourceManifest = Get-Content -LiteralPath 'apps/extension/public/manifest.json' -Raw -Encoding UTF8 | ConvertFrom-Json
    $package = Get-Content -LiteralPath 'apps/extension/package.json' -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($manifest.version -ne $package.version -or $manifest.version -ne $sourceManifest.version) {
        throw "Version mismatch: dist=$($manifest.version), source=$($sourceManifest.version), package=$($package.version)."
    }
    if ($manifest.manifest_version -ne 3 -or $manifest.chrome_url_overrides.newtab -ne 'index.html') {
        throw 'Built manifest must be MV3 with index.html as the new tab entry.'
    }
    if ($manifest.version -notmatch '^\d+(\.\d+){0,3}$') { throw 'Invalid extension version.' }
    $required = @('manifest.json', $manifest.chrome_url_overrides.newtab, $manifest.background.service_worker)
    $required += @($manifest.icons.PSObject.Properties | ForEach-Object { $_.Value })
    $required += @(Get-ChildItem -LiteralPath 'apps/extension/public/_locales' -Directory | ForEach-Object { "_locales/$($_.Name)/messages.json" })
    foreach ($relative in $required) {
        if (-not (Test-Path -LiteralPath (Join-Path $dist $relative) -PathType Leaf)) {
            throw "Missing built resource: $relative"
        }
    }

    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $files = @(Get-ChildItem -LiteralPath $dist -Recurse -File -Force | Sort-Object FullName)
    $expected = @{}
    foreach ($file in $files) {
        $relative = $file.FullName.Substring($dist.Length + 1).Replace('\', '/')
        if ($relative -match '(^|/)(\.env[^/]*|\.git|node_modules)(/|$)|\.(pem|crx|zip|map)$') {
            throw "Unexpected file in build output: $relative"
        }
        $expected[$relative] = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
    }
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    $stamp = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ')
    $suffix = [Guid]::NewGuid().ToString('N').Substring(0, 8)
    $zipPath = Join-Path $outputDir "tabvia-$($manifest.version)-$stamp-$suffix.zip"
    $archive = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
    try {
        foreach ($file in $files) {
            $relative = $file.FullName.Substring($dist.Length + 1).Replace('\', '/')
            [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $file.FullName, $relative, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
        }
    } finally { $archive.Dispose() }

    $archive = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
    try {
        if ($archive.Entries.Count -ne $expected.Count -or $null -eq $archive.GetEntry('manifest.json')) {
            throw 'ZIP file list or root manifest is invalid.'
        }
        $seen = @{}
        foreach ($entry in $archive.Entries) {
            if (-not $expected.ContainsKey($entry.FullName) -or $seen.ContainsKey($entry.FullName)) {
                throw "Unexpected or duplicate ZIP entry: $($entry.FullName)"
            }
            $seen[$entry.FullName] = $true
            $stream = $entry.Open()
            try { $hash = Get-StreamHash $stream } finally { $stream.Dispose() }
            if ($hash -ne $expected[$entry.FullName]) { throw "ZIP content mismatch: $($entry.FullName)" }
        }
    } finally { $archive.Dispose() }
    $complete = $true
    Write-Output "ZIP: $zipPath"
    Write-Output "Version: $($manifest.version)"
    Write-Output "Files: $($files.Count)"
    Write-Output "Bytes: $((Get-Item -LiteralPath $zipPath).Length)"
    Write-Output "SHA256: $((Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash)"
} finally {
    if (-not $complete -and $zipPath -and (Test-Path -LiteralPath $zipPath)) {
        # Only remove the unique incomplete ZIP created by this invocation.
        Remove-Item -LiteralPath $zipPath
    }
    Pop-Location
}
