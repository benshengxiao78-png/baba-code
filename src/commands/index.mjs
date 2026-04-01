import { listProviders } from '../providers/index.mjs';
import {
  getDefaultModelForProvider,
  getStartupWarnings,
  isProviderConfigured,
} from '../core/session.mjs';
import { formatGeminiModels, listGeminiModels } from '../providers/geminiModels.mjs';

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
