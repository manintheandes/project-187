declare global {
  interface Window {
    __toastPush?: (message: string) => void;
  }

  interface WindowEventMap {
    "open-history-modal": Event;
  }
}

export {};


