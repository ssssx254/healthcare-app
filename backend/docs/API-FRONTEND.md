# REST API — frontend integration

Бүх JSON хариу **энгийн гэрээ** дагана: амжилттай бол `success: true`, алдаа бол `success: false`. Ирээдүйд breaking өөрчлөлтийг ялгахад `apiVersion: "1"` (амжилт ба алдаанд орно).

**Суурь URL:** `/api/...` (жишээ: `GET /api/health`).

---

## 1. Ерөнхий бүтэц

### 1.1 Амжилт — нэг объект / нэг мөр

```json
{
  "success": true,
  "message": "Амжилттай",
  "data": { "id": 1, "clinic_name": "..." },
  "apiVersion": "1"
}
```

`201 Created` (`created()`): ижил бүтэц, `data` нь шинээр үүссэн бүртгэл.

### 1.2 Амжилт — хуудаслалттай жагсаалт

`data` нь `{ items, meta }` хэлбэртэй.

```json
{
  "success": true,
  "message": "Амжилттай",
  "data": {
    "items": [{ "id": 1 }],
    "meta": {
      "page": 1,
      "pageSize": 20,
      "total": 42,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "apiVersion": "1"
}
```

**Query (хуудаслалт):** `page` (default `1`), `page_size` эсвэл `pageSize` (endpoint-оос хамааран default `20`, max ихэвчлэн `100`; зарим endpoint `200` хүртэл).

**Query (эрэмбэ):** `sort_by` / `sortBy`, `sort_order` / `sortOrder` (`asc` | `desc`). Зөвшөөрөгдсөн талбарууд endpoint бүрт доор заасан.

### 1.3 Алдаа

```json
{
  "success": false,
  "message": "Тайлбар (Монгол)",
  "apiVersion": "1",
  "errors": { "code": "OPTIONAL", "details": null }
}
```

### 1.4 Талбарын нэршил (backend ↔ frontend)

- API **snake_case** (`clinic_id`, `full_name`, `service_name`, …).
- `frontend/types/healthcare/*` **camelCase** — хувиргалтыг `frontend/services/api/mappers/fromBackend.ts` (эмч, эмнэлэг, үйлчилгээ) эсвэл дэлгэц бүрт хийнэ.

| API | Domain (UI) |
|-----|-------------|
| `full_name` | `User` / `Doctor.name` |
| `clinic_name` | `Clinic.name` |
| `service_name` | `HealthcareService.title` |
| `is_free_consultation` | `HealthcareService.kind`: `1`/`true` → `free_online`, бусад → `formal` |
| `consultation_type` `online` / `in_person` | `isOnline` / `isAmbulatory` |

**Тэмдэглэл:** `GET /api/clinics` жагсаалтын мөрөнд `doctors_count` ирэхгүй; UI-д `doctorsCount` нь түр `0` эсвэл `GET /api/doctors?clinic_id=` дээрээс тоолно.

### 1.5 `204 No Content`

Зарим endpoint хоосон body буцааж болно (`noContent`).

### 1.6 Legacy: массив шууд `data`-д

Дараах нь одоогоор **хуудаслалтгүй**, `data` нь **массив**:

- `GET /api/medical-records/my/notes`, `.../my/prescriptions`, `.../my/lab-results`
- `GET /api/medical-records/notes`, `.../prescriptions`, `.../lab-results` (query-ээр өвчтөн шүүлт)
- `GET /api/chat/conversations`, `GET /api/chat/conversations/:id/messages`

Ирээдүйд `items` + `meta` руу нэгтгэх төлөвтэй.

---

## 2. Auth — `/api/auth`

| Method | Route | Auth | Request body | Response `data` |
|--------|-------|------|--------------|-----------------|
| POST | `/register` | — | `full_name`, `email`, `password`, `role?` (`customer`\|`provider`), `phone?` | `{ user, token, role }` |
| POST | `/login` | — | `identifier` эсвэл `email`, `password` | `{ user, token, role }` |
| POST | `/forgot-password` | — | `identifier` | `{ success, message }` эсвэл `{ success, message, reset_token }` (dev/mock) |
| POST | `/reset-password` | — | `token`, `new_password` | `{ success, message }` |
| GET | `/me` | Bearer | — | `user` объект (`id`, `full_name`, `email`, `role`, `onboarding_status`, `phone`, `created_at`) |

**`user` жишээ:**

```json
{
  "id": 3,
  "full_name": "Б. Болд",
  "email": "bold@example.com",
  "role": "customer",
  "onboarding_status": "approved",
  "phone": null,
  "created_at": "2026-04-01T12:00:00.000Z"
}
```

**Нэвтрэх амжилт:**

