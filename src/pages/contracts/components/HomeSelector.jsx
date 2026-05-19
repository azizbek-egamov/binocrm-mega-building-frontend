import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import api from '../../../services/api';
import ImageModal from '../../../components/ui/ImageModal';
import FloorPlanSelector from './FloorPlanSelector';

// Tooltip Component - extracted outside parent component to prevent unmounting and flickering during mouse movements (glide effect)
const HomeTooltip = ({ home, position, onImageClick }) => {
    if (!home) return null;

    const totalPrice = (home.price || 0) * (home.square_meter || 0);

    const getStatusClass = (status) => {
        const s = status?.toUpperCase();
        if (s === 'AVAILABLE') return 'available';
        if (s === 'SOLD') return 'sold';
        if (s === 'BOOKED' || s === 'ORDERED') return 'booked';
        return 'unavailable';
    };

    const getStatusText = (status) => {
        const s = status?.toUpperCase();
        if (s === 'AVAILABLE') return 'Bo\'sh';
        if (s === 'SOLD') return 'Sotilgan';
        if (s === 'BOOKED') return 'Band';
        return 'Noma\'lum';
    };

    const formatPrice = (price) => new Intl.NumberFormat('uz-UZ').format(price);

    return createPortal(
        <div
            className="home-info-tooltip"
            style={{ top: position.top, left: position.left }}
        >
            <div className="tooltip-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                </svg>
                <span>Uy #{home.number}</span>
            </div>
            <div className="tooltip-body">
                <div className="tooltip-row">
                    <div className="tooltip-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
                        Padez:
                    </div>
                    <div className="tooltip-value">{home.padez}</div>
                </div>
                <div className="tooltip-row">
                    <div className="tooltip-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>
                        Qavat:
                    </div>
                    <div className="tooltip-value">{home.floor}</div>
                </div>
                <div className="tooltip-row">
                    <div className="tooltip-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                        Xonalar:
                    </div>
                    <div className="tooltip-value">{home.rooms} xona</div>
                </div>
                <div className="tooltip-row">
                    <div className="tooltip-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
                        Maydon:
                    </div>
                    <div className="tooltip-value">{home.square_meter} m²</div>
                </div>
                <div className="tooltip-row">
                    <div className="tooltip-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        1 kv/m narxi:
                    </div>
                    <div className="tooltip-value">{formatPrice(home.price)} so'm</div>
                </div>
                <div className="tooltip-row">
                    <div className="tooltip-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
                        Umumiy narxi:
                    </div>
                    <div className="tooltip-value">{formatPrice(totalPrice)} so'm</div>
                </div>
                <div className="tooltip-row">
                    <div className="tooltip-label">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                        Holati:
                    </div>
                    <div className={`tooltip-value status-${getStatusClass(home.status)}`}>
                        {getStatusText(home.status)}
                    </div>
                </div>

                {(home.floor_plan || home.cadastral_image) && (
                    <div
                        className="tooltip-image-section clickable"
                        onClick={() => onImageClick && onImageClick(home.floor_plan || home.cadastral_image)}
                        title="Kattalashtirish uchun bosing"
                    >
                        <div className="image-label">Loyiha rasmi:</div>
                        <img src={home.floor_plan || home.cadastral_image} alt="Plan" />
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};


const HomeSelector = ({ buildingId, onSelect, selectedHomeId, contractedHomeId }) => {
    const [viewMode, setViewMode] = useState('grid');
    const [homes, setHomes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [buildingStructure, setBuildingStructure] = useState(null);
    const [hoveredHome, setHoveredHome] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    const [previewModal, setPreviewModal] = useState({ open: false, src: '' });

    useEffect(() => {
        if (buildingId) {
            loadHomes(buildingId);
        } else {
            setHomes([]);
            setBuildingStructure(null);
        }
    }, [buildingId]);

    const loadHomes = async (bId) => {
        try {
            setLoading(true);
            const response = await api.get('/homes/', {
                params: {
                    building: bId,
                    page_size: 1000
                }
            });
            const homesList = response.data.results || response.data;
            setHomes(homesList);

            // Find max floor and padez count
            let maxFloor = 0;
            let maxPadez = 0;
            homesList.forEach(home => {
                if (home.floor > maxFloor) maxFloor = home.floor;
                if (home.padez > maxPadez) maxPadez = home.padez;
            });

            // Organize structure for grid view
            const structure = {};
            // Initialize all padez and floors
            for (let p = 1; p <= maxPadez; p++) {
                structure[p] = {};
                for (let f = 1; f <= maxFloor; f++) {
                    structure[p][f] = [];
                }
            }
            // Fill with homes
            homesList.forEach(home => {
                if (structure[home.padez] && structure[home.padez][home.floor]) {
                    structure[home.padez][home.floor].push(home);
                }
            });

            // Sort homes in each floor by number
            Object.keys(structure).forEach(padez => {
                Object.keys(structure[padez]).forEach(floor => {
                    structure[padez][floor].sort((a, b) => {
                        const numA = parseInt(a.number.replace(/\D/g, '')) || 0;
                        const numB = parseInt(b.number.replace(/\D/g, '')) || 0;
                        return numA - numB;
                    });
                });
            });

            setBuildingStructure(structure);

        } catch (error) {
            console.error("Error loading homes:", error);
            toast.error("Uylarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    const handleHomeClick = (home) => {
        if (!home) {
            onSelect(null);
            return;
        }
        // Allow clicking the currently selected home (even if it's SOLD)
        if (String(selectedHomeId) === String(home.id)) {
            onSelect(home);
            return;
        }

        // Allow clicking the originally contracted home (even if it's SOLD)
        if (contractedHomeId && String(contractedHomeId) === String(home.id)) {
            onSelect(home);
            return;
        }

        if (home.status !== 'AVAILABLE' && home.status !== 'available') {
            toast.warning(`Bu uy ${home.status === 'SOLD' ? 'sotilgan' : 'band'}`);
            return;
        }
        onSelect(home);
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

    const getStatusText = (status) => {
        const s = status?.toUpperCase();
        if (s === 'AVAILABLE') return 'Bo\'sh';
        if (s === 'SOLD') return 'Sotilgan';
        if (s === 'BOOKED') return 'Band';
        return 'Noma\'lum';
    };

    const formatPrice = (price) => new Intl.NumberFormat('uz-UZ').format(price);
    const selectedHome = homes.find(h => String(h.id) === String(selectedHomeId));

    if (!buildingId) return null;

    return (
        <div className={`card-section home-selector${viewMode === 'floorplan' ? ' home-selector--floorplan' : ''}`}>
            {hoveredHome && (
                <HomeTooltip
                    key={hoveredHome.id}
                    home={hoveredHome}
                    position={tooltipPos}
                    onImageClick={(src) => setPreviewModal({ open: true, src })}
                />
            )}
            <div className="section-header">
                <div className="icon-box bg-success-subtle">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                </div>
                <h3>Uyni tanlang</h3>
                <div className="home-stats">
                    <span className="stat available">Sotuvda: {homes.filter(h => h.status === 'AVAILABLE').length}</span>
                    <span className="stat sold">Sotilgan: {homes.filter(h => h.status === 'SOLD').length}</span>
                </div>
            </div>

            <div className="view-mode-tabs">
                <button
                    className={`tab-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    Jadval ko'rinishi
                </button>
                <button
                    className={`tab-btn ${viewMode === 'floorplan' ? 'active' : ''}`}
                    onClick={() => setViewMode('floorplan')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M3 9h18M9 21V9M3 15h6" />
                    </svg>
                    Qavat rejasi
                </button>
                <button
                    className={`tab-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                    Ro'yxat ko'rinish
                </button>
            </div>

            <div className={`homes-container${viewMode === 'floorplan' ? ' homes-container--fp' : ''}`}>
                {viewMode === 'floorplan' ? (
                    <FloorPlanSelector
                        buildingId={buildingId}
                        onSelect={(home) => {
                            // FloorPlanSelector dan kelgan home obyektini HomeSelector formatiga aylantir
                            handleHomeClick(home);
                        }}
                        selectedHomeId={selectedHomeId}
                        contractedHomeId={contractedHomeId}
                        onHomeHover={(e, home) => {
                            setTooltipPos({
                                top: e.clientY,
                                left: e.clientX
                            });
                            setHoveredHome(home);
                        }}
                        onHomeLeave={() => {
                            setHoveredHome(null);
                        }}
                    />
                ) : loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Uylar yuklanmoqda...</p>
                    </div>
                ) : homes.length === 0 ? (
                    <div className="empty-state">Bu binoda uylar topilmadi</div>
                ) : viewMode === 'grid' && buildingStructure ? (

                    <div className="building-grid-wrapper">
                        <div className="building-grid">
                            {Object.keys(buildingStructure).sort((a, b) => a - b).map(padez => (
                                <div key={padez} className="padez-column">
                                    <div className="padez-header">{padez}-padez</div>
                                    <div className="floors-wrapper">
                                        {Object.keys(buildingStructure[padez]).sort((a, b) => b - a).map(floor => (
                                            <div key={floor} className="floor-row">
                                                <div className="floor-label">{floor}</div>
                                                <div className="homes-row">
                                                    {buildingStructure[padez][floor].length > 0 ? (
                                                        buildingStructure[padez][floor].map(home => (
                                                            <div
                                                                key={home.id}
                                                                className={`home-cell ${getStatusClass(home.status)} ${String(selectedHomeId) === String(home.id) ? 'selected' : ''} ${contractedHomeId && String(contractedHomeId) === String(home.id) ? 'contracted-origin' : ''}`}
                                                                onClick={() => handleHomeClick(home)}
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

                        <div className="legend">
                            <div className="legend-item"><span className="dot available"></span> Sotuvda</div>
                            <div className="legend-item"><span className="dot sold"></span> Sotilgan</div>
                            <div className="legend-item"><span className="dot booked"></span> Band</div>
                        </div>
                    </div>
                ) : (
                    <div className="homes-list-grouped">
                        {buildingStructure && Object.keys(buildingStructure).sort((a, b) => a - b).map(padez => {
                            const padezHomes = homes.filter(h => h.padez == padez).sort((a, b) => {
                                const numA = parseInt(a.number) || 0;
                                const numB = parseInt(b.number) || 0;
                                return numA - numB;
                            });

                            return (
                                <div key={padez} className="padez-list-section">
                                    <div className="padez-list-header">{padez}-PADEZ</div>
                                    <div className="homes-list-view">
                                        <div className="list-header">
                                            <div className="col">№</div>
                                            <div className="col">Qavat</div>
                                            <div className="col">Xonalar</div>
                                            <div className="col">Maydon</div>
                                            <div className="col">Narx (m²)</div>
                                            <div className="col">Umumiy</div>
                                            <div className="col">Holat</div>
                                        </div>
                                        <div className="list-body">
                                            {padezHomes.map(home => (
                                                <div
                                                    key={home.id}
                                                    className={`list-row ${getStatusClass(home.status)} ${String(selectedHomeId) === String(home.id) ? 'selected' : ''} ${contractedHomeId && String(contractedHomeId) === String(home.id) ? 'contracted-origin' : ''}`}
                                                    onClick={() => handleHomeClick(home)}
                                                >
                                                    <div className="col number">{home.number}</div>
                                                    <div className="col">{home.floor}</div>
                                                    <div className="col">{home.rooms} xona</div>
                                                    <div className="col">{home.square_meter} m²</div>
                                                    <div className="col">{formatPrice(home.price)}</div>
                                                    <div className="col total">{formatPrice(home.price * home.square_meter)}</div>
                                                    <div className="col">
                                                        <span className={`status-badge ${getStatusClass(home.status)}`}>
                                                            {home.status === 'AVAILABLE' ? 'Sotuvda' : home.status === 'SOLD' ? 'Sotilgan' : 'Band'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {selectedHome && (
                <div className="selected-home-info">
                    <div className="info-title">Tanlangan xonadon</div>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="label">Uy raqami</span>
                            <span className="value">№{selectedHome.number}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Padez / Qavat</span>
                            <span className="value">{selectedHome.padez}-padez, {selectedHome.floor}-qavat</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Xonalar</span>
                            <span className="value">{selectedHome.rooms} xona</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Maydon</span>
                            <span className="value">{selectedHome.square_meter} m²</span>
                        </div>
                        <div className="info-item">
                            <span className="label">1 m² narxi</span>
                            <span className="value">{formatPrice(selectedHome.price)} so'm</span>
                        </div>
                        <div className="info-item highlight">
                            <span className="label">Umumiy narx</span>
                            <span className="value">{formatPrice(selectedHome.price * selectedHome.square_meter)} so'm</span>
                        </div>
                    </div>

                    {/* Floor Plan Images */}
                    {(selectedHome.floor_plan || selectedHome.cadastral_image) && (
                        <div className="floor-plans-section">
                            <div className="floor-plans-title">Xonadon rasmlari</div>
                            <div className="floor-plans-grid">
                                {selectedHome.floor_plan && (
                                    <div className="floor-plan-item">
                                        <div className="plan-label">Loyiha (planirovka)</div>
                                        <img
                                            src={selectedHome.floor_plan}
                                            alt="Loyiha"
                                            className="clickable"
                                            onClick={() => setPreviewModal({ open: true, src: selectedHome.floor_plan })}
                                            title="Kattalashtirish uchun bosing"
                                        />
                                    </div>
                                )}
                                {selectedHome.cadastral_image && (
                                    <div className="floor-plan-item">
                                        <div className="plan-label">Kadastri rasmi</div>
                                        <img
                                            src={selectedHome.cadastral_image}
                                            alt="Kadastri"
                                            className="clickable"
                                            onClick={() => setPreviewModal({ open: true, src: selectedHome.cadastral_image })}
                                            title="Kattalashtirish uchun bosing"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <ImageModal
                isOpen={previewModal.open}
                imageSrc={previewModal.src}
                onClose={() => setPreviewModal({ open: false, src: '' })}
            />
        </div>
    );
};

export default HomeSelector;
