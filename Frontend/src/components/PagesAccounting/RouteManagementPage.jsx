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
import { GripVertical, Loader2, Save, MapPin } from 'lucide-react';

// --- COMPONENT CON: Item Hợp đồng (SortableContractCard) ---
// ... (Code của component SortableContractCard giữ nguyên)
function SortableContractCard({ item }) {
    const {
        attributes, listeners, setNodeRef, transform, transition, isDragging
    } = useSortable({ id: item.contractId.toString() }); // Sửa: Dùng toString() cho ID

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 'auto',
        opacity: isDragging ? 0.9 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} className={`p-3 mb-2 rounded border bg-white shadow-sm`}>
            <div className="flex items-center">
                <button {...listeners} className="p-1 cursor-grab active:cursor-grabbing">
                    <GripVertical size={16} className="text-gray-400" />
                </button>
                <div className="flex-1 ml-2">
                    <p className="text-sm font-medium text-gray-800">
                        {item.customerName}
                    </p>
                    <p className="text-xs text-gray-500">Mã ĐH: {item.meterCode}</p>
                    <p className="text-xs text-gray-500 truncate">{item.customerAddress}</p>
                </div>
            </div>
        </div>
    );
}
// ---

// --- COMPONENT CHÍNH: Trang Quản lý Tuyến ---
function RouteManagementPage() {
    const [routes, setRoutes] = useState([]);
    const [selectedRouteId, setSelectedRouteId] = useState('');
    const [assignedList, setAssignedList] = useState([]);

    const [loadingRoutes, setLoadingRoutes] = useState(true);
    const [loadingContracts, setLoadingContracts] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // --- SỬA LỖI 1: useEffect Tải Tuyến (routes) ---
    // ...
    // --- SỬA LỖI 1: useEffect Tải Tuyến (routes) ---
    useEffect(() => {
        setLoadingRoutes(true);
        getAllRoutes()
            .then(res => {
                let data = res.data;
                let routesArray = [];
                
                // Nếu BE trả về JSON string (do Content-Type sai)
                if (typeof data === 'string') {
                    try { data = JSON.parse(data); } catch (e) { data = []; }
                }

                // Kịch bản 1: BE trả về Page (Object)
                if (data && Array.isArray(data.content)) {
                    routesArray = data.content;
                } 
                // Kịch bản 2: BE trả về List (Array)
                else if (Array.isArray(data)) {
                    routesArray = data;
                }
                // Kịch bản 3: Lỗi
                else {
                    console.warn("getAllRoutes API did not return an array or a Page object. Response data:", data);
                }
                
                setRoutes(routesArray); // Luôn set bằng một Array
            })
            .catch(err => {
                setError("Lỗi tải danh sách Tuyến đọc.");
                console.error("Lỗi tải Tuyến:", err);
            })
            .finally(() => setLoadingRoutes(false));
    }, []);

    // --- SỬA LỖI 2: useEffect Tải Hợp đồng (assignedList) ---
    useEffect(() => {
        if (!selectedRouteId) {
            setAssignedList([]);
            return;
        }
        setLoadingContracts(true);
        setError(null);
        setSuccess(null);
        
        getContractsByRoute(selectedRouteId)
            .then(res => {
                let data = res.data;
                let contractsArray = [];
                
                if (typeof data === 'string') {
                    try { data = JSON.parse(data); } catch (e) { data = []; }
                }

                if (data && Array.isArray(data.content)) {
                    contractsArray = data.content;
                } 
                else if (Array.isArray(data)) {
                    contractsArray = data;
                }
                else {
                     console.warn("getContractsByRoute API did not return an array or a Page object. Response data:", data);
                }
                
                setAssignedList(contractsArray); // Luôn set bằng Array
            })
            .catch(err => {
                setError("Lỗi tải HĐ đã gán của Tuyến này.");
                 console.error("Lỗi tải HĐ:", err);
            })
            .finally(() => setLoadingContracts(false));
    }, [selectedRouteId]);
    // --- HẾT SỬA LỖI ---
    
    // ... (code còn lại)

    // --- SỬA LỖI 3: Hàm handleDragEnd (dùng .id thay vì .contractId) ---
    function handleDragEnd(event) {
        const { active, over } = event;

        if (active.id !== over.id) {
            setAssignedList((items) => {
                // Sửa: Dùng .id (từ DndContext)
                const oldIndex = items.findIndex((item) => item.contractId.toString() === active.id);
                const newIndex = items.findIndex((item) => item.contractId.toString() === over.id);
                
                setSuccess("Đã thay đổi thứ tự. Nhấn 'Lưu' để xác nhận.");
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }
    // ---

    // Hàm Lưu (Giữ nguyên)
    const handleSaveChanges = () => {
        if (!selectedRouteId) {
            setError("Vui lòng chọn một Tuyến đọc trước khi lưu.");
            return;
        }
        setSubmitting(true);
        setError(null);
        setSuccess(null);
        
        const orderedIds = assignedList.map(item => item.contractId);
        
        updateRouteOrder(selectedRouteId, orderedIds)
            .then(() => {
                setSuccess("Lưu thứ tự tuyến thành công!");
            })
            .catch(err => setError(err.response?.data?.message || "Lỗi khi lưu thay đổi."))
            .finally(() => setSubmitting(false));
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-1">Sắp xếp Thứ tự Tuyến Đọc</h1>
                        <p className="text-sm text-gray-600">Chọn một Tuyến, sau đó kéo thả Hợp đồng để sắp xếp thứ tự đi thu.</p>
                    </div>
                </div>
                
                {/* Lỗi/Thành công */}
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
                        {success}
                    </div>
                )}

                {/* Body */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                    {/* Dropdown chọn tuyến */}
                    <div className="flex items-center gap-2 mb-4">
                         <MapPin size={16} className="text-gray-600" />
                         <label htmlFor="routeSelect" className="text-sm font-medium text-gray-700">Chọn Tuyến đọc:</label>
                         <select
                            id="routeSelect"
                            value={selectedRouteId}
                            onChange={(e) => setSelectedRouteId(e.target.value)}
                            disabled={loadingRoutes || submitting}
                            className="appearance-none border border-gray-300 rounded-md py-1.5 px-3 text-sm bg-white"
                         >
                            <option value="">{loadingRoutes ? "Đang tải Tuyến..." : "-- Chọn Tuyến --"}</option>
                            {/* Dòng 219 (Gây lỗi) giờ đã an toàn */}
                            {routes.map(route => ( 
                                <option key={route.id} value={route.id}>
                                    {route.routeName} ({route.routeCode})
                                </option>
                            ))}
                         </select>
                    </div>
                    
                    {/* Cột Hợp đồng (Sắp xếp) */}
                    <SortableContext
                        // Cung cấp mảng ID (phải là string)
                        items={assignedList.map(item => item.contractId.toString())}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="p-4 rounded-lg min-h-[400px] bg-gray-100">
                            <h3 className="font-semibold text-gray-700 mb-4">
                                Thứ tự Hợp đồng ({assignedList.length})
                            </h3>
                            {loadingContracts ? (
                                <div className="flex justify-center items-center h-40">
                                    <Loader2 size={24} className="animate-spin text-gray-500" />
                                </div>
                            ) : (
                                assignedList.map((item, index) => ( // <-- Thêm index
                                    // Sửa: Truyền index vào Card
                                    <SortableContractCard 
                                        key={item.contractId} 
                                        item={item} 
                                        index={index} // (Mặc dù Card không dùng, nhưng map có)
                                    />
                                ))
                            )}
                        </div>
                    </SortableContext>
                </div>

                {/* Nút Lưu */}
                <div className="bg-white p-4 rounded-lg shadow-sm mt-6 flex justify-end">
                    <button
                        onClick={handleSaveChanges}
                        disabled={submitting || loadingContracts || !selectedRouteId}
                        className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                        <Save size={18} className="mr-2" />
                        {submitting ? 'Đang lưu...' : 'Lưu Thứ Tự Tuyến Này'}
                    </button>
                </div>
            </div>
        </DndContext>
    );
}

export default RouteManagementPage;