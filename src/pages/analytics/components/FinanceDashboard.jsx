import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  Wallet,
  CreditCard,
  Info,
  X,
  Building,
  Users,
} from "lucide-react";
import {
  AmBarChart,
  AmAreaChart,
  AmPieChart,
  AmComposedChart,
} from "../../../components/AmCharts";

// ─── Raqam formatlash ───────────────────────────────────────────────────────
const fmt = (num) => {
  if (!num && num !== 0) return "0";
  const n = Number(num);
  if (n >= 1e9) return (n / 1e9).toFixed(1) + " mlrd";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + " mln";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + " ming";
  return n.toLocaleString("ru-RU");
};

// ─── Chart Info matnlari ────────────────────────────────────────────────────
const FINANCE_CHART_INFO = {
  monthly_trend: {
    title: "Oylik Kirim / Chiqim Trendi",
    desc: "Har oy bo'yicha jami kirim, chiqim va sof foyda ko'rsatkichi. Musbat sof foyda — yashil, manfiy — qizil ustun sifatida ko'rinadi.",
  },
  income_by_source: {
    title: "Kirim Manbalar Taqsimoti",
    desc: "Kirimlarning qaysi qismini shartnoma to'lovlari, qaysi qismini qo'lda kiritilgan tushumlar tashkil etishi. Bu nisbat moliyaviy shaffoflikni ko'rsatadi.",
  },
  expense_by_category: {
    title: "Chiqim Kategoriyalar Taqsimoti",
    desc: "Xarajatlarning kategoriyalar bo'yicha ulushi. Eng katta xarajat toifasini aniqlashga va byudjetni to'g'ri boshqarishga yordam beradi.",
  },
  by_building: {
    title: "Binolar bo'yicha Kirim vs Chiqim",
    desc: "Har bir ob'ekt bo'yicha kirim, chiqim va sof foyda ko'rsatkichi. Qaysi bino eng rentabelligini yoki zararliligini ko'rish mumkin.",
  },
  income_by_category: {
    title: "TOP Kirim Kategoriyalari",
    desc: "Kirimlarning kategoriyalar bo'yicha taqsimoti. Eng ko'p tushum kelayotgan toifalarni ko'rsatadi.",
  },
  expense_top: {
    title: "TOP Chiqim Kategoriyalari",
    desc: "Eng ko'p xarajat qilingan kategoriyalar reytingi. Byudjet optimallashtirish uchun asosiy ko'rsatkich.",
  },
  daily_trend: {
    title: "Kunlik Kirim va Chiqim",
    desc: "Kunlik moliyaviy harakatlar. Pulsatsiya va naqshlarni, hamda g'ayritabiiy kun o'zgarishlarini aniqlashga yordam beradi.",
  },
  user_contribution: {
    title: "Foydalanuvchilar Hissasi",
    desc: "Har bir xodim tomonidan kiritilgan kirim va chiqim summasi. Moliyaviy operatsiyalar uchun javobgarlikni kuzatish imkonini beradi.",
  },
  income_categories_table: {
    title: "Kirim Kategoriyalari Jadvali",
    desc: "Barcha kirim kategoriyalari bo'yicha batafsil raqamli tahlil: jami summa va umumiy summagacha bo'lgan ulush foizi.",
  },
};

// ─── ChartWrapper ────────────────────────────────────────────────────────────
const ChartWrapper = React.memo(({ id, children, title, number, wide, infoVisible, toggleInfo }) => (
  <div className={`chart-card ${wide ? "wide" : ""} ${infoVisible ? "show-info" : ""}`}>
    <div className="chart-card-header">
      <div className="header-text">
        <span className="chart-number">{number}</span>
        <h4>{title}</h4>
      </div>
      <button
        className="info-toggle-btn"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleInfo(id); }}
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
            <h5>{FINANCE_CHART_INFO[id]?.title || title}</h5>
            <p>{FINANCE_CHART_INFO[id]?.desc || "Ma'lumot topilmadi."}</p>
            <button className="close-info-btn" onClick={() => toggleInfo(id)}>Yopish</button>
          </div>
        </div>
      )}
    </div>
  </div>
));

