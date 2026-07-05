import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { CalendarEntry, Tag } from "@shared/types";
import { api } from "../api/client";
import { SprintRangeCalendar } from "../components/calendar/SprintRangeCalendar";
import { TagFilter } from "../components/TagFilter";

// "/calendar": every sprint as a range-line, filterable by repo/tag.
export function CalendarPage() {
    const [entries, setEntries] = useState<CalendarEntry[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [repoFilter, setRepoFilter] = useState<string>("");
    const [tagFilter, setTagFilter] = useState<string>("");

    useEffect(() => {
        api.listTags().then(setTags);
    }, []);

    useEffect(() => {
        api.getCalendar({ repo: repoFilter || undefined, tag: tagFilter || undefined }).then(setEntries);
    }, [repoFilter, tagFilter]);

    const repoTags = tags.filter((tag) => tag.tagType === "repo");
    const customTags = tags.filter((tag) => tag.tagType === "custom");

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <Link to="/" className="back-link">
                        back to sprints
                    </Link>
                    <h1>Calendar</h1>
                </div>
                <div className="page-header-actions">
                    <TagFilter tags={repoTags} selected={repoFilter} onChange={setRepoFilter} label="repo" />
                    <TagFilter tags={customTags} selected={tagFilter} onChange={setTagFilter} label="tag" />
                </div>
            </div>
            <SprintRangeCalendar entries={entries} />
        </div>
    );
}
