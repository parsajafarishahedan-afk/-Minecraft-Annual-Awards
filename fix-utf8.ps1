cd C:\Users\Parsa.JAFARI\Desktop\minecraft-awards\public

Get-ChildItem *.html | ForEach-Object {
    $path = $_.FullName
    $content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($path, $content, $utf8NoBom)
    Write-Host "[OK] $($_.Name) -> UTF-8 (no BOM)"
}