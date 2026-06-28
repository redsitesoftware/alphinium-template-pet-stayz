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

## Configuration — Environment Variables

Copy `.env.example` to `.env` and set values for your deployment.

| Variable | Description | Default | Notes |
|---|---|---|---|
| `EXPO_PUBLIC_API_URL` | Strapi backend URL | _(empty)_ | e.g. `http://localhost:1337` for local dev |
| `EXPO_PUBLIC_API_TOKEN` | Strapi bearer token | _(empty)_ | Only needed if Strapi content is restricted |
| `EXPO_PUBLIC_GA_ID` | GA4 Measurement ID | `G-X09N3J8X17` | Override with your own GA property when going live |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_REPLACE_ME` | Replace with your Stripe test or live key |
| `EXPO_PUBLIC_APP_NAME` | App display name | `PetStayz` | Set at project creation by Alphinium Forge |
| `EXPO_PUBLIC_APP_SCHEME` | Deep link scheme | `petstayz` | Must match `app.json > scheme` |
| `EXPO_PUBLIC_OAUTH_PROVIDERS` | Enabled login providers | `github,google,email` | Comma-separated: `github`, `google`, `facebook`, `email` |
