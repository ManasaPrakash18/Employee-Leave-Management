import express from 'express';
import User from '../models/User.js';
import Leave from '../models/Leave.js';
import { ensureAuthenticated, ensureManager } from '../middleware/auth.js';
import { sendLeaveStatusUpdateNotification } from '../utils/mailer.js';

const router = express.Router();

// Middleware to ensure routes are accessed by managers only
router.use(ensureAuthenticated);
router.use(ensureManager);

function convertLeaveDates(leaves) {
  return leaves.map(leave => ({
    ...leave,
    startDate: new Date(leave.startDate),
    endDate: new Date(leave.endDate)
  }));
}

// Manager dashboard
router.get('/dashboard', async (req, res) => {
  const user = await User.findByPk(req.session.user.id);
  const pendingLeaves = await Leave.findAll({ where: { status: 'pending' } });
  
  // Get employee details for each leave application
  const leavesWithEmployeeDetails = await Promise.all(pendingLeaves.map(async leave => {
    const employee = await User.findByPk(leave.employeeId);
    return {
      ...leave.dataValues,
      employeeName: employee ? employee.name : 'Unknown',
      employeeDepartment: employee ? employee.department : 'Unknown'
    };
  }));
  
  // Filter leaves by manager's department
  const departmentLeaves = leavesWithEmployeeDetails.filter(
    leave => leave.employeeDepartment === user.department
  );

  const leavesWithDates = convertLeaveDates(departmentLeaves);
  
  res.render('manager/dashboard', {
    title: 'Manager Dashboard',
    leaves: leavesWithDates
  });
});

// View all leave applications
router.get('/leave-applications', async (req, res) => {
  const user = await User.findByPk(req.session.user.id);
  const allLeaves = await Leave.findAll();
  
  // Get employee details for each leave application
  const leavesWithEmployeeDetails = await Promise.all(allLeaves.map(async leave => {
    const employee = await User.findByPk(leave.employeeId);
    return {
      ...leave.dataValues,
      employeeName: employee ? employee.name : 'Unknown',
      employeeDepartment: employee ? employee.department : 'Unknown'
    };
  }));
  
  // Filter leaves by manager's department
  const departmentLeaves = leavesWithEmployeeDetails.filter(
    leave => leave.employeeDepartment === user.department
  );

  const leavesWithDates = convertLeaveDates(departmentLeaves);
  
  res.render('manager/leave-applications', {
    title: 'Leave Applications',
    leaves: leavesWithDates
  });
});

// View leave application details
router.get('/leave-applications/:id', async (req, res) => {
  const leave = await Leave.findByPk(req.params.id);
  
  if (!leave) {
    req.flash('error_msg', 'Leave application not found');
    return res.redirect('/manager/leave-applications');
  }
  
  const employee = await User.findByPk(leave.employeeId);

  // Explicitly convert dates here including appliedDate and reviewedDate
  const leaveWithDates = {
    ...leave.dataValues,
    startDate: new Date(leave.dataValues.startDate),
    endDate: new Date(leave.dataValues.endDate),
    appliedDate: leave.dataValues.appliedDate ? new Date(leave.dataValues.appliedDate) : null,
    reviewedDate: leave.dataValues.reviewedDate ? new Date(leave.dataValues.reviewedDate) : null
  };
  
  res.render('manager/leave-details', {
    title: 'Leave Application Details',
    leave: leaveWithDates,
    employee
  });
});

// Update leave status
router.post('/leave-applications/:id', async (req, res) => {
  try {
    const { status, comments } = req.body;
    const leaveId = req.params.id;
    
    // Get current leave application before update
    const currentLeave = await Leave.findByPk(leaveId);
    if (!currentLeave) {
      req.flash('error_msg', 'Leave application not found');
      return res.redirect('/manager/leave-applications');
    }
    
    const previousStatus = currentLeave.status;
    
    // Update leave status
    const updatedLeave = await Leave.updateStatus(leaveId, status, req.session.user.id, comments);
    
    // Get employee and manager details
    const employee = await User.findByPk(updatedLeave.employeeId);
    const manager = await User.findByPk(req.session.user.id);
    
    const days = Leave.calculateDays(updatedLeave.startDate, updatedLeave.endDate);
    
    // Adjust leave balance based on status change
    if (previousStatus !== status) {
      if (status === 'approved') {
        // Decrease leave balance
        await User.updateLeaveBalance(employee.id, updatedLeave.leaveType, days, false);
      } else if (status === 'rejected') {
        // Increase leave balance
        await User.updateLeaveBalance(employee.id, updatedLeave.leaveType, days, true);
      }
    }
    
    // Send notification to employee
    await sendLeaveStatusUpdateNotification(updatedLeave, employee, manager);
    
    req.flash('success_msg', `Leave application ${status}`);
    res.redirect('/manager/dashboard');
  } catch (error) {
    console.error('Update leave status error:', error);
    req.flash('error_msg', error.message || 'Failed to update leave status');
    res.redirect(`/manager/leave-applications/${req.params.id}`);
  }
});

// View department employees
router.get('/employees', async (req, res) => {
  const user = await User.findByPk(req.session.user.id);
  let employees = await User.getEmployeesByDepartment(user.department);

  // Map employees to include leaveBalance object
  employees = employees.map(employee => ({
    ...employee.dataValues,
    leaveBalance: {
      annual: employee.leaveBalanceAnnual,
      sick: employee.leaveBalanceSick,
      casual: employee.leaveBalanceCasual,
      compensatory: employee.leaveBalanceCompensatory
    }
  }));
  
  res.render('manager/employees', {
    title: 'Department Employees',
    employees
  });
});

// View employee details
router.get('/employees/:id', async (req, res) => {
  const employee = await User.findByPk(req.params.id);
  
  if (!employee) {
    req.flash('error_msg', 'Employee not found');
    return res.redirect('/manager/employees');
  }
  
  let leaves = await Leave.findAll({ where: { employeeId: employee.id } });

  // Convert leave dates to Date objects
  leaves = leaves.map(leave => ({
    ...leave.dataValues,
    startDate: new Date(leave.startDate),
    endDate: new Date(leave.endDate)
  }));

  // Construct leaveBalance object for employee
  const leaveBalance = {
    annual: employee.leaveBalanceAnnual,
    sick: employee.leaveBalanceSick,
    casual: employee.leaveBalanceCasual,
    compensatory: employee.leaveBalanceCompensatory
  };
  
  res.render('manager/employee-details', {
    title: 'Employee Details',
    employee,
    leaves,
    leaveBalance
  });
});

router.get('/api/leave-counts', async (req, res) => {
  try {
    const user = await User.findByPk(req.session.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const allLeaves = await Leave.findAll();

    // Get employee details for each leave application
    const leavesWithEmployeeDetails = await Promise.all(allLeaves.map(async leave => {
      const employee = await User.findByPk(leave.employeeId);
      return {
        ...leave.dataValues,
        employeeDepartment: employee ? employee.department : 'Unknown',
        status: leave.status
      };
    }));

    // Filter leaves by manager's department
    const departmentLeaves = leavesWithEmployeeDetails.filter(
      leave => leave.employeeDepartment === user.department
    );

    // Count leaves by status
    const counts = {
      pending: departmentLeaves.filter(leave => leave.status === 'pending').length,
      approved: departmentLeaves.filter(leave => leave.status === 'approved').length,
      rejected: departmentLeaves.filter(leave => leave.status === 'rejected').length
    };

    res.json({ counts });
  } catch (error) {
    console.error('Error fetching leave counts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
