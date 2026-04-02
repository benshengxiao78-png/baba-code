import {
  getBuddyById,
  pickBuddyForUser,
} from './buddies.mjs';

export function getDefaultModelForProvider(provider) {
  if (process.env.REPRO_MODEL) {
    return process.env.REPRO_MODEL;
  }

  if (provider === 'gemini') {
    return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  }

  return 'mock-sonnet';
}

export function isProviderConfigured(provider) {
  if (provider === 'gemini') {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  return true;
}

function getShellProfilePath() {
  const shell = process.env.SHELL || '';

  if (shell.includes('zsh')) {
    return {
      shellName: 'zsh',
      profilePath: '~/.zshrc',
    };
  }

  if (shell.includes('bash')) {
    return {
      shellName: 'bash',
      profilePath: '~/.bashrc',
    };
  }

  return {
    shellName: 'shell',
    profilePath: '~/.profile',
  };
}

export function getStartupWarnings(provider) {
  const warnings = [];

  if (provider === 'gemini' && !process.env.GEMINI_API_KEY) {
    const exportCommand = 'export GEMINI_API_KEY="your_api_key"';
    const { shellName, profilePath } = getShellProfilePath();

    warnings.push('GEMINI_API_KEY 未设置。当前默认走 Gemini 路径，但真实对话不可用。');
    warnings.push(`临时配置：${exportCommand}`);
    warnings.push(
      `永久配置（${shellName}）：echo '${exportCommand}' >> ${profilePath}`,
    );
    warnings.push(`重新加载：source ${profilePath}`);
    warnings.push('如果只想看本地演示，可执行：/provider mock');
  }

  return warnings;
}

export function getDefaultSessionConfig() {
  const provider = process.env.REPRO_PROVIDER || 'gemini';
  const model = getDefaultModelForProvider(provider);

  return { provider, model };
}

function getDefaultUserName() {
  const userName =
    process.env.BABA_USER ||
    process.env.USER ||
    process.env.USERNAME ||
    'You';

  return String(userName).trim() || 'You';
}

export function normalizeUserId(name) {
  const normalized = String(name ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'user';
}

function createUserProfile(name) {
  const resolvedName = String(name ?? '').trim() || getDefaultUserName();
  const buddy = pickBuddyForUser(resolvedName);

  return {
    id: normalizeUserId(resolvedName),
    name: resolvedName,
    buddyId: buddy.id,
    createdAt: new Date().toISOString(),
  };
}

function ensureSessionUsers(session) {
  if (!session.users) {
    session.users = {};
  }

  if (!session.activeUserId) {
    const existingUser = Object.values(session.users)[0];
    if (existingUser) {
      session.activeUserId = existingUser.id;
      return;
    }

    const user = createUserProfile(getDefaultUserName());
    session.users[user.id] = user;
    session.activeUserId = user.id;
  }
}

export function ensureUserProfile(session, name) {
  ensureSessionUsers(session);

  const resolvedName = String(name ?? '').trim() || getDefaultUserName();
  const userId = normalizeUserId(resolvedName);

  if (!session.users[userId]) {
    session.users[userId] = createUserProfile(resolvedName);
  }

  if (!session.users[userId].name) {
    session.users[userId].name = resolvedName;
  }

  if (!session.users[userId].buddyId) {
    session.users[userId].buddyId = pickBuddyForUser(resolvedName).id;
  }

  return session.users[userId];
}

export function getUserProfile(session, userId) {
  ensureSessionUsers(session);
  return session.users[userId] ?? null;
}

export function listUserProfiles(session) {
  ensureSessionUsers(session);
  return Object.values(session.users).sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

export function getBuddyForUser(user) {
  if (!user) {
    return pickBuddyForUser(getDefaultUserName());
  }

  return getBuddyById(user.buddyId) ?? pickBuddyForUser(user.name || user.id);
}

export function getActiveUserProfile(session) {
  ensureSessionUsers(session);
  return (
    getUserProfile(session, session.activeUserId) ??
    ensureUserProfile(session, getDefaultUserName())
  );
}

export function setActiveUser(session, name) {
  const user = ensureUserProfile(session, name);
  session.activeUserId = user.id;
  return user;
}

export function assignBuddyToUser(session, name, buddyId) {
  const buddy = getBuddyById(buddyId);
  if (!buddy) {
    return null;
  }

  const user = ensureUserProfile(session, name);
  user.buddyId = buddy.id;

  return {
    user,
    buddy,
  };
}

export function createSessionState() {
  const { provider, model } = getDefaultSessionConfig();
  const defaultUser = createUserProfile(getDefaultUserName());

  return {
    cwd: process.cwd(),
    provider,
    model,
    providerConfigured: isProviderConfigured(provider),
    startupWarnings: getStartupWarnings(provider),
    messages: [],
    providerHistory: [],
    users: {
      [defaultUser.id]: defaultUser,
    },
    activeUserId: defaultUser.id,
    createdAt: new Date().toISOString(),
  };
}

export function addMessage(session, role, content, extra = {}) {
  const message = {
    id: `${Date.now()}-${session.messages.length + 1}`,
    role,
    content,
    timestamp: new Date().toISOString(),
    ...extra,
  };

  session.messages.push(message);
  return message;
}

export function formatHistory(session) {
  if (session.messages.length === 0) {
    return 'No messages yet.';
  }

  return session.messages
    .map((message, index) => {
      const roleLabel =
        message.role === 'user'
          ? `user:${message.userName || 'You'}`
          : message.role;
      const prefix = `${index + 1}. [${roleLabel}]`;
      return `${prefix} ${message.content}`;
    })
    .join('\n');
}
