import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { contractService } from "../../services/contracts";
import usePageTitle from "../../hooks/usePageTitle";
import BuildingSelector from "./components/BuildingSelector";
import HomeSelector from "./components/HomeSelector";
import ClientForm from "./components/ClientForm";
import PaymentForm from "./components/PaymentForm";
import { ChevronLeftIcon, SaveIcon } from "./ContractIcons";
import "./ContractCreate.css";



const ContractCreate = () => {
  usePageTitle("Yangi shartnoma");
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  // Step Data
  const [buildingData, setBuildingData] = useState({
    cityId: "",
    buildingId: "",
    buildingName: "",
    buildingData: null,
  });

  const [selectedHome, setSelectedHome] = useState(null);

  const [clientData, setClientData] = useState({
    full_name: "",
    phone: "",
    phone2: "",
    passport_series: "",
    passport_date: "",
    passport_given: "",
    address: "",
    heard_from: "Xech qayerda",
  });

  const [paymentData, setPaymentData] = useState({
    price_per_meter: 0,
    term_months: "",
    payment_day: 15,
    total_price: 0,
    initial_payment: 0,
    status: "pending",
    monthly_payment: 0,
    contract_date: "",
    _hasErrors: false,
  });

  // Validation
  const validationErrors = useMemo(() => {
    const errors = {};

    // Client validation
    if (!clientData.full_name.trim()) {
      errors.full_name = "To'liq ism kiritilishi shart";
    }
    if (!clientData.phone || clientData.phone.length < 9) {
      errors.phone = "Telefon raqami 9 ta raqamdan iborat bo'lishi kerak";
    }
    if (!clientData.passport_series || clientData.passport_series.length < 10) {
      errors.passport_series = "Passport to'liq kiritilishi kerak (AA 1234567)";
    }
    if (!clientData.passport_date) {
      errors.passport_date = "Passport berilgan sana kiritilishi shart";
    }
    if (!clientData.passport_given || !clientData.passport_given.trim()) {
      errors.passport_given = "Passport bergan organ kiritilishi shart";
    }
    if (!clientData.address || !clientData.address.trim()) {
      errors.address = "Yashash manzili kiritilishi shart";
    }

    // Payment validation
    const termMonths = parseInt(paymentData.term_months) || 0;
    const total = paymentData.total_price;
    const initial = paymentData.initial_payment;

    if (initial < total) {
      if (termMonths < 1 || termMonths > 120) {
        errors.term_months =
          "To'lov muddati 1-120 oy oralig'ida bo'lishi kerak";
      }
    } else if (initial === total) {
      // Full payment - term months should be 0 ideally, but allow 0
      if (termMonths < 0 || termMonths > 120) {
        errors.term_months = "To'lov muddati noto'g'ri";
      }
    }

    return errors;
  }, [clientData, paymentData]);

  const canSubmit = useMemo(() => {
    return (
      selectedHome &&
      Object.keys(validationErrors).length === 0 &&
      !paymentData._hasErrors &&
      clientData.full_name.trim() &&
      clientData.phone.length >= 9 &&
      clientData.passport_series.length >= 10 &&
      clientData.passport_date &&
      clientData.address.trim() &&
      (paymentData.initial_payment >= paymentData.total_price ||
        (paymentData.term_months !== "" &&
          parseInt(paymentData.term_months) >= 1)) &&
      paymentData.initial_payment >= 0
    );
  }, [selectedHome, validationErrors, paymentData, clientData]);

  // Handlers
  const handleBuildingSelect = (data) => {
    setBuildingData(data);
    setSelectedHome(null);
  };

  const handleHomeSelect = (home) => {
    setSelectedHome(home);
    if (!home) {
      setPaymentData((prev) => ({
        ...prev,
        price_per_meter: 0,
        initial_payment: 0,
        _hasErrors: false,
      }));
      return;
    }
    setPaymentData((prev) => ({
      ...prev,
      price_per_meter: Math.floor(home.price),
      initial_payment: 0,
      _hasErrors: false,
    }));
  };

  const handleClientChange = (field, value) => {
    setClientData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePaymentChange = (field, value) => {
    setPaymentData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error("Iltimos, barcha maydonlarni to'g'ri to'ldiring");
      return;
    }

    const payload = {
      home_id: selectedHome.id,
      client: {
        full_name: clientData.full_name,
        phone: clientData.phone,
        phone2: clientData.phone2,
        passport_series: clientData.passport_series,
        passport_date: clientData.passport_date,
        passport_given: clientData.passport_given,
        address: clientData.address,
        heard_from: clientData.heard_from,
      },
      price_per_meter: paymentData.price_per_meter,
      total_price: paymentData.total_price,
      initial_payment: paymentData.initial_payment,
      term_months: parseInt(paymentData.term_months),
      payment_day: parseInt(paymentData.payment_day),
      monthly_payment: paymentData.monthly_payment,
      status: paymentData.status,
      contract_date: paymentData.contract_date || null,
      is_custom_distribution: paymentData.is_custom_distribution,
      custom_payments: paymentData.custom_payments,
    };



    try {
      setSaving(true);
      await contractService.create(payload);
      toast.success("Shartnoma muvaffaqiyatli yaratildi");
      navigate(`/contracts`);
    } catch (error) {
      console.error("Create error:", error);
      const msg = error.response?.data?.error || "Xatolik yuz berdi";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="contract-create-page">
      <div className="page-header">
        <div className="header-left">
          <div>
            <h1 className="page-title">Yangi shartnoma</h1>
            <p className="page-subtitle">Yangi shartnoma rasmiylashtirish</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={() => navigate("/contracts")}
          >
            Bekor qilish
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={saving || !canSubmit}
          >
            <SaveIcon />
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </div>

      <div className="create-content">
        {/* Step 1: Building */}
        <BuildingSelector
          selectedData={buildingData}
          onSelect={handleBuildingSelect}
        />

        {/* Step 2: Home (only if building selected) */}
        {buildingData.buildingId && (
          <HomeSelector
            buildingId={buildingData.buildingId}
            onSelect={handleHomeSelect}
            selectedHomeId={selectedHome?.id}
          />
        )}

        {/* Step 3 & 4 (only if home selected) */}
        {selectedHome && (
          <div className="details-grid">
            <ClientForm
              formData={clientData}
              onChange={handleClientChange}
              errors={validationErrors}
            />
            <PaymentForm
              formData={paymentData}
              homeData={selectedHome}
              onChange={handlePaymentChange}
              errors={validationErrors}
              isEditMode={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractCreate;
