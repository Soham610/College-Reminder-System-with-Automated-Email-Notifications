# 🎓 College Reminder System

College Reminder System is a full-stack academic planner with separate student and admin access. The project uses React with Vite on the frontend, Express on the backend, and SQLite for persistent storage, so reminders, timetable data, and goals stay available after refresh and after logging out. A full-stack academic productivity platform with automated email notifications, timetable management, goal tracking, reminders, and dedicated student/admin dashboards.

![React](https://img.shields.io/badge/Frontend-React-blue)
![Node.js](https://img.shields.io/badge/Backend-Node.js-green)
![Express](https://img.shields.io/badge/Framework-Express-black)
![SQLite](https://img.shields.io/badge/Database-SQLite-lightblue)
![License](https://img.shields.io/badge/License-MIT-yellow)


## 🌐 Live Demo

Coming Soon


## 🚀 Features

### 👨‍🎓 Student Module
- Secure JWT Authentication
- Student Registration & Login
- Reminder Management (Add, Edit, Delete)
- Timetable Management
- Goal Tracking System
- Daily Productivity Dashboard
- Dark Mode Support
- Persistent Data Storage

### 👨‍💼 Admin Module
- Admin Authentication
- Student Management
- Reminder Moderation
- Announcement Management
- System Monitoring Dashboard

### 📧 Automation Features
- Automated Email Notifications
- Goal Summary Emails
- Reminder Alerts
- Scheduled Notification Services


## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- React Router
- CSS3

### Backend
- Node.js
- Express.js

### Database
- SQLite

### Authentication
- JWT (JSON Web Token)

### Additional Services
- Nodemailer
- REST APIs

## 📂 Project Structure

```text
College-Reminder-System
│
├── client/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── models/
│   └── services/
│
├── database/
│
└── screenshots/
```

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/Soham610/College-Reminder-System-with-Automated-Email-Notifications.git
```

### Install Dependencies

```bash
npm install
```

### Frontend

```bash
cd client
npm install
npm run dev
```

### Backend

```bash
cd server
npm install
npm start
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

Default admin credentials can be configured through environment variables.

You can override these values in `server/.env`.

## 📡 API Highlights

### Authentication

```http
POST /api/auth/signup
POST /api/auth/login
```

### Reminders

```http
GET /api/reminders
POST /api/reminders
PUT /api/reminders/:id
DELETE /api/reminders/:id
```

### Timetable

```http
GET /api/timetable
POST /api/timetable
PUT /api/timetable/:id
DELETE /api/timetable/:id
```

## Usage Notes

- Student data is stored in SQLite at [`database/db.sqlite`](/Users/sohamdawn/Documents/Web%20Dev%20Project/college-reminder-system/database/db.sqlite).
- Logging out only clears the session token in the browser. Reminders, timetable entries, and goals remain in the database until the user deletes them.
- The student dashboard routes are `/dashboard/reminders`, `/dashboard/timetable`, and `/dashboard/goals`.


## ⭐ Key Highlights

- Full Stack MERN-style Architecture
- JWT Authentication & Authorization
- Automated Email Reminder System
- Admin Dashboard with User Management
- Responsive UI with Dark Mode
- SQLite Database Integration
- RESTful API Design



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




## 🔐 Authentication Flow

1. User Registration
2. Secure Login
3. JWT Token Generation
4. Protected Routes
5. Session Management




## 🎯 Future Improvements

- Mobile Application
- Google Calendar Integration
- AI-based Study Planner
- Smart Reminder Recommendations
- Cloud Database Deployment
- Multi-user Collaboration

---

## 📈 Learning Outcomes

This project helped me gain hands-on experience in:

- Full Stack Web Development
- REST API Development
- Authentication & Authorization
- Database Management
- Email Automation
- React State Management
- Backend Architecture Design

---

## 👨‍💻 Author

**Soham Dawn**

B.Tech CSE (AI & ML)

GitHub: https://github.com/Soham610



---

⭐ If you found this project useful, consider giving it a star.

Made with ❤️ by Soham Dawn
