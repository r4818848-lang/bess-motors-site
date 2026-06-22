export type SubmissionKind = "booking" | "call";

export type SubmissionCartLine = {
  label: string;
  lineTotal: number;
  priceFrom: boolean;
  isFree?: boolean;
};

export type SubmissionSnapshot = {
  kind: SubmissionKind;
  submittedAt: string;
  clientFirstName?: string;
  clientLastName?: string;
  clientPhone: string;
  clientEmail?: string;
  clientPlate?: string;
  date?: string;
  time?: string;
  serviceLabels?: string;
  cartLines?: SubmissionCartLine[];
  estimatedTotal?: number;
  comment?: string;
  serviceLabel?: string;
};

export const SUBMISSION_SNAPSHOT_KEY = "bess-submission-thank-you";

export function saveSubmissionSnapshot(snapshot: SubmissionSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SUBMISSION_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    /* ignore */
  }
}

export function loadSubmissionSnapshot(): SubmissionSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SUBMISSION_SNAPSHOT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SubmissionSnapshot;
  } catch {
    return null;
  }
}

export const THANK_YOU_PATH = "/booking/thank-you";
