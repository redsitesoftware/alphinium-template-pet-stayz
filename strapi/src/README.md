# Strapi Backend — Custom API

This directory mirrors the Strapi v4 `src/api/` layout and should be **copied into** (or symlinked from) the Strapi server project before running.

## Structure

```
src/api/
├── booking/
│   ├── content-types/booking/
│   │   ├── schema.json        ← content-type registration (from strapi/booking-content-type.json)
│   │   └── lifecycles.js      ← beforeCreate: pre-calculates total_price
│   ├── controllers/
│   │   └── booking.js         ← updateStatus (PATCH /api/bookings/:id)
│   └── routes/
│       └── custom-booking.js  ← registers PATCH route
└── host/
    ├── controllers/
    │   └── host.js            ← availability (GET /api/hosts/:id/availability)
    └── routes/
        └── custom-host.js     ← registers GET availability route
```

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/hosts/:id/availability?from=YYYY-MM-DD&to=YYYY-MM-DD` | Public | Returns `{ available: [...], unavailable: [...] }` date arrays |
| `POST` | `/api/bookings` | Authenticated guest | Creates booking; `total_price` is auto-calculated via lifecycle hook |
| `PATCH` | `/api/bookings/:id` | Authenticated host owner | Updates status to `accepted` or `declined`; optionally emails guest |

## Pricing logic

The `beforeCreate` lifecycle duplicates the core loop from `src/utils/pricing.js` server-side.  
Field name mapping: `pricingOverrides` → `pricing_overrides`, `dateFrom/dateTo` → `date_from/date_to`, `pricePerNight` → `price_per_night` (Strapi snake_case convention).
