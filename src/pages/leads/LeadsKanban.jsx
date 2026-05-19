import React, { useState, useEffect, useCallback, useRef } from 'react';
import { leadService } from '../../services/leads';
import { getUsers } from '../../services/users';
import api from '../../services/api';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import StatusManagement from './StatusManagement';
import ConvertLeadModal from './ConvertLeadModal';
import QuickLeadForm from './QuickLeadForm';
import './StatusManagement.css';
import './LeadsKanban.css';
import { getForms } from '../../services/forms';



// Icons
const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const SettingsIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1-2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
);

const PhoneIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
);

const CalendarIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const UserIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const RefreshIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 4 23 10 17 10"></polyline>
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
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

// Stats Card Component
const StatCard = ({ title, value, icon, gradient }) => (
    <div className="stat-card" style={{ background: gradient }}>
        <div className="stat-info">
            <span className="stat-title">{title}</span>
            <span className="stat-value">{value}</span>
        </div>
        <div className="stat-icon">{icon}</div>
    </div>
);

// Lead Card Component
const LeadCard = ({ lead, onClick, onConvert, onArchive, onUnarchive, onDragStart, onDragEnd, selectMode, isSelected, onToggleSelect }) => {
    const formatDateTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
            'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}-${month} ${year} ${hours}:${minutes}`;
    };

    const formatPhone = (phone) => {
        if (!phone) return '';
        const digits = phone.replace(/\D/g, '');
        if (digits.length >= 12) {
            return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`;
        }
        return phone;
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const getStatusInfo = (status) => {
        const statusMap = {
            'answered': { label: 'Javob berdi', class: 'status-answered' },
            'not_answered': { label: 'Javob bermadi', class: 'status-not-answered' },
            'client_answered': { label: 'Mijoz javob berdi', class: 'status-client-answered' },
            'client_not_answered': { label: "Mijoz javob bermadi", class: 'status-client-not-answered' }
        };
        return statusMap[status] || null;
    };

    const statusInfo = getStatusInfo(lead.call_status);

    return (
        <div
            className={`lead-card ${isSelected ? 'lead-card-selected' : ''}`}
            draggable={!lead.is_converted && !selectMode}
            onDragStart={(e) => !selectMode && onDragStart(e, lead)}
            onDragEnd={onDragEnd}
            onClick={() => selectMode ? onToggleSelect(lead.id) : onClick()}
        >
            {selectMode && (
                <label className="lead-checkbox-wrapper" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        className="lead-checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(lead.id)}
                    />
                    <span className="lead-checkmark">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </span>
                </label>
            )}
            <div className="lead-card-top">
                <div className="lead-avatar">
                    {getInitials(lead.client_name)}
                </div>
                <div className="lead-info">
                    <span className="lead-name">{lead.client_name || "Noma'lum"}</span>
                    <span className="lead-date">
                        <CalendarIcon /> {formatDateTime(lead.created_at)}
                    </span>
                </div>
            </div>

            <div className="lead-card-row">
                <PhoneIcon />
                <span>{formatPhone(lead.phone_number)}</span>
            </div>

            {statusInfo && (
                <div className="lead-card-row">
                    <span className={`lead-status-badge ${statusInfo.class}`}>
                        {statusInfo.label}
                    </span>
                </div>
            )}

            {lead.is_considering && (
                <div className="lead-card-row">
                    <span style={{
                        background: 'rgba(245,158,11,0.12)', color: '#f59e0b',
                        padding: '2px 10px', borderRadius: '20px', fontSize: '11.5px',
                        fontWeight: 600, border: '1px solid rgba(245,158,11,0.25)',
                    }}>
                        🤔 O'ylab ko'ryabdi
                    </span>
                </div>
            )}

            {lead.activities_count > 0 && (
                <div className="lead-card-row">
                    <span style={{
                        background: 'rgba(59,130,246,0.1)', color: '#3b82f6',
                        padding: '2px 10px', borderRadius: '20px', fontSize: '11.5px',
                        fontWeight: 600, border: '1px solid rgba(59,130,246,0.2)',
                        display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                        🕒 {lead.activities_count} ta avvalgi murojaat
                    </span>
                </div>
            )}

            {lead.follow_up_date && (() => {
                const now = new Date();
                const followUp = new Date(lead.follow_up_date);
                const diffMs = followUp - now;
                const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                const dateStr = formatDateTime(lead.follow_up_date);

                let color, bg, icon, label;
                if (diffDays < 0) {
                    color = '#ef4444'; bg = 'rgba(239,68,68,0.1)';
                    icon = '⚠️'; label = `${Math.abs(diffDays)} kun o'tdi!`;
                } else if (diffDays === 0) {
                    color = '#f97316'; bg = 'rgba(249,115,22,0.1)';
                    icon = '📞'; label = 'Bugun!';
                } else if (diffDays <= 3) {
                    color = '#f59e0b'; bg = 'rgba(245,158,11,0.1)';
                    icon = '⏰'; label = `${diffDays} kun qoldi`;
                } else {
                    color = '#10b981'; bg = 'rgba(16,185,129,0.1)';
                    icon = '📅'; label = `${diffDays} kun qoldi`;
                }

                return (
                    <div className="lead-card-row" style={{
                        background: bg, borderRadius: '6px', padding: '4px 8px',
                        color, fontSize: '11.5px', fontWeight: 600, gap: '4px',
                        border: `1px solid ${color}22`,
                    }}>
                        <span>{icon}</span>
                        <span>{label}</span>
                        <span style={{ opacity: 0.7, marginLeft: 'auto', fontWeight: 500 }}>{dateStr}</span>
                    </div>
                );
            })()}

            <div className="lead-card-actions">
                <span className="action-link" onClick={(e) => { e.stopPropagation(); onClick(); }}>
                    Tahrirlash
                </span>
                {!lead.is_converted && (
                    <span className="action-link delete" onClick={(e) => { e.stopPropagation(); onConvert(lead); }}>
                        Aylantirish
                    </span>
                )}
                {lead.is_archived ? (
                    <span className="action-link archive" onClick={(e) => { e.stopPropagation(); onUnarchive(lead); }}>
                        📤 Arxivdan chiqarish
                    </span>
                ) : (
                    <span className="action-link archive" onClick={(e) => { e.stopPropagation(); onArchive(lead); }}>
                        📦 Arxivlash
                    </span>
                )}
            </div>
        </div>
    );
};

