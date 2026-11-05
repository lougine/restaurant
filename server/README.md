# Restaurant API

Express + MongoDB + Mongoose + JWT + Socket.io backend for the restaurant system.

## Setup

1. Copy `.env.example` to `.env`.
2. Set `MONGODB_URI` to a local MongoDB or MongoDB Atlas connection string.
3. Set a long random value for `JWT_SECRET`.
4. Install dependencies from the repository root:

```bash
npm install --prefix server
```

## Team accounts

Team accounts are stored in MongoDB. To create or update them, temporarily set `STAFF_LOGIN_EMAIL`, `STAFF_LOGIN_PASSWORD`, `OWNER_LOGIN_EMAIL`, and `OWNER_LOGIN_PASSWORD` in `server/.env`, then run:

```bash
npm run seed:team --prefix server
```

Passwords are saved as bcrypt hashes. Remove the temporary login values from `server/.env` after seeding.

## Run

From the repository root:

```bash
npm run server
npm run server:dev
```

Or from `server/`:

```bash
npm start
npm run dev
```

The API runs on `http://localhost:4000` by default.

## Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/menu`
- `POST /api/menu` owner only
- `PUT /api/menu/:id` owner only
- `DELETE /api/menu/:id` owner only
- `GET /api/orders` kitchen/owner only
- `POST /api/orders` customer only
- `PATCH /api/orders/:id/status` kitchen/owner only
- `GET /api/reservations` kitchen/owner only
- `POST /api/reservations` customer only

Socket.io events emitted by the API:

- `order:created`
- `order:updated`
- `reservation:created`
