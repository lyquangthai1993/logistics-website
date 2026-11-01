# 📋 TODO: Tính Năng Super Admin "Login As" — Đóng Vai Tài Khoản Người Dùng Tại Thanh Navbar & Bảng Người Dùng (Task #111)

> **Mã công việc**: `TASK-111-SUPER-ADMIN-LOGIN-AS`  
> **Phân hệ**: `Xác thực & Quản trị Người dùng (Auth & Users) - /api/v1/auth/login-as, /dashboard/users & Left Navbar (AppSidebar)`  
> **Chỉ đạo kiến trúc**: `/leader` & `/todo-agent` (Quy trình chuẩn 6 bước SDLC: `PLAN ➔ DESIGN ➔ BUILD ➔ TEST ➔ DEPLOY ➔ MAINTAIN`)  
> **Kiểm thử**: `/e2e-test-runner` & `/e2e-code-auditor` (Chế độ Kiểm thử 2 Tầng: Localhost Gate 1 ➔ Railway Cloud Dev Gate 2)  
> **Nhánh Git**: `feat/task-111-auth-login-as` & `feat/task-111-sidebar-login-as` (Base từ `dev` trên cả `backend` và `frontend`)  

---

## 📌 1. Bối Cảnh Vận Hành & Yêu Cầu Thực Tế (Operational Context & User Quotes)

1. **Nguyên văn yêu cầu từ người dùng (User Quotes)**:
   > *"làm 1 tính năng này đi /leader*  
   > *khi đăng nhập 1 tài khoản super admin, có tính năng "login as", nó như là cách đóng vai vào 1 tài khoản của user"*
   > *"đưa cái login as này vào thanh navbar đi, để trên header chiếm diện tích quá"*

2. **Đối tượng tác nghiệp & Nỗi đau vận hành (Operational Pain Points)**:
   - **Đối tượng sử dụng**: Quản trị viên cấp cao (`SUPER_ADMIN`).
   - **Bất cập hiện tại**:
     1. Khi cần kiểm tra dữ liệu kho theo phạm vi Hub (`Andromeda Hub - HCM`, `Polaris Hub - Hưng Yên`, `Magellan Hub - Đà Nẵng`), kiểm tra giao diện của Điều phối viên (`DISPATCHER`), hoặc hỗ trợ xử lý sự cố cho Quản lý đội xe (`FLEET_MANAGER`), `SUPER_ADMIN` phải đăng xuất khỏi tài khoản Admin, nhập lại mật khẩu của từng user, rồi sau đó lại phải đăng xuất và đăng nhập lại tài khoản Admin.
     2. Khi tài khoản của nhân viên đã đổi mật khẩu riêng, `SUPER_ADMIN` không biết mật khẩu của nhân viên để đăng nhập kiểm tra trực tiếp ngữ cảnh phân quyền và dữ liệu Hub-scoping của nhân viên đó.
   - **Giải pháp chuẩn hóa nghiệp vụ ("Login As" / Đóng vai người dùng)**:
     1. **API Đóng vai bảo mật (`POST /api/v1/auth/login-as/:userId` & `POST /api/v1/auth/login-as`)**: Chỉ dành riêng cho `SUPER_ADMIN` (`@Roles(RoleEnum.SUPER_ADMIN)`), khởi tạo phiên hợp lệ và cấp cặp `token` + `refreshToken` của tài khoản mục tiêu mà không cần biết mật khẩu của user đó (kèm thông tin truy vết `impersonatedBy` trong JWT).
     2. **Đặt gọn trong Thanh Navbar bên trái (`AppSidebar`) & Bảng Người dùng (`/dashboard/users`)**:
        - **Tại Thanh Navbar bên trái (`AppSidebar` ➔ `SidebarFooter`)**: Đặt nút **`Đóng vai (Login as)`** và mục trạng thái **`Đang đóng vai: [Tên User] / Thoát đóng vai (Về Admin)`** ngay phía trên khu vực tài khoản ở chân thanh Navbar bên trái, giữ cho thanh `Header` phía trên hoàn toàn thông thoáng, không tốn diện tích ngang.
        - **Tại bảng Quản lý Người dùng (`/dashboard/users`)**: Nút bấm trực tiếp **`Đóng vai`** (`Login as`) ngay trên dòng của từng user VÀ mục **`Đóng vai (Login as)`** trong menu thao tác (`...`).

---

## 🖼️ 2. Multimodal OCR & Khớp Tài Khoản Kiểm Thử Theo Hub (Hub-Scoped Account Selection)

