import { createCliApp } from './app/cli.mjs';

const app = createCliApp();

app.run(process.argv.slice(2)).catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
