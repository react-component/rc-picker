import { useMergedState } from 'rc-util';
import * as React from 'react';
import { isSameTimestamp } from '../../utils/dateUtil';
import type {
  InternalMode,
  OnOpenChange,
  OpenConfig,
  SelectorProps,
  SelectorRef,
  SharedPickerProps,
} from '../interface';
import type { PickerPanelProps, PickerPanelRef } from '../PickerPanel';
import PickerPanel from '../PickerPanel';
import PickerTrigger from '../PickerTrigger';
import PickerContext from './context';
import { useFieldFormat } from './hooks/useFieldFormat';
import useOpen from './hooks/useOpen';
import useShowNow from './hooks/useShowNow';
import Popup from './Popup';
import RangeSelector from './Selector/RangeSelector';

function separateConfig<T>(config: T | [T, T] | null | undefined, defaultConfig: T): [T, T] {
  const singleConfig = config ?? defaultConfig;

  if (Array.isArray(singleConfig)) {
    return singleConfig;
  }

  return [singleConfig, singleConfig];
}

export type RangeValueType<DateType> = [start?: DateType, end?: DateType];

export interface RangePickerProps<DateType> extends SharedPickerProps<DateType> {
  // Value
  value?: RangeValueType<DateType>;
  defaultValue?: RangeValueType<DateType>;
  onChange?: (dates: RangeValueType<DateType>, dateStrings: [string, string]) => void;
  onCalendarChange?: (
    dates: RangeValueType<DateType>,
    dateStrings: [string, string],
    info: {
      range: 'start' | 'end';
    },
  ) => void;

  order?: boolean;

  disabled?: boolean | [boolean, boolean];
  allowEmpty?: [boolean, boolean];
}

