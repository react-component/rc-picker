import { useMergedState } from 'rc-util';
import * as React from 'react';
import type { GenerateConfig } from '../../generate';
import type {
  CellRender,
  Components,
  DisabledDate,
  Locale,
  PanelMode,
  SharedTimeProps,
} from '../interface';
import { PrefixClsContext } from '../PickerInput/context';
import DatePanel from './DatePanel';
import DecadePanel from './DecadePanel';
import MonthPanel from './MonthPanel';
import TimePanel from './TimePanel';
import WeekPanel from './WeekPanel';
import YearPanel from './YearPanel';

const DefaultComponents: Components = {
  date: DatePanel,
  week: WeekPanel,
  month: MonthPanel,
  year: YearPanel,
  decade: DecadePanel,
  time: TimePanel,
};

export interface PickerPanelProps<DateType = any> {
  locale: Locale;
  disabledDate?: DisabledDate<DateType>;
  generateConfig: GenerateConfig<DateType>;

  // Style
  prefixCls?: string;

  // Value
  defaultValue?: DateType | null;
  value?: DateType | null;
  onChange?: (date: DateType) => void;

  // Panel control
  defaultPickerValue?: DateType | null;
  pickerValue?: DateType | null;
  onPickerValueChange?: (date: DateType) => void;

  // Mode
  mode?: PanelMode;
  onModeChange?: (mode: PanelMode) => void;
  picker?: PanelMode;

  // Time
  time?: SharedTimeProps<DateType>;

  // Cell
  cellRender?: CellRender<DateType>;

  // Components
  components?: Components;
}

export default function PickerPanel<DateType = any>(props: PickerPanelProps<DateType>) {
  const {
    locale,
    disabledDate,
    generateConfig,

    // Style
    prefixCls,

    // Value
    defaultValue,
    value,
    onChange,

    // Picker control
    defaultPickerValue,
    pickerValue,
    onPickerValueChange,

    // Mode
    mode,
    onModeChange,
    picker = 'date',

    // Time
    time,

    // Cell
    cellRender,

    // Components
    components = {},
  } = props;

  const mergedPrefixCls = React.useContext(PrefixClsContext) || prefixCls || 'rc-picker';

  // ========================== Now ===========================
  const now = generateConfig.getNow();

  // ========================== Mode ==========================
  const [mergedMode, setMergedMode] = useMergedState<PanelMode>(picker, {
    value: mode,
    postState: (val) => val || 'date',
    onChange: onModeChange,
  });

  // ========================= Value ==========================
  const [mergedValue, setMergedValue] = useMergedState<DateType | null>(defaultValue, {
    value,
  });

  const onInternalChange = (newVal: DateType) => {
    setMergedValue(newVal);
    onChange?.(newVal);

    // Update mode if needed
    if (mergedMode !== picker) {
      const queue: PanelMode[] = ['decade', 'year', 'month'];
      const index = queue.indexOf(mergedMode);
      const nextMode = queue[index + 1];
      if (index >= 0 && nextMode) {
        setMergedMode(nextMode);
      } else if (mergedMode === 'month') {
        if (picker === 'datetime') {
          setMergedMode('datetime');
        } else if (picker === 'date') {
          setMergedMode('date');
        } else if (picker === 'week') {
          setMergedMode('week');
        }
      }
    }
  };

  // ====================== PickerValue =======================
  // PickerValue is used to control the current displaying panel
  const [mergedPickerValue, setPickerValue] = useMergedState(
    defaultPickerValue || mergedValue || now,
    {
      value: pickerValue,
      onChange: onPickerValueChange,
    },
  );

  // ======================= HoverValue =======================
  const [hoverDate, setHoverDate] = React.useState<DateType>(null);

  // ======================= Components =======================
  const PanelComponent = components[mergedMode] || DefaultComponents[mergedMode] || DatePanel;

  // ========================= Render =========================
  return (
    <div className={`${mergedPrefixCls}-panel`}>
      <PanelComponent
        // Time
        time={time}
        // MISC
        prefixCls={mergedPrefixCls}
        locale={locale}
        generateConfig={generateConfig}
        // Mode
        onModeChange={setMergedMode}
        // Value
        pickerValue={mergedPickerValue}
        onPickerValueChange={setPickerValue}
        value={mergedValue}
        onChange={onInternalChange}
        // Render
        cellRender={cellRender}
        disabledDate={disabledDate}
        onHover={setHoverDate}
      />
    </div>
  );
}
