import { useState, useEffect } from 'react';
import incomesService from '../../services/incomes';
import * as buildingsService from '../../services/buildings';
import { getFinanceUsers } from '../../services/users';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';
import './Incomes.css';
import '../analytics/Analytics.css';
import {
    PlusIcon,
    SearchIcon,
    WalletIcon,
    InfoIcon,
    CloseIcon,
    EditIcon,
    TrashIcon,
    SaveIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    TrendingUpIcon,
    UsersIcon,
    CalendarIcon
} from '../expenses/ExpenseIcons';
import { AmBarChart, AmAreaChart, AmPieChart, AmLineChart } from '../../components/AmCharts';

const BuildingIncomes = () => {
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedBuilding, setSelectedBuilding] = useState(null);

    // Filters
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterUser, setFilterUser] = useState('');

    // Data State
    const [categories, setCategories] = useState([]);
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [incomesList, setIncomesList] = useState([]);
    const [listLoading, setListLoading] = useState(false);

    // UI State
    const [activeTab, setActiveTab] = useState('list'); // 'list' | 'stats'
    const [modal, setModal] = useState({ open: false, type: null, item: null });
    const [modalClosing, setModalClosing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        building: '',
        category: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        payer_name: '',
        payer_phone: '',
        note: ''
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const PAGE_SIZE = 20;

    const [incomesPage, setIncomesPage] = useState(1);
    const [incomesTotalPages, setIncomesTotalPages] = useState(1);
    const INCOMES_PAGE_SIZE = 20;

    const formatPhone = (phone) => {
        if (!phone) return '-';
        let cleaned = phone.toString().replace(/\D/g, '');
        if (cleaned.length === 9) cleaned = '998' + cleaned;
        if (cleaned.length === 12) {
            return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10, 12)}`;
        }
        return phone;
    };

    const loadBaseData = async () => {
        try {
            setLoading(true);
            const [buildingsRes, categoriesRes, usersRes] = await Promise.all([
                buildingsService.getBuildings({ page: currentPage, page_size: PAGE_SIZE }),
                incomesService.getCategories(),
                getFinanceUsers()
            ]);
            
            const bData = buildingsRes.results || buildingsRes;
            setBuildings(bData);
            if (buildingsRes.count) {
                setTotalPages(Math.ceil(buildingsRes.count / PAGE_SIZE));
            }
            
            setCategories(categoriesRes.results || categoriesRes);
            setUsers(usersRes.data || []);

            // Auto select
            if (!selectedBuilding && bData.length > 0) {
                setSelectedBuilding(bData[0]);
            }
        } catch (err) {
            console.error(err);
            toast.error("Ma'lumotlarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBaseData();
    }, [currentPage]);

    useEffect(() => {
        if (selectedBuilding) {
            if (activeTab === 'list') {
                loadIncomesList(selectedBuilding);
            } else if (activeTab === 'stats') {
                loadStats(selectedBuilding);
            }
        }
    }, [selectedBuilding, activeTab, startDate, endDate, filterCategory, filterUser, incomesPage]);

    const loadIncomesList = async (building = selectedBuilding) => {
        if (!building) return;
        setListLoading(true);
        try {
            const params = {
                building_id: building.id,
                page: incomesPage,
                page_size: INCOMES_PAGE_SIZE,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                category: filterCategory || undefined,
                user: filterUser || undefined
            };
            const data = await incomesService.getIncomes(params);
            setIncomesList(data.results || data);
            if (data.count) {
                setIncomesTotalPages(Math.ceil(data.count / INCOMES_PAGE_SIZE));
            }

            // Extract users for filter
            const uniqueUsers = {};
            (data.results || data).forEach(item => {
                if (item.created_by && item.created_by_name) {
                    uniqueUsers[item.created_by] = item.created_by_name;
                }
            });
            setUsers(Object.entries(uniqueUsers).map(([id, name]) => ({ id, name })));
        } catch (err) {
            toast.error("Kirimlarni yuklashda xatolik");
        } finally {
            setListLoading(false);
        }
    };

    const loadStats = async (building = selectedBuilding) => {
        if (!building) return;
        setStatsLoading(true);
        try {
            const params = {
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                user: filterUser || undefined
            };
            const data = await incomesService.getBuildingIncomeStats(building.id, params);
            
            // Calculate cumulative data
            let cumulativeTotal = 0;
            const cumulativeTrend = (data.daily_trend || []).map(item => {
                cumulativeTotal += item.total;
                return { ...item, cumulative: cumulativeTotal };
            });
            
            setStats({
                ...data,
                cumulative_trend: cumulativeTrend,
                avg_daily: data.daily_trend?.length ? data.total_income / data.daily_trend.length : 0
            });
        } catch (err) {
            toast.error("Statistikani yuklashda xatolik");
        } finally {
            setStatsLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('uz-UZ').format(price || 0) + " so'm";
    };

    const handlePhoneChange = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length === 0) {
            setFormData(prev => ({ ...prev, payer_phone: '' }));
            return;
        }
        if (!val.startsWith('998')) {
            if (val.startsWith('8')) val = '998' + val.substring(1);
            else val = '998' + val;
        }
        let formatted = '+' + val.substring(0, 3);
        if (val.length > 3) formatted += ' ' + val.substring(3, 5);
        if (val.length > 5) formatted += ' ' + val.substring(5, 8);
        if (val.length > 8) formatted += ' ' + val.substring(8, 10);
        if (val.length > 10) formatted += ' ' + val.substring(10, 12);
        setFormData(prev => ({ ...prev, payer_phone: formatted }));
    };

    const openModal = (type, item = null) => {
        if (item) {
            setFormData({
                building: selectedBuilding.id,
                category: item.category,
                description: item.description,
                amount: item.amount,
                date: item.date,
                payer_name: item.payer_name || '',
                payer_phone: item.payer_phone || '',
                note: item.note || ''
            });
        } else {
            setFormData({
                building: selectedBuilding.id,
                category: '',
                description: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                payer_name: '',
                payer_phone: '',
                note: ''
            });
        }
        setModal({ open: true, type, item });
    };

    const closeModal = () => {
        setModalClosing(true);
        setTimeout(() => {
            setModal({ open: false, type: null, item: null });
            setModalClosing(false);
        }, 200);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const cleanedPhone = formData.payer_phone.length <= 4 ? '' : formData.payer_phone;
            const dataToSave = { 
                ...formData, 
                amount: parseFloat(formData.amount.toString().replace(/ /g, '')),
                payer_phone: cleanedPhone
            };
            if (modal.type === 'edit') {
                await incomesService.updateIncome(modal.item.id, dataToSave);
            } else {
                await incomesService.createIncome(dataToSave);
            }
            toast.success("Muvaffaqiyatli saqlandi");
            closeModal();
            loadIncomesList(selectedBuilding);
            if (activeTab === 'stats') loadStats(selectedBuilding);
        } catch (err) {
            toast.error("Xatolik");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            setSaving(true);
            await incomesService.deleteIncome(modal.item.id);
            toast.success("O'chirildi");
            closeModal();
            loadIncomesList(selectedBuilding);
            if (activeTab === 'stats') loadStats(selectedBuilding);
        } catch (e) {
            toast.error("O'chirishda xatolik");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="clients-page building-expenses-page">
            <div className="page-header">
                <div className="header-left">
                    <h1 className="page-title">Ob'ektlar tahlili (Kirim)</h1>
                    <p className="page-subtitle">Binolar bo'yicha daromadlar va shartnoma to'lovlari</p>
                </div>
            </div>

            <div className={`page-content building-expenses-layout ${selectedBuilding ? 'has-selection' : ''}`}>
                {/* Sidebar */}
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
                                            onClick={() => setSelectedBuilding(b)}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <strong className="building-name">{b.name}</strong>
                                                <span className="building-code">{b.code}</span>
                                            </div>
                                            <div className="building-budget" style={{color: 'var(--success-color)'}}>
                                                Kirim: {formatPrice(b.total_income)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {totalPages > 1 && (
                                    <div className="pagination-mini">
                                        <button className="btn btn-secondary" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>Ortga</button>
                                        <span>{currentPage} / {totalPages}</span>
                                        <button className="btn btn-secondary" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>Oldinga</button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Main Panel */}
                <div className="content-card building-detail-panel">
                    {!selectedBuilding ? (
                        <div className="empty-state-full">
                            <InfoIcon />
                            <h3>Bino tanlanmagan</h3>
                            <p>Tahlilni ko'rish uchun chap tomondan binoni tanlang</p>
                        </div>
                    ) : (
                        <div className="building-stats-detail">
                            <button className="btn-back-mobile" onClick={() => setSelectedBuilding(null)}>
                                <ChevronLeftIcon />
                                <span>Binolar ro'yxatiga qaytish</span>
                            </button>

                            <div className="building-detail-header">
                                <div>
                                    <h2 className="detail-title">{selectedBuilding.name}</h2>
                                    <div className="segmented-tabs">
                                        <button className={`segmented-tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
                                            <WalletIcon style={{ width: 18, height: 18 }} />
                                            <span>Ro'yxat</span>
                                        </button>
                                        <button className={`segmented-tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
                                            <InfoIcon style={{ width: 18, height: 18 }} />
                                            <span>Statistika</span>
                                        </button>
                                    </div>
                                </div>
                                {activeTab === 'list' && (
                                    <button className="btn btn-primary" onClick={() => openModal('create')}>
                                        <PlusIcon />
                                        <span>Kirim qo'shish</span>
                                    </button>
                                )}
                                {stats && activeTab === 'stats' && (
                                    <div className="budget-summary-mini">
                                        <div className="summary-item">
                                            <span className="summary-label">Jami kirim</span>
                                            <span className="summary-value success">{formatPrice(stats.total_income)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="filters-bar">
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} title="Boshlanish sanasi" />
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} title="Tugash sanasi" />
                                {activeTab === 'list' && (
                                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                                        <option value="">Barcha kategoriyalar</option>
                                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                )}
                                <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
                                    <option value="">Barcha xodimlar</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                                {(startDate || endDate || filterCategory || filterUser) && (
                                    <button className="btn-filter-clear" onClick={() => { setStartDate(''); setEndDate(''); setFilterCategory(''); setFilterUser(''); }}>
                                        <CloseIcon style={{ width: 16, height: 16 }} />
                                        Tozalash
                                    </button>
                                )}
                            </div>

                            {activeTab === 'list' ? (
                                <div>
                                    {listLoading ? (
                                        <div className="loading-state"><div className="spinner"></div></div>
                                    ) : incomesList.length === 0 ? (
                                        <div className="empty-state">Kirimlar topilmadi</div>
                                    ) : (
                                        <div className="responsive-table">
                                            <table className="data-table">
                                                <thead>
                                                    <tr>
                                                        <th>Sana</th>
                                                        <th>Kategoriya</th>
                                                        <th>Tavsif</th>
                                                        <th>Summa</th>
                                                        <th>Kimdan / Kim tomonidan</th>
                                                        <th style={{textAlign: 'right'}}>Amallar</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {incomesList.map(item => {
                                                        const isContract = item.source_type === 'contract';
                                                        return (
                                                        <tr key={item.id} style={isContract ? { background: 'rgba(59,130,246,0.04)' } : {}}>
                                                            <td>{item.date}</td>
                                                            <td>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                    <span className={`status-badge ${item.category_color}`}>{item.category_name}</span>
                                                                    {isContract && (
                                                                        <span style={{
                                                                            fontSize: '10px', fontWeight: 600,
                                                                            color: '#3b82f6',
                                                                            background: 'rgba(59,130,246,0.12)',
                                                                            borderRadius: '4px', padding: '1px 6px',
                                                                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                                            width: 'fit-content'
                                                                        }}>
                                                                            🔗 Shartnoma (avtomatik)
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td>{item.description}</td>
                                                            <td style={{ fontWeight: '700', color: 'var(--success-color)' }}>{formatPrice(item.amount)}</td>
                                                            <td>
                                                                <div>{item.payer_name || '-'}</div>
                                                                <div style={{fontSize: '11px', color: 'var(--text-secondary)'}}>{formatPhone(item.payer_phone)}</div>
                                                                <small style={{color: 'var(--text-secondary)', display: 'block', marginTop: '2px', opacity: 0.7}}>{item.created_by_name}</small>
                                                            </td>
                                                            <td style={{textAlign: 'right'}}>
                                                                {isContract ? (
                                                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                                                        Avtomatik
                                                                    </span>
                                                                ) : (
                                                                    <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
                                                                        <button className="action-btn-mini" onClick={() => openModal('edit', item)}><EditIcon /></button>
                                                                        <button className="action-btn-mini danger" onClick={() => setModal({open: true, type: 'delete', item})}><TrashIcon /></button>
                                                                    </div>
                                                                )}
                                                            </td>
                                                        </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                            {incomesTotalPages > 1 && (
                                                <div className="pagination-mini" style={{marginTop: '16px'}}>
                                                    <button className="btn btn-secondary" onClick={() => setIncomesPage(p => Math.max(1, p - 1))} disabled={incomesPage === 1}>Ortga</button>
                                                    <span>{incomesPage} / {incomesTotalPages}</span>
                                                    <button className="btn btn-secondary" onClick={() => setIncomesPage(p => Math.min(incomesTotalPages, p + 1))} disabled={incomesPage === incomesTotalPages}>Oldinga</button>
                                                </div>
                                            )}
                                        </div>
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
                                                    <div className="kpi-icon-wrapper success"><WalletIcon /></div>
                                                    <div className="kpi-info">
                                                        <span className="kpi-label">Jami Kirim</span>
                                                        <h3 className="kpi-value">{formatPrice(stats.total_income)}</h3>
                                                    </div>
                                                </div>
                                                <div className="kpi-card">
                                                    <div className="kpi-icon-wrapper primary"><CalendarIcon /></div>
                                                    <div className="kpi-info">
                                                        <span className="kpi-label">Shartnomalar</span>
                                                        <h3 className="kpi-value">{formatPrice(stats.contract_payments)}</h3>
                                                    </div>
                                                </div>
                                                <div className="kpi-card">
                                                    <div className="kpi-icon-wrapper warning"><TrendingUpIcon /></div>
                                                    <div className="kpi-info">
                                                        <span className="kpi-label">Boshqa kirimlar</span>
                                                        <h3 className="kpi-value">{formatPrice(stats.direct_income)}</h3>
                                                    </div>
                                                </div>
                                                <div className="kpi-card">
                                                    <div className="kpi-icon-wrapper info"><UsersIcon /></div>
                                                    <div className="kpi-info">
                                                        <span className="kpi-label">O'rtacha kunlik</span>
                                                        <h3 className="kpi-value">{formatPrice(stats.avg_daily)}</h3>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="charts-grid-enhanced">
                                                {/* Row 1: Distribution */}
                                                <div className="chart-card wide">
                                                    <div className="chart-card-header">
                                                        <h4>Daromad o'sish sur'ati (Kumulyativ)</h4>
                                                        <span className="chart-subtitle">Vaqt davomida to'plangan jami mablag'</span>
                                                    </div>
                                                    <div className="chart-body">
                                                        <AmAreaChart data={stats.cumulative_trend} xField="day" yField="cumulative" height={350} color="#8b5cf6" />
                                                    </div>
                                                </div>

                                                <div className="chart-card">
                                                    <div className="chart-card-header">
                                                        <h4>Kirimlar turlari</h4>
                                                        <span className="chart-subtitle">Kategoriyalar bo'yicha taqsimot</span>
                                                    </div>
                                                    <div className="chart-body">
                                                        <AmPieChart data={stats.by_category} nameField="name" valueField="total" height={300} innerRadius={60} />
                                                    </div>
                                                </div>

                                                <div className="chart-card">
                                                    <div className="chart-card-header">
                                                        <h4>To'lovlar manbasi</h4>
                                                        <span className="chart-subtitle">Sotuv vs Boshqa kirimlar</span>
                                                    </div>
                                                    <div className="chart-body">
                                                        <AmPieChart 
                                                            data={[
                                                                { name: "Sotuv (Shartnoma)", value: stats.contract_payments },
                                                                { name: "Boshqa kirimlar", value: stats.direct_income }
                                                            ]} 
                                                            nameField="name" valueField="value" height={300} innerRadius={60} colors={['#6366f1', '#10b981']} 
                                                        />
                                                    </div>
                                                </div>

                                                {/* Row 2: Dynamics & Users */}
                                                <div className="chart-card wide">
                                                    <div className="chart-card-header">
                                                        <h4>Kunlik trend</h4>
                                                        <span className="chart-subtitle">Har kuni kiritilgan tushumlar miqdori</span>
                                                    </div>
                                                    <div className="chart-body">
                                                        <AmAreaChart data={stats.daily_trend} xField="day" yField="total" height={300} color="#10b981" />
                                                    </div>
                                                </div>

                                                <div className="chart-card">
                                                    <div className="chart-card-header">
                                                        <h4>Xodimlar ulushi</h4>
                                                        <span className="chart-subtitle">Kirim kiritishdagi faollik (Direct)</span>
                                                    </div>
                                                    <div className="chart-body">
                                                        <AmBarChart data={stats.user_contribution} xField="name" yField="total" height={300} color="#f59e0b" horizontal={true} />
                                                    </div>
                                                </div>

                                                <div className="chart-card wide">
                                                    <div className="chart-card-header">
                                                        <h4>Oylik daromad dinamikasi</h4>
                                                        <span className="chart-subtitle">Oylar kesimidagi umumiy tushum</span>
                                                    </div>
                                                    <div className="chart-body">
                                                        <AmBarChart data={stats.monthly_dynamics} xField="month" yField="total" height={300} color="#6366f1" />
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

            {/* Modals */}
            {modal.open && (modal.type === 'create' || modal.type === 'edit') && createPortal(
                <div className={`modal-overlay ${modalClosing ? 'closing' : ''}`} onClick={closeModal}>
                    <div className="modal-content modal-form" style={{maxWidth: '500px', width: '90%'}} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{modal.type === 'edit' ? 'Tahrirlash' : 'Yangi kirim'}</h3>
                            <button className="modal-close" onClick={closeModal}><CloseIcon /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{padding: '24px'}}>
                            <div className="form-group" style={{marginBottom: '16px'}}>
                                <label>Kategoriya *</label>
                                <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="filter-select" style={{width: '100%'}} required>
                                    <option value="">Tanlang</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{marginBottom: '16px'}}>
                                <label>Tavsif *</label>
                                <input type="text" className="filter-input" style={{width: '100%'}} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
                            </div>
                            <div className="form-group" style={{marginBottom: '16px'}}>
                                <label>Summa *</label>
                                <input 
                                    type="text" className="filter-input" style={{width: '100%'}}
                                    value={formData.amount ? new Intl.NumberFormat('uz-UZ').format(formData.amount.toString().replace(/ /g, '')) : ''}
                                    onChange={e => setFormData({...formData, amount: e.target.value.replace(/\D/g, '')})}
                                    required
                                />
                            </div>
                            <div className="form-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
                                <div className="form-group">
                                    <label>Kimdan (Ism)</label>
                                    <input type="text" className="filter-input" style={{width: '100%'}} value={formData.payer_name} onChange={(e) => setFormData({...formData, payer_name: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Telefoni</label>
                                    <input type="text" className="filter-input" style={{width: '100%'}} value={formData.payer_phone} onChange={handlePhoneChange} placeholder="+998" />
                                </div>
                            </div>
                            <div className="form-group" style={{marginBottom: '16px'}}>
                                <label>Sana</label>
                                <input type="date" className="filter-input" style={{width: '100%'}} value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Izoh</label>
                                <textarea className="filter-input" style={{width: '100%', height: '80px', paddingTop: '10px'}} value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} />
                            </div>
                            <div className="modal-actions" style={{marginTop: '24px'}}>
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Bekor qilish</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    <SaveIcon />
                                    <span>Saqlash</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {modal.open && modal.type === 'delete' && createPortal(
                <div className={`modal-overlay ${modalClosing ? 'closing' : ''}`} onClick={closeModal}>
                    <div className="modal-content" style={{maxWidth: '400px', width: '90%'}} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>O'chirishni tasdiqlang</h3>
                            <button className="modal-close" onClick={closeModal}><CloseIcon /></button>
                        </div>
                        <div style={{padding: '24px'}}>
                            <p>Haqiqatan ham ushbu kirim yozuvini o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.</p>
                            <div className="modal-actions" style={{marginTop: '24px'}}>
                                <button className="btn btn-secondary" onClick={closeModal}>Bekor qilish</button>
                                <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>O'chirish</button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default BuildingIncomes;
