export type Prompt = {
  id: string;
  text: string;
  kind: "question" | "photo" | "challenge";
};

export const PROMPTS: Prompt[] = [
  { id: "smile-photo", text: "Send a photo of something that made you smile today.", kind: "photo" },
  { id: "miss-most", text: "What about them are you missing the most right now?", kind: "question" },
  { id: "tiny-win", text: "What was your tiniest win today?", kind: "question" },
  { id: "sky", text: "Take a photo of the sky wherever you are.", kind: "photo" },
  { id: "song", text: "What song is in your head right now?", kind: "question" },
  { id: "good-thing", text: "Tell them one good thing about them that you noticed this week.", kind: "question" },
  { id: "shoes", text: "Photo of your shoes — wherever they took you today.", kind: "photo" },
  { id: "weekend", text: "If we had a free Saturday tomorrow, what would you want to do?", kind: "question" },
  { id: "snack", text: "Photo of the snack you'd share with them right now.", kind: "photo" },
  { id: "10-yrs", text: "Where do you hope we'll be in 10 years?", kind: "question" },
  { id: "today-feel", text: "Three words for how today felt.", kind: "question" },
  { id: "alarms", text: "Who's more likely to set 15 alarms and sleep through all of them?", kind: "question" },
];

export function promptForToday(): Prompt {
  // Stable rotation by date
  const day = Math.floor(Date.now() / (24 * 3600 * 1000));
  return PROMPTS[day % PROMPTS.length];
}

export const CHALLENGES = [
  "Without moving, take a photo of something that reminds you of them.",
  "Send a 1-second voice memo. No words, just a sound.",
  "Draw a tiny doodle of how today felt.",
  "Text them the first emoji you used today.",
  "Photo of your view, right now.",
  "Pick a song that's been in your head and send it.",
];
