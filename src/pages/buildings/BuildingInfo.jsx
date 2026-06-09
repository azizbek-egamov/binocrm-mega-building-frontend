"use client";

import { createPortal } from "react-dom";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { getAllCities } from "../../services/cities";
import { getAllBuildings } from "../../services/buildings";
import { getHomes } from "../../services/homes";
import { contractService } from "../../services/contracts";
import { useNavigate } from "react-router-dom";
import ImageModal from "../../components/ui/ImageModal";
import {
  AdaptivePageHeader,
  useAdaptiveHeader,
} from "../../components/AdaptiveHeader";
import "../contracts/ContractCreate.css";
import "./BuildingInfo.css";

// Format number with spaces
const formatNumber = (num) => {
  if (!num) return "0";
  return new Intl.NumberFormat("uz-UZ").format(Math.floor(Number(num)));
};

import ScrollHint from "../../components/ScrollHint";

const BuildingInfo = () => {
  // Adaptive Header Hook
  const { headerState, isVisible } = useAdaptiveHeader();

  // State
  const [cities, setCities] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [homes, setHomes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedBuildingId, setSelectedBuildingId] = useState("");

  // Modal state
  const [selectedHome, setSelectedHome] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractData, setContractData] = useState(null);
  const navigate = useNavigate();

  // Tooltip
  const [hoveredHome, setHoveredHome] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  // Load cities on mount
  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const data = await getAllCities();
      const list = Array.isArray(data) ? data : (data.results || []);
      setCities(list);
      
      // Avtomatik tanlash
      if (list.length === 1 && !selectedCityId) {
        setSelectedCityId(list[0].id.toString());
      }
    } catch {
      toast.error("Shaharlarni yuklashda xatolik");
    }
  };

  // Load buildings when city changes
  useEffect(() => {
    if (selectedCityId) {
      loadBuildings();
    } else {
      setBuildings([]);
      setHomes([]);
      setSelectedBuildingId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCityId]);

  const loadBuildings = async () => {
    try {
      const data = await getAllBuildings({ city: selectedCityId });
      const list = Array.isArray(data) ? data : (data.results || []);
      setBuildings(list);
      
      // Avtomatik tanlash
      if (list.length === 1 && !selectedBuildingId) {
        setSelectedBuildingId(list[0].id.toString());
      }
    } catch {
      toast.error("Binolarni yuklashda xatolik");
    }
  };

  // Shahar o'zgarganda binolarni avtomatik tekshirish
  useEffect(() => {
    if (selectedCityId && buildings.length > 0) {
      const filtered = buildings.filter(b => b.city === parseInt(selectedCityId));
      if (filtered.length === 1 && !selectedBuildingId) {
        setSelectedBuildingId(filtered[0].id.toString());
      }
    }
  }, [selectedCityId, buildings]);

  // Load homes when building changes
  useEffect(() => {
    if (selectedBuildingId) {
      loadHomes();
    } else {
      setHomes([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBuildingId]);

  const loadHomes = async () => {
    setLoading(true);
    try {
      const data = await getHomes({
        building: selectedBuildingId,
        page_size: 1000,
      });
      setHomes(data.results || data);
    } catch {
      toast.error("Xonadonlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  // Building structure for grid
  const buildingStructure = useMemo(() => {
    if (!homes.length) return null;

    let maxFloor = 0;
    let maxPadez = 0;
    homes.forEach((home) => {
      const floor = parseInt(home.floor) || parseInt(home.home_floor) || 0;
      const padez = parseInt(home.padez) || parseInt(home.padez_number) || 1;
      if (floor > maxFloor) maxFloor = floor;
      if (padez > maxPadez) maxPadez = padez;
    });

    const structure = {};
    for (let p = 1; p <= maxPadez; p++) {
      structure[p] = {};
      for (let f = 1; f <= maxFloor; f++) {
        structure[p][f] = [];
      }
    }

    homes.forEach((home) => {
      const floor = parseInt(home.floor) || parseInt(home.home_floor) || 1;
      const padez = parseInt(home.padez) || parseInt(home.padez_number) || 1;
      if (structure[padez] && structure[padez][floor]) {
        structure[padez][floor].push(home);
      }
    });

    // Sort homes in each floor by number
    Object.keys(structure).forEach((padez) => {
      Object.keys(structure[padez]).forEach((floor) => {
        structure[padez][floor].sort((a, b) => {
          const numA =
            parseInt(String(a.number || a.home_number).replace(/\D/g, "")) || 0;
          const numB =
            parseInt(String(b.number || b.home_number).replace(/\D/g, "")) || 0;
          return numA - numB;
        });
      });
    });

    return structure;
  }, [homes]);

  // Stats
  const stats = useMemo(() => {
    const available = homes.filter((h) => h.status === "AVAILABLE").length;
    const sold = homes.filter((h) => h.status === "SOLD").length;
    const reserved = homes.filter((h) => h.status === "BOOKED").length;
    const inactive = homes.filter(
      (h) => h.status === "INACTIVE" || h.status === "UNAVAILABLE",
    ).length;
    return { available, sold, reserved, inactive, total: homes.length };
  }, [homes]);

  // Get home status class
  const getStatusClass = (home) => {
    const status = (home.status || "AVAILABLE").toUpperCase();
    if (status === "AVAILABLE") return "available";
    if (status === "SOLD") return "sold";
    if (status === "BOOKED" || status === "RESERVED") return "booked";
    return "unavailable";
  };

  // Get status text
  const getStatusText = (home) => {
    const status = (home.status || "AVAILABLE").toUpperCase();
    if (status === "AVAILABLE") return "Sotuvda";
    if (status === "SOLD") return "Sotilgan";
    if (status === "BOOKED" || status === "RESERVED") return "Band qilingan";
    if (status === "INACTIVE" || status === "UNAVAILABLE") return "Nofaol";
    return "Noma'lum";
  };

  // Handle home click
  const handleHomeClick = async (home) => {
    setSelectedHome(home);
    setShowDetailsModal(true);
    setContractData(null);

    if (home.status === "SOLD" && home.contract_id) {
      setContractLoading(true);
      try {
        const response = await contractService.get(home.contract_id);
        setContractData(response.data);
      } catch (error) {
        console.error("Shartnoma yuklashda xatolik:", error);
      } finally {
        setContractLoading(false);
      }
    }
  };

  // Tooltip handlers
  const handleMouseEnter = (e, home) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // getBoundingClientRect gives viewport-relative coords, perfect for fixed positioning
    setTooltipPos({
      top: rect.top,
      left: rect.left + rect.width / 2,
    });
    setHoveredHome(home);
  };

  const handleMouseLeave = () => {
    setHoveredHome(null);
  };

  // Close modal
  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedHome(null);
  };

  // Selected building info
  const selectedBuilding = buildings.find(
    (b) => b.id === parseInt(selectedBuildingId),
  );

  // Tooltip Component - rendered via portal for proper fixed positioning
  const HomeTooltip = ({ home, position }) => {
    if (!home) return null;
    const totalPrice = (home.price || 0) * (home.square_meter || 0);

    return createPortal(
      <div
        className="home-info-tooltip"
        style={{ top: position.top, left: position.left }}
      >
        <div className="tooltip-header">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          </svg>
          <span>Uy #{home.number || home.home_number}</span>
        </div>
        <div className="tooltip-body">
          <div className="tooltip-row">
            <div className="tooltip-label">Padez:</div>
            <div className="tooltip-value">
              {home.padez || home.padez_number || 1}
            </div>
          </div>
          <div className="tooltip-row">
            <div className="tooltip-label">Qavat:</div>
            <div className="tooltip-value">{home.floor || home.home_floor}</div>
          </div>
          <div className="tooltip-row">
            <div className="tooltip-label">Xonalar:</div>
            <div className="tooltip-value">{home.rooms} xona</div>
          </div>
          <div className="tooltip-row">
            <div className="tooltip-label">Maydon:</div>
            <div className="tooltip-value">{home.square_meter} m²</div>
          </div>
          <div className="tooltip-row">
            <div className="tooltip-label">1 kv/m narxi:</div>
            <div className="tooltip-value">{formatNumber(home.price)} so'm</div>
          </div>
          <div className="tooltip-row">
            <div className="tooltip-label">Umumiy narxi:</div>
            <div className="tooltip-value">{formatNumber(totalPrice)} so'm</div>
          </div>
          <div className="tooltip-row">
            <div className="tooltip-label">Holati:</div>
            <div className={`tooltip-value status-${getStatusClass(home)}`}>
              {getStatusText(home)}
            </div>
          </div>
        </div>
      </div>,
      document.body,
    );
  };

  return (
    <div className="contract-create-page building-info-page">
      {hoveredHome && <HomeTooltip home={hoveredHome} position={tooltipPos} />}

      {/* Adaptive Sticky Header */}
      <AdaptivePageHeader
        title="Bino ma'lumotlari"
        subtitle="Binolarni tanlang va xonadonlarni ko'ring"
        headerState={headerState}
        isVisible={isVisible}
      />

      <div className="create-content">
        {/* Filter Section */}
        <div className="card-section">
          <div className="section-header">
            <div className="icon-box bg-info-subtle">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
            </div>
            <h3>Filtr</h3>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>
                Shahar <span className="text-danger">*</span>
              </label>
              <select
                className="form-select"
                value={selectedCityId}
                onChange={(e) => setSelectedCityId(e.target.value)}
              >
                <option value="">Shaharni tanlang</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>
                Bino <span className="text-danger">*</span>
              </label>
              <select
                className="form-select"
                value={selectedBuildingId}
                onChange={(e) => setSelectedBuildingId(e.target.value)}
                disabled={!selectedCityId}
              >
                <option value="">Binoni tanlang</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* Building Grid Section */}
        <div className="card-section home-selector">
          <div className="section-header">
            <div className="icon-box bg-success-subtle">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <h3>Bino tarkibi</h3>
            {homes.length > 0 && (
              <div className="home-stats">
                <span className="stat available">
                  Sotuvda: {stats.available}
                </span>
                <span className="stat sold">Sotilgan: {stats.sold}</span>
                <span className="stat booked">Band: {stats.reserved}</span>
              </div>
            )}
          </div>

          <div className="homes-container">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Uylar yuklanmoqda...</p>
              </div>
            ) : !selectedBuildingId ? (
              <div className="empty-state">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <p>Binoni tanlang va bino tarkibi shu yerda ko'rsatiladi</p>
              </div>
            ) : homes.length === 0 ? (
              <div className="empty-state">Bu binoda uylar topilmadi</div>
            ) : buildingStructure ? (
              <>
                <ScrollHint />
                <div className="building-grid-wrapper">
                  <div className="building-grid">
                    {Object.keys(buildingStructure)
                      .sort((a, b) => a - b)
                      .map((padez) => (
                        <div key={padez} className="padez-column">
                          <div className="padez-header">{padez}-padez</div>
                          <div className="floors-wrapper">
                            {Object.keys(buildingStructure[padez])
                              .sort((a, b) => b - a)
                              .map((floor) => (
                                <div key={floor} className="floor-row">
                                  <div className="floor-label">{floor}</div>
                                  <div className="homes-row">
                                    {buildingStructure[padez][floor].length >
                                    0 ? (
                                      buildingStructure[padez][floor].map(
                                        (home) => (
                                          <div
                                            key={home.id}
                                            className={`home-cell ${getStatusClass(home)}`}
                                            onClick={() =>
                                              handleHomeClick(home)
                                            }
                                            onMouseEnter={(e) =>
                                              handleMouseEnter(e, home)
                                            }
                                            onMouseLeave={handleMouseLeave}
                                          >
                                            {home.number || home.home_number}
                                          </div>
                                        ),
                                      )
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
                    <div className="legend-item">
                      <span className="dot available"></span> Sotuvda
                    </div>
                    <div className="legend-item">
                      <span className="dot sold"></span> Sotilgan
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Home Details Modal */}
      {showDetailsModal &&
        selectedHome &&
        createPortal(
          <div className="modal-overlay" onClick={closeModal}>
            <div
              className="modal-content modal-lg home-details-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-title">
                  <div className="icon-box bg-primary-subtle">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3>
                      Uy #{selectedHome.number || selectedHome.home_number}
                    </h3>
                    <span
                      className={`status-badge ${getStatusClass(selectedHome)}`}
                    >
                      {getStatusText(selectedHome)}
                    </span>
                  </div>
                </div>
                <button className="modal-close" onClick={closeModal}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="modal-body">
                <div className="home-summary">
                  <div className="summary-item">
                    <span className="label">Padez</span>
                    <span className="value">
                      {selectedHome.padez || selectedHome.padez_number || 1}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Qavat</span>
                    <span className="value">
                      {selectedHome.floor || selectedHome.home_floor}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Xonalar</span>
                    <span className="value">{selectedHome.rooms} xona</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Maydon</span>
                    <span className="value">
                      {selectedHome.square_meter} m²
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="label">1 m² narxi</span>
                    <span className="value">
                      {formatNumber(selectedHome.price)} so'm
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Umumiy narx</span>
                    <span className="value highlight">
                      {formatNumber(
                        selectedHome.price * selectedHome.square_meter,
                      )}{" "}
                      so'm
                    </span>
                  </div>
                </div>

                {/* Contract Details for Sold Home */}
                {selectedHome.status === "SOLD" && (
                  <div className="contract-preview-section">
                    <h4>Sotuv ma'lumotlari</h4>
                    {contractLoading ? (
                      <div className="preview-loading">
                        <div className="spinner-sm"></div>
                        <span>Ma'lumotlar yuklanmoqda...</span>
                      </div>
                    ) : contractData ? (
                      <div className="contract-info-card">
                        <div className="info-row">
                          <div className="info-item">
                            <span className="label">Mijoz:</span>
                            <span className="value">
                              {contractData.client_name ||
                                contractData.client?.full_name}
                            </span>
                          </div>
                          <div className="info-item">
                            <span className="label">Telefon:</span>
                            <span className="value">
                              {contractData.client?.phone || "Mavjud emas"}
                            </span>
                          </div>
                        </div>
                        <div className="info-row">
                          <div className="info-item">
                            <span className="label">Shartnoma:</span>
                            <span className="value">
                              #{contractData.contract_number}
                            </span>
                          </div>
                          <div className="info-item">
                            <span className="label">Sana:</span>
                            <span className="value">
                              {(() => {
                                const dateStr =
                                  contractData.contract_date ||
                                  contractData.created_at;
                                const date = new Date(dateStr);
                                const months = [
                                  "Yanvar",
                                  "Fevral",
                                  "Mart",
                                  "Aprel",
                                  "May",
                                  "Iyun",
                                  "Iyul",
                                  "Avgust",
                                  "Sentabr",
                                  "Oktabr",
                                  "Noyabr",
                                  "Dekabr",
                                ];
                                return `${date.getDate()}-${months[date.getMonth()]} ${date.getFullYear()}`;
                              })()}
                            </span>
                          </div>
                        </div>
                        <button
                          className="btn-view-contract"
                          onClick={() =>
                            navigate("/contracts", {
                              state: {
                                search: contractData.contract_number,
                                autoOpenContractId: contractData.id,
                              },
                            })
                          }
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                          Shartnomani ko'rish
                        </button>
                      </div>
                    ) : (
                      <div className="preview-error">
                        Shartnoma ma'lumotlarini yuklab bo'lmadi
                      </div>
                    )}
                  </div>
                )}

                {/* Images */}
                {(selectedHome.floor_plan || selectedHome.cadastral_image) && (
                  <div className="images-section">
                    <h4>Rasmlar</h4>
                    <div className="images-row">
                      {selectedHome.floor_plan && (
                        <div
                          className="image-card"
                          onClick={() =>
                            setPreviewImage(selectedHome.floor_plan)
                          }
                        >
                          <img
                            src={selectedHome.floor_plan || "/placeholder.svg"}
                            alt="Loyiha rasmi"
                          />
                          <span>Loyiha rasmi</span>
                        </div>
                      )}
                      {selectedHome.cadastral_image && (
                        <div
                          className="image-card"
                          onClick={() =>
                            setPreviewImage(selectedHome.cadastral_image)
                          }
                        >
                          <img
                            src={
                              selectedHome.cadastral_image || "/placeholder.svg"
                            }
                            alt="Kadastr rasmi"
                          />
                          <span>Kadastr rasmi</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={closeModal}>
                  Yopish
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Image Preview Modal */}
      <ImageModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageSrc={previewImage}
        title="Xonadon rasmi"
      />
    </div>
  );
};

export default BuildingInfo;
