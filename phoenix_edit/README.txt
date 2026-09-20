# PHOENIX - Cây Chức Vụ + Supabase

1. Mở Supabase > SQL Editor.
2. Dán toàn bộ `supabase.sql` và Run.
3. Vào Authentication > Users > Add user, tạo email + mật khẩu Admin.
4. Upload `index.html`, `style.css`, `app.js` lên GitHub Pages.
5. Mở web > ADMIN > đăng nhập tài khoản vừa tạo.

Quan trọng:
- `sb_publishable_...` có thể dùng ở frontend.
- KHÔNG đưa `service_role`/secret key lên GitHub.
- Bản này cho phép mọi người đọc cây, nhưng chỉ user đăng nhập mới ghi dữ liệu.
- Nếu muốn chỉ MỘT email cụ thể được phép sửa, cần thêm bảng `admins` + policy kiểm tra user id/email. Bản hiện tại coi mọi tài khoản Supabase Auth đăng nhập là Admin.
