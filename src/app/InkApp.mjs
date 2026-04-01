import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import { TextInput } from '../components/TextInput.mjs';
import { createRuntime } from '../core/runtime.mjs';

const h = React.createElement;
const CLAUDE_ORANGE = '#e87722';
const CLAUDE_ORANGE_SOFT = '#d68438';
const BABA_BROWN = '#9a622f';
const BABA_BROWN_SOFT = '#b9783a';
const MAX_RENDERED_MESSAGES = 10;
const MAX_RENDERED_LINES = 8;
function roleColor(role) {
  switch (role) {
    case 'user':
      return 'cyan';
    case 'assistant':
      return CLAUDE_ORANGE;
    case 'tool':
      return 'yellow';
    case 'system':
      return 'gray';
    default:
      return undefined;
  }
}

function roleLabel(role) {
  switch (role) {
    case 'user':
      return 'You';
    case 'assistant':
      return 'Claude';
    case 'tool':
      return 'Tool';
    case 'system':
      return 'System';
    default:
      return role;
  }
}

function clampMessage(content) {
  const lines = String(content).split('\n');
  if (lines.length <= MAX_RENDERED_LINES) {
    return lines;
  }

  return [
    ...lines.slice(0, MAX_RENDERED_LINES),
    `… (${lines.length - MAX_RENDERED_LINES} more lines hidden)`,
  ];
}

function createSegment(text, props = {}) {
  return { text, props };
}

function getHeroLines(columns) {
  if (columns < 72) {
    return [
      [createSegment('      ▄██▄      ', { color: BABA_BROWN_SOFT })],
      [createSegment('    ▄██████▄    ', { color: BABA_BROWN })],
      [createSegment('  ▄██████████▄  ', { color: BABA_BROWN_SOFT })],
      [createSegment('█████◉██◉█████', { color: BABA_BROWN })],
      [createSegment('██████▂▂██████', { color: BABA_BROWN_SOFT })],
      [createSegment(' ▀██████████▀ ', { color: BABA_BROWN })],
      [createSegment('   ▀██████▀   ', { color: BABA_BROWN_SOFT })],
    ];
  }

  return [
    [createSegment('       ▄██▄       ', { color: BABA_BROWN_SOFT })],
    [createSegment('     ▄██████▄     ', { color: BABA_BROWN })],
    [createSegment('   ▄██████████▄   ', { color: BABA_BROWN_SOFT })],
    [createSegment(' ▄██████████████▄ ', { color: BABA_BROWN })],
    [createSegment('██████◉████◉██████', { color: BABA_BROWN_SOFT })],
    [createSegment('████████▂▂████████', { color: BABA_BROWN })],
    [createSegment(' ▀██████████████▀ ', { color: BABA_BROWN_SOFT })],
    [createSegment('   ▀██████████▀   ', { color: BABA_BROWN })],
  ];
}

function getBabaLogoLines(columns) {
  if (columns < 72) {
    return [
      [createSegment('Baba Code', { color: CLAUDE_ORANGE, bold: true })],
      [createSegment('v1.0', { dimColor: true })],
      [createSegment('tiny terminal mascot', { dimColor: true })],
    ];
  }

  return null;
}

function renderSegment(segment, index) {
  return h(Text, { key: `segment-${index}`, ...segment.props }, segment.text);
}

