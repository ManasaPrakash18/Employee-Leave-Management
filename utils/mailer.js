import nodemailer from 'nodemailer';
import User from '../models/User.js';
import Leave from '../models/Leave.js';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email', // for development
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Mock email sending for development
const sendMail = async (options) => {
  try {
    // In a real environment, this would send an actual email
    // For development, we'll log the email data
    console.log('Email would be sent with the following details:');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('Text:', options.text);
    console.log('HTML:', options.html);
    
    // Return success
    return { success: true, info: 'Email sent (mocked)' };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};

export const sendLeaveApplicationNotification = async (leaveApplication, employee) => {
  // Find manager of employee's department
  const managers = await User.getManagersByDepartment(employee.department);
  
  if (managers.length === 0) {
    console.log('No manager found for department:', employee.department);
    return { success: false, error: 'No manager found for this department' };
  }
  
  // Get first manager (in a real app, you might want to send to all managers)
  const manager = managers[0];
  
  const days = Leave.calculateDays(leaveApplication.startDate, leaveApplication.endDate);
  
  const startDate = new Date(leaveApplication.startDate);
  const endDate = new Date(leaveApplication.endDate);
  
  const options = {
    to: manager.email,
    subject: `Leave Application from ${employee.name}`,
    text: `${employee.name} has applied for ${days} days of ${leaveApplication.leaveType} leave from ${startDate.toDateString()} to ${endDate.toDateString()}. Reason: ${leaveApplication.reason}`,
    html: `
      <h2>New Leave Application</h2>
      <p><strong>Employee:</strong> ${employee.name}</p>
      <p><strong>Leave Type:</strong> ${leaveApplication.leaveType}</p>
      <p><strong>Duration:</strong> ${days} days</p>
      <p><strong>From:</strong> ${startDate.toDateString()}</p>
      <p><strong>To:</strong> ${endDate.toDateString()}</p>
      <p><strong>Reason:</strong> ${leaveApplication.reason}</p>
      <p>Please review this application at your earliest convenience.</p>
    `
  };
  
  return await sendMail(options);
};

export const sendLeaveStatusUpdateNotification = async (leaveApplication, employee, manager) => {
  const days = Leave.calculateDays(leaveApplication.startDate, leaveApplication.endDate);
  const status = leaveApplication.status.charAt(0).toUpperCase() + leaveApplication.status.slice(1);
  
  const startDate = new Date(leaveApplication.startDate);
  const endDate = new Date(leaveApplication.endDate);
  
  const options = {
    to: employee.email,
    subject: `Leave Application ${status}`,
    text: `Your application for ${days} days of ${leaveApplication.leaveType} leave from ${startDate.toDateString()} to ${endDate.toDateString()} has been ${leaveApplication.status} by ${manager.name}.`,
    html: `
      <h2>Leave Application Update</h2>
      <p>Your application has been <strong>${leaveApplication.status}</strong>.</p>
      <p><strong>Leave Type:</strong> ${leaveApplication.leaveType}</p>
      <p><strong>Duration:</strong> ${days} days</p>
      <p><strong>From:</strong> ${startDate.toDateString()}</p>
      <p><strong>To:</strong> ${endDate.toDateString()}</p>
      ${leaveApplication.comments ? `<p><strong>Comments:</strong> ${leaveApplication.comments}</p>` : ''}
      <p>If you have any questions, please contact your manager.</p>
    `
  };
  
  return await sendMail(options);
};

export const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `http://localhost:3000/reset-password/${token}`;
  
  const options = {
    to: email,
    subject: 'Password Reset',
    text: `You requested a password reset. Please go to the following link to reset your password: ${resetUrl}`,
    html: `
      <h2>Password Reset</h2>
      <p>You requested a password reset.</p>
      <p>Please click the button below to reset your password:</p>
      <p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #1a73e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a>
      </p>
      <p>If you did not request this, please ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
    `
  };
  
  return await sendMail(options);
};

export const sendLeaveDonationNotification = async (donation, fromEmployee, toEmployee) => {
  const options = {
    to: toEmployee.email,
    subject: 'Leave Donation Received',
    text: `${fromEmployee.name} has donated ${donation.days} days of ${donation.leaveType} leave to you.`,
    html: `
      <h2>Leave Donation Received</h2>
      <p>${fromEmployee.name} has donated ${donation.days} days of ${donation.leaveType} leave to you.</p>
      <p>This has been added to your leave balance.</p>
      <p>Thank you for being part of our supportive team!</p>
    `
  };
  
  return await sendMail(options);
};

export default { 
  sendLeaveApplicationNotification, 
  sendLeaveStatusUpdateNotification, 
  sendPasswordResetEmail,
  sendLeaveDonationNotification
};
