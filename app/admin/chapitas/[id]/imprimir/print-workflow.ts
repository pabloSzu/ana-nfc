export const TAG_SETUP_KEYS = [
  "qrSize", "qrColor", "tagSides", "tagOutput", "tagCharacter",
  "tagHole", "tagLayout", "tagCutGuides", "paper",
] as const;

export type PrintWorkflow = {
  setup: Record<string, unknown> | null;
  reopenedIds: string[];
  cardsPrintedCount: number | null;
};

export type PrintWorkflowAction = "print_tags" | "reopen_units" | "print_units" | "print_cards" | "reopen_cards";
