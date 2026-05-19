import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Filter, X, RefreshCcw, Archive, Check } from 'lucide-react';

const AnalyticsFilterDrawer = ({
    isOpen,
    onClose,
    onFilter,
    activeTab,
    initialFilters,
    cities,
    buildings,
    stages,
    operators,
    isAdmin
}) => {
    const [filters, setFilters] = useState(initialFilters);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                setFilters(initialFilters);
                setClosing(false);
            }, 0);
        }
    }, [isOpen, initialFilters]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleClose = () => {
        setClosing(true);
        setTimeout(() => {
            onClose();
            setClosing(false);
        }, 250);
    };

    const handleApply = () => {
        onFilter(filters);
        handleClose();
    };

    const handleReset = () => {
        const resetData = activeTab === 'sales' ? {
            start_date: '',
            end_date: '',
            city: '',
            building: '',
            status: ''
        } : {
            start_date: '',
            end_date: '',
            operator: '',
            stage: '',
            call_status: ''
        };
        setFilters(resetData);
        onFilter(resetData);
        handleClose();
    };

    if (!isOpen && !closing) return null;

    const filteredBuildings = filters.city
        ? buildings.filter(b => String(b.city) === String(filters.city))
        : buildings;

    return createPortal(
        <div className={`modal-overlay ${closing ? 'closing' : ''}`} onClick={handleClose}>
            <div
                className={`modal-content modal-form ${closing ? 'closing' : ''}`}
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '420px' }}
            >
                <div className="modal-header">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Filter size={18} />
                        Filterlar ({activeTab === 'sales' ? 'Sotuvlar' : 'Leadlar'})
                    </h3>
                    <button className="modal-close" onClick={handleClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleApply(); }}>
                    <div className="modal-form-body">
                        {/* Date Range Section */}
                        <div className="form-group">
                            <label>Sana oralig'i</label>
                            <div className="quick-date-buttons" style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
                                <button type="button" className="btn-mini" onClick={() => {
                                    const today = new Date().toISOString().split('T')[0];
                                    setFilters(prev => ({ ...prev, start_date: today, end_date: today }));
                                }}>Bugun</button>
                                <button type="button" className="btn-mini" onClick={() => {
                                    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                                    setFilters(prev => ({ ...prev, start_date: yesterday, end_date: yesterday }));
                                }}>Kecha</button>
                                <button type="button" className="btn-mini" onClick={() => {
                                    const end = new Date().toISOString().split('T')[0];
                                    const start = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
                                    setFilters(prev => ({ ...prev, start_date: start, end_date: end }));
                                }}>7 kun</button>
                                <button type="button" className="btn-mini" onClick={() => {
                                    const end = new Date().toISOString().split('T')[0];
                                    const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
                                    setFilters(prev => ({ ...prev, start_date: start, end_date: end }));
                                }}>Ushbu oy</button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <input
                                    type="date"
                                    name="start_date"
                                    value={filters.start_date}
                                    onChange={handleChange}
                                />
                                <input
                                    type="date"
                                    name="end_date"
                                    value={filters.end_date}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {activeTab === 'sales' ? (
                            <>
                                {/* City Section */}
                                <div className="form-group">
                                    <label>Shahar bo'yicha</label>
                                    <select name="city" value={filters.city} onChange={handleChange}>
                                        <option value="">Barchasi</option>
                                        {cities.map(city => (
                                            <option key={city.id} value={city.id}>{city.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Building Section */}
                                <div className="form-group">
                                    <label>Binolar bo'yicha</label>
                                    <select name="building" value={filters.building} onChange={handleChange}>
                                        <option value="">Barchasi</option>
                                        {filteredBuildings.map(building => (
                                            <option key={building.id} value={building.id}>{building.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Status Section */}
                                <div className="form-group">
                                    <label>Shartnoma holati</label>
                                    <select name="status" value={filters.status} onChange={handleChange}>
                                        <option value="">Barchasi</option>
                                        <option value="PENDING">Kutilmoqda</option>
                                        <option value="ACTIVE">Faol</option>
                                        <option value="COMPLETED">Yakunlangan</option>
                                        <option value="CANCELLED">Bekor qilingan</option>
                                    </select>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Operator Section - faqat adminlar uchun */}
                                {isAdmin && (
                                <div className="form-group">
                                    <label>Operator bo'yicha</label>
                                    <select name="operator" value={filters.operator} onChange={handleChange}>
                                        <option value="">Barchasi</option>
                                        {operators.map((op, i) => (
                                            <option key={i} value={op.id}>{op.name}</option>
                                        ))}
                                    </select>
                                </div>
                                )}

                                {/* Stage Section */}
                                <div className="form-group">
                                    <label>Bosqich bo'yicha</label>
                                    <select name="stage" value={filters.stage} onChange={handleChange}>
                                        <option value="">Barchasi</option>
                                        {Array.isArray(stages) && stages.filter(s => !['answered', 'not_answered', 'client_answered', 'client_not_answered'].includes(s.key)).map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Call Status Section */}
                                <div className="form-group">
                                    <label>Qo'ng'iroq holati</label>
                                    <select name="call_status" value={filters.call_status} onChange={handleChange}>
                                        <option value="">Barchasi</option>
                                        {['answered', 'not_answered', 'client_answered', 'client_not_answered'].map(key => {
                                            const stage = (stages || []).find(s => s.key === key);
                                            return (
                                                <option key={key} value={key}>
                                                    {stage ? stage.name : (
                                                        key === 'answered' ? 'Javob berildi' :
                                                        key === 'not_answered' ? 'Javob berilmadi' :
                                                        key === 'client_answered' ? 'Mijoz javob berdi' :
                                                        key === 'client_not_answered' ? 'Mijoz javob bermadi' : key
                                                    )}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                {/* Include Archived Completely Removed */}
                            </>
                        )
}
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={handleReset}>
                            <RefreshCcw size={16} />
                            Tozalash
                        </button>
                        <button type="submit" className="btn-primary">
                            <Filter size={16} />
                            Qidirish
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default AnalyticsFilterDrawer;
