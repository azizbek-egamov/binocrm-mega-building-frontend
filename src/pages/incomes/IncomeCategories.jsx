import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import incomesService from '../../services/incomes';
import { toast } from 'sonner';
import './Incomes.css';

// Reusable Icons
const PlusIcon = () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const SearchIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const TrashIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const EditIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const CloseIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const SaveIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>;
const WalletIcon = () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path><path d="M18 12a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4"></path></svg>;
const BankIcon = () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>;
const UserIcon = () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;

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

const IncomeCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [modal, setModal] = useState({ open: false, type: null, category: null });
    const [modalClosing, setModalClosing] = useState(false);
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
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const data = await incomesService.getCategories();
            setCategories(data.results || data);
        } catch (error) {
            toast.error("Kategoriyalarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            slug: '',
            icon: 'WalletIcon',
            color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
            order: 0,
            is_active: true
        });
    };

    const openCreateModal = () => {
        resetForm();
        setModal({ open: true, type: 'create', category: null });
    };

    const openEditModal = (category) => {
        setFormData({
            name: category.name,
            slug: category.slug,
            icon: category.icon,
            color: category.color,
            order: category.order,
            is_active: category.is_active
        });
        setModal({ open: true, type: 'edit', category });
    };

    const openDeleteModal = (category) => {
        setModal({ open: true, type: 'delete', category });
    };

    const closeModal = () => {
        setModalClosing(true);
        setTimeout(() => {
            setModal({ open: false, type: null, category: null });
            setModalClosing(false);
            resetForm();
        }, 250);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.slug) {
            toast.error("Nom va Slug kiritilishi shart");
            return;
        }

        try {
            setSaving(true);
            if (modal.type === 'edit') {
                await incomesService.updateCategory(modal.category.id, formData);
                toast.success("Kategoriya yangilandi");
            } else {
                await incomesService.createCategory(formData);
                toast.success("Kategoriya yaratildi");
            }
            closeModal();
            loadCategories();
        } catch {
            toast.error("Saqlashda xatolik");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!modal.category) return;
        try {
            setSaving(true);
            await incomesService.deleteCategory(modal.category.id);
            toast.success("Kategoriya o'chirildi");
            closeModal();
            loadCategories();
        } catch {
            toast.error("O'chirishda xatolik");
        } finally {
            setSaving(false);
        }
    };

    const getIconComponent = (iconName) => {
        const iconObj = AVAILABLE_ICONS.find(i => i.name === iconName);
        if (iconObj) return <iconObj.icon />;
        return <WalletIcon />;
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="incomes-page">
            <div className="page-header">
                <div className="header-left">
                    <h1 className="page-title">Kirim kategoriyalari</h1>
                    <p className="page-subtitle">Pul tushumlari turlarini boshqarish</p>
                </div>
                <div className="header-actions">
                    <button className="btn-primary" onClick={openCreateModal}>
                        <PlusIcon />
                        <span>Kategoriya qo'shish</span>
                    </button>
                </div>
            </div>

            <div className="incomes-main">
                <div className="main-header">
                    <div className="search-box" style={{maxWidth: '300px'}}>
                        <SearchIcon />
                        <input
                            type="text"
                            placeholder="Kategoriyani qidirish..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="main-content">
                    {loading ? (
                        <div className="empty-placeholder">
                            <div className="btn-spinner" style={{width: '40px', height: '40px', borderTopColor: 'var(--primary-color)'}}></div>
                            <p style={{marginTop: '16px'}}>Ma'lumotlar yuklanmoqda...</p>
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="empty-placeholder">
                            <WalletIcon style={{width: '80px', height: '80px', marginBottom: '24px'}} />
                            <h4>Kategoriyalar topilmadi</h4>
                            <p>Tanlangan filtrlar bo'yicha ma'lumot yo'q</p>
                        </div>
                    ) : (
                        <div className="incomes-table-container">
                            <table className="incomes-table">
                                <thead>
                                    <tr>
                                        <th style={{width: '60px'}}>Belgi</th>
                                        <th>Nomi</th>
                                        <th>Slug</th>
                                        <th>Tartib</th>
                                        <th>Status</th>
                                        <th style={{textAlign: 'right'}}>Amallar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(filteredCategories) && filteredCategories.map(item => (
                                        <tr key={item.id} onClick={() => openEditModal(item)} style={{cursor: 'pointer'}}>
                                            <td>
                                                <div className={`category-badge ${item.color}`} style={{padding: '8px', borderRadius: '10px'}}>
                                                    {getIconComponent(item.icon)}
                                                </div>
                                            </td>
                                            <td style={{fontWeight: 600}}>{item.name}</td>
                                            <td>{item.slug}</td>
                                            <td>{item.order}</td>
                                            <td>
                                                <span className={`category-badge ${item.is_active ? 'text-emerald-400 bg-emerald-500/20' : 'text-slate-400 bg-slate-500/20'}`}>
                                                    {item.is_active ? 'Faol' : 'Nofaol'}
                                                </span>
                                            </td>
                                            <td style={{textAlign: 'right'}}>
                                                <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end'}} onClick={e => e.stopPropagation()}>
                                                    <button className="btn-icon" style={{color: '#6366f1'}} onClick={() => openEditModal(item)}><EditIcon /></button>
                                                    <button className="btn-icon" style={{color: '#ef4444'}} onClick={() => openDeleteModal(item)}><TrashIcon /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals similar to IncomesList but for Category */}
             {modal.open && (modal.type === 'create' || modal.type === 'edit') && createPortal(
                <div className={`modal-overlay ${modalClosing ? 'closing' : ''}`} onClick={closeModal}>
                    <div className="modal-content modal-form" style={{maxWidth: '500px', width: '90%'}} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{modal.type === 'edit' ? 'Tahrirlash' : 'Yangi kategoriya'}</h3>
                            <button className="modal-close" onClick={closeModal}><CloseIcon /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{padding: '24px'}}>
                            <div className="form-group" style={{marginBottom: '16px'}}>
                                <label>Kategoriya nomi *</label>
                                <input 
                                    type="text" 
                                    className="filter-input" style={{width: '100%'}}
                                    value={formData.name}
                                    onChange={(e) => {
                                        const name = e.target.value;
                                        const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
                                        setFormData(prev => ({ ...prev, name, slug }));
                                    }}
                                    required
                                />
                            </div>

                            <div className="form-group" style={{marginBottom: '16px'}}>
                                <label>Belgi (Icon)</label>
                                <div style={{display: 'flex', gap: '10px', marginTop: '8px'}}>
                                    {AVAILABLE_ICONS.map(i => (
                                        <button 
                                            key={i.name} type="button" 
                                            className={`category-badge ${formData.icon === i.name ? 'text-emerald-400 bg-emerald-500/20 border- emerald-500/40' : 'text-slate-400'}`}
                                            style={{padding: '10px', borderRadius: '10px', cursor: 'pointer', border: formData.icon === i.name ? '2px solid' : '1px solid transparent'}}
                                            onClick={() => setFormData({...formData, icon: i.name})}
                                        >
                                            {getIconComponent(i.name)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                             <div className="form-group" style={{marginBottom: '16px'}}>
                                <label>Rang (Color)</label>
                                <div style={{display: 'flex', gap: '10px', marginTop: '8px'}}>
                                    {AVAILABLE_COLORS.map(c => (
                                        <button 
                                            key={c.name} type="button" 
                                            className="color-picker-item"
                                            style={{backgroundColor: c.hex, width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', border: formData.color === c.class ? '3px solid white' : 'none', boxShadow: formData.color === c.class ? '0 0 0 2px #10b981' : 'none'}}
                                            onClick={() => setFormData({...formData, color: c.class})}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
                                <div className="form-group">
                                    <label>Slug</label>
                                    <input type="text" className="filter-input" style={{width: '100%'}} value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Tartib</label>
                                    <input type="number" className="filter-input" style={{width: '100%'}} value={formData.order} onChange={e => setFormData({...formData, order: e.target.value})} />
                                </div>
                            </div>

                            <div style={{marginTop: '16px'}}>
                                <label style={{display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer'}}>
                                    <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                                    <span>Faol kategoriya</span>
                                </label>
                            </div>

                            <div className="modal-actions" style={{marginTop: '24px', padding: 0}}>
                                <button type="button" className="btn-secondary" onClick={closeModal}>Bekor qilish</button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    <SaveIcon />
                                    <span>{saving ? 'Saqlanmoqda...' : 'Saqlash'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {modal.open && modal.type === 'delete' && createPortal(
                <div className={`modal-overlay ${modalClosing ? 'closing' : ''}`} onClick={closeModal}>
                    <div className="modal-content" style={{maxWidth: '400px'}} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Kategoriyani o'chirish</h3>
                            <button className="modal-close" onClick={closeModal}><CloseIcon /></button>
                        </div>
                        <div style={{padding: '24px'}}>
                            <p style={{margin: '0 0 16px 0', color: 'var(--text-secondary)'}}>
                                Haqiqatan ham <strong>{modal.category?.name}</strong> kategoriyasini o'chirmoqchimisiz?
                            </p>
                            <p style={{margin: 0, color: '#ef4444', fontSize: '14px', fontWeight: 500}}>
                                Diqqat: Bu amalni bekor qilib bo'lmaydi!
                            </p>
                            
                            <div className="modal-actions" style={{marginTop: '24px', padding: 0}}>
                                <button type="button" className="btn-secondary" onClick={closeModal}>Bekor qilish</button>
                                <button type="button" className="btn-primary" style={{background: '#ef4444', border: 'none', boxShadow: 'none'}} onClick={handleDelete} disabled={saving}>
                                    <TrashIcon />
                                    <span>{saving ? "O'chirilmoqda..." : "O'chirish"}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default IncomeCategories;
