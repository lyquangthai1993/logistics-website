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
  PageNumber,
  Footer,
  Header,
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const SCREENSHOT_DIR = path.join(ROOT_DIR, 'docs', 'user-guide', 'screenshots', 'interhub-transfer');
const OUTPUT_DOCX = path.join(ROOT_DIR, 'docs', 'user-guide', 'HUONG_DAN_SU_DUNG_LUAN_CHUYEN_VA_NHAP_KHO_LIEN_HUB.docx');

// Helper to safely load image buffer
function getImage(filename) {
  const filePath = path.join(SCREENSHOT_DIR, filename);
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath);
  }
  console.warn(`Image not found: ${filePath}`);
  return null;
}

// Color Palette Constants
const NAVY = '0F3D62';
const BLUE = '1D4ED8';
const EMERALD = '059669';
const TEXT_MUTED = '64748B';

function createHeading1(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 350, after: 120 },
    run: {
      color: NAVY,
      bold: true,
      size: 26, // 13pt
      font: 'Segoe UI',
    },
  });
}

function createHeading2(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 250, after: 80 },
    run: {
      color: BLUE,
      bold: true,
      size: 22, // 11pt
      font: 'Segoe UI',
    },
  });
}

function createBody(text, options = {}) {
  return new Paragraph({
    spacing: { before: 40, after: 60 },
    children: [
      new TextRun({
        text: text,
        size: 20, // 10pt
        font: 'Segoe UI',
        color: options.color || '1E293B',
        bold: options.bold || false,
        italics: options.italics || false,
      }),
    ],
  });
}

function createStepAction(label, description) {
  return new Paragraph({
    spacing: { before: 40, after: 50 },
    children: [
      new TextRun({
        text: `• ${label}: `,
        bold: true,
        size: 20,
        font: 'Segoe UI',
        color: NAVY,
      }),
      new TextRun({
        text: description,
        size: 20,
        font: 'Segoe UI',
        color: '334155',
      }),
    ],
  });
}

function createTipBox(text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      left: { style: BorderStyle.SINGLE, size: 24, color: EMERALD },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: 'F0FDF4', type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 140, right: 140 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: '💡 Lưu ý thao tác: ',
                    bold: true,
                    color: EMERALD,
                    size: 19,
                    font: 'Segoe UI',
                  }),
                  new TextRun({
                    text: text,
                    size: 19,
                    font: 'Segoe UI',
                    color: '1E293B',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function createImageBox(imageFilename, caption) {
  const buf = getImage(imageFilename);
  if (!buf) {
    return [createBody(`[Ảnh: ${caption} không tìm thấy]`, { italics: true, color: 'EF4444' })];
  }

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 40 },
      children: [
        new ImageRun({
          data: buf,
          transformation: {
            width: 580,
            height: 326, // 16:9 ratio
          },
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 140 },
      children: [
        new TextRun({
          text: `Hình ảnh minh họa: ${caption}`,
          italics: true,
          size: 17, // 8.5pt
          color: TEXT_MUTED,
          font: 'Segoe UI',
        }),
      ],
    }),
  ];
}

