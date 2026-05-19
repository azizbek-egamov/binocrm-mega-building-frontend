import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { leadService } from '../../services/leads';
import { toast } from 'sonner';
import ConvertLeadModal from './ConvertLeadModal';
import {
    SearchIcon,
    EditIcon,
    TrashIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    EmptyIcon,
    PlusIcon
} from '../clients/ClientIcons';

// Reuse icons
const FilterIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
    </svg>
);

const SettingsIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
);

const ConvertIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 3h5v5"></path>
        <path d="M8 21H3v-5"></path>
        <path d="M21 3l-7 7"></path>
        <path d="M3 21l7-7"></path>
    </svg>
);

const LeadsList = () => {
    // Context from LeadsPage
    const { openEditModal, refreshTrigger, openCreateModal, updateTotalLeads } = useOutletContext();

    const formatDate = (dateStr) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
            'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
        return `${date.getDate()}-${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
    });

    const [deleteModal, setDeleteModal] = useState({ open: false, lead: null });
    const [convertModal, setConvertModal] = useState({ isOpen: false, lead: null });
    const [modalClosing, setModalClosing] = useState(false);

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(filters.search);
        }, 500);
        return () => clearTimeout(handler);
    }, [filters.search]);

    useEffect(() => {
        fetchLeads();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, debouncedSearch, filters.status, refreshTrigger]);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                search: debouncedSearch,
                status: filters.status
            };
            const res = await leadService.getAll(params);
            const data = res.data;
            const results = Array.isArray(data) ? data : (data.results || []);
            setLeads(results);

            const count = data.count || results.length;
            setTotalPages(Math.ceil(count / 20) || 1);
            if (updateTotalLeads) updateTotalLeads(count);
        } catch (error) {
            console.error("Leads fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteModal.lead) return;
        try {
            await leadService.delete(deleteModal.lead.id);
            toast.success("Lead o'chirildi");
            closeDeleteModal();
            fetchLeads();
        } catch {
            toast.error("O'chirishda xatolik");
        }
    };

    const closeDeleteModal = () => {
        setModalClosing(true);
        setTimeout(() => {
            setDeleteModal({ open: false, lead: null });
            setModalClosing(false);
        }, 300);
    };

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setPage(1);
    };

    const getStatusBadge = (status) => {
        const map = {
            'answered': { label: 'Javob berdi', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
            'not_answered': { label: 'Javob bermadi', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
            'client_answered': { label: 'Mijoz javob berdi', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
            'client_not_answered': { label: 'Mijoz javob bermadi', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
        };
        const s = map[status] || { label: status, color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' };

        return (
            <span style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                color: s.color,
                backgroundColor: s.bg
            }}>
                {s.label}
            </span>
        );
    };

    return (
        <div className="leads-list-container">
            {/* V2 Toolbar */}
            <div className="leads-toolbar">
                <div className="toolbar-left">
                    <div className="leads-search-box">
                        <SearchIcon />
                        <input
                            type="text"
                            placeholder="Qidirish (Ism, Telefon)..."
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                        />
                    </div>
                </div>
                <div className="toolbar-right">
                    <button className="btn-v2 btn-v2-primary" onClick={() => openCreateModal()}>
                        <PlusIcon />
                        <span>Lead qo'shish</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-state" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                    <div className="spinner-border text-primary" role="status"></div>
                </div>
            ) : leads.length === 0 ? (
                <div className="empty-state" style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
                    <EmptyIcon style={{ width: 64, height: 64, marginBottom: '16px', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Leadlar topilmadi</h3>
                    <p>Qidiruv shartlarini o'zgartirib ko'ring yoki yangi lead qo'shing</p>
                </div>
            ) : (
                <div className="card-body p-0">
                    <div className="responsive-table">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th># ID</th>
                                    <th>Mijoz</th>
                                    <th>Telefon</th>
                                    <th>Bosqich</th>
                                    <th>Status</th>
                                    <th>Operator</th>
                                    <th>Sana</th>
                                    <th style={{ textAlign: 'right' }}>Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.map(lead => (
                                    <tr key={lead.id}>
                                        <td className="cell-number">#{lead.id}</td>
                                        <td>
                                            <div className="cell-name">{lead.client_name || "Noma'lum"}</div>
                                        </td>
                                        <td>{lead.phone_number}</td>
                                        <td>
                                            <span style={{
                                                fontSize: '12px',
                                                border: '1px solid var(--border-color)',
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                background: 'var(--bg-tertiary)',
                                                color: 'var(--text-secondary)'
                                            }}>
                                                {lead.stage_name}
                                            </span>
                                        </td>
                                        <td>{getStatusBadge(lead.call_status)}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{
                                                    width: 24, height: 24,
                                                    borderRadius: '50%',
                                                    background: 'var(--bg-tertiary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '10px',
                                                    fontWeight: 'bold',
                                                    color: 'var(--text-secondary)'
                                                }}>
                                                    {lead.operator_name ? lead.operator_name[0] : '?'}
                                                </div>
                                                <span style={{ 
                                                    fontSize: '13px',
                                                    color: lead.operator_name ? 'inherit' : '#ef4444'
                                                }}>
                                                    {lead.operator_name || "Biriktirilmagan"}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                                            {formatDate(lead.created_at)}
                                        </td>
                                        <td className="cell-actions" style={{ justifyContent: 'flex-end' }}>
                                            <div className="table-actions">
                                                {!lead.is_converted && (
                                                    <button
                                                        className="btn-icon"
                                                        onClick={() => setConvertModal({ isOpen: true, lead })}
                                                        title="Mijozga aylantirish"
                                                        style={{
                                                            background: 'rgba(16, 185, 129, 0.1)',
                                                            color: '#10b981',
                                                            width: 32, height: 32,
                                                            border: 'none', borderRadius: '8px',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <ConvertIcon />
                                                    </button>
                                                )}
                                                <button
                                                    className="btn-icon btn-edit"
                                                    onClick={() => openEditModal(lead)}
                                                    title="Tahrirlash"
                                                    style={{
                                                        background: 'rgba(99, 102, 241, 0.1)',
                                                        color: '#6366f1',
                                                        width: 32, height: 32,
                                                        border: 'none', borderRadius: '8px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        marginLeft: '8px'
                                                    }}
                                                >
                                                    <EditIcon style={{ width: 16, height: 16 }} />
                                                </button>
                                                <button
                                                    className="btn-icon btn-delete"
                                                    onClick={() => setDeleteModal({ open: true, lead })}
                                                    title="O'chirish"
                                                    style={{
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        color: '#ef4444',
                                                        width: 32, height: 32,
                                                        border: 'none', borderRadius: '8px',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        marginLeft: '8px'
                                                    }}
                                                >
                                                    <TrashIcon style={{ width: 16, height: 16 }} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination-container">
                            <div className="pagination-info">
                                Sahifa {page} / {totalPages}
                            </div>
                            <div className="pagination-controls">
                                <button
                                    className="pagination-btn"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    <ChevronLeftIcon />
                                </button>
                                {[...Array(Math.min(5, totalPages))].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        className={`pagination-btn ${page === i + 1 ? 'active' : ''}`}
                                        onClick={() => setPage(i + 1)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    className="pagination-btn"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                >
                                    <ChevronRightIcon />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {
                deleteModal.open && (
                    <div className={`modal-overlay ${modalClosing ? 'modal-exit' : 'modal-enter'}`} onClick={closeDeleteModal}>
                        <div className={`modal-content modal-confirm ${modalClosing ? 'modal-content-exit' : 'modal-content-enter'}`} onClick={e => e.stopPropagation()}>
                            <div className="modal-confirm-icon danger">
                                <TrashIcon style={{ width: 32, height: 32 }} />
                            </div>
                            <h3 className="modal-confirm-title">Leadni o'chirish</h3>
                            <p className="modal-confirm-text">
                                Haqiqatan ham ushbu leadni tizimdan butunlay o'chirib tashlamoqchimisiz?
                                <br />
                                <strong>{deleteModal.lead?.client_name || deleteModal.lead?.phone_number}</strong>
                            </p>
                            <div className="modal-confirm-actions">
                                <button className="btn-v2 btn-v2-dark" onClick={closeDeleteModal}>
                                    Bekor qilish
                                </button>
                                <button className="btn-v2 btn-v2-danger" onClick={handleDelete}>
                                    O'chirish
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Convert Lead Modal */}
            <ConvertLeadModal
                isOpen={convertModal.isOpen}
                lead={convertModal.lead}
                onClose={() => setConvertModal({ isOpen: false, lead: null })}
                onSuccess={fetchLeads}
            />
        </div >
    );
};

export default LeadsList;
