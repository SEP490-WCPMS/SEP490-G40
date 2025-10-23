import React from 'react';
import { useNavigate } from 'react-router-dom';

function TechnicalDashboard() {
    const navigate = useNavigate();

    return (
        <div className="dashboard-container">
            <h1>Technical Dashboard</h1>
            <div className="dashboard-actions">
                <button 
                    className="action-card" 
                    onClick={() => navigate('/technical/survey')}
                >
                    <h2>Survey & Design</h2>
                    <p>Xem danh sách yêu cầu khảo sát và nộp báo giá.</p>
                </button>
                <button 
                    className="action-card" 
                    onClick={() => navigate('/technical/install')}
                >
                    <h2>Installation</h2>
                    <p>Xem danh sách hợp đồng chờ lắp đặt và báo cáo hoàn thành.</p>
                </button>
            </div>
        </div>
    );
}

export default TechnicalDashboard;