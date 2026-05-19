import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import {
  getCities,
  createCity,
  updateCity,
  deleteCity,
} from "../../services/cities";
import { toast } from "sonner";
import "./Cities.css";

const CitiesList = () => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState({ open: false, type: null, city: null });
  const [modalClosing, setModalClosing] = useState(false);
  const [formData, setFormData] = useState({ name: "" });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page]);

  const loadCities = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        page_size: pagination.pageSize,
      };
      if (search) params.search = search;

      const data = await getCities(params);
      // Backend paginatsiya qaytaradi: { count, next, previous, results }
      // Yoki array qaytaradi
      const citiesList = Array.isArray(data) ? data : data.results || [];
      setCities(citiesList);

      // Paginatsiya ma'lumotlarini yangilash
      const totalCount = Array.isArray(data)
        ? data.length
        : data.count || citiesList.length || 0;
      setPagination((prev) => ({
        ...prev,
        count: totalCount,
        totalPages: Math.ceil(totalCount / prev.pageSize) || 1,
      }));
    } catch (error) {
      console.error("Shaharlarni yuklashda xatolik:", error);
      toast.error("Shaharlarni yuklashda xatolik");
      setCities([]);
      setPagination((prev) => ({
        ...prev,
        count: 0,
        totalPages: 1,
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  useEffect(() => {
    setTimeout(() => {
      loadCities();
    }, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const openCreateModal = () => {
    setFormData({ name: "" });
    setModal({ open: true, type: "create", city: null });
  };

  const openEditModal = (city) => {
    setFormData({ name: city.name });
    setModal({ open: true, type: "edit", city });
  };

  const openDeleteModal = (city) => {
    setModal({ open: true, type: "delete", city });
  };

  const closeModal = () => {
    setModalClosing(true);
    setTimeout(() => {
      setModal({ open: false, type: null, city: null });
      setModalClosing(false);
      setFormData({ name: "" });
    }, 250);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Shahar nomini kiriting");
      return;
    }

    try {
      setSaving(true);
      if (modal.type === "edit") {
        await updateCity(modal.city.id, formData);
        toast.success("Shahar muvaffaqiyatli yangilandi");
      } else {
        await createCity(formData);
        toast.success("Shahar muvaffaqiyatli yaratildi");
      }
      closeModal();
      loadCities();
    } catch {
      toast.error(
        modal.type === "edit"
          ? "Shaharni yangilashda xatolik"
          : "Shahar yaratishda xatolik",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!modal.city) return;
    try {
      setSaving(true);
      await deleteCity(modal.city.id);
      toast.success("Shahar muvaffaqiyatli o'chirildi");
      closeModal();
      loadCities();
    } catch {
      toast.error("Shaharni o'chirishda xatolik");
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
    const month = months[date.getMonth()];
    return `${day}-${month} ${year}`;
  };

  return (
    <div className="cities-page">
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Shaharlar</h1>
          <p className="page-subtitle">Barcha shaharlar ro'yxati</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          <PlusIcon />
          <span>Shahar qo'shish</span>
        </button>
      </div>

      <div className="page-content">
        <div className="content-card">
          <div className="card-header">
            <div className="search-box">
              <SearchIcon />
              <input
                type="text"
                placeholder="Shahar nomi bo'yicha qidirish..."
                value={search}
                onChange={handleSearch}
              />
            </div>
            <div className="results-count">
              Jami: <strong>{pagination.count}</strong> ta shahar
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Yuklanmoqda...</p>
            </div>
          ) : cities.length === 0 ? (
            <div className="empty-state">
              <EmptyIcon />
              <h3>Shaharlar topilmadi</h3>
              <p>
                Hozircha shaharlar mavjud emas yoki qidiruv natijasi topilmadi
              </p>
              <button className="btn-primary" onClick={openCreateModal}>
                <PlusIcon />
                <span>Birinchi shaharni qo'shish</span>
              </button>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Shahar nomi</th>
                      <th>Yaratilgan sana</th>
                      <th>Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cities.map((city, index) => (
                      <tr
                        key={city.id}
                        onClick={() => openEditModal(city)}
                        style={{ cursor: "pointer" }}
                        className="clickable-row"
                      >
                        <td className="cell-number">
                          {(pagination.page - 1) * pagination.pageSize +
                            index +
                            1}
                        </td>
                        <td className="cell-name">{city.name}</td>
                        <td className="cell-date">
                          {formatDate(city.created)}
                        </td>
                        <td
                          className="cell-actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="table-actions">
                            <button
                              className="btn-icon btn-edit"
                              onClick={() => openEditModal(city)}
                              title="Tahrirlash"
                            >
                              <EditIcon />
                            </button>
                            <button
                              className="btn-icon btn-delete"
                              onClick={() => openDeleteModal(city)}
                              title="O'chirish"
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

      {/* Create/Edit Modal */}
      {modal.open &&
        (modal.type === "create" || modal.type === "edit") &&
        createPortal(
          <div
            className={`modal-overlay ${modalClosing ? "closing" : ""}`}
            onClick={closeModal}
          >
            <div
              className={`modal-content modal-form ${modalClosing ? "closing" : ""}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>
                  {modal.type === "edit"
                    ? "Shaharni tahrirlash"
                    : "Yangi shahar qo'shish"}
                </h3>
                <button className="modal-close" onClick={closeModal}>
                  <CloseIcon />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-form-body">
                  <div className="form-group">
                    <label htmlFor="name" className="required">
                      Shahar nomi
                    </label>
                    <input
                      type="text"
                      id="name"
                      placeholder="Masalan: Toshkent"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      autoFocus
                    />
                  </div>
                </div>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={closeModal}
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <div className="btn-spinner"></div>
                        <span>Saqlanmoqda...</span>
                      </>
                    ) : (
                      <>
                        <SaveIcon />
                        <span>
                          {modal.type === "edit" ? "Saqlash" : "Yaratish"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

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
                <h3>Shaharni o'chirish</h3>
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
                  <strong>{modal.city?.name}</strong> shahrini o'chirishni
                  xohlaysizmi?
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

const EmptyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 21h18M5 21V7l8-4 8 4v14" />
    <rect x="9" y="9" width="2" height="2" />
    <rect x="13" y="9" width="2" height="2" />
    <rect x="9" y="13" width="2" height="2" />
    <rect x="13" y="13" width="2" height="2" />
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

export default CitiesList;
