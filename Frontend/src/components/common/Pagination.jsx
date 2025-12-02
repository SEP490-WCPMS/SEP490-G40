import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Component Phân trang an toàn (đã fix lỗi NaN)
 */
const Pagination = ({ 
    currentPage = 0,      // Giá trị mặc định là 0
    totalElements = 0,    // Giá trị mặc định là 0
    pageSize = 10,        // Giá trị mặc định là 10
    onPageChange 
}) => {
    // 1. Tính toán an toàn
    const safeCurrentPage = Number(currentPage) || 0;
    const safeTotalElements = Number(totalElements) || 0;
    const safePageSize = Number(pageSize) || 10;

    const totalPages = Math.ceil(safeTotalElements / safePageSize);

    // Nếu không có dữ liệu hoặc chỉ có 1 trang, ẩn phân trang
    //if (totalPages <= 1 || safeTotalElements === 0) return null;
    // Chỉ ẩn khi không có dữ liệu thật sự
    if (safeTotalElements === 0) return null;

    // 2. Tính số thứ tự hiển thị (Start - End)
    const startRow = (safeCurrentPage * safePageSize) + 1;
    const endRow = Math.min((safeCurrentPage + 1) * safePageSize, safeTotalElements);

    // Logic tạo nút số trang (giữ nguyên logic cũ nhưng dùng biến an toàn)
    const getPageNumbers = () => {
        const pages = [];
        const maxButtons = 5;
        let startPage = Math.max(0, safeCurrentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages - 1, startPage + maxButtons - 1);

        if (endPage - startPage + 1 < maxButtons) {
            startPage = Math.max(0, endPage - maxButtons + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    };

    const pages = getPageNumbers();

    return (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-b-lg">
            {/* Mobile View */}
            <div className="flex flex-1 justify-between sm:hidden">
                <button
                    onClick={() => onPageChange(safeCurrentPage - 1)}
                    disabled={safeCurrentPage === 0}
                    className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${safeCurrentPage === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    Trước
                </button>
                <button
                    onClick={() => onPageChange(safeCurrentPage + 1)}
                    disabled={safeCurrentPage >= totalPages - 1}
                    className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${safeCurrentPage >= totalPages - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    Sau
                </button>
            </div>

            {/* Desktop View */}
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    {/* Dòng này là nguyên nhân gây lỗi NaN trước đó */}
                    <p className="text-sm text-gray-700">
                        Hiển thị <span className="font-medium">{startRow}</span> đến <span className="font-medium">{endRow}</span> trong tổng số <span className="font-medium">{safeTotalElements}</span> kết quả
                    </p>
                </div>
                <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                            onClick={() => onPageChange(safeCurrentPage - 1)}
                            disabled={safeCurrentPage === 0}
                            className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${safeCurrentPage === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span className="sr-only">Previous</span>
                            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </button>

                        {pages.map((page) => (
                            <button
                                key={page}
                                onClick={() => onPageChange(page)}
                                aria-current={safeCurrentPage === page ? 'page' : undefined}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 
                                    ${safeCurrentPage === page 
                                        ? 'z-10 bg-indigo-600 text-white focus-visible:outline-indigo-600' 
                                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'}`}
                            >
                                {page + 1}
                            </button>
                        ))}

                        <button
                            onClick={() => onPageChange(safeCurrentPage + 1)}
                            disabled={safeCurrentPage >= totalPages - 1}
                            className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${safeCurrentPage >= totalPages - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span className="sr-only">Next</span>
                            <ChevronRight className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    );
};

export default Pagination;