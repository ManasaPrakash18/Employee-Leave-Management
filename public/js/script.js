// Three.js background setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ alpha: true });
const container = document.getElementById('3d-container');

renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Create particles
const particlesGeometry = new THREE.BufferGeometry();
const particlesCount = 5000;
const posArray = new Float32Array(particlesCount * 3);

for(let i = 0; i < particlesCount * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 5;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

const particlesMaterial = new THREE.PointsMaterial({
    size: 0.005,
    color: '#0066cc'
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

camera.position.z = 2;

// Animation
const animate = () => {
    requestAnimationFrame(animate);
    particlesMesh.rotation.y += 0.001;
    renderer.render(scene, camera);
};

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Task Management
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

function addTask() {
    const taskInput = document.getElementById('new-task');
    const taskText = taskInput.value.trim();
    
    if (taskText) {
        const task = {
            id: Date.now(),
            text: taskText,
            completed: false
        };
        
        tasks.push(task);
        saveTasks();
        renderTasks();
        taskInput.value = '';
    }
}

function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

function toggleTask(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    saveTasks();
    renderTasks();
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks() {
    const tasksList = document.getElementById('tasks');
    tasksList.innerHTML = '';
    
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span style="text-decoration: ${task.completed ? 'line-through' : 'none'}">
                ${task.text}
            </span>
            <div>
                <button onclick="toggleTask(${task.id})" style="margin-right: 5px;">
                    ${task.completed ? 'Undo' : 'Complete'}
                </button>
                <button onclick="deleteTask(${task.id})">Delete</button>
            </div>
        `;
        tasksList.appendChild(li);
    });
}

// Initialize tasks
renderTasks();

// Add hover effect to member cards
document.querySelectorAll('.member-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.querySelector('.card-3d').style.transform = 'rotateY(180deg)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.querySelector('.card-3d').style.transform = 'rotateY(0deg)';
    });
});

// Leave Application Management
let leaveApplications = JSON.parse(localStorage.getItem('leaveApplications')) || [];

document.getElementById('leaveForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const application = {
        id: Date.now(),
        employeeName: document.getElementById('employeeName').value,
        employeeId: document.getElementById('employeeId').value,
        leaveType: document.getElementById('leaveType').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        reason: document.getElementById('reason').value,
        status: 'pending',
        submittedAt: new Date().toISOString()
    };
    
    leaveApplications.push(application);
    saveApplications();
    renderApplications();
    this.reset();
});

function saveApplications() {
    localStorage.setItem('leaveApplications', JSON.stringify(leaveApplications));
}

function renderApplications() {
    const pendingList = document.getElementById('pendingApplications');
    const approvedList = document.getElementById('approvedApplications');
    const rejectedList = document.getElementById('rejectedApplications');
    
    pendingList.innerHTML = '';
    approvedList.innerHTML = '';
    rejectedList.innerHTML = '';
    
    leaveApplications.forEach(app => {
        const appElement = createApplicationElement(app);
        
        switch(app.status) {
            case 'pending':
                pendingList.appendChild(appElement);
                break;
            case 'approved':
                approvedList.appendChild(appElement);
                break;
            case 'rejected':
                rejectedList.appendChild(appElement);
                break;
        }
    });
}

function createApplicationElement(app) {
    const div = document.createElement('div');
    div.className = 'application-item';
    div.innerHTML = `
        <div class="application-header">
            <strong>${app.employeeName}</strong>
            <span class="application-date">${new Date(app.submittedAt).toLocaleDateString()}</span>
        </div>
        <div class="application-details">
            <p>Leave Type: ${app.leaveType}</p>
            <p>From: ${app.startDate} To: ${app.endDate}</p>
            <p>Reason: ${app.reason}</p>
        </div>
        ${app.status === 'pending' ? `
            <div class="application-actions">
                <button onclick="updateApplicationStatus(${app.id}, 'approved')">Approve</button>
                <button onclick="updateApplicationStatus(${app.id}, 'rejected')">Reject</button>
            </div>
        ` : ''}
    `;
    return div;
}

function updateApplicationStatus(id, status) {
    leaveApplications = leaveApplications.map(app => {
        if (app.id === id) {
            return { ...app, status };
        }
        return app;
    });
    
    saveApplications();
    renderApplications();
}

// Initialize applications
renderApplications();
