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

export function getStartupWarnings(provider) {
  const warnings = [];

  if (provider === 'gemini' && !process.env.GEMINI_API_KEY) {
    warnings.push(
      'GEMINI_API_KEY 未设置。当前默认走 Gemini 路径，但真实对话不可用。请先导出 GEMINI_API_KEY；如果只想看本地演示，可执行 /provider mock。',
    );
  }

  return warnings;
}

export function getDefaultSessionConfig() {
  const provider = process.env.REPRO_PROVIDER || 'gemini';
  const model = getDefaultModelForProvider(provider);

  return { provider, model };
}

export function createSessionState() {
  const { provider, model } = getDefaultSessionConfig();

  return {
    cwd: process.cwd(),
    provider,
    model,
    providerConfigured: isProviderConfigured(provider),
    startupWarnings: getStartupWarnings(provider),
    messages: [],
    providerHistory: [],
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
      const prefix = `${index + 1}. [${message.role}]`;
      return `${prefix} ${message.content}`;
    })
    .join('\n');
}
