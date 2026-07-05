import React from "react";
import type { Tag } from "@shared/types";

interface TagFilterProps {
    tags: Tag[];
    selected: string;
    onChange: (value: string) => void;
    label: string;
}

// dropdown filter over a list of tags (repo or custom)
export function TagFilter({ tags, selected, onChange, label }: TagFilterProps) {
    return (
        <label className="tag-filter">
            {label}
            <select value={selected} onChange={(event) => onChange(event.target.value)}>
                <option value="">all</option>
                {tags.map((tag) => (
                    <option key={tag.id} value={tag.name}>
                        {tag.name}
                    </option>
                ))}
            </select>
        </label>
    );
}
