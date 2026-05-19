import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { contractService } from "../../services/contracts";
import usePageTitle from "../../hooks/usePageTitle";
import BuildingSelector from "./components/BuildingSelector";
import HomeSelector from "./components/HomeSelector";
import ClientForm from "./components/ClientForm";
import PaymentForm from "./components/PaymentForm";
import ContractInfoForm from "./components/ContractInfoForm";
import { ChevronLeftIcon, SaveIcon } from "./ContractIcons";
import "./ContractCreate.css";

// Format YYYY-MM-DD to DD.MM.YYYY
const formatDateForDisplay = (dateStr) => {
  if (!dateStr) return "";
  try {
    // Handle if date comes as full ISO string or just date
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return dateStr || "";
  }
};

const ContractEdit = () => {
  const { id } = useParams();
  usePageTitle(`Shartnomani tahrirlash`);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [contract, setContract] = useState(null);

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
    _hasErrors: false,
  });

  const [contractNumber, setContractNumber] = useState("");
  const [numberValidation, setNumberValidation] = useState({
    loading: false,
    available: true,
    suggestion: null,
    message: null,
  });

  // Load Contract Data
  useEffect(() => {
    const fetchContract = async () => {
      try {
        setLoading(true);
        const response = await contractService.get(id);
        const data = response.data;
        setContract(data);

        // Populate Building Data
        if (data.home && data.home.building) {
          setBuildingData({
            cityId: String(data.home.building.city),
            buildingId: String(data.home.building.id),
            buildingName: data.home.building.name,
            buildingData: data.home.building,
          });
        }

        // Populate Home Data
        if (data.home) {
          setSelectedHome(data.home);
        }

        // Populate Client Data
        if (data.client) {
          setClientData({
            full_name: data.client.full_name || "",
            phone: data.client.phone || "",
            phone2: data.client.phone2 || "",
            passport_series: data.passport_series || "",
            passport_date: formatDateForDisplay(data.passport_given_date),
            passport_given: data.passport_given_by || "",
            address: data.address || "",
            heard_from: data.client.heard_source || "Xech qayerda",
          });
        }

        // Populate Payment Data
        if (data) {
          // Try to deduce price_per_meter if not explicit
          let ppm = 0;
          if (data.home.square_meter > 0) {
            ppm = Math.floor(data.total_price / data.home.square_meter);
          }

          setPaymentData({
            price_per_meter: ppm,
            total_price: data.total_price,
            term_months: data.term_months,
            payment_day: data.payment_day,
            initial_payment: data.initial_payment,
            status: data.status,
            monthly_payment: data.monthly_payment,
            is_custom_distribution: data.is_custom_distribution || false,
            custom_payments: data.custom_payments || [{ months: '', amount: '' }],
            _hasErrors: false,
          });
        }
      } catch (error) {
        console.error("Error loading contract:", error);
        toast.error("Shartnoma ma'lumotlarini yuklashda xatolik");
        navigate("/contracts");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchContract();
    }
  }, [id, navigate]);

  useEffect(() => {
    if (contract) {
      setContractNumber(contract.contract_number || "");
    }
  }, [contract]);

  // Real-time Number Validation
  useEffect(() => {
    if (!contractNumber || !buildingData.buildingId || !contract) return;

    // Skip if same as current
    if (contractNumber === contract.contract_number) {
      setNumberValidation({
        loading: false,
        available: true,
        suggestion: null,
        message: null,
      });
      return;
    }

    const timer = setTimeout(async () => {
      setNumberValidation((prev) => ({ ...prev, loading: true }));
      try {
        const response = await contractService.checkNumber({
          number: contractNumber,
          building_id: buildingData.buildingId,
          exclude_id: id,
        });
        setNumberValidation({
          loading: false,
          available: response.data.available,
          suggestion: response.data.suggestion,
          message: response.data.message,
        });
      } catch (error) {
        console.error("Number validation error:", error);
        setNumberValidation((prev) => ({ ...prev, loading: false }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [contractNumber, buildingData.buildingId, contract, id]);

  // Validation
  const validationErrors = useMemo(() => {
    const errors = {};

    // Client validation
    if (!clientData.full_name.trim())
      errors.full_name = "To'liq ism kiritilishi shart";
    if (!clientData.phone || clientData.phone.length < 9)
      errors.phone = "Telefon raqami 9 ta raqamdan iborat bo'lishi kerak";
    if (!clientData.passport_series || clientData.passport_series.length < 10)
      errors.passport_series = "Passport to'liq kiritilishi kerak (AA 1234567)";
    if (!clientData.passport_date)
      errors.passport_date = "Passport berilgan sana kiritilishi shart";
    if (!clientData.address || !clientData.address.trim())
      errors.address = "Yashash manzili kiritilishi shart";

    // Payment validation
    const termMonths = parseInt(paymentData.term_months) || 0;
    if (termMonths < 1 || termMonths > 120) {
      if (
        paymentData.status !== "cancelled" &&
        paymentData.status !== "completed"
      ) {
        errors.term_months =
          "To'lov muddati 1-120 oy oralig'ida bo'lishi kerak";
      }
    }

    return errors;
  }, [clientData, paymentData]);

  const canSubmit = useMemo(() => {
    return (
      selectedHome &&
      Object.keys(validationErrors).length === 0 &&
      !paymentData._hasErrors &&
      numberValidation.available &&
      clientData.full_name.trim() &&
      clientData.phone.length >= 9 &&
      clientData.passport_series.length >= 10 &&
      clientData.passport_date
    );
  }, [
    selectedHome,
    validationErrors,
    paymentData,
    clientData,
    numberValidation.available,
  ]);

  // Handlers
  const handleBuildingSelect = (data) => {
    setBuildingData(data);
    if (data.buildingId !== buildingData.buildingId) {
      setSelectedHome(null);
    }
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
    // Do NOT reset price/payment data automatically in Edit mode if it's the same home
    if (contract && home.id !== contract.home.id) {
      setPaymentData((prev) => ({
        ...prev,
        price_per_meter: Math.floor(home.price),
        initial_payment: 0,
        _hasErrors: false,
      }));
    }
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
      contract_number: contractNumber,
      is_custom_distribution: paymentData.is_custom_distribution,
      custom_payments: paymentData.custom_payments,
    };

    try {
      setSaving(true);
      await contractService.update(id, payload);
      toast.success("Shartnoma muvaffaqiyatli yangilandi");
      navigate(`/contracts`);
    } catch (error) {
      console.error("Update error:", error);
      const msg = error.response?.data?.error || "Xatolik yuz berdi";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div
          style={{
            padding: "20px",
            background: "#fff",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          Yuklanmoqda...
        </div>
      </div>
    );
  }

  return (
    <div className="contract-create-page">
      <div className="page-header">
        <div className="header-left">
          <div>
            <h1 className="page-title">Shartnomani tahrirlash</h1>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span
                style={{
                  fontWeight: "600",
                  color: "var(--primary-color)",
                  background: "var(--primary-color-alpha)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "13px",
                }}
              >
                #{contract?.contract_number}
              </span>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={() => navigate("/contracts")}
          >
            {contract?.status === "cancelled" ? "Orqaga" : "Bekor qilish"}
          </button>
          {contract?.status !== "cancelled" && (
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={saving || !canSubmit}
            >
              <SaveIcon />
              {saving ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          )}
        </div>
      </div>

      <div className="create-content">
        {/* Status Alert with Better Design */}
        <div
          className={`status-alert status-alert-${contract?.status || "pending"}`}
        >
          <div className="status-alert-content">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span className="status-alert-text">
              Joriy holat:{" "}
              <strong>
                {contract?.status === "pending"
                  ? "Rasmiylashtirilmoqda"
                  : contract?.status === "active"
                    ? "Rasmiylashtirilgan"
                    : contract?.status === "paid"
                      ? "To'liq to'langan"
                      : contract?.status === "cancelled"
                        ? "Bekor qilingan"
                        : "Tugallangan"}
              </strong>
            </span>
          </div>
          {contract?.status === "pending" && (
            <span className="status-alert-hint">
              Barcha ma'lumotlarni o'zgartirish mumkin
            </span>
          )}
          {contract?.status === "cancelled" && (
            <span
              className="status-alert-hint"
              style={{ color: "var(--error-color, #ef4444)" }}
            >
              ⚠️ Bu shartnoma bekor qilingan. O'zgartirib bo'lmaydi. Yangi
              shartnoma rasmiylashtiring.
            </span>
          )}
        </div>

        {/* Contract Info Section */}
        <ContractInfoForm
          contractNumber={contractNumber}
          onChange={setContractNumber}
          contractDate={contract?.created_at}
          validation={numberValidation}
        />

        {/* Step 1: Building */}
        <div>
          <BuildingSelector
            selectedData={buildingData}
            onSelect={handleBuildingSelect}
          />
        </div>

        {/* Step 2: Home */}
        {buildingData.buildingId && (
          <div>
            <HomeSelector
              buildingId={buildingData.buildingId}
              onSelect={handleHomeSelect}
              selectedHomeId={String(selectedHome?.id || "")}
              contractedHomeId={
                contract?.home?.id ? String(contract.home.id) : null
              }
            />
          </div>
        )}

        {/* Step 3 & 4 */}
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
              isEditMode={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractEdit;
