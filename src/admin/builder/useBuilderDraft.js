import { useMemo, useState } from 'react';
import { DEFAULT_ABOUT, DEFAULT_TICKER } from './defaults';
import { DEFAULT_HERO, DEFAULT_COLLECTION, DEFAULT_PRODUCT_DETAIL, DEFAULT_FEATURES, DEFAULT_REVIEWS, DEFAULT_NEWSLETTER, DEFAULT_FOOTER, createPhilosophy } from './home-model';
import { createNav } from './navbar-state';
import { DEFAULT_PRODUCT_NEEDS, DEFAULT_PRODUCT_FAQ } from '../../lib/product-discovery';

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
  discovery: { productNeeds: DEFAULT_PRODUCT_NEEDS, productFaq: DEFAULT_PRODUCT_FAQ },
});

export default function useBuilderDraft() {
  const [history, setHistory] = useState(() => ({ past: [], draft: defaults(), future: [] }));
  const controls = useMemo(() => {
    const updateField = (field, update) => setHistory(current => {
      const next = typeof update === 'function' ? update(current.draft[field]) : update;
      if (next === current.draft[field]) return current;
      return { past: [...current.past.slice(-39), current.draft], draft: { ...current.draft, [field]: next }, future: [] };
    });
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
      clearHistory: () => setHistory(current => ({ ...current, past: [], future: [] })),
      resetField: (field, mergeDefaults) => updateField(field, current => mergeDefaults(current, defaults()[field])),
    };
  }, []);
  return { ...history.draft, ...controls, canUndo: !!history.past.length, canRedo: !!history.future.length };
}
