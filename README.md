# Nursing Student Portal

A responsive Nursing Student Website with a MongoDB backend: public student portal (view-only) and an admin dashboard for managing events, daily subjects, and announcements.

## Features

- **Student Public Portal** (no login): Home, Events, Daily Subjects, announcements carousel, countdown to next event, quick links, responsive design.
- **Admin Dashboard** (JWT login): Dashboard stats, Events CRUD, Daily Subjects CRUD, Announcements CRUD, responsive sidebar.

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT for admin

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment**
   - Copy `.env.example` to `.env`
   - Set `MONGODB_URI` (e.g. MongoDB Atlas connection string)
   - Set `JWT_SECRET` (strong random string for production)
   - Optional: `PORT` (default 3000)

3. **Seed database** (creates sample data)
   ```bash
   node scripts/seed.js
   ```

4. **Run server**
   ```bash
   npm start
   ```
   - Public portal: http://localhost:3000
   - Admin: http://localhost:3000/admin

## Design

- **Colors**: Primary Blue (#1E90FF), White (#FFFFFF), Light Grey (#F5F5F5)
- **Fonts**: Montserrat Bold (headers), Open Sans (body)
- **Subject types**: Theory (blue), Lab (green), Seminar (yellow)
- **Admin buttons**: Add (green), Edit (orange), Delete (red)

## API (examples)

- `GET /api/events` – all events  
- `GET /api/events/upcoming` – upcoming events  
- `GET /api/daily-subjects` – all daily subjects  
- `GET /api/daily-subjects/day/:day` – subjects for one day  
- `GET /api/announcements` – all announcements  
- `POST /api/auth/login` – admin login (body: `{ email, password }`)  

Admin routes (Events, Daily Subjects, Announcements) require header: `Authorization: Bearer <token>`.
