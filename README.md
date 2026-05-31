[![Forge with Alphinium](https://img.shields.io/badge/🔨_Forge_with_Alphinium-Build_Your_Version-6366f1?style=for-the-badge&logo=github)](https://alphinium.com/forge?template=pet-stayz)

> **This is an Alphinium template.** Click the badge above to fork this project and have an AI agent build your customised version automatically.

---

# Pet Stayz

Pet Stayz is an Australia-focused pet accommodation aggregator built with Expo + React Native Web.

## What it demos
- Airbnb-style browse and compare flow for pet boarding, daycare, and drop-in stays
- 12 seeded hosts with save, filter, featured superhosts, and pricing totals
- Host detail and booking confirmation flow
- Pip assistant widget powered by the ChatInstance concept
- alphinium integration callouts for payments, booking calendars, and maps

## Run locally
```bash
npm install --legacy-peer-deps
npx expo install react-dom react-native-web @expo/metro-runtime
npx expo start --web --port 8105
```

## Key files
- `App.js`
- `src/navigation/AppNavigator.js`
- `src/store/stayzStore.js`
- `src/screens/HomeScreen.js`
- `src/screens/HostScreen.js`
- `src/screens/BookingScreen.js`
- `GOING_LIVE.md`
