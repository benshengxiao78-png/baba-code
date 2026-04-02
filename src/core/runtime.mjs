import { registerBuiltinCommands } from '../commands/index.mjs';
import { createRegistry } from './registry.mjs';
import {
  addMessage,
  createSessionState,
  formatHistory,
  getActiveUserProfile,
} from './session.mjs';
import { getProvider } from '../providers/index.mjs';
import { registerBuiltinTools } from '../tools/index.mjs';

export function createRuntime(options = {}) {
  const {
    requestApproval = async () => false,
    notifyStateChange = () => {},
  } = options;
  const session = createSessionState();
  const commandRegistry = createRegistry('command');
  const toolRegistry = createRegistry('tool');

  registerBuiltinCommands(commandRegistry);
  registerBuiltinTools(toolRegistry);

  const runtime = {
    session,
    commandRegistry,
    toolRegistry,
    shouldExit: false,
  };

  const context = {
    session,
    commandRegistry,
    toolRegistry,
    get shouldExit() {
      return runtime.shouldExit;
    },
    set shouldExit(value) {
      runtime.shouldExit = Boolean(value);
    },
    invokeTool,
    formatHistory: () => formatHistory(session),
  };

  function appendMessage(role, content, extra = {}) {
    const message = addMessage(session, role, content, extra);
    notifyStateChange();
    return message;
  }

  function getActiveProvider() {
    const provider = getProvider(session.provider);
    if (!provider) {
      throw new Error(`Unknown provider: ${session.provider}`);
    }

    return provider;
  }

  async function invokeTool(name, args) {
    const tool = toolRegistry.get(name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    if (tool.requiresApproval) {
      const approved = await requestApproval(`Allow tool "${name}" to run?`);
      if (!approved) {
        const cancelled = {
          summary: `Tool ${name} rejected by user.`,
          content: 'Tool execution cancelled.',
          metadata: {},
        };

        appendMessage('tool', `${name}: ${cancelled.summary}`, {
          toolName: name,
          toolArgs: args,
          rejected: true,
        });

        return cancelled;
      }
    }

    const result = await tool.execute(args, { session });

    appendMessage('tool', `${name}: ${result.summary}`, {
      toolName: name,
      toolArgs: args,
    });

    return result;
  }

  async function handleCommand(line) {
    const [rawName, ...rest] = line.slice(1).trim().split(/\s+/);
    const commandName = rawName || 'help';
    const args = rest.join(' ');
    const command = commandRegistry.get(commandName);

    if (!command) {
      return `Unknown command: /${commandName}`;
    }

    return command.execute(context, args);
  }

  async function handleInput(line, runtimeOptions = {}) {
    const trimmed = line.trim();
    if (!trimmed) {
      return null;
    }

    const activeUser = getActiveUserProfile(session);
    appendMessage('user', trimmed, {
      userId: activeUser.id,
      userName: activeUser.name,
      buddyId: activeUser.buddyId,
    });

    if (trimmed.startsWith('/')) {
      const result = await handleCommand(trimmed);
      if (result) {
        appendMessage('system', result, { kind: 'command_result' });
      }

      return result;
    }

    let assistantMessage = null;
    const onAssistantChunk =
      typeof runtimeOptions.onAssistantChunk === 'function'
        ? (chunk) => {
            if (!assistantMessage) {
              assistantMessage = appendMessage('assistant', '');
            }

            assistantMessage.content += chunk;
            runtimeOptions.onAssistantChunk(chunk);
            notifyStateChange();
          }
        : undefined;

    const reply = await getActiveProvider().generateReply(trimmed, {
      session,
      toolRegistry,
      invokeTool,
      onAssistantChunk,
    });

    if (assistantMessage) {
      assistantMessage.content = reply;
      notifyStateChange();
    } else {
      appendMessage('assistant', reply);
    }
    return reply;
  }

  runtime.handleInput = handleInput;
  return runtime;
}
