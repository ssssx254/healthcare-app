# PRD — Бүтээгдэхүүний шаардлагын баримт бичиг

**Төсөл:** Tusul2 (ServiceHub Healthcare)  
**Хувилбар:** 1.0  
**Огноо:** 2026 оны 5 сар  
**Хэл:** Монгол (UI), код — English identifier  
**Холбоотой:** [BRD-mongol.md](./BRD-mongol.md)

---

## 1. Бүтээгдэхүүний тойм

### 1.1 Юу вэ?

Tusul2 нь **нэг аппликейшн, гурван үүрэгтэй** эрүүл мэндийн платформ:

| Үүрэг | Кодын зам | Товч үүрэг |
|-------|-----------|------------|
| **Үйлчлүүлэгч** | `(customer)/` | Эмнэлэг хайх, захиалах, төлөх, чатлах |
| **Үйлчилгээ үзүүлэгч** | `(provider)/` | Эмнэлэг, эмч, хуваарь, захиалга удирдах |
| **Системийн админ** | `(system-admin)/` | Бүртгэл баталгаажуулах, хяналт |

**Технологи:** React Native (Expo SDK 54) + Expo Router, NativeWind, Node.js Express API, MySQL.

**Оролцох төхөөрөмж:** iOS/Android (Expo Go / store build), Web (Firebase Hosting).

### 1.2 Бүтээгдэхүүний зорилго

1. Үйлчлүүлэгчид эмч, эмнэлэгт **хялбар хандах**.
2. Үзүүлэгчид захиалга, хуваарийг **нэг дороос удирдах**.
3. Төлбөр, чат, үнэлгээг **нэг түвшинд** холбох.
4. Ирээдүйд бодит backend-тэй **хялбар шилжих** API давхаргатай архитектур.

### 1.3 Бүтээгдэхүүний бус зорилго (Non-Goals) — v1

- Бодит видео SDK (зөвхөн Meet link placeholder).
- ЭМД-ийн албан ёсны API (зөвхөн UI).
- Олон улсын хэл.
- Custom native module (Expo Go хязгаар).

---

## 2. Хэрэглэгчийн дүр (Personas)

### 2.1 Болд — Үйлчлүүлэгч (32 нас)

- Улаанбаатар; ажлын хүн; утсаар бүх зүйл хийдэг.
- **Хэрэгцээ:** Хурдан эмч олох, үнэгүй эхлээд зөвлөгөө авах, дараа нь цаг товлох.
- **Төвөгшил:** Олон апп, тодорхойгүй үнэ, утас хүлээлэг.

### 2.2 Доктор Сарана — Үзүүлэгч (эмнэлгийн менежер)

- Хувийн клиникийн эзэн; 5 эмч.
- **Хэрэгцээ:** Цаг, захиалга, орлого нэг дэлгэцэд; өвчтөнтэй чат.
- **Төвөгшил:** Excel хуваарь, алдагдах захиалга.

### 2.3 Админ Номин

- Платформын ажилтан.
- **Хэрэгцээ:** Шинэ эмнэлгийг шалгах, хэрэглэгч хаах, тайлан.

---

