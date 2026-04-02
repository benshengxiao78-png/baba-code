import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import React from 'react';
import { render, renderToString } from 'ink';
import { InkApp } from './InkApp.mjs';
import { createRuntime } from '../core/runtime.mjs';
import { WelcomeScreen } from './InkApp.mjs';
import { createSessionState, getActiveUserProfile } from '../core/session.mjs';

const IS_APPLE_TERMINAL = process.env.TERM_PROGRAM === 'Apple_Terminal';
const FORCE_APPLE_TERMINAL_FALLBACK = process.env.BABA_APPLE_TERMINAL_FALLBACK === '1';

export function createCliApp() {
  function renderWelcome(session = createSessionState()) {
    const { provider, model } = session;

    return renderToString(
      React.createElement(WelcomeScreen, {
        provider,
        model,
        columns: process.stdout.columns || 80,
        activeUser: getActiveUserProfile(session),
      }),
    );
  }

  async function runAppleTerminalFallback() {
    let rl;
    const runtime = createRuntime({
      requestApproval: async (prompt) => {
        const answer = await rl.question(`${prompt} [y/N] `);
        const normalized = answer.trim().toLowerCase();
        return normalized === 'y' || normalized === 'yes';
      },
    });

    rl = readline.createInterface({
      input,
      output,
      terminal: true,
    });

    try {
      output.write(`${renderWelcome(runtime.session)}\n`);

      if (runtime.session.startupWarnings.length > 0) {
        for (const warning of runtime.session.startupWarnings) {
          output.write(`Setup notice: ${warning}\n`);
        }
        output.write('\n');
      }

      output.write(
        'Apple Terminal compatibility mode: line input enabled for Chinese IME stability.\n\n',
      );

      while (!runtime.shouldExit) {
        const line = await rl.question('cc-repro> ');
        try {
          const result = await runtime.handleInput(line);
          if (result) {
            output.write(`${result}\n\n`);
          }
        } catch (error) {
          output.write(
            `${error instanceof Error ? error.message : String(error)}\n\n`,
          );
        }
      }
    } finally {
      rl.close();
    }
  }

  async function runScripted() {
    const runtime = createRuntime();
    const rl = readline.createInterface({ input });

    try {
      for await (const line of rl) {
        if (runtime.shouldExit) {
          break;
        }

        try {
          const result = await runtime.handleInput(line);
          if (result) {
            output.write(`${result}\n`);
          }
        } catch (error) {
          output.write(
            `${error instanceof Error ? error.message : String(error)}\n`,
          );
        }
      }
    } finally {
      rl.close();
    }
  }

  async function run(argv) {
    if (argv.includes('--help')) {
      output.write('Usage: baba-code\n');
      output.write('Starts the Baba Code Ink CLI shell.\n');
      output.write('Use --preview-welcome to print the startup welcome UI.\n');
      return;
    }

    if (argv.includes('--preview-welcome')) {
      output.write(`${renderWelcome()}\n`);
      return;
    }

    if (!input.isTTY) {
      await runScripted();
      return;
    }

    if (IS_APPLE_TERMINAL && FORCE_APPLE_TERMINAL_FALLBACK) {
      await runAppleTerminalFallback();
      return;
    }

    const instance = render(React.createElement(InkApp), {
      exitOnCtrlC: false,
    });
    await instance.waitUntilExit();
  }

  return {
    run,
  };
}
