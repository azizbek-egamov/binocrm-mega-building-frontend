import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/analytics';
import { AmBarChart, AmAreaChart, AmPieChart, NoData } from '../components/AmCharts';
import FunnelChart from '../components/FunnelChart';
import './Dashboard.css';



const Dashboard = () => {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchSummary = async () => {
        try {
            const res = await analyticsService.getSummary();
            setSummary(res.data);
        } catch (error) {
            console.error("Dashboard stats error:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('uz-UZ').format(val) + " so'm";
    };

    const canViewIncomes = user?.is_superuser || user?.permissions?.can_view_incomes;
    const canViewExpenses = user?.is_superuser || user?.permissions?.can_view_expenses;

    const stats = [
        { label: 'Binolar', value: summary?.buildings_count || '0', color: 'primary', icon: 'building' },
        { label: 'Uylar', value: summary?.homes_count || '0', color: 'success', icon: 'home' },
        { label: 'Mijozlar', value: summary?.clients_count || '0', color: 'warning', icon: 'users' },
        { label: 'Shartnomalar', value: summary?.contracts_count || '0', color: 'cyan', icon: 'contract' },
    ];

    const revenueStats = [
        { label: 'Bugungi tushum', value: summary?.revenue?.daily || 0, color: 'success' },
        { label: 'Haftalik tushum', value: summary?.revenue?.weekly || 0, color: 'primary' },
        { label: 'Oylik tushum', value: summary?.revenue?.monthly || 0, color: 'info' },
        { label: 'Umumiy qarzlar', value: summary?.revenue?.total_debt || 0, color: 'warning' },
    ];

    const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

    const getDateInfo = () => {
        const date = new Date();
        const weekdays = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
        const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
        return {
            weekday: weekdays[date.getDay()],
            formatted: `${date.getDate()}-${months[date.getMonth()]} ${date.getFullYear()}`
        };
    };

    const dateInfo = getDateInfo();

    if (loading && !summary) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Ma'lumotlar yuklanmoqda...</p>
            </div>
        );
    }

    const formatNumber = (num) => {
        if (!num) return "0";
        if (num >= 1e9) return (num / 1e9).toFixed(1) + " mlrd";
        if (num >= 1e6) return (num / 1e6).toFixed(1) + " mln";
        if (num >= 1e3) return (num / 1e3).toFixed(1) + " ming";
        return num.toLocaleString();
    };

    const debtors = summary?.debtors || [];

    return (
        <div className="dashboard-content">
            <header className="dashboard-header">
                <div className="header-info">
                    <p className="greeting">Xush kelibsiz,</p>
                    <h1 className="title">
                        {user?.first_name || user?.username || 'Admin'} <span>👋</span>
                    </h1>
                </div>
                <div className="date-box">
                    <CalendarIcon />
                    <div>
                        <span className="date-label">{dateInfo.weekday}</span>
                        <span className="date-value">{dateInfo.formatted}</span>
                    </div>
                </div>
            </header>

            {/* Counts Section */}
            <section className="stats-grid">
                {stats.map((stat) => (
                    <div key={stat.label} className={`stat-card stat-${stat.color}`}>
                        <div className="stat-icon">
                            <StatIcon type={stat.icon} />
                        </div>
                        <div className="stat-info-box">
                            <span className="stat-value">{stat.value}</span>
                            <span className="stat-label">{stat.label}</span>
                        </div>
                    </div>
                ))}
            </section>

            {/* Revenue Overview Section */}
            <div className="section-title">Moliyaviy ko'rsatkichlar</div>
            <section className="revenue-grid">
                {revenueStats.map((item) => {
                    const totalVal = summary?.revenue?.total_sales_value || 1;
                    const realPercentage = (item.value / totalVal) * 100;
                    const displayPercentage = Math.min(100, Math.max(2, realPercentage));
                    const isDebt = item.label === 'Umumiy qarzlar';

                    return (
                        <div key={item.label} className={`revenue-card rev-${item.color}`}>
                            <span className="revenue-label">{item.label}</span>
                            <span className="revenue-value">{formatCurrency(item.value)}</span>
                            <div className="revenue-chart-mini">
                                <div className="mini-bar-container">
                                    <div
                                        className="mini-bar"
                                        style={{ width: `${displayPercentage}%` }}
                                    ></div>
                                </div>
                                <div className="revenue-footer">
                                    <span className="footer-target">
                                        {isDebt
                                            ? `To'langan: ${formatCurrency(totalVal - item.value)}`
                                            : `Jami: ${formatCurrency(totalVal)}`}
                                    </span>
                                    <span className="footer-percent">
                                        {isDebt ? `${realPercentage.toFixed(1)}% to'lanmagan` : `${realPercentage.toFixed(1)}%`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </section>

            {/* Charts Section */}
            <div className="section-title">Asosiy tahlillar</div>
            <section className="charts-grid-layout">
                {/* ═══ Funnel Section ═══ */}
                {summary?.homes_funnel && (
                    <div className="chart-card">
                        <FunnelChart
                            items={summary.homes_funnel}
                            maxWidth={550}
                            title="Xonadonlar holati"
                            unit="ta uy"
                            icon={
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 12l9-9 9 9"></path>
                                    <path d="M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10"></path>
                                </svg>
                            }
                        />
                    </div>
                )}

                {/* Building Occupancy */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Bino bandligi (Sotilgan / Jami)</h3>
                    </div>
                    <div className="chart-container">
                        <AmBarChart
                            data={summary?.building_occupancy || []}
                            xField="name"
                            yField="percentage"
                            height={300}
                            color="#6366f1"
                            unit="%"
                            tooltipFormatter="{categoryX}: {valueY}%"
                        />
                    </div>
                </div>

                {/* Weekly Trend */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Haftalik mijozlar o'sishi</h3>
                    </div>
                    <div className="chart-container">
                        <AmAreaChart
                            data={summary?.weekly_trend || []}
                            xField="date"
                            yField="count"
                            height={300}
                            color="#6366f1"
                            tooltipText="Sana: {categoryX}\nMijozlar: {valueY}"
                        />
                    </div>
                </div>

                {/* Lead Sources */}
                <div className="chart-card">
                    <div className="chart-header">
                        <h3>Mijozlar qayerdan eshitgan</h3>
                    </div>
                    <div className="chart-container pie-chart-container">
                        <AmPieChart
                            data={summary?.lead_sources || []}
                            nameField="heard_source"
                            valueField="count"
                            height={280}
                            innerRadius={55}
                        />
                    </div>
                </div>

                {/* Debtors Table - Full Width */}
                <div className="chart-card full-width-card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div className="chart-header" style={{ padding: '32px 32px 0 32px', marginBottom: '24px' }}>
                        <h3>Eng ko'p qarzdorlar</h3>
                    </div>
                    <div className="analytics-table-wrapper">
                        <table className="analytics-table">
                            <thead>
                                <tr>
                                    <th>Mijoz</th>
                                    <th>To'lov rejasi</th>
                                    <th>Qarz miqdori</th>
                                    <th>To'langan ulush</th>
                                </tr>
                            </thead>
                            <tbody>
                                {debtors.slice(0, 10).map((d, i) => {
                                    const total = d.total_amount || 0;
                                    const paid = d.paid_amount || 0;
                                    const pct = total > 0 ? Math.round((paid / total) * 100) : 0;

                                    return (
                                        <tr key={d.id || i}>
                                            <td className="table-building-name">
                                                <div className="table-cell-detailed">
                                                    <span>
                                                        <UserIcon size={12} style={{ marginRight: 8, color: '#ef4444', display: 'inline' }} />
                                                        {d.client || '—'}
                                                    </span>
                                                    <span className="sub-text">Shartnoma: #{d.contract || '—'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="table-cell-detailed">
                                                    <span>{formatNumber(total)}</span>
                                                    <span className="sub-text">
                                                        To'langan: <span className="paid-amount-text">{formatNumber(paid)}</span>
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="debt-value" style={{ color: '#ef4444' }}>
                                                    {formatNumber(d.amount)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="progress-cell">
                                                    <div className="progress-bar-mini">
                                                        <div
                                                            className="progress-fill"
                                                            style={{
                                                                width: `${pct}%`,
                                                                background: 'linear-gradient(90deg, #10b981, #34d399)'
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span style={{ fontWeight: 600, color: pct === 100 ? '#10b981' : 'inherit' }}>
                                                        {pct}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {debtors.length === 0 && (
                            <NoData height="200px" />
                        )}
                    </div>
                    <div className="table-footer-note">
                        <p><strong>To'langan ulush</strong> — shartnomaning umumiy summasiga nisbatan to'langan qism foizda.</p>
                    </div>
                </div>
            </section>

            {/* Incomes Section */}
            {canViewIncomes && (
                <>
                    <div className="section-title">Kirimlar tahlili</div>
                    <section className="charts-grid-layout charts-three-col" style={{ marginBottom: '40px' }}>
                        {/* Daily Incomes Trend */}
                        <div className="chart-card">
                            <div className="chart-header">
                                <h3>Kunlik tushumlar trendi</h3>
                            </div>
                            <div className="chart-container">
                                <AmAreaChart
                                    data={summary?.incomes?.daily_trend || []}
                                    xField="date"
                                    yField="amount"
                                    height={250}
                                    color="#10b981"
                                    tooltipText="Sana: {categoryX}\nTushum: {valueY}"
                                />
                            </div>
                        </div>

                        {/* Incomes by Category */}
                        <div className="chart-card">
                            <div className="chart-header">
                                <h3>Daromad manbalari</h3>
                            </div>
                            <div className="chart-container pie-chart-container">
                                <AmPieChart
                                    data={summary?.incomes?.by_category || []}
                                    nameField="name"
                                    valueField="value"
                                    height={260}
                                    innerRadius={55}
                                />
                            </div>
                        </div>

                        {/* Incomes by Building */}
                        <div className="chart-card">
                            <div className="chart-header">
                                <h3>Binolar bo'yicha tushumlar</h3>
                            </div>
                            <div className="chart-container">
                                <AmBarChart
                                    data={summary?.incomes?.by_building || []}
                                    xField="name"
                                    yField="value"
                                    height={250}
                                    color="#3b82f6"
                                    tooltipFormatter="{categoryX}: {valueY}"
                                />
                            </div>
                        </div>
                    </section>
                </>
            )}

            {/* Expenses Section */}
            {canViewExpenses && (
                <>
                    <div className="section-title">Chiqimlar tahlili</div>
                    <section className="charts-grid-layout charts-three-col">
                        {/* Daily Expenses Trend */}
                        <div className="chart-card">
                            <div className="chart-header">
                                <h3>Kunlik chiqimlar trendi</h3>
                            </div>
                            <div className="chart-container">
                                <AmAreaChart
                                    data={summary?.expenses?.daily_trend || []}
                                    xField="date"
                                    yField="amount"
                                    height={250}
                                    color="#ef4444"
                                    tooltipText="Sana: {categoryX}\nChiqim: {valueY}"
                                />
                            </div>
                        </div>

                        {/* Expenses by Category */}
                        <div className="chart-card">
                            <div className="chart-header">
                                <h3>Xarajat turlari</h3>
                            </div>
                            <div className="chart-container pie-chart-container">
                                <AmPieChart
                                    data={summary?.expenses?.by_category || []}
                                    nameField="name"
                                    valueField="value"
                                    height={260}
                                    innerRadius={55}
                                />
                            </div>
                        </div>

                        {/* Expenses by Building */}
                        <div className="chart-card">
                            <div className="chart-header">
                                <h3>Binolar bo'yicha chiqimlar</h3>
                            </div>
                            <div className="chart-container">
                                <AmBarChart
                                    data={summary?.expenses?.by_building || []}
                                    xField="name"
                                    yField="value"
                                    height={250}
                                    color="#f59e0b"
                                    tooltipFormatter="{categoryX}: {valueY}"
                                />
                            </div>
                        </div>
                    </section>
                </>
            )}
        </div>
    );
};

// Icons
const CalendarIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;
const CheckIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>;
const UserIcon = ({ size }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
const StatIcon = ({ type }) => {
    if (type === 'building') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /></svg>;
    if (type === 'home') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12l9-9 9 9" /><path d="M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10" /></svg>;
    if (type === 'users') return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>;
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
};

export default Dashboard;
