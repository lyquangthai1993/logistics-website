import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ImageRun,
  ShadingType,
  Footer,
  Header,
  PageNumber,
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DOCX = path.join(ROOT_DIR, 'docs', 'user-guide', 'BAO_CAO_NGHIEP_VU_CHUYEN_XE_LUAN_CHUYEN.docx');

const NAVY = '0F3D62';
const BLUE = '1D4ED8';
const EMERALD = '059669';
const TEXT_DARK = '1E293B';
const TEXT_MUTED = '64748B';

// Helper to get image buffer
function getImageBuffer(relPath) {
  const fullPath = path.resolve(ROOT_DIR, relPath);
  if (fs.existsSync(fullPath)) {
    return fs.readFileSync(fullPath);
  }
  console.warn(`Image not found: ${fullPath}`);
  return null;
}

function getImageDimensions(buf) {
  if (buf && buf.length >= 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    return { width, height };
  }
  // JPEG check
  if (buf && buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2;
    while (offset < buf.length - 8) {
      if (buf[offset] !== 0xff) break;
      const marker = buf[offset + 1];
      if (marker === 0xc0 || marker === 0xc2) {
        const height = buf.readUInt16BE(offset + 5);
        const width = buf.readUInt16BE(offset + 7);
        return { width, height };
      }
      const len = buf.readUInt16BE(offset + 2);
      offset += 2 + len;
    }
  }
  return { width: 1440, height: 900 };
}

function calculateImageDimensions(buf, maxWidth = 540, maxHeight = 330) {
  const { width: origWidth, height: origHeight } = getImageDimensions(buf);
  let targetWidth = maxWidth;
  let targetHeight = Math.round((origHeight / origWidth) * targetWidth);

  if (targetHeight > maxHeight) {
    targetHeight = maxHeight;
    targetWidth = Math.round((origWidth / origHeight) * targetHeight);
  }

  return { width: targetWidth, height: targetHeight };
}

function createImageBlock(relPath, caption) {
  const buf = getImageBuffer(relPath);
  if (!buf) {
    return [
      new Paragraph({
        children: [new TextRun({ text: `[Ảnh: ${caption} không tìm thấy]`, italics: true, color: 'EF4444' })],
      }),
    ];
  }

  const { width, height } = calculateImageDimensions(buf, 540, 320);

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 140, after: 40 },
      keepWithNext: true,
      children: [
        new ImageRun({
          data: buf,
          transformation: { width, height },
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 20, after: 140 },
      children: [
        new TextRun({
          text: `📸 ${caption}`,
          italics: true,
          size: 18, // 9pt
          color: TEXT_MUTED,
          font: 'Segoe UI',
        }),
      ],
    }),
  ];
}

function createTitle(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 32, // 16pt
        color: NAVY,
        font: 'Segoe UI',
      }),
    ],
  });
}

function createSubtitle(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 260 },
    children: [
      new TextRun({
        text,
        italics: true,
        size: 20, // 10pt
        color: TEXT_MUTED,
        font: 'Segoe UI',
      }),
    ],
  });
}

function createHeading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 280, after: 100 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 24, // 12pt
        color: NAVY,
        font: 'Segoe UI',
      }),
    ],
  });
}

function createHeading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 180, after: 60 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 21, // 10.5pt
        color: BLUE,
        font: 'Segoe UI',
      }),
    ],
  });
}

function createBullet(title, desc) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 40, after: 40 },
    children: [
      new TextRun({
        text: title + ': ',
        bold: true,
        color: NAVY,
        font: 'Segoe UI',
        size: 20,
      }),
      new TextRun({
        text: desc,
        color: TEXT_DARK,
        font: 'Segoe UI',
        size: 20,
      }),
    ],
  });
}

function createParagraph(text) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [
      new TextRun({
        text,
        color: TEXT_DARK,
        font: 'Segoe UI',
        size: 20,
      }),
    ],
  });
}

