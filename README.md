# Savor Restaurant

Restaurant website for browsing the menu, placing pickup, delivery, or table orders, and making reservations. Staff can manage live orders and reservations; the owner can view sales reports and manage menu items.

## Start the website

In the project folder, run:

```bash
npm run start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Sign in

Choose **Staff / Owner sign in** in the website.

| Access | Email | Password |
| --- | --- | --- |
| Kitchen / staff | `staff@savor.restaurant.eg` | `savor2026` |
| Owner | `owner@savor.restaurant.eg` | `savor2026` |

## Start the backend

For sign-in, live orders, and reservations, run the API in a second terminal:

```bash
npm run server
```

The API runs at `http://localhost:4000`. To save application data in MongoDB, configure `MONGODB_URI` in `server/.env` before starting the API. See [server/README.md](server/README.md) for setup details.
