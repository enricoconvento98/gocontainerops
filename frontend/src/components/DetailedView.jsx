import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import './DetailedView.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const MAX_HISTORY = 60; // 60 * 2s = 120s history

function DetailedView({ container, onClose, history }) {
    const [cpuHistory, setCpuHistory] = useState([]);
    const [memHistory, setMemHistory] = useState(history || []);
    const [netInHistory, setNetInHistory] = useState([]);
    const [netOutHistory, setNetOutHistory] = useState([]);

    useEffect(() => {
        setCpuHistory((prev) => {
            const newHistory = [...prev, container.cpu_percent];
            if (newHistory.length > MAX_HISTORY) newHistory.shift();
            return newHistory;
        });

        setMemHistory((prev) => {
            const newHistory = [...prev, container.mem_usage];
            if (newHistory.length > MAX_HISTORY) newHistory.shift();
            return newHistory;
        });

        setNetInHistory((prev) => {
            const newHistory = [...prev, container.net_input];
            if (newHistory.length > MAX_HISTORY) newHistory.shift();
            return newHistory;
        });

        setNetOutHistory((prev) => {
            const newHistory = [...prev, container.net_output];
            if (newHistory.length > MAX_HISTORY) newHistory.shift();
            return newHistory;
        });
    }, [container]);

    const createChartData = (data, label, color) => ({
        labels: Array(data.length).fill(''),
        datasets: [
            {
                label,
                data,
                borderColor: color,
                backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.1)'),
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 0,
            },
        ],
    });

    const chartOptions = (yAxisLabel) => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'top', labels: { color: '#9ca3af' } },
            tooltip: { enabled: true },
        },
        scales: {
            x: { display: false },
            y: {
                display: true,
                grid: { color: '#374151' },
                ticks: { color: '#9ca3af', font: { size: 11 } },
                title: {
                    display: true,
                    text: yAxisLabel,
                    color: '#9ca3af',
                },
            },
        },
        animation: false,
    });

    return (
        <div className="detailed-section">
            <div className="detailed-header">
                <div>
                    <h2 className="detailed-title">{container.name}</h2>
                    <p className="detailed-subtitle">
                        {container.id} • {container.image}
                    </p>
                </div>
                <div className="detailed-header-right">
                    <span
                        className={`badge ${container.state === 'running' ? 'badge-running' : 'badge-stopped'
                            }`}
                    >
                        {container.state.toUpperCase()}
                    </span>
                    <button className="close-btn" onClick={onClose} title="Close detailed view">
                        ✕
                    </button>
                </div>
            </div>

            <div className="detailed-body">
                {/* Current Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-label">CPU Usage</div>
                        <div className="stat-value">{container.cpu_percent.toFixed(2)}%</div>
                        <div className="stat-bar">
                            <div
                                className="stat-fill stat-cpu"
                                style={{ width: `${Math.min(container.cpu_percent, 100)}%` }}
                            />
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-label">Memory Usage</div>
                        <div className="stat-value">
                            {container.mem_usage.toFixed(1)} MB
                        </div>
                        <div className="stat-secondary">
                            {container.mem_percent.toFixed(1)}% of {container.mem_limit.toFixed(0)} MB
                        </div>
                        <div className="stat-bar">
                            <div
                                className="stat-fill stat-mem"
                                style={{ width: `${Math.min(container.mem_percent, 100)}%` }}
                            />
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-label">Network I/O</div>
                        <div className="stat-value-small">
                            <span className="stat-io-label">IN:</span> {container.net_input.toFixed(2)} KB
                        </div>
                        <div className="stat-value-small">
                            <span className="stat-io-label">OUT:</span> {container.net_output.toFixed(2)} KB
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-label">Block I/O</div>
                        <div className="stat-value-small">
                            <span className="stat-io-label">READ:</span> {container.block_input.toFixed(2)} KB
                        </div>
                        <div className="stat-value-small">
                            <span className="stat-io-label">WRITE:</span> {container.block_output.toFixed(2)} KB
                        </div>
                    </div>
                </div>

                {/* Charts */}
                <div className="charts-container">
                    <div className="chart-box">
                        <h3 className="chart-title">CPU Usage Over Time</h3>
                        <div className="chart-wrapper">
                            <Line
                                data={createChartData(cpuHistory, 'CPU %', 'rgb(59, 130, 246)')}
                                options={chartOptions('CPU %')}
                            />
                        </div>
                    </div>

                    <div className="chart-box">
                        <h3 className="chart-title">Memory Usage Over Time</h3>
                        <div className="chart-wrapper">
                            <Line
                                data={createChartData(memHistory, 'Memory (MB)', 'rgb(168, 85, 247)')}
                                options={chartOptions('Memory (MB)')}
                            />
                        </div>
                    </div>

                    <div className="chart-box">
                        <h3 className="chart-title">Network I/O Over Time</h3>
                        <div className="chart-wrapper">
                            <Line
                                data={{
                                    labels: Array(netInHistory.length).fill(''),
                                    datasets: [
                                        {
                                            label: 'Network IN (KB)',
                                            data: netInHistory,
                                            borderColor: 'rgb(34, 197, 94)',
                                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                            borderWidth: 2,
                                            tension: 0.4,
                                            fill: true,
                                            pointRadius: 0,
                                        },
                                        {
                                            label: 'Network OUT (KB)',
                                            data: netOutHistory,
                                            borderColor: 'rgb(239, 68, 68)',
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                            borderWidth: 2,
                                            tension: 0.4,
                                            fill: true,
                                            pointRadius: 0,
                                        },
                                    ],
                                }}
                                options={chartOptions('KB')}
                            />
                        </div>
                    </div>
                </div>

                {/* Container Info */}
                <div className="info-section">
                    <h3 className="info-title">Container Information</h3>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-key">Container ID:</span>
                            <span className="info-value">{container.id}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-key">Image:</span>
                            <span className="info-value">{container.image}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-key">Status:</span>
                            <span className="info-value">{container.status}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-key">State:</span>
                            <span className="info-value">{container.state}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DetailedView;
