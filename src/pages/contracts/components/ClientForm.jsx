import { useState } from 'react';

// Phone formatting: 99 123 45 67
const formatPhone = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 9);
    let formatted = '';
    if (digits.length > 0) formatted += digits.slice(0, 2);
    if (digits.length > 2) formatted += ' ' + digits.slice(2, 5);
    if (digits.length > 5) formatted += ' ' + digits.slice(5, 7);
    if (digits.length > 7) formatted += ' ' + digits.slice(7, 9);
    return formatted;
};

// Passport formatting: AA 1234567
const formatPassport = (val) => {
    const clean = val.replace(/[^a-zA-Z0-9]/g, '');
    let letters = clean.slice(0, 2).replace(/[^a-zA-Z]/g, '').toUpperCase();
    let digits = clean.slice(2).replace(/\D/g, '').slice(0, 7);

    if (letters && digits) {
        return letters + ' ' + digits;
    } else if (letters) {
        return letters;
    }
    return '';
};

// Date formatting: 12122026 -> 12.12.2026
const formatDate = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 8);
    let formatted = '';
    if (digits.length > 0) formatted += digits.slice(0, 2);
    if (digits.length > 2) formatted += '.' + digits.slice(2, 4);
    if (digits.length > 4) formatted += '.' + digits.slice(4, 8);
    return formatted;
};

const ClientForm = ({ formData, onChange }) => {
    // Track which fields have been touched (interacted with)
    const [touched, setTouched] = useState({});

    const markTouched = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const handlePhoneChange = (value, field) => {
        const formatted = formatPhone(value);
        onChange(field, formatted.replace(/\s/g, ''));
    };

    const handlePassportChange = (value) => {
        const formatted = formatPassport(value);
        onChange('passport_series', formatted);
    };

    const handleDateChange = (value) => {
        const formatted = formatDate(value);
        onChange('passport_date', formatted);
    };

    // Format phone for display
    const displayPhone = (raw) => {
        if (!raw) return '';
        return formatPhone(raw);
    };

    // Validation - only show if field was touched
    const getError = (field, condition, message) => {
        if (!touched[field]) return null;
        if (condition) return message;
        return null;
    };

    const phoneError = getError('phone', formData.phone && formData.phone.length < 9, "9 ta raqam kerak");
    const passportError = getError('passport_series', formData.passport_series && formData.passport_series.length < 10, "AA 1234567 formatida kiriting");
    const dateError = getError('passport_date', formData.passport_date && formData.passport_date.length < 10, "KK.OO.YYYY formatida kiriting");

    return (
        <div className="card-section">
            <div className="section-header">
                <div className="icon-box bg-info-subtle">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </div>
                <h3>Mijoz ma'lumotlari</h3>
            </div>

            <div className="form-grid">
                {/* Full Name */}
                <div className="form-group">
                    <label>Mijoz to'liq ismi <span className="text-danger">*</span></label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Familiya Ism Otasining ismi"
                        value={formData.full_name || ''}
                        onChange={(e) => onChange('full_name', e.target.value)}
                        onBlur={() => markTouched('full_name')}
                    />
                    <small className="input-hint">To'liq F.I.O. kiriting (pasportdagi kabi)</small>
                </div>

                {/* Phone */}
                <div className="form-group">
                    <label>Telefon raqami <span className="text-danger">*</span></label>
                    <div className="input-with-prefix">
                        <span className="prefix">+998</span>
                        <input
                            type="text"
                            className={`form-control ${phoneError ? 'error' : ''}`}
                            placeholder="99 123 45 67"
                            value={displayPhone(formData.phone)}
                            onChange={(e) => handlePhoneChange(e.target.value, 'phone')}
                            onBlur={() => markTouched('phone')}
                        />
                    </div>
                    <small className="input-hint">Asosiy aloqa raqami</small>
                    {phoneError && <small className="error-text">{phoneError}</small>}
                </div>

                {/* Phone 2 */}
                <div className="form-group">
                    <label>Qo'shimcha telefon</label>
                    <div className="input-with-prefix">
                        <span className="prefix">+998</span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="99 123 45 67"
                            value={displayPhone(formData.phone2)}
                            onChange={(e) => handlePhoneChange(e.target.value, 'phone2')}
                        />
                    </div>
                    <small className="input-hint">Qo'shimcha yoki yaqinining raqami</small>
                </div>

                {/* Passport */}
                <div className="form-group">
                    <label>Passport seriyasi va raqami <span className="text-danger">*</span></label>
                    <input
                        type="text"
                        className={`form-control ${passportError ? 'error' : ''}`}
                        placeholder="AA 1234567"
                        value={formData.passport_series || ''}
                        onChange={(e) => handlePassportChange(e.target.value)}
                        onBlur={() => markTouched('passport_series')}
                        maxLength={10}
                    />
                    <small className="input-hint">2 ta harf + 7 ta raqam (masalan: AB 1234567)</small>
                    {passportError && <small className="error-text">{passportError}</small>}
                </div>

                {/* Passport Issue Date - String format */}
                <div className="form-group">
                    <label>Passport berilgan sana <span className="text-danger">*</span></label>
                    <input
                        type="text"
                        className={`form-control ${dateError ? 'error' : ''}`}
                        placeholder="23.01.2020"
                        value={formData.passport_date || ''}
                        onChange={(e) => handleDateChange(e.target.value)}
                        onBlur={() => markTouched('passport_date')}
                        maxLength={10}
                    />
                    <small className="input-hint">Kun.Oy.Yil formatida (masalan: 15.06.2020)</small>
                    {dateError && <small className="error-text">{dateError}</small>}
                </div>

                {/* Passport Issued By */}
                <div className="form-group">
                    <label>Passport kim tomonidan berilgan <span className="text-danger">*</span></label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Toshkent sh. Chilonzor IIB"
                        value={formData.passport_given || ''}
                        onChange={(e) => onChange('passport_given', e.target.value)}
                        onBlur={() => markTouched('passport_given')}
                    />
                    <small className="input-hint">Passportni bergan organ nomi</small>
                </div>

                {/* Address */}
                <div className="form-group full-width">
                    <label>Yashash manzili <span className="text-danger">*</span></label>
                    <textarea
                        className="form-control"
                        placeholder="Viloyat, tuman, ko'cha, uy raqami"
                        rows={2}
                        value={formData.address || ''}
                        onChange={(e) => onChange('address', e.target.value)}
                        onBlur={() => markTouched('address')}
                    />
                    <small className="input-hint">To'liq yashash manzili (ro'yxatdan o'tgan)</small>
                </div>

                {/* Heard From */}
                <div className="form-group">
                    <label>Qayerda eshitgan</label>
                    <select
                        className="form-select"
                        value={formData.heard_from || 'Xech qayerda'}
                        onChange={(e) => onChange('heard_from', e.target.value)}
                    >
                        <option value="Telegramda">Telegramda</option>
                        <option value="Instagramda">Instagramda</option>
                        <option value="YouTubeda">YouTubeda</option>
                        <option value="Odamlar orasida">Odamlar orasida</option>
                        <option value="Xech qayerda">Xech qayerda</option>
                    </select>
                    <small className="input-hint">Mijoz kompaniya haqida qayerdan bilgan</small>
                </div>
            </div>
        </div>
    );
};

export default ClientForm;
