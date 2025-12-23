import React, { useEffect, useState, useMemo } from 'react';
import StatisticCard from '../common/StatisticCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Table, Button, Tag, Space } from 'antd'; // Added Space
import Pagination from '../common/Pagination';
import { Download, FileText, User } from 'lucide-react'; // Added icons
import apiClient from '../Services/apiClient';
// --- [MỚI] IMPORT TOAST ---
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A78BFA', '#F87171', '#60A5FA'];

// --- [ĐÃ SỬA] Hàm toCSV nhận thêm tham số 'keys' để map đúng cột ---
function toCSV(data, headerLabels, keys) {
  if (!data || data.length === 0) return '';

  // Nếu không truyền keys, dùng keys của object đầu tiên (Rủi ro lệch cột, chỉ dùng fallback)
  const dataKeys = keys || Object.keys(data[0]);

  const rows = data.map(row => dataKeys.map(k => {
    let v = row[k];
    if (v == null) return '""';
    const s = typeof v === 'string' ? v : String(v);

    // --- [ĐÃ SỬA] Thêm \t nếu chưa có để Excel format đúng dạng text ---
    const finalStr = s.startsWith('\t') ? s : `\t${s}`;

    // Escape dấu ngoặc kép cũ (nếu có)
    const escaped = finalStr.replace(/"/g, '""');

    return `"${escaped}"`;
  }).join(','));

  const headerRow = (Array.isArray(headerLabels) && headerLabels.length === dataKeys.length)
    ? headerLabels.join(',')
    : dataKeys.join(',');

  return headerRow + '\n' + rows.join('\n');
}

function downloadCSV(filename, data, headerLabels, keys) {
  const csv = toCSV(data, headerLabels, keys); // Truyền thêm keys
  // Prepend UTF-8 BOM so Excel (Windows) detects UTF-8 encoding correctly
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Map common response keys to Vietnamese labels (with diacritics)
// ... (Giữ nguyên mapKeyToVnLabel) ...
function mapKeyToVnLabel(key) {
  const m = {
    // users
    customer_id: 'ID khách hàng',
    customer_code: 'Mã khách hàng',
    customer_name: 'Tên khách hàng',
    address: 'Địa chỉ',
    phone: 'Điện thoại',
    email: 'Email',
    created_at: 'Ngày tạo',
    // invoices
    invoice_number: 'Số hóa đơn',
    invoice_date: 'Ngày tạo hóa đơn',
    total_amount: 'Tổng tiền',
    payment_status: 'Trạng thái thanh toán',
    // consumption (aggregated)
    start_reading: 'Chỉ số cũ',
    end_reading: 'Chỉ số hiện tại',
    consumption: 'Tiêu thụ',
    start_reading_date: 'Ngày đọc đầu',
    end_reading_date: 'Ngày đọc cuối',
    reading_date: 'Ngày đọc',
    previous_reading: 'Chỉ số cũ',
    current_reading: 'Chỉ số hiện tại',
    consumption_delta: 'Tiêu thụ',
    // recent
    time: 'Thời gian',
    actor: 'Người thực hiện',
    action: 'Hành động',
    // contract export (new)
    contract_number: 'Số hợp đồng',
    contract_status: 'Trạng thái',

    // Tiền
    contract_value: 'Chi phí lắp đặt',
    estimated_cost: 'Chi phí dự kiến',
    payment_method: 'Hình thức thanh toán',

    // Khách hàng
    customer_code: 'Mã khách hàng',
    customer_name: 'Tên khách hàng',
    contact_phone: 'SĐT liên hệ',
    customer_address: 'Địa chỉ',

    // Nhân viên
    service_staff: 'Nhân viên Dịch vụ',
    technical_staff: 'Nhân viên Kỹ thuật',
    accounting_staff: 'Nhân viên Kế toán',

    // Ngày tháng
    created_at: 'Ngày tạo',
    application_date: 'Ngày làm đơn',
    survey_date: 'Ngày khảo sát',
    installation_date: 'Ngày lắp đặt',
    start_date: 'Ngày bắt đầu',
    end_date: 'Ngày kết thúc',
    signed_date: 'Ngày ký kết',

    // Khác
    notes: 'Ghi chú',
    technical_design: 'Thiết kế kỹ thuật'
  };
  return m[key] || key.replace(/_/g, ' ');
}

// Try to extract a human-readable name from a payload string.
// ... (Giữ nguyên parseNameFromPayload) ...
function parseNameFromPayload(payload) {
  if (!payload) return null;
  try {
    if (typeof payload === 'object') {
      return payload.name || payload.initiatorName || payload.actorName || null;
    }
    const s = String(payload).trim();
    if (s.startsWith('{') && s.endsWith('}')) {
      try {
        const obj = JSON.parse(s);
        return obj.initiatorName || obj.actorName || obj.name || null;
      } catch (e) { }
    }
    const parts = s.split(/[;|&]/);
    const map = {};
    for (const p of parts) {
      const kv = p.split('=');
      if (kv.length >= 2) {
        const k = kv[0].trim();
        const v = kv.slice(1).join('=').trim();
        map[k] = v;
      }
    }
    if (map.initiatorName) return map.initiatorName;
    if (map.actorName) return map.actorName;
    if (map.name) return map.name;
    for (const v of Object.values(map)) {
      if (typeof v === 'string' && /[\p{L}]/u.test(v)) return v;
    }
    return null;
  } catch (e) {
    return null;
  }
}

// --- [ĐÃ SỬA] fetchAndDownloadCsv: Thay alert bằng toast và pass keys ---
async function fetchAndDownloadCsv(type = 'invoices', filename = 'export.csv', from, to) {
  try {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;

    // Map type to likely backend endpoints.
    const endpointMap = {
      users: '/admin/users',
      invoices: '/admin/invoices',
      consumption: '/admin/consumption',
      contracts: '/admin/contracts' // <-- Added new endpoint
    };

    const url = endpointMap[type] || `/admin/${type}`;
    const resp = await apiClient.get(url, { params });
    const data = resp.data;
    if (!Array.isArray(data)) {
      console.error('Unexpected export data format', data);
      toast.error('Dữ liệu xuất trả về không đúng định dạng. Vui lòng kiểm tra backend.');
      return;
    }

    if (data.length === 0) {
      toast.info('Không có dữ liệu để xuất.');
      return;
    }
    const keys = Object.keys(data[0]);
    const headerLabels = keys.map(k => mapKeyToVnLabel(k));

    // Payment status mapping
    const paymentStatusMapVN = {
      PENDING: 'Chưa thanh toán',
      OVERDUE: 'Quá hạn',
      PAID: 'Đã thanh toán',
      CANCELLED: 'Đã hủy',
      PARTIALLY_PAID: 'Thanh toán một phần'
    };

    // Transform data
    const transformed = data.map(row => {
      const obj = {};
      for (const k of keys) {
        let val = row[k];
        if (k === 'payment_status' && val && paymentStatusMapVN[val.toUpperCase()]) {
          val = paymentStatusMapVN[val.toUpperCase()];
        }
        obj[k] = val;
      }
      return obj;
    });

    // Pass keys to ensure order
    downloadCSV(filename, transformed, headerLabels, keys);
    toast.success('Xuất dữ liệu thành công!');

  } catch (err) {
    console.error('CSV export failed', err);
    toast.error('Không thể xuất CSV. Vui lòng thử lại.');
  }
}

const AdminDashboard = () => {
  const todayIso = new Date().toISOString().slice(0, 10);
  const priorIso = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10);
  const [fromDate, setFromDate] = useState(priorIso);
  const [toDate, setToDate] = useState(todayIso);
  const [stats, setStats] = useState({ users: 0, activeContracts: 0, unpaidInvoices: 0, revenueMTD: 0 });
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [recent, setRecent] = useState([]);
  // Activity pagination (client-side)
  const [activityPagination, setActivityPagination] = useState({ page: 0, size: 5, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [exportingConsumption, setExportingConsumption] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const yAxisNiceMax = useMemo(() => {
    if (!Array.isArray(chartData) || chartData.length === 0) return 100000;
    const max = Math.max(...chartData.map(d => Number(d.revenue || 0)));
    if (!isFinite(max) || max <= 0) return 100000;
    const scaled = max * 1.1;
    const magnitude = Math.pow(10, Math.floor(Math.log10(scaled)));
    return Math.ceil(scaled / magnitude) * magnitude;
  }, [chartData]);

  // Compact formatter
  const compactValue = (v) => {
    const n = Number(v || 0);
    if (!isFinite(n)) return String(v);
    if (n >= 1_000_000) return (Math.round((n / 1_000_000) * 10) / 10).toString().replace(/\.0$/, '') + ' tr';
    if (n >= 1_000) return (Math.round((n / 1_000) * 10) / 10).toString().replace(/\.0$/, '') + ' k';
    return new Intl.NumberFormat('vi-VN').format(n);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [overviewRes, chartRes, contractsRes, actRes] = await Promise.all([
          apiClient.get('/admin/overview', { params: { from: fromDate, to: toDate } }),
          apiClient.get('/admin/charts/revenue', { params: { from: fromDate, to: toDate } }),
          apiClient.get('/admin/charts/contracts-by-status', { params: { from: fromDate, to: toDate } }),
          apiClient.get('/admin/activity', { params: { limit: 20 } })
        ]);

        const o = overviewRes.data || {};
        setStats({
          users: o.usersCount || 0,
          activeContracts: o.activeContracts || 0,
          unpaidInvoices: o.unpaidInvoices || 0,
          revenueMTD: o.revenueMTD || 0
        });

        const chartDto = chartRes.data || {};
        const labels = chartDto.labels || [];
        const revenues = chartDto.revenueValues || [];
        const contracts = chartDto.contractsCreated || [];
        const cd = labels.map((lab, i) => ({ name: lab, revenue: Number(revenues[i] || 0), contracts: contracts[i] || 0 }));
        setChartData(cd);

        const pie = (contractsRes.data || []).map(p => ({ name: p.name, value: p.value }));
        setPieData(pie);

        // Process Activity Log
        let activities = Array.isArray(actRes.data) ? actRes.data : [];
        // ... (Filter logic giữ nguyên) ...
        activities = activities.filter(a => {
          try {
            const actionStr = (a.action || '').toString().toUpperCase();
            if (actionStr.startsWith('CONTRACT_') && actionStr.includes('PENDING')) return false;
          } catch (err) { }
          return true;
        });

        // ... (Normalize actor fields giữ nguyên) ...
        activities = activities.map(a => {
          const out = { ...a };
          const pName = parseNameFromPayload(a.payload);
          let actorNorm = out.initiatorName || out.actorName || out.actor || pName || null;
          if (actorNorm && typeof actorNorm === 'string') {
            actorNorm = actorNorm.replace(/\(initiator\)/i, '').trim();
          }
          out.actor = actorNorm || out.actor || null;
          out.actorName = out.actorName || actorNorm || null;
          return out;
        });
        setRecent(activities);
        setActivityPagination(prev => ({ ...prev, totalElements: Array.isArray(activities) ? activities.length : 0 }));

      } catch (err) {
        console.error('Error loading admin dashboard', err);
        setError('Khong the tai du lieu dashboard. Vui long thu lai sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fromDate, toDate]);

  // --- [SỬA LẠI] handleExportConsumption: Định nghĩa cột cứng, map đúng key, dùng toast ---
  const handleExportConsumption = async (from, to) => {
    setExportingConsumption(true);
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;

      const resp = await apiClient.get('/admin/consumption', { params });
      const data = resp.data;
      if (!Array.isArray(data) || data.length === 0) {
        toast.info('Không có dữ liệu tiêu thụ trong khoảng thời gian đã chọn.');
        return;
      }

      // ĐỊNH NGHĨA CỘT CỐ ĐỊNH (Keys khớp với SQL trong Backend mới sửa)
      const columns = [
        { key: 'reading_id', label: 'ID Đọc' },
        { key: 'reading_date', label: 'Ngày Đọc' },
        { key: 'meter_code', label: 'Mã Đồng Hồ' },
        { key: 'meter_serial', label: 'Số Serial' },
        { key: 'customer_code', label: 'Mã Khách Hàng' },
        { key: 'customer_name', label: 'Tên Khách Hàng' },
        { key: 'customer_address', label: 'Địa Chỉ' },
        { key: 'previous_reading', label: 'Chỉ Số Cũ' },
        { key: 'current_reading', label: 'Chỉ Số Mới' },
        { key: 'consumption', label: 'Tiêu Thụ (m3)' },
        { key: 'reader_name', label: 'Người Đọc' },
        { key: 'notes', label: 'Ghi Chú' }
      ];

      // Format lại dữ liệu
      const transformed = data.map(r => {
        const row = {};
        columns.forEach(col => {
          let val = r[col.key];
          // Format ngày tháng cho đẹp nếu cần (Backend trả về ISO string)
          if (col.key === 'reading_date' && val) {
            try { val = new Date(val).toLocaleDateString('vi-VN'); } catch (e) { }
          }
          row[col.key] = val;
        });
        return row;
      });

      downloadCSV(
        `tieu_thu_${from || ''}_${to || ''}.csv`,
        transformed,
        columns.map(c => c.label),
        columns.map(c => c.key)
      );

      toast.success('Xuất dữ liệu tiêu thụ thành công!');

    } catch (err) {
      console.error('Export consumption failed', err);
      toast.error('Lỗi khi xuất dữ liệu tiêu thụ.');
    } finally {
      setExportingConsumption(false);
    }
  };

  const roleLabelMap = {
    SERVICE: 'Dịch vụ',
    TECHNICAL: 'Kỹ thuật',
    CASHIER: 'Thu ngân',
    ACCOUNTING: 'Kế toán'
  };

  // --- MAP TRẠNG THÁI HỢP ĐỒNG SANG TIẾNG VIỆT ---
  const contractStatusMapVN = {
    DRAFT: 'Yêu cầu mới',
    PENDING_CUSTOMER_SIGN: 'Chờ khách ký',
    SIGNED: 'Đã ký',
    ACTIVE: 'Đang hoạt động',
    PENDING: 'Chờ xử lý',
    EXPIRED: 'Hết hạn',
    CANCELLED: 'Đã hủy',
    TERMINATED: 'Đã chấm dứt',
    APPROVED: 'Đã duyệt',
    PENDING_SURVEY_REVIEW: 'Chờ duyệt KS',
    PENDING_SIGN: 'Chờ ký' // Added
  };

  const invoiceStatusMapVN = {
    PENDING: 'Tạo hóa đơn (chưa thu)',
    OVERDUE: 'Hóa đơn quá hạn',
    PAID: 'Đã thu tiền'
  };

  const miscActionMap = {
    DAILY_BILL_GENERATION: 'Sinh hóa đơn hàng ngày'
  };

  // --- [MỚI] MAP HÀNH ĐỘNG SANG TIẾNG VIỆT CHO BẢNG ACTIVITY LOG ---
  const actionMapVN = {
    INSTALLATION_COMPLETED: 'Hoàn thành lắp đặt',
    SENT_TO_INSTALLATION: 'Gửi đến bộ phận lắp đặt',
    CUSTOMER_SIGNED: 'Khách hàng đã ký',
    PAYMENT_RECEIVED: 'Đã nhận thanh toán',
    PAYMENT_RECEIVED_BANK: 'Thanh toán qua ngân hàng',
    INVOICE_CREATED: 'Tạo hóa đơn',
    INVOICE_CANCELLED: 'Hủy hóa đơn',
    INSTALLATION_INVOICE_CREATED: 'Tạo hóa đơn lắp đặt',
    SENT_TO_CUSTOMER_FOR_SIGN: 'Gửi hợp đồng cho khách ký',
    WATER_INVOICE_GENERATED: 'Tạo hóa đơn tiền nước',
    RENEWED: 'Gia hạn hợp đồng',
    CONTRACT_RENEWED: 'Gia hạn hợp đồng',
    SURVEY_REPORT_APPROVED: 'Duyệt khảo sát',
    CONTRACT_APPROVED: 'Duyệt hợp đồng',
    // Thêm các action mới
    STAFF_CREATED: 'Tạo nhân viên',
    ACCOUNT_LOCKED: 'Khóa tài khoản',
    ACCOUNT_ACTIVATED: 'Mở khóa tài khoản',
    PASSWORD_CHANGED: 'Đổi mật khẩu',
    PRICE_UPDATED: 'Cập nhật giá',
    PRICE_CREATED: 'Thêm giá mới',
    PRICE_TYPE_UPDATED: 'Cập nhật loại giá',
    METER_IMPORTED: 'Nhập kho đồng hồ',
    METER_STATUS_CHANGED: 'Đổi trạng thái ĐH',
    METER_REPLACED: 'Thay đồng hồ',
    AUTO_EXPIRED: 'Hết hạn',
    CONTRACT_CANCELLED_PRE_ACTIVE: 'Hủy hồ sơ',
    CUSTOMER_REJECT_SIGN: 'Khách từ chối ký'
  };

  const formatAction = (act) => {
    if (!act) return '-';
    try {
      const raw = String(act).trim(); // Trim first

      // Check exact match in map first
      if (actionMapVN[raw]) return actionMapVN[raw];

      const baseToken = raw.split(' ')[0] || raw;
      const key = baseToken.toString().toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');

      if (actionMapVN[key]) return actionMapVN[key];

      if (key.startsWith('CONTRACT_')) {
        const code = key.replace('CONTRACT_', '');
        const mapped = contractStatusMapVN[code] || code.replace(/_/g, ' ');
        return `${mapped}`;
      }

      if (key.startsWith('INVOICE_')) {
        const code = key.replace('INVOICE_', '');
        const mapped = invoiceStatusMapVN[code] || code.replace(/_/g, ' ');
        return `${mapped}`;
      }

      if (miscActionMap[raw] || miscActionMap[key]) return miscActionMap[raw] || miscActionMap[key];

      return raw.replace(/_/g, ' ').trim();
    } catch (e) {
      return act;
    }
  };

// --- [SỬA] RENDER ACTOR CELL ---
  const renderActorCell = (text, record) => {
    // 1. Nếu là hệ thống (N/A) -> Hiển thị "Hệ thống"
    if (!record.actorId && !record.initiatorId && !record.actorName && !record.initiatorName) {
        return <Tag color="default">Hệ thống</Tag>;
    }

    const actorType = (record.actorType || '').toUpperCase();
    let actorName = record.initiatorName || record.actorName || record.actor || 'N/A';

    let typeLabel = '';
    let color = 'blue';

    if (actorType === 'SYSTEM' || actorName === 'system' || actorName === 'SYSTEM') {
        return <Tag color="default">Hệ thống</Tag>;
    } else if (actorType === 'ADMIN') {
        typeLabel = 'Quản trị viên';
        color = 'red';
    } else if (actorType === 'STAFF') {
        //Nếu action liên quan đến lắp đặt -> Kỹ thuật, Hóa đơn -> Kế toán...
        const action = (record.action || '').toUpperCase();
        if (action.includes('INSTALLATION') || action.includes('METER') || action.includes('SURVEY')) {
             typeLabel = 'Nhân viên Kỹ thuật';
        } else if (action.includes('INVOICE') || action.includes('PAYMENT') || action.includes('BILL')) {
             typeLabel = 'Nhân viên Kế toán';
        } else if (action.includes('CONTRACT') || action.includes('CUSTOMER')) {
             typeLabel = 'Nhân viên Dịch vụ';
        } else {
             typeLabel = 'Nhân viên';
        }
        color = 'green';
    } else if (actorType === 'CUSTOMER') {
        typeLabel = 'Khách hàng';
        color = 'orange';
    }

    return (
        <div className="flex flex-col">
            <span className="font-medium text-gray-800">
                {actorName} <span className="text-gray-500 text-xs">({typeLabel})</span>
            </span>
        </div>
    );
  };

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'time',
      key: 'time',
      width: 160,
      render: (t) => {
        if (!t) return '-';
        try {
          const dt = new Date(t);
          return dt.toLocaleString('vi-VN');
        } catch (e) {
          return String(t);
        }
      }
    },
    { title: 'Người thực hiện', dataIndex: 'actor', key: 'actor', width: 250, render: renderActorCell },
    { title: 'Hành động', dataIndex: 'action', key: 'action', width: 200, render: (act) => <span className="text-gray-700 font-medium">{formatAction(act)}</span> }
  ];
  return (
    <div className="space-y-6 p-4">
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Bảng điều khiển Quản trị viên</h1>
            <p className="text-sm text-gray-600">Tổng quan hệ thống và báo cáo nhanh.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <label className="text-sm text-gray-600 mr-2">Khoảng:</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border rounded p-1" />
          <span className="mx-2">—</span>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border rounded p-1" />

          {/* --- [ĐÃ SỬA] THÊM ICON ĐỒNG NHẤT VÀ SỬA LABEL --- */}
          <Button icon={<Download size={14} />} onClick={() => { downloadCSV(`chart_${fromDate}_${toDate}.csv`, chartData, ['Ngày', 'Doanh thu', 'Số lượng HĐ mới'], ['name', 'revenue', 'contracts']) }} title="Xuất dữ liệu biểu đồ">Xuất Biểu đồ</Button>
          <Button icon={<Download size={14} />} onClick={() => fetchAndDownloadCsv('users', `customers_${fromDate}_${toDate}.csv`, fromDate, toDate)}>Xuất Khách hàng</Button>
          <Button icon={<Download size={14} />} loading={exportingConsumption} onClick={() => handleExportConsumption(fromDate, toDate)}>Xuất Tiêu thụ</Button>
          <Button icon={<Download size={14} />} onClick={() => fetchAndDownloadCsv('invoices', `revenue_${fromDate}_${toDate}.csv`, fromDate, toDate)}>Xuất Doanh thu</Button>
          <Button icon={<Download size={14} />} onClick={() => fetchAndDownloadCsv('contracts', `hop_dong_${fromDate}_${toDate}.csv`, fromDate, toDate)}>Xuất Hợp đồng</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatisticCard title="Người dùng" value={stats.users} color="#2563EB" />
        <StatisticCard title="Hợp đồng đang hoạt động" value={stats.activeContracts} color="#10B981" />
        <StatisticCard title="Hóa đơn chưa thu" value={stats.unpaidInvoices} color="#F59E0B" />
        <StatisticCard title="Doanh thu" value={(stats.revenueMTD || 0).toLocaleString('vi-VN') + ' VNĐ'} color="#EF4444" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-2 bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-3">Doanh thu theo ngày</h3>
          <div style={{ width: '100%', minWidth: 0, minHeight: 300 }}>
            {mounted ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 20, right: 20, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis width={80} tickMargin={8} domain={[0, yAxisNiceMax]} tickFormatter={(v) => compactValue(v)} />
                  <Tooltip formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" name="Doanh thu thực" stroke="#16A34A" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ width: '100%', height: 300 }} />
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-3">Phân loại Hợp đồng</h3>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: '65%', minWidth: 0, minHeight: 300 }}>
              {mounted ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      labelLine={false}
                      label={(props) => {
                        // custom label near the outer edge, inside the slice
                        try {
                          const { cx, cy, midAngle, innerRadius, outerRadius, percent, value } = props;
                          const RADIAN = Math.PI / 180;
                          const radius = outerRadius * 0.75;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          const pct = Math.round(percent * 100);

                          // Ẩn nhãn nếu tỷ lệ quá nhỏ
                          if (pct < 3) return null;

                          return (
                            <g>
                              <text x={x} y={y - 7} fill="#fff" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 10, fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
                                {value} HĐ
                              </text>
                              <text x={x} y={y + 8} fill="#fff" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 13, fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
                                {pct}%
                              </text>
                            </g>
                          );
                        } catch (e) {
                          return null;
                        }
                      }}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const p = payload[0];
                      const rawName = (p.name || '').toString().toUpperCase();
                      // Dịch tên trạng thái
                      const vn = contractStatusMapVN[rawName] || p.name || rawName;
                      const val = p.value || 0;
                      const total = pieData.reduce((s, it) => s + (Number(it.value) || 0), 0);
                      const pct = total ? Math.round((val / total) * 100) : 0;
                      return (
                        <div style={{ background: '#fff', padding: 8, borderRadius: 6, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
                          <div style={{ fontWeight: 700 }}>{vn}</div>
                          <div style={{ fontSize: 12, color: '#444' }}>{val} HĐ • {pct}%</div>
                        </div>
                      );
                    }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ width: '100%', height: 300 }} />
              )}
            </div>

            {/* Custom legend area to the right: shows label, count and percent */}
            <div style={{ width: '35%', padding: 8, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '100%' }}>
                {(() => {
                  const total = pieData.reduce((s, it) => s + (Number(it.value) || 0), 0);
                  return pieData.map((p, i) => {
                    const rawKey = (p.name || '').toString().toUpperCase();
                    const label = contractStatusMapVN[rawKey] || rawKey || p.name || 'HĐ';
                    const val = Number(p.value) || 0;
                    const pct = total ? Math.round((val / total) * 100) : 0;
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: COLORS[i % COLORS.length], marginRight: 10 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
                          <div style={{ fontSize: 12, color: '#666' }}>{val} HĐ • {pct}%</div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Hoạt động gần đây</h3>
          {/* Added Export Button for Activity Log */}
          <Button
            icon={<Download size={14} />}
            onClick={async () => {
              try {
                const actRes = await apiClient.get('/admin/activity', { params: { limit: 1000, from: fromDate, to: toDate } });
                let activities = Array.isArray(actRes.data) ? actRes.data : [];

                const subjectTypeMapVN = {
                  CONTRACT: 'Hợp đồng',
                  CONTRACT_INSTALLATION: 'Lắp đặt',
                  INVOICE: 'Hóa đơn',
                  PAYMENT: 'Thanh toán',
                  CUSTOMER: 'Khách hàng',
                  METER: 'Đồng hồ',
                  READING: 'Đọc số'
                };

                const exportData = activities.map(r => {
                  const timeStr = r.time ? new Date(r.time).toLocaleString('vi-VN') : (r.created_at ? new Date(r.created_at).toLocaleString('vi-VN') : '');
                  const actorName = r.initiator_name || r.initiatorName || r.actor_name || r.actorName || r.actor || '-';
                  const actorType = r.initiator_type || r.initiatorType || r.actor_type || r.actorType || '';
                  let actorTypeVN = actorType;
                  if (actorType === 'CUSTOMER') actorTypeVN = 'Khách hàng';
                  else if (actorType === 'STAFF' || actorType === 'SERVICE') actorTypeVN = 'Nhân viên';
                  else if (actorType === 'SYSTEM') actorTypeVN = 'Hệ thống';

                  const subjectType = r.subject_type || r.subjectType || '';
                  const subjectTypeVN = subjectTypeMapVN[subjectType] || subjectType;

                  return {
                    'Thời gian': timeStr,
                    'Người thực hiện': actorName,
                    'Vai trò': actorTypeVN,
                    'Hành động': formatAction(r.action),
                    'Loại tương tác': subjectTypeVN,
                    'Mã tham chiếu': r.subject_id || r.subjectId || ''
                  };
                });
                downloadCSV(`hoat_dong_${fromDate}_${toDate}.csv`, exportData,
                  ['Thời gian', 'Người thực hiện', 'Vai trò', 'Hành động', 'Loại tương tác', 'Mã tham chiếu']);
              } catch (err) {
                console.error('Export activity failed', err);
                toast.error('Không thể xuất hoạt động. Vui lòng thử lại.');
              }
            }}
            size="small"
          >
            Xuất (CSV)
          </Button>
        </div>
        {/* Use client-side pagination with shared Pagination component */}
        <Table dataSource={(recent || []).slice(activityPagination.page * activityPagination.size, (activityPagination.page + 1) * activityPagination.size).map(r => ({ ...r, key: r.id }))} columns={columns} pagination={false} />

        {!loading && activityPagination.totalElements > 0 && (
          <div className="py-2">
            <Pagination
              currentPage={activityPagination.page}
              totalElements={activityPagination.totalElements}
              pageSize={activityPagination.size}
              onPageChange={(newPage) => {
                setActivityPagination(prev => ({ ...prev, page: newPage }));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;