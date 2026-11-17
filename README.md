# tho. handmade — Next.js Showroom & Admin

Bộ source đã chuyển sang **Next.js App Router + TypeScript + Firebase Web SDK modular**. Giao diện tái sử dụng brand kit đã cung cấp: logo ngang, flower mark, flower sprig, heart outline, các SVG minh họa sản phẩm, bảng màu và font Newsreader / Mulish / Parisienne.

## 1. Các trang

- `/` — showroom, lọc danh mục, lưới sản phẩm, câu chuyện và liên hệ.
- `/products/[id]` — trang chi tiết sản phẩm, giá, mô tả, màu len và nút nhắn tiệm.
- `/admin` — đăng nhập admin, CRUD sản phẩm/danh mục, tải ảnh và nén ảnh trước khi lưu.

## 2. Yêu cầu môi trường

- Node.js **20.9 trở lên**.
- npm.

Next.js App Router được khuyến nghị trong tài liệu Next.js hiện hành. Project package hiện được ghim theo các bản stable: Next.js 16.4.6, React 19.3.1 và Firebase SDK 13.4.0.

## 3. Cài đặt và chạy

```bash
npm install
cp .env.example .env.local
npm run dev
```

Mở `http://localhost:3000`.

Khi chưa điền Firebase config, website chuyển sang **LocalStorage demo mode**. Admin không cần đăng nhập trong chế độ này; dữ liệu chỉ lưu trong trình duyệt hiện tại và không đồng bộ giữa thiết bị. Dùng nút **Thêm 4 mẫu từ brand kit** để nạp dữ liệu minh họa cho lần chạy đầu.

## 4. Kết nối Firebase thật

1. Tạo Firebase project và tạo Web App.
2. Bật Cloud Firestore, Storage và Authentication → Email/Password.
3. Sao chép các thông số Web App vào `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

4. Tạo user trong Firebase Authentication. Sao chép UID của user.
5. Tạo document Firestore `admins/{UID}` với field `active` kiểu boolean, giá trị `true`.
6. Cài Firebase CLI nếu máy chưa có, chọn project rồi deploy Firestore và Storage Rules:

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules,storage
```

7. Khởi động lại Next dev server sau khi sửa `.env.local`.

**Firebase Web config là config phía client**, không phải service-account key. Tuyệt đối không đặt service-account private key hoặc thông tin bí mật vào biến `NEXT_PUBLIC_*`. Quyền ghi catalogue được kiểm soát bằng Firestore/Storage Rules và document `admins/{uid}`.

## 5. Liên hệ Fanpage / Zalo

Điền một hoặc cả hai URL vào `.env.local`:

```env
NEXT_PUBLIC_FACEBOOK_MESSENGER_URL=https://m.me/tenpage
NEXT_PUBLIC_ZALO_URL=https://zalo.me/so-dien-thoai
```

Nút liên hệ sẽ sao chép sẵn tin nhắn chứa tên sản phẩm và màu đã chọn, rồi mở kênh ưu tiên. Việc tự điền nội dung vào khung chat còn phụ thuộc ứng dụng/trình duyệt, nên khách có thể cần dán tin nhắn đã sao chép.

## 6. Collections / dữ liệu

### `categories/{categoryId}`

```ts
{
  id: "tui-len",
  name: "Túi len",
  icon: "👜",
  order: 1,
  createdAt: 1731850000000
}
```

### `products/{productId}`

```ts
{
  id: "tui-len-moc-tay",
  name: "Túi len móc tay",
  categoryId: "tui-len",
  categoryName: "Túi len",
  price: 280000,
  originalPrice: null,
  image: "https://...",
  colors: ["Trắng kem", "Xanh sage", "Nâu be"],
  craftDays: "3 - 5 ngày",
  shortDesc: "Mô tả ngắn",
  fullDesc: "Mô tả chi tiết",
  inStock: true,
  featured: false,
  isPublished: true,
  createdAt: 1731850000000,
  updatedAt: 1731850000000
}
```

## 7. Lưu ý triển khai

- Dữ liệu mẫu gồm 4 sản phẩm và 5 danh mục bám theo showroom/brand kit cũ. Các ảnh sản phẩm mẫu là SVG minh họa nhận diện, **không phải ảnh chụp sản phẩm thật**; thay bằng ảnh sản phẩm thật trước khi quảng bá.
- Bảng màu len hiển thị chip màu tham khảo theo tên. Không có ảnh biến thể thật, nên không giả lập việc đổi ảnh sản phẩm theo màu.
- Khi Firebase đã cấu hình, admin bắt buộc đăng nhập và phải có `admins/{uid}.active === true`.
- Chưa có giỏ hàng, thanh toán, tài khoản khách, quản lý đơn hàng hoặc lịch công suất sản xuất — đúng phạm vi Bước 1.
- Project chưa được nối với Firebase project của tiệm vì chưa có thông tin cấu hình; kết nối thực tế cần hoàn thành các bước ở mục 4.

## 8. Build production

```bash
npm run build
npm run start
```

Có thể deploy bằng môi trường Node.js hỗ trợ Next.js. Không dùng Firebase Hosting static-only cho cấu hình Next.js đầy đủ nếu chưa thiết lập adapter phù hợp.
# storia
# storia