import ScrollHint from '../../components/ScrollHint';

const LeadsKanban = () => {
    const { openEditModal, refreshTrigger, updateTotalLeads } = useOutletContext();
    const { user } = useAuth();

    const [columns, setColumns] = useState([]);
    const [stats, setStats] = useState({ total: 0, today: 0, converted: 0, answered: 0 });
    const [loading, setLoading] = useState(true);
    const [globalSearch, setGlobalSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [convertModal, setConvertModal] = useState({ isOpen: false, lead: null });
    const [draggedLead, setDraggedLead] = useState(null);
    const [quickAddColumn, setQuickAddColumn] = useState(null);
    const [availableForms, setAvailableForms] = useState([]);
    const [formFilter, setFormFilter] = useState('all');
    const [operatorFilter, setOperatorFilter] = useState('all');
    const [followUpFilter, setFollowUpFilter] = useState('all');
    const [operators, setOperators] = useState([]);
    const [isExporting, setIsExporting] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(globalSearch);
        }, 500);
        return () => clearTimeout(timer);
    }, [globalSearch]);

    const isManager = user?.is_superuser || user?.permissions?.can_view_users;
    const [archivedFilter, setArchivedFilter] = useState('active');
    const [callFilter, setCallFilter] = useState('all');
    const [selectMode, setSelectMode] = useState(false);
    const [selectedLeads, setSelectedLeads] = useState(new Set());
    const [selectAllInDb, setSelectAllInDb] = useState(false);
    const [bulkOperator, setBulkOperator] = useState('');
    const [bulkStage, setBulkStage] = useState('');
    const [bulkAssigning, setBulkAssigning] = useState(false);
    const [bulkUpdatingStage, setBulkUpdatingStage] = useState(false);

    const toggleSelectLead = (leadId) => {
        setSelectAllInDb(false); // Manually selecting disables "select all in DB" mode
        setSelectedLeads(prev => {
            const next = new Set(prev);
            if (next.has(leadId)) next.delete(leadId);
            else next.add(leadId);
            return next;
        });
    };

    const selectAllInDbAction = () => {
        setSelectAllInDb(true);
        setSelectedLeads(new Set()); // Clear individual selections when selecting all in DB
    };

    const toggleSelectAllInDb = () => {
        setSelectAllInDb(!selectAllInDb);
    };

    const getFilterParams = () => {
        const params = {};
        if (debouncedSearch) params.search = debouncedSearch;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        if (operatorFilter !== 'all') params.operator = operatorFilter;
        if (followUpFilter !== 'all') params.follow_up = followUpFilter;
        if (archivedFilter === 'archived') params.archived_only = 'true';
        if (archivedFilter === 'all') params.show_archived = 'true';
        if (callFilter !== 'all') params.is_called = callFilter;
        return params;
    };

    const handleBulkAssign = async () => {
        if (!bulkOperator || (selectedLeads.size === 0 && !selectAllInDb)) return;
        setBulkAssigning(true);
        try {
            const data = {
                operator_id: parseInt(bulkOperator),
                lead_ids: selectAllInDb ? [] : [...selectedLeads],
                select_all: selectAllInDb,
                ...getFilterParams()
            };
            const res = await leadService.bulkAssign(data);
            toast.success(`${res.data.updated} ta lead ${res.data.operator} ga biriktirildi!`);
            setSelectMode(false);
            setSelectedLeads(new Set());
            setSelectAllInDb(false);
            setBulkOperator('');
            loadData();
        } catch {
            toast.error('Biriktirishda xatolik!');
        } finally {
            setBulkAssigning(false);
        }
    };

    const handleBulkUpdateStage = async () => {
        if (!bulkStage || (selectedLeads.size === 0 && !selectAllInDb)) return;
        setBulkUpdatingStage(true);
        try {
            const data = {
                target_stage_id: parseInt(bulkStage),
                lead_ids: selectAllInDb ? [] : [...selectedLeads],
                select_all: selectAllInDb,
                ...getFilterParams()
            };
            const res = await leadService.bulkUpdateStage(data);
            toast.success(`${res.data.updated_count} ta lead "${res.data.target_stage}" bosqichiga o'tkazildi!`);
            setSelectMode(false);
            setSelectedLeads(new Set());
            setSelectAllInDb(false);
            setBulkStage('');
            loadData();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Bosqichni o\'zgartirishda xatolik!');
        } finally {
            setBulkUpdatingStage(false);
        }
    };

    useEffect(() => {
        const fetchUserData = async () => {
            if (isManager) {
                try {
                    const opsRes = await getUsers({ is_operator: 'true' });
                    setOperators(opsRes.data?.results || opsRes.data || []);
                } catch (error) {
                    console.error("Operators fetch error:", error);
                }
            }
        };
        fetchUserData();
    }, [isManager]);

    useEffect(() => {
        const fetchForms = async () => {
            try {
                const response = await getForms();
                const formsData = response.data?.results || response.data;
                setAvailableForms(Array.isArray(formsData) ? formsData : []);
            } catch (error) {
                console.error("Fetch forms error:", error);
            }
        };
        fetchForms();
    }, []);

    // Infinite scroll uchun loading state
    const loadingMoreRef = useRef({});
    // Drag auto-scroll uchun ref
    const scrollContainerRef = useRef(null);

    const loadData = async (signal) => {
        if (columns.length === 0) setLoading(true);
        try {
            const params = {};
            if (debouncedSearch) params.search = debouncedSearch;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
            if (operatorFilter !== 'all') params.operator = operatorFilter;
            if (followUpFilter !== 'all') params.follow_up = followUpFilter;
            if (archivedFilter === 'archived') params.archived_only = 'true';
            if (archivedFilter === 'all') params.show_archived = 'true';
            if (callFilter !== 'all') params.is_called = callFilter;

            const [kanbanRes, statsRes] = await Promise.all([
                leadService.getKanban(params, { signal }),
                leadService.getStatistics(params, { signal }).catch(() => ({ data: {} }))
            ]);
            // Har bir ustun uchun page=1 va has_more qo'shish
            const columnsWithPage = (Array.isArray(kanbanRes.data) ? kanbanRes.data : []).map(col => ({
                ...col,
                page: 1,
                loadingMore: false,
            }));
            setColumns(columnsWithPage);
            loadingMoreRef.current = {};
            if (statsRes.data) {
                setStats({
                    total: statsRes.data.total || 0,
                    today: statsRes.data.today || 0,
                    converted: statsRes.data.converted || 0,
                    answered: statsRes.data.answered || 0
                });
                if (updateTotalLeads) updateTotalLeads(statsRes.data.total || 0);
            }
        } catch (error) {
            if (error.name === 'CanceledError' || error.name === 'AbortError') {
                // So'rov bekor qilindi, xatolik chiqarmaymiz
                return;
            }
            console.error("Load error:", error);
        } finally {
            if (columns.length === 0) setLoading(false);
        }
    };

    /* WebSocket orqali real-time yangilanishlar vaqtincha o'chirildi
    useEffect(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host; // Bu frontend hosti, lekin API o'sha hostda yoki biz biladigan hostda

        // Agar frontend va backend har xil portda bo'lsa (development dagi kabi)
        const wsHost = host.includes('localhost') || host.includes('127.0.0.1')
            ? 'localhost:8000'
            : host;

        const wsUrl = `${protocol}//${wsHost}/ws/leads/`;
        let socket = null;
        let reconnectTimer = null;

        const connect = () => {
            console.log("Connecting to WebSocket:", wsUrl);
            socket = new WebSocket(wsUrl);

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'lead_update') {
                    console.log("Lead update received via WebSocket:", data.message);
                    // Ma'lumotlarni yangilash
                    loadData();
                }
            };

            socket.onclose = () => {
                console.log("WebSocket connection closed. Reconnecting...");
                reconnectTimer = setTimeout(connect, 3000); // 3 soniyadan keyin qayta ulanish
            };

            socket.onerror = (error) => {
                console.error("WebSocket error:", error);
                socket.close();
            };
        };

        connect();

        return () => {
            if (socket) {
                socket.onclose = null; // Reconnect ni to'xtatish
                socket.close();
            }
            if (reconnectTimer) clearTimeout(reconnectTimer);
        };
    }, []); // Bir marta o'rnatiladi
    */

    // Bosqich uchun qo'shimcha leadlarni yuklash
    const loadMoreForColumn = useCallback(async (columnId) => {
        // Takroriy so'rovni oldini olish
        if (loadingMoreRef.current[columnId]) return;

        const col = columns.find(c => c.id === columnId);
        if (!col || !col.has_more) return;

        loadingMoreRef.current[columnId] = true;
        setColumns(prev => prev.map(c =>
            c.id === columnId ? { ...c, loadingMore: true } : c
        ));

        try {
            const nextPage = (col.page || 1) + 1;
            const params = { stage_id: columnId, page: nextPage };
            if (debouncedSearch) params.search = debouncedSearch;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
            if (operatorFilter !== 'all') params.operator = operatorFilter;
            if (followUpFilter !== 'all') params.follow_up = followUpFilter;
            if (archivedFilter === 'archived') params.archived_only = 'true';
            if (archivedFilter === 'all') params.show_archived = 'true';
            if (callFilter !== 'all') params.is_called = callFilter;

            const res = await leadService.loadMoreKanban(params);

            setColumns(prev => prev.map(c => {
                if (c.id !== columnId) return c;
                // Duplikat leadlarni oldini olish
                const existingIds = new Set((c.items || []).map(i => i.id));
                const newItems = (Array.isArray(res.data.items) ? res.data.items : []).filter(i => !existingIds.has(i.id));
                return {
                    ...c,
                    items: [...c.items, ...newItems],
                    has_more: res.data.has_more,
                    total_count: res.data.total_count,
                    page: nextPage,
                    loadingMore: false,
                };
            }));
        } catch (error) {
            console.error('Load more error:', error);
            setColumns(prev => prev.map(c =>
                c.id === columnId ? { ...c, loadingMore: false } : c
            ));
        } finally {
            loadingMoreRef.current[columnId] = false;
        }
    }, [columns, debouncedSearch, dateFrom, dateTo, operatorFilter, followUpFilter, archivedFilter, callFilter]);

    // Ustun scroll handler
    const handleColumnScroll = useCallback((e, columnId) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop - clientHeight < 150) {
            loadMoreForColumn(columnId);
        }
    }, [loadMoreForColumn]);

    useEffect(() => {
        const controller = new AbortController();
        loadData(controller.signal);
        
        return () => {
            controller.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshTrigger, debouncedSearch, dateFrom, dateTo, operatorFilter, followUpFilter, archivedFilter, callFilter]);

    // Drag auto-scroll: useEffect bilan document level da ishlaydi
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || !draggedLead) return;

        let animId = null;
        let scrollDir = 0; // -1 chap, 0 to'xtash, 1 o'ng

        const animate = () => {
            if (scrollDir !== 0) {
                container.scrollLeft += scrollDir;
            }
            animId = requestAnimationFrame(animate);
        };
        animId = requestAnimationFrame(animate);

        const onDragOver = (e) => {
            const rect = container.getBoundingClientRect();
            const edgeZone = 100;
            const mouseX = e.clientX;

            if (mouseX < rect.left + edgeZone) {
                // Chetga yaqinroq = tezroq
                const ratio = 1 - (mouseX - rect.left) / edgeZone;
                scrollDir = -Math.max(6, Math.round(ratio * 40));
            } else if (mouseX > rect.right - edgeZone) {
                const ratio = 1 - (rect.right - mouseX) / edgeZone;
                scrollDir = Math.max(6, Math.round(ratio * 40));
            } else {
                scrollDir = 0;
            }
        };

        document.addEventListener('dragover', onDragOver);
        return () => {
            document.removeEventListener('dragover', onDragOver);
            cancelAnimationFrame(animId);
        };
    }, [draggedLead]);

    // Drag and drop handlers
    const handleDragStart = (e, lead) => {
        if (lead.is_converted) return;
        setDraggedLead(lead);
        e.dataTransfer.effectAllowed = 'move';
        e.target.classList.add('dragging');
    };

    const handleDragEnd = (e) => {
        e.target.classList.remove('dragging');
        setDraggedLead(null);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    };

    const handleDragLeave = (e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        e.currentTarget.classList.remove('drag-over');
    };

    const handleDrop = async (e, targetStageId) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');


        if (!draggedLead || draggedLead.stage === targetStageId) {

            return;
        }

        const sourceStageId = draggedLead.stage;
        const previousColumns = [...columns];


        // Optimistic Update
        setColumns(prev => {
            return prev.map(col => {
                if (col.id === sourceStageId) {
                    return { ...col, items: (col.items || []).filter(item => item.id !== draggedLead.id) };
                }
                if (col.id === targetStageId) {
                    // Yangi lidni eng tepaga qo'shamiz (yangidan eskiga tartib bo'lgani uchun)
                    return { ...col, items: [{ ...draggedLead, stage: targetStageId }, ...(col.items || [])] };
                }
                return col;
            });
        });

        try {
            await leadService.patch(draggedLead.id, { stage: targetStageId });

            toast.success("Lead bosqichi o'zgartirildi");
            // Orqa fonda ma'lumotni to'liq yangilaymiz
            loadData();
        } catch (error) {

            console.error(error);
            toast.error("Xatolik yuz berdi, o'zgarish bekor qilindi");
            // Rollback
            setColumns(previousColumns);
        }
    };

    const getDefaultColor = (index) => {
        const colors = ['#eab308', '#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];
        return colors[index % colors.length];
    };

    // Arxivlash handler
    const handleArchive = async (lead) => {
        if (!window.confirm(`"${lead.client_name || lead.phone_number}" leadni arxivlashni istaysizmi?\n\nArxivlangan lead kanban va analitikada ko'rinmaydi.`)) return;

        // Optimistic: leadni ustundan olib tashlash
        setColumns(prev => prev.map(col => ({
            ...col,
            items: (col.items || []).filter(i => i.id !== lead.id),
            total_count: col.items?.some(i => i.id === lead.id) ? (col.total_count || 0) - 1 : col.total_count,
        })));

        try {
            await leadService.archive(lead.id);
            toast.success('Lead arxivlandi');
            loadData();
        } catch (error) {
            console.error('Archive error:', error);
            toast.error('Arxivlashda xatolik');
            loadData();
        }
    };

    const handleUnarchive = async (lead) => {
        try {
            await leadService.unarchive(lead.id);
            toast.success('Lead arxivdan chiqarildi');
            loadData();
        } catch {
            toast.error('Arxivdan chiqarishda xatolik');
        }
    };

    return (
        <div className="leads-kanban-container">
            {/* Stats Row */}
            <div className="stats-row">
                <StatCard
                    title="Jami Leadlar"
                    value={stats.total}
                    gradient="var(--gradient-primary)"
                    icon={<PhoneIcon />}
                />
                <StatCard
                    title="Bugungi"
                    value={stats.today}
                    gradient="var(--gradient-success)"
                    icon={<CalendarIcon />}
                />
                <StatCard
                    title="Mijozga Aylangan"
                    value={stats.converted}
                    gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                    icon={<UserIcon />}
                />
                <StatCard
                    title="Javob Bergan"
                    value={stats.answered}
                    gradient="linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"
                    icon={<PhoneIcon />}
                />
            </div>

            {/* Follow-up Alerts Banner */}
            {(() => {
                const now = new Date();
                let overdue = 0, today = 0, soon = 0;
                columns.forEach(col => {
                    (col.items || []).forEach(lead => {
                        if (!lead.follow_up_date) return;
                        const diff = Math.ceil((new Date(lead.follow_up_date) - now) / (1000 * 60 * 60 * 24));
                        if (diff < 0) overdue++;
                        else if (diff === 0) today++;
                        else if (diff <= 3) soon++;
                    });
                });
                if (overdue === 0 && today === 0 && soon === 0) return null;
                return (
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: '10px', padding: '10px 14px',
                        borderRadius: '10px', marginBottom: '12px',
                        background: overdue > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                        border: `1px solid ${overdue > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
                    }}>
                        {overdue > 0 && (
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                ⚠️ {overdue} ta leadning muddati o'tgan
                                <button onClick={() => setFollowUpFilter('overdue')} style={{
                                    fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '6px',
                                    border: '1px solid #ef4444', background: '#ef4444', color: '#fff', cursor: 'pointer',
                                }}>Ko'rish</button>
                            </span>
                        )}
                        {today > 0 && (
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f97316', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                📞 {today} ta leadga bugun qo'ng'iroq qilish kerak
                                <button onClick={() => setFollowUpFilter('today')} style={{
                                    fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '6px',
                                    border: '1px solid #f97316', background: '#f97316', color: '#fff', cursor: 'pointer',
                                }}>Ko'rish</button>
                            </span>
                        )}
                        {soon > 0 && (
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                ⏰ {soon} ta lead 3 kun ichida
                                <button onClick={() => setFollowUpFilter('soon')} style={{
                                    fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '6px',
                                    border: '1px solid #f59e0b', background: '#f59e0b', color: '#fff', cursor: 'pointer',
                                }}>Ko'rish</button>
                            </span>
                        )}
                    </div>
                );
            })()}

            {/* Toolbar */}
            <div className="leads-toolbar">
                <div className="toolbar-left">
                    <div className="leads-search-box">
                        <SearchIcon />
                        <input
                            type="text"
                            placeholder="Qidirish..."
                            value={globalSearch}
                            onChange={(e) => setGlobalSearch(e.target.value)}
                        />
                    </div>
                    <div className="date-filter-group">
                        <div className="date-filter">
                            <label>Dan</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                        <span className="date-filter-divider"></span>
                        <div className="date-filter">
                            <label>Gacha</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                        {(dateFrom || dateTo) && (
                            <button
                                className="clear-filter-btn"
                                onClick={() => { setDateFrom(''); setDateTo(''); }}
                                title="Filterni tozalash"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div className="filter-group-v2">
                        {isManager && (
                            <select
                                className="toolbar-select"
                                value={operatorFilter}
                                onChange={(e) => setOperatorFilter(e.target.value)}
                            >
                                <option value="all">Barcha operatorlar</option>
                                {operators.map(op => (
                                    <option key={op.id} value={op.id}>
                                        {op.first_name ? `${op.first_name} ${op.last_name || ''}` : op.username}
                                    </option>
                                ))}
                            </select>
                        )}

                        <select
                            className="toolbar-select"
                            value={archivedFilter}
                            onChange={(e) => setArchivedFilter(e.target.value)}
                        >
                            <option value="active">📋 Faol leadlar</option>
                            <option value="archived">📦 Arxivlanganlar</option>
                            <option value="all">🗂️ Barchasi</option>
                        </select>

                        <select
                            className="toolbar-select"
                            value={callFilter}
                            onChange={(e) => setCallFilter(e.target.value)}
                        >
                            <option value="all">📞 Barchasi</option>
                            <option value="true">✅ Qo'ng'iroq orqali</option>
                            <option value="false">📋 Boshqalar</option>
                        </select>

                        <select
                            className="toolbar-select"
                            value={followUpFilter}
                            onChange={(e) => setFollowUpFilter(e.target.value)}
                        >
                            <option value="all">Qayta aloqa (Barchasi)</option>
                            <option value="today">☎️ Bugun</option>
                            <option value="overdue">⚠️ Muddati o'tgan</option>
                            <option value="soon">⏰ Yaqin 3 kun</option>
                            <option value="planned">📅 Rejalashtirilgan</option>
                            <option value="none">⚪ Belgilanmagan</option>
                        </select>
                    </div>

                    <button className="btn-v2 btn-v2-dark" onClick={loadData}>
                        <RefreshIcon />
                        <span>Yangilash</span>
                    </button>

                    {isManager && (
                        <button
                            className={`btn-v2 ${selectMode ? 'btn-v2-primary' : 'btn-v2-dark'}`}
                            onClick={() => {
                                setSelectMode(!selectMode);
                                if (selectMode) {
                                    setSelectedLeads(new Set());
                                    setSelectAllInDb(false);
                                    setBulkOperator('');
                                    setBulkStage('');
                                }
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 11 12 14 22 4"></polyline>
                                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                            </svg>
                            <span>{selectMode ? 'Bekor qilish' : 'Tanlash'}</span>
                        </button>
                    )}
                </div>

                {selectMode && (
                    <div className="bulk-actions-container">
                        <div className="bulk-assign-bar">
                            <span className="bulk-count-badge">
                                ✓ {selectAllInDb ? stats.total : selectedLeads.size} ta tanlandi
                            </span>
                            
                            {!selectAllInDb && (
                                <button className="btn-v2 btn-v2-primary-sm" onClick={selectAllInDbAction}>
                                    Barchasini tanlash ({stats.total})
                                </button>
                            )}

                            {selectAllInDb && (
                                <button className="btn-v2 btn-v2-ghost-sm active" onClick={() => setSelectAllInDb(false)}>
                                    Tanlovni bekor qilish
                                </button>
                            )}

                            <div className="bulk-actions-divider"></div>

                            <div className="bulk-action-group">
                                <select
                                    className="toolbar-select"
                                    value={bulkOperator}
                                    onChange={(e) => setBulkOperator(e.target.value)}
                                >
                                    <option value="">Operatorga biriktirish</option>
                                    {operators.map(op => (
                                        <option key={op.id} value={op.id}>
                                            {op.first_name ? `${op.first_name} ${op.last_name || ''}` : op.username}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    className="btn-v2 btn-v2-primary"
                                    onClick={handleBulkAssign}
                                    disabled={(selectedLeads.size === 0 && !selectAllInDb) || !bulkOperator || bulkAssigning}
                                >
                                    {bulkAssigning ? '...' : 'OK'}
                                </button>
                            </div>

                            <div className="bulk-action-group">
                                <select
                                    className="toolbar-select"
                                    value={bulkStage}
                                    onChange={(e) => setBulkStage(e.target.value)}
                                >
                                    <option value="">Bosqichni o'zgartirish</option>
                                    {columns.map(stage => (
                                        <option key={stage.id} value={stage.id}>
                                            {stage.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    className="btn-v2 btn-v2-primary"
                                    onClick={handleBulkUpdateStage}
                                    disabled={(selectedLeads.size === 0 && !selectAllInDb) || !bulkStage || bulkUpdatingStage}
                                >
                                    {bulkUpdatingStage ? '...' : 'OK'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="toolbar-right">
                    <button
                        className="btn-v2 btn-v2-dark"
                        onClick={async () => {
                            try {
                                const params = {};
                                if (globalSearch) params.search = globalSearch;
                                if (dateFrom) params.date_from = dateFrom;
                                if (dateTo) params.date_to = dateTo;
                                if (operatorFilter !== 'all') params.operator = operatorFilter;
                                if (followUpFilter !== 'all') params.follow_up = followUpFilter;
                                if (archivedFilter === 'archived') params.archived_only = 'true';
                                if (archivedFilter === 'all') params.show_archived = 'true';
                                if (callFilter !== 'all') params.is_called = callFilter;

                                const response = await leadService.exportExcel(params);
                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', `leadlar_${new Date().toISOString().slice(0, 10)}.xlsx`);
                                document.body.appendChild(link);
                                link.click();
                                link.remove();
                                window.URL.revokeObjectURL(url);
                            } catch {
                                toast.error('Export qilishda xatolik');
                            }
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        <span>Export</span>
                    </button>
                    <button
                        className="btn-v2 btn-v2-dark"
                        onClick={() => setShowStatusModal(true)}
                    >
                        <SettingsIcon />
                        <span>Bosqichlarni boshqarish</span>
                    </button>
                </div>
            </div>

            <ScrollHint />

            {/* Kanban Board */}
            {loading ? (
                <div className="kanban-loading">
                    <div className="spinner"></div>
                </div>
            ) : (
                <div className="kanban-scroll-container" ref={scrollContainerRef}>
                    <div className="kanban-board">
                        {columns.map((col, index) => (
                            <div
                                key={col.id}
                                className="kanban-column"
                                style={{ '--column-color': col.color || getDefaultColor(index) }}
                                onDragOver={handleDragOver}
                                onDragEnter={(e) => handleDragEnter(e, col.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, col.id)}
                            >
                                <div className="column-header">
                                    <div className="column-title">
                                        <span className="title-text">{col.name}</span>
                                        <span className="item-count">
                                            {(col.name.toLowerCase() === 'formalar' && formFilter !== 'all')
                                                ? col.items?.filter(l => l.source_form === parseInt(formFilter)).length
                                                : (col.total_count || col.items?.length || 0)
                                            }
                                        </span>
                                    </div>
                                    {col.name.toLowerCase() === 'formalar' && (
                                        <select
                                            className="column-filter-select"
                                            value={formFilter}
                                            onChange={(e) => setFormFilter(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <option value="all">Barcha formalar</option>
                                            {availableForms.map(f => (
                                                <option key={f.id} value={f.id}>{f.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {quickAddColumn === col.id ? (
                                    <div className="quick-add-wrapper slide-down">
                                        <QuickLeadForm
                                            stageId={col.id}
                                            onCancel={() => setQuickAddColumn(null)}
                                            onSuccess={() => {
                                                setQuickAddColumn(null);
                                                loadData();
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <button
                                        className="add-lead-button"
                                        onClick={() => setQuickAddColumn(col.id)}
                                    >
                                        + Lead qo'shish
                                    </button>
                                )}

                                <div
                                    className="column-items"
                                    onScroll={(e) => handleColumnScroll(e, col.id)}
                                >
                                    {col.items?.filter(lead => {
                                        if (col.name.toLowerCase() === 'formalar' && formFilter !== 'all') {
                                            return lead.source_form === parseInt(formFilter);
                                        }
                                        return true;
                                    }).map(lead => (
                                        <LeadCard
                                            key={lead.id}
                                            lead={lead}
                                            onClick={() => openEditModal(lead)}
                                            onConvert={(l) => setConvertModal({ isOpen: true, lead: l })}
                                            onArchive={handleArchive}
                                            onUnarchive={handleUnarchive}
                                            onDragStart={handleDragStart}
                                            onDragEnd={handleDragEnd}
                                            selectMode={selectMode}
                                            isSelected={selectAllInDb || selectedLeads.has(lead.id)}
                                            onToggleSelect={toggleSelectLead}
                                        />
                                    ))}
                                    {(!col.items || col.items.length === 0) && (
                                        <div className="empty-column">
                                            <span>Lead yo'q</span>
                                        </div>
                                    )}
                                    {col.loadingMore && (
                                        <div className="load-more-spinner">
                                            <div className="spinner-small"></div>
                                            <span>Yuklanmoqda...</span>
                                        </div>
                                    )}
                                    {col.has_more && !col.loadingMore && (
                                        <div className="load-more-hint">
                                            <span>Pastga suring — yana {col.total_count - (col.items?.length || 0)} ta</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Status Management Modal */}
            <StatusManagement
                isOpen={showStatusModal}
                onClose={() => setShowStatusModal(false)}
                onSuccess={loadData}
            />

            {/* Convert Lead Modal */}
            <ConvertLeadModal
                isOpen={convertModal.isOpen}
                lead={convertModal.lead}
                onClose={() => setConvertModal({ isOpen: false, lead: null })}
                onSuccess={loadData}
            />
        </div>
    );
};

export default LeadsKanban;
