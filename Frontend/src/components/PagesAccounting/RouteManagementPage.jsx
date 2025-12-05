import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { getAllRoutes, getContractsByRoute, updateRouteOrder } from '../Services/apiAccountingStaff';
import { GripVertical, Loader2, Save, MapPin, RefreshCw } from 'lucide-react';
import Pagination from '../common/Pagination';

// --- 1. IMPORT CÁC THÀNH PHẦN MỚI ---
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Nhớ dòng này để hiện style
import ConfirmModal from '../common/ConfirmModal'; // Component Modal bạn vừa tạo ở Bước 2

// --- COMPONENT CON: Item Hợp đồng ---
function SortableContractCard({ item, index }) {
    const {
        attributes, listeners, setNodeRef, transform, transition, isDragging
    } = useSortable({ id: item.contractId.toString() });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 'auto',
        opacity: isDragging ? 0.9 : 1,
        position: 'relative',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} className={`p-3 mb-2 rounded border bg-white shadow-sm flex items-center ${isDragging ? 'ring-2 ring-blue-500' : ''}`}>
            <div className="mr-3 font-bold text-gray-400 w-8 text-center bg-gray-50 rounded py-1">{index + 1}</div>
            
            <button {...listeners} className="p-2 cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded touch-none">
                <GripVertical size={20} className="text-gray-400" />
            </button>
            
            <div className="flex-1 ml-3 overflow-hidden">
                <p className="text-sm font-bold text-gray-800 truncate">
                    {item.customerName}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                    <span className="flex items-center">
                        <span className="font-semibold mr-1">Mã ĐH:</span> 
                        <span className="font-mono text-gray-700 bg-gray-100 px-1 rounded">{item.meterCode}</span>
                    </span>
                    <span className="truncate max-w-full" title={item.customerAddress}>
                        {item.customerAddress}
                    </span>
                </div>
            </div>
        </div>
    );
}

