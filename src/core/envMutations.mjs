const SENSITIVE_ENV_VARS = new Set([
  'GEMINI_API_KEY',
]);

function stripMatchingQuotes(value) {
  if (value.length < 2) {
    return value;
  }

  const first = value[0];
  const last = value[value.length - 1];

  if ((first === '"' || first === '\'') && first === last) {
    return value.slice(1, -1);
  }

  return value;
}

export function isSensitiveEnvVar(name) {
  return SENSITIVE_ENV_VARS.has(String(name || '').trim().toUpperCase());
}

export function parseShellEnvMutation(command) {
  const trimmed = String(command || '').trim();

  const exportMatch = trimmed.match(/^export\s+([A-Za-z_][A-Za-z0-9_]*)=(.*)$/s);
  if (exportMatch) {
    return {
      action: 'set',
      name: exportMatch[1],
      value: stripMatchingQuotes(exportMatch[2].trim()),
    };
  }

  const unsetMatch = trimmed.match(/^unset\s+([A-Za-z_][A-Za-z0-9_]*)$/);
  if (unsetMatch) {
    return {
      action: 'unset',
      name: unsetMatch[1],
    };
  }

  return null;
}

export function applyProcessEnvMutation(mutation) {
  if (!mutation?.name) {
    return false;
  }

  if (mutation.action === 'unset') {
    delete process.env[mutation.name];
    return true;
  }

  if (mutation.action === 'set') {
    process.env[mutation.name] = mutation.value;
    return true;
  }

  return false;
}

export function redactSensitiveText(value) {
  let text = String(value ?? '');

  for (const envName of SENSITIVE_ENV_VARS) {
    const pattern = new RegExp(
      `(${envName}\\s*=\\s*)(?:"[^"]*"|'[^']*'|\\S+)`,
      'g',
    );
    text = text.replace(pattern, `$1[REDACTED]`);
  }

  return text;
}

export function sanitizeToolArgs(toolName, args) {
  if (toolName !== 'bash' || !args || typeof args.command !== 'string') {
    return args;
  }

  return {
    ...args,
    command: redactSensitiveText(args.command),
  };
}

export function formatEnvMutationResult(mutation) {
  if (mutation.action === 'unset') {
    return {
      summary: `Updated session environment: unset ${mutation.name}`,
      content: `${mutation.name} has been unset for the current Baba Code session.`,
    };
  }

  if (isSensitiveEnvVar(mutation.name)) {
    return {
      summary: `Updated session environment: export ${mutation.name}=[REDACTED]`,
      content: `${mutation.name} has been set for the current Baba Code session.`,
    };
  }

  return {
    summary: `Updated session environment: export ${mutation.name}=${mutation.value}`,
    content: `${mutation.name} has been set to ${mutation.value} for the current Baba Code session.`,
  };
}