- **Tài khoản khởi phát**: `USER_ADMIN` (`admin` — `SUPER_ADMIN`).
- **Tài khoản mục tiêu đóng vai kiểm thử**:
  - `USER_WAREHOUSE_HCM` (`warehouse_hcm` — Thủ kho `Andromeda Hub - HCM`).
  - `USER_DISPATCHER` (`dispatcher` — Điều phối viên).
  - `USER_FLEET` (`fleet` — Quản lý đội xe).

---

## 🔍 3. Phân Tích Kỹ Thuật & Kiến Trúc (Technical Design & RCA)

1. **Backend (`backend/src/auth/`)**:
   - `AuthController`: Bổ sung `POST /api/v1/auth/login-as/:userId` và `POST /api/v1/auth/login-as` bảo vệ bởi `@UseGuards(AuthGuard('jwt'), RolesGuard)` và `@Roles(RoleEnum.SUPER_ADMIN)`.
   - `AuthService`: Bổ sung phương thức `loginAs(adminJwtPayload: JwtPayloadType, targetUserId: User['id'])` kiểm tra quyền `RoleEnum.SUPER_ADMIN`, kiểm tra trạng thái hoạt động của tài khoản mục tiêu, khởi tạo `Session` và sinh cặp `token` + `refreshToken` kèm `impersonatedBy`.
2. **Frontend Auth Store & Token Manager (`frontend/src/stores/use-auth-store.ts`, `frontend/src/lib/token-manager.ts`)**:
   - Lưu trữ phiên gốc của `SUPER_ADMIN` vào `impersonator: { user, accessToken, refreshToken } | null` trong `useAuthStore` trước khi chuyển sang token của user mục tiêu.
   - Cung cấp hàm `tokenManager.notifyImpersonationStart(rawTargetUser, token, refreshToken)` và `tokenManager.notifyImpersonationStop()` đồng bộ cả `localStorage`, cookies (`access_token`, `refreshToken`) và chuyển hướng về đúng trang mặc định của vai trò (`getDefaultPathForRole`).
3. **Frontend UI (`frontend/src/components/layout/app-sidebar.tsx`, `frontend/src/components/layout/impersonation-control.tsx`, `frontend/src/features/users/components/users-table/cell-action.tsx`)**:
   - Tích hợp `ImpersonationControl` vào `SidebarFooter` của `AppSidebar` (thanh Navbar bên trái) và giữ `Header` sạch gọn 100%.
   - Bổ sung nút `Đóng vai` trên từng dòng bảng `/dashboard/users` và trong menu `CellAction`.

---

## ✅ 4. Danh Sách Đầu Việc Nguyên Tử (Atomic Task Checklist)

### 👤 Stage 1 & 2: PLAN (PM) & DESIGN (Architect)
- [x] **Task 1 (PM - Đặc tả `TODO.md`)**: Khởi tạo tài liệu `feedbacks/feedback_01_11_task_111_super_admin_login_as/TODO.md` với đầy đủ thiết kế kiến trúc, kịch bản E2E và 10 Edge Cases.
- [x] **Task 2 (Architect - Thiết kế vị trí Navbar & Bảo mật RBAC)**: Thiết kế `ImpersonationControl` nằm gọn trong `SidebarFooter` của thanh Navbar bên trái (`AppSidebar`) và phân quyền `SUPER_ADMIN` tại `AuthController`.

### 👤 Stage 3: BUILD (Engineer)
- [x] **Task 3 (Engineer - Khởi tạo nhánh Git trên Submodules)**: Tạo nhánh `feat/task-111-auth-login-as` và `feat/task-111-sidebar-login-as` từ `dev` trong `backend/` và `frontend/`.
- [x] **Task 4 (Engineer - Triển khai Backend API `login-as`)**: Bổ sung `loginAs` trong `backend/src/auth/auth.service.ts` và endpoint `POST /api/v1/auth/login-as/:userId` + `POST /api/v1/auth/login-as` trong `backend/src/auth/auth.controller.ts` với `@Roles(RoleEnum.SUPER_ADMIN)` và `@UseGuards(AuthGuard('jwt'), RolesGuard)`.
- [x] **Task 5 (Engineer - Nâng cấp `useAuthStore` & `tokenManager` hỗ trợ Impersonation)**: Lưu và khôi phục phiên `impersonator` trong `frontend/src/stores/use-auth-store.ts` và `frontend/src/lib/token-manager.ts`, bổ sung API helper `loginAsUser(userId)` trong `frontend/src/features/users/api/service.ts` và hỗ trợ `Authorization` header override trong `frontend/src/lib/api-client.ts`.
- [x] **Task 6 (Engineer - Tích hợp UI "Đóng vai (Login as)" tại Thanh Navbar `AppSidebar` & Bảng `/dashboard/users`)**:
  - Thêm nút bấm nhanh `Đóng vai` (`data-testid="btn-login-as-user-${id}"`) và mục menu `Đóng vai (Login as)` trong `frontend/src/features/users/components/users-table/cell-action.tsx`.
  - Tạo component `ImpersonationControl` (`frontend/src/components/layout/impersonation-control.tsx`) tích hợp vào `SidebarFooter` của `frontend/src/components/layout/app-sidebar.tsx` hiển thị: (1) Nút chọn nhanh `Đóng vai (Login as)`, và (2) Mục trạng thái `Đang đóng vai: ... / Thoát đóng vai (Về Admin)` (`data-testid="btn-exit-impersonation"`).
