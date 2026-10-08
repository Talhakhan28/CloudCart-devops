<img width="1900" height="932" alt="image" src="https://github.com/user-attachments/assets/9955a50e-1917-474f-bb23-ada09c27f807" />

# CloudCart

CloudCart is a full-stack e-commerce MVP with a polished React storefront and a role-protected Express/Prisma API. It is designed for local MySQL today and a later, low-friction migration to Amazon RDS MySQL.

## What’s included

- Responsive storefront: home, catalogue search/filter/sort, detail pages, cart, cash-on-delivery checkout, confirmation, and order history.
- JWT authentication with bcrypt hashing, user profiles, protected cart/order APIs, and role-based admin access.
- Admin API and dashboard for business totals, recent orders, customers, product/category CRUD endpoints, stock, order status updates, and local Multer uploads.
- Normalized Prisma/MySQL schema, indexes, and an idempotent seed script with 15 demo products.

## Stack

React + Vite, React Router, Axios, Context API, CSS design system, Node.js, Express, Prisma, MySQL, JWT, bcryptjs, Multer, and Zod (available for additional request schemas).

## Local setup

1. Create a MySQL database named `cloudcart`.
2. Copy `server/.env.example` to `server/.env`, then provide your database URL and a strong JWT secret.
3. Copy `client/.env.example` to `client/.env` if the API URL differs.
4. In one terminal:

```powershell
cd server
npm install
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

5. In another terminal:

```powershell
cd client
npm install
npm run dev
```

Open `http://localhost:5173`.

## Local demo credentials

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@cloudcart.local` | `Admin@123` |
| Customer | `alice@cloudcart.local` | `Customer@123` |

These credentials are strictly for local development.

## API map

`/api/auth`, `/api/products`, `/api/categories`, `/api/cart`, `/api/orders`, and `/api/admin` provide the REST surface. Admin endpoints require a JWT with the `ADMIN` role. Uploaded images are served from `/uploads`; the storage boundary is isolated to the product upload route for a future S3 service replacement.

## Architecture

`client/src/App.jsx` contains the routed UI and Context-based auth/cart state. The server separates routing from shared auth/Prisma utilities, with one centralized error handler in `src/app.js`. Prisma owns relationships and persistence in `server/prisma/schema.prisma`.

## Future deployment

The application deliberately does not configure cloud or DevOps services yet. A later deployment phase can add Docker, Jenkins, Amazon ECR, EC2, S3, RDS MySQL, VPC, and IAM without altering the domain schema or API design.
