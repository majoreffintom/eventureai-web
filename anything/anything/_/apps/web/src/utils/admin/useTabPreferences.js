import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getDefaultTabs, normalizeTabPrefs, STORAGE_KEY } from "./tabConfig";

export function useTabPreferences() {
  const defaultTabs = useMemo(() => getDefaultTabs(), []);

  const [order, setOrder] = useState(defaultTabs.map((t) => t.id));
  const [labels, setLabels] = useState(
    Object.fromEntries(defaultTabs.map((t) => [t.id, t.label])),
  );
  const [editingId, setEditingId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showConfigTabs, setShowConfigTabs] = useState(false);

  const lastSavedRef = useRef(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw);
      const normalized = normalizeTabPrefs(defaultTabs, parsed);
      setOrder(normalized.order);
      setLabels(normalized.labels);
      setShowConfigTabs(!!normalized.showConfigTabs);
      lastSavedRef.current = JSON.stringify(normalized);
    } catch (e) {
      console.error(e);
    }
  }, [defaultTabs]);

  // Save to localStorage
  useEffect(() => {
    try {
      const prefs = { order, labels, showConfigTabs };
      const serialized = JSON.stringify(prefs);
      if (lastSavedRef.current === serialized) {
        return;
      }
      window.localStorage.setItem(STORAGE_KEY, serialized);
      lastSavedRef.current = serialized;
    } catch (e) {
      console.error(e);
    }
  }, [labels, order, showConfigTabs]);

  const tabs = useMemo(() => {
    const byId = new Map(defaultTabs.map((t) => [t.id, t]));
    const ordered = order
      .map((id) => {
        const base = byId.get(id);
        if (!base) {
          return null;
        }
        const label = labels[id] || base.label;
        return { ...base, label };
      })
      .filter(Boolean);

    return ordered;
  }, [defaultTabs, labels, order]);

  const handleReorder = useCallback((nextOrder) => {
    setOrder(nextOrder);
  }, []);

  const handleStartRename = useCallback((id) => {
    setEditingId(id);
  }, []);

  const handleCancelRename = useCallback(() => {
    setEditingId(null);
  }, []);

  const handleCommitRename = useCallback((id, nextLabel, finalize) => {
    const safe = typeof nextLabel === "string" ? nextLabel : "";
    setLabels((prev) => ({ ...prev, [id]: safe }));
    if (finalize) {
      setEditingId(null);
    }
  }, []);

  const handleResetTabs = useCallback(() => {
    const defaults = getDefaultTabs();
    setOrder(defaults.map((t) => t.id));
    setLabels(Object.fromEntries(defaults.map((t) => [t.id, t.label])));
    setEditingId(null);
    setEditMode(false);
    setShowConfigTabs(false);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  }, []);

  return {
    tabs,
    editingId,
    editMode,
    setEditMode,
    showConfigTabs,
    setShowConfigTabs,
    handleReorder,
    handleStartRename,
    handleCancelRename,
    handleCommitRename,
    handleResetTabs,
  };
}
