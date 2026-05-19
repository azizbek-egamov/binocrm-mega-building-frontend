import React from 'react';

const ContractInfoForm = ({ contractNumber, onChange, contractDate, validation }) => {

    const formatDate = (dateStr) => {
        if (!dateStr) return '---';
        const date = new Date(dateStr);
        const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
            'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
        return `${date.getDate()}-${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    return (
        <div className="card-section" style={{ gridColumn: '1 / -1', marginBottom: '16px' }}>
            <div className="section-header">
                <div className="icon-box bg-primary-subtle">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                </div>
                <h3>Shartnoma ma'lumotlari</h3>
            </div>

            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {/* Contract Number */}
                <div className="form-group">
                    <label>Shartnoma raqami <span className="text-danger">*</span></label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            className={`form-control ${validation?.message ? 'error' : ''}`}
                            placeholder="Raqam kiriting"
                            value={contractNumber || ''}
                            onChange={(e) => onChange(e.target.value)}
                            style={{
                                fontWeight: '600',
                                color: validation?.available ? 'var(--primary-color)' : '#ef4444',
                                paddingRight: validation?.loading ? '40px' : '12px'
                            }}
                        />
                        {validation?.loading && (
                            <div style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '16px',
                                height: '16px',
                                border: '2px solid rgba(0,0,0,0.1)',
                                borderTopColor: 'var(--primary-color)',
                                borderRadius: '50%',
                                animation: 'spin 0.6s linear infinite'
                            }} />
                        )}
                    </div>
                    {validation?.message && (
                        <small className="error-text" style={{ color: '#ef4444', marginTop: '4px', display: 'block' }}>
                            {validation.message}
                        </small>
                    )}
                    <small className="input-hint">Shartnomaning rasmiy tartib raqami</small>
                </div>

                {/* Contract Date - Read Only */}
                <div className="form-group">
                    <label>Tuzilgan sana</label>
                    <input
                        type="text"
                        className="form-control"
                        value={formatDate(contractDate)}
                        disabled
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: '#94a3b8',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            cursor: 'not-allowed'
                        }}
                    />
                    <small className="input-hint">Shartnoma rasmiylashtirilgan sana (o'zgartirib bo'lmaydi)</small>
                </div>

                {/* Counter Update Suggestion */}
                {validation?.suggestion && (
                    <div style={{
                        gridColumn: '1 / -1',
                        padding: '12px',
                        background: 'rgba(56, 189, 248, 0.1)',
                        border: '1px solid rgba(56, 189, 248, 0.2)',
                        borderRadius: '8px',
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'center'
                    }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        <span style={{ fontSize: '13px', color: '#38bdf8' }}>{validation.suggestion}</span>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes spin {
                    to { transform: translateY(-50%) rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default ContractInfoForm;
