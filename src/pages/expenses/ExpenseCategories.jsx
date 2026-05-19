import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import expensesService from '../../services/expenses';
import { toast } from 'sonner';
import './Expenses.css';
import {
    PlusIcon,
    SearchIcon,
    EditIcon,
    TrashIcon,
    SaveIcon,
    CloseIcon,
    EmptyIcon,
    WalletIcon,
    CalendarIcon,
    ImageIcon,
    InfoIcon,
} from './ExpenseIcons';

const AVAILABLE_ICONS = [
    { name: 'WalletIcon', icon: WalletIcon },
    { name: 'PlusIcon', icon: PlusIcon },
    { name: 'SearchIcon', icon: SearchIcon },
    { name: 'CalendarIcon', icon: CalendarIcon },
    { name: 'ImageIcon', icon: ImageIcon },
    { name: 'InfoIcon', icon: InfoIcon },
];

const AVAILABLE_COLORS = [
    { name: 'blue', hex: '#3b82f6', class: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
    { name: 'green', hex: '#22c55e', class: 'text-green-400 bg-green-500/20 border-green-500/30' },
    { name: 'red', hex: '#ef4444', class: 'text-red-400 bg-red-500/20 border-red-500/30' },
    { name: 'amber', hex: '#f59e0b', class: 'text-amber-400 bg-amber-500/20 border-amber-500/30' },
    { name: 'purple', hex: '#a855f7', class: 'text-purple-400 bg-purple-500/20 border-purple-500/30' },
    { name: 'emerald', hex: '#10b981', class: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
    { name: 'pink', hex: '#ec4899', class: 'text-pink-400 bg-pink-500/20 border-pink-500/30' },
    { name: 'cyan', hex: '#06b6d4', class: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30' },
    { name: 'slate', hex: '#64748b', class: 'text-slate-400 bg-slate-500/20 border-slate-500/30' },
];

const ExpenseCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [modal, setModal] = useState({ open: false, type: null, category: null });
    const [modalClosing, setModalClosing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        icon: 'WalletIcon',
        color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
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
            const data = await expensesService.getCategories();
            setCategories(data.results || data);
        } catch (error) {
            console.error(error);
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
            color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
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
                await expensesService.updateCategory(modal.category.id, formData);
                toast.success("Kategoriya yangilandi");
            } else {
                await expensesService.createCategory(formData);
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
            await expensesService.deleteCategory(modal.category.id);
            toast.success("Kategoriya o'chirildi");
            closeModal();
            loadCategories();
        } catch {
            toast.error("Ushbu kategoriyada xarajatlar bor bo'lishi mumkin");
        } finally {
            setSaving(false);
        }
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    const getIconComponent = (iconName) => {
        const iconObj = AVAILABLE_ICONS.find(i => i.name === iconName);
        if (iconObj) return <iconObj.icon />;
        return <WalletIcon />;
    };

    return (
        <div className="clients-page">
            <div className="page-header">
                <div className="header-left">
                    <h1 className="page-title">Chiqim kategoriyalari</h1>
                    <p className="page-subtitle">Xarajat turlarini boshqarish</p>
                </div>
                <div className="header-actions">
                    <button className="btn-primary" onClick={openCreateModal}>
                        <PlusIcon />
                        <span>Kategoriya qo'shish</span>
                    </button>
                </div>
            </div>

            <div className="page-content">
                <div className="content-card">
                    <div className="card-header">
                        <div className="filters-container">
                            <div className="search-box">
                                <SearchIcon />
                                <input
                                    type="text"
                                    placeholder="Kategoriyani qidirish..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="results-count">
                                Jami: <strong>{categories.length}</strong> ta kategoriya
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Yuklanmoqda...</p>
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="empty-state">
                            <EmptyIcon />
                            <h3>Kategoriyalar topilmadi</h3>
                            <button className="btn-primary" onClick={openCreateModal}>
                                <PlusIcon style={{ width: 18, height: 18 }} />
                                <span>Kategoriya qo'shish</span>
                            </button>
                        </div>
                    ) : (
                        <div className="responsive-table">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '60px' }}>Belgi</th>
                                        <th>Nomi</th>
                                        <th>Slug</th>
                                        <th style={{ width: '100px' }}>Tartib</th>
                                        <th style={{ width: '120px' }}>Status</th>
                                        <th style={{ width: '100px', textAlign: 'right' }}>Amallar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCategories.map((category) => (
                                        <tr key={category.id} onClick={() => openEditModal(category)} style={{ cursor: 'pointer' }}>
                                            <td>
                                                <div className={`category-icon-box small ${category.color}`}>
                                                    {getIconComponent(category.icon)}
                                                </div>
                                            </td>
                                            <td className="cell-name">
                                                <span style={{ fontWeight: 600 }}>{category.name}</span>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)' }}>
                                                {category.slug}
                                            </td>
                                            <td>
                                                {category.order}
                                            </td>
                                            <td>
                                                <span className={`status-badge ${category.is_active ? 'active' : 'inactive'}`}>
                                                    {category.is_active ? 'Faol' : 'Nofaol'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="cell-actions" style={{ justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                                                    <div className="table-actions">
                                                        <button className="btn-icon btn-edit" title="Tahrirlash" onClick={() => openEditModal(category)}>
                                                            <EditIcon />
                                                        </button>
                                                        <button className="btn-icon btn-delete" title="O'chirish" onClick={() => openDeleteModal(category)}>
                                                            <TrashIcon />
                                                        </button>
                                                    </div>
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

            {/* Create/Edit Modal */}
            {modal.open && (modal.type === 'create' || modal.type === 'edit') && createPortal(
                <div className={`modal-overlay ${modalClosing ? 'closing' : ''}`} onClick={closeModal}>
                    <div className={`modal-content modal-form ${modalClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{modal.type === 'edit' ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}</h3>
                            <button className="modal-close" onClick={closeModal}>
                                <CloseIcon />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-form-body">
                                <div className="form-group">
                                    <label htmlFor="name" className="required">Kategoriya nomi</label>
                                    <input
                                        type="text"
                                        id="name"
                                        placeholder="Masalan: Qurilish mollari"
                                        value={formData.name}
                                        onChange={(e) => {
                                            const name = e.target.value;
                                            const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
                                            setFormData(prev => ({ ...prev, name, slug }));
                                        }}
                                        required
                                    />
                                </div>

                                <div className="form-details-box">
                                    <div className="form-group">
                                        <label>Belgi (Icon)</label>
                                        <div className="icon-picker-grid">
                                            {AVAILABLE_ICONS.map(({ name }) => (
                                                <button
                                                    key={name}
                                                    type="button"
                                                    className={`icon-picker-item ${formData.icon === name ? `active ${formData.color}` : ''}`}
                                                    onClick={() => setFormData(prev => ({ ...prev, icon: name }))}
                                                    title={name}
                                                >
                                                    {getIconComponent(name)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Rang (Color)</label>
                                        <div className="color-picker-grid">
                                            {AVAILABLE_COLORS.map((colorObj) => (
                                                <button
                                                    key={colorObj.name}
                                                    type="button"
                                                    className={`color-picker-item ${formData.color === colorObj.class ? 'active' : ''}`}
                                                    style={{ backgroundColor: colorObj.hex }}
                                                    onClick={() => setFormData(prev => ({ ...prev, color: colorObj.class }))}
                                                    title={colorObj.name}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="slug" className="required">Slug (avtomatik)</label>
                                        <input
                                            type="text"
                                            id="slug"
                                            value={formData.slug}
                                            onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="order">Tartib</label>
                                        <input
                                            type="number"
                                            id="order"
                                            value={formData.order}
                                            onChange={(e) => setFormData(prev => ({ ...prev, order: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="checkbox-toggle">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                                    />
                                    <label htmlFor="is_active">Faol kategoriya</label>
                                </div>

                            </div>
                            <div className="modal-actions">
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

            {/* Delete Modal */}
            {modal.open && modal.type === 'delete' && createPortal(
                <div className={`modal-overlay ${modalClosing ? 'closing' : ''}`} onClick={closeModal}>
                    <div className={`modal-content ${modalClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Kategoriyani o'chirish</h3>
                            <button className="modal-close" onClick={closeModal}>
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
                            <div className="modal-icon danger" style={{ margin: '0 auto 20px', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <TrashIcon />
                            </div>
                            <p style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                                <strong>{modal.category?.name}</strong> kategoriyasini o'chirishni xohlaysizmi?
                            </p>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                                Bu kategoriya ostidagi xarajatlar mavjud bo'lsa o'chirish imkonsiz bo'lishi mumkin.
                            </p>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={closeModal}>Bekor qilish</button>
                            <button className="btn-danger" onClick={handleDelete} disabled={saving}>
                                <TrashIcon />
                                <span>{saving ? 'O\'chirilmoqda...' : 'O\'chirish'}</span>
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ExpenseCategories;