export function WelcomeScreen({ provider, model, cwd, columns }) {
  const heroLines = getHeroLines(columns);
  const logoLines = getBabaLogoLines(columns);
  const wideLayout = columns >= 72;

  return h(
    Box,
    {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: CLAUDE_ORANGE,
      paddingX: 1,
      paddingY: 0,
      marginBottom: 1,
    },
    h(
      Box,
      { flexDirection: 'column', alignItems: 'center' },
      h(
        Text,
        null,
        h(Text, { color: CLAUDE_ORANGE, bold: true }, 'Welcome to Claude Code'),
        h(Text, { dimColor: true }, ' v0.1.0'),
      ),
      h(Text, { dimColor: true }, 'Ink-based local reproduction prototype'),
      h(Text, { dimColor: true }, `Provider: ${provider}`),
      h(Text, { dimColor: true }, `Model: ${model}`),
      h(Text, { dimColor: true }, cwd),
      h(
        Box,
        {
          flexDirection: wideLayout ? 'row' : 'column',
          alignItems: 'center',
          marginTop: 1,
          gap: wideLayout ? 6 : 1,
        },
        h(
          Box,
          { flexDirection: 'column', alignItems: 'center' },
          ...heroLines.map((line, index) =>
            h(
              Box,
              { key: `hero-${index}` },
              h(Text, null, ...line.map(renderSegment)),
            ),
          ),
        ),
        h(
          Box,
          { flexDirection: 'column', alignItems: wideLayout ? 'flex-start' : 'center' },
          wideLayout
            ? h(
                Box,
                {
                  borderStyle: 'round',
                  borderColor: CLAUDE_ORANGE,
                  flexDirection: 'column',
                  paddingX: 1,
                },
                h(Text, { color: CLAUDE_ORANGE, bold: true }, 'Baba Code'),
                h(Text, { dimColor: true }, 'v1.0'),
                h(Text, { dimColor: true }, 'tiny mascot'),
              )
            : logoLines.map((line, index) =>
                h(
                  Box,
                  { key: `logo-${index}` },
                  h(Text, null, ...line.map(renderSegment)),
                ),
              ),
        ),
      ),
    ),
  );
}

function MessageBlock({ message }) {
  const lines = clampMessage(message.content);

  return h(
    Box,
    { flexDirection: 'column', marginBottom: 1 },
    h(
      Text,
      null,
      h(Text, { color: roleColor(message.role), bold: true }, `${roleLabel(message.role)} `),
      h(Text, { dimColor: true }, message.timestamp),
    ),
    ...lines.map((line, index) =>
      h(Text, { key: `${message.id}-${index}` }, line),
    ),
  );
}

function MessagesPane({ messages }) {
  const visibleMessages = messages.slice(-MAX_RENDERED_MESSAGES);

  if (visibleMessages.length === 0) {
    return h(Text, { dimColor: true }, 'No messages yet. Try /help.');
  }

  return h(
    Box,
    { flexDirection: 'column' },
    ...visibleMessages.map((message) =>
      h(MessageBlock, { key: message.id, message }),
    ),
  );
}

function ApprovalPane({ prompt }) {
  return h(
    Box,
    {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: 'yellow',
      paddingX: 1,
      marginBottom: 1,
    },
    h(Text, { color: 'yellow', bold: true }, 'Permission request'),
    h(Text, null, prompt),
    h(
      Text,
      { dimColor: true },
      'Press y to approve, n or Esc to deny.',
    ),
  );
}

function NoticePane({ warnings }) {
  if (!warnings || warnings.length === 0) {
    return null;
  }

  return h(
    Box,
    {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: 'yellow',
      paddingX: 1,
      marginBottom: 1,
    },
    h(Text, { color: 'yellow', bold: true }, 'Setup notice'),
    ...warnings.map((warning, index) =>
      h(Text, { key: `warning-${index}` }, warning),
    ),
  );
}

function PromptPane({
  inputValue,
  onInputChange,
  cursorOffset,
  onCursorOffsetChange,
  onSubmit,
  onExit,
  exitHint,
  onExitMessage,
  busy,
  approvalActive,
}) {
  const label = approvalActive
    ? 'approval'
    : busy
      ? 'working'
      : 'prompt';

  const helperText = approvalActive
    ? 'Waiting for permission response...'
    : busy
      ? 'Working...'
      : exitHint || 'Type a prompt or /help';

  return h(
    Box,
    {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: approvalActive ? 'yellow' : CLAUDE_ORANGE,
      paddingX: 1,
    },
    h(
      Box,
      { flexDirection: 'row' },
      h(Text, { color: approvalActive ? 'yellow' : CLAUDE_ORANGE, bold: true }, `${label}> `),
      h(TextInput, {
        value: inputValue,
        onChange: onInputChange,
        onSubmit,
        onExit,
        onExitMessage,
        focus: !approvalActive && !busy,
        cursorOffset,
        onCursorOffsetChange,
        placeholder: 'Type a prompt or /help',
        showCursor: !approvalActive && !busy,
      }),
    ),
    h(Text, { dimColor: true }, helperText),
    h(Text, { dimColor: true }, 'Enter submit · Left/Right move · Ctrl+C exit'),
  );
}

