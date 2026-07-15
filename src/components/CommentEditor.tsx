import React, { useState } from "react";
import "./CommentEditor.css";

interface CommentEditorProps {
    comment: string | null | undefined;
    onSave: (draft: string) => void | Promise<void>;
    displayClassName: string;
    disabled?: boolean;
}

// click-to-edit comment: shows a paragraph until clicked, then a textarea that saves on blur.
export function CommentEditor({ comment, onSave, displayClassName, disabled }: CommentEditorProps): React.ReactElement | null {
    const [editing, setEditing] = useState<boolean>(false);
    const [draft, setDraft] = useState<string>("");

    function startEditing() {
        setDraft(comment ?? "");
        setEditing(true);
    }

    async function save() {
        setEditing(false);
        await onSave(draft.trim());
    }

    if (editing) {
        return (
            <textarea
                className="comment-edit"
                value={draft}
                autoFocus
                onChange={(event) => setDraft(event.target.value)}
                onBlur={save}
            />
        );
    }

    if (disabled && !comment) {
        return null;
    }

    return (
        <p
            className={disabled ? displayClassName : `${displayClassName} ${displayClassName}-editable`}
            onClick={disabled ? undefined : startEditing}
        >
            {comment || "add comment"}
        </p>
    );
}
