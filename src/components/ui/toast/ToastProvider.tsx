import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type ToastItem = {
  id: number;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "warning" | "info" | "error" | "destructive";
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
};

type ToastContextValue = {
  showToast: (toast: Omit<ToastItem, "id">) => number;
  dismissToast: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idCounterRef = useRef(1);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = idCounterRef.current++;
    const duration = toast.duration ?? 3000;
    setToasts((prev) => [...prev, { id, ...toast }]);
    if (duration > 0) {
      window.setTimeout(() => dismissToast(id), duration);
    }
    return id;
  }, [dismissToast]);

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={
              "pointer-events-auto rounded-md border shadow-lg bg-card text-card-foreground" +
              " " +
              (t.variant === "success"
                ? "border-emerald-500/40"
                : t.variant === "warning"
                ? "border-amber-500/40"
                : t.variant === "info"
                ? "border-sky-500/40"
                : t.variant === "error" || t.variant === "destructive"
                ? "border-red-500/50"
                : "border-border/60")
            }
          >
            <div className="flex items-start gap-3 p-3">
              <div className="flex-1">
                {t.title && <div className="text-sm font-medium">{t.title}</div>}
                {t.description && (
                  <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {t.actionLabel && (
                  <button
                    onClick={() => {
                      t.onAction?.();
                      dismissToast(t.id);
                    }}
                    className="text-xs font-medium text-accent hover:text-accent/80"
                    aria-label={t.actionLabel}
                  >
                    {t.actionLabel}
                  </button>
                )}
                <button
                  onClick={() => dismissToast(t.id)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};


