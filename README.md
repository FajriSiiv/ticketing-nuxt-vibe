# Nuxt Event Ticketing Platform (Build Project Vibe Coding with Qwen 3.0)

Platform penjualan tiket event berbasis web dengan integrasi Midtrans untuk pembayaran. Dilengkapi dengan sistem QR code untuk check-in, manajemen event, dan dashboard admin.

---

## 🚀 Tech Stack

- **Frontend:** [Nuxt 3](https://nuxt.com/) (Vue 3 + Pinia + TypeScript)
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma 7
- **Payment:** Midtrans Snap & Core API
- **Styling:** Tailwind CSS

---

## 📂 Struktur Project

<pre>
server/
├── api/
│   ├── admin/             # Endpoint admin (event CRUD, transaksi)
│   ├── auth/              # Login, register, session, logout
│   ├── midtrans/          # Webhook Midtrans
│   ├── tickets/           # Booking, list, check-in
│   └── transactions/      # Riwayat, verify, check-payment
├── utils/
│   ├── auth.ts            # requireAuth, requireAdmin
│   ├── cache.ts           # Shared cache untuk catalog
│   ├── db.ts              # Prisma client
│   ├── midtrans.ts        # Midtrans Snap & Core API
│   └── validate.ts        # Zod validation
prisma/
└── schema.prisma          # Model: User, Event, Transaction, Ticket
app/
├── pages/
│   ├── index.vue          # Homepage
│   ├── login.vue          # Login
│   ├── transactions.vue   # Riwayat transaksi user
│   ├── my-ticket/         # Detail tiket + QR
│   └── admin/             # Dashboard admin, event management
├── stores/                # Pinia stores (auth, theme, ticket)
├── composables/           # Composables reuseable
├── middleware/            # Auth & admin middleware
└── plugins/               # Client plugins (Snap, dll)
</pre>

---

## 🧩 Alur Kerja Utama

### 1. User (Pembeli)

```
Lihat Event → Pilih Jumlah → Bayar (Midtrans)
                                  ↓
                    VA BCA / GoPay / QRIS / dll
                                  ↓
                    Webhook konfirmasi settlement
                                  ↓
                    Status: SUCCESS → Generate QR Code
                                  ↓
                    User akses /my-ticket/{orderId}
```

### 2. Admin

```
Login → /admin
    ├── Dashboard: Lihat semua transaksi + statistik
    ├── Kelola Event: CRUD event (maks 5 event)
    ├── Check-in: Scan QR code tiket
    └── Riwayat: Tabel transaksi dengan pagination
```

### 3. Pembayaran

```
POST /api/tickets/book
    → Buat Transaction (PENDING)
    → Generate orderId + ticketCode
    → Midtrans Snap → dapat snapToken
    → Return ke frontend

User klik "Bayar"
    → window.snap.pay(snapToken)
    → Pilih channel pembayaran
    → Selesai bayar

Midtrans → POST /api/midtrans/webhook
    → Verifikasi status
    → Update transaction → SUCCESS
    → Generate QR codes
    → Decrement stock
```

---

## 🔐 Role & Access Control

| Role      | Hak Akses                                                     |
| --------- | ------------------------------------------------------------- |
| **USER**  | Lihat event, beli tiket, bayar, lihat tiket sendiri           |
| **ADMIN** | Semua di atas + kelola event, lihat semua transaksi, check-in |

### Security

- **Auth:** Session-based (cookie), bcrypt untuk password
- **IDOR protection:** Setiap endpoint cek ownership — user hanya bisa akses miliknya sendiri
- **Webhook validation:** Midtrans transaction status verification
- **Cache:** 30 menit dengan auto-invalidate saat ada perubahan data

---

## 🛠️ Setup & Development

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Buat file `.env`:

```env
DATABASE_URL=postgresql://user:pass@host:5432/postgres

# Midtrans (sandbox)
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxx
```

### 3. Setup database

```bash
npx prisma generate
npx prisma db push
```

### 4. Run development

```bash
npm run dev
```

### 5. Build untuk production

```bash
npm run build
```

---

## 📊 Caching Strategy

- **`/api/tickets/list`** → cache di RAM 30 menit
- **Auto-invalidasi** saat: user beli tiket, admin CRUD event, webhook payment
- **Tujuan:** Mengurangi beban database — 1000 request = 1 query (selama cache valid)

---

## 🗄️ Database Models

| Model           | Keterangan                                                           |
| --------------- | -------------------------------------------------------------------- |
| **User**        | Nama, email, password (hashed), role (USER/ADMIN)                    |
| **Event**       | Judul, deskripsi, harga, slot (total + remaining), tanggal           |
| **Transaction** | User → Event, status payment, snapToken, orderId (Midtrans)          |
| **Ticket**      | 1 transaksi = N tiket, masing-masing punya ticketCode + QR Code unik |

---

## 🔗 API Endpoints

### Public

- `GET /api/tickets/list` — Daftar semua event (cached)

### Auth Required

- `POST /api/auth/login` — Login
- `POST /api/auth/register` — Register
- `POST /api/auth/logout` — Logout
- `GET /api/auth/session` — Cek session
- `POST /api/tickets/book` — Beli tiket
- `GET /api/transactions/:userId` — Riwayat transaksi user
- `GET /api/tickets/:orderId` — Detail tiket + QR
- `POST /api/transactions/verify` — Verifikasi pembayaran
- `GET /api/transactions/check-payment` — Cek detail pembayaran (VA)

### Admin Only

- `GET /api/admin/transactions` — Semua transaksi (paginated)
- `GET /api/admin/events` — Daftar event
- `POST /api/admin/events` — Buat event (maks 5)
- `PUT /api/admin/events/:id` — Update event
- `DELETE /api/admin/events/:id` — Hapus event + relasi
- `POST /api/tickets/checkin` — Scan/check-in tiket

### Webhook

- `POST /api/midtrans/webhook` — Midtrans notification handler

---
