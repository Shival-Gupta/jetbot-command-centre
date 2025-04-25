// Initialize Ace editor
const editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/c_cpp");
editor.setValue(`// JetBot Arduino Control
const int ML_F = 5;  // Motor Left Forward
const int ML_B = 6;  // Motor Left Backward
const int MR_F = 9;  // Motor Right Forward
const int MR_B = 10; // Motor Right Backward

void setup() {
    Serial.begin(9600);
    pinMode(ML_F, OUTPUT);
    pinMode(ML_B, OUTPUT);
    pinMode(MR_F, OUTPUT);
    pinMode(MR_B, OUTPUT);
    
    // Initialize all motors to stop
    analogWrite(ML_F, 0);
    analogWrite(ML_B, 0);
    analogWrite(MR_F, 0);
    analogWrite(MR_B, 0);
}

void loop() {
    if (Serial.available() > 0) {
        char cmd = Serial.read();
        int spd = Serial.parseInt();
        
        switch(cmd) {
            case 'F': // Forward
                analogWrite(ML_F, spd);
                analogWrite(MR_F, spd);
                analogWrite(ML_B, 0);
                analogWrite(MR_B, 0);
                break;
                
            case 'B': // Backward
                analogWrite(ML_B, spd);
                analogWrite(MR_B, spd);
                analogWrite(ML_F, 0);
                analogWrite(MR_F, 0);
                break;
                
            case 'L': // Left
                analogWrite(ML_B, spd);
                analogWrite(MR_F, spd);
                analogWrite(ML_F, 0);
                analogWrite(MR_B, 0);
                break;
                
            case 'R': // Right
                analogWrite(ML_F, spd);
                analogWrite(MR_B, spd);
                analogWrite(ML_B, 0);
                analogWrite(MR_F, 0);
                break;
                
            case 'S': // Stop
                analogWrite(ML_F, 0);
                analogWrite(ML_B, 0);
                analogWrite(MR_F, 0);
                analogWrite(MR_B, 0);
                break;
        }
        
        Serial.print("CMD:");
        Serial.print(cmd);
        Serial.print(" SPD:");
        Serial.println(spd);
    }
}`);

// Cache DOM elements
const elements = {
    deviceSelect: document.getElementById('deviceSelect'),
    baudRate: document.getElementById('baudRate'),
    connectButton: document.getElementById('connectButton'),
    disconnectButton: document.getElementById('disconnectButton'),
    refreshDevices: document.getElementById('refreshDevices'),
    verifyButton: document.getElementById('verifyButton'),
    uploadButton: document.getElementById('uploadButton'),
    statusDisplay: document.getElementById('statusDisplay'),
    serialOutput: document.getElementById('serialOutput'),
    serialInput: document.getElementById('serialInput'),
    sendCommand: document.getElementById('sendCommand'),
    clearSerial: document.getElementById('clearSerial')
};

// State management
let connected = false;
let currentDevice = null;

// Update device list
async function refreshDevices() {
    try {
        const response = await fetch('/arduino/list');
        const data = await response.json();
        
        elements.deviceSelect.innerHTML = '';
        if (data.devices.length === 0) {
            elements.deviceSelect.innerHTML = '<option value="">No devices found</option>';
        } else {
            data.devices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.port;
                option.textContent = `${device.port} - ${device.description}`;
                elements.deviceSelect.appendChild(option);
            });
        }
    } catch (error) {
        updateStatus('Failed to refresh devices: ' + error.message, true);
    }
}

// Connect to device
async function connect() {
    const port = elements.deviceSelect.value;
    const baud = parseInt(elements.baudRate.value);
    
    if (!port) {
        updateStatus('Please select a device', true);
        return;
    }
    
    try {
        const response = await fetch('/arduino/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ port, baud })
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        connected = true;
        currentDevice = port;
        updateStatus('Connected to ' + port);
        updateConnectionUI();
    } catch (error) {
        updateStatus('Failed to connect: ' + error.message, true);
    }
}

// Disconnect from device
async function disconnect() {
    try {
        await fetch('/arduino/disconnect', {
            method: 'POST'
        });
        
        connected = false;
        currentDevice = null;
        updateStatus('Disconnected');
        updateConnectionUI();
    } catch (error) {
        updateStatus('Failed to disconnect: ' + error.message, true);
    }
}

// Verify code
async function verifyCode() {
    const code = editor.getValue();
    updateStatus('Verifying code...');
    
    try {
        const response = await fetch('/arduino/compile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sketch: code })
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        updateStatus('Verification successful');
    } catch (error) {
        updateStatus('Verification failed: ' + error.message, true);
    }
}

// Upload code
async function uploadCode() {
    if (!currentDevice) {
        updateStatus('Please connect to a device first', true);
        return;
    }
    
    const code = editor.getValue();
    updateStatus('Uploading code...');
    
    try {
        const response = await fetch('/arduino/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                sketch: code,
                port: currentDevice
            })
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        updateStatus('Upload successful');
    } catch (error) {
        updateStatus('Upload failed: ' + error.message, true);
    }
}

// Send serial command
async function sendCommand() {
    if (!connected) {
        updateStatus('Not connected to any device', true);
        return;
    }
    
    const command = elements.serialInput.value;
    if (!command) return;
    
    try {
        const response = await fetch('/arduino/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command })
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        addSerialOutput('> ' + command);
        if (data.response) {
            addSerialOutput('< ' + data.response);
        }
        
        elements.serialInput.value = '';
    } catch (error) {
        updateStatus('Failed to send command: ' + error.message, true);
    }
}

// Helper functions
function updateStatus(message, isError = false) {
    elements.statusDisplay.textContent = message;
    elements.statusDisplay.className = 
        `p-2 rounded text-sm font-mono ${isError ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`;
}

function updateConnectionUI() {
    elements.connectButton.disabled = connected;
    elements.disconnectButton.disabled = !connected;
    elements.deviceSelect.disabled = connected;
    elements.baudRate.disabled = connected;
}

function addSerialOutput(message) {
    const div = document.createElement('div');
    div.textContent = message;
    elements.serialOutput.appendChild(div);
    elements.serialOutput.scrollTop = elements.serialOutput.scrollHeight;
}

// Event listeners
elements.refreshDevices.addEventListener('click', refreshDevices);
elements.connectButton.addEventListener('click', connect);
elements.disconnectButton.addEventListener('click', disconnect);
elements.verifyButton.addEventListener('click', verifyCode);
elements.uploadButton.addEventListener('click', uploadCode);
elements.sendCommand.addEventListener('click', sendCommand);
elements.clearSerial.addEventListener('click', () => {
    elements.serialOutput.innerHTML = '';
});

elements.serialInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendCommand();
    }
});

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    refreshDevices();
});