# 🗂️ NutriTracker - Developer Quick Reference

## 🎯 Primeiro Acesso

```bash
# 1. Ler isso first 👇
Start with: START_HERE.md

# 2. Rodar tudo em 1 comando
chmod +x setup.sh && ./setup.sh

# 3. Verificar que tá rodando
curl http://localhost:3000/health  # ✅ Should respond

# 4. Abrir app mobile
cd frontend && npm run ios
```

---

## 🧠 Entender a Matemática (5 min read)

**Arquivo**: `backend/src/domain/dietEngine.ts`

```typescript
// 1. Usuário se cadastra com biometria
{
  gender: 'male',
  weight: 80kg,
  height: 175cm,
  age: 28,
  activity: 1.55,
  goal: 'deficit'
}

// 2. Backend calcula TMB (Taxa Metabólica Basal)
// Mifflin-St Jeor: TMB = 10*weight + 6.25*height - 5*age + 5 (males)
// Resultado: ~1780 kcal (o que seu corpo queima em repouso)

// 3. Aplica atividade
// TDEE = TMB * activity_factor = 1780 * 1.55 = 2758 kcal

// 4. Aplica objetivo
// Deficit: 2758 * 0.85 = 2343 kcal/day (perder peso)
// Maintenance: 2758 * 1.0 = 2758 kcal/day
// Surplus: 2758 * 1.1 = 3034 kcal/day (ganhar músculo)

// 5. Distribui macros (30% proteína, 45% carbs, 25% gordura)
// Proteína: 2343 * 0.30 / 4 = 175g
// Carbs: 2343 * 0.45 / 4 = 263g
// Gordura: 2343 * 0.25 / 9 = 65g
```

**Resultado**: Usuário tem meta de 2343 kcal dia com 175g proteína, 263g carbos, 65g gordura.

---

## 📱 Entender o Scanner de Barcode (5 min read)

**Arquivo**: `frontend/src/screens/BarcodeScannerScreen.tsx`

```typescript
// 1. Usuário clica "Escanear"
// Camera abre (expo-camera)

// 2. App escaneia barcode: "7891000123456"
// Envia para backend: GET /api/v1/foods/barcode/7891000123456

// 3. Backend faz:
//    a) Procura em PostgreSQL (scanned_foods_cache)
//    b) Se encontrar + não expirado: retorna do cache (< 5ms)
//    c) Se não: chama OpenFoodFacts API
//    d) Salva no cache com TTL 30 dias
//    e) Retorna ao app

// 4. App recebe:
{
  "barcode": "7891000123456",
  "food_name": "Frango Integral Grelhado",
  "kcal": 165,
  "protein": 31g,
  "carbs": 0g,
  "fat": 3.6g
}

// 5. App cachea local (AsyncStorage)
// 6. Exibe na tela

// Próxima vez que scannear mesmo barcode:
// ✅ Instantâneo (cache local)
```

---

## 🔍 Entender o Scanner de Cardápio (5 min read)

**Arquivo**: `backend/src/domain/menuScanner.ts`

```typescript
// Entrada: Texto extraído da foto (via Google Vision API)
const menuText = `
CARDÁPIO
Entrada Frita Crocante - R$ 15
Frango Grelhado com Brócolis - R$ 35
Brigadeiro Frito - R$ 8
Salada Natural - R$ 18
`;

// Análise: Regex sobre cada prato
const BLACKLIST = [
  /frito/gi,        // ❌ BAD
  /empanado/gi,     // ❌ BAD
  /crocante/gi,     // ❌ BAD
];

const WHITELIST = [
  /grelhado/gi,     // ✅ GOOD
  /salada/gi,       // ✅ GOOD
  /vapor/gi,        // ✅ GOOD
];

// Resultado:
{
  green: [
    "Frango Grelhado com Brócolis",
    "Salada Natural"
  ],
  red: [
    "Entrada Frita Crocante",
    "Brigadeiro Frito"
  ],
  yellow: []
}

// App exibe:
// 🟢 Frango Grelhado (ok comer)
// 🔴 Entrada Frita (evitar)
```

---

## 🗄️ Entender o Banco de Dados (5 min read)

**Arquivo**: `database/migrations.sql`

```sql
-- 6 TABELAS PRINCIPAIS:

1. users
   id, email, weight_kg, height_cm, age, tmb_base, goal

2. daily_targets
   user_id, date, tdee, protein_g, carbs_g, fat_g
   INDEX: (user_id, date) ← Super rápido!

3. meal_logs
   user_id, date, food_id, kcal, protein_g, carbs_g, fat_g
   INDEX: (user_id, date) ← Fast queries

4. scanned_foods_cache
   barcode, food_name, kcal, protein, carbs, fat
   ttl_expires ← Auto cleanup
   INDEX: (barcode), trigram para fuzzy search

5. app_curated_recipes
   name, ingredients (JSONB), kcal, protein, carbs, fat

6. subscription_logs
   user_id, tier, expires_at, provider (RevenueCat/Stripe)
```

---

## 🔌 Entender os Endpoints (5 min read)

### 1️⃣ Criar Usuário
```bash
POST /api/v1/macros/setup
Content-Type: application/json

{
  "gender": "male",
  "weight_kg": 80,
  "height_cm": 175,
  "age_years": 28,
  "activity_factor": 1.55,
  "goal": "deficit"
}

Response:
{
  "user_id": "...",
  "tdee": 2343,
  "daily_targets": {
    "kcal": 2343,
    "protein_g": 175,  
    "carbs_g": 263,
    "fat_g": 65
  }
}
```

