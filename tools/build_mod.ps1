<#
.SYNOPSIS
    Build and pack the Deadlock Item Roulette Mod into pak85_dir.vpk.
.DESCRIPTION
    Packs the 'game/citadel' directory into a VPK file and optionally installs
    it into the Deadlock addons folder.
.PARAMETER Install
    If specified, copies the generated VPK into your Deadlock addons directory.
.PARAMETER DeadlockPath
    Optional explicit path to Deadlock's 'game/citadel' directory.
#>
param(
    [switch]$Install,
    [string]$DeadlockPath = ""
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$modRootDir = Split-Path -Parent $scriptDir
$sourceCitadelDir = Join-Path $modRootDir "game\citadel"
$builderScript = Join-Path $scriptDir "build_working_release.py"
$outputVpk = Join-Path $modRootDir "pak01_dir.vpk"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Building Deadlock Item Roulette Mod      " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

Write-Host "[1/2] Building and packing release VPK (pak01_dir.vpk)..." -ForegroundColor Yellow
$pyCmd = "python"
& $pyCmd $builderScript

if (-not (Test-Path -LiteralPath $outputVpk)) {
    throw "VPK build failed: $outputVpk not found!"
}

$vpkSize = (Get-Item $outputVpk).Length
Write-Host "[✓] Built $outputVpk ($([Math]::Round($vpkSize / 1KB, 2)) KB)" -ForegroundColor Green

if ($Install) {
    Write-Host "[2/2] Installing to Deadlock addons folder..." -ForegroundColor Yellow
    
    $targetAddonsDir = ""
    if ($DeadlockPath -and (Test-Path -LiteralPath $DeadlockPath)) {
        $targetAddonsDir = Join-Path $DeadlockPath "addons"
    } else {
        # Search common Steam library locations
        $candidates = @(
            "C:\Program Files (x86)\Steam\steamapps\common\Deadlock\game\citadel\addons",
            "D:\SteamLibrary\steamapps\common\Deadlock\game\citadel\addons",
            "E:\SteamLibrary\steamapps\common\Deadlock\game\citadel\addons",
            "F:\SteamLibrary\steamapps\common\Deadlock\game\citadel\addons",
            "G:\SteamLibrary\steamapps\common\Deadlock\game\citadel\addons"
        )
        foreach ($c in $candidates) {
            $parent = Split-Path -Parent $c
            if (Test-Path -LiteralPath $parent) {
                $targetAddonsDir = $c
                break
            }
        }
    }

    if ($targetAddonsDir) {
        if (-not (Test-Path -LiteralPath $targetAddonsDir)) {
            New-Item -ItemType Directory -Path $targetAddonsDir -Force | Out-Null
        }
        $destFile = Join-Path $targetAddonsDir "pak85_dir.vpk"
        Copy-Item -Path $outputVpk -Destination $destFile -Force
        Write-Host "[✓] Installed successfully to: $destFile" -ForegroundColor Green
    } else {
        Write-Warning "Could not automatically locate Deadlock installation. Copy '$outputVpk' manually to your 'game/citadel/addons/' folder."
    }
} else {
    Write-Host "[i] To install to Deadlock, run: .\build_mod.ps1 -Install" -ForegroundColor DarkCyan
}

Write-Host "Done!" -ForegroundColor Green
