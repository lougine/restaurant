# Savor Restaurant

Restaurant ordering and table reservation system. Customers scan a QR code (or open the site) to browse the menu, order to their table, for pickup or for delivery, and book a table. The kitchen sees orders live, and the owner gets daily sales reports, a menu manager and printable QR codes.

**Stack:** React · Node.js + Express · MongoDB (Mongoose) · Socket.io

**Live demo:** not deployed yet. [Deploy this repository to Render](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Flougine%2Frestaurant) to create a public instance; Render assigns its URL when the first build finishes.

| Demo login (choose **Team sign in**) | Email | Password |
| --- | --- | --- |
| Kitchen / staff | `staff@savor.restaurant.eg` | `savor2026` |
| Owner | `owner@savor.restaurant.eg` | `savor2026` |

---

## Features

| Area | What it does |
| --- | --- |
| **QR menu** | One QR code opens the menu on the guest's phone (`/?menu=1`). The owner can print or download it from **QR Code**. |
| **Digital menu** | Categories, photos, search, tags, and ingredients and allergens for each dish. |
| **Cart & ordering** | Cart with quantities. Order for a table, for pickup or for delivery (delivery can use the phone's location). |
| **Live kitchen display** | New orders appear instantly over Socket.io in New → In progress → Ready → Served columns. One tap moves an order on. |
| **Table reservations** | Guests pick a date, time and party size within opening hours. Staff see and manage bookings. |
| **Owner dashboard** | Sales for one day or a date range: revenue, orders, average order value, items sold, sales by hour, order type split and best-selling items. |
| **Menu manager** | The owner adds, edits or deletes dishes. Changes show on the customer menu. |
| **Staff accounts** | Kitchen and owner logins with JWT and bcrypt-hashed passwords; each role sees only its own screens. |

### Screenshots

**Owner dashboard: daily sales report**

![Owner dashboard](docs/screenshots/owner-dashboard.png)

**Kitchen display: live orders**

![Kitchen display](docs/screenshots/kitchen-display.png)

**Digital menu**

![Menu](docs/screenshots/menu.png)

| Phone (QR menu link) | Table reservations |
| --- | --- |
| <img src="docs/screenshots/mobile-menu.png" alt="Menu on a phone" width="260"> | <img src="docs/screenshots/reservations.png" alt="Reservations" width="520"> |

| Menu manager (owner) | QR code (owner) |
| --- | --- |
| <img src="docs/screenshots/menu-manager.png" alt="Menu manager" width="420"> | <img src="docs/screenshots/qr-codes.png" alt="QR code page" width="420"> |

---

## Deploy free on Render

The repo includes [`render.yaml`](render.yaml) and can be launched with Render's deploy flow:

1. Open [Deploy this repository to Render](https://render.com/deploy?repo=https%3A%2F%2Fgithub.com%2Flougine%2Frestaurant) and connect GitHub if prompted.
2. Review the `savor-restaurant` web service and click **Apply**.
3. When the first build finishes, copy the service's `.onrender.com` URL into the **Live demo** line above. The URL is assigned by Render during deployment and cannot be known beforehand.

One server builds the React app and serves the website, the API and live updates from the same address, so the QR codes work on any phone.

- **Database:** with no `MONGODB_URI` set, the server starts a built-in demo database with sample orders and the demo logins above. It resets when the server restarts. To keep data permanently, create a free MongoDB Atlas cluster and add its connection string as `MONGODB_URI` under the service's **Environment** tab in Render.
- **Free tier:** the service sleeps after 15 minutes without visitors, so the first visit after that takes about a minute to wake it up.

## Run locally

Requires Node.js 20 or newer. MongoDB is optional.

```bash
npm install
npm install --prefix server
cp server/.env.example server/.env   # leave MONGODB_URI empty to use the built-in demo database
```

Development mode (two terminals):

```bash
npm run server   # API + Socket.io on http://localhost:4000
npm start        # React app on http://localhost:3000
```

Production mode (one server, the same setup as Render):

```bash
npm run build
npm start --prefix server   # website + API on http://localhost:4000
```

### Backend configuration

Set `MONGODB_URI` and a long random `JWT_SECRET` in `server/.env`. Leave `MONGODB_URI` empty to use the in-memory demo database; its sample orders and demo accounts reset when the server restarts. When using MongoDB, demo accounts are added if no team accounts exist.

To create or update team accounts, temporarily set `STAFF_LOGIN_EMAIL`, `STAFF_LOGIN_PASSWORD`, `OWNER_LOGIN_EMAIL`, and `OWNER_LOGIN_PASSWORD` in `server/.env`, then run:

```bash
npm run seed:team --prefix server
```

The API provides `/api/auth` (register and login), `/api/menu`, `/api/orders`, and `/api/reservations`. Menu edits require the owner role; order and reservation management requires kitchen or owner access. Live order and reservation changes are sent over Socket.io (`order:created`, `order:updated`, `reservation:created`).
