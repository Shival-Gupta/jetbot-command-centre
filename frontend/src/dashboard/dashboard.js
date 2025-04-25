// Initialize time-series data for charts
const MAX_POINTS = 60; // 1 minute of data at 1s intervals
const timestamps = Array(MAX_POINTS).fill(Date.now());
const cpuData = Array(MAX_POINTS).fill(0);
const memoryData = Array(MAX_POINTS).fill(0);

// Initialize charts
const cpuChart = new uPlot({
    width: 300,
    height: 150,
    series: [
        { label: "Time" },
        {
            label: "CPU %",
            stroke: "rgb(59, 130, 246)",
            fill: "rgba(59, 130, 246, 0.1)"
        }
    ],
    scales: {
        x: { time: false },
        y: { range: [0, 100] }
    }
}, [timestamps, cpuData], document.getElementById("cpuChart"));

const memoryChart = new uPlot({
    width: 300,
    height: 150,
    series: [
        { label: "Time" },
        {
            label: "Memory %",
            stroke: "rgb(16, 185, 129)",
            fill: "rgba(16, 185, 129, 0.1)"
        }
    ],
    scales: {
        x: { time: false },
        y: { range: [0, 100] }
    }
}, [timestamps, memoryData], document.getElementById("memoryChart"));

// Format bytes to human readable format
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

// Update UI with system stats
function updateStats(data) {
    // Update system information
    if (data.system) {
        document.getElementById('osInfo').textContent = `${data.system.os.system} ${data.system.os.version}`;
        document.getElementById('hostInfo').textContent = data.system.os.machine;
        document.getElementById('kernelInfo').textContent = data.system.os.release;
        document.getElementById('uptimeInfo').textContent = data.uptime;
        document.getElementById('packagesInfo').textContent = 
            `${data.system.packages.dpkg} (dpkg), ${data.system.packages.snap} (snap)`;
        document.getElementById('shellInfo').textContent = data.system.shell;
        document.getElementById('cpuInfo').textContent = data.system.os.processor;
        document.getElementById('gpuInfo').textContent = data.system.gpu || 'N/A';
    }

    // Update simple stats
    document.getElementById('cpuUsage').textContent = `${data.cpu.toFixed(1)}%`;
    document.getElementById('memoryUsage').textContent = 
        `${(data.memory.percent).toFixed(1)}% (${formatBytes(data.memory.used)} / ${formatBytes(data.memory.total)})`;
    document.getElementById('temperature').textContent = 
        data.temperature ? `${data.temperature.toFixed(1)}°C` : 'N/A';
    document.getElementById('storage').textContent = 
        `${(data.disk.percent).toFixed(1)}% (${formatBytes(data.disk.free)} free)`;
    
    // Update Arduino status
    document.getElementById('arduinoStatus').textContent = 
        data.arduino_connected ? 'Connected' : 'Disconnected';
    document.getElementById('arduinoStatus').className = 
        `font-mono ${data.arduino_connected ? 'text-green-600' : 'text-red-600'}`;
    
    // Update WebSocket status
    document.getElementById('wsStatus').textContent = 'Connected';
    document.getElementById('wsStatus').className = 'font-mono text-green-600';
    
    // Update charts
    timestamps.shift();
    cpuData.shift();
    memoryData.shift();
    
    timestamps.push(Date.now());
    cpuData.push(data.cpu);
    memoryData.push(data.memory.percent);
    
    cpuChart.setData([timestamps, cpuData]);
    memoryChart.setData([timestamps, memoryData]);
}

// Power control functions
const Dashboard = {
    async rebootSystem() {
        if (!confirm('Are you sure you want to reboot the system?')) return;
        
        try {
            const response = await fetch('/power/reboot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) throw new Error('Failed to reboot system');
            
            alert('System is rebooting...');
        } catch (error) {
            console.error('Reboot error:', error);
            alert('Failed to reboot system: ' + error.message);
        }
    },

    async poweroffSystem() {
        if (!confirm('Are you sure you want to power off the system?')) return;
        
        try {
            const response = await fetch('/power/poweroff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) throw new Error('Failed to power off system');
            
            alert('System is powering off...');
        } catch (error) {
            console.error('Power off error:', error);
            alert('Failed to power off system: ' + error.message);
        }
    }
};

// Handle WebSocket connection
document.addEventListener('DOMContentLoaded', () => {
    // Get IP address
    fetch('/setup/network')
        .then(response => response.json())
        .then(data => {
            document.getElementById('ipAddress').textContent = data.ip_address || 'Unknown';
        })
        .catch(console.error);
    
    // Connect WebSocket
    window.wsConnection.connect();
    window.wsConnection.addListener('dashboard', updateStats);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    window.wsConnection.removeListener('dashboard');
});