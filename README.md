# 🌊 LoveDistance

Ứng dụng web cho các cặp đôi **yêu xa**: gửi cảm xúc theo thời gian thực, cùng nuôi một **thú cưng biển** và leo **bảng xếp hạng** cặp đôi.

Viết bằng **Next.js 15 (App Router) · TypeScript · Tailwind CSS · Framer Motion**, dữ liệu lưu trên **Neon Postgres**, realtime bằng **SSE**, thông báo đẩy bằng **Web Push (PWA)**.

---

## ✨ Tính năng

### Tương tác cặp đôi
- Tạo / vào phòng bằng **mã 6 ký tự**, không cần đăng ký.
- Gửi cảm xúc: nắm tay, hôn, ôm, bắn tim, nhớ, giận — **giữ nút** hoặc **chạm**, có hiệu ứng burst/floating.
- **Hành động tùy chỉnh** (tối đa 9), **giao diện room** đổi theo template biển, **upload ảnh/video nền** (Vercel Blob).
- Hiển thị **trạng thái online** của cả hai + hiệu ứng "cả hai cùng online".
- Nhật ký hoạt động, thống kê tương tác, góp ý.

### 🐾 Shared Pet (nuôi chung)
- 5 chỉ số **giảm dần theo thời gian**: độ no, độ khát, vệ sinh, năng lượng, hạnh phúc.
- 7 hành động chăm sóc: cho ăn, cho uống, đi dạo, tắm, đi ngủ, chơi đùa, vuốt ve — mỗi hành động có animation phản hồi.
- **EXP / level**, mở khóa & trang bị **ngoại hình** (mũ, trang phục, bối cảnh).
- Sân khấu **aquarium sim**: pet bơi lội, tia sáng, caustics, bong bóng; HUD kiểu game.

### 🎮 Game & cộng đồng
- 🏆 **Bảng xếp hạng**: tương tác nhiều nhất (tuần/tháng/mọi lúc) và level thú cưng.
- 🔥 **Streak** chăm sóc + huy hiệu theo mốc 3/7/14/30/60/100 ngày.
- 🛍️ **Cửa hàng + xu**: kiếm xu khi chăm sóc/tương tác, mua đồ ăn, đồ chơi, phụ kiện.
- 📖 **Nhật ký kỷ niệm** (timeline) đánh dấu các cột mốc.
- 🎉 **Sự kiện theo mùa**: Tết, Valentine, Trung Thu, Halloween, Giáng Sinh, Hè — đổi banner, hiệu ứng hạt, accent và thưởng xu.

### 🔔 Realtime & thông báo
- **SSE** đẩy cập nhật phòng/sự kiện và presence tức thì (tự reconnect).
- **Web Push (PWA)**: nhận thông báo khi người yêu gửi cảm xúc hoặc pet lên cấp — kể cả khi đóng tab.
- **Cron** nhắc khi thú cưng đói/buồn.
- 🌙 **Dark mode** giữ tinh thần tone biển.

---

## 🚀 Chạy local

```bash
npm install
npm run dev      # http://localhost:3000
```

Tạo file `.env.local`:

```bash
# Bắt buộc — Neon/Postgres
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# Web Push (sinh bằng: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:you@example.com"

# Tuỳ chọn
BLOB_READ_WRITE_TOKEN="..."   # upload ảnh/video nền (Vercel Blob)
CRON_SECRET="..."             # bảo vệ endpoint cron nhắc pet
```

> Các bảng database tự được tạo (`CREATE TABLE IF NOT EXISTS`) khi gọi API lần đầu.

### Scripts
| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Chạy dev server |
| `npm run build` | Build production |
| `npm run start` | Chạy bản build |
| `npm run lint` | Kiểm tra lint |

---

## 🧱 Cấu trúc

```
app/                  # App Router: trang + API route handlers
  api/                # rooms, events, feedback, ranking, stream(SSE), push, blob-upload
  room/[roomId]/      # màn hình phòng (tabs: tương tác, thú cưng, cửa hàng, kỷ niệm, tùy chỉnh)
  ranking/            # bảng xếp hạng
components/           # ui, room, pet, aquarium, shop, timeline, push, providers
hooks/                # useLiveRoom (SSE), useClientId, useSeason
lib/                  # db, pet, shop, streak, season, theme, push, presence, types
public/               # sw.js, manifest, icon
legacy/               # bản HTML + serverless cũ (chỉ tham chiếu, không deploy)
```

---

## ☁️ Deploy lên Vercel

1. Import repo vào Vercel (framework tự nhận **Next.js**).
2. Thêm Environment Variables: `DATABASE_URL`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, và (tuỳ chọn) `BLOB_READ_WRITE_TOKEN`, `CRON_SECRET`.
3. Cron nhắc pet đã cấu hình sẵn trong [`vercel.json`](vercel.json).
4. Web Push cần HTTPS — Vercel cung cấp sẵn.

---

## 📝 Ghi chú kỹ thuật
- WebSocket thuần không chạy trên Vercel serverless → realtime dùng **SSE** (stream tự đóng trước timeout và client tự kết nối lại).
- Pet decay tính **lazy theo `lastTickAt`** khi đọc/chăm — không cần cron riêng.
- Dữ liệu phòng cũ vẫn tương thích nhờ migrate field khi đọc.
