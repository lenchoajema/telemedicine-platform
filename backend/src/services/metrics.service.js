const counters = new Map();

export function inc(name, value = 1) {
  const v = counters.get(name) || 0;
  counters.set(name, v + value);
}

export function get(name) {
  return counters.get(name) || 0;
}

export function snapshot() {
  const obj = {};
  for (const [k, v] of counters.entries()) obj[k] = v;
  return obj;
}

export default { inc, get, snapshot };
