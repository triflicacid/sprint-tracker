import React, { useState } from "react";
import "./CommentEditor.css";

interface CommentEditorProps {
    comment: string | null | undefined;
    onSave: (draft: string) => void | Promise<void>;
    displayClassName: string;
}

// click-to-edit comment: shows a paragraph until clicked, then a textarea that saves on blur.
export function CommentEditor({ comment, onSave, displayClassName }: CommentEditorProps): React.ReactElement {
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

    return (
        <p className={`${displayClassName} ${displayClassName}-editable`} onClick={startEditing}>
            {comment || "add comment"}
        </p>
    );
}
