'use client';

import React, { useState } from 'react';
import { leadService } from '../../services/leads';
import { toast } from 'sonner';
import Modal from '../../components/ui/Modal';
import { FormField, InfoNote } from '../../components/ui/ModalFormComponents';

const ConvertLeadModal = ({ isOpen, onClose, lead, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState(lead?.client_name || '');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await leadService.convert(lead.id, { full_name: fullName });
            toast.success("Lead muvaffaqiyatli mijozga aylantirildi");
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || "Xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Mijozga aylantirish"
            size="md"
            footer={
                <>
                    <button
                        type="button"
                        className="btn-v2 btn-v2-secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Bekor qilish
                    </button>
                    <button
                        type="submit"
                        className="btn-v2 btn-v2-primary"
                        disabled={loading}
                        onClick={handleSubmit}
                    >
                        {loading ? 'Aylantirilmoqda...' : 'Aylantirish'}
                    </button>
                </>
            }
        >
            <InfoNote type="info">
                Leadni mijozga aylantirish uchun mijozning to'liq ismini tasdiqlang.
            </InfoNote>

            <form onSubmit={handleSubmit}>
                <FormField label="Mijozning to'liq ismi" required>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="To'liq ismni kiriting"
                        required
                    />
                </FormField>
            </form>
        </Modal>
    );
};

export default ConvertLeadModal;
