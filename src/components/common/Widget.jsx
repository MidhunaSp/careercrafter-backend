function Widget({ title, value, icon, color }) {
    return (
        <div className={`card border-0 border-start border-4 border-${color} shadow-sm h-100`}>
            <div className="card-body d-flex justify-content-between align-items-center">
                <div>
                    <p className="text-muted small text-uppercase mb-1">{title}</p>
                    <h3 className="fw-bold mb-0">{value}</h3>
                </div>
                <i className={`bi ${icon} fs-1 text-${color} opacity-75`}></i>
            </div>
        </div>
    )
}

export default Widget