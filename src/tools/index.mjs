import { bashTool } from './bashTool.mjs';
import { fileReadTool } from './fileReadTool.mjs';

export function registerBuiltinTools(registry) {
  registry.register(bashTool);
  registry.register(fileReadTool);
}
