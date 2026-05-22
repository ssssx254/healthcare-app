# Business Requirements Document (BRD)

**Healthcare Consultation & Booking Platform (MedEasy / tusul2)**

| Талбар | Дэлгэрэнгүй |
|--------|-------------|
| Баримт бичгийн төрөл | Бизнес Шаардлагын Баримт Бичиг (BRD) |
| Хувилбар | **1.1** (хэрэгжилттэй нийцүүлсэн) |
| Төлөв | Оролцогч талуудын хяналтын ноорог |
| Бүтээгдэхүүн | Эрүүл мэндийн зөвлөгөө болон цаг захиалгын mobile-first платформ |
| Үндсэн зах зээл | Монгол Улс (UI Монгол хэлээр, техникийн нэршил Англи хэлээр) |
| Ашиглах орчин | Expo Go (iOS/Android), responsive web (Firebase Hosting) |
| Repo | `tusul2` (GitHub `origin` → Render API; GitLab `gitlab` холбогдсон) |

**Шинжилэх ухаан, технологийн их сургууль** — Мэдээлэл, холбооны технологийн сургууль  
**Төсөл:** Эрүүл мэнд ба зөвлөгөө, Мэдээллийн системийн төсөл I (F.ITB351), 2026 хавар  

| Үүрэг | Нэр | Код |
|------|-----|-----|
| Удирдагч багш | Т.Золбоо | F.IT20 |
| Гүйцэтгэгч | Х.Мөнх-Оргил | B221930010 |
| | Б.Эрхэмсайхан | B221930007 |
| | А.Уянга | B221930056 |
| | Д.Бямбацэцэг | B221930038 |

---

## 1. Төслийн ерөнхий танилцуулга

Платформ нь өвчтөн (customer) болон эрүүл мэндийн үйлчилгээ үзүүлэгч (provider) байгууллагыг холбоно.

**Хэрэглэгчид:** онлайн зөвлөгөө (чат), эмч/эмнэлэг хайх, цаг захиалах, шинжилгээний хариу, захиалгын түүх, wallet төлбөр.

**Үйлчилгээ үзүүлэгч:** эмч, үйлчилгээ, цагийн хуваарь, захиалга удирдах; бүртгэл **админаар баталгаажина**.

**Системийн админ:** provider баталгаажуулалт, контент хяналт, статистик.

**Техникийн онцлог (хэрэгжилт):** REST API + MySQL, JWT, offline cache, push bootstrap, dark mode.

---

## 2. Бизнесийн зорилго

*(BRD 1.0-тай ижил — BG-01 … BG-05)*

| ID | Зорилго | Амжилтын үзүүлэлт |
|----|---------|-------------------|
| BG-01 | Эрүүл мэндийн үйлчилгээний хүртээмжийг нэмэгдүүлэх | Сар бүрийн зөвлөгөө, захиалга өсөх |
| BG-02 | Эмнэлгийн үйл ажиллагааг дижитал болгох | Эмч, цаг, хүсэлт системээр |
| BG-03 | Төлбөртэй цаг захиалга | Төлбөрийн бүртгэлтэй захиалга |
| BG-04 | Итгэлцэл, хяналт | Админаар баталгаажсан provider |
| BG-05 | Хэрэглэгчийг хадгалах | Notification, chat, түүх |

### 2.2 Үйл ажиллагааны зорилго

- Утас, гар бүртгэлийг багасгах  
- Урсгал: **Хүсэлт → Баталгаажуулах → Төлбөр → Дуусгах/Цуцлах**  
- Үнэгүй онлайн зөвлөгөө + төлбөртэй үзлэг  
- Админ статистик, хяналт  

### 2.3 Хязгаарлалт ба зарчим

| Зарчим | Хэрэгжилт |
|--------|-----------|
| Expo Go mobile-first | Expo SDK **54**, NativeWind |
| Нэг app — олон role | `(customer)`, `(provider)`, `(system-admin)`, `(auth)` |
| Өгөгдөл | **API-first** (`frontend/services/api/*`); зарим fixture/mock үлдсэн |
| UI хэл | Монгол; код/schema Англи |
| Deploy | Web: Firebase; API: **Render** (GitHub `main`); DB: локал / **Aiven** |

---

## 3. Оролцогч талууд

*(Өвчтөн, provider, эмч, админ, PO, engineering, support, payment partner — BRD 1.0-тай ижил)*

---

## 4. Хэрэглэгчийн төрлүүд

| Role | Код | Тайлбар |
|------|-----|---------|
| Customer | `customer` | Өвчтөн |
| Provider | `provider` | Эмнэлэг/клиник |
| System Admin | `system_admin` | Системийн админ |

### 4.2 Role дүрэм (хэрэгжилт)

- Нэг хэрэглэгч **нэг үндсэн role** (`users.role`).
- Provider `onboarding_status`:
  - **`pending`** — `/provider-pending` дэлгэц; админ батална.
  - **`approved`** — provider самбар бүрэн.
  - **`rejected`** — татгалзсан (UI дээр мэдэгдэл).
- Provider **онбординг илгээлт** (`provider_onboarding_submissions`) — 5 алхамт бүртгэл + лого (data URL); админ `admin-registrations` дээр харна.
- Админ үйлдэл: API + UI (бүрэн audit trail DB-д хэсэгчлэн — `content_reports`, onboarding reviewed_by).

---

## 5. Үндсэн урсгалууд

### 5.1 Хэрэглэгчийн цаг захиалга

