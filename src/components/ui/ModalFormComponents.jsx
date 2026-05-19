'use client';

import React from 'react';

export const ModalFormGrid = ({ children, columns = 2 }) => (
    <div
        style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '16px',
            marginBottom: '20px'
        }}
    >
        {children}
    </div>
);

export const ModalFormRow = ({ children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {children}
    </div>
);

export const FormField = ({ label, required, children, fullWidth = false, error }) => (
    <div
        className="form-group"
        style={{ gridColumn: fullWidth ? '1 / -1' : 'auto' }}
    >
        {label && (
            <label>
                {label}
                {required && <span className="required">*</span>}
            </label>
        )}
        {children}
        {error && (
            <small style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>
                {error}
            </small>
        )}
    </div>
);

export const InfoDisplay = ({ items, label }) => (
    <div style={{ marginBottom: '20px', padding: '0' }}>
        {label && <div className="section-title">{label}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map((item, idx) => (
                <div key={idx} className="modal-info-row" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <span>{item.label}</span>
                    <strong style={{ color: item.color || 'var(--text-primary)' }}>
                        {item.value}
                    </strong>
                </div>
            ))}
        </div>
    </div>
);

export const InfoNote = ({ type = 'info', children }) => {
    const variantClass = type === 'warning' ? 'warning' : type === 'danger' ? 'danger' : type === 'success' ? 'success' : '';
    return (
        <div className={`modal-info-note ${variantClass}`} style={{ marginBottom: '20px' }}>
            {children}
        </div>
    );
};

export const PriceInput = ({ value, onChange, placeholder = 'Summa kiriting', name }) => (
    <div style={{ display: 'flex', alignItems: 'center', border: '2px solid var(--border-color)', borderRadius: '10px', padding: '0 12px', background: 'var(--bg-tertiary)', transition: 'all 0.3s ease' }}>
        <input
            type="text"
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                padding: '12px 0',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontFamily: 'inherit'
            }}
        />
        <span style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '13px', whiteSpace: 'nowrap' }}>
            so'm
        </span>
    </div>
);
