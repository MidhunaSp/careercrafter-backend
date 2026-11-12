// paginationInfo : { totalPages, totalRecords, numRecordsInPage }
function Pagination({ page, setPage, paginationInfo }) {

    const { totalPages = 0, totalRecords = 0, numRecordsInPage = 0 } = paginationInfo || {}

    return (
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3">
            <small className="text-muted">
                {totalRecords > 0 &&
                    `Page ${page + 1} of ${totalPages} | Showing ${numRecordsInPage} of ${totalRecords} records`}
            </small>
            <div className="btn-group btn-group-sm">
                <button className="btn btn-outline-primary" disabled={page === 0}
                    onClick={() => setPage(page - 1)}>
                    <i className="bi bi-chevron-left"></i> Previous
                </button>
                <button className="btn btn-outline-primary" disabled={page >= totalPages - 1}
                    onClick={() => setPage(page + 1)}>
                    Next <i className="bi bi-chevron-right"></i>
                </button>
            </div>
        </div>
    )
}

export default Pagination