Бүртгэл/нэвтрэх → эмнэлэг/эмч → үйлчилгээ → цаг → баталгаа → төлбөр (wallet/QPay mock) → амжилт.

### 5.2 Онлайн зөвлөгөө

Чат эхлүүлэх → provider хариулна → (шаардлагатай бол) төлбөртэй үзлэг рүү шилжих — **үнэгүй зөвлөгөөний хүсэлт** (`consultation_requests`, migration 014).

### 5.3 Provider урсгал (хэрэгжилттэй)

1. **Бүртгэл** — `register` (provider, 5 алхам) → `providerOnboardingApi.submit`  
2. **Админ батлалт** — `admin-registrations` эсвэл `db:approve-pending-providers`  
3. **Нэвтрэх** → `dashboard`  
4. **Эмнэлэг** — `clinic-register` (API `POST /clinics`) — онбордингоос **тусдаа** operational clinic  
5. Эмч → үйлчилгээ → хуваарь → захиалга  

### 5.4 Wallet ба төлбөр

Wallet цэнэглэх, захиалгад хасах — API + UI; QPay **mock/invoice** урсгал.

### 5.5 Notification

In-app + Expo push bootstrap; event-ээр мэдэгдэл (баталгаа, чат г.м).

---

## 6. MVP хүрээ

### MVP-д багтсан (хэрэгжсэн эсвэл хэсэгчлэн)

| Бүсэг | Төлөв |
|-------|--------|
| Auth (JWT, register, login, forgot password) | ✅ API |
| Customer: нүүр, эмч, цаг, wallet, чат, мэдэгдэл, lab-tests tab | ✅ |
| Provider: dashboard, эмч CRUD, үйлчилгээ, хуваарь, захиалга, чат | ✅ |
| Admin: dashboard, баталгаажуулалт, хэрэглэгч, moderation | ✅ |
| Backend REST + MySQL | ✅ |
| Offline cache, reconnect refresh | ✅ (доор 6.1) |
| Dark mode | ✅ |

### MVP-д ороогүй / дараа

Видео зөвлөгөө, WebSocket realtime, даатгал, бүрэн автомат refund, HIPAA/FHIR.

### 6.1 Хэрэгжилтийн өөрчлөлт (2026-05)

| Өөрчлөлт | Тайлбар |
|----------|---------|
| Өгөгдлийн сан | Mock-only биш — **REST API** гол эх сурвалж |
| Provider категори | `clinic_service_categories` API + migration `016` |
| Эмч устгах | `DELETE /api/doctors/:id` |
| Лого онбординг | `logo_url` **MEDIUMTEXT** (`sql/alter_provider_onboarding_logo_url.sql`) |
| Орчин | Expo Go → локал API; Web deploy → Render + Aiven (`docs/ENV-EXPO-WEB.md`) |
| Сүлжээ сэргэх | `ReconnectAutoRefresh` дэлгэц **солихгүй**, зөвхөн data refresh |
| Локал цэвэрлэгээ | `db:cleanup-local-catalog`, `db:cleanup-local-users` |

---

## 7. Функциональ шаардлага

*(FR-AUTH, FR-CUS, FR-CHAT, FR-PRV — BRD 1.0 жагсаалт хүчинтэй)*

**Нэмэлт хэрэгжсэн:**

| ID | Шаардлага |
|----|-----------|
| FR-PRV-08 | Provider онбординг илгээлт (5 алхам, лого) |
| FR-PRV-09 | Үйлчилгээний ангилал (clinic categories) |
| FR-ADM-06 | Локал/dev өгөгдөл цэвэрлэх скрипт |

---

## 8. Функциональ бус шаардлага

Гүйцэтгэл, JWT/HTTPS/bcrypt, mobile-first UX, Expo SDK 54, Firebase web — **хэрэгжсэн**.

**Тохируулга:** Render free tier cold start 30–60с; provider dashboard олон API дуудлага (N+1 slot) — сайжруулах төлөвлөгөөт.

---

## 9. Эрсдэлүүд

| ID | Эрсдэл | Шийдэл |
|----|--------|--------|
| R-01 | Хуурамч provider | Админ баталгаажуулалт + onboarding |
| R-02 | Төлбөрийн алдаа | Payment state хяналт |
| R-03 | Интернет тасрах | Offline cache; reconnect **refresh only** |
| R-04 | Notification | In-app + push bootstrap |
| R-05 | Хүрээ тэлэх | Strict MVP |
| **R-06** | **Лого/том талбар DB алдаа** | **MEDIUMTEXT migration; жижиг лого (quality 0.42)** |

---

## 10. Ирээдүйн сайжруулалт

Phase 2: видео, WebSocket. Phase 3: multi-provider, EMR. Phase 4: AI туслах.

---

## 11. Нэр томьёо

Customer, Provider, Wallet, MVP — BRD 1.0-тай ижил.

---

## 12. Document approval

| Role | Нэр | Огноо |
|------|-----|-------|
| Product Owner | Х.Мөнх-Оргил | 2026.05.18 |
| Technical Lead | Д.Бямбацэцэг | 2026.05.18 |
| UI/UX Designer | А.Уянга | 2026.05.18 |
| QA / Documentation | Б.Эрхэмсайхан | 2026.05.18 |
| BRD шинэчлэлт (хэрэгжилт) | Инженерийн баг | **2026.05.22** |

---

*Холбоотой: [PRD.md](./PRD.md), [DEPLOY.md](./DEPLOY.md), [ENV-EXPO-WEB.md](./ENV-EXPO-WEB.md)*
