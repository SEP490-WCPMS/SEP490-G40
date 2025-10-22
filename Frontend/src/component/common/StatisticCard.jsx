import React from 'react';
import { Card, Statistic, Typography } from 'antd';
import './StatisticCard.css'; //import CSS

const { Text } = Typography;


const StatisticCard = ({ title, value, icon, color, suffix = "" }) => {
    return (
        <Card className="statistic-card" bordered={false}> {/* Giữ className cũ cũng được */}
            <Statistic
                title={<Text style={{ fontSize: '14px', color: '#8c8c8c' }}>{title}</Text>}
                value={value}
                precision={0}
                valueStyle={{ color: color || '#1890ff', fontWeight: 600, fontSize: '24px' }}
                prefix={icon ? React.cloneElement(icon, { style: { marginRight: '8px', color: color || '#1890ff' } }) : null}
                suffix={suffix}
            />
        </Card>
    );
};

export default StatisticCard; 