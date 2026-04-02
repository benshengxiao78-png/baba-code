import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import {
  applyProcessEnvMutation,
  formatEnvMutationResult,
  parseShellEnvMutation,
  redactSensitiveText,
} from '../core/envMutations.mjs';
import { refreshProviderState } from '../core/session.mjs';

const execAsync = promisify(exec);

export const bashTool = {
  name: 'bash',
  description: 'Run a shell command in the current working directory.',
  inputSchema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The shell command to execute with zsh in the current working directory.',
      },
    },
    required: ['command'],
  },
  requiresApproval: true,
  async execute(input, context) {
    const command = String(input.command || '').trim();

    if (!command) {
      throw new Error('Missing shell command.');
    }

    const envMutation = parseShellEnvMutation(command);
    if (envMutation) {
      applyProcessEnvMutation(envMutation);
      refreshProviderState(context.session);
      const result = formatEnvMutationResult(envMutation);

      return {
        ...result,
        metadata: {
          command: redactSensitiveText(command),
          envMutation,
        },
      };
    }

    const { stdout, stderr } = await execAsync(command, {
      cwd: context.session.cwd,
      maxBuffer: 1024 * 1024,
      shell: '/bin/zsh',
    });

    return {
      summary: `Executed shell command: ${command}`,
      content: [stdout, stderr].filter(Boolean).join('').trim() || '(no output)',
      metadata: {
        command,
      },
    };
  },
};
