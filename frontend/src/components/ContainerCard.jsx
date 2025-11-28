import { useState, useEffect, useRef } from 'react';
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
import './ContainerCard.css';

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

const MAX_HISTORY = 30; // 30 * 2s = 60s history

function ContainerCard({ container, onClick, isSelected, isDetailedViewOpen }) {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        setHistory((prev) => {
            const newHistory = [...prev, container.mem_usage];
            if (newHistory.length > MAX_HISTORY) {
                newHistory.shift();
            }
            return newHistory;
        });
    }, [container.mem_usage]);

    const chartData = {
        labels: Array(history.length).fill(''),
        datasets: [
            {
                label: 'Memory (MB)',
                data: history,
                borderColor: 'rgb(168, 85, 247)',
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 0,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: true },
        },
        scales: {
            x: { display: false },
            y: {
                display: true,
                grid: { color: '#374151' },
                ticks: { color: '#9ca3af', font: { size: 10 } },
            },
        },
        animation: false,
    };

    return (
        <div className={`card ${isSelected ? 'card-selected' : ''} ${isDetailedViewOpen ? 'card-small' : ''}`} onClick={onClick}>
            <div className="card-header">
                <div>
                    <h3 className="card-title" title={container.name}>
                        {container.name}
                    </h3>
                    {!isDetailedViewOpen && (
                        <p className="card-subtitle">
                            {container.id} • {container.image}
                        </p>
                    )}
                </div>
                <span
                    className={`badge ${container.state === 'running' ? 'badge-running' : 'badge-stopped'
                        }`}
                >
                    {container.state.toUpperCase()}
                </span>
            </div>

            {!isDetailedViewOpen && (
                <div className="card-body">
                    {/* CPU */}
                    <div className="metric">
                        <div className="metric-header">
                            <span className="metric-label">CPU Usage</span>
                            <span className="metric-value">
                                {container.cpu_percent.toFixed(2)}%
                            </span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill progress-cpu"
                                style={{ width: `${Math.min(container.cpu_percent, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Memory */}
                    <div className="metric">
                        <div className="metric-header">
                            <span className="metric-label">Memory</span>
                            <span className="metric-value">
                                {container.mem_usage.toFixed(1)} / {container.mem_limit.toFixed(0)} MB
                            </span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill progress-mem"
                                style={{ width: `${Math.min(container.mem_percent, 100)}%` }}
                            />
                        </div>
                        <div className="chart-container">
                            <Line data={chartData} options={chartOptions} />
                        </div>
                    </div>

                    {/* IO Stats */}
                    <div className="io-stats">
                        <div className="io-stat">
                            <p className="io-label">Network (I/O)</p>
                            <p className="io-value">
                                {container.net_input.toFixed(1)} / {container.net_output.toFixed(1)} KB
                            </p>
                        </div>
                        <div className="io-stat">
                            <p className="io-label">Block (I/O)</p>
                            <p className="io-value">
                                {container.block_input.toFixed(1)} / {container.block_output.toFixed(1)} KB
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ContainerCard;
