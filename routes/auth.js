import express from 'express';
import User from '../models/User.js';
import { sendPasswordResetEmail } from '../utils/mailer.js';

const router = express.Router();

// Role selection page
router.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect(req.session.user.role === 'manager' ? '/manager/dashboard' : '/employee/dashboard');
  }
  res.render('auth/role-select', {
    layout: false
  });
});

// Login page
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect(req.session.user.role === 'manager' ? '/manager/dashboard' : '/employee/dashboard');
  }
  
  const role = req.query.role || 'employee';
  if (!['employee', 'manager'].includes(role)) {
    return res.redirect('/');
  }
  
  res.render('auth/login', {
    title: `Login as ${role.charAt(0).toUpperCase() + role.slice(1)}`,
    layout: 'layouts/auth',
    role
  });
});

// Register page
router.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect(req.session.user.role === 'manager' ? '/manager/dashboard' : '/employee/dashboard');
  }
  res.render('auth/register', {
    title: 'Register',
    layout: 'layouts/auth'
  });
});

// Register handle
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, password2, role, department } = req.body;
    const errors = [];
    
    // Validation
    if (!name || !email || !password || !password2 || !department) {
      errors.push({ msg: 'Please fill in all fields' });
    }
    
    if (password !== password2) {
      errors.push({ msg: 'Passwords do not match' });
    }
    
    if (password.length < 6) {
      errors.push({ msg: 'Password should be at least 6 characters' });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      errors.push({ msg: 'Email is already registered' });
    }
    
    if (errors.length > 0) {
      return res.render('auth/register', {
        title: 'Register',
        layout: 'layouts/auth',
        errors,
        name,
        email,
        department,
        role: role || 'employee'
      });
    }
    
    // Create user
    await User.create({
      name,
      email,
      password,
      role: role || 'employee',
      department
    });
    
    req.flash('success_msg', 'You are now registered and can log in');
    res.redirect('/login?role=' + (role || 'employee'));
  } catch (error) {
    console.error('Registration error:', error);
    req.flash('error_msg', error.message || 'Registration failed');
    res.redirect('/register');
  }
});

// Login handle
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    if (!['employee', 'manager'].includes(role)) {
      req.flash('error_msg', 'Invalid role selected');
      return res.redirect('/');
    }
    
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      req.flash('error_msg', 'That email is not registered');
      return res.redirect('/login?role=' + role);
    }
    
    // Check role
    if (user.role !== role) {
      req.flash('error_msg', `This account is not registered as a ${role}`);
      return res.redirect('/login?role=' + role);
    }
    
    // Match password
    const isMatch = await user.validPassword(password);
    if (!isMatch) {
      req.flash('error_msg', 'Password incorrect');
      return res.redirect('/login?role=' + role);
    }
    
    // Create session
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    };
    
    // Redirect based on role
    if (user.role === 'manager') {
      res.redirect('/manager/dashboard');
    } else {
      res.redirect('/employee/dashboard');
    }
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error_msg', 'Login failed');
    res.redirect('/login?role=' + (req.body.role || 'employee'));
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
});

// Forgot password page
router.get('/forgot-password', (req, res) => {
  res.render('auth/forgot-password', {
    title: 'Forgot Password',
    layout: 'layouts/auth'
  });
});

// Forgot password handle
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      req.flash('error_msg', 'That email is not registered');
      return res.redirect('/forgot-password');
    }
    
    // Create password reset token
    const token = await User.createPasswordResetToken(email);
    
    // Send password reset email
    await sendPasswordResetEmail(email, token);
    
    req.flash('success_msg', 'Password reset link sent to your email');
    res.redirect('/login');
  } catch (error) {
    console.error('Forgot password error:', error);
    req.flash('error_msg', 'Failed to send password reset email');
    res.redirect('/forgot-password');
  }
});

// Reset password page
router.get('/reset-password/:token', (req, res) => {
  const { token } = req.params;
  
  // Verify token
  const email = User.verifyResetToken(token);
  if (!email) {
    req.flash('error_msg', 'Invalid or expired password reset token');
    return res.redirect('/login');
  }
  
  res.render('auth/reset-password', {
    title: 'Reset Password',
    layout: 'layouts/auth',
    token
  });
});

// Reset password handle
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password, password2 } = req.body;
    
    // Verify token
    const email = User.verifyResetToken(token);
    if (!email) {
      req.flash('error_msg', 'Invalid or expired password reset token');
      return res.redirect('/login');
    }
    
    // Validation
    if (password !== password2) {
      req.flash('error_msg', 'Passwords do not match');
      return res.redirect(`/reset-password/${token}`);
    }
    
    if (password.length < 6) {
      req.flash('error_msg', 'Password should be at least 6 characters');
      return res.redirect(`/reset-password/${token}`);
    }
    
    // Reset password
    await User.resetPassword(email, password);
    
    req.flash('success_msg', 'Password reset successful. You can now log in with your new password');
    res.redirect('/login');
  } catch (error) {
    console.error('Reset password error:', error);
    req.flash('error_msg', 'Failed to reset password');
    res.redirect('/login');
  }
});

export default router;
