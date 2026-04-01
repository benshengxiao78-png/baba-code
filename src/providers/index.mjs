import { geminiProvider } from './geminiProvider.mjs';
import { mockProvider } from './mockProvider.mjs';

const providers = new Map([
  [geminiProvider.name, geminiProvider],
  [mockProvider.name, mockProvider],
]);

export function getProvider(name) {
  return providers.get(name);
}

export function listProviders() {
  return Array.from(providers.values()).sort((a, b) => a.name.localeCompare(b.name));
}