```json
{
  "success": true,
  "message": "Нэвтэрлээ",
  "data": {
    "user": { "id": 3, "full_name": "Б. Болд", "email": "bold@example.com", "role": "customer", "onboarding_status": "approved", "phone": null, "created_at": "..." },
    "token": "<jwt>",
    "role": "customer"
  },
  "apiVersion": "1"
}
```

---

## 3. Эмнэлэг — `/api/clinics`

| Method | Route | Auth | Query / Body | Response |
|--------|-------|------|--------------|----------|
| GET | `/` | — | `page`, `page_size`, `sort_by` (`created_at`\|`clinic_name`), `sort_order`, `city`, `clinic_type`, `q` | **Paginated** — эмнэлгийн мөр (`approval_status` зөвхөн баталгаажсан) |
| GET | `/:id` | — | — | Нэг эмнэлэг (объект) |
| GET | `/provider/:providerUserId` | — | — | `{ provider_user_id, onboarding_status, clinic }` — `clinic` null байж болно |
| POST | `/` | Provider (баталгаажсан) | `clinic_name`, `address`, … (үүсгэх талбарууд) | **201** нэг эмнэлэг |
| PUT | `/:id` | Provider (баталгаажсан) | `clinic_name`, `description`, `address`, `phone`, `email` | Нэг эмнэлэг |

**Жагсаалтын жишээ (`data`):**

```json
{
  "items": [
    {
      "id": 1,
      "owner_user_id": 2,
      "clinic_name": "Өргөө эмнэлэг",
      "description": null,
      "address": "УБ",
      "city": "Улаанбаатар",
      "clinic_type": null,
      "phone": "70000000",
      "email": null,
      "approval_status": "approved",
      "created_at": "..."
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 1, "totalPages": 1, "hasNext": false, "hasPrev": false }
}
```

---

## 4. Эмч — `/api/doctors`

| Method | Route | Auth | Query / Body | Response |
|--------|-------|------|--------------|----------|
| GET | `/` | — | `page`, `page_size`, `sort_by` (`created_at`\|`full_name`\|`specialization`), `clinic_id?`, `specialty?` | **Paginated** |
| GET | `/:id` | — | — | Нэг эмч |
| POST | `/` | Provider | үүсгэх body | **201** |
| PUT | `/:id` | Provider | шинэчлэх body | Нэг эмч |

**Эмчийн мөр (жишээ):** `id`, `clinic_id`, `full_name`, `specialization`, `title`, `bio`, `education`, `work_history`, `experience_years`, `profile_image`, `created_at` (жагсаалтад `clinic_name` гэх мэт нэмэлт талбар гарч болно).

---

## 5. Үйлчилгээ — `/api/services`

| Method | Route | Auth | Query / Body | Response |
|--------|-------|------|--------------|----------|
| GET | `/` | — | `page`, `page_size`, `sort_by` (`created_at`\|`service_name`), `clinic_id?`, `doctor_id?` | **Paginated** |
| GET | `/:id` | — | — | Нэг үйлчилгээ |
| POST | `/` | Provider | үүсгэх | **201** |
| PUT | `/:id` | Provider | шинэчлэх | Нэг |
| DELETE | `/:id` | Provider | — | Устгасан үйлчилгээний мөр (`ok`) |

**Үйлчилгээний мөр жишээ:**

```json
{
  "id": 10,
  "clinic_id": 1,
  "doctor_id": 5,
  "service_name": "Кардиологийн зөвлөгөө",
  "category": "general",
  "description": null,
  "price": "50000.00",
  "is_free_consultation": 0,
  "duration_minutes": 30,
  "consultation_type": "online",
  "is_active": 1,
  "created_at": "..."
}
```

---

## 6. Цагийн слот — `/api/schedule-slots`

**Чухал:** `GET /available` нь `GET /`-ээс **өмнө** тодорхойлогдсон (Express дараалал).

| Method | Route | Auth | Query / Body | Response |
|--------|-------|------|--------------|----------|
| GET | `/available` | — | **Заавал** `doctor_id`; `service_id?`, `from_date`, `to_date`, `page`, `page_size` (max 200) | **Paginated** — боломжит слотууд |
| GET | `/` | — | `doctor_id?`, `from_date`, `to_date`, `page`, `page_size`, `sort_by` (`slot_date`) | **Paginated** |
| POST | `/` | Provider | слот үүсгэх | **201** |
| POST | `/generate` | Provider | generate body | ok |
| PUT | `/weekly/:doctorId` | Provider | weekly schedule body | ok |
| PUT | `/:id` | Provider | шинэчлэх | ok |
| PATCH | `/:id/block` | Provider | — | ok |
| PATCH | `/:id/unavailable` | Provider | — | ok |

