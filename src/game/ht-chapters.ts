import { heatTransferExtremeQuestions } from "@/game/heat-transfer-extreme";

export interface HtChapterInfo {
  id: string;
  label: string;
  shortLabel: string;
  startIndex: number;
  count: number;
}

const CHAPTER_ORDER: { id: string; label: string; shortLabel: string }[] = [
  { id: "ht-ch02-03", label: "Chapters 2–3 · Conduction Foundations", shortLabel: "Ch 2–3" },
  { id: "ht-ch04", label: "Chapter 4 · Two-Dimensional Conduction", shortLabel: "Ch 4" },
  { id: "ht-ch05", label: "Chapter 5 · Transient Conduction", shortLabel: "Ch 5" },
  { id: "ht-ch06", label: "Chapter 6 · Convection Fundamentals", shortLabel: "Ch 6" },
  { id: "ht-ch07", label: "Chapter 7 · External Flow", shortLabel: "Ch 7" },
  { id: "ht-ch08", label: "Chapter 8 · Internal Flow", shortLabel: "Ch 8" },
  { id: "ht-ch09", label: "Chapter 9 · Free Convection", shortLabel: "Ch 9" },
  { id: "ht-ch10", label: "Chapter 10 · Boiling and Condensation", shortLabel: "Ch 10" },
  { id: "ht-ch11", label: "Chapter 11 · Heat Exchangers", shortLabel: "Ch 11" },
  { id: "ht-ch12", label: "Chapter 12 · Radiation Fundamentals", shortLabel: "Ch 12" },
  { id: "ht-ch13", label: "Chapter 13 · Enclosure Radiation", shortLabel: "Ch 13" },
  { id: "ht-ch14", label: "Chapter 14 · Species Diffusion", shortLabel: "Ch 14" },
];

/** Bananza chapters with live start indices into the full question bank. */
export function getHtBananzaChapters(): HtChapterInfo[] {
  return CHAPTER_ORDER.map((meta) => {
    const startIndex = heatTransferExtremeQuestions.findIndex((q) => q.chapterId === meta.id);
    const count = heatTransferExtremeQuestions.filter((q) => q.chapterId === meta.id).length;
    return { ...meta, startIndex: startIndex < 0 ? 0 : startIndex, count };
  });
}

export function htChapterAtIndex(index: number): HtChapterInfo | undefined {
  const q = heatTransferExtremeQuestions[Math.min(index, heatTransferExtremeQuestions.length - 1)];
  if (!q) return undefined;
  return getHtBananzaChapters().find((c) => c.id === q.chapterId);
}
