import classNames from 'classnames';
import * as React from 'react';
import type { InternalMode, PickerRef, SelectorProps } from '../../../interface';
import { isSame } from '../../../utils/dateUtil';
import type { PickerProps } from '../../SinglePicker';
import PickerContext from '../../context';
import Icon, { ClearIcon } from '../Icon';
import Input, { type InputRef } from '../Input';
import useInputProps from '../hooks/useInputProps';
import useRootProps from '../hooks/useRootProps';
import MultipleDates from './MultipleDates';

export interface SingleSelectorProps<DateType extends object = any>
  extends SelectorProps<DateType>,
    Pick<PickerProps, 'multiple' | 'maxTagCount'> {
  id?: string;

  value?: DateType[];
  onChange: (date: DateType[]) => void;

  internalPicker: InternalMode;

  disabled: boolean;

  /** All the field show as `placeholder` */
  allHelp: boolean;

  placeholder?: string;

  // Invalid
  invalid: boolean;
  onInvalid: (valid: boolean) => void;

  removeIcon?: React.ReactNode;
}

function SingleSelector<DateType extends object = any>(
  props: SingleSelectorProps<DateType>,
  ref: React.Ref<PickerRef>,
) {
  const {
    id,

    open,

    prefix,
    clearIcon,
    suffixIcon,
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
    internalPicker,
    value,
    onChange,
    onSubmit,
    onInputChange,
    multiple,
    maxTagCount,

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

    // Native
    onMouseDown,

    // Input
    required,
    'aria-required': ariaRequired,
    autoFocus,
    tabIndex,

    removeIcon,

    ...restProps
  } = props;

  const rtl = direction === 'rtl';

  // ======================== Prefix ========================
  const { prefixCls } = React.useContext(PickerContext);

  // ========================= Refs =========================
  const rootRef = React.useRef<HTMLDivElement>();
  const inputRef = React.useRef<InputRef>();

  React.useImperativeHandle(ref, () => ({
    nativeElement: rootRef.current,
    focus: (options) => {
      inputRef.current?.focus(options);
    },
    blur: () => {
      inputRef.current?.blur();
    },
  }));

  // ======================== Props =========================
  const rootProps = useRootProps(restProps);

  // ======================== Change ========================
  const onSingleChange = (date: DateType) => {
    onChange([date]);
  };

  const onMultipleRemove = (date: DateType) => {
    const nextValues = value.filter(
      (oriDate) => oriDate && !isSame(generateConfig, locale, oriDate, date, internalPicker),
    );
    onChange(nextValues);

    // When `open`, it means user is operating the
    if (!open) {
      onSubmit();
    }
  };

  // ======================== Inputs ========================
  const [getInputProps, getText] = useInputProps<DateType>(
    {
      ...props,
      onChange: onSingleChange,
    },
    ({ valueTexts }) => ({
      value: valueTexts[0] || '',
      active: focused,
    }),
  );

  // ======================== Clear =========================
  const showClear = !!(clearIcon && value.length && !disabled);

  // ======================= Multiple =======================
  const clearIconNode = showClear && <ClearIcon icon={clearIcon} onClear={onClear} />;
  const selectorNode = multiple ? (
    <>
      <MultipleDates
        prefixCls={prefixCls}
        value={value}
        onRemove={onMultipleRemove}
        formatDate={getText}
        maxTagCount={maxTagCount}
        disabled={disabled}
        removeIcon={removeIcon}
        placeholder={placeholder}
      />
      <input
        className={`${prefixCls}-multiple-input`}
        value={value.map(getText).join(',')}
        ref={inputRef as any}
        readOnly
        autoFocus={autoFocus}
        tabIndex={tabIndex}
      />
      <Icon type="suffix" icon={suffixIcon} />
      {clearIconNode}
    </>
  ) : (
    <Input
      ref={inputRef}
      {...getInputProps()}
      autoFocus={autoFocus}
      tabIndex={tabIndex}
      suffixIcon={suffixIcon}
      clearIcon={clearIconNode}
      showActiveCls={false}
    />
  );

  // ======================== Render ========================
  return (
    <div
      {...rootProps}
      className={classNames(
        prefixCls,
        {
          [`${prefixCls}-multiple`]: multiple,
          [`${prefixCls}-focused`]: focused,
          [`${prefixCls}-disabled`]: disabled,
          [`${prefixCls}-invalid`]: invalid,
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
        if (target !== inputRef.current?.inputElement) {
          e.preventDefault();
        }

        onMouseDown?.(e);
      }}
    >
      {prefix && <div className={`${prefixCls}-prefix`}>{prefix}</div>}
      {selectorNode}
    </div>
  );
}

const RefSingleSelector = React.forwardRef(SingleSelector);

if (process.env.NODE_ENV !== 'production') {
  RefSingleSelector.displayName = 'SingleSelector';
}

export default RefSingleSelector;