**Слот жишээ:**

```json
{
  "id": 100,
  "doctor_id": 5,
  "service_id": 10,
  "slot_date": "2026-04-25",
  "start_time": "09:00:00",
  "end_time": "09:30:00",
  "is_available": 1,
  "slot_status": "available"
}
```

---

## 7. Захиалга (booking) — `/api/bookings`

| Method | Route | Auth | Body / Query | Response |
|--------|-------|------|--------------|----------|
| POST | `/` | Customer | `clinic_id`, `doctor_id`, `service_id`, `slot_id` | **201** захиалга |
| GET | `/` | Auth | `validateBookingsListQuery` (статус, төлбөр, эмнэлэг, эмч, огноо, page) | **Paginated** |
| GET | `/customer` | Customer | ижил query | **Paginated** |
| GET | `/provider` | Provider | ижил query | **Paginated** |
| GET | `/:id` | Auth | — | Нэг захиалга |
| PUT | `/:id/status` | Auth | `status?`, `meeting_link?` (хоёрын аль нэг) | Нэг мөр |
| PUT | `/:id/payment` | Customer | — | Төлбөр бүртгэгдсэн мөр |
| PATCH | `/:id/cancel` | Auth | — | Цуцлагдсан мөр |

**Захиалгын жишээ (тогтолцооноос хамааран талбар нэмэгдэнэ):**

```json
{
  "id": 50,
  "patient_user_id": 3,
  "clinic_id": 1,
  "doctor_id": 5,
  "service_id": 10,
  "slot_id": 100,
  "booking_type": "formal",
  "status": "pending",
  "payment_required": 1,
  "payment_status": "unpaid",
  "total_amount": "50000.00",
  "meeting_link": null,
  "created_at": "..."
}
```

---

## 8. Зөвлөгөөний хүсэлт (consultation) — `/api/consultations` ба `/api/consultation-requests`

Хоёр зам ижил router-ийг ашиглана — аль нэгийг сонгоно.

| Method | Route | Auth | Body / Query | Response |
|--------|-------|------|--------------|----------|
| POST | `/free` | Customer | `clinic_id`, `doctor_id?`, `patient_message?`, `request_type` (зөвхөн `online`) | **201** |
| POST | `/` | Customer | ижил (үнэгүй) | **201** |
| GET | `/`, `/customer`, `/provider` | Auth | consultations list query | **Paginated** |
| GET | `/:id` | Auth | — | Нэг хүсэлт |
| PUT | `/:id` | Provider (баталгаажсан) | `status`, `meeting_link`, `provider_message`, `open_chat` | Шинэчлэгдсэн мөр |
| PATCH | `/:id/cancel` | Auth | — | Цуцлагдсан |

---

## 9. Эмнийн тэмдэглэл / жор / шинжилгээ — `/api/medical-records`

| Method | Route | Auth | Body / Query | Response `data` |
|--------|-------|------|--------------|-----------------|
| GET | `/my/notes` | Customer | — | **Массив** тэмдэглэл |
| GET | `/my/prescriptions` | Customer | — | **Массив** |
| GET | `/my/lab-results` | Customer | — | **Массив** |
| POST | `/notes` | Provider | `patient_user_id`, `clinic_id`, `doctor_id`, … | **201** тэмдэглэл |
| GET | `/notes` | Provider | query (өвчтөн шүүлт) | **Массив** |
| POST | `/prescriptions` | Provider | body | **201** |
| GET | `/prescriptions` | Provider | query | **Массив** |
| POST | `/lab-results` | Auth | body | **201** |
| GET | `/lab-results` | Provider | query | **Массив** |

**Тэмдэглэлийн жишээ:**

```json
{
  "id": 1,
  "patient_user_id": 3,
  "clinic_id": 1,
  "doctor_id": 5,
  "booking_id": 50,
  "diagnosis": "Халуурч байна",
  "doctor_notes": "Аминдэм",
  "recommendation": "Амралт",
  "treatment_plan": null,
  "created_by_user_id": 5,
  "created_at": "..."
}
```

---

## 10. Мэдэгдэл — `/api/notifications`

| Method | Route | Auth | Query / Body | Response |
|--------|-------|------|--------------|----------|
| GET | `/me/unread-count` | Auth | — | `{ unread_count: number }` |
| PATCH | `/me/read-all` | Auth | — | `{ marked_all: true }` |
| GET | `/me` | Auth | `page`, `page_size`, `is_read?`, `type?` | **Paginated** |
| PATCH | `/:id/read` | Auth | — | `{ id, is_read: true }` |
| GET | `/:userId` | Auth (зөвхөн өөрийн `userId`) | ижил query | **Paginated** (legacy) |

