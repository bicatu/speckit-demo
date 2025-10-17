

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

/**
 * Pagination component with prev/next and page numbers
 */
export function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) {
    return null; // Don't show pagination if there's only one page
  }

  const pages: number[] = [];
  const maxVisiblePages = 7;

  if (totalPages <= maxVisiblePages) {
    // Show all pages if total is small
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Show first, last, and pages around current
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, -1, totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, -1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages);
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          padding: '8px 16px',
          borderRadius: '4px',
          border: '1px solid #ddd',
          backgroundColor: currentPage === 1 ? '#f5f5f5' : '#fff',
          color: currentPage === 1 ? '#999' : '#333',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
          fontSize: '14px',
        }}
      >
        Previous
      </button>

      {/* Page Numbers */}
      {pages.map((page, index) => {
        if (page === -1) {
          return (
            <span key={`ellipsis-${index}`} style={{ padding: '8px 4px', color: '#999' }}>
              ...
            </span>
          );
        }

        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: currentPage === page ? '2px solid #1976d2' : '1px solid #ddd',
              backgroundColor: currentPage === page ? '#e3f2fd' : '#fff',
              color: currentPage === page ? '#1976d2' : '#333',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: currentPage === page ? '600' : 'normal',
              minWidth: '40px',
            }}
          >
            {page}
          </button>
        );
      })}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          padding: '8px 16px',
          borderRadius: '4px',
          border: '1px solid #ddd',
          backgroundColor: currentPage === totalPages ? '#f5f5f5' : '#fff',
          color: currentPage === totalPages ? '#999' : '#333',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
          fontSize: '14px',
        }}
      >
        Next
      </button>

      {/* Page Info */}
      <span style={{ marginLeft: '16px', fontSize: '14px', color: '#666' }}>
        Page {currentPage} of {totalPages} ({totalItems} total)
      </span>
    </div>
  );
}
