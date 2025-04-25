// Cache DOM elements
const elements = {
    speedControl: document.getElementById('speedControl'),
    speedValue: document.getElementById('speedValue'),
    statusDisplay: document.getElementById('statusDisplay'),
    arduinoStatus: document.getElementById('arduinoStatus'),
    sensorStatus: document.getElementById('sensorStatus'),
    lineFollowBtn: document.getElementById('lineFollowBtn'),
    lineFollowBackwardBtn: document.getElementById('lineFollowBackwardBtn')
};

// State management
let isLineFollowing = false;
let currentSpeed = 128;
let lastCommand = null;
let keyState = {};

// Movement command mapping
const COMMANDS = {
    forward: 'F',
    backward: 'B',
    left: 'L',
    right: 'R',
    diagonal_left_forward: 'Q',
    diagonal_right_forward: 'E',
    diagonal_left_backward: 'Z',
    diagonal_right_backward: 'C',
    rotate_left: 'V',
    rotate_right: 'N',
    stop: 'S',
    line_follow: 'T',
    line_follow_backward: 'Y'
};

// Update speed display
elements.speedControl.addEventListener('input', (e) => {
    currentSpeed = parseInt(e.target.value);
    elements.speedValue.textContent = currentSpeed;
});

// Send movement command
async function sendCommand(command, speed = currentSpeed) {
    try {
        const response = await fetch('/control/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: command, speed })
        });
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        lastCommand = command;
        updateStatus(`Sent command: ${command} (${speed})`);
    } catch (error) {
        updateStatus('Command failed: ' + error.message, true);
    }
}

// Handle button clicks
document.querySelectorAll('.movement-btn').forEach(button => {
    const direction = button.dataset.direction;
    
    // Touch events for mobile
    button.addEventListener('touchstart', (e) => {
        e.preventDefault();
        sendCommand(direction);
    });
    
    button.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (direction !== 'stop') {
            sendCommand('stop');
        }
    });
    
    // Mouse events for desktop
    button.addEventListener('mousedown', () => {
        sendCommand(direction);
    });
    
    button.addEventListener('mouseup', () => {
        if (direction !== 'stop') {
            sendCommand('stop');
        }
    });
});

// Keyboard controls
const KEY_MAPPINGS = {
    'ArrowUp': 'forward',
    'ArrowDown': 'backward',
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
    'KeyQ': 'diagonal_left_forward',
    'KeyE': 'diagonal_right_forward',
    'KeyZ': 'diagonal_left_backward',
    'KeyC': 'diagonal_right_backward',
    'KeyA': 'rotate_left',
    'KeyD': 'rotate_right',
    'Space': 'stop'
};

window.addEventListener('keydown', (e) => {
    if (e.code in KEY_MAPPINGS && !keyState[e.code]) {
        keyState[e.code] = true;
        sendCommand(KEY_MAPPINGS[e.code]);
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code in KEY_MAPPINGS) {
        keyState[e.code] = false;
        if (KEY_MAPPINGS[e.code] !== 'stop') {
            sendCommand('stop');
        }
    }
});

// Line following controls
elements.lineFollowBtn.addEventListener('click', async () => {
    if (!isLineFollowing) {
        try {
            await sendCommand('line_follow');
            isLineFollowing = true;
            elements.lineFollowBtn.textContent = 'Stop Line Following';
            elements.lineFollowBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
            elements.lineFollowBtn.classList.add('bg-red-500', 'hover:bg-red-600');
        } catch (error) {
            updateStatus('Failed to start line following: ' + error.message, true);
        }
    } else {
        try {
            await sendCommand('stop');
            isLineFollowing = false;
            elements.lineFollowBtn.textContent = 'Start Line Following';
            elements.lineFollowBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
            elements.lineFollowBtn.classList.add('bg-green-500', 'hover:bg-green-600');
        } catch (error) {
            updateStatus('Failed to stop line following: ' + error.message, true);
        }
    }
});

elements.lineFollowBackwardBtn.addEventListener('click', async () => {
    if (!isLineFollowing) {
        try {
            await sendCommand('line_follow_backward');
            isLineFollowing = true;
            elements.lineFollowBackwardBtn.textContent = 'Stop Line Following';
            elements.lineFollowBackwardBtn.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
            elements.lineFollowBackwardBtn.classList.add('bg-red-500', 'hover:bg-red-600');
        } catch (error) {
            updateStatus('Failed to start backward line following: ' + error.message, true);
        }
    } else {
        try {
            await sendCommand('stop');
            isLineFollowing = false;
            elements.lineFollowBackwardBtn.textContent = 'Line Follow Backward';
            elements.lineFollowBackwardBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
            elements.lineFollowBackwardBtn.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
        } catch (error) {
            updateStatus('Failed to stop line following: ' + error.message, true);
        }
    }
});

// Status updates
function updateStatus(message, isError = false) {
    const div = document.createElement('div');
    div.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
    div.className = isError ? 'text-red-600' : '';
    
    elements.statusDisplay.appendChild(div);
    elements.statusDisplay.scrollTop = elements.statusDisplay.scrollHeight;
}

// Check Arduino and sensor status
async function checkStatus() {
    try {
        const response = await fetch('/control/status');
        const data = await response.json();
        
        elements.arduinoStatus.textContent = data.arduino_connected ? 'Connected' : 'Disconnected';
        elements.arduinoStatus.className = 
            `font-mono ${data.arduino_connected ? 'text-green-600' : 'text-red-600'}`;
            
        elements.sensorStatus.textContent = data.sensors_working ? 'OK' : 'Error';
        elements.sensorStatus.className = 
            `font-mono ${data.sensors_working ? 'text-green-600' : 'text-red-600'}`;
    } catch (error) {
        console.error('Failed to check status:', error);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkStatus();
    setInterval(checkStatus, 5000); // Check status every 5 seconds
});

// Cleanup
window.addEventListener('beforeunload', () => {
    if (lastCommand !== 'stop') {
        sendCommand('stop');
    }
});