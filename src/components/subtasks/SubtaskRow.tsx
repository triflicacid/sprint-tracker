import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Subtask, SubtaskStatus, StatusFlowConfig, FlowField } from "@shared/types";
import { StatusBadge } from "../StatusBadge";
import { api } from "../../api/client";
import { useToast } from "../Toast";

interface SubtaskRowProps {
    subtask: Subtask;
    flow: StatusFlowConfig;
    onChanged: () => void;
    disableNavigation?: boolean;
}

// e.g. https://github.com/org/repo/pull/123 -> .../tree/<branch>
function branchUrl(subtask: Subtask) {
    if (!subtask.url) {
        return null;
    }
    const match = subtask.url.match(/^(https:\/\/github\.com\/[^/]+\/[^/]+)\/pull/);
    if (!match) {
        return null;
    }
    const encodedBranch = subtask.branchName.split("/").map(encodeURIComponent).join("/");
    return `${match[1]}/tree/${encodedBranch}`;
}

// show info about a subtask
export function SubtaskRow({ subtask, flow, onChanged, disableNavigation }: SubtaskRowProps): React.ReactElement {
    const [pendingStatus, setPendingStatus] = useState<SubtaskStatus | null>(null);
    const [pendingFieldValues, setPendingFieldValues] = useState<Record<string, string>>({});
    const { showError } = useToast();
    const navigate = useNavigate();

    function requiredFields(from: SubtaskStatus, to: SubtaskStatus): FlowField[] {
        return flow.transitions.find((transition) => transition.from === from && transition.to.includes(to))
            ?.requires ?? [];
    }

    function startTransition(nextStatus: SubtaskStatus): void {
        setPendingStatus(nextStatus);
        setPendingFieldValues({});
    }

    async function submitPendingTransition() {
        if (!pendingStatus) {
            return;
        }
        try {
            await api.updateSubtask(subtask.id, {
                status: pendingStatus,
                ...pendingFieldValues,
            });
            setPendingStatus(null);
            setPendingFieldValues({});
            onChanged();
        } catch (error) {
            showError(error instanceof Error ? error.message : "failed to update subtask");
        }
    }

    async function handleComplexityChange(value: string) {
        try {
            await api.updateSubtask(subtask.id, { complexityRating: Number(value) });
            onChanged();
        } catch (error) {
            showError(error instanceof Error ? error.message : "failed to update subtask");
        }
    }

    const allowedNextStates: SubtaskStatus[] = flow.transitions
        .filter((transition) => transition.from === subtask.status)
        .flatMap((transition) => transition.to) as SubtaskStatus[];
    const pendingFields: FlowField[] = pendingStatus ? requiredFields(subtask.status, pendingStatus) : [];
    const githubBranchUrl: string | null = branchUrl(subtask);

    return (
        <div
            className={disableNavigation ? "subtask-row" : "subtask-row subtask-row-clickable"}
            onClick={disableNavigation ? undefined : () => navigate(`/subtasks/${subtask.id}`)}
        >
            <div className="subtask-header">
                <div className="subtask-branch-pr">
                    {githubBranchUrl ? (
                        <a
                            href={githubBranchUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="branch-name"
                            onClick={(event) => event.stopPropagation()}
                        >
                            {subtask.branchName}
                        </a>
                    ) : (
                        <span className="branch-name">{subtask.branchName}</span>
                    )}
                    {subtask.url && (
                        <a
                            href={subtask.url}
                            target="_blank"
                            rel="noreferrer"
                            className="pr-link"
                            onClick={(event) => event.stopPropagation()}
                        >
                            {subtask.repoName} #{subtask.url.match(/pull\/(\d+)/)?.[1] ?? ""}
                        </a>
                    )}
                </div>
                <div className="status-flow" onClick={(event) => event.stopPropagation()}>
                    <StatusBadge status={subtask.status} />
                    {allowedNextStates.length > 0 && <span className="status-flow-arrow">&rarr;</span>}
                    {allowedNextStates.map((nextStatus) => (
                        <StatusBadge
                            key={nextStatus}
                            status={nextStatus}
                            muted
                            onClick={() => startTransition(nextStatus)}
                        />
                    ))}
                </div>
            </div>
            {pendingStatus && (
                <div className="release-version-prompt" onClick={(event) => event.stopPropagation()}>
                    {pendingFields.map((field) => (
                        <input
                            key={field.field}
                            type={field.type}
                            placeholder={field.label}
                            value={pendingFieldValues[field.field] ?? ""}
                            onChange={(event) =>
                                setPendingFieldValues((values) => ({
                                    ...values,
                                    [field.field]: event.target.value,
                                }))
                            }
                        />
                    ))}
                    <button onClick={() => submitPendingTransition()}>confirm</button>
                </div>
            )}
            <div className="subtask-footer">
                <span className="subtask-description">{subtask.description}</span>
                {subtask.url && (
                    <div className="subtask-complexity-info" onClick={(event) => event.stopPropagation()}>
                        <label className="complexity-label">
                            complexity:
                            <select
                                value={subtask.complexityRating ?? ""}
                                onChange={(event) => handleComplexityChange(event.target.value)}
                                className="complexity-select"
                            >
                                <option value="">-</option>
                                {[1, 2, 3, 4, 5].map((value) => (
                                    <option key={value} value={value}>
                                        {value}
                                    </option>
                                ))}
                            </select>
                        </label>
                        {subtask.releaseVersion && <span className="release-version">{subtask.releaseVersion}</span>}
                    </div>
                )}
            </div>
        </div>
    );
}
