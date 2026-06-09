'use client';

import React from 'react';
import { DollarSignIcon } from '../ContractIcons';
import Modal from '../../../components/ui/Modal';
import { InfoDisplay, InfoNote, PriceInput, FormField } from '../../../components/ui/ModalFormComponents';

const PaymentModalForm = ({
    isOpen,
    onClose,
    payment,
    amount,
    onAmountChange,
    onSubmit,
    isLoading,
    formatPrice,
    title
}) => {
    const numericAmount = parseInt(String(amount || "").replace(/\s/g, "").replace(/\D/g, "")) || 0;
    const maxAmount = payment?.remaining || 0;
    const isOverLimit = numericAmount > maxAmount;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title || (payment?.month_number === 0 ? "Boshlang'ich to'lov" : `${payment?.month_number}-oy uchun to'lov`)}
            icon={<DollarSignIcon width="20" height="20" />}
            size="md"
            footer={
                <>
                    <button
                        type="button"
                        className="btn-v2 btn-v2-secondary"
                        onClick={onClose}
                    >
                        Bekor qilish
                    </button>
                    <button
                        type="button"
                        className="btn-v2 btn-v2-primary"
                        onClick={onSubmit}
                        disabled={isLoading || !amount || isOverLimit}
                    >
                        {isLoading ? 'Jarayonda...' : "To'lovni tasdiqlash"}
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
                        label: 'Qolgan qarz',
                        value: formatPrice(payment?.remaining),
                        color: '#ef4444'
                    }
                ]}
            />

            <FormField label="To'lov summasi" required>
                <PriceInput
                    value={amount}
                    onChange={onAmountChange}
                    placeholder="Summa kiriting"
                    status={isOverLimit ? 'error' : ''}
                />
                {isOverLimit && (
                    <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', fontWeight: '500' }}>
                        Diqqat: To'lov miqdori qolgan qarzdan oshib ketdi!
                    </div>
                )}
            </FormField>

            <InfoNote type={isOverLimit ? "error" : "info"}>
                <strong>Eslatma:</strong> To'lov miqdori oy uchun qoldiqdan oshmasligi kerak.
            </InfoNote>
        </Modal>
    );
};

export default PaymentModalForm;
