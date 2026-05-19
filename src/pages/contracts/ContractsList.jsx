import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { contractService } from '../../services/contracts';
import {
    PlusIcon,
    SearchIcon,
    FilterIcon,
    EyeIcon,
    DollarSignIcon,
    DownloadIcon,
    CalendarIcon,
    TrashIcon
} from './ContractIcons';
import './Contracts.css';
import usePageTitle from '../../hooks/usePageTitle';
import ContractFilterDrawer from './components/ContractFilterDrawer';

const ContractsList = () => {
    usePageTitle('Shartnomalar');
    const navigate = useNavigate();
    const location = useLocation();

    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState({
        start_date: '',
        end_date: '',
        city: '',
        building: '',
        debt_status: '',
        status: ''
    });

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Detail Modal
    const [selectedContract, setSelectedContract] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [modalClosing, setModalClosing] = useState(false);

    // Payment Modal (showDebtor)
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentModalClosing, setPaymentModalClosing] = useState(false);
    const [paymentContractId, setPaymentContractId] = useState(null);
    const [paymentRemaining, setPaymentRemaining] = useState(0);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentError, setPaymentError] = useState('');
    const [deletingId, setDeletingId] = useState(null);

    const fetchContracts = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                search,
                ...advancedFilters
            };
            const response = await contractService.getAll(params);

            // Handle pagination response format
            if (response.data.results) {
                setContracts(response.data.results);
                setTotalItems(response.data.count);
                setTotalPages(Math.ceil(response.data.count / 20)); // Assuming 20 per page
            } else {
                setContracts(response.data); // Fallback for no pagination
            }
        } catch (error) {
            toast.error("Shartnomalarni yuklashda xatolik yuz berdi");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchContracts();
        }, 300); // Debounce
        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, search, advancedFilters]);

    // Handle auto-opening of contract details from navigation state
    useEffect(() => {
        if (location.state?.autoOpenContractId) {
            showContractDetails(location.state.autoOpenContractId);
            // Clear state to prevent re-opening on manual refresh/navigation
            window.history.replaceState({}, document.title);
        }
        if (location.state?.search) {
            setSearch(location.state.search);
        }
    }, [location.state]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('uz-UZ').format(price) + " so'm";
    };

    const getStatusBadge = (status) => {
        const labels = {
            'pending': 'Rasmiylashtirilmoqda',
            'active': 'Faol',
            'paid': 'To\'liq to\'langan',
            'completed': 'Tugallangan',
            'cancelled': 'Bekor qilingan'
        };
        const label = labels[status] || labels['pending'];

        return (
            <span className={`status-badge status-${status || 'pending'}`}>
                {label}
            </span>
        );
    };

    // Show contract details
    const showContractDetails = async (contractId) => {
        setLoadingDetail(true);
        setDetailModalOpen(true);
        try {
            const response = await contractService.get(contractId);
            setSelectedContract(response.data);
        } catch {
            toast.error("Ma'lumotlarni yuklashda xatolik");
            setDetailModalOpen(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    const closeDetailModal = () => {
        setModalClosing(true);
        setTimeout(() => {
            setDetailModalOpen(false);
            setSelectedContract(null);
            setModalClosing(false);
        }, 250);
    };

    // Calculate payment info
    const getPaymentInfo = (contract) => {
        if (!contract) return {};
        const totalPaid = contract.total_price - contract.remaining_balance;
        const paidPercentage = contract.total_price > 0
            ? Math.round((totalPaid / contract.total_price) * 100)
            : 0;
        return { totalPaid, paidPercentage };
    };

    // PDF yuklab olish
    const handleDownloadPdf = async (contractId, e) => {
        e.stopPropagation();
        try {
            toast.loading("PDF yaratilmoqda...", { id: `pdf-${contractId}` });

            const response = await contractService.downloadPdf(contractId);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');

            toast.dismiss(`pdf-${contractId}`);
            toast.success("PDF tayyor!");
        } catch (error) {
            toast.dismiss(`pdf-${contractId}`);
            toast.error("PDF yaratishda xatolik");
            console.error(error);
        }
    };

    // Show payment modal (showDebtor)
    const showDebtor = (contractId, remainingAmount) => {
        setPaymentContractId(contractId);
        setPaymentRemaining(remainingAmount);
        setPaymentAmount('');
        setPaymentError('');
        setPaymentModalOpen(true);
    };

    const closePaymentModal = () => {
        setPaymentModalClosing(true);
        setTimeout(() => {
            setPaymentModalOpen(false);
            setPaymentContractId(null);
            setPaymentRemaining(0);
            setPaymentAmount('');
            setPaymentError('');
            setPaymentModalClosing(false);
        }, 250);
    };

    // Format number with spaces (1000000 -> 1 000 000)
    const formatInputPrice = (value) => {
        if (!value) return '';
        return value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    const handlePaymentAmountChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setPaymentAmount(value);
        setPaymentError('');

        const numValue = parseInt(value) || 0;
        if (numValue < 1 && value !== '') {
            setPaymentError("To'lov miqdori kamida 1 so'm bo'lishi kerak");
        } else if (numValue > paymentRemaining) {
            setPaymentError("To'lov miqdori qolgan qarzdan oshmasligi kerak");
        }
    };

    const handlePaymentSubmit = async () => {
        const numValue = parseInt(paymentAmount) || 0;

        if (numValue < 1) {
            setPaymentError("To'lov miqdori kamida 1 so'm bo'lishi kerak");
            return;
        }
        if (numValue > paymentRemaining) {
            setPaymentError("To'lov miqdori qolgan qarzdan oshmasligi kerak");
            return;
        }

        setPaymentLoading(true);
        try {
            await contractService.makePayment(paymentContractId, { amount: numValue });
            toast.success("To'lov muvaffaqiyatli qabul qilindi!");
            closePaymentModal();
            fetchContracts(); // Refresh list
        } catch (error) {
            const msg = error.response?.data?.error || "To'lovda xatolik yuz berdi";
            toast.error(msg);
        } finally {
            setPaymentLoading(false);
        }
    };

    const handleDeleteContract = async (e, id, contractNumber) => {
        e.stopPropagation();
        if (!window.confirm(`Haqiqatdan ham #${contractNumber} shartnomani o'chirmoqchimisiz?`)) {
            return;
        }

        try {
            setDeletingId(id);
            const toastId = toast.loading("Shartnoma o'chirilmoqda...");
            await contractService.delete(id);
            toast.success("Shartnoma muvaffaqiyatli o'chirildi", { id: toastId });
            fetchContracts();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || "O'chirishda xatolik yuz berdi");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="contracts-page">
            <div className="page-header">
                <div className="header-left">
                    <div>
                        <h1 className="page-title">Shartnomalar</h1>
                        <p className="page-subtitle">Jami {totalItems} ta shartnoma</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn-primary" onClick={() => navigate('/contracts/create')}>
                        <PlusIcon />
                        Shartnoma tuzish
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
                                    placeholder="Qidirish... (Mijoz, shartnoma raqami)"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <button
                                className={`btn-filter-trigger ${Object.values(advancedFilters).some(v => v !== '') ? 'active' : ''}`}
                                onClick={() => setIsFilterOpen(true)}
                            >
                                <FilterIcon width="18" height="18" />
                                Filterlash
                            </button>
                        </div>
                    </div>

                    <div className="card-body p-0">
                        <div className="responsive-table">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Shartnoma</th>
                                        <th>Mijoz</th>
                                        <th>Xonadon</th>
                                        <th>Umumiy summa</th>
                                        <th>Qoldiq</th>
                                        <th>Status</th>
                                        <th>Amallar</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                                                Yuklanmoqda...
                                            </td>
                                        </tr>
                                    ) : (Array.isArray(contracts) && contracts.length === 0) ? (
                                        <tr>
                                            <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                                                Hech qanday ma'lumot topilmadi
                                            </td>
                                        </tr>
                                    ) : (
                                        Array.isArray(contracts) && contracts.map((contract, index) => (
                                            <tr
                                                key={contract.id}
                                                onClick={() => showContractDetails(contract.id)}
                                                style={{ cursor: 'pointer' }}
                                                className="clickable-row"
                                            >
                                                <td className="cell-number">{(page - 1) * 20 + index + 1}</td>
                                                <td style={{ fontWeight: '600' }}>#{contract.contract_number}</td>
                                                <td className="cell-name">{contract.client_name}</td>
                                                <td>{contract.building_name} - {contract.home_number}-uy</td>
                                                <td>{formatPrice(contract.total_price)}</td>
                                                <td style={{ color: contract.remaining_balance > 0 ? '#ef4444' : '#10b981', fontWeight: '500' }}>
                                                    {formatPrice(contract.remaining_balance)}
                                                </td>
                                                <td>{getStatusBadge(contract.status)}</td>
                                                <td onClick={(e) => e.stopPropagation()}>
                                                    <div className="table-actions">
                                                        <button
                                                            className="btn-icon btn-view"
                                                            title="Batafsil"
                                                            onClick={() => showContractDetails(contract.id)}
                                                        >
                                                            <EyeIcon />
                                                        </button>
                                                        {contract.status !== 'cancelled' ? (
                                                            <button className="btn-icon btn-edit" title="Tahrirlash" onClick={() => navigate(`/contracts/${contract.id}/edit`)}>
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                                </svg>
                                                            </button>
                                                        ) : (
                                                            <span className="btn-icon-placeholder"></span>
                                                        )}
                                                        {contract.remaining_balance > 0 && contract.status === 'active' ? (
                                                            <button
                                                                className="btn-icon btn-payment"
                                                                title="To'lov qilish"
                                                                onClick={() => showDebtor(contract.id, contract.remaining_balance)}
                                                            >
                                                                <DollarSignIcon />
                                                            </button>
                                                        ) : (
                                                            <span className="btn-icon-placeholder"></span>
                                                        )}
                                                        <button
                                                            className="btn-icon btn-download"
                                                            title="Shartnomani yuklab olish"
                                                            onClick={(e) => handleDownloadPdf(contract.id, e)}
                                                        >
                                                            <DownloadIcon width="18" height="18" />
                                                        </button>
                                                        <button
                                                            className="btn-icon btn-schedule"
                                                            title="To'lovlar jadvali"
                                                            onClick={() => navigate(`/contracts/${contract.id}/schedule`)}
                                                        >
                                                            <CalendarIcon width="18" height="18" />
                                                        </button>
                                                        <button
                                                            className="btn-icon btn-delete"
                                                            title="O'chirish"
                                                            onClick={(e) => handleDeleteContract(e, contract.id, contract.contract_number)}
                                                            disabled={deletingId === contract.id}
                                                        >
                                                            <TrashIcon width="18" height="18" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="pagination-container">
                                <div className="pagination-info">
                                    Sahifa {page} / {totalPages}
                                </div>
                                <div className="pagination-controls">
                                    <button
                                        className="pagination-btn"
                                        disabled={page === 1}
                                        onClick={() => handlePageChange(page - 1)}
                                    >
                                        &lt;
                                    </button>
                                    {[...Array(Math.min(5, totalPages))].map((_, i) => (
                                        <button
                                            key={i + 1}
                                            className={`pagination-btn ${page === i + 1 ? 'active' : ''}`}
                                            onClick={() => handlePageChange(i + 1)}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        className="pagination-btn"
                                        disabled={page === totalPages}
                                        onClick={() => handlePageChange(page + 1)}
                                    >
                                        &gt;
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Contract Details Modal */}
            {detailModalOpen && createPortal(
                <div className={`modal-overlay ${modalClosing ? 'closing' : ''}`} onClick={closeDetailModal}>
                    <div className={`modal-content modal-lg ${modalClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '10px', verticalAlign: 'middle' }}>
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                                Shartnoma tafsilotlari
                            </h3>
                            <button className="modal-close" onClick={closeDetailModal}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        {loadingDetail ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <div className="spinner" style={{ margin: '0 auto' }}></div>
                                <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Yuklanmoqda...</p>
                            </div>
                        ) : selectedContract && (
                            <div className="modal-body">
                                <div className="detail-grid">
                                    {/* Client Info Card */}
                                    <div className="detail-card">
                                        <div className="detail-card-header">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                                <circle cx="12" cy="7" r="4" />
                                            </svg>
                                            <span>Mijoz ma'lumotlari</span>
                                        </div>
                                        <div className="detail-card-body">
                                            <div className="detail-row">
                                                <span className="detail-label">Shartnoma №:</span>
                                                <span className="detail-value highlight">#{selectedContract.contract_number}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">To'liq ismi:</span>
                                                <span className="detail-value">{selectedContract.client_name}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Telefon:</span>
                                                <span className="detail-value">{selectedContract.client_phone || '-'}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Passport:</span>
                                                <span className="detail-value">{selectedContract.passport_series || '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Home Info Card */}
                                    <div className="detail-card">
                                        <div className="detail-card-header">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                                <polyline points="9 22 9 12 15 12 15 22" />
                                            </svg>
                                            <span>Uy ma'lumotlari</span>
                                        </div>
                                        <div className="detail-card-body">
                                            <div className="detail-row">
                                                <span className="detail-label">Bino:</span>
                                                <span className="detail-value">{selectedContract.building_name}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Xonadon:</span>
                                                <span className="detail-value">{selectedContract.home_number}-uy</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Payment Info Card */}
                                    <div className="detail-card">
                                        <div className="detail-card-header">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="12" y1="1" x2="12" y2="23" />
                                                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                            </svg>
                                            <span>To'lov ma'lumotlari</span>
                                        </div>
                                        <div className="detail-card-body">
                                            <div className="detail-row">
                                                <span className="detail-label">Umumiy narx:</span>
                                                <span className="detail-value">{formatPrice(selectedContract.total_price)}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Boshlang'ich to'lov:</span>
                                                <span className="detail-value">{formatPrice(selectedContract.initial_payment)}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Jami to'langan:</span>
                                                <span className="detail-value success">{formatPrice(getPaymentInfo(selectedContract).totalPaid)}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Qolgan qarz:</span>
                                                <span className="detail-value danger">{formatPrice(selectedContract.remaining_balance)}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Oylik to'lov:</span>
                                                <span className="detail-value">{formatPrice(selectedContract.monthly_payment)}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Muddat:</span>
                                                <span className="detail-value">{selectedContract.term_months} oy</span>
                                            </div>
                                            {/* Progress bar */}
                                            <div className="payment-progress">
                                                <div className="progress-label">
                                                    <span>To'langan</span>
                                                    <span>{getPaymentInfo(selectedContract).paidPercentage}%</span>
                                                </div>
                                                <div className="progress-bar">
                                                    <div
                                                        className="progress-fill"
                                                        style={{ width: `${getPaymentInfo(selectedContract).paidPercentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Info Card */}
                                    <div className="detail-card">
                                        <div className="detail-card-header">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="12" y1="16" x2="12" y2="12" />
                                                <line x1="12" y1="8" x2="12.01" y2="8" />
                                            </svg>
                                            <span>Holat ma'lumotlari</span>
                                        </div>
                                        <div className="detail-card-body">
                                            <div className="detail-row">
                                                <span className="detail-label">Holati:</span>
                                                <span className="detail-value">{getStatusBadge(selectedContract.status)}</span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Shartnoma sanasi:</span>
                                                <span className="detail-value">
                                                    {(() => {
                                                        const dateStr = selectedContract.contract_date || selectedContract.created_at;
                                                        if (!dateStr) return '-';
                                                        const date = new Date(dateStr);
                                                        const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
                                                        return `${date.getDate()}-${months[date.getMonth()]} ${date.getFullYear()}`;
                                                    })()}
                                                </span>
                                            </div>
                                            <div className="detail-row">
                                                <span className="detail-label">Yaratilgan:</span>
                                                <span className="detail-value">
                                                    {(() => {
                                                        if (!selectedContract.created_at) return '-';
                                                        const date = new Date(selectedContract.created_at);
                                                        const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
                                                        return `${date.getDate()}-${months[date.getMonth()]} ${date.getFullYear()}`;
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={closeDetailModal}>
                                Yopish
                            </button>
                            <button
                                className="btn-primary"
                                onClick={() => {
                                    closeDetailModal();
                                    navigate(`/contracts/${selectedContract?.id}/edit`);
                                }}
                            >
                                Tahrirlash
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Payment Modal (showDebtor) */}
            {paymentModalOpen && createPortal(
                <div className={`modal-overlay ${paymentModalClosing ? 'closing' : ''}`} onClick={closePaymentModal}>
                    <div className={`modal-content modal-form ${paymentModalClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 className="modal-title">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                        <line x1="1" y1="10" x2="23" y2="10" />
                                    </svg>
                                    To'lov qilish
                                </h3>
                                <p className="modal-subtitle">
                                    Qarzdorlik summasi: <strong>{formatPrice(paymentRemaining)}</strong>
                                </p>
                            </div>
                            <button className="modal-close" onClick={closePaymentModal}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className="modal-form-body">
                            <div className="form-group">
                                <label className="required">Summani kiriting</label>
                                <div className="payment-input-wrapper" style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0 12px', background: 'var(--bg-secondary)' }}>
                                    <span style={{ color: 'var(--text-secondary)', marginRight: '8px' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <line x1="12" y1="1" x2="12" y2="23" />
                                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                        </svg>
                                    </span>
                                    <input
                                        type="text"
                                        className={`payment-input ${paymentError ? 'error' : ''}`}
                                        placeholder="To'lov miqdori"
                                        value={formatInputPrice(paymentAmount)}
                                        onChange={handlePaymentAmountChange}
                                        autoFocus
                                        style={{ flex: 1, border: 'none', background: 'transparent', padding: '12px 0', outline: 'none', color: 'var(--text-primary)', fontSize: '15px' }}
                                    />
                                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '14px' }}>so'm</span>
                                </div>
                                {paymentError && (
                                    <div className="payment-error" style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{paymentError}</div>
                                )}
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={closePaymentModal}>
                                Bekor qilish
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handlePaymentSubmit}
                                disabled={paymentLoading || !!paymentError || !paymentAmount}
                            >
                                {paymentLoading ? (
                                    <>
                                        <span className="btn-spinner"></span>
                                        Kuting...
                                    </>
                                ) : (
                                    <>
                                        <DollarSignIcon />
                                        To'lovni tasdiqlash
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <ContractFilterDrawer
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onFilter={(newFilters) => {
                    setAdvancedFilters(newFilters);
                    setPage(1); // Reset to first page when filtering
                }}
                initialFilters={advancedFilters}
            />
        </div>
    );
};

export default ContractsList;
