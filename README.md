# Ashwa India

Horse-industry platform: booking services, horse transport (with ride-sharing), and marketplaces for horses and equestrian accessories.

## Structure

```
Ashwa-India/
├── backend/     # Shared Express + MongoDB API (auth, bookings, marketplace, transport, sockets)
├── frontend/    # MERN web panels (React + Vite)
│   ├── AdminPanel/
│   ├── HorseMarketplacePanel/      # seller panel: horse buy/sell
│   └── AccessoriesStorePanel/      # seller panel: e-commerce accessories
└── Apps/        # React Native CLI apps
    ├── UserApp/
    ├── ProviderApp/                # service providers (vets, trainers, farriers...)
    └── TransporterApp/             # horse transport + shared rides
```

## Getting started

### Backend
```
cd backend
cp .env.example .env
npm install
npm run dev
```

### Web panels
```
cd frontend/<PanelName>
npm install
npm run dev
```

### Mobile apps
```
cd Apps/<AppName>
npm install
npx react-native run-android   # or run-ios (macOS only)
```
