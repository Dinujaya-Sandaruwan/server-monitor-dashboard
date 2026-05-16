// Configuration
const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
const MAX_CHART_POINTS = 30;

// Chart Instances
let cpuChart, ramChart;

// Data History
let cpuHistory = [];
let ramHistory = [];
let labels = [];

function initCharts() {
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#9ca3af' }
            },
            x: {
                display: false,
                grid: { display: false }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: { enabled: true }
        },
        elements: {
            line: { tension: 0.4 },
            point: { radius: 0 }
        }
    };

    cpuChart = new Chart(document.getElementById('cpuChart'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'CPU %',
                data: cpuHistory,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true
            }]
        },
        options: commonOptions
    });

    ramChart = new Chart(document.getElementById('ramChart'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'RAM %',
                data: ramHistory,
                borderColor: '#a855f7',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                fill: true
            }]
        },
        options: commonOptions
    });
}

function updateUI(data) {
    // Update Cards
    document.getElementById('cpu-percent').innerText = `${data.cpu.percent.toFixed(1)}%`;
    document.getElementById('cpu-count').innerText = `${data.cpu.count} Cores`;
    document.getElementById('cpu-freq').innerText = `${data.cpu.freq.toFixed(0)} MHz`;
    document.getElementById('cpu-bar').style.width = `${data.cpu.percent}%`;

    document.getElementById('ram-percent').innerText = `${data.memory.percent.toFixed(1)}%`;
    document.getElementById('ram-total').innerText = `${(data.memory.total / 1e9).toFixed(1)} GB`;
    document.getElementById('ram-used').innerText = `${(data.memory.used / 1e9).toFixed(1)} GB used`;
    document.getElementById('ram-bar').style.width = `${data.memory.percent}%`;

    document.getElementById('disk-percent').innerText = `${data.disk.percent.toFixed(1)}%`;
    document.getElementById('disk-total').innerText = `${(data.disk.total / 1e9).toFixed(1)} GB`;
    document.getElementById('disk-used').innerText = `${(data.disk.used / 1e9).toFixed(1)} GB used`;
    document.getElementById('disk-bar').style.width = `${data.disk.percent}%`;

    document.getElementById('swap-percent').innerText = `${data.swap.percent.toFixed(1)}%`;
    document.getElementById('swap-total').innerText = `${(data.swap.total / 1e9).toFixed(1)} GB`;
    document.getElementById('swap-used').innerText = `${(data.swap.used / 1e9).toFixed(1)} GB used`;
    document.getElementById('swap-bar').style.width = `${data.swap.percent}%`;

    // Update Charts
    const now = new Date().toLocaleTimeString();
    labels.push(now);
    cpuHistory.push(data.cpu.percent);
    ramHistory.push(data.memory.percent);

    if (labels.length > MAX_CHART_POINTS) {
        labels.shift();
        cpuHistory.shift();
        ramHistory.shift();
    }

    cpuChart.update('none');
    ramChart.update('none');

    // Update Processes Table
    const tableBody = document.getElementById('process-table-body');
    tableBody.innerHTML = '';
    data.processes.forEach(proc => {
        const row = `
            <tr class="hover:bg-gray-700/50 transition-colors">
                <td class="px-6 py-4 font-mono text-xs text-gray-400">${proc.pid}</td>
                <td class="px-6 py-4 font-medium">${proc.name}</td>
                <td class="px-6 py-4 text-gray-400">${proc.username}</td>
                <td class="px-6 py-4 text-right">
                    <span class="px-2 py-1 rounded ${proc.cpu_percent > 50 ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'} font-mono">
                        ${proc.cpu_percent.toFixed(1)}%
                    </span>
                </td>
                <td class="px-6 py-4 text-right text-gray-400 font-mono">${proc.memory_percent.toFixed(1)}%</td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', row);
    });
}

function connectWebSocket() {
    const ws = new WebSocket(WS_URL);
    const statusIndicator = document.getElementById('status-indicator');

    ws.onopen = () => {
        console.log('Connected to WebSocket');
        statusIndicator.classList.remove('bg-red-500');
        statusIndicator.classList.add('bg-green-500');
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        updateUI(data);
    };

    ws.onclose = () => {
        console.log('WebSocket connection closed. Retrying...');
        statusIndicator.classList.remove('bg-green-500');
        statusIndicator.classList.add('bg-red-500');
        setTimeout(connectWebSocket, 5000);
    };

    ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        ws.close();
    };
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    connectWebSocket();
});
