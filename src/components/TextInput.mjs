import React from 'react';
import { Box, Text } from 'ink';
import { useTextInput } from '../hooks/useTextInput.mjs';

const h = React.createElement;

function Segment({ segment }) {
  return h(Text, segment.props, segment.text);
}

export function TextInput(props) {
  const { segments } = useTextInput(props);

  return h(
    Box,
    null,
    h(
      Text,
      null,
      ...segments.map((segment) => h(Segment, { key: segment.key, segment })),
    ),
  );
}
