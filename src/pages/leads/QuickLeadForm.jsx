import React, { useState } from 'react';
import { leadService } from '../../services/leads';
import { toast } from 'sonner';

const QuickLeadForm = ({ stageId, onCancel, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        client_name: '',
        phone_number: '+998',
        notes: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhoneChange = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (!val.startsWith('998')) {
            if (val.startsWith('8')) val = '998' + val.substring(1);
            else if (val.length > 0) val = '998' + val;
            else val = '998';
        }

        let formatted = '+998';
        if (val.length > 3) formatted += ' ' + val.substring(3, 5);
        if (val.length > 5) formatted += ' ' + val.substring(5, 8);
        if (val.length > 8) formatted += ' ' + val.substring(8, 10);
        if (val.length > 10) formatted += ' ' + val.substring(10, 12);

        setFormData(prev => ({ ...prev, phone_number: formatted }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.phone_number.length < 17) { // +998 XX XXX XX XX
            toast.error("Telefon raqamni to'liq kiriting");
            return;
        }

        setLoading(true);
        try {
            const data = new FormData();
            data.append('client_name', formData.client_name);
            data.append('phone_number', formData.phone_number);
            data.append('stage', stageId);
            if (formData.notes) data.append('notes', formData.notes);

            await leadService.create(data);
            toast.success("Lead qo'shildi");
            onSuccess();
            setFormData({ client_name: '', phone_number: '+998', notes: '' });
        } catch (error) {
            console.error(error);
            toast.error("Xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="quick-lead-form">
            <form onSubmit={handleSubmit}>
                <div className="form-group-sm">
                    <label>Mijoz ismi</label>
                    <input
                        type="text"
                        name="client_name"
                        value={formData.client_name}
                        onChange={handleChange}
                        placeholder="Mijoz ismini kiriting"
                        autoFocus
                    />
                </div>

                <div className="form-group-sm">
                    <label>Telefon raqami *</label>
                    <input
                        type="text"
                        name="phone_number"
                        value={formData.phone_number}
                        onChange={handlePhoneChange}
                        placeholder="+998"
                    />
                </div>

                <div className="form-group-sm">
                    <label>Izoh</label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Qo'shimcha ma'lumotlar..."
                        rows={2}
                    />
                </div>

                <div className="quick-form-actions">
                    <button
                        type="submit"
                        className="btn-v2 btn-v2-success btn-sm"
                        disabled={loading}
                    >
                        {loading ? '...' : (
                            <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                <span>Saqlash</span>
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        className="btn-v2 btn-v2-light btn-sm"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        × Bekor qilish
                    </button>
                </div>
            </form>
        </div>
    );
};

export default QuickLeadForm;
