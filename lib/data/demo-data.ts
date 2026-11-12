/**
 * Sample data for demo mode and for `npm run db:seed`.
 *
 * Every organization, website and person here is made up. All domains end in
 * `.example`, a name reserved for documentation, so no link points at a real site.
 */
import type { AppUser, Evidence, PipelineSteps, Source, SubmissionDetail } from "@/lib/types";

export const DEMO_USERS: Record<"citizen" | "reviewer" | "admin", AppUser> = {
  citizen: {
    id: "00000000-0000-4000-8000-000000000001",
    email: "citizen@demo.local",
    name: "Demo Citizen",
    role: "USER",
  },
  reviewer: {
    id: "00000000-0000-4000-8000-000000000002",
    email: "reviewer@demo.local",
    name: "Demo Reviewer",
    role: "REVIEWER",
  },
  admin: {
    id: "00000000-0000-4000-8000-000000000003",
    email: "admin@demo.local",
    name: "Demo Admin",
    role: "ADMIN",
  },
};

export const DEMO_SOURCES: Source[] = [
  { domain: "elections.gov.example", name: "National Election Commission", type: "OFFICIAL", trust: 95, notes: "Official results, schedules and notices." },
  { domain: "voters.gov.example", name: "Voter Registration Office", type: "OFFICIAL", trust: 95, notes: "Registration rules and ID requirements." },
  { domain: "factwatch.example", name: "FactWatch Desk", type: "FACT_CHECKER", trust: 90, notes: "Independent fact-checker." },
  { domain: "truthlens.example", name: "TruthLens", type: "FACT_CHECKER", trust: 85, notes: "Fact-checker focused on images and video." },
  { domain: "dailyledger.example", name: "The Daily Ledger", type: "NEWS", trust: 80, notes: null },
  { domain: "metrotimes.example", name: "Metro Times", type: "NEWS", trust: 75, notes: null },
  { domain: "citywire.example", name: "City Wire News", type: "NEWS", trust: 70, notes: null },
  { domain: "ballotboxgazette.example", name: "The Ballot Box Gazette", type: "SATIRE", trust: 20, notes: "Says on its About page that every story is satire." },
  { domain: "breaking-vote-news.example", name: "Breaking Vote News", type: "KNOWN_MISINFO", trust: 5, notes: "Has published made-up election stories several times." },
];

const ALL_DONE: PipelineSteps = {
  extract: "done",
  sourceInfo: "done",
  image: "skipped",
  claims: "done",
  factCheck: "done",
  webEvidence: "done",
  synthesize: "done",
};

/** A date some days back, at a fixed hour (for items from earlier days). */
function daysAgo(days: number, hour = 10): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

/** A time a few hours before now (for items from today, so they're never in the future). */
function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function evidence(item: Partial<Evidence> & Pick<Evidence, "id" | "kind" | "title">): Evidence {
  return {
    claimId: null,
    url: null,
    publisher: null,
    rating: null,
    stance: null,
    snippet: null,
    publishedAt: null,
    ...item,
  };
}

