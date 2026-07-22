import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Subtask, SubtaskStatus, StatusFlowConfig, FlowField } from "@shared/types";
import { StatusBadge } from "../StatusBadge";
import { RatingSelect } from "../RatingSelect";
import { SubtaskTypeIcon } from "./SubtaskTypeIcon";
import { api } from "../../api/client";
import { useToast } from "../Toast";
import { generateBranchName } from "../../utils/branchName";
import "./SubtaskRow.css";

const COMPLEXITY_OPTIONS = [1, 2, 3, 4, 5];

interface SubtaskRowProps {
    subtask: Subtask;
    flow: StatusFlowConfig;
    onChanged: () => void;
    disableNavigation?: boolean;
    sprintLocked?: boolean;
}

// e.g. https://github.com/org/repo/pull/123 -> .../tree/<branch>
function branchUrl(subtask: Subtask) {
    if (!subtask.url || !subtask.branchName) {
        return null;
    }
    const match = subtask.url.match(/^(https:\/\/github\.com\/[^/]+\/[^/]+)\/pull/);
    if (!match) {
        return null;
    }
    const encodedBranch = subtask.branchName.split("/").map(encodeURIComponent).join("/");
    return `${match[1]}/tree/${encodedBranch}`;
}

/**
 * displays a subtask row with status badge, complexity rating, and editable fields
 *
 * @param subtask the subtask to display
 * @param flow status flow configuration
 * @param onChanged callback when subtask is updated
 * @param disableNavigation if true, prevents click navigation to detail page
 * @param sprintLocked if true, disables all editing controls
 */
export function SubtaskRow({ subtask, flow, onChanged, disableNavigation, sprintLocked }: SubtaskRowProps): React.ReactElement {
    const [pendingStatus, setPendingStatus] = useState<SubtaskStatus | null>(null);
    const [pendingFieldValues, setPendingFieldValues] = useState<Record<string, string>>({});
    const { showError } = useToast();
    const navigate = useNavigate();

    function requiredFields(from: SubtaskStatus, to: SubtaskStatus): FlowField[] {
        return flow.transitions.find((transition) => transition.from === from && transition.to.includes(to))
            ?.requires ?? [];
    }

    function startTransition(nextStatus: SubtaskStatus): void {
        const fields = requiredFields(subtask.status, nextStatus);
        const nextFieldValues: Record<string, string> = {};
        if (fields.some((field) => field.field === "branchName")) {
            nextFieldValues.branchName = generateBranchName(subtask.type, subtask.storyJiraKey, subtask.title);
        }
        setPendingStatus(nextStatus);
        setPendingFieldValues(nextFieldValues);
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

    const allowedNextStates = flow.transitions
        .filter((transition) => transition.from === subtask.status)
        .flatMap((transition) => transition.to);
    const pendingFields: FlowField[] = pendingStatus ? requiredFields(subtask.status, pendingStatus) : [];
    const githubBranchUrl: string | null = branchUrl(subtask);
    const complexityLocked = flow.states.find((state) => state.id === subtask.status)?.locksComplexity ?? false;
    // branch display is suppressed for states where no branch exists yet
    const branchApplicable = !(flow.states.find((state) => state.id === subtask.status)?.noBranch ?? false);

    return (
        <div
            className={disableNavigation ? "subtask-row" : "subtask-row subtask-row-clickable"}
            onClick={disableNavigation ? undefined : () => navigate(`/subtasks/${subtask.id}`)}
        >
            <div className="subtask-type-badge" onClick={(event) => event.stopPropagation()}>
                <SubtaskTypeIcon type={subtask.type} />
            </div>
            <div className="subtask-header">
                <div className="subtask-branch-pr">
                    {subtask.branchName ? (
                        githubBranchUrl ? (
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
                        )
                    ) : (
                        <span className="branch-placeholder">(no branch yet)</span>
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
                    {!sprintLocked && allowedNextStates.length > 0 && (
                        <span className="status-flow-arrow">&rarr;</span>
                    )}
                    {!sprintLocked &&
                        allowedNextStates.map((nextStatus) => (
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
                            autoFocus={field.field === "branchName"}
                            onFocus={field.field === "branchName" ? (event) => event.target.select() : undefined}
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
                <span className="subtask-title">{subtask.title}</span>
                {subtask.url && (
                    <div className="subtask-complexity-info" onClick={(event) => event.stopPropagation()}>
                        <RatingSelect
                            label="complexity:"
                            value={subtask.complexityRating}
                            options={COMPLEXITY_OPTIONS}
                            onChange={handleComplexityChange}
                            disabled={complexityLocked}
                            title={complexityLocked ? "complexity is locked once a subtask has passed cut release" : undefined}
                            selectClassName="complexity-select"
                            readOnly={sprintLocked}
                        />
                        {subtask.releaseVersion && <span className="release-version">{subtask.releaseVersion}</span>}
                    </div>
                )}
            </div>
        </div>
    );
}
