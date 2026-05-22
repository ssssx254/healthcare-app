# Production deploy — tusul2 (MedEasy)

Firebase дээрх frontend **локал `npm start` шаарддаггүй** — зөвхөн статик `dist/` + production API URL.

---

## 1. Cloud MySQL

Сонголт: **PlanetScale**, **Railway MySQL**, **Render PostgreSQL биш — MySQL**, **AWS RDS**, гэх мэт.

1. MySQL 8+ үүсгэнэ.
2. `backend/sql/schema.sql` ажиллуулна (эсвэл migration catchup).
3. Admin хэрэглэгч: `cd backend && npm run db:create-admin`

**Холболтын мөр (Render/Railway):**

```env
DATABASE_URL=mysql://USER:PASSWORD@HOST:3306/healthcare_db
```

**Aiven** (SSL заавал — `?ssl=true` нэмнэ, backend TLS-ийг автоматаар тохируулна):

```env
DATABASE_URL=mysql://avnadmin:PASSWORD@HOST:14733/defaultdb?ssl=true
```

Эсвэл тусад нь:

```env
DB_HOST=...
DB_PORT=3306
DB_USER=...
DB_PASSWORD=...
DB_NAME=healthcare_db
```

---

## 2. Backend — Render

### 2.1 Repo холбох

1. [Render](https://render.com) → **New +** → **Web Service**
2. Git repo → **Root Directory**: `backend`
3. **Build**: `npm install`
4. **Start**: `npm start`
5. **Health check path**: `/api/health`

### 2.2 Environment variables

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` |
| `PORT` | `4000` (Render `PORT` өгвөл түүнийг ашиглана) |
| `JWT_SECRET` | Урт санамсаргүй string |
| `DATABASE_URL` | Cloud MySQL URL |
| `CORS_ORIGINS` | Firebase домэйнүүд, таслалаар |

**CORS жишээ** (өөрийн Firebase project ID-аар солино):

```text
https://healthcare-app-57e4b.web.app,https://healthcare-app-57e4b.firebaseapp.com
```

### 2.3 Deploy

Deploy дууссаны дараа API суурь:

```text
https://YOUR-SERVICE.onrender.com/api
```

`GET https://YOUR-SERVICE.onrender.com/api/health` → `success: true` шалгана.

### Railway (хувилбар)

1. New Project → Deploy from GitHub → `backend` folder
2. Start command: `npm start`
3. Ижил env хувьсагчид
4. Public URL → `https://xxx.up.railway.app/api`

---

## 3. Frontend — Firebase Hosting

### 3.1 Production API URL тохируулах

```powershell
cd frontend
copy .env.production.example .env.production
```

`.env.production` засварлана:

```env
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_API_URL=https://YOUR-SERVICE.onrender.com/api
```

**Чухал:** `npm run export:web` нь `NODE_ENV=production` + `.env.production` уншиж `EXPO_PUBLIC_*`-ийг build-д embed хийнэ (`scripts/export-web.js`). Localhost production build-д орохгүй.

### 3.2 Build + deploy

```powershell
cd frontend
npm install
npm run export:web
firebase deploy --only hosting
```

Нэг команд:

```powershell
npm run deploy:web
```

(`export:web` + `firebase deploy` — `.env.production` байх ёстой)

### 3.3 Шалгалт

1. `https://YOUR-PROJECT.web.app` нээнэ
2. DevTools → Network → login/API → `https://YOUR-SERVICE.onrender.com/api/...` (localhost биш)
3. CORS алдаа гарвал backend `CORS_ORIGINS`-д Firebase URL нэмнэ

---

## 4. Локал хөгжүүлэлт vs Web (хоёр орчин)

| Орчин | Frontend | Backend / DB |
|--------|----------|----------------|
| **Expo Go** (`npm start`) | `frontend/.env` → `EXPO_PUBLIC_APP_ENV=development` | Локал MySQL + `cd backend && npm run dev` |
| **Web** (`npm run deploy:web`) | `frontend/.env.production` → Render URL | Render → Aiven |

Expo Go (локал):

```powershell
# 1) Backend
cd backend
# backend/.env → локал MySQL (DB_HOST=127.0.0.1)
npm run dev

# 2) Frontend — frontend/.env (development), ipconfig → REACT_NATIVE_PACKAGER_HOSTNAME
cd ../frontend
npm start
```

Production API-аар Expo турших: `npm run start:cloud` (`.env` өөрчлөхгүй).

| Тохиолдол | `EXPO_PUBLIC_API_URL` |
|-----------|------------------------|
| PC + Expo web/iOS sim | `http://localhost:4000/api` |
| Android emulator | `http://10.0.2.2:4000/api` |
| Expo Go утас | `http://<PC-LAN-IP>:4000/api` эсвүй хоосон (Metro host-оос автоматаар) |

Backend:

```powershell
cd backend
copy .env.example .env
npm install
npm run db:schema
npm start
```

---

## 5. API суурь нэг газар

Бүх `services/api/*` → `lib/api/client.ts` → `getApiBaseUrl()` (`frontend/config/api.ts`).

Production build-д:

- `EXPO_PUBLIC_API_URL` заавал
- `localhost` fallback **ашиглахгүй**

---

## 6. Түгээмэл алдаа

| Алдаа | Шийдэл |
|--------|--------|
| Firebase app API руу `localhost` руу хандаж байна | `.env.production` дахин тохируулж `npm run export:web` |
| CORS blocked | Backend `CORS_ORIGINS` + Firebase URL |
| Render cold start удаан | Free tier — эхний хүсэлт 30–60с |
| `/api/health` → `database: disconnected` (Aiven) | `DATABASE_URL` төгсгөлд `?ssl=true` байгаа эсэх; Render Logs дээр `[health] MySQL connection failed` шалгана |
| MySQL SSL | Aiven: `?ssl=true` эсвэл `ssl-mode=REQUIRED` |

---

## 7. Файлуудын тойм

| Файл | Зориулалт |
|------|-----------|
| `frontend/.env.production` | Production API (gitignore) |
| `frontend/app.config.ts` | Expo + `extra.apiUrl` |
| `frontend/config/api.ts` | `getApiBaseUrl()` |
| `backend/src/config/cors.js` | CORS |
| `backend/render.yaml` | Render blueprint |
| `backend/.env.example` | Backend env жишээ |
