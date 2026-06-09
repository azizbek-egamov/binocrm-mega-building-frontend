"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { contractService } from "../../services/contracts";
import {
  ChevronLeftIcon,
  DollarSignIcon,
  CalendarIcon,
  DownloadIcon,
  SaveIcon,
  TrashIcon,
  CloseIcon,
  EditIcon,
  HistoryIcon,
} from "./ContractIcons";
import "./ContractSchedule.css";
import usePageTitle from "../../hooks/usePageTitle";
import PaymentHistoryModal from "./components/PaymentHistoryModal";
import PaymentModalForm from "./components/PaymentModalForm";
import CustomPaymentModal from "./components/CustomPaymentModal";
import GlobalTransactionModal from "./components/GlobalTransactionModal";
import AdminEditModal from "./components/AdminEditModal";

const ContractSchedule = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  usePageTitle("To'lovlar jadvali");

  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState(null);
  const [payments, setPayments] = useState([]);
  const [editablePayments, setEditablePayments] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  // UI States
  const [isEditMode, setIsEditMode] = useState(false);

  // Modals
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  const [paymentModal, setPaymentModal] = useState({
    open: false,
    payment: null,
  });
  const [paymentAmount, setPaymentAmount] = useState("");

  const [additionalModal, setAdditionalModal] = useState({
    open: false,
    payment: null,
  });
  const [additionalAmount, setAdditionalAmount] = useState("");

  const [adminEditModal, setAdminEditModal] = useState({
    open: false,
    payment: null,
    amount: "",
  });
  const [historyModal, setHistoryModal] = useState({
    open: false,
    payment: null,
  });
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  const loadData = async () => {
    try {
      const [contractRes, paymentsRes] = await Promise.all([
        contractService.get(id),
        contractService.getPayments(id),
      ]);
      setContract(contractRes.data);
      setPayments(Array.isArray(paymentsRes.data) ? paymentsRes.data : []);
      setEditablePayments(Array.isArray(paymentsRes.data) ? JSON.parse(JSON.stringify(paymentsRes.data)) : []);
    } catch (error) {
      toast.error("Ma'lumotlarni yuklashda xatolik");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Format price with spaces (1000000 → 1 000 000)
  const formatPrice = (price) => {
    return (
      new Intl.NumberFormat("uz-UZ").format(Math.round(price || 0)) + " so'm"
    );
  };

  // Format input value with spaces for display
  const formatInputPrice = (value) => {
    if (value === null || value === undefined || value === "") return "";
    const numValue =
      parseInt(String(value).replace(/\s/g, "").replace(/\D/g, "")) || 0;
    return new Intl.NumberFormat("uz-UZ").format(numValue);
  };

  // Parse formatted input back to number
  const parseInputPrice = (value) => {
    return parseInt(String(value).replace(/\s/g, "").replace(/\D/g, "")) || 0;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "---";
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
  };

  // --- SMART LOGIC ---

  // Maqsadli summa - qolgan qarz (0-oy bundan mustasno, bu boshlang'ich to'lov)
  const targetAmount = useMemo(() => {
    if (!contract || !Array.isArray(editablePayments)) return 0;
    // Oylik to'lovlar uchun maqsad = jami narx - boshlang'ich to'lov (0-oy)
    const initialPayment = editablePayments.find((p) => p.month_number === 0);
    const initialAmount = initialPayment
      ? parseFloat(initialPayment.amount || 0)
      : 0;
    return contract.total_price - initialAmount;
  }, [contract, editablePayments]);

  // Hozirgi jami (barcha oylik to'lovlar yig'indisi, 0-oysiz)
  const currentTotal = useMemo(() => {
    if (!Array.isArray(editablePayments)) return 0;
    return editablePayments
      .filter((p) => p.month_number > 0)
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  }, [editablePayments]);

  const calculateDifference = useMemo(() => {
    return targetAmount - currentTotal;
  }, [targetAmount, currentTotal]);

  const handleAmountChange = (paymentId, newValue) => {
    const ROUND_STEP = 1;
    const inputValue = parseFloat(newValue) || 0;
    const totalHousePrice = parseFloat(contract?.total_price || 0);

    // Deep clone to ensure React detects state changes
    if (!Array.isArray(editablePayments)) return;
    const updated = JSON.parse(JSON.stringify(editablePayments));
    const idx = updated.findIndex((p) => p.id === paymentId);
    if (idx === -1) return;

    const currentMonthNum = updated[idx].month_number;

    // 1. Joriy oydan OLDINGI barcha oylar summasini hisoblaymiz
    const sumBefore = updated
      .filter((p) => p.month_number < currentMonthNum)
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    // 2. Maksimal ruxsat etilgan summa
    const maxAllowed = Math.max(0, totalHousePrice - sumBefore);
    const val = Math.min(inputValue, maxAllowed);

    if (inputValue > maxAllowed && inputValue > 0) {
      toast.warning(
        `Maksimal summa: ${formatInputPrice(Math.round(maxAllowed))} so'm`,
      );
    }

    // 3. Joriy oyni yangilaymiz
    updated[idx].amount = val;
    updated[idx].remaining = val - parseFloat(updated[idx].amount_paid || 0);

    // 4. Keyingi oylarni topamiz
    const subsequentMonths = updated.filter(
      (p) => p.month_number > currentMonthNum,
    );

    // 5. Ularning ichidan to'lanmaganlarini (re-distributable) ajratamiz
    // parseFloat ishlatamiz chunki backenddan "0.00" kabi string kelishi mumkin
    const subsequentUnpaid = subsequentMonths.filter(
      (p) => parseFloat(p.amount_paid || 0) === 0,
    );

    // 6. Keyingi oylar ichida allaqachon to'langanlar bo'lsa, ularni summadan ayiramiz
    const paidSubsequentSum = subsequentMonths
      .filter((p) => parseFloat(p.amount_paid || 0) > 0)
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    // 7. Taqsimlanishi kerak bo'lgan qoldiq summa
    const remainingToDistribute = Math.max(
      0,
      totalHousePrice - sumBefore - val - paidSubsequentSum,
    );

    // 8. Taqsimlash jarayoni
    if (subsequentUnpaid.length > 0) {
      if (remainingToDistribute <= 0) {
        // Agar joriy oy barcha qarzni yopsa, keyinglar 0 bo'ladi
        subsequentUnpaid.forEach((p) => {
          const pIdx = updated.findIndex((up) => up.id === p.id);
          if (pIdx !== -1) {
            updated[pIdx].amount = 0;
            updated[pIdx].remaining = 0;
          }
        });
      } else {
        const rawMonthly = remainingToDistribute / subsequentUnpaid.length;
        const roundedMonthly = Math.floor(rawMonthly / ROUND_STEP) * ROUND_STEP;

        const monthsWithRounded = subsequentUnpaid.length - 1;
        const totalRounded = roundedMonthly * monthsWithRounded;
        const lastMonthAmount = remainingToDistribute - totalRounded;

        subsequentUnpaid.forEach((p, i) => {
          const pIdx = updated.findIndex((up) => up.id === p.id);
          if (pIdx !== -1) {
            if (i === subsequentUnpaid.length - 1) {
              updated[pIdx].amount = Math.max(0, Math.round(lastMonthAmount));
            } else {
              updated[pIdx].amount = Math.max(0, roundedMonthly);
            }
            updated[pIdx].remaining =
              updated[pIdx].amount - parseFloat(updated[pIdx].amount_paid || 0);
          }
        });
      }
    }

    setEditablePayments(updated);
  };

  // --- API ACTIONS ---

  const saveChanges = async () => {
    setProcessingId("saving");
    try {
      const changes = (Array.isArray(editablePayments) ? editablePayments : []).map((p) => ({
        id: p.id,
        amount: p.amount,
        due_date: p.due_date,
      }));
      await contractService.updateSchedule(id, { changes });
      toast.success("O'zgarishlar saqlandi");
      setIsEditMode(false);
      loadData();
    } catch {
      toast.error("Saqlashda xatolik");
    } finally {
      setProcessingId(null);
    }
  };

  // Oylik to'lov qilish
  const handleMakePayment = async () => {
    const amount = parseInputPrice(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error("To'lov summasi kiritilmadi");
      return;
    }

    const maxAmount = paymentModal.payment?.remaining || 0;
    if (amount > maxAmount) {
      toast.error(
        `To'lov miqdori qoldiqdan (${formatPrice(maxAmount)}) oshmasligi kerak`,
      );
      return;
    }

    setProcessingId(paymentModal.payment?.id);
    try {
      await contractService.makePayment(id, {
        amount: amount,
        payment_id: paymentModal.payment?.id,
      });
      toast.success("To'lov muvaffaqiyatli qabul qilindi");
      setPaymentModal({ open: false, payment: null });
      setPaymentAmount("");
      loadData();
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setProcessingId(null);
    }
  };

  // Ixtiyoriy (custom) to'lov
  const handleCustomPayment = async () => {
    const amount = parseInputPrice(customAmount);
    if (!amount || amount <= 0) {
      toast.error("To'lov summasi kiritilmadi");
      return;
    }

    if (amount > contract.remaining_balance) {
      toast.error(
        `To'lov miqdori qolgan qarzdan (${formatPrice(contract.remaining_balance)}) oshmasligi kerak`,
      );
      return;
    }

    setProcessingId("custom");
    try {
      await contractService.makePayment(id, { amount: amount });
      toast.success("To'lov muvaffaqiyatli taqsimlandi");
      setShowCustomModal(false);
      setCustomAmount("");
      loadData();
    } catch {
      toast.error("To'lovda xatolik");
    } finally {
      setProcessingId(null);
    }
  };

  // Qo'shimcha to'lov
  const handleAdditionalPayment = async () => {
    const amount = parseInputPrice(additionalAmount);
    if (!amount || amount <= 0) {
      toast.error("Qo'shimcha summa kiritilmadi");
      return;
    }

    const maxAmount = additionalModal.payment?.remaining || 0;
    if (amount > maxAmount) {
      toast.error(
        `Summa qolgan qarzdan (${formatPrice(maxAmount)}) oshmasligi kerak`,
      );
      return;
    }

    setProcessingId("additional");
    try {
      await contractService.makePayment(id, {
        amount: amount,
        payment_id: additionalModal.payment?.id,
      });
      toast.success("Qo'shimcha to'lov qabul qilindi");
      setAdditionalModal({ open: false, payment: null });
      setAdditionalAmount("");
      loadData();
    } catch {
      toast.error("Xatolik");
    } finally {
      setProcessingId(null);
    }
  };

  // Admin amallar
  const handleAdminAction = async (paymentId, action, amountPaid = 0) => {
    const confirmMsg =
      action === "reset"
        ? "Bu to'lovni bekor qilmoqchimisiz?"
        : "O'zgarishni saqlaysizmi?";
    if (!window.confirm(confirmMsg)) return;

    setProcessingId(paymentId);
    try {
      await contractService.adminAction(id, {
        payment_id: paymentId,
        action: action,
        amount_paid: parseInputPrice(amountPaid),
      });
      toast.success(
        action === "reset" ? "To'lov bekor qilindi" : "O'zgarish saqlandi",
      );
      setAdminEditModal({ open: false, payment: null, amount: "" });
      loadData();
    } catch {
      toast.error("Xatolik");
    } finally {
      setProcessingId(null);
    }
  };

  // PDF yuklab olish
  const handleDownloadPdf = async () => {
    try {
      setProcessingId("pdf");
      toast.loading("PDF yaratilmoqda...", { id: "pdf-loading" });

      const response = await contractService.downloadPdf(id);
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");

      toast.dismiss("pdf-loading");
      toast.success("PDF tayyor!");
    } catch (error) {
      toast.dismiss("pdf-loading");
      toast.error("PDF yaratishda xatolik");
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  // To'lov jadvali PDF
  const handleSchedulePdf = async () => {
    try {
      setProcessingId("schedule-pdf");
      toast.loading("Jadval PDF yaratilmoqda...", { id: "schedule-pdf-loading" });

      const response = await contractService.downloadSchedulePdf(id);
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");

      toast.dismiss("schedule-pdf-loading");
      toast.success("Jadval PDF tayyor!");
    } catch (error) {
      toast.dismiss("schedule-pdf-loading");
      toast.error("Jadval PDF yaratishda xatolik");
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  // To'lov grafigi (rasmiy format)
  const handleGrafikPdf = async () => {
    try {
      setProcessingId("grafik-pdf");
      toast.loading("To'lov grafigi yaratilmoqda...", { id: "grafik-pdf-loading" });

      const response = await contractService.downloadGrafikPdf(id);
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");

      toast.dismiss("grafik-pdf-loading");
      toast.success("To'lov grafigi tayyor!");
    } catch (error) {
      toast.dismiss("grafik-pdf-loading");
      toast.error("To'lov grafigi yaratishda xatolik");
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  const activePayments = useMemo(() => {
    const list = isEditMode ? editablePayments : payments;
    return Array.isArray(list) ? list : [];
  }, [isEditMode, editablePayments, payments]);

  if (loading)
    return (
      <div className="contract-schedule-page loading-state">Yuklanmoqda...</div>
    );

  const totalPaid = contract.total_price - contract.remaining_balance;

  return (
    <div className="contract-schedule-page">
      {/* Header */}
      <div className="schedule-header">
        <div className="header-left">
          <div className="header-title">
            <div className="title-with-badge">
              <h1>Shartnoma #{contract.contract_number}</h1>
              {contract.status === "active" && (
                <span className="contract-status-badge status-active">
                  Rasmiylashtirilgan
                </span>
              )}
              {contract.status === "paid" && (
                <span className="contract-status-badge status-paid">
                  To'liq to'langan
                </span>
              )}
              {contract.status === "completed" && (
                <span className="contract-status-badge status-completed">
                  Tugallangan
                </span>
              )}
              {contract.status === "cancelled" && (
                <span className="contract-status-badge status-cancelled">
                  Bekor qilingan
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="header-actions">
          <div className="title-with-badge">
            <p className="contract-status-badge status-completed">
              {contract.client_name} - {contract.building_name},{" "}
              {contract.home_number}-uy
            </p>
          </div>
          {contract.status === "cancelled" ? (
            <>
              <span
                style={{
                  color: "var(--error-color, #ef4444)",
                  fontSize: "13px",
                  fontWeight: "500",
                  padding: "8px 12px",
                  background: "rgba(239, 68, 68, 0.1)",
                  borderRadius: "8px",
                }}
              >
                ⚠️ Bu shartnoma bekor qilingan
              </span>
              <button
                className="btn-primary"
                onClick={handleDownloadPdf}
                disabled={processingId === "pdf"}
              >
                <DownloadIcon width="16" height="16" />
                {processingId === "pdf"
                  ? "Yuklanmoqda..."
                  : "Shartnomani yuklab olish"}
              </button>
            </>
          ) : !isEditMode ? (
            <>
              <button
                className="btn-primary"
                onClick={handleDownloadPdf}
                disabled={processingId === "pdf"}
              >
                <DownloadIcon width="16" height="16" />
                {processingId === "pdf"
                  ? "Yuklanmoqda..."
                  : "Shartnomani yuklab olish"}
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowCustomModal(true)}
              >
                <DollarSignIcon width="16" height="16" /> Ixtiyoriy to'lov
              </button>
              <button
                className="btn-history"
                onClick={() => setShowTransactionModal(true)}
              >
                <HistoryIcon width="16" height="16" /> To'lovlar tarixi
              </button>
              <button
                className="btn-warning"
                onClick={() => setIsEditMode(true)}
              >
                <EditIcon width="16" height="16" /> Tahrirlash rejimi
              </button>
            </>
          ) : (
            <>
              <button
                className="btn-outline-danger"
                onClick={() => {
                  setIsEditMode(false);
                  loadData();
                }}
              >
                <CloseIcon width="16" height="16" /> Bekor qilish
              </button>
              <button
                className="btn-success"
                onClick={saveChanges}
                disabled={processingId === "saving"}
              >
                <SaveIcon width="16" height="16" />{" "}
                {processingId === "saving"
                  ? "Saqlanmoqda..."
                  : "Barchasini saqlash"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="schedule-stats">
        <div className="stat-card">
          <div className="stat-icon primary">
            <DollarSignIcon />
          </div>
          <div className="stat-info">
            <span className="value">{formatPrice(contract.total_price)}</span>
            <span className="label">Xonadon narxi</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">
            <DollarSignIcon />
          </div>
          <div className="stat-info">
            <span className="value">{formatPrice(totalPaid)}</span>
            <span className="label">To'langan</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon danger">
            <DollarSignIcon />
          </div>
          <div className="stat-info">
            <span className="value">
              {formatPrice(contract.remaining_balance)}
            </span>
            <span className="label">Qolgan qarz</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">
            <CalendarIcon />
          </div>
          <div className="stat-info">
            <span className="value">Oyning {contract.payment_day}-kuni</span>
            <span className="label">To'lov sanasi</span>
          </div>
        </div>
      </div>

      {/* Edit Mode Controls */}
      {isEditMode && (
        <div className="edit-controls-card">
          <div className="control-row">
            <div className="control-group">
              <label>Maqsadli summa:</label>
              <div className="readonly-value">{formatPrice(targetAmount)}</div>
              <small className="hint-text">
                Xonadon narxi - Boshlang'ich to'lov
              </small>
            </div>
            <div className="control-group">
              <label>Hozirgi jami:</label>
              <div className="readonly-value">{formatPrice(currentTotal)}</div>
              <small className="hint-text">
                Barcha oylik to'lovlar yig'indisi
              </small>
            </div>
            <div className="control-group">
              <label>Farq:</label>
              <div
                className={`diff-badge ${calculateDifference === 0 ? "balanced" : "unbalanced"}`}
              >
                {formatPrice(calculateDifference)}
              </div>
              <small className="hint-text">Maqsadli summa - Hozirgi jami</small>
            </div>
          </div>

          <div className="control-row goal-badge">
            <div
              className={`goal-indicator ${calculateDifference === 0 ? "success" : "warning"}`}
            >
              {calculateDifference === 0 ? (
                <>
                  <span className="icon">✓</span> Maqsad: Farq 0 so'm bo'ldi!
                </>
              ) : (
                <>
                  <span className="icon">⚠</span> Maqsad: Farq 0 so'm bo'lishi
                  kerak
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Payment Schedule Table */}
      <div className="schedule-table-container">
        <div className="table-header">
          <h2>To'lovlar jadvali</h2>
          <div className="table-actions">
            <button
              className="btn-outline-primary"
              onClick={handleSchedulePdf}
              disabled={processingId === "schedule-pdf"}
            >
              <DownloadIcon width="14" height="14" />
              {processingId === "schedule-pdf" ? "Yuklanmoqda..." : "Jadvalni yuklab olish"}
            </button>
            <button
              className="btn-outline-primary"
              onClick={handleGrafikPdf}
              disabled={processingId === "grafik-pdf"}
            >
              <DownloadIcon width="14" height="14" />
              {processingId === "grafik-pdf" ? "Yuklanmoqda..." : "To'lov grafigi"}
            </button>
            <button
              className="btn-outline-primary"
              onClick={() => setShowCustomModal(true)}
            >
              <DollarSignIcon width="14" height="14" /> Ixtiyoriy to'lov
            </button>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="schedule-table">
            <thead>
              <tr>
                <th>Oy</th>
                <th>To'lov miqdori</th>
                <th>To'langan</th>
                <th>Qoldiq</th>
                <th>Sana</th>
                <th>Holat</th>
                <th>Harakat</th>
              </tr>
            </thead>
            <tbody>
              {activePayments.map((p) => (
                <tr
                  key={p.id}
                  className={
                    p.amount_paid > 0 && p.remaining <= 0 ? "row-paid" : ""
                  }
                >
                  <td
                    className={`month-cell ${p.month_number === 0 ? "initial" : ""} clickable-month`}
                    onClick={() =>
                      !isEditMode && setHistoryModal({ open: true, payment: p })
                    }
                    title={!isEditMode ? "To'lov tarixini ko'rish" : ""}
                  >
                    {p.month_number === 0 ? (
                      <span className="month-badge initial">Boshlang'ich</span>
                    ) : (
                      <span className="month-badge">{p.month_number}-oy</span>
                    )}
                  </td>
                  <td>
                    {isEditMode ? (
                      <div className="amount-cell-wrapper">
                        <div className="input-group-inline">
                          <input
                            className={`amount-input ${p.amount_paid > 0 ? "readonly" : ""}`}
                            type="text"
                            value={formatInputPrice(p.amount)}
                            onChange={(e) =>
                              handleAmountChange(
                                p.id,
                                parseInputPrice(e.target.value),
                              )
                            }
                            disabled={p.amount_paid > 0}
                            readOnly={p.amount_paid > 0}
                          />
                          <button
                            className={`btn-edit-inline ${p.amount_paid > 0 ? "disabled" : ""}`}
                            disabled={p.amount_paid > 0}
                            title={
                              p.amount_paid > 0
                                ? "To'langan oyni o'zgartirib bo'lmaydi"
                                : "Tahrirlash"
                            }
                          >
                            <EditIcon width="14" height="14" />
                          </button>
                        </div>
                        <small
                          className={`amount-hint ${p.amount_paid > 0 ? "protected" : ""}`}
                        >
                          {p.amount_paid > 0 ? (
                            <>✓ To'langan oy himoyalangan</>
                          ) : p.month_number === 0 ? (
                            <>
                              ★ Boshlang'ich to'lov - barcha oylarni ta'sir
                              qiladi
                            </>
                          ) : (
                            <>→ Faqat keyingi oylarni ta'sir qiladi</>
                          )}
                        </small>
                      </div>
                    ) : (
                      <span
                        className={
                          p.amount_paid > 0 && p.remaining <= 0
                            ? "text-success"
                            : ""
                        }
                      >
                        {formatPrice(p.amount)}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="paid-amount-wrapper">
                      <span>{formatPrice(p.amount_paid)}</span>
                      {!isEditMode && p.amount_paid > 0 && (
                        <div className="admin-actions">
                          <button
                            className="btn-small-icon edit"
                            title="To'lovni tahrirlash"
                            onClick={() =>
                              setAdminEditModal({
                                open: true,
                                payment: p,
                                amount: formatInputPrice(p.amount_paid),
                              })
                            }
                          >
                            <EditIcon width="12" />
                          </button>
                          <button
                            className="btn-small-icon danger"
                            title="To'lovni bekor qilish"
                            onClick={() => handleAdminAction(p.id, "reset")}
                            disabled={processingId === p.id}
                          >
                            <TrashIcon width="12" />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td
                    className={p.remaining > 0 ? "text-danger" : "text-success"}
                  >
                    {formatPrice(p.remaining)}
                  </td>
                  <td>
                    {isEditMode ? (
                      <input
                        type="date"
                        className="date-input"
                        value={p.due_date}
                        onChange={(e) => {
                          const updated = [...editablePayments];
                          const idx = updated.findIndex((up) => up.id === p.id);
                          updated[idx].due_date = e.target.value;
                          setEditablePayments(updated);
                        }}
                      />
                    ) : (
                      formatDate(p.due_date)
                    )}
                  </td>
                  <td>
                    {p.remaining <= 0 && p.amount > 0 ? (
                      <span className="status-paid">To'langan</span>
                    ) : p.amount_paid > 0 ? (
                      <span className="status-partial">Qisman</span>
                    ) : (
                      <span className="status-waiting">Kutilmoqda</span>
                    )}
                  </td>
                  <td>
                    {!isEditMode ? (
                      <div className="action-buttons">
                        <button
                          className="btn-history-round"
                          title="Tarix"
                          onClick={() =>
                            setHistoryModal({ open: true, payment: p })
                          }
                        >
                          <HistoryIcon width="14" height="14" />
                        </button>
                        {p.remaining > 0 ? (
                          <>
                            <button
                              className="btn-pay"
                              onClick={() => {
                                setPaymentModal({ open: true, payment: p });
                                setPaymentAmount(formatInputPrice(p.remaining));
                              }}
                              disabled={processingId === p.id}
                            >
                              To'lov
                            </button>
                            {p.amount_paid > 0 && (
                              <button
                                className="btn-add"
                                onClick={() => {
                                  setAdditionalModal({
                                    open: true,
                                    payment: p,
                                  });
                                  setAdditionalAmount("");
                                }}
                                title="Qo'shimcha to'lov"
                              >
                                +
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="check-icon">✓</span>
                        )}
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============ MODALS ============ */}

      {/* Oylik To'lov Modal */}
      <PaymentModalForm
        isOpen={paymentModal.open}
        onClose={() => setPaymentModal({ open: false, payment: null })}
        payment={paymentModal.payment}
        amount={paymentAmount}
        onAmountChange={(e) =>
          setPaymentAmount(formatInputPrice(e.target.value))
        }
        onSubmit={handleMakePayment}
        isLoading={processingId === paymentModal.payment?.id}
        formatPrice={formatPrice}
        title={
          paymentModal.payment?.month_number === 0
            ? "Boshlang'ich to'lov"
            : `${paymentModal.payment?.month_number}-oy uchun to'lov`
        }
      />

      {/* Ixtiyoriy To'lov Modal */}
      <CustomPaymentModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        remainingBalance={contract?.remaining_balance}
        amount={customAmount}
        onAmountChange={(e) =>
          setCustomAmount(formatInputPrice(e.target.value))
        }
        onSubmit={handleCustomPayment}
        isLoading={processingId === "custom"}
        formatPrice={formatPrice}
      />

      {/* Qo'shimcha To'lov Modal */}
      <PaymentModalForm
        isOpen={additionalModal.open}
        onClose={() => setAdditionalModal({ open: false, payment: null })}
        payment={additionalModal.payment}
        amount={additionalAmount}
        onAmountChange={(e) =>
          setAdditionalAmount(formatInputPrice(e.target.value))
        }
        onSubmit={handleAdditionalPayment}
        isLoading={processingId === "additional"}
        formatPrice={formatPrice}
        title={
          additionalModal.payment
            ? `Qo'shimcha to'lov (${additionalModal.payment?.month_number}-oy)`
            : "Qo'shimcha to'lov"
        }
      />

      {/* Admin Edit Modal */}
      <AdminEditModal
        isOpen={adminEditModal.open}
        onClose={() =>
          setAdminEditModal({ open: false, payment: null, amount: "" })
        }
        payment={adminEditModal.payment}
        amount={adminEditModal.amount}
        onAmountChange={(e) =>
          setAdminEditModal({
            ...adminEditModal,
            amount: formatInputPrice(e.target.value),
          })
        }
        onSubmit={() =>
          handleAdminAction(
            adminEditModal.payment?.id,
            "edit",
            adminEditModal.amount,
          )
        }
        onReset={() => handleAdminAction(adminEditModal.payment?.id, "reset")}
        isLoading={processingId === adminEditModal.payment?.id}
        formatPrice={formatPrice}
      />

      {/* Payment History Modal */}
      <PaymentHistoryModal
        isOpen={historyModal.open}
        onClose={() => setHistoryModal({ open: false, payment: null })}
        payment={historyModal.payment}
        formatPrice={formatPrice}
      />

      {/* Global Transactions History Modal */}
      <GlobalTransactionModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        contractId={id}
        formatPrice={formatPrice}
      />
    </div>
  );
};

export default ContractSchedule;