**Мэдэгдлийн мөр жишээ:**

```json
{
  "id": 20,
  "user_id": 3,
  "title": "Захиалга",
  "body": "Таны захиалга баталгаажлаа.",
  "type": "booking",
  "reference_type": "booking",
  "reference_id": 50,
  "metadata": null,
  "is_read": 0,
  "created_at": "..."
}
```

---

## 11. Хэтэвч / төлбөр — `/api/wallet`, `/api/payments`

### Wallet (`customer`)

| Method | Route | Body / Query | Response `data` |
|--------|-------|--------------|-----------------|
| GET | `/balance` | — | `{ user_id, balance, currency }` |
| POST | `/top-up` | `amount` (заавал), `mock_gateway?`, `payment_method_id?`, `note?` | **201** `{ wallet: { balance, currency }, transaction }` |
| GET | `/transactions` | `page`, `page_size`, `transaction_type?` (`top_up`, `booking_payment`, …) | **Paginated** |
| GET | `/payment-methods` | — | Массив (төлбөрийн хэрэгслүүд) |
| POST | `/payment-methods` | `provider_code?`, `label?`, `masked_detail?`, `is_default?` | **201** нэг мөр |
| POST | `/pay-booking` | `booking_id` (эсвэл `bookingId`) | Шинэчлэгдсэн захиалга / төлбөрийн хариу |

**Цэнэглэлтийн жишээ (201):**

```json
{
  "wallet": { "balance": 150000, "currency": "MNT" },
  "transaction": {
    "id": 99,
    "user_id": 3,
    "direction": "credit",
    "amount": 50000,
    "balance_after": 150000,
    "transaction_type": "top_up",
    "reference_type": null,
    "reference_id": null,
    "gateway_ref": "instant_topup:...",
    "metadata": { "mock_gateway": "instant", "payment_method_id": null, "note": null },
    "created_at": "..."
  }
}
```

### Payments (provider)

| Method | Route | Query | Response `data` |
|--------|-------|-------|-----------------|
| GET | `/provider/revenue-summary` | `clinic_id?`, `from_date?`, `to_date?` | `{ gross_revenue, paid_bookings, by_clinic: [{ clinic_id, clinic_name, revenue, bookings }] }` |

---

## 12. Анкет (`/api/questionnaires`)

| Method | Route | Auth | Body | Response |
|--------|-------|------|------|----------|
| POST | `/` | Customer | Нэгийг заавал: `booking_id` **эсвэл** `consultation_request_id`; `answers` (объект, утга: string \| number \| boolean) | **201** анкетын мөр |
| GET | `/:id` | Auth | — | Нэг мөр |

**Албан захиалгын анкет:** зөвхөн `bookings.status === "pending"` үед (үзүүлэгч батлахаас өмнө).

## 13. Чат (`/api/chat`)

| Method | Route | Auth | Body / Query | Response `data` |
|--------|-------|------|--------------|-----------------|
| POST | `/conversations/ensure` | Auth | Үйлчлүүлэгч: `{ clinic_id }`; үзүүлэгч: `{ clinic_id, customer_user_id }` | Ярианы объект |
| GET | `/conversations` | Auth | — | Массив |
| GET | `/conversations/:id/messages` | Auth | `limit?`, `before_id?` | Массив |
| POST | `/conversations/:id/messages` | Auth | **`{ "body": "<текст>" }`** — талбарын нэр `body` | **201** мессеж |
| PATCH | `/conversations/:id/read` | Auth | `{ up_to_message_id? }` | `{ conversation_id, last_read_message_id }` |

---

## 14. Бусад (товчхон)

- **`GET /api/health`** — `data`: `{ status, database, ... }` (health service-ээс).
- **`/api/provider-onboarding`**, **`/api/admin/*`**, **`/api/reports`** — ижил `success` + `data` дүрмийг дагана; дэлгэрэнгүйг route файлуудаас уншина уу.

---

## 15. Frontend-д зөвлөмж

1. Жагсаалт: `data.items` + `data.meta` эсэхийг endpoint-оор ялгана — дээрх **Legacy** хэсгийг ашиглана.
2. `ApiPaginatedData<T>`, `ApiSuccessEnvelope` төрлүүд: `frontend/types/api/envelope.ts`.
3. Backend мөрийн төрлүүд: `frontend/types/api/backendModels.ts`.
4. Domain руу map: `frontend/services/api/mappers/fromBackend.ts`.

Энэхүү баримт бичиг нь `apiVersion: "1"` үеийн backend-тай нийцнэ.
