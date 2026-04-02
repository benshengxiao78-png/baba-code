import {
  formatBuddyLine,
  getBuddyById,
  listBuddies,
} from '../core/buddies.mjs';
import { listProviders } from '../providers/index.mjs';
import {
  assignBuddyToUser,
  getActiveUserProfile,
  getBuddyForUser,
  getDefaultModelForProvider,
  getStartupWarnings,
  isProviderConfigured,
  listUserProfiles,
  setActiveUser,
} from '../core/session.mjs';
import { formatGeminiModels, listGeminiModels } from '../providers/geminiModels.mjs';

function formatActiveBuddy(session) {
  const user = getActiveUserProfile(session);
  const buddy = getBuddyForUser(user);

  return [
    `Current user: ${user.name}`,
    `Current buddy: ${buddy.sprite} ${buddy.name} (${buddy.id})`,
    `Vibe: ${buddy.description}`,
  ].join('\n');
}

function formatBuddyRoster(session) {
  const activeUser = getActiveUserProfile(session);
  const users = listUserProfiles(session);

  return [
    'Buddy roster:',
    ...users.map((user) => {
      const buddy = getBuddyForUser(user);
      const prefix = user.id === activeUser.id ? '*' : '-';
      return `${prefix} ${user.name}: ${buddy.sprite} ${buddy.name} (${buddy.id})`;
    }),
  ].join('\n');
}

function formatBuddyUsage(session) {
  return [
    formatActiveBuddy(session),
    '',
    'Usage:',
    '/buddy list',
    '/buddy roster',
    '/buddy <buddy-id>',
    '/buddy use <user>',
    '/buddy assign <user> <buddy-id>',
    '/buddy <user> <buddy-id>',
  ].join('\n');
}

