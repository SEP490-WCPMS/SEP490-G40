import React, { useEffect, useState, useMemo } from 'react';
import StatisticCard from '../common/StatisticCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Table, Button, Tag } from 'antd';
import { Download } from 'lucide-react';
import apiClient from '../Services/apiClient';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A78BFA'];

function toCSV(data, headerLabels) {
  if (!data || data.length === 0) return '';
  
  const keys = Object.keys(data[0]);
  const rows = data.map(row => keys.map(k => {
    let v = row[k];
    if (v == null) return '';
    const s = typeof v === 'string' ? v : String(v);
    // Escape quotes and wrap in quotes if contains comma, newline, or quote
    return (s.includes(',') || s.includes('\n') || s.includes('"')) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(','));
  const headerRow = (Array.isArray(headerLabels) && headerLabels.length === keys.length) ? headerLabels.join(',') : keys.join(',');
  return headerRow + '\n' + rows.join('\n');
}

function downloadCSV(filename, data, headerLabels) {
  const csv = toCSV(data, headerLabels);
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
function mapKeyToVnLabel(key) {
  const m = {
    // users
    customer_id: 'Mã khách hàng',
    customer_name: 'Tên khách hàng',
    address: 'Địa chỉ',
    phone: 'Điện thoại',
    meter_id: 'Mã đồng hồ',
    meter_serial: 'Số đồng hồ',
    created_at: 'Ngày tạo',
    last_reading_date: 'Ngày đọc cuối',
    // invoices
    invoice_number: 'Số hóa đơn',
    invoice_date: 'Ngày hóa đơn',
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
    action: 'Hành động'
  };
  return m[key] || key.replace(/_/g, ' ');
}

// Try to extract a human-readable name from a payload string.
// Support JSON payload or simple key=value pairs separated by ; or &.
function parseNameFromPayload(payload) {
  if (!payload) return null;
  try {
    if (typeof payload === 'object') {
      // if already parsed
      return payload.name || payload.initiatorName || payload.actorName || null;
    }
    const s = String(payload).trim();
    // try JSON
    if (s.startsWith('{') && s.endsWith('}')) {
      try {
        const obj = JSON.parse(s);
        return obj.initiatorName || obj.actorName || obj.name || null;
      } catch (e) {
        // fallthrough
      }
    }
    // key=value;key2=value2 or key=value&key2=value2
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
    // heuristics: look for a token that looks like a person name (has letters and spaces)
    for (const v of Object.values(map)) {
      if (typeof v === 'string' && /[\p{L}]/u.test(v)) return v;
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function fetchAndDownloadCsv(type = 'invoices', filename = 'export.csv', from, to) {
  try {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;

    // Map type to likely backend endpoints. Backend may change these; if endpoint missing, show friendly message.
    const endpointMap = {
      users: '/admin/users',
      invoices: '/admin/invoices',
      consumption: '/admin/consumption'
    };

    const url = endpointMap[type] || `/admin/${type}`;
    const resp = await apiClient.get(url, { params });
    const data = resp.data;
    if (!Array.isArray(data)) {
      console.error('Unexpected export data format', data);
      alert('Du lieu xuat tra ve khong dung dinh dang. Vui long kiem tra backend.');
      return;
    }

    // Use object keys as column headers by default, but map to Vietnamese labels
    if (data.length === 0) {
      downloadCSV(filename, data, []);
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
    
    // Transform data: ensure values order matches keys order and localize payment_status
    const transformed = data.map(row => {
      const obj = {};
      for (const k of keys) {
        let val = row[k];
        // Localize payment_status values
        if (k === 'payment_status' && val && paymentStatusMapVN[val.toUpperCase()]) {
          val = paymentStatusMapVN[val.toUpperCase()];
        }
        obj[k] = val;
      }
      return obj;
    });
    downloadCSV(filename, transformed, headerLabels);
  } catch (err) {
    console.error('CSV export failed', err);
    alert('Khong the xuat CSV. Vui long thu lai hoac lien he backend de kich hoat endpoint export.');
  }
}

const AdminDashboard = () => {
  const todayIso = new Date().toISOString().slice(0,10);
  const priorIso = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString().slice(0,10);
  const [fromDate, setFromDate] = useState(priorIso);
  const [toDate, setToDate] = useState(todayIso);
  const [stats, setStats] = useState({ users: 0, activeContracts: 0, unpaidInvoices: 0, revenueMTD: 0 });
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [recent, setRecent] = useState([]); // optional: backend activity endpoint not implemented yet
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [exportingConsumption, setExportingConsumption] = useState(false);

  useEffect(() => {
    // ensure charts render after mount/layout to avoid Recharts width/height warnings
    setMounted(true);
  }, []);

  // Compute a "nice" Y-axis max based on chart data so axis scales adapt to data range
  // Add ~10% headroom to keep the top point from touching the chart top
  const yAxisNiceMax = useMemo(() => {
    if (!Array.isArray(chartData) || chartData.length === 0) return 100000; // default when no data
    const max = Math.max(...chartData.map(d => Number(d.revenue || 0)));
    if (!isFinite(max) || max <= 0) return 100000;
    const scaled = max * 1.1; // 10% headroom
    // Determine magnitude (power of 10) and round up to a nice step
    const magnitude = Math.pow(10, Math.floor(Math.log10(scaled)));
    const nice = Math.ceil(scaled / magnitude) * magnitude;
    return nice;
  }, [chartData]);

  // Compact formatter: 1.5 triệu / 500 nghìn / or full VNĐ for small values
  const compactValue = (v) => {
    const n = Number(v || 0);
    if (!isFinite(n)) return String(v);
    if (n >= 1_000_000) return (Math.round((n / 1_000_000) * 10) / 10).toString().replace(/\.0$/, '') + ' triệu';
    if (n >= 1_000) return (Math.round((n / 1_000) * 10) / 10).toString().replace(/\.0$/, '') + ' nghìn';
    return new Intl.NumberFormat('vi-VN').format(n) + ' VNĐ';
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [overviewRes, chartRes, contractsRes] = await Promise.all([
          apiClient.get('/admin/overview', { params: { from: fromDate, to: toDate } }),
          apiClient.get('/admin/charts/revenue', { params: { from: fromDate, to: toDate } }),
          apiClient.get('/admin/charts/contracts-by-status', { params: { from: fromDate, to: toDate } })
        ]);

        const o = overviewRes.data || {};
        setStats({
          users: o.usersCount || 0,
          activeContracts: o.activeContracts || 0,
          unpaidInvoices: o.unpaidInvoices || 0,
          revenueMTD: o.revenueMTD || 0
        });

        // map chart data: labels[], revenueValues[], contractsCreated[] -> [{ name, revenue, contracts }]
        const chartDto = chartRes.data || {};
        const labels = chartDto.labels || [];
        const revenues = chartDto.revenueValues || [];
        const contracts = chartDto.contractsCreated || [];
        const cd = labels.map((lab, i) => ({ name: lab, revenue: Number(revenues[i] || 0), contracts: contracts[i] || 0 }));
        setChartData(cd);

        const pie = (contractsRes.data || []).map(p => ({ name: p.name, value: p.value }));
        setPieData(pie);
        // recent activity: request from backend
          try {
          const actRes = await apiClient.get('/admin/activity', { params: { limit: 20 } });
          let activities = Array.isArray(actRes.data) ? actRes.data : [];
          // Filter out contract-related activities that are in any kind of PENDING state
          // (backend may return actions like "CONTRACT_PENDING", "CONTRACT_PENDING_CUSTOMER_SIGN", etc.)
          activities = activities.filter(a => {
            try {
              const actionStr = (a.action || '').toString().toUpperCase();
              if (actionStr.startsWith('CONTRACT_') && actionStr.includes('PENDING')) return false;
            } catch (err) {
              // if anything unexpected, keep the record
            }
            return true;
          });
          // Normalize actor/initiator fields for rendering: prefer initiatorName -> actorName -> actor -> parse from payload
          activities = activities.map(a => {
            const out = { ...a };
            const pName = parseNameFromPayload(a.payload);
            let actorNorm = out.initiatorName || out.actorName || out.actor || pName || null;
            if (actorNorm && typeof actorNorm === 'string') {
              actorNorm = actorNorm.replace(/\(initiator\)/i, '').trim();
            }
            out.actor = actorNorm || out.actor || null; // keep 'actor' used by table
            out.actorName = out.actorName || actorNorm || null;
            return out;
          });
          // Debug: log a sample of recent activity so we can inspect payload shape
          if (activities.length > 0) console.debug('Admin activity sample:', activities.slice(0, 5));
          setRecent(activities);
        } catch (e) {
          console.warn('Could not load recent activity', e);
          setRecent([]);
        }
      } catch (err) {
        console.error('Error loading admin dashboard', err);
        setError('Khong the tai du lieu dashboard. Vui long thu lai sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Export consumption with nicer headers and feedback
  const handleExportConsumption = async (from, to) => {
    setExportingConsumption(true);
    try {
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;

      const resp = await apiClient.get('/admin/consumption', { params });
      const data = resp.data;
      if (!Array.isArray(data) || data.length === 0) {
        alert('Khong co du lieu tieu thu trong khoang thoi gian da chon.');
        return;
      }

      // Backend returns aggregated per-meter rows with these fields:
      // meter_id, meter_serial, customer_id, customer_name, start_reading, end_reading, consumption, start_reading_date, end_reading_date
      // We export columns in the requested order with Vietnamese labels (with diacritics)
      const headerVN = ['Mã đồng hồ','Số đồng hồ','Mã khách hàng','Tên khách hàng','Ngày đọc','Chỉ số cũ','Chỉ số hiện tại','Tiêu thụ'];

      const transformed = data.map(r => ({
        meter_id: r['meter_id'],
        meter_serial: r['meter_serial'],
        customer_id: r['customer_id'],
        customer_name: r['customer_name'],
        // choose end_reading_date as the representative 'ngay doc' for the exported row
        reading_date: r['end_reading_date'] || r['start_reading_date'] || null,
        // backend fields
        previous_reading: r['start_reading'],
        current_reading: r['end_reading'],
        consumption_delta: r['consumption']
      }));

      // downloadCSV will use headerVN as column headers in the same order
      downloadCSV(`consumption_${from || ''}_${to || ''}.csv`, transformed, headerVN);
    } catch (err) {
      console.error('Export consumption failed', err);
      const serverMsg = err.response?.data?.message || err.response?.data || null;
      if (serverMsg) {
        alert(`Khong the xuat tieu thu: ${JSON.stringify(serverMsg)}`);
      } else {
        alert('Khong the xuat tieu thu. Vui long thu lai hoac lien he backend de kich hoat endpoint export.');
      }
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

  const contractStatusMapVN = {
    DRAFT: 'Yêu cầu tạo hợp đồng',
    REQUEST_CREATE: 'Yêu cầu tạo hợp đồng',
    CREATED: 'Yêu cầu tạo hợp đồng',
    CREATED_BY_CUSTOMER: 'Yêu cầu tạo hợp đồng',
    PENDING_CUSTOMER_SIGN: 'Chờ khách ký',
    SIGNED: 'Khách ký hợp đồng',
    ACTIVE: 'Kích hoạt hợp đồng',
    PENDING: 'Chờ xử lý',
    EXPIRED: 'Hợp đồng hết hạn',
    CANCELLED: 'Hủy hợp đồng',
    TERMINATED: 'HĐ đã chấm dứt'
  };

  const invoiceStatusMapVN = {
    PENDING: 'Tạo hóa đơn (chưa thu)',
    OVERDUE: 'Hóa đơn quá hạn',
    PAID: 'Đã thu tiền'
  };

  const miscActionMap = {
    DAILY_BILL_GENERATION: 'Sinh hóa đơn hàng ngày'
  };
  const actionMapVN = {
    // general business actions
    INSTALLATION_COMPLETED: 'Hoàn thành lắp đặt',
    SENT_TO_INSTALLATION: 'Gửi đến bộ phận lắp đặt',
    CUSTOMER_SIGNED: 'Khách hàng đã ký',
    PAYMENT_RECEIVED: 'Đã nhận thanh toán',
    PAYMENT_RECEIVED_BANK: 'Thanh toán qua ngân hàng',
    INVOICE_CREATED: 'Tạo hóa đơn',
    INVOICE_CANCELLED: 'Hủy hóa đơn',
    INSTALLATION_INVOICE_CREATED: 'Tạo hóa đơn lắp đặt',
    SENT_TO_CUSTOMER_FOR_SIGN: 'Gửi hợp đồng cho khách ký'
    // add more mappings as needed
  };

  const formatAction = (act) => {
    if (!act) return '-';
    try {
      const raw = String(act);
      // Extract the leading token (before any space) as the canonical code
      const baseToken = raw.split(' ')[0] || raw;
      // Normalize: uppercase, spaces -> underscores, remove stray chars
      const key = baseToken.toString().toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');

      // Direct mapping first (explicit VN translations)
      if (actionMapVN[key]) {
        // If original string contains a reference like "#123" or extra text, append it in parentheses
        const refMatch = raw.match(/#(\S+)/);
        const ref = refMatch ? refMatch[0] : '';
        return actionMapVN[key] + (ref ? ` (${ref})` : '');
      }

      // Then handle CONTRACT_ and INVOICE_ patterns using existing maps
      if (key.startsWith('CONTRACT_')) {
        const code = key.replace('CONTRACT_', '');
        const arg = raw.split(' ').slice(1).join(' ');
        const mapped = contractStatusMapVN[code] || code.replace(/_/g, ' ');
        return `${mapped}${arg ? ' (' + arg + ')' : ''}`;
      }

      if (key.startsWith('INVOICE_')) {
        const code = key.replace('INVOICE_', '');
        const arg = raw.split(' ').slice(1).join(' ');
        const mapped = invoiceStatusMapVN[code] || code.replace(/_/g, ' ');
        return `${mapped}${arg ? ' (' + arg + ')' : ''}`;
      }

      // misc mapped actions
      if (miscActionMap[raw] || miscActionMap[key]) return miscActionMap[raw] || miscActionMap[key];

      // fall back: make it more readable by replacing underscores and trimming
      return raw.replace(/_/g, ' ').trim();
    } catch (e) {
      return act;
    }
  };

  const renderActorCell = (text, record) => {
    const name = record.actor || text || null;
    const rawType = (record.actorType || '').toString();
    let type = rawType.toUpperCase();
    let id = record.actorId;
    const rawRole = (record.actorRole || '').toString();
    const role = rawRole.toUpperCase();

    // Prefer initiator when backend persisted it (initiator fields come from activity_log)
    const initiatorName = record.initiatorName || null;
    const initiatorTypeRaw = (record.initiatorType || '').toString();
    const initiatorType = initiatorTypeRaw.toUpperCase();
    const initiatorId = record.initiatorId;
    let isInitiator = false;
    let displayName = null;
    if (initiatorName || initiatorTypeRaw) {
      // use initiator info as primary display when present
      displayName = initiatorName || null;
      if (initiatorType) type = initiatorType;
      if (initiatorId) id = initiatorId;
      isInitiator = true;
    }

    // If actorType is missing, try to infer from the action (common when backend returns minimal actor info)
    const actionHint = (record.action || '').toString().toUpperCase();
    if (!rawType) {
      const lowerActor = (record.actor || '').toString().toLowerCase();
      const lowerAction = (record.action || '').toString().toLowerCase();
      // Heuristics: detect customer, service, technical, system from actor string or action
      if (lowerActor.includes('khach') || lowerAction.includes('khach') || lowerAction.includes('customer') || lowerAction.includes('pending_customer_sign') || /contract.*sign/i.test(record.action || '')) {
        type = 'CUSTOMER';
      } else if (lowerActor.includes('dịch') || lowerActor.includes('dich vu') || lowerActor.includes('dich vụ') || lowerActor.includes('service') || lowerAction.includes('service')) {
        type = 'SERVICE';
      } else if (lowerActor.includes('kỹ thuật') || lowerActor.includes('ky thuat') || lowerActor.includes('lắp đặt') || lowerActor.includes('lap dat') || lowerAction.includes('install') || lowerAction.includes('technical')) {
        type = 'TECHNICAL';
      } else if (lowerActor.includes('hệ thống') || lowerActor.includes('he thong') || lowerAction.includes('system')) {
        type = 'SYSTEM';
      }
      // Log inferred type for debugging
      if (!rawType) console.debug(`Inferred actorType for record id=${record.id}:`, type);
    }

    // Determine display name fallback (if initiator not present)
    if (!displayName) displayName = name;
    // strip any leftover suffix like '(initiator)'
    if (displayName && typeof displayName === 'string') {
      displayName = displayName.replace(/\(initiator\)/i, '').trim();
    }
    if (!displayName) {
      if (type === 'SYSTEM') displayName = 'Hệ thống';
      else if (type === 'CUSTOMER') displayName = 'Khách hàng';
      else if (role && roleLabelMap[role]) displayName = roleLabelMap[role];
      else displayName = '-';
    }

    // Determine badge: prefer explicit actorType CUSTOMER/SYSTEM, then role-based labels
    // If the actor is rendered as a clickable profile link (blue), hide the gray tag to avoid duplication.
    let badge = null;
    if (type === 'SYSTEM') badge = <Tag>Hệ thống</Tag>;
    else if (type === 'CUSTOMER') badge = <Tag>Khách hàng</Tag>;
    else if (type === 'SERVICE' || role === 'SERVICE') badge = <Tag>Dịch vụ</Tag>;
    else if (type === 'TECHNICAL' || role === 'TECHNICAL') badge = <Tag>Kỹ thuật</Tag>;
    else if (type === 'CASHIER' || role === 'CASHIER') badge = <Tag>Thu ngân</Tag>;
    else if (type === 'ACCOUNTING' || role === 'ACCOUNTING') badge = <Tag>Kế toán</Tag>;
    else if (type === 'STAFF') {
      // If staff with explicit role, show role badge; otherwise generic 'Nhân viên'
      const mapped = role ? (roleLabelMap[role] || role) : 'Nhân viên';
      badge = <Tag>{mapped}</Tag>;
    }

    // Determine profile link: customers -> /customers/:id, staff -> /staff/:id; others usually no link
    const link = (id && (type === 'STAFF' || type === 'CASHIER' || type === 'ACCOUNTING' || type === 'SERVICE' || type === 'TECHNICAL'))
      ? `/staff/${id}`
      : (id && type === 'CUSTOMER' ? `/customers/${id}` : null);

    return (
      <div>
        {link ? <a href={link}>{displayName}</a> : <span>{displayName}</span>}
        {/* show badge only when there is no profile link to avoid duplicate visual labels */}
        {!link && badge ? <span style={{ marginLeft: 8 }}>{badge}</span> : null}
      </div>
    );
  };

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'time',
      key: 'time',
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
    { title: 'Người thực hiện', dataIndex: 'actor', key: 'actor', render: renderActorCell },
    { title: 'Hành động', dataIndex: 'action', key: 'action', render: (act) => formatAction(act) }
  ];

  return (
    <div className="space-y-6">
      {loading && (
        <div className="p-4 bg-white rounded shadow text-gray-600">Đang tải dữ liệu...</div>
      )}
      {error && (
        <div className="p-4 bg-red-50 rounded shadow text-red-700">{error}</div>
      )}
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
          <Button icon={<Download />} onClick={() => { downloadCSV(`chart_${fromDate}_${toDate}.csv`, chartData, ['Ngày','Doanh thu','Hợp đồng']) }} title="Xuất dữ liệu biểu đồ">Xuất Dữ liệu Biểu đồ (CSV)</Button>
          <Button onClick={() => fetchAndDownloadCsv('users', `customers_${fromDate}_${toDate}.csv`, fromDate, toDate)}>Xuất Khách hàng (CSV)</Button>
          <Button loading={exportingConsumption} onClick={() => handleExportConsumption(fromDate, toDate)} title="Xuất dữ liệu tiêu thụ (CSV)">Xuất Tiêu thụ (CSV)</Button>
          <Button onClick={() => fetchAndDownloadCsv('invoices', `revenue_${fromDate}_${toDate}.csv`, fromDate, toDate)}>Xuất Doanh thu (CSV)</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatisticCard title="Người dùng" value={stats.users} color="#2563EB" />
        <StatisticCard title="Hợp đồng đang hoạt động" value={stats.activeContracts} color="#10B981" />
        <StatisticCard title="Hóa đơn chưa thu" value={stats.unpaidInvoices} color="#F59E0B" />
        <StatisticCard title="Doanh thu (Tháng)" value={(stats.revenueMTD || 0).toLocaleString('vi-VN') + ' VNĐ'} color="#EF4444" />
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
                <Tooltip formatter={(value) => compactValue(value)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#16A34A" strokeWidth={2} />
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
                            // Position label at 75% radius (near outer edge but still inside)
                            const radius = outerRadius * 0.75;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            const pct = Math.round(percent * 100);
                            
                            // Only show label if slice is big enough (>3%)
                            if (pct < 3) return null;
                            
                            return (
                              <g>
                                <text 
                                  x={x} 
                                  y={y - 7} 
                                  fill="#fff" 
                                  textAnchor="middle" 
                                  dominantBaseline="central" 
                                  style={{ fontSize: 10, fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
                                >
                                  {value} HĐ
                                </text>
                                <text 
                                  x={x} 
                                  y={y + 8} 
                                  fill="#fff" 
                                  textAnchor="middle" 
                                  dominantBaseline="central" 
                                  style={{ fontSize: 13, fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
                                >
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
            <Button 
              icon={<Download />} 
              onClick={async () => {
                try {
                  // Fetch full activity data from backend with all fields for export
                  const actRes = await apiClient.get('/admin/activity', { params: { limit: 1000, from: fromDate, to: toDate } });
                  let activities = Array.isArray(actRes.data) ? actRes.data : [];
                  
                  // Map subject_type to Vietnamese
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
                  alert('Không thể xuất hoạt động. Vui lòng thử lại.');
                }
              }}
              size="small"
            >
              Xuất (CSV)
            </Button>
          </div>
        <Table dataSource={recent.map(r => ({ ...r, key: r.id }))} columns={columns} pagination={{ pageSize: 5 }} />
      </div>
    </div>
  );
};

export default AdminDashboard;
