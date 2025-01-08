import classNames from 'classnames';
import ResizeObserver from 'rc-resize-observer';
import { useEvent } from 'rc-util';
import * as React from 'react';
import type { RangePickerRef, SelectorProps } from '../../interface';
import PickerContext from '../context';
import useInputProps from './hooks/useInputProps';
import useRootProps from './hooks/useRootProps';
import Icon, { ClearIcon } from './Icon';
import Input, { type InputRef } from './Input';
import { getoffsetUnit, getRealPlacement } from '../../utils/uiUtil';
import { getWin } from './util';

export type SelectorIdType =
  | string
  | {
      start?: string;
      end?: string;
    };

export interface RangeSelectorProps<DateType = any> extends SelectorProps<DateType> {
  id?: SelectorIdType;

  activeIndex: number | null;

  separator?: React.ReactNode;

  value?: [DateType?, DateType?];
  onChange: (date: DateType, index?: number) => void;

  disabled: [boolean, boolean];

  /** All the field show as `placeholder` */
  allHelp: boolean;

  placeholder?: string | [string, string];

  // Invalid
  invalid: [boolean, boolean];
  placement?: string;
  // Offset
  /**
   * Trigger when the active bar offset position changed.
   * This is used for popup panel offset.
   */
  onActiveOffset: (offset: number) => void;
}

