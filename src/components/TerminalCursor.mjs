import React from 'react';

export function TerminalCursor({
  anchorRef,
  anchor,
  x = 0,
  y = 0,
}) {
  const normalizedAnchorReference = anchorRef ?? undefined;
  const normalizedAnchor =
    anchor ?? (normalizedAnchorReference ? 'textEnd' : 'flow');

  return React.createElement('ink-cursor', {
    internal_cursor: {
      anchorRef: normalizedAnchorReference,
      anchor: normalizedAnchor,
      x,
      y,
    },
  });
}
