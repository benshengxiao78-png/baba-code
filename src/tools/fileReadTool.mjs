import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const fileReadTool = {
  name: 'read_file',
  description: 'Read a UTF-8 text file from disk.',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The relative or absolute path of the UTF-8 text file to read.',
      },
    },
    required: ['path'],
  },
  requiresApproval: false,
  async execute(input, context) {
    const rawPath = String(input.path || '').trim();

    if (!rawPath) {
      throw new Error('Missing file path.');
    }

    const absolutePath = path.resolve(context.session.cwd, rawPath);
    const content = await readFile(absolutePath, 'utf8');

    return {
      summary: `Read file: ${absolutePath}`,
      content,
      metadata: {
        path: absolutePath,
      },
    };
  },
};
