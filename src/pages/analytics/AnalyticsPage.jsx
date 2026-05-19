import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  MapPin,
  Building,
  Filter,
  Phone,
  UserCheck,
  User,
  Target,
  Info,
  X,
} from "lucide-react";
import {
  AmBarChart,
  AmAreaChart,
  AmPieChart,
  AmComposedChart,
} from "../../components/AmCharts";
import { analyticsService } from "../../services/analytics";
import { getAllCities } from "../../services/cities";
import { getAllBuildings } from "../../services/buildings";
import { leadService } from "../../services/leads";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import FunnelChart from "../../components/FunnelChart";
import {
  OperatorFunnel,
  useThemeColors,
} from "../../components/OperatorFunnelChart";
import "./Analytics.css";
import AnalyticsFilterDrawer from "./components/AnalyticsFilterDrawer";
import FinanceDashboard from "./components/FinanceDashboard";

// Premium Chart Colors
const COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#8b5cf6",
  "#ec4899",
  "#f472b6",
];

const STATUS_LABELS = {
  pending: "Rasmiylashtirilmoqda",
  active: "Rasmiylashtirilgan",
  paid: "To'liq to'langan",
  completed: "Tugallangan",
  cancelled: "Bekor qilingan",
  answered: "Javob berildi",
  not_answered: "Javob berilmadi",
  client_answered: "Mijoz javob berdi",
  client_not_answered: "Mijoz javob bermadi",
};

const CHART_INFO = {
  contract_funnel: {
    title: "Sotuv voronkasi",
    desc: "Mijozning bitimni imzolagunigacha bo'lgan barcha bosqichlardagi o'tishi. Bu yerda asosiy e'tibor bitimlar soniga qaratiladi."
  },
  sales_dynamics: {
    title: "Sotuvlar dinamikasi",
    desc: "Kunlik tuzilgan shartnomalar soni va ulardan kelgan real tushum ko'rsatkichi. Bitimlar soni va daromad o'rtasidagi balansni ko'rsatadi."
  },
  contract_status: {
    title: "Shartnoma holati",
    desc: "Barcha shartnomalarning joriy bitim holati bo'yicha taqsimoti (aktiv, to'langan, bekor qilingan)."
  },
  debt_status: {
    title: "Qarzdorlik holati",
    desc: "Loyihaning moliyaviy salomatligi. Yig'ilgan mablag' va mijozlar tomonidan hali to'lanishi kerak bo'lgan qoldiq balans."
  },
  building_sales: {
    title: "Binolar bo'yicha sotuv",
    desc: "Har bir bino kesimidagi sotilgan va sotuvda mavjud xonadonlar ulushi."
  },
  lead_pipeline: {
    title: "Lead Pipeline",
    desc: "Leadlarning bosqichma-bosqich harakati. Qaysi bosqichda ko'p lead to'planib qolayotganini aniqlash imkonini beradi."
  },
  daily_trend: {
    title: "Kunlik trend",
    desc: "Tizimga har kuni kelib tushayotgan yangi leadlar soni."
  },
  monthly_trend: {
    title: "Oylik tahlil",
    desc: "Loyiha bo'yicha oylik o'sish dinamikasi."
  },
  operator_scorecard: {
    title: "Operator Scorecard",
    desc: "Har bir operatorning batafsil ish unumdorligi: leadlar soni, qo'ng'iroq sifati va konversiya foizi."
  },
  conversion_rating: {
    title: "Konversiya reytingi",
    desc: "Operatorlarning bitim yopish mahorati reytingi. Kim eng samarali ishlashini ko'rsatadi."
  },
  city_rev: {
    title: "Shaharlar bo'yicha daromad",
    desc: "Sotuvlarning geografik taqsimoti. Qaysi hududlardan eng ko'p tushum kelayotganini tahlil qilish imkonini beradi."
  },
  building_rev: {
    title: "Binolar bo'yicha daromad",
    desc: "Har bir bino kesimidagi moliyaviy samaradorlik. Qaysi loyiha kutilganidan tezroq o'zini oqlayotganini ko'rsatadi."
  },
  op_funnel: {
    title: "Operator voronkasi",
    desc: "Tanlangan operatorning leadlar bilan ishlash jarayoni. Har bir bosqichdagi samaradorlikni alohida ko'rish mumkin."
  },
  lead_sources: {
    title: "Lead manbalari",
    desc: "Mijozlar bizni qayerdan topishmoqda (Instagram, Telegram, Sayt va h.k.). Reklama kanallari samaradorligini o'lchash uchun xizmat qiladi."
  },
  form_stats: {
    title: "Forma tahlili",
    desc: "Saytdagi qaysi so'rovnomalar eng ko'p lead olib kelayotganini ko'rsatadi."
  },
  call_status: {
    title: "Qo'ng'iroq natijalari",
    desc: "Operatorlar tomonidan amalga oshirilgan qo'ng'iroqlar holati (ulandi, band, javob bermadi)."
  },
  stage_dist: {
    title: "Bosqichlar taqsimoti",
    desc: "Hozirgi vaqtda leadlarning qaysi bosqichlarda to'planib turganini ko'rsatuvchi umumiy ko'rinish."
  }
};

