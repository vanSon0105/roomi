# Backend

Node.js + Express.js API for a small/medium web project.

## Stack

- Express.js
- Prisma
- MySQL
- JWT auth
- Zod validation

## Setup

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Update `.env` before running Prisma:

```txt
DATABASE_URL="mysql://root:123456@localhost:3306/chithuy"
JWT_SECRET="change-this-secret"
```

Local database used in development:

```txt
Database: chithuy
Host: localhost
Port: 3306
User: root
Password: 123456
```

Seed creates the first admin account and base categories:

```txt
Email: admin@roomi.com.vn
Password: Admin@123456
```

Main tables:

```txt
users
categories
products
product_images
carts
cart_items
addresses
orders
order_items
payment_transactions
```

Product data and images:

```bash
npm run products:images
npm run prisma:seed
```

Or run both:

```bash
npm run products:import
```

Product images are synced from:

```txt
frontend/assets/images/figma/products
```

to:

```txt
frontend/assets/images/products
```

Dynamic VietQR checkout:

```txt
CHECKOUT_SHIPPING_FEE=30000
VIETQR_BANK_ID="970422"
VIETQR_ACCOUNT_NO="113366668888"
VIETQR_ACCOUNT_NAME="ROOMI DECOR"
VIETQR_TEMPLATE="compact2"
```

The order code is used as the unique bank-transfer content. Keep `VIETQR_ACCOUNT_NAME` without Vietnamese accents for best banking-app compatibility.

payOS automatic confirmation:

```txt
APP_BASE_URL="https://your-domain.com"
PAYOS_CLIENT_ID=""
PAYOS_API_KEY=""
PAYOS_CHECKSUM_KEY=""
PAYOS_PARTNER_CODE=""
PAYOS_WEBHOOK_URL=""
PAYOS_RETURN_URL=""
PAYOS_CANCEL_URL=""
SEPAY_WEBHOOK_API_KEY=""
SEPAY_WEBHOOK_URL=""
```

`SEPAY_WEBHOOK_API_KEY` is required for SePay automatic confirmation. The webhook returns `503` when this key is not configured, so keep the same value in SePay's webhook authorization header.

## API

Base URL:

```txt
http://localhost:4000/api
```

Frontend served by backend:

```txt
http://localhost:4000
```

Protected pages are checked by the backend before serving HTML:

```txt
cart.html
checkout.html
checkout-success.html
room-3d.html
```

Health:

```txt
GET /health
```

Auth:

```txt
POST /auth/register
POST /auth/login
POST /auth/logout
GET /auth/me
GET /auth/page-access?path=cart.html
```

Products:

```txt
GET /categories
GET /products
GET /products?category=nen-thom&limit=30
GET /products/:slug
GET /products/:slug/related
```

Cart:

```txt
GET /cart
POST /cart/items
PATCH /cart/items/:itemId
DELETE /cart/items/:itemId
```

Orders:

```txt
POST /orders
GET /orders/:code
POST /orders/:code/report-paid
POST /orders/:code/cash-on-delivery
POST /payments/payos/webhook
GET /payments/payos/config
POST /payments/sepay/webhook
GET /payments/sepay/config
```

`POST /orders` accepts `paymentMethod=SEPAY|PAYOS|BANK_TRANSFER|COD`. SePay orders show a VietQR bank-transfer QR and wait for `POST /payments/sepay/webhook` to receive an incoming balance-change event. The webhook matches the order code in transfer content and automatically marks the order `paymentStatus=PAID` when the received amount is enough. payOS orders create a payment link and redirect the customer to payOS. Bank-transfer orders create a pending VietQR order and keep the cart unchanged. `POST /orders/:code/report-paid` records that the customer clicked "Tôi đã chuyển khoản" and removes only the ordered product quantities from the cart. COD orders, or `POST /orders/:code/cash-on-delivery`, remove the ordered product quantities from the cart immediately.

Users:

```txt
GET /users
GET /users/me
GET /users/:id
PATCH /users/:id
DELETE /users/:id
```

Protected API routes accept either:

```txt
Authorization: Bearer <token>
```

or the `roomi_token` HTTP-only cookie set by `POST /auth/login` / `POST /auth/register`.

Success response format:

```json
{
  "success": true,
  "message": "OK",
  "data": {}
}
```


ngrok http --domain=unrevengefully-preburlesque-odelia.ngrok-free.dev 4000

https://unrevengefully-preburlesque-odelia.ngrok-free.dev
