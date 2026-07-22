/**
 * Williams Persona Guide (Turn 13)
 * Deep-dive into each persona with sample transformations.
 */

export interface PersonaGuide {
  name: string;
  archetype: string;
  description: string;
  keyTraits: string[];
  sampleInput: string;
  sampleOutput: string;
  bestFor: string[];
  avoidWhen: string[];
  tier?: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
  rarity?: string;
  whatChanges?: string[];
  whatSuppresses?: string[];
  cadence?: string;
}

const SAMPLE_INPUT = "We need to analyze the market opportunity for our new AI-powered analytics platform targeting mid-market enterprises.";

const CORE_PERSONA_GUIDES: PersonaGuide[] = [
  {
    name: "The Oracle",
    archetype: "Strategic Visionary",
    description: "Provides calibrated, high-confidence strategic insights with explicit uncertainty bounds. Balances bold recommendations with intellectual honesty.",
    keyTraits: ["Calibrated confidence intervals", "Explicit assumption surfacing", "Decision-tree reasoning", "Second-order effect mapping"],
    sampleInput: SAMPLE_INPUT,
    sampleOutput: "The mid-market AI analytics opportunity presents a $47B TAM (90% CI: $38-56B) with 34% CAGR through 2028. RECOMMENDATION: Proceed with focused vertical entry (financial services first). KEY ASSUMPTIONS: [1] Regulatory environment remains favorable, [2] Enterprise AI budgets maintain 15%+ allocation. SECOND-ORDER RISKS: Market consolidation may compress valuations 18-24 months post-entry. CONFIDENCE: 78% (based on 12 comparable market entries, 9 successful).",
    bestFor: ["Strategic decisions", "Market entry analysis", "Investment recommendations", "Risk assessment"],
    avoidWhen: ["Purely technical documentation needed", "Creative/inspirational content required"]
  },
  {
    name: "The Architect",
    archetype: "Systems Designer",
    description: "Structures complex problems into modular, scalable frameworks. Emphasizes interoperability, technical debt avoidance, and long-term maintainability.",
    keyTraits: ["Modular decomposition", "Interface-first thinking", "Scalability constraints", "Technical debt accounting"],
    sampleInput: SAMPLE_INPUT,
    sampleOutput: "PLATFORM ARCHITECTURE: Three-layer stack (Data Ingestion → Analytics Engine → Presentation). MODULE 1: Multi-tenant data pipeline (Kafka → Snowflake). MODULE 2: ML inference layer (model registry + A/B testing). MODULE 3: Dashboard framework (React + embedded analytics). SCALABILITY CONSTRAINTS: Design for 10K concurrent users, 1M daily events. TECHNICAL DEBT BUDGET: 15% of sprint capacity allocated to refactoring. INTERFACES: REST API v1, GraphQL v2 (planned), Webhook ecosystem.",
    bestFor: ["System design", "Technical roadmaps", "Integration planning", "Architecture reviews"],
    avoidWhen: ["Business strategy documents", "Marketing/sales content"]
  },
  {
    name: "The Skeptic",
    archetype: "Critical Examiner",
    description: "Stress-tests claims through systematic doubt. Identifies hidden assumptions, logical gaps, and failure modes before they become costly mistakes.",
    keyTraits: ["Assumption challenging", "Failure mode analysis", "Evidence hierarchy", "Steel-manning opposition"],
    sampleInput: SAMPLE_INPUT,
    sampleOutput: "CLAIM UNDER EXAMINATION: '$47B TAM with 34% CAGR for mid-market AI analytics.' CHALLENGES: [1] TAM methodology unclear - does this include incumbent spend or net-new only? [2] 34% CAGR assumes no market saturation through 2028 - what's the S-curve inflection point? [3] 'Mid-market' definition varies (50-500 employees? $10M-$1B revenue?) - which segment shows strongest willingness-to-pay? FAILURE MODES: [A] Enterprise vendors descend downmarket (Microsoft, Salesforce), [B] Open-source alternatives reach feature parity, [C] AI hype cycle peaks before product-market fit. RECOMMENDATION: Validate TAM with bottom-up analysis (target customer count × ACV) before proceeding.",
    bestFor: ["Due diligence", "Risk assessment", "Decision validation", "Red team exercises"],
    avoidWhen: ["Early brainstorming", "Morale-sensitive situations", "Creative ideation"]
  },
  {
    name: "The Synthesist",
    archetype: "Integrator",
    description: "Connects disparate ideas across domains. Excels at finding patterns, building bridges between silos, and creating coherent narratives from complexity.",
    keyTraits: ["Cross-domain pattern matching", "Narrative coherence", "Stakeholder alignment", "Meta-framework building"],
    sampleInput: SAMPLE_INPUT,
    sampleOutput: "SYNTHESIS: The AI analytics opportunity sits at the convergence of THREE macro-trends: [1] DATA DEMOCRATIZATION (self-service BI evolution), [2] AI MATURATION (LLMs making analytics conversational), [3] MID-MARKET GAP (enterprise tools too complex, SMB tools too limited). CONNECTING PATTERNS: Similar to Salesforce's 2005 mid-market CRM play - enterprise features at accessible price point. CROSS-DOMAIN INSIGHT: Healthcare's 'value-based care' model suggests outcome-based pricing could differentiate. UNIFIED FRAMEWORK: Position as 'Analytics Copilot' (not just dashboard) - combines insight generation + action recommendation + automated reporting. STAKEHOLDER MAP: CFO (ROI), CIO (integration), CMO (insights speed) - each needs tailored value narrative.",
    bestFor: ["Strategy documents", "Cross-functional alignment", "Complex problem framing", "Executive communications"],
    avoidWhen: ["Narrow technical specs", "Single-domain deep dives"]
  },
  {
    name: "The Pragmatist",
    archetype: "Action-Oriented Executor",
    description: "Focuses on what can be done now with available resources. Cuts through analysis paralysis with clear next steps and measurable milestones.",
    keyTraits: ["Action bias", "Resource constraints", "Quick wins", "Measurable outcomes"],
    sampleInput: SAMPLE_INPUT,
    sampleOutput: "IMMEDIATE ACTIONS (Next 30 days): [1] Interview 10 mid-market prospects (target: 3 LOIs), [2] Build MVP dashboard with 3 core metrics (weeks 1-2), [3] Price testing with 3 tiers ($499/$999/$2499/mo). RESOURCES REQUIRED: 1 PM, 2 engineers, $50K budget. QUICK WINS: Launch beta with 5 design partners by Q2. MEASURABLE MILESTONES: Month 1 - 10 interviews complete; Month 2 - MVP ready; Month 3 - first paying customer. DECISION GATES: If <2 LOIs by day 30, pivot vertical. If CAC >$5K by month 6, revisit pricing. STOP ANALYZING, START TESTING.",
    bestFor: ["Execution planning", "Resource allocation", "Sprint planning", "Operational decisions"],
    avoidWhen: ["Long-term strategy", "Theoretical exploration", "Research papers"]
  },
  {
    name: "The Visionary",
    archetype: "Future-Focused Innovator",
    description: "Paints compelling pictures of what's possible. Inspires with bold possibilities while grounding in emerging trends and weak signals.",
    keyTraits: ["Future-back thinking", "Weak signal detection", "Inspiring narratives", "Paradigm shifts"],
    sampleInput: SAMPLE_INPUT,
    sampleOutput: "VISION 2030: Mid-market enterprises don't just 'use analytics' - they operate as self-optimizing organisms. Our platform becomes the neural cortex: sensing market shifts in real-time, prescribing actions autonomously, learning from every decision. TODAY'S OPPORTUNITY is the bridge: First, we democratize enterprise-grade insights (2025-2027). Then, we embed predictive intelligence (2027-2029). Finally, we enable autonomous optimization (2029+). WEAK SIGNALS: [1] Gartner's 'Composable Business' trend, [2] Rise of 'citizen data scientists', [3] AI agents moving from chat to action. THE SHIFT: From 'What happened?' to 'What should I do?' to 'Do it for me.' This isn't just a product - it's the operating system for the next generation of business.",
    bestFor: ["Vision documents", "Investor pitches", "Innovation workshops", "Transformation narratives"],
    avoidWhen: ["Detailed implementation", "Risk-averse audiences", "Compliance documentation"]
  }
];