async function buildDocx() {
  console.log('Building hands-on User Guide Document...');

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Segoe UI',
            size: 20,
            color: '1E293B',
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1000,
              right: 1000,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'HƯỚNG DẪN THAO TÁC: XUẤT LUÂN CHUYỂN & NHẬP KHO DỠ MỘT PHẦN',
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
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Trang ',
                    size: 16,
                    color: TEXT_MUTED,
                    font: 'Segoe UI',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 16,
                    color: TEXT_MUTED,
                    font: 'Segoe UI',
                  }),
                  new TextRun({
                    text: ' / ',
                    size: 16,
                    color: TEXT_MUTED,
                    font: 'Segoe UI',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
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
          // ── TIÊU ĐỀ HƯỚNG DẪN ──
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 50 },
            children: [
              new TextRun({
                text: 'HƯỚNG DẪN THAO TÁC NGƯỜI DÙNG',
                bold: true,
                size: 28, // 14pt
                color: NAVY,
                font: 'Segoe UI',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 150 },
            children: [
              new TextRun({
                text: 'QUY TRÌNH XUẤT LUÂN CHUYỂN LIÊN HUB &\nTIẾP NHẬN DỠ HÀNG MỘT PHẦN KÈM BỔ SUNG ĐƠN MỚI DỌC ĐƯỜNG',
                bold: true,
                size: 22,
                color: BLUE,
                font: 'Segoe UI',
              }),
            ],
          }),
          createBody(
            'Tài liệu này hướng dẫn chi tiết từng bước thực hiện trên phần mềm cho Thủ kho khi lập phiếu xuất luân chuyển từ Kho xuất (Kho A - Hưng Yên) và thao tác tiếp nhận dỡ hàng một phần kèm nhập thêm các đơn gom dọc đường tại Kho nhận (Kho B - Đà Nẵng).',
            { italics: true, color: '475569' }
          ),

          new Paragraph({ spacing: { before: 150, after: 50 } }),

          // ══════════════════════════════════════════════════════════
          // ── PHẦN I: THAO TÁC TẠI KHO GỬI (KHO A - HƯNG YÊN) ──
          // ══════════════════════════════════════════════════════════
          createHeading1('PHẦN I: THAO TÁC TẠI KHO GỬI (KHO A - HƯNG YÊN)'),
          createBody('Thực hiện xuất luân chuyển 10 đơn hàng lưu kho sang Kho B (Đà Nẵng).'),

          createHeading2('Bước 1: Mở màn hình Xuất kho'),
          createStepAction('Thao tác', 'Đăng nhập vào hệ thống với tài khoản Quản lý Kho Hưng Yên. Trên menu bên trái, bấm chọn Kho Hàng ➔ Xuất kho.'),
          createStepAction('Màn hình', 'Giao diện hiển thị danh sách các đơn hàng hiện có trong kho kèm 4 thẻ chỉ số thống kê (CHỜ XUẤT KHO, XUẤT CHO KHÁCH HÀNG, LUÂN CHUYỂN NỘI BỘ, ĐÃ XUẤT KHO).'),
          createStepAction('Bộ lọc thời gian', 'Thanh công cụ tích hợp bộ lọc tìm kiếm theo ngày: Mặc định lọc từ đầu tháng đến ngày hiện tại (Từ ngày → Đến ngày), cho phép Thủ kho tra cứu linh hoạt theo khoảng thời gian mong muốn.'),
          ...createImageBox('01_KhoA_Bang_Xuat_Kho.png', 'Màn hình Bảng quản lý xuất kho tại Polaris Hub - Hưng Yên'),

          createHeading2('Bước 2: Chọn hình thức "Xuất luân chuyển nội bộ" và điền thông tin xe'),
          createStepAction('Thao tác', 'Bấm nút "Xuất luân chuyển nội bộ" (màu xanh lá) ở góc trên bên phải.'),
          createStepAction('Điền thông tin chuyến xe', 'Hệ thống chuyển sang Bước 1 của quy trình xuất luân chuyển. Điền các trường thông tin:'),
          createBody('    1. Hub nhận nội bộ: Chọn Magellan Hub - Đà Nẵng.'),
          createBody('    2. Ngày xuất kho: Chọn ngày xe chạy thực tế.'),
          createBody('    3. Biển số xe: Nhập biển số xe tải luân chuyển (Ví dụ: 29C-94527).'),
          createBody('    4. Họ tên tài xế: Nhập họ tên tài xế vận chuyển.'),
          createStepAction('Tiếp tục', 'Sau khi điền đủ 4 trường, bấm nút "Chọn hàng trong kho →" để sang Bước 2.'),
          ...createImageBox('02_KhoA_Chon_Mode_Luan_Chuyen.png', 'Form Bước 1: Chọn Hub đích Đà Nẵng và nhập biển số xe, tài xế'),

          createHeading2('Bước 3: Tích chọn 10 đơn hàng cần gửi đi'),
          createStepAction('Thao tác', 'Tại bảng danh sách đơn hàng lưu kho, tích chọn vào ô vuông đầu dòng của 10 đơn hàng cần gửi vào Đà Nẵng.'),
          createStepAction('Kiểm tra số liệu', 'Thanh thống kê ở phía dưới bảng sẽ tự động cộng tổng Số kiện, Tổng khối lượng (kg) và Tổng thể tích (m³) của 10 đơn đã chọn.'),
          createStepAction('Tiếp tục', 'Bấm nút "Xác nhận hàng đã chọn → Sang Bước 3".'),
          createTipBox('Có thể sử dụng ô tìm kiếm để lọc nhanh mã vận đơn hoặc tên loại hàng hóa cần xuất bến.'),
          ...createImageBox('03_KhoA_Chon_10_Don_Hang.png', 'Bảng Bước 2: Tích chọn 10 đơn hàng lưu kho và kiểm tra tổng tải trọng'),

          createHeading2('Bước 4: Kiểm tra lại danh sách hàng và thông tin chuyến xe'),
          createStepAction('Thao tác', 'Tại màn hình Bước 3, hệ thống hiển thị tóm tắt thông tin chuyến xe đã khóa cố định cùng bảng chi tiết 10 đơn hàng chuẩn bị bốc xếp lên xe.'),
          createStepAction('Tùy chọn in ấn', 'Thủ kho có thể bấm nút "In Loading Plan (A4 Ngang)" để in phiếu giao nhận hàng hóa cho tài xế ký nhận.'),
          ...createImageBox('04_KhoA_Xac_Nhan_Xuat_Ben.png', 'Giao diện Bước 3: Xem lại thông tin chuyến xe và danh sách 10 đơn hàng trước khi xuất bến'),

          createHeading2('Bước 5: Xác nhận xuất kho thành công'),
          createStepAction('Thao tác', 'Bấm nút "Xác nhận xuất kho luân chuyển" màu xanh dương ở góc phải.'),
          createStepAction('Kết quả', 'Hệ thống hiển thị thông báo xuất kho thành công. Chuyến xe được cấp mã quản lý tự động (TRIP-...), 10 đơn hàng chuyển sang trạng thái đang luân chuyển trên đường, và chỉ số "ĐÃ XUẤT KHO" được cập nhật.'),
          ...createImageBox('05_KhoA_Xuat_Thanh_Cong.png', 'Thông báo xác nhận xuất kho thành công và cập nhật số liệu kho Hưng Yên'),

          new Paragraph({ spacing: { before: 200, after: 50 } }),

          // ══════════════════════════════════════════════════════════
          // ── PHẦN II: THAO TÁC TẠI KHO NHẬN (KHO B - ĐÀ NẴNG) ──
          // ══════════════════════════════════════════════════════════
          createHeading1('PHẦN II: THAO TÁC TẠI KHO NHẬN (KHO B - ĐÀ NẴNG)'),
          createBody('Thực hiện tiếp nhận chuyến xe cập bến: Chỉ dỡ 2 đơn cần giao tại Đà Nẵng, đồng thời bổ sung thêm 4 đơn hàng mới gom thêm dọc đường.'),

          createHeading2('Bước 6: Mở màn hình Nhập kho tại Đà Nẵng'),
          createStepAction('Thao tác', 'Đăng nhập hệ thống với tài khoản Quản lý Kho Đà Nẵng. Chọn menu Kho Hàng ➔ Nhập kho.'),
          createStepAction('Màn hình', 'Bảng hiển thị giao diện nhập kho của Magellan Hub - Đà Nẵng cùng danh sách hàng hóa hiện tại.'),
          ...createImageBox('06_KhoB_Bang_Nhap_Kho.png', 'Giao diện Bảng Nhập Kho tại Hub nhận Magellan Hub - Đà Nẵng'),

          createHeading2('Bước 7: Bấm "Nhận luân chuyển nội bộ" và tìm chuyến xe vừa đến'),
          createStepAction('Thao tác', 'Bấm nút "Nhận luân chuyển nội bộ" ở thanh công cụ phía trên bên phải.'),
          createStepAction('Tìm chuyến xe', 'Hộp thoại Bước 1 hiện ra, liệt kê các chuyến xe luân chuyển đang trên đường đến Đà Nẵng. Nhập biển số xe vào ô tìm kiếm để xác định đúng chuyến xe vừa tới cửa kho.'),
          ...createImageBox('07_KhoB_Modal_Chon_Chuyen_TRIP.png', 'Hộp thoại Bước 1: Tra cứu và chọn chuyến xe luân chuyển đang cập bến'),

          createHeading2('Bước 8: Mở danh sách 10 đơn hàng có trên thùng xe'),
          createStepAction('Thao tác', 'Bấm nút "Chọn chuyến →" trên thẻ chuyến xe tương ứng.'),
          createStepAction('Màn hình', 'Hộp thoại chuyển sang Bước 2, hiển thị đầy đủ danh sách 10 đơn hàng đang có trên thùng xe do Kho Hưng Yên xuất đi.'),
          ...createImageBox('08_KhoB_Modal_Danh_Sach_10_Don.png', 'Hộp thoại Bước 2: Xem toàn bộ 10 đơn hàng có trên thùng xe tải'),

          createHeading2('Bước 9: Tích chọn đúng 2 đơn hàng cần dỡ tại Đà Nẵng'),
          createStepAction('Thao tác', 'Bỏ chọn ở ô "Chọn tất cả", sau đó chỉ tích chọn đúng 2 đơn hàng cần dỡ xuống kho Đà Nẵng.'),
          createStepAction('Xác nhận số lượng', 'Dòng thông báo hiển thị "Đã chọn 2 đơn hàng". 8 đơn hàng còn lại trên xe sẽ tiếp tục lưu thông đến các trạm đích kế tiếp.'),
          ...createImageBox('09_KhoB_Modal_Chi_Chon_2_Don.png', 'Hộp thoại Bước 2: Bỏ chọn tất cả và chỉ tích chọn đúng 2 đơn hàng cần dỡ xuống kho'),

          createHeading2('Bước 10: Đưa 2 đơn đã chọn vào Lưới kiểm đếm'),
          createStepAction('Thao tác', 'Bấm nút "Xác nhận dỡ hàng → Đưa vào kiểm đếm".'),
          createStepAction('Màn hình', 'Hộp thoại đóng lại và mở ra Lưới kiểm đếm nhập kho. Phía trên hiển thị Thẻ xe bị khóa cố định (Biển số xe, Tài xế, Xuất phát từ Hưng Yên ➔ Tiếp nhận tại Đà Nẵng) và bảng kiểm đếm chứa đúng 2 đơn hàng vừa dỡ từ xe.'),
          ...createImageBox('10_KhoB_Luoi_Kiem_Dem_2_Don.png', 'Lưới kiểm đếm hiển thị 2 đơn hàng được dỡ từ chuyến xe luân chuyển'),

          createHeading2('Bước 11: Bấm thêm dòng và nhập 4 đơn hàng gom thêm dọc đường'),
          createStepAction('Thêm dòng', 'Do trong lúc di chuyển tài xế đã lấy thêm hàng dọc đường, Thủ kho bấm nút "+ Thêm 1 dòng đơn mới" 4 lần để tạo thêm 4 dòng hàng mới.'),
          createStepAction('Nhập thông tin hàng gom', 'Tại 4 dòng mới, nhập các thông tin thực tế:'),
          createBody('    • Tên hàng hóa: Nhập mô tả hàng (VD: Thực phẩm chế biến đóng thùng, Phụ tùng cơ khí khuôn đúc, Vật tư may mặc, Thiết bị điện tử...).'),
          createBody('    • Số kiện: Nhập số lượng kiện hàng thực nhận.'),
          createBody('    • Số kg & Số m³: Nhập trọng lượng và thể tích tương ứng.'),
          createBody('    • Điểm đến / Ghi chú: Nhập địa chỉ giao hàng hoặc ghi chú xuất phát (Gom tại Thanh Hóa, Vinh, Hà Tĩnh, Đồng Hới).'),
          createStepAction('Tự động tính tổng', 'Thanh tổng hợp phía trên tự động cộng dồn số kiện, tải trọng và thể tích của toàn bộ 6 dòng hàng đang kiểm đếm.'),
          createTipBox('Cột Mã đơn hàng của 4 dòng mới hiển thị "(Tự sinh khi lưu)". Hệ thống sẽ tự động cấp mã vận đơn chính thức khi bấm lưu.'),
          ...createImageBox('11_KhoB_Nhap_Them_4_Dong_Moi.png', 'Lưới kiểm đếm sau khi bấm thêm 4 dòng và nhập đầy đủ thông tin hàng gom dọc đường'),

          createHeading2('Bước 12: Bấm "Xác nhận tiếp nhận & Lưu kho" để hoàn tất'),
          createStepAction('Thao tác', 'Kiểm tra lại lần cuối toàn bộ hàng hóa thực tế đã dỡ vào kho và bấm nút "Xác nhận tiếp nhận & Lưu kho".'),
          createStepAction('Kết quả hoàn tất', 'Hệ thống tự động thực hiện:'),
          createBody('    ✓ Chuyển 2 đơn hàng dỡ từ xe sang trạng thái LƯU KHO tại Kho Đà Nẵng.'),
          createBody('    ✓ Tự động cấp mã vận đơn chính thức cho 4 đơn gom thêm và ghi nhận trạng thái LƯU KHO.'),
          createBody('    ✓ Bảo toàn 8 đơn hàng còn lại trên chuyến xe để tài xế tiếp tục hành trình.'),
          createStepAction('Màn hình', 'Hệ thống hiển thị thông báo thành công và tự động chuyển về Bảng Nhập Kho với danh sách và số liệu tồn kho mới nhất.'),
          ...createImageBox('12_KhoB_Tiep_Nhan_Thanh_Cong.png', 'Bảng Nhập Kho hoàn tất: Dữ liệu 6 đơn hàng đã lưu kho an toàn và sẵn sàng xử lý tiếp theo'),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUTPUT_DOCX, buffer);
  console.log(`Successfully generated user-friendly DOCX Guide at: ${OUTPUT_DOCX}`);
}

buildDocx().catch((err) => {
  console.error('Error generating docx:', err);
  process.exit(1);
});
