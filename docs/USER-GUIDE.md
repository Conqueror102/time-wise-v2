# TimeWise — User Guide

TimeWise records when your staff arrive and leave. Staff check in at a **kiosk** (a tablet or computer at the entrance) or on a **fingerprint device**; you see everything on the **dashboard**. TimeWise is free to use, with every feature available.

This guide is for organization admins. For installing and hosting TimeWise, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Contents

1. [Getting started](#1-getting-started)
2. [Settings](#2-settings)
3. [Managing staff](#3-managing-staff)
4. [Setting up the check-in kiosk](#4-setting-up-the-check-in-kiosk)
5. [How staff check in and out](#5-how-staff-check-in-and-out)
6. [Fingerprint devices](#6-fingerprint-devices)
7. [Dashboard, reports and analytics](#7-dashboard-reports-and-analytics)
8. [FAQ](#8-faq)

---

## 1. Getting started

1. Go to the TimeWise site and click **Get Started Free**.
2. Enter your organization's name, a subdomain, and your admin details. Your timezone is taken from your browser.
3. Enter the 6-digit code sent to your email.
4. Log in. You land on the **Dashboard**.

Then, in order:

1. **Settings** — set work hours, timezone and a check-in passcode ([section 2](#2-settings)).
2. **Staff** — add your employees ([section 3](#3-managing-staff)).
3. **Kiosk** — open the check-in page on the entrance device ([section 4](#4-setting-up-the-check-in-kiosk)).

## 2. Settings

Open **Settings** from the sidebar. Click **Save Changes** at the bottom after editing.

### Work hours & attendance

| Setting | What it does |
| --- | --- |
| **Work Start / End Time** | Your normal working hours. |
| **Lateness Threshold** | Check-ins after this time are marked **Late**. |
| **Early Departure Threshold** | Check-outs before this time are marked **Early**. |
| **Timezone** | All times, "today", lateness and early departures use this timezone. Set it to where your office is. |
| **Check-In Passcode** | 4–32 letters or digits. Needed to unlock the kiosk, so staff can't open it from home. |

### Photo verification

When **Capture Photos on Check-In/Out** is on, the kiosk takes a photo at each check-in and check-out. You can see them in **Attendance** and **History**. Photos are deleted automatically after 7 days.

**Verify Face on QR Code and Staff ID Check-Ins** stops people using a colleague's QR code or Staff ID. When it's on, the kiosk quietly takes a photo during QR and Staff ID check-ins and compares it with the staff member's registered face:

| Situation | Result | Shown in Attendance as |
| --- | --- | --- |
| The face matches | Checked in | *Face verified* |
| Someone else is at the kiosk | Rejected: "Face doesn't match this QR code / Staff ID" | — |
| Nobody visible | Asked to look at the camera | — |
| The staff member has no registered face | Checked in as normal | *No face on file* |
| Face recognition is temporarily down | Checked in, so nobody is locked out | *Face not checked* |

It needs face recognition to be set up on the server. The photo is only kept if photo capture is also on.

### Check-in methods

Turn **QR Code**, **Manual Entry** and **Face Recognition** on or off for the kiosk. At least one must stay on. Staff only see the methods you allow — if just one is on, the kiosk shows only that method. If Face Recognition shows a warning, it hasn't been set up on the server yet — ask whoever hosts TimeWise.

The rules are enforced by the server, not just hidden on screen: with Manual Entry off, a staff ID alone can't be used to check in, and QR check-in only accepts the person's real QR code.

### Fingerprint devices

Shows whether a fingerprint attendance device is connected. See [section 6](#6-fingerprint-devices).

## 3. Managing staff

Open **Staff** from the sidebar.

### Add a staff member

Click **Add Staff**, enter name, department and position (email is optional), then **Register Staff**. Each person gets a **Staff ID** (e.g. `STAFF337724`) and a **QR code**.

QR codes are signed, so they can't be made up from a staff ID. If the Staff page shows a **New QR codes** notice, codes were upgraded and badges printed before that date no longer work — print new ones.

### For each staff member

| Button | What it does |
| --- | --- |
| **Edit** | Change name, email, department or position. |
| **QR** | Show their QR code; **Print QR Code** prints just the code (e.g. for an ID badge). |
| **Face / Fingerprint** | Register their face, and see their fingerprint device PIN. |
| **Download** | Save their QR code as an image. |
| Person icon | **Deactivate** / **Reactivate**. Inactive staff can't check in and aren't counted as absent. |
| Bin icon | **Delete**. Their past attendance is kept. |

Badges under each name show **Face** when a face is registered, and their **Device PIN** for fingerprint devices.

### Register a staff member's face

1. Click **Face / Fingerprint** on the person.
2. Choose:
   - **Register on this device** — opens the registration page in a new tab, or
   - **Copy link for another device** — send the link to any phone, tablet or computer with a camera (it expires after 24 hours).
3. On the registration page, the person clicks **Start Camera**, looks straight at the camera in good light, and clicks **Capture**.

A registered face works at any kiosk. Registering again replaces the old photo.

## 4. Setting up the check-in kiosk

The kiosk is any tablet, laptop or computer at the entrance, running a web browser.

1. Make sure a **Check-In Passcode** is set in Settings.
2. Click **Copy Check-In** in the sidebar (or **Copy Check-In URL** in Settings) and open that link on the kiosk device. It is your site address followed by `/checkin`.
3. On the kiosk, enter your **admin email** and the **check-in passcode**, then **Unlock Check-In**.
4. If you use face check-in, allow camera access when the browser asks.

Tips:

- Use a device with a front camera at face height, facing staff as they walk in, with good light on their faces.
- Keep the kiosk plugged in and turn off screen sleep.
- The kiosk stays unlocked for the working day. If it asks for the passcode again, unlock it again.

## 5. How staff check in and out

The kiosk offers only the methods you enabled in Settings; staff can use any of them.

### Face (hands-free)

1. Open the **Face** tab — the camera starts by itself.
2. The staff member steps up and looks at the camera.
3. After about two seconds: **"Welcome, Ada! Checked in at 08:52"**. No buttons needed.

**Checking out:** when someone who is already checked in looks at the camera, a **Check out** button appears. They tap it to check out. Nothing happens if they don't — so walking past the kiosk during the day never checks anyone out.

Messages staff may see:

| Message | Meaning |
| --- | --- |
| *Step a little closer to the camera* | They're too far away (this is also why people walking past aren't recorded). |
| *Face not recognised. Ask your administrator to register you.* | Their face isn't registered, or the lighting is very different — register again. |
| *You're done for today* | Check-in and check-out are already recorded. |

### Manual entry

The staff member types their **Staff ID**, then taps **Check In** or **Check Out**.

### QR code

The staff member taps **Open Camera** and holds their QR code (printed badge or phone) up to the camera, then taps **Check In** or **Check Out**.

### Photos

If photo verification is on, the kiosk saves a photo with each check-in/out (for face check-ins, the frame used for recognition).

## 6. Fingerprint devices

Fingerprint check-in uses a dedicated **fingerprint attendance terminal** — not the kiosk. Staff place their finger on the device, and TimeWise records it.

### Before you have a device

**Settings → Fingerprint Devices** shows *No fingerprint device connected*. Everything else works normally; fingerprint simply isn't used yet.

### When you get a device

1. **Settings → Fingerprint Devices → Add fingerprint device.**
   - For ZKTeco devices, choose *ZKTeco* and enter the device's serial number.
   - For other devices, choose *Other (HTTP API)* and give the token shown to whoever sets up the device.
2. Set the device's server address to your TimeWise address (the panel's **How to connect a ZKTeco device** section shows the exact values).
3. On the device, enrol each staff member's finger using their **Device PIN** as the user ID — it's on their row in **Staff** (for `STAFF337724` the PIN is `337724`).
4. The device shows as **Online** in Settings within a minute.

### How punches are recorded

- The first punch of the day is a **check-in**; a later punch is a **check-out** (the last punch of the day counts).
- A second punch within 5 minutes is ignored, so a double tap doesn't check someone out.
- Punches appear in **Attendance** with the method *fingerprint*.

The device status in Settings is **Online**, **Offline** (hasn't been in touch for a few minutes — check its power and network) or **Waiting for first connection**.

## 7. Dashboard, reports and analytics

### Dashboard

Today at a glance: total staff, present, late, absent, currently in, early departures, and the latest check-ins. Click a card to see the people behind the number.

### Attendance

Every check-in and check-out for a chosen date, with time, method and photo. Filter by status, type, method, or who's currently in. **Export CSV** downloads the filtered list.

### Reports (sidebar)

| Report | Shows |
| --- | --- |
| **Present Today** | Everyone who checked in today, and whether they're still in. |
| **Absent** | Active staff who haven't checked in today. |
| **Late Arrivals** | Who arrived after the lateness threshold today. |
| **Early Departures** | Who left before the early-departure threshold today. |
| **History** | Attendance over a date range, per person; export to CSV. |

### Analytics

Choose a period (7 days, 30 days, 90 days, 1 year):

- **Overview** — attendance rate, late arrivals, early departures, absent today, compared with the previous period.
- **Trends** — check-ins per day and a this-week vs last-week comparison.
- **Lateness** — how late people are, who is late most often, recent late arrivals.
- **Departments** — attendance and punctuality per department.
- **Staff** — each person's attendance and punctuality; export to CSV.

The **attendance rate** counts only days your organization was open (days with at least one check-in), so weekends and holidays don't count as absences.

## 8. FAQ

**Is TimeWise really free?**
Yes — every feature, no staff limit.

**Someone forgot to check out. What happens?**
Their day shows a check-in without a check-out. They're counted as present, and as "currently in" for the rest of that day only.

**Can staff check in from home?**
Not from the kiosk: it needs your passcode to unlock, face check-in needs the person in front of the camera, and fingerprint check-in needs the physical device.

**Can someone check in for a colleague?**
Not if you turn on **Verify Face on QR Code and Staff ID Check-Ins** and register your staff's faces: the kiosk then checks that the person at the camera is the owner of the QR code or Staff ID. Without it, anyone who knows a colleague's Staff ID (with Manual Entry on) or has their QR code could. Face check-in and fingerprint devices also prevent it. (Face recognition doesn't yet detect a printed photo held up to the camera.)

**We changed timezone. Is old data affected?**
Existing records keep the date they were recorded on; new check-ins use the new timezone.

**A staff member left the company.**
**Deactivate** them to keep their history and stop them being counted, or **Delete** them (their attendance history is kept either way).

**How long are photos kept?**
7 days, then deleted automatically.
