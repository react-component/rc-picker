import { useEvent, useMergedState } from 'rc-util';
import useLayoutEffect from 'rc-util/lib/hooks/useLayoutEffect';
import omit from 'rc-util/lib/omit';
import pickAttrs from 'rc-util/lib/pickAttrs';
import warning from 'rc-util/lib/warning';
import * as React from 'react';
import type {
  BaseInfo,
  InternalMode,
  OnOpenChange,
  OpenConfig,
  PanelMode,
  RangePickerRef,
  RangeTimeProps,
  SelectorProps,
  SharedHTMLAttrs,
  SharedPickerProps,
  ValueDate,
} from '../interface';
import type { PickerPanelProps } from '../PickerPanel';
import PickerTrigger from '../PickerTrigger';
import { pickTriggerProps } from '../PickerTrigger/util';
import { fillIndex, getFromDate, toArray } from '../utils/miscUtil';
import PickerContext from './context';
import useCellRender from './hooks/useCellRender';
import useFieldsInvalidate from './hooks/useFieldsInvalidate';
import useFilledProps from './hooks/useFilledProps';
import useOpen from './hooks/useOpen';
import usePickerRef from './hooks/usePickerRef';
import usePresets from './hooks/usePresets';
import useRangeActive from './hooks/useRangeActive';
import useRangeDisabledDate from './hooks/useRangeDisabledDate';
import useRangePickerValue from './hooks/useRangePickerValue';
import useRangeValue, { useInnerValue } from './hooks/useRangeValue';
import useShowNow from './hooks/useShowNow';
import Popup, { type PopupShowTimeConfig } from './Popup';
import RangeSelector, { type SelectorIdType } from './Selector/RangeSelector';

function separateConfig<T>(config: T | [T, T] | null | undefined, defaultConfig: T): [T, T] {
  const singleConfig = config ?? defaultConfig;

  if (Array.isArray(singleConfig)) {
    return singleConfig;
  }

  return [singleConfig, singleConfig];
}

export type RangeValueType<DateType> = [
  start: DateType | null | undefined,
  end: DateType | null | undefined,
];

/** Used for change event, it should always be not undefined */
export type NoUndefinedRangeValueType<DateType> = [start: DateType | null, end: DateType | null];

export interface BaseRangePickerProps<DateType extends object>
  extends Omit<SharedPickerProps<DateType>, 'showTime' | 'id'> {
  // Structure
  id?: SelectorIdType;

  separator?: React.ReactNode;

  // Value
  value?: RangeValueType<DateType> | null;
  defaultValue?: RangeValueType<DateType>;
  onChange?: (
    dates: NoUndefinedRangeValueType<DateType> | null,
    dateStrings: [string, string],
  ) => void;
  onCalendarChange?: (
    dates: NoUndefinedRangeValueType<DateType>,
    dateStrings: [string, string],
    info: BaseInfo,
  ) => void;
  onOk?: (values: NoUndefinedRangeValueType<DateType>) => void;

  // Placeholder
  placeholder?: [string, string];

  // Picker Value
  /**
   * Config the popup panel date.
   * Every time active the input to open popup will reset with `defaultPickerValue`.
   *
   * Note: `defaultPickerValue` priority is higher than `value` for the first open.
   */
  defaultPickerValue?: [DateType, DateType] | DateType | null;
  /**
   * Config each start & end field popup panel date.
   * When config `pickerValue`, you must also provide `onPickerValueChange` to handle changes.
   */
  pickerValue?: [DateType, DateType] | DateType | null;
  /**
   * Each popup panel `pickerValue` includes `mode` change will trigger the callback.
   * @param date The changed picker value
   * @param info.source `panel` from the panel click. `reset` from popup open or field typing
   * @param info.mode Next `mode` panel
   */
  onPickerValueChange?: (
    date: [DateType, DateType],
    info: BaseInfo & {
      source: 'reset' | 'panel';
      mode: [PanelMode, PanelMode];
    },
  ) => void;

  // Preset
  presets?: ValueDate<Exclude<RangeValueType<DateType>, null>>[];
  /** @deprecated Please use `presets` instead */
  ranges?: Record<
    string,
    Exclude<RangeValueType<DateType>, null> | (() => Exclude<RangeValueType<DateType>, null>)
  >;

  // Control
  disabled?: boolean | [boolean, boolean];
  allowEmpty?: boolean | [boolean, boolean];

  // Time
  showTime?: boolean | RangeTimeProps<DateType>;

  // Mode
  mode?: [startMode: PanelMode, endMode: PanelMode];
  /** Trigger on each `mode` or `pickerValue` changed. */
  onPanelChange?: (
    values: NoUndefinedRangeValueType<DateType>,
    modes: [startMode: PanelMode, endMode: PanelMode],
  ) => void;
}

