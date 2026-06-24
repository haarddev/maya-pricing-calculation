# Run all dev services from the project root (backend, frontend, Prisma Studio).
Set-Location $PSScriptRoot

if (-not (Test-Path "node_modules\concurrently")) {
    Write-Host "Installing root dev dependencies..."
    npm install
}

npm run dev
