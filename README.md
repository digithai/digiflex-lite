# DigiFlex Lite

A lightweight work-from-home request and approval platform for teams. DigiFlex Lite helps employees submit WFH requests, while approvers and admins review them, manage users, and configure policy rules in one place.

---

# Setup and Deployment Guide

This guide covers setup, deployment, and day-to-day administration of DigiFlex Lite.

For end-user instructions (how to log in, submit WFH requests, approve requests, etc.), see [WIKI.md](WIKI.md).

## Quick Start

### 1. Requirements

- Docker
- Docker Compose

### 2. Prepare environment

Create a `.env` file in the project root. See `.env.sample` for the template.

Key variables:

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | `development`, `staging`, or `production` |
| `PORT` | API port (default: 7088) |
| `MONGO_URI` | MongoDB connection string. **Important:** use the database name `digiflex-lite`, not the container name `digiflex-lite-db`. Example: `mongodb://digiflex-lite-db:27017/digiflex-lite` |
| `JWT_SECRET` | Secret used to sign short-lived access tokens (15 min). The API verifies every request's Bearer token with this secret. |
| `JWT_REFRESH_SECRET` | Secret used to sign long-lived refresh tokens (7 days). The `/api/auth/refresh` endpoint uses this to issue new access tokens. |
| `EMAIL_USER` | Gmail account for sending email notifications (WFH requests, password recovery, welcome emails). Optional for basic local setup, but required if you want to test email notifications. |
| `EMAIL_PASS` | Gmail app password. Required only if email notifications are enabled. |
| `RECOVERY_EMAIL` | Address that receives password recovery requests. Required only if using password recovery. |
| `VITE_HR_EMAIL` | Email shown to users for sick leave medical certificates. Default: `hr@example.com`. Note: sick leave is not currently implemented in the UI, so this variable is not used yet. |
| `FRONTEND_URL` | URL included in email notification links. Default: `http://localhost:7091` |
| `VITE_BASE_URL` | URL the React client uses to reach the API. Default: `http://localhost:7088` |

Generate JWT secrets (run the command twice to get two different values):

```bash
openssl rand -base64 64
openssl rand -base64 64
```

Paste the first output into `JWT_SECRET` and the second into `JWT_REFRESH_SECRET`. They must be different.

### 3. Build and run

```bash
docker compose build
docker compose up -d
```

Services:

- `db` — MongoDB (container: `digiflex-lite-db`)
- `server` — Node.js/Express API (container: `digiflex-lite-server`)
- `client` — React frontend (container: `digiflex-lite-client`)

Access points:

- Frontend: http://localhost:7091
- API: http://localhost:7088

Stop the system:

```bash
docker compose down
```

---

## Create an Admin User

While the containers are running, generate a password hash. Replace `'test'` with the password you want for the admin user:

```bash
docker exec digiflex-lite-server node -e "const bcrypt = require('bcryptjs'); console.log('New hash:', bcrypt.hashSync('your-password', 10));"
```

Connect to the database:

```bash
docker exec -it digiflex-lite-db mongosh
```

In the MongoDB shell:

```js
use digiflex-lite

// Check existing users
db.user.find()

// Create an admin user
db.user.insertOne({
  name: "New Admin",
  email: "admin@example.com",
  password: "$2b$10$...", // paste the hash from above
  role: "admin",
  position: "Administrator",
  team: "Management",
  office: "HQ",
  country: "US",
  wfhWeekly: 1,
  leaveCounts: { sickLeave: 15, timeOff: 15 },
  employmentDate: new Date(),
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

To reset a password later:

```js
db.user.updateOne(
  { email: "admin@example.com" },
  {
    $set: {
      password: "$2b$10$...", // new bcrypt hash
      updatedAt: new Date()
    }
  }
)
```

After creating the admin user, open the frontend at `http://localhost:7091` and log in with that email and password.

---

## Roles and Permissions

| Role | Permissions |
|------|-------------|
| `superuser` | Full access; cannot be deleted |
| `admin` | Dashboard, approvals, team management, WFH rules settings |
| `approver` | Dashboard, approvals |
| `user` | Dashboard, submit WFH requests |

---

## Features

### WFH Requests

Users can submit Work From Home (WFH) requests. Approvers and admins can approve or reject them. Email notifications are sent to approvers when a user submits a request. If an approver submits a request, admins are notified instead.

### Team Management

Admins create and manage users. Passwords must be stored as bcrypt hashes.

### WFH Rules Settings

Admins configure:

- Allowed date scopes (this week, next week, within month)
- Disallowed weekdays
- Position concurrency limits

### Holidays

Admins add public holidays to block WFH requests on those dates.

For detailed end-user instructions on all features, see [WIKI.md](WIKI.md).

---

## Troubleshooting

### "Invalid credentials" on login

1. Check that `MONGO_URI` points to the **database name** `digiflex-lite`, not the container name `digiflex-lite-db`.
2. Verify the user exists in the correct database:
   ```bash
   docker exec -it digiflex-lite-db mongosh
   use digiflex-lite
   db.user.find()
   ```
3. Ensure the password field is a bcrypt hash (starts with `$2`).
4. Check that `isActive` is `true`.

### Emails not sending

- Confirm `EMAIL_USER` and `EMAIL_PASS` are set.
- For Gmail, use an **app password**.
- In `development`/`staging`, self-signed TLS certs are allowed.

### Changes not taking effect

The server is built into the Docker image. After editing server code:

```bash
docker compose down
docker compose up --build -d
```

After editing .env file

```bash
docker compose up -d --force-recreate server
```

---

## Useful Commands

```bash
# View logs
docker compose logs -f server
docker compose logs -f client
docker compose logs -f db

# Restart
docker compose restart

# Stop
docker compose down
```
