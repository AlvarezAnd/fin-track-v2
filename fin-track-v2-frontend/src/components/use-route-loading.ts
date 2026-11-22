import { useSyncExternalStore } from "react";

let pending = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function beginRouteLoading() {
  if (pending) {
    return;
  }

  pending = true;
  emit();
}

export function endRouteLoading() {
  if (!pending) {
    return;
  }

  pending = false;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return pending;
}

function getServerSnapshot() {
  return false;
}

/** True from the click on an internal link until the pathname changes. */
export function useRouteLoading() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
