import React, { useState, useEffect, useMemo, useRef } from "react";
import { NoData } from "./AmCharts";
import * as am5 from "@amcharts/amcharts5";
import * as am5percent from "@amcharts/amcharts5/percent";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import am5themes_Dark from "@amcharts/amcharts5/themes/Dark";

const COLORS = [
  "#8b5cf6",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#14b8a6",
  "#6366f1",
];

// eslint-disable-next-line react-refresh/only-export-components
export const useThemeColors = () => {
  const [colors, setColors] = useState({});

  useEffect(() => {
    const update = () => {
      const s = getComputedStyle(document.documentElement);
      setColors({
        textPrimary: s.getPropertyValue("--text-primary").trim() || "#0f172a",
        textSecondary:
          s.getPropertyValue("--text-secondary").trim() || "#64748b",
        bgSecondary: s.getPropertyValue("--bg-secondary").trim() || "#ffffff",
        borderColor: s.getPropertyValue("--border-color").trim() || "#e2e8f0",
      });
    };
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => obs.disconnect();
  }, []);
  return colors;
};

const AmFunnel = ({ items, chartId, height = 380, onSliceClick }) => {
  const chartRef = useRef(null);
  const rootRef = useRef(null);

  React.useLayoutEffect(() => {
    const validItems = (items || []).filter((item) => (item.count || 0) > 0);
    if (!chartRef.current || validItems.length === 0) return;

    const root = am5.Root.new(chartRef.current);
    rootRef.current = root;

    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    const themes = [am5themes_Animated.new(root)];
    if (isDark) themes.push(am5themes_Dark.new(root));
    root.setThemes(themes);

    const chart = root.container.children.push(
      am5percent.SlicedChart.new(root, {
        layout: root.verticalLayout,
        paddingTop: 0,
        paddingBottom: 0,
      }),
    );

    const maxVal = Math.max(...validItems.map((i) => i.count || 0));
    const minVal = Math.min(...validItems.map((i) => i.count || 0));
    const hasDisparity = maxVal > 0 && minVal / maxVal < 0.05;

    const series = chart.series.push(
      am5percent.FunnelSeries.new(root, {
        alignLabels: hasDisparity,
        orientation: "vertical",
        valueField: "value",
        categoryField: "category",
        bottomRatio: 0.15,
      }),
    );

    series.slices.template.setAll({
      strokeWidth: 0,
      strokeOpacity: 0,
      fillOpacity: 0.9,
      cornerRadius: 4,
      tooltipText: "{category}: {value}",
    });

    series.slices.template.states.create("hover", {
      fillOpacity: 1,
      scale: 1.02,
    });

    if (onSliceClick) {
      series.slices.template.setAll({ cursorOverStyle: "pointer" });
      series.slices.template.events.on("click", (ev) => {
        const idx = series.dataItems.indexOf(ev.target.dataItem);
        onSliceClick(idx);
      });
    }

    if (hasDisparity) {
      series.labels.template.setAll({
        fontSize: 11,
        fontWeight: "600",
        fill: am5.color(isDark ? 0xe2e8f0 : 0x334155),
        text: "{category}: {value}",
        populateText: true,
      });
      series.ticks.template.setAll({
        stroke: am5.color(isDark ? 0x475569 : 0xcbd5e1),
        strokeWidth: 1,
        strokeDasharray: [3, 3],
      });
    } else {
      series.labels.template.setAll({
        fontSize: 12,
        fontWeight: "600",
        fill: am5.color(0xffffff),
        text: "{category}: {value}",
        textAlign: "center",
        populateText: true,
      });
      series.ticks.template.setAll({ forceHidden: true });
    }

    const minVisual = hasDisparity ? Math.max(1, Math.round(maxVal * 0.04)) : 0;
    const chartData = validItems.map((item) => ({
      value: Math.max(item.count || 0, minVisual),
      realValue: item.count || 0,
      category: item.name,
      sliceSettings: { fill: am5.color(item.color) },
    }));

    series.labels.template.adapters.add("text", (text, target) => {
      const d = target.dataItem;
      if (d?.dataContext?.realValue !== undefined) {
        return `${d.dataContext.category}: ${d.dataContext.realValue}`;
      }
      return text;
    });

    series.slices.template.adapters.add("tooltipText", (text, target) => {
      const d = target.dataItem;
      if (d?.dataContext?.realValue !== undefined) {
        return `${d.dataContext.category}: ${d.dataContext.realValue}`;
      }
      return text;
    });

    series.slices.template.adapters.add("fill", (fill, target) => {
      const d = target.dataItem;
      if (d?.dataContext?.sliceSettings)
        return d.dataContext.sliceSettings.fill;
      return fill;
    });

    series.slices.template.adapters.add("stroke", (stroke, target) => {
      const d = target.dataItem;
      if (d?.dataContext?.sliceSettings)
        return d.dataContext.sliceSettings.fill;
      return stroke;
    });

    series.data.setAll(chartData);

    const legend = chart.children.push(
      am5.Legend.new(root, {
        centerX: am5.p50,
        x: am5.p50,
        marginTop: 8,
      }),
    );
    legend.labels.template.setAll({
      fontSize: 11,
      fill: am5.color(isDark ? 0xcbd5e1 : 0x475569),
    });
    legend.valueLabels.template.setAll({
      fontSize: 11,
      fontWeight: "600",
      fill: am5.color(isDark ? 0xf1f5f9 : 0x0f172a),
    });
    legend.data.setAll(series.dataItems);

    series.appear(800, 100);
    chart.appear(800, 100);

    return () => root.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, chartId]);

  const validItems = (items || []).filter((item) => (item.count || 0) > 0);

  if (!items || items.length === 0 || validItems.length === 0) {
    return <NoData height={`${height}px`} />;
  }

  return (
    <div ref={chartRef} style={{ width: "100%", height: `${height}px` }} />
  );
};

