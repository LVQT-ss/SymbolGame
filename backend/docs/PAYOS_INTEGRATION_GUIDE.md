# PayOS Integration Guide

## 🎯 Overview

PayOS đã được tích hợp hoàn chỉnh vào hệ thống coin purchase của Symbol Mobile App. Hướng dẫn này sẽ giúp bạn cấu hình và sử dụng PayOS.

## 📋 Prerequisites

### 1. PayOS Account Setup

1. Đăng ký tài khoản PayOS tại: https://payos.vn
2. Hoàn tất KYC và xác minh doanh nghiệp
3. Lấy thông tin credentials từ dashboard PayOS

### 2. Required Credentials

Bạn cần các thông tin sau từ PayOS Dashboard:

- `PAYOS_CLIENT_ID`: Client ID của ứng dụng
- `PAYOS_API_KEY`: API Key để gọi PayOS API
- `PAYOS_CHECKSUM_KEY`: Key để verify webhook signature
- `PAYOS_PARTNER_CODE`: Mã đối tác (nếu có)

## ⚙️ Configuration

### 1. Environment Variables

Thêm vào file `.env`:

```env
# PayOS Configuration
PAYOS_CLIENT_ID=your-payos-client-id
PAYOS_API_KEY=your-payos-api-key
PAYOS_CHECKSUM_KEY=your-payos-checksum-key
PAYOS_PARTNER_CODE=your-partner-code
PAYOS_RETURN_URL=http://localhost:3000/api/transactions/payos-return
PAYOS_CANCEL_URL=http://localhost:3000/payment-cancelled
```

### 2. Webhook Configuration

Trong PayOS Dashboard, cấu hình webhook URL:

```
https://yourdomain.com/api/transactions/payos-webhook
```

## 🚀 API Endpoints

### 1. Create PayOS Payment

**POST** `/api/transactions/payos-coin-payment`

```json
{
  "userId": 1,
  "packageId": "package3"
}
```

**Response:**

```json
{
  "success": true,
  "paymentUrl": "https://pay.payos.vn/web/7a6c4979aa3d4cc3938fe2a7f6413327",
  "qrCode": "00020101021238570010A000000727012700069704220113VQRQADCPK12840208QRIBFTTA530370454062000005802VN62180814Nap 2500 coins63040A9D",
  "qrCodeImageUrl": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "transaction": {
    "id": 7,
    "user_id": 1,
    "status": "pending",
    "price": "200000.00",
    "payment_provider": "payos"
  },
  "package": {
    "coins": 2500,
    "price": 200000,
    "name": "2500 Coins"
  },
  "orderCode": 7,
  "user": {
    "id": 1,
    "username": "player123",
    "email": "player123@symbol.game",
    "currentCoins": 750,
    "newCoinsAfterPayment": 3250
  },
  "paymentInfo": {
    "description": "Nap 2500 coins",
    "amount": 200000,
    "currency": "VND",
    "expiresAt": "2024-06-30T14:02:37.321Z",
    "expiresInMinutes": 30
  }
}
```

### 2. PayOS Webhook (Auto)

**POST** `/api/transactions/payos-webhook`

Endpoint này được PayOS gọi tự động khi có thay đổi trạng thái thanh toán.

### 3. PayOS Return (Auto)

**GET** `/api/transactions/payos-return`

Endpoint này xử lý khi user được redirect về từ PayOS.

## 💳 Payment Flow

### 1. Frontend Flow