export const DEMO_SUBMISSIONS: (SubmissionDetail & { userId: string | null; contentHash: string })[] = [
  {
    id: "polling-hours-message",
    type: "TEXT",
    title: "Forwarded message: polling stations will close at 2 PM",
    url: null,
    text: "URGENT: The election commission has changed the rules. All polling stations will close at 2 PM this year instead of 5 PM. Go early or you will not be allowed to vote. Forward this to everyone!",
    imageUrl: null,
    status: "PUBLISHED",
    steps: ALL_DONE,
    error: null,
    aiVerdict: "FALSE",
    aiConfidence: 0.93,
    aiSummary:
      "The official polling schedule lists opening hours of 8 AM to 5 PM [ev-1a]. A fact-checker already rated this message false [ev-1b], and a news report quotes the commission saying the hours are unchanged [ev-1c].",
    finalVerdict: "FALSE",
    publicNote:
      "The National Election Commission's official schedule says polling stations are open from 8 AM to 5 PM, and no change has been announced. An independent fact-checker has also rated this message false.",
    createdAt: daysAgo(6, 9),
    publishedAt: daysAgo(6, 15),
    userId: DEMO_USERS.citizen.id,
    contentHash: "demo-1",
    claims: [
      { id: "cl-1a", text: "Polling stations will close at 2 PM on election day." },
      { id: "cl-1b", text: "The Election Commission changed the voting hours this year." },
    ],
    evidence: [
      evidence({ id: "ev-1a", claimId: "cl-1a", kind: "WEB_SOURCE", title: "Official polling day schedule", url: "https://elections.gov.example/polling-day", publisher: "National Election Commission", stance: "REFUTES", snippet: "Polling stations will be open from 8:00 AM to 5:00 PM on polling day.", publishedAt: daysAgo(40) }),
      evidence({ id: "ev-1b", claimId: "cl-1a", kind: "FACT_CHECK", title: "Viral message about early poll closing is false", url: "https://factwatch.example/checks/poll-closing-time", publisher: "FactWatch Desk", rating: "False", stance: "REFUTES", snippet: "The same message circulated before the last election. Voting hours have not changed.", publishedAt: daysAgo(8) }),
      evidence({ id: "ev-1c", claimId: "cl-1b", kind: "WEB_SOURCE", title: "Commission confirms voting hours are unchanged", url: "https://dailyledger.example/2026/11/voting-hours-unchanged", publisher: "The Daily Ledger", stance: "REFUTES", snippet: "A commission spokesperson said there are no plans to change polling hours.", publishedAt: daysAgo(7) }),
    ],
    reviews: [
      { id: "rv-1", reviewerName: "Demo Reviewer", verdict: "FALSE", publicNote: "", internalNote: "Matches the official schedule. Clear case.", createdAt: daysAgo(6, 15) },
    ],
  },
  {
    id: "registration-deadline",
    type: "URL",
    title: "Voter registration deadline extended to 30 November",
    url: "https://elections.gov.example/news/registration-deadline-extended",
    text: "The National Election Commission has extended the voter registration deadline to 30 November to give first-time voters more time to register online or at district offices.",
    imageUrl: null,
    status: "PUBLISHED",
    steps: ALL_DONE,
    error: null,
    aiVerdict: "ACCURATE",
    aiConfidence: 0.95,
    aiSummary:
      "The link is on the commission's official website [ev-2a]. Two independent news outlets report the same new date [ev-2b] [ev-2c].",
    finalVerdict: "ACCURATE",
    publicNote:
      "This notice comes from the official election commission website, and two independent news outlets report the same new deadline.",
    createdAt: daysAgo(4, 11),
    publishedAt: daysAgo(4, 13),
    userId: DEMO_USERS.citizen.id,
    contentHash: "demo-2",
    claims: [{ id: "cl-2a", text: "The voter registration deadline has been extended to 30 November." }],
    evidence: [
      evidence({ id: "ev-2a", kind: "SOURCE_INFO", title: "elections.gov.example is an official source", url: "https://elections.gov.example", publisher: "National Election Commission", snippet: "Listed as Official · trust 95/100 · domain registered in 2004 · uses HTTPS" }),
      evidence({ id: "ev-2b", claimId: "cl-2a", kind: "WEB_SOURCE", title: "Registration window stays open until 30 November", url: "https://metrotimes.example/2026/11/registration-extended", publisher: "Metro Times", stance: "SUPPORTS", snippet: "The commission announced the extension on Monday after a rise in online applications.", publishedAt: daysAgo(4) }),
      evidence({ id: "ev-2c", claimId: "cl-2a", kind: "WEB_SOURCE", title: "First-time voters get extra weeks to register", url: "https://citywire.example/news/registration-deadline", publisher: "City Wire News", stance: "SUPPORTS", snippet: "Officials confirmed the new deadline of 30 November.", publishedAt: daysAgo(4) }),
    ],
    reviews: [
      { id: "rv-2", reviewerName: "Demo Reviewer", verdict: "ACCURATE", publicNote: "", internalNote: null, createdAt: daysAgo(4, 13) },
    ],
  },
  {
    id: "rally-crowd-photo",
    type: "IMAGE",
    title: "Photo said to show a huge crowd at yesterday's rally",
    url: null,
    text: "Massive crowd at yesterday's rally in Riverton! The media won't show you this.",
    imageUrl: "/demo/rally-crowd.svg",
    status: "PUBLISHED",
    steps: { ...ALL_DONE, image: "done" },
    error: null,
    aiVerdict: "MISLEADING",
    aiConfidence: 0.88,
    aiSummary:
      "Reverse image search found the same photo in a 2022 sports report [ev-3a]. The crowd wears team scarves and there are no campaign banners [ev-3d]. A fact-checker reached the same conclusion [ev-3e].",
    finalVerdict: "MISLEADING",
    publicNote:
      "The photo is real, but it was taken at a football final in 2022, not at a political rally. It is being shared with a false description.",
    createdAt: daysAgo(3, 8),
    publishedAt: daysAgo(3, 12),
    userId: DEMO_USERS.citizen.id,
    contentHash: "demo-3",
    claims: [{ id: "cl-3a", text: "The photo shows the crowd at yesterday's rally in Riverton." }],
    evidence: [
      evidence({ id: "ev-3a", claimId: "cl-3a", kind: "IMAGE_MATCH", title: "Same photo published in August 2022", url: "https://citywire.example/sport/2022/cup-final-fans", publisher: "City Wire News", stance: "REFUTES", snippet: "Earliest copy found: 14 Aug 2022, in an article titled 'Fans celebrate cup final win'.", publishedAt: new Date("2022-08-14") }),
      evidence({ id: "ev-3b", kind: "IMAGE_METADATA", title: "No camera metadata", snippet: "Camera details and date were removed. The file was last saved by a mobile photo editing app." }),
      evidence({ id: "ev-3c", kind: "OCR_TEXT", title: "No readable text in the image", snippet: "No words or signs could be read." }),
      evidence({ id: "ev-3d", kind: "AI_IMAGE_NOTES", title: "AI observations (not proof)", snippet: "Many people wear matching team scarves. No campaign flags, banners or stage are visible." }),
      evidence({ id: "ev-3e", claimId: "cl-3a", kind: "FACT_CHECK", title: "Old football crowd photo shared as election rally", url: "https://truthlens.example/checks/riverton-crowd", publisher: "TruthLens", rating: "Misleading", stance: "REFUTES", publishedAt: daysAgo(3) }),
    ],
    reviews: [
      { id: "rv-3", reviewerName: "Demo Reviewer", verdict: "MISLEADING", publicNote: "", internalNote: "Confirmed the 2022 article by hand.", createdAt: daysAgo(3, 12) },
    ],
  },
  {
    id: "moon-wifi-satire",
    type: "URL",
    title: "Candidate promises free Wi-Fi on the Moon by 2027",
    url: "https://ballotboxgazette.example/candidate-promises-wifi-on-the-moon",
    text: "In a bold campaign speech, the candidate promised that every voter would get free Wi-Fi on the Moon by 2027, paid for by 'space tourism taxes'.",
    imageUrl: null,
    status: "PUBLISHED",
    steps: ALL_DONE,
    error: null,
    aiVerdict: "SATIRE",
    aiConfidence: 0.9,
    aiSummary: "The website is listed as a satire site [ev-4a] and its About page says every story is a joke [ev-4b].",
    finalVerdict: "SATIRE",
    publicNote: "This story comes from a parody website that says all of its articles are satire. It is a joke, not a real campaign promise.",
    createdAt: daysAgo(2, 14),
    publishedAt: daysAgo(2, 16),
    userId: null,
    contentHash: "demo-4",
    claims: [{ id: "cl-4a", text: "A candidate promised free Wi-Fi on the Moon by 2027." }],
    evidence: [
      evidence({ id: "ev-4a", kind: "SOURCE_INFO", title: "ballotboxgazette.example is a satire website", url: "https://ballotboxgazette.example", publisher: "The Ballot Box Gazette", snippet: "Listed as Satire · trust 20/100 · domain registered in 2019" }),
      evidence({ id: "ev-4b", claimId: "cl-4a", kind: "WEB_SOURCE", title: "About the Ballot Box Gazette", url: "https://ballotboxgazette.example/about", publisher: "The Ballot Box Gazette", stance: "REFUTES", snippet: "Every story on this site is satire. Please do not take it seriously." }),
    ],
    reviews: [
      { id: "rv-4", reviewerName: "Demo Reviewer", verdict: "SATIRE", publicNote: "", internalNote: null, createdAt: daysAgo(2, 16) },
    ],
  },
  {
    id: "ballots-in-river",
    type: "IMAGE",
    title: "Photo claims marked ballot papers were dumped in a river",
    url: null,
    text: "Thousands of ballot papers found in the river near Station 14. The election is rigged!",
    imageUrl: "/demo/ballot-papers.svg",
    status: "NEEDS_REVIEW",
    steps: { ...ALL_DONE, image: "done" },
    error: null,
    aiVerdict: "MISLEADING",
    aiConfidence: 0.68,
    aiSummary:
      "Text in the photo includes the word 'SPECIMEN' [ev-5c], and the papers look unmarked [ev-5d]. A news report describes a voter-education drive that handed out specimen ballots in the same district [ev-5e]. The election office says it is still looking into a report from Station 14 [ev-5f]. No earlier copy of the photo was found [ev-5a]. Suggested verdict: Misleading, unless the investigation finds real ballots.",
    finalVerdict: null,
    publicNote: null,
    createdAt: hoursAgo(5),
    publishedAt: null,
    userId: DEMO_USERS.citizen.id,
    contentHash: "demo-5",
    claims: [
      { id: "cl-5a", text: "Marked ballot papers were dumped in a river near Station 14." },
      { id: "cl-5b", text: "The election is rigged." },
    ],
    evidence: [
      evidence({ id: "ev-5a", claimId: "cl-5a", kind: "IMAGE_MATCH", title: "No earlier copies found", stance: "NEUTRAL", snippet: "Reverse image search found no copy older than this week, so the photo may be new." }),
      evidence({ id: "ev-5b", kind: "IMAGE_METADATA", title: "Taken on a phone this week", snippet: "Date taken: 2 days ago, 18:42 · Camera: smartphone · GPS location present (hidden from the public page)." }),
      evidence({ id: "ev-5c", claimId: "cl-5a", kind: "OCR_TEXT", title: "Text found in the image", stance: "REFUTES", snippet: "“SPECIMEN”, “DISTRICT 7”, “NOT VALID FOR VOTING” (partly hidden)" }),
      evidence({ id: "ev-5d", claimId: "cl-5a", kind: "AI_IMAGE_NOTES", title: "AI observations (not proof)", snippet: "The papers look unmarked. The ballot layout has no serial-number box, unlike the official sample ballot." }),
      evidence({ id: "ev-5e", claimId: "cl-5a", kind: "WEB_SOURCE", title: "Voter-education drive hands out 5,000 specimen ballots", url: "https://dailyledger.example/2026/11/specimen-ballots-district-7", publisher: "The Daily Ledger", stance: "REFUTES", snippet: "Volunteers used specimen ballots to show first-time voters how to mark a ballot.", publishedAt: daysAgo(5) }),
      evidence({ id: "ev-5f", claimId: "cl-5a", kind: "WEB_SOURCE", title: "Statement on a report from Station 14", url: "https://elections.gov.example/statements/station-14", publisher: "National Election Commission", stance: "NEUTRAL", snippet: "The district office has received a report and is checking it. Real ballots are stored in sealed boxes.", publishedAt: hoursAgo(2) }),
    ],
    reviews: [],
  },
  {
    id: "voter-id-rule",
    type: "URL",
    title: "New rule: voters must bring two ID documents",
    url: "https://vote-alert-today.example/new-rule-two-ids",
    text: "Breaking: starting this election, every voter must show TWO government ID documents at the polling station. One ID will not be accepted.",
    imageUrl: null,
    status: "NEEDS_REVIEW",
    steps: ALL_DONE,
    error: null,
    aiVerdict: "FALSE",
    aiConfidence: 0.81,
    aiSummary:
      "The website is unknown and was registered 12 days ago [ev-6a]. The official voter guide says one valid photo ID is enough [ev-6b], and a news outlet quotes the commission saying there are no new ID rules [ev-6c]. No existing fact-check was found.",
    finalVerdict: null,
    publicNote: null,
    createdAt: hoursAgo(3),
    publishedAt: null,
    userId: DEMO_USERS.citizen.id,
    contentHash: "demo-6",
    claims: [{ id: "cl-6a", text: "Voters must show two government ID documents at the polling station." }],
    evidence: [
      evidence({ id: "ev-6a", kind: "SOURCE_INFO", title: "vote-alert-today.example is an unknown website", url: "https://vote-alert-today.example", snippet: "Not in our source list · domain registered 12 days ago · no author names or contact page" }),
      evidence({ id: "ev-6b", claimId: "cl-6a", kind: "WEB_SOURCE", title: "What to bring on polling day", url: "https://voters.gov.example/polling-day/id", publisher: "Voter Registration Office", stance: "REFUTES", snippet: "Bring one valid photo ID, such as a national ID card, passport or driving licence.", publishedAt: daysAgo(30) }),
      evidence({ id: "ev-6c", claimId: "cl-6a", kind: "WEB_SOURCE", title: "No new ID rules for this election, commission says", url: "https://metrotimes.example/2026/11/no-new-id-rules", publisher: "Metro Times", stance: "REFUTES", publishedAt: daysAgo(1) }),
    ],
    reviews: [],
  },
  {
    id: "counting-livestream",
    type: "TEXT",
    title: "Message says vote counting will not be livestreamed this year",
    url: null,
    text: "They have cancelled the livestream of the vote count so nobody can watch what happens. Share before they delete this!",
    imageUrl: null,
    status: "PROCESSING",
    steps: { extract: "done", sourceInfo: "skipped", image: "skipped", claims: "done", factCheck: "running", webEvidence: "pending", synthesize: "pending" },
    error: null,
    aiVerdict: null,
    aiConfidence: null,
    aiSummary: null,
    finalVerdict: null,
    publicNote: null,
    createdAt: hoursAgo(1.5),
    publishedAt: null,
    userId: DEMO_USERS.citizen.id,
    contentHash: "demo-7",
    claims: [{ id: "cl-7a", text: "The livestream of the vote count has been cancelled." }],
    evidence: [],
    reviews: [],
  },
  {
    id: "turnout-projection",
    type: "URL",
    title: "Article says turnout could reach a 30-year high",
    url: "https://metrotimes.example/2026/11/turnout-projection",
    text: null,
    imageUrl: null,
    status: "QUEUED",
    steps: {},
    error: null,
    aiVerdict: null,
    aiConfidence: null,
    aiSummary: null,
    finalVerdict: null,
    publicNote: null,
    createdAt: hoursAgo(0.3),
    publishedAt: null,
    userId: null,
    contentHash: "demo-8",
    claims: [],
    evidence: [],
    reviews: [],
  },
  {
    id: "video-link",
    type: "URL",
    title: "Video link: 'officials caught swapping ballot boxes'",
    url: "https://video-share.example/watch/ballot-box-swap",
    text: null,
    imageUrl: null,
    status: "FAILED",
    steps: { extract: "failed" },
    error: "The site blocked automatic reading. Ask the person who sent it to paste the text or upload a screenshot.",
    aiVerdict: null,
    aiConfidence: null,
    aiSummary: null,
    finalVerdict: null,
    publicNote: null,
    createdAt: daysAgo(1, 17),
    publishedAt: null,
    userId: null,
    contentHash: "demo-9",
    claims: [],
    evidence: [],
    reviews: [],
  },
];