export const OperatorFunnel = ({
  operators,
  operatorFunnel,
  stages,
  themeColors,
}) => {
  const [selectedIdx, setSelectedIdx] = useState(null);

  const mainItems = useMemo(() => {
    const sorted = [...(operators || [])].sort(
      (a, b) => (b.count || 0) - (a.count || 0),
    );
    return sorted.map((op, i) => ({ ...op, color: COLORS[i % COLORS.length] }));
  }, [operators]);

  const detailItems = useMemo(() => {
    if (selectedIdx === null || !operatorFunnel || !stages) return [];
    const op = mainItems[selectedIdx];
    if (!op) return [];
    const d = operatorFunnel.find(
      (f) =>
        f.name.toLowerCase().trim() ===
        (op.name || op.operator_name || "").toLowerCase().trim(),
    );
    if (!d) return [];
    return stages
      .map((st, i) => ({
        name: st.name,
        count: d[st.name] || 0,
        color: st.color || COLORS[i % COLORS.length],
      }))
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [selectedIdx, mainItems, operatorFunnel, stages]);

  const isExpanded = selectedIdx !== null;
  const selectedOp = isExpanded ? mainItems[selectedIdx] : null;

  const handleClick = (idx) => {
    setSelectedIdx(selectedIdx === idx ? null : idx);
  };

  if (!operators || operators.length === 0) {
    return <NoData height="400px" />;
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          width: "100%",
          gap: isExpanded ? "32px" : "0",
          transition: "gap 0.5s ease",
        }}
      >
        {/* ═══ LEFT: Main Operator Funnel ═══ */}
        <div
          style={{
            flex: isExpanded ? "1 1 50%" : "1 1 100%",
            maxWidth: isExpanded ? "50%" : "100%",
            transition: "all 0.5s ease",
          }}
        >
          <AmFunnel
            items={mainItems.map((item) => ({
              ...item,
              name: item.operator_name || item.name,
            }))}
            chartId="main-operators"
            height={isExpanded ? 360 : 420}
            onSliceClick={handleClick}
          />
        </div>

        {/* ═══ RIGHT: Detail Stage Funnel ═══ */}
        {isExpanded && (
          <div
            style={{
              flex: "1 1 50%",
              maxWidth: "50%",
              animation: "fadeInSlide 0.5s ease",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "12px",
                fontSize: "14px",
                fontWeight: "700",
                color: themeColors.textPrimary,
              }}
            >
              <span
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "4px",
                  background: selectedOp?.color,
                  display: "inline-block",
                }}
              ></span>
              <span>{selectedOp?.name || selectedOp?.operator_name}</span>
              <span
                style={{
                  fontWeight: "400",
                  color: themeColors.textSecondary,
                  fontSize: "11px",
                }}
              >
                — bosqichlar
              </span>
              <button
                onClick={() => setSelectedIdx(null)}
                style={{
                  marginLeft: "auto",
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${themeColors.borderColor}`,
                  borderRadius: "8px",
                  color: themeColors.textSecondary,
                  cursor: "pointer",
                  fontSize: "14px",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                }}
                title="Yopish"
              >
                ✕
              </button>
            </div>

            {detailItems.length > 0 ? (
              <AmFunnel
                items={detailItems}
                chartId={`detail-${selectedIdx}`}
                height={340}
              />
            ) : (
              <NoData height="340px" />
            )}
          </div>
        )}
      </div>

      <div
        style={{
          textAlign: "center",
          padding: "10px 16px",
          color: themeColors.textSecondary,
          fontSize: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          opacity: 0.65,
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 16v-4"></path>
          <path d="M12 8h.01"></path>
        </svg>
        Operatorni ustiga bosing — bosqichlar bo'yicha taqsimotni ko'rasiz
      </div>

      <style>{`
                @keyframes fadeInSlide {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
    </div>
  );
};
