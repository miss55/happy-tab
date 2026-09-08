# Generates HappyTab package icons and store listing images with GDI+.
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

function New-RoundedRectPath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = [Math]::Min($Radius * 2, [Math]::Min($Width, $Height))
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function Draw-HappyTabMark {
  param(
    [System.Drawing.Graphics]$Graphics,
    [int]$Size
  )

  $blue = [System.Drawing.Color]::FromArgb(255, 37, 99, 235)
  $blueDark = [System.Drawing.Color]::FromArgb(255, 29, 78, 216)
  $white = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)

  $Graphics.Clear([System.Drawing.Color]::Transparent)
  $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  $inset = [Math]::Max(1, [Math]::Floor($Size * 0.06))
  $radius = [Math]::Max(3, [Math]::Floor($Size * 0.22))
  $bgPath = New-RoundedRectPath -X $inset -Y $inset -Width ($Size - 2 * $inset) -Height ($Size - 2 * $inset) -Radius $radius
  $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.RectangleF $inset, $inset, ($Size - 2 * $inset), ($Size - 2 * $inset)),
    $blue,
    $blueDark,
    90
  )
  $Graphics.FillPath($bgBrush, $bgPath)

  $cardInset = [Math]::Floor($Size * 0.26)
  $cardWidth = $Size - (2 * $cardInset)
  $cardHeight = [Math]::Floor($cardWidth * 1.12)
  $cardX = $cardInset
  $cardY = [Math]::Floor(($Size - $cardHeight) / 2) + [Math]::Floor($Size * 0.04)
  $cardRadius = [Math]::Max(2, [Math]::Floor($Size * 0.08))
  $cardPath = New-RoundedRectPath -X $cardX -Y $cardY -Width $cardWidth -Height $cardHeight -Radius $cardRadius
  $cardBrush = New-Object System.Drawing.SolidBrush $white
  $Graphics.FillPath($cardBrush, $cardPath)

  $tabHeight = [Math]::Max(3, [Math]::Floor($Size * 0.12))
  $tabWidth = [Math]::Floor($cardWidth * 0.58)
  $tabPath = New-RoundedRectPath -X $cardX -Y ($cardY - [Math]::Floor($tabHeight * 0.45)) -Width $tabWidth -Height ($tabHeight + [Math]::Floor($Size * 0.04)) -Radius ([Math]::Max(1, [Math]::Floor($Size * 0.04)))
  $Graphics.FillPath($cardBrush, $tabPath)

  if ($Size -ge 32) {
    $lineBrush = New-Object System.Drawing.SolidBrush $blue
    $lineHeight = [Math]::Max(2, [Math]::Floor($Size * 0.045))
    $lineX = $cardX + [Math]::Floor($cardWidth * 0.16)
    $lineWidth = [Math]::Floor($cardWidth * 0.68)
    $lineY = $cardY + [Math]::Floor($cardHeight * 0.42)
    $Graphics.FillRectangle($lineBrush, $lineX, $lineY, $lineWidth, $lineHeight)
    $Graphics.FillRectangle($lineBrush, $lineX, ($lineY + [Math]::Floor($Size * 0.1)), [Math]::Floor($lineWidth * 0.62), $lineHeight)
    $lineBrush.Dispose()
  }

  $bgBrush.Dispose()
  $cardBrush.Dispose()
  $bgPath.Dispose()
  $cardPath.Dispose()
  $tabPath.Dispose()
}

function Save-Icon {
  param(
    [int]$Size,
    [string]$Path
  )

  $bitmap = New-Object System.Drawing.Bitmap $Size, $Size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  Draw-HappyTabMark -Graphics $graphics -Size $Size
  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

function Save-PromoTile {
  param(
    [int]$Width,
    [int]$Height,
    [string]$Path,
    [string]$Title,
    [string]$Subtitle
  )

  $blue = [System.Drawing.Color]::FromArgb(255, 37, 99, 235)
  $blueDark = [System.Drawing.Color]::FromArgb(255, 29, 78, 216)
  $white = [System.Drawing.Color]::White
  $muted = [System.Drawing.Color]::FromArgb(220, 255, 255, 255)

  $bitmap = New-Object System.Drawing.Bitmap $Width, $Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

  $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Rectangle 0, 0, $Width, $Height),
    $blue,
    $blueDark,
    15
  )
  $graphics.FillRectangle($bgBrush, 0, 0, $Width, $Height)

  $iconSize = [Math]::Min(128, [Math]::Floor($Height * 0.42))
  $iconX = [Math]::Floor($Width * 0.08)
  $iconY = [Math]::Floor(($Height - $iconSize) / 2)
  $iconBitmap = New-Object System.Drawing.Bitmap $iconSize, $iconSize, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $iconGraphics = [System.Drawing.Graphics]::FromImage($iconBitmap)
  Draw-HappyTabMark -Graphics $iconGraphics -Size $iconSize
  $graphics.DrawImage($iconBitmap, $iconX, $iconY, $iconSize, $iconSize)

  $titleFontSize = [Math]::Max(22, [Math]::Floor($Height * 0.16))
  $subtitleFontSize = [Math]::Max(11, [Math]::Floor($Height * 0.065))
  $titleFont = New-Object System.Drawing.Font "Segoe UI Semibold", $titleFontSize, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
  $subtitleFont = New-Object System.Drawing.Font "Segoe UI", $subtitleFontSize, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
  $titleBrush = New-Object System.Drawing.SolidBrush $white
  $subtitleBrush = New-Object System.Drawing.SolidBrush $muted

  $textX = $iconX + $iconSize + [Math]::Floor($Width * 0.05)
  $textY = [Math]::Floor($Height * 0.32)
  $graphics.DrawString($Title, $titleFont, $titleBrush, $textX, $textY)
  $graphics.DrawString($Subtitle, $subtitleFont, $subtitleBrush, $textX, ($textY + $titleFontSize + 10))

  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)

  $graphics.Dispose()
  $bitmap.Dispose()
  $iconGraphics.Dispose()
  $iconBitmap.Dispose()
  $bgBrush.Dispose()
  $titleFont.Dispose()
  $subtitleFont.Dispose()
  $titleBrush.Dispose()
  $subtitleBrush.Dispose()
}

$root = Split-Path -Parent $PSScriptRoot
$iconDir = Join-Path $root "apps\extension\public\icons"
$storeDir = Join-Path $root "store-assets"
New-Item -ItemType Directory -Force -Path $iconDir, $storeDir | Out-Null

Save-Icon -Size 16 -Path (Join-Path $iconDir "icon16.png")
Save-Icon -Size 32 -Path (Join-Path $iconDir "icon32.png")
Save-Icon -Size 48 -Path (Join-Path $iconDir "icon48.png")
Save-Icon -Size 128 -Path (Join-Path $iconDir "icon128.png")
Save-Icon -Size 300 -Path (Join-Path $storeDir "logo-300.png")
Save-PromoTile -Width 440 -Height 280 -Path (Join-Path $storeDir "small-promo-440x280.png") -Title "HappyTab" -Subtitle "Local-first new tab workspace"
Save-PromoTile -Width 1400 -Height 560 -Path (Join-Path $storeDir "large-promo-1400x560.png") -Title "HappyTab" -Subtitle "Bookmarks, open tabs, and todos — on your device"

Write-Output "Wrote icons to $iconDir and store assets to $storeDir"
