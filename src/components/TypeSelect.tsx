import React, { useEffect, useRef, useState } from "react";
import "./TypeSelect.css";

export interface TypeSelectOption {
    value: string;
    label: string;
    icon: React.ReactNode;
    group?: string;
}

interface TypeSelectProps {
    value: string;
    options: TypeSelectOption[];
    onChange: (value: string) => void;
}

export function TypeSelect({ value, options, onChange }: TypeSelectProps) {
    const [open, setOpen] = useState<boolean>(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        function handlePointerDown(event: MouseEvent) {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") setOpen(false);
        }

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    const selected = options.find((o) => o.value === value);

    return (
        <div className="type-select" ref={rootRef}>
            <button
                type="button"
                className="type-select-trigger"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
            >
                <span aria-hidden="true">{selected?.icon}</span>
                {selected?.label ?? value}
            </button>
            {open && (
                <ul className="type-select-list" role="listbox">
                    {options.map((option, i) => {
                        const showHeader =
                            option.group !== undefined &&
                            (i === 0 || options[i - 1].group !== option.group);
                        return (
                            <React.Fragment key={option.value}>
                                {showHeader && (
                                    <li className="type-select-group-label" aria-hidden="true">
                                        {option.group}
                                    </li>
                                )}
                                <li>
                                    <button
                                        type="button"
                                        role="option"
                                        aria-selected={value === option.value}
                                        className="type-select-option"
                                        onClick={() => { onChange(option.value); setOpen(false); }}
                                    >
                                        <span aria-hidden="true">{option.icon}</span>
                                        {option.label}
                                    </button>
                                </li>
                            </React.Fragment>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
