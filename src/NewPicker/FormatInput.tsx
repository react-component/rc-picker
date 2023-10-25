import * as React from 'react';

export interface FormatInputProps {
  format: string;
  value: string;
  onChange?: (value: string) => void;
}

export default function FormatInput(props: FormatInputProps) {
  const { value } = props;

  return <input />;
}