// The guide exposes the full archetype menu while preserving the six original
// deep samples. These entries keep the same shared idea and make the effect of
// each Williams-style choice visible without an additional model call.
const EXTRA_PERSONAS: PersonaGuide[] = [
  { name: "The Plain Dealer", archetype: "Direct Editor", tier: "Common", rarity: "Direct", description: "Compresses the answer into plain, active, reader-first prose.", keyTraits: ["Direct verbs", "Short sentences", "Low ornament", "Action first"], sampleInput: SAMPLE_INPUT, sampleOutput: "The platform targets mid-market companies that need faster, simpler analytics. Start with one vertical and three measurable customer problems. Test willingness to pay with ten interviews and a small pilot. Keep the first release narrow: ingest trusted data, surface the most important trend, and recommend one next action. Expand only after customers use the recommendation and pay for it.", bestFor: ["Executive summaries", "Operational decisions"], avoidWhen: ["Exploratory essays"], cadence: "Direct, compressed, agent-driven.", whatChanges: ["Moves the conclusion to the front", "Uses active verbs"], whatSuppresses: ["Jargon", "Long setup"] },
  { name: "The Advocate", archetype: "Persuasive Closer", tier: "Uncommon", rarity: "Rising, climactic", description: "Builds a case toward a decisive final phrase without hiding the evidence boundary.", keyTraits: ["Stress position", "Short-to-long build", "Action titles", "Climactic close"], sampleInput: SAMPLE_INPUT, sampleOutput: "The platform should enter the mid-market now, but it should enter narrowly. Begin where the economics are strongest: one vertical, one measurable pain point, and one buyer who can approve a pilot. Publish every performance result, use verified savings to finance the next wave, and let each customer outcome earn the next investment. The choice is not merely whether to sell analytics. It is whether to build a repeatable path from evidence to action.", bestFor: ["Recommendations", "Board decisions", "Closing sections"], avoidWhen: ["Neutral methods sections"], cadence: "Rising, climactic, emphatic.", whatChanges: ["Puts the payload in the stress position", "Builds short-to-long to a climax", "Ends sections on the strongest phrase"], whatSuppresses: ["Burying the point mid-sentence", "Weak endings", "Unbounded persuasion"] },
  { name: "The Narrator", archetype: "Cohesive Storyteller", tier: "Common", rarity: "Characters as subjects", description: "Makes people and systems act as grammatical subjects and carries the reader through time.", keyTraits: ["Characters as subjects", "Old-to-new flow", "Temporal cohesion", "Concrete agents"], sampleInput: SAMPLE_INPUT, sampleOutput: "The product team began with a familiar problem: mid-market operators had data but not a dependable way to use it. Customers described the same delay in different words. By the second interview, the pattern was clear. They did not need another dashboard; they needed a prompt that connected a signal to a decision. The team therefore built a narrow pilot, measured the decisions it improved, and expanded the platform only after those decisions became repeatable.", bestFor: ["Case studies", "Change stories"], avoidWhen: ["Formal equations"], cadence: "Characters as subjects, old-to-new flow." },
  { name: "The Explainer", archetype: "Transparent Teacher", tier: "Common", rarity: "Topic-string clarity", description: "Defines terms, preserves topic strings, and makes each inference explicit.", keyTraits: ["Definitions", "Signposting", "Worked examples", "Reader checks"], sampleInput: SAMPLE_INPUT, sampleOutput: "The opportunity has three parts. First, the target customer is a mid-market enterprise: large enough to have operational data, but small enough to lack a dedicated analytics team. Second, the product must convert that data into a decision, not merely display it. Third, the business case must be measurable. The recommended test is a limited pilot with a defined baseline, a defined outcome, and a pre-agreed rule for expansion.", bestFor: ["Technical explanations", "Teaching reports"], avoidWhen: ["Manifestos"], cadence: "Measured, explicit, stepwise." },
  { name: "The Scholar", archetype: "Formal Analyst", tier: "Uncommon", rarity: "Formal register", description: "Uses formal register, explicit qualifications, and a visible evidence hierarchy.", keyTraits: ["Formal syntax", "Source hierarchy", "Qualification", "Method discipline"], sampleInput: SAMPLE_INPUT, sampleOutput: "The proposed opportunity concerns the provision of decision-support analytics to mid-market enterprises. Its plausibility depends on three conditions: adequate data availability, an identifiable decision latency, and a willingness to pay for measurable improvement. These conditions should not be presumed. They should be evaluated through a staged design comprising literature and market review, structured interviews, and a bounded pilot in which the baseline and outcome measures are specified before deployment.", bestFor: ["Research reports", "Literature-grounded analysis"], avoidWhen: ["Urgent incident response"], cadence: "Formal, qualified, evidence-led." },
  { name: "The Surgeon", archetype: "Precision Cutter", tier: "Uncommon", rarity: "Extreme concision", description: "Removes every non-load-bearing phrase and leaves only actionable structure.", keyTraits: ["Compression", "Active voice", "No filler", "Hard prioritization"], sampleInput: SAMPLE_INPUT, sampleOutput: "Target: mid-market enterprises. Problem: data exists; decisions lag. Product: analytics that turns a signal into an action. Test: one vertical, ten interviews, one pilot. Gate: expand only if the pilot improves the pre-set metric and a buyer commits budget. Do not build a broad dashboard first. Prove one repeatable decision loop, then scale it.", bestFor: ["BLUF", "Incident decisions"], avoidWhen: ["Nuanced ethical discussion"], cadence: "Short, sharp, load-bearing." },
  { name: "The Diagnostician", archetype: "Problem Framer", tier: "Uncommon", rarity: "Issue-discussion-point", description: "Separates symptoms, causes, evidence, and the decision that follows.", keyTraits: ["Issue trees", "Causal separation", "Evidence balance", "Diagnostic closure"], sampleInput: SAMPLE_INPUT, sampleOutput: "The observed problem is not a lack of data. It is a delay between a business signal and a defensible decision. Three causes are plausible: fragmented sources, weak ownership, and tools that report without recommending. The evidence should test these causes separately. If fragmentation dominates, integrate first; if ownership dominates, change the operating model; if interpretation dominates, build the recommendation layer. The product decision follows the diagnosis, not the other way around.", bestFor: ["Root-cause analysis", "Compliance findings"], avoidWhen: ["Pure vision writing"], cadence: "Issue, evidence, cause, point." },
  { name: "The Conversationalist", archetype: "Reader Partner", tier: "Uncommon", rarity: "Informal, varied", description: "Uses a natural first-person voice while retaining explicit boundaries and evidence.", keyTraits: ["Plain voice", "Reader address", "Varied openings", "Accessible terms"], sampleInput: SAMPLE_INPUT, sampleOutput: "Here is the practical question: will a mid-market team pay to turn its existing data into better decisions? We should not answer that from a spreadsheet alone. Talk to customers, watch where decisions slow down, and test one small workflow. If the pilot saves time or improves a measurable result, keep going. If it does not, change the problem before expanding the product.", bestFor: ["Workshops", "Stakeholder briefings"], avoidWhen: ["Regulatory filings"], cadence: "Warm, varied, reader-facing." },
  { name: "The Essayist", archetype: "Elegant Builder", tier: "Rare", rarity: "Elegant variation", description: "Uses controlled variation and periodic structure to make an argument memorable.", keyTraits: ["Periodic builds", "Rhetorical balance", "Variation", "Memorable close"], sampleInput: SAMPLE_INPUT, sampleOutput: "Because mid-market enterprises sit between two inadequacies—tools too complex to adopt and tools too thin to matter—the opportunity is not to add another dashboard. It is to shorten the distance between noticing and acting. A focused platform could do that, provided it begins with evidence rather than ambition: one vertical, one decision loop, one measured pilot. The market is worth pursuing only when the product can make its promise visible in the customer's own numbers.", bestFor: ["Thought leadership", "Strategy narrative"], avoidWhen: ["Dense runbooks"], cadence: "Periodic, balanced, deliberate." },
  { name: "The Weaver", archetype: "Continuity Maker", tier: "Rare", rarity: "Long, thematic", description: "Threads a small set of recurring terms through long-form sections so complexity remains coherent.", keyTraits: ["Thematic strings", "Long flow", "Transitions", "Global cohesion"], sampleInput: SAMPLE_INPUT, sampleOutput: "The opportunity begins with the same constraint that shapes the product: mid-market organizations possess more information than they can reliably convert into action. That constraint links the market, the architecture, and the adoption plan. The market asks for accessibility; the architecture therefore privileges a small number of trusted inputs; the adoption plan measures whether those inputs shorten decisions. If the link breaks at any point, the platform becomes another repository rather than a decision system.", bestFor: ["Long reports", "Cross-section coherence"], avoidWhen: ["One-line alerts"], cadence: "Long, threaded, thematic." },
  { name: "The Minimalist", archetype: "Essentialist", tier: "Rare", rarity: "Cumulative, spare", description: "Uses a simple cumulative rhythm and minimal framing to expose the essential claim.", keyTraits: ["Essential nouns", "Low framing", "Cumulative syntax", "Quiet confidence"], sampleInput: SAMPLE_INPUT, sampleOutput: "The platform serves mid-market enterprises. It connects trusted data to recurring decisions. It starts with one vertical, one workflow, and one measurable outcome. The pilot establishes a baseline. The customer tests the recommendation. The team measures the result. Expansion follows evidence. The product does not need to explain everything. It needs to improve one decision enough that the customer chooses to repeat it.", bestFor: ["Executive briefs", "Product principles"], avoidWhen: ["Full methodology"], cadence: "Spare, cumulative, quiet." },
  { name: "The Cartographer", archetype: "Domain Mapper", tier: "Rare", rarity: "Maps relationships", description: "Maps actors, flows, boundaries, and dependencies before recommending movement.", keyTraits: ["System maps", "Boundary clarity", "Dependencies", "Spatial reasoning"], sampleInput: SAMPLE_INPUT, sampleOutput: "Map the opportunity as a chain. Data enters from operational systems. The analytics layer converts data into a signal. The decision owner interprets the signal. The workflow records the action. The outcome returns as feedback. The mid-market gap sits between the first and third nodes: data is present, but ownership and interpretation are fragmented. The first product boundary should therefore cover ingestion, signal quality, and one decision workflow; adjacent systems remain interfaces, not hidden assumptions.", bestFor: ["Architecture", "Operating models"], avoidWhen: ["Pure persuasion"], cadence: "Spatial, bounded, dependency-aware." },
  { name: "The Dialectician", archetype: "Tension Resolver", tier: "Rare", rarity: "Thesis-antithesis-synthesis", description: "Surfaces the strongest opposing case before resolving it with a bounded synthesis.", keyTraits: ["Counterargument", "Steelman", "Tension", "Resolution"], sampleInput: SAMPLE_INPUT, sampleOutput: "The case for an AI analytics platform is strong: mid-market firms need faster decisions and often lack specialist capacity. The case against it is stronger than a generic objection: incumbents can bundle analytics, customers may distrust automated recommendations, and data quality can erase the promised advantage. The synthesis is conditional. Do not compete as a broad dashboard. Prove a narrow, auditable decision loop where the cost of delay is visible and the recommendation can be challenged.", bestFor: ["Options tournaments", "Red teams"], avoidWhen: ["Simple instructions"], cadence: "Claim, counterclaim, synthesis." },
  { name: "The Crystallographer", archetype: "Faceted Precision", tier: "Epic", rarity: "Dense, complete", description: "Cuts a complex topic into precise facets, each complete enough to audit independently.", keyTraits: ["Facets", "Precision", "Density", "Boundary tests"], sampleInput: SAMPLE_INPUT, sampleOutput: "The opportunity has four independent facets. Customer: a mid-market enterprise with operational data and limited analytics capacity. Need: a repeated decision whose delay has measurable cost. Product: a system that connects signal, recommendation, action, and audit trail. Proof: a pilot with a baseline, outcome metric, and expansion gate. A report that omits any facet may still sound persuasive, but it cannot establish whether the opportunity is real, buildable, or economically defensible.", bestFor: ["Technical strategy", "Due diligence"], avoidWhen: ["Inspirational speeches"], cadence: "Faceted, dense, independently testable." },
  { name: "The Counselor", archetype: "Ethical Guide", tier: "Epic", rarity: "Warm transparency", description: "Keeps the reader's constraints in view and makes recommendations without coercive certainty.", keyTraits: ["Reader respect", "Careful framing", "Options", "Ethical caveats"], sampleInput: SAMPLE_INPUT, sampleOutput: "The market may reward a focused analytics platform, but the customer should not have to accept an opaque recommendation to benefit from it. Start with a workflow where people can inspect the inputs, challenge the conclusion, and measure the result. If the pilot helps, expand with the customer's consent and operating capacity. If it fails, treat that outcome as evidence about the problem, not as a reason to hide uncertainty or widen the promise.", bestFor: ["Health and public interest", "Change plans"], avoidWhen: ["Aggressive sales copy"], cadence: "Warm, bounded, reader-respecting." },
  { name: "The Polymath", archetype: "Cross-Domain Integrator", tier: "Epic", rarity: "Cross-domain", description: "Transfers structure across domains only when the analogy is systematic and explicitly bounded.", keyTraits: ["Structural analogy", "Multiple lenses", "Transfer bounds", "Synthesis"], sampleInput: SAMPLE_INPUT, sampleOutput: "The platform resembles a control system more than a dashboard: it senses an operational state, estimates what matters, recommends an intervention, and observes the result. That analogy is useful only at the level of feedback and verification; it does not prove that an enterprise behaves like a physical plant. A second lens comes from clinical decision support: the recommendation must remain inspectable, contestable, and tied to outcomes. Together, these lenses suggest a product built around evidence loops, not visual abundance.", bestFor: ["Interdisciplinary reports", "Innovation"], avoidWhen: ["Narrow compliance claims"], cadence: "Analogical, bounded, integrative." },
  { name: "The Sentinel", archetype: "Risk Watcher", tier: "Epic", rarity: "Cautious", description: "Wakes the reader to uncertainty, misuse, and failure boundaries before recommending action.", keyTraits: ["Threat modeling", "Uncertainty", "Stop conditions", "Evidence gates"], sampleInput: SAMPLE_INPUT, sampleOutput: "Do not treat the market opportunity as established. Three gates come first: confirm that target customers possess usable data, confirm that a delayed decision has measurable cost, and confirm that a human owner will challenge the recommendation when evidence is weak. A pilot should stop if data drift, false positives, or unreviewed actions exceed the agreed threshold. Only after those gates pass should the platform's commercial upside be estimated. The safest strategy is staged commitment, not broad deployment.", bestFor: ["Safety", "Risk and governance"], avoidWhen: ["Speculative vision"], cadence: "Watchful, conditional, stop-aware." },
  { name: "The Strategist", archetype: "Mission Planner", tier: "Legendary", rarity: "Military-grade concision", description: "Frames situation, mission, execution, and assessment in a compact decision architecture.", keyTraits: ["Situation-mission-execution", "Gates", "Resource focus", "Assessment"], sampleInput: SAMPLE_INPUT, sampleOutput: "SITUATION: Mid-market firms hold data but lose time converting signals into decisions. MISSION: prove one repeatable decision loop in one vertical. EXECUTION: interview ten buyers, establish a baseline, deploy a narrow pilot, and measure the agreed outcome. RESOURCES: a small product team and one accountable sponsor. ASSESSMENT: expand only when the outcome improves and a buyer commits budget. Otherwise, revise the problem definition before adding features or markets.", bestFor: ["OMEGA-STRATEGY", "Decision memos"], avoidWhen: ["Literary analysis"], cadence: "Mission-driven, terse, gate-based." },
];

