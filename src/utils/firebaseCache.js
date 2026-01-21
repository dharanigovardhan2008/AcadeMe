const CACHE_DURATION = 300000;

export const getFromCache = (key) => {
  const cached = sessionStorage.getItem(key);
  const timestamp = sessionStorage.getItem(`${key}_time`);
  if (!cached || !timestamp) return null;
  const age = Date.now() - parseInt(timestamp);
  if (age > CACHE_DURATION) {
    sessionStorage.removeItem(key);
    sessionStorage.removeItem(`${key}_time`);
    return null;
  }
  return JSON.parse(cached);
};

export const saveToCache = (key, data) => {
  sessionStorage.setItem(key, JSON.stringify(data));
  sessionStorage.setItem(`${key}_time`, Date.now().toString());
};

export const clearCache = () => {
  sessionStorage.clear();
};
