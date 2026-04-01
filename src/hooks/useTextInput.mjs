import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useInput } from 'ink';

function toChars(value) {
  return Array.from(value ?? '');
}

function clampOffset(chars, offset) {
  return Math.max(0, Math.min(offset, chars.length));
}

function replaceAt(chars, start, deleteCount, insertion = '') {
  const next = chars.slice();
  next.splice(start, deleteCount, ...toChars(insertion));
  return next;
}

function buildSegments({ chars, offset, focus, showCursor, placeholder, cursorColor }) {
  const hasValue = chars.length > 0;
  const segments = [];

  if (!hasValue && !placeholder && !(focus && showCursor)) {
    return segments;
  }

  if (!hasValue) {
    if (focus && showCursor) {
      segments.push({
        key: 'cursor',
        text: ' ',
        props: {
          backgroundColor: cursorColor,
          color: 'black',
        },
      });
    }

    if (placeholder) {
      segments.push({
        key: 'placeholder',
        text: placeholder,
        props: {
          dimColor: true,
        },
      });
    }

    return segments;
  }

  const before = chars.slice(0, offset).join('');
  const current = chars[offset] ?? ' ';
  const after = chars.slice(offset + (offset < chars.length ? 1 : 0)).join('');

  if (before) {
    segments.push({
      key: 'before',
      text: before,
      props: {},
    });
  }

  if (focus && showCursor) {
    segments.push({
      key: 'cursor',
      text: current,
      props: {
        backgroundColor: cursorColor,
        color: 'black',
      },
    });
  } else if (offset < chars.length) {
    segments.push({
      key: 'current',
      text: current,
      props: {},
    });
  }

  if (after) {
    segments.push({
      key: 'after',
      text: after,
      props: {},
    });
  }

  return segments;
}

export function useTextInput({
  value,
  onChange,
  onSubmit,
  onExit,
  focus = true,
  cursorOffset,
  onCursorOffsetChange,
  placeholder = '',
  showCursor = true,
  cursorColor = '#e87722',
  onExitMessage,
}) {
  const chars = useMemo(() => toChars(value), [value]);
  const offset = clampOffset(chars, cursorOffset ?? chars.length);
  const exitArmedUntilRef = useRef(0);

  useEffect(() => {
    if (cursorOffset !== undefined && cursorOffset !== offset) {
      onCursorOffsetChange?.(offset);
    }
  }, [cursorOffset, offset, onCursorOffsetChange]);

  const applyTextChange = useCallback((nextChars, nextOffset) => {
    onChange(nextChars.join(''));
    onCursorOffsetChange?.(nextOffset);
  }, [onChange, onCursorOffsetChange]);

  const handleInput = useCallback((input, key) => {
    const isCtrlC = input === '\u0003' || (key.ctrl && input === 'c');

    if (isCtrlC) {
      const now = Date.now();
      if (now < exitArmedUntilRef.current) {
        exitArmedUntilRef.current = 0;
        onExitMessage?.('');
        onExit?.();
        return;
      }

      exitArmedUntilRef.current = now + 1000;
      onExitMessage?.('Press Ctrl+C again to exit');
      return;
    }

    if (key.ctrl && input === 'a') {
      onCursorOffsetChange?.(0);
      return;
    }

    if (key.ctrl && input === 'e') {
      onCursorOffsetChange?.(chars.length);
      return;
    }

    if (key.ctrl && input === 'u') {
      applyTextChange(chars.slice(offset), 0);
      return;
    }

    if (key.ctrl && input === 'd') {
      if (chars.length === 0) {
        onExit?.();
        return;
      }

      if (offset < chars.length) {
        applyTextChange(replaceAt(chars, offset, 1), offset);
      }
      return;
    }

    if (key.leftArrow) {
      onCursorOffsetChange?.(Math.max(0, offset - 1));
      return;
    }

    if (key.rightArrow) {
      onCursorOffsetChange?.(Math.min(chars.length, offset + 1));
      return;
    }

    if (key.home) {
      onCursorOffsetChange?.(0);
      return;
    }

    if (key.end) {
      onCursorOffsetChange?.(chars.length);
      return;
    }

    if (key.backspace) {
      if (offset === 0) {
        return;
      }

      applyTextChange(replaceAt(chars, offset - 1, 1), offset - 1);
      return;
    }

    if (key.delete) {
      if (offset >= chars.length) {
        if (offset === 0) {
          return;
        }

        applyTextChange(replaceAt(chars, offset - 1, 1), offset - 1);
        return;
      }

      applyTextChange(replaceAt(chars, offset, 1), offset);
      return;
    }

    const normalizedInput = String(input ?? '').replace(/\r/g, '\n');
    const newlineIndex = normalizedInput.indexOf('\n');
    const hasNewline = newlineIndex !== -1;
    const text = hasNewline
      ? normalizedInput.slice(0, newlineIndex)
      : normalizedInput;

    let nextChars = chars;
    let nextOffset = offset;

    if (text && !key.ctrl && !key.meta) {
      nextChars = replaceAt(chars, offset, 0, text);
      nextOffset = offset + toChars(text).length;
      applyTextChange(nextChars, nextOffset);
    }

    if (key.return || hasNewline) {
      onSubmit?.(nextChars.join(''));

      const remainder = hasNewline
        ? normalizedInput.slice(newlineIndex + 1).replace(/\n/g, '')
        : '';

      if (remainder) {
        const remainderChars = toChars(remainder);
        onChange(remainderChars.join(''));
        onCursorOffsetChange?.(remainderChars.length);
      }
    }
  }, [
    applyTextChange,
    chars,
    offset,
    onChange,
    onCursorOffsetChange,
    onExit,
    onExitMessage,
    onSubmit,
  ]);

  useInput(handleInput, { isActive: focus });

  const segments = useMemo(() => buildSegments({
    chars,
    offset,
    focus,
    showCursor,
    placeholder,
    cursorColor,
  }), [chars, cursorColor, focus, offset, placeholder, showCursor]);

  return {
    cursorOffset: offset,
    segments,
  };
}
