import React, { useEffect, useState } from 'react';
import StatisticCard from '../common/StatisticCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Table, Button } from 'antd';
import { Download } from 'lucide-react';
import apiClient from '../Services/apiClient';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A78BFA'];

function toCSV(data, headerLabels) {
  if (!data || data.length === 0) return '';
  const removeDiacritics = (s) => {
    if (typeof s !== 'string') return s;
    return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, '');
  };

  const keys = Object.keys(data[0]);
  const rows = data.map(row => keys.map(k => {
    let v = row[k];
    if (v == null) return '';
    if (typeof v === 'string') v = removeDiacritics(v);
    const s = typeof v === 'string' ? v : String(v);
    return (s.includes(',') || s.includes('\n')) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(','));
  const headerRow = (Array.isArray(headerLabels) && headerLabels.length === keys.length) ? headerLabels.map(h => removeDiacritics(h)).join(',') : keys.map(k => removeDiacritics(k)).join(',');
  return headerRow + '\n' + rows.join('\n');
}

function downloadCSV(filename, data, headerLabels) {
  const csv = toCSV(data, headerLabels);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Map common response keys to Vietnamese ASCII labels (no diacritics)
function mapKeyToVnLabel(key) {
  const m = {
    // users
    customer_id: 'ma khach hang',
    customer_name: 'ten khach hang',
    address: 'dia chi',
    phone: 'dien thoai',
    meter_id: 'ma dong ho',
    meter_serial: 'so dong ho',
    created_at: 'ngay tao',
    last_reading_date: 'ngay doc cuoi',
    // invoices
    invoice_number: 'so hoa don',
    invoice_date: 'ngay hoa don',
    total_amount: 'tong tien',
    payment_status: 'trang thai thanh toan',
    // consumption (aggregated)
    start_reading: 'chi so cu',
    end_reading: 'chi so hien tai',
    consumption: 'tieu thu',
    start_reading_date: 'ngay doc dau',
    end_reading_date: 'ngay doc cuoi',
    // recent
    time: 'thoi gian',
    actor: 'nguoi thuc hien',
    action: 'hanh dong'
  };
  return m[key] || key.replace(/_/g, ' ');
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

    // Use object keys as column headers by default, but map to Vietnamese ASCII labels
    if (data.length === 0) {
      downloadCSV(filename, data, []);
      return;
    }
    const keys = Object.keys(data[0]);
    const headerLabels = keys.map(k => mapKeyToVnLabel(k));
    // Ensure values order matches keys order; downloadCSV will use headerLabels
    const transformed = data.map(row => {
      const obj = {};
      for (const k of keys) obj[k] = row[k];
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
  const [stats, setStats] = useState({ users: 0, activeContracts: 0, pendingContracts: 0, revenueMTD: 0 });
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [overviewRes, chartRes, contractsRes] = await Promise.all([
          apiClient.get('/admin/overview'),
          apiClient.get('/admin/charts/revenue'),
          apiClient.get('/admin/charts/contracts-by-status')
        ]);

        const o = overviewRes.data || {};
        setStats({
          users: o.usersCount || 0,
          activeContracts: o.activeContracts || 0,
          pendingContracts: o.pendingContracts || 0,
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

        // recent activity: backend endpoint not implemented in current API spec — keep empty or request when available
        setRecent([]);
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
      // We export columns in the requested order and labels: ma dong ho, so dong ho, ma khach hang, ten khach hang, ngay doc, chi so cu, chi so hien tai, tieu thu
      const headerAscii = ['ma dong ho','so dong ho','ma khach hang','ten khach hang','ngay doc','chi so cu','chi so hien tai','tieu thu'];

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

      // downloadCSV will use headerAscii as column headers in the same order
      downloadCSV(`consumption_${from || ''}_${to || ''}.csv`, transformed, headerAscii);
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

  const columns = [
    { title: 'Thoi gian', dataIndex: 'time', key: 'time' },
    { title: 'Nguoi thuc hien', dataIndex: 'actor', key: 'actor' },
    { title: 'Hanh dong', dataIndex: 'action', key: 'action' }
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
          <Button icon={<Download />} onClick={() => { downloadCSV(`chart_${fromDate}_${toDate}.csv`, chartData, ['ngay','doanh thu','hop dong']) }} title="Xuất dữ liệu biểu đồ (cột: ngay, doanh thu, hop dong)">Xuất Dữ liệu Biểu đồ (CSV)</Button>
          <Button onClick={() => fetchAndDownloadCsv('users', `customers_${fromDate}_${toDate}.csv`, fromDate, toDate)}>Xuất Khách hàng (CSV)</Button>
          <Button loading={exportingConsumption} onClick={() => handleExportConsumption(fromDate, toDate)} title="Xuất dữ liệu tiêu thụ (CSV)">Xuất Tiêu thụ (CSV)</Button>
          <Button onClick={() => fetchAndDownloadCsv('invoices', `revenue_${fromDate}_${toDate}.csv`, fromDate, toDate)}>Xuất Doanh thu (CSV)</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatisticCard title="Người dùng" value={stats.users} color="#2563EB" />
        <StatisticCard title="Hợp đồng đang hoạt động" value={stats.activeContracts} color="#10B981" />
        <StatisticCard title="Hợp đồng chờ" value={stats.pendingContracts} color="#F59E0B" />
        <StatisticCard title="Doanh thu (MTD)" value={(stats.revenueMTD || 0).toLocaleString('vi-VN') + ' VNĐ'} color="#EF4444" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-2 bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-3">Doanh thu theo ngày</h3>
          <div style={{ width: '100%', minWidth: 0, minHeight: 300 }}>
            {mounted ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => new Intl.NumberFormat('vi-VN').format(v)} />
                <Tooltip formatter={(value) => new Intl.NumberFormat('vi-VN').format(value) + ' VNĐ'} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#16A34A" strokeWidth={2} />
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
            <div style={{ width: '60%', minWidth: 0, minHeight: 300 }}>
              {mounted ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ width: '100%', height: 300 }} />
              )}
            </div>
            <div style={{ width: '40%', padding: 8 }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {pieData.map((p, i) => {
                  const key = (p.name || '').toString();
                  const statusMap = {
                    DRAFT: 'Yêu cầu tạo HĐ',
                    PENDING_CUSTOMER_SIGN: 'HĐ chờ khách ký',
                    SIGNED: 'HĐ đã ký',
                    TERMINATED: 'HĐ đã chấm dứt',
                    ACTIVE: 'Đang hoạt động',
                    PENDING: 'Chờ xử lý',
                    EXPIRED: 'Hết hạn',
                    CANCELLED: 'Đã hủy'
                  };
                  const rawKey = key.toUpperCase();
                  const label = statusMap[rawKey] || (rawKey.length > 18 ? 'HĐ' : key);
                  return (
                    <li key={`legend-${i}`} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ width: 12, height: 12, borderRadius: 3, background: COLORS[i % COLORS.length], display: 'inline-block', marginRight: 8 }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>{p.value} HĐ</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Hoạt động gần đây</h3>
          <div className="flex gap-2">
            <Button onClick={() => {
              if (!Array.isArray(recent) || recent.length === 0) {
                downloadCSV(`recent_${fromDate}_${toDate}.csv`, recent, []);
                return;
              }
              const keys = Object.keys(recent[0]);
              const headerLabels = keys.map(k => mapKeyToVnLabel(k));
              const transformed = recent.map(r => {
                const obj = {};
                for (const k of keys) obj[k] = r[k];
                return obj;
              });
              downloadCSV(`recent_${fromDate}_${toDate}.csv`, transformed, headerLabels);
            }}>Export CSV</Button>
          </div>
        </div>
        <Table dataSource={recent.map(r => ({ ...r, key: r.id }))} columns={columns} pagination={{ pageSize: 5 }} />
      </div>
    </div>
  );
};

export default AdminDashboard;
