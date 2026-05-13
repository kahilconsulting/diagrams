# publish.ps1 — Publish a diagram as a self-contained, date-stamped snapshot
#
# Usage:
#   .\publish.ps1 "Copilot Studio Overview Diagram.html"
#   .\publish.ps1 "Copilot Studio Overview Diagram.html" "Copilot Studio Overview"
#   .\publish.ps1 "Copilot Studio Overview Diagram.html" "Copilot Studio Overview" "Ep. 1"
#
# What it does:
#   - Inlines shared/diagram.css and shared/diagram.js directly into the HTML
#   - Fixes image paths so they resolve from the published/ subfolder
#   - Adds a "Snapshot YYYY-MM-DD" badge in the bottom-centre of the page
#   - Saves to published/<slug>-<date>.html
#   - Adds a card to published/index.html (newest first)

param(
    [Parameter(Mandatory=$true,  Position=0)] [string]$SourceFile,
    [Parameter(Mandatory=$false, Position=1)] [string]$DisplayName = "",
    [Parameter(Mandatory=$false, Position=2)] [string]$Label = ""
)

$ErrorActionPreference = 'Stop'

# ── Paths ──────────────────────────────────────────────────────────────────────
$root         = Split-Path $MyInvocation.MyCommand.Path -Parent
$sourcePath   = Join-Path $root $SourceFile
$publishedDir = Join-Path $root 'published'
$cssPath      = Join-Path $root 'shared\diagram.css'
$jsPath       = Join-Path $root 'shared\diagram.js'
$indexPath    = Join-Path $publishedDir 'index.html'

if (-not (Test-Path $sourcePath)) {
    Write-Error "Source file not found: $SourceFile"
    exit 1
}

# ── Slug + date ────────────────────────────────────────────────────────────────
$baseName   = [IO.Path]::GetFileNameWithoutExtension($SourceFile)
if (-not $DisplayName) { $DisplayName = $baseName }
$slug       = $baseName.ToLower() -replace '[^a-z0-9]+', '-' -replace '^-|-$', ''
$date       = Get-Date -Format 'yyyy-MM-dd'
$outputFile = "$slug-$date.html"
$outputPath = Join-Path $publishedDir $outputFile

# ── Read source files ──────────────────────────────────────────────────────────
$html = [IO.File]::ReadAllText($sourcePath, [Text.Encoding]::UTF8)
$css  = [IO.File]::ReadAllText($cssPath,    [Text.Encoding]::UTF8)
$js   = [IO.File]::ReadAllText($jsPath,     [Text.Encoding]::UTF8)

# Escape $ so .NET regex replace doesn't treat them as group back-references
$cssEscaped = $css -replace '\$', '$$$$'
$jsEscaped  = $js  -replace '\$', '$$$$'

# ── Inline shared CSS ──────────────────────────────────────────────────────────
$html = $html -replace '<link\s+rel="stylesheet"\s+href="shared/diagram\.css">', "<style>`n$cssEscaped`n</style>"

# ── Inline shared JS ───────────────────────────────────────────────────────────
$html = $html -replace '<script\s+src="shared/diagram\.js"></script>', "<script>`n$jsEscaped`n</script>"

# ── Fix image paths (HTML attributes) ─────────────────────────────────────────
$html = $html -replace 'src="shared/images/', 'src="../shared/images/'
$html = $html -replace "src='shared/images/", "src='../shared/images/"
$html = $html -replace 'src="Images/', 'src="../Images/'
$html = $html -replace "src='Images/", "src='../Images/"

# ── Fix image paths inside JS popup data (string literals) ────────────────────
$html = $html -replace "src: 'Images/", "src: '../Images/"
$html = $html -replace 'src: "Images/', 'src: "../Images/'

# ── Snapshot badge ─────────────────────────────────────────────────────────────
$badge = "<div style=`"position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.72);color:#fff;font-family:'Segoe UI',sans-serif;font-size:11px;font-weight:600;padding:5px 14px;border-radius:20px;z-index:9999;pointer-events:none;letter-spacing:0.03em;`">Snapshot $date</div>"
$html = $html -replace '(<body[^>]*>)', "`$1`n$badge"

# ── Write snapshot file ────────────────────────────────────────────────────────
[IO.File]::WriteAllText($outputPath, $html)
Write-Host ""
Write-Host "  Published: published\$outputFile" -ForegroundColor Green

# ── Update published/index.html ────────────────────────────────────────────────
$indexHtml = [IO.File]::ReadAllText($indexPath, [Text.Encoding]::UTF8)

$labelHtml = ''
if ($Label) { $labelHtml = "`n      <div class=`"snap-label`">$Label</div>" }

$cardHtml = @"

    <a class="snap-card" href="$outputFile">
      <div class="snap-name">$DisplayName</div>
      <div class="snap-date">$date</div>$labelHtml
      <div class="snap-arrow">&#8594;</div>
    </a>
"@

$indexHtml = $indexHtml -replace '(<!-- SNAPSHOTS_START -->)', "`$1$cardHtml"
[IO.File]::WriteAllText($indexPath, $indexHtml)
Write-Host "  Index updated: published\index.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Share path: published/$outputFile" -ForegroundColor Yellow
Write-Host ""
