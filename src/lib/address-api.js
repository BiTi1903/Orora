const requests = new Map();
export function getAddressOptions(provinceCode) {
  const key = provinceCode || "provinces";
  if (!requests.has(key)) requests.set(key, fetch(`/api/addresses${provinceCode ? `?provinceCode=${encodeURIComponent(provinceCode)}` : ""}`, { signal: AbortSignal.timeout(10000) }).then(async (response) => {
    const result = await response.json();
    if (!response.ok || !Array.isArray(result.items)) throw new Error(result.message || "Chưa tải được địa chỉ.");
    return result.items;
  }).catch((error) => { requests.delete(key); throw error; }));
  return requests.get(key);
}
