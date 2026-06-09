import React, { useState, useEffect, useMemo } from 'react';
import { leadService } from '../../services/leads';
import { AmBarChart, AmPieChart, AmAreaChart, AmComposedChart, NoData } from '../../components/AmCharts';
import FunnelChart from '../../components/FunnelChart';
import { OperatorFunnel } from '../../components/OperatorFunnelChart';
import * as am5 from '@amcharts/amcharts5';
import * as am5percent from '@amcharts/amcharts5/percent';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import am5themes_Dark from '@amcharts/amcharts5/themes/Dark';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#6366f1'];

// ── Theme hook ──
const useThemeColors = () => {
    const [colors, setColors] = useState({});
    useEffect(() => {
        const update = () => {
            const s = getComputedStyle(document.documentElement);
            setColors({
                textPrimary: s.getPropertyValue('--text-primary').trim() || '#0f172a',
                textSecondary: s.getPropertyValue('--text-secondary').trim() || '#64748b',
                bgSecondary: s.getPropertyValue('--bg-secondary').trim() || '#ffffff',
                borderColor: s.getPropertyValue('--border-color').trim() || '#e2e8f0',
            });
        };
        update();
        const obs = new MutationObserver(update);
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => obs.disconnect();
    }, []);
    return colors;
};

// ── Themed Tooltip ──
const ThemedTooltip = ({ active, payload, label, themeColors }) => {
    if (!active || !payload || !payload.length) return null;
    return (
        <div style={{
            background: themeColors.bgSecondary, border: `1px solid ${themeColors.borderColor}`,
            borderRadius: '10px', padding: '10px 14px', fontSize: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)', color: themeColors.textPrimary,
        }}>
            <div style={{ fontWeight: '700', marginBottom: '4px' }}>{label}</div>
            {payload.map((entry, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: entry.color, display: 'inline-block' }}></span>
                    <span style={{ color: themeColors.textSecondary }}>{entry.name}:</span>
                    <span style={{ fontWeight: '600' }}>{entry.value}</span>
                </div>
            ))}
        </div>
    );
};


// Using shared OperatorFunnel from components