```javascript
// 1. Tạo PayOS payment
const createPayOSPayment = async (userId, packageId) => {
  const response = await fetch("/api/transactions/payos-coin-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: userId,
      packageId: packageId,
    }),
  });

  const result = await response.json();

  if (result.success) {
    // Display payment information to user
    showPaymentInfo(result);

    // Redirect to PayOS or show QR code
    if (isMobile()) {
      window.location.href = result.paymentUrl;
    } else {
      showQRCodeModal(result);
    }
  }
};

// 2. Show payment information
const showPaymentInfo = (paymentData) => {
  console.log(`💰 Nạp coins cho: ${paymentData.user.username}`);
  console.log(`📦 Gói: ${paymentData.package.name}`);
  console.log(`💎 Coins hiện tại: ${paymentData.user.currentCoins}`);
  console.log(`💎 Coins sau nạp: ${paymentData.user.newCoinsAfterPayment}`);
  console.log(
    `⏰ Hết hạn sau: ${paymentData.paymentInfo.expiresInMinutes} phút`
  );
};

// 3. Show QR code modal for desktop
const showQRCodeModal = (paymentData) => {
  const modal = document.createElement("div");
  modal.innerHTML = `
        <div class="payment-modal">
            <h3>Nạp ${paymentData.package.coins} coins cho ${
    paymentData.user.username
  }</h3>
            <p>Số tiền: ${paymentData.paymentInfo.amount.toLocaleString(
              "vi-VN"
            )} VND</p>
            <p>Hết hạn: ${new Date(
              paymentData.paymentInfo.expiresAt
            ).toLocaleString("vi-VN")}</p>
            
            <div class="qr-section">
                <img src="${paymentData.qrCodeImageUrl}" alt="QR Code" />
                <p>Quét mã QR để thanh toán</p>
            </div>
            
            <div class="payment-options">
                <button onclick="window.open('${
                  paymentData.paymentUrl
                }', '_blank')">
                    Mở trang thanh toán PayOS
                </button>
                <button onclick="copyQRString('${paymentData.qrCode}')">
                    Copy mã QR
                </button>
            </div>
        </div>
    `;
  document.body.appendChild(modal);
};

// 4. Copy QR string for mobile apps
const copyQRString = (qrString) => {
  navigator.clipboard.writeText(qrString).then(() => {
    alert("Đã copy mã QR! Dán vào ứng dụng ngân hàng của bạn.");
  });
};
```

### 2. Backend Flow

1. **Create Payment**: Server tạo transaction record và PayOS payment link
2. **User Payment**: User thanh toán qua PayOS (QR, card, e-wallet)
3. **Webhook**: PayOS gửi webhook thông báo kết quả
4. **Verification**: Server verify webhook signature và cập nhật coin
5. **Return**: User được redirect về với kết quả

## 🔒 Security Features

### 1. Webhook Signature Verification

```javascript
// Automatic verification trong payOSWebhook function
const webhookSignature = req.headers["x-payos-signature"];
const expectedSignature = crypto
  .createHmac("sha256", process.env.PAYOS_CHECKSUM_KEY)
  .update(signatureData)
  .digest("hex");
```

### 2. Duplicate Payment Prevention

- Kiểm tra transaction status trước khi process
- Sử dụng database transaction để đảm bảo atomicity
- Log chi tiết cho audit trail

## 🎨 Integration Examples

### React Native Example

```jsx
import { Alert, Linking } from "react-native";

const purchaseCoins = async (packageId) => {
  try {
    const response = await fetch(
      `${API_BASE}/transactions/payos-coin-payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          packageId: packageId,
        }),
      }
    );

    const result = await response.json();

    if (result.success) {
      // Show payment info to user
      Alert.alert(
        "Xác nhận thanh toán",
        `Nạp ${result.package.coins} coins cho ${result.user.username}\n` +
          `Số tiền: ${result.paymentInfo.amount.toLocaleString(
            "vi-VN"
          )} VND\n` +
          `Coins hiện tại: ${result.user.currentCoins}\n` +
          `Coins sau nạp: ${result.user.newCoinsAfterPayment}`,
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Thanh toán",
            onPress: () => Linking.openURL(result.paymentUrl),
          },
        ]
      );
    } else {
      Alert.alert("Error", result.message);
    }
  } catch (error) {
    Alert.alert("Error", "Payment creation failed");
  }
};
```

### Web Frontend Example

```javascript
// Show QR Code for desktop users
const showPayOSPayment = (paymentData) => {
  if (window.innerWidth < 768) {
    // Mobile: Direct redirect
    window.location.href = paymentData.paymentUrl;
  } else {
    // Desktop: Show QR code modal
    showQRModal({
      qrCodeImageUrl: paymentData.qrCodeImageUrl,
      qrCodeString: paymentData.qrCode,
      paymentUrl: paymentData.paymentUrl,
      amount: paymentData.package.price,
      coins: paymentData.package.coins,
      user: paymentData.user,
      expiresAt: paymentData.paymentInfo.expiresAt,
    });
  }
};
```

## 🛠️ Testing

### 1. Test PayOS Payment

```bash
curl -X POST http://localhost:3000/api/transactions/payos-coin-payment \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "packageId": "package1"
  }'
