import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import incomesService from '../../services/incomes';
import * as buildingsService from '../../services/buildings';
import { getFinanceUsers } from '../../services/users';
import { toast } from 'sonner';
import './Incomes.css';

// Reusable Icons
const PlusIcon = () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const SearchIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const TrashIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const CloseIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const SaveIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>;
const WalletIcon = () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path><path d="M18 12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4"></path></svg>;
const BankIcon = () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>;
const UserIcon = () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const ChevronLeftIcon = () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>;
const ChevronRightIcon = () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;

const AVAILABLE_ICONS = [
    { name: 'WalletIcon', icon: WalletIcon },
    { name: 'PlusIcon', icon: PlusIcon },
    { name: 'BankIcon', icon: BankIcon },
    { name: 'UserIcon', icon: UserIcon },
];

const AVAILABLE_COLORS = [
    { name: 'emerald', hex: '#10b981', class: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
    { name: 'blue', hex: '#3b82f6', class: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
    { name: 'amber', hex: '#f59e0b', class: 'text-amber-400 bg-amber-500/20 border-amber-500/30' },
    { name: 'purple', hex: '#a855f7', class: 'text-purple-400 bg-purple-500/20 border-purple-500/30' },
    { name: 'slate', hex: '#64748b', class: 'text-slate-400 bg-slate-500/20 border-slate-500/30' },
];

const IncomeCategoryDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [category, setCategory] = useState(null);
    const [buildings, setBuildings] = useState([]);
    const [users, setUsers] = useState([]);
    
    // Filters
    const [search, setSearch] = useState('');
    const [buildingFilter, setBuildingFilter] = useState('');
    const [userFilter, setUserFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // Incomes state
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, count: 0, avg: 0 });
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const pageSize = 15;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        icon: 'WalletIcon',
        color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
        order: 0,
        is_active: true
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setPage(1);
        loadBaseData();
    }, [id]);

    useEffect(() => {
        loadIncomesData();
    }, [id, page, search, buildingFilter, userFilter, startDate, endDate]);

    const loadBaseData = async () => {
        try {
            const [catData, buildingsRes, usersRes] = await Promise.all([
                incomesService.getCategory(id),
                buildingsService.getAllBuildings(),
                getFinanceUsers()
            ]);
            setCategory(catData);
            setFormData({
                name: catData.name,
                slug: catData.slug,
                icon: catData.icon || 'WalletIcon',
                color: catData.color || 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
                order: catData.order || 0,
                is_active: catData.is_active ?? true
            });

            const bData = buildingsRes.results || buildingsRes;
            setBuildings(Array.isArray(bData) ? bData.filter(b => !b.is_archived) : []);
            setUsers(usersRes.data || []);
        } catch (error) {
            toast.error("Boshlang'ich ma'lumotlarni yuklashda xatolik");
        }
    };

    const loadIncomesData = async () => {
        try {
            setLoading(true);
            const filterParams = {
                category_id: id,
                building_id: buildingFilter || undefined,
                user: userFilter || undefined,
                search: search || undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined
            };
            const pageParams = { ...filterParams, page: page, page_size: pageSize };

            const [incomesData, statsData] = await Promise.all([
                incomesService.getIncomes(pageParams),
                incomesService.getStatistics(filterParams)
            ]);

            setIncomes(incomesData.results || incomesData);
            // Tranzaksiyalar soni = backend-dan kelgan umumiy count (barcha sahifalar uchun)
            setStats(prev => ({ ...statsData, count: incomesData.count || 0 }));

            const count = incomesData.count || (incomesData.results ? incomesData.results.length : incomesData.length) || 0;
            setTotalCount(count);
        } catch (error) {
            if (error.response && error.response.status === 404 && page > 1) {
                setPage(1);
                return;
            }
            toast.error("Kirim ma'lumotlarini yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await incomesService.updateCategory(id, formData);
            toast.success("Kategoriya muvaffaqiyatli yangilandi");
            navigate('/incomes/categories');
        } catch {
            toast.error("Yangilashda xatolik yuz berdi");
        } finally {
            setSaving(false);
        }
    };

    const handleCategoryDelete = async () => {
        if (!window.confirm("Haqiqatan ham ushbu kategoriyani o'chirmoqchimisiz?")) return;
        try {
            setSaving(true);
            await incomesService.deleteCategory(id);
            toast.success("Kategoriya o'chirildi");
            navigate('/incomes/categories');
        } catch {
            toast.error("Ushbu kategoriyada kirim yozuvlari bor bo'lishi mumkin");
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('uz-UZ').format(amount || 0) + " so'm";
    };

    const getIconComponent = (iconName) => {
        const iconObj = AVAILABLE_ICONS.find(i => i.name === iconName);
        if (iconObj) return <iconObj.icon />;
        return <WalletIcon />;
    };

    if (!category) {
        return <div className="incomes-page"><div className="empty-placeholder">Yuklanmoqda...</div></div>;
    }

    return (
        <div className="incomes-page">
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div className="header-left">
                    <button className="btn-secondary" style={{ padding: '8px 12px' }} onClick={() => navigate('/incomes/categories')}>
                        <ChevronLeftIcon /> Orqaga
                    </button>
                    <div>
                        <h1 className="page-title">{category.name}</h1>
                        <p className="page-subtitle">Kategoriyani tahrirlash va tushumlar tahlili</p>
                    </div>
                </div>
            </div>

            <div className="layout-with-sidebar" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
                {/* Form Card */}
                <div className="incomes-main" style={{ minHeight: 'auto', border: '1px solid var(--filter-border)', borderRadius: '20px', background: 'var(--bg-primary)', boxShadow: 'var(--filter-shadow)', padding: '24px' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 700 }}>Tahrirlash</h3>
                    <form onSubmit={handleFormSubmit}>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label>Nomi *</label>
                            <input 
                                type="text" 
                                className="filter-input" style={{ width: '100%', boxSizing: 'border-box' }}
                                value={formData.name}
                                onChange={(e) => {
                                    const name = e.target.value;
                                    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
                                    setFormData(prev => ({ ...prev, name, slug }));
                                }}
                                required
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label>Slug</label>
                            <input 
                                type="text" 
                                className="filter-input" style={{ width: '100%', boxSizing: 'border-box' }}
                                value={formData.slug}
                                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label>Tartib</label>
                            <input 
                                type="number" 
                                className="filter-input" style={{ width: '100%', boxSizing: 'border-box' }}
                                value={formData.order}
                                onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label>Belgi (Icon)</label>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                                {AVAILABLE_ICONS.map(i => (
                                    <button 
                                        key={i.name} type="button" 
                                        className={`category-badge ${formData.icon === i.name ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40' : 'text-slate-400'}`}
                                        style={{ padding: '8px', borderRadius: '8px', cursor: 'pointer', border: formData.icon === i.name ? '2px solid' : '1px solid transparent' }}
                                        onClick={() => setFormData({ ...formData, icon: i.name })}
                                    >
                                        {getIconComponent(i.name)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label>Rang (Color)</label>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                {AVAILABLE_COLORS.map(c => (
                                    <button 
                                        key={c.name} type="button" 
                                        style={{ backgroundColor: c.hex, width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', border: formData.color === c.class ? '3px solid white' : 'none', boxShadow: formData.color === c.class ? '0 0 0 2px #10b981' : 'none' }}
                                        onClick={() => setFormData({ ...formData, color: c.class })}
                                    />
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                                <span style={{ fontSize: '14px', fontWeight: 500 }}>Faol kategoriya</span>
                            </label>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={saving}>
                                <SaveIcon /> Saqlash
                            </button>
                            <button type="button" className="btn-secondary" style={{ width: '100%', justifyContent: 'center', color: '#ef4444', border: '1px solid #ef4444' }} onClick={handleCategoryDelete} disabled={saving}>
                                <TrashIcon /> O'chirish
                            </button>
                        </div>
                    </form>
                </div>

                {/* KPI Grid & List area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* KPI cards */}
                    <div className="kpi-grid" style={{ gap: '16px' }}>
                        <div className="kpi-card" style={{ padding: '16px' }}>
                            <div className="kpi-icon-wrapper success"><WalletIcon /></div>
                            <div className="kpi-info">
                                <span className="kpi-label">Jami Kirim</span>
                                <h3 className="kpi-value" style={{ fontSize: '20px' }}>{formatCurrency(stats.total)}</h3>
                            </div>
                        </div>
                        <div className="kpi-card" style={{ padding: '16px' }}>
                            <div className="kpi-icon-wrapper primary">
                                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            </div>
                            <div className="kpi-info">
                                <span className="kpi-label">Tranzaksiyalar soni</span>
                                <h3 className="kpi-value" style={{ fontSize: '20px' }}>{stats.count} ta</h3>
                            </div>
                        </div>
                        <div className="kpi-card" style={{ padding: '16px' }}>
                            <div className="kpi-icon-wrapper info">
                                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            </div>
                            <div className="kpi-info">
                                <span className="kpi-label">O'rtacha kirim</span>
                                <h3 className="kpi-value" style={{ fontSize: '20px' }}>{formatCurrency(Math.round(stats.avg))}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Table Card */}
                    <div className="incomes-main" style={{ border: '1px solid var(--filter-border)', borderRadius: '20px', overflow: 'hidden', background: 'var(--bg-primary)', boxShadow: 'var(--filter-shadow)' }}>
                        
                        {/* Filters Bar */}
                        <div className="main-header" style={{ padding: '16px 24px', borderBottom: '1px solid var(--filter-border)' }}>
                            <div className="filters-container" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
                                <div className="search-box" style={{ flex: 1, minWidth: '180px' }}>
                                    <SearchIcon />
                                    <input
                                        type="text"
                                        placeholder="Tavsif yoki payer bo'yicha qidirish..."
                                        value={search}
                                        onChange={(e) => { setSearch(e.target.value); setPagination(prev => ({...prev, page: 1})); }}
                                    />
                                </div>
                                <select className="filter-select" value={buildingFilter} onChange={(e) => { setBuildingFilter(e.target.value); setPagination(prev => ({...prev, page: 1})); }}>
                                    <option value="">Barcha binolar</option>
                                    {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                                <select className="filter-select" value={userFilter} onChange={(e) => { setUserFilter(e.target.value); setPagination(prev => ({...prev, page: 1})); }}>
                                    <option value="">Foydalanuvchi</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.name || u.username || u.first_name || 'Foydalanuvchi'}
                                        </option>
                                    ))}
                                </select>
                                <input type="date" className="filter-select" style={{ width: 'auto' }} value={startDate} onChange={e => { setStartDate(e.target.value); setPagination(prev => ({...prev, page: 1})); }} title="Dan" />
                                <input type="date" className="filter-select" style={{ width: 'auto' }} value={endDate} onChange={e => { setEndDate(e.target.value); setPagination(prev => ({...prev, page: 1})); }} title="Gacha" />
                                {(search || buildingFilter || userFilter || startDate || endDate) && (
                                    <button className="btn-secondary" style={{ padding: '8px 12px' }} onClick={() => { setSearch(''); setBuildingFilter(''); setUserFilter(''); setStartDate(''); setEndDate(''); }}>
                                        Tozalash
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* List Content */}
                        <div className="main-content" style={{ padding: '20px' }}>
                            {loading ? (
                                <div className="empty-placeholder">Yuklanmoqda...</div>
                            ) : incomes.length === 0 ? (
                                <div className="empty-placeholder">
                                    <WalletIcon />
                                    <h3>Kirimlar topilmadi</h3>
                                    <p>Ushbu kategoriya va filtrlar bo'yicha kirim yozuvlari yo'q</p>
                                </div>
                            ) : (
                                <div className="incomes-table-container" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--filter-border)' }}>
                                    <table className="incomes-table">
                                        <thead>
                                            <tr>
                                                <th>Sana</th>
                                                <th>Bino</th>
                                                <th>Tavsif</th>
                                                <th>Payer</th>
                                                <th>Summa</th>
                                                <th>Kim tomonidan</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {incomes.map(item => (
                                                <tr key={item.id}>
                                                    <td>{item.date}</td>
                                                    <td style={{ fontWeight: 600 }}>{item.building_name}</td>
                                                    <td>{item.description}</td>
                                                    <td>
                                                        <div>{item.payer_name || '-'}</div>
                                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.payer_phone || ''}</div>
                                                    </td>
                                                    <td style={{ fontWeight: 700, color: '#10b981' }}>
                                                        {formatCurrency(item.amount)}
                                                    </td>
                                                    <td>{item.created_by_name || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '12px', alignItems: 'center' }}>
                                    <button 
                                        className="btn-secondary" 
                                        disabled={page === 1}
                                        onClick={() => setPage(prev => prev - 1)}
                                    >
                                        <ChevronLeftIcon />
                                    </button>
                                    <span style={{ fontSize: '14px', fontWeight: 600 }}>
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
            </div>
        </div>
    );
};

export default IncomeCategoryDetails;
