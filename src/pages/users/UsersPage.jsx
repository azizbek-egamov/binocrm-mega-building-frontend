import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { getUsers, createUser, updateUser, deleteUser } from '../../services/users';
import expensesService from '../../services/expenses';
import {
    SearchIcon,
    EditIcon,
    TrashIcon,
    PlusIcon,
    CloseIcon,
    SaveIcon
} from '../clients/ClientIcons';
import './UsersPage.css';

/**
 * 3 ta foydalanuvchi turi:
 *   SUPERUSER  — is_superuser=True   | faqat superuserlar ko'radi/yaratadi
 *   QURILISH   — is_staff=True       | faqat superuserlar ko'radi/yaratadi
 *   XODIM      — is_staff=False      | can_view_users bo'lsa yarata oladi (faqat Xodim turi)
 *
 * Operator — Xodim ichidagi toggle (is_operator), alohida tur emas.
 */

const ROLE_SUPERUSER = 'superuser';
const ROLE_QURILISH  = 'qurilish';
const ROLE_XODIM     = 'xodim';

const ROLE_INFO = {
    [ROLE_SUPERUSER]: {
        label: 'Superuser',
        icon: '👑',
        color: '#10b981',
        bg: 'rgba(16,185,129,0.1)',
        border: 'rgba(16,185,129,0.3)',
        desc: "Barcha bo'limlarga to'liq kirish. Foydalanuvchi turlarining barchasini yarata oladi.",
    },
    [ROLE_QURILISH]: {
        label: 'Qurilish',
        icon: '🏗️',
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.1)',
        border: 'rgba(245,158,11,0.3)',
        desc: "CRM ga kira olmaydi. Faqat maxsus APK ilova orqali ishlaydi. Ularga faqat xarajat kategoriyalari biriktiriladi.",
    },
    [ROLE_XODIM]: {
        label: 'Xodim',
        icon: '👤',
        color: '#6366f1',
        bg: 'rgba(99,102,241,0.1)',
        border: 'rgba(99,102,241,0.3)',
        desc: "CRM ga kiradi. Operator sifatida ham belgilash mumkin (Leadlarda ko'rinadi).",
    },
};

function getUserRole(user) {
    if (!user) return ROLE_XODIM;
    if (user.is_superuser) return ROLE_SUPERUSER;
    if (user.is_staff)     return ROLE_QURILISH;
    return ROLE_XODIM;
}

const defaultXodimPerms = {
    can_view_cities: true,
    can_view_buildings: true,
    can_view_homes: true,
    can_view_clients: true,
    can_view_contracts: true,
    can_view_leads: true,
    can_view_forms: true,
    can_view_analytics: false,
    can_view_sms: false,
    can_view_expenses: false,
    can_view_incomes: false,
    can_view_buildings_info: true,
    can_view_users: false,
    is_operator: false,
    can_login_app: true,
    allowed_categories: [],
};

const defaultQurilishPerms = {
    can_view_cities: false,
    can_view_buildings: false,
    can_view_homes: false,
    can_view_clients: false,
    can_view_contracts: false,
    can_view_leads: false,
    can_view_forms: false,
    can_view_analytics: false,
    can_view_sms: false,
    can_view_expenses: true,   // APK orqali xarajat qo'sha oladi
    can_view_incomes: false,
    can_view_buildings_info: false,
    can_view_users: false,
    is_operator: false,
    can_login_app: true,       // APK ilovaga kirish yoqiq
    allowed_categories: [],
};

const permissionLabels = [
    { key: 'can_view_cities',         label: 'Shaharlar',        icon: '🏙️' },
    { key: 'can_view_buildings',      label: 'Binolar',           icon: '🏢' },
    { key: 'can_view_homes',          label: 'Xonadonlar',        icon: '🏠' },
    { key: 'can_view_clients',        label: 'Mijozlar',          icon: '👥' },
    { key: 'can_view_contracts',      label: 'Shartnomalar',      icon: '📄' },
    { key: 'can_view_leads',          label: 'Leadlar',           icon: '🎯' },
    { key: 'can_view_forms',          label: 'Formalar',          icon: '📝' },
    { key: 'can_view_analytics',      label: 'Analitika',         icon: '📊' },
    { key: 'can_view_sms',            label: 'SMS',               icon: '💬' },
    { key: 'can_view_buildings_info', label: "Bino ma'lumoti",    icon: 'ℹ️' },
    { key: 'can_view_expenses',       label: 'Chiqimlar',         icon: '💸', superuserOnly: true },
    { key: 'can_view_incomes',        label: 'Kirimlar',          icon: '💰', superuserOnly: true },
    { key: 'can_view_users',          label: 'Foydalanuvchilar',  icon: '⚙️', superuserOnly: true },
];

