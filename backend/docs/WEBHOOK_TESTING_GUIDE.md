# 🔗 Webhook Testing Guide với Ngrok

Hướng dẫn chi tiết cách sử dụng webhook để test PayOS payment với ngrok.

## 📋 Tổng Quan

### Webhook là gì?

- **Webhook** là một cơ chế tự động gửi thông báo (callback) từ service bên ngoài đến server của bạn
- Khi có sự kiện xảy ra (ví dụ: thanh toán thành công), service sẽ gửi POST request đến webhook URL của bạn
- Thay vì phải liên tục kiểm tra trạng thái, server được thông báo ngay lập tức

### Tại sao cần ngrok?

- **Ngrok** tạo public URL cho localhost, cho phép PayOS gửi webhook đến máy local của bạn
- Cần thiết cho development và testing trước khi deploy production

## 🛠️ Cài Đặt và Cấu Hình

### 1. Cài đặt Ngrok

```bash
# Download từ https://ngrok.com/
# Hoặc dùng npm
npm install -g ngrok

# Hoặc dùng chocolatey (Windows)
choco install ngrok
```

### 2. Đăng ký tài khoản ngrok

```bash
# Đăng ký tại https://dashboard.ngrok.com/
# Lấy authtoken và authenticate
ngrok config add-authtoken YOUR_AUTHTOKEN
```

### 3. Khởi động backend server

```bash
cd backend
npm start
# Server chạy trên port 3001
```

### 4. Khởi động ngrok

```bash
# Tạo tunnel đến port 3001
ngrok http 3001
```

Bạn sẽ nhận được output như sau:

```
Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        Asia Pacific (ap)
Latency                       25ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3001

Connections                   ttl     opn     rt1     rt5     p50     p90
                             0       0       0.00    0.00    0.00    0.00
```

**Lưu lại URL ngrok**: `https://abc123.ngrok-free.app`

## 🔗 Endpoints Webhook

### 1. PayOS Official Webhook (cho production)

```
POST https://your-domain.com/api/transactions/payos-webhook
```

- Được PayOS tự động gọi
- Có signature verification
- Chỉ dùng cho production

### 2. Custom Testing Webhook (cho development)

```
POST https://abc123.ngrok-free.app/api/transactions/receive-hook
```

- Dùng để test với ngrok
- Không cần signature verification
- Có thể gọi manual

## 📝 Cách Sử Dụng

### Bước 1: Tạo Payment Transaction

```bash
curl -X POST https://abc123.ngrok-free.app/api/transactions/payos-coin-payment \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "packageId": "package1"
  }'
```

Response:

```json
{
  "success": true,
  "transaction": {
    "id": 12345,
    "status": "pending",
    "price": 10000,
    "user_id": 1
  },
  "paymentUrl": "https://pay.payos.vn/web/..."
}
```

### Bước 2: Complete Transaction via Webhook

```bash
curl -X POST https://abc123.ngrok-free.app/api/transactions/receive-hook \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": 12345,
    "status": "completed"
  }'
```

Response khi thành công:

```json
{
  "status": "success",
  "message": "Transaction completed successfully",
  "transaction": {
    "id": 12345,
    "status": "completed",
    "user_id": 1,
    "coins_added": 100,
    "new_balance": 1100
  }
}
```

### Bước 3: Kiểm tra trạng thái User

```bash
curl https://abc123.ngrok-free.app/api/transactions/user/1
```

## 🧪 Testing Script

Chạy test script tự động:

```bash
cd backend
node scripts/test-receive-hook.js
```

Script sẽ test:

1. ✅ Tạo payment transaction
2. ✅ Test webhook reception
3. ✅ Complete transaction
4. ✅ Test duplicate completion
5. ✅ Test với orderCode
6. ✅ Test error cases

## 📊 Request/Response Examples

### Complete by Transaction ID

**Request:**

```json
{
  "transactionId": 12345,
  "status": "completed"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Transaction completed successfully",
  "transaction": {
    "id": 12345,
    "status": "completed",
    "user_id": 1,
    "coins_added": 500,
    "new_balance": 1500
  }
}
```