- [x] **Task 7 (Engineer - Kiểm tra biên dịch Backend & Frontend)**: Chạy `npm run build --prefix backend`, `tsc --noEmit` và `next build` đảm bảo 0 lỗi.

### 👤 Stage 4: TEST (QA — Kiểm thử 2 Tầng)
- [x] **Task 8 (QA - Viết & Chạy E2E Test Tầng 1 trên Localhost)**: Xây dựng và chạy `frontend/e2e/111-super-admin-login-as.spec.ts` kiểm chứng toàn trình: Super Admin đăng nhập ➔ Mở bộ chọn `Đóng vai (Login as)` trên thanh Navbar bên trái hoặc bảng `/dashboard/users` ➔ Đóng vai `warehouse_hcm` ➔ Kiểm tra chuyển sang giao diện Thủ kho HCM, hiển thị trạng thái `Đang đóng vai` trong thanh Navbar ➔ Kiểm tra non-admin không gọi được API `login-as` (403 Forbidden) ➔ Bấm `Thoát đóng vai` quay về Super Admin tức thì; chạy `node scripts/e2e-auditor.mjs frontend/e2e/111-super-admin-login-as.spec.ts` đạt 50/50 điểm.

### 👤 Stage 5 & 6: DEPLOY (Release) & MAINTAIN (Vận hành)
- [x] **Task 9 (Release - Commit, Push, Tạo & Merge PR lên `dev`)**: Commit và push nhánh trên cả `backend` (PR #22) và `frontend` (PR #27 & PR #28), tạo PR vào `dev` và auto-merge.
- [x] **Task 10 (QA & Vận hành - Chạy E2E Test Tầng 2 trên Railway Cloud Dev & Ghi Biên niên sử)**: Kiểm tra triển khai Railway Cloud Dev, chụp ảnh bằng chứng `screenshot_01_verified.png`, và chạy `npm run todo:record feedback_01_11_task_111_super_admin_login_as`.

---

## 🧪 Kịch bản Kiểm thử E2E Chuẩn xác & Ma trận Edge Cases

### Phần 1: Chuỗi Hành Động Kiểm Thử E2E Từng Bước (Step-by-Step E2E Action Sequence)

1. **Đăng nhập bằng `SUPER_ADMIN` (`admin`)**:
   - Sử dụng `loginAs(page, USER_ADMIN)`.
2. **Kiểm tra danh sách Người dùng (`/dashboard/users`) & Nút "Đóng vai" trên Navbar**:
   - Điều hướng tới `/dashboard/users`.
   - Khẳng định bảng người dùng hiển thị danh sách tài khoản thực tế (`expect(rowCount).toBeGreaterThan(0)`).
   - Khẳng định nút `Đóng vai` trên dòng bảng (`[data-testid^="btn-login-as-user-"]`) và nút `Đóng vai (Login as)` ở chân thanh Navbar bên trái (`[data-testid="header-login-as-trigger"]`) hiển thị rõ ràng.
3. **Thực hiện "Đóng vai (Login as)" vào tài khoản Thủ kho (`warehouse_hcm`)**:
   - Nhấp vào nút `Đóng vai (Login as)` ở thanh Navbar bên trái, tìm `warehouse_hcm` và nhấp chọn.
   - Lắng nghe và khẳng định API `POST /api/v1/auth/login-as/:userId` trả về HTTP `200 OK` kèm `token` và thông tin `user` của `warehouse_hcm`.
   - Khẳng định trình duyệt tự động chuyển hướng sang màn hình vận hành kho (`/dashboard/warehouse/orders`) với tư cách `warehouse_hcm` (`Andromeda Hub - HCM`).
   - Khẳng định mục trạng thái **`Đang đóng vai`** (`[data-testid="impersonation-active-banner"]`) và nút **`Thoát đóng vai`** (`[data-testid="btn-exit-impersonation"]`) hiển thị ngay trong thanh Navbar bên trái.
4. **Kiểm chứng Bảo mật RBAC (Chặn leo thang đặc quyền 403 Forbidden)**:
   - Khi đang ở phiên của `warehouse_hcm` (`WAREHOUSE_MANAGER`), thử gọi trực tiếp API `POST /api/v1/auth/login-as/1` ➔ Khẳng định Backend chặn đứng với mã lỗi `403 Forbidden`.
5. **Thực hiện "Thoát đóng vai" quay lại `SUPER_ADMIN`**:
   - Nhấp vào nút **`Thoát đóng vai`** (`[data-testid="btn-exit-impersonation"]`) trên thanh Navbar bên trái.
   - Khẳng định phiên `SUPER_ADMIN` được khôi phục ngay lập tức (không cần nhập lại mật khẩu) và quay lại trang `/dashboard/users`.

### Phần 2: Ma Trận 10 Ca Kiểm Thử Biên (10 Edge Cases Matrix)

| Mã Ca | Tên Tình Huống Biên | Đầu Vào / Thao Tác | Kết Quả Kỳ Vọng |
| :--- | :--- | :--- | :--- |
| **`EC-01`** | **Chặn tài khoản không phải `SUPER_ADMIN` gọi API `login-as`** | `WAREHOUSE_MANAGER`, `DISPATCHER`, hoặc `FLEET_MANAGER` gọi `POST /api/v1/auth/login-as/:id` | Backend `RolesGuard` + `AuthService` trả về `403 Forbidden`. |
| **`EC-02`** | **Chặn đóng vai vào tài khoản không tồn tại (`404`)** | `SUPER_ADMIN` gọi `POST /api/v1/auth/login-as/999999` | Trả về `404 Not Found` với thông báo tiếng Việt chuẩn hóa. |
| **`EC-03`** | **Chặn đóng vai vào tài khoản đang Ngừng hoạt động (`Inactive`)** | `SUPER_ADMIN` bấm đóng vai vào user có `status = inactive` | Nút `Đóng vai` bị vô hiệu hóa trên UI và Backend trả về `422 Unprocessable Entity` nếu gọi API. |
| **`EC-04`** | **Ẩn nút tự đóng vai vào chính mình** | Dòng của chính tài khoản `admin` đang đăng nhập trên bảng `/dashboard/users` | Không hiển thị nút `Đóng vai` trên dòng của chính mình. |
| **`EC-05`** | **Chuyển đổi liên tiếp từ User A sang User B khi đang đóng vai** | Đang đóng vai `warehouse_hcm`, mở Popover trên Navbar chọn đóng vai sang `dispatcher` | Hệ thống vẫn giữ nguyên phiên gốc `impersonator` là `SUPER_ADMIN` ban đầu; khi bấm `Thoát đóng vai` vẫn quay về đúng `SUPER_ADMIN`. |
| **`EC-06`** | **Đồng bộ Cookie & SSR Middleware (`proxy.ts`)** | Sau khi bấm `Đóng vai` vào `warehouse_hcm`, F5 tải lại trang hoặc điều hướng SSR | Cookie `access_token` và `refreshToken` đã được đồng bộ nên SSR nhận diện đúng vai trò `WAREHOUSE_MANAGER` và Hub `Andromeda Hub - HCM`. |
| **`EC-07`** | **Khôi phục 1 chạm về `SUPER_ADMIN` không cần mật khẩu** | Nhấn nút `Thoát đóng vai` trên thanh Navbar bên trái | Khôi phục tức thì token của `SUPER_ADMIN`, xóa trạng thái `impersonator`, và điều hướng về `/dashboard/users`. |
| **`EC-08`** | **Đăng xuất hoàn toàn (`Sign out`) khi đang đóng vai** | Đang đóng vai user khác và bấm `Sign out` ở menu tài khoản | Xóa sạch cả phiên đang đóng vai lẫn phiên `impersonator` đã lưu, đưa về `/auth/sign-in`. |
| **`EC-09`** | **Hiển thị đầy đủ thông tin Hub trên bộ chọn nhanh Navbar** | Mở Popover `Đóng vai (Login as)` trên Navbar và tìm kiếm theo tên/kho | Hiển thị rõ tên người dùng, username, badge vai trò và tên Hub phụ trách (`Andromeda Hub - HCM`, `Polaris Hub`, `Magellan Hub`). |
| **`EC-10`** | **Tương thích Navbar thu gọn (Icon mode) & mở rộng (Expanded mode)** | Thu gọn hoặc mở rộng thanh Sidebar bên trái | Nút `SidebarMenuButton` tự động hiển thị dạng icon kèm tooltip khi thu gọn và hiển thị đầy đủ nhãn khi mở rộng, giữ thanh `Header` phía trên hoàn toàn sạch gọn. |

### Phần 3: Đường Dẫn File Test Playwright Mục Tiêu

- **Spec File**: `frontend/e2e/111-super-admin-login-as.spec.ts`
- **Ảnh bằng chứng**: `feedbacks/feedback_01_11_task_111_super_admin_login_as/screenshot_01_verified.png`
