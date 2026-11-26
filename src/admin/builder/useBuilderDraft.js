import { useMemo, useState } from 'react';
import { DEFAULT_ABOUT, DEFAULT_TICKER } from './defaults';
import { DEFAULT_HERO, DEFAULT_COLLECTION, DEFAULT_PRODUCT_DETAIL, DEFAULT_FEATURES, DEFAULT_REVIEWS, DEFAULT_NEWSLETTER, DEFAULT_FOOTER, createPhilosophy } from './home-model';
import { createNav } from './navbar-state';
import { DEFAULT_PRODUCT_NEEDS, DEFAULT_PRODUCT_FAQ } from '../../lib/product-discovery';
import { DEFAULT_CARE_GUIDE } from '../../lib/product-care-guide';

const defaults = () => ({
  about: DEFAULT_ABOUT,
  hero: DEFAULT_HERO,
  collection: DEFAULT_COLLECTION,
  productDetail: DEFAULT_PRODUCT_DETAIL,
  features: DEFAULT_FEATURES,
  reviews: DEFAULT_REVIEWS,
  newsletter: DEFAULT_NEWSLETTER,
  footer: DEFAULT_FOOTER,
  ticker: DEFAULT_TICKER,
  navbar: createNav(),
  philosophy: createPhilosophy(),
  sectionVisibility: {},
  discovery: {
    productNeeds: DEFAULT_PRODUCT_NEEDS,
    productFaq: DEFAULT_PRODUCT_FAQ,
    productCareGuide: DEFAULT_CARE_GUIDE,
    productSlogan: { enabled: true, title: "", text: "" },
    productPolicies: [],
    policyPageContent: { returnsText: "", paymentText: "", privacyText: "" },
    shopLinks: { tiktokUrl: "", facebookUrl: "", paymentMethods: ["cod", "bank_transfer"] },
    orderTrackingText: {},
  },
});

// Builder setters replace their section. Find the one text field that changed.
function changedTextPath(previous, next, path = []) {
  if (typeof next === 'string' && (previous === undefined || typeof previous === 'string')) return JSON.stringify(path);
  if (!previous || !next || typeof previous !== 'object' || typeof next !== 'object') return null;
  const keys = [...new Set([...Object.keys(previous), ...Object.keys(next)])];
  const changed = keys.filter(key => previous[key] !== next[key]);
  if (changed.length !== 1) return null;
  const [key] = changed;
  return changedTextPath(previous[key], next[key], [...path, key]);
}

function createDraftControls(setHistory) {
  const updateField = (field, update, groupText = true) => {
    const time = Date.now();
    setHistory(current => {
      const next = typeof update === 'function' ? update(current.draft[field]) : update;
      if (next === current.draft[field]) return current;
      const key = groupText ? changedTextPath(current.draft[field], next, [field]) : null;
      const merge = key !== null && current.lastEdit?.key === key && time - current.lastEdit.time <= 500;
      return {
        past: merge ? current.past : [...current.past.slice(-39), current.draft],
        draft: { ...current.draft, [field]: next },
        future: [],
        lastEdit: key === null ? null : { key, time },
      };
    });
  };
  const setters = Object.fromEntries(Object.keys(defaults()).map(field => [
    `set${field[0].toUpperCase()}${field.slice(1)}`, update => updateField(field, update),
  ]));
  return {
    ...setters,
    undo: () => setHistory(current => current.past.length ? {
      past: current.past.slice(0, -1),
      draft: current.past.at(-1),
      future: [current.draft, ...current.future],
    } : current),
    redo: () => setHistory(current => current.future.length ? {
      past: [...current.past, current.draft],
      draft: current.future[0],
      future: current.future.slice(1),
    } : current),
    clearHistory: () => setHistory(current => ({ ...current, past: [], future: [], lastEdit: null })),
    resetField: (field, mergeDefaults) => updateField(field, current => mergeDefaults(current, defaults()[field]), false),
  };
}

export default function useBuilderDraft() {
  const [history, setHistory] = useState(() => ({ past: [], draft: defaults(), future: [] }));
  const controls = useMemo(() => createDraftControls(setHistory), []);
  return { ...history.draft, ...controls, canUndo: !!history.past.length, canRedo: !!history.future.length };
}
