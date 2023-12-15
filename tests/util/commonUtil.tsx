import React from 'react';
// import { mount as originMount, ReactWrapper } from 'enzyme';
import { act, fireEvent } from '@testing-library/react';
import dayjs, { isDayjs, type Dayjs } from 'dayjs';
import 'dayjs/locale/zh-cn';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import updateLocale from 'dayjs/plugin/updateLocale';
import moment, { isMoment, type Moment } from 'moment';
import Picker, { PickerPanel, type PickerProps } from '../../src';
import dayGenerateConfig from '../../src/generate/dayjs';
import momentGenerateConfig from '../../src/generate/moment';
import enUS from '../../src/locale/en_US';
import zh_CN from '../../src/locale/zh_CN';
import type {
  PickerProps as NewPickerProps,
  PickerRef,
  RangePickerProps,
  PickerPanelProps as NewPickerPanelProps,
} from '../../src/NewPicker';
import { Picker as NewPicker, RangePicker as NewRangePicker, PickerPanel as NewPickerPanel } from '../../src/NewPicker';
import type { PickerBaseProps, PickerDateProps, PickerTimeProps } from '../../src/Picker';
import type {
  PickerPanelBaseProps,
  PickerPanelDateProps,
  PickerPanelTimeProps,

} from '../../src/PickerPanel';
import RangePicker, {
  type RangePickerBaseProps,
  type RangePickerDateProps,
  type RangePickerTimeProps,
} from '../../src/RangePicker';

dayjs.locale('zh-cn');
dayjs.extend(buddhistEra);
dayjs.extend(localizedFormat);
dayjs.extend(weekOfYear);
dayjs.extend(updateLocale);

const FULL_FORMAT = 'YYYY-MM-DD HH:mm:ss';

// export type Wrapper = ReactWrapper & {
//   confirmOK: () => void;
//   openPicker: (index?: number) => void;
//   closePicker: (index?: number) => void;
//   isOpen: () => boolean;
//   findCell: (text: number | string, index?: number) => Wrapper;
//   selectCell: (text: number | string, index?: number) => Wrapper;
//   clearValue: (index?: number) => void;
//   keyDown: (which: number, info?: object, index?: number) => void;
//   clickButton: (type: 'prev' | 'next' | 'super-prev' | 'super-next') => Wrapper;
//   inputValue: (text: string, index?: number) => Wrapper;
// };

// export const mount = originMount as (...args: Parameters<typeof originMount>) => Wrapper;

export function getMoment(str: string): Moment {
  const formatList = [FULL_FORMAT, 'YYYY-MM-DD', 'HH:mm:ss', 'YYYY'];
  for (let i = 0; i < formatList.length; i += 1) {
    const date = moment(str, formatList[i], true);
    if (date.isValid()) {
      return date;
    }
  }
  throw new Error(`Format not match with: ${str}`);
}

export function isSame(date: Moment | Dayjs | null, dateStr: string, type: any = 'date') {
  if (!date) {
    return false;
  }

  if (isMoment(date)) {
    if (date.isSame(getMoment(dateStr), type)) {
      return true;
    }
  }
  if (isDayjs(date)) {
    if (date.isSame(getDay(dateStr), type)) {
      return true;
    }
  }

  throw new Error(`${date.format(FULL_FORMAT)} is not same as expected: ${dateStr}`);
}

interface MomentDefaultProps {
  locale?: PickerProps<Moment>['locale'];
  generateConfig?: PickerProps<Moment>['generateConfig'];
}

type InjectDefaultProps<Props> = Omit<Props, 'locale' | 'generateConfig'> & MomentDefaultProps;

// Moment Picker
export type MomentPickerProps =
  | InjectDefaultProps<PickerBaseProps<Moment>>
  | InjectDefaultProps<PickerDateProps<Moment>>
  | InjectDefaultProps<PickerTimeProps<Moment>>;

// export class MomentPicker extends React.Component<MomentPickerProps> {
//   pickerRef = React.createRef<Picker<Moment>>();

//   render() {
//     return (
//       <Picker<Moment>
//         generateConfig={momentGenerateConfig}
//         locale={enUS}
//         ref={this.pickerRef}
//         {...this.props}
//       />
//     );
//   }
// }

// Moment Panel Picker
export type MomentPickerPanelProps =
  | InjectDefaultProps<PickerPanelBaseProps<Moment>>
  | InjectDefaultProps<PickerPanelDateProps<Moment>>
  | InjectDefaultProps<PickerPanelTimeProps<Moment>>;

