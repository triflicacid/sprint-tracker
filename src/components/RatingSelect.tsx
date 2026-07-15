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
    readOnly?: boolean;
}

// labelled dropdown over a small fixed set of numeric ratings (subtask complexity, story points).
// when readOnly, renders the value as plain text instead of a select the user can't act on.
export function RatingSelect({
    label,
    value,
    options,
    onChange,
    disabled,
    title,
    selectClassName,
    readOnly,
}: RatingSelectProps) {
    if (readOnly) {
        return (
            <span className="rating-select-label">
                {label} {value ?? "-"}
            </span>
        );
    }

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
