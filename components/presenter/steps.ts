/**
 * The script for presenter mode: a guided walk through the whole product,
 * made for showing ElectionVerify to an audience.
 */
export interface TourStep {
  /** Where this step happens. `{created}` is replaced with the item made in the submit step. */
  path: string;
  /** The step is "on screen" when the current address matches this. */
  match: RegExp;
  /** CSS selector of the element to spotlight. */
  target?: string;
  title: string;
  body: string;
  /** Move on by itself when the address changes to match this (e.g. after submitting). */
  advanceOn?: RegExp;
}

export const TOUR: TourStep[] = [
  {
    path: "/",
    match: /^\/$/,
    target: '[data-tour="hero"]',
    title: "Welcome to ElectionVerify",
    body: "Rumours spread fast before elections. ElectionVerify lets anyone check a link, message or photo before sharing it. Software gathers the evidence, and a trained human decides.",
  },
  {
    path: "/#how-it-works",
    match: /^\/$/,
    target: '[data-tour="how"]',
    title: "Four steps from rumour to answer",
    body: "Submit, automatic evidence gathering, human review, and a published verdict with sources. Let's go through it for real.",
  },
  {
    path: "/demo/start?as=citizen&next=%2Fsubmit%3Fprefill%3Ddemo",
    match: /^\/submit/,
    target: '[data-tour="submit-form"]',
    title: "1 · A citizen submits a rumour",
    body: "We've signed in as a citizen and pasted a typical WhatsApp forward. Click “Submit for checking” to send it.",
    advanceOn: /^\/s\/[\w-]+/,
  },
  {
    path: "/s/{created}",
    match: /^\/s\//,
    target: '[data-tour="pipeline"]',
    title: "2 · The checks run live",
    body: "Seven steps run in the background: read the content, check the source, analyze images, find claims, search fact-checks, gather evidence, and prepare a suggestion. The page updates by itself.",
  },
  {
    path: "/demo/start?as=reviewer&next=%2Freview",
    match: /^\/review$/,
    target: '[data-tour="queue"]',
    title: "3 · The reviewer's queue",
    body: "Reviewers see everything waiting, with the AI's suggestion and how many people reported each item. They can sort by most reported and use J / K to move.",
  },
  {
    path: "/review/ballots-in-river",
    match: /^\/review\/ballots-in-river/,
    target: '[data-tour="evidence-board"]',
    title: "Evidence board",
    body: "Every piece of evidence linked to the claim it supports (green) or contradicts (red). Reviewers can drag, zoom and click through it.",
  },
  {
    path: "/review/ballots-in-river",
    match: /^\/review\/ballots-in-river/,
    target: '[data-tour="ai-suggestion"]',
    title: "AI suggestion, with citations",
    body: "The AI suggests a verdict and cites evidence IDs. A citation to evidence that doesn't exist turns red, so made-up sources stand out. This suggestion is never published.",
  },
  {
    path: "/review/ballots-in-river",
    match: /^\/review\/ballots-in-river/,
    target: '[data-tour="forensics"]',
    title: "Image forensics",
    body: "Text inside the photo is found and boxed (here: “SPECIMEN”), photo metadata is read, and reviewers can search for older copies of the image.",
  },
  {
    path: "/review/ballots-in-river",
    match: /^\/review\/ballots-in-river/,
    target: '[data-tour="verdict-form"]',
    title: "4 · A human makes the call",
    body: "The reviewer picks a rating (keys 1–6), explains it in plain words, and publishes. Every decision is recorded in the activity log.",
  },
  {
    path: "/s/polling-hours-message",
    match: /^\/s\/polling-hours-message/,
    target: '[data-tour="verdict-panel"]',
    title: "5 · The public verdict",
    body: "Anyone can read the verdict and the evidence behind it, share it to WhatsApp, or download it as an image for the family group.",
  },
  {
    path: "/demo/start?as=admin&next=%2Freview%2Fanalytics",
    match: /^\/review\/analytics/,
    target: '[data-tour="analytics"]',
    title: "Analytics",
    body: "How many claims arrive, what we conclude, and how often reviewers agree with the AI. The disagreements show why the human check matters.",
  },
  {
    path: "/about",
    match: /^\/about/,
    title: "Thank you!",
    body: "ElectionVerify: AI that gathers evidence, people who decide, and verdicts anyone can check. Questions?",
  },
];
