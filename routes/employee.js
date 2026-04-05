import express from 'express';
import User from '../models/User.js';
import Leave from '../models/Leave.js';
import LeaveDonation from '../models/LeaveDonation.js';
import { ensureAuthenticated, ensureEmployee } from '../middleware/auth.js';
import { sendLeaveApplicationNotification, sendLeaveDonationNotification } from '../utils/mailer.js';

const router = express.Router();

// Middleware to ensure routes are accessed by employees only
router.use(ensureAuthenticated);
router.use(ensureEmployee);

function mapLeaveBalance(user) {
  return {
    annual: user.leaveBalanceAnnual,
    sick: user.leaveBalanceSick,
    casual: user.leaveBalanceCasual,
    compensatory: user.leaveBalanceCompensatory
  };
}

function convertLeaveDates(leaves) {
  return leaves.map(leave => ({
    ...leave.dataValues,
    startDate: new Date(leave.startDate),
    endDate: new Date(leave.endDate)
  }));
}

// Employee dashboard
router.get('/dashboard', async (req, res) => {
  const user = await User.findByPk(req.session.user.id);
  let leaves = await Leave.findAll({ where: { employeeId: req.session.user.id } });
  leaves = convertLeaveDates(leaves);
  const leaveBalance = mapLeaveBalance(user);
  
  res.render('employee/dashboard', {
    title: 'Employee Dashboard',
    user,
    leaves,
    leaveBalance
  });
});

// View leave balance
router.get('/leave-balance', async (req, res) => {
  const user = await User.findByPk(req.session.user.id);
  const leaveBalance = mapLeaveBalance(user);
  
  res.render('employee/leave-balance', {
    title: 'Leave Balance',
    leaveBalance
  });
});

// Apply for leave page
router.get('/apply-leave', async (req, res) => {
  const user = await User.findByPk(req.session.user.id);
  const leaveBalance = mapLeaveBalance(user);
  
  res.render('employee/apply-leave', {
    title: 'Apply for Leave',
    leaveBalance
  });
});

// Apply for leave handle
router.post('/apply-leave', async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const user = await User.findByPk(req.session.user.id);
    
    // Calculate number of days
    const days = Leave.calculateDays(startDate, endDate);
    
    // Check if user has enough leave balance
    const leaveBalance = mapLeaveBalance(user);
    if (leaveBalance[leaveType] < days) {
      req.flash('error_msg', `Insufficient ${leaveType} leave balance. You have ${leaveBalance[leaveType]} days available.`);
      return res.redirect('/employee/apply-leave');
    }
    
    // Create leave application
    const leaveApplication = await Leave.create({
      employeeId: req.session.user.id,
      leaveType,
      startDate,
      endDate,
      reason
    });
    
    // Deduct leave balance
    await User.updateLeaveBalance(req.session.user.id, leaveType, days, false);
    
    // Send notification to manager
    await sendLeaveApplicationNotification(leaveApplication, user);
    
    req.flash('success_msg', 'Leave application submitted successfully');
    res.redirect('/employee/dashboard');
  } catch (error) {
    console.error('Apply leave error:', error);
    req.flash('error_msg', error.message || 'Failed to apply for leave');
    res.redirect('/employee/apply-leave');
  }
});

// View leave applications
router.get('/leave-applications', async (req, res) => {
  let leaves = await Leave.findAll({ where: { employeeId: req.session.user.id } });
  leaves = convertLeaveDates(leaves);
  
  res.render('employee/leave-applications', {
    title: 'My Leave Applications',
    leaves
  });
});

// View leave application details
router.get('/leave-applications/:id', async (req, res) => {
  const leave = await Leave.findByPk(req.params.id);
  
  if (!leave || leave.employeeId !== req.session.user.id) {
    req.flash('error_msg', 'Leave application not found');
    return res.redirect('/employee/leave-applications');
  }
  
  const leaveWithDates = {
    ...leave.dataValues,
    startDate: new Date(leave.startDate),
    endDate: new Date(leave.endDate)
  };
  
  res.render('employee/leave-details', {
    title: 'Leave Application Details',
    leave: leaveWithDates
  });
});

// Donate leave page
router.get('/donate-leave', async (req, res) => {
  const user = await User.findByPk(req.session.user.id);
  const colleagues = (await User.getEmployeesByDepartment(user.department))
    .filter(colleague => colleague.id !== user.id);
  
  res.render('employee/donate-leave', {
    title: 'Donate Leave',
    leaveBalance: mapLeaveBalance(user),
    colleagues
  });
});

// Donate leave handle
router.post('/donate-leave', async (req, res) => {
  try {
    const { toEmployeeId, leaveType, days } = req.body;
    const fromUser = await User.findByPk(req.session.user.id);
    const toUser = await User.findByPk(toEmployeeId);
    
    if (!toUser) {
      req.flash('error_msg', 'Recipient employee not found');
      return res.redirect('/employee/donate-leave');
    }
    
    // Check if user has enough leave balance
    const leaveBalance = mapLeaveBalance(fromUser);
    if (leaveBalance[leaveType] < parseInt(days)) {
      req.flash('error_msg', `Insufficient ${leaveType} leave balance. You have ${leaveBalance[leaveType]} days available.`);
      return res.redirect('/employee/donate-leave');
    }
    
    // Deduct leave from donor
    await User.updateLeaveBalance(req.session.user.id, leaveType, parseInt(days), false);
    
    // Add leave to recipient
    await User.updateLeaveBalance(toEmployeeId, leaveType, parseInt(days), true);
    
    // Record donation
    const donation = await LeaveDonation.donateLeave(req.session.user.id, toEmployeeId, leaveType, parseInt(days));
    
    // Send notification to recipient
    await sendLeaveDonationNotification(donation, fromUser, toUser);
    
    req.flash('success_msg', `Successfully donated ${days} days of ${leaveType} leave to ${toUser.name}`);
    res.redirect('/employee/dashboard');
  } catch (error) {
    console.error('Donate leave error:', error);
    req.flash('error_msg', error.message || 'Failed to donate leave');
    res.redirect('/employee/donate-leave');
  }
});

// View donation history
router.get('/donation-history', async (req, res) => {
  const donations = await Leave.getDonationsByEmployee(req.session.user.id);
  
  // Get user details for each donation
  const donationsWithDetails = await Promise.all(donations.map(async donation => {
    const fromUser = await User.findByPk(donation.fromEmployeeId);
    const toUser = await User.findByPk(donation.toEmployeeId);
    
    return {
      ...donation,
      fromUserName: fromUser ? fromUser.name : 'Unknown',
      toUserName: toUser ? toUser.name : 'Unknown',
      isOutgoing: donation.fromEmployeeId === req.session.user.id
    };
  }));
  
  res.render('employee/donation-history', {
    title: 'Donation History',
    donations: donationsWithDetails
  });
});

router.get('/api/leave-balance', async (req, res) => {
  try {
    const user = await User.findByPk(req.session.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const leaveBalance = {
      annual: user.leaveBalanceAnnual,
      sick: user.leaveBalanceSick,
      casual: user.leaveBalanceCasual,
      compensatory: user.leaveBalanceCompensatory
    };
    res.json({ leaveBalance });
  } catch (error) {
    console.error('Error fetching leave balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
