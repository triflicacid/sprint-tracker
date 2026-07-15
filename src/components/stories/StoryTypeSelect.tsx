import React, { useEffect, useRef, useState } from "react";
import { StoryTypeIcon } from "./StoryTypeIcon";
import "./StoryTypeSelect.css";

interface StoryTypeSelectProps {
    isBug: boolean;
    onChange: (isBug: boolean) => void;
}

const OPTIONS: { isBug: boolean; label: string }[] = [
    { isBug: false, label: "story" },
    { isBug: true, label: "bug" },
];

// a labelled dropdown over the two story types
export function StoryTypeSelect({ isBug, onChange }: StoryTypeSelectProps) {
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

    function selectOption(optionIsBug: boolean) {
        onChange(optionIsBug);
        setOpen(false);
    }

    return (
        <div className="story-type-select" ref={rootRef}>
            <button
                type="button"
                className="story-type-select-trigger"
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
            >
                <span aria-hidden="true">
                    <StoryTypeIcon isBug={isBug} />
                </span>
                {isBug ? "bug" : "story"}
            </button>
            {open && (
                <ul className="story-type-select-list" role="listbox">
                    {OPTIONS.map((option) => (
                        <li key={option.label}>
                            <button
                                type="button"
                                role="option"
                                aria-selected={isBug === option.isBug}
                                className="story-type-select-option"
                                onClick={() => selectOption(option.isBug)}
                            >
                                <span aria-hidden="true">
                                    <StoryTypeIcon isBug={option.isBug} />
                                </span>
                                {option.label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
