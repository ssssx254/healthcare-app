# Expo Go (локал) vs Web (Render + Aiven)

## Товч

| | Expo Go | Firebase web |
|---|---------|----------------|
| **Команд** | `cd frontend && npm start` | `cd frontend && npm run deploy:web` |
| **Env файл** | `.env` | `.env.production` |
| **API** | `http://<PC-IP>:4000/api` | `https://healthcare-app-8bwy.onrender.com/api` |
| **Database** | Локал MySQL (`backend/.env`) | Aiven (Render `DATABASE_URL`) |

`npm run deploy:web` нь зөвхөн `.env.production` уншина — Expo Go-ийн `.env`-д нөлөөлөхгүй.

## 1. Локал (Expo Go)

### Backend

```powershell
cd backend
copy .env.example .env
# DB_HOST, DB_USER, DB_PASSWORD, DB_NAME тохируулна
npm run dev
```

### Frontend

```powershell
cd frontend
copy .env.example .env
# ipconfig → IPv4 → REACT_NATIVE_PACKAGER_HOSTNAME=...
npm start
```

`EXPO_PUBLIC_APP_ENV=development` байх ёстой (`.env.example`-ийн default).

## 2. Web (production)

`frontend/.env.production`:

```env
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_API_URL=https://healthcare-app-8bwy.onrender.com/api
```

```powershell
cd frontend
npm run deploy:web
```

## 3. Expo Go + production API (туршилт)

Локал биш, Render-ийг Expo-оор турших:

```powershell
cd frontend
npm run start:cloud
```
