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
        <div className={`list-item ${isSelected ? 'list-item-selected' : ''} ${isDetailedViewOpen ? 'list-item-small' : ''}`} onClick={onClick}>
            <div className="list-item-header">
                <h3 className="list-item-title" title={container.name}>
                    {container.name}
                </h3>
                {!isDetailedViewOpen && (
                    <p className="list-item-subtitle">
                        {container.id} • {container.image}
                    </p>
                )}
            </div>
            <div className="list-item-metrics">
                {!isDetailedViewOpen && (
                    <>
                        <div className="metric">
                            <span className="metric-label">CPU:</span>
                            <span className="metric-value">{container.cpu_percent.toFixed(2)}%</span>
                        </div>
                        <div className="metric">
                            <span className="metric-label">Mem:</span>
                            <span className="metric-value">{container.mem_usage.toFixed(1)}MB</span>
                        </div>
                    </>
                )}
                <span
                    className={`badge ${container.state === 'running' ? 'badge-running' : 'badge-stopped'
                        }`}
                >
                    {container.state.toUpperCase()}
                </span>
            </div>
        </div>
    );
}

export default ContainerCard;