// ─── KPI Karta ───────────────────────────────────────────────────────────────
const KpiCard = ({ icon, value, label, color, bgColor, sub, subPositive }) => (
  <div className="kpi-card finance-kpi-card">
    <div className="kpi-icon" style={{ background: bgColor, color }}>{icon}</div>
    <div className="kpi-info">
      <span className="kpi-value" style={{ color }}>{value}</span>
      <span className="kpi-label">{label}</span>
      {sub != null && (
        <span className="kpi-sub" style={{ color: subPositive ? "#10b981" : "#ef4444" }}>
          {subPositive ? "▲" : "▼"} {sub}
        </span>
      )}
    </div>
  </div>
);

// ─── Horizontal Bar ─────────────────────────────────────────────────────────
const HBar = ({ data, nameField = "name", valueField = "value", color = "#6366f1", maxItems = 8 }) => {
  const items = (data || []).slice(0, maxItems);
  if (!items.length) return <div className="no-data-mini">Ma'lumot yo'q</div>;
  const maxVal = Math.max(...items.map((d) => d[valueField] || 0), 1);
  return (
    <div className="h-bar-list">
      {items.map((item, i) => {
        const val = item[valueField] || 0;
        const pct = Math.round((val / maxVal) * 100);
        return (
          <div key={i} className="h-bar-item">
            <div className="h-bar-label">
              <span className="h-bar-name">{item[nameField] || "—"}</span>
              <span className="h-bar-value" style={{ color }}>{fmt(val)}</span>
            </div>
            <div className="h-bar-track">
              <div
                className="h-bar-fill"
                style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}88)` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Kategoriya Jadvali ──────────────────────────────────────────────────────
const CategoryTable = ({ data, colorField }) => {
  if (!data?.length) return <div className="no-data-mini">Ma'lumot yo'q</div>;
  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  return (
    <div className="analytics-table-wrapper">
      <table className="analytics-table">
        <thead>
          <tr>
            <th>Kategoriya</th>
            <th>Summa</th>
            <th>Ulush</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 10).map((d, i) => {
            const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
            const color = d[colorField] || "#6366f1";
            return (
              <tr key={i}>
                <td className="table-building-name">
                  <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", background: color, marginRight: 8 }} />
                  {d.name || "—"}
                </td>
                <td><span className="debt-value" style={{ color }}>{fmt(d.value)}</span></td>
                <td>
                  <div className="progress-cell">
                    <div className="progress-bar-mini">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}aa)` }} />
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
  );
};

