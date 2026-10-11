<img width="1900" height="932" alt="image" src="https://github.com/user-attachments/assets/9955a50e-1917-474f-bb23-ada09c27f807" />

# CloudCart

CloudCart is a React/Vite storefront with an Express/Prisma API and a MySQL database. This repository includes local, production-oriented Docker Compose configuration only; it does not provision cloud infrastructure.

## Application

The storefront supports product browsing, search/filter/sort, cart, cash-on-delivery checkout, order history, JWT authentication, customer profiles, a role-protected admin dashboard, product/category management, stock updates, and local Multer image uploads. The stack is React, Vite, React Router, Axios, Express, Prisma, MySQL, JWT, bcryptjs, Multer, and Zod.

The API is mounted under <code>/api/auth</code>, <code>/api/products</code>, <code>/api/categories</code>, <code>/api/cart</code>, <code>/api/orders</code>, and <code>/api/admin</code>. Local uploaded images are served under <code>/uploads</code>.

The optional seed script provisions these local-development accounts:

| Role | Email | Password |
| --- | --- | --- |
| Admin | <code>admin@cloudcart.local</code> | <code>Admin@123</code> |
| Customer | <code>alice@cloudcart.local</code> | <code>Customer@123</code> |

## Docker architecture

~~~text
Browser :80
    |
    v