## 3. Системийн архитектур (товч)

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Expo + Expo Router)                          │
│  app/(auth) | (customer) | (provider) | (system-admin)  │
│  services/api/*  →  lib/api/client (JWT, cache)         │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS REST
┌──────────────────────────▼──────────────────────────────┐
│  Backend (Express)                                      │
│  routes → controllers → services → repositories         │
│  MySQL                                                  │
└─────────────────────────────────────────────────────────┘
```

**Гол API модулууд:** `auth`, `clinics`, `doctors`, `services`, `schedule-slots`, `bookings`, `consultations`, `chat`, `wallet`, `payments`, `payment-methods`, `provider-onboarding`, `notifications`, `lab-tests`, `admin`, `stats`.

---

## 4. Функциональ шаардлага — Нийтлэг (Auth)

### 4.1 Дэлгэцүүд

| ID | Дэлгэц | Зам | Тайлбар |
|----|--------|-----|---------|
| A-01 | Splash | `/splash` | Эхлэл, role redirect |
| A-02 | Танилцуулга | `/intro` | Үүрэг танилцуулга |
| A-03 | Нэвтрэх | `/login` | Имэйл + нууц үг |
| A-04 | Бүртгүүлэх | `/register` | Customer эсвэл Provider (олон алхам) |
| A-05 | Нууц мартсан | `/forgot-password` | Сэргээх урсгал |
| A-06 | Provider хүлээлэг | `/provider-pending` | Баталгаажаагүй үзүүлэгч |

### 4.2 Шаардлага

| ID | Шаардлага | Приоритет | Хүлээн авах шалгалт |
|----|-----------|-----------|---------------------|
| FR-A-01 | JWT-ээр нэвтрэлт, token хадгалалт | P0 | Нэвтэрсний дараа protected route нээгдэнэ |
| FR-A-02 | Role: `customer`, `provider`, `system_admin` | P0 | Буруу role-ийн layout руу орохгүй |
| FR-A-03 | Provider бүртгэл: онбординг + лого | P0 | POST `/provider-onboarding/submit` |
| FR-A-04 | Dark/Light mode (NativeWind) | P1 | Танилцуулга дээр солиход crash гарахгүй |
| FR-A-05 | Яаралтай 103 товч (intro/login) | P2 | Зөвхөн дуудлага баталгаажуулалт |

---

## 5. Функциональ шаардлага — Үйлчлүүлэгч (Customer)

### 5.1 Навигаци (Tab)

| Tab | Дэлгэц | Үүрэг |
|-----|--------|------|
| Нүүр | `home` | Товч холбоос, эмнэлэг, ангилал, онцлох эмч |
| Эмч нар | `doctors` | Эмчийн жагсаалт, шүүлт |
| Цаг захиалга | `appointments` | Захиалгын төрөл сонголт |
| Шинжилгээ | `consultations` | Lab tests, зөвлөгөөний түүх |
| Профайл | `profile` | Тохиргоо, данс |

### 5.2 Нүүр хуудас

| ID | Шаардлага | Статус |
|----|-----------|--------|
| FR-C-01 | Эмнэлгийн жагсаалт (лого жижиг, хажууд текст) | Хэрэгжсэн |
| FR-C-02 | Үйлчилгээний ангиллын картууд (нэгдсэн ногоон theme dark) | Хэрэгжсэн |
| FR-C-03 | Үнэгүй зөвлөгөө, төлбөртэй үзлэг товч | Хэрэгжсэн |
| FR-C-04 | Онцлох эмч (4.5+ үнэлгээ) | Хэрэгжсэн |
| FR-C-05 | Цахим данс холбоос | Хэрэгжсэн |

### 5.3 Үнэгүй зөвлөгөө

| ID | Шаардлага | Статус |
|----|-----------|--------|
| FR-C-10 | Эмч + боломжит цагийн жагсаалт (`free_consultation` slot) | Хэрэгжсэн |
| FR-C-11 | Өдөр → цаг сонгогч (SlotDayTimePicker) | Хэрэгжсэн |
| FR-C-12 | Захиалга үүсгэх, Meet link placeholder | Хэрэгжсэн |
| FR-C-13 | «Чат» — эмнэлэгтэй яриа нээх, эмчийн нэр header-д | Хэрэгжсэн |
| FR-C-14 | Pull-to-refresh / шинэчлэх | Хэрэгжсэн |

### 5.4 Төлбөртэй захиалга (Booking flow)

```
clinic → doctor → service → select-slot → health-form → confirm
→ account-info (wallet/qpay/card) → payment → success
```

| ID | Шаардлага | Статус |
|----|-----------|--------|
| FR-C-20 | Цаг сонгох, давхардал шалгах | Хэрэгжсэн |
| FR-C-21 | Эрүүл мэндийн анкет | Хэрэгжсэн |
| FR-C-22 | Төлбөр: цахим данс | Хэрэгжсэн |
| FR-C-23 | Төлбөр: QPay (invoice, confirm) | Хэрэгжсэн |
| FR-C-24 | Төлбөрт дараа захиалга `confirmed` | Хэрэгжсэн |
| FR-C-25 | Захиалга дэлгэрэнгүй (`my-orders/[id]`) | Хэрэгжсэн |

### 5.5 Чат

| ID | Шаардлага | Статус |
|----|-----------|--------|
| FR-C-30 | Ярианы жагсаалт | Хэрэгжсэн |
| FR-C-31 | Мессеж илгээх, уншсан тэмдэглэх | Хэрэгжсэн |
| FR-C-32 | Header: эмчийн нэр (route param + API) | Хэрэгжсэн |
| FR-C-33 | Илгээлт амжилтгүй → дахин оролдох | Хэрэгжсэн |
| FR-C-34 | Офлайн үед илгээхгүй, мэдэгдэл | Хэрэгжсэн |

### 5.6 Эмчийн үнэлгээ

| ID | Шаардлага | Статус |
|----|-----------|--------|
| FR-C-40 | Төлбөртэй/баталгаажсан захиалгад л үнэлгээ өгөх | Хэрэгжсэн |
| FR-C-41 | Эмчийн профайл + онцлох жагсаалтад үнэлгээ харагдах | Хэрэгжсэн |
| FR-C-42 | POST дараа cache invalidation | Хэрэгжсэн |

### 5.7 Бусад

| ID | Шаардлага | Статус |
|----|-----------|--------|
| FR-C-50 | Хайлт (эмнэлэг, эмч) | Хэрэгжсэн |
| FR-C-51 | Цахим данс, гүйлгээ | Хэрэгжсэн |
| FR-C-52 | Хадгалсан карт (UI) | Хэсэгчлэн |
| FR-C-53 | ЭМД (placeholder) | UI л |
| FR-C-54 | Зөвлөгөөний нийтлэл (advice) | Mock/статик |
| FR-C-55 | Мэдэгдэл | Хэрэгжсэн |

---

## 6. Функциональ шаардлага — Үйлчилгээ үзүүлэгч (Provider)

### 6.1 Навигаци

| Tab | Дэлгэц |
|-----|--------|
| Самбар | `dashboard` |
| Захиалга | `bookings` |
| Үйлчилгээ | `services` |
| Профайл | `provider-profile` |

**Header (бүх tab):** Мэдэгдэл + **Чат** icon (notification-ийн хажууд).

### 6.2 Самбар

| ID | Шаардлага |
|----|-----------|
| FR-P-01 | Өнөөдрийн захиалга, хүлээгдэж буй хүсэлт |
| FR-P-02 | Эмнэлгийн профайл бүрэн байдал (%) |
| FR-P-03 | Орлого/статистик товч |

### 6.3 Эмнэлэг

| ID | Шаардлага | Статус |
|----|-----------|--------|
| FR-P-10 | Эмнэлэг бүртгэх (`clinic-register`) | Хэрэгжсэн |
| FR-P-11 | Эмнэлэг засах + **лого upload** | Хэрэгжсэн |
| FR-P-12 | Лого `clinics.logo_url` + onboarding fallback | Хэрэгжсэн |
| FR-P-13 | Профайл харах (лого preview) | Хэрэгжсэн |

### 6.4 Эмч, үйлчилгээ, хуваарь

| ID | Шаардлага |
|----|-----------|
| FR-P-20 | Эмч бүртгэх (зураг, мэргэжил) |
| FR-P-21 | Үйлчилгээ: төлбөрт / үнэгүй онлайн төрөл |
| FR-P-22 | Цаг нэмэх: `paid_visit`, `free_consultation` |
| FR-P-23 | Ангилал удирдах |
| FR-P-24 | Эмчийн хуваарь (долоо хоногийн загвар) |

### 6.5 Захиалга

| ID | Шаардлага |
|----|-----------|
| FR-P-30 | Өнөөдрийн жагсаалт |
| FR-P-31 | Хүсэлт баталгаажуулах / татгалзах / цуцлах |
| FR-P-32 | Meet link оруулах |
| FR-P-33 | Захиалга дэлгэрэнгүй |

### 6.6 Чат, өвчтөн

| ID | Шаардлага |
|----|-----------|
| FR-P-40 | Үйлчлүүлэгчтэй чат (`/chat`, `/chat-detail`) |
| FR-P-41 | Өвчтөний жагсаалт |
| FR-P-42 | Шинжилгээний хариу нэмэх (lab-tests) |

### 6.7 Орлого

| ID | Шаардлага |
|----|-----------|
| FR-P-50 | Орлого/статистик дэлгэц (`revenue`) |

---

## 7. Функциональ шаардлага — Системийн админ

| ID | Шаардлага |
|----|-----------|
| FR-S-01 | Dashboard: хэрэглэгч, эмнэлэг, төлбөр тойм |
| FR-S-02 | Provider бүртгэл баталгаажуулах/татгалзах |
| FR-S-03 | Эмнэлэг, эмч, хэрэглэгчийн жагсаалт |
| FR-S-04 | Онцлох контент (featured items) |
| FR-S-05 | Мэдэгдэл broadcast |
| FR-S-06 | Moderation (хэрэгжүүлэлтийн түвшинд шалгах) |

---

## 8. Өгөгдлийн загвар (гол entity)

| Entity | Тайлбар | Гол талбарууд |
|--------|---------|---------------|
| `users` | Хэрэглэгч | role, email, onboarding_status |
| `clinics` | Эмнэлэг | clinic_name, logo_url, approval_status |
| `doctors` | Эмч | clinic_id, specialization, profile_image |
| `services` | Үйлчилгээ | price, is_free_consultation, consultation_type |
| `schedule_slots` | Цаг | slot_date, consultation_type |
| `bookings` | Төлбөрт захиалга | status, payment |
| `consultations` | Үнэгүй/зөвлөгөө | meeting_link, status |
| `chat_conversations` | Чат | clinic + customer + provider |
| `chat_messages` | Мессеж | body, message_text |
| `doctor_reviews` | Үнэлгээ | rating, comment |
| `wallets` | Цахим данс | balance |
| `provider_onboarding_submissions` | Бүртгэлийн маягт | logo_url, status |

---

## 9. API хураангуй (REST)

**Base:** `/api` (жишээ: `http://localhost:4000/api`)

| Модуль | Жишээ endpoint |
|--------|----------------|
| Auth | `POST /auth/login`, `POST /auth/register` |
| Clinics | `GET /clinics`, `PUT /clinics/:id` (logo_url) |
| Doctors | `GET /doctors`, `POST /doctors` |
| Schedule | `GET /schedule-slots`, `POST /schedule-slots` |
| Bookings | `POST /bookings`, `PATCH` status |
| Consultations | `GET /consultations/free-availability` |
| Chat | `POST /conversations/ensure`, `POST .../messages` |
| Wallet | `GET /wallet/balance`, `POST /wallet/qpay/...` |
| Onboarding | `PATCH /provider-onboarding/logo` |
| Admin | `GET /admin/dashboard`, `PATCH .../providers/...` |

**Auth:** `Authorization: Bearer <JWT>`

---

## 10. UX/UI шаардлага

| ID | Шаардлага |
|----|-----------|
| UX-01 | Бүх хэрэглэгчид харагдах текст **Монгол** |
| UX-02 | Dark + Light mode |
| UX-03 | Touch target ≥ 44px |
| UX-04 | Алдааны мессеж ойлгомжтой (`toFriendlyErrorMn`) |
| UX-05 | Loading, Empty, Error state бүх жагсаалтад |
| UX-06 | Web: төвлөрсөн багана (max width), mobile fullscreen |
| UX-07 | NativeWind utility class, бага inline StyleSheet |
| UX-08 | Expo Go-д ажиллах (custom native module хориг) |

---

## 11. Бус функциональ шаардлага (NFR)

| ID | Категори | Шаардлага |
|----|----------|-----------|
| NFR-01 | Аюулгүй байдал | HTTPS, bcrypt, JWT |
| NFR-02 | Гүйцэтгэл | API timeout 12s, GET cache |
| NFR-03 | Найдвартай байдал | Offline banner, reconnect refresh |
| NFR-04 | Өргөтгөх чадвар | Repository pattern, `services/api` давхарга |
| NFR-05 | Засвар үйлчилгээ | SQL migration (`db:migrate:catchup`) |
| NFR-06 | Хандалтын стандарт | Accessibility label (гол товч) |

---

## 12. Хэрэглэгчийн түүх (User Stories) — жишээ

### Үйлчлүүлэгч

> **US-C-01:** Болд нь үнэгүй зөвлөгөөний цаг сонгож, эмчтэй чат нээж, асуултаа илгээнэ.  
> **Хүлээн авах:** Захиалга `accepted`, чатанд мессеж харагдана, header-д эмчийн нэр зөв.

> **US-C-02:** Болд төлбөртэй цаг захиалж QPay-ээр төлнө.  
> **Хүлээн авах:** Төлбөр амжилттай, захиалга `confirmed`, үнэлгээ өгөх боломж нээгдэнэ.

### Үзүүлэгч

> **US-P-01:** Сарана эмнэлгийн лого оруулж хадгална.  
> **Хүлээн авах:** `PUT /clinics/:id` амжилттай, нүүр хуудсан дээр лого харагдана.

> **US-P-02:** Сарана шинэ захиалгыг баталгаажуулна.  
> **Хүлээн авах:** Статус `confirmed`, үйлчлүүлэгчид мэдэгдэл (ирээдүй).

---

## 13. Хүлээн авах шалгалт (Acceptance Criteria) — Critical paths

### 13.1 Нэвтрэлт

- [ ] Бүртгэлтэй имэйл, зөв нууц үгээр нэвтэрнэ
- [ ] Буруу нууц үгээр монгол алдаа харагдана
- [ ] Customer → home, Provider → dashboard, Admin → admin-dashboard

### 13.2 Үнэгүй зөвлөгөө

- [ ] Provider үнэгүй цаг нэмсэн эмнэлэг жагсаалтад харагдана
- [ ] Цаг захиалагдана
- [ ] Чат нээгдэж, мессеж илгээгдэнэ

### 13.3 Төлбөрт захиалга

- [ ] Wallet эсвэл QPay-ээр төлбөр амжилттай
- [ ] Захиалга баталгаажсан төлөвт орно

### 13.4 Provider лого

- [ ] Лого сонгоод хадгалах амжилттай (404 onboarding алдаа гарахгүй)
- [ ] Migration `017_clinic_logo_url.sql` ажилласан

---

## 14. Release төлөвлөгөө (Product)

| Release | Нэр | Гол агуулга |
|---------|-----|-------------|
| R0 | Internal Alpha | Auth, clinic, booking, local API |
| R1 | Beta | QPay, free consult, chat, reviews |
| R2 | Public Web | `deploy:web`, Firebase |
| R3 | Store | EAS build, push notifications бүрэн |

---

## 15. Мэдэгдэж буй хязгаарлалт / Technical debt

| Асуудал | Нөлөө | Төлөвлөгөө |
|---------|-------|-----------|
| Meet link placeholder | Видео бодит биш | Phase 3 |
| ЭМД API байхгүй | Зөвхөн UI | Partner холболт |
| Push — local demo | Бодит push биш | expo-notifications бүрэн |
| Онбординг байхгүй provider | Лого зөвхөн clinic table | Migration 017 |
| README GitLab template | Баримт биш | README шинэчлэх |

---

## 16. Хавсралт — Файлын бүтэц

```
tusul2/
├── frontend/          # Expo app
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (customer)/
│   │   ├── (provider)/
│   │   └── (system-admin)/
│   ├── components/
│   ├── services/api/
│   └── constants/
├── backend/
│   ├── src/routes|services|repositories/
│   └── sql/migrations/
└── docs/
    ├── BRD-mongol.md   ← энэ файлын хос
    └── PRD-mongol.md   ← энэ файл
```

---

## 17. Тохируулга, deploy

| Орчин | Frontend | Backend |
|-------|----------|---------|
| Dev | `npm start` (Expo) | `npm run dev` |
| Web prod | `npm run deploy:web` | Server + `db:migrate:catchup` |
| Env | `EXPO_PUBLIC_API_URL` | `.env` DATABASE, JWT_SECRET |

---

*PRD нь хөгжүүлэлтийн шийдвэр гаргахад ашиглана. BRD-тай зөрчилдвөл эхлээд бизнесийн BRD-ийг давуу тавина.*