### 2️⃣ Buscar Alimento
```bash
GET /api/v1/foods/barcode/7891000123456
Authorization: Bearer <JWT>

Response:
{
  "barcode": "7891000123456",
  "food_name": "Frango Integral",
  "portion_size": "100g",
  "nutrition": {
    "kcal": 165,
    "protein_g": 31,
    "carbs_g": 0,
    "fat_g": 3.6
  },
  "cached_at": "2024-04-27T..."
}
```

### 3️⃣ Registrar Refeição
```bash
POST /api/v1/meals/log/USER_ID
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "food_id": "7891000123456",
  "quantity": 1.5,  # 150% da porção
  "meal_type": "lunch"
}

Response:
{
  "daily_state": {
    "consumed_kcal": 247,
    "remaining_kcal": 2096,
    "macros_remaining": {
      "protein_g": 138,
      "carbs_g": 263,
      "fat_g": 62
    }
  },
  "meal_suggestions": [
    {
      "recipe_id": "...",
      "name": "Salada com Frango",
      "kcal": 450,
      "fit_score": 95  # Perfeita fit! ✅
    }
  ]
}
```

### 4️⃣ Escanear Cardápio
```bash
POST /api/v1/scanner/menu
Content-Type: application/json

{
  "image_base64": "iVBORw0KGg...",
  "restaurant_name": "Restaurante XYZ"
}

Response:
{
  "analysis": {
    "green_healthy": [
      { "name": "Frango Grelhado", "reason": "grelhado" }
    ],
    "red_avoid": [
      { "name": "Frango Frito", "reason": "frito" }
    ]
  }
}
```

---

## 🎯 Estado Global (Zustand)

**Arquivo**: `frontend/src/store.ts`

```typescript
// Hook para acessar state em qualquer component
import { useNutriTrackerStore } from '@/store';

function MyComponent() {
  const { user, dailyState, setUser } = useNutriTrackerStore();
  
  // Sempre sincronizado com AsyncStorage
  // Persiste quando app fecha
}

// Store structure:
{
  user: { id, email, weight, height, age, tmb },
  dailyMacros: { tdee, protein, carbs, fat },
  dailyState: { consumed, remaining },
  authToken: "jwt-token-here",
  
  // Actions:
  setUser(), setDailyMacros(), updateDailyState(),
  setCacheItem(), getCacheItem()
}
```

---

## 🔒 Autenticação

```typescript
// Backend: JWT via @nestjs/jwt
// Token: RS256 (asymmetric)
// Refresh: Stored in HttpOnly cookie (production)

// Frontend: Axios interceptor
// Envia token em: Authorization: Bearer <token>
// Revoga se 401: clearAuthToken()
```

---

## 🧪 Testes

```bash
# Backend
npm run test
npm run test:cov  # Coverage

# Test exemplo em: dietEngine.test.ts
# 8+ scenarios testados
```

---

## 🚢 Deploy

```bash
# Staging
docker build -t nutritracker:staging .
docker run -p 3000:3000 nutritracker:staging

# Production (AWS ECS)
aws ecr get-login-password | docker login ...
docker tag nutritracker:latest ACCOUNT.dkr.ecr.REGION.amazonaws.com/nutritracker:latest
docker push ACCOUNT.dkr.ecr.REGION.amazonaws.com/nutritracker:latest
# Deploy via ECS console
```

---

## 📊 Estrutura de Pastas Reference

```
backend/src/
├── domain/               ← Business logic
│   ├── dietEngine.ts     ← 🧮 All math
│   └── menuScanner.ts    ← 🔍 OCR rules
│
├── infrastructure/       ← Database & APIs
│   └── entities/
│       └── User.ts       ← All 6 models
│
├── api/                  ← HTTP layer
│   ├── macros/
│   ├── foods/
│   ├── meals/
│   └── scanner/
│
├── main.ts               ← Bootstrap
└── app.module.ts         ← DI config

frontend/src/
├── screens/              ← UI Components
│   ├── BarcodeScannerScreen.tsx  ← Camera
│   ├── DashboardScreen.tsx       ← Display
│   └── App.tsx                   ← Nav
├── services/
│   └── api.ts            ← HTTP client
├── store.ts              ← State
└── navigation/           ← Routes
```

---

## 🆘 Common Issues & Fixes

### Backend won't start
```bash
# Check PostgreSQL
docker ps | grep postgres
# Check Redis
docker ps | grep redis
# Rebuild
docker-compose down && docker-compose up -d
```

### Frontend barcode not scanning
```bash
# Check camera permission in app
# iOS: Info.plist has NSCameraUsageDescription
# Android: AndroidManifest.xml has CAMERA permission
```

### Cache not working
```bash
# Clear AsyncStorage
await AsyncStorage.clear()
# Restart app
```

---

## 💡 Pro Tips

1. **Use Discord/Slack channel** for team communication
2. **PR reviews required** before merge to main
3. **Tests must pass** before PR approval
4. **Database migrations tested** on staging first
5. **API docs auto-generated** from controllers (Swagger)
6. **Logs in CloudWatch** (production)
7. **Alerts on Slack** if error rate > 1%
8. **Load test** with k6/JMeter before release

---

## 📞 Quick Links

- **Docs**: `README.md`
- **Architecture**: `CONTRIBUTING.md`
- **DB**: `database/migrations.sql`
- **API**: `backend/src/api/`
- **Frontend**: `frontend/src/`
- **Tests**: `*.test.ts`

---

**Happy coding! 🚀**
