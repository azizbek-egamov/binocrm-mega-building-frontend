import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/analytics';
import { getAllBuildings } from '../services/buildings';
import { AmBarChart, AmAreaChart, AmPieChart, NoData } from '../components/AmCharts';
import FunnelChart from '../components/FunnelChart';
import './Dashboard.css';




const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('monthly');

    // New states for Contract stats and building filter
    const [buildings, setBuildings] = useState([]);
    const [selectedBuildings, setSelectedBuildings] = useState([]);
    const [contractsSummary, setContractsSummary] = useState(null);
    const [contractsSummaryLoading, setContractsSummaryLoading] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        fetchSummary();
        fetchBuildings();
    }, []);

    useEffect(() => {
        fetchContractsSummary();
    }, [selectedBuildings]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.multi-select-container')) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchBuildings = async () => {
        try {
            const data = await getAllBuildings({ include_archived: true });
            setBuildings(data);
            // Default to only non-archived buildings being selected on load
            const activeIds = data.filter(b => !b.is_archived).map(b => b.id);
            setSelectedBuildings(activeIds);
        } catch (error) {
            console.error("Error fetching buildings:", error);
        }
    };

    const fetchContractsSummary = async () => {
        setContractsSummaryLoading(true);
        try {
            const params = {};
            if (selectedBuildings.length > 0) {
                params.building_ids = selectedBuildings.join(',');
            }
            const res = await analyticsService.getContractsSummary(params);
            setContractsSummary(res.data);
        } catch (error) {
            console.error("Error fetching contracts summary:", error);
        } finally {
            setContractsSummaryLoading(false);
        }
    };

    const toggleBuilding = (id) => {
        setSelectedBuildings(prev => 
            prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]
        );
    };

    const clearSelectedBuildings = () => {
        setSelectedBuildings([]);
    };

    const selectAllBuildings = () => {
        setSelectedBuildings(buildings.map(b => b.id));
    };

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

    // ─── Stabilized chart data references (prevents re-animation on unrelated state changes) ───
    const homeFunnelData = useMemo(() => summary?.homes_funnel || [], [summary?.homes_funnel]);
    const buildingOccupancyData = useMemo(() => summary?.building_occupancy || [], [summary?.building_occupancy]);
    const weeklyTrendData = useMemo(() => summary?.weekly_trend || [], [summary?.weekly_trend]);
    const leadSourcesData = useMemo(() => summary?.lead_sources || [], [summary?.lead_sources]);

    const stats = [
        { label: 'Binolar', value: summary?.buildings_count || '0', color: 'primary', icon: 'building', tooltip: 'Tizimdagi jami arxivlanmagan binolar soni', link: '/buildings' },
        { label: 'Uylar', value: summary?.homes_count || '0', color: 'success', icon: 'home', tooltip: 'Binolarga tegishli bo\'lgan barcha xonadonlar (sotuvda, sotilgan va band qilingan uylar) soni', link: '/homes' },
        { label: 'Shartnoma tuzganlar', value: summary?.contracts_clients_count || '0', color: 'warning', icon: 'users', tooltip: 'Kamida bitta shartnoma tuzgan mijozlar soni', link: '/clients?contract_filter=has_contract' },
        {
            label: 'Shartnomalar',
            value: `${summary?.unpaid_contracts_count || '0'}/${summary?.contracts_count || '0'}`,
            subtext: `Boshlagan: ${summary?.started_paying_count || '0'} / To'lamagan: ${summary?.never_paid_count || '0'} / To'liq: ${summary?.paid_contracts_count || '0'}`,
            color: 'cyan',
            icon: 'contract',
            tooltip: 'Qarzi bor faol shartnomalar / Jami faol shartnomalar soni. Pastda to\'lovni boshlagan, umuman to\'lamagan va to\'liq to\'lagan shartnomalar soni.',
            link: '/contracts'
        },
    ];

    // Revenue stats are dynamically generated from summary.finance based on selected period

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
                {stats.map((stat, i) => (
                    <div key={stat.label} className={`stat-card stat-${stat.color}`}>
                        <div className="stat-icon">
                            <StatIcon type={stat.icon} />
                        </div>
                        <div className="stat-info-box">
                            <div className="stat-value-row">
                                <span className="stat-value">{stat.value}</span>
                                <InfoTooltip text={stat.tooltip} position={(i === 1 || i === 3) ? 'left' : 'top'} link={stat.link} />
                            </div>
                            <span className="stat-label">{stat.label}</span>
                            {stat.subtext && (
                                <span className="stat-subtext" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', marginTop: '2px', display: 'block' }}>
                                    {stat.subtext}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </section>

            {/* Shartnomalar savdosi ko'rsatkichlari */}
            <div className="contracts-section-header">
                <div className="section-title">Shartnomalar savdosi ko'rsatkichlari</div>
                <div className="multi-select-container">
                    <button 
                        className={`multi-select-trigger ${isDropdownOpen ? 'active' : ''}`}
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <span>
                            {selectedBuildings.length === 0 
                                ? "Barcha binolar" 
                                : selectedBuildings.length === buildings.length
                                ? "Barcha binolar tanlandi"
                                : `${selectedBuildings.length} ta bino tanlandi`
                            }
                        </span>
                        <ChevronDownIcon />
                    </button>
                    {isDropdownOpen && (
                        <div className="multi-select-dropdown">
                            <div className="multi-select-actions">
                                <button 
                                    className="multi-select-action-btn"
                                    onClick={selectAllBuildings}
                                >
                                    Barchasini tanlash
                                </button>
                                {selectedBuildings.length > 0 && (
                                    <button 
                                        className="multi-select-action-btn"
                                        onClick={clearSelectedBuildings}
                                    >
                                        Tozalash
                                    </button>
                                )}
                            </div>
                            <div className="multi-select-list">
                                {buildings.map(b => {
                                    const isChecked = selectedBuildings.includes(b.id);
                                    return (
                                        <div 
                                            key={b.id} 
                                            className={`multi-select-option ${b.is_archived ? 'archived-option' : ''}`}
                                            onClick={() => toggleBuilding(b.id)}
                                        >
                                            <div className="option-left">
                                                <span className="building-code">{b.code}</span>
                                                <span className="option-name">{b.name}</span>
                                            </div>
                                            {b.is_archived && (
                                                <span className="archived-badge">Arxiv</span>
                                            )}
                                            <div className={`multi-select-checkbox ${isChecked ? 'checked' : ''}`}>
                                                {isChecked && <CheckIcon />}
                                            </div>
                                        </div>
                                    );
                                })}
                                {buildings.length === 0 && (
                                    <div style={{ padding: '8px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                                        Binolar topilmadi
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Contracts Stats Cards Grid */}
            <section className={`stats-grid contracts-stats-grid ${contractsSummaryLoading ? 'contracts-loading' : ''}`}>
                {/* 1. Jami shartnomalar qiymati */}
                <div className="stat-card stat-primary">
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                    </div>
                    <div className="stat-info-box">
                        <div className="stat-value-row">
                            <span className="stat-value">
                                {contractsSummaryLoading ? '...' : formatCurrency(contractsSummary?.total_price || 0)}
                            </span>
                        </div>
                        <span className="stat-label">Jami sotuv qiymati</span>
                    </div>
                </div>

                {/* 2. Kirim qilingan (to'langan) */}
                <div className="stat-card stat-success">
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    </div>
                    <div className="stat-info-box">
                        <div className="stat-value-row">
                            <span className="stat-value" style={{ color: 'var(--accent-success)' }}>
                                {contractsSummaryLoading ? '...' : formatCurrency(contractsSummary?.total_paid || 0)}
                            </span>
                        </div>
                        <span className="stat-label">Kirim qilingan (to'langan)</span>
                    </div>
                </div>

                {/* 3. Qolgan qarz */}
                <div className="stat-card stat-warning">
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    </div>
                    <div className="stat-info-box">
                        <div className="stat-value-row">
                            <span className="stat-value" style={{ color: 'var(--accent-warning)' }}>
                                {contractsSummaryLoading ? '...' : formatCurrency(contractsSummary?.total_remaining || 0)}
                            </span>
                        </div>
                        <span className="stat-label">Qolgan qarz (Qoldiq)</span>
                    </div>
                </div>

                {/* 4. Shartnomalar soni */}
                <div className="stat-card stat-cyan">
                    <div className="stat-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                    </div>
                    <div className="stat-info-box">
                        <div className="stat-value-row">
                            <span className="stat-value">
                                {contractsSummaryLoading ? '...' : `${contractsSummary?.total_contracts || 0} ta`}
                            </span>
                        </div>
                        <span className="stat-label">Shartnomalar soni</span>
                    </div>
                </div>
            </section>

            {/* Revenue Overview Section */}
            {(canViewIncomes || canViewExpenses) && (
                <>
                    <div className="finance-header">
                        <div className="section-title">Moliyaviy ko'rsatkichlar</div>
                        <div className="period-selector">
                            <button
                                className={`period-btn ${period === 'daily' ? 'active' : ''}`}
                                onClick={() => setPeriod('daily')}
                            >
                                Bugun
                            </button>
                            <button
                                className={`period-btn ${period === 'weekly' ? 'active' : ''}`}
                                onClick={() => setPeriod('weekly')}
                            >
                                Hafta
                            </button>
                            <button
                                className={`period-btn ${period === 'monthly' ? 'active' : ''}`}
                                onClick={() => setPeriod('monthly')}
                            >
                                Oy
                            </button>
                            <button
                                className={`period-btn ${period === 'total' ? 'active' : ''}`}
                                onClick={() => setPeriod('total')}
                            >
                                Jami
                            </button>
                        </div>
                    </div>

                    <section className="revenue-grid">
                        {/* 1. Kirim Card */}
                        {canViewIncomes && (() => {
                            const incomeValue = summary?.finance?.income?.[period] ?? (period === 'monthly' ? (summary?.revenue?.monthly ?? 0) : 0);
                            const totalVal = summary?.finance?.sales_value ?? (summary?.revenue?.total_sales_value ?? 1);
                            const realPercentage = totalVal > 0 ? (incomeValue / totalVal) * 100 : 0;
                            const displayPercentage = Math.min(100, Math.max(2, realPercentage));
                            const label = period === 'daily' ? 'Bugungi kirim' : period === 'weekly' ? 'Haftalik kirim' : period === 'monthly' ? 'Oylik kirim' : 'Umumiy kirim';

                            return (
                                <div className="revenue-card rev-success">
                                    <div className="revenue-label-row">
                                        <span className="revenue-label">{label}</span>
                                        <InfoTooltip text={`Tanlangan davr (${period === 'daily' ? 'bugun' : period === 'weekly' ? 'hafta' : period === 'monthly' ? 'oy' : 'jami'}) davomidagi barcha kirimlar (shartnoma to'lovlari + manual tushumlar)`} position="top" link="/incomes" />
                                    </div>
                                    <span className="revenue-value">{formatCurrency(incomeValue)}</span>
                                    <div className="revenue-chart-mini">
                                        <div className="mini-bar-container">
                                            <div className="mini-bar" style={{ width: `${displayPercentage}%` }}></div>
                                        </div>
                                        <div className="revenue-footer">
                                            <span className="footer-target">Jami savdo: {formatCurrency(totalVal)}</span>
                                            <span className="footer-percent">{realPercentage.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* 2. Chiqim Card */}
                        {canViewExpenses && (() => {
                            const expenseValue = summary?.finance?.expense?.[period] ?? (period === 'monthly' ? (summary?.expenses?.total_amount ?? 0) : 0);
                            const incomeValue = summary?.finance?.income?.[period] ?? (period === 'monthly' ? (summary?.revenue?.monthly ?? 0) : 0);
                            const realPercentage = incomeValue > 0 ? (expenseValue / incomeValue) * 100 : 0;
                            const displayPercentage = Math.min(100, Math.max(2, realPercentage));
                            const label = period === 'daily' ? 'Bugungi chiqim' : period === 'weekly' ? 'Haftalik chiqim' : period === 'monthly' ? 'Oylik chiqim' : 'Umumiy chiqim';

                            return (
                                <div className="revenue-card rev-danger">
                                    <div className="revenue-label-row">
                                        <span className="revenue-label">{label}</span>
                                        <InfoTooltip text={`Tanlangan davr (${period === 'daily' ? 'bugun' : period === 'weekly' ? 'hafta' : period === 'monthly' ? 'oy' : 'jami'}) davomidagi jami chiqimlar (xarajatlar)`} position="left" link="/expenses" />
                                    </div>
                                    <span className="revenue-value">{formatCurrency(expenseValue)}</span>
                                    <div className="revenue-chart-mini">
                                        <div className="mini-bar-container">
                                            <div className="mini-bar" style={{ width: `${displayPercentage}%` }}></div>
                                        </div>
                                        <div className="revenue-footer">
                                            <span className="footer-target">Kirimga nisbatan</span>
                                            <span className="footer-percent">{realPercentage.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* 3. Balans (Plus-Minus) Card */}
                        {canViewIncomes && canViewExpenses && (() => {
                            const balanceValue = summary?.finance?.balance?.[period] ?? 0;
                            const incomeValue = summary?.finance?.income?.[period] ?? (period === 'monthly' ? (summary?.revenue?.monthly ?? 0) : 0);
                            const realPercentage = incomeValue > 0 ? (balanceValue / incomeValue) * 100 : 0;
                            const displayPercentage = Math.min(100, Math.max(2, Math.abs(realPercentage)));
                            const label = period === 'daily' ? 'Bugungi balans' : period === 'weekly' ? 'Haftalik balans' : period === 'monthly' ? 'Oylik balans' : 'Umumiy balans';
                            const isPositive = balanceValue >= 0;

                            return (
                                <div className={`revenue-card ${isPositive ? 'rev-success' : 'rev-danger'}`}>
                                    <div className="revenue-label-row">
                                        <span className="revenue-label">{label}</span>
                                        <InfoTooltip text={`Tanlangan davr (${period === 'daily' ? 'bugun' : period === 'weekly' ? 'hafta' : period === 'monthly' ? 'oy' : 'jami'}) davomidagi sof balans ko'rsatkichi (Kirimlar - Chiqimlar)`} position="top" link="/analytics" />
                                    </div>
                                    <span className="revenue-value">{formatCurrency(balanceValue)}</span>
                                    <div className="revenue-chart-mini">
                                        <div className="mini-bar-container">
                                            <div className="mini-bar" style={{ width: `${displayPercentage}%` }}></div>
                                        </div>
                                        <div className="revenue-footer">
                                            <span className="footer-target">Rentabellik</span>
                                            <span className="footer-percent">{realPercentage.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* 4. Qarzlar Card */}
                        {canViewIncomes && (() => {
                            const debtValue = summary?.finance?.debt ?? (summary?.revenue?.total_debt ?? 0);
                            const totalVal = summary?.finance?.sales_value ?? (summary?.revenue?.total_sales_value ?? 1);
                            const paidValue = Math.max(0, totalVal - debtValue);
                            const realPercentage = totalVal > 0 ? (debtValue / totalVal) * 100 : 0;
                            const displayPercentage = Math.min(100, Math.max(2, realPercentage));

                            return (
                                <div className="revenue-card rev-warning">
                                    <div className="revenue-label-row">
                                        <span className="revenue-label">Umumiy qarzlar</span>
                                        <InfoTooltip text="Mijozlarning shartnomalar bo'yicha hali to'lanmagan jami qarz qoldig'i (doimiy umumiy stat)" position="left" link="/contracts" />
                                    </div>
                                    <span className="revenue-value">{formatCurrency(debtValue)}</span>
                                    <div className="revenue-chart-mini">
                                        <div className="mini-bar-container">
                                            <div className="mini-bar" style={{ width: `${displayPercentage}%` }}></div>
                                        </div>
                                        <div className="revenue-footer">
                                            <span className="footer-target">To'langan: {formatCurrency(paidValue)}</span>
                                            <span className="footer-percent">{realPercentage.toFixed(1)}% qarz</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </section>
                </>
            )}

            {/* Charts Section */}
            <div className="section-title">Asosiy tahlillar</div>
            <section className="charts-grid-layout">
                {/* ═══ Funnel Section ═══ */}
                {summary?.homes_funnel && (
                    <div className="chart-card">
                        <div className="chart-header">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 12l9-9 9 9"></path>
                                        <path d="M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10"></path>
                                    </svg>
                                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Xonadonlar holati</h3>
                                </div>
                                <InfoTooltip text="Xonadonlarning joriy holatlari bo'yicha (Sotuvda, Sotilgan, Band qilingan) taqsimoti" position="left" link="/homes" />
                            </div>
                        </div>
                        <FunnelChart
                            items={homeFunnelData}
                            maxWidth={550}
                            unit="ta uy"
                        />
                    </div>
                )}

                {/* Building Occupancy */}
                <div className="chart-card">
                    <div className="chart-header">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <h3>Bino bandligi (Sotilgan / Jami)</h3>
                            <InfoTooltip text="Har bir bino bo'yicha sotilgan xonadonlar ulushi foizda" position="left" link="/buildings" />
                        </div>
                    </div>
                    <div className="chart-container">
                        <AmBarChart
                            data={buildingOccupancyData}
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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <h3>Haftalik mijozlar o'sishi</h3>
                            <InfoTooltip text="Oxirgi 7 kun davomida qo'shilgan yangi mijozlar dinamikasi" position="left" link="/clients" />
                        </div>
                    </div>
                    <div className="chart-container">
                        <AmAreaChart
                            data={weeklyTrendData}
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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <h3>Mijozlar qayerdan eshitgan</h3>
                            <InfoTooltip text="Mijozlarning reklama manbalari bo'yicha ulushlari taqsimoti" position="left" link="/analytics" />
                        </div>
                    </div>
                    <div className="chart-container pie-chart-container">
                        <AmPieChart
                            data={leadSourcesData}
                            nameField="heard_source"
                            valueField="count"
                            height={280}
                            innerRadius={55}
                        />
                    </div>
                </div>

                {/* Debtors Table - Full Width */}
                <div className="chart-card full-width-card" style={{ padding: '0', overflow: 'visible' }}>
                    <div className="chart-header" style={{ padding: '32px 32px 0 32px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <h3>Eng ko'p qarzdorlar</h3>
                            <InfoTooltip text="Shartnomalardan eng ko'p qarz qoldig'iga ega bo'lgan top 10 ta mijoz ro'yxati" position="left" link="/contracts" />
                        </div>
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
                                        <tr key={d.id || i} onClick={() => navigate(`/contracts?contract_id=${d.id}`)} style={{ cursor: 'pointer' }}>
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
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <h3>Kunlik tushumlar trendi</h3>
                                    <InfoTooltip text="Oxirgi 7 kun davomida kunlik tushumlar (kirimlar) hajmi o'zgarishi" position="left" link="/incomes" />
                                </div>
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
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <h3>Daromad manbalari</h3>
                                    <InfoTooltip text="Kirim kategoriyalari bo'yicha tushumlar taqsimoti" position="left" link="/incomes" />
                                </div>
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
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <h3>Binolar bo'yicha tushumlar</h3>
                                    <InfoTooltip text="Top 5 ta bino kesimida yig'ilgan jami kirimlar" position="left" link="/incomes/buildings" />
                                </div>
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
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <h3>Kunlik chiqimlar trendi</h3>
                                    <InfoTooltip text="Oxirgi 7 kun davomida kunlik xarajatlar (chiqimlar) hajmi o'zgarishi" position="left" link="/expenses" />
                                </div>
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
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <h3>Xarajat turlari</h3>
                                    <InfoTooltip text="Chiqim kategoriyalari bo'yicha xarajatlar taqsimoti" position="left" link="/expenses" />
                                </div>
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
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <h3>Binolar bo'yicha chiqimlar</h3>
                                    <InfoTooltip text="Top 5 ta bino kesimida amalga oshirilgan jami chiqimlar" position="left" link="/expenses/buildings" />
                                </div>
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

const InfoIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="info-icon-svg">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);

const InfoTooltip = ({ text, position = 'top', link }) => {
    const navigate = useNavigate();
    
    const handleRedirect = (e) => {
        if (link) {
            e.preventDefault();
            e.stopPropagation();
            navigate(link);
        }
    };

    return (
        <div className="tooltip-and-redirect-wrapper">
            {link && (
                <button 
                    onClick={handleRedirect} 
                    className="tooltip-redirect-btn" 
                    title="Batafsil ko'rish"
                    aria-label="Batafsil ko'rish"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="redirect-icon-svg">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                </button>
            )}
            <div className={`tooltip-container tooltip-${position}`}>
                <InfoIcon />
                <span className="tooltip-text">{text}</span>
            </div>
        </div>
    );
};

const ChevronDownIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="chevron">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

export default Dashboard;
