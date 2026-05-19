import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createBuilding } from "../../services/buildings";
import { getCities } from "../../services/cities";
import usePageTitle from "../../hooks/usePageTitle";
import "./BuildingCreate.css";

const BuildingCreate = () => {
  usePageTitle("Yangi bino qo'shish");
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [cities, setCities] = useState([]);
  const [showPadezInputs, setShowPadezInputs] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    city: "",
    name: "",
    location: "",
    floor: "",
    padez: "",
    padez_home: [],
    construction_status: "new",
    budget: "",
    construction_start_date: "",
    construction_end_date: "",
    description: "",
    total_area: "",
  });

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      const data = await getCities({ page_size: 1000 });
      const list = data.results || data;
      setCities(Array.isArray(list) ? list : []);
    } catch {
      toast.error("Shaharlarni yuklashda xatolik");
    }
  };

  /* ── Computed ───────────────────────────────────────────── */
  const totalHomes = useMemo(() => {
    if (!Array.isArray(formData.padez_home) || !formData.padez_home.length) return 0;
    return formData.padez_home.reduce((sum, v) => sum + (parseInt(v) || 0), 0);
  }, [formData.padez_home]);

  const padezCount = parseInt(formData.padez) || 0;
  const floorCount = parseInt(formData.floor) || 0;

  const selectedCity = useMemo(
    () => cities.find((c) => String(c.id) === String(formData.city)),
    [cities, formData.city],
  );

  /* ── Handlers ───────────────────────────────────────────── */
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (["floor", "padez"].includes(name)) {
      if (value && !/^\d+$/.test(value)) return;
    }

    if (name === "budget") {
      const numeric = value.replace(/\s/g, "").replace(/[^\d]/g, "");
      setFormData((prev) => ({ ...prev, budget: numeric }));
      return;
    }

    if (name === "total_area") {
      if (value && !/^\d+$/.test(value)) return;
      setFormData((prev) => ({ ...prev, total_area: value }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "padez") {
      const cnt = parseInt(value) || 0;
      if (cnt > 0 && cnt <= 20) {
        const arr = Array(cnt).fill(0);
        formData.padez_home.forEach((v, i) => {
          if (i < cnt) arr[i] = v;
        });
        setFormData((prev) => ({ ...prev, padez_home: arr }));
        setShowPadezInputs(false);
      } else {
        setFormData((prev) => ({ ...prev, padez_home: [] }));
        setShowPadezInputs(false);
      }
    }
  };

  const handlePadezHomeChange = (index, value) => {
    if (value && !/^\d+$/.test(value)) return;
    const arr = [...formData.padez_home];
    arr[index] = parseInt(value) || 0;
    setFormData((prev) => ({ ...prev, padez_home: arr }));
  };

  const handleShowPadezInputs = () => {
    const cnt = parseInt(formData.padez) || 0;
    if (cnt < 1 || cnt > 20) {
      toast.error("Padezlar sonini to'g'ri kiriting (1-20)");
      return;
    }
    if (formData.padez_home.length !== cnt) {
      setFormData((prev) => ({ ...prev, padez_home: Array(cnt).fill(0) }));
    }
    setShowPadezInputs(true);
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined || num === "") return "";
    const val = Math.floor(Number(String(num).replace(/\s/g, "")));
    if (isNaN(val)) return "";
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  /* ── Validation ─────────────────────────────────────────── */
  const validate = () => {
    if (!formData.code.trim()) {
      toast.error("Bino shifrini kiriting");
      return false;
    }
    if (formData.code.length > 6) {
      toast.error("Bino shifri 6 ta belgidan oshmasligi kerak");
      return false;
    }
    if (!formData.city) {
      toast.error("Shaharni tanlang");
      return false;
    }
    if (!formData.name.trim()) {
      toast.error("Bino nomini kiriting");
      return false;
    }
    if (!formData.floor || parseInt(formData.floor) <= 0) {
      toast.error("Qavatlar sonini kiriting");
      return false;
    }
    if (!formData.padez || parseInt(formData.padez) <= 0) {
      toast.error("Padezlar sonini kiriting");
      return false;
    }
    if (
      !showPadezInputs ||
      formData.padez_home.length !== parseInt(formData.padez)
    ) {
      toast.error(
        '"Xonalarni kiritish" tugmasini bosib har bir padez uchun xonadonlar sonini kiriting',
      );
      return false;
    }
    if (formData.padez_home.some((v) => parseInt(v) <= 0)) {
      toast.error(
        "Har bir padezdagi xonadonlar soni kamida 1 ta bo'lishi kerak",
      );
      return false;
    }
    return true;
  };

  /* ── Submit ─────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = {
      code: formData.code.toUpperCase().trim(),
      city: parseInt(formData.city),
      name: formData.name.trim(),
      location: formData.location.trim() || null,
      floor: parseInt(formData.floor),
      padez: parseInt(formData.padez),
      padez_home: formData.padez_home.map((v) => parseInt(v) || 0),
      construction_status: formData.construction_status || "new",
      budget: formData.budget ? parseFloat(formData.budget) : 0,
      total_area: formData.total_area ? parseFloat(formData.total_area) : 0,
      construction_start_date: formData.construction_start_date || null,
      construction_end_date: formData.construction_end_date || null,
      description: formData.description || "",
    };

    try {
      setSaving(true);
      await createBuilding(payload);
      toast.success("Bino muvaffaqiyatli yaratildi!");
      navigate("/buildings");
    } catch (error) {
      const msg =
        error.response?.data?.code?.[0] ||
        error.response?.data?.detail ||
        error.response?.data?.padez_home?.[0] ||
        "Bino yaratishda xatolik yuz berdi";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const constructionStatusLabel = {
    new: "Yangi",
    started: "Qurilish boshlangan",
    finished: "Tugatildi",
  };

  return (
    <div className="bc-page">
      {/* ── Page Header ───────────────────────────────────── */}
      <div className="bc-header">
        <div className="bc-header-left">
          <div>
            <h1 className="bc-title">Yangi bino qo'shish</h1>
            <p className="bc-subtitle">Yangi ob'ekt ma'lumotlarini kiriting</p>
          </div>
        </div>
        <div className="bc-header-actions">
          <button
            className="bc-btn-secondary"
            onClick={() => navigate("/buildings")}
            disabled={saving}
          >
            Bekor qilish
          </button>
          <button
            className="bc-btn-primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <>
                <SpinnerIcon />
                Saqlanmoqda...
              </>
            ) : (
              <>
                <SaveIcon />
                Saqlash
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bc-content">
        {/* ── Section 1: Asosiy ma'lumotlar ────────────────── */}
        <div className="bc-card" style={{ animationDelay: "0s" }}>
          <div className="bc-card-header">
            <div className="bc-icon-box bc-icon-primary">
              <InfoIcon />
            </div>
            <div>
              <h3 className="bc-card-title">Asosiy ma'lumotlar</h3>
              <p className="bc-card-desc">
                Bino identifikatsiyasi va joylashuvi
              </p>
            </div>
          </div>

          <div className="bc-grid-3">
            {/* Shifr */}
            <div className="bc-field">
              <label className="bc-label bc-required">Bino shifri</label>
              <input
                className="bc-input bc-input-code"
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="Masalan: A1, B2"
                maxLength={6}
                autoFocus
              />
              <span className="bc-hint">Maksimum 6 ta belgi</span>
            </div>

            {/* Shahar */}
            <div className="bc-field">
              <label className="bc-label bc-required">Shahar</label>
              <select
                className="bc-select"
                name="city"
                value={formData.city}
                onChange={handleChange}
              >
                <option value="">Shaharni tanlang</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Bino nomi */}
            <div className="bc-field">
              <label className="bc-label bc-required">Bino nomi</label>
              <input
                className="bc-input"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Bino nomini kiriting"
              />
            </div>

            {/* Umumiy maydon */}
            <div className="bc-field">
              <label className="bc-label">Umumiy maydon</label>
              <div className="bc-input-suffix-wrap">
                <input
                  className="bc-input"
                  type="text"
                  name="total_area"
                  value={formData.total_area}
                  onChange={handleChange}
                  placeholder="0.00"
                />
                <span className="bc-suffix">m²</span>
              </div>
            </div>
          </div>

          {/* Joylashuv */}
          <div className="bc-field bc-field-full" style={{ marginTop: 20 }}>
            <label className="bc-label">Bino joylashuvi</label>
            <textarea
              className="bc-textarea"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Masalan: Chilonzor tumani, 12-kvartal, 23-uy"
              rows={2}
            />
          </div>
        </div>

        {/* ── Bottom two-column layout ──────────────────────── */}
        <div className="bc-two-col">
          {/* ── Section 2: Bino tuzilishi ─────────────────── */}
          <div
            className="bc-card bc-card-stretch"
            style={{ animationDelay: "0.08s" }}
          >
            <div className="bc-card-header">
              <div className="bc-icon-box bc-icon-success">
                <GridIcon />
              </div>
              <div>
                <h3 className="bc-card-title">Bino tuzilishi</h3>
                <p className="bc-card-desc">Qavat, padez va xonadon soni</p>
              </div>
            </div>

            <div className="bc-grid-3">
              {/* Qavatlar */}
              <div className="bc-field">
                <label className="bc-label bc-required">Qavatlar soni</label>
                <div className="bc-input-suffix-wrap">
                  <input
                    className="bc-input"
                    type="text"
                    name="floor"
                    value={formData.floor}
                    onChange={handleChange}
                    placeholder="0"
                  />
                  <span className="bc-suffix">qavat</span>
                </div>
              </div>

              {/* Padezlar */}
              <div className="bc-field">
                <label className="bc-label bc-required">Padezlar soni</label>
                <div className="bc-input-suffix-wrap">
                  <input
                    className="bc-input"
                    type="text"
                    name="padez"
                    value={formData.padez}
                    onChange={handleChange}
                    placeholder="0"
                  />
                  <span className="bc-suffix">padez</span>
                </div>
              </div>

              {/* Kiritish tugmasi */}
              <div className="bc-field bc-field-btn-align">
                <button
                  type="button"
                  className={`bc-btn-outline ${showPadezInputs ? "bc-btn-outline-done" : ""}`}
                  onClick={handleShowPadezInputs}
                  disabled={!formData.padez || padezCount < 1}
                >
                  {showPadezInputs ? <CheckIcon /> : <ListIcon />}
                  {showPadezInputs ? "Kiritildi" : "Xonalarni kiritish"}
                </button>
              </div>
            </div>

            {/* Padez xonadon inputlari */}
            {showPadezInputs && formData.padez_home.length > 0 && (
              <div className="bc-padez-section">
                <p className="bc-padez-label">
                  <ListIcon />
                  Har bir padezdagi xonadonlar soni:
                </p>
                <div className="bc-padez-grid">
                  {formData.padez_home.map((val, i) => (
                    <div key={i} className="bc-padez-item">
                      <label className="bc-padez-item-label">
                        {i + 1}-padez
                      </label>
                      <input
                        className="bc-padez-input"
                        type="text"
                        value={val || ""}
                        onChange={(e) =>
                          handlePadezHomeChange(i, e.target.value)
                        }
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live preview */}
            <div className="bc-structure-preview">
              <div className="bc-preview-item">
                <span className="bc-preview-icon bc-preview-floor">
                  <FloorIcon />
                </span>
                <div>
                  <span className="bc-preview-val">{floorCount || "—"}</span>
                  <span className="bc-preview-key">Qavat</span>
                </div>
              </div>
              <div className="bc-preview-divider" />
              <div className="bc-preview-item">
                <span className="bc-preview-icon bc-preview-padez">
                  <PadezIcon />
                </span>
                <div>
                  <span className="bc-preview-val">{padezCount || "—"}</span>
                  <span className="bc-preview-key">Padez</span>
                </div>
              </div>
              <div className="bc-preview-divider" />
              <div className="bc-preview-item">
                <span className="bc-preview-icon bc-preview-home">
                  <HomeIcon />
                </span>
                <div>
                  <span className="bc-preview-val">{totalHomes || "—"}</span>
                  <span className="bc-preview-key">Jami xonadon</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Section 3: Qurilish va Byudjet ────────────── */}
          <div
            className="bc-card bc-card-stretch"
            style={{ animationDelay: "0.14s" }}
          >
            <div className="bc-card-header">
              <div className="bc-icon-box bc-icon-warning">
                <WalletIcon />
              </div>
              <div>
                <h3 className="bc-card-title">Qurilish va Byudjet</h3>
                <p className="bc-card-desc">
                  Moliyaviy va qurilish ma'lumotlari
                </p>
              </div>
            </div>

            <div className="bc-grid-2">
              {/* Qurilish holati */}
              <div className="bc-field">
                <label className="bc-label">Qurilish holati</label>
                <div className="bc-status-group">
                  {["new", "started", "finished"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`bc-status-btn bc-status-${s} ${formData.construction_status === s ? "active" : ""}`}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          construction_status: s,
                        }))
                      }
                    >
                      <StatusDot status={s} />
                      {constructionStatusLabel[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Byudjet */}
              <div className="bc-field">
                <label className="bc-label">Ajratilgan byudjet</label>
                <div className="bc-input-suffix-wrap">
                  <input
                    className="bc-input"
                    type="text"
                    name="budget"
                    value={formatNumber(formData.budget)}
                    onChange={handleChange}
                    placeholder="0"
                  />
                  <span className="bc-suffix">so'm</span>
                </div>
                {formData.budget && (
                  <span className="bc-hint">
                    {formatNumber(formData.budget)} so'm
                  </span>
                )}
              </div>
            </div>

            <div className="bc-grid-2" style={{ marginTop: 16 }}>
              {/* Boshlangan sana */}
              <div className="bc-field">
                <label className="bc-label">Qurilish boshlangan sana</label>
                <input
                  className="bc-input"
                  type="date"
                  name="construction_start_date"
                  value={formData.construction_start_date}
                  onChange={handleChange}
                />
              </div>

              {/* Tugash sanasi */}
              <div className="bc-field">
                <label className="bc-label">Taxminiy tugash sanasi</label>
                <input
                  className="bc-input"
                  type="date"
                  name="construction_end_date"
                  value={formData.construction_end_date}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Tavsif */}
            <div className="bc-field bc-field-full" style={{ marginTop: 16 }}>
              <label className="bc-label">Bino tavsifi</label>
              <textarea
                className="bc-textarea"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Bino haqida qo'shimcha ma'lumotlar..."
                rows={3}
              />
            </div>

            {/* Mini summary */}
            {(formData.code || formData.name || selectedCity) && (
              <div className="bc-mini-summary">
                <p className="bc-mini-summary-title">Ko'rinish</p>
                <div className="bc-mini-summary-row">
                  <span>Shifr</span>
                  <strong>{formData.code || "—"}</strong>
                </div>
                <div className="bc-mini-summary-row">
                  <span>Nomi</span>
                  <strong>{formData.name || "—"}</strong>
                </div>
                <div className="bc-mini-summary-row">
                  <span>Shahar</span>
                  <strong>{selectedCity?.name || "—"}</strong>
                </div>
                <div className="bc-mini-summary-row">
                  <span>Holat</span>
                  <strong>
                    {constructionStatusLabel[formData.construction_status]}
                  </strong>
                </div>
                {formData.total_area && (
                  <div className="bc-mini-summary-row">
                    <span>Umumiy maydon</span>
                    <strong>{formData.total_area} m²</strong>
                  </div>
                )}
                {formData.budget && (
                  <div className="bc-mini-summary-row">
                    <span>Byudjet</span>
                    <strong>{formatNumber(formData.budget)} so'm</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom action bar ─────────────────────────────── */}
        <div className="bc-bottom-bar">
          <button
            className="bc-btn-secondary"
            onClick={() => navigate("/buildings")}
            disabled={saving}
          >
            Bekor qilish
          </button>
          <button
            className="bc-btn-primary bc-btn-lg"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? (
              <>
                <SpinnerIcon />
                Saqlanmoqda...
              </>
            ) : (
              <>
                <SaveIcon />
                Binoni saqlash
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Helper Components ──────────────────────────────────────── */
const StatusDot = ({ status }) => {
  const colors = { new: "#6366f1", started: "#f59e0b", finished: "#10b981" };
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: colors[status] || "#9ca3af",
        flexShrink: 0,
      }}
    />
  );
};

/* ── Icons ──────────────────────────────────────────────────── */
const ChevronLeftIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const SaveIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);
const SpinnerIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    className="bc-spin"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
const InfoIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <line x1="12" y1="8" x2="12" y2="8.01" />
    <line x1="12" y1="12" x2="12" y2="16" />
  </svg>
);
const GridIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
);
const WalletIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" />
    <path d="M17 12h4v4h-4a2 2 0 0 1 0-4z" />
  </svg>
);
const ListIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);
const CheckIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const FloorIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);
const PadezIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="12" y1="3" x2="12" y2="21" />
  </svg>
);
const HomeIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 12l9-9 9 9" />
    <path d="M5 10v10a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1V10" />
  </svg>
);

export default BuildingCreate;
