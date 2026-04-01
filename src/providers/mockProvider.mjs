function matchBashIntent(input) {
  const text = input.toLowerCase();

  if (text.includes('当前目录') || text === 'pwd') {
    return { tool: 'bash', args: { command: 'pwd' } };
  }

  if (
    text.includes('列出文件') ||
    text.includes('列出目录') ||
    text.includes('list files') ||
    text.includes('show files')
  ) {
    return { tool: 'bash', args: { command: 'ls -la' } };
  }

  return null;
}

function matchReadIntent(input) {
  const text = input.toLowerCase();

  if (text.includes('readme')) {
    return { tool: 'read_file', args: { path: 'README.md' } };
  }

  return null;
}

export const mockProvider = {
  name: 'mock',
  async generateReply(input, context) {
    const bashIntent = matchBashIntent(input);
    if (bashIntent) {
      const result = await context.invokeTool(bashIntent.tool, bashIntent.args);
      return [
        'I inferred a shell action from your request.',
        result.content,
      ].join('\n\n');
    }

    const readIntent = matchReadIntent(input);
    if (readIntent) {
      const result = await context.invokeTool(readIntent.tool, readIntent.args);
      return [
        'I inferred a file read from your request.',
        result.content,
      ].join('\n\n');
    }

    return [
      `Current provider: ${context.session.provider}`,
      `Current model: ${context.session.model}`,
      'Gemini integration is ready when GEMINI_API_KEY is configured.',
      'Try `/help`, `/tools`, `/run pwd`, `/read README.md`, or ask me to “列出文件”。',
    ].join('\n');
  },
};
