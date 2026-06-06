import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import expensesService from '../../services/expenses';
import * as buildingsService from '../../services/buildings';
import { getFinanceUsers } from '../../services/users';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import DateRangeFilter from '../../components/common/DateRangeFilter';
import './Expenses.css';

// Reusable Icons
const PlusIcon = () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const SearchIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const TrashIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const EditIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const CloseIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const SaveIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>;
const ChevronLeftIcon = () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>;
const ChevronRightIcon = () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;

const ExpensesList = () => {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [buildingFilter, setBuildingFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [users, setUsers] = useState([]);
    const [userFilter, setUserFilter] = useState('');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [stats, setStats] = useState({ total: 0, count: 0, avg: 0 });
    
    const [modal, setModal] = useState({ open: false, type: null, item: null });
    const [modalClosing, setModalClosing] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Expenses state
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 15;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    const [formData, setFormData] = useState({
        building: '',
        category: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        note: '',
        payment_method: ''
    });

    useEffect(() => {
        loadBaseData();
    }, []);

    useEffect(() => {
        loadExpenses();
    }, [page, search, buildingFilter, categoryFilter, userFilter, paymentMethodFilter, dateRange]);

    const loadBaseData = async () => {
        try {
            const [buildingsRes, categoriesRes, usersRes] = await Promise.all([
                buildingsService.getAllBuildings(),
                expensesService.getCategories(),
                getFinanceUsers()
            ]);
            setBuildings(buildingsRes.results || buildingsRes);
            setCategories(categoriesRes.results || categoriesRes);
            setUsers(usersRes.data || []);
        } catch (err) {
            toast.error("Baza ma'lumotlarini yuklashda xatolik");
        }
    };

    const loadExpenses = async () => {
        try {
            setLoading(true);
            const filterParams = {
                building: buildingFilter,
                category: categoryFilter,
                user: userFilter,
                payment_method: paymentMethodFilter || undefined,
                search: search,
                start_date: dateRange.start,
                end_date: dateRange.end
            };
            const pageParams = { ...filterParams, page: page, page_size: pageSize };
            const [data, statsData] = await Promise.all([
                expensesService.getExpenses(pageParams),
                expensesService.getStatistics(filterParams)
            ]);
            setExpenses(data.results || data);
            // stats.count = barcha filtr bo'yicha umumiy son (paginatsiyasiz)
            setStats(prev => ({ ...statsData, count: data.count || 0 }));
            
            const count = data.count || (data.results ? data.results.length : data.length) || 0;
            setTotalCount(count);
        } catch (err) {
            if (err.response && err.response.status === 404 && page > 1) {
                setPage(1);
                return;
            }
            toast.error("Xarajatlar yuklanmadi");
        } finally {
            setLoading(false);
        }
    };

    const openModal = (type, item = null) => {
        if (item) {
            setFormData({
                building: item.building,
                category: item.category,
                description: item.description,
                amount: item.amount,
                date: item.date,
                note: item.note || '',
                payment_method: item.payment_method || ''
            });
        } else {
            setFormData({
                building: '',
                category: '',
                description: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                note: '',
                payment_method: ''
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
        if (!formData.building || !formData.category || !formData.amount) {
            toast.error("Majburiy maydonlarni to'ldiring");
            return;
        }
        try {
            setSaving(true);
            const dataToSave = { 
                ...formData, 
                amount: parseFloat(formData.amount.toString().replace(/ /g, ''))
            };
            if (modal.type === 'edit') {
                await expensesService.updateExpense(modal.item.id, dataToSave);
                toast.success("Muvaffaqiyatli yangilandi");
            } else {
                await expensesService.createExpense(dataToSave);
                toast.success("Xarajat muvaffaqiyatli qo'shildi");
            }
            closeModal();
            loadExpenses();
        } catch (err) {
            toast.error("Saqlashda xatolik");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            setSaving(true);
            await expensesService.deleteExpense(modal.item.id);
            toast.success("O'chirildi");
            closeModal();
            loadExpenses();
        } catch (err) {
            toast.error("O'chirishda xatolik");
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
    };

    return (
        <div className="expenses-page" style={{ padding: '24px' }}>
            <div className="page-header" style={{ marginBottom: '32px' }}>
                <div className="header-left">
                    <h1 className="page-title">Xarajatlar</h1>
                    <p className="page-subtitle">Barcha chiqimlar va xarajatlar tahlili</p>
                </div>
                <div className="header-actions">
                    <button className="btn-primary" onClick={() => openModal('create')}>
                        <PlusIcon />
                        <span>Xarajat qo'shish</span>
                    </button>
                </div>
            </div>

            <div className="layout-with-sidebar">
                <div className="main-view-area">
                    <div className="kpi-grid" style={{ marginBottom: '24px' }}>
                        <div className="kpi-card">
                            <div className="kpi-icon-wrapper warning">
                                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path><path d="M18 12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4"></path></svg>
                            </div>
                            <div className="kpi-info">
                                <span className="kpi-label">Jami Chiqim</span>
                                <h3 className="kpi-value">{formatCurrency(stats.total)}</h3>
                            </div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-icon-wrapper primary">
                                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            </div>
                            <div className="kpi-info">
                                <span className="kpi-label">Tranzaksiyalar soni</span>
                                <h3 className="kpi-value">{stats.count} ta</h3>
                            </div>
                        </div>
                        <div className="kpi-card">
                            <div className="kpi-icon-wrapper info">
                                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            </div>
                            <div className="kpi-info">
                                <span className="kpi-label">O'rtacha chiqim</span>
                                <h3 className="kpi-value">{formatCurrency(Math.round(stats.avg))}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="expenses-main" style={{ minHeight: 'calc(100vh - 180px)', border: '1px solid var(--filter-border)', borderRadius: '24px', overflow: 'hidden', background: 'var(--bg-primary)', boxShadow: 'var(--filter-shadow)' }}>
                        <div className="main-header" style={{ padding: '24px', borderBottom: '1px solid var(--filter-border)' }}>
                            <div className="filters-container" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                <div className="search-box" style={{ flex: 1, minWidth: '200px' }}>
                                    <SearchIcon />
                                    <input
                                        type="text"
                                        placeholder="Qidirish..."
                                        value={search}
                                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                    />
                                </div>
                                <select className="filter-select" value={buildingFilter} onChange={(e) => { setBuildingFilter(e.target.value); setPage(1); }}>
                                    <option value="">Barcha binolar</option>
                                    {Array.isArray(buildings) && buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                                <select className="filter-select" value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
                                    <option value="">Kategoriya</option>
                                    {Array.isArray(categories) && categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <select className="filter-select" value={paymentMethodFilter} onChange={(e) => { setPaymentMethodFilter(e.target.value); setPage(1); }}>
                                    <option value="">Barcha to'lov turlari</option>
                                    <option value="cash">Naqd pul</option>
                                    <option value="bank">Bank/Karta</option>
                                </select>
                            </div>
                        </div>

                        <div className="main-content" style={{ padding: '24px' }}>
                            {loading ? (
                                <div className="empty-placeholder">Yuklanmoqda...</div>
                            ) : expenses.length === 0 ? (
                                <div className="empty-placeholder">
                                    <SearchIcon />
                                    <h3>Xarajatlar topilmadi</h3>
                                    <p>Tanlangan filtrlar bo'yicha ma'lumot yo'q</p>
                                </div>
                            ) : (
                                <div className="incomes-table-container" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--filter-border)' }}>
                                    <table className="incomes-table">
                                        <thead>
                                            <tr>
                                                <th>Sana</th>
                                                <th>Bino</th>
                                                <th>Kategoriya</th>
                                                <th>Tavsif</th>
                                                <th>To'lov turi</th>
                                                <th>Summa</th>
                                                <th style={{textAlign: 'right'}}>Amallar</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                             {expenses.map(item => (
                                                <tr key={item.id} onClick={() => openModal('edit', item)} style={{ cursor: 'pointer' }}>
                                                    <td>{item.date}</td>
                                                    <td style={{fontWeight: 600}}>{item.building_name}</td>
                                                    <td>
                                                        <span className={`category-badge ${item.category_color}`}>
                                                            {item.category_name}
                                                        </span>
                                                    </td>
                                                    <td>{item.description}</td>
                                                    <td>
                                                        {item.payment_method === 'cash' ? (
                                                            <span className="category-badge border-emerald-500/30 text-emerald-400 bg-emerald-500/20">Naqd</span>
                                                        ) : item.payment_method === 'bank' ? (
                                                            <span className="category-badge border-blue-500/30 text-blue-400 bg-blue-500/20">Bank/Karta</span>
                                                        ) : (
                                                            <span className="text-slate-500">-</span>
                                                        )}
                                                    </td>
                                                    <td style={{fontWeight: 700, color: '#ef4444'}}>
                                                        {new Intl.NumberFormat('uz-UZ').format(item.amount)} so'm
                                                    </td>
                                                    <td style={{textAlign: 'right'}} onClick={(e) => e.stopPropagation()}>
                                                        <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end'}}>
                                                            <button className="btn-icon" style={{color: '#6366f1'}} onClick={() => openModal('edit', item)}><EditIcon /></button>
                                                            <button className="btn-icon" style={{color: '#ef4444'}} onClick={() => openModal('delete', item)}><TrashIcon /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                             ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {totalPages > 1 && (
                                <div style={{display: 'flex', justifyContent: 'center', marginTop: '24px', gap: '12px', alignItems: 'center'}}>
                                    <button 
                                        className="btn-secondary" 
                                        disabled={page === 1}
                                        onClick={() => setPage(prev => prev - 1)}
                                    >
                                        <ChevronLeftIcon />
                                    </button>
                                    <span style={{fontSize: '14px', fontWeight: 600}}>
                                        {page} / {totalPages}
                                    </span>
                                    <button 
                                        className="btn-secondary" 
                                        disabled={page === totalPages}
                                        onClick={() => setPage(prev => prev + 1)}
                                    >
                                        <ChevronRightIcon />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DateRangeFilter 
                    onFilter={(range) => {
                        setDateRange(range);
                        setPage(1);
                    }}
                    initialRange={dateRange}
                />
            </div>

            {/* Create/Edit Modal */}
            {modal.open && (modal.type === 'create' || modal.type === 'edit') && createPortal(
                <div className={`modal-overlay ${modalClosing ? 'closing' : ''}`} onClick={closeModal}>
                    <div className="modal-content modal-form" style={{maxWidth: '600px', width: '90%'}} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{modal.type === 'edit' ? 'Xarajatni tahrirlash' : 'Yangi xarajat'}</h3>
                            <button className="modal-close" onClick={closeModal}><CloseIcon /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{padding: '24px'}}>
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
                                <div className="form-group">
                                    <label>Bino *</label>
                                    <select value={formData.building} onChange={(e) => setFormData({...formData, building: e.target.value})} className="filter-select" style={{width: '100%'}}>
                                        <option value="">Tanlang</option>
                                        {Array.isArray(buildings) && buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Kategoriya *</label>
                                    <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="filter-select" style={{width: '100%'}}>
                                        <option value="">Tanlang</option>
                                        {Array.isArray(categories) && categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group" style={{marginBottom: '16px'}}>
                                <label>Tavsif *</label>
                                <input type="text" className="filter-input" style={{width: '100%'}} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Xarajat tavsifi..." />
                            </div>
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
                                <div className="form-group">
                                    <label>Summa *</label>
                                    <input type="text" className="filter-input" style={{width: '100%'}} value={formData.amount ? new Intl.NumberFormat('uz-UZ').format(formData.amount.toString().replace(/ /g, '')) : ''} onChange={(e) => setFormData({...formData, amount: e.target.value.replace(/\D/g, '')})} />
                                </div>
                                <div className="form-group">
                                    <label>Sana</label>
                                    <input type="date" className="filter-input" style={{width: '100%'}} value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                                </div>
                            </div>
                             <div className="form-group" style={{marginBottom: '16px'}}>
                                <label>To'lov turi</label>
                                <select value={formData.payment_method} onChange={(e) => setFormData({...formData, payment_method: e.target.value})} className="filter-select" style={{width: '100%'}}>
                                    <option value="">Tanlanmagan</option>
                                    <option value="cash">Naqd pul</option>
                                    <option value="bank">Bank hisobi/Karta</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Izoh</label>
                                <textarea className="filter-input" style={{width: '100%', height: '80px', paddingTop: '10px'}} value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} />
                            </div>
                            <div className="modal-actions" style={{marginTop: '24px', padding: 0}}>
                                <button type="button" className="btn-secondary" onClick={closeModal}>Bekor qilish</button>
                                <button type="submit" className="btn-primary" disabled={saving}><SaveIcon /><span>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</span></button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Confirmation */}
            {modal.open && modal.type === 'delete' && createPortal(
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" style={{maxWidth: '400px', textAlign: 'center', padding: '32px'}} onClick={e => e.stopPropagation()}>
                        <div style={{color: '#ef4444', marginBottom: '16px'}}><TrashIcon style={{width: '48px', height: '48px'}} /></div>
                        <h3>O'chirmoqchimisiz?</h3>
                        <p style={{color: 'var(--text-secondary)', marginBottom: '24px'}}>Ushbu xarajat yozuvi butunlay o'chiriladi.</p>
                        <div className="modal-actions" style={{justifyContent: 'center', padding: 0}}>
                            <button className="btn-secondary" onClick={closeModal}>Yo'q</button>
                            <button className="btn-danger" onClick={handleDelete} disabled={saving}>Ha, o'chirilsin</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ExpensesList;
