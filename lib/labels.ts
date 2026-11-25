import type {
  EvidenceKind,
  InputType,
  PipelineStepKey,
  Role,
  SourceType,
  Stance,
  Status,
  Verdict,
} from "@/lib/types";

/** Text and colors for each verdict. Used by badges, filters and the ratings legend. */
export const VERDICTS: Record<
  Verdict,
  { label: string; description: string; className: string; dotClassName: string; rgb: string; tone: string }
> = {
  ACCURATE: {
    label: "Accurate",
    description: "Supported by official records or several reliable sources.",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-900",
    dotClassName: "bg-emerald-500",
    rgb: "16 185 129", // for glows
    tone: "bg-tint-lime text-tint-lime-foreground",
  },
  MISLEADING: {
    label: "Misleading",
    description: "Contains some truth but is presented in a way that misleads.",
    className: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-900",
    dotClassName: "bg-amber-500",
    rgb: "245 158 11", // for glows
    tone: "bg-[oklch(0.9_0.11_85)] text-[oklch(0.3_0.07_70)] dark:bg-[oklch(0.42_0.09_80)] dark:text-[oklch(0.95_0.06_85)]",
  },
  MISSING_CONTEXT: {
    label: "Missing context",
    description: "Accurate on its own, but leaves out facts that change the meaning.",
    className: "bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-900",
    dotClassName: "bg-orange-500",
    rgb: "249 115 22", // for glows
    tone: "bg-[oklch(0.88_0.08_60)] text-[oklch(0.3_0.08_50)] dark:bg-[oklch(0.42_0.09_55)] dark:text-[oklch(0.95_0.05_60)]",
  },
  FALSE: {
    label: "False",
    description: "Contradicted by official records or reliable evidence.",
    className: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-900",
    dotClassName: "bg-red-500",
    rgb: "239 68 68", // for glows
    tone: "bg-tint-coral text-tint-coral-foreground",
  },
  UNVERIFIED: {
    label: "Unverified",
    description: "Not enough evidence yet to confirm or reject it.",
    className: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
    dotClassName: "bg-slate-400",
    rgb: "148 163 184", // for glows
    tone: "bg-tint-sky text-tint-sky-foreground",
  },
  SATIRE: {
    label: "Satire",
    description: "Comes from a humor or parody source and is not meant as fact.",
    className: "bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950 dark:text-violet-200 dark:border-violet-900",
    dotClassName: "bg-violet-500",
    rgb: "139 92 246", // for glows
    tone: "bg-[oklch(0.86_0.07_300)] text-[oklch(0.3_0.08_300)] dark:bg-[oklch(0.4_0.08_300)] dark:text-[oklch(0.95_0.04_300)]",
  },
};

export const VERDICT_ORDER: Verdict[] = [
  "ACCURATE",
  "MISLEADING",
  "MISSING_CONTEXT",
  "FALSE",
  "UNVERIFIED",
  "SATIRE",
];

export const STATUSES: Record<Status, { label: string; className: string }> = {
  QUEUED: { label: "Queued", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" },
  PROCESSING: { label: "Analyzing", className: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200" },
  NEEDS_REVIEW: { label: "Awaiting review", className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200" },
  PUBLISHED: { label: "Published", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" },
  FAILED: { label: "Failed", className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200" },
};

export const INPUT_TYPES: Record<InputType, string> = {
  URL: "Link",
  TEXT: "Text",
  IMAGE: "Image",
};

export const PIPELINE_STEPS: { key: PipelineStepKey; label: string; description: string }[] = [
  { key: "extract", label: "Read the content", description: "Open the link or file and pull out the text." },
  { key: "sourceInfo", label: "Check the source", description: "Look up the website's reputation and age." },
  { key: "image", label: "Analyze the image", description: "Metadata, text in the image and earlier copies online." },
  { key: "claims", label: "Find the claims", description: "Split the content into statements that can be checked." },
  { key: "factCheck", label: "Search fact-checks", description: "Look for existing fact-checks of the same claim." },
  { key: "webEvidence", label: "Gather evidence", description: "Find sources that support or contradict each claim." },
  { key: "synthesize", label: "Prepare for review", description: "Summarize the evidence for a human reviewer." },
];

export const EVIDENCE_KINDS: Record<EvidenceKind, string> = {
  SOURCE_INFO: "Source information",
  FACT_CHECK: "Existing fact-check",
  WEB_SOURCE: "Web source",
  IMAGE_MATCH: "Earlier copy of the image",
  IMAGE_METADATA: "Image metadata",
  OCR_TEXT: "Text found in the image",
  AI_IMAGE_NOTES: "AI image observations",
  MANUAL: "Added by a reviewer",
};

export const STANCES: Record<Stance, { label: string; className: string }> = {
  SUPPORTS: { label: "Supports", className: "text-emerald-700 dark:text-emerald-300" },
  REFUTES: { label: "Contradicts", className: "text-red-700 dark:text-red-300" },
  NEUTRAL: { label: "Neutral", className: "text-muted-foreground" },
};

export const SOURCE_TYPES: Record<SourceType, { label: string; className: string }> = {
  OFFICIAL: { label: "Official", className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200" },
  NEWS: { label: "News outlet", className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200" },
  FACT_CHECKER: { label: "Fact-checker", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" },
  SATIRE: { label: "Satire", className: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200" },
  KNOWN_MISINFO: { label: "Known misinformation", className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200" },
};

/** How each audit-log action is described on the activity page. */
export const ACTIONS: Record<string, string> = {
  "submission.created": "Submitted an item",
  "review.published": "Published a verdict",
  "pipeline.rerun": "Ran the checks again",
  "evidence.added": "Added evidence",
  "submission.reported_again": "Sent content that was already submitted",
  "source.saved": "Saved a trusted source",
  "user.role_changed": "Changed a person's role",
  "user.signed_in": "Signed in",
};

export const ROLES: Record<Role, string> = {
  USER: "Citizen",
  REVIEWER: "Reviewer",
  ADMIN: "Admin",
};
