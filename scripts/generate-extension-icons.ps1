# Derives package icons from store-assets/logo-300.png.
# Does not overwrite custom store promo images.
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

function Remove-NearWhiteBorder {
  param(
    [System.Drawing.Bitmap]$Bitmap,
    [int]$Threshold = 248
  )

  $width = $Bitmap.Width
  $height = $Bitmap.Height
  $stack = New-Object "System.Collections.Generic.Stack[int[]]"
  $visited = New-Object "bool[,]" $width, $height

  foreach ($start in @(
      @(0, 0),
      @(($width - 1), 0),
      @(0, ($height - 1)),
      @(($width - 1), ($height - 1))
    )) {
    $stack.Push($start)
  }

  while ($stack.Count -gt 0) {
    $point = $stack.Pop()
    $x = $point[0]
    $y = $point[1]
    if ($x -lt 0 -or $y -lt 0 -or $x -ge $width -or $y -ge $height -or $visited[$x, $y]) {
      continue
    }

    $visited[$x, $y] = $true
    $color = $Bitmap.GetPixel($x, $y)
    if ($color.R -lt $Threshold -or $color.G -lt $Threshold -or $color.B -lt $Threshold) {
      continue
    }

    $Bitmap.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
    $stack.Push(@(($x + 1), $y))
    $stack.Push(@(($x - 1), $y))
    $stack.Push(@($x, ($y + 1)))
    $stack.Push(@($x, ($y - 1)))
  }
}

function Save-ResizedIcon {
  param(
    [System.Drawing.Image]$Source,
    [int]$Size,
    [string]$Path
  )

  $bitmap = New-Object System.Drawing.Bitmap $Size, $Size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.DrawImage($Source, 0, 0, $Size, $Size)
  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

$root = Split-Path -Parent $PSScriptRoot
$logoPath = Join-Path $root "store-assets\logo-300.png"
$iconDir = Join-Path $root "apps\extension\public\icons"

if (-not (Test-Path -LiteralPath $logoPath)) {
  throw "Missing brand source: $logoPath"
}

New-Item -ItemType Directory -Force -Path $iconDir | Out-Null

$loaded = [System.Drawing.Image]::FromFile($logoPath)
$source = New-Object System.Drawing.Bitmap $loaded.Width, $loaded.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$copyGraphics = [System.Drawing.Graphics]::FromImage($source)
$copyGraphics.DrawImage($loaded, 0, 0, $loaded.Width, $loaded.Height)
$copyGraphics.Dispose()
$loaded.Dispose()

Remove-NearWhiteBorder -Bitmap $source

Save-ResizedIcon -Source $source -Size 16 -Path (Join-Path $iconDir "icon16.png")
Save-ResizedIcon -Source $source -Size 32 -Path (Join-Path $iconDir "icon32.png")
Save-ResizedIcon -Source $source -Size 48 -Path (Join-Path $iconDir "icon48.png")
Save-ResizedIcon -Source $source -Size 128 -Path (Join-Path $iconDir "icon128.png")

$source.Dispose()

Write-Output "Wrote icons to $iconDir from $logoPath"
