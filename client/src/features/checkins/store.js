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
export const useCheckinsStore = create((set, get) => ({
  draft: { ...emptyDraft },
  checkins: [],
  status: "idle", // idle | saving | loading | succeeded | failed
  error: null,

  setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  resetDraft: () => set({ draft: { ...emptyDraft } }),

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
      }));
      return saved;
    } catch (err) {
      console.log(err.message);
      set({ status: "failed", error: err.message });
      throw err;
    }
  },

  loadHistory: async () => {
    set({ status: "loading", error: null });
    try {
      const { checkins } = await listCheckins();
      set({ status: "succeeded", checkins });
    } catch (err) {
      set({ status: "failed", error: err.message });
    }
  },
}));

function splitTags(raw) {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
