import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { contractService } from '../../services/contracts';
import api from '../../services/api';
import { 
    Coins, 
    Calendar, 
    User, 
    Phone, 
    Home, 
    Layers, 
    Maximize2, 
    CheckCircle, 
    AlertCircle, 
    Clock, 
    FileText, 
    Building2,
    ZoomIn,
    ZoomOut,
    RefreshCw,
    Sun,
    Moon
} from 'lucide-react';
import './PublicContractDetail.css';
import { useTheme } from '../../context/ThemeContext';

const PublicContractDetail = () => {
    const { token } = useParams();
    const { theme, toggleTheme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Core data states
    const [contract, setContract] = useState(null);
    const [home, setHome] = useState(null);
    const [payments, setPayments] = useState([]);
    
    // SVG floor plan states
    const [svgContent, setSvgContent] = useState('');
    const [planData, setPlanData] = useState(null);
    const [svgLoading, setSvgLoading] = useState(false);
    const svgWrapRef = useRef(null);

    // Zoom modal state for home image
    const [isZoomOpen, setIsZoomOpen] = useState(false);
    
    // Interactive SVG zoom scale state
    const [svgScale, setSvgScale] = useState(1);
    const [svgPan, setSvgPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });

    useEffect(() => {
        loadPublicData();
    }, [token]);

    const loadPublicData = async () => {
        try {
            setLoading(true);
            const res = await contractService.getPublicDetail(token);
            const data = res.data;
            setContract(data.contract);
            setHome(data.home);
            setPayments(data.payments);
            
            // Trigger floor plan load
            if (data.home && data.home.building_id && data.home.floor) {
                loadFloorPlan(data.home.building_id, data.home.floor, data.home.id);
            }
        } catch (err) {
            setError(err.response?.data?.error || "Shartnoma ma'lumotlarini yuklashda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    const loadFloorPlan = async (buildingId, floor, targetHomeId) => {
        try {
            setSvgLoading(true);
            const res = await api.get('/floor-plans/', { params: { building_id: buildingId, floor } });
            const data = res.data;
            setPlanData(data);
            
            if (data.has_plan) {
                const svgRes = await api.get('/floor-plans/svg/', {
                    params: { building_id: buildingId, floor },
                    responseType: 'text',
                    headers: { Accept: 'image/svg+xml, text/plain, */*' },
                    transformResponse: [(d) => d],
                });
                
                let cleaned = svgRes.data
                    .replace(/<filter[\s\S]*?<\/filter>/gi, '')
                    .replace(/filter="url\(.*?\)"/gi, '')
                    .replace(/filter:.*?;/gi, '');
                    
                setSvgContent(cleaned);
            }
        } catch (err) {
            console.error("Floor plan SVG load error:", err);
        } finally {
            setSvgLoading(false);
        }
    };

    // Color and map elements on the floor plan SVG
    useEffect(() => {
        if (!svgContent || !planData || !svgWrapRef.current || !home) return;
        
        const wrap = svgWrapRef.current;
        wrap.innerHTML = svgContent;
        const svg = wrap.querySelector('svg');
        if (!svg) return;

        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.display = 'block';
        svg.style.shapeRendering = 'geometricPrecision';

        const svgWidth = svg.viewBox?.baseVal?.width || 1190;
        const svgCenterX = svgWidth / 2;
        const coloredEls = [];
        
        // Find path, rect, polygon elements
        svg.querySelectorAll('path, rect, polygon').forEach(el => {
            const fill = (el.getAttribute('fill') || '').toLowerCase();
            const stroke = (el.getAttribute('stroke') || '').toLowerCase();
            const targetFill = fill || stroke;
            
            const isAptColor = (c) => ['#6464ff', '#50ab5b', '#ff6a6a', '#83aefe', '#ff952b'].includes(c);
            if (targetFill && isAptColor(targetFill)) {
                // Calculate element center
                const bbox = el.getBBox();
                const center = { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
                coloredEls.push({ el, fill: targetFill, center });
            }
        });

        const floorNum = Number(home.floor);
        const padezNum = Number(home.padez);

        // Map elements function
        const mapElements = (elements, floorHomes, colorOrder) => {
            if (!elements.length || !floorHomes.length) return;
            const byColor = {};
            elements.forEach(e => {
                if (!byColor[e.fill]) byColor[e.fill] = [];
                byColor[e.fill].push(e);
            });

            let idx = 0;
            colorOrder.forEach(targetColor => {
                if (idx >= floorHomes.length) return;
                const matches = byColor[targetColor];
                if (matches && matches.length > 0) {
                    const mappedHome = floorHomes[idx++];
                    matches.forEach(({ el }) => {
                        el.dataset.homeId = mappedHome.id;
                        el.__home = mappedHome;
                    });
                    delete byColor[targetColor];
                }
            });
        };

        // Standard logic for mapping homes on qavat
        if (floorNum <= 2) {
            const currentPadezHomes = planData.homes.filter(h => h.padez === padezNum).sort((a, b) => +a.number - +b.number);
            const colorOrder = ['#6464ff', '#50ab5b', '#ff6a6a', '#83aefe', '#ff952b'];
            mapElements(coloredEls, currentPadezHomes, colorOrder);
        } else {
            // Left side (x < centerX) is Padez 1
            const leftHomes = planData.homes.filter(h => h.padez === 1).sort((a, b) => +a.number - +b.number);
            const leftColors = ['#6464ff', '#50ab5b', '#ff6a6a'];
            mapElements(coloredEls.filter(e => e.center.x < svgCenterX), leftHomes, leftColors);

            // Right side (x >= centerX) is Padez 2
            const rightHomes = planData.homes.filter(h => h.padez === 2).sort((a, b) => +a.number - +b.number);
            const rightColors = ['#83aefe', '#ff952b', '#50ab5b'];
            mapElements(coloredEls.filter(e => e.center.x >= svgCenterX), rightHomes, rightColors);
        }

        // Stylize texts inside SVG
        svg.querySelectorAll('text').forEach(t => {
            const fillAttr = (t.getAttribute('fill') || '').toLowerCase();
            if (fillAttr === '#d90005' || t.getAttribute('font-weight') === 'bold') {
                t.style.display = 'none';
            } else {
                t.style.fill = '#ffffff';
                t.style.fontWeight = '800';
                t.style.fontSize = '12px';
                t.style.paintOrder = 'stroke fill';
                t.style.stroke = '#000000';
                t.style.strokeWidth = '0.5px';
            }
        });

        // Apply colors to highlight the purchased home
        svg.querySelectorAll('[data-home-id]').forEach(el => {
            const elHome = el.__home;
            if (!elHome) return;
            
            const isPurchasedHome = String(elHome.id) === String(home.id);
            
            if (isPurchasedHome) {
                // Highlight with distinct, premium violet color
                el.style.fill = '#7c3aed';
                el.setAttribute('fill', '#7c3aed');
                el.style.stroke = '#ffffff';
                el.style.strokeWidth = '2px';
                el.style.fillOpacity = '1';
                
                // Add pulse / special visual accent via inline shadow if possible
                el.style.filter = 'drop-shadow(0 0 8px rgba(124, 58, 237, 0.6))';
            } else {
                // Dim other homes to make the purchased one stand out
                el.style.fill = '#475569';
                el.setAttribute('fill', '#475569');
                el.style.fillOpacity = '0.25';
                el.style.stroke = '#334155';
                el.style.strokeWidth = '0.5px';
            }
        });
    }, [svgContent, planData, home]);

    // Handle SVG zoom controls
    const zoomIn = () => setSvgScale(prev => Math.min(prev + 0.25, 3));
    const zoomOut = () => setSvgScale(prev => Math.max(prev - 0.25, 0.5));
    const resetZoom = () => {
        setSvgScale(1);
        setSvgPan({ x: 0, y: 0 });
    };

    // SVG Dragging logic
    const handleMouseDown = (e) => {
        setIsDragging(true);
        dragStart.current = { x: e.clientX - svgPan.x, y: e.clientY - svgPan.y };
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setSvgPan({
            x: e.clientX - dragStart.current.x,
            y: e.clientY - dragStart.current.y
        });
    };

    const handleMouseUp = () => setIsDragging(false);

    // SVG Touch Panning (Mobile support)
    const handleTouchStart = (e) => {
        if (e.touches.length === 1) {
            setIsDragging(true);
            const touch = e.touches[0];
            dragStart.current = { x: touch.clientX - svgPan.x, y: touch.clientY - svgPan.y };
        }
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            setSvgPan({
                x: touch.clientX - dragStart.current.x,
                y: touch.clientY - dragStart.current.y
            });
        }
    };

    const handleTouchEnd = () => setIsDragging(false);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('uz-UZ').format(val) + " so'm";
    };

    const formatPhoneNumber = (phone) => {
        if (!phone) return '—';
        const cleaned = String(phone).replace(/\D/g, '');
        let target = cleaned;
        if (cleaned.length === 9) {
            target = '998' + cleaned;
        } else if (cleaned.length === 12 && cleaned.startsWith('998')) {
            target = cleaned;
        }
        if (target.length === 12) {
            return `+998 (${target.slice(3, 5)}) ${target.slice(5, 8)}-${target.slice(8, 10)}-${target.slice(10, 12)}`;
        }
        return phone.startsWith('+') ? phone : `+${phone}`;
    };

    if (loading) {
        return (
            <div className="public-contract-loading">
                <div className="spinner"></div>
                <p>Shartnoma ma'lumotlari yuklanmoqda...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="public-contract-error">
                <AlertCircle size={48} className="error-icon" />
                <h2>Kirish rad etildi</h2>
                <p>{error}</p>
                <small>Havola eskirgan yoki xato kiritilgan bo'lishi mumkin.</small>
            </div>
        );
    }

    const totalPaid = contract.total_price - contract.remaining_balance;
    const progressPercent = Math.round((totalPaid / contract.total_price) * 100) || 0;

    const hasImage = !!home?.image;
    const hasFloorPlan = !!svgContent && !!planData?.has_plan;
    const hasVisuals = hasImage || hasFloorPlan;

    return (
        <div className="public-contract-container">
            {/* Elegant Header */}
            <header className="public-header">
                <div className="header-brand">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--primary-color, #7c3aed)' }}>
                        <path d="M2 22H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M12 2H6C4.89543 2 4 2.89543 4 4V22H14V4C14 2.89543 13.1046 2 12 2Z" fill="url(#b-grad-1)" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M20 8H14V22H20C21.1046 22 22 21.1046 22 20V10C22 8.89543 21.1046 8 20 8Z" fill="url(#b-grad-2)" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M7 6H11V8H7V6ZM7 11H11V13H7V11ZM7 16H11V18H7V16ZM16 12H19V14H16V12ZM16 17H19V19H16V17Z" fill="currentColor"/>
                        <defs>
                            <linearGradient id="b-grad-1" x1="9" y1="2" x2="9" y2="22" gradientUnits="userSpaceOnUse">
                                <stop stopColor="currentColor" stopOpacity="0.2"/>
                                <stop offset="1" stopColor="currentColor" stopOpacity="0.02"/>
                            </linearGradient>
                            <linearGradient id="b-grad-2" x1="18" y1="8" x2="18" y2="22" gradientUnits="userSpaceOnUse">
                                <stop stopColor="currentColor" stopOpacity="0.25"/>
                                <stop offset="1" stopColor="currentColor" stopOpacity="0.03"/>
                            </linearGradient>
                        </defs>
                    </svg>
                    <span>«MEGA BUILDING» MCHJ</span>
                </div>
                <div className="contract-badge-wrapper">
                    <span className="contract-title">SHARTNOMA RAQAMI: #{contract.contract_number}</span>
                    <span className={`status-badge ${contract.status}`}>
                        {contract.status === 'active' && 'Rasmiylashtirilgan'}
                        {contract.status === 'pending' && 'Rasmiylashtirilmoqda'}
                        {contract.status === 'paid' && 'To\'liq to\'langan'}
                        {contract.status === 'completed' && 'Tugallangan'}
                        {contract.status === 'cancelled' && 'Bekor qilingan'}
                    </span>
                    <button onClick={toggleTheme} className="public-theme-toggle-btn" title="Mavzuni o'zgartirish">
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>
            </header>

            {/* Main Grid Layout */}
            <div className={`public-grid ${!hasVisuals ? 'no-visuals' : ''}`}>
                
                {/* Column 1: Metadata and Details */}
                <div className="public-col-details">
                    
                    {/* Progress Card */}
                    <div className="details-card progress-card">
                        <div className="progress-header">
                            <h3>To'lov holati</h3>
                            <span className="percent-text">{progressPercent}%</span>
                        </div>
                        <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        <div className="progress-stats">
                            <div>
                                <span className="label">To'langan summa</span>
                                <span className="value text-success">{formatCurrency(totalPaid)}</span>
                            </div>
                            <div>
                                <span className="label">Qolgan qarz</span>
                                <span className="value text-danger">{formatCurrency(contract.remaining_balance)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Customer Info Card */}
                    <div className="details-card">
                        <div className="card-header">
                            <User size={18} />
                            <h3>Mijoz ma'lumotlari</h3>
                        </div>
                        <div className="card-body">
                            <div className="data-row">
                                <span className="label">F.I.SH.</span>
                                <span className="value font-semibold">{contract.client_name}</span>
                            </div>
                            <div className="data-row">
                                <span className="label">Telefon raqami</span>
                                <span className="value">{formatPhoneNumber(contract.client_phone)}</span>
                            </div>
                            <div className="data-row">
                                <span className="label">Tuzilgan sana</span>
                                <span className="value">{contract.contract_date || new Date(contract.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Home Info Card */}
                    <div className="details-card">
                        <div className="card-header">
                            <Home size={18} />
                            <h3>Xonadon ma'lumotlari</h3>
                        </div>
                        <div className="card-body">
                            <div className="data-row">
                                <span className="label">Bino nomi</span>
                                <span className="value font-semibold">{home.building_name} ({home.city_name})</span>
                            </div>
                            <div className="data-row">
                                <span className="label">Xonadon raqami</span>
                                <span className="value badge-home">{home.number}-uy</span>
                            </div>
                            <div className="data-row text-secondary-info">
                                <div>
                                    <span className="label">Qavat</span>
                                    <span className="value">{home.floor}-qavat</span>
                                </div>
                                <div>
                                    <span className="label">Padez</span>
                                    <span className="value">{home.padez}-padez</span>
                                </div>
                                <div>
                                    <span className="label">Xonalar</span>
                                    <span className="value">{home.rooms} xona</span>
                                </div>
                            </div>
                            <div className="data-row">
                                <span className="label">Maydoni</span>
                                <span className="value">{home.square_meter} kv.m</span>
                            </div>
                            <div className="data-row">
                                <span className="label">Umumiy qiymati</span>
                                <span className="value font-bold text-primary">{formatCurrency(contract.total_price)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Column 2: Interactive Layouts and Plans (Only if visuals exist) */}
                {hasVisuals && (
                    <div className="public-col-visual">
                        
                        {/* Home Visual Image */}
                        {hasImage && (
                            <div className="details-card visual-card">
                                <div className="card-header">
                                    <FileText size={18} />
                                    <h3>Xonadon ko'rinishi</h3>
                                </div>
                                <div className="visual-image-container" onClick={() => setIsZoomOpen(true)}>
                                    <img src={home.image} alt="Xonadon ko'rinishi" className="visual-image" />
                                    <div className="zoom-overlay">
                                        <Maximize2 size={20} />
                                        <span>Kattalashtirish</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Floor SVG Layout */}
                        {hasFloorPlan && (
                            <div className="details-card floor-card">
                                <div className="card-header header-with-controls">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Layers size={18} />
                                        <h3>Qavat chizmasi</h3>
                                    </div>
                                    {svgContent && (
                                        <div className="zoom-controls">
                                            <button onClick={zoomOut} title="Uzoqlashtirish"><ZoomOut size={16} /></button>
                                            <button onClick={resetZoom} title="Reset"><RefreshCw size={14} /></button>
                                            <button onClick={zoomIn} title="Yaqinlashtirish"><ZoomIn size={16} /></button>
                                        </div>
                                    )}
                                </div>
                                
                                <div 
                                    className="floor-svg-viewport"
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                    onTouchStart={handleTouchStart}
                                    onTouchMove={handleTouchMove}
                                    onTouchEnd={handleTouchEnd}
                                >
                                    {svgLoading ? (
                                        <div className="svg-loading-placeholder">
                                            <div className="spinner"></div>
                                            <span>Chizma yuklanmoqda...</span>
                                        </div>
                                    ) : (
                                        <div 
                                            ref={svgWrapRef} 
                                            className="svg-container-wrap"
                                            style={{
                                                transform: `translate(${svgPan.x}px, ${svgPan.y}px) scale(${svgScale})`,
                                                transformOrigin: 'center center',
                                                cursor: isDragging ? 'grabbing' : 'grab'
                                            }}
                                        />
                                    )}
                                    
                                    {/* Legend */}
                                    <div className="floor-legend">
                                        <div className="legend-item">
                                            <span className="legend-color purchased"></span>
                                            <span>Sizning xonadoningiz</span>
                                        </div>
                                        <div className="legend-item">
                                            <span className="legend-color other"></span>
                                            <span>Boshqa xonadonlar</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Payment Schedule Section */}
            <section className="payment-schedule-section">
                <div className="section-header">
                    <Coins size={20} />
                    <h2>To'lovlar grafigi</h2>
                </div>
                
                <div className="table-responsive">
                    <table className="schedule-table">
                        <thead>
                            <tr>
                                <th>Oy</th>
                                <th>To'lov sanasi</th>
                                <th>Belgilangan summa</th>
                                <th>To'langan summa</th>
                                <th>Qoldiq qarz</th>
                                <th>Holati</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((p, idx) => {
                                const isPaid = p.remaining <= 0;
                                const isPartial = p.amount_paid > 0 && p.remaining > 0;
                                const isOverdue = new Date(p.due_date) < new Date() && !isPaid;
                                
                                return (
                                    <tr key={idx} className={isPaid ? 'row-paid' : isOverdue ? 'row-overdue' : ''}>
                                        <td className="font-semibold">
                                            {p.month_number === 0 ? "Boshlang'ich to'lov" : `${p.month_number}-oy`}
                                        </td>
                                        <td>
                                            <div className="date-cell">
                                                <Calendar size={14} />
                                                <span>{p.due_date}</span>
                                            </div>
                                        </td>
                                        <td className="font-semibold">{formatCurrency(p.amount)}</td>
                                        <td className="text-success font-semibold">{formatCurrency(p.amount_paid)}</td>
                                        <td className={p.remaining > 0 ? "text-danger font-semibold" : "font-semibold"}>
                                            {formatCurrency(p.remaining)}
                                        </td>
                                        <td>
                                            {isPaid ? (
                                                <span className="badge badge-success">
                                                    <CheckCircle size={12} />
                                                    To'langan
                                                </span>
                                            ) : isPartial ? (
                                                <span className="badge badge-info">
                                                    <Clock size={12} />
                                                    Qisman to'langan
                                                </span>
                                            ) : isOverdue ? (
                                                <span className="badge badge-danger">
                                                    <AlertCircle size={12} />
                                                    Muddati o'tgan
                                                </span>
                                            ) : (
                                                <span className="badge badge-warning">
                                                    <Clock size={12} />
                                                    Kutilmoqda
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Click-to-Zoom Modal for Home Image */}
            {isZoomOpen && home?.image && (
                <div className="zoom-modal-overlay" onClick={() => setIsZoomOpen(false)}>
                    <div className="zoom-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="zoom-close-btn" onClick={() => setIsZoomOpen(false)}>&times;</button>
                        <img src={home.image} alt="Kattalashtirilgan xonadon ko'rinishi" className="zoom-modal-img" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicContractDetail;