const UsersPage = () => {
    const { user: currentUser, refreshUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [modal, setModal] = useState({ open: false, type: null, user: null });
    const [modalClosing, setModalClosing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [selectedRole, setSelectedRole] = useState(ROLE_XODIM);
    const [formData, setFormData] = useState({
        username: '',
        first_name: '',
        last_name: '',
        password: '',
        is_staff: false,
        is_superuser: false,
        is_active: true,
        permissions: { ...defaultXodimPerms },
    });

    useEffect(() => {
        loadUsers();
        loadCategories(); // Qurilish va Xodim uchun ham kategoriyalar kerak
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await getUsers();
            setUsers(Array.isArray(res.data) ? res.data : res.data.results || []);
        } catch {
            toast.error('Foydalanuvchilarni yuklashda xatolik');
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const res = await expensesService.getCategories({ active_only: 'true' });
            setCategories(Array.isArray(res) ? res : res.results || []);
        } catch {}
    };

    /* ---- Rol tanlanganda formani to'lash ---- */
    const applyRole = (role) => {
        setSelectedRole(role);
        if (role === ROLE_SUPERUSER) {
            setFormData(prev => ({ 
                ...prev, 
                is_superuser: true, 
                is_staff: true, 
                permissions: { ...prev.permissions, is_operator: false } 
            }));
        } else if (role === ROLE_QURILISH) {
            setFormData(prev => ({ 
                ...prev, 
                is_superuser: false, 
                is_staff: true, 
                permissions: { ...defaultQurilishPerms, is_operator: false } 
            }));
        } else {
            setFormData(prev => ({ 
                ...prev, 
                is_superuser: false, 
                is_staff: false, 
                permissions: { ...defaultXodimPerms } 
            }));
        }
    };

    const resetForm = () => {
        setSelectedRole(ROLE_XODIM);
        setFormData({
            username: '',
            first_name: '',
            last_name: '',
            password: '',
            is_staff: false,
            is_superuser: false,
            is_active: true,
            permissions: { ...defaultXodimPerms },
        });
    };

    const openCreateModal = () => {
        resetForm();
        setModal({ open: true, type: 'create', user: null });
    };

    const openEditModal = (user) => {
        const role = getUserRole(user);
        setSelectedRole(role);
        let perms = user.permissions
            ? { ...defaultXodimPerms, ...user.permissions, allowed_categories: (user.permissions.allowed_categories || []).map(c => c.id || c) }
            : (role === ROLE_QURILISH ? { ...defaultQurilishPerms } : { ...defaultXodimPerms });

        // Qurilish bo'lsa operatorlikni har doim o'chiramiz
        if (role === ROLE_QURILISH) {
            perms.is_operator = false;
        }

        setFormData({
            username: user.username,
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            password: '',
            is_staff: user.is_staff,
            is_superuser: user.is_superuser,
            is_active: user.is_active,
            permissions: perms,
        });
        setModal({ open: true, type: 'edit', user });
    };

    const closeModal = () => {
        setModalClosing(true);
        setTimeout(() => {
            setModal({ open: false, type: null, user: null });
            setModalClosing(false);
            resetForm();
        }, 250);
    };

    const handlePermissionChange = (field) => {
        setFormData(prev => ({ ...prev, permissions: { ...prev.permissions, [field]: !prev.permissions[field] } }));
    };

    const handleCategoryToggle = (id) => {
        setFormData(prev => {
            const current = prev.permissions.allowed_categories || [];
            const updated = current.includes(id) ? current.filter(c => c !== id) : [...current, id];
            return { ...prev, permissions: { ...prev.permissions, allowed_categories: updated } };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const data = { ...formData };
            if (modal.type === 'edit' && !data.password) delete data.password;

            if (modal.type === 'edit') {
                await updateUser(modal.user.id, data);
                toast.success('Foydalanuvchi yangilandi');
                if (modal.user.id === currentUser.id) refreshUser();
            } else {
                if (!data.password) { toast.error('Parol kiritilishi shart'); setSaving(false); return; }
                await createUser(data);
                toast.success('Yangi foydalanuvchi yaratildi');
            }
            closeModal();
            loadUsers();
        } catch (error) {
            const msg = error.response?.data?.detail
                || (error.response?.data && Object.values(error.response.data)[0])
                || 'Xatolik yuz berdi';
            toast.error(typeof msg === 'string' ? msg : "Ma'lumotlar noto'g'ri");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (e, user) => {
        e.stopPropagation();
        if (!window.confirm(`${user.username} foydalanuvchisini o'chirib tashlamoqchimisiz?`)) return;
        try {
            await deleteUser(user.id);
            toast.success("Foydalanuvchi o'chirildi");
            loadUsers();
        } catch (error) {
            toast.error(error.response?.data?.detail || "O'chirishda xatolik");
        }
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (d) => {
        if (!d) return '—';
        const dt = new Date(d);
        const m = ['Yanv','Fevr','Mart','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek'];
        return `${dt.getDate()}-${m[dt.getMonth()]} ${dt.getFullYear()}`;
    };

    /* ---- Qaysi rollar formada ko'rinishi kerak ---- */
    const availableRoles = currentUser?.is_superuser
        ? [ROLE_SUPERUSER, ROLE_QURILISH, ROLE_XODIM]
        : [ROLE_XODIM]; // Xodimlar faqat Xodim yarata oladi

    /* ---- Modul ruxsatlarini o'zgartirish huquqi ---- */
    // Faqat superuser yoki can_view_users ruxsati bor userlar o'zgartira oladi
    const canManagePermissions = currentUser?.is_superuser || !!currentUser?.permissions?.can_view_users;

    /* ---- Qaysi permission'lar ko'rinadi ---- */
    const visiblePerms = permissionLabels.filter(p =>
        currentUser?.is_superuser ? true : !p.superuserOnly
    );

    const roleInfo = ROLE_INFO[selectedRole];

    return (
        <div className="users-page">
            <div className="page-header">
                <div className="header-left">
                    <h1 className="page-title">Foydalanuvchilar</h1>
                    <p className="page-subtitle">Tizim foydalanuvchilarini boshqarish va ruxsatlar</p>
                </div>
                <div className="header-actions">
                    <button className="btn-primary" onClick={openCreateModal}>
                        <PlusIcon />
                        <span>Foydalanuvchi qo'shish</span>
                    </button>
                </div>
            </div>

            <div className="page-content">
                <div className="content-card">
                    <div className="card-header">
                        <div className="search-box">
                            <SearchIcon />
                            <input
                                type="text"
                                placeholder="Qidirish: ism, username..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div style={{ marginLeft: 'auto', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            Jami: <strong>{filteredUsers.length}</strong> ta
                        </div>
                    </div>

                    <div className="responsive-table">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '50px' }}>#</th>
                                    <th>Foydalanuvchi</th>
                                    <th>Tur</th>
                                    <th>Operator</th>
                                    <th>Holat</th>
                                    <th>Sana</th>
                                    <th style={{ textAlign: 'right' }}>Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={8} className="table-empty">Yuklanmoqda...</td></tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr><td colSpan={8} className="table-empty">Foydalanuvchilar topilmadi</td></tr>
                                ) : filteredUsers.map((user, i) => {
                                    const role = getUserRole(user);
                                    const info = ROLE_INFO[role];
                                    const isOp = user.permissions?.is_operator;
                                    return (
                                        <tr key={user.id} onClick={() => openEditModal(user)} style={{ cursor: 'pointer' }}>
                                            <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{i + 1}</td>
                                            <td>
                                                <div className="user-cell">
                                                    <div className="user-avatar" style={{ background: `linear-gradient(135deg, ${info.color}cc, ${info.color}66)` }}>
                                                        {user.first_name?.[0] || user.username?.[0]?.toUpperCase() || 'U'}
                                                    </div>
                                                    <div className="user-details">
                                                        <span className="user-full-name">{user.first_name} {user.last_name}</span>
                                                        <span className="user-username">@{user.username}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="user-role-tag" style={{ background: info.bg, color: info.color, borderColor: info.border }}>
                                                    {info.icon} {info.label}
                                                </span>
                                            </td>
                                            <td>
                                                {isOp
                                                    ? <span className="user-role-tag" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', borderColor: 'rgba(139,92,246,0.3)' }}>📞 Operator</span>
                                                    : <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>—</span>
                                                }
                                            </td>
                                            <td>
                                                <span className={`role-badge ${user.is_active ? 'active' : 'inactive'}`}>
                                                    {user.is_active ? 'Faol' : 'Nofaol'}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{formatDate(user.date_joined)}</td>
                                            <td>
                                                <div className="cell-actions" style={{ justifyContent: 'flex-end' }}>
                                                    <div className="table-actions">
                                                        <button className="btn-icon btn-edit" onClick={(e) => { e.stopPropagation(); openEditModal(user); }} title="Tahrirlash"><EditIcon /></button>
                                                        <button className="btn-icon btn-delete" onClick={(e) => handleDelete(e, user)} title="O'chirish"><TrashIcon /></button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ===== MODAL ===== */}
            {modal.open && createPortal(
                <div className={`modal-overlay ${modalClosing ? 'closing' : ''}`} onClick={closeModal}>
                    <div className={`modal-content modal-form users-modal ${modalClosing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{modal.type === 'edit' ? 'Foydalanuvchini tahrirlash' : "Yangi foydalanuvchi qo'shish"}</h3>
                            <button className="modal-close" onClick={closeModal}><CloseIcon /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-form-body">

                                {/* ── 1. Foydalanuvchi turi ── */}
                                <div className="form-section">
                                    <div className="form-section-title">1. Foydalanuvchi turi</div>
                                    <div className="role-selector">
                                        {availableRoles.map(role => {
                                            const info = ROLE_INFO[role];
                                            return (
                                                <button
                                                    key={role}
                                                    type="button"
                                                    className={`role-option ${selectedRole === role ? 'selected' : ''}`}
                                                    style={selectedRole === role ? { borderColor: info.color, background: info.bg } : {}}
                                                    onClick={() => applyRole(role)}
                                                >
                                                    <span className="role-option-icon">{info.icon}</span>
                                                    <span className="role-option-label" style={selectedRole === role ? { color: info.color } : {}}>{info.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="role-desc" style={{ color: roleInfo.color, background: roleInfo.bg, borderColor: roleInfo.border }}>
                                        <strong>{roleInfo.icon} {roleInfo.label}:</strong> {roleInfo.desc}
                                    </div>
                                </div>

                                {/* ── 2. Asosiy ma'lumotlar ── */}
                                <div className="form-section">
                                    <div className="form-section-title">2. Asosiy ma'lumotlar</div>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Username *</label>
                                            <input type="text" placeholder="Masalan: abdullayev" required
                                                value={formData.username}
                                                onChange={e => setFormData({ ...formData, username: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>{modal.type === 'edit' ? "Parolni yangilash (ixtiyoriy)" : "Parol *"}</label>
                                            <input type="password" required={modal.type !== 'edit'} minLength={6}
                                                placeholder={modal.type === 'edit' ? "Bo'sh = o'zgarmaydi" : 'Kamida 6 ta belgi'}
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Ismi</label>
                                            <input type="text" placeholder="Ism..." value={formData.first_name}
                                                onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label>Familiyasi</label>
                                            <input type="text" placeholder="Familiya..." value={formData.last_name}
                                                onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                                        </div>
                                    </div>

                                    {/* Faol toggle */}
                                    <div className="toggle-row">
                                        <div className="toggle-info">
                                            <span className="toggle-title">Faol holat</span>
                                            <span className="toggle-sub">O'chirilgan foydalanuvchi tizimga kira olmaydi</span>
                                        </div>
                                        <label className="toggle-switch">
                                            <input type="checkbox" checked={formData.is_active}
                                                onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                                            <span className="toggle-slider" />
                                        </label>
                                    </div>
                                </div>

                                {/* ── 3. Superuser: Operator toggle ko'rsatish ── */}
                                {selectedRole === ROLE_SUPERUSER && (
                                    <div className="form-section">
                                        <div className="role-info-box" style={{ background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.3)', marginBottom: '16px' }}>
                                            <span style={{ fontSize: '28px' }}>👑</span>
                                            <div>
                                                <strong style={{ color: '#10b981' }}>Superuser — To'liq nazorat</strong>
                                                <p>Barcha bo'limlar, Foydalanuvchilar boshqaruvi, Kirim va Chiqimlar. Ruxsatlar qo'lda berishning hojati yo'q.</p>
                                            </div>
                                        </div>
                                        {/* Superuser ham operator bo'la oladi */}
                                        <div className="toggle-row" style={{ borderColor: formData.permissions?.is_operator ? 'rgba(139,92,246,0.4)' : '' }}>
                                            <div className="toggle-info">
                                                <span className="toggle-title">📞 Operator sifatida ko'rsatish</span>
                                                <span className="toggle-sub">Leadlarda operator ro'yxatida ham chiqadi</span>
                                            </div>
                                            <label className="toggle-switch">
                                                <input type="checkbox" checked={!!formData.permissions?.is_operator}
                                                    onChange={() => handlePermissionChange('is_operator')} />
                                                <span className="toggle-slider" style={formData.permissions?.is_operator ? { background: '#8b5cf6' } : {}} />
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {/* ── 4. QURILISH: faqat ilova kirish + kategoriyalar ── */}
                                {selectedRole === ROLE_QURILISH && (
                                    <div className="form-section">
                                        <div className="form-section-title">3. Ilova kirish va kategoriyalar</div>
                                        <p className="form-section-hint">
                                            Qurilish foydalanuvchilari CRM ga kira olmaydi. Ular faqat APK ilova orqali belgilangan xarajat kategoriyalariga chiqim qo'shadi.
                                        </p>

                                        {/* Ilova kirish toggle */}
                                        <div className="toggle-row" style={{ marginBottom: '16px', borderColor: formData.permissions?.can_login_app ? 'rgba(245,158,11,0.4)' : '' }}>
                                            <div className="toggle-info">
                                                <span className="toggle-title">📱 APK ilovaga kirish</span>
                                                <span className="toggle-sub">Mobil ilova orqali xarajat kirita oladi</span>
                                            </div>
                                            <label className="toggle-switch">
                                                <input type="checkbox" checked={!!formData.permissions?.can_login_app}
                                                    onChange={() => handlePermissionChange('can_login_app')} />
                                                <span className="toggle-slider" style={formData.permissions?.can_login_app ? { background: '#f59e0b' } : {}} />
                                            </label>
                                        </div>

                                        {/* Xarajat kategoriyalari */}
                                        {categories.length > 0 ? (
                                            <>
                                                <div className="form-section-title" style={{ fontSize: '12px', marginBottom: '10px' }}>
                                                    📂 Ruxsat berilgan xarajat kategoriyalari
                                                </div>
                                                <div className="permissions-grid-new">
                                                    {categories.map(cat => (
                                                        <label key={cat.id} className={`perm-card ${formData.permissions.allowed_categories?.includes(cat.id) ? 'active' : ''}`}>
                                                            <input type="checkbox"
                                                                checked={!!formData.permissions.allowed_categories?.includes(cat.id)}
                                                                onChange={() => handleCategoryToggle(cat.id)} />
                                                            <span className="perm-icon">🗂️</span>
                                                            <span className="perm-label">{cat.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="role-info-box" style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.3)' }}>
                                                <span style={{ fontSize: '22px' }}>⚠️</span>
                                                <div>
                                                    <strong style={{ color: '#f59e0b' }}>Kategoriyalar topilmadi</strong>
                                                    <p>Avval "Chiqimlar → Kategoriyalar" bo'limidan kategoriyalar yarating.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── 5. XODIM: modul ruxsatlari ── */}
                                {selectedRole === ROLE_XODIM && (
                                    <div className="form-section">
                                        <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            3. Modul ruxsatlari
                                            {!canManagePermissions && (
                                                <span style={{ fontSize: '11px', fontWeight: 500, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 8px', borderRadius: '20px', textTransform: 'none', letterSpacing: 0 }}>
                                                    🔒 Faqat ko'rish
                                                </span>
                                            )}
                                        </div>
                                        {!canManagePermissions && (
                                            <p className="form-section-hint" style={{ color: '#f59e0b' }}>
                                                Modul ruxsatlarini faqat Superuser yoki Foydalanuvchilar bo'limini boshqarish huquqi bor xodimlar o'zgartira oladi.
                                            </p>
                                        )}
                                        {canManagePermissions && (
                                            <p className="form-section-hint">Ushbu foydalanuvchi qaysi bo'limlarga kira olishini tanlang</p>
                                        )}
                                        <div className="permissions-grid-new">
                                            {visiblePerms.map(p => (
                                                <label key={p.key} className={`perm-card ${formData.permissions[p.key] ? 'active' : ''} ${!canManagePermissions ? 'perm-card-readonly' : ''}`}>
                                                    <input type="checkbox" checked={!!formData.permissions[p.key]}
                                                        disabled={!canManagePermissions}
                                                        onChange={() => canManagePermissions && handlePermissionChange(p.key)} />
                                                    <span className="perm-icon">{p.icon}</span>
                                                    <span className="perm-label">{p.label}</span>
                                                </label>
                                            ))}
                                        </div>

                                        {/* Xarajat kategoriyalari (faqat can_view_expenses bo'lsa) */}
                                        {formData.permissions.can_view_expenses && categories.length > 0 && (
                                            <div style={{ marginTop: '16px' }}>
                                                <div className="form-section-title" style={{ fontSize: '12px', marginBottom: '10px' }}>
                                                    Ruxsat berilgan xarajat kategoriyalari
                                                </div>
                                                <div className="permissions-grid-new">
                                                    {categories.map(cat => (
                                                        <label key={cat.id} className={`perm-card ${formData.permissions.allowed_categories?.includes(cat.id) ? 'active' : ''} ${!canManagePermissions ? 'perm-card-readonly' : ''}`}>
                                                            <input type="checkbox"
                                                                checked={!!formData.permissions.allowed_categories?.includes(cat.id)}
                                                                disabled={!canManagePermissions}
                                                                onChange={() => canManagePermissions && handleCategoryToggle(cat.id)} />
                                                            <span className="perm-icon">🗂️</span>
                                                            <span className="perm-label">{cat.name}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Operator toggle */}
                                        <div className="toggle-row" style={{ marginTop: '16px', borderColor: formData.permissions.is_operator ? 'rgba(139,92,246,0.4)' : '', opacity: canManagePermissions ? 1 : 0.6 }}>
                                            <div className="toggle-info">
                                                <span className="toggle-title">📞 Operator sifatida ko'rsatish</span>
                                                <span className="toggle-sub">Leadlarda operator ro'yxatida chiqadi</span>
                                            </div>
                                            <label className="toggle-switch" style={{ pointerEvents: canManagePermissions ? 'auto' : 'none' }}>
                                                <input type="checkbox" checked={!!formData.permissions.is_operator}
                                                    disabled={!canManagePermissions}
                                                    onChange={() => canManagePermissions && handlePermissionChange('is_operator')} />
                                                <span className="toggle-slider" style={formData.permissions.is_operator ? { background: '#8b5cf6' } : {}} />
                                            </label>
                                        </div>
                                    </div>
                                )}


                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={closeModal} disabled={saving}>Bekor qilish</button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? 'Saqlanmoqda...' : (<><SaveIcon /><span>{modal.type === 'edit' ? 'Saqlash' : 'Yaratish'}</span></>)}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default UsersPage;
