# Sparklio AI Marketing Studio - 통합 테스트 스크립트
# 3-Node 시스템 연결 및 서비스 상태 확인

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Sparklio AI Marketing Studio" -ForegroundColor Cyan
Write-Host "통합 테스트" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Tailscale IP 주소
$DESKTOP_IP = "100.120.180.42"
$LAPTOP_IP = "100.101.68.23"
$MACMINI_IP = "100.123.51.5"

$testResults = @()

# 함수: 테스트 결과 기록
function Test-Service {
    param(
        [string]$Name,
        [string]$IP,
        [int]$Port = 0,
        [string]$Url = "",
        [bool]$IsPing = $false
    )

    Write-Host "Testing: $Name..." -NoNewline

    try {
        if ($IsPing) {
            $result = Test-Connection -ComputerName $IP -Count 1 -Quiet
            if ($result) {
                Write-Host " ✓ OK" -ForegroundColor Green
                return @{ Name = $Name; Status = "OK"; Details = "Ping successful" }
            } else {
                Write-Host " ✗ FAIL" -ForegroundColor Red
                return @{ Name = $Name; Status = "FAIL"; Details = "Ping failed" }
            }
        } elseif ($Url) {
            $response = Invoke-WebRequest -Uri $Url -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Host " ✓ OK" -ForegroundColor Green
                return @{ Name = $Name; Status = "OK"; Details = "HTTP 200 OK" }
            } else {
                Write-Host " ✗ FAIL" -ForegroundColor Red
                return @{ Name = $Name; Status = "FAIL"; Details = "HTTP $($response.StatusCode)" }
            }
        } elseif ($Port -gt 0) {
            $tcpClient = New-Object System.Net.Sockets.TcpClient
            $tcpClient.Connect($IP, $Port)
            $tcpClient.Close()
            Write-Host " ✓ OK" -ForegroundColor Green
            return @{ Name = $Name; Status = "OK"; Details = "Port $Port open" }
        }
    } catch {
        Write-Host " ✗ FAIL" -ForegroundColor Red
        return @{ Name = $Name; Status = "FAIL"; Details = $_.Exception.Message }
    }
}

Write-Host "1. Tailscale Network Test" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────" -ForegroundColor DarkGray
$testResults += Test-Service -Name "Desktop (Self)" -IP $DESKTOP_IP -IsPing $true
$testResults += Test-Service -Name "Laptop" -IP $LAPTOP_IP -IsPing $true
$testResults += Test-Service -Name "Mac mini" -IP $MACMINI_IP -IsPing $true
Write-Host ""

Write-Host "2. Desktop GPU Worker Services" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────" -ForegroundColor DarkGray
$testResults += Test-Service -Name "Ollama API" -Url "http://$DESKTOP_IP:11434/api/tags"
$testResults += Test-Service -Name "ComfyUI" -IP $DESKTOP_IP -Port 8188
Write-Host ""

Write-Host "3. Mac mini Backend Services" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────" -ForegroundColor DarkGray
$testResults += Test-Service -Name "PostgreSQL" -IP $MACMINI_IP -Port 5432
$testResults += Test-Service -Name "Redis" -IP $MACMINI_IP -Port 6379
$testResults += Test-Service -Name "MinIO API" -IP $MACMINI_IP -Port 9000
$testResults += Test-Service -Name "MinIO Console" -IP $MACMINI_IP -Port 9001
# FastAPI는 수동으로 시작해야 하므로 선택적 테스트
Write-Host "Testing: FastAPI (optional)..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://$MACMINI_IP:8000/health" -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host " ✓ OK" -ForegroundColor Green
        $testResults += @{ Name = "FastAPI"; Status = "OK"; Details = "HTTP 200 OK" }
    }
} catch {
    Write-Host " ⚠ Not Running" -ForegroundColor Yellow
    $testResults += @{ Name = "FastAPI"; Status = "SKIP"; Details = "Not started (manual start required)" }
}
Write-Host ""

Write-Host "4. Ollama Model Test" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────" -ForegroundColor DarkGray
try {
    $models = Invoke-RestMethod -Uri "http://$DESKTOP_IP:11434/api/tags"
    Write-Host "Available Models:" -ForegroundColor Cyan
    foreach ($model in $models.models) {
        $sizeGB = [math]::Round($model.size / 1GB, 2)
        Write-Host "  - $($model.name) ($sizeGB GB)" -ForegroundColor White
    }
    $testResults += @{ Name = "Ollama Models"; Status = "OK"; Details = "$($models.models.Count) models available" }
} catch {
    Write-Host "  ✗ Failed to retrieve models" -ForegroundColor Red
    $testResults += @{ Name = "Ollama Models"; Status = "FAIL"; Details = $_.Exception.Message }
}
Write-Host ""

# 결과 요약
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$okCount = ($testResults | Where-Object { $_.Status -eq "OK" }).Count
$failCount = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$skipCount = ($testResults | Where-Object { $_.Status -eq "SKIP" }).Count
$totalCount = $testResults.Count

Write-Host "Total Tests: $totalCount" -ForegroundColor White
Write-Host "  ✓ Passed: $okCount" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "  ✗ Failed: $failCount" -ForegroundColor Red
}
if ($skipCount -gt 0) {
    Write-Host "  ⚠ Skipped: $skipCount" -ForegroundColor Yellow
}
Write-Host ""

# 실패한 테스트 상세 정보
if ($failCount -gt 0) {
    Write-Host "Failed Tests Details:" -ForegroundColor Red
    foreach ($result in $testResults | Where-Object { $_.Status -eq "FAIL" }) {
        Write-Host "  ✗ $($result.Name): $($result.Details)" -ForegroundColor Red
    }
    Write-Host ""
}

# 다음 단계 안내
if ($failCount -eq 0 -and $skipCount -eq 0) {
    Write-Host "✓ All systems operational!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Start FastAPI backend on Mac mini:" -ForegroundColor White
    Write-Host "   ssh woosun@$MACMINI_IP" -ForegroundColor DarkGray
    Write-Host "   cd ~/sparklio_ai_marketing_studio/backend" -ForegroundColor DarkGray
    Write-Host "   source .venv/bin/activate" -ForegroundColor DarkGray
    Write-Host "   python app/main.py" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "2. Setup frontend on Laptop (when K: drive connected):" -ForegroundColor White
    Write-Host "   See: K:\sparklio_ai_marketing_studio\setup\laptop\SETUP_GUIDE.md" -ForegroundColor DarkGray
} else {
    Write-Host "⚠ Some tests failed. Please check the failed services." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
