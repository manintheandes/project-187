"use client";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

type Toast = { id: number; message: string };
type ToastContextType = { push: (message: string) => void };
const ToastContext = createContext<ToastContextType>({ push: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export default function ToastHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(1);

  const push = (message: string) => {
    const id = idRef.current++;
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 2200);
  };

  // Expose on window for easy access from panels
  useEffect(() => {
    window.__toastPush = push;
    return () => {
      delete window.__toastPush;
    };
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      <div className="fixed left-4 bottom-4 space-y-2 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded-md bg-black text-white text-sm px-3 py-2 shadow-sm"
            role="status"
            aria-live="polite"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}


