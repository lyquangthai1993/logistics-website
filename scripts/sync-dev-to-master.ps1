# PowerShell Script: Auto-sync dev to master for logistics-website
# Scheduled to run at 12:00 PM with Multi-tier Fallback & Backup Mechanisms

$ErrorActionPreference = "Stop"
$projectDir = "D:\Projects\logistics-website"
$logFile = "$projectDir\scripts\sync-dev-to-master.log"
$errorFile = "$projectDir\scripts\sync-dev-to-master-error.txt"

function Log($msg) {
    $time = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$time] $msg"
    Write-Output $line
    Add-Content -Path $logFile -Value $line -Encoding UTF8
}

function Show-Notification($title, $message, $iconType = "Info") {
    try {
        Add-Type -AssemblyName System.Windows.Forms -ErrorAction SilentlyContinue
        $notification = New-Object System.Windows.Forms.NotifyIcon
        $notification.Icon = [System.Drawing.SystemIcons]::Information
        $notification.Visible = $true
        $toolTipIcon = [System.Windows.Forms.ToolTipIcon]::$iconType
        $notification.ShowBalloonTip(10000, $title, $message, $toolTipIcon)
        Start-Sleep -Seconds 2
        $notification.Dispose()
    } catch {
        # Không chặn tiến trình nếu môi trường không có UI tương tác
    }
}

function Invoke-GitWithRetry([scriptblock]$commandBlock, [string]$actionName, [int]$maxRetries = 3, [int]$delaySec = 8) {
    $attempt = 1
    while ($attempt -le $maxRetries) {
        try {
            Log "[$actionName] Lần thử $attempt/$maxRetries..."
            $result = & $commandBlock
            return $result
        } catch {
            Log "⚠️ [$actionName] Thất bại lần $attempt: $($_.Exception.Message)"
            if ($attempt -lt $maxRetries) {
                Log "Chờ $delaySec giây trước khi thử lại..."
                Start-Sleep -Seconds $delaySec
            } else {
                throw $_
            }
        }
        $attempt++
    }
}

Log "=================================================="
Log "BẮT ĐẦU TIẾN TRÌNH ĐỒNG BỘ DEV LÊN MASTER (VỚI DỰ PHÒNG BACKUP)"
Log "=================================================="

if (-not (Test-Path $projectDir)) {
    $err = "Không tìm thấy thư mục dự án: $projectDir"
    Log "LỖI NGHIÊM TRỌNG: $err"
    Set-Content -Path $errorFile -Value $err -Encoding UTF8
    Show-Notification "Git Sync Thất bại" $err "Error"
    exit 1
}

Set-Location $projectDir

$hasStash = $false
$backupBranchesCreated = $false