```

### Expected Response:

```json
{
  "success": true,
  "paymentUrl": "https://pay.payos.vn/web/...",
  "qrCode": "00020101021238570010A000000727...",
  "qrCodeImageUrl": "data:image/png;base64,iVBORw0KGgo...",
  "user": {
    "id": 1,
    "username": "player123",
    "currentCoins": 750,
    "newCoinsAfterPayment": 850
  },
  "package": {
    "coins": 100,
    "price": 10000,
    "name": "100 Coins"
  },
  "paymentInfo": {
    "description": "Nap 100 coins",
    "amount": 10000,
    "expiresInMinutes": 30
  }
}
```

### 2. Test Webhook (Development)

```bash
# Sử dụng ngrok để expose local server
ngrok http 3000

# Update PAYOS_RETURN_URL và webhook URL trong PayOS dashboard
```

## 📊 Monitoring & Logs

### 1. Payment Logs

- Tất cả PayOS events được log với timestamp
- Webhook signature verification results
- Transaction status changes

### 2. Error Handling

- Invalid signature: HTTP 400
- Transaction not found: HTTP 404
- Duplicate processing: HTTP 200 (ignored)
- Server errors: HTTP 500 với detailed logs

## 🔧 Troubleshooting

### Common Issues

1. **Invalid Signature**

   - Kiểm tra PAYOS_CHECKSUM_KEY
   - Verify webhook URL trong PayOS dashboard

2. **Payment Not Processing**

   - Check PayOS credentials
   - Verify webhook endpoint accessibility
   - Check server logs for errors

3. **Coins Not Added**
   - Check webhook delivery status trong PayOS dashboard
   - Verify transaction record trong database
   - Check for duplicate transaction processing

### Debug Commands

```bash
# Check PayOS configuration
node -e "console.log(process.env.PAYOS_CLIENT_ID)"

# Test webhook endpoint
curl -X POST http://localhost:3000/api/transactions/payos-webhook \
  -H "Content-Type: application/json" \
  -H "x-payos-signature: test" \
  -d '{"data":{"orderCode":123,"status":"PAID","amount":10000}}'
```

## 📈 Production Deployment

### 1. Environment Setup

```env
# Production PayOS URLs
PAYOS_RETURN_URL=https://yourdomain.com/api/transactions/payos-return
PAYOS_CANCEL_URL=https://yourdomain.com/payment-cancelled
```

### 2. Webhook Security

- Sử dụng HTTPS cho webhook endpoint
- Implement rate limiting cho webhook endpoint
- Set up monitoring cho webhook failures

### 3. Performance Optimization

- Database indexing cho transaction lookups
- Caching cho coin package data
- Async processing cho non-critical operations

## 🎯 Coin Packages Available

| Package ID | Coins | Price (VND) | Best Value |
| ---------- | ----- | ----------- | ---------- |
| package1   | 100   | 10,000      |            |
| package2   | 500   | 45,000      | ⭐         |
| package3   | 1,000 | 85,000      | ⭐⭐       |
| package4   | 2,500 | 200,000     | ⭐⭐⭐     |
| package5   | 5,000 | 380,000     | 🏆 Best    |

## 📞 Support

- PayOS Documentation: https://docs.payos.vn
- PayOS Support: support@payos.vn
- Technical Issues: Check server logs và PayOS dashboard
