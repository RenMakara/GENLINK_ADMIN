"use client";

import { useCallback, useState, useSyncExternalStore } from "react";

type PreferenceListener = () => void;

const listenersByKey = new Map<string, Set<PreferenceListener>>();
let storageListenerAttached = false;

function emit(key: string) {
  listenersByKey.get(key)?.forEach((listener) => listener());
}

function subscribe(key: string | undefined, listener: PreferenceListener) {
  if (!key) return () => undefined;

  let listeners = listenersByKey.get(key);
  if (!listeners) {
    listeners = new Set();
    listenersByKey.set(key, listeners);
  }
  listeners.add(listener);

  if (!storageListenerAttached) {
    window.addEventListener("storage", (event) => {
      if (event.key) emit(event.key);
    });
    storageListenerAttached = true;
  }

  return () => {
    listeners?.delete(listener);
    if (listeners?.size === 0) listenersByKey.delete(key);
  };
}

function readRaw(key: string | undefined) {
  if (!key) return null;

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function serialize<T>(value: T) {
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function parse<T>(raw: string, fallback: T, isValid?: (value: unknown) => value is T): T {
  try {
    const value: unknown = JSON.parse(raw);
    return isValid && !isValid(value) ? fallback : (value as T);
  } catch {
    return fallback;
  }
}

function writeRaw<T>(key: string | undefined, value: T) {
  if (!key) return;

  try {
    window.localStorage.setItem(key, serialize(value));
    emit(key);
  } catch {
    // A private browsing or storage restriction must not break table controls.
  }
}

/**
 * Persists only non-sensitive table UI preferences such as density and column visibility.
 * Callers provide an admin-scoped key when the preference should follow the signed-in admin.
 */
export function usePersistedTablePreference<T>(
  key: string | undefined,
  defaultValue: T,
  isValid?: (value: unknown) => value is T,
) {
  const [ephemeralValue, setEphemeralValue] = useState(defaultValue);
  const fallbackSerialized = serialize(defaultValue);
  const subscribeToKey = useCallback(
    (listener: PreferenceListener) => subscribe(key, listener),
    [key],
  );
  const getSnapshot = useCallback(
    () => (key ? readRaw(key) ?? fallbackSerialized : fallbackSerialized),
    [fallbackSerialized, key],
  );
  const getServerSnapshot = useCallback(() => fallbackSerialized, [fallbackSerialized]);
  const storedRaw = useSyncExternalStore(subscribeToKey, getSnapshot, getServerSnapshot);
  const storedValue = key ? parse(storedRaw, defaultValue, isValid) : ephemeralValue;

  const setValue = useCallback(
    (nextValue: T) => {
      if (key) {
        writeRaw(key, nextValue);
      } else {
        setEphemeralValue(nextValue);
      }
    },
    [key],
  );

  return [storedValue, setValue] as const;
}
