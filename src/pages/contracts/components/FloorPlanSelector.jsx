import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../services/api';
import { toast } from 'sonner';

const APT_COLORS = ['#ff6a6a', '#83aefe', '#ff952b', '#6464ff', '#50ab5b', '#a78bfa', '#fb7185', '#38bdf8'];
const STATUS_COLORS = {
  AVAILABLE: null,
  BOOKED: '#f59e0b',
  SOLD: '#ef4444',
  UNAVAILABLE: '#64748b',
};
// 1-2 qavatlar uchun (10 ta xonadon)
const COLOR_ORDER_FLOOR12  = ['#6464ff', '#50ab5b', '#ff6a6a', '#83aefe', '#ff952b', '#6464ff', '#50ab5b', '#ff6a6a', '#83aefe', '#ff952b'];
// 3-7 qavatlar uchun (har bir padezda 6 tadan xonadon)
const COLOR_ORDER_LEFT     = ['#6464ff', '#50ab5b', '#ff6a6a', '#6464ff', '#50ab5b', '#ff6a6a'];
const COLOR_ORDER_RIGHT    = ['#83aefe', '#50ab5b', '#ff952b', '#83aefe', '#50ab5b', '#ff952b'];

function parseFill(el) {
  const f = el.getAttribute('fill');
  if (!f || f === 'none' || f.startsWith('url')) return null;
  return f.toLowerCase();
}
function isAptColor(fill) { return fill && APT_COLORS.includes(fill); }

function getElementCenter(el) {
  try {
    const bb = el.getBBox();
    const cx = bb.x + bb.width / 2;
    const cy = bb.y + bb.height / 2;
    const tr = el.getAttribute('transform');
    if (!tr) return { x: cx, y: cy };
    const m = tr.match(/matrix\(\s*([^)]+)\s*\)/);
    if (!m) return { x: cx, y: cy };
    const p = m[1].split(/[\s,]+/).map(Number);
    if (p.length < 6) return { x: cx, y: cy };
    return { x: p[0]*cx + p[2]*cy + p[4], y: p[1]*cx + p[3]*cy + p[5] };
  } catch { return null; }
}

