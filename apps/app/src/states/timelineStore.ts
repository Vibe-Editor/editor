import { createStore } from "zustand/vanilla";
import { Timeline } from "../@types/timeline";

type TimelineCursorType = "pointer" | "text" | "shape" | "lockKeyboard";

export interface ITimelineStore {
  timeline: Timeline;
  range: number;
  scroll: number;
  cursor: number;
  canvasWidth: number;
  control: {
    isPlay: boolean;
    cursorType: TimelineCursorType;
  };
  history: {
    timelineHistory: Timeline[];
    historyNow: number;
  };

  addTimeline: (key: string, timeline: any) => void;
  clearTimeline: () => void;
  removeTimeline: (targetId: string) => void;
  patchTimeline: (timeline: any) => void;
  checkPointTimeline: () => void;
  rollbackTimelineFromCheckPoint: (cursor: number) => void;
  setRange: (range: number) => void;
  setScroll: (scroll: number) => void;
  setCursor: (cursor: number) => void;
  setCanvasWidth: (canvasWidth: number) => void;

  increaseCursor: (dt: number) => void;
  decreaseCursor: (dt: number) => void;
  switchPlay: () => void;
  setPlay: (isPlay: boolean) => void;
  setCursorType: (cursorType: TimelineCursorType) => void;
  updateTimeline: (targetId: any, targetArray: string[], value: any) => void;
}

export const useTimelineStore = createStore<ITimelineStore>((set) => ({
  timeline: {},
  // Default working range – raise from ~10 s to ~50 s so the red limit
  // starts farther out and users can import longer clips without adjusting
  // the zoom immediately.
  range: 5,
  scroll: 0,
  cursor: 0,
  canvasWidth: 500,
  control: {
    isPlay: false,
    cursorType: "pointer",
  },
  history: {
    timelineHistory: [],
    historyNow: 0,
  },

  addTimeline: (key: string, timeline: any) =>
    set((state) => ({ timeline: { ...state.timeline, [key]: timeline } })),

  clearTimeline: () =>
    set((state) => ({
      timeline: {},
    })),

  removeTimeline: (targetId: string) =>
    set((state) => {
      delete state.timeline[targetId];
      return { timeline: { ...state.timeline } };
    }),

  patchTimeline: (timeline: any) =>
    set((state) => {
      return { timeline: { ...timeline } };
    }),

  checkPointTimeline: () =>
    set((state) => {
      state.history.timelineHistory.push({ ...state.timeline });
      if (state.history.timelineHistory.length > 10) {
        state.history.timelineHistory.shift();
      }

      return {
        history: {
          timelineHistory: [...state.history.timelineHistory],
          historyNow: state.history.timelineHistory.length - 1,
        },
      };
    }),

  rollbackTimelineFromCheckPoint: (cursor: number) =>
    set((state) => {
      const historyNow = state.history.historyNow + cursor;
      const prevTimeline = state.history.timelineHistory[historyNow];

      return {
        timeline: { ...prevTimeline },
        history: {
          historyNow: state.history.historyNow + cursor,
          timelineHistory: [...state.history.timelineHistory],
        },
      };
    }),

  updateTimeline: (targetId: any, targetArray: string[], value: any) =>
    set((state) => {
      let timeline: any = { ...state.timeline };
      let current = timeline[targetId];
      for (let i = 0; i < targetArray.length - 1; i++) {
        const key = targetArray[i];
        current = current[key];
      }
      current[targetArray[targetArray.length - 1]] = value;
      return {
        timeline: {
          ...state.timeline,
          [targetId]: { ...current, ...state.timeline[targetId] },
        },
      };
    }),

  setRange: (range: number) =>
    set((state) => ({
      range: range,
      scroll:
        (state.cursor / 5) * (range / 4) - state.canvasWidth / 2 <= 0
          ? 0
          : (state.cursor / 5) * (range / 4) - state.canvasWidth / 2,
    })),
  setScroll: (scroll: number) => set((state) => ({ scroll: scroll })),
  setCursor: (cursor: number) => set((state) => ({ cursor: cursor })),
  setCanvasWidth: (canvasWidth: number) =>
    set((state) => ({ canvasWidth: canvasWidth })),

  increaseCursor: (dt: number) =>
    set((state) => ({ cursor: state.cursor + dt })),

  decreaseCursor: (dt: number) =>
    set((state) => ({ cursor: state.cursor - dt })),

  switchPlay: () =>
    set((state) => ({
      control: { ...state.control, ["isPlay"]: !state.control.isPlay },
    })),

  setPlay: (isPlay: boolean) =>
    set((state) => ({ control: { ...state.control, ["isPlay"]: isPlay } })),

  setCursorType: (cursorType: TimelineCursorType) =>
    set((state) => ({
      control: { ...state.control, ["cursorType"]: cursorType },
    })),
}));
