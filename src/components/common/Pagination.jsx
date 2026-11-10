// paginationInfo : { totalPages, totalRecords, numRecordsInPage }
function Pagination({ page, setPage, paginationInfo }) {

    const totalPages = paginationInfo ? paginationInfo.totalPages : 0
    const totalRecords = paginationInfo ? paginationInfo.totalRecords : 0
    const numRecordsInPage = paginationInfo ? paginationInfo.numRecordsInPage : 0

    // show at most 5 page numbers around the current page
    const first = Math.max(0, Math.min(page - 2, totalPages - 5))
    const last = Math.min(totalPages - 1, first + 4)
    const pageNumbers = []
    for (let i = first; i <= last; i++) {
        pageNumbers.push(i)
    }

    return (
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3">
            <small className="text-muted">
                {totalRecords === 0
                    ? ""
                    : `Page ${page + 1} of ${totalPages} | Showing ${numRecordsInPage} records from total ${totalRecords} records`}
            </small>
            <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPage(page - 1)} disabled={page === 0}>
                        <i className="bi bi-chevron-left"></i> Previous
                    </button>
                </li>
                {
                    pageNumbers.map(number => (
                        <li key={number} className={`page-item ${number === page ? 'active' : ''}`}>
                            <button className="page-link" onClick={() => setPage(number)}>{number + 1}</button>
                        </li>
                    ))
                }
                <li className={`page-item ${page >= totalPages - 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPage(page + 1)} disabled={page >= totalPages - 1}>
                        Next <i className="bi bi-chevron-right"></i>
                    </button>
                </li>
            </ul>
        </div>
    )
}

export default Pagination
