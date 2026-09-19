import { create } from "zustand";
import { createCheckin, listCheckins } from "./api.js";

const emptyDraft = {
  moodScore: 3,
  energyScore: 3,
  drainScore: 3,
  emotions: "",
  contextTags: "",
  note: "",
};

// Small feature-scoped store: form draft + history list + request state.
// No server-state mirroring beyond what this feature renders.
// justSaved distinguishes a real save from a history load so the
// success banner never looks like an auto-submit.
export const useCheckinsStore = create((set, get) => ({
  draft: { ...emptyDraft },
  checkins: [],
  status: "idle", // idle | saving | loading | succeeded | failed
  error: null,
  justSaved: false,

  setDraft: (patch) =>
    set((s) => ({ draft: { ...s.draft, ...patch }, justSaved: false })),
  resetDraft: () =>
    set({ draft: { ...emptyDraft }, justSaved: false }),

  saveDraft: async () => {
    const { draft } = get();
    set({ status: "saving", error: null });
    try {
      const saved = await createCheckin({
        mood_score: Number(draft.moodScore),
        energy_score: Number(draft.energyScore),
        drain_score: Number(draft.drainScore),
        emotions: splitTags(draft.emotions),
        context_tags: splitTags(draft.contextTags),
        note: draft.note.trim(),
      });
      set((s) => ({
        status: "succeeded",
        checkins: [saved, ...s.checkins],
        draft: { ...emptyDraft },
        justSaved: true,
      }));
      return saved;
    } catch (err) {
      console.log(err.message);
      set({ status: "failed", error: err.message, justSaved: false });
      throw err;
    }
  },

  loadHistory: async () => {
    set({ status: "loading", error: null, justSaved: false });
    try {
      const { checkins } = await listCheckins();
      set({ status: "succeeded", checkins, justSaved: false });
    } catch (err) {
      set({ status: "failed", error: err.message, justSaved: false });
    }
  },
}));

function splitTags(raw) {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
