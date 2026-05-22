# Product Requirements Document (PRD)

**Healthcare Consultation & Booking Platform — MedEasy (tusul2)**

| Талбар | Утга |
|--------|------|
| Бүтээгдэхүүн | MedEasy (`tusul2`) |
| Хувилбар | **1.1** (кодтой нийцсэн) |
| Баримт бичиг | PRD |
| Технологи | React Native (Expo SDK 54), Express, MySQL 8 |
| Client | Expo Go, static web (Firebase Hosting) |
| UI хэл | Монгол (UI); код/API/schema — Англи |

---

## 1. Бүтээгдэхүүний ерөнхий танилцуулга

### 1.1 Алсын хараа

Өвчтөн: хайлт, үнэгүй чат зөвлөгөө, төлбөртэй цаг, wallet.  
Provider: эмч, үйлчилгээ, хуваарь, захиалга.  
Admin: баталгаажуулалт, хяналт.

### 1.2–1.3

Role isolation, API-first, trust (approval), offline resilience, monetization — **хэрэгжсэн**.

---

## 2. Хэрэглэгчийн role

| Role | Код |
|------|-----|
| Customer | `customer` |
| Provider | `provider` |
| System Admin | `system_admin` |

---

## 3. Дэлгэцийн урсгал

### 3.1 Ерөнхий

```
Splash → Intro → Login / Register → Role redirect
```

| Role | Redirect |
|------|----------|
| customer | `/(customer)/home` |
| provider (approved) | `/(provider)/dashboard` |
| provider (pending) | `/provider-pending` |
| system_admin | `/(system-admin)/admin-dashboard` |

### 3.2 Customer навигаци (бодит tab)

| Tab (MN) | Route | Тайлбар |
|----------|-------|---------|
| Нүүр | `(customer)/home` | Featured, категори |
| Эмч нар | `(customer)/doctors` | Эмч хайх |
| Цаг захиалга | `(customer)/appointments` | Захиалгын урсгал |
| Шинжилгээ | `(customer)/consultations` | **Lab tests** (PRD-ийн «consultations»-аас ялгаатай) |
| Профайл | `(customer)/profile` | Данс, тохиргоо |

**Нууц stack/tab:** `clinic/*`, `booking/*`, `chat`, `wallet`, `my-orders`, `free-consult`, `advice`, `lab-tests`, …

### 3.3 Provider навигаци (бодит tab — PRD 1.0-аас өөрчлөгдсөн)

| Tab (MN) | Route | Тайлбар |
|----------|-------|---------|
| Самбар | `(provider)/dashboard` | KPI, quick actions |
| Захиалга | `(provider)/bookings` | Захиалгын жагсаалт |
| Үйлчилгээ | `(provider)/services` | Үйлчилгээ CRUD |
| Профайл | `(provider)/provider-profile` | Эмнэлэг, тохиргоо |

**Нууц дэлгэц (`href: null`):**

| Route | Тайлбар |
|-------|---------|
| `(provider)/clinic-register` | Эмнэлэг API бүртгэл |
| `(provider)/clinic-profile`, `clinic-edit` | Эмнэлгийн профайл |
| `(provider)/doctors`, `doctor-register`, `doctor/[id]/edit` | Эмч |
| `(provider)/orders/today`, `orders/requests`, `orders/[orderId]` | Өнөөдөр / хүсэлт (tab биш) |
| `(provider)/schedule`, `schedule/add-slot` | Хуваарь |
| `(provider)/chat`, `chat-detail` | Чат |
| `(provider)/revenue` | Орлого |
| `(provider)/categories` | Үйлчилгээний ангилал |
| `(provider)/patients/*`, `lab-tests/*` | Өвчтөн, шинжилгээ |

> **PRD 1.0 засвар:** «Orders» tab биш — **Bookings** tab; «clinic-profile» tab биш — **provider-profile** tab.

### 3.4 Admin

| Дэлгэц | Route |
|--------|-------|
| Dashboard | `admin-dashboard` |
| Registrations | `admin-registrations` |
| Providers | `admin-providers` |
| Users | `admin-users` |
| Moderation | `admin-moderation` |
| Notifications / Profile | `admin-notifications`, `admin-profile` |

---

## 4. Үндсэн функцууд

### 4.1 Auth

| Функц | Route / API |
|-------|-------------|
| Register | `/register`, `POST /api/auth/register` |
| Login | `/login`, `POST /api/auth/login` |
| Forgot / reset password | `/forgot-password`, `/reset-password` |
| Provider pending | `/provider-pending` |
| Logout | Header + `signOut` |

**Нууц үг:** login үед `trim()` (2026-05 засвар).

### 4.2 Customer

Clinic/doctor detail (`clinic/_layout` stack), booking, wallet, notifications, chat (5s poll), lab-tests.

### 4.3 Provider

| Функц | Тайлбар |
|-------|---------|
| Onboarding register | 5 алхам + `POST /api/provider-onboarding/submit` |
| Clinic registration | `clinic-register` → `POST /api/clinics` |
| Doctor CRUD | `DELETE /api/doctors/:id` орсон |
| Services + categories | API + `016_clinic_service_categories` |
| Schedule | weekly + slots API |
| Bookings + consultations | `bookings` tab, orders дэд хуудас |

### 4.4 Admin

Approval queue, stats, users, moderation — API холбогдсон.

---

## 5. Цаг захиалгын урсгал

Doctor → өдөр → цаг → booking → төлбөр → success.

**Booking status (UI/API):** `pending`, `confirmed`, `completed`, `cancelled` (+ provider талд `cancelled_clinic`, `rejected`).

**Payment:** `unpaid`, `paid`, `refunded`.

