const BUDDY_CATALOG = Object.freeze([
  {
    id: 'duck',
    name: 'Duck',
    sprite: "('v')",
    description: 'tiny terminal duck',
  },
  {
    id: 'cat',
    name: 'Cat',
    sprite: '=^.^=',
    description: 'curious code cat',
  },
  {
    id: 'blob',
    name: 'Blob',
    sprite: '(o_o)',
    description: 'squishy patch blob',
  },
  {
    id: 'octopus',
    name: 'Octopus',
    sprite: '\\o_o/',
    description: 'alert octo debugger',
  },
  {
    id: 'ghost',
    name: 'Ghost',
    sprite: '.^_^.',
    description: 'quiet haunted helper',
  },
  {
    id: 'robot',
    name: 'Robot',
    sprite: '[::_::]',
    description: 'steady build bot',
  },
  {
    id: 'rabbit',
    name: 'Rabbit',
    sprite: '(\\_/)',
    description: 'fast hopping fixer',
  },
  {
    id: 'turtle',
    name: 'Turtle',
    sprite: '_(..)_',
    description: 'slow careful reviewer',
  },
]);

function normalizeBuddyId(value) {
  return String(value ?? '').trim().toLowerCase();
}

function hashText(value) {
  let hash = 2166136261;

  for (const char of String(value ?? '')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function listBuddies() {
  return [...BUDDY_CATALOG];
}

export function getBuddyById(buddyId) {
  const normalized = normalizeBuddyId(buddyId);
  return BUDDY_CATALOG.find((buddy) => buddy.id === normalized) ?? null;
}

export function pickBuddyForUser(userName) {
  const index = hashText(`${userName}:buddy-2026`) % BUDDY_CATALOG.length;
  return BUDDY_CATALOG[index] ?? BUDDY_CATALOG[0];
}

export function formatBuddyLine(buddy) {
  return `- ${buddy.id}: ${buddy.sprite} ${buddy.name} - ${buddy.description}`;
}
