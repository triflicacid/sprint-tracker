import React, { useEffect, useRef, useState } from "react";
import "./CalendarPopoverShell.css";

interface CalendarPopoverShellProps {
    triggerLabel: React.ReactNode;
    triggerClassName?: string;
    // overrides the trigger's accessible name. needed when a consumer nests
    // the trigger inside a native <label> (e.g. ExportPage's "from"/"to"
    // rows) - a wrapping <label> otherwise wins accessible-name computation
    // over the button's own visible content, per the HTML AccName algorithm.
    triggerAriaLabel?: string;
    children: (close: () => void) => React.ReactNode;
}

// generic popover mechanics: a trigger button + positioned panel that closes
// on outside click, Escape, or re-clicking the trigger. no calendar-specific
// logic - shared by HolidayPickerPopover and DatePickerPopover.
export function CalendarPopoverShell({
    triggerLabel,
    triggerClassName,
    triggerAriaLabel,
    children,
}: CalendarPopoverShellProps) {
    const [open, setOpen] = useState<boolean>(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        function handlePointerDown(event: MouseEvent) {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setOpen(false);
            }
        }

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    return (
        <div className="calendar-popover" ref={rootRef}>
            <button
                type="button"
                className={triggerClassName ? `calendar-popover-trigger ${triggerClassName}` : "calendar-popover-trigger"}
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-label={triggerAriaLabel}
                onClick={() => setOpen((value) => !value)}
            >
                {triggerLabel}
            </button>
            {open && <div className="calendar-popover-panel">{children(() => setOpen(false))}</div>}
        </div>
    );
}
