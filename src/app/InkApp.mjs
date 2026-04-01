import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import { TextInput } from '../components/TextInput.mjs';
import { createRuntime } from '../core/runtime.mjs';

const h = React.createElement;

// Claude Code 标志性的颜色调色板
const CLAUDE_ORANGE = '#D97757';
const CLAUDE_ORANGE_SOFT = '#E29A81';
const BABA_BROWN = '#8B5A2B';
const BABA_BROWN_SOFT = '#A06B3E';
const TEXT_MUTED = '#878787';

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
      return TEXT_MUTED;
    default:
      return undefined;
  }
}

function roleLabel(role) {
  switch (role) {
    case 'user':
      return '○ You';
    case 'assistant':
      return '❖ Baba';
    case 'tool':
      return '⚒ Tool';
    case 'system':
      return '⚙ System';
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

// 经过严格数学计算的粑粑，保证 100% 左右绝对对称
function getHeroLines(columns) {
  if (columns < 72) {
    // 窄版：总宽度严格为 17 个字符，中心点在第 9 个字符（Index 8）
    return [
      [createSegment('        ▄        ', { color: BABA_BROWN_SOFT })],
      [createSegment('      ▄███▄      ', { color: BABA_BROWN })],
      [createSegment('    ▄███████▄    ', { color: BABA_BROWN_SOFT })],
      [createSegment('   ▄█████████▄   ', { color: BABA_BROWN })],
      [createSegment('  ▄██◉█████◉██▄  ', { color: BABA_BROWN_SOFT })], // 眼睛位于对称点
      [createSegment(' ▄█████ ◡ █████▄ ', { color: BABA_BROWN })],      // 嘴巴位于绝对中心点
      [createSegment(' ███████████████ ', { color: BABA_BROWN_SOFT })],
      [createSegment('  ▀▀▀▀▀▀▀▀▀▀▀▀▀  ', { color: BABA_BROWN })],
    ];
  }

  // 宽版：总宽度严格为 21 个字符，中心点在第 11 个字符（Index 10）
  return [
    [createSegment('          ▄          ', { color: BABA_BROWN_SOFT })],
    [createSegment('        ▄███▄        ', { color: BABA_BROWN })],
    [createSegment('      ▄███████▄      ', { color: BABA_BROWN_SOFT })],
    [createSegment('    ▄███████████▄    ', { color: BABA_BROWN })],
    [createSegment('   ▄█████████████▄   ', { color: BABA_BROWN_SOFT })],
    [createSegment('  ▄███◉███████◉███▄  ', { color: BABA_BROWN })],
    [createSegment(' ▄███████ ◡ ███████▄ ', { color: BABA_BROWN_SOFT })],
    [createSegment(' ███████████████████ ', { color: BABA_BROWN })],
    [createSegment('  ▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀  ', { color: BABA_BROWN_SOFT })],
  ];
}

function getBabaLogoLines(columns) {
  if (columns < 72) {
    return [
      [createSegment('Baba Code', { color: CLAUDE_ORANGE, bold: true })],
      [createSegment('tiny terminal mascot', { color: TEXT_MUTED })],
    ];
  }
  return null;
}

function renderSegment(segment, index) {
  return h(Text, { key: `segment-${index}`, ...segment.props }, segment.text);
}

function formatMessageTime(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return String(timestamp);
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function WelcomeScreen({ provider, model, cwd, columns }) {
  const heroLines = getHeroLines(columns);
  const logoLines = getBabaLogoLines(columns);
  const wideLayout = columns >= 72;

  return h(
    Box,
    {
      flexDirection: 'column',
      paddingY: 1,
      marginBottom: 1,
    },
    h(
      Box,
      { flexDirection: 'column', alignItems: 'center' },
      h(
        Text,
        null,
        h(Text, { color: CLAUDE_ORANGE, bold: true }, '❖ Baba Code '),
        h(Text, { color: TEXT_MUTED }, 'v1.0.0'),
      ),
      h(Text, { color: TEXT_MUTED }, `Provider: ${provider} · Model: ${model}`),
      h(Text, { color: TEXT_MUTED }, cwd),
      
      h(
        Box,
        {
          flexDirection: wideLayout ? 'row' : 'column',
          alignItems: 'center',
          marginTop: 2,
          marginBottom: 1,
          gap: wideLayout ? 4 : 1,
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
                  flexDirection: 'column',
                  paddingLeft: 2,
                  borderStyle: 'single',
                  borderTop: false,
                  borderRight: false,
                  borderBottom: false,
                  borderColor: CLAUDE_ORANGE_SOFT,
                },
                h(Text, { color: CLAUDE_ORANGE, bold: true }, 'Baba Code'),
                h(Text, { color: TEXT_MUTED }, 'The perfectly symmetrical'), // 更新标语
                h(Text, { color: TEXT_MUTED }, 'terminal mascot'),
              )
            : logoLines?.map((line, index) =>
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
      Box,
      { marginBottom: 0 },
      h(Text, { color: roleColor(message.role), bold: true }, `${roleLabel(message.role)} `),
      h(Text, { color: TEXT_MUTED }, formatMessageTime(message.timestamp)),
    ),
    h(
      Box,
      { paddingLeft: 2 },
      h(
        Box,
        { flexDirection: 'column' },
        ...lines.map((line, index) =>
          h(Text, { key: `${message.id}-${index}` }, line),
        )
      )
    )
  );
}

function MessagesPane({ messages }) {
  const visibleMessages = messages.slice(-MAX_RENDERED_MESSAGES);

  if (visibleMessages.length === 0) {
    return h(Box, { paddingLeft: 2, marginBottom: 1 }, h(Text, { color: TEXT_MUTED }, 'No messages yet. Try /help.'));
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
    h(Text, { color: 'yellow', bold: true }, '⚠ Permission request'),
    h(Text, null, prompt),
    h(
      Text,
      { color: TEXT_MUTED },
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
  const isWait = approvalActive || busy;
  const promptSymbol = isWait ? '◷' : '❯';
  const promptColor = approvalActive ? 'yellow' : (busy ? TEXT_MUTED : CLAUDE_ORANGE);

  const helperText = approvalActive
    ? 'Waiting for permission response...'
    : busy
      ? 'Working...'
      : exitHint || 'Type a prompt or /help';

  return h(
    Box,
    {
      flexDirection: 'column',
      paddingTop: 1,
    },
    h(
      Box,
      { flexDirection: 'row' },
      h(Text, { color: promptColor, bold: true }, `${promptSymbol} `),
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
    h(
      Box,
      { paddingLeft: 2, marginTop: 1 },
      h(Text, { color: TEXT_MUTED }, helperText),
    )
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
    { flexDirection: 'column', paddingX: 1, paddingY: 1 },
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