const ChartWrapper = React.memo(({ id, children, title, number, wide, infoVisible, toggleInfo }) => (
  <div className={`chart-card ${wide ? 'wide' : ''} ${infoVisible ? 'show-info' : ''}`}>
    <div className="chart-card-header">
      <div className="header-text">
        <span className="chart-number">{number}</span>
        <h4>{title}</h4>
      </div>
      <button 
        className="info-toggle-btn" 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleInfo(id);
        }}
      >
        {infoVisible ? <X size={16} /> : <Info size={16} />}
      </button>
    </div>
    <div className="chart-body-container">
      <div className="chart-body">{children}</div>
      {infoVisible && (
        <div className="chart-info-overlay">
          <div className="info-content">
            <Info size={40} className="info-icon-large" />
            <h5>{CHART_INFO[id]?.title || title}</h5>
            <p>{CHART_INFO[id]?.desc || "Ma'lumot topilmadi."}</p>
            <button className="close-info-btn" onClick={() => toggleInfo(id)}>Yopish</button>
          </div>
        </div>
      )}
    </div>
  </div>
));

const AnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState("sales");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const themeColors = useThemeColors();
  const { user } = useAuth();

  // Rol tekshiruvi: admin yoki foydalanuvchilar bo'limiga kirish huquqi bor
  const isAdmin = user?.is_superuser || user?.permissions?.can_view_users;

  // Finance bo'limini faqat superuser ko'ra oladi
  const canViewFinance = user?.is_superuser;

  // Sales filters
  const [salesFilters, setSalesFilters] = useState({
    start_date: "",
    end_date: "",
    city: "",
    building: "",
    status: "",
  });

  // Leads filters
  const [leadsFilters, setLeadsFilters] = useState({
    start_date: "",
    end_date: "",
    operator: "",
    stage: "",
    call_status: "",
    include_archived: false,
  });

  // Finance filters
  const [financeFilters, setFinanceFilters] = useState({
    start_date: "",
    end_date: "",
    city: "",
    building: "",
  });

  const [cities, setCities] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [stages, setStages] = useState([]);
  const [operators, setOperators] = useState([]);

  useEffect(() => {
    loadFilterData();
  }, []);

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadFilterData = async () => {
    try {
      const [citiesRes, buildingsRes, stagesRes] = await Promise.all([
        getAllCities(),
        getAllBuildings(),
        leadService.getStages().catch(() => []),
      ]);
      setCities(citiesRes?.data?.results || citiesRes?.data || (Array.isArray(citiesRes) ? citiesRes : []));
      setBuildings(buildingsRes?.data?.results || buildingsRes?.data || (Array.isArray(buildingsRes) ? buildingsRes : []));
      const stagesData = stagesRes?.data?.results || stagesRes?.data || [];
      setStages(Array.isArray(stagesData) ? stagesData : []);
    } catch (error) {
      console.error("Filtrlarni yuklashda xatolik:", error);
      setCities([]);
      setBuildings([]);
      setStages([]);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      if (activeTab === "sales") {
        const res = await analyticsService.getContractsStats(salesFilters);
        setStats(res.data);
      } else if (activeTab === "leads") {
        const res = await analyticsService.getLeadsStats(leadsFilters);
        setStats(res.data);
        if (res.data?.leads_by_operator) {
          setOperators(
            res.data.leads_by_operator
              .map((o) => ({ id: o.operator_id, name: o.operator_name }))
              .filter((o) => o.id),
          );
        }
      } else if (activeTab === "finance") {
        const res = await analyticsService.getFinanceStats(financeFilters);
        setStats(res.data);
      }
    } catch (error) {
      toast.error("Statistikalarni yuklashda xatolik yuz berdi");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Format large numbers for KPI cards
  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1e9) return (num / 1e9).toFixed(1) + " mlrd";
    if (num >= 1e6) return (num / 1e6).toFixed(1) + " mln";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + " ming";
    return num.toLocaleString();
  };

  // ============== HORIZONTAL BAR COMPONENT ==============
  const HorizontalBar = ({ data, nameField = "name", valueField = "count", color = "#6366f1", maxItems = 8 }) => {
    const items = (data || []).slice(0, maxItems);
    if (items.length === 0) return <div className="no-data-mini">Ma'lumot yo'q</div>;
    const maxVal = Math.max(...items.map(d => d[valueField] || 0), 1);
    
    return (
      <div className="h-bar-list">
        {items.map((item, i) => {
          const val = item[valueField] || 0;
          const pct = Math.round((val / maxVal) * 100);
          return (
            <div key={i} className="h-bar-item">
              <div className="h-bar-label">
                <span className="h-bar-name">{item[nameField] || '—'}</span>
                <span className="h-bar-value" style={{ color }}>{val}</span>
              </div>
              <div className="h-bar-track">
                <div
                  className="h-bar-fill"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${color}, ${color}88)`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

// ============== SALES DASHBOARD COMPONENT ==============
const SalesDashboard = React.memo(({ stats, formatNumber, STATUS_LABELS }) => {
  const [visibleInfos, setVisibleInfos] = useState({});
  const toggleInfo = React.useCallback((id) => {
    setVisibleInfos(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  if (!stats) return null;
  const kpi = stats.kpi || {};
  const debtStats = stats.debt_stats || {};

  return (
    <div className="analytics-dashboard">
      {/* ═══ 1-QATOR: KPI CARDS ═══ */}
      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#6366f1" }}><Building size={22} /></div>
          <div className="kpi-info">
            <span className="kpi-value">{kpi.total_sold_homes || 0}</span>
            <span className="kpi-label">Jami sotilgan uylar</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}><DollarSign size={22} /></div>
          <div className="kpi-info">
            <span className="kpi-value">{formatNumber(debtStats.total_collected)}</span>
            <span className="kpi-label">Yig'ilgan mablag'</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}><TrendingUp size={22} /></div>
          <div className="kpi-info">
            <span className="kpi-value">{kpi.active_contracts || 0}</span>
            <span className="kpi-label">Faol shartnomalar</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}><Users size={22} /></div>
          <div className="kpi-info">
            <span className="kpi-value">{kpi.debtors_count || 0}</span>
            <span className="kpi-label">Qarzdor mijozlar</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6" }}><Calendar size={22} /></div>
          <div className="kpi-info">
            <span className="kpi-value">{kpi.total_contracts || 0}</span>
            <span className="kpi-label">Jami shartnomalar</span>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        {/* ═══ 2A: SOTUV VORONKASI ═══ */}
        {stats.contract_funnel && stats.contract_funnel.some(d => d.count > 0) && (
          <ChartWrapper 
            id="contract_funnel" 
            number="1" 
            title="Shartnomalar bosqichlari"
            infoVisible={visibleInfos.contract_funnel}
            toggleInfo={toggleInfo}
          >
            <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
              <FunnelChart
                items={stats.contract_funnel.filter(d => d.count > 0).map((d) => ({
                  name: d.name,
                  count: d.count,
                  color: d.color,
                }))}
                height={280}
              />
            </div>
          </ChartWrapper>
        )}

        {/* ═══ 2B: BIRLASHTIRILGAN TREND ═══ */}
        <ChartWrapper 
          id="sales_dynamics" 
          number="2" 
          title="Kunlik shartnomalar va daromad trendi"
          infoVisible={visibleInfos.sales_dynamics}
          toggleInfo={toggleInfo}
        >
          <AmComposedChart
            data={(() => {
              const revMap = {};
              (stats.revenue_over_time || []).forEach(r => {
                const key = r.date ? String(r.date).split('T')[0] : r.date;
                revMap[key] = r.revenue || 0;
              });
              return (stats.daily_contracts || []).map(d => {
                const key = d.date ? String(d.date).split('T')[0] : d.date;
                return {
                  date: key,
                  count: d.count || 0,
                  revenue: revMap[key] || 0,
                };
              });
            })()}
            xField="date"
            barFields={[
              { field: "count", name: "Shartnomalar", color: "#6366f1" },
            ]}
            lineField={{ field: "revenue", name: "Daromad (so'm)", color: "#10b981" }}
            lineYAxisFormat="#,###"
            height={280}
          />
        </ChartWrapper>

        {/* ═══ 3A: SHARTNOMA HOLATI ═══ */}
        <ChartWrapper 
          id="contract_status" 
          number="3" 
          title="Shartnomalar holati bo'yicha"
          infoVisible={visibleInfos.contract_status}
          toggleInfo={toggleInfo}
        >
          <AmPieChart
            data={(stats.status_distribution || [])
              .filter(d => (d.count || 0) > 0)
              .map((d) => ({
                name: STATUS_LABELS[d.status] || d.status || "Noma'lum",
                value: d.count,
              }))}
            nameField="name"
            valueField="value"
            height={250}
            innerRadius={55}
          />
        </ChartWrapper>

        {/* ═══ 3B: QARZDORLIK GAUGE ═══ */}
        <ChartWrapper 
          id="debt_status" 
          number="4" 
          title="To'lov holati"
          infoVisible={visibleInfos.debt_status}
          toggleInfo={toggleInfo}
        >
          <div className="debt-gauge-section">
            <div className="gauge-container">
              <div className="gauge-ring">
                <svg viewBox="0 0 120 120" className="gauge-svg">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border-color)" strokeWidth="10" strokeDasharray="326.73" strokeDashoffset="0" strokeLinecap="round" transform="rotate(-90 60 60)" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#10b981" strokeWidth="10"
                    strokeDasharray="326.73"
                    strokeDashoffset={326.73 - (326.73 * Math.min(100, (debtStats.total_collected || 0) / Math.max(debtStats.total_sum || 1, 1) * 100) / 100)}
                    strokeLinecap="round" transform="rotate(-90 60 60)"
                    style={{ transition: "stroke-dashoffset 1.5s ease" }}
                  />
                </svg>
                <div className="gauge-center">
                  <span className="gauge-pct">
                    {debtStats.total_sum ? Math.round((debtStats.total_collected || 0) / debtStats.total_sum * 100) : 0}%
                  </span>
                  <span className="gauge-sub">yig'ilgan</span>
                </div>
              </div>
            </div>
            <div className="debt-summary">
              <div className="debt-item">
                <span className="debt-dot" style={{ background: "#10b981" }}></span>
                <span className="debt-label">Yig'ilgan mablag'</span>
                <span className="debt-value" style={{ color: "#10b981" }}>{formatNumber(debtStats.total_collected)}</span>
              </div>
              <div className="debt-item">
                <span className="debt-dot" style={{ background: "#ef4444" }}></span>
                <span className="debt-label">Qolgan qarz</span>
                <span className="debt-value" style={{ color: "#ef4444" }}>{formatNumber(debtStats.total_debt)}</span>
              </div>
              <div className="debt-item">
                <span className="debt-dot" style={{ background: "#6366f1" }}></span>
                <span className="debt-label">Umumiy summa</span>
                <span className="debt-value" style={{ color: "#6366f1" }}>{formatNumber(debtStats.total_sum)}</span>
              </div>
            </div>
          </div>
        </ChartWrapper>

        {/* ═══ 4: BINOLAR BO'YICHA SOTULISH ═══ */}
        <ChartWrapper 
          id="building_sales" 
          number="5" 
          title="Sotilgan / sotilmagan uylar (batafsil)"
          wide
          infoVisible={visibleInfos.building_sales}
          toggleInfo={toggleInfo}
        >
          <AmComposedChart
            data={stats.homes_by_building || []}
            xField="building_name"
            barFields={[
              { field: "sold", name: "Sotilgan", color: "#6366f1" },
              { field: "available", name: "Sotilmagan", color: "#10b981" },
            ]}
            lineField={{
              field: "percentage",
              name: "Sotilish foizi",
              color: "#ef4444",
            }}
            height={300}
          />
        </ChartWrapper>

        {/* ═══ SHAHARLAR JADVALI ═══ */}
        <ChartWrapper id="city_rev" number="6" title="Shaharlar bo'yicha daromad" toggleInfo={toggleInfo}>
          <div className="analytics-table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Shahar</th>
                  <th>Daromad</th>
                  <th>Ulush</th>
                </tr>
              </thead>
              <tbody>
                {(stats.revenue_by_city || []).map((c, i) => {
                  const maxRev = Math.max(...(stats.revenue_by_city || []).map(x => x.revenue || 0), 1);
                  const pct = Math.round((c.revenue || 0) / maxRev * 100);
                  return (
                    <tr key={i}>
                      <td className="table-building-name">
                        <MapPin size={12} style={{ marginRight: 6, color: '#f59e0b', display: 'inline' }} />
                        {c.city_name || '—'}
                      </td>
                      <td><span className="debt-value" style={{ color: '#f59e0b' }}>{formatNumber(c.revenue)}</span></td>
                      <td>
                        <div className="progress-cell">
                          <div className="progress-bar-mini">
                            <div className="progress-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }}></div>
                          </div>
                          <span>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ChartWrapper>

        {/* ═══ BINOLAR JADVALI ═══ */}
        <ChartWrapper id="building_rev" number="7" title="Binolar bo'yicha daromad" toggleInfo={toggleInfo}>
          <div className="analytics-table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Bino</th>
                  <th>Daromad</th>
                  <th>Ulush</th>
                </tr>
              </thead>
              <tbody>
                {(stats.revenue_by_building || []).slice(0, 8).map((b, i) => {
                  const maxRev = Math.max(...(stats.revenue_by_building || []).map(x => x.revenue || 0), 1);
                  const pct = Math.round((b.revenue || 0) / maxRev * 100);
                  return (
                    <tr key={i}>
                      <td className="table-building-name">
                        <Building size={12} style={{ marginRight: 6, color: '#3b82f6', display: 'inline' }} />
                        {b.building_name || '—'}
                      </td>
                      <td><span className="debt-value" style={{ color: '#3b82f6' }}>{formatNumber(b.revenue)}</span></td>
                      <td>
                        <div className="progress-cell">
                          <div className="progress-bar-mini">
                            <div className="progress-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }}></div>
                          </div>
                          <span>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ChartWrapper>
      </div>
    </div>
  );
});

const LeadsDashboard = React.memo(({ stats, STATUS_LABELS, COLORS, themeColors, stages, isAdmin }) => {
  const [visibleInfos, setVisibleInfos] = useState({});
  const [funnelSort, setFunnelSort] = useState("count"); // "count" yoki "stage"

  const toggleInfo = React.useCallback((id) => {
    setVisibleInfos(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  if (!stats) return null;
  const { kpi } = stats;

  // --- MEMOIZED DATA TO PREVENT RE-RENDERS ---
  const dailyLeadsData = useMemo(() => 
    (stats.daily_leads || []).map(d => ({
      ...d,
      date: d.date ? String(d.date).split('T')[0] : d.date,
    })), [stats.daily_leads]);

  const sourceData = useMemo(() => stats.by_source || [], [stats.by_source]);
  const formData = useMemo(() => stats.by_form || [], [stats.by_form]);
  
  const callStatusData = useMemo(() => 
    (stats.call_status_distribution || []).map(d => ({
      name: STATUS_LABELS[d.call_status] || d.call_status || "Noma'lum",
      count: d.count,
    })), [stats.call_status_distribution, STATUS_LABELS]);

  const stageDistData = useMemo(() => 
    (stats.current_stage_counts || []).map(d => ({
      name: d.stage_name || "Noma'lum",
      count: d.count,
    })), [stats.current_stage_counts]);

  const funnelItems = useMemo(() => {
    return (stats.lead_funnel || [])
      .filter(d => d.count > 0 && d.stage !== 'Barcha leadlar')
      .sort((a, b) => {
        if (funnelSort === 'count') {
          return b.count - a.count;
        } else {
          const stageA = stages.find(s => s.name === a.stage);
          const stageB = stages.find(s => s.name === b.stage);
          return (stageA?.order || 0) - (stageB?.order || 0);
        }
      })
      .map((d, i) => ({
        name: d.stage,
        count: d.count,
        color: d.color || COLORS[i % COLORS.length],
      }));
  }, [stats.lead_funnel, funnelSort, stages, COLORS]);

  return (
    <div className="analytics-dashboard">
      {/* ═══ 1-QATOR: KPI CARDS ═══ */}
      {kpi && (
        <div className="kpi-row">
          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#6366f1" }}><Users size={22} /></div>
            <div className="kpi-info">
              <span className="kpi-value">{kpi.total_leads || 0}</span>
              <span className="kpi-label">Jami leadlar</span>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}><UserCheck size={22} /></div>
            <div className="kpi-info">
              <span className="kpi-value">{kpi.new_leads || 0}</span>
              <span className="kpi-label">Yangi leadlar (Bugun)</span>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}><TrendingUp size={22} /></div>
            <div className="kpi-info">
              <span className="kpi-value">{kpi.conversion_rate || 0}%</span>
              <span className="kpi-label">Konversiya (Sotuv)</span>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}><Phone size={22} /></div>
            <div className="kpi-info">
              <span className="kpi-value">{kpi.total_calls || 0}</span>
              <span className="kpi-label">Jami qo'ng'iroqlar</span>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6" }}><Target size={22} /></div>
            <div className="kpi-info">
              <span className="kpi-value">{kpi.converted_leads || 0}</span>
              <span className="kpi-label">Mijozga aylangan</span>
            </div>
          </div>
        </div>
      )}

      <div className="charts-grid">
        {/* ═══ 2: LEAD PIPELINE ═══ */}
        {stats.lead_funnel && stats.lead_funnel.some((d) => d.count > 0) && (
          <ChartWrapper 
            id="lead_pipeline" 
            number="1" 
            title="Leadlar bosqichlar bo'yicha taqsimoti"
            wide
            infoVisible={visibleInfos.lead_pipeline}
            toggleInfo={toggleInfo}
          >
            <div className="funnel-header-actions" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '12px',
              padding: '0 20px'
            }}>
              <div className="total-leads-badge" style={{
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                background: 'rgba(99, 102, 241, 0.1)',
                padding: '4px 12px',
                borderRadius: '20px',
                border: '1px solid rgba(99, 102, 241, 0.2)'
              }}>
                Jami: <span style={{ color: 'var(--accent-primary)' }}>{kpi.total_leads} ta lead</span>
              </div>
              <div className="funnel-sort-controls" style={{ 
                display: 'flex', 
                gap: '8px', 
              }}>
                <button 
                  className={`btn-mini ${funnelSort === 'count' ? 'active' : ''}`}
                  onClick={() => setFunnelSort('count')}
                  style={{
                    background: funnelSort === 'count' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                    color: funnelSort === 'count' ? 'white' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Ko'pdan kamga
                </button>
                <button 
                  className={`btn-mini ${funnelSort === 'stage' ? 'active' : ''}`}
                  onClick={() => setFunnelSort('stage')}
                  style={{
                    background: funnelSort === 'stage' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                    color: funnelSort === 'stage' ? 'white' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Bosqich tartibi
                </button>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", padding: "0 0 20px 0" }}>
              <FunnelChart
                items={funnelItems}
                height={500}
              />
            </div>

          </ChartWrapper>
        )}

        {/* ═══ 3A: KUNLIK LEADLAR TRENDI ═══ */}
        <ChartWrapper 
          id="daily_trend" 
          number="2" 
          title="Kunlik qo'shilgan leadlar soni"
          infoVisible={visibleInfos.daily_trend}
          toggleInfo={toggleInfo}
        >
          <AmAreaChart
            data={dailyLeadsData}
            xField="date"
            yField="count"
            height={250}
            color="#6366f1"
            initialZoomDays={30}
            tooltipText="Sana: {categoryX}\nLeadlar: {valueY}"
          />
        </ChartWrapper>

        {/* ═══ 3B: OYLIK TREND ═══ */}
        <ChartWrapper 
          id="monthly_trend" 
          number="3" 
          title="Oylik leadlar dinamikasi"
          infoVisible={visibleInfos.monthly_trend}
          toggleInfo={toggleInfo}
        >
          <AmBarChart
            data={(stats.monthly_trend || []).map(d => {
                if (!d.month) return d;
                const dt = new Date(d.month);
                const months = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
                return {
                  ...d,
                  month: `${months[dt.getMonth()]} ${dt.getFullYear()}`,
                };
              })}
            xField="month"
            yField="count"
            height={250}
            color="#8b5cf6"
            tooltipFormatter="Oy: {categoryX}\nLeadlar: {valueY}"
          />
        </ChartWrapper>

        {/* ═══ 4: OPERATOR SCORECARD ═══ */}
        {isAdmin && (
        <ChartWrapper 
          id="operator_scorecard" 
          number="4" 
          title="Har bir operator bo'yicha batafsil ko'rsatkichlar"
          wide
          infoVisible={visibleInfos.operator_scorecard}
          toggleInfo={toggleInfo}
        >
          <div className="analytics-table-wrapper">
            <table className="analytics-table scorecard-table">
              <thead>
                <tr>
                  <th>Operator</th>
                  <th>Leadlar</th>
                  <th>Qo'ng'iroq</th>
                  <th>Javob %</th>
                  <th>Konvertatsiya</th>
                  <th>Konv. %</th>
                </tr>
              </thead>
              <tbody>
                {(stats.operator_scorecard || []).map((op, i) => (
                  <tr key={i}>
                    <td className="table-building-name">
                      <User size={12} style={{ marginRight: 6, color: COLORS[i % COLORS.length], display: 'inline' }} />
                      {op.name || '—'}
                    </td>
                    <td><strong>{op.total_leads}</strong></td>
                    <td>{op.called}</td>
                    <td>
                      <div className="progress-cell">
                        <div className="progress-bar-mini">
                          <div className="progress-fill" style={{
                              width: `${op.answer_rate}%`,
                              background: op.answer_rate >= 70 ? 'linear-gradient(90deg, #10b981, #34d399)' :
                                op.answer_rate >= 40 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' :
                                  'linear-gradient(90deg, #ef4444, #f87171)'
                            }}></div>
                        </div>
                        <span>{op.answer_rate}%</span>
                      </div>
                    </td>
                    <td><span className="table-badge available">{op.converted}</span></td>
                    <td>
                      <span className={`conv-badge ${op.conversion_rate >= 20 ? 'high' : op.conversion_rate >= 10 ? 'mid' : 'low'}`}>
                        {op.conversion_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartWrapper>
        )}

        {/* ═══ 5A: OPERATOR REYTINGI ═══ */}
        {isAdmin && (
        <ChartWrapper 
          id="conversion_rating" 
          number="5" 
          title="Kim eng ko'p leadlarni mijozga aylantirmoqda?"
          infoVisible={visibleInfos.conversion_rating}
          toggleInfo={toggleInfo}
        >
          <div className="h-bar-list">
            {(stats.operator_conversion || [])
                .sort((a, b) => b.rate - a.rate)
                .map((op, i) => {
                  const maxRate = Math.max(...(stats.operator_conversion || []).map(x => x.rate || 0), 1);
                  const pct = Math.round((op.rate / maxRate) * 100);
                  const color = op.rate >= 20 ? "#f59e0b" : op.rate >= 10 ? "#6366f1" : "#94a3b8";
                  const badge = op.rate >= 20 ? "Expert" : op.rate >= 10 ? "Pro" : "Standard";
                  
                  return (
                    <div key={i} className="h-bar-item" style={{ marginBottom: '12px' }}>
                      <div className="h-bar-label">
                        <span className="h-bar-name" style={{ fontWeight: '600' }}>
                          {i === 0 && '🏆 '}{op.name}
                          <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '8px', fontWeight: 'normal' }}>
                            ({badge})
                          </span>
                        </span>
                        <span className="h-bar-value" style={{ color }}>{op.rate}%</span>
                      </div>
                      <div className="h-bar-track" style={{ height: '10px' }}>
                        <div
                          className="h-bar-fill"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                            boxShadow: i === 0 ? `0 0 10px ${color}44` : 'none'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
          </div>
        </ChartWrapper>
        )}

        {/* ═══ 5B: OPERATOR VORONKASI ═══ */}
        {isAdmin && (
        <ChartWrapper 
          id="op_funnel" 
          number="6" 
          title="Operatorga bosib bosqichlarni ko'ring" 
          infoVisible={visibleInfos.op_funnel}
          toggleInfo={toggleInfo}
        >
          <OperatorFunnel
            operators={stats.leads_by_operator || []}
            operatorFunnel={stats.operator_stage_distribution || []}
            stages={stats.stages_list || stages || []}
            themeColors={themeColors}
          />
        </ChartWrapper>
        )}

        {/* ═══ 6A: MANBA BO'YICHA ═══ */}
        <ChartWrapper 
          id="lead_sources" 
          number="7" 
          title="Leadlar manba turi bo'yicha" 
          infoVisible={visibleInfos.lead_sources}
          toggleInfo={toggleInfo}
        >
          <HorizontalBar
            data={sourceData}
            nameField="name"
            valueField="count"
            color="#06b6d4"
          />
        </ChartWrapper>

        {/* ═══ 6B: FORMALAR BO'YICHA ═══ */}
        <ChartWrapper 
          id="form_stats" 
          number="8" 
          title="Qaysi formadan ko'p lead kelmoqda?" 
          infoVisible={visibleInfos.form_stats}
          toggleInfo={toggleInfo}
        >
          <HorizontalBar
            data={formData}
            nameField="name"
            valueField="count"
            color="#ec4899"
          />
        </ChartWrapper>

        {/* ═══ 7A: QO'NG'IROQ HOLATI ═══ */}
        <ChartWrapper 
          id="call_status" 
          number="9" 
          title="Qo'ng'iroq natijalari" 
          infoVisible={visibleInfos.call_status}
          toggleInfo={toggleInfo}
        >
          <HorizontalBar
            data={callStatusData}
            nameField="name"
            valueField="count"
            color="#f59e0b"
          />
        </ChartWrapper>

        {/* ═══ 7B: BOSQICHLAR TAQSIMOTI ═══ */}
        <ChartWrapper 
          id="stage_dist" 
          number="10" 
          title="Hozirgi bosqichlar bo'yicha leadlar" 
          infoVisible={visibleInfos.stage_dist}
          toggleInfo={toggleInfo}
        >
          <HorizontalBar
            data={stageDistData}
            nameField="name"
            valueField="count"
            color="#8b5cf6"
          />
        </ChartWrapper>
      </div>
    </div>
  );
});

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div className="header-left">
          <h1>Analitika & Hisobotlar</h1>
          <p>Loyihangiz bo'yicha barcha asosiy ko'rsatkichlar</p>
        </div>

        <div className="header-actions">
          <div className="header-tabs">
            <button
              className={`tab-btn ${activeTab === "sales" ? "active" : ""}`}
              onClick={() => setActiveTab("sales")}
            >
              <DollarSign size={18} />
              Sotuvlar
            </button>
            <button
              className={`tab-btn ${activeTab === "leads" ? "active" : ""}`}
              onClick={() => setActiveTab("leads")}
            >
              <Users size={18} />
              Leadlar
            </button>
            {canViewFinance && (
              <button
                className={`tab-btn finance-tab-btn ${activeTab === "finance" ? "active" : ""}`}
                onClick={() => setActiveTab("finance")}
              >
                <TrendingUp size={18} />
                Moliya
              </button>
            )}
          </div>

          <div className="header-right">
            <button
              className={`btn-filter-trigger ${isFilterOpen ? "active" : ""}`}
              onClick={() => setIsFilterOpen(true)}
            >
              <Filter size={18} />
              Filterlash
            </button>
          </div>
        </div>
      </div>

      <div className="analytics-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Ma'lumotlar yuklanmoqda...</p>
          </div>
        ) : (
          <>
            {activeTab === "sales" && (
              <SalesDashboard
                stats={stats}
                formatNumber={formatNumber}
                STATUS_LABELS={STATUS_LABELS}
              />
            )}
            {activeTab === "leads" && (
              <LeadsDashboard
                stats={stats}
                STATUS_LABELS={STATUS_LABELS}
                COLORS={COLORS}
                themeColors={themeColors}
                stages={stages}
                isAdmin={isAdmin}
              />
            )}
            {activeTab === "finance" && (
              <FinanceDashboard stats={stats} />
            )}
          </>
        )}
      </div>

      <AnalyticsFilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        activeTab={activeTab}
        initialFilters={
          activeTab === "sales"
            ? salesFilters
            : activeTab === "finance"
            ? financeFilters
            : leadsFilters
        }
        cities={cities}
        buildings={buildings}
        stages={stages}
        operators={operators}
        isAdmin={isAdmin}
        onFilter={useCallback(async (newFilters) => {
          setLoading(true);
          try {
            if (activeTab === "sales") {
              setSalesFilters(newFilters);
              const res = await analyticsService.getContractsStats(newFilters);
              setStats(res.data);
            } else if (activeTab === "finance") {
              setFinanceFilters(newFilters);
              const res = await analyticsService.getFinanceStats(newFilters);
              setStats(res.data);
            } else {
              setLeadsFilters(newFilters);
              const res = await analyticsService.getLeadsStats(newFilters);
              setStats(res.data);
              if (res.data?.leads_by_operator) {
                setOperators(
                  res.data.leads_by_operator
                    .map((o) => ({ id: o.operator_id, name: o.operator_name }))
                    .filter((o) => o.id),
                );
              }
            }
          } catch (error) {
            toast.error("Statistikalarni yuklashda xatolik yuz berdi");
            console.error(error);
          } finally {
            setLoading(false);
          }
        }, [activeTab])}
      />
    </div>
  );
};

export default AnalyticsPage;
