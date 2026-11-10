// Reuse only a read that is still running. Never cache settled database values.
export function createReadFlight() {
  let active = null;
  return {
    run(read) {
      if (active) return active;
      const request = Promise.resolve().then(read);
      active = request;
      const clear = () => { if (active === request) active = null; };
      request.then(clear, clear);
      return request;
    },
    // A write may complete while an older read is still pending. Subsequent reads
    // must start after that write rather than join the older request.
    invalidate() { active = null; },
  };
}
