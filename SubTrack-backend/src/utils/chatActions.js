const ACTION_ALIAS_MAP = new Map([
  ['create', 'create'],
  ['add', 'create'],
  ['new', 'create'],
  ['start', 'create'],
  ['subscribe', 'create'],
  ['sign up', 'create'],
  ['sign-up', 'create'],
  ['signup', 'create'],
  ['update', 'update'],
  ['edit', 'update'],
  ['change', 'update'],
  ['modify', 'update'],
  ['adjust', 'update'],
  ['delete', 'delete'],
  ['remove', 'delete'],
  ['cancel', 'delete'],
  ['stop', 'delete'],
  ['terminate', 'delete'],
  ['end', 'delete'],
  ['unsubscribe', 'delete']
]);

export const normalizeChatActions = actionsInput => {
  if (!Array.isArray(actionsInput)) {
    return [];
  }

  const normalized = new Set();

  for (const rawAction of actionsInput) {
    if (typeof rawAction !== 'string') {
      continue;
    }

    const canonical = ACTION_ALIAS_MAP.get(rawAction.trim().toLowerCase());

    if (canonical) {
      normalized.add(canonical);
    }
  }

  return Array.from(normalized);
};
