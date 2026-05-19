import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { clientService } from "../../services/clients";
import { toast } from "sonner";
import "./Clients.css";
import {
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  SaveIcon,
  CloseIcon,
  InfoIcon,
  UserIcon,
  PhoneIcon,
  MessageIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EmptyIcon,
  SmsIcon,
  SendIcon,
} from "./ClientIcons";

const HEARD_SOURCES = [
  { value: "Telegramda", label: "Telegram", className: "telegram" },
  { value: "Instagramda", label: "Instagram", className: "instagram" },
  { value: "YouTubeda", label: "YouTube", className: "youtube" },
  { value: "Odamlar orasida", label: "Odamlar orasida", className: "people" },
  { value: "Xech qayerda", label: "Xech qayerda", className: "none" },
];

const ClientsList = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  // Pagination
  const [pagination, setPagination] = useState({
    count: 0,
    page: 1,
    pageSize: 20,
    totalPages: 1,
  });

  const [modal, setModal] = useState({ open: false, type: null, client: null });
  const [modalClosing, setModalClosing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    phone2: "",
    heard_source: "Xech qayerda",
  });
  const [saving, setSaving] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState(null);

  // SMS modallari
  const [bulkSmsModal, setBulkSmsModal] = useState(false);
  const [smsModal, setSmsModal] = useState({ open: false, client: null });
  const [smsMessage, setSmsMessage] = useState("");
  const [sendingSms, setSendingSms] = useState(false);

  useEffect(() => {
    loadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, search, sourceFilter]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        page_size: pagination.pageSize,
      };
      if (search) params.search = search;
      if (sourceFilter && sourceFilter !== "all") params.heard = sourceFilter;

      const response = await clientService.getAll(params);
      const data = response.data;

      const clientsList = Array.isArray(data) ? data : data.results || [];
      setClients(clientsList);

      const totalCount = Array.isArray(data)
        ? data.length
        : data.count || clientsList.length || 0;
      setPagination((prev) => ({
        ...prev,
        count: totalCount,
        totalPages: Math.ceil(totalCount / prev.pageSize) || 1,
      }));
    } catch (error) {
      console.error(error);
      toast.error("Mijozlarni yuklashda xatolik");
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSourceFilter = (e) => {
    setSourceFilter(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  // Form util functions
  const formatPhoneNumber = (value) => {
    if (!value) return value;
    const phone = value.replace(/\D/g, "");
    // Format: 99 999 99 99
    if (phone.length < 3) return phone;
    if (phone.length < 6) return `${phone.slice(0, 2)} ${phone.slice(2)}`;
    if (phone.length < 8)
      return `${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5)}`;
    return `${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5, 7)} ${phone.slice(7, 9)}`;
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      phone: "",
      phone2: "",
      heard_source: "Xech qayerda",
    });
  };

  const openCreateModal = () => {
    resetForm();
    setModal({ open: true, type: "create", client: null });
  };

  const openEditModal = (client) => {
    setFormData({
      full_name: client.full_name,
      phone: formatPhoneNumber(client.phone || ""),
      phone2: formatPhoneNumber(client.phone2 || ""),
      heard_source: client.heard_source,
    });
    setModal({ open: true, type: "edit", client });
  };

  const openDeleteModal = async (client) => {
    setDeleteWarning(null);
    setModal({ open: true, type: "delete", client });
    try {
      const res = await clientService.checkDelete(client.id);
      if (res.data.has_contracts) {
        setDeleteWarning(res.data);
      }
    } catch {
      // ignore check error
    }
  };

  const closeModal = () => {
    setModalClosing(true);
    setTimeout(() => {
      setModal({ open: false, type: null, client: null });
      setModalClosing(false);
      resetForm();
      setDeleteWarning(null);
    }, 250);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone" || name === "phone2") {
      const formatted = formatPhoneNumber(value);
      if (value.length < formData[name].length) {
        // Deleting logic simple handling
        setFormData((prev) => ({ ...prev, [name]: value }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: formatted }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      toast.error("Ism kiritish majburiy");
      return;
    }
    if (!formData.phone || formData.phone.length < 9) {
      toast.error("Telefon raqam to'liq emas");
      return;
    }

    const data = {
      ...formData,
      phone: formData.phone.replace(/\s/g, ""),
      phone2: formData.phone2 ? formData.phone2.replace(/\s/g, "") : "",
    };

    try {
      setSaving(true);
      if (modal.type === "edit") {
        await clientService.update(modal.client.id, data);
        toast.success("Mijoz muvaffaqiyatli yangilandi");
      } else {
        await clientService.create(data);
        toast.success("Mijoz muvaffaqiyatli yaratildi");
      }
      closeModal();
      loadClients();
    } catch {
      toast.error("Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!modal.client) return;
    const force = !!deleteWarning;
    try {
      setSaving(true);
      await clientService.delete(modal.client.id, force);
      toast.success(
        force ? "Mijoz va shartnomalari o'chirildi" : "Mijoz o'chirildi",
      );
      closeModal();
      loadClients();
    } catch (error) {
      if (
        error.response?.status === 409 &&
        error.response?.data?.error === "has_contracts"
      ) {
        setDeleteWarning(error.response.data);
      } else {
        toast.error("O'chirishda xatolik");
      }
    } finally {
      setSaving(false);
    }
  };

  // SMS funksiyalari
  const openBulkSmsModal = () => {
    setSmsMessage("");
    setBulkSmsModal(true);
  };

  const closeBulkSmsModal = () => {
    setModalClosing(true);
    setTimeout(() => {
      setBulkSmsModal(false);
      setModalClosing(false);
      setSmsMessage("");
    }, 250);
  };

  const openSmsModal = (client) => {
    setSmsMessage("");
    setSmsModal({ open: true, client });
  };

  const closeSmsModal = () => {
    setModalClosing(true);
    setTimeout(() => {
      setSmsModal({ open: false, client: null });
      setModalClosing(false);
      setSmsMessage("");
    }, 250);
  };

  const handleSendBulkSms = async () => {
    if (!smsMessage.trim()) {
      toast.error("SMS matnini kiriting");
      return;
    }
    if (smsMessage.length < 10) {
      toast.error(
        "SMS matni kamida 10 ta belgidan iborat bo'lishi kerak (Eskiz talabi)",
      );
      return;
    }
    try {
      setSendingSms(true);
      const response = await clientService.sendBulkSms(smsMessage);
      if (response.status >= 200 && response.status < 300) {
        toast.success(response.data.message || "SMS yuborildi");
        closeBulkSmsModal();
      } else {
        toast.error(response.data.error || "Xatolik yuz berdi");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "SMS yuborishda xatolik");
    } finally {
      setSendingSms(false);
    }
  };

  const handleSendSms = async () => {
    if (!smsMessage.trim()) {
      toast.error("SMS matnini kiriting");
      return;
    }
    if (smsMessage.length < 10) {
      toast.error(
        "SMS matni kamida 10 ta belgidan iborat bo'lishi kerak (Eskiz talabi)",
      );
      return;
    }
    if (!smsModal.client) return;
    try {
      setSendingSms(true);
      const response = await clientService.sendSms(
        smsModal.client.id,
        smsMessage,
      );
      if (response.status >= 200 && response.status < 300) {
        toast.success(response.data.message || "SMS yuborildi");
        closeSmsModal();
      } else {
        toast.error(response.data.error || "Xatolik yuz berdi");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "SMS yuborishda xatolik");
    } finally {
      setSendingSms(false);
    }
  };

  const getSourceLabel = (source) => {
    const item = HEARD_SOURCES.find((s) => s.value === source);
    const className = item ? item.className : "none";

    let colorClass = "#6b7280";
    let bgClass = "rgba(107, 114, 128, 0.1)";

    if (className === "telegram") {
      colorClass = "#3b82f6";
      bgClass = "rgba(59, 130, 246, 0.1)";
    }
    if (className === "instagram") {
      colorClass = "#ec4899";
      bgClass = "rgba(236, 72, 153, 0.1)";
    }
    if (className === "youtube") {
      colorClass = "#ef4444";
      bgClass = "rgba(239, 68, 68, 0.1)";
    }
    if (className === "people") {
      colorClass = "#10b981";
      bgClass = "rgba(16, 185, 129, 0.1)";
    }

    return (
      <span
        style={{
          padding: "6px 10px",
          borderRadius: "8px",
          fontSize: "12px",
          fontWeight: "600",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: bgClass,
          color: colorClass,
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "currentColor",
          }}
        ></span>
        {item ? item.label : source}
      </span>
    );
  };

  return (
    <div className="clients-page">
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Mijozlar</h1>
          <p className="page-subtitle">Mijozlar bazasini boshqarish</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={openBulkSmsModal}>
            <SmsIcon />
            <span>SMS yuborish</span>
          </button>
          <button className="btn-primary" onClick={openCreateModal}>
            <PlusIcon />
            <span>Mijoz qo'shish</span>
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
                  placeholder="Qidirish..."
                  value={search}
                  onChange={handleSearch}
                />
              </div>
              <select
                className="filter-select"
                value={sourceFilter}
                onChange={handleSourceFilter}
              >
                <option value="all">Barcha manbalar</option>
                {HEARD_SOURCES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              <div className="results-count">
                Jami: <strong>{pagination.count}</strong> ta mijoz
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Yuklanmoqda...</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="empty-state">
              <EmptyIcon />
              <h3>Mijozlar topilmadi</h3>
              <p>Sizning so'rovingiz bo'yicha mijozlar topilmadi</p>
              <button className="btn-primary" onClick={openCreateModal}>
                <PlusIcon style={{ width: 18, height: 18, flexShrink: 0 }} />
                <span>Mijoz qo'shish</span>
              </button>
            </div>
          ) : (
            <>
              <div className="responsive-table">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>To'liq Ismi</th>
                      <th>Telefon Raqami</th>
                      <th>Manba</th>
                      <th>Qo'shimcha Tel</th>
                      <th style={{ textAlign: "right" }}>Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client, index) => (
                      <tr
                        key={client.id}
                        onClick={() => openEditModal(client)}
                        style={{ cursor: "pointer" }}
                        className="clickable-row"
                      >
                        <td className="cell-number">
                          {(pagination.page - 1) * pagination.pageSize +
                            index +
                            1}
                        </td>
                        <td className="cell-name">{client.full_name}</td>
                        <td className="cell-phone">
                          <a
                            href={`tel:+998${client.phone}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span>+998</span>
                            {formatPhoneNumber(client.phone)}
                          </a>
                        </td>
                        <td>{getSourceLabel(client.heard_source)}</td>
                        <td className="cell-phone">
                          {client.phone2 ? (
                            <a
                              href={`tel:+998${client.phone2}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span>+998</span>
                              {formatPhoneNumber(client.phone2)}
                            </a>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td
                          className="cell-actions"
                          style={{ justifyContent: "flex-end" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="table-actions">
                            <button
                              className="btn-icon btn-sms"
                              onClick={() => openSmsModal(client)}
                              title="SMS yuborish"
                            >
                              <SmsIcon />
                            </button>
                            <button
                              className="btn-icon btn-edit"
                              onClick={() => openEditModal(client)}
                              title="Tahrirlash"
                            >
                              <EditIcon />
                            </button>
                            <button
                              className="btn-icon btn-delete"
                              onClick={() => openDeleteModal(client)}
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
                    ? "Mijozni tahrirlash"
                    : "Yangi mijoz qo'shish"}
                </h3>
                <button className="modal-close" onClick={closeModal}>
                  <CloseIcon />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-form-body">
                  <div className="form-group">
                    <label htmlFor="full_name" className="required">
                      To'liq ismi
                    </label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      placeholder="Masalan: Eshmat Toshmatov"
                      value={formData.full_name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone" className="required">
                      Telefon raqami
                    </label>
                    <input
                      type="text"
                      id="phone"
                      name="phone"
                      placeholder="+998 90 123 45 67"
                      value={formData.phone ? `+998 ${formData.phone}` : ""}
                      onChange={(e) => {
                        const val = e.target.value
                          .replace("+998 ", "")
                          .replace("+998", "");
                        handleInputChange({
                          target: { name: "phone", value: val },
                        });
                      }}
                      maxLength={17}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone2">Qo'shimcha telefon</label>
                    <input
                      type="text"
                      id="phone2"
                      name="phone2"
                      placeholder="+998 90 123 45 67"
                      value={formData.phone2 ? `+998 ${formData.phone2}` : ""}
                      onChange={(e) => {
                        const val = e.target.value
                          .replace("+998 ", "")
                          .replace("+998", "");
                        handleInputChange({
                          target: { name: "phone2", value: val },
                        });
                      }}
                      maxLength={17}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="heard_source" className="required">
                      Qayerda eshitgan
                    </label>
                    <select
                      id="heard_source"
                      name="heard_source"
                      value={formData.heard_source}
                      onChange={handleInputChange}
                    >
                      {HEARD_SOURCES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
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
                <h3>Mijozni o'chirish</h3>
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
                    background: deleteWarning
                      ? "rgba(245,158,11,0.15)"
                      : "rgba(239, 68, 68, 0.1)",
                    color: deleteWarning ? "#f59e0b" : "#ef4444",
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
                  <strong>{modal.client?.full_name}</strong> mijozini
                  o'chirishni xohlaysizmi?
                </p>
                {deleteWarning ? (
                  <div
                    style={{
                      background: "rgba(245,158,11,0.1)",
                      border: "1px solid rgba(245,158,11,0.3)",
                      borderRadius: "10px",
                      padding: "14px",
                      marginTop: "12px",
                      textAlign: "left",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#f59e0b",
                        marginBottom: "8px",
                      }}
                    >
                      ⚠️ {deleteWarning.message}
                    </p>
                    {deleteWarning.contracts.map((c) => (
                      <p
                        key={c.id}
                        style={{
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                          marginBottom: "4px",
                        }}
                      >
                        📄 #{c.contract_number} — {c.building_name},{" "}
                        {c.home_number}-xona
                      </p>
                    ))}
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#ef4444",
                        marginTop: "10px",
                        fontWeight: 600,
                      }}
                    >
                      O'chirsangiz barcha shartnomalari ham o'chiriladi!
                    </p>
                  </div>
                ) : (
                  <p
                    style={{ fontSize: "14px", color: "var(--text-secondary)" }}
                  >
                    Bu amalni ortga qaytarib bo'lmaydi.
                  </p>
                )}
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
                  {saving
                    ? "O'chirilmoqda..."
                    : deleteWarning
                      ? "Hammasi bilan o'chirish"
                      : "O'chirish"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {bulkSmsModal &&
        createPortal(
          <div
            className={`modal-overlay ${modalClosing ? "closing" : ""}`}
            onClick={closeBulkSmsModal}
          >
            <div
              className={`modal-content modal-form ${modalClosing ? "closing" : ""}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Ommaviy SMS yuborish</h3>
                <button className="modal-close" onClick={closeBulkSmsModal}>
                  <CloseIcon />
                </button>
              </div>
              <div className="modal-form-body">
                <div className="form-group">
                  <label>SMS MAQSADI</label>
                  <div
                    className="sms-info-note"
                    style={{
                      padding: "12px",
                      background: "rgba(99, 102, 241, 0.05)",
                      borderRadius: "10px",
                      color: "var(--text-secondary)",
                      fontSize: "13px",
                      border: "1px dashed rgba(99, 102, 241, 0.2)",
                    }}
                  >
                    Xabar ro'yxatdagi barcha mijozlarga (jami {pagination.count}{" "}
                    ta) yuboriladi.
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="bulkSmsMessage">SMS MATNI *</label>
                  <textarea
                    id="bulkSmsMessage"
                    placeholder="Xabar matnini kiriting..."
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    rows={5}
                  />
                  <div
                    className="sms-char-count-minimal"
                    style={{
                      textAlign: "right",
                      fontSize: "11px",
                      marginTop: "6px",
                      color:
                        smsMessage.length < 10
                          ? "#ef4444"
                          : "var(--text-secondary)",
                    }}
                  >
                    {smsMessage.length} belgi{" "}
                    {smsMessage.length < 10 && "(kamida 10 ta bo'lishi shart)"}
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={closeBulkSmsModal}>
                  Bekor qilish
                </button>
                <button
                  className="btn-primary"
                  onClick={handleSendBulkSms}
                  disabled={sendingSms || smsMessage.length < 10}
                >
                  {sendingSms ? (
                    <>
                      <div className="btn-spinner"></div>
                      <span>Yuborilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <SendIcon />
                      <span>Hammaga yuborish</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {smsModal.open &&
        createPortal(
          <div
            className={`modal-overlay ${modalClosing ? "closing" : ""}`}
            onClick={closeSmsModal}
          >
            <div
              className={`modal-content modal-form ${modalClosing ? "closing" : ""}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>SMS yuborish</h3>
                <button className="modal-close" onClick={closeSmsModal}>
                  <CloseIcon />
                </button>
              </div>
              <div className="modal-form-body">
                <div className="form-group">
                  <label>MIJOZ</label>
                  <input
                    type="text"
                    readOnly
                    value={`${smsModal.client?.full_name} (+998 ${formatPhoneNumber(smsModal.client?.phone)})`}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="smsMessage">SMS MATNI *</label>
                  <textarea
                    id="smsMessage"
                    placeholder="Xabar matnini kiriting..."
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    rows={5}
                  />
                  <div
                    className="sms-char-count-minimal"
                    style={{
                      textAlign: "right",
                      fontSize: "11px",
                      marginTop: "6px",
                      color:
                        smsMessage.length < 10
                          ? "#ef4444"
                          : "var(--text-secondary)",
                    }}
                  >
                    {smsMessage.length} belgi{" "}
                    {smsMessage.length < 10 && "(kamida 10 ta bo'lishi shart)"}
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={closeSmsModal}>
                  Bekor qilish
                </button>
                <button
                  className="btn-primary"
                  onClick={handleSendSms}
                  disabled={sendingSms || smsMessage.length < 10}
                >
                  {sendingSms ? (
                    <>
                      <div className="btn-spinner"></div>
                      <span>Yuborilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <SendIcon />
                      <span>Yuborish</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default ClientsList;
