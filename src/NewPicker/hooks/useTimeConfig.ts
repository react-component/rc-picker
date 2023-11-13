import type { PickerMode, SharedTimeProps } from '../interface';

const showTimeKeys = [
  'format',
  'showTitle',
  'showNow',
  'showHour',
  'showMinute',
  'showSecond',
  'showMillisecond',
  'use12Hours',
  'hourStep',
  'minuteStep',
  'secondStep',
  'millisecondStep',
  'hideDisabledOptions',
  'defaultValue',
  'disabledHours',
  'disabledMinutes',
  'disabledSeconds',
  'disabledTime',
  'changeOnScroll',
] as const;

// Used for typescript check the props not missing.
// This will be removed by terser or uglify.
if (process.env.NODE_ENV === 'not-exist-env') {
  type KeyRecord = Record<(typeof showTimeKeys)[number], boolean>;

  // eslint-disable-next-line
  const checker: Record<keyof SharedTimeProps<any>, boolean> = {} as KeyRecord;
}

/**
 * Get SharedTimeProps from props.
 */
function pickTimeProps<DateType = any>(props: object): SharedTimeProps<DateType> {
  const timeProps: any = {};
  showTimeKeys.forEach((key) => {
    if (key in props) {
      timeProps[key] = props[key];
    }
  });
  return timeProps;
}

export default function useTimeConfig<Config extends object>(
  componentProps: {
    picker?: PickerMode;
    showTime?: boolean | Config;
  } = {},
): Config {
  const { showTime, picker } = componentProps;

  if (showTime === true) {
    return {} as Config;
  }

  if (picker === 'time') {
    return pickTimeProps(showTime || {}) as Config;
  }

  return showTime || null;
}