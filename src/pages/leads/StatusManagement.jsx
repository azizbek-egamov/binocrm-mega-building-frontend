import React, { useState, useEffect } from 'react';
import { leadService } from '../../services/leads';
import { toast } from 'sonner';
import Modal from '../../components/ui/Modal';
import './StatusManagement.css';

// Icons
const EditIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

const TrashIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

const PlusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const GripIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="5" r="1"></circle>
        <circle cx="9" cy="12" r="1"></circle>
        <circle cx="9" cy="19" r="1"></circle>
        <circle cx="15" cy="5" r="1"></circle>
        <circle cx="15" cy="12" r="1"></circle>
        <circle cx="15" cy="19" r="1"></circle>
    </svg>
);

const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

// Color presets
const COLOR_PRESETS = [
    '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
    '#14b8a6', '#0ea5e9', '#3b82f6', '#8b5cf6', '#d946ef',
    '#ec4899', '#f43f5e'
];

// Generate key from name
const generateKey = (name) => {
    return name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '_')
        .replace(/^-+|-+$/g, '');
};

const StatusManagement = ({ isOpen, onClose, onSuccess }) => {
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [closing, setClosing] = useState(false);
    const [formClosing, setFormClosing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        key: '',
        color: '#3b82f6',
        description: '',
        order: 0
    });

    useEffect(() => {
        if (isOpen) {
            fetchStages();
        }
    }, [isOpen]);

    const fetchStages = async () => {
        setLoading(true);
        try {
            const res = await leadService.getStages();
            const stagesData = Array.isArray(res.data) ? res.data : (res.data.results || []);
            setStages(stagesData);
        } catch (error) {
            console.error(error);
            toast.error("Bosqichlarni yuklashda xatolik");
            setStages([]);
        } finally {
            setLoading(false);
        }
    };

    const handleNameChange = (e) => {
        const name = e.target.value;
        setFormData(prev => ({
            ...prev,
            name,
            key: !editMode ? generateKey(name) : prev.key
        }));
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error("Bosqich nomi kiritilishi shart");
            return;
        }
        if (!formData.key.trim()) {
            toast.error("Kalit kiritilishi shart");
            return;
        }

        try {
            const data = {
                name: formData.name,
                key: formData.key,
                color: formData.color,
                description: formData.description,
                order: parseInt(formData.order) || 0
            };

            if (editMode) {
                await leadService.updateStage(editMode, data);
                toast.success("Bosqich yangilandi");
            } else {
                await leadService.createStage(data);
                toast.success("Yangi bosqich qo'shildi");
            }
            closeForm();
            fetchStages();
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error(error);
            toast.error("Xatolik yuz berdi");
        }
    };

    const handleEdit = (stage) => {
        setFormData({
            name: stage.name,
            key: stage.key || generateKey(stage.name),
            color: stage.color || '#3b82f6',
            description: stage.description || '',
            order: stage.order || 0
        });
        setEditMode(stage.id);
        setShowForm(true);
    };

    const handleDelete = async (id, isSystem) => {
        if (isSystem) {
            toast.error("Tizim bosqichini o'chirib bo'lmaydi");
            return;
        }
        if (!window.confirm("Bu bosqichni o'chirmoqchimisiz? Barcha leadlar boshqa bosqichga o'tkaziladi.")) return;

        try {
            await leadService.deleteStage(id);
            toast.success("Bosqich o'chirildi");
            fetchStages();
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error(error);
            toast.error("O'chirishda xatolik");
        }
    };

    const resetForm = () => {
        setFormData({ name: '', key: '', color: '#3b82f6', description: '', order: 0 });
        setEditMode(null);
        setShowForm(false);
    };

    const closeForm = () => {
        setFormClosing(true);
        setTimeout(() => {
            resetForm();
            setFormClosing(false);
        }, 300);
    };

    const handleClose = () => {
        setClosing(true);
        setTimeout(() => {
            resetForm();
            onClose();
            setClosing(false);
        }, 300);
    };

    // Drag and Drop handlers
    const onDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => {
            e.target.classList.add('dragging');
        }, 0);
    };

    const onDragOver = (e, index) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        e.currentTarget.classList.add('drag-over');
    };

    const onDragLeave = (e) => {
        e.currentTarget.classList.remove('drag-over');
    };

    const onDragEnd = (e) => {
        e.target.classList.remove('dragging');
        setDraggedIndex(null);
        document.querySelectorAll('.stage-row').forEach(el => el.classList.remove('drag-over'));
    };

    const onDrop = async (e, targetIndex) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');

        if (draggedIndex === null || draggedIndex === targetIndex) return;

        const newStages = [...stages].sort((a, b) => (a.order || 0) - (b.order || 0));
        const [movedItem] = newStages.splice(draggedIndex, 1);
        newStages.splice(targetIndex, 0, movedItem);

        const orders = newStages.map((stage, idx) => ({
            id: stage.id,
            order: idx
        }));

        const hasChanged = orders.some((item, idx) => {
            const originalStage = stages.sort((a, b) => (a.order || 0) - (b.order || 0))[idx];
            return originalStage.id !== item.id;
        });

        if (!hasChanged) return;

        setStages(newStages.map((s, i) => ({ ...s, order: i })));

        try {
            await leadService.reorderStages(orders);
            toast.success("Bosqichlar tartibi saqlandi");
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Reorder error:", error);
            toast.error("Tartibni saqlashda xatolik");
            fetchStages();
        }
    };

    const modalTitle = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span>Bosqichlarni boshqarish</span>
            <span style={{ fontSize: '13px', fontWeight: '400', color: 'var(--text-secondary)' }}>
                Lead bosqichlarini yaratish, tahrirlash va o'chirish
            </span>
        </div>
    );

    const modalFooter = !showForm ? (
        <button
            className="btn-v2 btn-v2-primary"
            onClick={() => {
                setShowForm(true);
                setEditMode(null);
                setFormData({ name: '', key: '', color: '#3b82f6', description: '', order: stages.length });
            }}
        >
            <PlusIcon /> Bosqich qo'shish
        </button>
    ) : null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={modalTitle}
            size="lg"
            className={closing ? 'closing' : ''}
            footer={modalFooter}
        >
            {/* Add/Edit Form */}
            {(showForm || formClosing) && (
                <div className={`status-form ${formClosing ? 'closing' : ''}`}>
                    <div className="status-form-header">
                        <h3>{editMode ? "Bosqichni tahrirlash" : "Bosqich qo'shish"}</h3>
                        <button className="modal-close" onClick={closeForm}>
                            <CloseIcon />
                        </button>
                    </div>
                    <div className="status-form-body">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Bosqich nomi *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={handleNameChange}
                                    placeholder="Masalan: Yangi lead"
                                />
                            </div>
                            <div className="form-group">
                                <label>Kalit (inglizcha) *</label>
                                <input
                                    type="text"
                                    value={formData.key}
                                    onChange={e => setFormData(p => ({ ...p, key: e.target.value }))}
                                    placeholder="yangi_lead"
                                    disabled={editMode && stages.find(s => s.id === editMode)?.is_system_stage}
                                />
                                <span className="hint-text">Avtomatik generatsiya qilinadi</span>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Tartib raqami</label>
                                <input
                                    type="number"
                                    value={formData.order}
                                    onChange={e => setFormData(p => ({ ...p, order: e.target.value }))}
                                    min="0"
                                />
                            </div>
                            <div className="form-group">
                                <label>Rang</label>
                                <div className="color-picker-row">
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={e => setFormData(p => ({ ...p, color: e.target.value }))}
                                        className="color-input"
                                    />
                                    <span className="color-value">{formData.color}</span>
                                </div>
                            </div>
                        </div>

                        <div className="form-group full-width">
                            <label>Tavsif</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                placeholder="Bosqich haqida qisqacha tavsif..."
                                rows={2}
                            />
                        </div>

                        <div className="color-presets">
                            {COLOR_PRESETS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`color-btn ${formData.color === color ? 'active' : ''}`}
                                    style={{ background: color }}
                                    onClick={() => setFormData(p => ({ ...p, color }))}
                                />
                            ))}
                        </div>

                        <div className="form-actions">
                            <button type="button" className="cancel-btn" onClick={closeForm}>
                                Bekor qilish
                            </button>
                            <button type="button" className="save-btn" onClick={handleSave}>
                                {editMode ? 'Yangilash' : 'Yaratish'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stages List */}
            <div className="stages-list">
                <div className="stages-header">
                    <span className="col-grip"></span>
                    <span className="col-name">Bosqich nomi</span>
                    <span className="col-key">Kalit</span>
                    <span className="col-color">Rang</span>
                    <span className="col-order">Tartib</span>
                    <span className="col-actions">Amallar</span>
                </div>

                {loading ? (
                    <div className="loading-state">Yuklanmoqda...</div>
                ) : stages.length === 0 ? (
                    <div className="empty-state">Bosqichlar topilmadi</div>
                ) : (
                    stages.sort((a, b) => (a.order || 0) - (b.order || 0)).map((stage, index) => (
                        <div
                            key={stage.id}
                            className={`stage-row ${draggedIndex === index ? 'dragging' : ''}`}
                            draggable
                            onDragStart={(e) => onDragStart(e, index)}
                            onDragOver={(e) => onDragOver(e, index)}
                            onDragLeave={onDragLeave}
                            onDragEnd={onDragEnd}
                            onDrop={(e) => onDrop(e, index)}
                        >
                            <span className="col-grip" title="Tartibni o'zgartirish uchun suring">
                                <GripIcon />
                            </span>
                            <span className="col-name">
                                <div
                                    className="stage-color-dot"
                                    style={{ background: stage.color || '#3b82f6' }}
                                />
                                {stage.name}
                                {stage.is_system_stage && (
                                    <span className="system-badge">Tizim</span>
                                )}
                            </span>
                            <span className="col-key">{stage.key || '-'}</span>
                            <span className="col-color">
                                <span
                                    className="color-preview"
                                    style={{ background: stage.color || '#3b82f6' }}
                                />
                                {stage.color || '#3b82f6'}
                            </span>
                            <span className="col-order">{stage.order || 0}</span>
                            <span className="col-actions">
                                <button
                                    className="action-btn edit"
                                    onClick={() => handleEdit(stage)}
                                    title="Tahrirlash"
                                >
                                    <EditIcon />
                                </button>
                                <button
                                    className="action-btn delete"
                                    onClick={() => handleDelete(stage.id, stage.is_system_stage)}
                                    title={stage.is_system_stage ? "Tizim bosqichini o'chirib bo'lmaydi" : "O'chirish"}
                                    disabled={stage.is_system_stage}
                                >
                                    <TrashIcon />
                                </button>
                            </span>
                        </div>
                    ))
                )}
            </div>
        </Modal>
    );
};

export default StatusManagement;

