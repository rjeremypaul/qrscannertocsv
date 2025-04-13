/* global Html5QrcodeScanner, qrcode */

// =====================
// ADMIN CREDENTIALS
// =====================
const ADMIN_CREDENTIALS = [
    { username: "admin", password: "admin123" },
    { username: "staff", password: "staff123" }
];

// =====================
// SYSTEM STATE
// =====================
let htmlScanner;
let scanningActive = false;
let studentRecords = JSON.parse(localStorage.getItem('studentRecords')) || [];

let currentQRCode = null;

// =====================
// DOM ELEMENTS
// =====================
const loginContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const scanContainer = document.getElementById('scan-container');
const recordsContainer = document.getElementById('records-container');
const generateContainer = document.getElementById('generate-container');

// Login elements
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const loginMessage = document.getElementById('login-message');

// Dashboard elements
const scanStudentsBtn = document.getElementById('scan-students-btn');
const viewRecordsBtn = document.getElementById('view-records-btn');
const generateQrBtn = document.getElementById('generate-qr-btn');
const logoutBtn = document.getElementById('logout-btn');

// Scan elements
const qrResult = document.getElementById('qr-result');
const scannedItemsList = document.getElementById('scanned-items');
const stopScanBtn = document.getElementById('stop-scan-btn');
const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');

// Records elements
const recordsTableBody = document.getElementById('records-table').querySelector('tbody');
const exportCsvBtn = document.getElementById('export-csv-btn');
const backToDashboardBtn2 = document.getElementById('back-to-dashboard-btn-2');

// Generate QR elements
const surnameInput = document.getElementById('surname');
const firstNameInput = document.getElementById('firstName');
const idNumberInput = document.getElementById('idNumber');
const yearSectionInput = document.getElementById('yearSection');
const departmentInput = document.getElementById('department');
const generateQrBtn2 = document.getElementById('generate-qr-btn-2');
const downloadQrBtn = document.getElementById('download-qr-btn');
const backToDashboardBtn3 = document.getElementById('back-to-dashboard-btn-3');
const qrCodeDisplay = document.getElementById('qr-code-display');
const studentInfoDisplay = document.getElementById('student-info-display');

// =====================
// EVENT LISTENERS
// =====================
document.addEventListener('DOMContentLoaded', () => {
    // Login system
    loginBtn.addEventListener('click', handleLogin);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    // Dashboard navigation
    scanStudentsBtn.addEventListener('click', () => switchToSection('scan'));
    viewRecordsBtn.addEventListener('click', () => switchToSection('records'));
    generateQrBtn.addEventListener('click', () => switchToSection('generate'));
    logoutBtn.addEventListener('click', logout);

    // Scan section
    stopScanBtn.addEventListener('click', stopScanning);
    backToDashboardBtn.addEventListener('click', () => switchToSection('dashboard'));

    // Records section
    exportCsvBtn.addEventListener('click', exportToCSV);
    backToDashboardBtn2.addEventListener('click', () => switchToSection('dashboard'));

    // Generate QR section
    generateQrBtn2.addEventListener('click', generateQRCode);
    downloadQrBtn.addEventListener('click', downloadQRCode);
    backToDashboardBtn3.addEventListener('click', () => switchToSection('dashboard'));

    // Initialize with login screen
    switchToSection('login');
});

// =====================
// AUTHENTICATION
// =====================
function handleLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        showLoginMessage("Please enter both username and password", "error");
        return;
    }

    const validAdmin = ADMIN_CREDENTIALS.find(admin => 
        admin.username === username && admin.password === password
    );

    if (validAdmin) {
        
        showLoginMessage("", "success");
        switchToSection('dashboard');
    } else {
        showLoginMessage("Invalid username or password", "error");
    }
}

function showLoginMessage(message, type) {
    loginMessage.textContent = message;
    loginMessage.className = type === "error" ? "error-message" : "success-message";
}

function logout() {
    
    switchToSection('login');
    if (htmlScanner) {
        htmlScanner.clear().catch(console.error);
    }
}

// =====================
// NAVIGATION
// =====================
function switchToSection(section) {
    loginContainer.style.display = 'none';
    dashboardContainer.style.display = 'none';
    scanContainer.style.display = 'none';
    recordsContainer.style.display = 'none';
    generateContainer.style.display = 'none';

    switch(section) {
        case 'login':
            loginContainer.style.display = 'block';
            break;
        case 'dashboard':
            dashboardContainer.style.display = 'block';
            break;
        case 'scan':
            scanContainer.style.display = 'block';
            initializeScanner();
            break;
        case 'records':
            recordsContainer.style.display = 'block';
            updateRecordsTable();
            break;
        case 'generate':
            generateContainer.style.display = 'block';
            resetQRForm();
            break;
        default:
            // optional: log or handle unexpected input
            console.warn('Unexpected value in switch:', section);
            break;
    }
}

// =====================
// QR SCANNER
// =====================
function initializeScanner() {
    if (htmlScanner) htmlScanner.clear().catch(console.error);

    scanningActive = true;
    qrResult.textContent = 'Ready to scan';
    scannedItemsList.innerHTML = '';

    htmlScanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: 250 },
        false
    );

    htmlScanner.render(onScanSuccess, onScanFailure);
}

