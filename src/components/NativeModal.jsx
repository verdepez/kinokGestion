import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Modal accesible basado en <dialog closedby="any"> con showModal()
 * y fallback de light-dismiss según modern-web-guidance.
 */
export default function NativeModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  accentColor = 'emerald',
  maxWidth = 'max-w-lg',
  children,
}) {
  const dialogRef = useRef(null);
  const titleId = `dialog-title-${title?.toLowerCase().replace(/\s+/g, '-') || 'modal'}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleNativeClose = () => {
      if (onClose) onClose();
    };

    // Fallback for browsers without closedby support (per modern-web-guidance)
    const handleBackdropClick = (event) => {
      if ('closedBy' in HTMLDialogElement.prototype) return;
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;

      if (!isDialogContent) {
        dialog.close();
      }
    };

    dialog.addEventListener('close', handleNativeClose);
    dialog.addEventListener('click', handleBackdropClick);

    return () => {
      dialog.removeEventListener('close', handleNativeClose);
      dialog.removeEventListener('click', handleBackdropClick);
    };
  }, [onClose]);

  const accentStyles = {
    emerald:
      'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400',
    rose: 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-400',
    amber:
      'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-400',
    indigo:
      'border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-400',
  };

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby={titleId}
      className={`w-[94vw] ${maxWidth} rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-2xl outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100`}
    >
      <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4 dark:border-zinc-800/80">
        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                accentStyles[accentColor] || accentStyles.emerald
              }`}
            >
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div>
            <h2
              id={titleId}
              className="text-base font-semibold tracking-tight text-slate-900 dark:text-zinc-100"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-zinc-400">{subtitle}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          aria-label="Cerrar ventana modal"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  );
}
