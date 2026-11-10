import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

const defaultColors = [
    '#0d6efd', '#ffc107', '#20c997', '#dc3545', '#6f42c1', '#fd7e14', '#0dcaf0', '#6c757d'
]

function DoughnutChart({ labels, values, label = 'Count', colors }) {

    const data = {
        labels: labels,
        datasets: [
            {
                label: label,
                data: values,
                backgroundColor: colors ? colors : defaultColors,
                borderWidth: 1,
            },
        ]
    }

    const options = {
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } }
    }

    return (
        <div className="ratio ratio-4x3">
            <div>
                <Doughnut data={data} options={options} />
            </div>
        </div>
    )
}

export default DoughnutChart