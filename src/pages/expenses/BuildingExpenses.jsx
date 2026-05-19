import { useState, useEffect } from 'react';
import * as buildingsService from '../../services/buildings';
import expensesService from '../../services/expenses';
import { getFinanceUsers } from '../../services/users';
import { toast } from 'sonner';
import './Expenses.css';
import '../analytics/Analytics.css';
import {
    PlusIcon,
    SearchIcon,
    EmptyIcon,
    WalletIcon,
    InfoIcon,
    CloseIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    TrendingUpIcon,
    UsersIcon,
    CalendarIcon
} from './ExpenseIcons';
import { AmBarChart, AmAreaChart, AmPieChart } from '../../components/AmCharts';

const BuildingExpenses = () => {
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // List Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterUser, setFilterUser] = useState('');

    // Filter Options
    const [categories, setCategories] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedBuilding, setSelectedBuilding] = useState(null);

    // Stats & Data State
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [expensesList, setExpensesList] = useState([]);
    const [listLoading, setListLoading] = useState(false);

    // UI State
    const [activeTab, setActiveTab] = useState('list'); // 'list' | 'stats'

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const PAGE_SIZE = 20;

    // Detail List Pagination
    const [expensesPage, setExpensesPage] = useState(1);
    const [expensesTotalPages, setExpensesTotalPages] = useState(1);
    const EXPENSES_PAGE_SIZE = 20;

    // Premium Chart Colors - Modern & Accessible
    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#f472b6'];

    const CustomTooltip = ({ active, payload, label, formatter }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}>
                    <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{label}</p>
                    {payload.map((item, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }}></div>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.name}:</span>
                            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                {formatter ? formatter(item.value) : item.value}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    useEffect(() => {
        loadBaseData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    // Refresh list or stats when filters change (if a building is selected)
    useEffect(() => {
        if (selectedBuilding) {
            if (activeTab === 'list') {
                loadExpensesList(selectedBuilding);
            } else if (activeTab === 'stats') {
                loadStats(selectedBuilding);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startDate, endDate, filterCategory, filterUser, activeTab, expensesPage]);

    // Reset page when filters change
    useEffect(() => {
        setExpensesPage(1);
    }, [startDate, endDate, filterCategory, filterUser]);

    const loadBaseData = async () => {
        try {
            setLoading(true);
            const [buildingsRes, catsRes, usersRes] = await Promise.all([
                buildingsService.getBuildings({ page: currentPage, page_size: PAGE_SIZE }),
                expensesService.getCategories({ active_only: true }),
                getFinanceUsers()
            ]);

            const bData = buildingsRes.results || buildingsRes;
            setBuildings(bData);
            if (buildingsRes.count) {
                setTotalPages(Math.ceil(buildingsRes.count / PAGE_SIZE));
            }

            setCategories(catsRes.results || catsRes);
            setUsers(usersRes.data || []);

            // Auto select
            if (!selectedBuilding && bData.length > 0) {
                loadBuildingData(bData[0]);
            }
        } catch (error) {
            console.error(error);
            toast.error("Binolarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const loadExpensesList = async (building = selectedBuilding) => {
        if (!building) return;
        setListLoading(true);
        try {
            const params = {
                building: building.id,
                page: expensesPage,
                page_size: EXPENSES_PAGE_SIZE,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                category: filterCategory || undefined,
                user: filterUser || undefined
            };

            const data = await expensesService.getExpenses(params);
            setExpensesList(data.results || data);

            if (data.count) {
                setExpensesTotalPages(Math.ceil(data.count / EXPENSES_PAGE_SIZE));
            } else {
                setExpensesTotalPages(1);
            }

            // Extract unique users from the loaded expenses if we don't have a users endpoint
            // This is a simple workaround to populate the users filter
            const uniqueUsers = {};
            (data.results || data).forEach(item => {
                if (item.created_by && item.created_by_name) {
                    uniqueUsers[item.created_by] = item.created_by_name; // created_by is ID
                }
            });
            setUsers(Object.entries(uniqueUsers).map(([id, name]) => ({ id, name })));

        } catch (err) {
            console.error(err);
            if (err.response) {
                toast.error(`Xatolik: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
            } else {
                toast.error("Ro'yxatni yuklashda xatolik: Serverga ulanib bo'lmadi");
            }
        } finally {
            setListLoading(false);
        }
    };

    const loadStats = async (building = selectedBuilding, overrideParams = null) => {
        if (!building) return;
        setStatsLoading(true);
        try {
            const params = overrideParams || {
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                user: filterUser || undefined
            };

            const data = await expensesService.getBuildingStats(building.id, params);
            
            // Calculate cumulative data
            let cumulativeTotal = 0;
            const cumulativeTrend = (data.daily_trend || []).map(item => {
                cumulativeTotal += item.total;
                return { ...item, cumulative: cumulativeTotal };
            });
            
            setStats({
                ...data,
                cumulative_trend: cumulativeTrend,
                consumption_percentage: data.budget ? (data.building_total_spent / data.budget) * 100 : 0
            });
        } catch (err) {
            console.error(err);
            toast.error("Statistikani yuklashda xatolik");
        } finally {
            setStatsLoading(false);
        }
    };

    const loadBuildingData = async (building) => {
        try {
            setSelectedBuilding(building);

            // Reset filters when switching buildings
            setStartDate('');
            setEndDate('');
            setFilterCategory('');
            setFilterUser('');

            // Load Stats with explicitly cleared filters
            // We pass building explicitly because state selectedBuilding might not be updated yet
            await loadStats(building, { start_date: undefined, end_date: undefined, user: undefined });

            // Load List with initial (empty) filters
            setExpensesPage(1); // Reset to page 1
            loadExpensesList(building);

        } catch (error) {
            console.error(error);
        }
    };



    const formatPrice = (price) => {
        return new Intl.NumberFormat('uz-UZ').format(price || 0) + " so'm";
    };

    const getProgress = (spent, budget) => {
        if (!budget || budget === 0) return 0;
        return Math.min(Math.round((spent / budget) * 100), 100);
    };

    // --- Chart Components ---
    const CategoryPieChart = ({ data }) => {
        return (
            <AmPieChart
                data={data || []}
                nameField="category__name"
                valueField="total"
                height={300}
                innerRadius={55}
            />
        );
    };

    const MonthlyBarChart = ({ data }) => (
        <AmBarChart
            data={data}
            xField="month"
            yField="total"
            height={300}
            color="#6366f1"
            tooltipFormatter="{categoryX}: {valueY}"
        />
    );

    const DailyAreaChart = ({ data }) => (
        <AmAreaChart
            data={data}
            xField="day"
            yField="total"
            height={300}
            color="#10b981"
            tooltipText="Kun: {categoryX}\nSumma: {valueY}"
        />
    );

    const UserBarChart = ({ data }) => (
        <AmBarChart
            data={data}
            xField="name"
            yField="total"
            height={300}
            horizontal={true}
            color="#f59e0b"
            tooltipFormatter="{categoryY}: {valueX}"
        />
    );

    return (
        <div className="clients-page building-expenses-page">
            <div className="page-header">
                <div className="header-left">
                    <h1 className="page-title">Ob'ektlar tahlili</h1>
                    <p className="page-subtitle">Binolar bo'yicha xarajatlar va byudjet nazorati</p>
                </div>
            </div>

            <div className={`page-content building-expenses-layout ${selectedBuilding ? 'has-selection' : ''}`}>
                {/* Binolar ro'yxati (Left Panel) */}
                <div className="content-card buildings-sidebar">
                    <div className="card-header">
                        <div className="search-box" style={{ width: '100%' }}>
                            <SearchIcon />
                            <input
                                type="text"
                                placeholder="Binoni qidirish..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="buildings-list-scroll">
                        {loading ? (
                            <div className="loading-state"><div className="spinner"></div></div>
                        ) : buildings.filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || b.code.toLowerCase().includes(search.toLowerCase())).length === 0 ? (
                            <div className="empty-state">Topilmadi</div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {buildings.filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || b.code.toLowerCase().includes(search.toLowerCase())).map(b => (
                                        <div
                                            key={b.id}
                                            className={`building-item ${selectedBuilding?.id === b.id ? 'active' : ''}`}
                                            onClick={() => loadBuildingData(b)}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <strong className="building-name">{b.name}</strong>
                                                <span className="building-code">{b.code}</span>
                                            </div>
                                            <div className="building-budget">
                                                Budget: {formatPrice(b.budget)}
                                            </div>
                                            <div className="progress-mini">
                                                <div style={{
                                                    width: `${getProgress(b.spent_amount, b.budget)}%`,
                                                    height: '100%',
                                                    background: getProgress(b.spent_amount, b.budget) > 90 ? '#ef4444' : '#6366f1'
                                                }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {totalPages > 1 && (
                                    <div className="pagination-mini">
                                        <button className="btn btn-secondary" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} style={{ padding: '6px 12px', fontSize: '13px' }}>Ortga</button>
                                        <span style={{ fontSize: '13px', alignSelf: 'center', color: 'var(--text-secondary)' }}>{currentPage} / {totalPages}</span>
                                        <button className="btn btn-secondary" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} style={{ padding: '6px 12px', fontSize: '13px' }}>Oldinga</button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Right Panel (Content) */}
                <div className="content-card building-detail-panel">
                    {!selectedBuilding ? (
                        <div className="empty-state-full">
                            <InfoIcon />
                            <h3>Bino tanlanmagan</h3>
                            <p>Tahlilni ko'rish uchun chap tomondan binoni tanlang</p>
                        </div>
                    ) : (
                        <div className="building-stats-detail">
                            {/* Mobile Back Button */}
                            <button className="btn-back-mobile" onClick={() => setSelectedBuilding(null)}>
                                <ChevronLeftIcon />
                                <span>Binolar ro'yxatiga qaytish</span>
                            </button>

                            {/* Header & Tabs */}
                            <div className="building-detail-header">
                                <div>
                                    <h2 className="detail-title">{selectedBuilding.name}</h2>
                                    <div className="segmented-tabs">
                                        <button
                                            className={`segmented-tab ${activeTab === 'list' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('list')}
                                        >
                                            <WalletIcon style={{ width: 18, height: 18 }} />
                                            <span>Ro'yxat</span>
                                        </button>
                                        <button
                                            className={`segmented-tab ${activeTab === 'stats' ? 'active' : ''}`}
                                            onClick={() => setActiveTab('stats')}
                                        >
                                            <InfoIcon style={{ width: 18, height: 18 }} />
                                            <span>Statistika</span>
                                        </button>
                                    </div>
                                </div>
                                {stats && (
                                    <div className="budget-summary">
                                        <div className="summary-label">Qolgan byudjet</div>
                                        <div className={`summary-value ${stats.remaining_budget < 0 ? 'danger' : 'success'}`}>
                                            {formatPrice(stats.remaining_budget)}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Filters Bar (Global) */}
                            <div className="filters-bar">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    title="Boshlanish sanasi"
                                />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    title="Tugash sanasi"
                                />
                                {activeTab === 'list' && (
                                    <select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                    >
                                        <option value="">Barcha kategoriyalar</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                )}
                                <select
                                    value={filterUser}
                                    onChange={(e) => setFilterUser(e.target.value)}
                                >
                                    <option value="">Barcha xodimlar</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>

                                {(startDate || endDate || filterCategory || filterUser) && (
                                    <button
                                        className="btn-filter-clear"
                                        onClick={() => {
                                            setStartDate('');
                                            setEndDate('');
                                            setFilterCategory('');
                                            setFilterUser('');
                                        }}
                                    >
                                        <CloseIcon style={{ width: 16, height: 16 }} />
                                        Tozalash
                                    </button>
                                )}
                            </div>

                            {/* Content based on Tab */}
                            {activeTab === 'list' ? (
                                <div>


                                    {listLoading ? (
                                        <div className="loading-state"><div className="spinner"></div></div>
                                    ) : expensesList.length === 0 ? (
                                        <div className="empty-state">Xarajatlar topilmadi</div>
                                    ) : (
                                        <>
                                            <div className="responsive-table">
                                                <table className="data-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Sana</th>
                                                            <th>Kategoriya</th>
                                                            <th>Tavsif</th>
                                                            <th>Summa</th>
                                                            <th>Kim tomonidan</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {expensesList.map(item => (
                                                            <tr key={item.id}>
                                                                <td>{item.date}</td>
                                                                <td>
                                                                    {item.category ? (
                                                                        <span className={`status-badge ${item.category_color}`}>
                                                                            {item.category_name}
                                                                        </span>
                                                                    ) : '-'}
                                                                </td>
                                                                <td>{item.description}</td>
                                                                <td style={{ fontWeight: '500' }}>{formatPrice(item.amount)}</td>
                                                                <td>{item.created_by_name || '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Pagination Controls for Expenses List */}
                                            {expensesTotalPages > 1 && (
                                                <div className="pagination-container" style={{ marginTop: '20px' }}>
                                                    <div className="pagination-info">
                                                        Sahifa {expensesPage} / {expensesTotalPages}
                                                    </div>
                                                    <div className="pagination-controls">
                                                        <button
                                                            className="pagination-btn"
                                                            onClick={() => setExpensesPage(Math.max(1, expensesPage - 1))}
                                                            disabled={expensesPage === 1}
                                                        >
                                                            <ChevronLeftIcon />
                                                        </button>
                                                        <button className="pagination-btn active">
                                                            {expensesPage}
                                                        </button>
                                                        <button
                                                            className="pagination-btn"
                                                            onClick={() => setExpensesPage(Math.min(expensesTotalPages, expensesPage + 1))}
                                                            disabled={expensesPage === expensesTotalPages}
                                                        >
                                                            <ChevronRightIcon />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    {statsLoading || !stats ? (
                                        <div className="loading-state"><div className="spinner"></div></div>
                                    ) : (
                                        <div className="stats-dashboard">
                                            {/* KPI Cards */}
                                            <div className="kpi-grid">
                                                <div className="kpi-card">
                                                    <div className="kpi-icon-wrapper danger"><WalletIcon /></div>
                                                    <div className="kpi-info">
                                                        <span className="kpi-label">{(startDate || endDate || filterUser) ? "Filtr bo'yicha sarf" : "Jami Xarajat"}</span>
                                                        <h3 className="kpi-value">{formatPrice(stats.spent_amount)}</h3>
                                                    </div>
                                                </div>
                                                <div className="kpi-card">
                                                    <div className="kpi-icon-wrapper primary"><CalendarIcon /></div>
                                                    <div className="kpi-info">
                                                        <span className="kpi-label">Bino Byudjeti</span>
                                                        <h3 className="kpi-value">{formatPrice(stats.budget)}</h3>
                                                    </div>
                                                </div>
                                                <div className="kpi-card">
                                                    <div className="kpi-icon-wrapper success"><TrendingUpIcon /></div>
                                                    <div className="kpi-info">
                                                        <span className="kpi-label">Qolgan Byudjet</span>
                                                        <h3 className={`kpi-value ${stats.remaining_budget < 0 ? 'text-red-500' : ''}`}>
                                                            {formatPrice(stats.remaining_budget)}
                                                        </h3>
                                                    </div>
                                                </div>
                                                <div className="kpi-card">
                                                    <div className="kpi-icon-wrapper warning"><InfoIcon /></div>
                                                    <div className="kpi-info">
                                                        <span className="kpi-label">Umumiy Sarf</span>
                                                        <h3 className="kpi-value">{stats.consumption_percentage?.toFixed(1)}%</h3>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="charts-grid-enhanced">
                                                {/* Row 1: Dynamics */}
                                                <div className="chart-card wide">
                                                    <div className="chart-card-header">
                                                        <h4>Xarajatlar o'sish sur'ati (Kumulyativ)</h4>
                                                        <span className="chart-subtitle">Vaqt davomida to'plangan jami sarf-xarajatlar</span>
                                                    </div>
                                                    <div className="chart-body">
                                                        <AmAreaChart data={stats.cumulative_trend} xField="day" yField="cumulative" height={350} color="#ef4444" />
                                                    </div>
                                                </div>

                                                <div className="chart-card">
                                                    <div className="chart-card-header">
                                                        <h4>Kategoriyalar bo'yicha</h4>
                                                        <span className="chart-subtitle">Xarajat turlari taqsimoti</span>
                                                    </div>
                                                    <div className="chart-body">
                                                        <AmPieChart 
                                                            data={stats.by_category} 
                                                            nameField="category__name" 
                                                            valueField="total" 
                                                            height={300} 
                                                            innerRadius={60} 
                                                        />
                                                    </div>
                                                </div>

                                                {/* Row 2: Distribution & Users */}
                                                <div className="chart-card wide">
                                                    <div className="chart-card-header">
                                                        <h4>Kunlik trend</h4>
                                                        <span className="chart-subtitle">Har kuni amalga oshirilgan xarajatlar</span>
                                                    </div>
                                                    <div className="chart-body">
                                                        <AmAreaChart data={stats.daily_trend} xField="day" yField="total" height={300} color="#6366f1" />
                                                    </div>
                                                </div>

                                                <div className="chart-card">
                                                    <div className="chart-card-header">
                                                        <h4>Byudjet bajarilishi</h4>
                                                        <span className="chart-subtitle">Sarflangan vs Qolgan mablag'</span>
                                                    </div>
                                                    <div className="chart-body">
                                                        <AmPieChart
                                                            data={[
                                                                { name: "Sarflangan", value: parseFloat(stats.spent_amount) },
                                                                { name: "Qolgan", value: Math.max(0, parseFloat(stats.remaining_budget)) }
                                                            ]}
                                                            nameField="name"
                                                            valueField="value"
                                                            height={300}
                                                            innerRadius={60}
                                                            colors={['#ef4444', '#10b981']}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Row 3: Monthly & Users */}
                                                <div className="chart-card wide">
                                                    <div className="chart-card-header">
                                                        <h4>Oylik dinamika</h4>
                                                        <span className="chart-subtitle">Oylar kesimidagi umumiy chiqimlar</span>
                                                    </div>
                                                    <div className="chart-body">
                                                        <AmBarChart data={stats.monthly_dynamics} xField="month" yField="total" height={300} color="#10b981" />
                                                    </div>
                                                </div>

                                                <div className="chart-card">
                                                    <div className="chart-card-header">
                                                        <h4>Foydalanuvchilar ulushi</h4>
                                                        <span className="chart-subtitle">Xarajat kiritishdagi faollik</span>
                                                    </div>
                                                    <div className="chart-body">
                                                        <AmBarChart data={stats.user_contribution} xField="name" yField="total" height={300} color="#f59e0b" horizontal={true} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default BuildingExpenses;