function RangeSelector<DateType extends object = any>(
  props: RangeSelectorProps<DateType>,
  ref: React.Ref<RangePickerRef>,
) {
  const {
    id,

    prefix,
    clearIcon,
    suffixIcon,
    separator = '~',
    activeIndex,
    activeHelp,
    allHelp,

    focused,
    onFocus,
    onBlur,
    onKeyDown,
    locale,
    generateConfig,

    // Placeholder
    placeholder,

    // Style
    className,
    style,

    // Click
    onClick,
    onClear,

    // Change
    value,
    onChange,
    onSubmit,
    onInputChange,

    // Valid
    format,
    maskFormat,
    preserveInvalidOnBlur,
    onInvalid,

    // Disabled
    disabled,
    invalid,
    inputReadOnly,

    // Direction
    direction,

    // Open
    onOpenChange,

    // Offset
    onActiveOffset,
    placement,

    // Native
    onMouseDown,

    // Input
    required,
    'aria-required': ariaRequired,
    autoFocus,
    tabIndex,

    ...restProps
  } = props;

  const rtl = direction === 'rtl';

  // ======================== Prefix ========================
  const { prefixCls, alignedPlacement } = React.useContext(PickerContext);

  // ========================== Id ==========================
  const ids = React.useMemo(() => {
    if (typeof id === 'string') {
      return [id];
    }

    const mergedId = id || {};

    return [mergedId.start, mergedId.end];
  }, [id]);

  // ========================= Refs =========================
  const rootRef = React.useRef<HTMLDivElement>();
  const inputStartRef = React.useRef<InputRef>();
  const inputEndRef = React.useRef<InputRef>();

  const getInput = (index: number) => [inputStartRef, inputEndRef][index]?.current;

  React.useImperativeHandle(ref, () => ({
    nativeElement: rootRef.current,
    focus: (options) => {
      if (typeof options === 'object') {
        const { index = 0, ...rest } = options || {};
        getInput(index)?.focus(rest);
      } else {
        getInput(options ?? 0)?.focus();
      }
    },
    blur: () => {
      getInput(0)?.blur();
      getInput(1)?.blur();
    },
  }));

  // ======================== Props =========================
  const rootProps = useRootProps(restProps);

  // ===================== Placeholder ======================
  const mergedPlaceholder = React.useMemo<[string, string]>(
    () => (Array.isArray(placeholder) ? placeholder : [placeholder, placeholder]),
    [placeholder],
  );

  // ======================== Inputs ========================
  const [getInputProps] = useInputProps({
    ...props,
    id: ids,
    placeholder: mergedPlaceholder,
  });

  // ====================== ActiveBar =======================
  const realPlacement = getRealPlacement(alignedPlacement || placement, rtl);
  const offsetUnit = getoffsetUnit(realPlacement, rtl);
  const placementRight = realPlacement?.toLowerCase().endsWith('right');
  const [activeBarStyle, setActiveBarStyle] = React.useState<React.CSSProperties>({
    position: 'absolute',
    width: 0,
  });

  const syncActiveOffset = useEvent(() => {
    const input = getInput(activeIndex);
    if (input) {
      const { offsetParent } = input.nativeElement;
      // offsetLeft is an integer, which will cause incorrect reulst.
      const { x = 0, width: inputWidth = 0 } = input.nativeElement.getBoundingClientRect() || {};
      const { x: pX = 0, width: parentWidth = 0 } = offsetParent?.getBoundingClientRect() || {};
      const parentStyles =
        offsetParent && getWin(offsetParent as HTMLElement).getComputedStyle(offsetParent);
      const parentBorderRightWidth = Number(
        (placementRight ? parentStyles?.borderRightWidth : parentStyles?.borderLeftWidth)?.replace(
          'px',
          '',
        ) || 0,
      );
      const offsetLeft = x - pX;

      const activeOffset = placementRight ? parentWidth - inputWidth - offsetLeft : offsetLeft;
      setActiveBarStyle(({ insetInlineStart, insetInlineEnd, ...rest }) => ({
        ...rest,
        width: inputWidth,
        // parent will have border while focus, so need to  cut `parentBorderWidth` on opposite side.
        [offsetUnit]: activeOffset - parentBorderRightWidth,
      }));
      onActiveOffset(activeOffset);
    }
  });

  React.useEffect(() => {
    syncActiveOffset();
  }, [activeIndex, alignedPlacement]);

  // ======================== Clear =========================
  const showClear = clearIcon && ((value[0] && !disabled[0]) || (value[1] && !disabled[1]));

  // ======================= Disabled =======================
  const startAutoFocus = autoFocus && !disabled[0];
  const endAutoFocus = autoFocus && !startAutoFocus && !disabled[1];

  // ======================== Render ========================
  return (
    <ResizeObserver onResize={syncActiveOffset}>
      <div
        {...rootProps}
        className={classNames(
          prefixCls,
          `${prefixCls}-range`,
          {
            [`${prefixCls}-focused`]: focused,
            [`${prefixCls}-disabled`]: disabled.every((i) => i),
            [`${prefixCls}-invalid`]: invalid.some((i) => i),
            [`${prefixCls}-rtl`]: rtl,
          },
          className,
        )}
        style={style}
        ref={rootRef}
        onClick={onClick}
        // Not lose current input focus
        onMouseDown={(e) => {
          const { target } = e;
          if (
            target !== inputStartRef.current.inputElement &&
            target !== inputEndRef.current.inputElement
          ) {
            e.preventDefault();
          }

          onMouseDown?.(e);
        }}
      >
        {prefix && <div className={`${prefixCls}-prefix`}>{prefix}</div>}
        <Input
          ref={inputStartRef}
          {...getInputProps(0)}
          autoFocus={startAutoFocus}
          tabIndex={tabIndex}
          date-range="start"
        />
        <div className={`${prefixCls}-range-separator`}>{separator}</div>
        <Input
          ref={inputEndRef}
          {...getInputProps(1)}
          autoFocus={endAutoFocus}
          tabIndex={tabIndex}
          date-range="end"
        />
        <div className={`${prefixCls}-active-bar`} style={activeBarStyle} />
        <Icon type="suffix" icon={suffixIcon} />
        {showClear && <ClearIcon icon={clearIcon} onClear={onClear} />}
      </div>
    </ResizeObserver>
  );
}

const RefRangeSelector = React.forwardRef(RangeSelector);

if (process.env.NODE_ENV !== 'production') {
  RefRangeSelector.displayName = 'RangeSelector';
}

export default RefRangeSelector;