### Complete by Order Code

**Request:**

```json
{
  "orderCode": "PAYOS-1704567890123-1",
  "status": "PAID"
}
```

### Test Webhook Reception (không complete)

**Request:**

```json
{
  "transactionId": 12345,
  "status": "pending"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Webhook received successfully",
  "transaction": {
    "id": 12345,
    "current_status": "pending"
  }
}
```

## ❌ Error Cases

### Missing Parameters

**Request:**

```json
{
  "status": "completed"
}
```

**Response (400):**

```json
{
  "status": "error",
  "message": "Missing transactionId or orderCode"
}
```

### Transaction Not Found

**Request:**

```json
{
  "transactionId": 999999,
  "status": "completed"
}
```

**Response (404):**

```json
{
  "status": "error",
  "message": "Transaction not found"
}
```

### Already Completed

**Request:**

```json
{
  "transactionId": 12345,
  "status": "completed"
}
```

**Response (200):**

```json
{
  "status": "success",
  "message": "Transaction already completed",
  "transaction": { ... }
}
```

## 🔧 PayOS Dashboard Configuration

### Cấu hình PayOS Webhook

1. **Đăng nhập PayOS Dashboard**: https://my.payos.vn/
2. **Vào phần Cài đặt > Webhook**
3. **Nhập URL webhook CHÍNH THỨC**:

   ```
   https://symbolgame.onrender.com/api/transactions/payos-webhook
   ```

   ⚠️ **KHÔNG dùng** `/receive-hook` trong PayOS dashboard

4. **Click "Test Webhook"** để PayOS kiểm tra
5. **Lưu cấu hình**

### Webhook Events

PayOS sẽ gửi webhook cho các events:

- ✅ `PAID` - Thanh toán thành công
- ❌ `CANCELLED` - Thanh toán bị hủy
- ⏳ `PENDING` - Thanh toán đang chờ

## 🚀 Production Setup

### 1. Deploy server lên production

```bash
# Ví dụ với Render.com
git push origin main
```

### 2. Cập nhật PayOS webhook URL

```
https://your-production-domain.com/api/transactions/payos-webhook
```

### 3. Test production webhook

```bash
curl -X POST https://your-production-domain.com/api/transactions/payos-webhook \
  -H "Content-Type: application/json" \
  -H "x-payos-signature: test" \
  -d '{"data": {"orderCode": 123, "status": "PAID", "amount": 10000}}'
```

## 🔍 Debugging

### Kiểm tra ngrok logs

- Mở http://127.0.0.1:4040 trong browser
- Xem real-time requests đến ngrok tunnel

### Kiểm tra server logs

```bash
# Trong terminal chạy server
tail -f logs/app.log

# Hoặc xem console output
```

### Common Issues

1. **404 Error**: Endpoint không tồn tại

   - ✅ Kiểm tra route đã được define
   - ✅ Kiểm tra server đang chạy

2. **Ngrok tunnel closed**:

   - ✅ Restart ngrok
   - ✅ Cập nhật URL mới

3. **PayOS signature verification failed**:
   - ✅ Kiểm tra PAYOS_CHECKSUM_KEY
   - ✅ Dùng endpoint `/receive-hook` để test trước

## 📚 Tài Liệu Tham Khảo

- [PayOS Documentation](https://payos.vn/docs/)
- [Ngrok Documentation](https://ngrok.com/docs)
- [Webhook Best Practices](https://webhooks.fyi/)

## 🎯 Kết Luận

Với setup này, bạn có thể:

- ✅ Test webhook locally với ngrok
- ✅ Simulate PayOS payment completion
- ✅ Debug payment flow một cách dễ dàng
- ✅ Prepare cho production deployment

**Lưu ý quan trọng:**

- Endpoint `/receive-hook` chỉ dùng cho testing
- PayOS dashboard phải dùng `/payos-webhook`
- Luôn verify signature trong production
