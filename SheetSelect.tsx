"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

export interface SheetOption {
  value: string;
  label: string;
}

// Mobile: a tap opens a native-like bottom sheet with the options (Vaul-style,
// dependency-free). Desktop: a standard <select>. Fully additive — web behavior
// is preserved.
export default function SheetSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  className = "",
  id,
  disabled,
}: {
  options: SheetOption[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  // Lock scroll while the sheet is open.
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const current = options.find((o) => o.value === value);
  const label = current?.label || placeholder;

  if (isMobile) {
    return (
      <>
        <button
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => {
            if (closeTimer.current) clearTimeout(closeTimer.current);
            setOpen(true);
          }}
          className={
            "flex w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-left " +
            (value ? "text-slate-800" : "text-slate-400") +
            " disabled:opacity-50 " +
            className
          }
        >
          <span className="truncate">{label}</span>
          <span className="text-slate-400">▾</span>
        </button>

        {open && (
          <div className="fixed inset-0 z-[80] flex items-end" role="dialog" aria-modal="true">
            {/* scrim */}
            <div
              className="absolute inset-0 bg-black/40 animate-fadein"
              onClick={() => setOpen(false)}
            />
            {/* sheet */}
            <div className="safe-bottom relative w-full rounded-t-2xl bg-white shadow-2xl animate-fadein">
              <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-slate-300" />
              <div className="flex items-center justify-between px-4 py-3">
                <div className="text-sm font-semibold text-slate-800">Choose an option</div>
                <button onClick={() => setOpen(false)} className="rounded-lg px-2 py-1 text-sm text-slate-500">
                  Close
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto px-2 pb-4">
                {options.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className={
                      "flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm " +
                      (o.value === value ? "bg-indigo-50 font-semibold text-indigo-700" : "text-slate-700 hover:bg-slate-50")
                    }
                  >
                    <span>{o.label}</span>
                    {o.value === value && <span className="text-indigo-600">✓</span>}
                  </button>
                ))}
                {options.length === 0 && <div className="px-3 py-6 text-center text-sm text-slate-400">No options</div>}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop: standard select.
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={
        "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 disabled:opacity-50 " +
        className
      }
    >
      {!value && !options.some((o) => o.value === "") && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value || "__all"} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// Small helper for pages that haven't mounted yet (avoids SSR mismatch).
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return isMobile;
}
