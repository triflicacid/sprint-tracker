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

// aggregate story status derived from its subtasks
export type StoryStatus =
  | "JIRA_ONLY"
  | "WORK_REMAINING"
  | SubtaskStatus;

export type FlowFieldType = "text" | "number" | "date" | "select";

// one required transition field and its target column
export interface FlowField {
  field: string;
  label: string;
  type: FlowFieldType;
  options?: string[];
  column: string;
}

// allowed destinations from one state
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
  // once reached, the subtask complexity rating is frozen
  locksComplexity?: boolean;
  // includes this state as a burndown checkpoint
  burndownMilestone?: boolean;
}

// status flow config loaded from `status_flow.json`
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

// one entry from `static/subtask_types.json`
export interface SubtaskTypeEntry {
  shortName: string;
  fullName: string;
  description: string;
  selectable?: boolean;
  tier?: "basic" | "advanced";
}

// subtask data returned by the api
export interface Subtask {
  id: number;
  storyId: number;
  storyJiraKey: string | null;
  title: string;
  comment: string | null;
  branchName: string;
  status: SubtaskStatus;
  url: string | null;
  repoName: string | null;
  complexityRating: number | null;
  releaseVersion: string | null;
  type: string;
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
  storyPoints: number | null;
  isBug: boolean;
  tags: Tag[];
  prCount: number;
}

export interface StoryDetail extends StorySummary {
  subtasks: Subtask[];
  // parent sprint end date used to derive lock state without another fetch
  sprintEndDate: string | null;
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
  bugCount: number;
  repoCounts: { repoName: string; count: number; proportion: number }[];
  storyTimeDays: { storyId: number; storyLabel: string; description: string; days: number }[];
  subtaskTypeCounts: { type: string; count: number }[];
}

// sprint selection for velocity history queries
export type VelocitySelection =
  | { mode: "all" }
  | { mode: "range"; from: string; to: string }
  | { mode: "lastN"; n: number };

// one sprint's completed-work totals for the velocity chart
export interface VelocityPoint {
  sprintId: number;
  sprintName: string;
  startDate: string;
  endDate: string | null;
  completedPoints: number;
  unpointedDoneStoryCount: number;
  completedStoryCount: number;
  completedSubtaskCount: number;
}

// one rated done subtask for the complexity timing chart
export interface ComplexityTimingPoint {
  subtaskId: number;
  storyId: number;
  storyLabel: string;
  complexityRating: number;
  runningTimeDays: number;
}

export interface StoryComplexity {
  storyId: number;
  storyLabel: string;
  totalComplexity: number;
}

// complexity timing data for sprint stats
export interface ComplexityStats {
  points: ComplexityTimingPoint[];
  ratingCounts: Record<number, number>;
  unratedCount: number;
  inProgressRatedCount: number;
  storyComplexity: StoryComplexity[];
}

// one day's status tally
export interface StatusBreakdownPoint {
  date: string;
  counts: Record<string, number>;
}

export type StatusBreakdownGranularity = "subtask" | "story";

// one subtask activity entry for a day
export interface DayActivityEntry {
  storyId: number;
  storyLabel: string;
  branchName: string;
  status: SubtaskStatus;
  prUrl: string | null;
}

// maps a date to its activity entries
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

// story fields that can be included in a markdown export
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
