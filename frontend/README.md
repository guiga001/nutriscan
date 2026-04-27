# NutriTracker Frontend

A React Native (Expo) mobile application for nutrition tracking and macro planning.

## Getting Started

### Prerequisites
- Node.js 18+
- iOS 13+ or Android 10+
- Expo CLI: `npm install -g expo-cli`

### Installation

```bash
cd frontend
npm install
```

### Running

#### iOS
```bash
npm run ios
```

#### Android
```bash
npm run android
```

#### Web (Development)
```bash
npm run web
```

## Project Structure

```
src/
├── screens/          # UI Screens (Dashboard, Scanner, etc)
├── services/         # API calls
├── store.ts          # Zustand state management
├── App.tsx           # Main entry
└── navigation/       # React Navigation
```

## Features

- 📱 Barcode Scanner (native camera)
- 📊 Daily macro tracking
- 🍽️ Meal recommendations
- 🔍 Fuzzy food search
- 📸 Menu scanner (OCR)
- 📊 Progress tracking
- 💾 Offline mode (AsyncStorage)

## Environment Variables

Create `.env` file:
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```
