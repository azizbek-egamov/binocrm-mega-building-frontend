'use client';

import React from 'react';
import { createPortal } from 'react-dom';

/**
 * Unified Modal Component - Standard for all modals in Bino CRM
 * Provides consistent styling, animations, and structure
 */
const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
    icon = null,
    closeable = true,
    className = '',
    overlayClassName = '',
    contentClassName = '',
}) => {
    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'modal-sm',
        md: 'modal-md',
        lg: 'modal-lg',
        xl: 'modal-xl',
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const modalLayout = (
        <div
            className={`modal-overlay ${overlayClassName}`}
            onClick={handleBackdropClick}
            role="presentation"
        >
            <div
                className={`modal-content ${sizeClasses[size]} ${contentClassName} ${className}`}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
            >
                {/* Header */}
                {title && (
                    <div className="modal-header">
                        <h2 id="modal-title" className="modal-title">
                            {icon && <span className="modal-icon">{icon}</span>}
                            {title}
                        </h2>
                        {closeable && (
                            <button
                                className="modal-close"
                                onClick={onClose}
                                aria-label="Close modal"
                                type="button"
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        )}
                    </div>
                )}

                {/* Body */}
                <div className="modal-body">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="modal-actions">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(modalLayout, document.body);
};

export default Modal;
