// Minimal Firestore double: preserves Date values and serializes transactions.
// Integration with real Firebase credentials remains a deployment check.
export function memoryDb() {
  const records = new Map();
  let queue = Promise.resolve();
  const snap = (ref) => ({ id: ref.id, exists: records.has(ref.path), data: () => structuredClone(records.get(ref.path)) });
  const ref = (path) => ({
    path, id: path.split("/").at(-1),
    get: async () => snap(ref(path)),
    set: async (value, options) => { records.set(path, options?.merge ? { ...records.get(path), ...structuredClone(value) } : structuredClone(value)); },
    delete: async () => { records.delete(path); },
    collection: (name) => query(`${path}/${name}`),
  });
  const query = (path, settings = {}) => ({
    doc: (id) => ref(`${path}/${id}`),
    orderBy: (field, direction) => query(path, { ...settings, field, direction }),
    limit: (limit) => query(path, { ...settings, limit }),
    startAfter: (cursor) => query(path, { ...settings, cursor }),
    get: async () => {
      let docs = [...records.keys()].filter((key) => key.startsWith(`${path}/`) && key.slice(path.length + 1).indexOf("/") === -1).map((key) => snap(ref(key)));
      docs.sort((a, b) => settings.field === "createdAt" ? (a.data().createdAt - b.data().createdAt) * (settings.direction === "desc" ? -1 : 1) : a.id.localeCompare(b.id));
      if (settings.cursor?.data) {
        const timestamp = Number(settings.cursor.data()[settings.field]);
        docs = docs.filter((doc) => settings.direction === "desc" ? Number(doc.data()[settings.field]) < timestamp : Number(doc.data()[settings.field]) > timestamp);
      } else if (settings.cursor) docs = docs.filter((doc) => doc.id > settings.cursor);
      return { docs: docs.slice(0, settings.limit || Infinity) };
    },
  });
  const db = {
    collection: (name) => query(name),
    runTransaction: (work) => {
      const run = queue.then(async () => {
        const writes = [];
        const tx = {
          get: async (reference) => snap(reference),
          getAll: async (...refs) => refs.map(snap),
          set: (reference, value, options) => writes.push(() => reference.set(value, options)),
          delete: (reference) => writes.push(() => reference.delete()),
        };
        const result = await work(tx);
        for (const write of writes) await write();
        return result;
      });
      queue = run.catch(() => {});
      return run;
    },
  };
  return db;
}

export function response() {
  return {
    headers: {}, statusCode: 200, body: undefined,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
    send(value) { this.body = value; return this; },
  };
}