export interface RangePickerProps<DateType extends object>
  extends BaseRangePickerProps<DateType>,
    Omit<RangeTimeProps<DateType>, 'format' | 'defaultValue' | 'defaultOpenValue'> {}

function getActiveRange(activeIndex: number) {
  return activeIndex === 1 ? 'end' : 'start';
}

function RangePicker<DateType extends object = any>(
  props: RangePickerProps<DateType>,
  ref: React.Ref<RangePickerRef>,
) {
  // ========================= Prop =========================
  const [filledProps, internalPicker, complexPicker, formatList, maskFormat, isInvalidateDate] =
    useFilledProps(props, () => {
      const { disabled, allowEmpty } = props;

      const mergedDisabled = separateConfig(disabled, false);
      const mergedAllowEmpty = separateConfig(allowEmpty, false);

      return {
        disabled: mergedDisabled,
        allowEmpty: mergedAllowEmpty,
      };
    });

  const {
    // Style
    prefixCls,
    styles,
    classNames,
    placement,

    // Value
    defaultValue,
    value,
    needConfirm,
    onKeyDown,

    // Disabled
    disabled,
    allowEmpty,
    disabledDate,
    minDate,
    maxDate,

    // Open
    defaultOpen,
    open,
    onOpenChange,

    // Picker
    locale,
    generateConfig,
    picker,
    showNow,
    showToday,
    showTime,

    // Mode
    mode,
    onPanelChange,
    onCalendarChange,
    onOk,

    // Picker Value
    defaultPickerValue,
    pickerValue,
    onPickerValueChange,

    // Format
    inputReadOnly,

    suffixIcon,

    // Focus
    onFocus,
    onBlur,

    // Presets
    presets,
    ranges,

    // Render
    components,
    cellRender,
    dateRender,
    monthCellRender,

    // Native
    onClick,
  } = filledProps;

  // ========================= Refs =========================
  const selectorRef = usePickerRef(ref);

  // ========================= Open =========================
  const [mergedOpen, setMergeOpen] = useOpen(open, defaultOpen, disabled, onOpenChange);

  const triggerOpen: OnOpenChange = (nextOpen, config?: OpenConfig) => {
    // No need to open if all disabled
    if (disabled.some((fieldDisabled) => !fieldDisabled) || !nextOpen) {
      setMergeOpen(nextOpen, config);
    }
  };

  // ======================== Values ========================
  const [mergedValue, setInnerValue, getCalendarValue, triggerCalendarChange, triggerOk] =
    useInnerValue(
      generateConfig,
      locale,
      formatList,
      true,
      false,
      defaultValue,
      value,
      onCalendarChange,
      onOk,
    );

  const calendarValue = getCalendarValue();

  // ======================== Active ========================
  const [
    focused,
    triggerFocus,
    lastOperation,
    activeIndex,
    setActiveIndex,
    nextActiveIndex,
    activeIndexList,
    updateSubmitIndex,
    hasActiveSubmitValue,
  ] = useRangeActive(disabled, allowEmpty, mergedOpen);

  const onSharedFocus = (event: React.FocusEvent<HTMLElement>, index?: number) => {
    triggerFocus(true);

    onFocus?.(event, {
      range: getActiveRange(index ?? activeIndex),
    });
  };

  const onSharedBlur = (event: React.FocusEvent<HTMLElement>, index?: number) => {
    triggerFocus(false);

    onBlur?.(event, {
      range: getActiveRange(index ?? activeIndex),
    });
  };

  // ======================= ShowTime =======================
  /** Used for Popup panel */
  const mergedShowTime = React.useMemo<
    PopupShowTimeConfig<DateType> & Pick<RangeTimeProps<DateType>, 'defaultOpenValue'>
  >(() => {
    if (!showTime) {
      return null;
    }

    const { disabledTime } = showTime;

    const proxyDisabledTime = disabledTime
      ? (date: DateType) => {
          const range = getActiveRange(activeIndex);
          const fromDate = getFromDate(calendarValue, activeIndexList, activeIndex);
          return disabledTime(date, range, {
            from: fromDate,
          });
        }
      : undefined;

    return { ...showTime, disabledTime: proxyDisabledTime };
  }, [showTime, activeIndex, calendarValue, activeIndexList]);

  // ========================= Mode =========================
  const [modes, setModes] = useMergedState<[PanelMode, PanelMode]>([picker, picker], {
    value: mode,
  });

  const mergedMode = modes[activeIndex] || picker;

  /** Extends from `mergedMode` to patch `datetime` mode */
  const internalMode: InternalMode =
    mergedMode === 'date' && mergedShowTime ? 'datetime' : mergedMode;

  // ====================== PanelCount ======================
  const multiplePanel = internalMode === picker && internalMode !== 'time';

  // ======================= Show Now =======================
  const mergedShowNow = useShowNow(picker, mergedMode, showNow, showToday, true);

  // ======================== Value =========================
  const [
    /** Trigger `onChange` by check `disabledDate` */
    flushSubmit,
    /** Trigger `onChange` directly without check `disabledDate` */
    triggerSubmitChange,
  ] = useRangeValue<RangeValueType<DateType>, DateType>(
    filledProps,
    mergedValue,
    setInnerValue,
    getCalendarValue,
    triggerCalendarChange,
    disabled,
    formatList,
    focused,
    mergedOpen,
    isInvalidateDate,
  );

  // ===================== DisabledDate =====================
  const mergedDisabledDate = useRangeDisabledDate(
    calendarValue,
    disabled,
    activeIndexList,
    generateConfig,
    locale,
    disabledDate,
  );

  // ======================= Validate =======================
  const [submitInvalidates, onSelectorInvalid] = useFieldsInvalidate(
    calendarValue,
    isInvalidateDate,
    allowEmpty,
  );

  // ===================== Picker Value =====================
  const [currentPickerValue, setCurrentPickerValue] = useRangePickerValue(
    generateConfig,
    locale,
    calendarValue,
    modes,
    mergedOpen,
    activeIndex,
    internalPicker,
    multiplePanel,
    defaultPickerValue,
    pickerValue,
    mergedShowTime?.defaultOpenValue,
    onPickerValueChange,
    minDate,
    maxDate,
  );

  // >>> Mode need wait for `pickerValue`
  const triggerModeChange = useEvent(
    (nextPickerValue: DateType, nextMode: PanelMode, triggerEvent?: boolean) => {
      const clone = fillIndex(modes, activeIndex, nextMode);

      if (clone[0] !== modes[0] || clone[1] !== modes[1]) {
        setModes(clone);
      }

      // Compatible with `onPanelChange`
      if (onPanelChange && triggerEvent !== false) {
        const clonePickerValue: RangeValueType<DateType> = [...calendarValue];
        if (nextPickerValue) {
          clonePickerValue[activeIndex] = nextPickerValue;
        }
        onPanelChange(clonePickerValue, clone);
      }
    },
  );

  // ======================== Change ========================
  const fillCalendarValue = (date: DateType, index: number) =>
    // Trigger change only when date changed
    fillIndex(calendarValue, index, date);

  // ======================== Submit ========================
  /**
   * Trigger by confirm operation.
   * This function has already handle the `needConfirm` check logic.
   * - Selector: enter key
   * - Panel: OK button
   */
  const triggerPartConfirm = (date?: DateType, skipFocus?: boolean) => {
    let nextValue = calendarValue;

    if (date) {
      nextValue = fillCalendarValue(date, activeIndex);
    }
    updateSubmitIndex(activeIndex);
    // Get next focus index
    const nextIndex = nextActiveIndex(nextValue);

    // Change calendar value and tell flush it
    triggerCalendarChange(nextValue);
    flushSubmit(activeIndex, nextIndex === null);

    if (nextIndex === null) {
      triggerOpen(false, { force: true });
    } else if (!skipFocus) {
      selectorRef.current.focus({ index: nextIndex });
    }
  };

  // ======================== Click =========================
  const onSelectorClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    const rootNode = (event.target as HTMLElement).getRootNode();
    if (
      !selectorRef.current.nativeElement.contains(
        (rootNode as Document | ShadowRoot).activeElement ?? document.activeElement,
      )
    ) {
      // Click to focus the enabled input
      const enabledIndex = disabled.findIndex((d) => !d);
      if (enabledIndex >= 0) {
        selectorRef.current.focus({ index: enabledIndex });
      }
    }

    triggerOpen(true);

    onClick?.(event);
  };

  const onSelectorClear = () => {
    triggerSubmitChange(null);
    triggerOpen(false, { force: true });
  };

  // ======================== Hover =========================
  const [hoverSource, setHoverSource] = React.useState<'cell' | 'preset'>(null);
  const [internalHoverValues, setInternalHoverValues] =
    React.useState<RangeValueType<DateType>>(null);

  const hoverValues = React.useMemo(() => {
    return internalHoverValues || calendarValue;
  }, [calendarValue, internalHoverValues]);

  // Clean up `internalHoverValues` when closed
  React.useEffect(() => {
    if (!mergedOpen) {
      setInternalHoverValues(null);
    }
  }, [mergedOpen]);

  // ========================================================
  // ==                       Panels                       ==
  // ========================================================
  // Save the offset with active bar position
  const [activeOffset, setActiveOffset] = React.useState(0);

  // ======================= Presets ========================
  const presetList = usePresets(presets, ranges);

  const onPresetHover = (nextValues: RangeValueType<DateType> | null) => {
    setInternalHoverValues(nextValues);
    setHoverSource('preset');
  };

  const onPresetSubmit = (nextValues: RangeValueType<DateType>) => {
    const passed = triggerSubmitChange(nextValues);

    if (passed) {
      triggerOpen(false, { force: true });
    }
  };

  const onNow = (now: DateType) => {
    triggerPartConfirm(now);
  };

  // ======================== Panel =========================
  const onPanelHover = (date: DateType) => {
    setInternalHoverValues(date ? fillCalendarValue(date, activeIndex) : null);
    setHoverSource('cell');
  };

  // >>> Focus
  const onPanelFocus: React.FocusEventHandler<HTMLElement> = (event) => {
    triggerOpen(true);
    onSharedFocus(event);
  };

  // >>> MouseDown
  const onPanelMouseDown: React.MouseEventHandler<HTMLDivElement> = () => {
    lastOperation('panel');
  };

  // >>> Calendar
  const onPanelSelect: PickerPanelProps<DateType>['onChange'] = (date: DateType) => {
    const clone: RangeValueType<DateType> = fillIndex(calendarValue, activeIndex, date);

    // Only trigger calendar event but not update internal `calendarValue` state
    triggerCalendarChange(clone);

    // >>> Trigger next active if !needConfirm
    // Fully logic check `useRangeValue` hook
    if (!needConfirm && !complexPicker && internalPicker === internalMode) {
      triggerPartConfirm(date);
    }
  };

  // >>> Close
  const onPopupClose = () => {
    // Close popup
    triggerOpen(false);
  };

  // >>> cellRender
  const onInternalCellRender = useCellRender(
    cellRender,
    dateRender,
    monthCellRender,
    getActiveRange(activeIndex),
  );

  // >>> Value
  const panelValue = calendarValue[activeIndex] || null;

  // >>> invalid
  const isPopupInvalidateDate = useEvent((date: DateType) => {
    return isInvalidateDate(date, {
      activeIndex,
    });
  });

  const panelProps = React.useMemo(() => {
    const domProps = pickAttrs(filledProps, false);
    const restProps = omit(filledProps, [
      ...(Object.keys(domProps) as (keyof SharedHTMLAttrs)[]),
      'onChange',
      'onCalendarChange',
      'style',
      'className',
      'onPanelChange',
      'disabledTime',
    ]);
    return restProps;
  }, [filledProps]);

  // >>> Render
  const panel = (
    <Popup<any>
      // MISC
      {...panelProps}
      showNow={mergedShowNow}
      showTime={mergedShowTime}
      // Range
      range
      multiplePanel={multiplePanel}
      activeOffset={activeOffset}
      placement={placement}
      // Disabled
      disabledDate={mergedDisabledDate}
      // Focus
      onFocus={onPanelFocus}
      onBlur={onSharedBlur}
      onPanelMouseDown={onPanelMouseDown}
      // Mode
      picker={picker}
      mode={mergedMode}
      internalMode={internalMode}
      onPanelChange={triggerModeChange}
      // Value
      format={maskFormat}
      value={panelValue}
      isInvalid={isPopupInvalidateDate}
      onChange={null}
      onSelect={onPanelSelect}
      // PickerValue
      pickerValue={currentPickerValue}
      defaultOpenValue={toArray(showTime?.defaultOpenValue)[activeIndex]}
      onPickerValueChange={setCurrentPickerValue}
      // Hover
      hoverValue={hoverValues}
      onHover={onPanelHover}
      // Submit
      needConfirm={needConfirm}
      onSubmit={triggerPartConfirm}
      onOk={triggerOk}
      // Preset
      presets={presetList}
      onPresetHover={onPresetHover}
      onPresetSubmit={onPresetSubmit}
      // Now
      onNow={onNow}
      // Render
      cellRender={onInternalCellRender}
    />
  );

  // ========================================================
  // ==                      Selector                      ==
  // ========================================================

  // ======================== Change ========================
  const onSelectorChange = (date: DateType, index: number) => {
    const clone = fillCalendarValue(date, index);

    triggerCalendarChange(clone);
  };

  const onSelectorInputChange = () => {
    lastOperation('input');
  };

  // ======================= Selector =======================
  const onSelectorFocus: SelectorProps['onFocus'] = (event, index) => {
    // Check if `needConfirm` but user not submit yet
    const activeListLen = activeIndexList.length;
    const lastActiveIndex = activeIndexList[activeListLen - 1];
    if (
      activeListLen &&
      lastActiveIndex !== index &&
      needConfirm &&
      // Not change index if is not filled
      !allowEmpty[lastActiveIndex] &&
      !hasActiveSubmitValue(lastActiveIndex) &&
      calendarValue[lastActiveIndex]
    ) {
      selectorRef.current.focus({ index: lastActiveIndex });
      return;
    }

    lastOperation('input');

    triggerOpen(true, {
      inherit: true,
    });

    // When click input to switch the field, it will not trigger close.
    // Which means it will lose the part confirm and we need fill back.
    // ref: https://github.com/ant-design/ant-design/issues/49512
    if (activeIndex !== index && mergedOpen && !needConfirm && complexPicker) {
      triggerPartConfirm(null, true);
    }

    setActiveIndex(index);

    onSharedFocus(event, index);
  };

  const onSelectorBlur: SelectorProps['onBlur'] = (event, index) => {
    triggerOpen(false);
    if (!needConfirm && lastOperation() === 'input') {
      const nextIndex = nextActiveIndex(calendarValue);
      flushSubmit(activeIndex, nextIndex === null);
    }

    onSharedBlur(event, index);
  };

  const onSelectorKeyDown: SelectorProps['onKeyDown'] = (event, preventDefault) => {
    if (event.key === 'Tab') {
      triggerPartConfirm(null, true);
    }

    onKeyDown?.(event, preventDefault);
  };

  // =======================  popup align =======================
  const [alignedPlacement, setAlignedPlacement] = React.useState<string>();

  // ======================= Context ========================
  const context = React.useMemo(
    () => ({
      prefixCls,
      locale,
      generateConfig,
      button: components.button,
      input: components.input,
      alignedPlacement,
      setAlignedPlacement,
    }),
    [
      prefixCls,
      locale,
      generateConfig,
      components.button,
      components.input,
      alignedPlacement,
      setAlignedPlacement,
    ],
  );

  // ======================== Effect ========================
  // >>> Mode
  // Reset for every active
  useLayoutEffect(() => {
    if (mergedOpen && activeIndex !== undefined) {
      // Legacy compatible. This effect update should not trigger `onPanelChange`
      triggerModeChange(null, picker, false);
    }
  }, [mergedOpen, activeIndex, picker]);

  // >>> For complex picker, we need check if need to focus next one
  useLayoutEffect(() => {
    const lastOp = lastOperation();

    // Trade as confirm on field leave
    if (!mergedOpen && lastOp === 'input') {
      triggerOpen(false);
      triggerPartConfirm(null, true);
    }

    // Submit with complex picker
    if (!mergedOpen && complexPicker && !needConfirm && lastOp === 'panel') {
      triggerOpen(true);
      triggerPartConfirm();
    }
  }, [mergedOpen]);

  // ====================== DevWarning ======================
  if (process.env.NODE_ENV !== 'production') {
    const isIndexEmpty = (index: number) => {
      return (
        // Value is empty
        !value?.[index] &&
        // DefaultValue is empty
        !defaultValue?.[index]
      );
    };

    if (
      disabled.some(
        (fieldDisabled, index) => fieldDisabled && isIndexEmpty(index) && !allowEmpty[index],
      )
    ) {
      warning(
        false,
        '`disabled` should not set with empty `value`. You should set `allowEmpty` or `value` instead.',
      );
    }
  }

  // ======================== Render ========================
  return (
    <PickerContext.Provider value={context}>
      <PickerTrigger
        {...pickTriggerProps(filledProps)}
        popupElement={panel}
        popupStyle={styles.popup}
        popupClassName={classNames.popup}
        // Visible
        visible={mergedOpen}
        onClose={onPopupClose}
        alignedPlacement={alignedPlacement}
        // Range
        range
      >
        <RangeSelector
          // Shared
          {...filledProps}
          // Ref
          ref={selectorRef}
          // Icon
          suffixIcon={suffixIcon}
          // Active
          activeIndex={focused || mergedOpen ? activeIndex : null}
          activeHelp={!!internalHoverValues}
          allHelp={!!internalHoverValues && hoverSource === 'preset'}
          focused={focused}
          onFocus={onSelectorFocus}
          onBlur={onSelectorBlur}
          onKeyDown={onSelectorKeyDown}
          onSubmit={triggerPartConfirm}
          // Change
          value={hoverValues}
          maskFormat={maskFormat}
          onChange={onSelectorChange}
          onInputChange={onSelectorInputChange}
          // Format
          format={formatList}
          inputReadOnly={inputReadOnly}
          // Disabled
          disabled={disabled}
          // Open
          open={mergedOpen}
          onOpenChange={triggerOpen}
          // Click
          onClick={onSelectorClick}
          onClear={onSelectorClear}
          // Invalid
          invalid={submitInvalidates}
          onInvalid={onSelectorInvalid}
          // Offset
          onActiveOffset={setActiveOffset}
        />
      </PickerTrigger>
    </PickerContext.Provider>
  );
}

const RefRangePicker = React.forwardRef(RangePicker) as <DateType extends object = any>(
  props: RangePickerProps<DateType> & React.RefAttributes<RangePickerRef>,
) => React.ReactElement;

if (process.env.NODE_ENV !== 'production') {
  (RefRangePicker as any).displayName = 'RefRangePicker';
}

export default RefRangePicker;