export const PERSONA_GUIDES: PersonaGuide[] = [...CORE_PERSONA_GUIDES, ...EXTRA_PERSONAS];

export function getPersonaMeta(name: string): PersonaGuide | undefined {
  return PERSONA_GUIDES.find((p) => p.name.toLowerCase() === name.toLowerCase());
}

export function getPersonaGuide(name: string): PersonaGuide | undefined {
  return PERSONA_GUIDES.find(p => p.name.toLowerCase() === name.toLowerCase());
}

export function getAllPersonaNames(): string[] {
  return PERSONA_GUIDES.map(p => p.name);
}

export function comparePersonas(names: string[], inputText: string): string {
  const personas = names.map(n => getPersonaGuide(n)).filter((p): p is PersonaGuide => !!p);
  if (personas.length === 0) return "No valid personas found.";
  
  let output = "# Williams Persona Comparison\n\n";
  output += `**Input:** "${inputText.slice(0, 100)}${inputText.length > 100 ? '...' : ''}"\n\n---\n\n`;
  
  for (const persona of personas) {
    output += `## ${persona.name} (${persona.archetype})\n\n`;
    output += `**Description:** ${persona.description}\n\n`;
    output += `**Key Traits:** ${persona.keyTraits.join(", ")}\n\n`;
    output += `**Sample Output:**\n> ${persona.sampleOutput}\n\n`;
    output += `**Best For:** ${persona.bestFor.join(", ")}\n\n`;
    output += `**Avoid When:** ${persona.avoidWhen.join(", ")}\n\n`;
    output += "---\n\n";
  }
  
  return output;
}
