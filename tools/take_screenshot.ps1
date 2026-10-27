param(
    [string]$Url,
    [string]$OutputFile,
    [int]$Width = 390,
    [int]$Height = 844
)

$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$tempProfile = Join-Path $env:TEMP "chrome_headless_screenshot_$(Get-Random)"
New-Item -ItemType Directory -Path $tempProfile -Force | Out-Null

# Use 8.3 short path or temp file without spaces for Chrome argument
$tempPng = Join-Path $env:TEMP "screenshot_$(Get-Random).png"

$argList = @(
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-sync",
    "--virtual-time-budget=5000",
    "--user-data-dir=$tempProfile",
    "--window-size=$Width,$Height",
    "--screenshot=$tempPng",
    $Url
)

$stdoutLog = Join-Path $env:TEMP "chrome_stdout.log"
$stderrLog = Join-Path $env:TEMP "chrome_stderr.log"

Write-Host "Running Chrome headless screenshot of $Url..."
$proc = Start-Process -FilePath $chrome -ArgumentList $argList -PassThru -Wait -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog

Start-Sleep -Milliseconds 800
Remove-Item -Path $tempProfile -Recurse -Force -ErrorAction SilentlyContinue

if (Test-Path $tempPng) {
    # Ensure destination directory exists
    $outDir = Split-Path -Path $OutputFile -Parent
    if ($outDir -and -not (Test-Path $outDir)) {
        New-Item -ItemType Directory -Path $outDir -Force | Out-Null
    }
    Copy-Item -Path $tempPng -Destination $OutputFile -Force
    Remove-Item -Path $tempPng -Force -ErrorAction SilentlyContinue
    Write-Host "SUCCESS: Screenshot saved to $OutputFile"
} else {
    Write-Host "--- STDERR ---"
    Get-Content $stderrLog -ErrorAction SilentlyContinue
    Write-Host "FAILED: Output file was not created"
}
