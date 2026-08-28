export const STAGES = [
  "new_lead",
  "researching",
  "audited",
  "qualified",
  "contacted",
  "replied",
  "interested",
  "meeting_booked",
  "proposal_sent",
  "negotiation",
  "won",
  "lost",
] as const;

export type Stage = (typeof STAGES)[number];
