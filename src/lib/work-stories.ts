/**
 * Completed jobs the workshop can publish later.
 * A draft is never linked from the sitemap and never rendered.
 * Do not put a client name, phone, plate or VIN in the text.
 */
export type WorkStory = {
  id: string;
  published: boolean;
  titlePl: string;
  repairPl: string;
  serviceHref: string;
  /** Path under /public, for example /images/works/example.jpg. Empty until a real photo exists. */
  photo: string;
};

export const WORK_STORY_DRAFTS: WorkStory[] = [
  {
    id: "draft-template",
    published: false,
    titlePl: "Szablon: uzupełnij po wykonanej pracy",
    repairPl: "Opis naprawy bez imienia, telefonu, numeru rejestracyjnego i VIN. Zdjęcie auta bez tablicy.",
    serviceHref: "/wulkanizacja-warszawa",
    photo: "",
  },
];

function looksLikePersonalData(text: string): boolean {
  if (/@/.test(text)) return true;
  if (/(?:\+?\d[\d\s()-]{7,}\d)/.test(text)) return true;
  if (/\b[A-HJ-NPR-Z0-9]{17}\b/i.test(text)) return true;
  return false;
}

export function isPublishableWorkStory(story: WorkStory): boolean {
  if (!story.published) return false;
  if (!story.id.trim() || !story.titlePl.trim() || !story.repairPl.trim()) return false;
  if (!story.photo.startsWith("/images/works/") || story.photo.includes("..")) return false;
  if (!story.serviceHref.startsWith("/") || story.serviceHref.startsWith("//")) return false;
  if (looksLikePersonalData(`${story.titlePl}\n${story.repairPl}`)) return false;
  return true;
}

export function publishedWorkStories(stories: readonly WorkStory[] = WORK_STORY_DRAFTS): WorkStory[] {
  return stories.filter(isPublishableWorkStory);
}
