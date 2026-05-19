import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getHomes, updateHome } from '../../services/homes';
import { getCities } from '../../services/cities';
import { getBuildings } from '../../services/buildings';
import { formatPrice as formatPriceUtil, handlePriceChange } from '../../utils/priceFormatter';
import HomeImport from './HomeImport';
import ImageModal from '../../components/ui/ImageModal';
import './Homes.css';

import ScrollHint from '../../components/ScrollHint';

const HomesList = () => {
    const navigate = useNavigate();
    const [homes, setHomes] = useState([]);
    const [cities, setCities] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filters, setFilters] = useState({
        city: '',
        building: '',
        status: '',
        padez: ''
    });

    const [viewMode, setViewMode] = useState('list'); // 'list' or 'card'
    const [buildingStructure, setBuildingStructure] = useState(null);
    const [hoveredHome, setHoveredHome] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

    // Pagination
    const [pagination, setPagination] = useState({
        count: 0,
        page: 1,
        pageSize: 20,
        totalPages: 1
    });

    // Modals - faqat delete va import
    const [editModal, setEditModal] = useState({ open: false, home: null });
    const [modalClosing, setModalClosing] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedBuildingData, setSelectedBuildingData] = useState(null);
    const [saving, setSaving] = useState(false);
    const [previewModal, setPreviewModal] = useState({ open: false, src: '' });

    // Edit form data
    const [editFormData, setEditFormData] = useState({
        padez: '',
        floor: '',
        number: '',
        rooms: '',
        square_meter: '',
        price: '',
        status: 'AVAILABLE',
        floor_plan: null,
        cadastral_image: null,
        // Booking fields
        is_booked: false,
        booked_by_name: '',
        booked_by_phone: ''
    });

    useEffect(() => {
        loadCities();
        loadBuildings();
    }, []);


    useEffect(() => {
        if (filters.building) {
            const b = buildings.find(b => b.id.toString() === filters.building.toString());
            setSelectedBuildingData(b);
        } else {
            setSelectedBuildingData(null);
        }
    }, [filters.building, buildings]);

    const loadCities = async () => {
        try {
            const data = await getCities({ page_size: 1000 });
            const citiesList = data.results || data;
            const list = Array.isArray(citiesList) ? citiesList : [];
            setCities(list);
            
            // Avtomatik tanlash
            if (list.length === 1 && !filters.city) {
                handleFilterChange('city', list[0].id.toString());
            }
        } catch (error) {
            console.error(error);
        }
    };

    const loadBuildings = async () => {
        try {
            const data = await getBuildings({ page_size: 1000 });
            const buildingsList = data.results || data;
            const list = Array.isArray(buildingsList) ? buildingsList : [];
            setBuildings(list);
            
            // Agar shahar tanlangan bo'lsa va shu shaharda bitta bino bo'lsa
            if (filters.city) {
                const filtered = list.filter(b => b.city?.id?.toString() === filters.city || b.city === parseInt(filters.city));
                if (filtered.length === 1 && !filters.building) {
                    handleFilterChange('building', filtered[0].id.toString());
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Shahar o'zgarganda binolarni tekshirish
    useEffect(() => {
        if (filters.city && buildings.length > 0) {
            const filtered = buildings.filter(b => b.city?.id?.toString() === filters.city || b.city === parseInt(filters.city));
            if (filtered.length === 1 && !filters.building) {
                handleFilterChange('building', filtered[0].id.toString());
            }
        }
    }, [filters.city, buildings]);

    const loadHomes = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                page_size: viewMode === 'card' ? 1000 : pagination.pageSize
            };
            if (filters.city) params.city = filters.city;
            if (filters.building) params.building = filters.building;
            if (filters.status) params.status = filters.status;
            if (filters.padez) params.padez = filters.padez;

            const data = await getHomes(params);
            const homesList = Array.isArray(data) ? data : (data.results || []);
            setHomes(homesList);

            if (viewMode === 'card') {
                organizeBuildingStructure(homesList);
            }

            // Paginatsiya ma'lumotlarini yangilash
            const totalCount = Array.isArray(data) ? data.length : (data.count || homesList.length || 0);
            setPagination(prev => ({
                ...prev,
                count: totalCount,
                totalPages: Math.ceil(totalCount / prev.pageSize) || 1
            }));
        } catch (error) {
            console.error("Uylarni yuklashda xatolik:", error);
            toast.error("Uylarni yuklashda xatolik");
            setHomes([]);
        } finally {
            setLoading(false);
        }
    };

    const organizeBuildingStructure = (homesList) => {
        let maxFloor = 0;
        let maxPadez = 0;
        homesList.forEach(home => {
            const f = parseInt(home.floor) || 0;
            const p = parseInt(home.padez) || 0;
            if (f > maxFloor) maxFloor = f;
            if (p > maxPadez) maxPadez = p;
        });

        const structure = {};
        for (let p = 1; p <= maxPadez; p++) {
            structure[p] = {};
            for (let f = 1; f <= maxFloor; f++) {
                structure[p][f] = [];
            }
        }

        homesList.forEach(home => {
            if (structure[home.padez] && structure[home.padez][home.floor]) {
                structure[home.padez][home.floor].push(home);
            }
        });

        // Sort homes in each floor
        Object.keys(structure).forEach(p => {
            Object.keys(structure[p]).forEach(f => {
                structure[p][f].sort((a, b) => {
                    const numA = parseInt(String(a.number || '').replace(/\D/g, '')) || 0;
                    const numB = parseInt(String(b.number || '').replace(/\D/g, '')) || 0;
                    return numA - numB;
                });
            });
        });


        setBuildingStructure(structure);
    };

    useEffect(() => {
        loadHomes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, pagination.page, viewMode]);

    const handleViewChange = (mode) => {
        if (mode === viewMode) return;
        setPagination(prev => ({ ...prev, page: 1 }));
        setViewMode(mode);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value,
            ...(key === 'city' ? { building: '' } : {})
        }));
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const filteredBuildings = filters.city
        ? buildings.filter(b => b.city?.id?.toString() === filters.city || b.city === parseInt(filters.city))
        : buildings;




    const formatPrice = (price) => {
        return new Intl.NumberFormat('uz-UZ').format(price);
    };

    // Row click handler - conditional based on status
    const handleRowClick = (home) => {
        if (home.status === 'SOLD') {
            // Sotilgan - shartnomaga yo'naltirish (home.contract_id orqali)
            if (home.contract_id) {
                navigate(`/contracts/${home.contract_id}/edit`);
            } else {
                toast.error("Bu uy uchun shartnoma topilmadi");
            }
        } else if (home.status === 'AVAILABLE' || home.status === 'BOOKED') {
            // Sotuvda yoki Band - edit modalni ochish
            handleEdit(home);
        } else {
            // Boshqa statuslar - faqat ko'rish
            toast.info("Bu holatdagi uyni tahrirlash mumkin emas");
        }
    };

    // Open edit modal
    const handleEdit = (home) => {
        const isBooked = home.status === 'BOOKED';
        setEditFormData({
            padez: home.padez || '',
            floor: home.floor || '',
            number: home.number || '',
            rooms: home.rooms || '',
            square_meter: home.square_meter || '',
            price: home.price || '',
            status: home.status || 'AVAILABLE',
            floor_plan: null,
            cadastral_image: null,
            floor_plan_preview: home.floor_plan || null,
            cadastral_image_preview: home.cadastral_image || null,
            // Booking fields
            is_booked: isBooked,
            booked_by_name: home.booked_by_name || '',
            booked_by_phone: home.booked_by_phone || ''
        });
        setEditModal({ open: true, home });
    };

    // Close edit modal
    const closeEditModal = () => {
        setModalClosing(true);
        setTimeout(() => {
            setEditModal({ open: false, home: null });
            setModalClosing(false);
        }, 250);
    };

    // Submit edit form
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editModal.home) return;

        setSaving(true);
        try {
            const formData = new FormData();
            if (editFormData.padez !== '') formData.append('padez', editFormData.padez);
            if (editFormData.floor !== '') formData.append('floor', editFormData.floor);
            if (editFormData.number !== '') formData.append('number', editFormData.number);
            if (editFormData.rooms !== '') formData.append('rooms', editFormData.rooms);
            if (editFormData.square_meter !== '') formData.append('square_meter', editFormData.square_meter);
            if (editFormData.price !== '') formData.append('price', editFormData.price);
            if (editFormData.status) formData.append('status', editFormData.status);

            if (editFormData.floor_plan instanceof File) {
                formData.append('floor_plan', editFormData.floor_plan);
            }
            if (editFormData.cadastral_image instanceof File) {
                formData.append('cadastral_image', editFormData.cadastral_image);
            }

            // Booking fields
            if (editFormData.is_booked) {
                formData.append('status', 'BOOKED');
                formData.append('booked_by_name', editFormData.booked_by_name);
                formData.append('booked_by_phone', editFormData.booked_by_phone);
            } else {
                // Clear booking info if unchecked
                formData.append('booked_by_name', '');
                formData.append('booked_by_phone', '');
            }

            await updateHome(editModal.home.id, formData);
            toast.success("Xonadon yangilandi");
            closeEditModal();
            loadHomes();
        } catch (error) {
            console.error("Update error:", error);
            const errorData = error.response?.data;
            if (errorData && typeof errorData === 'object') {
                const firstError = Object.entries(errorData)[0];
                if (firstError) {
                    const [field, messages] = firstError;
                    const message = Array.isArray(messages) ? messages[0] : messages;
                    toast.error(`${field}: ${message}`);
                } else {
                    toast.error("Yangilashda xatolik yuzaga keldi");
                }
            } else {
                toast.error(error.response?.data?.message || "Yangilashda xatolik");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleMouseEnter = (e, home) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPos({
            top: rect.top,
            left: rect.left + rect.width / 2
        });
        setHoveredHome(home);
    };

    const handleMouseLeave = () => {
        setHoveredHome(null);
    };

    const getStatusClass = (status) => {
        const s = status?.toUpperCase();
        if (s === 'AVAILABLE') return 'available';
        if (s === 'SOLD') return 'sold';
        if (s === 'BOOKED' || s === 'ORDERED') return 'booked';
        return 'unavailable';
    };

    // Tooltip Component - rendered via portal for proper fixed positioning
    const HomeTooltip = ({ home, position }) => {
        if (!home) return null;
        const totalPrice = (home.price || 0) * (home.square_meter || 0);
        return createPortal(
            <div className="home-info-tooltip fixed-tooltip" style={{ top: position.top, left: position.left }}>
                <div className="tooltip-header">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
                    <span>Uy #{home.number}</span>
                </div>
                <div className="tooltip-body">
                    <div className="tooltip-row">
                        <div className="tooltip-label">Padez / Qavat:</div>
                        <div className="tooltip-value">{home.padez} / {home.floor}</div>
                    </div>
                    <div className="tooltip-row">
                        <div className="tooltip-label">Xonalar / Maydon:</div>
                        <div className="tooltip-value">{home.rooms} xona / {home.square_meter} m²</div>
                    </div>
                    <div className="tooltip-row">
                        <div className="tooltip-label">Umumiy narxi:</div>
                        <div className="tooltip-value">{new Intl.NumberFormat('uz-UZ').format(totalPrice)} so'm</div>
                    </div>
                    {(home.floor_plan || home.cadastral_image) && (
                        <div
                            className="tooltip-image-section clickable"
                            onClick={() => setPreviewModal({ open: true, src: home.floor_plan || home.cadastral_image })}
                            title="Kattalashtirish uchun bosing"
                        >
                            <img src={home.floor_plan || home.cadastral_image} alt="Plan" />
                        </div>
                    )}
                </div>
            </div>,
            document.body
        );
    };

    return (
        <div className="homes-page">
            {hoveredHome && <HomeTooltip home={hoveredHome} position={tooltipPos} />}
            <div className="page-header">
                <div className="header-left">
                    <h1 className="page-title">Xonadonlar</h1>
                    <p className="page-subtitle">Barcha xonadonlar ro'yxati va boshqaruvi</p>
                </div>

                <div className="header-actions">


                    <button
                        className="btn-secondary"
                        onClick={() => setShowImportModal(true)}
                        disabled={!selectedBuildingData || selectedBuildingData.status}
                        title={!selectedBuildingData ? "Avval binoni tanlang" : selectedBuildingData.status ? "Uylar allaqachon yuklangan" : "Excel fayldan yuklash"}
                    >
                        <UploadIcon />
                        <span>Excel Yuklash</span>
                    </button>


                    <button className="btn-primary" onClick={() => navigate('/homes/create')}>
                        <PlusIcon />
                        <span>Xonadon qo'shish</span>
                    </button>
                </div>

            </div>

            <div className="page-content">
                <div className="content-card">
                    <div className="card-header">
                        <div className="filters-container">
                            <select
                                value={filters.city}
                                onChange={(e) => handleFilterChange('city', e.target.value)}
                                className="filter-select"
                            >
                                <option value="">Barcha Shaharlar</option>
                                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>

                            <select
                                value={filters.building}
                                onChange={(e) => handleFilterChange('building', e.target.value)}
                                className="filter-select"
                            >
                                <option value="">Barcha Binolar</option>
                                {filteredBuildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>

                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="filter-select"
                            >
                                <option value="">Barcha Holatlar</option>
                                <option value="AVAILABLE">Sotuvda</option>
                                <option value="SOLD">Sotilgan</option>
                                <option value="BOOKED">Band qilingan</option>
                                <option value="UNAVAILABLE">Sotuvda emas</option>
                            </select>

                            <input
                                type="number"
                                placeholder="Padez"
                                value={filters.padez}
                                onChange={(e) => handleFilterChange('padez', e.target.value)}
                                className="filter-input small"
                            />

                            <div className="results-count">
                                Jami: <strong>{pagination.count}</strong> ta xonadon
                            </div>
                        </div>

                        <div className="view-mode-tabs homes-tabs">
                            <button
                                className={`tab-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => handleViewChange('list')}
                            >
                                <ListIcon />
                                <span>Ro'yxat</span>
                            </button>
                            <button
                                className={`tab-btn ${viewMode === 'card' ? 'active' : ''}`}
                                onClick={() => handleViewChange('card')}
                            >
                                <GridIcon />
                                <span>Karta</span>
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Yuklanmoqda...</p>
                        </div>
                    ) : homes.length === 0 ? (
                        <div className="empty-state">
                            <EmptyIcon />
                            <h3>Xonadonlar topilmadi</h3>
                            <p>Tanlangan filtrlarga mos xonadonlar mavjud emas</p>
                            <button className="btn-primary" onClick={() => navigate('/homes/create')}>
                                <PlusIcon />
                                <span>Yangi xonadon qo'shish</span>
                            </button>
                        </div>
                    ) : viewMode === 'card' ? (
                        !filters.building ? (
                            <div className="empty-state card-empty-state">
                                <div className="empty-icon-wrapper">
                                    <GridIcon />
                                </div>
                                <h3>Bino tanlanmagan</h3>
                                <p>Karta ko'rinishini ko'rish uchun yuqoridagi filtrdan binoni tanlang</p>
                            </div>
                        ) : homes.length === 0 ? (
                            <div className="empty-state">
                                <EmptyIcon />
                                <h3>Xonadonlar topilmadi</h3>
                                <p>Ushbu binoda hali xonadonlar mavjud emas</p>
                                <button className="btn-primary" onClick={() => navigate('/homes/create')}>
                                    <PlusIcon />
                                    <span>Xonadon qo'shish</span>
                                </button>
                            </div>
                        ) : buildingStructure ? (
                            <>
                                <ScrollHint />
                                <div className="building-grid-wrapper main-homes-grid">
                                    <div className="building-grid">
                                        {Object.keys(buildingStructure).sort((a, b) => parseInt(a) - parseInt(b)).map(padez => (
                                            <div key={padez} className="padez-column">
                                                <div className="padez-header">{padez}-Padez</div>
                                                <div className="floors-wrapper">
                                                    {Object.keys(buildingStructure[padez]).sort((a, b) => parseInt(b) - parseInt(a)).map(floor => (
                                                        <div key={floor} className="floor-row">
                                                            <div className="floor-label">{floor}</div>
                                                            <div className="homes-row">
                                                                {buildingStructure[padez][floor].length > 0 ? (
                                                                    buildingStructure[padez][floor].map(home => (
                                                                        <div
                                                                            key={home.id}
                                                                            className={`home-cell ${getStatusClass(home.status)}`}
                                                                            onClick={() => handleEdit(home)}
                                                                            onMouseEnter={(e) => handleMouseEnter(e, home)}
                                                                            onMouseLeave={handleMouseLeave}
                                                                        >
                                                                            {home.number}
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="no-homes">-</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid-legend">
                                        <div className="legend-item"><span className="dot available"></span> Sotuvda</div>
                                        <div className="legend-item"><span className="dot sold"></span> Sotilgan</div>
                                        <div className="legend-item"><span className="dot booked"></span> Band</div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="empty-state">
                                <EmptyIcon />
                                <h3>Struktura xatosi</h3>
                                <p>Binoning uylar strukturasini shakllantirishda muammo yuzaga keldi</p>
                            </div>
                        )
                    ) : (
                        <>
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Bino</th>
                                            <th>Padez</th>
                                            <th>Qavat</th>
                                            <th>Raqam</th>
                                            <th>Xona</th>
                                            <th>Maydon (m²)</th>
                                            <th>Narx (1m²)</th>
                                            <th>Umumiy Narx</th>
                                            <th>Holati</th>
                                            <th>Amallar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {homes.map((home, index) => (
                                            <tr
                                                key={home.id}
                                                onClick={() => handleRowClick(home)}
                                                style={{ cursor: 'pointer' }}
                                                className="clickable-row"
                                            >
                                                <td className="cell-number">{(pagination.page - 1) * pagination.pageSize + index + 1}</td>
                                                <td>{home.building_name}</td>
                                                <td>{home.padez}</td>
                                                <td>{home.floor}</td>
                                                <td className="font-bold">{home.number}</td>
                                                <td>{home.rooms}</td>
                                                <td>{home.square_meter}</td>
                                                <td>{formatPrice(home.price)}</td>
                                                <td>{formatPrice(home.price * home.square_meter)}</td>
                                                <td>
                                                    <span className={`status-badge status-${home.status.toLowerCase()}`}>
                                                        {home.status === 'AVAILABLE' ? 'Sotuvda' :
                                                            home.status === 'SOLD' ? 'Sotilgan' :
                                                                home.status === 'BOOKED' ? 'Band' : 'Yopiq'}
                                                    </span>
                                                </td>
                                                <td className="cell-actions" onClick={(e) => e.stopPropagation()}>
                                                    <div className="table-actions">
                                                        <button className="btn-icon btn-edit" onClick={() => handleEdit(home)} title="Tahrirlash">
                                                            <EditIcon />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination - faqat ro'yxatda */}
                            {viewMode === 'list' && pagination.totalPages > 1 && (
                                <div className="pagination-container">
                                    <div className="pagination-info">
                                        Sahifa {pagination.page} / {pagination.totalPages}
                                    </div>
                                    <div className="pagination-controls">
                                        <button
                                            className="pagination-btn"
                                            onClick={() => handlePageChange(pagination.page - 1)}
                                            disabled={pagination.page === 1}
                                        >
                                            <ChevronLeftIcon />
                                        </button>
                                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (pagination.totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (pagination.page <= 3) {
                                                pageNum = i + 1;
                                            } else if (pagination.page >= pagination.totalPages - 2) {
                                                pageNum = pagination.totalPages - 4 + i;
                                            } else {
                                                pageNum = pagination.page - 2 + i;
                                            }
                                            return (
                                                <button
                                                    key={pageNum}
                                                    className={`pagination-btn ${pagination.page === pageNum ? 'active' : ''}`}
                                                    onClick={() => handlePageChange(pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                        <button
                                            className="pagination-btn"
                                            onClick={() => handlePageChange(pagination.page + 1)}
                                            disabled={pagination.page === pagination.totalPages}
                                        >
                                            <ChevronRightIcon />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Excel Import Modal */}
            <HomeImport
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                building={selectedBuildingData}
                onSuccess={() => {
                    loadHomes();
                    loadBuildings();
                }}
            />


            {/* Edit Modal - rendered via portal for proper fixed positioning */}
            {
                editModal.open && createPortal(
                    <div className={`modal-overlay ${modalClosing ? 'closing' : ''}`} onClick={closeEditModal}>
                        <div className={`modal-content modal-form ${modalClosing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Xonadonni tahrirlash</h3>
                                <button className="modal-close" onClick={closeEditModal}>
                                    <CloseIcon />
                                </button>
                            </div>
                            <form onSubmit={handleEditSubmit}>
                                <div className="modal-form-body">
                                    <div className="form-row readonly-row">
                                        <div className="form-group">
                                            <label>Padez</label>
                                            <input
                                                type="number"
                                                value={editFormData.padez}
                                                disabled
                                                className="readonly-input"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Qavat</label>
                                            <input
                                                type="number"
                                                value={editFormData.floor}
                                                disabled
                                                className="readonly-input"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-details-box">
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Xona raqami</label>
                                                <input
                                                    type="text"
                                                    value={editFormData.number}
                                                    onChange={(e) => setEditFormData({ ...editFormData, number: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Xonalar</label>
                                                <input
                                                    type="number"
                                                    value={editFormData.rooms}
                                                    onChange={(e) => setEditFormData({ ...editFormData, rooms: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>Maydon (m²)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={editFormData.square_meter}
                                                    onChange={(e) => setEditFormData({ ...editFormData, square_meter: e.target.value })}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Narx (1m²)</label>
                                                <input
                                                    type="text"
                                                    value={formatPriceUtil(editFormData.price)}
                                                    onChange={(e) => handlePriceChange(e.target.value, (val) => setEditFormData({ ...editFormData, price: val }))}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label>Holati</label>
                                            <select
                                                value={editFormData.is_booked ? 'BOOKED' : editFormData.status}
                                                onChange={(e) => {
                                                    const newStatus = e.target.value;
                                                    if (newStatus === 'BOOKED') {
                                                        setEditFormData({ ...editFormData, status: newStatus, is_booked: true });
                                                    } else {
                                                        setEditFormData({ ...editFormData, status: newStatus, is_booked: false, booked_by_name: '', booked_by_phone: '' });
                                                    }
                                                }}
                                                disabled={editFormData.is_booked}
                                            >
                                                <option value="AVAILABLE">Sotuvda</option>
                                                <option value="BOOKED">Band qilingan</option>
                                                <option value="UNAVAILABLE">Sotuvda emas</option>
                                            </select>
                                        </div>

                                        {/* Booking Toggle */}
                                        <div className="booking-toggle-section">
                                            <div
                                                className={`booking-toggle ${editFormData.is_booked ? 'active' : ''}`}
                                                onClick={() => {
                                                    const newBooked = !editFormData.is_booked;
                                                    setEditFormData({
                                                        ...editFormData,
                                                        is_booked: newBooked,
                                                        status: newBooked ? 'BOOKED' : 'AVAILABLE',
                                                        booked_by_name: newBooked ? editFormData.booked_by_name : '',
                                                        booked_by_phone: newBooked ? editFormData.booked_by_phone : ''
                                                    });
                                                }}
                                            >
                                                <div className="toggle-checkbox">
                                                    {editFormData.is_booked && (
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="toggle-content">
                                                    <span className="toggle-label">Band qilish</span>
                                                    <span className="toggle-hint">Xonadonni mijoz uchun band qilish</span>
                                                </div>
                                            </div>

                                            {editFormData.is_booked && (
                                                <div className="booking-details">
                                                    <div className="form-group">
                                                        <label>Band qilgan shaxs ismi *</label>
                                                        <input
                                                            type="text"
                                                            value={editFormData.booked_by_name}
                                                            onChange={(e) => setEditFormData({ ...editFormData, booked_by_name: e.target.value })}
                                                            placeholder="Ism familiya"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>Telefon raqami *</label>
                                                        <input
                                                            type="tel"
                                                            value={editFormData.booked_by_phone}
                                                            onChange={(e) => {
                                                                // Format phone: +998 XX XXX XX XX
                                                                let val = e.target.value.replace(/\D/g, '');
                                                                if (val.startsWith('998')) val = val.slice(3);
                                                                if (val.length > 9) val = val.slice(0, 9);

                                                                let formatted = '+998';
                                                                if (val.length > 0) formatted += ' ' + val.slice(0, 2);
                                                                if (val.length > 2) formatted += ' ' + val.slice(2, 5);
                                                                if (val.length > 5) formatted += ' ' + val.slice(5, 7);
                                                                if (val.length > 7) formatted += ' ' + val.slice(7, 9);

                                                                setEditFormData({ ...editFormData, booked_by_phone: formatted });
                                                            }}
                                                            placeholder="+998 XX XXX XX XX"
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Loyiha rasmi</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setEditFormData({
                                                        ...editFormData,
                                                        floor_plan: e.target.files[0],
                                                        floor_plan_preview: URL.createObjectURL(e.target.files[0])
                                                    });
                                                }
                                            }}
                                            className="file-input"
                                        />
                                        {editFormData.floor_plan_preview && (
                                            <div
                                                className="image-preview clickable"
                                                onClick={() => setPreviewModal({ open: true, src: editFormData.floor_plan_preview })}
                                                title="Kattalashtirish uchun bosing"
                                            >
                                                <img src={editFormData.floor_plan_preview} alt="Plan" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label>Kadastr rasmi</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setEditFormData({
                                                        ...editFormData,
                                                        cadastral_image: e.target.files[0],
                                                        cadastral_image_preview: URL.createObjectURL(e.target.files[0])
                                                    });
                                                }
                                            }}
                                            className="file-input"
                                        />
                                        {editFormData.cadastral_image_preview && (
                                            <div
                                                className="image-preview clickable"
                                                onClick={() => setPreviewModal({ open: true, src: editFormData.cadastral_image_preview })}
                                                title="Kattalashtirish uchun bosing"
                                            >
                                                <img src={editFormData.cadastral_image_preview} alt="Kadastr" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn-secondary" onClick={closeEditModal}>
                                        Bekor qilish
                                    </button>
                                    <button type="submit" className="btn-primary" disabled={saving}>
                                        {saving ? (
                                            <>
                                                <div className="btn-spinner"></div>
                                                <span>Saqlanmoqda...</span>
                                            </>
                                        ) : (
                                            <>
                                                <SaveIcon />
                                                <span>Saqlash</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                    , document.body)
            }

            <ImageModal
                isOpen={previewModal.open}
                imageSrc={previewModal.src}
                onClose={() => setPreviewModal({ open: false, src: '' })}
            />
        </div >
    );
};

// Icons
const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const EditIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const EmptyIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 21h18M5 21V7l8-4 8 4v14" />
        <rect x="9" y="9" width="2" height="2" />
        <rect x="13" y="9" width="2" height="2" />
        <rect x="9" y="13" width="2" height="2" />
        <rect x="13" y="13" width="2" height="2" />
    </svg>
);

const DatabaseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
);

const UploadIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const ChevronLeftIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const ChevronRightIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

const SaveIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
    </svg>
);

const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const ListIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="8" y1="6" x2="21" y2="6"></line>
        <line x1="8" y1="12" x2="21" y2="12"></line>
        <line x1="8" y1="18" x2="21" y2="18"></line>
        <line x1="3" y1="6" x2="3.01" y2="6"></line>
        <line x1="3" y1="12" x2="3.01" y2="12"></line>
        <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
);

const GridIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
);

export default HomesList;