try {
    # 1. Kiểm tra trạng thái git working tree
    $status = git status --porcelain
    if ($status) {
        Log "Phát hiện thay đổi chưa commit, tự động cất vào git stash an toàn..."
        git stash push -u -m "auto-sync-pre-stash-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        $hasStash = $true
    }

    # 2. Tạo nhánh sao lưu cục bộ (Local Snapshot Backup) trước khi đụng vào code
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    try {
        git branch -f "backup/dev-pre-sync-$timestamp" dev 2>$null
        git branch -f "backup/master-pre-sync-$timestamp" master 2>$null
        $backupBranchesCreated = $true
        Log "✅ Đã tạo nhánh sao lưu dự phòng an toàn: backup/dev-pre-sync-$timestamp & backup/master-pre-sync-$timestamp"
    } catch {
        Log "Cảnh báo tạo nhánh backup: $_ (vẫn tiếp tục tiến trình)"
    }

    # 3. Chuyển sang branch dev và kéo commit mới nhất về với cơ chế Retry
    Log "Chuyển sang branch dev..."
    git checkout dev

    Invoke-GitWithRetry -actionName "Git Pull Dev" -commandBlock {
        $out = git pull origin dev 2>&1
        if ($LASTEXITCODE -ne 0) { throw "Git pull origin dev thất bại: $out" }
        Log "Pull dev thành công: $out"
    }

    # 4. Cập nhật các submodules nếu có
    Log "Cập nhật submodule recursive..."
    git submodule update --init --recursive

    # 5. Chuyển sang master và kéo origin master mới nhất về với cơ chế Retry
    Log "Chuyển sang branch master..."
    git checkout master

    Invoke-GitWithRetry -actionName "Git Pull Master" -commandBlock {
        $out = git pull origin master 2>&1
        if ($LASTEXITCODE -ne 0) { throw "Git pull origin master thất bại: $out" }
        Log "Pull master thành công: $out"
    }

    # 6. Kiểm tra xem có commit mới nào từ dev chưa vào master không
    $diffCommits = git log --oneline master..dev
    if (-not $diffCommits) {
        Log "ℹ️ Nhánh master hiện tại đã khớp hoàn toàn với dev, không có commit mới cần merge."
    } else {
        Log "Các commit từ dev chuẩn bị được merge vào master:`n$diffCommits"

        # 7. Merge dev vào master
        Log "Tiến hành merge dev vào master..."
        $mergeOutput = git merge dev -m "merge: auto-sync dev to master at 12:00 ($timestamp)" 2>&1
        Log "Kết quả merge: $mergeOutput"

        # Kiểm tra conflict
        $conflictStatus = git status --porcelain
        if ($conflictStatus -match "^UU|^AA|^DD|unmerged") {
            Log "❌ PHÁT HIỆN CONFLICT! Kích hoạt cơ chế Rollback hủy merge để bảo toàn hệ thống..."
            git merge --abort
            $conflictErr = "Merge dev vào master gặp xung đột (conflict). Đã an toàn abort merge và giữ nguyên trạng thái gốc."
            Set-Content -Path $errorFile -Value "$conflictErr`nChi tiết files:`n$conflictStatus" -Encoding UTF8
            Show-Notification "Git Sync Conflict!" "Có xung đột khi merge dev vào master. Đã hủy merge an toàn, vui lòng kiểm tra file log!" "Warning"
            git checkout dev
            if ($hasStash) { git stash pop }
            exit 1
        }
    }

    # 8. Push master lên remote origin với Retry 3 lần
    Invoke-GitWithRetry -actionName "Git Push Master" -commandBlock {
        $pushOut = git push origin master 2>&1
        if ($LASTEXITCODE -ne 0) { throw "Git push origin master thất bại: $pushOut" }
        Log "Push master thành công: $pushOut"
    }

    # 9. Dọn dẹp & chuyển nhánh trở lại dev
    Log "Chuyển lại về nhánh dev..."
    git checkout dev

    if ($hasStash) {
        Log "Khôi phục lại git stash..."
        try { git stash pop } catch { Log "Lưu ý pop stash: $_" }
    }

    # Xóa file báo lỗi cũ nếu có
    if (Test-Path $errorFile) { Remove-Item $errorFile -Force }

    Log "=================================================="
    Log "🎉 ĐỒNG BỘ HOÀN TẤT THÀNH CÔNG RỰC RỠ!"
    Log "=================================================="
    Show-Notification "Git Sync Thành công" "Dự án logistics-website: Đã đồng bộ dev lên master thành công và push lên GitHub!" "Info"
    exit 0

} catch {
    $fatalMsg = "LỖI TIẾN TRÌNH: $($_.Exception.Message)"
    Log "❌ $fatalMsg"
    Set-Content -Path $errorFile -Value "$fatalMsg`nThời gian: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -Encoding UTF8

    # Cơ chế Rollback an toàn khi có lỗi
    Log "Thực hiện Rollback an toàn..."
    try { git merge --abort 2>$null } catch {}
    try { git checkout dev 2>$null } catch {}
    if ($hasStash) {
        try { git stash pop 2>$null } catch {}
    }

    Show-Notification "Git Sync Thất bại" "Có lỗi khi đồng bộ Git. Tác vụ sẽ tự động thử lại sau 5 phút hoặc bạn có thể chạy file dự phòng trên Desktop!" "Error"
    exit 1
}