const FloorPlanSelector = ({ buildingId, onSelect, selectedHomeId, contractedHomeId, onHomeHover, onHomeLeave }) => {
  const [planData, setPlanData]       = useState(null);
  const [loading, setLoading]         = useState(false);
  const [svgContent, setSvgContent]   = useState('');
  const [svgReady, setSvgReady]       = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [selectedPadez, setSelectedPadez] = useState(1);
  const [showTooltip, setShowTooltip] = useState(false);
  const showTooltipRef = useRef(false);

  useEffect(() => {
    showTooltipRef.current = showTooltip;
  }, [showTooltip]);

  const selectedHomeIdRef = useRef(selectedHomeId);
  useEffect(() => {
    selectedHomeIdRef.current = selectedHomeId;
  }, [selectedHomeId]);

  const contractedHomeIdRef = useRef(contractedHomeId);
  useEffect(() => {
    contractedHomeIdRef.current = contractedHomeId;
  }, [contractedHomeId]);

  const svgWrapRef       = useRef(null);
  const containerRef     = useRef(null);
  const scaleRef         = useRef(1);
  const txRef            = useRef(0);
  const tyRef            = useRef(0);
  const dragRef          = useRef({ active: false, sx: 0, sy: 0, stx: 0, sty: 0 });
  const hoveredGroupRef  = useRef(null);
  const hoverTimeoutRef  = useRef(null);
  const userClickedRef   = useRef(false);
  const lastNavigatedHomeIdRef = useRef(null);

  const applyTransform = useCallback(() => {
    if (svgWrapRef.current) {
      svgWrapRef.current.style.transform = `translate(${txRef.current}px, ${tyRef.current}px) scale(${scaleRef.current})`;
    }
  }, []);

  const loadFloorPlan = useCallback(async (floor) => {
    if (!buildingId) return;
    setLoading(true);
    setSvgReady(false);
    setSvgContent('');
    setPlanData(null);

    try {
      const res = await api.get('/floor-plans/', { params: { building_id: buildingId, floor } });
      const data = res.data;
      setPlanData(data);
      if (data.has_plan) {
        const svgRes = await api.get('/floor-plans/svg/', {
          params: { building_id: buildingId, floor },
          responseType: 'text',
          headers: { Accept: 'image/svg+xml, text/plain, */*' },
          transformResponse: [(d) => d],
        });
        let cleaned = svgRes.data
          .replace(/<filter[\s\S]*?<\/filter>/gi, '')
          .replace(/filter="url\(.*?\)"/gi, '')
          .replace(/filter:.*?;/gi, '');
        setSvgContent(cleaned);
      }
      // Qavat o'zgarganda zoomni reset qilamiz
      scaleRef.current = 1; txRef.current = 0; tyRef.current = 0;
      applyTransform();
    } catch (err) {
      toast.error('Qavat rejasi yuklanmadi');
    } finally {
      setLoading(false);
    }
  }, [buildingId, applyTransform]);

  useEffect(() => { if (buildingId) loadFloorPlan(selectedFloor); }, [buildingId, selectedFloor, loadFloorPlan]);

  // Tanlangan xonadon bor bo'lsa, avtomatik uning qavati va padeziga o'tish
  useEffect(() => {
    if (!selectedHomeId) {
      lastNavigatedHomeIdRef.current = null;
      return;
    }

    if (selectedHomeId && buildingId) {
      if (lastNavigatedHomeIdRef.current === selectedHomeId) {
        return;
      }
      // Agar foydalanuvchi o'zi kliklagan bo'lsa, avtomatik o'tish shart emas
      if (userClickedRef.current) {
        userClickedRef.current = false;
        lastNavigatedHomeIdRef.current = selectedHomeId;
        return;
      }
      api.get(`/homes/${selectedHomeId}/`).then(res => {
        const home = res.data;
        if (home && home.building === Number(buildingId)) {
          lastNavigatedHomeIdRef.current = selectedHomeId;
          if (Number(home.floor) !== selectedFloor || Number(home.padez) !== selectedPadez) {
            setSvgReady(false);
            setSelectedFloor(Number(home.floor));
            setSelectedPadez(Number(home.padez));
          }
        }
      }).catch(err => console.error("Error fetching selected home:", err));
    }
  }, [selectedHomeId, buildingId, selectedFloor, selectedPadez]);

  // Zoom-to-cursor logic
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onWheel = (e) => {
      e.preventDefault(); e.stopPropagation();
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const zoomFactor = e.deltaY > 0 ? 0.85 : 1.15;
      const oldScale = scaleRef.current;
      const newScale = Math.min(Math.max(oldScale * zoomFactor, 0.25), 10);
      if (newScale === oldScale) return;
      txRef.current = mouseX - (mouseX - txRef.current) * (newScale / oldScale);
      tyRef.current = mouseY - (mouseY - tyRef.current) * (newScale / oldScale);
      scaleRef.current = newScale;
      applyTransform();
    };
    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, [applyTransform]);

  // SVG-ni chizish va elementlarni bog'lash
  useEffect(() => {
    if (!svgContent || !planData || !svgWrapRef.current) return;
    const wrap = svgWrapRef.current;
    wrap.innerHTML = svgContent;
    const svg = wrap.querySelector('svg');
    if (!svg) return;

    svg.style.width = '100%'; svg.style.height = '100%'; svg.style.display = 'block';
    svg.style.shapeRendering = 'geometricPrecision'; svg.style.textRendering = 'optimizeLegibility';

    const svgWidth  = svg.viewBox?.baseVal?.width || 1190;
    const svgCenterX = svgWidth / 2;
    const coloredEls = [];
    svg.querySelectorAll('path, rect, polygon').forEach(el => {
      const fill = parseFill(el);
      if (!fill || !isAptColor(fill)) return;
      const center = getElementCenter(el);
      if (center) coloredEls.push({ el, fill, center });
    });

    const floorNum = Number(selectedFloor);
    const padezNum = Number(selectedPadez);

    if (floorNum <= 2) {
      // 1-2 qavatlar uchun (har bir qavat/padezda 5 tadan xonadon)
      // Har bir padez alohida SVGda ko'rsatiladi (fayl takroran ishlatiladi)
      const currentPadezHomes = planData.homes.filter(h => h.padez === padezNum).sort((a, b) => +a.number - +b.number);
      const colorOrder = ['#6464ff', '#50ab5b', '#ff6a6a', '#83aefe', '#ff952b'];
      mapElements(coloredEls, currentPadezHomes, colorOrder);
    } else {
      // 3-7 qavatlar uchun (har bir padezda 6 tadan xonadon)
      const N = 11 + 6 * (floorNum - 3);

      if (padezNum === 1) {
        // Padez 1 tanlanganda:
        // Chap tomon: uylar [N, N+1, N+2] (masalan, Floor 3 da 11, 12, 13)
        const leftHomes = planData.homes.filter(h => h.padez === 1 && [N, N + 1, N + 2].includes(Number(h.number))).sort((a, b) => +a.number - +b.number);
        const leftColorOrder = ['#6464ff', '#50ab5b', '#ff6a6a'];
        mapElements(coloredEls.filter(e => e.center.x < svgCenterX), leftHomes, leftColorOrder);

        // O'ng tomon: uylar [N+3, N+4, N+5] (masalan, Floor 3 da 14, 15, 16)
        const rightHomes = planData.homes.filter(h => h.padez === 1 && [N + 3, N + 4, N + 5].includes(Number(h.number))).sort((a, b) => +a.number - +b.number);
        const rightColorOrder = ['#83aefe', '#ff952b', '#50ab5b'];
        mapElements(coloredEls.filter(e => e.center.x >= svgCenterX), rightHomes, rightColorOrder);
      } else {
        // Padez 2 tanlanganda:
        // Chap tomon: uylar [N, N+1, N+3] (masalan, Floor 3 da 11, 12, 14)
        const leftHomes = planData.homes.filter(h => h.padez === 2 && [N, N + 1, N + 3].includes(Number(h.number))).sort((a, b) => +a.number - +b.number);
        const leftColorOrder = ['#6464ff', '#50ab5b', '#ff6a6a'];
        mapElements(coloredEls.filter(e => e.center.x < svgCenterX), leftHomes, leftColorOrder);

        // O'ng tomon: uylar [N+2, N+4, N+5] (masalan, Floor 3 da 13, 15, 16)
        const rightHomes = planData.homes.filter(h => h.padez === 2 && [N + 2, N + 4, N + 5].includes(Number(h.number))).sort((a, b) => +a.number - +b.number);
        const rightColorOrder = ['#83aefe', '#ff952b', '#50ab5b'];
        mapElements(coloredEls.filter(e => e.center.x >= svgCenterX), rightHomes, rightColorOrder);
      }
    }

    svg.querySelectorAll('text').forEach(t => {
      const fillAttr = (t.getAttribute('fill') || '').toLowerCase();
      
      if (fillAttr === '#d90005' || (t.getAttribute('font-weight') === 'bold' && t.getAttribute('font-style') === 'italic')) {
        t.style.display = 'none';
      } else {
        // Oq matn + Qora chegara (outline) - Universal yechim
        t.style.fill = '#ffffff'; 
        t.setAttribute('fill', '#ffffff');
        t.style.fontWeight = '800';
        t.style.paintOrder = 'stroke fill';
        t.style.stroke = '#000000';
        t.style.strokeWidth = '0.5px';
        t.style.strokeOpacity = '0.9';
      }
    });

    bindEventsAndBadges(svg);

    // Tanlangan va asl uylar dastlabki renderdayoq ranglansin (miltillashni yo'qotish uchun)
    svg.querySelectorAll('[data-home-id]').forEach(el => {
      const home = el.__home;
      if (!home) return;
      const isSel = String(home.id) === String(selectedHomeIdRef.current);
      const isOrig = contractedHomeIdRef.current && String(home.id) === String(contractedHomeIdRef.current);
      
      let statusColor = null;
      if (isOrig) {
        statusColor = '#7c3aed';
      } else if (isSel) {
        statusColor = '#6366f1';
      } else {
        statusColor = STATUS_COLORS[home.status];
      }
      
      if (statusColor) {
        el.style.fill = statusColor;
        el.setAttribute('fill', statusColor);
      } else {
        el.style.fill = '';
        el.setAttribute('fill', el.__originalFill || '');
      }
      
      if (isOrig && isSel) {
        el.classList.remove('fp-selected-apt');
        el.classList.remove('fp-original-apt');
        el.classList.add('fp-original-selected-apt');
        el.style.fillOpacity = '';
        el.style.stroke = '';
        el.style.strokeWidth = '';
      } else if (isSel) {
        el.classList.add('fp-selected-apt');
        el.classList.remove('fp-original-apt');
        el.classList.remove('fp-original-selected-apt');
        el.style.fillOpacity = '';
        el.style.stroke = '';
        el.style.strokeWidth = '';
      } else if (isOrig) {
        el.classList.remove('fp-selected-apt');
        el.classList.add('fp-original-apt');
        el.classList.remove('fp-original-selected-apt');
        el.style.fillOpacity = '';
        el.style.stroke = '';
        el.style.strokeWidth = '';
      } else {
        el.classList.remove('fp-selected-apt');
        el.classList.remove('fp-original-apt');
        el.classList.remove('fp-original-selected-apt');
        el.style.fillOpacity = (home.status === 'AVAILABLE' || home.status === 'available') ? '0.5' : '';
        el.style.stroke = '';
        el.style.strokeWidth = '';
      }
    });

    setSvgReady(true);
    // DIQQAT: selectedHomeId o'zgarganda zoomni reset qilmaslik uchun bu useEffect-ni ehtiyotkorlik bilan ishlatamiz
  }, [svgContent, planData, selectedFloor, selectedPadez]); // selectedHomeId-ni bu yerdan olib tashladik!

  // Xonadon tanlanganda faqat ranglarni yangilash (zoomni buzmasdan)
  useEffect(() => {
    if (!svgReady || !svgWrapRef.current) return;
    const svg = svgWrapRef.current.querySelector('svg');
    if (!svg) return;

    svg.querySelectorAll('[data-home-id]').forEach(el => {
      const home = el.__home;
      if (!home) return;
      const isSelected = String(home.id) === String(selectedHomeId);
      const isOriginal = contractedHomeId && String(home.id) === String(contractedHomeId);
      
      let statusColor = null;
      if (isOriginal) {
        statusColor = '#7c3aed';
      } else if (isSelected) {
        statusColor = '#6366f1';
      } else {
        statusColor = STATUS_COLORS[home.status];
      }
      
      if (statusColor) {
        el.style.fill = statusColor; // Inline style eng yuqori priority
        el.setAttribute('fill', statusColor);
      } else {
        el.style.fill = ''; // CSS dagi holatga qaytish
        el.setAttribute('fill', el.__originalFill || '');
      }
      
      if (isOriginal && isSelected) {
        el.classList.remove('fp-selected-apt');
        el.classList.remove('fp-original-apt');
        el.classList.add('fp-original-selected-apt');
        el.style.fillOpacity = '';
        el.style.stroke = '';
        el.style.strokeWidth = '';
      } else if (isSelected) {
        el.classList.add('fp-selected-apt');
        el.classList.remove('fp-original-apt');
        el.classList.remove('fp-original-selected-apt');
        el.style.fillOpacity = '';
        el.style.stroke = '';
        el.style.strokeWidth = '';
      } else if (isOriginal) {
        el.classList.remove('fp-selected-apt');
        el.classList.add('fp-original-apt');
        el.classList.remove('fp-original-selected-apt');
        el.style.fillOpacity = '';
        el.style.stroke = '';
        el.style.strokeWidth = '';
      } else {
        el.classList.remove('fp-selected-apt');
        el.classList.remove('fp-original-apt');
        el.classList.remove('fp-original-selected-apt');
        el.style.fillOpacity = (home.status === 'AVAILABLE' || home.status === 'available') ? '0.5' : '';
        el.style.stroke = '';
        el.style.strokeWidth = '';
      }

      const isClickable = home.status === 'AVAILABLE' || isSelected || isOriginal;
      el.style.cursor = isClickable ? 'pointer' : 'not-allowed';
    });
  }, [selectedHomeId, contractedHomeId, svgReady]);

  function mapElements(elements, homes, colorOrder) {
    if (!elements.length || !homes.length) return;
    
    // Har bir rang uchun elementlarni guruhlaymiz
    const byColor = {};
    elements.forEach(e => { 
      if (!byColor[e.fill]) byColor[e.fill] = []; 
      byColor[e.fill].push(e); 
    });

    // ColorOrder bo'yicha har bir rang uchun navbatdagi uyni bog'laymiz
    let homeIdx = 0;
    colorOrder.forEach(targetColor => {
      if (homeIdx >= homes.length) return;
      const elementsWithColor = byColor[targetColor];
      if (elementsWithColor && elementsWithColor.length > 0) {
        const home = homes[homeIdx++];
        // Bu rangdagi BARCHA elementlarni shu uyga bog'laymiz (bir nechta path bo'lishi mumkin)
        elementsWithColor.forEach(({ el }) => {
          el.__originalFill = targetColor;
          setupElement(el, home);
        });
        // Shu rangni ishlatib bo'ldik, keyingi safar boshqa elementlar uchun
        delete byColor[targetColor]; 
      }
    });

    // Agar hali ham uylar qolgan bo'lsa, qolgan rangli elementlarni ketma-ket bog'laymiz
    if (homeIdx < homes.length) {
      Object.keys(byColor).forEach(color => {
        if (homeIdx >= homes.length) return;
        const home = homes[homeIdx++];
        byColor[color].forEach(({ el }) => {
          el.__originalFill = color;
          setupElement(el, home);
        });
        delete byColor[color];
      });
    }
  }

  function setupElement(el, home) {
    el.classList.add('fp-apt-path');
    el.dataset.homeId = home.id; el.dataset.status = home.status; el.__home = home;
    const isSelected = String(home.id) === String(selectedHomeIdRef.current);
    const isOriginal = contractedHomeIdRef.current && String(home.id) === String(contractedHomeIdRef.current);
    
    if (isOriginal && isSelected) {
      el.classList.remove('fp-selected-apt');
      el.classList.remove('fp-original-apt');
      el.classList.add('fp-original-selected-apt');
    } else if (isSelected) {
      el.classList.add('fp-selected-apt');
      el.classList.remove('fp-original-apt');
      el.classList.remove('fp-original-selected-apt');
    } else if (isOriginal) {
      el.classList.remove('fp-selected-apt');
      el.classList.add('fp-original-apt');
      el.classList.remove('fp-original-selected-apt');
    } else {
      el.classList.remove('fp-selected-apt');
      el.classList.remove('fp-original-apt');
      el.classList.remove('fp-original-selected-apt');
    }

    let statusColor = null;
    if (isOriginal) {
      statusColor = '#7c3aed';
    } else if (isSelected) {
      statusColor = '#6366f1';
    } else {
      statusColor = STATUS_COLORS[home.status];
    }
    if (statusColor) el.setAttribute('fill', statusColor);
    
    el.style.fillOpacity = (isSelected || isOriginal) ? '' : '0.5';
    el.style.stroke = '';
    el.style.strokeWidth = '';
    
    const isClickable = home.status === 'AVAILABLE' || 
                        String(home.id) === String(selectedHomeIdRef.current) || 
                        (contractedHomeIdRef.current && String(home.id) === String(contractedHomeIdRef.current));
    el.style.cursor = isClickable ? 'pointer' : 'not-allowed';
    el.style.pointerEvents = 'fill';
  }

  function bindEventsAndBadges(svg) {
    const aptGroups = {};
    svg.querySelectorAll('[data-home-id]').forEach(el => {
      const id = el.dataset.homeId;
      if (!aptGroups[id]) aptGroups[id] = [];
      aptGroups[id].push(el);
    });
    Object.entries(aptGroups).forEach(([id, els]) => {
      const home = els[0].__home;
      els.forEach(el => {
        el.addEventListener('mouseenter', (e) => {
          if (hoveredGroupRef.current?.aptId === id) return;
          clearHover();
          hoveredGroupRef.current = { aptId: id, els };
          els.forEach(e => {
            e.style.fillOpacity = '0.85';
            e.style.stroke = '#111827';
            e.style.strokeWidth = '2';
          });
          if (showTooltipRef.current && onHomeHover) onHomeHover(e, home);
        });
        el.addEventListener('mousemove', (e) => {
          if (showTooltipRef.current && onHomeHover) onHomeHover(e, home);
        });
        el.addEventListener('mouseleave', (e) => {
          const toEl = e.relatedTarget;
          if (toEl && toEl.dataset?.homeId === id) return;
          clearHover();
          if (onHomeLeave) onHomeLeave();
        });
        el.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const isClickable = home.status === 'AVAILABLE' || 
                              String(home.id) === String(selectedHomeIdRef.current) || 
                              (contractedHomeIdRef.current && String(home.id) === String(contractedHomeIdRef.current));
          if (!isClickable) {
            toast.warning(home.status === 'SOLD' ? 'Bu uy sotilgan' : 'Bu uy band');
            return;
          }
          userClickedRef.current = true; // Mark as clicked by user
          onSelect({ ...home, price: parseFloat(home.price) || 0, square_meter: parseFloat(home.square_meter) || 0 });
        });
      });
      if (home.status === 'SOLD' || home.status === 'BOOKED') addStatusBadge(svg, els, home);
    });
    svg.addEventListener('mouseleave', () => {
      clearHover();
      if (onHomeLeave) onHomeLeave();
    });
  }

  function clearHover() {
    if (!svgWrapRef.current) return;
    const svg = svgWrapRef.current.querySelector('svg');
    if (!svg) return;

    svg.querySelectorAll('[data-home-id]').forEach(e => {
      const home = e.__home;
      if (!home) return;
      const isSel = String(home.id) === String(selectedHomeIdRef.current);
      const isOrig = contractedHomeIdRef.current && String(home.id) === String(contractedHomeIdRef.current);
      
      if (isOrig && isSel) {
        e.classList.remove('fp-selected-apt');
        e.classList.remove('fp-original-apt');
        e.classList.add('fp-original-selected-apt');
        e.style.fillOpacity = '';
        e.style.stroke = '';
        e.style.strokeWidth = '';
      } else if (isSel) {
        e.classList.add('fp-selected-apt');
        e.classList.remove('fp-original-apt');
        e.classList.remove('fp-original-selected-apt');
        e.style.fillOpacity = '';
        e.style.stroke = '';
        e.style.strokeWidth = '';
      } else if (isOrig) {
        e.classList.remove('fp-selected-apt');
        e.classList.add('fp-original-apt');
        e.classList.remove('fp-original-selected-apt');
        e.style.fillOpacity = '';
        e.style.stroke = '';
        e.style.strokeWidth = '';
      } else {
        e.classList.remove('fp-selected-apt');
        e.classList.remove('fp-original-apt');
        e.classList.remove('fp-original-selected-apt');
        e.style.fillOpacity = (home.status === 'AVAILABLE' || home.status === 'available') ? '0.5' : '';
        e.style.stroke = '';
        e.style.strokeWidth = '';
      }
    });
    hoveredGroupRef.current = null;
  }

  function addStatusBadge(svg, els, home) {
    let bestEl = null, bestArea = 0;
    els.forEach(el => { try { const bb = el.getBBox(); const a = bb.width*bb.height; if (a>bestArea){bestArea=a;bestEl=el;} } catch {} });
    if (!bestEl) return;
    const center = getElementCenter(bestEl);
    if (!center) return;
    const label = home.status === 'SOLD' ? 'SOTILGAN' : 'BAND';
    const bw = label === 'SOTILGAN' ? 72 : 52;
    const rect = document.createElementNS('http://www.w3.org/2000/svg','rect');
    rect.setAttribute('class', 'fp-status-badge-bg');
    rect.setAttribute('x', center.x - bw/2); rect.setAttribute('y', center.y - 10);
    rect.setAttribute('width', bw); rect.setAttribute('height', 20); rect.setAttribute('rx', 4);
    const bColor = home.status === 'SOLD' ? '#ef4444' : '#f59e0b';
    rect.style.fill = bColor;
    rect.setAttribute('fill', bColor);
    rect.style.fillOpacity = '1';
    rect.setAttribute('pointer-events','none');
    
    const text = document.createElementNS('http://www.w3.org/2000/svg','text');
    text.setAttribute('class', 'fp-status-badge-text');
    text.setAttribute('x', center.x); text.setAttribute('y', center.y);
    text.setAttribute('text-anchor','middle'); text.setAttribute('dominant-baseline','central');
    text.style.fill = '#ffffff';
    text.setAttribute('fill','#ffffff');
    text.style.fontSize = '11px';
    text.style.fontWeight = 'bold';
    text.setAttribute('pointer-events','none'); text.textContent = label;
    svg.appendChild(rect); svg.appendChild(text);
  }

  const handlePadezClick = (p) => {
    if (p !== selectedPadez) {
      setSvgReady(false);
      setSelectedPadez(p);
    }
  };

  const handleFloorClick = (f) => {
    if (f !== selectedFloor) {
      setSvgReady(false);
      setSelectedFloor(f);
    }
  };

  const resetView = () => { scaleRef.current=1; txRef.current=0; tyRef.current=0; applyTransform(); };

  return (
    <div className="fp-root fp-root--simple">
      <style>{`
        @keyframes fpMarchingAnts {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 12; }
        }
        @keyframes fpPulseGlow {
          0% {
            stroke: #00f0ff;
            stroke-width: 4px;
            filter: drop-shadow(0 0 2px rgba(0, 240, 255, 0.6));
          }
          50% {
            stroke: #a855f7;
            stroke-width: 7px;
            filter: drop-shadow(0 0 10px rgba(168, 85, 247, 0.95)) drop-shadow(0 0 4px rgba(0, 240, 255, 0.5));
          }
          100% {
            stroke: #00f0ff;
            stroke-width: 4px;
            filter: drop-shadow(0 0 2px rgba(0, 240, 255, 0.6));
          }
        }
         @keyframes fpPulseOriginal {
          0% {
            stroke: #7c3aed;
            stroke-width: 3.5px;
            filter: drop-shadow(0 0 1px rgba(124, 58, 237, 0.5));
          }
          50% {
            stroke: #5b21b6;
            stroke-width: 5px;
            filter: drop-shadow(0 0 6px rgba(124, 58, 237, 0.8));
          }
          100% {
            stroke: #7c3aed;
            stroke-width: 3.5px;
            filter: drop-shadow(0 0 1px rgba(124, 58, 237, 0.5));
          }
        }
        .fp-selected-apt {
          stroke-dasharray: 6, 3 !important;
          animation: fpMarchingAnts 0.8s linear infinite, fpPulseGlow 1.5s ease-in-out infinite !important;
          fill-opacity: 0.95 !important;
        }
        .fp-original-apt {
          stroke-dasharray: 4, 3 !important;
          animation: fpPulseOriginal 2s ease-in-out infinite !important;
          fill-opacity: 0.9 !important;
          cursor: pointer !important;
          pointer-events: auto !important;
        }
        .fp-original-selected-apt {
          stroke-dasharray: 6, 3 !important;
          animation: fpMarchingAnts 0.8s linear infinite, fpPulseOriginalSelected 1.5s ease-in-out infinite !important;
          fill-opacity: 0.95 !important;
          cursor: pointer !important;
          pointer-events: auto !important;
        }
        @keyframes fpPulseOriginalSelected {
          0% {
            stroke: #7c3aed;
            stroke-width: 4px;
            filter: drop-shadow(0 0 2px rgba(124, 58, 237, 0.6));
          }
          50% {
            stroke: #a78bfa;
            stroke-width: 7px;
            filter: drop-shadow(0 0 10px rgba(167, 139, 250, 0.95)) drop-shadow(0 0 4px rgba(124, 58, 237, 0.5));
          }
          100% {
            stroke: #7c3aed;
            stroke-width: 4px;
            filter: drop-shadow(0 0 2px rgba(124, 58, 237, 0.6));
          }
        }
      `}</style>
      <div className="fp-map-side">
        <div className="fp-controls-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <div className="fp-floor-tabs">
              <span className="fp-floor-label">Qavat:</span>
              <div className="fp-floors-scroll">
                {Array.from({ length: planData?.total_floors || 7 }, (_, i) => i + 1).map(f => (
                  <button key={f} className={`fp-floor-btn ${selectedFloor === f ? 'active' : ''}`} onClick={() => handleFloorClick(f)}>{f}</button>
                ))}
              </div>
            </div>
            <div className="fp-padez-tabs">
              <span className="fp-floor-label">Padez:</span>
              {[1, 2].map(p => (
                <button key={p} className={`fp-floor-btn ${selectedPadez === p ? 'active' : ''}`} onClick={() => handlePadezClick(p)}>{p}</button>
              ))}
            </div>
          </div>
          
          <div className="fp-tooltip-toggle-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="fp-floor-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Ma'lumotlar oynasi:</span>
            <label className="fp-switch" style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px' }}>
              <input 
                type="checkbox" 
                checked={showTooltip} 
                onChange={(e) => {
                  setShowTooltip(e.target.checked);
                  if (!e.target.checked && onHomeLeave) onHomeLeave();
                }}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span className="fp-slider" style={{
                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: showTooltip ? 'var(--primary-color, #6366f1)' : '#ccc',
                transition: '.3s', borderRadius: '24px'
              }}>
                <span className="fp-slider-button" style={{
                  position: 'absolute', content: '""', height: '18px', width: '18px', left: showTooltip ? '24px' : '4px', bottom: '3px',
                  backgroundColor: 'white', transition: '.3s', borderRadius: '50%',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }} />
              </span>
            </label>
          </div>
        </div>

        <div className="fp-legend-bar">
          <span className="fp-legend-title">Holat</span>
          <div className="fp-legend-item"><span className="fp-legend-dot" style={{background:'#51cf66'}} /> Bo'sh</div>
          <div className="fp-legend-item"><span className="fp-legend-dot" style={{background:'#fbbf24'}} /> Band</div>
          <div className="fp-legend-item"><span className="fp-legend-dot" style={{background:'#ef4444'}} /> Sotilgan</div>
          {contractedHomeId && (
            <div className="fp-legend-item"><span className="fp-legend-dot" style={{background:'#7c3aed', border:'2px dashed #5b21b6', borderRadius:'3px'}} /> Shartnomadagi uy (Asl)</div>
          )}
        </div>

        <div className="fp-map-container" ref={containerRef} onMouseDown={(e)=>{if(!e.target.closest('[data-home-id]'))dragRef.current={active:true,sx:e.clientX,sy:e.clientY,stx:txRef.current,sty:tyRef.current}}} onMouseMove={(e)=>{if(!dragRef.current.active)return;txRef.current=dragRef.current.stx+(e.clientX-dragRef.current.sx);tyRef.current=dragRef.current.sty+(e.clientY-dragRef.current.sy);applyTransform()}} onMouseUp={()=>dragRef.current.active=false} onMouseLeave={()=>dragRef.current.active=false} style={{ position: 'relative', minHeight: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {(loading || (planData?.has_plan && !svgReady)) && (
            <div className="loading-state" style={{ position: 'absolute', inset: 0, background: 'var(--bg-glass)', backdropFilter: 'blur(4px)', zIndex: 10, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
              <div className="spinner"></div>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Reja yuklanmoqda...</span>
            </div>
          )}
          {!loading && planData && !planData.has_plan && (
            <div className="empty-state" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center', zIndex: 5 }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="9" x2="15" y2="15" />
                <line x1="15" y1="9" x2="9" y2="15" />
              </svg>
              <p style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '16px', margin: 0 }}>Reja chizmasi mavjud emas</p>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', maxWidth: '320px', lineHeight: '1.5', margin: '6px 0 0 0' }}>
                Ushbu bino yoki qavat uchun interaktiv reja chizmasi yuklanmagan. Iltimos, xonadonni tanlash uchun <strong>Jadval ko'rinishi</strong> yoki <strong>Ro'yxat ko'rinishi</strong>dan foydalaning.
              </p>
            </div>
          )}
          <div ref={svgWrapRef} className="fp-svg-wrap" style={{ transformOrigin: '0 0', userSelect: 'none', display: (!loading && planData?.has_plan) ? 'block' : 'none' }} />
          {svgReady && !loading && planData?.has_plan && (
            <div className="fp-zoom-controls">
              <button className="fp-zoom-btn" onClick={()=>{const s=scaleRef.current;scaleRef.current=Math.min(s*1.25,10);txRef.current-=(containerRef.current.clientWidth/2)*(scaleRef.current/s-1);tyRef.current-=(containerRef.current.clientHeight/2)*(scaleRef.current/s-1);applyTransform()}}>+</button>
              <button className="fp-zoom-btn fp-zoom-reset" onClick={resetView}>↺</button>
              <button className="fp-zoom-btn" onClick={()=>{const s=scaleRef.current;scaleRef.current=Math.max(s*0.8,0.25);txRef.current-=(containerRef.current.clientWidth/2)*(scaleRef.current/s-1);tyRef.current-=(containerRef.current.clientHeight/2)*(scaleRef.current/s-1);applyTransform()}}>−</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FloorPlanSelector;
