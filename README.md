# Employee Leave Management System

A full-stack Employee Leave Management System built with Node.js, Express, EJS, Sequelize, and SQLite. This app supports employee and manager roles, leave applications, leave donation, leave approval workflows, password reset email notifications, and department-based access control.

## Features

- User registration and login for employees and managers
- Role-based access to employee and manager dashboards
- Employee leave application with leave balance validation
- Manager review, approval, and rejection of leave applications
- Employee leave balance tracking by leave type (annual, sick, casual, compensatory)
- Leave donation between employees in the same department
- Donation history and leave application details
- Password reset flow with token-based email support
- Flash messaging for user feedback
- SQLite database via Sequelize ORM

## Project Structure

- `server.js` - Main Express app entry point
- `config/db.js` - Database connection using SQLite
- `models/` - Sequelize models for `User`, `Leave`, and `LeaveDonation`
- `routes/` - Route definitions for auth, employee, and manager workflows
- `middleware/` - Authorization middleware
- `utils/mailer.js` - Email helper functions
- `views/` - EJS templates for pages and layouts
- `public/` - Static assets (CSS, JS)

## Prerequisites

- Node.js v18+ recommended
- npm or yarn

## Installation

1. Clone the repository

```bash
git clone https://github.com/ManasaPrakash18/Employee-Leave-Management.git
cd "Employee Leave Management System"
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file in the project root

Example `.env` contents:

```bash
PORT=4080
SESSION_SECRET=your-secret-here
DB_STORAGE=database.sqlite
```

## Running the App

Start in development mode with `nodemon`:

```bash
npm run dev
```

Or start normally:

```bash
npm start
```

Then open:

```text
http://localhost:4080
```

## Environment Variables

- `PORT` — Port number for the server (default: `4080`)
- `SESSION_SECRET` — Session secret for `express-session`
- `DB_STORAGE` — SQLite file path (default: `database.sqlite`)

## Notes

- The database uses SQLite by default, with storage configured via `DB_STORAGE`
- When the server starts, models are synced automatically
- Email functionality depends on configuration in `utils/mailer.js`

## Dependencies

- `express`
- `ejs`
- `express-session`
- `connect-flash`
- `sequelize`
- `sqlite3`
- `bcryptjs`
- `dotenv`
- `nodemailer`
- `method-override`
- `multer`
- `pg` and `pg-hstore` (present but not required for SQLite)

## Development

- `npm install` — install dependencies
- `npm run dev` — start server with live reload
- `npm start` — start server normally

## License

This project uses the `ISC` license.