client (Nginx) -- static assets + SPA fallback
    | /api/* and /uploads/* over private Docker network
    v
server (Express/Prisma :5000, no host port) --> host.docker.internal:3306 (existing MySQL)
    |
    +-- named volume cloudcart_uploads at /app/uploads
~~~

Only Nginx publishes a host port. The server is private to <code>cloudcart_network</code>. Nginx proxies both <code>/api/</code> and <code>/uploads/</code>; product records use the latter for local image paths.

### Multi-stage images

- <code>nginx/Dockerfile</code> uses Node 22 Alpine to run <code>npm ci</code> and build <code>client/</code>. Its Nginx 1.27 Alpine runtime contains only compiled Vite assets and the Nginx configuration. The public build-time <code>VITE_API_URL</code> defaults to <code>/api</code>.
- <code>server/Dockerfile</code> installs dependencies and generates Prisma Client in build stages. The Node 22 Alpine runtime contains production dependencies, the generated musl Prisma engine, schema, and migrations. It runs as the unprivileged <code>cloudcart</code> user, listens on <code>0.0.0.0:5000</code>, and waits for a MySQL query before starting Express.

Migrations and seeding never run automatically. The Prisma CLI remains a production management dependency solely so migrations can be run explicitly inside the backend container.

## Prerequisites

- Docker Desktop configured for Linux containers.
- A running local MySQL server and CloudCart database. Compose intentionally does not create MySQL.
- Port 80 available, unless the mapping in <code>docker-compose.yml</code> is changed.
- A least-privileged MySQL account for only the CloudCart database.

For Docker Desktop on Windows, containers reach host MySQL at <code>host.docker.internal</code>; do not use <code>localhost</code>. MySQL must bind to a Docker-reachable private interface, and its firewall and grants must permit Docker Desktop traffic. Do not expose MySQL to the public internet.

## Environment

Compose reads the repository-root <code>.env</code>, not <code>server/.env</code>. Create it and replace every placeholder:

~~~powershell
Copy-Item .env.example .env
notepad .env
~~~

| Variable | Purpose |
| --- | --- |
| <code>DATABASE_URL</code> | Prisma MySQL URL; use <code>host.docker.internal</code> for a Windows-host database. |
| <code>JWT_SECRET</code> | Long random signing secret. |
| <code>PORT</code> | Internal API port; keep <code>5000</code> unless related configuration changes. |
| <code>CLIENT_URL</code> | Browser origin, normally <code>http://localhost</code>. |
| <code>VITE_API_URL</code> | Public build-time API path. Use <code>/api</code>; never put secrets here. |
| <code>DATABASE_CONNECT_RETRIES</code> | Database readiness retry count. |
| <code>DATABASE_CONNECT_RETRY_DELAY_MS</code> | Delay between readiness retries in milliseconds. |

Existing <code>server/.env</code> and <code>client/.env</code> remain for non-Docker development and are not copied into images. If an environment file was committed previously, <code>.gitignore</code> does not remove it from Git history; remove it under your repository policy and rotate affected credentials.

## Build, migrate, and start

Validate and build both images:

~~~powershell
docker compose config
docker compose build
~~~

Apply committed migrations explicitly. This is repeatable and does not reset data or run <code>prisma db push</code>:

~~~powershell
docker compose run --rm --no-deps server npm run prisma:migrate:deploy
~~~

Seeding is also explicit and optional:

~~~powershell
docker compose run --rm --no-deps server npm run prisma:seed
~~~

Start and inspect the stack:

~~~powershell
docker compose up -d
docker compose ps
docker compose logs -f
~~~

Open [http://localhost](http://localhost). The server has no host port; health is available through Nginx at [http://localhost/api/health](http://localhost/api/health).

To migrate from an already running backend container:

~~~powershell
docker compose exec server npm run prisma:migrate:deploy
~~~

Run <code>migrate deploy</code> as a reviewed deployment step before replacing an application version.

## Operations

~~~powershell
# Follow API logs
docker compose logs -f server

# Rebuild after source or Dockerfile changes
docker compose up -d --build

# Stop containers and network; host MySQL and uploaded files remain
docker compose down

# Also remove named volumes (destructive for uploaded images only)
docker compose down -v
~~~

<code>docker compose down</code> does not delete the Windows-host MySQL database and retains the <code>cloudcart_uploads</code> volume. Do not use <code>down -v</code> if uploaded product images must persist.

## Verification checklist

~~~powershell
docker compose ps
docker compose logs --tail=100 server client
Invoke-WebRequest http://localhost/api/health
~~~

- Visit <code>/</code>, <code>/products</code>, and a nested route such as <code>/products/1</code>, then refresh it to test the SPA fallback.
- Register/login, search/filter products, update a cart, checkout, inspect order history, and exercise the admin dashboard with appropriate accounts.
- Upload an admin product image (the existing Multer limit is 5 MB), restart the server, and confirm it remains visible.
- Confirm <code>docker compose ps</code> publishes a port only for <code>client</code>, never <code>server</code>.
- Rebuild with <code>docker compose up -d --build</code>, then repeat health and application checks.

## Troubleshooting

### MySQL connectivity

1. Confirm <code>DATABASE_URL</code> uses <code>host.docker.internal</code>, not <code>localhost</code>.
2. Confirm the database exists and the selected account has CloudCart-database privileges and a supported authentication method.
3. Confirm MySQL binding and the Windows firewall allow private Docker Desktop traffic to 3306. Prefer narrow private firewall/grant rules.
4. Inspect <code>docker compose logs -f server</code>. The readiness loop does not print the database URL or secret.

### Port, proxy, or uploads

- If port 80 is busy, change <code>"80:80"</code> to <code>"8080:80"</code> in Compose and browse to <code>http://localhost:8080</code>.
- Test <code>http://localhost/api/health</code> and inspect both logs for API failures. Nginx retains the <code>/api</code> prefix, matching Express routes such as <code>/api/products</code>.
- Nginx permits request bodies up to 10 MB, while Multer limits uploaded files to 5 MB. Use <code>docker volume inspect cloudcart_uploads</code> to inspect the persistent image volume.

## Validation status

Completed locally:

- <code>npm ci</code> completed for client and server; the Vite production build with <code>VITE_API_URL=/api</code> passed.
- <code>npm run lint</code> exited successfully with seven application warnings and no errors.
- <code>prisma validate</code>, <code>prisma generate</code>, and Node syntax checks for the backend startup files passed.
- <code>prisma migrate status</code> reached the existing host MySQL database and reported both committed migrations are up to date.
- The backend readiness startup, <code>/api/health</code>, products, categories, admin login, and the read-only admin dashboard API all returned successfully against that local database.
- <code>npm audit --omit=dev</code> reports three high-severity advisories through the Prisma CLI dependency tree. Its offered Prisma fix is a conflicting downgrade, so it was not applied automatically; review the advisory when planning Prisma upgrades.

The Docker CLI was unavailable in the environment used to prepare this configuration. Docker Compose validation, image builds/sizes, container health, Nginx SPA/proxy behavior, persisted uploads, cart/checkout/order flows, and an in-container MySQL connection are therefore unverified and are not claimed as complete. Run the commands above on a Docker Desktop host after creating <code>.env</code>.

No database was reset, migrated, or seeded while preparing this configuration.
