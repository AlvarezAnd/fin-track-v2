export function parseEntityId(value: unknown): number | null {
  const raw = typeof value === 'number' ? String(value) : value;

  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) {
    return null;
  }

  const id = Number(raw);

  return id > 0 && id <= Number.MAX_SAFE_INTEGER ? id : null;
}
