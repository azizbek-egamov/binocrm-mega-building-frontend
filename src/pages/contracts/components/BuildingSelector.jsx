import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from '../../../services/api';

const BuildingSelector = ({ onSelect, selectedData }) => {
    const [cities, setCities] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadCities();
    }, []);

    useEffect(() => {
        if (selectedData.cityId) {
            loadBuildings(selectedData.cityId);
        } else {
            setBuildings([]);
        }
    }, [selectedData.cityId]);

    const loadCities = async () => {
        try {
            const response = await api.get('/cities/');
            const list = response.data.results || response.data;
            setCities(list);
            
            // Avtomatik tanlash
            if (list.length === 1 && !selectedData.cityId) {
                onSelect({
                    ...selectedData,
                    cityId: list[0].id.toString()
                });
            }
        } catch (error) {
            console.error("Error loading cities:", error);
            toast.error("Shaharlarni yuklashda xatolik");
        }
    };

    const loadBuildings = async (cityId) => {
        try {
            setLoading(true);
            const response = await api.get('/buildings/', { params: { city: cityId } });
            const list = response.data.results || response.data;
            setBuildings(list);
            
            // Avtomatik tanlash
            if (list.length === 1 && !selectedData.buildingId) {
                const building = list[0];
                onSelect({
                    ...selectedData,
                    cityId: String(cityId),
                    buildingId: building.id,
                    buildingName: building.name,
                    buildingData: building
                });
            }
        } catch (error) {
            console.error("Error loading buildings:", error);
            toast.error("Binolarni yuklashda xatolik");
        } finally {
            setLoading(false);
        }
    };

    // Shahar tanlanganda va binolar mavjud bo'lganda avtomatik bino tanlash
    useEffect(() => {
        if (selectedData.cityId && buildings.length > 0) {
            const filtered = buildings.filter(b => b.city === parseInt(selectedData.cityId));
            if (filtered.length === 1 && !selectedData.buildingId) {
                const building = filtered[0];
                onSelect({
                    ...selectedData,
                    buildingId: building.id,
                    buildingName: building.name,
                    buildingData: building
                });
            }
        }
    }, [selectedData.cityId, buildings]);

    const handleCityChange = (e) => {
        const cityId = e.target.value;
        onSelect({
            cityId,
            buildingId: '', // Reset building
            buildingName: '',
            buildingData: null
        });
    };

    const handleBuildingChange = (e) => {
        const buildingId = e.target.value;
        const building = buildings.find(b => String(b.id) === String(buildingId));
        onSelect({
            ...selectedData,
            buildingId: building ? Number(buildingId) : '',
            buildingName: building ? building.name : '',
            buildingData: building
        });
    };

    const selectedBuilding = buildings.find(b => String(b.id) === String(selectedData.buildingId));

    return (
        <div className="card-section">
            <div className="section-header">
                <div className="icon-box bg-primary-subtle">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="4" y="2" width="16" height="20" rx="2" />
                        <path d="M9 22v-4h6v4" />
                        <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01" />
                    </svg>
                </div>
                <h3>Bino tanlash</h3>
            </div>

            <div className="form-grid">
                <div className="form-group">
                    <label>Shahar <span className="text-danger">*</span></label>
                    <div className="input-wrapper">
                        <select
                            className="form-select"
                            value={selectedData.cityId || ''}
                            onChange={handleCityChange}
                        >
                            <option value="">Shaharni tanlang</option>
                            {cities.map(city => (
                                <option key={city.id} value={city.id}>{city.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label>Bino <span className="text-danger">*</span></label>
                    <div className="input-wrapper">
                        <select
                            className="form-select"
                            value={selectedData.buildingId || ''}
                            onChange={handleBuildingChange}
                            disabled={!selectedData.cityId || loading}
                        >
                            <option value="">Binoni tanlang</option>
                            {buildings.map(building => (
                                <option key={building.id} value={building.id}>{building.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {selectedBuilding && (
                <div className="building-summary">
                    <div className="summary-item">
                        <div className="label">Bino nomi</div>
                        <div className="value">{selectedBuilding.name}</div>
                    </div>
                    <div className="summary-item">
                        <div className="label">Padezlar</div>
                        <div className="value">{selectedBuilding.padez}</div>
                    </div>
                    <div className="summary-item">
                        <div className="label">Qavatlar</div>
                        <div className="value">{selectedBuilding.floor}</div>
                    </div>
                    <div className="summary-item">
                        <div className="label">Uylar soni</div>
                        <div className="value">
                            {selectedBuilding.total_homes || (Array.isArray(selectedBuilding.padez_home) ? selectedBuilding.padez_home.reduce((a, b) => a + (parseInt(b) || 0), 0) : 0)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BuildingSelector;
