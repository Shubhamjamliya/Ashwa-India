# Ashwa India

Horse-industry platform: booking services, horse transport (with ride-sharing), and marketplaces for horses and equestrian accessories.

## Structure

```
Ashwa-India/
├── backend/     # Shared Express + MongoDB API (auth, bookings, marketplace, transport, sockets)
├── frontend/    # Single React (Vite) web app — role-based views for Admin, Horse Seller, Store Seller
└── Apps/        # React Native CLI apps
    ├── UserApp/
    ├── ProviderApp/                # service providers (vets, trainers, farriers...)
    └── TransporterApp/             # horse transport + shared rides
```

`frontend/` is one app that serves three roles from the same codebase, routed by URL prefix:
- `/admin/*` — platform admin (users, providers, transporters, horse/accessory sellers, bookings, finance)
- `/seller/horses/*` — horse marketplace seller (listings, inquiries, orders)
- `/seller/store/*` — accessories store seller (products, inventory, orders)

A dev-only role switcher in the navbar lets you preview all three until real per-role login exists.

## Getting started

### Backend
```
cd backend
cp .env.example .env
npm install
npm run dev
```

### Web panel
```
cd frontend
npm install
npm run dev
```

### Mobile apps
```
cd Apps/<AppName>
npm install
npx react-native run-android   # or run-ios (macOS only)
```
