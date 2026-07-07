export type SubtaskStatus =
  | "NEW"
  | "WIP"
  | "IN_PR"
  | "IN_REVIEW"
  | "PR_COMMENTS"
  | "CUT_RELEASE"
  | "TESTING"
  | "UAT"
  | "DONE";

// aggregate status of a story, derived from its subtasks: no subtasks yet
// (JIRA_ONLY), awaiting more subtasks or none started yet (WORK_REMAINING),
// or otherwise the lowest-rank status among its subtasks.
export type StoryStatus =
  | "JIRA_ONLY"
  | "WORK_REMAINING"
  | SubtaskStatus;

export type FlowFieldType = "text" | "number" | "date" | "select";

// describes one piece of additional data a transition requires, and which
// db column it should be written to.
export interface FlowField {
  field: string;
  label: string;
  type: FlowFieldType;
  options?: string[];
  column: string;
}

// allowed destinations from one state, plus data required to leave it.
export interface FlowTransition {
  from: SubtaskStatus;
  to: SubtaskStatus[];
  requires?: FlowField[];
}

export interface FlowState {
  id: SubtaskStatus;
  label: string;
  rank: number;
  color: string;
  description: string;
  // once a subtask reaches this state, its complexity rating is frozen
  locksComplexity?: boolean;
}

// statusFlow.json
export interface StatusFlowConfig {
  states: FlowState[];
  transitions: FlowTransition[];
}

export type TagType = "repo" | "custom";

export type EntityType = "story" | "subtask";

export interface Tag {
  id: number;
  name: string;
  tagType: TagType;
}

export interface StatusHistoryEntry {
  id: number;
  entityType: EntityType;
  entityId: number;
  status: SubtaskStatus;
  releaseVersion: string | null;
  changedAt: string;
}

// a subtask has a branch and a PR. `title` is set on creation; `comment` is
// an optional freeform note, editable afterwards, shown only on the
// subtask's own detail page (not in the tile/row view).
export interface Subtask {
  id: number;
  storyId: number;
  title: string;
  comment: string | null;
  branchName: string;
  status: SubtaskStatus;
  url: string | null;
  repoName: string | null;
  complexityRating: number | null;
  releaseVersion: string | null;
  createdAt: string;
}

export interface StorySummary {
  id: number;
  sprintId: number;
  jiraUrl: string;
  jiraKey: string | null;
  description: string;
  jiraTitle: string | null;
  jiraLabels: string[];
  status: StoryStatus;
  awaitingMoreSubtasks: boolean;
  tags: Tag[];
  prCount: number;
}

export interface StoryDetail extends StorySummary {
  subtasks: Subtask[];
}

export interface SprintSummary {
  id: number;
  name: string;
  startDate: string;
  endDate: string | null;
  comment: string | null;
  storyCount: number;
  prCount: number;
}

export interface SprintDetail extends SprintSummary {
  stories: StorySummary[];
}

export interface SprintStats {
  sprintId: number;
  prCount: number;
  storyCount: number;
  repoCounts: { repoName: string; count: number; proportion: number }[];
  storyTimeDays: { storyId: number; storyLabel: string; description: string; days: number }[];
}

// one day's status tally: `counts` is keyed by SubtaskStatus or
// StoryStatus depending on the requested granularity.
export interface StatusBreakdownPoint {
  date: string;
  counts: Record<string, number>;
}

export type StatusBreakdownGranularity = "subtask" | "story";

// one subtask's activity on one day.
export interface DayActivityEntry {
  storyLabel: string;
  branchName: string;
  status: SubtaskStatus;
  prUrl: string | null;
}

// date => activity
export type DayActivityMap = Record<string, DayActivityEntry[]>;

export interface CalendarEntry {
  sprintId: number;
  sprintName: string;
  startDate: string;
  endDate: string | null;
  repos: string[];
  tags: string[];
}

export interface JiraInfo {
  key: string;
  title: string;
  labels: string[];
}

// which story/subtask properties to include in a markdown export
export interface MarkdownExportStoryFields {
  jiraKey: boolean;
  title: boolean;
  status: boolean;
  tags: boolean;
  awaitingMoreSubtasks: boolean;
}

export interface MarkdownExportSubtaskFields {
  title: boolean;
  comment: boolean;
  branchName: boolean;
  prUrl: boolean;
  status: boolean;
  repoName: boolean;
  complexityRating: boolean;
  releaseVersion: boolean;
  createdAt: boolean;
}

export interface MarkdownExportFields {
  story: MarkdownExportStoryFields;
  subtask: MarkdownExportSubtaskFields;
}
