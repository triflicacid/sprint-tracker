import React from "react";

interface ExportButtonProps {
    onClick: () => void;
    loading: boolean;
    disabled?: boolean;
    label?: string;
    loadingLabel?: string;
}

// button that shows a busy label while its action is in progress
export function ExportButton({
    onClick,
    loading,
    disabled,
    label = "export pdf",
    loadingLabel = "exporting...",
}: ExportButtonProps) {
    return (
        <button onClick={onClick} disabled={loading || disabled}>
            {loading ? loadingLabel : label}
        </button>
    );
}
