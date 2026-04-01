const GEMINI_API_BASE_URL =
  process.env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';

function getApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set.');
  }

  return apiKey;
}

function supportsGenerateContent(model) {
  return Array.isArray(model.supportedGenerationMethods)
    && model.supportedGenerationMethods.includes('generateContent');
}

function toDisplayName(model) {
  return model.baseModelId || model.name?.replace(/^models\//, '') || model.displayName || 'unknown';
}

export async function listGeminiModels() {
  const apiKey = getApiKey();
  const response = await fetch(
    `${GEMINI_API_BASE_URL}/models?pageSize=1000`,
    {
      headers: {
        'x-goog-api-key': apiKey,
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini models.list failed (${response.status}): ${body}`);
  }

  const data = await response.json();
  return (data.models || [])
    .filter(supportsGenerateContent)
    .sort((a, b) => toDisplayName(a).localeCompare(toDisplayName(b)));
}

export function formatGeminiModels(models) {
  if (models.length === 0) {
    return 'No Gemini models with generateContent support were returned.';
  }

  return [
    'Gemini models that support generateContent:',
    ...models.map((model) => {
      const name = toDisplayName(model);
      const label = model.displayName ? ` (${model.displayName})` : '';
      return `- ${name}${label}`;
    }),
  ].join('\n');
}

