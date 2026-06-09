'use client';

import React from 'react';
import { DollarSignIcon } from '../ContractIcons';
import Modal from '../../../components/ui/Modal';
import { InfoDisplay, InfoNote, PriceInput, FormField } from '../../../components/ui/ModalFormComponents';

const CustomPaymentModal = ({
    isOpen,
    onClose,
    remainingBalance,
    amount,
    onAmountChange,
    onSubmit,
    isLoading,
    formatPrice
}) => {
    const numericAmount = parseInt(String(amount || "").replace(/\s/g, "").replace(/\D/g, "")) || 0;
    const isOverLimit = numericAmount > remainingBalance;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Ixtiyoriy to'lov qilish"
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
                        label: 'Qolgan umumiy qarz',
                        value: formatPrice(remainingBalance),
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
                        Diqqat: To'lov miqdori umumiy qarzdan oshib ketdi!
                    </div>
                )}
            </FormField>

            <InfoNote type={isOverLimit ? "error" : "success"}>
                <strong>Ma'lumot:</strong> Ixtiyoriy to'lov avtomatik ravishda eng yaqin to'lanmagan oylarga taqsimlanadi.
            </InfoNote>
        </Modal>
    );
};

export default CustomPaymentModal;
