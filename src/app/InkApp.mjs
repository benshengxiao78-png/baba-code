import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import { TextInput } from '../components/TextInput.mjs';
import { createRuntime } from '../core/runtime.mjs';
import { getBuddyById } from '../core/buddies.mjs';
import { getActiveUserProfile, getBuddyForUser } from '../core/session.mjs';

const h = React.createElement;

// Claude Code 标志性的颜色调色板
const CLAUDE_ORANGE = '#D97757';
const BABA_BROWN = '#8B5A2B';
const BABA_BROWN_SOFT = '#A06B3E';
const PROMPT_BORDER = '#999999';
const TEXT_MUTED = '#878787';
const BABA_VERSION_LABEL = 'v1.0.0';
const BABA_TAGLINE = 'The Poop with Wisdom';
const WELCOME_V2_WIDTH = 58;

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

function messageLabel(message) {
  switch (message.role) {
    case 'user':
      return `${getBuddyById(message.buddyId)?.sprite || '○'} ${message.userName || 'You'}`;
    case 'assistant':
      return '❖ Baba';
    case 'tool':
      return '⚒ Tool';
    case 'system':
      return '⚙ System';
    default:
      return message.role;
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

function getMessageLines(message, expandLongMessages) {
  const lines = String(message.content).split('\n');
  if (expandLongMessages) {
    return lines;
  }

  return clampMessage(message.content);
}

function createSegment(text, props = {}) {
  return { text, props };
}

function getWelcomeDivider(width) {
  return '…'.repeat(width);
}

function getHeroLines(columns) {
  if (columns < 64) {
    return [
      [createSegment('        ▄        ', { color: BABA_BROWN_SOFT })],
      [createSegment('      ▄███▄      ', { color: BABA_BROWN })],
      [createSegment('    ▄███████▄    ', { color: BABA_BROWN_SOFT })],
      [createSegment('   ▄█████████▄   ', { color: BABA_BROWN })],
      [createSegment('  ▄██◉█████◉██▄  ', { color: BABA_BROWN_SOFT })],
      [createSegment(' ▄█████ ◡ █████▄ ', { color: BABA_BROWN })],
      [createSegment(' ███████████████ ', { color: BABA_BROWN_SOFT })],
      [createSegment('  ▀▀▀▀▀▀▀▀▀▀▀▀▀  ', { color: BABA_BROWN })],
    ];
  }

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

export function WelcomeScreen({ provider, model, columns, activeUser }) {
  const heroLines = getHeroLines(columns);
  const wideLayout = columns >= 64;
  const activeBuddy = getBuddyForUser(activeUser);

  return h(
    Box,
    {
      flexDirection: 'column',
      marginBottom: 1,
    },
    h(
      Text,
      null,
      h(Text, { color: CLAUDE_ORANGE }, 'Welcome to Baba Code '),
      h(Text, { dimColor: true }, BABA_VERSION_LABEL),
    ),
    h(Text, { dimColor: true }, getWelcomeDivider(WELCOME_V2_WIDTH)),
    h(
      Box,
      {
        flexDirection: wideLayout ? 'row' : 'column',
        alignItems: wideLayout ? 'center' : 'flex-start',
        gap: wideLayout ? 3 : 1,
        marginTop: 1,
      },
      h(
        Box,
        { flexDirection: 'column', alignItems: 'flex-start' },
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
        {
          flexDirection: 'column',
          alignItems: 'flex-start',
        },
        h(Text, { color: BABA_BROWN_SOFT }, BABA_TAGLINE),
        h(Text, { color: TEXT_MUTED }, `Provider: ${provider}`),
        h(Text, { color: TEXT_MUTED }, `Model: ${model}`),
        h(
          Text,
          { color: TEXT_MUTED },
          `User: ${activeUser.name} · Buddy: ${activeBuddy.sprite} ${activeBuddy.name}`,
        ),
      ),
    ),
  );
}

function MessageBlock({ message, expandLongMessages }) {
  const lines = getMessageLines(message, expandLongMessages);

  return h(
    Box,
    { flexDirection: 'column', marginBottom: 1 },
    h(
      Box,
      { marginBottom: 0 },
      h(Text, { color: roleColor(message.role), bold: true }, `${messageLabel(message)} `),
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

function MessagesPane({ messages, expandLongMessages }) {
  const visibleMessages = messages.slice(-MAX_RENDERED_MESSAGES);

  if (visibleMessages.length === 0) {
    return h(Box, { paddingLeft: 2, marginBottom: 1 }, h(Text, { color: TEXT_MUTED }, 'No messages yet. Try /help.'));
  }

  return h(
    Box,
    { flexDirection: 'column' },
    ...visibleMessages.map((message) =>
      h(MessageBlock, { key: message.id, message, expandLongMessages }),
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
  expandLongMessages,
}) {
  const isWait = approvalActive || busy;
  const promptSymbol = isWait ? '◷' : '❯';
  const promptColor = approvalActive ? 'yellow' : (busy ? TEXT_MUTED : CLAUDE_ORANGE);
  const borderColor = approvalActive ? 'yellow' : PROMPT_BORDER;

  const baseHelperText = approvalActive
    ? 'Waiting for permission response...'
    : busy
      ? 'Working...'
      : exitHint || 'Type a prompt or /help';
  const helperText = approvalActive
    ? baseHelperText
    : `${baseHelperText} · Ctrl+L ${expandLongMessages ? 'collapse' : 'expand'} long messages`;

  return h(
    Box,
    {
      flexDirection: 'column',
      paddingTop: 1,
    },
    h(
      Box,
      {
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderStyle: 'round',
        borderColor,
        borderLeft: false,
        borderRight: false,
        borderBottom: false,
        width: '100%',
        paddingX: 1,
      },
      h(Text, { color: promptColor, bold: true }, `${promptSymbol} `),
      h(
        Box,
        { flexGrow: 1, flexShrink: 1 },
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
  const [expandLongMessages, setExpandLongMessages] = useState(false);
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

  useInput((input, key) => {
    if (key.ctrl && input === 'l') {
      setExpandLongMessages((current) => !current);
    }
  }, { isActive: !approval });

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

  const activeUser = getActiveUserProfile(runtime.session);

  return h(
    Box,
    { flexDirection: 'column', paddingX: 1, paddingY: 1 },
    h(WelcomeScreen, {
      provider: runtime.session.provider,
      model: runtime.session.model,
      columns: stdout?.columns ?? 80,
      activeUser,
    }),
    h(NoticePane, { warnings: runtime.session.startupWarnings }),
    approval
      ? h(ApprovalPane, {
          prompt: approval.prompt,
        })
      : null,
    h(MessagesPane, {
      messages: runtime.session.messages,
      expandLongMessages,
    }),
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
      expandLongMessages,
    }),
  );
}
