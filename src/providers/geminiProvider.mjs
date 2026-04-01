const GEMINI_API_BASE_URL =
  process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';

const COMMON_MODEL_HINTS = {
  'gemini-3-flash': 'gemini-3-flash-preview',
  'gemini-3-pro': 'gemini-3-pro-preview',
};

const DEFAULT_SYSTEM_PROMPT = [
  'You are a concise coding assistant running inside a local CLI reproduction of Claude Code.',
  'Prefer short, direct answers.',
  'Reply in the same language as the user. If the user writes in Chinese, answer in Chinese.',
  'When a local tool is needed, call a function instead of hallucinating the result.',
  'Only use the provided functions.',
].join(' ');

function getApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set. Export GEMINI_API_KEY, or run with REPRO_PROVIDER=mock.',
    );
  }

  return apiKey;
}

function buildModelSuggestion(model) {
  if (COMMON_MODEL_HINTS[model]) {
    return ` Try \`/model ${COMMON_MODEL_HINTS[model]}\` or run \`/models\` to inspect the current list.`;
  }

  return ' Run `/models` to inspect the current list of Gemini models.';
}

function getTextFromParts(parts = []) {
  return parts
    .filter((part) => typeof part?.text === 'string')
    .map((part) => part.text)
    .join('\n')
    .trim();
}

function getFunctionCalls(parts = []) {
  return parts
    .filter((part) => part?.functionCall)
    .map((part) => part.functionCall);
}

function createToolDeclarations(toolRegistry) {
  return toolRegistry.list().map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema || {
      type: 'object',
      properties: {},
    },
  }));
}

function shouldPreferToolCalling(input) {
  const text = input.toLowerCase();
  const patterns = [
    'read ',
    'open ',
    'file',
    'files',
    'directory',
    'folder',
    'pwd',
    'ls',
    'shell',
    'terminal',
    'command',
    'run ',
    'readme',
    '文件',
    '目录',
    '路径',
    '终端',
    '命令',
    '运行',
    '读取',
    '打开',
    '列出',
  ];

  return patterns.some((pattern) => text.includes(pattern));
}

async function callGeminiApi(payload, model) {
  const apiKey = getApiKey();
  const response = await fetch(
    `${GEMINI_API_BASE_URL}/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 404) {
      throw new Error(
        `Gemini model \`${model}\` is not available for generateContent on ${GEMINI_API_BASE_URL}.${buildModelSuggestion(model)}\n\nOriginal response:\n${body}`,
      );
    }

    throw new Error(`Gemini API request failed (${response.status}): ${body}`);
  }

  return response.json();
}

async function* streamGeminiApi(payload, model) {
  const apiKey = getApiKey();
  const response = await fetch(
    `${GEMINI_API_BASE_URL}/models/${model}:streamGenerateContent?alt=sse`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 404) {
      throw new Error(
        `Gemini model \`${model}\` is not available for streamGenerateContent on ${GEMINI_API_BASE_URL}.${buildModelSuggestion(model)}\n\nOriginal response:\n${body}`,
      );
    }

    throw new Error(`Gemini streaming request failed (${response.status}): ${body}`);
  }

  if (!response.body) {
    throw new Error('Gemini streaming response had no body.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  function* parseEvents(rawBuffer) {
    const normalized = rawBuffer.replace(/\r\n/g, '\n');
    const events = normalized.split('\n\n');
    const remainder = events.pop() || '';

    for (const event of events) {
      const data = event
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())
        .join('\n');

      if (!data || data === '[DONE]') {
        continue;
      }

      yield JSON.parse(data);
    }

    return remainder;
  }

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const parsed = parseEvents(buffer);
    let next = parsed.next();
    while (!next.done) {
      yield next.value;
      next = parsed.next();
    }
    buffer = next.value || '';

    if (done) {
      const tail = buffer
        .replace(/\r\n/g, '\n')
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())
        .join('\n');

      if (tail && tail !== '[DONE]') {
        yield JSON.parse(tail);
      }

      break;
    }
  }
}

async function generateStreamingText(payload, model, onAssistantChunk) {
  let text = '';

  for await (const chunk of streamGeminiApi(payload, model)) {
    const parts = chunk?.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (typeof part?.text === 'string' && part.text) {
        text += part.text;
        onAssistantChunk?.(part.text);
      }
    }
  }

  return text.trim();
}

export const geminiProvider = {
  name: 'gemini',
  async generateReply(input, context) {
    const { session, toolRegistry, invokeTool, onAssistantChunk } = context;
    const toolDeclarations = createToolDeclarations(toolRegistry);

    session.providerHistory.push({
      role: 'user',
      parts: [{ text: input }],
    });

    let loopCount = 0;

    while (loopCount < 6) {
      loopCount += 1;

      const payload = {
        systemInstruction: {
          parts: [{ text: DEFAULT_SYSTEM_PROMPT }],
        },
        contents: session.providerHistory,
      };

      const shouldUseTools =
        toolDeclarations.length > 0 && shouldPreferToolCalling(input);

      if (shouldUseTools) {
        payload.tools = [
          {
            functionDeclarations: toolDeclarations,
          },
        ];
      }

      if (!shouldUseTools && onAssistantChunk) {
        const streamedText = await generateStreamingText(
          payload,
          session.model,
          onAssistantChunk,
        );

        if (!streamedText) {
          throw new Error('Gemini returned an empty streamed response.');
        }

        session.providerHistory.push({
          role: 'model',
          parts: [{ text: streamedText }],
        });

        return streamedText;
      }

      const response = await callGeminiApi(payload, session.model);
      const candidate = response?.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      if (!candidate?.content) {
        const feedback = response?.promptFeedback
          ? JSON.stringify(response.promptFeedback)
          : 'No candidate content returned.';
        throw new Error(`Gemini returned no candidate content. ${feedback}`);
      }

      session.providerHistory.push(candidate.content);

      const functionCalls = getFunctionCalls(parts);
      if (functionCalls.length > 0) {
        for (const functionCall of functionCalls) {
          const result = await invokeTool(functionCall.name, functionCall.args || {});
          session.providerHistory.push({
            role: 'user',
            parts: [
              {
                functionResponse: {
                  name: functionCall.name,
                  response: {
                    result: result.content,
                    summary: result.summary,
                    metadata: result.metadata || {},
                  },
                },
              },
            ],
          });
        }

        continue;
      }

      const text = getTextFromParts(parts);
      if (!text) {
        throw new Error('Gemini returned an empty response.');
      }

      return text;
    }

    throw new Error('Gemini tool loop exceeded the maximum number of turns.');
  },
};
