// badge colour for each application status (bootstrap colour names)
export const statusColors = {
    APPLIED: 'secondary',
    UNDER_REVIEW: 'info',
    SHORTLISTED: 'warning',
    REJECTED: 'danger',
    HIRED: 'success'
}

// the same colours for the charts
export const statusChartColors = {
    APPLIED: '#6c757d',
    UNDER_REVIEW: '#0dcaf0',
    SHORTLISTED: '#ffc107',
    REJECTED: '#dc3545',
    HIRED: '#198754'
}

export const statusList = ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'REJECTED', 'HIRED']

// UNDER_REVIEW(backend) -> UNDER REVIEW(frontend)
export const statusLabel = (status) => status.replaceAll("_", " ")