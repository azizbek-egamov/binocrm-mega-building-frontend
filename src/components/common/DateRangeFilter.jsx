import { useState, useEffect, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import { 
    CalendarIcon, 
    RotateCcwIcon,
    ArrowRightIcon,
    ChevronRightIcon,
    FilterIcon,
    CheckIcon
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { uz } from 'date-fns/locale';
import './DateRangeFilter.css';
import 'react-day-picker/dist/style.css';

const DateRangeFilter = ({ onFilter, initialRange = { start: '', end: '' } }) => {
    const [range, setRange] = useState({
        from: initialRange.start ? new Date(initialRange.start) : undefined,
        to: initialRange.end ? new Date(initialRange.end) : undefined
    });
    const [activePreset, setActivePreset] = useState('custom');
    const [isShaking, setIsShaking] = useState(false);

    const triggerShake = () => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
    };

    const presets = useMemo(() => [
        { id: 'today', label: 'Bugun', getRange: () => ({ from: new Date(), to: new Date() }) },
        { id: 'yesterday', label: 'Kecha', getRange: () => ({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) }) },
        { id: 'last3', label: '3 kun', getRange: () => ({ from: subDays(new Date(), 3), to: new Date() }) },
        { id: 'last7', label: '7 kun', getRange: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
        { id: 'thisMonth', label: 'Shu oy', getRange: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
        { id: 'thisYear', label: 'Shu yil', getRange: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) }
    ], []);

    useEffect(() => {
        if (initialRange.start && initialRange.end) {
            setRange({
                from: new Date(initialRange.start),
                to: new Date(initialRange.end)
            });
        }
    }, [initialRange]);

    const handlePresetSelect = (preset) => {
        setActivePreset(preset.id);
        const newRange = preset.getRange();
        setRange(newRange);
        if (newRange.from && newRange.to) {
            onFilter({
                start: format(newRange.from, 'yyyy-MM-dd'),
                end: format(newRange.to, 'yyyy-MM-dd')
            });
        }
    };

    const handleApply = () => {
        onFilter({
            start: range.from ? format(range.from, 'yyyy-MM-dd') : '',
            end: range.to ? format(range.to, 'yyyy-MM-dd') : ''
        });
    };

    const handleReset = () => {
        setRange({ from: undefined, to: undefined });
        setActivePreset('custom');
        onFilter({ start: '', end: '' });
    };

    return (
        <aside className="date-filter-sidebar">
            <header className="sidebar-filter-header">
                <h3>
                    <FilterIcon size={20} strokeWidth={2.5} />
                    Sana filtri
                </h3>
            </header>

            <div className="sidebar-filter-content">
                <div className="premium-range-inputs">
                    <div className={`premium-field ${range.from ? 'active' : ''}`} onClick={triggerShake}>
                        <label>Dan</label>
                        <div className="premium-field-inner">
                            <CalendarIcon size={16} />
                            <input 
                                type="text" 
                                readOnly 
                                value={range.from ? format(range.from, 'dd MMM, yyyy', { locale: uz }) : ''} 
                                placeholder="Sana tanlang"
                            />
                        </div>
                    </div>
                    <div className={`premium-field ${range.to ? 'active' : ''}`} onClick={triggerShake}>
                        <label>Gacha</label>
                        <div className="premium-field-inner">
                            <CalendarIcon size={16} />
                            <input 
                                type="text" 
                                readOnly 
                                value={range.to ? format(range.to, 'dd MMM, yyyy', { locale: uz }) : ''} 
                                placeholder="Sana tanlang"
                            />
                        </div>
                    </div>
                </div>

                <div className={`premium-calendar-container ${isShaking ? 'shake' : ''}`}>
                    <DayPicker
                        mode="range"
                        selected={range}
                        onSelect={(newRange) => {
                            setRange(newRange || { from: undefined, to: undefined });
                            setActivePreset('custom');
                        }}
                        locale={uz}
                        showOutsideDays
                    />
                </div>

                <div className="premium-presets">
                    {presets.map(preset => (
                        <button
                            key={preset.id}
                            className={`preset-chip ${activePreset === preset.id ? 'active' : ''}`}
                            onClick={() => handlePresetSelect(preset)}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </div>

            <footer className="sidebar-actions">
                <button className="btn-reset-premium" onClick={handleReset} title="Tozalash">
                    <RotateCcwIcon size={20} />
                </button>
                <button className="btn-apply-premium" onClick={handleApply}>
                    <span>Filtrlash</span>
                    <ChevronRightIcon size={18} strokeWidth={3} />
                </button>
            </footer>
        </aside>
    );
};

export default DateRangeFilter;
