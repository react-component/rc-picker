import { useMergedState } from 'rc-util';
import * as React from 'react';
import { PrefixClsContext } from './context';
import type { PickerRef, SelectorRef, SharedPickerProps } from './interface';
import SingleSelector from './Selector/SingleSelector';

export type SinglePickerProps = SharedPickerProps;

const SinglePicker = React.forwardRef<PickerRef, SinglePickerProps>((props, ref) => {
  const {
    prefixCls = 'rc-picker',

    // Selector
    className,
    style,
    suffixIcon,

    // Focus
    onFocus,
    onBlur,

    // Open
    defaultOpen,
    open,
    onOpenChange,
  } = props;

  // ============================ Active ============================
  const [focused, setFocused] = React.useState(false);

  const onInternalFocus: React.FocusEventHandler<HTMLInputElement> = (event) => {
    onFocus?.(event);
    setFocused(true);
  };

  const onInternalBlur: React.FocusEventHandler<HTMLInputElement> = (event) => {
    onBlur?.(event);
    setFocused(false);
  };

  // ============================= Open =============================
  const [mergedOpen, setMergeOpen] = useMergedState(defaultOpen, {
    value: open,
    onChange: onOpenChange,
  });

  // ============================= Refs =============================
  const selectorRef = React.useRef<SelectorRef>();

  React.useImperativeHandle(ref, () => ({
    nativeElement: selectorRef.current?.nativeElement,
    focus: selectorRef.current?.focus,
    blur: selectorRef.current?.blur,
  }));

  // ============================ Render ============================
  return (
    <PrefixClsContext.Provider value={prefixCls}>
      <SingleSelector
        ref={selectorRef}
        className={className}
        style={style}
        suffixIcon={suffixIcon}
        // Focus
        focused={focused}
        onFocus={onInternalFocus}
        onBlur={onInternalBlur}
      />
    </PrefixClsContext.Provider>
  );
});

if (process.env.NODE_ENV !== 'production') {
  SinglePicker.displayName = 'SinglePicker';
}

export default SinglePicker;
