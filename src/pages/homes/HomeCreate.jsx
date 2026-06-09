import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getBuildings } from '../../services/buildings';
import { getCities } from '../../services/cities';
import { batchCreateHomes } from '../../services/homes';
import { isValidNumber, isValidInteger } from '../../utils/priceFormatter';
import './Homes.css';

const HomeCreate = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Data
    const [cities, setCities] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedBuilding, setSelectedBuilding] = useState(null);

    // Homes form data - structured by padez
    const [homesData, setHomesData] = useState([]);
    const [expandedPadez, setExpandedPadez] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([loadCities(), loadBuildings()]);
            setLoading(false);
        };
        loadData();
    }, []);

    const loadCities = async () => {
        try {
            const data = await getCities({ page_size: 1000 });
            const citiesList = Array.isArray(data) ? data : (data.results || data || []);
            setCities(Array.isArray(citiesList) ? citiesList : []);
        } catch (error) {
            console.error('Shaharlarni yuklashda xatolik:', error);
            setCities([]);
        }
    };

    const loadBuildings = async () => {
        try {
            const data = await getBuildings({ page_size: 1000 });
            const buildingsList = Array.isArray(data) ? data : (data.results || data || []);
            const allBuildings = Array.isArray(buildingsList) ? buildingsList : [];
            // Faqat hali uylar yuklanmagan binolarni ko'rsatish
            setBuildings(allBuildings.filter(b => !b.status));
        } catch (error) {
            console.error('Binolarni yuklashda xatolik:', error);
            setBuildings([]);
        }
    };

    const normalizedSelectedCity = selectedCity?.toString();

    const filteredBuildings = normalizedSelectedCity
        ? buildings.filter(b => {
            const buildingCityId = (typeof b.city === 'object' ? b.city?.id : b.city);
            if (buildingCityId === undefined || buildingCityId === null) return false;
            return buildingCityId.toString() === normalizedSelectedCity;
        })
        : buildings;

    // City o'zgarganda mos kelmaydigan bino/formni avtomatik tozalash
    useEffect(() => {
        if (!normalizedSelectedCity) return;
        if (!selectedBuilding) return;
        const buildingCityId = (typeof selectedBuilding.city === 'object' ? selectedBuilding.city?.id : selectedBuilding.city);
        if (buildingCityId?.toString() !== normalizedSelectedCity) {
            setSelectedBuilding(null);
            setHomesData([]);
            setExpandedPadez([]);
        }
    }, [normalizedSelectedCity, selectedBuilding]);

    const handleBuildingSelect = (buildingId) => {
        const building = filteredBuildings.find(b => b.id.toString() === buildingId);
        setSelectedBuilding(building);

        if (building) {
            const padezConfigs = building.padez_home || [];
            const newHomesData = [];

            padezConfigs.forEach((homesCount, padezIdx) => {
                const padezNumber = padezIdx + 1;
                const padezHomes = [];

                for (let i = 0; i < homesCount; i++) {
                    padezHomes.push({
                        padez: padezNumber,
                        number: '',
                        floor: 1,
                        rooms: 0,
                        square_meter: '',
                        price: '',
                        floor_plan: null,
                        cadastral_image: null
                    });
                }

                newHomesData.push({
                    padez: padezNumber,
                    homes: padezHomes
                });
            });

            setHomesData(newHomesData);
            setExpandedPadez([1]);
        } else {
            setHomesData([]);
        }
    };

    const togglePadez = (padezNum) => {
        setExpandedPadez(prev =>
            prev.includes(padezNum)
                ? prev.filter(p => p !== padezNum)
                : [...prev, padezNum]
        );
    };

    const handleHomeChange = (padezIdx, homeIdx, field, value) => {
        setHomesData(prev => {
            const newData = [...prev];
            newData[padezIdx].homes[homeIdx][field] = value;
            return newData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedBuilding) {
            toast.error("Bino tanlanmagan");
            return;
        }

        const allHomes = homesData.flatMap(padez => padez.homes);
        const filledHomes = allHomes.filter(h => h.number && h.square_meter);

        if (filledHomes.length === 0) {
            toast.error("Kamida bitta xonadon ma'lumotlarini to'ldiring");
            return;
        }

        setSaving(true);
        try {
            // FormData yaratish - rasmlar bilan
            const formData = new FormData();
            formData.append('building_id', selectedBuilding.id);

            // Har bir xonadon uchun ma'lumotlarni qo'shish
            filledHomes.forEach((home, idx) => {
                formData.append(`homes[${idx}][padez]`, home.padez);
                formData.append(`homes[${idx}][number]`, home.number);
                formData.append(`homes[${idx}][floor]`, home.floor);
                formData.append(`homes[${idx}][rooms]`, home.rooms);
                formData.append(`homes[${idx}][square_meter]`, home.square_meter);
                formData.append(`homes[${idx}][price]`, home.price);

                // Rasmlarni qo'shish
                if (home.floor_plan) {
                    formData.append(`homes[${idx}][floor_plan]`, home.floor_plan);
                }
                if (home.cadastral_image) {
                    formData.append(`homes[${idx}][cadastral_image]`, home.cadastral_image);
                }
            });

            formData.append('homes_count', filledHomes.length);

            const response = await batchCreateHomes(formData);
            toast.success(response.message);
            navigate('/homes');
        } catch (error) {
            toast.error(error.response?.data?.error || "Xatolik yuz berdi");
        } finally {
            setSaving(false);
        }
    };


    return (
        <div className="homes-page">
            <div className="page-header">
                <div className="header-left">
                    <div>
                        <h1 className="page-title">Xonadonlarni qo'lda qo'shish</h1>
                        <p className="page-subtitle">Har bir xonadon uchun ma'lumotlarni kiriting</p>
                    </div>
                </div>
            </div>

            <div className="page-content">
                <div className="content-card">
                    {/* Bino tanlash section */}
                    <div className="card-header">
                        <div className="filters-container">
                            <select
                                value={selectedCity}
                                onChange={(e) => {
                                    setSelectedCity(e.target.value);
                                    setSelectedBuilding(null);
                                    setHomesData([]);
                                    setExpandedPadez([]);
                                }}
                                className="filter-select"
                            >
                                <option value="">Barcha shaharlar</option>
                                {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>

                            <select
                                value={selectedBuilding?.id || ''}
                                onChange={(e) => handleBuildingSelect(e.target.value)}
                                className="filter-select"
                                disabled={!selectedCity}
                            >
                                <option value="">{selectedCity ? "Bino tanlang..." : "Avval shahar tanlang..."}</option>
                                {filteredBuildings.map(b => (
                                    <option key={b.id} value={b.id}>
                                        {b.name} - {b.padez} ta padez, {b.floor} qavat
                                    </option>
                                ))}
                            </select>
                        </div>
                        {selectedBuilding && (
                            <div className="results-count">
                                <strong>{selectedBuilding.name}</strong> - {Array.isArray(selectedBuilding.padez_home) ? selectedBuilding.padez_home.reduce((a, b) => a + (parseInt(b) || 0), 0) : 0} ta xonadon
                            </div>
                        )}
                    </div>

                    {/* Content area */}
                    <div style={{ padding: '24px' }}>
                        {loading ? (
                            <div className="loading-state">
                                <div className="spinner"></div>
                                <p>Ma'lumotlar yuklanmoqda...</p>
                            </div>
                        ) : !selectedBuilding ? (
                            <div className="empty-state">
                                <BuildingIcon />
                                <h3>Bino tanlang</h3>
                                <p>Xonadonlarni qo'shish uchun avval binoni tanlang</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                {homesData.map((padezData, padezIdx) => (
                                    <div key={padezData.padez} className="padez-section">
                                        <button
                                            type="button"
                                            className={`padez-header ${expandedPadez.includes(padezData.padez) ? 'expanded' : ''}`}
                                            onClick={() => togglePadez(padezData.padez)}
                                        >
                                            <span>
                                                <GridIcon />
                                                {padezData.padez}-Padez ({padezData.homes.length} ta xonadon)
                                            </span>
                                            <ChevronIcon expanded={expandedPadez.includes(padezData.padez)} />
                                        </button>

                                        <div className={`padez-content ${expandedPadez.includes(padezData.padez) ? 'expanded' : 'collapsed'}`}>

                                            <div className="homes-grid">
                                                {padezData.homes.map((home, homeIdx) => (
                                                    <div key={homeIdx} className="home-card">
                                                        <div className="home-card-header">
                                                            <span className="home-number">#{homeIdx + 1}</span>
                                                        </div>
                                                        <div className="home-card-body">
                                                            <div className="form-row">
                                                                <div className="form-group">
                                                                    <label className="required">Raqam</label>
                                                                    <input
                                                                        type="text"
                                                                        value={home.number}
                                                                        onChange={(e) => handleHomeChange(padezIdx, homeIdx, 'number', e.target.value)}
                                                                        placeholder="1A"
                                                                    />
                                                                </div>
                                                                <div className="form-group">
                                                                    <label className="required">Qavat</label>
                                                                    <input
                                                                        type="text"
                                                                        value={home.floor}
                                                                        onChange={(e) => {
                                                                            if (isValidInteger(e.target.value)) {
                                                                                handleHomeChange(padezIdx, homeIdx, 'floor', e.target.value);
                                                                            }
                                                                        }}
                                                                        placeholder="1"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="form-row">
                                                                <div className="form-group">
                                                                    <label className="required">Xonalar</label>
                                                                    <input
                                                                        type="text"
                                                                        value={home.rooms}
                                                                        onChange={(e) => {
                                                                            if (isValidInteger(e.target.value)) {
                                                                                handleHomeChange(padezIdx, homeIdx, 'rooms', e.target.value);
                                                                            }
                                                                        }}
                                                                        placeholder="2"
                                                                    />
                                                                </div>
                                                                <div className="form-group">
                                                                    <label className="required">Maydon (m²)</label>
                                                                    <input
                                                                        type="text"
                                                                        value={home.square_meter}
                                                                        onChange={(e) => {
                                                                            if (isValidNumber(e.target.value)) {
                                                                                handleHomeChange(padezIdx, homeIdx, 'square_meter', e.target.value);
                                                                            }
                                                                        }}
                                                                        placeholder="64.5"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="form-group">
                                                                <label className="required">Narx (1m² uchun)</label>
                                                                <input
                                                                    type="text"
                                                                    value={home.price ? Number(home.price).toLocaleString('ru-RU').replace(/,/g, ' ') : ''}
                                                                    onChange={(e) => {
                                                                        const raw = e.target.value.replace(/\s/g, '');
                                                                        if (raw === '' || /^\d+$/.test(raw)) {
                                                                            handleHomeChange(padezIdx, homeIdx, 'price', raw);
                                                                        }
                                                                    }}
                                                                    placeholder="10 000 000"
                                                                />
                                                            </div>
                                                            <div className="form-group">
                                                                <label>Loyiha rasmi</label>
                                                                <div className="file-input-wrapper">
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        onChange={(e) => handleHomeChange(padezIdx, homeIdx, 'floor_plan', e.target.files[0])}
                                                                    />
                                                                    <div className={`file-upload-box ${home.floor_plan ? 'has-file' : ''}`}>
                                                                        <div className="file-upload-icon">
                                                                            <ImageIcon />
                                                                        </div>
                                                                        <div className="file-upload-text">
                                                                            <span className="file-upload-label">
                                                                                {home.floor_plan ? <span className="file-name">{home.floor_plan.name}</span> : 'Rasm yuklash'}
                                                                            </span>
                                                                            <span className="file-upload-hint">PNG, JPG (max 5MB)</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="form-group">
                                                                <label>Kadastr rasmi</label>
                                                                <div className="file-input-wrapper">
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        onChange={(e) => handleHomeChange(padezIdx, homeIdx, 'cadastral_image', e.target.files[0])}
                                                                    />
                                                                    <div className={`file-upload-box ${home.cadastral_image ? 'has-file' : ''}`}>
                                                                        <div className="file-upload-icon">
                                                                            <ImageIcon />
                                                                        </div>
                                                                        <div className="file-upload-text">
                                                                            <span className="file-upload-label">
                                                                                {home.cadastral_image ? <span className="file-name">{home.cadastral_image.name}</span> : 'Rasm yuklash'}
                                                                            </span>
                                                                            <span className="file-upload-hint">PNG, JPG (max 5MB)</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <div className="modal-actions" style={{ marginTop: '24px', padding: '24px 0 0', borderTop: '1px solid var(--border-color)' }}>
                                    <button type="button" className="btn-secondary" onClick={() => navigate('/homes')}>
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
                                                <span>Xonadonlarni saqlash</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>

    );
};

// Icons
const BackIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const ChevronIcon = ({ expanded }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{
        width: '20px',
        height: '20px',
        transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
        transition: 'transform 0.2s'
    }}>
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

const SaveIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
    </svg>
);

const BuildingIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M9 22v-4h6v4" />
        <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
    </svg>
);

const GridIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px', marginRight: '8px' }}>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
    </svg>
);

const ImageIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
    </svg>
);

export default HomeCreate;
