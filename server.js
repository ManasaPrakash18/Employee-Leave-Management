import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import session from 'express-session';
import flash from 'connect-flash';
import ejsLayouts from 'express-ejs-layouts';
import methodOverride from 'method-override';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employee.js';
import managerRoutes from './routes/manager.js';

// Import database connection and models
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Leave from './models/Leave.js';

// Configuration
dotenv.config();
const app = express();
const PORT = process.env.PORT || 4080;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(ejsLayouts);
app.set('layout', 'layouts/main');

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'leave-management-secret',
  resave: false,
  saveUninitialized: false
}));

// Flash messages
app.use(flash());

// Global variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.session.user || null;
  next();
});

// Routes
app.use('/', authRoutes);
app.use('/employee', employeeRoutes);
app.use('/manager', managerRoutes);

// Landing page route
app.get('/', (req, res) => {
  res.render('index.ejs', {
    title: 'Employee Leave Management System',
    layout: false
  });
});

// Current root page route
app.get('/home', (req, res) => {
  res.render('index.ejs', {
    title: 'Leave Management System',
    layout: 'layouts/main'
  });
});

// Connect to database and sync models, then start server
connectDB().then(async () => {
  await User.sync();
  await Leave.sync();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to connect to database:', err);
});
