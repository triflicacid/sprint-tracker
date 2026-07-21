import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { SubtaskTypeEntry } from "@shared/types";
import { api } from "../api/client";
import { StoryTypeIcon } from "../components/stories/StoryTypeIcon";
import { SubtaskTypeIcon } from "../components/subtasks/SubtaskTypeIcon";
import "./CategoriesInfoPage.css";

const STORY_TYPES = [
    { isBug: false, name: "Story", description: "A new feature, improvement, or planned deliverable." },
    { isBug: true,  name: "Bug",   description: "A defect or regression in existing behaviour." },
];

// "/categories": reference listing of story types and subtask category types.
export function CategoriesInfoPage(): React.ReactElement {
    const [subtaskTypes, setSubtaskTypes] = useState<SubtaskTypeEntry[]>([]);

    useEffect(() => {
        api.getSubtaskTypes().then(setSubtaskTypes);
    }, []);

    const unknownType = subtaskTypes.find((t) => t.shortName === "unknown");
    const selectable = subtaskTypes.filter((t) => t.selectable !== false);
    const basicTypes = selectable.filter((t) => t.tier === "basic");
    const advancedTypes = selectable.filter((t) => t.tier === "advanced");

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <Link to="/" className="back-link">back to sprints</Link>
                    <h1>Categories</h1>
                </div>
            </div>

            <h2>Story types</h2>
            <div className="type-info-list">
                {STORY_TYPES.map((type) => (
                    <div key={type.name} className="type-info-entry">
                        <div className="type-info-badge">
                            <StoryTypeIcon isBug={type.isBug} />
                        </div>
                        <div className="type-info-text">
                            <span className="type-info-name">{type.name}</span>
                            <p className="type-info-description">{type.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <h2>Subtask categories</h2>
            {basicTypes.length > 0 && (
                <>
                    <p className="type-info-tier-label">basic</p>
                    <div className="type-info-list">
                        {basicTypes.map((type) => (
                            <div key={type.shortName} className="type-info-entry">
                                <div className="type-info-badge">
                                    <SubtaskTypeIcon type={type.shortName} />
                                </div>
                                <div className="type-info-text">
                                    <span className="type-info-name">{type.fullName}</span>
                                    <p className="type-info-description">{type.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
            {advancedTypes.length > 0 && (
                <>
                    <p className="type-info-tier-label">advanced</p>
                    <div className="type-info-list">
                        {advancedTypes.map((type) => (
                            <div key={type.shortName} className="type-info-entry">
                                <div className="type-info-badge">
                                    <SubtaskTypeIcon type={type.shortName} />
                                </div>
                                <div className="type-info-text">
                                    <span className="type-info-name">{type.fullName}</span>
                                    <p className="type-info-description">{type.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
            {unknownType && (
                <>
                    <p className="type-info-tier-label">unassigned</p>
                    <div className="type-info-list">
                        <div className="type-info-entry type-info-entry--legacy">
                            <div className="type-info-badge">
                                <SubtaskTypeIcon type="unknown" />
                            </div>
                            <div className="type-info-text">
                                <span className="type-info-name">{unknownType.fullName}</span>
                                <p className="type-info-description">
                                    No category was assigned. This appears on subtasks created before
                                    categories were introduced, or where a category was never selected.
                                    Not available in the category picker.
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

