$env = $args[0]
$base_command = 'npx webpack ./src/app.js --output-filename bundle.js -o ./src'

if ($env -eq "DEV") {
    $full_command = "$($base_command) --mode=development --config webpack.dev.config.js --watch"
}
elseif ($env -eq "PROD"){
    $full_command = "$($base_command) --mode=production --config webpack.prod.config.js"
}
else {
    Write-Host 'Specify "DEV" or "PROD" as first command line arg.'
    exit 1
}

Invoke-Expression $full_command