---

## 6. Чат

- Polling: **5 секунд** (`chat-detail.tsx`).
- Offline: илгээх **хориглоно** (`shouldBlockWhenOffline`).
- Consultation orders: тусдаа ID mapping (`consultation_requests`).

---

## 7. Төлбөр

Wallet ledger (`wallets`, `wallet_transactions`); QPay mock UI; `payment_methods` (migration 013).

---

## 8. Offline дэмжлэг

| Layer | Файл / үүрэг |
|-------|----------------|
| NetworkProvider | `useNetworkStatus` |
| OfflineBanner | UI анхааруулга |
| GET cache | `responseCache` |
| Reconnect | `ReconnectAutoRefresh` → `emitReconnectRefresh()` |

### 8.2 Offline capability

| Үйлдэл | Offline |
|--------|---------|
| Cached GET | ✅ |
| Chat send | ❌ |
| Booking / payment | ❌ |

### 8.1 Засвар (2026-05)

**Өмнө:** сүлжээ сэргэхэд `router.replace(pathname)` → таб дээрх форм **буцах**.  
**Одоо:** зөвхөн `subscribeReconnectRefresh` → `ProviderWorkspace.refreshWorkspace()` (навигаци хөндөхгүй).

Provider **clinic-register:** Android back → dashboard; «Буцах» → `replace(dashboard)` (буруу `back()` биш).

---

## 9. Push notification

Expo push token (`users.expo_push_token`); bootstrap component; event notifications (booking г.м).

---

## 10. API

### 10.1 Стандарт

JWT; `{ success, data, message }`; алдаа `{ success: false, message }`.

### 10.2 Route модулиуд (гол)

| Prefix | Module |
|--------|--------|
| `/api/auth` | Login, register, me |
| `/api/clinics` | Clinic CRUD |
| `/api/doctors` | Doctor (+ **DELETE**) |
| `/api/services` | Services |
| `/api/services/categories` | Public + clinic categories |
| `/api/bookings` | Booking |
| `/api/consultations` | Free consult requests |
| `/api/chat` | Chat |
| `/api/wallet` | Wallet |
| `/api/payments` | Payments |
| `/api/provider-onboarding` | Submit, status |
| `/api/admin` | Admin |
| `/api/stats` | Statistics |

---

## 11. Өгөгдлийн сан

`users`, `wallets`, `clinics`, `doctors`, `services`, `clinic_service_categories`, `bookings`, `consultation_requests`, `provider_onboarding_submissions`, `chat_*`, `notifications`, `lab_tests`, …

**Заавал migration (онбординг лого):**

```bash
cd backend
npm run db:migrate -- sql/alter_provider_onboarding_logo_url.sql
```

---

## 12. Онцгой нөхцөлүүд (EC)

| ID | Нөхцөл | Үйлдэл |
|----|--------|--------|
| EC-01 | Provider pending | `/provider-pending` |
| EC-02 | Давхар slot | Алдаа |
| EC-03 | Wallet хүрэлцэхгүй | Top-up санал |
| EC-04 | Offline чат | Block |
| EC-05 | JWT дуусах | Logout / дахин нэвтрэх |
| **EC-06** | **Онбординг лого хэт том** | **413 + MEDIUMTEXT migration; жижиг зураг** |
| **EC-07** | **Бүртгэл үүссэн ч submit алдаа** | Alert; админ батлах эсвэл дахин илгээлт (идэвхжүүлэх шаардлагатай) |

---

## 13. UX

Монгол UI, NativeWind, min touch 48px, **dark mode**, skeleton/loading, retry.

---

## 14. Функциональ бус

Performance, HTTPS+JWT, Expo Go, layered backend — хэрэгжсэн.

---

## 15. MVP-д ороогүй

Видео, WebSocket, даатгал, автомат refund, HIPAA/FHIR.

---

## 16. Хөгжүүлэлтийн үе шат

| Phase | Төлөв |
|-------|--------|
| P0 MVP | **Ихэнх нь хэрэгжсэн (API)** |
| P1 Push | Bootstrap + event |
| P2 Realtime / video | Төлөвлөгөөт |

---

## 17. Environment

| Variable / баримт | Тайлбар |
|-------------------|---------|
| `EXPO_PUBLIC_APP_ENV` | `development` (Expo Go) / `production` (web) |
| `EXPO_PUBLIC_API_URL` | API суурь (`/api`) |
| `REACT_NATIVE_PACKAGER_HOSTNAME` | PC IP (Expo Go LAN) |
| `backend/.env` | Локал MySQL |
| `DATABASE_URL` | Aiven (production) |
| `docs/ENV-EXPO-WEB.md` | Expo vs Web заавар |
| `docs/DEPLOY.md` | Firebase + Render |

**Командууд:**

```bash
# Локал admin
cd backend && npm run db:create-admin -- admin1@gmail.com 1234 "Системийн админ"

# Provider батлах
npm run db:approve-pending-providers -- admin1@gmail.com

# Локал цэвэрлэгээ
npm run db:cleanup-local-catalog:yes
npm run db:cleanup-local-users:yes
```

---

## 18. Document approval

| Role | Нэр | Огноо |
|------|-----|-------|
| Product Owner | Х.Мөнх-Оргил | 2026.05.18 |
| Technical Lead | Д.Бямбацэцэг | 2026.05.18 |
| UI/UX Designer | А.Уянга | 2026.05.18 |
| QA / Documentation | Б.Эрхэмсайхан | 2026.05.18 |
| PRD шинэчлэлт | Инженерийн баг | **2026.05.22** |

---

*Холбоотой: [BRD.md](./BRD.md)*
