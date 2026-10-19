# TimeWise — Setup & Deployment Guide

This guide covers running TimeWise locally, deploying it to a server, and configuring email, face recognition and fingerprint devices. For how to *use* the app, see [USER-GUIDE.md](USER-GUIDE.md).

## Contents

1. [How it fits together](#1-how-it-fits-together)
2. [Run it locally](#2-run-it-locally)
3. [Deploy to a server (recommended)](#3-deploy-to-a-server-recommended)
4. [Configuration reference](#4-configuration-reference)
5. [Email](#5-email)
6. [Face recognition (CompreFace)](#6-face-recognition-compreface)
7. [Fingerprint devices](#7-fingerprint-devices)
8. [Hosting on Vercel instead](#8-hosting-on-vercel-instead)
9. [Backups and updates](#9-backups-and-updates)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. How it fits together

| Service | What it does | Required? |
| --- | --- | --- |
| **app** | The Next.js web app: dashboard, check-in kiosk, APIs | Yes |
| **mongo** | MongoDB database (organizations, staff, attendance, photos) | Yes |
| **compreface** | Self-hosted face recognition (free, open source) | Only for face check-in |
| **caddy** | HTTPS in front of the app (production only) | Production |
| Fingerprint device | A physical attendance terminal that sends punches to the app | Optional |

All services run with Docker Compose from this repository:

- `docker-compose.yml` — app + MongoDB, plus CompreFace under the `face` profile
- `docker-compose.prod.yml` — adds Caddy (HTTPS) for a real domain

CompreFace is opt-in (`--profile face`) because its image is a 2.2 GB download.

## 2. Run it locally

**Requirements:** Docker with Compose v2.24+.

```bash
git clone <your-repo-url> time-wise-v2
cd time-wise-v2
cp .env.example .env
```

Edit `.env` and set at least:

```env
JWT_SECRET=<output of: openssl rand -base64 32>
CRON_SECRET=<output of: openssl rand -hex 24>
```

Start the app and database:

```bash
docker compose up -d --build
```

Open **http://localhost:3000**, register an organization and log in. If email isn't configured yet, see [Email](#5-email) for how to verify the account manually.

Add face recognition when you want it (see [section 6](#6-face-recognition-compreface)):

```bash
docker compose --profile face up -d
./scripts/setup-compreface.sh
docker compose --profile face up -d app
```

### Without Docker (for development)

```bash
pnpm install
cp .env.example .env.local      # set MONGODB_URI to a running MongoDB
pnpm dev
```

`pnpm typecheck` runs the TypeScript checks; `pnpm build` fails on type errors.

## 3. Deploy to a server (recommended)

Running everything on one Linux server keeps the database and face recognition private and costs one small monthly bill.

### 3.1 What you need

- A Linux server (Ubuntu 22.04/24.04 works well).
  - **4 GB RAM** with face recognition, **2 GB** without. Intel/AMD (x86-64) — CompreFace has no ARM image.
  - Providers: Hetzner, DigitalOcean, Linode, Vultr — roughly $5–7/month for 4 GB.
- A domain or subdomain, e.g. `attendance.yourcompany.com`.

### 3.2 Point your domain at the server

At your DNS provider, create an **A record** for your domain with the server's public IP address. Wait until `ping attendance.yourcompany.com` shows the server's IP.

### 3.3 Install Docker

```bash
ssh root@<server-ip>
curl -fsSL https://get.docker.com | sh
```

Open ports 80 and 443 if the server has a firewall:

```bash
ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw enable
```

### 3.4 Get the code and configure it

```bash
git clone <your-repo-url> /opt/timewise
cd /opt/timewise
cp .env.example .env
nano .env
```

Set at least:

```env
DOMAIN=attendance.yourcompany.com
JWT_SECRET=<openssl rand -base64 32>
CRON_SECRET=<openssl rand -hex 24>
DEFAULT_TIMEZONE=Africa/Lagos          # your main timezone
# Email (see section 5)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=<app password>
EMAIL_FROM=you@gmail.com
```

### 3.5 Start it

With face recognition:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile face up -d --build
./scripts/setup-compreface.sh
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile face up -d app
```

Without face recognition:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Caddy fetches an HTTPS certificate automatically on first start. Open `https://attendance.yourcompany.com`.

> Tip: put the long command in an alias so you don't mistype it:
> `echo "alias tw='docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile face'" >> ~/.bashrc`
> Then `tw up -d --build`, `tw logs -f app`, `tw ps`.

### 3.6 Create the platform owner account (optional)

The owner panel (`/owner`) is for whoever runs the platform. From your **own computer**, open a tunnel to the server's database and run the seed script:

```bash
ssh -L 27017:localhost:27017 root@<server-ip>      # keep this open
# in another terminal, in your local checkout:
MONGODB_URI=mongodb://localhost:27017 \
SUPER_ADMIN_SEED_EMAIL=you@example.com \
SUPER_ADMIN_SEED_PASSWORD='<strong password>' \
pnpm seed:super-admin
```

### 3.7 Scheduled photo cleanup

Photos stored in MongoDB delete themselves after 7 days. If you use **Cloudinary** for photos, add a daily job on the server so old Cloudinary photos are removed too:

```bash
crontab -e
# add:
0 2 * * * curl -fsS -H "Authorization: Bearer <CRON_SECRET>" https://attendance.yourcompany.com/api/cron/cleanup-photos > /dev/null
```

### 3.8 Upgrading an existing installation

After deploying this version over an older one, run once:

```bash
MONGODB_URI=mongodb://localhost:27017 pnpm migrate:free-plan
```

(through the SSH tunnel from 3.6). It moves old "trial" organizations to "active" and removes plan fields.

## 4. Configuration reference

All settings live in `.env` (see `.env.example`).

| Variable | Required | Purpose |
| --- | --- | --- |
| `JWT_SECRET` | Yes | Signs logins, kiosk sessions and staff QR codes. Long random value; changing it logs everyone out and invalidates printed QR badges (new ones are generated on the Staff page). |
| `DOMAIN` | Production | Your domain, used by Caddy for HTTPS and for links in emails. |
| `NEXT_PUBLIC_APP_URL` | Local | Base URL (`http://localhost:3000` locally; set automatically from `DOMAIN` in production). |
| `CRON_SECRET` | Recommended | Protects `/api/cron/cleanup-photos`. |
| `DEFAULT_TIMEZONE` | No | Fallback timezone for organizations without one (default `UTC`). |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | For email | Verification codes and password resets. |
| `COMPREFACE_API_KEY` | For face | Created by `scripts/setup-compreface.sh`. |
| `COMPREFACE_SIMILARITY_THRESHOLD` | No | How close a face match must be (0–1, default `0.9`). |
| `COMPREFACE_ADMIN_EMAIL`, `COMPREFACE_ADMIN_PASSWORD` | Info | CompreFace admin UI login, written by the setup script. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | No | Store check-in photos in Cloudinary instead of MongoDB. |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` | No | Use AWS Rekognition instead of CompreFace (paid). |
| `FACE_RECOGNITION_PROVIDER` | No | `compreface` or `rekognition`, only if both are configured. |
| `MONGODB_URI` | Set by Compose | Only needed when running without Docker. |

After changing `.env`, restart the app: `docker compose up -d app` (add the prod/profile flags in production).

## 5. Email

TimeWise emails 6-digit verification codes at sign-up and password-reset links. Without email settings, nothing is sent and new accounts can't verify.

**Gmail:**

1. Turn on 2-Step Verification for the Google account.
2. Google Account → Security → 2-Step Verification → **App passwords** → create one.
3. In `.env`:

   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=you@gmail.com
   SMTP_PASS=<16-character app password>
   EMAIL_FROM=you@gmail.com
   ```

4. Restart the app.

Any SMTP provider works the same way (Brevo, Mailgun, Amazon SES, your host's mail server).

**Verifying an account manually** (e.g. before email is set up):

```bash
docker compose exec mongo mongosh staff_checkin --eval \
  'db.users.updateOne({email:"admin@example.com"}, {$set:{emailVerified:true}})'
```

## 6. Face recognition (CompreFace)

Staff register their face once; afterwards they check in at the kiosk just by looking at the camera.

### Setup

```bash
docker compose --profile face up -d          # first start downloads ~2.2 GB and takes ~1 minute
./scripts/setup-compreface.sh                # creates the API key and saves it to .env
docker compose --profile face up -d app      # restart the app so it picks up the key
```

Then, in the TimeWise dashboard: **Settings → Check-In Methods → Face Recognition → on**, and register staff faces from the **Staff** page.

### How matching works

- Faces are stored in CompreFace, separately for each organization — one company's staff can never match another's.
- `COMPREFACE_SIMILARITY_THRESHOLD` (default `0.9`) is how similar a face must be. In testing, the same person scored 0.99+ and different people at most 0.58. If genuine staff are rejected in poor lighting, try `0.85`.
- The kiosk only acts when the face is close to the camera and recognised twice in a row, so people walking past aren't recorded. Check-out always needs a tap.
- It does not detect a printed photo held up to the camera.

### CompreFace admin UI

Available at `http://localhost:8001` on the machine running Docker. On a server it is deliberately not public; reach it with an SSH tunnel:

```bash
ssh -L 8001:localhost:8001 root@<server-ip>
# then open http://localhost:8001 — login is COMPREFACE_ADMIN_EMAIL / COMPREFACE_ADMIN_PASSWORD from .env
```

### Using AWS Rekognition instead

Set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` and `AWS_REGION`, and don't start the `face` profile. Rekognition is paid per image after its free tier.

## 7. Fingerprint devices

Fingerprint check-in uses a **fingerprint attendance terminal**. Staff enrol their finger on the device; the device matches it and sends each punch to TimeWise, which records it as a check-in or check-out. No browser or kiosk is involved.

Until a device is added, **Settings → Fingerprint Devices** tells the admin that no device is connected. Once a device connects, it shows as **Online** and punches appear in Attendance.

### Supported devices

| Type | Examples | How it connects |
| --- | --- | --- |
| **ZKTeco (ADMS / cloud server)** | Most ZKTeco and many ZK-based terminals with a "Cloud Server" or "ADMS" menu (e.g. K40, MB20, SpeedFace series) | The device calls `http://<your-domain>/iclock/...` |
| **Other (HTTP API)** | Any device or middleware that can send an HTTP request | `POST /api/devices/punch` with a token |

> Support for ZKTeco's ADMS protocol follows its published behaviour but has not been tested against physical hardware yet. Test with one device before rolling out.

### Connecting a ZKTeco device

1. **Settings → Fingerprint Devices → Add fingerprint device**, choose *ZKTeco*, and enter the serial number (on the device: Menu → System Info → Device Info).
2. On the device: **Menu → COMM → Cloud Server Setting** (on some models "ADMS"):
   - Server address: your domain (e.g. `attendance.yourcompany.com`)
   - Port: `80`
   - Enable domain name: on · Proxy: off
3. Enrol each staff member on the device with their **device PIN** as the user ID. The PIN is shown on each person on the **Staff** page (it is the number in their staff ID: `STAFF337724` → `337724`).
4. Within a minute the device shows as **Online**.

The device must be able to reach your server over the internet (or local network) on port 80. Most ZKTeco devices can't use HTTPS, so the Caddy config keeps `/iclock/*` available over plain HTTP; everything else is redirected to HTTPS.

### HTTP API (other devices)

Adding an *Other (HTTP API)* device shows a token **once**. The device sends:

```http
POST https://attendance.yourcompany.com/api/devices/punch
Authorization: Bearer <device token>
Content-Type: application/json

{ "pin": "337724", "time": "2026-10-09 08:52:11", "method": "fingerprint" }
```

- `pin` — the staff member's device PIN (required)
- `time` — optional; ISO 8601 (`2026-10-09T08:52:11+01:00`) or local time `YYYY-MM-DD HH:mm:ss`, read in the organization's timezone. Defaults to now.
- `method` — `fingerprint`, `face`, `card` or `pin` (default `fingerprint`)

Responses: `{"result":"checked-in", ...}`, `checked-out`, `duplicate` (repeat within 5 minutes, ignored), `unknown-staff` (404) or `inactive-staff` (403). `GET /api/devices/punch` with the same header checks that the token works.

### How punches become attendance

- First punch of the day → **check-in** (late if after the lateness threshold).
- A later punch → **check-out** (early if before the early-departure threshold). Further punches move the check-out later, so the last punch of the day counts.
- A punch within 5 minutes of the previous one is ignored as a double tap.
- Devices re-send stored punches after reconnecting; each punch is only counted once.
- Times are interpreted in the organization's timezone (Settings → Timezone). Keep the device clock correct.

## 8. Hosting on Vercel instead

Vercel can host the web app, but **not** MongoDB or CompreFace (it doesn't run containers or long-running services). A Vercel setup needs:

| Piece | Where |
| --- | --- |
| App | Vercel (import the GitHub repo) |
| Database | MongoDB Atlas (free M0 tier to start) — set `MONGODB_URI` |
| Face recognition | CompreFace on a VPS, exposed over HTTPS — set `COMPREFACE_URL` and `COMPREFACE_API_KEY` |

Things to know:

- The Hobby plan is for **personal, non-commercial** use under Vercel's terms; a product used by businesses should be on Pro.
- `vercel.json` schedules the photo cleanup daily (Hobby allows daily cron jobs).
- If CompreFace is on the internet, expose only `/api/v1/recognition/*` over HTTPS and keep its admin UI private.
- ZKTeco devices need plain-HTTP access to `/iclock/*`, which Vercel doesn't offer (it forces HTTPS). Use the HTTP API devices, or host on a server.

For these reasons the single-server setup in [section 3](#3-deploy-to-a-server-recommended) is simpler and cheaper.

## 9. Backups and updates

### Back up

```bash
docker compose exec -T mongo mongodump --archive --gzip > timewise-$(date +%F).archive.gz
```

Copy the file off the server (e.g. `scp`). To automate, add a daily cron job and keep the last few copies.

CompreFace's face data lives in the `compreface-data` Docker volume; if lost, staff simply re-register their faces.

### Restore

```bash
docker compose exec -T mongo mongorestore --archive --gzip --drop < timewise-2026-10-09.archive.gz
```

### Update to a new version

```bash
cd /opt/timewise
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile face up -d --build
```

## 10. Troubleshooting

| Problem | Fix |
| --- | --- |
| No verification email | Email isn't configured — see [section 5](#5-email), or verify the account manually. |
| Kiosk camera is black / not allowed | Browsers only allow the camera on `https://` or `http://localhost`. Check the browser's camera permission for the site. |
| Face tab missing on the kiosk | Face recognition is off in Settings, or `COMPREFACE_API_KEY` isn't set (Settings shows a warning). |
| "Face recognition service is unavailable" | CompreFace is still starting (~1 minute after boot) or stopped: `docker compose --profile face ps`. The first request after a long idle can also be slow while its models load. |
| Check-ins marked "Face not checked" | Face verification was on but CompreFace was unavailable at that moment; the check-in was allowed so staff aren't locked out. |
| Genuine staff get "Face not recognised" | Re-register their face in good light, or lower `COMPREFACE_SIMILARITY_THRESHOLD` slightly. |
| Kiosk keeps saying "Step a little closer" | The face must fill about 15% of the frame width; move the kiosk or adjust `MIN_FACE_WIDTH_RATIO` in `components/checkin/hands-free-face.tsx`. |
| Fingerprint device stays "Waiting for first connection" | Check the serial number matches, the server address/port on the device, and that the device has network access to port 80. |
| Punches recorded but under the wrong person | The user ID enrolled on the device must equal the staff member's device PIN. |
| Times are off by an hour or more | Set the correct timezone in Settings, and the correct clock on the fingerprint device. |
| HTTPS certificate not issued | The domain's A record must point at the server and ports 80/443 must be open; check `docker compose ... logs caddy`. |
| Port 3000 or 8001 already in use locally | Change the left-hand port in `docker-compose.yml` (e.g. `"3001:3000"`). |
