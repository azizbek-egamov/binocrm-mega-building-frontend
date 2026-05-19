import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { getPublicForm, submitPublicForm } from '../../services/forms';
import './PublicFormPage.css';

const PublicFormPage = () => {
    const { slug } = useParams();
    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});
    const [theme, setTheme] = useState(() => localStorage.getItem('form-theme') || 'light');

    useEffect(() => {
        loadForm();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slug]);

    useEffect(() => {
        localStorage.setItem('form-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const loadForm = async () => {
        try {
            setLoading(true);
            const response = await getPublicForm(slug);
            setForm(response.data);

            const initialData = {};
            response.data.fields?.forEach(field => {
                initialData[field.label] = '';
            });
            setFormData(initialData);
        } catch (err) {
            console.error('Form not found:', err);
            setForm(null);
        } finally {
            setLoading(false);
        }
    };

    const formatPhoneNumber = (value) => {
        let digits = value.replace(/\D/g, '');
        if (digits.startsWith('998')) digits = digits.slice(3);
        digits = digits.slice(0, 9);
        if (digits.length === 0) return '+998 ';
        let formatted = '+998 ';
        if (digits.length > 0) formatted += digits.slice(0, 2);
        if (digits.length > 2) formatted += ' ' + digits.slice(2, 5);
        if (digits.length > 5) formatted += ' ' + digits.slice(5, 7);
        if (digits.length > 7) formatted += ' ' + digits.slice(7, 9);
        return formatted;
    };

    const handleInputChange = (field, value) => {
        let processedValue = value;
        if (field.field_type === 'phone') processedValue = formatPhoneNumber(value);
        setFormData(prev => ({ ...prev, [field.label]: processedValue }));
        if (errors[field.label]) setErrors(prev => ({ ...prev, [field.label]: null }));
    };

    const validateForm = () => {
        const newErrors = {};
        form.fields?.forEach(field => {
            if (field.is_required && !formData[field.label]?.trim()) {
                newErrors[field.label] = 'Bu maydon majburiy';
            }
            if (field.field_type === 'email' && formData[field.label]) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(formData[field.label])) newErrors[field.label] = "Email noto'g'ri";
            }
            if (field.field_type === 'phone' && formData[field.label]) {
                const digits = formData[field.label].replace(/\D/g, '');
                if (digits.length < 12) newErrors[field.label] = "Telefon raqami to'liq emas";
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Iltimos, barcha maydonlarni to'ldiring");
            return;
        }
        setSubmitting(true);
        try {
            await submitPublicForm(slug, formData);
            setSubmitted(true);
        } catch {
            toast.error("Yuborishda xatolik yuz berdi");
        } finally {
            setSubmitting(false);
        }
    };

    const renderField = (field) => {
        const hasError = errors[field.label];
        const commonProps = {
            value: formData[field.label] || '',
            onChange: (e) => handleInputChange(field, e.target.value),
            placeholder: field.placeholder || '',
            className: `form-input ${hasError ? 'error' : ''}`,
            required: field.is_required
        };

        switch (field.field_type) {
            case 'textarea': return <textarea {...commonProps} rows={4} />;
            case 'email': return <input type="email" {...commonProps} />;
            case 'phone': return <input type="tel" {...commonProps} />;
            case 'number': return <input type="number" {...commonProps} />;
            default: return <input type="text" {...commonProps} />;
        }
    };

    if (loading) {
        return (
            <div className={`public-form-page ${theme}`}>
                <div className="loading-container">
                    <div className="loader"></div>
                    <p>Yuklanmoqda...</p>
                </div>
            </div>
        );
    }

    if (!form || submitted) {
        return (
            <div className={`public-form-page ${theme}`}>
                <div className="bg-blob blob-1"></div>
                <div className="bg-blob blob-2"></div>
                <button className="theme-toggle" onClick={toggleTheme}>
                    {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                </button>
                <div className="form-container">
                    {!form ? (
                        <div className="not-found">
                            <NotFoundIcon />
                            <h2>Forma topilmadi</h2>
                            <p>Bu forma mavjud emas yoki faol emas</p>
                        </div>
                    ) : (
                        <div className="success-state">
                            <div className="success-icon"><CheckIcon /></div>
                            <h2>Rahmat!</h2>
                            <p>{form.success_message || "Ma'lumotlaringiz qabul qilindi"}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`public-form-page ${theme}`}>
            <Toaster position="top-center" richColors />

            {/* Background Animations */}
            <div className="bg-blob blob-1"></div>
            <div className="bg-blob blob-2"></div>
            <div className="bg-blob blob-3"></div>

            {/* Theme Toggle Button */}
            <button className="theme-toggle" onClick={toggleTheme} title="Rejimni o'zgartirish">
                {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>

            <div className="form-container">
                <div className="form-header">
                    <h1>{form.name}</h1>
                    {form.description && <p>{form.description}</p>}
                </div>

                <form onSubmit={handleSubmit} className="public-form">
                    {form.fields?.sort((a, b) => (a.order || 0) - (b.order || 0)).map((field, index) => (
                        <div
                            key={index}
                            className={`form-field ${errors[field.label] ? 'has-error' : ''}`}
                            style={{ animationDelay: `${0.3 + (index * 0.1)}s` }}
                        >
                            <label>
                                {field.label}
                                {field.is_required && <span className="required">*</span>}
                            </label>
                            {renderField(field)}
                            {errors[field.label] && <span className="error-message">{errors[field.label]}</span>}
                        </div>
                    ))}

                    <button type="submit" className="submit-btn" disabled={submitting}>
                        {submitting ? <><span className="btn-loader"></span> Yuborilmoqda...</> : (form.button_text || 'Yuborish')}
                    </button>
                </form>

                <div className="form-footer">
                    <p>Powered by <span>BinoCRM</span></p>
                </div>
            </div>
        </div>
    );
};

// Icons
const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);

const NotFoundIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 8v4M12 16h.01" />
    </svg>
);

const MoonIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);

const SunIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
);

export default PublicFormPage;