function onScanSuccess(decodedText) {
    if (!scanningActive) return;

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const [surname, firstName, idNumber] = decodedText.split(',');

    const existingIndex = studentRecords.findIndex(record => 
        record.idNumber === idNumber && record.date === today
    );

    if (existingIndex !== -1) {
        studentRecords[existingIndex].timeOut = now.toLocaleTimeString();
        studentRecords[existingIndex].status = "Checked Out";
        qrResult.textContent = `${firstName} ${surname} checked out`;
    } else {
        studentRecords.push({
            surname,
            firstName,
            idNumber,
            date: today,
            timeIn: now.toLocaleTimeString(),
            timeOut: "",
            status: "Checked In"
        });
        qrResult.textContent = `${firstName} ${surname} checked in`;
    }

    localStorage.setItem('studentRecords', JSON.stringify(studentRecords));
    updateScannedItemsList();
    playBeepSound();
}

function onScanFailure(error) {
    console.warn("QR scan error:", error);
}

function stopScanning() {
    scanningActive = false;
    if (htmlScanner) htmlScanner.clear().catch(console.error);
}

// =====================
// RECORDS MANAGEMENT
// =====================
function updateScannedItemsList() {
    scannedItemsList.innerHTML = '';
    const today = new Date().toISOString().split('T')[0];
    
    studentRecords
        .filter(record => record.date === today)
        .forEach(record => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${record.surname}, ${record.firstName}</strong>
                (ID: ${record.idNumber})<br>
                <small>In: ${record.timeIn}</small>
                ${record.timeOut ? 
                    `<small> | Out: ${record.timeOut}</small>` : 
                    '<small style="color:green"> (Present)</small>'}
            `;
            scannedItemsList.appendChild(li);
        });
}

function updateRecordsTable() {
    recordsTableBody.innerHTML = '';
    studentRecords.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.surname}</td>
            <td>${record.firstName}</td>
            <td>${record.idNumber}</td>
            <td>${record.timeIn}</td>
            <td>${record.timeOut || '-'}</td>
            <td>${record.status}</td>
        `;
        recordsTableBody.appendChild(row);
    });
}

function exportToCSV() {
    const headers = [
        { label: 'Surname', key: 'surname' },
        { label: 'First Name', key: 'firstName' },
        { label: 'ID Number', key: 'idNumber' },
        { label: 'Date', key: 'date' },
        { label: 'Time In', key: 'timeIn' },
        { label: 'Time Out', key: 'timeOut' },
        { label: 'Status', key: 'status' }
    ];

    const csvContent = [
        headers.map(h => h.label).join(','), // Header row
        ...studentRecords.map(record => 
            headers.map(h => {
                const value = record[h.key] || '';
                return `"${value.toString().replace(/"/g, '""')}"`;
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_records_${new Date().toISOString().slice(0,10)}.csv`);
    link.click();
}


// =====================
// QR GENERATION
// =====================
function generateQRCode() {
    const surname = surnameInput.value.trim();
    const firstName = firstNameInput.value.trim();
    const idNumber = idNumberInput.value.trim();

    if (!surname || !firstName || !idNumber) {
        alert("Please fill in all required fields (Surname, First Name, ID Number)");
        return;
    }

    const studentData = [
        surname,
        firstName,
        idNumber,
        yearSectionInput.value.trim(),
        departmentInput.value.trim()
    ].join(',');

    // Generate QR code
    const qr = qrcode(0, 'L');
    qr.addData(studentData);
    qr.make();

    // Display QR code
    qrCodeDisplay.innerHTML = qr.createImgTag(4);
    
    // Display student info
    studentInfoDisplay.innerHTML = `
        <p><strong>${surname}, ${firstName}</strong></p>
        <p>ID: ${idNumber}</p>
        ${yearSectionInput.value.trim() ? `<p>${yearSectionInput.value.trim()}</p>` : ''}
        ${departmentInput.value.trim() ? `<p>${departmentInput.value.trim()}</p>` : ''}
    `;

    // Enable download button and store current QR code
    downloadQrBtn.disabled = false;
    currentQRCode = qr;
}

function downloadQRCode() {
    if (!currentQRCode) return;

    // Create canvas to download QR code
    const canvas = document.createElement('canvas');
    const size = 300;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    
    // Create temporary image to draw on canvas
    const img = new Image();
    img.src = currentQRCode.createDataURL(4);
    img.onload = () => {
        context.drawImage(img, 0, 0, size, size);
        
        // Add student info below QR code
        context.font = '16px Arial';
        context.fillStyle = '#000';
        context.textAlign = 'center';
        context.fillText(`${surnameInput.value.trim()}, ${firstNameInput.value.trim()}`, size/2, size + 20);
        context.fillText(`ID: ${idNumberInput.value.trim()}`, size/2, size + 40);
        
        // Download the canvas as image
        const link = document.createElement('a');
        link.download = `qr_${idNumberInput.value.trim()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };
}

function resetQRForm() {
    surnameInput.value = '';
    firstNameInput.value = '';
    idNumberInput.value = '';
    yearSectionInput.value = '';
    departmentInput.value = '';
    qrCodeDisplay.innerHTML = '';
    studentInfoDisplay.innerHTML = '';
    downloadQrBtn.disabled = true;
    currentQRCode = null;
}

// =====================
// UTILITIES
// =====================
function playBeepSound() {
    const beep = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...');
    beep.play().catch(e => console.log("Audio error:", e));
}