// ═══════════════════════════════════════════════
//  LeadsStatistics Main Component
// ═══════════════════════════════════════════════
const LeadsStatistics = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const themeColors = useThemeColors();

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await leadService.getStatistics();
            setData(res.data);
        } catch (error) {
            console.error('Statistics error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="leads-statistics">
                <div className="loading-state"><div className="spinner"></div></div>
            </div>
        );
    }

    if (!data) return null;


    return (
        <div className="leads-statistics">
            {/* Summary Cards */}
            <div className="stats-summary">
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>
                    <div className="stat-info">
                        <span className="stat-title">Jami leadlar</span>
                        <span className="stat-value">{data.total || 0}</span>
                    </div>
                    <div className="stat-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </div>
                </div>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
                    <div className="stat-info">
                        <span className="stat-title">Bugun</span>
                        <span className="stat-value">{data.today || 0}</span>
                    </div>
                    <div className="stat-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </div>
                </div>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                    <div className="stat-info">
                        <span className="stat-title">Aylangan</span>
                        <span className="stat-value">{data.converted || 0}</span>
                    </div>
                    <div className="stat-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 3h5v5"></path>
                            <path d="M8 21H3v-5"></path>
                            <path d="M21 3l-7 7"></path>
                            <path d="M3 21l7-7"></path>
                        </svg>
                    </div>
                </div>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                    <div className="stat-info">
                        <span className="stat-title">Javob berdi</span>
                        <span className="stat-value">{data.answered || 0}</span>
                    </div>
                    <div className="stat-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"></path>
                        </svg>
                    </div>
                </div>
            </div>

            {/* Conversion Funnel */}
            {data.conversion_funnel && data.conversion_funnel.some(d => d.count > 0) && (
                <div className="chart-card" style={{ marginBottom: '20px' }}>
                    <div className="chart-card-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="22 3 2 3 10 12 10 19 14 21 14 12 22 3"></polygon>
                        </svg>
                        Lead konversiya varonkasi
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                        <FunnelChart
                            items={data.conversion_funnel}
                            height={350}
                        />
                    </div>
                </div>
            )}

            {/* Charts Grid */}
            <div className="chart-grid">
                {/* By Stage */}
                {data.by_stage && data.by_stage.length > 0 && (
                    <div className="chart-card">
                        <div className="chart-card-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="20" x2="18" y2="10"></line>
                                <line x1="12" y1="20" x2="12" y2="4"></line>
                                <line x1="6" y1="20" x2="6" y2="14"></line>
                            </svg>
                            Bosqichlar bo'yicha
                        </div>
                        <div className="chart-wrapper">
                            <AmBarChart
                                data={data.by_stage}
                                xField="name"
                                yField="count"
                                height={300}
                                color="#6366f1"
                                tooltipFormatter="{categoryX}: {valueY} ta"
                            />
                        </div>
                    </div>
                )}

                {/* By Status */}
                {data.by_status && data.by_status.length > 0 && (
                    <div className="chart-card">
                        <div className="chart-card-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6"></path>
                            </svg>
                            Holat bo'yicha
                        </div>
                        <div className="chart-wrapper">
                            <AmPieChart
                                data={data.by_status}
                                nameField="name"
                                valueField="count"
                                height={300}
                                innerRadius={45}
                            />
                        </div>
                    </div>
                )}

                {/* ═══ Operator Conversion Funnel ═══ */}
                {data.by_operator && data.by_operator.length > 0 && (
                    <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
                        <div className="chart-card-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            Operatorlar bo'yicha
                        </div>
                        <OperatorFunnel
                            operators={data.by_operator}
                            operatorFunnel={data.operator_funnel}
                            stages={data.stages}
                            themeColors={themeColors}
                        />
                    </div>
                )}
            </div>

            {/* ═══ NEW: Manbalar + Formalar ═══ */}
            <div className="chart-grid">
                {/* Manbalar Pie Chart */}
                {data.by_source && data.by_source.length > 0 && (
                    <div className="chart-card">
                        <div className="chart-card-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9"></path>
                            </svg>
                            Manbalar samaradorligi
                        </div>
                        <div className="chart-wrapper">
                            <AmPieChart
                                data={data.by_source}
                                nameField="name"
                                valueField="count"
                                height={300}
                                innerRadius={50}
                            />
                        </div>
                    </div>
                )}

                {/* Formalar bo'yicha */}
                {data.by_form && data.by_form.length > 0 && (
                    <div className="chart-card">
                        <div className="chart-card-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                            Formalar bo'yicha
                        </div>
                        <div className="chart-wrapper">
                            <AmBarChart
                                data={data.by_form}
                                xField="name"
                                yField="count"
                                height={300}
                                color="#8b5cf6"
                                tooltipFormatter="{categoryX}: {valueY} ta"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* ═══ Operator Konversiya Reytingi ═══ */}
            {data.operator_conversion && data.operator_conversion.length > 0 && (
                <div className="chart-card" style={{ marginBottom: '20px' }}>
                    <div className="chart-card-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
                            <circle cx="8.5" cy="7" r="4"></circle>
                            <polyline points="17 11 19 13 23 9"></polyline>
                        </svg>
                        Operatorlar konversiya reytingi
                    </div>
                    <div className="chart-wrapper">
                        <AmComposedChart
                            data={data.operator_conversion}
                            xField="name"
                            barFields={[
                                { field: 'total', name: 'Jami leadlar', color: '#6366f1' },
                                { field: 'converted', name: 'Mijozga aylangan', color: '#10b981' },
                            ]}
                            lineField={{ field: 'rate', name: 'Konversiya %', color: '#f59e0b' }}
                            height={350}
                        />
                    </div>
                </div>
            )}

            {/* ═══ Haftalik Trend ═══ */}
            {data.weekly_trend && data.weekly_trend.length > 0 && (
                <div className="chart-card" style={{ marginBottom: '20px' }}>
                    <div className="chart-card-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                        Lead trend (oxirgi 12 hafta)
                    </div>
                    <div className="chart-wrapper">
                        <AmAreaChart
                            data={data.weekly_trend}
                            xField="date"
                            yField="count"
                            height={320}
                            color="#6366f1"
                            tooltipText="{categoryX}: {valueY} ta lead"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeadsStatistics;
