import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

function HorizontalBarChart({ labels, values, colors, label = 'Count' }) {

    const data = {
        labels: labels,
        datasets: [
            {
                label: label,
                data: values,
                backgroundColor: colors,
                borderRadius: 6,
                maxBarThickness: 28,
            },
        ]
    }

    const options = {
        indexAxis: 'y',
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: {
                beginAtZero: true,
                suggestedMax: Math.max(...values, 0) + 1,
                ticks: { precision: 0 }
            },
            y: { grid: { display: false } }
        }
    }

    return (
        <div className="ratio ratio-21x9">
            <div>
                <Bar data={data} options={options} />
            </div>
        </div>
    )
}

export default HorizontalBarChart