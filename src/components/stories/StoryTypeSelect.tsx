import React from "react";
import { TypeSelect, type TypeSelectOption } from "../TypeSelect";
import { StoryTypeIcon } from "./StoryTypeIcon";

interface StoryTypeSelectProps {
    isBug: boolean;
    onChange: (isBug: boolean) => void;
}

const OPTIONS: TypeSelectOption[] = [
    { value: "story", label: "story", icon: <StoryTypeIcon isBug={false} /> },
    { value: "bug",   label: "bug",   icon: <StoryTypeIcon isBug={true} /> },
];

export function StoryTypeSelect({ isBug, onChange }: StoryTypeSelectProps) {
    return (
        <TypeSelect
            value={isBug ? "bug" : "story"}
            options={OPTIONS}
            onChange={(value) => onChange(value === "bug")}
        />
    );
}
