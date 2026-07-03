import { useState, useEffect } from 'react';
import { RotateCcw, ChevronRight, Coins } from 'lucide-react';
import './AmountRangeFilter.css';

const AmountRangeFilter = ({ onFilter, initialRange = { min: '', max: '' } }) => {
    const [minVal, setMinVal] = useState(initialRange.min || '');
    const [maxVal, setMaxVal] = useState(initialRange.max || '');
    const [isFocusedMin, setIsFocusedMin] = useState(false);
    const [isFocusedMax, setIsFocusedMax] = useState(false);

    useEffect(() => {
        setMinVal(initialRange.min || '');
        setMaxVal(initialRange.max || '');
    }, [initialRange]);

    const formatDisplay = (val) => {
        if (!val) return '';
        return new Intl.NumberFormat('uz-UZ').format(val);
    };

    const handleMinChange = (e) => {
        const clean = e.target.value.replace(/\D/g, '');
        setMinVal(clean);
    };

    const handleMaxChange = (e) => {
        const clean = e.target.value.replace(/\D/g, '');
        setMaxVal(clean);
    };

    const handleApply = () => {
        onFilter({ min: minVal, max: maxVal });
    };

    const handleReset = () => {
        setMinVal('');
        setMaxVal('');
        onFilter({ min: '', max: '' });
    };

    return (
        <aside className="amount-filter-sidebar">
            <header className="sidebar-filter-header">
                <h3>
                    <Coins size={20} strokeWidth={2.5} />
                    Summa filtri
                </h3>
            </header>

            <div className="sidebar-filter-content">
                <div className="premium-range-inputs">
                    <div className={`premium-field ${minVal ? 'active' : ''} ${isFocusedMin ? 'focused' : ''}`}>
                        <label>Dan</label>
                        <div className="premium-field-inner">
                            <input 
                                type="text" 
                                value={formatDisplay(minVal)} 
                                onChange={handleMinChange}
                                onFocus={() => setIsFocusedMin(true)}
                                onBlur={() => setIsFocusedMin(false)}
                                placeholder="Min summa"
                            />
                            {minVal && <span className="currency-suffix">so'm</span>}
                        </div>
                    </div>
                    <div className={`premium-field ${maxVal ? 'active' : ''} ${isFocusedMax ? 'focused' : ''}`}>
                        <label>Gacha</label>
                        <div className="premium-field-inner">
                            <input 
                                type="text" 
                                value={formatDisplay(maxVal)} 
                                onChange={handleMaxChange}
                                onFocus={() => setIsFocusedMax(true)}
                                onBlur={() => setIsFocusedMax(false)}
                                placeholder="Max summa"
                            />
                            {maxVal && <span className="currency-suffix">so'm</span>}
                        </div>
                    </div>
                </div>
            </div>

            <footer className="sidebar-actions">
                <button className="btn-reset-premium" onClick={handleReset} title="Tozalash">
                    <RotateCcw size={20} />
                </button>
                <button className="btn-apply-premium" onClick={handleApply}>
                    <span>Filtrlash</span>
                    <ChevronRight size={18} strokeWidth={3} />
                </button>
            </footer>
        </aside>
    );
};

export default AmountRangeFilter;
