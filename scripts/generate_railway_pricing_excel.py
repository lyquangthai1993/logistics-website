# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def build_excel_report():
    wb = openpyxl.Workbook()
    # Remove default sheet
    wb.remove(wb.active)

    # Styles
    navy_dark = "0F3D62"
    navy_blue = "1E5F8C"
    navy_light = "E8F1F8"
    accent_green = "2E7D32"
    accent_green_light = "E8F5E9"
    accent_gold = "D48806"
    accent_gold_light = "FFFBE6"
    accent_purple = "6B21A8"
    accent_purple_light = "F3E8FF"
    gray_light = "F8F9FA"
    gray_border = "D0D5DD"
    gray_text = "595959"
    white = "FFFFFF"

    font_title = Font(name="Segoe UI", size=15, bold=True, color=white)
    font_sub_title = Font(name="Segoe UI", size=10, italic=True, color=white)
    font_section = Font(name="Segoe UI", size=11, bold=True, color=navy_dark)
    font_header = Font(name="Segoe UI", size=10, bold=True, color=white)
    font_bold = Font(name="Segoe UI", size=10, bold=True)
    font_regular = Font(name="Segoe UI", size=10)
    font_italic = Font(name="Segoe UI", size=9, italic=True, color=gray_text)
    font_kpi_num = Font(name="Segoe UI", size=13, bold=True, color=navy_dark)
    font_kpi_lbl = Font(name="Segoe UI", size=9, bold=True, color=gray_text)

    fill_title = PatternFill(start_color=navy_dark, end_color=navy_dark, fill_type="solid")
    fill_header = PatternFill(start_color=navy_blue, end_color=navy_blue, fill_type="solid")
    fill_subtotal = PatternFill(start_color=navy_light, end_color=navy_light, fill_type="solid")
    fill_highlight_green = PatternFill(start_color=accent_green_light, end_color=accent_green_light, fill_type="solid")
    fill_highlight_gold = PatternFill(start_color=accent_gold_light, end_color=accent_gold_light, fill_type="solid")
    fill_highlight_purple = PatternFill(start_color=accent_purple_light, end_color=accent_purple_light, fill_type="solid")
    fill_zebra = PatternFill(start_color=gray_light, end_color=gray_light, fill_type="solid")

    thin_border = Side(style='thin', color=gray_border)
    double_bottom = Side(style='double', color=navy_dark)
    thick_bottom = Side(style='medium', color=navy_dark)

    cell_border = Border(left=thin_border, right=thin_border, top=thin_border, bottom=thin_border)
    total_border = Border(left=thin_border, right=thin_border, top=thin_border, bottom=double_bottom)
    header_border = Border(left=thin_border, right=thin_border, top=thin_border, bottom=thick_bottom)

    align_center = Alignment(horizontal="center", vertical="center", wrap_text=True)
    align_left = Alignment(horizontal="left", vertical="center", wrap_text=True)
    align_right = Alignment(horizontal="right", vertical="center")

    usd_fmt = '"$"#,##0.00'
    vnd_fmt = '#,##0" đ"'

    EXCHANGE_RATE = 26000  # 1 USD = 26.000 VNĐ

    # ═════════════════════════════════════════════════════════════════════════
    # SHEET 1: TỔNG HỢP & DỰ TOÁN (SUMMARY)
    # ═════════════════════════════════════════════════════════════════════════
    ws1 = wb.create_sheet(title="1. Dự Toán Tổng Hợp")
    ws1.views.sheetView[0].showGridLines = True

    # Title block
    ws1.merge_cells("A1:G1")
    ws1["A1"] = "BÁO GIÁ DỰ TOÁN HẠ TẦNG RAILWAY PRO — 3 CỤM: DEV, PRO & TỰ ĐỘNG HÓA AI WORKER"
    ws1["A1"].font = font_title
    ws1["A1"].fill = fill_title
    ws1["A1"].alignment = align_center

    ws1.merge_cells("A2:G2")
    ws1["A2"] = f"Dự án: Logistics TMS (Spider Express) | Nền tảng: Railway.com (Region: Singapore) | Tỷ giá: 1 USD = {EXCHANGE_RATE:,.0f} VNĐ | Ngày: 12/10/2026".replace(",", ".")
    ws1["A2"].font = font_sub_title
    ws1["A2"].fill = fill_title
    ws1["A2"].alignment = align_center

    ws1.row_dimensions[1].height = 36
    ws1.row_dimensions[2].height = 20

    # Summary KPI Cards
    # Card 1: Gói cước cơ sở
    ws1.merge_cells("A4:B4"); ws1["A4"] = "GÓI CƯỚC NỀN TẢNG"; ws1["A4"].font = font_kpi_lbl; ws1["A4"].fill = fill_subtotal; ws1["A4"].alignment = align_center
    ws1.merge_cells("A5:B5"); ws1["A5"] = "RAILWAY PRO"; ws1["A5"].font = font_kpi_num; ws1["A5"].fill = fill_subtotal; ws1["A5"].alignment = align_center
    ws1.merge_cells("A6:B6"); ws1["A6"] = "$20 / tháng (Tặng $20 Credit)"; ws1["A6"].font = font_italic; ws1["A6"].fill = fill_subtotal; ws1["A6"].alignment = align_center

    # Card 2: Số người quản trị
    ws1.merge_cells("C4:D4"); ws1["C4"] = "QUẢN TRỊ VIÊN (SEATS)"; ws1["C4"].font = font_kpi_lbl; ws1["C4"].fill = fill_highlight_green; ws1["C4"].alignment = align_center
    ws1.merge_cells("C5:D5"); ws1["C5"] = "UNLIMITED (KHÔNG GIỚI HẠN)"; ws1["C5"].font = font_kpi_num; ws1["C5"].fill = fill_highlight_green; ws1["C5"].alignment = align_center
    ws1.merge_cells("C6:D6"); ws1["C6"] = "0đ phụ phí ghế ngồi (No Seat Fee)"; ws1["C6"].font = font_italic; ws1["C6"].fill = fill_highlight_green; ws1["C6"].alignment = align_center

    # Card 3: Chi phí dự kiến tháng
    min_vnd = int(30 * EXCHANGE_RATE)
    max_vnd = int(35 * EXCHANGE_RATE)
    ws1.merge_cells("E4:G4"); ws1["E4"] = "HÓA ĐƠN DỰ KIẾN THỰC TRẢ (3 CỤM ĐỘC LẬP)"; ws1["E4"].font = font_kpi_lbl; ws1["E4"].fill = fill_highlight_gold; ws1["E4"].alignment = align_center
    ws1.merge_cells("E5:G5"); ws1["E5"] = "~$33.30 / tháng (Trọn gói 3 Cụm)"; ws1["E5"].font = font_kpi_num; ws1["E5"].fill = fill_highlight_gold; ws1["E5"].alignment = align_center
    ws1.merge_cells("E6:G6"); ws1["E6"] = f"≈ {int(33.30*EXCHANGE_RATE):,.0f} đ / tháng (Đã trừ $20 Credit, Cụm Automation riêng biệt)".replace(",", "."); ws1["E6"].font = font_italic; ws1["E6"].fill = fill_highlight_gold; ws1["E6"].alignment = align_center

    for r in range(4, 7):
        for c in range(1, 8):
            ws1.cell(r, c).border = cell_border

    # Section 1: Bảng tổng hợp các cụm chi phí
    ws1.merge_cells("A8:G8")
    ws1["A8"] = "I. TỔNG HỢP CHI PHÍ VẬN HÀNH TOÀN BỘ HẠ TẦNG (3 CỤM ĐỘC LẬP)"
    ws1["A8"].font = font_section
    ws1["A8"].alignment = Alignment(vertical="center")

    headers_summary = ["STT", "Cụm Dịch Vụ / Hạng Mục", "Số Service", "Tài Nguyên Phân Bổ", "Chi Phí Tiêu Thụ (USD)", "Tương Đương (VNĐ)", "Ghi Chú Vận Hành"]
    for col_idx, h in enumerate(headers_summary, 1):
        cell = ws1.cell(9, col_idx, h)
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = align_center
        cell.border = header_border
    ws1.row_dimensions[9].height = 28

    data_summary = [
        (1, "Cụm 1: Môi Trường Production TMS (24/7)", 4, "FE (300MB), BE (450MB), Postgres (10GB SSD), Redis (100MB)", 15.00, int(15.00 * EXCHANGE_RATE), "Branch 'master', dữ liệu thật vận hành, không ngủ đông"),
        (2, "Cụm 2: Môi Trường Development TMS (24/7)", 4, "FE (200MB), BE (256MB), Postgres (5GB SSD), Redis (64MB)", 9.00, int(9.00 * EXCHANGE_RATE), "Branch 'dev', môi trường test biệt lập 100%, 0đ ảnh hưởng Prod"),
        (3, "Cụm 3: Cụm Tự Động Hóa Workflow & AI Worker (Group Riêng)", "3 serv + 1 vol", "n8n (250MB) + Postgres riêng (150MB, 2GB) + Worker (200MB) + Ổ đĩa Source Code (10GB)", 8.30, int(8.30 * EXCHANGE_RATE), "GROUP ĐỘC LẬP: n8n, DB riêng, Telegram AI Worker & Ổ đĩa 10GB lưu 3 Git repo"),
        (4, "Băng Thông Mạng (Egress)", "-", "Nội bộ Wireguard: 0đ | Ra ngoài Internet: ~20GB", 1.00, int(1.00 * EXCHANGE_RATE), "Tải trang Next.js, API JSON và Webhook n8n"),
    ]

    for row_idx, row in enumerate(data_summary, 10):
        ws1.row_dimensions[row_idx].height = 24
        fill_row = fill_zebra if row_idx % 2 == 0 else PatternFill(fill_type=None)
        ws1.cell(row_idx, 1, row[0]).alignment = align_center
        ws1.cell(row_idx, 2, row[1]).alignment = align_left
        ws1.cell(row_idx, 3, row[2]).alignment = align_center
        ws1.cell(row_idx, 4, row[3]).alignment = align_left
        
        c5 = ws1.cell(row_idx, 5, row[4])
        c5.number_format = usd_fmt
        c5.alignment = align_right
        
        c6 = ws1.cell(row_idx, 6, row[5])
        c6.number_format = vnd_fmt
        c6.alignment = align_right
        
        ws1.cell(row_idx, 7, row[6]).alignment = align_left

        for c in range(1, 8):
            ws1.cell(row_idx, c).font = font_regular
            ws1.cell(row_idx, c).border = cell_border
            if fill_row.fill_type:
                ws1.cell(row_idx, c).fill = fill_row

    # Dòng tổng tiêu thụ
    ws1.row_dimensions[14].height = 24
    ws1.cell(14, 1, "")
    ws1.cell(14, 2, "TỔNG MỨC TIÊU THỤ TÀI NGUYÊN (A)").alignment = align_left
    ws1.cell(14, 3, "3 Cụm độc lập").alignment = align_center
    ws1.cell(14, 4, "Chạy 24/7 (2 FE, 2 BE, 3 Postgres, 2 Redis, 1 n8n, 1 Worker, 1 Volume 10GB)").alignment = align_left
    ws1.cell(14, 5, "=SUM(E10:E13)").alignment = align_right; ws1.cell(14, 5).number_format = usd_fmt
    ws1.cell(14, 6, "=SUM(F10:F13)").alignment = align_right; ws1.cell(14, 6).number_format = vnd_fmt
    ws1.cell(14, 7, "Tính theo giây sử dụng thực tế").alignment = align_left
    for c in range(1, 8):
        ws1.cell(14, c).font = font_bold
        ws1.cell(14, c).fill = fill_subtotal
        ws1.cell(14, c).border = cell_border

    # Dòng trừ credit gói Pro
    ws1.row_dimensions[15].height = 24
    ws1.cell(15, 1, "-")
    ws1.cell(15, 2, "Khấu trừ Credit có sẵn của Gói PRO (B)").alignment = align_left
    ws1.cell(15, 3, "-")
    ws1.cell(15, 4, "Tặng sẵn hàng tháng đi kèm gói Pro $20").alignment = align_left
    ws1.cell(15, 5, -20.00).alignment = align_right; ws1.cell(15, 5).number_format = usd_fmt
    ws1.cell(15, 6, int(-20.00 * EXCHANGE_RATE)).alignment = align_right; ws1.cell(15, 6).number_format = vnd_fmt
    ws1.cell(15, 7, "Trừ thẳng 100% vào tiền máy chủ").alignment = align_left
    for c in range(1, 8):
        ws1.cell(15, c).font = font_bold
        ws1.cell(15, c).fill = fill_highlight_green
        ws1.cell(15, c).border = cell_border

    # Dòng số tiền thực trả cuối tháng
    ws1.row_dimensions[16].height = 28
    ws1.cell(16, 1, "👉")
    ws1.cell(16, 2, "HÓA ĐƠN THỰC TẾ PHẢI TRẢ (GÓI PRO + OVERAGE)").alignment = align_left
    ws1.cell(16, 3, "-")
    ws1.cell(16, 4, "$20 Base + Phần vượt $20 Credit (A - 20)").alignment = align_left
    ws1.cell(16, 5, "=20 + MAX(0, E14-20)").alignment = align_right; ws1.cell(16, 5).number_format = usd_fmt
    ws1.cell(16, 6, f"=E16*{EXCHANGE_RATE}").alignment = align_right; ws1.cell(16, 6).number_format = vnd_fmt
    ws1.cell(16, 7, "Chi phí trọn gói cả 3 Cụm (Dev, Pro & Cụm Tự Động Hóa Worker)").alignment = align_left
    for c in range(1, 8):
        ws1.cell(16, c).font = Font(name="Segoe UI", size=11, bold=True, color=navy_dark)
        ws1.cell(16, c).fill = fill_highlight_gold
        ws1.cell(16, c).border = total_border

    # Section 2: So sánh với các nền tảng khác
    ws1.merge_cells("A18:G18")
    ws1["A18"] = "II. SO SÁNH HIỆU QUẢ CHI PHÍ VỚI CÁC PHƯƠNG ÁN KHÁC (BENCHMARK)"
    ws1["A18"].font = font_section

    headers_comp = ["STT", "Phương Án Hạ Tầng", "Thành Phần", "Khả Năng Chạy Dev, Pro & n8n", "Chi Phí / Tháng (USD)", "Thành Tiền (VNĐ)", "Đánh Giá Hiệu Năng & Rủi Ro"]
    for col_idx, h in enumerate(headers_comp, 1):
        cell = ws1.cell(19, col_idx, h)
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = align_center
        cell.border = header_border
    ws1.row_dimensions[19].height = 26

    data_comp = [
        (1, "Phương án Đề xuất: Railway PRO Fullstack (3 Cụm Độc Lập)", "3 Cụm: 4 Prod + 4 Dev + Cụm Automation (n8n, DB riêng, Worker, Ổ đĩa)", "✅ Đầy đủ 2 môi trường TMS độc lập + Cụm Automation riêng 24/7", 33.30, int(33.30 * EXCHANGE_RATE), "TỐT NHẤT: Mạng nội bộ 1ms, không ngủ đông, Unlimited Admins, DB n8n riêng & Worker sửa code 24/7"),
        (2, "Phương án Render Trả Phí (Starter)", "4 web services + 2 Postgres + 1 Redis + 1 n8n", "⚠️ Tách 2 môi trường nhưng tính giá gói cứng đắt đỏ", 45.00, int(45.00 * EXCHANGE_RATE), "ĐẮT HƠN: $7 x 4 (FE/BE) + $6 x 2 (DB) + $10 (Redis) + $7 (n8n) = $57/tháng"),
        (3, "Hiện tại: Render Free + Vercel + Neon", "1 BE Render Free, 1 FE Vercel, 1 DB Neon (Không có n8n)", "❌ KHÔNG ĐẠT: Dev và Prod dùng chung 1 database", 0.00, 0, "RỦI RO: Ngủ đông 50s, dễ làm bẩn DB prod, KHÔNG THỂ chạy n8n webhook"),
    ]

    for row_idx, row in enumerate(data_comp, 20):
        ws1.row_dimensions[row_idx].height = 24
        ws1.cell(row_idx, 1, row[0]).alignment = align_center
        ws1.cell(row_idx, 2, row[1]).alignment = align_left
        ws1.cell(row_idx, 3, row[2]).alignment = align_left
        ws1.cell(row_idx, 4, row[3]).alignment = align_left
        
        c5 = ws1.cell(row_idx, 5, row[4])
        c5.number_format = usd_fmt
        c5.alignment = align_right
        
        c6 = ws1.cell(row_idx, 6, row[5])
        c6.number_format = vnd_fmt
        c6.alignment = align_right
        
        ws1.cell(row_idx, 7, row[6]).alignment = align_left

        for c in range(1, 8):
            ws1.cell(row_idx, c).font = font_regular
            ws1.cell(row_idx, c).border = cell_border
            if row_idx == 20:
                ws1.cell(row_idx, c).fill = fill_highlight_green
                ws1.cell(row_idx, c).font = font_bold

    # ═════════════════════════════════════════════════════════════════════════
    # ═════════════════════════════════════════════════════════════════════════
    # SHEET 2: BÓC TÁCH CHI TIẾT 3 CỤM HẠ TẦNG (DEV, PRO & TỰ ĐỘNG HÓA WORKER)
    # ═════════════════════════════════════════════════════════════════════════
    ws2 = wb.create_sheet(title="2. Bóc Tách 3 Cụm Hạ Tầng")
    ws2.views.sheetView[0].showGridLines = True

    ws2.merge_cells("A1:H1")
    ws2["A1"] = "BẢNG BÓC TÁCH CHI TIẾT 3 CỤM HẠ TẦNG (DEV, PRO & CỤM TỰ ĐỘNG HÓA RIÊNG BIỆT)"
    ws2["A1"].font = font_title
    ws2["A1"].fill = fill_title
    ws2["A1"].alignment = align_center
    ws2.row_dimensions[1].height = 36

    headers_detail = ["STT", "Tên Service", "Môi Trường", "Cấu Hình RAM", "Cấu Hình CPU / Disk", "Đơn Giá Railway", "Chi Phí / Tháng (USD)", "Quy Đổi (VNĐ)"]
    for col_idx, h in enumerate(headers_detail, 1):
        cell = ws2.cell(3, col_idx, h)
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = align_center
        cell.border = header_border
    ws2.row_dimensions[3].height = 28

    # Cụm Production
    ws2.merge_cells("A4:H4")
    ws2["A4"] = "🔴 CỤM MÔI TRƯỜNG PRODUCTION (Chạy 24/7 - Dữ liệu thực tế doanh nghiệp - Branch 'master')"
    ws2["A4"].font = font_bold
    ws2["A4"].fill = PatternFill(start_color="FFEBEE", end_color="FFEBEE", fill_type="solid")
    ws2["A4"].alignment = align_left
    ws2.row_dimensions[4].height = 24

    prod_services = [
        (1, "frontend-prod", "Production", "300 MB", "0.08 vCPU", "RAM: $10/GB | CPU: $20/vCPU", 4.00, int(4.00 * EXCHANGE_RATE)),
        (2, "backend-prod", "Production", "450 MB", "0.12 vCPU", "RAM: $10/GB | CPU: $20/vCPU", 6.00, int(6.00 * EXCHANGE_RATE)),
        (3, "postgres-prod", "Production", "256 MB", "10 GB NVMe SSD", "RAM: $10/GB | Disk: $0.15/GB", 3.75, int(3.75 * EXCHANGE_RATE)),
        (4, "redis-prod", "Production", "100 MB", "0.02 vCPU", "RAM: $10/GB | CPU: $20/vCPU", 1.25, int(1.25 * EXCHANGE_RATE)),
    ]

    for idx, row in enumerate(prod_services, 5):
        ws2.row_dimensions[idx].height = 22
        ws2.cell(idx, 1, row[0]).alignment = align_center
        ws2.cell(idx, 2, row[1]).alignment = align_left
        ws2.cell(idx, 3, row[2]).alignment = align_center
        ws2.cell(idx, 4, row[3]).alignment = align_center
        ws2.cell(idx, 5, row[4]).alignment = align_center
        ws2.cell(idx, 6, row[5]).alignment = align_left
        ws2.cell(idx, 7, row[6]).alignment = align_right; ws2.cell(idx, 7).number_format = usd_fmt
        ws2.cell(idx, 8, row[7]).alignment = align_right; ws2.cell(idx, 8).number_format = vnd_fmt
        for c in range(1, 9):
            ws2.cell(idx, c).font = font_regular
            ws2.cell(idx, c).border = cell_border

    # Subtotal Prod
    ws2.row_dimensions[9].height = 24
    ws2.cell(9, 1, "")
    ws2.cell(9, 2, "Tiểu Kế Cụm Production:").alignment = align_left
    ws2.merge_cells("B9:F9")
    ws2.cell(9, 7, "=SUM(G5:G8)").alignment = align_right; ws2.cell(9, 7).number_format = usd_fmt
    ws2.cell(9, 8, "=SUM(H5:H8)").alignment = align_right; ws2.cell(9, 8).number_format = vnd_fmt
    for c in range(1, 9):
        ws2.cell(9, c).font = font_bold
        ws2.cell(9, c).fill = fill_subtotal
        ws2.cell(9, c).border = cell_border

    # Cụm Dev
    ws2.merge_cells("A11:H11")
    ws2["A11"] = "🟢 CỤM MÔI TRƯỜNG DEV (Chạy 24/7 - Cấu hình tinh gọn - Thử nghiệm tính năng mới - Branch 'dev')"
    ws2["A11"].font = font_bold
    ws2["A11"].fill = PatternFill(start_color="E8F8F5", end_color="E8F8F5", fill_type="solid")
    ws2["A11"].alignment = align_left
    ws2.row_dimensions[11].height = 24

    dev_services = [
        (5, "frontend-dev", "Dev", "200 MB", "0.05 vCPU", "RAM: $10/GB | CPU: $20/vCPU", 2.75, int(2.75 * EXCHANGE_RATE)),
        (6, "backend-dev", "Dev", "256 MB", "0.06 vCPU", "RAM: $10/GB | CPU: $20/vCPU", 3.50, int(3.50 * EXCHANGE_RATE)),
        (7, "postgres-dev", "Dev", "150 MB", "5 GB NVMe SSD", "RAM: $10/GB | Disk: $0.15/GB", 2.00, int(2.00 * EXCHANGE_RATE)),
        (8, "redis-dev", "Dev", "64 MB", "0.01 vCPU", "RAM: $10/GB | CPU: $20/vCPU", 0.75, int(0.75 * EXCHANGE_RATE)),
    ]

    for idx, row in enumerate(dev_services, 12):
        ws2.row_dimensions[idx].height = 22
        ws2.cell(idx, 1, row[0]).alignment = align_center
        ws2.cell(idx, 2, row[1]).alignment = align_left
        ws2.cell(idx, 3, row[2]).alignment = align_center
        ws2.cell(idx, 4, row[3]).alignment = align_center
        ws2.cell(idx, 5, row[4]).alignment = align_center
        ws2.cell(idx, 6, row[5]).alignment = align_left
        ws2.cell(idx, 7, row[6]).alignment = align_right; ws2.cell(idx, 7).number_format = usd_fmt
        ws2.cell(idx, 8, row[7]).alignment = align_right; ws2.cell(idx, 8).number_format = vnd_fmt
        for c in range(1, 9):
            ws2.cell(idx, c).font = font_regular
            ws2.cell(idx, c).border = cell_border

    # Subtotal Dev
    ws2.row_dimensions[16].height = 24
    ws2.cell(16, 1, "")
    ws2.cell(16, 2, "Tiểu Kế Cụm Dev:").alignment = align_left
    ws2.merge_cells("B16:F16")
    ws2.cell(16, 7, "=SUM(G12:G15)").alignment = align_right; ws2.cell(16, 7).number_format = usd_fmt
    ws2.cell(16, 8, "=SUM(H12:H15)").alignment = align_right; ws2.cell(16, 8).number_format = vnd_fmt
    for c in range(1, 9):
        ws2.cell(16, c).font = font_bold
        ws2.cell(16, c).fill = fill_subtotal
        ws2.cell(16, c).border = cell_border

    # Cụm 3: Cụm Tự Động Hóa Workflow & AI Worker (Tách biệt 100% khỏi TMS)
    ws2.merge_cells("A18:H18")
    ws2["A18"] = "🟣 CỤM 3: HẠ TẦNG TỰ ĐỘNG HÓA WORKFLOW & AI WORKER (GROUP ĐỘC LẬP RIÊNG BIỆT 100%)"
    ws2["A18"].font = font_bold
    ws2["A18"].fill = PatternFill(start_color="F3E8FF", end_color="F3E8FF", fill_type="solid")
    ws2["A18"].alignment = align_left
    ws2.row_dimensions[18].height = 24

    automation_services = [
        (9, "n8n-automation", "Automation", "250 MB", "0.05 vCPU", "RAM: $10/GB | CPU: $20/vCPU", 2.50, int(2.50 * EXCHANGE_RATE)),
        (10, "postgres-automation", "Automation", "150 MB", "2 GB NVMe SSD", "RAM: $10/GB | Disk: $0.15/GB", 1.80, int(1.80 * EXCHANGE_RATE)),
        (11, "telegram-cloud-worker", "Worker / AI", "200 MB", "0.05 vCPU", "RAM: $10/GB | CPU: $20/vCPU", 2.50, int(2.50 * EXCHANGE_RATE)),
        (12, "volume-source-code", "Lưu trữ Source", "10 GB SSD", "Gắn vào Worker", "Volume: $0.15 / GB", 1.50, int(1.50 * EXCHANGE_RATE)),
    ]

    for idx, row in enumerate(automation_services, 19):
        ws2.row_dimensions[idx].height = 22
        ws2.cell(idx, 1, row[0]).alignment = align_center
        ws2.cell(idx, 2, row[1]).alignment = align_left
        ws2.cell(idx, 3, row[2]).alignment = align_center
        ws2.cell(idx, 4, row[3]).alignment = align_center
        ws2.cell(idx, 5, row[4]).alignment = align_center
        ws2.cell(idx, 6, row[5]).alignment = align_left
        ws2.cell(idx, 7, row[6]).alignment = align_right; ws2.cell(idx, 7).number_format = usd_fmt
        ws2.cell(idx, 8, row[7]).alignment = align_right; ws2.cell(idx, 8).number_format = vnd_fmt
        for c in range(1, 9):
            ws2.cell(idx, c).font = font_regular
            ws2.cell(idx, c).border = cell_border

    # Subtotal Cụm 3 at row 23
    ws2.row_dimensions[23].height = 24
    ws2.cell(23, 1, "")
    ws2.cell(23, 2, "Tiểu Kế Cụm Tự Động Hóa & Cloud AI Worker:").alignment = align_left
    ws2.merge_cells("B23:F23")
    ws2.cell(23, 7, "=SUM(G19:G22)").alignment = align_right; ws2.cell(23, 7).number_format = usd_fmt
    ws2.cell(23, 8, "=SUM(H19:H22)").alignment = align_right; ws2.cell(23, 8).number_format = vnd_fmt
    for c in range(1, 9):
        ws2.cell(23, c).font = font_bold
        ws2.cell(23, c).fill = fill_highlight_purple
        ws2.cell(23, c).border = cell_border

    # Băng thông
    ws2.row_dimensions[25].height = 22
    ws2.cell(25, 1, 13).alignment = align_center
    ws2.cell(25, 2, "Băng thông mạng nội bộ (Wireguard)").alignment = align_left
    ws2.cell(25, 3, "Toàn hệ thống").alignment = align_center
    ws2.cell(25, 4, "FE <-> BE <-> DB <-> n8n <-> Worker").alignment = align_center
    ws2.cell(25, 5, "Không giới hạn").alignment = align_center
    ws2.cell(25, 6, "Railway Private Mesh (0đ)").alignment = align_left
    ws2.cell(25, 7, 0.00).alignment = align_right; ws2.cell(25, 7).number_format = usd_fmt
    ws2.cell(25, 8, 0).alignment = align_right; ws2.cell(25, 8).number_format = vnd_fmt
    for c in range(1, 9):
        ws2.cell(25, c).font = font_regular; ws2.cell(25, c).border = cell_border

    ws2.row_dimensions[26].height = 22
    ws2.cell(26, 1, 14).alignment = align_center
    ws2.cell(26, 2, "Băng thông ra ngoài Internet (Egress)").alignment = align_left
    ws2.cell(26, 3, "Toàn hệ thống").alignment = align_center
    ws2.cell(26, 4, "~20 GB").alignment = align_center
    ws2.cell(26, 5, "Tải web, JSON, Webhook & Git").alignment = align_center
    ws2.cell(26, 6, "$0.05 / GB").alignment = align_left
    ws2.cell(26, 7, 1.00).alignment = align_right; ws2.cell(26, 7).number_format = usd_fmt
    ws2.cell(26, 8, int(1.00 * EXCHANGE_RATE)).alignment = align_right; ws2.cell(26, 8).number_format = vnd_fmt
    for c in range(1, 9):
        ws2.cell(26, c).font = font_regular; ws2.cell(26, c).border = cell_border

    # Tổng cộng
    ws2.row_dimensions[28].height = 26
    ws2.cell(28, 1, "")
    ws2.cell(28, 2, "TỔNG TIÊU THỤ TÀI NGUYÊN (A)").alignment = align_left
    ws2.merge_cells("B28:F28")
    ws2.cell(28, 7, "=G9+G16+G23+G26").alignment = align_right; ws2.cell(28, 7).number_format = usd_fmt
    ws2.cell(28, 8, "=H9+H16+H23+H26").alignment = align_right; ws2.cell(28, 8).number_format = vnd_fmt
    for c in range(1, 9):
        ws2.cell(28, c).font = font_bold
        ws2.cell(28, c).fill = fill_subtotal
        ws2.cell(28, c).border = cell_border

    ws2.row_dimensions[29].height = 26
    ws2.cell(29, 1, "")
    ws2.cell(29, 2, "CREDIT TẶNG SẴN TRONG GÓI PRO (B)").alignment = align_left
    ws2.merge_cells("B29:F29")
    ws2.cell(29, 7, -20.00).alignment = align_right; ws2.cell(29, 7).number_format = usd_fmt
    ws2.cell(29, 8, int(-20.00 * EXCHANGE_RATE)).alignment = align_right; ws2.cell(29, 8).number_format = vnd_fmt
    for c in range(1, 9):
        ws2.cell(29, c).font = font_bold
        ws2.cell(29, c).fill = fill_highlight_green
        ws2.cell(29, c).border = cell_border

    ws2.row_dimensions[30].height = 30
    ws2.cell(30, 1, "👉")
    ws2.cell(30, 2, "HÓA ĐƠN THỰC TRẢ THÁNG (GÓI PRO + VƯỢT MỨC)").alignment = align_left
    ws2.merge_cells("B30:F30")
    ws2.cell(30, 7, "=20+MAX(0, G28-20)").alignment = align_right; ws2.cell(30, 7).number_format = usd_fmt
    ws2.cell(30, 8, f"=G30*{EXCHANGE_RATE}").alignment = align_right; ws2.cell(30, 8).number_format = vnd_fmt
    for c in range(1, 9):
        ws2.cell(30, c).font = Font(name="Segoe UI", size=11, bold=True, color=navy_dark)
        ws2.cell(30, c).fill = fill_highlight_gold
        ws2.cell(30, c).border = total_border

    # ═════════════════════════════════════════════════════════════════════════
    # SHEET 3: QUYỀN LỢI PRO & SO SÁNH (FEATURES & COMPARISON)
    # ═════════════════════════════════════════════════════════════════════════
    ws3 = wb.create_sheet(title="3. Quyền Lợi Gói Pro")
    ws3.views.sheetView[0].showGridLines = True

    ws3.merge_cells("A1:F1")
    ws3["A1"] = "SO SÁNH TÍNH NĂNG VÀ QUYỀN LỢI CỦA GÓI PRO TRÊN RAILWAY"
    ws3["A1"].font = font_title
    ws3["A1"].fill = fill_title
    ws3["A1"].alignment = align_center
    ws3.row_dimensions[1].height = 36

    headers_features = ["STT", "Hạng Mục Đánh Giá", "Gói Hobby ($5/tháng)", "Gói PRO ($20/tháng)", "Render Trả Phí", "Ý Nghĩa Với Hệ Thống TMS"]
    for col_idx, h in enumerate(headers_features, 1):
        cell = ws3.cell(3, col_idx, h)
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = align_center
        cell.border = header_border
    ws3.row_dimensions[3].height = 28

    data_features = [
        (1, "Số Người Quản Trị (Team Seats)", "Chỉ 1 người duy nhất (Bị khóa mời)", "KHÔNG GIỚI HẠN (Unlimited Seats, 0đ phụ phí)", "Tùy gói workspace ($25/tháng)", "Cho phép cả team dev, quản trị viên, QA cùng vào xem log"),
        (2, "Môi Trường Riêng Biệt (Dev & Prod)", "Có thể tạo nhưng không phân quyền được", "Hỗ trợ Environment RBAC (Khóa bảo mật Prod)", "Phải tạo các service rời rạc", "Cách ly 100% dữ liệu thử nghiệm, tránh dev làm hỏng dữ liệu prod"),
        (3, "Hạ Tầng Tự Động Hóa n8n Workflow", "Bị giới hạn tài nguyên và private network", "✅ Chạy n8n 24/7 với PostgreSQL riêng biệt 100% (cách ly hoàn toàn khỏi TMS DB)", "⚠️ Tính phí thêm $7 - $15/tháng cho n8n instance", "Tự động hóa Webhook, Bot Telegram, ZNS mà không lo đầy hay nghẽn DB của TMS"),
        (4, "Độ Trễ Mạng (Network Latency)", "Có Singapore Datacenter", "Singapore Datacenter + Private Wireguard Mesh", "Singapore Datacenter", "Server đặt tại Singapore giúp ping về VN cực nhanh (~20-30ms)"),
        (5, "Hiện Tượng Ngủ Đông (Cold Start)", "Không ngủ đông (Always-on)", "Không ngủ đông (Always-on)", "Free bị ngủ 50s, Paid không ngủ", "Điều độ và Thủ kho mở trang là tải tức thì, không chờ đợi"),
        (6, "Tốc Độ Build (Build Infrastructure)", "Build runner chuẩn", "Priority Build Runner (Nhanh gấp 2-3 lần)", "Build chuẩn", "Triển khai tính năng mới từ GitHub lên Dev chỉ mất 1-2 phút"),
        (7, "Cơ Chế Phân Quyền (RBAC)", "Không hỗ trợ", "Admin, Member, Deployer + Environment Lock", "Cơ bản", "Bảo vệ các biến môi trường nhạy cảm (JWT Secret, DB Password)"),
        (8, "Dung Lượng Giới Hạn (Limits)", "Tối đa 8 vCPU, 8GB RAM", "Tối đa 32 vCPU, 64GB RAM", "Cố định theo gói", "Dễ dàng nâng cấp khi lượng đơn hàng và xe tăng trưởng"),
        (9, "Cam Kết Chất Lượng (SLA)", "Cộng đồng hỗ trợ", "99.9% Uptime SLA + Support ưu tiên", "Có SLA ở gói cao", "Đảm bảo tính sẵn sàng cao cho hoạt động logistics xuyên suốt"),
    ]

    for row_idx, row in enumerate(data_features, 4):
        ws3.row_dimensions[row_idx].height = 26
        fill_row = fill_zebra if row_idx % 2 == 0 else PatternFill(fill_type=None)
        ws3.cell(row_idx, 1, row[0]).alignment = align_center
        ws3.cell(row_idx, 2, row[1]).alignment = align_left
        ws3.cell(row_idx, 3, row[2]).alignment = align_left
        ws3.cell(row_idx, 4, row[3]).alignment = align_left
        ws3.cell(row_idx, 5, row[4]).alignment = align_left
        ws3.cell(row_idx, 6, row[5]).alignment = align_left
        for c in range(1, 7):
            ws3.cell(row_idx, c).font = font_regular
            ws3.cell(row_idx, c).border = cell_border
            if c == 4:
                ws3.cell(row_idx, c).fill = fill_highlight_green
                ws3.cell(row_idx, c).font = font_bold
            elif fill_row.fill_type:
                ws3.cell(row_idx, c).fill = fill_row

    # ═════════════════════════════════════════════════════════════════════════
    # SHEET 4: KẾ HOẠCH TRIỂN KHAI (ROADMAP)
    # ═════════════════════════════════════════════════════════════════════════
    ws4 = wb.create_sheet(title="4. Kế Hoạch Chuyển Đổi")
    ws4.views.sheetView[0].showGridLines = True

    ws4.merge_cells("A1:E1")
    ws4["A1"] = "KẾ HOẠCH TRIỂN KHAI & CHUYỂN ĐỔI HẠ TẦNG SANG RAILWAY PRO (KÈM N8N)"
    ws4["A1"].font = font_title
    ws4["A1"].fill = fill_title
    ws4["A1"].alignment = align_center
    ws4.row_dimensions[1].height = 36

    headers_roadmap = ["Bước", "Giai Đoạn", "Hành Động Cụ Thể", "Thời Gian Dự Kiến", "Tiêu Chí Nghiệm Thu (DoD)"]
    for col_idx, h in enumerate(headers_roadmap, 1):
        cell = ws4.cell(3, col_idx, h)
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = align_center
        cell.border = header_border
    ws4.row_dimensions[3].height = 28

    data_roadmap = [
        ("Bước 1", "Khởi Tạo Project & Cụm Dev", "• Tạo Project 'logistics-tms' tại Singapore trên Railway\n• Kích hoạt Gói Pro\n• Tạo Environment 'dev', thêm PostgreSQL & Redis", "1 - 2 giờ", "✅ Project sẵn sàng, kết nối private database nội bộ thông suốt"),
        ("Bước 2", "Deploy Backend & Frontend Dev", "• Kết nối GitHub repo 'backend' (branch dev) -> Dockerfile.prod\n• Kết nối GitHub repo 'frontend' (branch dev) -> Dockerfile standalone\n• Chạy migration và seed dữ liệu khởi tạo", "2 - 3 giờ", "✅ Dev API chạy 200 OK tại domain Railway, Frontend kết nối thành công"),
        ("Bước 3", "Dựng Cụm Tự Động Hóa n8n (PostgreSQL Riêng)", "• Tạo service PostgreSQL riêng biệt 'postgres-n8n' (150MB RAM, 2GB SSD)\n• Kéo Docker image 'n8nio/n8n:latest' (cấu hình ~250MB RAM)\n• Cấu hình n8n kết nối vào 'postgres-n8n' (cách ly 100% khỏi TMS DB)\n• Thiết lập Webhook đón sự kiện đơn hàng & Telegram Bot", "30 - 45 phút", "✅ n8n chạy độc lập với DB riêng, kiểm tra webhook nhận tin nhắn Telegram tự động thành công"),
        ("Bước 4", "Kiểm Thử Toàn Diện (E2E Test)", "• Chạy bộ Playwright E2E Test tự động kiểm tra toàn bộ luồng\n• Đo lường độ trễ mạng, mức tiêu thụ RAM/CPU thực tế cả cụm TMS & n8n", "1 - 2 giờ", "✅ 100% Test Case đạt PASS trên Domain Dev mới của Railway"),
        ("Bước 5", "Nhân Bản Cụm Production & Cutover", "• Duplicate Environment sang 'production' (nhánh 'master')\n• Cấu hình PostgreSQL Prod riêng biệt\n• Trỏ Custom Domain chính thức và tắt các service trên Render", "1 - 2 giờ", "✅ Hệ thống chính thức chạy trên Railway, hoàn tất chuyển đổi 0 downtime"),
    ]

    for row_idx, row in enumerate(data_roadmap, 4):
        ws4.row_dimensions[row_idx].height = 44
        fill_row = fill_zebra if row_idx % 2 == 0 else PatternFill(fill_type=None)
        ws4.cell(row_idx, 1, row[0]).alignment = align_center
        ws4.cell(row_idx, 2, row[1]).alignment = align_left
        ws4.cell(row_idx, 3, row[2]).alignment = align_left
        ws4.cell(row_idx, 4, row[3]).alignment = align_center
        ws4.cell(row_idx, 5, row[4]).alignment = align_left
        for c in range(1, 6):
            ws4.cell(row_idx, c).font = font_regular
            ws4.cell(row_idx, c).border = cell_border
            if fill_row.fill_type:
                ws4.cell(row_idx, c).fill = fill_row

    # Auto adjust column widths for all sheets
    for ws in wb.worksheets:
        for col in ws.columns:
            max_len = 0
            col_letter = get_column_letter(col[0].column)
            for cell in col:
                if cell.coordinate in ws.merged_cells:
                    continue
                val_str = str(cell.value or '')
                if '\n' in val_str:
                    lines = val_str.split('\n')
                    val_str = max(lines, key=len)
                max_len = max(max_len, len(val_str))
            ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

    # Specific fine-tuning widths
    ws1.column_dimensions['A'].width = 8
    ws1.column_dimensions['B'].width = 38
    ws1.column_dimensions['C'].width = 16
    ws1.column_dimensions['D'].width = 46
    ws1.column_dimensions['E'].width = 24
    ws1.column_dimensions['F'].width = 22
    ws1.column_dimensions['G'].width = 46

    ws2.column_dimensions['A'].width = 8
    ws2.column_dimensions['B'].width = 26
    ws2.column_dimensions['C'].width = 16
    ws2.column_dimensions['D'].width = 18
    ws2.column_dimensions['E'].width = 22
    ws2.column_dimensions['F'].width = 30
    ws2.column_dimensions['G'].width = 24
    ws2.column_dimensions['H'].width = 20

    ws3.column_dimensions['A'].width = 8
    ws3.column_dimensions['B'].width = 34
    ws3.column_dimensions['C'].width = 30
    ws3.column_dimensions['D'].width = 38
    ws3.column_dimensions['E'].width = 28
    ws3.column_dimensions['F'].width = 46

    ws4.column_dimensions['A'].width = 10
    ws4.column_dimensions['B'].width = 26
    ws4.column_dimensions['C'].width = 54
    ws4.column_dimensions['D'].width = 18
    ws4.column_dimensions['E'].width = 50

    output_path = "BAO_GIA_CHI_PHI_RAILWAY_PRO_DEV_PRO_TMS.xlsx"
    wb.save(output_path)
    print(f"✅ Excel generated successfully at: {output_path}")

if __name__ == "__main__":
    build_excel_report()
