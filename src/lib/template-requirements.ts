/**
 * Evidence-safe output contract layered on top of the package templates.
 * These are prompt requirements, not claims that a report has met them.
 */
export type CitationStyle = "APA" | "MLA" | "Chicago" | "IEEE" | "AMA";

export const CITATION_STYLES: Array<{ id: CitationStyle; use: string; inline: string; refs: string }> = [
  { id: "APA", use: "social sciences, education, psychology", inline: "(Author, Year)", refs: "References" },
  { id: "MLA", use: "humanities, literature, philosophy", inline: "(Author Page)", refs: "Works Cited" },
  { id: "Chicago", use: "history and social sciences", inline: "footnote or (Author Year)", refs: "Notes and Bibliography" },
  { id: "IEEE", use: "engineering and computer science", inline: "[1]", refs: "References" },
  { id: "AMA", use: "medicine and health", inline: "superscript or [1]", refs: "References" },
];

const REQUIREMENTS: Record<string, string[]> = {
  "OMEGA-STRATEGY": [
    "Minimum analytical content: at least 3 explicit equations or quantitative formulas when the question has quantitative scope; otherwise state why a formula is not applicable.",
    "For TAM/SAM/SOM, value bridges, NPV, IRR, CAGR, or sensitivity claims, show inputs, units, formula, arithmetic, and source for every input.",
    "Use a decision table or weighted options rubric and make the recommendation traceable to the stated criteria.",
  ],
  "OMEGA-DILIGENCE": [
    "Minimum analytical content: at least 3 formulas when financial data are supplied: EBITDA bridge, working capital, valuation/IRR/MOIC, or sensitivity.",
    "Separate sourced fact, management assertion, analyst inference, and diligence request; never invent interviews, financials, or comparables.",
  ],
  "OMEGA-DISCOVERY": [
    "Minimum analytical content: at least 2 formulas or reproducible metrics for quantitative research; report denominator, sample, date, weighting, and uncertainty.",
    "Include methodology, disconfirming evidence, and source hierarchy before presenting a finding as a finding.",
  ],
  "OMEGA-COMPLIANCE": [
    "Minimum analytical content: risk score formula P x I, maturity scale definition, and control/evidence sufficiency logic when applicable.",
    "Every finding must distinguish observation, criterion, condition, cause, effect, and recommendation; do not assert compliance without evidence.",
  ],
  "OMEGA-BUILD": [
    "Minimum analytical content: capacity/latency or cost/TCO formula plus ROI/NPV/payback when a business case is requested.",
    "State architecture boundaries, interfaces, threat assumptions, test criteria, operational ownership, and rollback conditions.",
  ],
  "OMEGA-SCIENCE": [
    "Minimum analytical content: define the estimand, units, equation or statistical test, effect size, uncertainty interval, and assumptions.",
    "Do not place projected or hypothetical results in Results; use Protocol or Expected Outcomes and label them clearly.",
  ],
  "NIH-GRANT-SRF": [
    "Minimum analytical content: power/sample-size or effect-size formula where inferential work is proposed; show inputs and bounds.",
    "Label design choices [PROPOSED], missing evidence [DATA GAP], and assumptions with a plain-language disclaimer; none may be load-bearing without a verification plan.",
  ],
  "OMEGA-CRISIS": [
    "Minimum analytical content: runway, cash-flow, scenario, or risk formulas when financial facts are supplied; include time horizon and units.",
    "Separate verified facts from scenario assumptions and counsel-required questions; do not create official legal, privilege, or regulatory representations.",
  ],
};

export function getTemplateRequirements(templateId?: string, style: CitationStyle = "APA"): string {
  const rules = REQUIREMENTS[templateId || ""] || [
    "Use at least 2 transparent formulas or decision rules when the task is quantitative; otherwise explain why formulas are not applicable.",
    "Bind every load-bearing factual claim to evidence or mark it as a non-load-bearing, explicitly caveated proposal.",
  ];
  const citation = CITATION_STYLES.find((s) => s.id === style) || CITATION_STYLES[0];
  return [
    "TEMPLATE QUALITY FLOOR (mandatory, independent of persona):",
    ...rules.map((r) => `- ${r}`),
    "DETERMINISTIC CALCULATION GATE: every quantitative claim you include MUST (1) show a full step-by-step hand trace, (2) resolve to a concrete numeric answer, and (3) be written as an explicit checkable expression (e.g. $$1868 * 0.34 = 635.12$$ or 'x: 2x + 3 = 7'). Any equation that cannot be deterministically recomputed and confirmed must be removed rather than shipped. A report is not complete until at least the required number of equations pass this gate.",
    `CITATION STYLE: ${citation.id}. Inline form: ${citation.inline}. End section: ${citation.refs}.`,
    "CITATION INTEGRITY: use only source IDs present in the retrieved evidence ledger; run citation audit after every draft and every revision. A missing, untrusted, or unconfirmed citation must be removed with its unsupported load-bearing sentence before final output.",
    "STATUS LANGUAGE: [DATA GAP], [ASSUMPTION], [UNCERTAIN], and similar labels require an immediately adjacent plain-language disclaimer and verification action. They may not serve as the sole support for a load-bearing conclusion.",
    "HAND TRACE: include 'Appendix: Analytical Hand-Trace' with a claim, premises, formula or inference rule, inputs/units, arithmetic, source IDs, and verification status for every quantitative or logical claim.",
  ].join("\n");
}