import React from "react";
import "./RatingSelect.css";

interface RatingSelectProps {
    label: string;
    value: number | null;
    options: readonly number[];
    onChange: (value: string) => void;
    disabled?: boolean;
    title?: string;
    selectClassName?: string;
}

// labelled dropdown over a small fixed set of numeric ratings (subtask complexity, story points).
export function RatingSelect({ label, value, options, onChange, disabled, title, selectClassName }: RatingSelectProps) {
    return (
        <label className="rating-select-label">
            {label}
            <select
                value={value ?? ""}
                onChange={(event) => onChange(event.target.value)}
                disabled={disabled}
                title={title}
                className={selectClassName}
            >
                <option value="">-</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </label>
    );
}
