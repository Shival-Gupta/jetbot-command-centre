// Cache DOM elements
const elements = {
    packageStatus: document.getElementById('packageStatus'),
    arduinoStatus: document.getElementById('arduinoStatus'),
    autostartStatus: document.getElementById('autostartStatus'),
    installPackages: document.getElementById('installPackages'),
    setupArduino: document.getElementById('setupArduino'),
    setupAutostart: document.getElementById('setupAutostart'),
    packageLog: document.getElementById('packageLog'),
    arduinoLog: document.getElementById('arduinoLog'),
    autostartLog: document.getElementById('autostartLog'),
    setupLog: document.getElementById('setupLog')
};

// Helper function to update setup log
function logMessage(message, isError = false) {
    const div = document.createElement('div');
    div.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
    div.className = isError ? 'text-red-600' : '';
    elements.setupLog.appendChild(div);
    elements.setupLog.scrollTop = elements.setupLog.scrollHeight;
}

// Update status display
function updateStatusDisplay(elementId, status, details = '') {
    const element = document.getElementById(elementId);
    const statusText = status ? 'Installed' : 'Not Installed';
    const statusColor = status ? 'text-green-600' : 'text-red-600';
    
    element.innerHTML = `
        <span class="${statusColor} font-medium">${statusText}</span>
        ${details ? `<span class="text-gray-600 text-sm ml-2">${details}</span>` : ''}
    `;
}

// Check system status
async function checkStatus() {
    try {
        const response = await fetch('/setup/status');
        const data = await response.json();
        
        // Update package status
        elements.packageStatus.innerHTML = '';
        for (const [type, packages] of Object.entries(data.packages)) {
            const container = document.createElement('div');
            container.className = 'pl-4 border-l-2 border-gray-200';
            container.innerHTML = `<div class="text-sm font-medium">${type.toUpperCase()}</div>`;
            
            for (const [pkg, installed] of Object.entries(packages)) {
                const pkgDiv = document.createElement('div');
                pkgDiv.className = 'flex justify-between items-center text-sm';
                pkgDiv.innerHTML = `
                    <span>${pkg}</span>
                    <span class="${installed ? 'text-green-600' : 'text-red-600'}">
                        ${installed ? '✓' : '✗'}
                    </span>
                `;
                container.appendChild(pkgDiv);
            }
            elements.packageStatus.appendChild(container);
        }
        
        // Update Arduino CLI status
        updateStatusDisplay('arduinoStatus', data.arduino_cli);
        
        // Update autostart status
        updateStatusDisplay('autostartStatus', data.autostart);
        
    } catch (error) {
        logMessage('Failed to check status: ' + error.message, true);
    }
}

// Install packages
async function installPackages() {
    elements.installPackages.disabled = true;
    elements.packageLog.classList.remove('hidden');
    
    try {
        const response = await fetch('/setup/install', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'install_packages' })
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        logMessage('Package installation completed successfully');
        await checkStatus();
    } catch (error) {
        logMessage('Failed to install packages: ' + error.message, true);
    } finally {
        elements.installPackages.disabled = false;
    }
}

// Setup Arduino CLI
async function setupArduino() {
    elements.setupArduino.disabled = true;
    elements.arduinoLog.classList.remove('hidden');
    
    try {
        const response = await fetch('/setup/arduino', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'setup_arduino' })
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        logMessage('Arduino CLI setup completed successfully');
        await checkStatus();
    } catch (error) {
        logMessage('Failed to setup Arduino CLI: ' + error.message, true);
    } finally {
        elements.setupArduino.disabled = false;
    }
}

// Configure autostart
async function setupAutostart() {
    elements.setupAutostart.disabled = true;
    elements.autostartLog.classList.remove('hidden');
    
    try {
        const response = await fetch('/setup/autostart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'setup_autostart' })
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        logMessage('Autostart configuration completed successfully');
        await checkStatus();
    } catch (error) {
        logMessage('Failed to configure autostart: ' + error.message, true);
    } finally {
        elements.setupAutostart.disabled = false;
    }
}

// Event listeners
elements.installPackages.addEventListener('click', installPackages);
elements.setupArduino.addEventListener('click', setupArduino);
elements.setupAutostart.addEventListener('click', setupAutostart);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkStatus();
    // Refresh status every 30 seconds
    setInterval(checkStatus, 30000);
});