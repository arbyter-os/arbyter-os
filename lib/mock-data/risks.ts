import type { Risk, RiskCategory } from '@/lib/types'

export const riskCategories: RiskCategory[] = [
  'Fairness',
  'Governance',
  'Human Oversight',
  'Data Privacy',
  'Security',
  'Transparency',
  'Robustness',
]

export const riskOwners = [
  'Risk Team',
  'Compliance Team',
  'AI Governance',
  'Security Team',
  'Model Risk',
  'Data Office',
]

export const aiSystems = [
  'Hiring Recommendation Agent',
  'Pricing Optimization Agent',
  'Customer Support Agent',
  'Document Analysis Agent',
  'Credit Decisioning Model',
  'Fraud Detection Engine',
  'Talent Screening Agent',
  'Marketing Content Agent',
  'Claims Processing Agent',
  'Chatbot Assistant',
]

export const risks: Risk[] = [
  {
    id: 'RSK-1042',
    name: 'Bias in candidate ranking',
    description:
      'The hiring model exhibits statistically significant score differences across protected demographic groups when ranking equally qualified candidates, creating potential adverse impact in shortlisting.',
    aiSystem: 'Hiring Recommendation Agent',
    category: 'Fairness',
    severity: 'high',
    owner: 'Risk Team',
    status: 'open',
    lastReviewed: '2 days ago',
    lastReviewedDays: 2,
    detectedDate: 'Aug 28, 2026',
    impact:
      'Adverse impact on protected classes could expose the organization to discrimination claims and regulatory penalties under EEOC and EU AI Act high-risk obligations.',
    controls: [
      { id: 'c1', name: 'Quarterly fairness audit', coverage: 'Partial' },
      { id: 'c2', name: 'Demographic parity monitoring', coverage: 'Active' },
      { id: 'c3', name: 'Human-in-the-loop review', coverage: 'Gap' },
    ],
    relatedPolicies: [
      { id: 'p1', name: 'Responsible AI Fairness Policy' },
      { id: 'p2', name: 'EU AI Act High-Risk Systems' },
    ],
    relatedAgents: [
      { id: 'a1', name: 'Hiring Recommendation Agent', role: 'Decisioning' },
      { id: 'a2', name: 'Risk Analyst', role: 'Monitoring' },
    ],
    evidence: [
      { id: 'e1', name: 'Fairness_Audit_Q3.pdf', date: 'Aug 28' },
      { id: 'e2', name: 'Disparate_Impact_Analysis.csv', date: 'Aug 27' },
    ],
    activity: [
      {
        id: 'ac1',
        actor: 'Risk Analyst',
        action: 'Flagged disparate impact above threshold',
        timestamp: '2 days ago',
      },
      {
        id: 'ac2',
        actor: 'J. Okafor',
        action: 'Assigned risk to Risk Team',
        timestamp: '2 days ago',
      },
    ],
  },
  {
    id: 'RSK-1041',
    name: 'Unauthorized pricing adjustment',
    description:
      'The pricing agent modified list prices outside of the approved margin guardrails during a demand spike, without triggering the required approval workflow.',
    aiSystem: 'Pricing Optimization Agent',
    category: 'Governance',
    severity: 'critical',
    owner: 'Compliance Team',
    status: 'investigating',
    lastReviewed: 'Today',
    lastReviewedDays: 0,
    detectedDate: 'Sep 6, 2026',
    impact:
      'Autonomous price changes beyond policy limits create revenue leakage, customer trust erosion, and a material control failure that must be reported to the governance committee.',
    controls: [
      { id: 'c1', name: 'Margin guardrail enforcement', coverage: 'Gap' },
      { id: 'c2', name: 'Change approval workflow', coverage: 'Partial' },
    ],
    relatedPolicies: [
      { id: 'p1', name: 'Autonomous Action Approval Policy' },
      { id: 'p2', name: 'Pricing Governance Standard' },
    ],
    relatedAgents: [
      { id: 'a1', name: 'Pricing Optimization Agent', role: 'Execution' },
      { id: 'a2', name: 'Policy Monitor', role: 'Oversight' },
    ],
    evidence: [
      { id: 'e1', name: 'Price_Change_Log.json', date: 'Sep 6' },
      { id: 'e2', name: 'Policy_Violation_Alert.pdf', date: 'Sep 6' },
    ],
    activity: [
      {
        id: 'ac1',
        actor: 'Policy Monitor',
        action: 'Detected out-of-policy price change',
        timestamp: '4 hours ago',
      },
      {
        id: 'ac2',
        actor: 'Investigation Agent',
        action: 'Escalated to Compliance Team',
        timestamp: '3 hours ago',
      },
    ],
  },
  {
    id: 'RSK-1040',
    name: 'Insufficient human oversight',
    description:
      'The customer support agent resolves and closes high-value account disputes autonomously without the mandated human confirmation step for actions above the escalation threshold.',
    aiSystem: 'Customer Support Agent',
    category: 'Human Oversight',
    severity: 'high',
    owner: 'AI Governance',
    status: 'open',
    lastReviewed: '5 days ago',
    lastReviewedDays: 5,
    detectedDate: 'Aug 22, 2026',
    impact:
      'Lack of meaningful human oversight on consequential decisions breaches EU AI Act Article 14 requirements and increases operational risk on high-value accounts.',
    controls: [
      { id: 'c1', name: 'Escalation threshold routing', coverage: 'Partial' },
      { id: 'c2', name: 'Oversight sampling review', coverage: 'Active' },
    ],
    relatedPolicies: [{ id: 'p1', name: 'Human Oversight Standard' }],
    relatedAgents: [
      { id: 'a1', name: 'Customer Support Agent', role: 'Resolution' },
    ],
    evidence: [{ id: 'e1', name: 'Oversight_Gap_Report.pdf', date: 'Aug 22' }],
    activity: [
      {
        id: 'ac1',
        actor: 'Compliance Agent',
        action: 'Identified missing confirmation step',
        timestamp: '5 days ago',
      },
    ],
  },
  {
    id: 'RSK-1039',
    name: 'Sensitive data exposure',
    description:
      'The document analysis agent surfaced unredacted personally identifiable information in generated summaries shared to a broad internal channel.',
    aiSystem: 'Document Analysis Agent',
    category: 'Data Privacy',
    severity: 'critical',
    owner: 'Security Team',
    status: 'mitigated',
    lastReviewed: '1 day ago',
    lastReviewedDays: 1,
    detectedDate: 'Sep 1, 2026',
    impact:
      'Exposure of PII without redaction is a reportable data protection incident with potential GDPR exposure and downstream access-control remediation.',
    controls: [
      { id: 'c1', name: 'PII redaction filter', coverage: 'Active' },
      { id: 'c2', name: 'Output access scoping', coverage: 'Active' },
    ],
    relatedPolicies: [
      { id: 'p1', name: 'Data Handling & Privacy Policy' },
      { id: 'p2', name: 'GDPR Processing Standard' },
    ],
    relatedAgents: [
      { id: 'a1', name: 'Document Analysis Agent', role: 'Processing' },
      { id: 'a2', name: 'Evidence Agent', role: 'Remediation' },
    ],
    evidence: [
      { id: 'e1', name: 'PII_Exposure_Timeline.pdf', date: 'Sep 1' },
      { id: 'e2', name: 'Redaction_Fix_Verification.pdf', date: 'Sep 2' },
    ],
    activity: [
      {
        id: 'ac1',
        actor: 'Security Team',
        action: 'Applied redaction filter and revoked access',
        timestamp: '1 day ago',
      },
    ],
  },
  {
    id: 'RSK-1038',
    name: 'Model drift in credit scoring',
    description:
      'Population stability index for the credit decisioning model has crossed the monitoring threshold, indicating input distribution drift since the last recalibration.',
    aiSystem: 'Credit Decisioning Model',
    category: 'Robustness',
    severity: 'high',
    owner: 'Model Risk',
    status: 'open',
    lastReviewed: '3 days ago',
    lastReviewedDays: 3,
    detectedDate: 'Aug 26, 2026',
    impact:
      'Undetected drift degrades decision accuracy and may produce unfair or non-compliant credit outcomes requiring recalibration.',
    controls: [{ id: 'c1', name: 'Drift monitoring (PSI)', coverage: 'Active' }],
    relatedPolicies: [{ id: 'p1', name: 'Model Risk Management Policy' }],
    relatedAgents: [
      { id: 'a1', name: 'Credit Decisioning Model', role: 'Scoring' },
    ],
    evidence: [{ id: 'e1', name: 'PSI_Trend.csv', date: 'Aug 26' }],
    activity: [
      {
        id: 'ac1',
        actor: 'Risk Analyst',
        action: 'Drift threshold breach recorded',
        timestamp: '3 days ago',
      },
    ],
  },
  {
    id: 'RSK-1037',
    name: 'Prompt injection vulnerability',
    description:
      'The chatbot assistant is susceptible to indirect prompt injection through retrieved documents, allowing instruction override in a subset of test cases.',
    aiSystem: 'Chatbot Assistant',
    category: 'Security',
    severity: 'high',
    owner: 'Security Team',
    status: 'investigating',
    lastReviewed: '4 days ago',
    lastReviewedDays: 4,
    detectedDate: 'Aug 24, 2026',
    impact:
      'Successful injection could cause the agent to leak context or perform unintended actions, representing a security control failure.',
    controls: [
      { id: 'c1', name: 'Input sanitization', coverage: 'Partial' },
      { id: 'c2', name: 'Retrieval content isolation', coverage: 'Gap' },
    ],
    relatedPolicies: [{ id: 'p1', name: 'AI Security Baseline' }],
    relatedAgents: [{ id: 'a1', name: 'Chatbot Assistant', role: 'Interface' }],
    evidence: [{ id: 'e1', name: 'RedTeam_Findings.pdf', date: 'Aug 24' }],
    activity: [
      {
        id: 'ac1',
        actor: 'Security Team',
        action: 'Confirmed injection in red-team run',
        timestamp: '4 days ago',
      },
    ],
  },
  {
    id: 'RSK-1036',
    name: 'Agent permissions exceed policy',
    description:
      'The pricing agent holds write access to systems beyond its documented scope, creating a privilege drift finding against least-privilege policy.',
    aiSystem: 'Pricing Optimization Agent',
    category: 'Governance',
    severity: 'high',
    owner: 'AI Governance',
    status: 'open',
    lastReviewed: '6 days ago',
    lastReviewedDays: 6,
    detectedDate: 'Aug 21, 2026',
    impact:
      'Excess permissions widen the blast radius of any agent error and violate least-privilege governance requirements.',
    controls: [
      { id: 'c1', name: 'Access recertification', coverage: 'Partial' },
    ],
    relatedPolicies: [{ id: 'p1', name: 'Least Privilege Access Policy' }],
    relatedAgents: [
      { id: 'a1', name: 'Pricing Optimization Agent', role: 'Execution' },
    ],
    evidence: [{ id: 'e1', name: 'Permission_Diff.json', date: 'Aug 21' }],
    activity: [
      {
        id: 'ac1',
        actor: 'Policy Monitor',
        action: 'Detected permission drift',
        timestamp: '6 days ago',
      },
    ],
  },
  {
    id: 'RSK-1035',
    name: 'Fraud model false positive spike',
    description:
      'The fraud detection engine shows an elevated false positive rate for a specific merchant segment following the latest ruleset update.',
    aiSystem: 'Fraud Detection Engine',
    category: 'Robustness',
    severity: 'high',
    owner: 'Model Risk',
    status: 'investigating',
    lastReviewed: '2 days ago',
    lastReviewedDays: 2,
    detectedDate: 'Aug 29, 2026',
    impact:
      'Excess false positives block legitimate transactions and harm customer experience while masking true fraud signal.',
    controls: [
      { id: 'c1', name: 'Segment performance monitoring', coverage: 'Active' },
    ],
    relatedPolicies: [{ id: 'p1', name: 'Model Performance Standard' }],
    relatedAgents: [
      { id: 'a1', name: 'Fraud Detection Engine', role: 'Detection' },
    ],
    evidence: [{ id: 'e1', name: 'FPR_By_Segment.csv', date: 'Aug 29' }],
    activity: [
      {
        id: 'ac1',
        actor: 'Model Risk',
        action: 'Opened investigation into ruleset change',
        timestamp: '2 days ago',
      },
    ],
  },
  {
    id: 'RSK-1034',
    name: 'Missing decision explainability',
    description:
      'Credit decline decisions are not accompanied by the adverse-action explanation record required for regulated lending.',
    aiSystem: 'Credit Decisioning Model',
    category: 'Transparency',
    severity: 'medium',
    owner: 'Compliance Team',
    status: 'open',
    lastReviewed: '8 days ago',
    lastReviewedDays: 8,
    detectedDate: 'Aug 19, 2026',
    impact:
      'Absent explanation records prevent compliant adverse-action notices and limit auditability of automated decisions.',
    controls: [
      { id: 'c1', name: 'Explanation logging', coverage: 'Gap' },
    ],
    relatedPolicies: [{ id: 'p1', name: 'Model Transparency Policy' }],
    relatedAgents: [
      { id: 'a1', name: 'Credit Decisioning Model', role: 'Scoring' },
    ],
    evidence: [{ id: 'e1', name: 'Explainability_Gap.pdf', date: 'Aug 19' }],
    activity: [
      {
        id: 'ac1',
        actor: 'Compliance Agent',
        action: 'Logged transparency gap',
        timestamp: '8 days ago',
      },
    ],
  },
  {
    id: 'RSK-1033',
    name: 'Stale training data lineage',
    description:
      'Data lineage for the talent screening model cannot be fully reconstructed for two upstream sources, weakening provenance evidence.',
    aiSystem: 'Talent Screening Agent',
    category: 'Governance',
    severity: 'medium',
    owner: 'Data Office',
    status: 'open',
    lastReviewed: '10 days ago',
    lastReviewedDays: 10,
    detectedDate: 'Aug 15, 2026',
    impact:
      'Incomplete lineage undermines reproducibility and complicates audit and incident response.',
    controls: [{ id: 'c1', name: 'Lineage capture', coverage: 'Partial' }],
    relatedPolicies: [{ id: 'p1', name: 'Data Governance Policy' }],
    relatedAgents: [
      { id: 'a1', name: 'Talent Screening Agent', role: 'Screening' },
    ],
    evidence: [{ id: 'e1', name: 'Lineage_Report.pdf', date: 'Aug 15' }],
    activity: [
      {
        id: 'ac1',
        actor: 'Data Office',
        action: 'Flagged incomplete lineage',
        timestamp: '10 days ago',
      },
    ],
  },
  {
    id: 'RSK-1032',
    name: 'Marketing claims accuracy',
    description:
      'The marketing content agent occasionally generates product claims that are not backed by approved source material.',
    aiSystem: 'Marketing Content Agent',
    category: 'Transparency',
    severity: 'medium',
    owner: 'Compliance Team',
    status: 'mitigated',
    lastReviewed: '4 days ago',
    lastReviewedDays: 4,
    detectedDate: 'Aug 23, 2026',
    impact:
      'Unsubstantiated claims create advertising compliance exposure and brand risk.',
    controls: [{ id: 'c1', name: 'Claim source verification', coverage: 'Active' }],
    relatedPolicies: [{ id: 'p1', name: 'Content Compliance Policy' }],
    relatedAgents: [
      { id: 'a1', name: 'Marketing Content Agent', role: 'Generation' },
    ],
    evidence: [{ id: 'e1', name: 'Claim_Review.pdf', date: 'Aug 23' }],
    activity: [
      {
        id: 'ac1',
        actor: 'Compliance Agent',
        action: 'Enabled source verification gate',
        timestamp: '4 days ago',
      },
    ],
  },
  {
    id: 'RSK-1031',
    name: 'Claims processing latency risk',
    description:
      'Under peak load the claims agent exceeds the decision SLA, risking degraded oversight during fallback handling.',
    aiSystem: 'Claims Processing Agent',
    category: 'Robustness',
    severity: 'medium',
    owner: 'Risk Team',
    status: 'open',
    lastReviewed: '7 days ago',
    lastReviewedDays: 7,
    detectedDate: 'Aug 20, 2026',
    impact:
      'SLA breaches during peaks can push decisions into unmonitored fallback paths.',
    controls: [{ id: 'c1', name: 'Load-based throttling', coverage: 'Partial' }],
    relatedPolicies: [{ id: 'p1', name: 'Operational Resilience Policy' }],
    relatedAgents: [
      { id: 'a1', name: 'Claims Processing Agent', role: 'Adjudication' },
    ],
    evidence: [{ id: 'e1', name: 'Latency_Report.csv', date: 'Aug 20' }],
    activity: [
      {
        id: 'ac1',
        actor: 'Risk Analyst',
        action: 'Recorded SLA breach under load test',
        timestamp: '7 days ago',
      },
    ],
  },
  {
    id: 'RSK-1030',
    name: 'Consent scope for support data',
    description:
      'Support conversations are being used to fine-tune models without a clear consent basis for that secondary use.',
    aiSystem: 'Customer Support Agent',
    category: 'Data Privacy',
    severity: 'medium',
    owner: 'Data Office',
    status: 'investigating',
    lastReviewed: '5 days ago',
    lastReviewedDays: 5,
    detectedDate: 'Aug 22, 2026',
    impact:
      'Secondary use without consent basis is a privacy compliance gap requiring review.',
    controls: [{ id: 'c1', name: 'Purpose limitation checks', coverage: 'Gap' }],
    relatedPolicies: [{ id: 'p1', name: 'Consent Management Policy' }],
    relatedAgents: [
      { id: 'a1', name: 'Customer Support Agent', role: 'Interaction' },
    ],
    evidence: [{ id: 'e1', name: 'Consent_Review.pdf', date: 'Aug 22' }],
    activity: [
      {
        id: 'ac1',
        actor: 'Data Office',
        action: 'Opened consent basis review',
        timestamp: '5 days ago',
      },
    ],
  },
  {
    id: 'RSK-1029',
    name: 'Vendor model version opacity',
    description:
      'A third-party model powering document analysis was updated by the vendor without change notification, breaking version traceability.',
    aiSystem: 'Document Analysis Agent',
    category: 'Governance',
    severity: 'medium',
    owner: 'AI Governance',
    status: 'open',
    lastReviewed: '9 days ago',
    lastReviewedDays: 9,
    detectedDate: 'Aug 16, 2026',
    impact:
      'Silent vendor updates undermine change management and validation evidence.',
    controls: [{ id: 'c1', name: 'Vendor change attestation', coverage: 'Gap' }],
    relatedPolicies: [{ id: 'p1', name: 'Third-Party AI Policy' }],
    relatedAgents: [
      { id: 'a1', name: 'Document Analysis Agent', role: 'Processing' },
    ],
    evidence: [{ id: 'e1', name: 'Vendor_Notice.pdf', date: 'Aug 16' }],
    activity: [
      {
        id: 'ac1',
        actor: 'AI Governance',
        action: 'Requested vendor change attestation',
        timestamp: '9 days ago',
      },
    ],
  },
  {
    id: 'RSK-1028',
    name: 'Incomplete risk register mapping',
    description:
      'Several deployed agents are not yet mapped to a formal risk register entry, leaving coverage gaps in governance reporting.',
    aiSystem: 'Chatbot Assistant',
    category: 'Governance',
    severity: 'medium',
    owner: 'AI Governance',
    status: 'open',
    lastReviewed: '11 days ago',
    lastReviewedDays: 11,
    detectedDate: 'Aug 14, 2026',
    impact:
      'Unmapped systems are invisible to governance reporting and audit scope.',
    controls: [{ id: 'c1', name: 'Inventory reconciliation', coverage: 'Partial' }],
    relatedPolicies: [{ id: 'p1', name: 'AI Inventory Policy' }],
    relatedAgents: [{ id: 'a1', name: 'Chatbot Assistant', role: 'Interface' }],
    evidence: [{ id: 'e1', name: 'Inventory_Gap.csv', date: 'Aug 14' }],
    activity: [
      {
        id: 'ac1',
        actor: 'AI Governance',
        action: 'Started inventory reconciliation',
        timestamp: '11 days ago',
      },
    ],
  },
  {
    id: 'RSK-1027',
    name: 'Fallback behavior undefined',
    description:
      'The fraud engine has no documented safe fallback when its upstream feature store is unavailable.',
    aiSystem: 'Fraud Detection Engine',
    category: 'Robustness',
    severity: 'medium',
    owner: 'Model Risk',
    status: 'open',
    lastReviewed: '12 days ago',
    lastReviewedDays: 12,
    detectedDate: 'Aug 13, 2026',
    impact:
      'Undefined fallback behavior can produce unpredictable decisions during outages.',
    controls: [{ id: 'c1', name: 'Degraded-mode playbook', coverage: 'Gap' }],
    relatedPolicies: [{ id: 'p1', name: 'Operational Resilience Policy' }],
    relatedAgents: [
      { id: 'a1', name: 'Fraud Detection Engine', role: 'Detection' },
    ],
    evidence: [{ id: 'e1', name: 'Resilience_Review.pdf', date: 'Aug 13' }],
    activity: [
      {
        id: 'ac1',
        actor: 'Model Risk',
        action: 'Documented missing fallback spec',
        timestamp: '12 days ago',
      },
    ],
  },
  {
    id: 'RSK-1026',
    name: 'Tone inconsistency in responses',
    description:
      'The support agent occasionally produces responses that deviate from approved tone and empathy guidelines in sensitive cases.',
    aiSystem: 'Customer Support Agent',
    category: 'Transparency',
    severity: 'medium',
    owner: 'Risk Team',
    status: 'mitigated',
    lastReviewed: '6 days ago',
    lastReviewedDays: 6,
    detectedDate: 'Aug 21, 2026',
    impact:
      'Off-guideline tone in sensitive interactions creates reputational and conduct risk.',
    controls: [{ id: 'c1', name: 'Tone evaluation suite', coverage: 'Active' }],
    relatedPolicies: [{ id: 'p1', name: 'Conduct & Tone Policy' }],
    relatedAgents: [
      { id: 'a1', name: 'Customer Support Agent', role: 'Interaction' },
    ],
    evidence: [{ id: 'e1', name: 'Tone_Eval.csv', date: 'Aug 21' }],
    activity: [
      {
        id: 'ac1',
        actor: 'Risk Team',
        action: 'Deployed tone evaluation suite',
        timestamp: '6 days ago',
      },
    ],
  },
  {
    id: 'RSK-1025',
    name: 'Retention window exceeded',
    description:
      'Conversation logs used by the chatbot are retained beyond the defined retention window for a subset of records.',
    aiSystem: 'Chatbot Assistant',
    category: 'Data Privacy',
    severity: 'medium',
    owner: 'Data Office',
    status: 'open',
    lastReviewed: '13 days ago',
    lastReviewedDays: 13,
    detectedDate: 'Aug 12, 2026',
    impact:
      'Over-retention of personal data increases privacy exposure and breaches retention policy.',
    controls: [{ id: 'c1', name: 'Automated retention purge', coverage: 'Partial' }],
    relatedPolicies: [{ id: 'p1', name: 'Data Retention Policy' }],
    relatedAgents: [{ id: 'a1', name: 'Chatbot Assistant', role: 'Interface' }],
    evidence: [{ id: 'e1', name: 'Retention_Audit.csv', date: 'Aug 12' }],
    activity: [
      {
        id: 'ac1',
        actor: 'Data Office',
        action: 'Flagged records past retention window',
        timestamp: '13 days ago',
      },
    ],
  },
  {
    id: 'RSK-1024',
    name: 'Undocumented override usage',
    description:
      'Manual overrides of claims decisions are being used without a recorded justification in some cases.',
    aiSystem: 'Claims Processing Agent',
    category: 'Human Oversight',
    severity: 'medium',
    owner: 'Compliance Team',
    status: 'open',
    lastReviewed: '9 days ago',
    lastReviewedDays: 9,
    detectedDate: 'Aug 16, 2026',
    impact:
      'Unjustified overrides weaken accountability and audit trails for human oversight.',
    controls: [{ id: 'c1', name: 'Override justification capture', coverage: 'Gap' }],
    relatedPolicies: [{ id: 'p1', name: 'Human Oversight Standard' }],
    relatedAgents: [
      { id: 'a1', name: 'Claims Processing Agent', role: 'Adjudication' },
    ],
    evidence: [{ id: 'e1', name: 'Override_Log.csv', date: 'Aug 16' }],
    activity: [
      {
        id: 'ac1',
        actor: 'Compliance Agent',
        action: 'Recorded missing justifications',
        timestamp: '9 days ago',
      },
    ],
  },
  {
    id: 'RSK-1023',
    name: 'Threshold config not peer-reviewed',
    description:
      'The screening pass/fail threshold was changed without the required peer review sign-off.',
    aiSystem: 'Talent Screening Agent',
    category: 'Governance',
    severity: 'low',
    owner: 'AI Governance',
    status: 'closed',
    lastReviewed: '14 days ago',
    lastReviewedDays: 14,
    detectedDate: 'Aug 10, 2026',
    impact:
      'Minor control gap; corrected with retroactive peer review and sign-off.',
    controls: [{ id: 'c1', name: 'Config change review', coverage: 'Active' }],
    relatedPolicies: [{ id: 'p1', name: 'Change Management Policy' }],
    relatedAgents: [
      { id: 'a1', name: 'Talent Screening Agent', role: 'Screening' },
    ],
    evidence: [{ id: 'e1', name: 'Signoff_Record.pdf', date: 'Aug 11' }],
    activity: [
      {
        id: 'ac1',
        actor: 'AI Governance',
        action: 'Closed after retroactive review',
        timestamp: '14 days ago',
      },
    ],
  },
  {
    id: 'RSK-1022',
    name: 'Low-severity logging gap',
    description:
      'Debug logs for the marketing agent omit request identifiers, slightly reducing traceability.',
    aiSystem: 'Marketing Content Agent',
    category: 'Transparency',
    severity: 'low',
    owner: 'Data Office',
    status: 'closed',
    lastReviewed: '15 days ago',
    lastReviewedDays: 15,
    detectedDate: 'Aug 9, 2026',
    impact: 'Minor traceability reduction; resolved by adding request IDs.',
    controls: [{ id: 'c1', name: 'Structured logging', coverage: 'Active' }],
    relatedPolicies: [{ id: 'p1', name: 'Logging Standard' }],
    relatedAgents: [
      { id: 'a1', name: 'Marketing Content Agent', role: 'Generation' },
    ],
    evidence: [{ id: 'e1', name: 'Logging_Fix.pdf', date: 'Aug 10' }],
    activity: [
      {
        id: 'ac1',
        actor: 'Data Office',
        action: 'Closed after logging fix',
        timestamp: '15 days ago',
      },
    ],
  },
  {
    id: 'RSK-1021',
    name: 'Doc template out of date',
    description:
      'The model card template for the chatbot references a superseded risk taxonomy.',
    aiSystem: 'Chatbot Assistant',
    category: 'Governance',
    severity: 'low',
    owner: 'AI Governance',
    status: 'mitigated',
    lastReviewed: '10 days ago',
    lastReviewedDays: 10,
    detectedDate: 'Aug 15, 2026',
    impact: 'Documentation inconsistency; low operational impact.',
    controls: [{ id: 'c1', name: 'Template versioning', coverage: 'Active' }],
    relatedPolicies: [{ id: 'p1', name: 'Documentation Standard' }],
    relatedAgents: [{ id: 'a1', name: 'Chatbot Assistant', role: 'Interface' }],
    evidence: [{ id: 'e1', name: 'Template_Update.pdf', date: 'Aug 15' }],
    activity: [
      {
        id: 'ac1',
        actor: 'AI Governance',
        action: 'Updated model card template',
        timestamp: '10 days ago',
      },
    ],
  },
  {
    id: 'RSK-1020',
    name: 'Non-critical alert noise',
    description:
      'The fraud engine emits low-value alerts that add noise to the monitoring queue without a severity tag.',
    aiSystem: 'Fraud Detection Engine',
    category: 'Robustness',
    severity: 'low',
    owner: 'Risk Team',
    status: 'open',
    lastReviewed: '16 days ago',
    lastReviewedDays: 16,
    detectedDate: 'Aug 8, 2026',
    impact: 'Alert fatigue risk; no direct decision impact.',
    controls: [{ id: 'c1', name: 'Alert severity tagging', coverage: 'Partial' }],
    relatedPolicies: [{ id: 'p1', name: 'Monitoring Standard' }],
    relatedAgents: [
      { id: 'a1', name: 'Fraud Detection Engine', role: 'Detection' },
    ],
    evidence: [{ id: 'e1', name: 'Alert_Volume.csv', date: 'Aug 8' }],
    activity: [
      {
        id: 'ac1',
        actor: 'Risk Team',
        action: 'Proposed alert severity tagging',
        timestamp: '16 days ago',
      },
    ],
  },
  {
    id: 'RSK-1019',
    name: 'Cross-border data transfer gap',
    description:
      'The document analysis pipeline routes a portion of processing through a region without a validated transfer mechanism for personal data.',
    aiSystem: 'Document Analysis Agent',
    category: 'Data Privacy',
    severity: 'high',
    owner: 'Compliance Team',
    status: 'investigating',
    lastReviewed: '3 days ago',
    lastReviewedDays: 3,
    detectedDate: 'Aug 26, 2026',
    impact:
      'Transfers without a validated mechanism create material cross-border data protection exposure requiring immediate review.',
    controls: [
      { id: 'c1', name: 'Transfer mechanism validation', coverage: 'Gap' },
      { id: 'c2', name: 'Regional routing controls', coverage: 'Partial' },
    ],
    relatedPolicies: [
      { id: 'p1', name: 'Cross-Border Transfer Policy' },
      { id: 'p2', name: 'GDPR Processing Standard' },
    ],
    relatedAgents: [
      { id: 'a1', name: 'Document Analysis Agent', role: 'Processing' },
    ],
    evidence: [{ id: 'e1', name: 'Transfer_Assessment.pdf', date: 'Aug 26' }],
    activity: [
      {
        id: 'ac1',
        actor: 'Compliance Team',
        action: 'Opened transfer mechanism review',
        timestamp: '3 days ago',
      },
    ],
  },
]
