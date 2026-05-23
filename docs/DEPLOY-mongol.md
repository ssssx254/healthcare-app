# Production deploy — заавар (Монгол)

Firebase (`*.web.app`) зөвхөн **frontend**-ийг харуулна. API нь **тусдаа сервер** (жишээ Render) + **MySQL** дээр ажиллана.

Таны алдаа: **«Өгөгдлийн сандийн бүтэц API-тай таарахгүй»** — production өгөгдлийн санд migration ажиллаагүй (ихэвчлэн `014_free_consultation_flow` дутуу).

---

## 1. Шалгах зүйлс

| Зүйл | Хаана |
|------|--------|
| Frontend URL | `https://healthcare-app-57e4b.web.app` |
| API URL | `frontend/.env.production` → `EXPO_PUBLIC_API_URL` |
| Backend | Render / Railway гэх мэт |
| Database | Production MySQL (backend `.env`) |

Frontend зөв API руу заасан эсэхийг build-ийн өмнө шалгана:

```bash
cd frontend
npm run deploy:web
```

(энэ нь `check-production-env.js` ажиллуулна)

---

## 2. Production өгөгдлийн санд migration (ЗААВАЛ)

**Локал компьютерээс** production DB руу холбогдож migration ажиллуулна.

### Алхам A — Production DB-ийн холболт

Render → **Environment** → `DATABASE_URL` (Aiven MySQL) хуулна.

`backend/.env` дээр **локал `DB_HOST=127.0.0.1` үлдээхгүй** — production URL тавина:

```env
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/defaultdb?ssl=true
```

(эсвэл `DB_HOST` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` — гэхдээ `DATABASE_URL` давуу эрхтэй)

### Алхам B — Migration ажиллуулах

```bash
cd backend
npm run db:migrate:production
```

`db:migrate:production` нь локал MySQL руу буруу холбогдвол **зогсоно** (өмнө нь ийм алдаа гарсан).

Эсвэл бүрэн catchup:

```bash
npm run db:migrate:catchup
```

Амжилттай бол: `Бүгд амжилттай` / `[migrate-deploy] OK` гэж гарна.

### Алхам C — Backend дахин эхлүүлэх

Render dashboard → Service → **Manual Deploy** эсвэл restart.

---

## 3. Render Shell-ээр (сонголт)

Render дээр Web Service → **Shell**:

```bash
cd backend
npm run db:migrate:deploy
```

(Repository root structure-аас хамаар `cd` засна.)

---

## 4. «Боломжит эмч алга» хоёр дахь мессеж

Migration амжилттай болсон ч энэ хэвээр байвал — **өгөгдөл байхгүй** гэсэн үг:

1. **Provider** эрхээр нэвтэрнэ
2. **Эмч бүртгэх** → **Үйлчилгээ** дээр «Үнэгүй онлайн зөвлөгөө» идэвхжүүлнэ
3. **Хуваарь** → `free_consultation` төрлийн цаг нэмнэ
4. Эмнэлэг `approved` статустай байх

Дараа нь үйлчлүүлэгч тал **Шинэчлэх** дарна.

---

## 5. Deploy дараалал (sanах ойлголт)

```
1. Git push → Backend auto-deploy (Render)
2. backend: npm run db:migrate:deploy  (production DB дээр)
3. frontend: npm run deploy:web         (Firebase)
4. Аппыг шалгах
```

---

## 6. Түгээмэл алдаа

| Алдаа | Шийдэл |
|-------|--------|
| Schema таарахгүй | `db:migrate:deploy` production DB дээр |
| CORS / network | API URL зөв эсэх, backend асаалттай эсэх |
| 401 нэвтрэлт | Production дээр хэрэглэгч бүртгэлтэй эсэх |
| Эмч хоосон | Provider цаг нэмсэн эсэх |

---

*Migration жагсаалт: `backend/scripts/migration-manifest.js`*