// export const MomentPickerPanel = (props: MomentPickerPanelProps) => (
//   <PickerPanel<Moment> generateConfig={momentGenerateConfig} locale={enUS} {...props} />
// );

// Moment Range Picker
export type MomentRangePickerProps =
  | InjectDefaultProps<RangePickerBaseProps<Moment>>
  | InjectDefaultProps<RangePickerDateProps<Moment>>
  | InjectDefaultProps<RangePickerTimeProps<Moment>>;

// export class MomentRangePicker extends React.Component<MomentRangePickerProps> {
//   rangePickerRef = React.createRef<RangePicker<Moment>>();

//   render() {
//     return (
//       <RangePicker<Moment>
//         generateConfig={momentGenerateConfig}
//         locale={enUS}
//         ref={this.rangePickerRef}
//         {...this.props}
//       />
//     );
//   }
// }

// ====================================== UTIL ======================================
export async function waitFakeTimer() {
  await act(async () => {
    jest.runAllTimers();
    await Promise.resolve();
  });
}

export function openPicker(container: HTMLElement, index = 0) {
  const input = container.querySelectorAll('input')[index];
  fireEvent.mouseDown(input);

  // Testing lib not trigger real focus
  act(() => {
    input.focus();
  });
  fireEvent.click(input);
}

export function closePicker(container: HTMLElement, index = 0) {
  const input = container.querySelectorAll('input')[index];
  fireEvent.blur(input);

  act(() => {
    jest.runAllTimers();
  });
}

export function isOpen() {
  const dropdown = document.querySelector('.rc-picker-dropdown');
  return dropdown && !dropdown.classList.contains('rc-picker-dropdown-hidden');
}

export function findCell(text: string | number, index = 0) {
  let matchCell: HTMLElement;

  const table = document.querySelectorAll('table')[index];

  Array.from(table.querySelectorAll('td')).forEach((td) => {
    if (td.textContent === String(text) && td.className.includes('-in-view')) {
      matchCell = td;
    }
  });
  if (!matchCell) {
    throw new Error('Cell not match in picker panel.');
  }

  return matchCell;
}

export function selectCell(text: string | number, index = 0) {
  const td = findCell(text, index);
  fireEvent.click(td);

  return td;
}

export function clickButton(type: string) {
  let matchBtn: HTMLButtonElement;
  Array.from(document.querySelectorAll('button')).forEach((btn) => {
    if (btn.className.includes(`-header-${type}-btn`)) {
      matchBtn = btn;
    }
  });

  fireEvent.click(matchBtn);

  return matchBtn;
}

export function confirmOK() {
  fireEvent.click(document.querySelector('.rc-picker-ok > *'));
}

export function clearValue() {
  const clearBtn = document.querySelector('.rc-picker-clear');
  fireEvent.mouseDown(clearBtn);
  fireEvent.mouseUp(clearBtn);
  fireEvent.click(clearBtn);
}

export function inputValue(text: string, index = 0) {
  fireEvent.change(document.querySelectorAll('input')[index], { target: { value: text } });
}

// ===================================== Day JS =====================================
export const DayPicker = React.forwardRef<
  PickerRef,
  Partial<Omit<NewPickerProps<Dayjs>, 'generateConfig'>>
>((props, ref) => {
  return <NewPicker generateConfig={dayGenerateConfig} locale={enUS} {...props} ref={ref} />;
});

export const DayRangePicker = React.forwardRef<
  PickerRef,
  Partial<Omit<RangePickerProps<Dayjs>, 'generateConfig'>>
>((props, ref) => {
  return <NewRangePicker generateConfig={dayGenerateConfig} locale={zh_CN} {...props} ref={ref} />;
});

export const DayPickerPanel = (props: Partial<NewPickerPanelProps<Dayjs>>) => (
  <NewPickerPanel<Dayjs> generateConfig={dayGenerateConfig} locale={enUS} {...props} />
);

export function getDay(str: string): Dayjs {
  const formatList = [FULL_FORMAT, 'YYYY-MM-DD', 'HH:mm:ss', 'YYYY'];
  for (let i = 0; i < formatList.length; i += 1) {
    const date = dayjs(str, formatList[i], true);
    if (date.isValid()) {
      return date;
    }
  }
  throw new Error(`Format not match with: ${str}`);
}
