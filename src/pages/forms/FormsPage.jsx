import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';
import Modal from '../../components/ui/Modal';
import { getForms, createForm, updateForm, deleteForm } from '../../services/forms';
import { getLeadOperator, updateLeadOperator } from '../../services/settings';
import { getUsers } from '../../services/users';
import { useAuth } from '../../context/AuthContext';
import './FormsPage.css';

const FormsPage = () => {
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalClosing, setModalClosing] = useState(false);
    const [editingForm, setEditingForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [formToDelete, setFormToDelete] = useState(null);

    const { user } = useAuth();
    const [leadOperator, setLeadOperator] = useState('ceoadmin');
    const [operators, setOperators] = useState([]);
    
    const canManageSettings = user?.is_superuser || user?.permissions?.can_view_users;

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        button_text: 'Yuborish',
        success_message: "Ma'lumotlaringiz qabul qilindi. Tez orada siz bilan bog'lanamiz!",
        fields: []
    });

    useEffect(() => {
        loadForms();
        if (canManageSettings) {
            fetchSettings();
            fetchOperators();
        }
    }, [canManageSettings]);

    const fetchSettings = async () => {
        try {
            const response = await getLeadOperator();
            setLeadOperator(response.data.username);
        } catch (error) {
            console.error("Sozlamalarni yuklashda xatolik:", error);
        }
    };

    const fetchOperators = async () => {
        try {
            const response = await getUsers();
            const usersData = response.data.results || response.data;
            if (Array.isArray(usersData)) {
                // Faqat faol operatorlarni yoki superuserlarni saralab olish
                const ops = usersData.filter(u => u.is_active && u.permissions?.is_operator && !u.is_superuser);
                setOperators(ops);
            }
        } catch (error) {
            console.error("Operatorlarni yuklashda xatolik:", error);
        }
    };

    const handleOperatorChange = async (username) => {
        try {
            await updateLeadOperator(username);
            setLeadOperator(username);
            toast.success("Lead operatori yangilandi");
        } catch (error) {
            toast.error("Yangilashda xatolik yuz berdi");
        }
    };

    const loadForms = async () => {
        try {
            setLoading(true);
            const response = await getForms();
            // Handle both paginated response (with results) and direct array
            const formsData = response.data?.results || response.data;
            setForms(Array.isArray(formsData) ? formsData : []);
        } catch {
            toast.error("Formalarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingForm(null);
        setFormData({
            name: '',
            description: '',
            button_text: 'Yuborish',
            success_message: "Ma'lumotlaringiz qabul qilindi. Tez orada siz bilan bog'lanamiz!",
            fields: [
                { label: 'Ism', field_type: 'text', placeholder: 'Ismingizni kiriting', is_required: true },
                { label: 'Telefon', field_type: 'phone', placeholder: '+998 XX XXX XX XX', is_required: true },
            ]
        });
        setModalOpen(true);
    };

    const openEditModal = (form) => {
        setEditingForm(form);
        setFormData({
            name: form.name,
            description: form.description || '',
            button_text: form.button_text || 'Yuborish',
            success_message: form.success_message || '',
            fields: form.fields || []
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalClosing(true);
        setTimeout(() => {
            setModalOpen(false);
            setModalClosing(false);
            setEditingForm(null);
        }, 250);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error("Forma nomi kiritilishi shart");
            return;
        }
        if (formData.fields.length === 0) {
            toast.error("Kamida bitta maydon qo'shilishi kerak");
            return;
        }

        setSaving(true);
        try {
            if (editingForm) {
                await updateForm(editingForm.id, formData);
                toast.success("Forma yangilandi");
            } else {
                await createForm(formData);
                toast.success("Forma yaratildi");
            }
            closeModal();
            loadForms();
        } catch {
            toast.error("Xatolik yuz berdi");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!formToDelete) return;
        try {
            await deleteForm(formToDelete.id);
            toast.success("Forma o'chirildi");
            setDeleteModalOpen(false);
            setFormToDelete(null);
            loadForms();
        } catch {
            toast.error("O'chirishda xatolik");
        }
    };

    const addField = () => {
        setFormData(prev => ({
            ...prev,
            fields: [...prev.fields, {
                label: '',
                field_type: 'text',
                placeholder: '',
                is_required: true
            }]
        }));
    };

    const removeField = (index) => {
        setFormData(prev => ({
            ...prev,
            fields: prev.fields.filter((_, i) => i !== index)
        }));
    };

    const updateField = (index, key, value) => {
        setFormData(prev => ({
            ...prev,
            fields: prev.fields.map((field, i) =>
                i === index ? { ...field, [key]: value } : field
            )
        }));
    };

    const copyLink = (form) => {
        const url = `${window.location.origin}/f/${form.slug}`;
        navigator.clipboard.writeText(url);
        toast.success("Havola nusxalandi");
    };

    const fieldTypes = [
        { value: 'text', label: 'Matn' },
        { value: 'phone', label: 'Telefon' },
        { value: 'email', label: 'Email' },
        { value: 'textarea', label: 'Katta matn' },
        { value: 'number', label: 'Raqam' },
    ];

    return (
        <div className="forms-page">
            <div className="page-header">
                <div className="header-left">
                    <h1 className="page-title">Formalar</h1>
                    <p className="page-subtitle">Dinamik formalar yarating va leadlarni yig'ing</p>
                </div>
                <div className="header-actions">
                    {canManageSettings && (
                        <div className="lead-operator-setting">
                            <label>Lead operatori:</label>
                            <select 
                                value={leadOperator} 
                                onChange={(e) => handleOperatorChange(e.target.value)}
                                className="operator-select"
                            >
                                {operators.map(op => (
                                    <option key={op.id} value={op.username}>
                                        {op.first_name} {op.last_name} (@{op.username})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <button className="btn-primary" onClick={openCreateModal}>
                        <PlusIcon /> Forma yaratish
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Yuklanmoqda...</p>
                </div>
            ) : forms.length === 0 ? (
                <div className="empty-state">
                    <FormIcon />
                    <h3>Hali formalar yo'q</h3>
                    <p>Birinchi formangizni yarating va mijozlardan ma'lumot yig'ishni boshlang</p>
                    <button className="btn-primary" onClick={openCreateModal}>
                        <PlusIcon /> Forma yaratish
                    </button>
                </div>
            ) : (
                <div className="forms-grid">
                    {forms.map(form => (
                        <div key={form.id} className={`form-card ${form.is_active ? '' : 'inactive'}`}>
                            <div className="form-card-header">
                                <h3>{form.name}</h3>
                                <span className={`status-badge ${form.is_active ? 'active' : 'inactive'}`}>
                                    {form.is_active ? 'Faol' : 'Nofaol'}
                                </span>
                            </div>
                            {form.description && (
                                <p className="form-description">{form.description}</p>
                            )}
                            <div className="form-stats">
                                <div className="stat">
                                    <span className="stat-value">{form.submissions_count || 0}</span>
                                    <span className="stat-label">Yuborishlar</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-value">{form.fields?.length || 0}</span>
                                    <span className="stat-label">Maydonlar</span>
                                </div>
                            </div>
                            <div className="form-card-actions">
                                <button className="btn-icon" onClick={() => copyLink(form)} title="Havolani nusxalash">
                                    <LinkIcon />
                                </button>
                                <button className="btn-icon" onClick={() => openEditModal(form)} title="Tahrirlash">
                                    <EditIcon />
                                </button>
                                <button className="btn-icon danger" onClick={() => { setFormToDelete(form); setDeleteModalOpen(true); }} title="O'chirish">
                                    <TrashIcon />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {modalOpen && createPortal(
                <div className={`modal-overlay ${modalClosing ? 'closing' : ''}`} onClick={closeModal}>
                    <div className={`modal-content form-modal ${modalClosing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingForm ? 'Formani tahrirlash' : 'Yangi forma'}</h2>
                            <button className="modal-close" onClick={closeModal}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-section">
                                    <h4>Asosiy ma'lumotlar</h4>
                                    <div className="form-group">
                                        <label>Forma nomi *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Masalan: Yangi binolar uchun ariza"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Tavsif</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Formaning qisqacha tavsifi"
                                            rows={2}
                                        />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Tugma matni</label>
                                            <input
                                                type="text"
                                                value={formData.button_text}
                                                onChange={e => setFormData({ ...formData, button_text: e.target.value })}
                                                placeholder="Yuborish"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Muvaffaqiyat xabari</label>
                                        <input
                                            type="text"
                                            value={formData.success_message}
                                            onChange={e => setFormData({ ...formData, success_message: e.target.value })}
                                            placeholder="Forma yuborilgandan keyin ko'rsatiladigan xabar"
                                        />
                                    </div>
                                </div>

                                <div className="form-section">
                                    <div className="section-header">
                                        <h4>Maydonlar</h4>
                                        <button type="button" className="btn-add-field" onClick={addField}>
                                            <PlusIcon /> Maydon qo'shish
                                        </button>
                                    </div>
                                    <div className="fields-list">
                                        {formData.fields.map((field, index) => (
                                            <div key={index} className="field-item">
                                                <input
                                                    type="text"
                                                    value={field.label}
                                                    onChange={e => updateField(index, 'label', e.target.value)}
                                                    placeholder="Maydon nomi"
                                                    className="field-label-input"
                                                />
                                                <div className="field-row">
                                                    <select
                                                        value={field.field_type}
                                                        onChange={e => updateField(index, 'field_type', e.target.value)}
                                                        className="field-type-select"
                                                    >
                                                        {fieldTypes.map(type => (
                                                            <option key={type.value} value={type.value}>{type.label}</option>
                                                        ))}
                                                    </select>
                                                    <label className="field-required-toggle">
                                                        <input
                                                            type="checkbox"
                                                            checked={field.is_required}
                                                            onChange={e => updateField(index, 'is_required', e.target.checked)}
                                                        />
                                                        <span>Majburiy</span>
                                                    </label>
                                                    <button
                                                        type="button"
                                                        className="btn-remove-field"
                                                        onClick={() => removeField(index)}
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={field.placeholder || ''}
                                                    onChange={e => updateField(index, 'placeholder', e.target.value)}
                                                    placeholder="Placeholder (ixtiyoriy)"
                                                    className="field-placeholder-input"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={closeModal}>
                                    Bekor qilish
                                </button>
                                <button type="submit" className="btn-primary" disabled={saving}>
                                    {saving ? 'Saqlanmoqda...' : (editingForm ? 'Yangilash' : 'Yaratish')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <Modal
                    isOpen={deleteModalOpen}
                    onClose={() => setDeleteModalOpen(false)}
                    title="Formani o'chirish"
                >
                    <p>"{formToDelete?.name}" formasini o'chirishni xohlaysizmi?</p>
                    <p className="text-warning">Bu amalni qaytarib bo'lmaydi!</p>
                    <div className="modal-footer">
                        <button className="btn-secondary" onClick={() => setDeleteModalOpen(false)}>
                            Bekor qilish
                        </button>
                        <button className="btn-danger" onClick={handleDelete}>
                            O'chirish
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

// Icons
const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const FormIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="12" y1="18" x2="12" y2="12"></line>
        <line x1="9" y1="15" x2="15" y2="15"></line>
    </svg>
);

const LinkIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </svg>
);

const EditIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

const TrashIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

export default FormsPage;
