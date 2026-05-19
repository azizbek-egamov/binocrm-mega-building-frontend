import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { getBuildings, deleteBuilding } from "../../services/buildings";
import { getCities } from "../../services/cities";
import { toast } from "sonner";
import "./Buildings.css";

const BuildingsList = () => {
  const navigate = useNavigate();
  const [buildings, setBuildings] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [modal, setModal] = useState({
    open: false,
    type: null,
    building: null,
  });
  const [modalClosing, setModalClosing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pagination
  const [pagination, setPagination] = useState({
    count: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1,
  });

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    loadBuildings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, search, cityFilter, includeArchived]);

  const loadBuildings = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        page_size: pagination.pageSize,
      };
      if (search) params.search = search;
      if (cityFilter) params.city = cityFilter;
      if (includeArchived) params.include_archived = true;

      const data = await getBuildings(params);
      // Backend paginatsiya qaytaradi: { count, next, previous, results }
      // Yoki array qaytaradi
      const buildingsList = Array.isArray(data) ? data : data.results || [];
      setBuildings(buildingsList);

      // Paginatsiya ma'lumotlarini yangilash
      const totalCount = Array.isArray(data)
        ? data.length
        : data.count || buildingsList.length || 0;
      setPagination((prev) => ({
        ...prev,
        count: totalCount,
        totalPages: Math.ceil(totalCount / prev.pageSize) || 1,
      }));
    } catch (error) {
      console.error("Binolarni yuklashda xatolik:", error);
      toast.error("Binolarni yuklashda xatolik");
      setBuildings([]);
      setPagination((prev) => ({
        ...prev,
        count: 0,
        totalPages: 1,
      }));
    } finally {
      setLoading(false);
    }
  };

  const loadCities = async () => {
    try {
      const data = await getCities({ page_size: 1000 });
      const citiesList = data.results || data;
      const list = Array.isArray(citiesList) ? citiesList : [];
      setCities(list);
      
      // Agar faqat bitta shahar bo'lsa, uni avtomatik tanlash
      if (list.length === 1 && !cityFilter) {
        setCityFilter(list[0].id.toString());
      }
    } catch (error) {
      console.error("Shaharlarni yuklashda xatolik:", error);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCityFilter = (e) => {
    const value = e.target.value;
    setCityFilter(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const openCreateModal = () => {
    navigate("/buildings/create");
  };

  const openEditModal = (building) => {
    navigate(`/buildings/${building.id}/edit`);
  };

  const openDeleteModal = (building) => {
    setModal({ open: true, type: "delete", building });
  };

  const closeModal = () => {
    setModalClosing(true);
    setTimeout(() => {
      setModal({ open: false, type: null, building: null });
      setModalClosing(false);
    }, 250);
  };

  // Raqamni formatlash funktsiyasi (1234567 -> 1 234 567)
  const formatNumber = (num) => {
    if (num === null || num === undefined || num === "") return "";
    const val = Math.floor(Number(num));
    if (isNaN(val)) return "";
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const handleDelete = async () => {
    if (!modal.building) return;
    try {
      setSaving(true);
      await deleteBuilding(modal.building.id);
      toast.success("Bino muvaffaqiyatli o'chirildi");
      closeModal();
      loadBuildings();
    } catch (error) {
      const errorMsg =
        error.response?.data?.detail || "Binoni o'chirishda xatolik";
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const year = date.getFullYear();
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
    return `${day}-${months[date.getMonth()]} ${year}`;
  };

  return (
    <div className="buildings-page">
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Binolar</h1>
          <p className="page-subtitle">Barcha binolar ro'yxati</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          <PlusIcon />
          <span>Bino qo'shish</span>
        </button>
      </div>

      <div className="page-content">
        <div className="content-card">
          <div className="card-header">
            <div className="filters-row">
              <div className="search-box">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Bino nomi yoki shifri..."
                  value={search}
                  onChange={handleSearch}
                />
              </div>
              <select
                className="filter-select"
                value={cityFilter}
                onChange={handleCityFilter}
              >
                <option value="">Barcha shaharlar</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
              
              <div 
                className={`modern-switch ${includeArchived ? 'active' : ''}`}
                onClick={() => {
                  setIncludeArchived(!includeArchived);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              >
                <div className="switch-track">
                  <div className="switch-thumb"></div>
                </div>
                <span className="switch-label">Arxivlanganlar</span>
              </div>
            </div>
            <div className="results-count">
              Jami: <strong>{pagination.count}</strong> ta bino
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Yuklanmoqda...</p>
            </div>
          ) : buildings.length === 0 ? (
            <div className="empty-state">
              <EmptyIcon />
              <h3>Binolar topilmadi</h3>
              <p>
                Hozircha binolar mavjud emas yoki qidiruv natijasi topilmadi
              </p>
              <button className="btn-primary" onClick={openCreateModal}>
                <PlusIcon />
                <span>Birinchi binoni qo'shish</span>
              </button>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Shifr</th>
                      <th>Bino nomi</th>
                      <th>Shahar</th>
                      <th>Tuzilishi</th>
                      <th>Byudjet</th>
                      <th>Holat</th>
                      <th>Sana</th>
                      <th>Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildings.map((building, index) => (
                      <tr
                        key={building.id}
                        onClick={() =>
                          navigate(`/buildings/${building.id}/edit`)
                        }
                        style={{ cursor: "pointer" }}
                        className="clickable-row"
                      >
                        <td className="cell-number">
                          {(pagination.page - 1) * pagination.pageSize +
                            index +
                            1}
                        </td>
                        <td className="cell-code">{building.code}</td>
                        <td className="cell-name">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {building.name}
                            {building.is_archived && (
                              <span style={{ 
                                padding: '2px 6px', 
                                background: '#fef2f2', 
                                color: '#ef4444', 
                                border: '1px solid #fee2e2', 
                                borderRadius: '4px', 
                                fontSize: '10px', 
                                fontWeight: 700,
                                textTransform: 'uppercase'
                              }}>
                                Arxiv
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="cell-city">
                          {building.city_name || "-"}
                        </td>
                        <td className="cell-structure">
                          <div
                            style={{
                              display: "flex",
                              gap: "12px",
                              fontSize: "13px",
                            }}
                          >
                            <div
                              title="Qavatlar"
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>
                                {building.floor}
                              </span>
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "var(--text-secondary)",
                                }}
                              >
                                qavat
                              </span>
                            </div>
                            <div
                              style={{
                                borderLeft: "1px solid var(--border-color)",
                              }}
                            ></div>
                            <div
                              title="Padezlar"
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>
                                {building.padez}
                              </span>
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "var(--text-secondary)",
                                }}
                              >
                                padez
                              </span>
                            </div>
                            <div
                              style={{
                                borderLeft: "1px solid var(--border-color)",
                              }}
                            ></div>
                            <div
                              title="Xonadonlar"
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>
                                {building.total_homes}
                              </span>
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "var(--text-secondary)",
                                }}
                              >
                                xona
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="cell-budget">
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "2px",
                              fontSize: "12px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: "8px",
                              }}
                            >
                              <span style={{ color: "var(--text-secondary)" }}>
                                Jami:
                              </span>
                              <span
                                style={{ fontWeight: 600, color: "#6366f1" }}
                              >
                                {formatNumber(building.budget)}
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: "8px",
                              }}
                            >
                              <span style={{ color: "var(--text-secondary)" }}>
                                Sarflangan:
                              </span>
                              <span
                                style={{ fontWeight: 600, color: "#ef4444" }}
                              >
                                {formatNumber(building.spent_amount)}
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: "8px",
                                borderTop: "1px solid var(--border-color)",
                                paddingTop: "2px",
                                marginTop: "2px",
                              }}
                            >
                              <span style={{ color: "var(--text-secondary)" }}>
                                Qolgan:
                              </span>
                              <span
                                style={{ fontWeight: 600, color: "#10b981" }}
                              >
                                {formatNumber(
                                  (building.budget || 0) -
                                    (building.spent_amount || 0),
                                )}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${building.status ? "active" : "inactive"}`}
                          >
                            {building.status ? "Yuklangan" : "Bo'sh"}
                          </span>
                        </td>
                        <td className="cell-date">
                          {formatDate(building.created)}
                        </td>
                        <td
                          className="cell-actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="table-actions">
                            <button
                              className="btn-icon btn-edit"
                              onClick={() => openEditModal(building)}
                              title="Tahrirlash"
                            >
                              <EditIcon />
                            </button>
                            <button
                              className="btn-icon btn-delete"
                              onClick={() => openDeleteModal(building)}
                              title="O'chirish"
                              disabled={building.status}
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
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
                    {Array.from(
                      { length: Math.min(5, pagination.totalPages) },
                      (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (
                          pagination.page >=
                          pagination.totalPages - 2
                        ) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            className={`pagination-btn ${pagination.page === pageNum ? "active" : ""}`}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      },
                    )}
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

      {/* Delete Modal */}
      {modal.open &&
        modal.type === "delete" &&
        createPortal(
          <div
            className={`modal-overlay ${modalClosing ? "closing" : ""}`}
            onClick={closeModal}
          >
            <div
              className={`modal-content ${modalClosing ? "closing" : ""}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Binoni o'chirish</h3>
                <button className="modal-close" onClick={closeModal}>
                  <CloseIcon />
                </button>
              </div>
              <div
                className="modal-body"
                style={{ textAlign: "center", padding: "32px 24px" }}
              >
                <div
                  className="modal-icon danger"
                  style={{
                    margin: "0 auto 20px",
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    background: "rgba(239, 68, 68, 0.1)",
                    color: "#ef4444",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TrashIcon />
                </div>
                <p
                  style={{
                    fontSize: "16px",
                    color: "var(--text-primary)",
                    marginBottom: "8px",
                  }}
                >
                  <strong>
                    {modal.building?.code} - {modal.building?.name}
                  </strong>{" "}
                  binoni o'chirishni xohlaysizmi?
                </p>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                  Bu amalni ortga qaytarib bo'lmaydi.
                </p>
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={closeModal}>
                  Bekor qilish
                </button>
                <button
                  className="btn-danger"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  {saving ? "O'chirilmoqda..." : "O'chirish"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

// Icons
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
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

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const BuildingSmallIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
  </svg>
);

const GridIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EmptyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01" />
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

export default BuildingsList;
