import * as React from 'react';
import type { PickerRef, SelectorRef } from '../../interface';

export function usePickerRef(ref: React.Ref<PickerRef>) {
  const selectorRef = React.useRef<SelectorRef>();

  React.useImperativeHandle(ref, () => ({
    nativeElement: selectorRef.current?.nativeElement,
    focus: (options) => {
      selectorRef.current?.focus(options);
    },
    blur: () => {
      selectorRef.current?.blur();
    },
  }));

  return selectorRef;
}
