'use client';

import { useState, useCallback } from 'react';

/**
 * useModal - Custom hook for managing modal state
 * Handles open/close logic with optional callbacks
 */
export const useModal = (initialState = false) => {
    const [isOpen, setIsOpen] = useState(initialState);
    const [isClosing, setIsClosing] = useState(false);

    const open = useCallback(() => {
        setIsOpen(true);
        setIsClosing(false);
    }, []);

    const close = useCallback(() => {
        setIsClosing(true);
        const timer = setTimeout(() => {
            setIsOpen(false);
            setIsClosing(false);
        }, 300); // Match animation duration
        return () => clearTimeout(timer);
    }, []);

    const toggle = useCallback(() => {
        if (isOpen) {
            close();
        } else {
            open();
        }
    }, [isOpen, open, close]);

    return { isOpen, isClosing, open, close, toggle };
};

export default useModal;
