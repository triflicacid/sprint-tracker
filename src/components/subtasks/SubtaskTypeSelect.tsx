import React from "react";
import type { SubtaskTypeEntry } from "@shared/types";
import { TypeSelect } from "../TypeSelect";
import { SubtaskTypeIcon } from "./SubtaskTypeIcon";

interface SubtaskTypeSelectProps {
    value: string;
    options: SubtaskTypeEntry[];
    onChange: (shortName: string) => void;
}

export function SubtaskTypeSelect({ value, options, onChange }: SubtaskTypeSelectProps) {
    return (
        <TypeSelect
            value={value}
            options={options.map((o) => ({ value: o.shortName, label: o.fullName, icon: <SubtaskTypeIcon type={o.shortName} />, group: o.tier }))}
            onChange={onChange}
        />
    );
}
