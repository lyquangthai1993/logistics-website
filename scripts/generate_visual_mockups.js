const { chromium } = require('../frontend/node_modules/@playwright/test');
const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, '..', 'docs', 'railway_guide', 'images');
fs.mkdirSync(imgDir, { recursive: true });

async function generateVisuals() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1000, height: 600 },
        deviceScaleFactor: 2
    });
    const page = await context.newPage();

    // 1. Image: Google Account Chooser Mockup
    const googleHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { margin: 0; padding: 40px; background: #f0f4f9; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 520px; }
            .card { background: white; width: 440px; padding: 36px 32px; border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
            .google-logo { width: 48px; height: 48px; margin-bottom: 16px; }
            h2 { margin: 0 0 8px 0; font-size: 22px; color: #1f1f1f; font-weight: 500; }
            p { margin: 0 0 24px 0; font-size: 14px; color: #444746; }
            .account-item { display: flex; align-items: center; padding: 12px 14px; border: 1px solid #747775; border-radius: 12px; margin-bottom: 12px; cursor: pointer; transition: 0.2s; }
            .account-item:hover { background: #f8fafd; border-color: #0b57d0; }
            .avatar { width: 40px; height: 40px; border-radius: 50%; background: #0b57d0; color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 16px; margin-right: 14px; }
            .acc-name { font-size: 15px; font-weight: 500; color: #1f1f1f; }
            .acc-email { font-size: 13px; color: #444746; }
            .badge-rec { margin-left: auto; background: #e8f0fe; color: #0b57d0; font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 600; }
            .info-box { background: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 10px; padding: 12px; margin-top: 20px; font-size: 13px; color: #1b5e20; line-height: 1.4; }
        </style>
    </head>
    <body>
        <div class="card">
            <svg class="google-logo" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
            <h2>Chọn tài khoản để tiếp tục đến Railway</h2>
            <p>Ứng dụng Railway yêu cầu xác thực email của bạn để đăng ký tài khoản tự động</p>
            <div class="account-item" style="border: 2px solid #0b57d0; background: #f0f7ff;">
                <div class="avatar">T</div>
                <div>
                    <div class="acc-name">Spider Express TMS</div>
                    <div class="acc-email">doanhnghiep.tms@gmail.com</div>
                </div>
                <div class="badge-rec">👉 Bấm chọn</div>
            </div>
            <div class="account-item">
                <div class="avatar" style="background:#5f6368;">+</div>
                <div>
                    <div class="acc-name">Sử dụng một tài khoản khác</div>
                    <div class="acc-email">Đăng nhập tài khoản Gmail mới</div>
                </div>
            </div>
            <div class="info-box">
                ✅ <b>Cách 1 (Khuyên Dùng):</b> Chỉ cần 1 cú click vào tài khoản Gmail đang có, hệ thống sẽ tự động tạo tài khoản Railway ngay tức thì mà không cần cài đặt mật khẩu!
            </div>
        </div>
    </body>
    </html>
    `;
    await page.setContent(googleHtml);
    await page.screenshot({ path: path.join(imgDir, 'step_google_chooser.png') });
    console.log('✅ Generated: step_google_chooser.png');

    // 2. Image: Gmail Inbox & Magic Link Email Mockup
    const gmailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { margin: 0; padding: 30px; background: #eef2f6; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: flex; justify-content: center; }
            .mail-container { width: 620px; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; border: 1px solid #dcdfe4; }
            .mail-header { background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 18px 24px; display: flex; align-items: center; justify-content: space-between; }
            .sender-info { display: flex; align-items: center; gap: 12px; }
            .sender-logo { width: 36px; height: 36px; border-radius: 50%; background: #13111c; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; }
            .sender-name { font-size: 15px; font-weight: 600; color: #1e293b; }
            .sender-email { font-size: 12px; color: #64748b; }
            .mail-time { font-size: 12px; color: #64748b; }
            .mail-body { padding: 36px 32px; text-align: center; }
            .railway-icon { width: 56px; height: 56px; margin: 0 auto 20px; }
            h3 { font-size: 24px; color: #0f172a; margin: 0 0 12px; }
            p { font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 28px; }
            .btn-magic { display: inline-block; background: #853bce; color: white; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 40px; border-radius: 8px; box-shadow: 0 4px 14px rgba(133, 59, 206, 0.35); }
            .notice { margin-top: 32px; padding: 14px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; font-size: 13px; color: #92400e; text-align: left; }
            .footer-tip { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
        </style>
    </head>
    <body>
        <div class="mail-container">
            <div class="mail-header">
                <div class="sender-info">
                    <div class="sender-logo">🚂</div>
                    <div>
                        <div class="sender-name">Railway Team &lt;notifications@railway.com&gt;</div>
                        <div class="sender-email">Tới: doanhnghiep.tms@gmail.com</div>
                    </div>
                </div>
                <div class="mail-time">Vừa xong</div>
            </div>
            <div class="mail-body">
                <div style="font-size: 40px; margin-bottom: 12px;">🚂</div>
                <h3>Xác nhận đăng nhập vào Railway</h3>
                <p>Chúng tôi đã nhận được yêu cầu đăng nhập tài khoản Railway từ địa chỉ <b>doanhnghiep.tms@gmail.com</b>.<br>Vui lòng bấm vào nút bên dưới để hoàn tất:</p>
                <div style="margin: 20px 0;">
                    <a href="#" class="btn-magic">👉 Bấm vào đây để Đăng Nhập (Log In)</a>
                </div>
                <div class="notice">
                    💡 <b>Lưu ý quan trọng cho người dùng mới:</b><br>
                    • Đường dẫn này có hiệu lực trong vòng 15 phút và chỉ sử dụng 1 lần duy nhất.<br>
                    • Nếu không tìm thấy trong Hộp thư đến (Inbox), hãy kiểm tra thư mục <b>Spam (Thư rác)</b> hoặc <b>Quảng cáo (Promotions)</b>.
                </div>
            </div>
            <div class="footer-tip">
                Đây là cơ chế Magic Link bảo mật tiêu chuẩn quốc tế — Bạn không cần tạo hay nhớ mật khẩu!
            </div>
        </div>
    </body>
    </html>
    `;
    await page.setContent(gmailHtml);
    await page.screenshot({ path: path.join(imgDir, 'step_gmail_inbox_magic_link.png') });
    console.log('✅ Generated: step_gmail_inbox_magic_link.png');

    // 3. Image: Railway Dashboard Overview Mockup
    const dashboardHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { margin: 0; padding: 24px; background: #0c0b10; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: white; }
            .navbar { display: flex; align-items: center; justify-content: space-between; padding-bottom: 20px; border-bottom: 1px solid #232230; margin-bottom: 24px; }
            .nav-left { display: flex; align-items: center; gap: 16px; }
            .logo-train { font-size: 24px; background: #853bce; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
            .ws-title { font-size: 18px; font-weight: 700; color: #f1f5f9; }
            .nav-badge { background: #232230; color: #a5b4fc; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
            .nav-right { display: flex; align-items: center; gap: 12px; }
            .avatar { width: 36px; height: 36px; border-radius: 50%; background: #0284c7; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; border: 2px solid #38bdf8; }
            .grid-cards { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
            .project-card { background: #13111c; border: 1px solid #272438; border-radius: 14px; padding: 22px; }
            .p-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
            .p-name { font-size: 18px; font-weight: 700; color: #fff; }
            .p-env { display: flex; gap: 8px; margin-top: 8px; }
            .badge-env { font-size: 12px; padding: 4px 8px; border-radius: 6px; font-weight: 600; }
            .env-prod { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
            .env-dev { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); }
            .services-list { background: #0c0b10; border-radius: 8px; padding: 12px; margin-top: 14px; font-size: 13px; color: #94a3b8; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
            .service-item { display: flex; align-items: center; gap: 6px; }
            .dot-green { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; }
            .side-card { background: #13111c; border: 1px solid #272438; border-radius: 14px; padding: 22px; display: flex; flex-col; gap: 16px; }
            .plan-badge { background: #3b1d5c; color: #c084fc; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; display: inline-block; width: fit-content; }
            .btn-action { background: #853bce; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; text-align: center; }
            .info-text { font-size: 13px; color: #94a3b8; line-height: 1.5; }
        </style>
    </head>
    <body>
        <div class="navbar">
            <div class="nav-left">
                <div class="logo-train">🚂</div>
                <div class="ws-title">Logistics TMS Workspace</div>
                <div class="nav-badge">Pro Workspace</div>
            </div>
            <div class="nav-right">
                <div style="font-size: 13px; color: #94a3b8;">doanhnghiep.tms@gmail.com</div>
                <div class="avatar">DN</div>
            </div>
        </div>
        <div class="grid-cards">
            <div class="project-card">
                <div class="p-header">
                    <div>
                        <div class="p-name">📦 spider-express-tms</div>
                        <div class="p-env">
                            <span class="badge-env env-prod">🔴 Production (Master)</span>
                            <span class="badge-env env-dev">🟢 Dev (Staging)</span>
                        </div>
                    </div>
                    <span style="font-size: 12px; color: #22c55e; background: rgba(34, 197, 94, 0.1); padding: 6px 12px; border-radius: 20px;">● 8/8 Services Hoạt Động 24/7</span>
                </div>
                <div class="services-list">
                    <div class="service-item"><span class="dot-green"></span> frontend-prod (Next.js)</div>
                    <div class="service-item"><span class="dot-green"></span> frontend-dev (Next.js)</div>
                    <div class="service-item"><span class="dot-green"></span> backend-prod (NestJS API)</div>
                    <div class="service-item"><span class="dot-green"></span> backend-dev (NestJS API)</div>
                    <div class="service-item"><span class="dot-green"></span> postgresql-prod (Database)</div>
                    <div class="service-item"><span class="dot-green"></span> postgresql-dev (Database)</div>
                    <div class="service-item"><span class="dot-green"></span> redis-prod (Cache & Queue)</div>
                    <div class="service-item"><span class="dot-green"></span> redis-dev (Cache & Queue)</div>
                </div>
            </div>
            <div class="side-card">
                <div class="plan-badge">GÓI RAILWAY PRO</div>
                <div style="font-size: 16px; font-weight: 600;">Quyền Quản Trị Viên (Admin)</div>
                <div class="info-text">
                    • Quản trị viên (Seats): <b>Không giới hạn (0đ phụ phí)</b><br>
                    • Môi trường độc lập: <b>Cách ly Dev & Prod</b><br>
                    • Server Singapore: <b>Độ trễ thấp ~20ms về VN</b>
                </div>
                <div class="btn-action">👥 Mời Thành Viên Team (People)</div>
            </div>
        </div>
    </body>
    </html>
    `;
    await page.setContent(dashboardHtml);
    await page.screenshot({ path: path.join(imgDir, 'step_dashboard_overview.png') });
    console.log('✅ Generated: step_dashboard_overview.png');

    // 4. Image: Workspace People & Invite Form Mockup
    const inviteHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { margin: 0; padding: 24px; background: #0c0b10; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: white; display: flex; justify-content: center; }
            .container { width: 680px; background: #13111c; border: 1px solid #272438; border-radius: 16px; padding: 28px; }
            .title { font-size: 20px; font-weight: 700; margin-bottom: 6px; }
            .subtitle { font-size: 13px; color: #94a3b8; margin-bottom: 24px; }
            .invite-box { background: #1a1726; border: 1px solid #332f48; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
            .form-row { display: flex; gap: 12px; margin-bottom: 12px; }
            .input-email { flex: 1; background: #0c0b10; border: 1px solid #3b3754; color: white; padding: 10px 14px; border-radius: 8px; font-size: 14px; }
            .select-role { background: #0c0b10; border: 1px solid #3b3754; color: white; padding: 10px 14px; border-radius: 8px; font-size: 14px; }
            .btn-invite { background: #853bce; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; }
            .members-list { border-top: 1px solid #272438; padding-top: 18px; }
            .m-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #1a1726; }
            .m-left { display: flex; align-items: center; gap: 12px; }
            .m-avatar { width: 34px; height: 34px; border-radius: 50%; background: #475569; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; }
            .m-email { font-size: 14px; font-weight: 500; }
            .m-role { font-size: 12px; padding: 4px 10px; border-radius: 6px; font-weight: 600; }
            .role-admin { background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4); }
            .role-member { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4); }
            .tip { background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 8px; padding: 12px; margin-top: 20px; font-size: 13px; color: #86efac; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="title">👥 Thành Viên Không Gian Làm Việc (Workspace People)</div>
            <div class="subtitle">Thêm các thành viên trong ban lãnh đạo, kế toán hoặc đội kỹ thuật vào cùng quản lý</div>
            
            <div class="invite-box">
                <div style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">Gửi lời mời thành viên mới:</div>
                <div class="form-row">
                    <input class="input-email" type="text" value="banlanhdao@gmail.com" />
                    <select class="select-role">
                        <option>Admin (Toàn quyền)</option>
                        <option>Member (Xem & quản lý)</option>
                        <option>Viewer (Chỉ xem)</option>
                    </select>
                    <button class="btn-invite">Gửi Lời Mời</button>
                </div>
            </div>

            <div class="members-list">
                <div style="font-size: 13px; color: #94a3b8; margin-bottom: 10px; text-transform: uppercase;">Thành viên hiện tại (2 người):</div>
                <div class="m-item">
                    <div class="m-left">
                        <div class="m-avatar" style="background:#0284c7;">DN</div>
                        <div>
                            <div class="m-email">doanhnghiep.tms@gmail.com (Bạn)</div>
                            <div style="font-size:12px; color:#64748b;">Chủ sở hữu Workspace</div>
                        </div>
                    </div>
                    <span class="m-role role-admin">Owner / Admin</span>
                </div>
                <div class="m-item">
                    <div class="m-left">
                        <div class="m-avatar" style="background:#10b981;">DEV</div>
                        <div>
                            <div class="m-email">techlead.spiderexpress@gmail.com</div>
                            <div style="font-size:12px; color:#64748b;">Kỹ thuật phụ trách TMS</div>
                        </div>
                    </div>
                    <span class="m-role role-admin">Admin</span>
                </div>
            </div>

            <div class="tip">
                💡 <b>Gói Railway Pro:</b> Cho phép mời <b>Không Giới Hạn Thành Viên (Unlimited Seats)</b> với <b>0đ phụ phí</b>. Bạn có thể mời thoải mái ban giám đốc, kế toán và dev vào theo dõi mà không sợ phát sinh thêm tiền mỗi người.
            </div>
        </div>
    </body>
    </html>
    `;
    await page.setContent(inviteHtml);
    await page.screenshot({ path: path.join(imgDir, 'step_workspace_invite.png') });
    console.log('✅ Generated: step_workspace_invite.png');

    await browser.close();
    console.log('🎉 All visual assets generated successfully!');
}

generateVisuals().catch(console.error);