export default function Picker<DateType = any>(props: RangePickerProps<DateType>) {
  const {
    // Style
    prefixCls = 'rc-picker',
    className,
    style,
    styles = {},
    classNames = {},

    // Value
    value,
    defaultValue,
    onChange,
    onCalendarChange,

    order = true,

    disabled,
    allowEmpty,

    // Open
    defaultOpen,
    open,
    onOpenChange,
    popupAlign,
    getPopupContainer,

    // Picker
    locale,
    generateConfig,
    picker = 'date',
    mode,
    onModeChange,
    showTime,
    showNow,
    showToday,

    // Format
    format,

    // Motion
    transitionName,

    suffixIcon,
    direction,

    // Render
    components = {},
  } = props;

  const selectorRef = React.useRef<SelectorRef>();
  const panelRef = React.useRef<PickerPanelRef>();

  // ======================== Picker ========================
  const [mergedMode, setMergedMode] = useMergedState(picker, {
    value: mode,
    onChange: onModeChange,
  });

  const internalPicker: InternalMode = picker === 'date' && showTime ? 'datetime' : picker;
  const internalMode: InternalMode = mergedMode === 'date' && showTime ? 'datetime' : mergedMode;

  // ======================= Show Now =======================
  const mergedShowNow = useShowNow(internalPicker, mergedMode, showNow, showToday);

  // ======================== Format ========================
  const [formatList, maskFormat] = useFieldFormat(internalPicker, locale, format);

  // ========================= Open =========================
  const popupPlacement = direction === 'rtl' ? 'bottomRight' : 'bottomLeft';

  const [mergedOpen, setMergeOpen] = useOpen(open, defaultOpen, onOpenChange);
  // const [mergedOpen, setMergeOpen] = useLockState(open, defaultOpen, onOpenChange);

  const onSelectorOpenChange: OnOpenChange = (nextOpen, index, config?: OpenConfig) => {
    setMergeOpen(nextOpen, config);
  };

  // ======================== Active ========================
  // When user first focus one input, any submit will trigger focus another one.
  // When second time focus one input, submit will not trigger focus again.
  // When click outside to close the panel, trigger event if it can trigger onChange.
  const [activeIndex, setActiveIndex] = React.useState<number>(null);
  const [focused, setFocused] = React.useState<boolean>(false);

  const focusedIndex = focused ? activeIndex : null;

  const [activeList, setActiveList] = React.useState<number[]>(null);

  React.useEffect(() => {
    if (!mergedOpen) {
      setActiveList(null);
    } else if (activeIndex !== null) {
      setActiveList((ori) => {
        const list = [...(ori || [])];
        return list[list.length - 1] === activeIndex ? ori : [...list, activeIndex];
      });
    }
  }, [activeIndex, mergedOpen]);

  // Trigger if need adjust active
  const syncActive = () => {
    if (activeList?.length === 1) {
      selectorRef.current.focus(activeList[0] === 0 ? 1 : 0);
    }
  };

  // =================== Disabled & Empty ===================
  const mergedDisabled = separateConfig(disabled, false);
  const mergedAllowEmpty = separateConfig(allowEmpty, true);

  // ======================== Value =========================
  const [mergedValue, setMergedValue] = useMergedState(defaultValue, {
    value,
    postState: (valList): RangeValueType<DateType> => valList || [null, null],
  });

  // ======================== Change ========================
  const triggerChange = ([start, end]: RangeValueType<DateType>, source?: 'submit') => {
    const clone: RangeValueType<DateType> = [start, end];

    // Only when exist value to sort
    if (order && source === 'submit' && clone[0] && clone[1]) {
      clone.sort((a, b) => (generateConfig.isAfter(a, b) ? 1 : -1));
    }

    const [prevStart, prevEnd] = mergedValue;
    const isSameStart = isSameTimestamp(generateConfig, prevStart, clone[0]);
    const isSameEnd = isSameTimestamp(generateConfig, prevEnd, clone[1]);

    if (!isSameStart || !isSameEnd) {
      setMergedValue(clone);

      // >>>>> Batch of change logic
      const nextValueTexts = clone.map((date) =>
        date ? generateConfig.locale.format(locale.locale, date, formatList[0]) : '',
      ) as [string, string];

      // Trigger calendar change event
      if (onCalendarChange) {
        onCalendarChange(clone, nextValueTexts, {
          range: isSameStart ? 'end' : 'start',
        });
      }

      // Trigger Change event
      if (onChange && source === 'submit') {
        const startEmpty = !clone[0];
        const endEmpty = !clone[1];

        if (
          // Validate start
          (!startEmpty || mergedAllowEmpty[0]) &&
          // Validate end
          (!endEmpty || mergedAllowEmpty[1])
        ) {
          onChange(clone, nextValueTexts);
        }
      }
    }
  };

  const fillValue = (date: DateType, index: number) => {
    // Trigger change only when date changed
    const [prevStart, prevEnd] = mergedValue;

    const clone: RangeValueType<DateType> = [prevStart, prevEnd];
    clone[index] = date;

    return clone;
  };

  const onSelectorChange = (date: DateType, index: number) => {
    const clone = fillValue(date, index);

    triggerChange(clone);
  };

  // ====================== Focus Blur ======================
  const onFocus: SelectorProps['onFocus'] = (_, index) => {
    setActiveIndex(index);
    setFocused(true);
  };

  const onBlur: SelectorProps['onBlur'] = () => {
    setFocused(false);
    triggerChange(mergedValue, 'submit');
  };

  const onSubmit = (date?: DateType) => {
    let nextValue = mergedValue;

    if (date) {
      nextValue = fillValue(date, activeIndex);
    }

    triggerChange(nextValue, 'submit');
    syncActive();
  };

  // ======================== Click =========================
  const onSelectorClick: React.MouseEventHandler<HTMLDivElement> = () => {
    // if (focusedIndex === null) {
    selectorRef.current.focus(0);
    setMergeOpen(true);
    // }
  };

  // ======================== Panels ========================
  const onPanelFocus: React.FocusEventHandler<HTMLDivElement> = () => {
    setFocused(true);
    setMergeOpen(true);
  };

  const onPanelBlur: React.FocusEventHandler<HTMLDivElement> = () => {
    setFocused(false);
  };

  const onPanelChange: PickerPanelProps<DateType>['onChange'] = (date) => {
    const clone: RangeValueType<DateType> = [...mergedValue];
    clone[activeIndex] = date;

    triggerChange(clone);
  };

  const panel = (
    <Popup
      {...props}
      onFocus={onPanelFocus}
      onBlur={onPanelBlur}
      mode={mergedMode}
      internalMode={internalMode}
      showNow={mergedShowNow}
      onSubmit={onSubmit}
    >
      <PickerPanel<any>
        {...props}
        ref={panelRef}
        onChange={onPanelChange}
        mode={mergedMode}
        onModeChange={setMergedMode}
      />
    </Popup>
  );

  // ======================= Context ========================
  const context = React.useMemo(
    () => ({
      prefixCls,
      locale,
      generateConfig,
      button: components.button,
    }),
    [prefixCls, locale, generateConfig, components.button],
  );

  // ======================== Render ========================
  return (
    <PickerContext.Provider value={context}>
      <PickerTrigger
        visible={mergedOpen}
        popupElement={panel}
        popupStyle={styles.popup}
        popupClassName={classNames.popup}
        popupAlign={popupAlign}
        getPopupContainer={getPopupContainer}
        transitionName={transitionName}
        popupPlacement={popupPlacement}
        direction={direction}
      >
        <RangeSelector
          // Shared
          {...props}
          // Ref
          ref={selectorRef}
          // Icon
          suffixIcon={suffixIcon}
          // Active
          activeIndex={focusedIndex}
          onFocus={onFocus}
          onBlur={onBlur}
          onSubmit={onSubmit}
          // Change
          value={mergedValue}
          format={formatList}
          maskFormat={maskFormat}
          onChange={onSelectorChange}
          // Open
          open={mergedOpen ? focusedIndex : null}
          onOpenChange={onSelectorOpenChange}
          // Click
          onClick={onSelectorClick}
        />
      </PickerTrigger>
    </PickerContext.Provider>
  );
}
