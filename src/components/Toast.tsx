import React, { createContext, useCallback, useContext, useRef, useState } from "react";

interface ToastMessage {
    id: number;
    message: string;
}

interface ToastContextValue {
    showError: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 3500;

// red error toast displaying and stacking in the bottom-right
export function ToastProvider({ children }: { children: React.ReactNode }): React.ReactElement {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const nextId = useRef<number>(1);

    const showError = useCallback((message: string) => {
        const id = nextId.current++;
        setToasts((current) => [...current, { id, message }]);
        setTimeout(() => {
            setToasts((current) => current.filter((toast) => toast.id !== id));
        }, TOAST_DURATION_MS);
    }, []);

    return (
        <ToastContext.Provider value={{ showError }}>
            {children}
            <div className="toast-container">
                {toasts.map((toast) => (
                    <div key={toast.id} className="toast toast-error">
                        {toast.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
