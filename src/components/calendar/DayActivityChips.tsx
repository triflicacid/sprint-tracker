import React from "react";
import { Link } from "react-router-dom";
import type { DayActivityEntry } from "@shared/types";
import { STATUS_COLORS, STATUS_LABELS } from "../StatusBadge";

type LinkMode = "pr" | "story";

// "story" chips are short codes (e.g. "NEB-1") laid out several to a row, so
// a day cell has room for more of them before folding into "+N more" than
// "pr" chips (story code + branch name) stacked one per line.
const MAX_VISIBLE_CHIPS: Record<LinkMode, number> = { pr: 4, story: 8 };

function activityTitle(entry: DayActivityEntry, linkMode: LinkMode) {
    const base = `${entry.storyLabel} ${entry.branchName} - ${STATUS_LABELS[entry.status] ?? entry.status}`;
    if (linkMode === "story") {
        return `${base} (click to open story)`;
    }
    return entry.prUrl ? `${base} (click to open PR)` : base;
}

interface DayActivityChipsProps {
    activities: DayActivityEntry[];
    /** "pr" (default): chip opens PR URL; "story": chip links to story detail page */
    linkMode?: LinkMode;
}

/**
 * displays activity chips for one day, capped with overflow indicator
 *
 * chips are colored by status and stop click bubbling to prevent parent triggers
 *
 * @param activities array of day activity entries
 * @param linkMode link mode ("pr" or "story")
 */
export function DayActivityChips({ activities, linkMode = "pr" }: DayActivityChipsProps) {
    if (activities.length === 0) {
        return null;
    }

    const maxVisible = MAX_VISIBLE_CHIPS[linkMode];
    const containerClass =
        linkMode === "story" ? "calendar-day-activity calendar-day-activity-wrap" : "calendar-day-activity";

    return (
        <div className={containerClass}>
            {activities.slice(0, maxVisible).map((entry, index) => {
                const label = linkMode === "story" ? entry.storyLabel : `${entry.storyLabel} ${entry.branchName}`;
                const style = { backgroundColor: STATUS_COLORS[entry.status] };
                const title = activityTitle(entry, linkMode);
                const onClick = (event: React.MouseEvent) => event.stopPropagation();

                if (linkMode === "story") {
                    return (
                        <Link
                            key={index}
                            to={`/stories/${entry.storyId}`}
                            className="calendar-day-activity-chip calendar-day-activity-chip-link"
                            style={style}
                            title={title}
                            onClick={onClick}
                        >
                            {label}
                        </Link>
                    );
                }

                if (entry.prUrl) {
                    return (
                        <a
                            key={index}
                            href={entry.prUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="calendar-day-activity-chip calendar-day-activity-chip-link"
                            style={style}
                            title={title}
                            onClick={onClick}
                        >
                            {label}
                        </a>
                    );
                }

                return (
                    <span
                        key={index}
                        className="calendar-day-activity-chip"
                        style={style}
                        title={title}
                        onClick={onClick}
                    >
                        {label}
                    </span>
                );
            })}
            {activities.length > maxVisible && (
                <span
                    className="calendar-day-activity-chip calendar-day-activity-more"
                    title={activities
                        .slice(maxVisible)
                        .map((entry) => activityTitle(entry, linkMode))
                        .join("\n")}
                    onClick={(event) => event.stopPropagation()}
                >
                    +{activities.length - maxVisible} more
                </span>
            )}
        </div>
    );
}
