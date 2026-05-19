/**
 * Narx va raqam formatlash uchun utility funksiyalar
 * Butun loyihada narx/raqam kiritish inputlarida ishlatiladi
 */

/**
 * Raqamni formatlangan stringga aylantiradi (1000000 -> "1 000 000")
 * @param {string|number} value - Formatlash kerak bo'lgan qiymat
 * @returns {string} - Formatlangan string
 */
export const formatPrice = (value) => {
    if (!value && value !== 0) return '';
    const num = typeof value === 'string' ? value.replace(/\s/g, '') : String(value);
    if (!num || isNaN(num)) return '';
    return Number(num).toLocaleString('ru-RU').replace(/,/g, ' ');
};

/**
 * Formatlangan stringdan raqamni oladi ("1 000 000" -> "1000000")
 * @param {string} formattedValue - Formatlangan qiymat
 * @returns {string} - Faqat raqamlar
 */
export const parsePrice = (formattedValue) => {
    return formattedValue.replace(/\s/g, '');
};

/**
 * Narx inputi uchun onChange handler
 * Faqat raqam va bo'sh qatorni qabul qiladi
 * @param {string} value - Input qiymati
 * @param {function} setValue - State setter funksiya
 */
export const handlePriceChange = (value, setValue) => {
    const raw = value.replace(/\s/g, '');
    if (raw === '' || /^\d+$/.test(raw)) {
        setValue(raw);
    }
};

/**
 * Raqam inputi uchun validatsiya (faqat raqam va nuqta)
 * @param {string} value - Tekshirish kerak bo'lgan qiymat
 * @returns {boolean} - true agar to'g'ri bo'lsa
 */
export const isValidNumber = (value) => {
    if (value === '' || value === '.') return true;
    // Faqat raqamlar va bitta nuqta
    return /^(\d+\.?\d*|\.\d+)$/.test(value);
};

/**
 * Butun son uchun validatsiya (faqat raqamlar)
 * @param {string} value - Tekshirish kerak bo'lgan qiymat
 * @returns {boolean} - true agar to'g'ri bo'lsa
 */
export const isValidInteger = (value) => {
    if (value === '') return true;
    return /^\d+$/.test(value);
};

/**
 * Raqam inputi uchun onChange handler (decimal qabul qiladi)
 * @param {Event} e - Input event
 * @param {function} setValue - State setter funksiya
 */
export const handleNumberInput = (e, setValue) => {
    const value = e.target.value;
    if (isValidNumber(value)) {
        setValue(value);
    }
};

/**
 * Butun son inputi uchun onChange handler
 * @param {Event} e - Input event
 * @param {function} setValue - State setter funksiya
 */
export const handleIntegerInput = (e, setValue) => {
    const value = e.target.value;
    if (isValidInteger(value)) {
        setValue(value);
    }
};