// ─── Asosiy Komponent ────────────────────────────────────────────────────────
const FinanceDashboard = React.memo(({ stats }) => {
  const [visibleInfos, setVisibleInfos] = useState({});
  const toggleInfo = React.useCallback((id) => {
    setVisibleInfos((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const kpi = stats?.kpi || {};

  // ── Oylik trend ma'lumotlari ──
  const monthlyData = useMemo(
    () => (stats?.monthly_trend || []).map((d) => ({
      month: d.month_label || d.month,
      income: d.income || 0,
      expense: d.expense || 0,
      profit: d.profit || 0,
    })),
    [stats?.monthly_trend]
  );

  // ── Kunlik trend: ikki serie ──
  const dailyIncomeData = useMemo(
    () => (stats?.daily_trend || []).map((d) => ({ date: d.date, value: d.income || 0 })),
    [stats?.daily_trend]
  );
  const dailyExpenseData = useMemo(
    () => (stats?.daily_trend || []).map((d) => ({ date: d.date, value: d.expense || 0 })),
    [stats?.daily_trend]
  );

  // ── Pie chart ma'lumotlari ──
  const sourceData = useMemo(
    () => (stats?.income_by_source || []).filter((d) => d.value > 0).map((d) => ({ name: d.name, value: d.value })),
    [stats?.income_by_source]
  );
  const expCatData = useMemo(
    () => (stats?.expense_by_category || []).filter((d) => d.value > 0).map((d) => ({ name: d.name, value: d.value })),
    [stats?.expense_by_category]
  );

  // ── Binolar chart ──
  const buildingData = useMemo(
    () => (stats?.by_building || []).slice(0, 12),
    [stats?.by_building]
  );

  // ── User contribution ──
  const userContrib = useMemo(
    () => (stats?.user_contribution || []).slice(0, 10),
    [stats?.user_contribution]
  );

  // Sof foyda musbatmi?
  const isProfit = (kpi.net_profit || 0) >= 0;

  if (!stats) return null;

  return (
    <div className="analytics-dashboard">

      {/* ══════════ KPI KARTALAR ══════════ */}
      <div className="kpi-row finance-kpi-row">
        <KpiCard
          icon={<TrendingUp size={22} />}
          value={fmt(kpi.total_income)}
          label="Jami Kirim"
          color="#10b981"
          bgColor="rgba(16,185,129,0.15)"
        />
        <KpiCard
          icon={<TrendingDown size={22} />}
          value={fmt(kpi.total_expense)}
          label="Jami Chiqim"
          color="#ef4444"
          bgColor="rgba(239,68,68,0.15)"
        />
        <KpiCard
          icon={<DollarSign size={22} />}
          value={fmt(kpi.net_profit)}
          label="Sof Foyda"
          color={isProfit ? "#6366f1" : "#ef4444"}
          bgColor={isProfit ? "rgba(99,102,241,0.15)" : "rgba(239,68,68,0.12)"}
        />
        <KpiCard
          icon={<Percent size={22} />}
          value={`${kpi.profit_margin ?? 0}%`}
          label="Foyda Marjasi"
          color="#f59e0b"
          bgColor="rgba(245,158,11,0.15)"
        />
        <KpiCard
          icon={<CreditCard size={22} />}
          value={fmt(kpi.contract_income)}
          label="Shartnoma Kirimi"
          color="#06b6d4"
          bgColor="rgba(6,182,212,0.15)"
        />
        <KpiCard
          icon={<Wallet size={22} />}
          value={fmt(kpi.manual_income)}
          label="Qo'lda Kirim"
          color="#8b5cf6"
          bgColor="rgba(139,92,246,0.15)"
        />
      </div>

      <div className="charts-grid">

        {/* ══════ 1: OYLIK TREND (keng) ══════ */}
        <ChartWrapper
          id="monthly_trend"
          number="1"
          title="Oylik Kirim / Chiqim / Foyda Trendi"
          wide
          infoVisible={visibleInfos.monthly_trend}
          toggleInfo={toggleInfo}
        >
          {monthlyData.length > 0 ? (
            <AmComposedChart
              data={monthlyData}
              xField="month"
              barFields={[
                { field: "income",  name: "Kirim",   color: "#10b981" },
                { field: "expense", name: "Chiqim",  color: "#ef4444" },
              ]}
              lineField={{ field: "profit", name: "Sof Foyda", color: "#6366f1" }}
              lineYAxisFormat="#,###"
              height={350}
              stacked={false}
            />
          ) : (
            <div className="no-data-mini">Ma'lumot yo'q</div>
          )}
        </ChartWrapper>

        {/* ══════ 2: KIRIM MANBALAR (pie) ══════ */}
        <ChartWrapper
          id="income_by_source"
          number="2"
          title="Kirim Manbalar Taqsimoti"
          infoVisible={visibleInfos.income_by_source}
          toggleInfo={toggleInfo}
        >
          <AmPieChart
            data={sourceData}
            nameField="name"
            valueField="value"
            height={260}
            innerRadius={55}
            colors={["#06b6d4", "#8b5cf6"]}
          />
        </ChartWrapper>

        {/* ══════ 3: CHIQIM KATEGORIYALAR (pie) ══════ */}
        <ChartWrapper
          id="expense_by_category"
          number="3"
          title="Chiqim Kategoriyalar Taqsimoti"
          infoVisible={visibleInfos.expense_by_category}
          toggleInfo={toggleInfo}
        >
          <AmPieChart
            data={expCatData}
            nameField="name"
            valueField="value"
            height={260}
            innerRadius={55}
            colors={["#ef4444","#f59e0b","#ec4899","#8b5cf6","#06b6d4","#3b82f6","#10b981","#f97316"]}
          />
        </ChartWrapper>

        {/* ══════ 4: BINOLAR (unstacked bar + line, keng) ══════ */}
        {buildingData.length > 0 && (
          <ChartWrapper
            id="by_building"
            number="4"
            title="Binolar bo'yicha Kirim vs Chiqim va Foyda"
            wide
            infoVisible={visibleInfos.by_building}
            toggleInfo={toggleInfo}
          >
            <AmComposedChart
              data={buildingData}
              xField="building_name"
              barFields={[
                { field: "income",  name: "Kirim",  color: "#10b981" },
                { field: "expense", name: "Chiqim", color: "#ef4444" },
              ]}
              lineField={{ field: "profit", name: "Sof Foyda", color: "#6366f1" }}
              lineYAxisFormat="#,###"
              height={380}
              stacked={false}
            />
          </ChartWrapper>
        )}

        <ChartWrapper
          id="income_by_category"
          number="5"
          title="TOP Kirim Kategoriyalari"
          infoVisible={visibleInfos.income_by_category}
          toggleInfo={toggleInfo}
        >
          <div style={{ padding: "10px 5px" }}>
            <HBar
              data={(stats?.income_by_category || []).slice(0, 8)}
              nameField="name"
              valueField="value"
              color="#10b981"
              maxItems={8}
            />
          </div>
        </ChartWrapper>

        <ChartWrapper
          id="expense_top"
          number="6"
          title="TOP Chiqim Kategoriyalari"
          infoVisible={visibleInfos.expense_top}
          toggleInfo={toggleInfo}
        >
          <div style={{ padding: "10px 5px" }}>
            <HBar
              data={(stats?.expense_by_category || []).slice(0, 8)}
              nameField="name"
              valueField="value"
              color="#ef4444"
              maxItems={8}
            />
          </div>
        </ChartWrapper>

        {/* ══════ 7: KUNLIK KIRIM TRENDI (keng) ══════ */}
        <ChartWrapper
          id="daily_trend"
          number="7"
          title="Kunlik Moliyaviy Harakatlar"
          wide
          infoVisible={visibleInfos.daily_trend}
          toggleInfo={toggleInfo}
        >
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <p style={{ margin: "0 0 8px 0", fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>
                📈 KIRIM
              </p>
              <AmAreaChart
                data={dailyIncomeData}
                xField="date"
                yField="value"
                height={200}
                color="#10b981"
                initialZoomDays={30}
                tooltipText="Sana: {valueX.formatDate('dd MMM')}\nKirim: {valueY}"
              />
            </div>
            <div style={{ flex: 1, minWidth: 280 }}>
              <p style={{ margin: "0 0 8px 0", fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>
                📉 CHIQIM
              </p>
              <AmAreaChart
                data={dailyExpenseData}
                xField="date"
                yField="value"
                height={200}
                color="#ef4444"
                initialZoomDays={30}
                tooltipText="Sana: {valueX.formatDate('dd MMM')}\nChiqim: {valueY}"
              />
            </div>
          </div>
        </ChartWrapper>

        {/* ══════ 8: KIRIM KATEGORIYALAR JADVALI ══════ */}
        <ChartWrapper
          id="income_categories_table"
          number="8"
          title="Kirim Kategoriyalari Jadvali"
          infoVisible={visibleInfos.income_categories_table}
          toggleInfo={toggleInfo}
        >
          <CategoryTable data={stats?.income_by_category || []} colorField="color" />
        </ChartWrapper>

        {/* ══════ 9: FOYDALANUVCHILAR HISSASI ══════ */}
        <ChartWrapper
          id="user_contribution"
          number="9"
          title="Foydalanuvchilar Hissasi"
          infoVisible={visibleInfos.user_contribution}
          toggleInfo={toggleInfo}
        >
          {userContrib.length > 0 ? (
            <AmBarChart
              data={userContrib}
              xField="name"
              yField={["income", "expense"]}
              colors={["#10b981", "#ef4444"]}
              seriesNames={["Kirim", "Chiqim"]}
              height={260}
              tooltipFormatter="{name}: {valueY}"
              stacked={false}
            />
          ) : (
            <div className="no-data-mini">Ma'lumot yo'q</div>
          )}
        </ChartWrapper>

      </div>
    </div>
  );
});

export default FinanceDashboard;
