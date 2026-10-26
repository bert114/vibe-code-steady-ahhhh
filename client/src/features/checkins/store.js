import { create } from "zustand";
import { useToastStore } from "../../components/ui/toastStore.js";
import { createCheckin, deleteCheckin, listCheckins } from "./api.js";

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
    const { draft, status } = get();
    if (status === "saving") return null;
    set({ status: "saving", error: null });
    try {
      const saved = await createCheckin({
        mood_score: Number(draft.moodScore),
        energy_score: Number(draft.energyScore),
        drain_score: Number(draft.drainScore),
        emotions: splitTags(draft.emotions),
        context_tags: splitTags(draft.contextTags),
        note: toTrimmedNote(draft.note),
      });
      set((s) => ({
        status: "succeeded",
        checkins: [saved, ...s.checkins],
        draft: { ...emptyDraft },
      }));
      useToastStore.getState().success("Saved. Thank you for checking in.");
      return saved;
    } catch (err) {
      set({ status: "failed", error: err?.message ?? "Could not save your check-in." });
      throw err;
    }
  },

  saveQuickCheckIn: async (draft) => {
    const saved = await createCheckin({
      mood_score: Number(draft.moodScore),
      energy_score: Number(draft.energyScore),
      drain_score: Number(draft.drainScore),
      emotions: splitTags(draft.emotions),
      context_tags: splitTags(draft.contextTags),
      note: toTrimmedNote(draft.note),
    });
    set((s) => ({ checkins: [saved, ...s.checkins] }));
    useToastStore.getState().success('Saved. Thank you for checking in.');
    return saved;
  },

  removeCheckin: async (id) => {
    try {
      await deleteCheckin(id);
      set((s) => ({
        checkins: s.checkins.filter((c) => c.id !== id),
      }));
      useToastStore.getState().success("Check-in removed.");
    } catch (err) {
      useToastStore.getState().error(err.message || "Failed to remove check-in.");
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
  if (Array.isArray(raw)) return raw.map((t) => String(t).trim()).filter(Boolean);
  return String(raw ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function toTrimmedNote(note) {
  return String(note ?? "").trim();
}
