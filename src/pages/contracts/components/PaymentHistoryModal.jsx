'use client';

import React from 'react';
import { HistoryIcon } from '../ContractIcons';
import Modal from '../../../components/ui/Modal';
import { InfoDisplay } from '../../../components/ui/ModalFormComponents';

const PaymentHistoryModal = ({ isOpen, onClose, payment, formatPrice }) => {
    if (!isOpen || !payment) return null;

    const history = payment.history || [];
    const monthName = payment.month_number === 0
        ? "Boshlang'ich to'lov"
        : `${payment.month_number}-oy`;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${monthName} tarixi`}
            icon={<HistoryIcon width="20" height="20" />}
            size="md"
            footer={
                <button
                    className="btn-v2 btn-v2-secondary"
                    onClick={onClose}
                    type="button"
                >
                    Yopish
                </button>
            }
        >
            <InfoDisplay
                items={[
                    {
                        label: 'Belgilangan miqdori',
                        value: formatPrice(payment.amount)
                    },
                    {
                        label: 'To\'langan',
                        value: formatPrice(payment.amount_paid),
                        color: '#10b981'
                    },
                    {
                        label: 'Qoldiq qarz',
                        value: formatPrice(payment.remaining),
                        color: payment.remaining > 0 ? '#ef4444' : '#10b981'
                    }
                ]}
            />

            {history && history.length > 0 && (
                <div className="history-section">
                    <h4 className="section-title">AMALLAR TARIXI</h4>
                    <div className="history-list">
                        {history.map((item, index) => (
                            <div key={index} className="history-card">
                                <div className="history-card-header">
                                    <span className="history-date">
                                        {(() => {
                                            const date = new Date(item.paid_date);
                                            const months = [
                                                'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
                                                'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
                                            ];
                                            return `${date.getDate()}-${months[date.getMonth()]} ${date.getFullYear()}`;
                                        })()}
                                        <small className="history-time">
                                            {new Date(item.paid_date).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </small>
                                    </span>
                                    <span
                                        className={`history-amount ${item.amount >= 0 ? 'text-success' : 'text-danger'}`}
                                    >
                                        {item.amount >= 0 ? '+' : ''}{formatPrice(item.amount)}
                                    </span>
                                </div>
                                {item.note && <div className="history-note">{item.note}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {(!history || history.length === 0) && (
                <div className="no-history-alert">
                    Hozircha amallar tarixi mavjud emas
                </div>
            )}
        </Modal>
    );
};

export default PaymentHistoryModal;