export function InkApp() {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [inputValue, setInputValue] = useState('');
  const [cursorOffset, setCursorOffset] = useState(0);
  const [approval, setApproval] = useState(null);
  const [busy, setBusy] = useState(false);
  const [exitMessage, setExitMessage] = useState('');
  const [version, setVersion] = useState(0);
  const approvalRef = useRef(null);
  const inputValueRef = useRef('');
  const exitMessageTimerRef = useRef(null);

  const requestApproval = useCallback((prompt) => {
    return new Promise((resolve) => {
      const pending = { prompt, resolve };
      approvalRef.current = pending;
      setApproval(pending);
    });
  }, []);

  const runtime = useMemo(
    () =>
      createRuntime({
        requestApproval,
        notifyStateChange: () => {
          setVersion((current) => current + 1);
        },
      }),
    [requestApproval],
  );

  useEffect(() => {
    if (runtime.shouldExit) {
      exit();
      const timer = setTimeout(() => {
        process.exit(0);
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [exit, runtime, version]);

  const updateInputValue = useCallback((nextValue, nextCursorOffset = Array.from(nextValue).length) => {
    inputValueRef.current = nextValue;
    setInputValue(nextValue);
    setCursorOffset(nextCursorOffset);
  }, []);

  const submitLine = useCallback(async (lineOverride) => {
    const line = lineOverride ?? inputValueRef.current;
    if (!line.trim() || busy || approvalRef.current) {
      return;
    }

    setBusy(true);
    updateInputValue('', 0);

    try {
      await runtime.handleInput(line, {
        onAssistantChunk: () => {},
      });
    } catch (error) {
      runtime.session.messages.push({
        id: `${Date.now()}-error`,
        role: 'system',
        content: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
      setVersion((current) => current + 1);
    } finally {
      setBusy(false);
      if (runtime.shouldExit) {
        exit();
      }
    }
  }, [busy, exit, runtime, updateInputValue]);

  useInput((input, key) => {
    if (approvalRef.current) {
      if (input.toLowerCase() === 'y') {
        approvalRef.current.resolve(true);
        approvalRef.current = null;
        setApproval(null);
        return;
      }

      if (input.toLowerCase() === 'n' || key.escape || key.return || input === '\r' || input === '\n') {
        approvalRef.current.resolve(false);
        approvalRef.current = null;
        setApproval(null);
      }
    }
  }, { isActive: Boolean(approval) });

  const handleExit = useCallback(() => {
    exit();
    setTimeout(() => {
      process.exit(0);
    }, 0);
  }, [exit]);

  const handleExitMessage = useCallback((message) => {
    if (exitMessageTimerRef.current) {
      clearTimeout(exitMessageTimerRef.current);
      exitMessageTimerRef.current = null;
    }

    setExitMessage(message || '');

    if (message) {
      exitMessageTimerRef.current = setTimeout(() => {
        setExitMessage('');
        exitMessageTimerRef.current = null;
      }, 1000);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (exitMessageTimerRef.current) {
        clearTimeout(exitMessageTimerRef.current);
      }
    };
  }, []);

  return h(
    Box,
    { flexDirection: 'column' },
    h(WelcomeScreen, {
      provider: runtime.session.provider,
      model: runtime.session.model,
      cwd: runtime.session.cwd,
      columns: stdout?.columns ?? 80,
    }),
    h(NoticePane, { warnings: runtime.session.startupWarnings }),
    approval
      ? h(ApprovalPane, {
          prompt: approval.prompt,
        })
      : null,
    h(MessagesPane, { messages: runtime.session.messages }),
    h(PromptPane, {
      inputValue,
      onInputChange: updateInputValue,
      cursorOffset,
      onCursorOffsetChange: setCursorOffset,
      onSubmit: submitLine,
      onExit: handleExit,
      exitHint: exitMessage,
      onExitMessage: handleExitMessage,
      busy,
      approvalActive: Boolean(approval),
    }),
  );
}