export function registerBuiltinCommands(registry) {
  registry.register({
    name: 'help',
    description: 'Show available commands.',
    async execute(context) {
      const commands = context.commandRegistry
        .list()
        .map((command) => `/${command.name} - ${command.description}`)
        .join('\n');

      return `Available commands:\n${commands}`;
    },
  });

  registry.register({
    name: 'buddy',
    description: 'Show or assign buddies for users.',
    async execute(context, args) {
      const tokens = args.trim().split(/\s+/).filter(Boolean);

      if (tokens.length === 0) {
        return formatBuddyUsage(context.session);
      }

      if (tokens[0] === 'list') {
        return [
          'Available buddies:',
          ...listBuddies().map(formatBuddyLine),
        ].join('\n');
      }

      if (tokens[0] === 'roster') {
        return formatBuddyRoster(context.session);
      }

      if (tokens[0] === 'use') {
        const userName = tokens.slice(1).join(' ').trim();
        if (!userName) {
          return 'Usage: /buddy use <user>';
        }

        const user = setActiveUser(context.session, userName);
        const buddy = getBuddyForUser(user);
        return `Active user set to ${user.name} · ${buddy.sprite} ${buddy.name} (${buddy.id})`;
      }

      if (tokens[0] === 'set') {
        const buddyId = tokens[1];
        if (!buddyId) {
          return 'Usage: /buddy set <buddy-id>';
        }

        const activeUser = getActiveUserProfile(context.session);
        const assigned = assignBuddyToUser(
          context.session,
          activeUser.name,
          buddyId,
        );

        if (!assigned) {
          return `Unknown buddy: ${buddyId}. Run /buddy list to inspect options.`;
        }

        return `Assigned ${assigned.buddy.sprite} ${assigned.buddy.name} to ${assigned.user.name}.`;
      }

      if (tokens[0] === 'assign') {
        if (tokens.length < 3) {
          return 'Usage: /buddy assign <user> <buddy-id>';
        }

        const buddyId = tokens.at(-1);
        const userName = tokens.slice(1, -1).join(' ').trim();
        const assigned = assignBuddyToUser(context.session, userName, buddyId);

        if (!assigned) {
          return `Unknown buddy: ${buddyId}. Run /buddy list to inspect options.`;
        }

        return `Assigned ${assigned.buddy.sprite} ${assigned.buddy.name} to ${assigned.user.name}.`;
      }

      if (tokens.length === 1) {
        const buddy = getBuddyById(tokens[0]);
        if (!buddy) {
          return `Unknown buddy: ${tokens[0]}. Run /buddy list to inspect options.`;
        }

        const activeUser = getActiveUserProfile(context.session);
        assignBuddyToUser(context.session, activeUser.name, buddy.id);
        return `Assigned ${buddy.sprite} ${buddy.name} to ${activeUser.name}.`;
      }

      const buddyId = tokens.at(-1);
      const userName = tokens.slice(0, -1).join(' ').trim();
      const assigned = assignBuddyToUser(context.session, userName, buddyId);

      if (!assigned) {
        return `Unknown buddy: ${buddyId}. Run /buddy list to inspect options.`;
      }

      return `Assigned ${assigned.buddy.sprite} ${assigned.buddy.name} to ${assigned.user.name}.`;
    },
  });

  registry.register({
    name: 'tools',
    description: 'Show registered tools.',
    async execute(context) {
      const tools = context.toolRegistry
        .list()
        .map((tool) => `${tool.name} - ${tool.description}`)
        .join('\n');

      return `Registered tools:\n${tools}`;
    },
  });

  registry.register({
    name: 'model',
    description: 'Show or change the active model.',
    async execute(context, args) {
      const nextModel = args.trim();
      if (!nextModel) {
        return `Current model: ${context.session.model}`;
      }

      context.session.model = nextModel;
      return `Active model set to: ${context.session.model}`;
    },
  });

  registry.register({
    name: 'models',
    description: 'List available models for the active provider.',
    async execute(context) {
      if (context.session.provider !== 'gemini') {
        return `Model listing is only implemented for the gemini provider. Current provider: ${context.session.provider}`;
      }

      const models = await listGeminiModels();
      return formatGeminiModels(models);
    },
  });

  registry.register({
    name: 'provider',
    description: 'Show or change the active model provider.',
    async execute(context, args) {
      const nextProvider = args.trim();
      if (!nextProvider) {
        return `Current provider: ${context.session.provider}`;
      }

      const availableProviders = listProviders().map((provider) => provider.name);
      if (!availableProviders.includes(nextProvider)) {
        return `Unknown provider: ${nextProvider}. Available providers: ${availableProviders.join(', ')}`;
      }

      const previousProvider = context.session.provider;
      context.session.provider = nextProvider;
      context.session.providerConfigured = isProviderConfigured(nextProvider);
      context.session.startupWarnings = getStartupWarnings(nextProvider);
      if (context.session.model === getDefaultModelForProvider(previousProvider)) {
        context.session.model = getDefaultModelForProvider(nextProvider);
      }
      context.session.providerHistory = [];
      return `Active provider set to: ${context.session.provider} (${context.session.model})`;
    },
  });

  registry.register({
    name: 'history',
    description: 'Show the current session history.',
    async execute(context) {
      return context.formatHistory();
    },
  });

  registry.register({
    name: 'run',
    description: 'Run a shell command via the bash tool.',
    async execute(context, args) {
      const command = args.trim();
      if (!command) {
        return 'Usage: /run <shell command>';
      }

      const result = await context.invokeTool('bash', { command });
      return result.content;
    },
  });

  registry.register({
    name: 'read',
    description: 'Read a text file via the read_file tool.',
    async execute(context, args) {
      const filePath = args.trim();
      if (!filePath) {
        return 'Usage: /read <path>';
      }

      const result = await context.invokeTool('read_file', { path: filePath });
      return result.content;
    },
  });

  registry.register({
    name: 'exit',
    description: 'Exit the interactive session.',
    async execute(context) {
      context.shouldExit = true;
      return 'Bye.';
    },
  });
}
