import { useSyncExternalStore } from "react";

/** Tracks whether the logo intro has finished, so hero animations start after it. */
let done = false;
let introKey = 1;
const listeners = new Set();
const triggerListeners = new Set();

export function markIntroDone() {
  if (done) return;
  done = true;
  listeners.forEach((l) => l());
}

export function restartIntro() {
  done = false;
  introKey += 1;
  triggerListeners.forEach((l) => l());
  listeners.forEach((l) => l());
  if (typeof window !== "undefined") {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } catch {
      window.scrollTo(0, 0);
    }
    window.scrollTo(0, 0);
    if (typeof document !== "undefined") {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }
}

export function useIntroKey() {
  return useSyncExternalStore(
    (cb) => {
      triggerListeners.add(cb);
      return () => triggerListeners.delete(cb);
    },
    () => introKey,
    () => 1
  );
}

function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useIntroDone() {
  return useSyncExternalStore(
    subscribe,
    () => done,
    () => false
  );
}
