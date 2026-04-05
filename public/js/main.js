import { startAnimation } from './3d-animations.js';

async function fetchLeaveBalance() {
  try {
    const response = await fetch('/employee/api/leave-balance');
    if (!response.ok) throw new Error('Failed to fetch leave balance');
    const data = await response.json();
    return data.leaveBalance;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function fetchLeaveCounts() {
  try {
    const response = await fetch('/manager/api/leave-counts');
    if (!response.ok) throw new Error('Failed to fetch leave counts');
    const data = await response.json();
    return data.counts;
  } catch (error) {
    console.error(error);
    return null;
  }
}

function updateEmployeeLeaveBalanceUI(leaveBalance) {
  if (!leaveBalance) return;
  const annualElem = document.querySelector('.bg-blue-50 .text-2xl.font-bold.text-blue-700');
  const sickElem = document.querySelector('.bg-green-50 .text-2xl.font-bold.text-green-700');
  const casualElem = document.querySelector('.bg-purple-50 .text-2xl.font-bold.text-purple-700');
  const compElem = document.querySelector('.bg-yellow-50 .text-2xl.font-bold.text-yellow-700');
  if (annualElem) annualElem.textContent = `${leaveBalance.annual} days`;
  if (sickElem) sickElem.textContent = `${leaveBalance.sick} days`;
  if (casualElem) casualElem.textContent = `${leaveBalance.casual} days`;
  if (compElem) compElem.textContent = `${leaveBalance.compensatory} days`;
}

function updateManagerLeaveCountsUI(counts) {
  if (!counts) return;
  const pendingElem = document.querySelector('.bg-blue-50 .text-2xl.font-bold.text-blue-700');
  const approvedElem = document.querySelector('.bg-green-50 .text-2xl.font-bold.text-green-700');
  const rejectedElem = document.querySelector('.bg-red-50 .text-2xl.font-bold.text-red-700');
  if (pendingElem) pendingElem.textContent = counts.pending;
  if (approvedElem) approvedElem.textContent = counts.approved;
  if (rejectedElem) rejectedElem.textContent = counts.rejected;
}

document.addEventListener('DOMContentLoaded', async function() {
  startAnimation();

  // Mobile menu toggle
  const mobileMenuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (mobileMenuButton && mobileMenu) {
    mobileMenuButton.addEventListener('click', function() {
      mobileMenu.classList.toggle('hidden');
    });
  }
  
  // Flash message auto-hide after 5 seconds
  const flashMessages = document.querySelectorAll('.bg-green-100, .bg-red-100');
  
  if (flashMessages.length > 0) {
    setTimeout(function() {
      flashMessages.forEach(function(message) {
        message.style.transition = 'opacity 1s ease-out';
        message.style.opacity = '0';
        
        setTimeout(function() {
          message.style.display = 'none';
        }, 1000);
      });
    }, 5000);
  }
  
  // Form validation for leave application
  const leaveForm = document.querySelector('form[action="/employee/apply-leave"]');
  
  if (leaveForm) {
    leaveForm.addEventListener('submit', function(e) {
      const startDate = new Date(document.getElementById('startDate').value);
      const endDate = new Date(document.getElementById('endDate').value);
      const leaveType = document.getElementById('leaveType').value;
      const reason = document.getElementById('reason').value;
      
      if (!leaveType) {
        e.preventDefault();
        alert('Please select a leave type');
        return;
      }
      
      if (isNaN(startDate.getTime())) {
        e.preventDefault();
        alert('Please select a valid start date');
        return;
      }
      
      if (isNaN(endDate.getTime())) {
        e.preventDefault();
        alert('Please select a valid end date');
        return;
      }
      
      if (startDate > endDate) {
        e.preventDefault();
        alert('End date cannot be earlier than start date');
        return;
      }
      
      if (!reason.trim()) {
        e.preventDefault();
        alert('Please provide a reason for your leave');
        return;
      }
    });
  }
  
  // Form validation for leave donation
  const donationForm = document.querySelector('form[action="/employee/donate-leave"]');
  
  if (donationForm) {
    donationForm.addEventListener('submit', function(e) {
      const toEmployeeId = document.getElementById('toEmployeeId').value;
      const leaveType = document.getElementById('leaveType').value;
      const days = parseInt(document.getElementById('days').value);
      
      if (!toEmployeeId) {
        e.preventDefault();
        alert('Please select a colleague');
        return;
      }
      
      if (!leaveType) {
        e.preventDefault();
        alert('Please select a leave type');
        return;
      }
      
      if (isNaN(days) || days < 1) {
        e.preventDefault();
        alert('Please enter a valid number of days (minimum 1)');
        return;
      }
    });
  }
  
  // Date range picker enhancement
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  
  if (startDateInput && endDateInput) {
    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    startDateInput.setAttribute('min', today);
    
    // Update end date min when start date changes
    startDateInput.addEventListener('change', function() {
      endDateInput.setAttribute('min', this.value);
      
      // If end date is before start date, reset it
      if (endDateInput.value && endDateInput.value < this.value) {
        endDateInput.value = this.value;
      }
    });
  }

  // Fetch and update leave balance and counts on page load
  const leaveBalance = await fetchLeaveBalance();
  updateEmployeeLeaveBalanceUI(leaveBalance);

  const leaveCounts = await fetchLeaveCounts();
  updateManagerLeaveCountsUI(leaveCounts);

  // Listen for leaveCountsUpdated event to update counts dynamically
  document.addEventListener('leaveCountsUpdated', (event) => {
    updateManagerLeaveCountsUI(event.detail);
  });
});
