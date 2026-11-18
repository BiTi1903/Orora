import { useEffect, useState } from 'react';

export default function useStorefrontStock(ids, enabled = true) {
  const key = enabled ? [...new Set(ids.filter(id => /^[a-z0-9_-]{1,150}$/i.test(id || '')))].slice(0, 48).sort().join(',') : '';
  const [result, setResult] = useState(null);
  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    fetch(`/api/storefront/stock?ids=${encodeURIComponent(key)}`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (!controller.signal.aborted) setResult({ key, availability: data?.availability || {} }); })
      .catch(() => {});
    return () => controller.abort();
  }, [key]);
  return result?.key === key ? result.availability : {};
}
