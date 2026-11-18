import type { Source } from "@/lib/types";

/**
 * Real trusted sources for elections in India.
 *
 * Trust scores (0-100) are a starting point for reviewers, not a final judgement.
 * Admins can change them, add state election offices, or add sites with a
 * record of false stories at /admin/sources.
 *
 * Fact-checkers here are signatories of the International Fact-Checking
 * Network (IFCN) code of principles. Satire sites say on their own pages
 * that their stories are made up.
 */
export const INDIA_SOURCES: Source[] = [
  // Official
  { domain: "eci.gov.in", name: "Election Commission of India", type: "OFFICIAL", trust: 98, notes: "Schedules, results, rules and press notes. Covers results.eci.gov.in and voters.eci.gov.in." },
  { domain: "pib.gov.in", name: "Press Information Bureau (PIB)", type: "OFFICIAL", trust: 90, notes: "Government press releases. Runs PIB Fact Check." },
  { domain: "india.gov.in", name: "National Portal of India", type: "OFFICIAL", trust: 90, notes: null },
  { domain: "mygov.in", name: "MyGov", type: "OFFICIAL", trust: 85, notes: "Government citizen-engagement portal." },
  { domain: "ddnews.gov.in", name: "DD News (Doordarshan)", type: "NEWS", trust: 80, notes: "Public broadcaster." },
  { domain: "newsonair.gov.in", name: "All India Radio News", type: "NEWS", trust: 80, notes: "Public broadcaster." },

  // Fact-checkers (IFCN signatories)
  { domain: "altnews.in", name: "Alt News", type: "FACT_CHECKER", trust: 90, notes: "IFCN signatory." },
  { domain: "boomlive.in", name: "BOOM", type: "FACT_CHECKER", trust: 90, notes: "IFCN signatory." },
  { domain: "factly.in", name: "FACTLY", type: "FACT_CHECKER", trust: 88, notes: "IFCN signatory." },
  { domain: "newschecker.in", name: "Newschecker", type: "FACT_CHECKER", trust: 88, notes: "IFCN signatory. Publishes in several Indian languages." },
  { domain: "vishvasnews.com", name: "Vishvas News", type: "FACT_CHECKER", trust: 85, notes: "IFCN signatory. Hindi and regional languages." },
  { domain: "factcrescendo.com", name: "Fact Crescendo", type: "FACT_CHECKER", trust: 82, notes: "IFCN signatory." },
  { domain: "factcheck.afp.com", name: "AFP Fact Check", type: "FACT_CHECKER", trust: 90, notes: "IFCN signatory. Has an India desk." },

  // National news (English)
  { domain: "ptinews.com", name: "Press Trust of India (PTI)", type: "NEWS", trust: 85, notes: "News agency." },
  { domain: "thehindu.com", name: "The Hindu", type: "NEWS", trust: 85, notes: null },
  { domain: "indianexpress.com", name: "The Indian Express", type: "NEWS", trust: 85, notes: "Runs a fact-check section." },
  { domain: "hindustantimes.com", name: "Hindustan Times", type: "NEWS", trust: 80, notes: null },
  { domain: "livemint.com", name: "Mint", type: "NEWS", trust: 80, notes: null },
  { domain: "ndtv.com", name: "NDTV", type: "NEWS", trust: 78, notes: null },
  { domain: "timesofindia.indiatimes.com", name: "The Times of India", type: "NEWS", trust: 78, notes: null },
  { domain: "indiatoday.in", name: "India Today", type: "NEWS", trust: 78, notes: "Runs India Today Fact Check." },
  { domain: "thequint.com", name: "The Quint", type: "NEWS", trust: 78, notes: "Runs the WebQoof fact-check desk." },
  { domain: "deccanherald.com", name: "Deccan Herald", type: "NEWS", trust: 75, notes: null },
  { domain: "thewire.in", name: "The Wire", type: "NEWS", trust: 75, notes: null },
  { domain: "scroll.in", name: "Scroll", type: "NEWS", trust: 75, notes: null },

  // International news with India coverage
  { domain: "reuters.com", name: "Reuters", type: "NEWS", trust: 88, notes: "News agency." },
  { domain: "bbc.com", name: "BBC News", type: "NEWS", trust: 85, notes: "Includes BBC Hindi and BBC Urdu." },

  // Hindi news
  { domain: "bhaskar.com", name: "Dainik Bhaskar", type: "NEWS", trust: 72, notes: "Hindi." },
  { domain: "amarujala.com", name: "Amar Ujala", type: "NEWS", trust: 72, notes: "Hindi." },
  { domain: "jagran.com", name: "Dainik Jagran", type: "NEWS", trust: 72, notes: "Hindi." },
  { domain: "aajtak.in", name: "Aaj Tak", type: "NEWS", trust: 70, notes: "Hindi." },

  // Satire (says so on its own pages)
  { domain: "thefauxy.com", name: "The Fauxy", type: "SATIRE", trust: 20, notes: "Describes itself as a satire website." },
  { domain: "fakingnews.com", name: "Faking News", type: "SATIRE", trust: 20, notes: "Describes itself as satire." },
];