// --- COMPONENT CHÍNH ---
function RouteManagementPage() {
    const [routes, setRoutes] = useState([]);
    const [selectedRouteId, setSelectedRouteId] = useState('');
    const [assignedList, setAssignedList] = useState([]);

    const [loadingRoutes, setLoadingRoutes] = useState(true);
    const [loadingContracts, setLoadingContracts] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // --- 2. THÊM STATE CHO MODAL ---
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    const navigate = useNavigate();

    const [pagination, setPagination] = useState({
        page: 0,
        size: 50,
        totalElements: 0,
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        setLoadingRoutes(true);
        getAllRoutes()
            .then(res => {
                let data = res.data;
                let routesArray = [];
                if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) { data = []; } }

                if (data && Array.isArray(data.content)) routesArray = data.content;
                else if (Array.isArray(data)) routesArray = data;
                
                setRoutes(routesArray);
            })
            .catch(err => {
                toast.error("Lỗi tải danh sách Tuyến đọc."); // Thay setError bằng toast
                console.error("Lỗi tải Tuyến:", err);
            })
            .finally(() => setLoadingRoutes(false));
    }, []);

    const fetchContracts = (params = {}) => {
        const routeId = params.routeId !== undefined ? params.routeId : selectedRouteId;
        if (!routeId) {
            setAssignedList([]);
            return;
        }

        setLoadingContracts(true);
        
        const currentPage = params.page !== undefined ? params.page : pagination.page;
        const currentSize = params.size || pagination.size;

        getContractsByRoute(routeId, { page: currentPage, size: currentSize })
            .then(res => {
                const data = res.data;
                
                let contractsArray = [];
                let totalItems = 0;
                let pageNum = 0;
                let pageSizeRaw = currentSize;

                if (Array.isArray(data)) {
                    contractsArray = data;
                    totalItems = data.length;
                    pageSizeRaw = data.length > 0 ? data.length : currentSize;
                } else if (data && data.content) {
                    contractsArray = data.content;
                    const pageInfo = data.page || data;
                    totalItems = pageInfo.totalElements || 0;
                    pageNum = pageInfo.number || 0;
                    pageSizeRaw = pageInfo.size || currentSize;
                }

                setAssignedList(contractsArray);
                setPagination({
                    page: pageNum,
                    size: pageSizeRaw,
                    totalElements: totalItems,
                });
            })
            .catch(err => {
                toast.error("Lỗi tải HĐ đã gán của Tuyến này."); // Thay setError bằng toast
                console.error("Lỗi tải HĐ:", err);
            })
            .finally(() => setLoadingContracts(false));
    };

    useEffect(() => {
        if (selectedRouteId) {
            fetchContracts({ page: 0 });
        } else {
            setAssignedList([]);
        }
    }, [selectedRouteId]);

    const handlePageChange = (newPage) => {
        fetchContracts({ page: newPage });
    };

    const handleRefresh = () => {
        fetchContracts();
        toast.info("Đã làm mới dữ liệu.", { autoClose: 1000, hideProgressBar: true });
    };

    function handleDragEnd(event) {
        const { active, over } = event;
        if (active.id !== over.id) {
            setAssignedList((items) => {
                const oldIndex = items.findIndex((item) => item.contractId.toString() === active.id);
                const newIndex = items.findIndex((item) => item.contractId.toString() === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }

    // --- 3. HÀM XỬ LÝ MỚI ---
    
    // Hàm 1: Khi bấm nút "Lưu Thay Đổi" -> Mở Modal hỏi
    const handlePreSave = () => {
        if (!selectedRouteId) {
            toast.warn("Vui lòng chọn một Tuyến đọc trước khi lưu.");
            return;
        }
        setShowConfirmModal(true); // Mở Modal Xác nhận
    };

    // Hàm 2: Khi chọn "Có" trong Modal -> Gọi API thật
    const handleConfirmSave = () => {
        setSubmitting(true);
        
        const orderedIds = assignedList.map(item => item.contractId);
        
        updateRouteOrder(selectedRouteId, orderedIds)
            .then(() => {
                // Đóng modal trước
                setShowConfirmModal(false);
                
                // Hiện thông báo đẹp ở giữa trên cùng
                toast.success("Lưu thứ tự tuyến thành công!", {
                    position: "top-center",
                    autoClose: 3000, // 3 giây tự tắt
                });
            })
            .catch(err => {
                setShowConfirmModal(false);
                toast.error(err.response?.data?.message || "Lỗi khi lưu thay đổi.", {
                    position: "top-center"
                });
            })
            .finally(() => setSubmitting(false));
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen pb-32 relative">
                
                {/* --- 4. ĐẶT TOAST CONTAINER VÀO ĐÂY --- */}
                <ToastContainer 
                    position="top-center"
                    autoClose={3000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="colored"
                />

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-1">Sắp xếp Thứ tự Tuyến Đọc</h1>
                        <p className="text-sm text-gray-600">Kéo thả để sắp xếp thứ tự đi thu tiền / ghi chỉ số.</p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
                        disabled={loadingContracts || !selectedRouteId}
                    >
                        <RefreshCw size={16} className={`mr-2 ${loadingContracts ? 'animate-spin' : ''}`} />
                        Tải lại
                    </button>
                </div>
                
                {/* (Đã bỏ các div báo lỗi/thành công cũ) */}

                {/* Body */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200 flex-1">
                    {/* Chọn tuyến */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                         <div className="flex items-center gap-2 w-full sm:w-auto">
                             <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                                 <MapPin size={20} />
                             </div>
                             <label htmlFor="routeSelect" className="text-sm font-bold text-blue-900 whitespace-nowrap">Chọn Tuyến:</label>
                         </div>
                         <select
                            id="routeSelect"
                            value={selectedRouteId}
                            onChange={(e) => setSelectedRouteId(e.target.value)}
                            disabled={loadingRoutes || submitting}
                            className="w-full sm:flex-1 appearance-none border border-blue-300 rounded-md py-2 px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-shadow"
                         >
                            <option value="">{loadingRoutes ? "Đang tải dữ liệu..." : "-- Chọn một tuyến để sắp xếp --"}</option>
                            {routes.map(route => (
                                <option key={route.id} value={route.id}>
                                    {route.routeName} (Mã: {route.routeCode}) - NV: {route.assignedReaderName}
                                </option>
                            ))}
                         </select>
                    </div>
                    
                    {/* Danh sách Sắp xếp */}
                    {selectedRouteId && (
                        <div className="border rounded-lg overflow-hidden bg-gray-50">
                            <div className="bg-white p-3 border-b flex justify-between items-center sticky top-0 z-10">
                                <h3 className="font-semibold text-gray-800 flex items-center">
                                    Danh sách Hợp đồng
                                    <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border">
                                        Trang {pagination.page + 1}
                                    </span>
                                </h3>
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                    Tổng: {pagination.totalElements}
                                </span>
                            </div>

                            <div className="p-4 min-h-[300px]">
                                {loadingContracts ? (
                                    <div className="flex flex-col justify-center items-center h-60 text-gray-400">
                                        <Loader2 size={40} className="animate-spin mb-2" />
                                        <p className="text-sm">Đang tải danh sách...</p>
                                    </div>
                                ) : assignedList.length === 0 ? (
                                    <div className="flex flex-col justify-center items-center h-60 text-gray-400 italic bg-white rounded border border-dashed">
                                        <p>Chưa có hợp đồng nào trong tuyến này.</p>
                                    </div>
                                ) : (
                                    <SortableContext
                                        items={assignedList.map(item => item.contractId.toString())}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="space-y-2">
                                            {assignedList.map((item, index) => (
                                                <SortableContractCard 
                                                    key={item.contractId} 
                                                    item={item} 
                                                    index={(pagination.page * pagination.size) + index} 
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                )}
                            </div>

                            {!loadingContracts && assignedList.length > 0 && (
                                <div className="bg-white p-2 border-t">
                                    <Pagination 
                                        currentPage={pagination.page}
                                        totalElements={pagination.totalElements}
                                        pageSize={pagination.size}
                                        onPageChange={handlePageChange}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Sticky */}
                <div className="sticky bottom-4 md:bottom-6 z-40">
                    <div className="bg-white p-4 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.1)] border border-gray-200 flex justify-end gap-3 items-center">
                        <div className="hidden sm:flex text-xs text-gray-500 items-center mr-auto bg-gray-50 px-3 py-2 rounded-md border border-gray-100">                         
                            <span>Mẹo: Kéo thả các thẻ hợp đồng để thay đổi vị trí, sau đó bấm <strong>Lưu Thay Đổi</strong>.</span>
                        </div>

                        <button
                            onClick={handlePreSave} // <-- GỌI HÀM MỞ MODAL
                            disabled={submitting || loadingContracts || !selectedRouteId}
                            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 bg-green-600 text-white font-medium rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                        >
                            {submitting ? (
                                <Loader2 size={18} className="animate-spin mr-2" />
                            ) : (
                                <Save size={18} className="mr-2" />
                            )}
                            {submitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                        </button>
                    </div>
                </div>

                {/* --- 5. RENDER MODAL XÁC NHẬN --- */}
                <ConfirmModal 
                    isOpen={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)} // Đóng modal khi hủy
                    onConfirm={handleConfirmSave} // Gọi API khi đồng ý
                    title="Xác nhận lưu thay đổi"
                    message="Bạn có chắc chắn muốn lưu lại thứ tự sắp xếp mới cho Tuyến này không?"
                    isLoading={submitting}
                />

            </div>
        </DndContext>
    );
}

export default RouteManagementPage;