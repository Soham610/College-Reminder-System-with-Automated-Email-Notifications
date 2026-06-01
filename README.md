# College Reminder System

College Reminder System is a full-stack academic planner with separate student and admin access. The project uses React with Vite on the frontend, Express on the backend, and SQLite for persistent storage, so reminders, timetable data, and goals stay available after refresh and after logging out.

## Features

- Separate student and admin login flows
- Student signup and login with JWT authentication
- Seeded admin login for administration access
- Isolated student sections for reminders, timetable, and goals
- Persistent reminder storage with add, edit, delete, and view support
- Interactive timetable with clickable days from Monday to Sunday
- Daily goals with active/completed sections, completion checkboxes, deadline handling, and overdue actions
- Midnight goal summary generation with email delivery when SMTP is configured, otherwise simulated delivery saved in the app
- Admin tools for student management, reminder moderation, and announcements
- Clean academic UI with card-based layout and responsive screens

## Tech Stack

- Frontend: React, Vite, React Router, CSS
- Backend: Node.js, Express
- Database: SQLite via `better-sqlite3`
- Auth: JWT + bcrypt

## Project Structure

```text
/college-reminder-system
├── /client
│   ├── /components
│   ├── /pages
│   └── /services
├── /server
│   ├── /routes
│   ├── /controllers
│   ├── /models
│   ├── /services
│   └── /utils
├── /database
│   └── db.sqlite
└── README.md
```

## Setup

### 1. Install dependencies

From the project root:

```bash
npm install
```

### 2. Configure the server

Copy the example environment file and adjust values if needed:

```bash
cd server
cp .env.example .env
cd ..
```

### 3. Start the full stack in development mode

From the project root:

```bash
npm run dev
```

This starts:

- React client on `http://localhost:5173`
- Express server on `http://localhost:5001`

### 4. Start the backend only

```bash
npm run server
```

### 5. Start the frontend only

```bash
npm run client
```

## Email Notifications

The app can send:

- reminder emails 5 minutes before timed reminders when SMTP is configured
- daily goal summary emails after midnight

If SMTP is not configured, daily goal summaries are simulated and stored in the goals section so nothing breaks.

Add these values to `server/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-real-email@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM=College Reminder System <your-real-email@gmail.com>
```

For Gmail, use an App Password rather than your normal password.

### Make Email Delivery Work

1. Open [`server/.env`](/Users/sohamdawn/Documents/Web Dev Project/college-reminder-system/server/.env).
2. Replace `SMTP_USER` with the Gmail address that should send reminder emails.
3. Replace `SMTP_PASS` with a Google App Password for that account.
4. Replace `SMTP_FROM` with the same real address, for example:
   `College Reminder System <your-real-email@gmail.com>`
5. Restart the backend:
   `npm run server`
6. Keep the frontend running:
   `npm run client`

### How To Generate A Gmail App Password

1. Sign in to the Gmail account you want to use for sending.
2. Turn on Google 2-Step Verification for that account.
3. Open Google Account settings and create an App Password for `Mail`.
4. Copy the 16-character password into `SMTP_PASS`.

### How To Test

1. Log in as a student with the email address where you want alerts delivered.
2. In `Timetable`, add a class with `Email alert` enabled and a start time 6-10 minutes ahead.
3. In `Goals`, add a goal with a deadline time 6-10 minutes ahead and email enabled.
4. Wait for the backend worker to check notifications.
   It runs every 60 seconds and sends emails when an item is within 5 minutes.
5. Check the mailbox and spam folder for the reminder email.

## Default Admin Account

The backend seeds an admin account automatically on first run:

- Email: `admin@college.edu`
- Password: `Admin@123`

You can override these values in `server/.env`.

## API Endpoints

- `POST /api/signup`
- `POST /api/login`
- `POST /api/admin/login`
- `GET /api/reminders`
- `POST /api/reminders`
- `PUT /api/reminders/:id`
- `DELETE /api/reminders/:id`
- `GET /api/timetable`
- `POST /api/timetable`
- `PUT /api/timetable/:id`
- `DELETE /api/timetable/:id`
- `GET /api/goals`
- `POST /api/goals`
- `PUT /api/goals/:id`
- `PATCH /api/goals/:id/state`
- `DELETE /api/goals/:id`
- `GET /api/users`
- `GET /api/admin/reminders`
- `PUT /api/admin/reminders/:id`
- `DELETE /api/admin/reminders/:id`
- `DELETE /api/admin/users/:id`
- `GET /api/announcements`
- `POST /api/announcements`

## Usage Notes

- Student data is stored in SQLite at [`database/db.sqlite`](/Users/sohamdawn/Documents/Web%20Dev%20Project/college-reminder-system/database/db.sqlite).
- Logging out only clears the session token in the browser. Reminders, timetable entries, and goals remain in the database until the user deletes them.
- The student dashboard routes are `/dashboard/reminders`, `/dashboard/timetable`, and `/dashboard/goals`.



## Screenshots

### Login Page
![Login Page](screenshots/Loginpage.png)

### Dashboard
![Dashboard](screenshots/dashboardpage.png)

### Admin Dashboard
![Admin Dashboard](screenshots/adminpage.png)

### Dark Mode
![Dark Mode](screenshots/darkmode.png)

### Add Reminder
![Add Reminder](screenshots/addreminderspage.png)

### More Screenshots

![Screenshot 1](screenshots/scrrenshot1.png)

![Screenshot 2](screenshots/scrrenshot2.png)

![Screenshot 3](screenshots/scrrenshot3.png)

![Screenshot 4](screenshots/scrrenshot4.png)

![Screenshot 5](screenshots/scrrenshot5.png)

![Screenshot 6](screenshots/scrrenshot6.png)

![Screenshot 7](screenshots/scrrenshot7.png)

![Screenshot 8](screenshots/scrrenshot8.png)

![Screenshot 9](screenshots/scrrenshot9.png)

![Screenshot 10](screenshots/scrrenshot10.png)

![Screenshot 11](screenshots/scrrenshot11.png)

![Screenshot 12](screenshots/scrrenshot12.png)

![Screenshot 13](screenshots/scrrenshot13.png)

![Screenshot 14](screenshots/scrrenshot14.png)

![Screenshot 15](screenshots/scrrenshot15.png)
