'use client';

import React from 'react';
import Modal from '../../../components/ui/Modal';
import { InfoDisplay, InfoNote, PriceInput, FormField } from '../../../components/ui/ModalFormComponents';

const AdminEditModal = ({
    isOpen,
    onClose,
    payment,
    amount,
    onAmountChange,
    onSubmit,
    onReset,
    isLoading,
    formatPrice
}) => {
    const numericAmount = parseInt(String(amount || "").replace(/\s/g, "").replace(/\D/g, "")) || 0;
    const maxAmount = payment?.amount || 0;
    const isOverLimit = numericAmount > maxAmount;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Admin amallar"
            size="md"
            footer={
                <>
                    <button
                        type="button"
                        className="btn-v2 btn-v2-danger-light"
                        onClick={onReset}
                        disabled={isLoading}
                    >
                        Yopish
                    </button>
                    <button
                        type="button"
                        className="btn-v2 btn-v2-primary"
                        onClick={onSubmit}
                        disabled={isLoading || !amount || isOverLimit}
                    >
                        {isLoading ? 'Saqlanmoqda...' : "O'zgarishni saqlash"}
                    </button>
                </>
            }
        >
            <InfoDisplay
                items={[
                    {
                        label: 'Belgilangan miqdori',
                        value: formatPrice(payment?.amount)
                    },
                    {
                        label: 'Hozirgi to\'langan',
                        value: formatPrice(payment?.amount_paid),
                        color: '#10b981'
                    }
                ]}
            />

            <FormField label="TO'LANGAN MIQDORNI O'ZGARTIRISH" required>
                <PriceInput
                    value={amount}
                    onChange={onAmountChange}
                    placeholder="Yangi miqdor kiriting"
                    status={isOverLimit ? 'error' : ''}
                />
                {isOverLimit && (
                    <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: '500' }}>
                        Diqqat: To'lov miqdori belgilangan oylik miqdordan (${formatPrice(maxAmount)}) oshib ketdi!
                    </div>
                )}
            </FormField>

            <InfoNote type={isOverLimit ? "error" : "danger"}>
                <strong>Diqqat:</strong> Bu amalni faqat admin foydalanuvchi bajar oladi. O'zgarishlar avtomatik ravishda tizimdagi barcha hisoblashlarni qayta hisoblab chiqadi.
            </InfoNote>
        </Modal>
    );
};

export default AdminEditModal;