async function main() {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, bottom: 1000, left: 1200, right: 1200 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'SPIDER EXPRESS TMS — BÁO CÁO NGHIỆP VỤ CHUYẾN XE LUÂN CHUYỂN',
                    size: 16,
                    color: TEXT_MUTED,
                    font: 'Segoe UI',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: ['Trang ', PageNumber.CURRENT, ' / ', PageNumber.TOTAL_PAGES],
                    size: 16,
                    color: TEXT_MUTED,
                    font: 'Segoe UI',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          createTitle('BÁO CÁO TỔNG KẾT NGHIỆP VỤ CHUYẾN XE LUÂN CHUYỂN'),
          createSubtitle('Góc nhìn Vận hành Thực tế — Tổng quản lý Kho vận (10 năm kinh nghiệm khai thác & điều phối)'),

          createHeading1('1. BẢN CHẤT NGHIỆP VỤ TRUNG CHUYỂN LIÊN HUB'),
          createParagraph(
            'Chuyến xe luân chuyển là các tuyến vận tải đường dài bằng xe tải trọng lớn/container kết nối trực tiếp giữa các Tổng kho vùng (Polaris Hưng Yên, Magellan Đà Nẵng, Andromeda TP.HCM) và các Trạm xe bo cấp 2. Đây là luồng hàng thông chuyển nhanh (Cross-dock / Short-stay), quản lý thuần túy theo kiện hàng vận tải, số kg, số khối (m3); không chia ô kệ lưu kho (Bin/Rack) và không quản lý mã SKU chi tiết.'
          ),

          createHeading1('2. GIAI ĐOẠN 1: CHUẨN BỊ & ĐÓNG HÀNG XUẤT BÃI (HUB XUẤT)'),
          createHeading2('2.1. Bảng điều độ xuất kho & Lựa chọn hình thức Luân chuyển liên Hub'),
          createParagraph(
            'Thủ kho tại Hub gửi mở Bảng điều độ xuất kho, chọn hình thức Luân chuyển nội bộ (Mode 2) và chỉ định Hub đích đến (Hub Cấp 1 hoặc Tuyến xe bo Cấp 2).'
          ),
          ...createImageBlock(
            'docs/user-guide/screenshots/interhub-transfer/01_KhoA_Bang_Xuat_Kho.png',
            'Hình 1: Bảng điều độ xuất kho tại Kho A (Hub gửi) — Lọc danh sách hàng lưu kho và các chuyến xe xuất'
          ),
          ...createImageBlock(
            'docs/user-guide/screenshots/interhub-transfer/02_KhoA_Chon_Mode_Luan_Chuyen.png',
            'Hình 2: Chọn hình thức Luân chuyển nội bộ (Mode 2) và chỉ định Hub đích đến trong mạng lưới'
          ),

          createHeading2('2.2. Lựa chọn đơn hàng bốc lên xe luân chuyển (Hàng lưu kho & Đơn nháp)'),
          createBullet('Gom hàng lưu kho', 'Tích chọn các đơn hàng đã nhập kho chính thức (LƯU KHO).'),
          createBullet('Gom đơn nháp bốc sớm', 'Cho phép chọn cả các lô hàng nháp đang làm thủ tục nhập bãi (DRAFT), có hiển thị biển số xe nhập dự kiến để bốc xếp không nhầm lẫn.'),
          createBullet('Tách lô xuất từng phần (Partial Outbound)', 'Lô 100 kiện nhưng xe chỉ chứa được 60 kiện thì cho xuất 60 kiện, 40 kiện còn lại giữ nguyên tồn khả dụng an toàn.'),
          ...createImageBlock(
            'docs/user-guide/screenshots/interhub-transfer/03_KhoA_Chon_10_Don_Hang.png',
            'Hình 3: Lưới chọn các đơn hàng đang lưu kho để bốc lên xe luân chuyển'
          ),
          ...createImageBlock(
            'feedbacks/feedback_14_10_task_80/screenshot_01_verified.png',
            'Hình 4: Cơ chế gán đơn hàng nháp vào chuyến xuất (Task #80) — Hiển thị "Biển số xe nhập dự kiến" trước khi xuất bãi'
          ),

          createHeading2('2.3. Khóa thông tin phương tiện, tài xế, Xác nhận xuất bến & In Phiếu Xuất (PXK)'),
          createParagraph(
            'Thủ kho nhập biển kiểm soát xe trung chuyển, họ tên tài xế, thời gian khởi hành dự kiến và bấm Xác nhận xuất kho. Hệ thống tự động sinh mã chuyến xe luân chuyển (ví dụ: TX-HCM-...), trừ tồn khả dụng tại kho gửi và xuất Phiếu Xuất Kho (PXK).'
          ),
          ...createImageBlock(
            'docs/user-guide/screenshots/interhub-transfer/04_KhoA_Xac_Nhan_Xuat_Ben.png',
            'Hình 5: Khóa thông tin phương tiện, tài xế và xác nhận xuất bến'
          ),
          ...createImageBlock(
            'docs/user-guide/screenshots/interhub-transfer/05_KhoA_Xuat_Thanh_Cong.png',
            'Hình 6: Xác nhận xuất kho thành công — Mã chuyến xe được tạo, hàng hóa chuyển sang trạng thái "Đang luân chuyển"'
          ),
          ...createImageBlock(
            'feedbacks/feedback_14_10_task_78/tham_chieu_phieu_xuat_kho_sau_khi_tao.png',
            'Hình 7: Phiếu Xuất Kho (PXK) khổ A4 chuẩn hóa (Task #78) — Đầy đủ mã vạch, thông tin phương tiện, tài xế và danh sách kiện hàng'
          ),

          createHeading1('3. GIAI ĐOẠN 2: TÁC NGHIỆP TRÊN ĐƯỜNG CHẠY & TRẠM TRUNG GIAN'),
          createBullet(
            'Bốc hàng dọc đường (En-route Cargo Pickup)',
            'Xe đang chạy ngang trạm/Hub phụ dọc quốc lộ, thủ kho tại trạm dọc đường được phép mở mã chuyến xe đang chạy để bốc thêm hàng gom phát sinh gửi ké vào cùng chuyến xe.'
          ),
          createBullet(
            'Trung chuyển nhiều chặng (Multi-stop Transit)',
            'Xe ghé trạm giữa (ví dụ trạm Đà Nẵng): dỡ các kiện trả cho miền Trung, đồng thời bốc thêm hàng tồn kho Đà Nẵng chất tiếp lên xe để tiếp tục hành trình vào TP.HCM.'
          ),
          ...createImageBlock(
            'docs/user-guide/screenshots/interhub-transfer/11_KhoB_Nhap_Them_4_Dong_Moi.png',
            'Hình 8: Tác nghiệp bốc bổ sung các đơn hàng phát sinh dọc đường vào chuyến xe đang lưu thông'
          ),

          createHeading1('4. GIAI ĐOẠN 3: TIẾP NHẬN & DỠ HÀNG CẬP CỬA DOCK (HUB NHẬN)'),
          createHeading2('4.1. Bảng theo dõi xe luân chuyển đến bãi theo thời gian thực'),
          createParagraph(
            'Thủ kho tại Hub đích theo dõi Bảng điều phối nhập kho, hệ thống phân loại riêng Tab Luân chuyển để nhận diện các chuyến xe tải lớn sắp cập bến, dự kiến đến lúc mấy giờ, chở bao nhiêu kiện để bố trí công nhân bốc xếp và xe nâng chờ sẵn ở cửa dock.'
          ),
          ...createImageBlock(
            'docs/user-guide/screenshots/interhub-transfer/06_KhoB_Bang_Nhap_Kho.png',
            'Hình 9: Bảng theo dõi các chuyến xe luân chuyển đang trên đường đến Hub đích'
          ),

          createHeading2('4.2. Tiếp nhận chuyến xe cập bến & Chọn đơn dỡ hàng'),
          createParagraph(
            'Khi xe lùi vào cửa dock mở niêm chì, thủ kho mở chi tiết chuyến xe để đối soát toàn bộ danh sách kiện hàng có trên xe. Hỗ trợ dỡ toàn bộ hoặc dỡ một phần số kiện chỉ định cho trạm hiện tại.'
          ),
          ...createImageBlock(
            'docs/user-guide/screenshots/interhub-transfer/07_KhoB_Modal_Chon_Chuyen_TRIP.png',
            'Hình 10: Tiếp nhận chuyến xe luân chuyển cập bến cửa dock Kho B'
          ),
          ...createImageBlock(
            'docs/user-guide/screenshots/interhub-transfer/08_KhoB_Modal_Danh_Sach_10_Don.png',
            'Hình 11: Danh sách đầy đủ các đơn hàng trên xe vận chuyển'
          ),
          ...createImageBlock(
            'docs/user-guide/screenshots/interhub-transfer/09_KhoB_Modal_Chi_Chon_2_Don.png',
            'Hình 12: Cho phép chọn dỡ toàn bộ hoặc dỡ một phần số kiện chỉ định cho trạm hiện tại'
          ),

          createHeading2('4.3. Kiểm đếm dỡ hàng thực tế (Bảng kê Tally Sheet) & Chốt chặn an toàn'),
          createParagraph(
            'Thủ kho cầm bảng kiểm đếm đối chiếu trực tiếp: Hàng trên phiếu gửi đi bao nhiêu kiện - Hàng dỡ xuống sàn thực tế bao nhiêu kiện. Ghi nhận tình trạng rách bao bì, móp méo, ướt kiện hoặc thiếu kiện ngay trên từng dòng hàng.'
          ),
          ...createImageBlock(
            'docs/user-guide/screenshots/interhub-transfer/10_KhoB_Luoi_Kiem_Dem_2_Don.png',
            'Hình 13: Bảng kiểm đếm dỡ hàng (Tally Sheet) thực tế tại cửa dock — So sánh số kiện gửi và thực nhận'
          ),
          createParagraph(
            'Chốt chặn nghiệp vụ mới nhất (Task #83): Khi chuyến xe còn ở trạng thái "Chờ xử lý" (hàng chưa dỡ xong), hệ thống ẩn hoàn toàn nút "In phiếu nhập" để tránh in phiếu khống khi hàng chưa vào kho.'
          ),
          ...createImageBlock(
            'feedbacks/feedback_15_10_task_83/screenshot_01_verified.png',
            'Hình 14: Chốt chặn an toàn mới nhất (Task #83) — Ẩn nút "In phiếu nhập" khi chuyến xe ở trạng thái Chờ xử lý (hàng chưa dỡ)'
          ),
          ...createImageBlock(
            'docs/user-guide/screenshots/interhub-transfer/12_KhoB_Tiep_Nhan_Thanh_Cong.png',
            'Hình 15: Hoàn tất dỡ hàng nhập kho thành công — Số kiện tự động ghi nhận vào tồn kho Hub đích'
          ),
          ...createImageBlock(
            'feedbacks/feedback_14_10_task_78/mau_phieu_nhap_kho.JPG',
            'Hình 16: Mẫu Phiếu Nhập Kho (PNK) khổ A4 thực tế (Task #78) — Bằng chứng đối soát pháp lý nhận hàng'
          ),

          createHeading1('5. GIAI ĐOẠN 4: QUẢN TRỊ NGOẠI LỆ & BẢO VỆ THAO TÁC SÀN BÃI'),
          createHeading2('5.1. Cơ chế Quản trị viên Mở lại / Rollback chuyến xe (Task #81)'),
          createParagraph(
            'Làm việc lúc cao điểm nửa đêm, nhân viên kho rất dễ bấm nhầm hoàn tất khi hàng chưa dỡ xong. Cấp Quản lý (SUPER_ADMIN) được trang bị tính năng Rollback / Mở lại chuyến xe: tự động hoàn tác trạng thái chuyến xe về "Chờ xử lý" và đảo ngược số lượng tồn kho tương ứng một cách an toàn mà không làm rối sổ sách.'
          ),
          ...createImageBlock(
            'feedbacks/feedback_14_10_task_81/screenshot_01_verified.png',
            'Hình 17: Nút "Mở lại chuyến xe (Rollback)" dành riêng cho Quản trị viên (Task #81) — Hoàn tác trạng thái và tồn kho'
          ),

          createHeading2('5.2. Khóa an toàn & Thanh tác vụ ghim dưới đáy trên thiết bị di động (Task #71)'),
          createParagraph(
            'Khi nhân viên cầm điện thoại ra ngoài cửa dock kiểm tra thông tin, hệ thống tự động khóa các nút xóa đơn, sửa đơn và ghim cố định thanh tác vụ dưới đáy màn hình để tránh việc quẹt nhầm tay làm mất dữ liệu chuyến xe.'
          ),
          ...createImageBlock(
            'feedbacks/feedback_14_10_task_71/screenshot_01_mobile_sticky_readonly_verified.png',
            'Hình 18: Giao diện bảo vệ thao tác trên thiết bị di động (Task #71) — Khóa sửa xóa nhạy cảm tại bãi xe'
          ),

          createHeading1('6. TỔNG KẾT NGUYÊN TẮC QUẢN TRỊ BÃI XE'),
          createBullet('Chống âm kho tuyệt đối', 'Tồn thực = Nhập - (Xuất lẻ + Xuất luân chuyển). Không bao giờ cho phép xuất vượt quá số lượng kiện thực tế đang có dưới sàn kho.'),
          createBullet('Cách ly dữ liệu kho (Hub Isolation)', 'Kho nào chỉ thấy và thao tác hàng của kho đó, tránh nhầm lẫn giữa các Hub.'),
          createBullet('Quy chuẩn kiện vận tải', 'Quản lý gọn gàng theo kiện, kg, khối; tối đa hóa tốc độ giải phóng cửa dock bãi xe.'),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUTPUT_DOCX, buffer);
  console.log(`Successfully generated DOCX with all 18 embedded screenshots at: ${OUTPUT_DOCX}`);
}

main().catch(console.error);
