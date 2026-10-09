# TimeWise

Free, multi-tenant staff attendance app. Organizations register, add staff, and staff check in and out at a kiosk using their staff ID, a QR code or hands-free face recognition — or on a fingerprint attendance device. Every feature is available to every organization.

## Documentation

- **[Setup & Deployment Guide](docs/DEPLOYMENT.md)** — run locally, deploy to a server with HTTPS, email, face recognition, fingerprint devices, backups, troubleshooting
- **[User Guide](docs/USER-GUIDE.md)** — for organization admins: settings, staff, the kiosk, check-in methods, reports

## Quick start

```bash
cp .env.example .env              # set JWT_SECRET (openssl rand -base64 32)
docker compose up -d --build      # app on http://localhost:3000
```

Face recognition (optional, 2.2 GB download):

```bash
docker compose --profile face up -d
./scripts/setup-compreface.sh
docker compose --profile face up -d app
```

Production with HTTPS on your domain: see [DEPLOYMENT.md §3](docs/DEPLOYMENT.md#3-deploy-to-a-server-recommended).

## Stack

- Next.js 16 (App Router, route handlers under `app/api`), React 19, Tailwind CSS 3, shadcn/ui
- MongoDB (native driver). Every tenant-scoped query goes through `TenantDatabase` (`lib/database/tenant-db.ts`), which adds `tenantId` automatically.
- CompreFace (self-hosted) or AWS Rekognition for faces; ZKTeco ADMS / HTTP for fingerprint devices; Nodemailer for email; photos in MongoDB or Cloudinary
- Docker Compose for local and production (Caddy for HTTPS)

## Development

```bash
pnpm install
cp .env.example .env.local        # point MONGODB_URI at a running MongoDB
pnpm dev
```

| Script | Purpose |
| --- | --- |
| `pnpm build` / `pnpm start` | Production build (type errors fail the build) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm init:super-admin-db` | Create platform-owner collections and indexes |
| `pnpm seed:super-admin` | Create the platform-owner account from `SUPER_ADMIN_SEED_*` |
| `pnpm migrate:free-plan` | One-time: move old "trial" organizations to "active" and remove plan fields |

## Layout

```
app/(public)/            marketing, login, register, password reset
app/(dashboard)/         organization admin dashboard
app/checkin/             check-in kiosk (manual, QR, hands-free face)
app/register-biometric/  staff face enrollment (admin-issued link)
app/owner/               platform-owner (super admin) panel
app/api/                 route handlers
app/iclock/              ZKTeco ADMS endpoints for fingerprint devices
lib/auth/                JWT, password hashing, super-admin auth, kiosk/enrollment/photo tokens
lib/analytics/           shared date-range and attendance helpers for analytics
lib/checkin/             check-in policy (timezone, lateness, enabled methods)
lib/devices/             fingerprint devices: registration, punches, ZKTeco protocol
lib/services/            face recognition, photo storage, email, owner analytics, audit
deploy/                  Caddyfile for production HTTPS
docs/                    setup and user guides (older notes in docs/archive/)
```

## Authentication model

| Caller | Credential | Issued by |
| --- | --- | --- |
| Org admin / manager | `Authorization: Bearer <jwt>` (24h) | `/api/auth/login` |
| Platform owner | `Authorization: Bearer <jwt>` (role `super_admin`) | `/api/owner/auth/login` |
| Check-in kiosk | `x-checkin-token` header (12h) | `/api/organization/verify-passcode` |
| Face enrollment | `token` in the registration link (24h, one staff member) | `POST /api/staff/[staffId]/enrollment` |
| Face check-in | `biometricProofs` in the check-in body (2 min) | `/api/biometric/face/authenticate` |
| Stored photo | `token` query parameter (1h) | attendance/history APIs |
| HTTP fingerprint device | `Authorization: Bearer <device token>` | Settings → Fingerprint Devices |
| ZKTeco device | serial number registered in Settings | Settings → Fingerprint Devices |

The check-in API takes the tenant from the kiosk token, never from the request body, and face check-ins require a proof issued for the same staff member. Every admin request re-checks that the user and organization are still active, so suspending an account takes effect immediately.

## Timezones

Each organization has a `settings.timezone` (IANA name, set from the admin's browser at registration and editable in Settings). Lateness, early departure, "today" and fingerprint-device clock times are computed in that timezone.

## Notes

- Rate limits are stored in the `rate_limits` collection (TTL-indexed), so they hold across instances.
- Check-in photos stored locally (`attendance_photos`) expire after 7 days via a TTL index; `/api/cron/cleanup-photos` (protected by `CRON_SECRET`) also removes Cloudinary photos.
- Faces registered before face matching was scoped per organization must be registered again.
