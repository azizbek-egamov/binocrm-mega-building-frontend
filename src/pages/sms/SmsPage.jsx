import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Plus,
    MessageSquare,
    History,
    Send,
    Trash2,
    RefreshCw,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    X,
    Copy,
    Wallet
} from 'lucide-react';
import { toast } from 'sonner';
import smsService from '../../services/sms';
import './SmsPage.css';

const SmsPage = () => {
    const [templates, setTemplates] = useState([]);
    const [eskizTemplates, setEskizTemplates] = useState([]);
    const [history, setHistory] = useState([]);
    const [eskizHistory, setEskizHistory] = useState([]);
    const [eskizInfo, setEskizInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [infoLoading, setInfoLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('templates'); // 'templates' or 'history'
    const [errorBanner, setErrorBanner] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Modals
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [isManualSmsModalOpen, setIsManualSmsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [modalClosing, setModalClosing] = useState(false);

    // Form states
    const [newTemplate, setNewTemplate] = useState({ name: '', text: '', saveToEskiz: false });
    const [manualSms, setManualSms] = useState({ phone: '+998 ', message: '' });

    const formatPhoneNumber = (value) => {
        if (!value) return '+998 ';

        let digits = value.replace(/\D/g, '');

        // Agar +998 o'chib ketgan bo'lsa, qaytaramiz
        if (!digits.startsWith('998')) {
            digits = '998' + digits;
        }

        // Faqat 12 ta raqamgacha ruxsat beramiz
        digits = digits.substring(0, 12);

        let formatted = '+998';
        if (digits.length > 3) {
            formatted += ' (' + digits.substring(3, 5);
        }
        if (digits.length > 5) {
            formatted += ') ' + digits.substring(5, 8);
        }
        if (digits.length > 8) {
            formatted += '-' + digits.substring(8, 10);
        }
        if (digits.length > 10) {
            formatted += '-' + digits.substring(10, 12);
        }

        return formatted;
    };

    const handlePhoneChange = (e) => {
        const formatted = formatPhoneNumber(e.target.value);
        setManualSms(prev => ({ ...prev, phone: formatted }));
    };

    useEffect(() => {
        fetchLocalData();
        fetchEskizInfo();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reset page when tab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    const fetchLocalData = async () => {
        try {
            const [tplRes, histRes] = await Promise.all([
                smsService.getTemplates(),
                smsService.getHistory()
            ]);
            setTemplates(tplRes.data.results || tplRes.data);
            setHistory(histRes.data.results || histRes.data);
        } catch (error) {
            console.error('Local data fetch error:', error);
        }
    };

    const fetchEskizInfo = async () => {
        try {
            setInfoLoading(true);
            setErrorBanner(null);
            const res = await smsService.getEskizInfo();
            setEskizInfo(res.data);

            if (res.data.success) {
                fetchEskizData();
            } else {
                setErrorBanner(res.data.error || 'Eskiz API ulanishida noma\'lum xato');
            }
        } catch {
            setEskizInfo({ success: false });
            setErrorBanner('Server bilan bog\'lanishda xato yuz berdi');
        } finally {
            setInfoLoading(false);
        }
    };

    const fetchEskizData = async () => {
        try {
            const [tplRes, histRes] = await Promise.all([
                smsService.getEskizTemplates(),
                smsService.getEskizHistory()
            ]);
            setEskizTemplates(tplRes.data.data || tplRes.result || []);
            setEskizHistory(histRes.data.data || histRes.result || []);
        } catch (error) {
            console.error('Eskiz data fetch error:', error);
        }
    };

    const handleCreateTemplate = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);

            let success = false;

            // Agar Eskizga yuborish tanlangan bo'lsa
            if (newTemplate.saveToEskiz && isServiceActive) {
                if (newTemplate.text.length < 10) {
                    toast.error('Eskiz shabloni kamida 10 ta belgidan iborat bo\'lishi kerak');
                    setLoading(false);
                    return;
                }
                const eskizRes = await smsService.createEskizTemplate({
                    text: newTemplate.text
                });
                if (eskizRes.data.success) {
                    toast.success('Eskiz moderatsiyasiga yuborildi');
                    success = true;
                } else {
                    toast.error('Eskizga yuborishda xatolik: ' + eskizRes.data.message);
                    // Agar Eskiz xato bersa, mahalliyga saqlab qo'yamiz
                    await smsService.createTemplate({
                        name: newTemplate.name,
                        text: newTemplate.text
                    });
                    toast.info('Shablon mahalliy bazada saqlandi');
                    success = true;
                }
            } else {
                // Oddiy mahalliy saqlash
                await smsService.createTemplate({
                    name: newTemplate.name,
                    text: newTemplate.text
                });
                toast.success('Shablon muvaffaqiyatli saqlandi');
                success = true;
            }

            if (success) {
                setNewTemplate({ name: '', text: '', saveToEskiz: false });
                closeModal(setIsTemplateModalOpen);
                fetchLocalData();
                fetchEskizData();
            }
        } catch {
            toast.error('Xatolik yuz berdi');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTemplate = async (id) => {
        if (!window.confirm('Haqiqatdan ham o\'chirmoqchimisiz?')) return;
        try {
            await smsService.deleteTemplate(id);
            toast.success('O\'chirildi');
            fetchLocalData();
        } catch {
            toast.error('Xatolik yuz berdi');
        }
    };

    const handleSendManualSms = async (e) => {
        e.preventDefault();

        // Clean phone for API (only digits)
        const cleanPhone = manualSms.phone.replace(/\D/g, '');
        if (cleanPhone.length !== 12) {
            toast.error('Telefon raqami noto\'g\'ri kiritilgan');
            return;
        }

        if (manualSms.message.length < 2) {
            toast.error('Xabar matni juda kiska');
            return;
        }
        try {
            setLoading(true);
            const res = await smsService.sendManual({
                ...manualSms,
                phone: cleanPhone
            });
            if (res.data.success) {
                toast.success('Xabar yuborildi');
                closeModal(setIsManualSmsModalOpen);
                setManualSms({ phone: '+998 ', message: '' });
                fetchLocalData();
                fetchEskizData();
            } else {
                toast.error(res.data.error || 'Xabar yuborilmadi');
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Tizim xatosi');
        } finally {
            setLoading(false);
        }
    };

    const handleViewTemplate = (tpl) => {
        setSelectedTemplate(tpl);
        setIsDetailModalOpen(true);
    };

    const handleSyncToEskiz = async (tpl) => {
        if (tpl.text.length < 10) {
            toast.error('Eskiz shabloni kamida 10 ta belgidan iborat bo\'lishi kerak');
            return;
        }
        try {
            setLoading(true);
            const res = await smsService.createEskizTemplate({
                text: tpl.text
            });
            if (res.data.success) {
                toast.success('Moderatsiyaga yuborildi');
                // Eskizga yuborilgach mahalliy bazadan o'chirish (foydalanuvchi xohishi)
                if (tpl.source === 'local') {
                    await smsService.deleteTemplate(tpl.id);
                }
                closeModal(setIsDetailModalOpen);
                fetchLocalData();
                fetchEskizData();
            } else {
                toast.error(res.data.message || 'Xatolik yuz berdi');
            }
        } catch {
            toast.error('Tizim xatosi');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text, e) => {
        if (e) e.stopPropagation();
        navigator.clipboard.writeText(text);
        toast.success('Xabar nusxalandi');
    };

    const closeModal = (setOpen) => {
        setModalClosing(true);
        setTimeout(() => {
            setOpen(false);
            setModalClosing(false);
        }, 300);
    };

    const isServiceActive = eskizInfo?.success;

    // Data combining and pagination
    const combinedTemplates = [
        ...templates.map(t => ({ ...t, source: 'local' })),
        ...eskizTemplates.map(t => ({ ...t, source: 'eskiz' }))
    ];

    const combinedHistory = [
        ...history.map(h => ({ ...h, source: 'local' })),
        ...eskizHistory.map(h => ({ ...h, source: 'eskiz' }))
    ].sort((a, b) => {
        const dateA = a.sent_at ? new Date(a.sent_at) : new Date(0);
        const dateB = b.sent_at ? new Date(b.sent_at) : new Date(0);
        return dateB - dateA;
    });

    const activeData = activeTab === 'templates' ? combinedTemplates : combinedHistory;
    const totalItems = activeData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginatedData = activeData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const renderPagination = () => {
        if (totalPages <= 1) return null;

        return (
            <div className="pagination-container">
                <div className="pagination-info">
                    Sahifa {currentPage} / {totalPages} (Jami {totalItems} ta)
                </div>
                <div className="pagination-controls">
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        &lt;
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                            onClick={() => setCurrentPage(i + 1)}
                        >
                            {i + 1}
                        </button>
                    )).slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))}
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        &gt;
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="sms-page-refined">
            <div className="page-header">
                <div className="header-left">
                    <div>
                        <h1 className="page-title">SMS Xizmati</h1>
                        <p className="page-subtitle">Mijozlar bilan aloqani boshqarish</p>
                    </div>
                </div>
                <div className="header-actions">
                    <div className="eskiz-balance-widget">
                        <div className="widget-icon">
                            <Wallet size={18} />
                        </div>
                        <div className="balance-info-mini">
                            <span className="label">Eskiz Balans:</span>
                            <span className="value">
                                {infoLoading ? '...' : (isServiceActive && eskizInfo?.data?.data?.balance ? Number(eskizInfo.data.data.balance).toLocaleString() + " so'm" : '0 so\'m')}
                            </span>
                        </div>
                        <button className="btn-refresh-mini" onClick={fetchEskizInfo} title="Yangilash">
                            <RefreshCw size={14} className={infoLoading ? 'spin' : ''} />
                        </button>
                    </div>
                    <button
                        className="btn-secondary"
                        onClick={() => setIsTemplateModalOpen(true)}
                        disabled={!isServiceActive || loading}
                    >
                        <Plus size={18} />
                        Shablon qo'shish
                    </button>
                    <button
                        className="btn-primary"
                        onClick={() => setIsManualSmsModalOpen(true)}
                        disabled={!isServiceActive || loading}
                    >
                        <Send size={18} />
                        SMS Yuborish
                    </button>
                </div>
            </div>

            {errorBanner && (
                <div className="sms-error-alert" style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid #ef4444',
                    borderRadius: '12px',
                    padding: '16px',
                    margin: '0 0 24px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#ef4444'
                }}>
                    <AlertCircle size={20} />
                    <div style={{ flex: 1 }}>
                        <strong style={{ display: 'block' }}>Ulanishda muammo bo'ldi:</strong>
                        <span style={{ fontSize: '14px' }}>{errorBanner}</span>
                    </div>
                    <button onClick={fetchEskizInfo} className="btn-icon" style={{ background: 'transparent', color: '#ef4444' }}>
                        <RefreshCw size={16} />
                    </button>
                </div>
            )}

            <div className="page-content">
                <div className="content-card">
                    <div className="card-header">
                        <div className="filters-container">
                            <div className="sms-tabs-refined">
                                <button
                                    className={`tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('templates')}
                                >
                                    <MessageSquare size={18} />
                                    Shablonlar
                                </button>
                                <button
                                    className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('history')}
                                >
                                    <History size={18} />
                                    SMS Tarixi
                                </button>
                            </div>

                            <div className="results-count">
                                {activeTab === 'templates' ? (
                                    <>Jami: <strong>{totalItems}</strong> ta shablon</>
                                ) : (
                                    <>Jami: <strong>{totalItems}</strong> ta xabar</>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="card-body p-0">
                        {activeTab === 'templates' ? (
                            <div className="responsive-table">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Shablon nomi</th>
                                            <th>Xabar matni</th>
                                            <th>Manba</th>
                                            <th style={{ textAlign: 'right' }}>Amallar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {totalItems === 0 ? (
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                                                    {loading ? 'Yuklanmoqda...' : 'Ma\'lumot topilmadi'}
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedData.map((tpl, index) => (
                                                <tr
                                                    key={`${tpl.source}-${tpl.id}`}
                                                    onClick={() => handleViewTemplate(tpl)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <td className="cell-number">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                                    <td style={{ fontWeight: '600' }}>
                                                        {tpl.source === 'local' ? tpl.name : (tpl.name || (tpl.type ? tpl.type.toUpperCase() : 'Eskiz Shablon'))}
                                                    </td>
                                                    <td className="cell-message-text">
                                                        <div className="message-copy-wrapper">
                                                            <span className="text-truncate">
                                                                {tpl.source === 'local' ? tpl.text : (tpl.original_text || tpl.template || tpl.text)}
                                                            </span>
                                                            <button
                                                                className="btn-copy-mini"
                                                                onClick={(e) => handleCopy(tpl.source === 'local' ? tpl.text : (tpl.original_text || tpl.template || tpl.text), e)}
                                                                title="Nusxalash"
                                                            >
                                                                <Copy size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                            {tpl.source === 'local' ? (
                                                                <span className="status-badge" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', alignSelf: 'flex-start' }}>Mahalliy</span>
                                                            ) : (
                                                                <>
                                                                    <span className="status-badge" style={{ backgroundColor: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', alignSelf: 'flex-start' }}>Eskiz</span>
                                                                    {tpl.status && (
                                                                        <span style={{
                                                                            fontSize: '11px',
                                                                            fontWeight: '500',
                                                                            color: tpl.status === 'approved' || tpl.status === 'service' ? '#10b981' :
                                                                                tpl.status === 'pending' || tpl.status === 'moderation' ? '#f59e0b' : '#ef4444'
                                                                        }}>
                                                                            {tpl.status === 'approved' || tpl.status === 'service' ? 'Tasdiqlangan ✅' :
                                                                                tpl.status === 'pending' || tpl.status === 'moderation' ? 'Kutilmoqda ⏳' :
                                                                                    tpl.status === 'rejected' ? 'Rad etildi ❌' : tpl.status}
                                                                        </span>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td onClick={(e) => e.stopPropagation()}>
                                                        <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                                                            <button
                                                                className="btn-icon mini"
                                                                title="Batafsil"
                                                                onClick={() => handleViewTemplate(tpl)}
                                                                style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-color)' }}
                                                            >
                                                                <MessageSquare size={14} />
                                                            </button>
                                                            {tpl.source === 'local' && (
                                                                <button
                                                                    className="btn-icon mini"
                                                                    title="O'chirish"
                                                                    onClick={() => handleDeleteTemplate(tpl.id)}
                                                                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="responsive-table">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Raqam</th>
                                            <th>Xabar</th>
                                            <th>Holat</th>
                                            <th>Manba</th>
                                            <th>Sana</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {totalItems === 0 ? (
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>
                                                    Ma'lumot topilmadi
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedData.map((item) => (
                                                <tr
                                                    key={`${item.source}-${item.id}`}
                                                    onClick={() => handleViewTemplate(item)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <td className="cell-number" style={{ width: '150px' }}>{item.source === 'local' ? item.phone : item.mobile_phone}</td>
                                                    <td className="cell-message-history">
                                                        <div className="message-copy-wrapper">
                                                            <span className="text-truncate">{item.message}</span>
                                                            <button
                                                                className="btn-copy-mini"
                                                                onClick={(e) => handleCopy(item.message, e)}
                                                                title="Nusxalash"
                                                            >
                                                                <Copy size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {item.source === 'local' ? (
                                                            <span className={`status-badge ${item.status === 'sent' ? 'status-active' : 'status-cancelled'}`} style={{
                                                                backgroundColor: item.status === 'sent' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                                color: item.status === 'sent' ? '#22c55e' : '#ef4444'
                                                            }}>
                                                                {item.status === 'sent' ? 'Yuborilgan' : 'Xato'}
                                                            </span>
                                                        ) : (
                                                            <span className="status-badge" style={{
                                                                backgroundColor: item.status === 'DELIVRD' || item.status === 'SENT' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                                                                color: item.status === 'DELIVRD' || item.status === 'SENT' ? '#22c55e' : 'var(--primary-color)'
                                                            }}>
                                                                {item.status}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className="status-badge"
                                                            style={{
                                                                backgroundColor: item.source === 'local' ? 'var(--bg-tertiary)' : 'rgba(34, 197, 94, 0.15)',
                                                                color: item.source === 'local' ? 'var(--text-secondary)' : '#22c55e'
                                                            }}>
                                                            {item.source === 'local' ? 'Mahalliy' : 'Eskiz'}
                                                        </span>
                                                    </td>
                                                    <td style={{ width: '180px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                        {item.source === 'local' ? new Date(item.sent_at).toLocaleString('uz-UZ') : item.sent_at}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {renderPagination()}
                    </div>
                </div>
            </div>

            {/* Modals via Portal */}
            <ModalPortal isOpen={isTemplateModalOpen} onClose={() => closeModal(setIsTemplateModalOpen)} closing={modalClosing}>
                <div className={`modal-content modal-form ${modalClosing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3>Yangi Shablon</h3>
                        <button className="modal-close" onClick={() => closeModal(setIsTemplateModalOpen)}>
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleCreateTemplate}>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Shablon nomi</label>
                                <input
                                    type="text"
                                    value={newTemplate.name}
                                    onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                    required
                                    placeholder="Masalan: Xush kelibsiz"
                                />
                            </div>
                            <div className="form-group">
                                <label>SMS Matni</label>
                                <textarea
                                    value={newTemplate.text}
                                    onChange={e => setNewTemplate({ ...newTemplate, text: e.target.value })}
                                    required
                                    placeholder="Xabar matnini kiriting..."
                                    rows={8}
                                />
                                <div className="char-counter" style={{
                                    fontSize: '11px',
                                    textAlign: 'right',
                                    marginTop: '4px',
                                    color: newTemplate.text.length < 10 ? '#ef4444' : 'var(--text-muted)'
                                }}>
                                    {newTemplate.text.length} / 10 (min)
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="eskiz-checkbox-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={newTemplate.saveToEskiz}
                                        onChange={e => setNewTemplate({ ...newTemplate, saveToEskiz: e.target.checked })}
                                        disabled={!isServiceActive || loading}
                                        className="sms-checkbox"
                                    />
                                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Eskiz.uz moderatsiyasiga ham yuborish</span>
                                </label>
                                {!isServiceActive && (
                                    <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', fontWeight: '500' }}>
                                        Eskiz xizmati faol emas
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={() => closeModal(setIsTemplateModalOpen)}>Bekor qilish</button>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Saqlanmoqda...' : 'Yaratish'}
                            </button>
                        </div>
                    </form>
                </div>
            </ModalPortal>

            <ModalPortal isOpen={isDetailModalOpen} onClose={() => closeModal(setIsDetailModalOpen)} closing={modalClosing}>
                <div className={`modal-content modal-form ${modalClosing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3>{selectedTemplate?.phone || selectedTemplate?.mobile_phone ? 'Xabar tafsilotlari' : 'Shablon ma\'lumotlari'}</h3>
                        <button className="modal-close" onClick={() => closeModal(setIsDetailModalOpen)}>
                            <X size={20} />
                        </button>
                    </div>
                    <div className="modal-body">
                        {/* HISTORY ITEM DETAILS */}
                        {(selectedTemplate?.phone || selectedTemplate?.mobile_phone) ? (
                            <>
                                <div className="form-group">
                                    <label>Telefon raqam</label>
                                    <input
                                        type="text"
                                        readOnly
                                        value={selectedTemplate?.phone || selectedTemplate?.mobile_phone}
                                        className="detail-input-readonly highlighted"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Yuborilgan vaqt</label>
                                    <input
                                        type="text"
                                        readOnly
                                        value={selectedTemplate?.source === 'local'
                                            ? new Date(selectedTemplate.sent_at).toLocaleString('uz-UZ')
                                            : selectedTemplate.sent_at}
                                        className="detail-input-readonly"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Xabar Matni</label>
                                    <textarea
                                        readOnly
                                        value={selectedTemplate?.message}
                                        rows={6}
                                        className="detail-textarea-readonly"
                                    />
                                </div>
                            </>
                        ) : (
                            /* TEMPLATE ITEM DETAILS */
                            <>
                                <div className="form-group">
                                    <label>Shablon nomi</label>
                                    <input
                                        type="text"
                                        readOnly
                                        value={selectedTemplate?.source === 'local' ? selectedTemplate?.name : (selectedTemplate?.name || selectedTemplate?.type?.toUpperCase() || 'Eskiz Shablon')}
                                        className="detail-input-readonly"
                                        style={{ fontWeight: '600' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>SMS Matni</label>
                                    <textarea
                                        readOnly
                                        value={selectedTemplate?.source === 'local' ? selectedTemplate?.text : (selectedTemplate?.original_text || selectedTemplate?.template || selectedTemplate?.text)}
                                        rows={8}
                                        className="detail-textarea-readonly"
                                    />
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label>Holati va Manbasi</label>
                            <div className="status-badges-row" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <span className="status-badge-refined" style={{
                                    padding: '8px 16px',
                                    borderRadius: '10px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    backgroundColor: selectedTemplate?.source === 'local' ? 'var(--bg-tertiary)' : 'rgba(14, 165, 233, 0.1)',
                                    color: selectedTemplate?.source === 'local' ? 'var(--text-secondary)' : '#0ea5e9',
                                    border: `1px solid ${selectedTemplate?.source === 'local' ? 'var(--border-color)' : 'rgba(14, 165, 233, 0.2)'}`
                                }}>
                                    {selectedTemplate?.source === 'local' ? 'MAHALLIY' : 'ESKIZ'}
                                </span>

                                {selectedTemplate?.status && (
                                    <span className="status-badge-refined" style={{
                                        padding: '8px 16px',
                                        borderRadius: '10px',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        backgroundColor: selectedTemplate.status === 'approved' || selectedTemplate.status === 'service' ? 'rgba(34, 197, 94, 0.1)' :
                                            selectedTemplate.status === 'pending' || selectedTemplate.status === 'moderation' ? 'rgba(245, 158, 11, 0.1)' :
                                                selectedTemplate.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                                        color: selectedTemplate.status === 'approved' || selectedTemplate.status === 'service' ? '#10b981' :
                                            selectedTemplate.status === 'pending' || selectedTemplate.status === 'moderation' ? '#f59e0b' :
                                                selectedTemplate.status === 'rejected' ? '#ef4444' : 'var(--primary-color)',
                                        border: '1px solid currentColor'
                                    }}>
                                        {selectedTemplate.status === 'approved' || selectedTemplate.status === 'service' ? 'TASDIQLANGAN' :
                                            selectedTemplate.status === 'pending' || selectedTemplate.status === 'moderation' ? 'KUTILMOQDA' :
                                                selectedTemplate.status === 'rejected' ? 'RAD ETILDI' :
                                                    selectedTemplate.status === 'sent' || selectedTemplate.status === 'SENT' || selectedTemplate.status === 'DELIVRD' ? 'YUBORILGAN' :
                                                        selectedTemplate.status?.toUpperCase()}
                                    </span>
                                )}
                            </div>
                        </div>

                        {selectedTemplate?.source === 'local' && !selectedTemplate?.phone && isServiceActive && !eskizTemplates.some(et => et.template === selectedTemplate.text) && (
                            <div className="eskiz-sync-alert-refined">
                                <p>Ushbu shablon hali Eskiz.uz moderatsiyasiga yuborilmagan.</p>
                                <button
                                    className="btn-primary"
                                    onClick={() => handleSyncToEskiz(selectedTemplate)}
                                    disabled={loading}
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    <Send size={16} />
                                    <span>Moderatsiyaga yuborish</span>
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="modal-actions">
                        {selectedTemplate?.source === 'local' && selectedTemplate?.id && !selectedTemplate.phone ? (
                            <button
                                className="btn-secondary"
                                style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                                onClick={() => {
                                    handleDeleteTemplate(selectedTemplate.id);
                                    closeModal(setIsDetailModalOpen);
                                }}
                            >
                                <Trash2 size={16} />
                                O'chirish
                            </button>
                        ) : null}
                        <button className="btn-primary" onClick={() => closeModal(setIsDetailModalOpen)}>Yopish</button>
                    </div>
                </div>
            </ModalPortal>

            <ModalPortal isOpen={isManualSmsModalOpen} onClose={() => closeModal(setIsManualSmsModalOpen)} closing={modalClosing}>
                <div className={`modal-content modal-form ${modalClosing ? 'closing' : ''}`} onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3>SMS Yuborish</h3>
                        <button className="modal-close" onClick={() => closeModal(setIsManualSmsModalOpen)}>
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleSendManualSms}>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Telefon raqam</label>
                                <input
                                    type="text"
                                    value={manualSms.phone}
                                    onChange={handlePhoneChange}
                                    required
                                    placeholder="+998 (XX) YYY-ZZ-ZZ"
                                />
                            </div>
                            <div className="form-group">
                                <label>Xabar Matni</label>
                                <textarea
                                    value={manualSms.message}
                                    onChange={e => setManualSms({ ...manualSms, message: e.target.value })}
                                    required
                                    placeholder="Xabarni yozing..."
                                    rows={8}
                                />
                                <div className="char-counter" style={{
                                    fontSize: '11px',
                                    textAlign: 'right',
                                    marginTop: '4px',
                                    color: 'var(--text-muted)'
                                }}>
                                    {manualSms.message.length} ta belgi
                                </div>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={() => closeModal(setIsManualSmsModalOpen)}>Bekor qilish</button>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Yuborilmoqda...' : 'Yuborish'}
                            </button>
                        </div>
                    </form>
                </div>
            </ModalPortal>
        </div>
    );
};

const ModalPortal = ({ children, isOpen, onClose, closing }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;
    return createPortal(
        <div className={`modal-overlay ${closing ? 'closing' : ''}`} onClick={onClose}>
            {children}
        </div>,
        document.body
    );
};

export default SmsPage;
