// In theory, all RangePicker test cases should be paired with SinglePicker
import { act, fireEvent, render } from '@testing-library/react';
import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/ar';
import { spyElementPrototype } from 'rc-util/lib/test/domHook';
import { resetWarned } from 'rc-util/lib/warning';
import React from 'react';
import type { RangePickerProps } from '../src';
import zh_CN from '../src/locale/zh_CN';
import {
  closePicker,
  DayPicker,
  DayRangePicker,
  findCell,
  getDay,
  isOpen,
  isSame,
  openPicker,
  selectCell,
  waitFakeTimer,
} from './util/commonUtil';

jest.mock('rc-util/lib/Dom/isVisible', () => {
  return () => true;
});

describe('NewPicker.Range', () => {
  beforeEach(() => {
    resetWarned();
    jest.useFakeTimers().setSystemTime(getDay('1990-09-03 00:00:00').valueOf());
    dayjs.locale('zh-cn');

    spyElementPrototype(HTMLLIElement, 'offsetTop', {
      get() {
        const childList = Array.from(this.parentNode?.childNodes || []);
        return childList.indexOf(this) * 30;
      },
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('PickerValue', () => {
    it('defaultPickerValue should reset every time when opened', () => {
      const { container } = render(
        <DayRangePicker defaultPickerValue={[getDay('2000-01-01'), getDay('2023-09-03')]} />,
      );

      // Left
      openPicker(container);

      for (let i = 0; i < 13; i += 1) {
        fireEvent.click(document.querySelector('.rc-picker-header-prev-btn'));
      }
      expect(document.querySelector('.rc-picker-header-view').textContent).toEqual('1998年12月');

      // Right
      openPicker(container, 1);

      for (let i = 0; i < 13; i += 1) {
        fireEvent.click(document.querySelector('.rc-picker-header-next-btn'));
      }
      expect(document.querySelector('.rc-picker-header-view').textContent).toEqual('2024年10月');

      // Left again
      openPicker(container);
      expect(document.querySelector('.rc-picker-header-view').textContent).toEqual('2000年1月');

      // Right again
      openPicker(container, 1);
      expect(document.querySelector('.rc-picker-header-view').textContent).toEqual('2023年9月');
    });

    it('onPickerValueChange', () => {
      let nextPickerValues: [Dayjs | null, Dayjs | null];
      const onPickerValueChange = jest.fn();

      const { container } = render(
        <DayRangePicker
          pickerValue={[getDay('1990-02-03'), getDay('1990-02-03')]}
          defaultPickerValue={[getDay('2000-01-01'), getDay('2023-09-03')]}
          onPickerValueChange={onPickerValueChange}
        />,
      );

      // Left
      openPicker(container);
      expect(onPickerValueChange).toHaveBeenCalledTimes(1);

      nextPickerValues = onPickerValueChange.mock.calls[0][0];
      expect(isSame(nextPickerValues[0], '2000-01-01'));
      expect(isSame(nextPickerValues[1], '1990-02-03'));
      expect(onPickerValueChange.mock.calls[0][1]).toEqual(
        expect.objectContaining({
          source: 'reset',
          range: 'start',
        }),
      );
      onPickerValueChange.mockReset();

      // Right
      openPicker(container, 1);
      expect(onPickerValueChange).toHaveBeenCalledTimes(1);

      nextPickerValues = onPickerValueChange.mock.calls[0][0];
      expect(isSame(nextPickerValues[0], '1990-02-03'));
      expect(isSame(nextPickerValues[1], '2023-09-03'));
      expect(onPickerValueChange.mock.calls[0][1]).toEqual(
        expect.objectContaining({
          source: 'reset',
          range: 'end',
        }),
      );
    });

    it('correct onPickerValueChange range', () => {
      const onPickerValueChange = jest.fn();
      const { container } = render(<DayRangePicker onPickerValueChange={onPickerValueChange} />);

      openPicker(container);
      selectCell(5);

      // One is start picker value change, another is end picker reset
      expect(onPickerValueChange).toHaveBeenCalledTimes(2);

      expect(onPickerValueChange.mock.calls[0][1]).toEqual(
        expect.objectContaining({
          range: 'start',
        }),
      );
      expect(onPickerValueChange.mock.calls[1][1]).toEqual(
        expect.objectContaining({
          range: 'end',
        }),
      );
    });

    it('half set defaultPickerValue', () => {
      const onPickerValueChange = jest.fn();

      const { container } = render(
        <DayRangePicker
          defaultPickerValue={[getDay('2000-01-01'), null]}
          onPickerValueChange={onPickerValueChange}
        />,
      );

      openPicker(container);

      // Left
      for (let i = 0; i < 13; i += 1) {
        onPickerValueChange.mockReset();
        fireEvent.click(document.querySelector('.rc-picker-header-prev-btn'));
      }

      expect(isSame(onPickerValueChange.mock.calls[0][0][0], '1998-12-01')).toBeTruthy();
      expect(onPickerValueChange.mock.calls[0][1]).toEqual(
        expect.objectContaining({
          source: 'panel',
          range: 'start',
        }),
      );
      onPickerValueChange.mockReset();

      // Right
      selectCell(7);

      const lastCalled = onPickerValueChange.mock.calls[onPickerValueChange.mock.calls.length - 1];
      expect(isSame(lastCalled[0][1], '1998-12-07')).toBeTruthy();
      expect(lastCalled[1]).toEqual(
        expect.objectContaining({
          source: 'reset',
          range: 'end',
        }),
      );
    });

    it('end pickerValue will follow prev start pickerValue', async () => {
      const { container } = render(
        <DayRangePicker defaultValue={[getDay('2000-01-01'), getDay('2001-03-03')]} />,
      );
      openPicker(container);

      selectCell(5);
      await waitFakeTimer();

      expect(document.querySelector('.rc-picker-header-view').textContent).toBe('2000年1月');
    });
  });

  describe('field', () => {
    it('not open for function key', () => {
      const { container } = render(<DayRangePicker />);
      const firstInput = container.querySelector<HTMLInputElement>('input');

      fireEvent.keyDown(firstInput, {
        key: 'Shift',
      });
      expect(isOpen()).toBeFalsy();

      fireEvent.change(firstInput, {
        target: {
          value: 'a',
        },
      });
      expect(isOpen()).toBeTruthy();
    });

    it('preserveInvalidOnBlur=false', () => {
      const { container } = render(<DayRangePicker preserveInvalidOnBlur={false} />);
      const firstInput = container.querySelector<HTMLInputElement>('input');

      openPicker(container);
      fireEvent.change(firstInput, {
        target: {
          value: 'invalidate 123',
        },
      });

      closePicker(container);
      act(() => {
        jest.runAllTimers();
      });
      expect(firstInput).toHaveValue('');
    });

    it('preserveInvalidOnBlur=true', () => {
      const { container } = render(<DayRangePicker preserveInvalidOnBlur />);
      const firstInput = container.querySelector<HTMLInputElement>('input');

      openPicker(container);
      fireEvent.change(firstInput, {
        target: {
          value: 'invalidate 123',
        },
      });

      closePicker(container);
      act(() => {
        jest.runAllTimers();
      });
      expect(firstInput).toHaveValue('invalidate 123');
    });
  });

  describe('format and panel', () => {
    it('support BBBB', () => {
      const onChange = jest.fn();

      const { container } = render(
        <DayRangePicker
          picker="year"
          onChange={onChange}
          locale={{
            ...zh_CN,
            fieldYearFormat: 'BBBB',
            cellYearFormat: 'BBBB',
            yearFormat: 'BBBB',
          }}
        />,
      );

      openPicker(container);

      // Title
      expect(document.querySelector('.rc-picker-header-view').textContent).toEqual('2533-2542');

      // Cell
      selectCell(2538);
      selectCell(2551, 1);

      expect(onChange).toHaveBeenCalledWith(expect.anything(), ['2538', '2551']);

      expect(container.querySelectorAll('input')[0]).toHaveValue('2538');
      expect(container.querySelectorAll('input')[1]).toHaveValue('2551');
    });

    it('support LTS', () => {
      const { rerender } = render(<DayRangePicker picker="time" format="LT" open />);
      expect(document.querySelectorAll('.rc-picker-time-panel-column')).toHaveLength(3);

      // With second
      rerender(<DayRangePicker picker="time" format="LTS" open />);
      expect(document.querySelectorAll('.rc-picker-time-panel-column')).toHaveLength(4);
    });

    it('cellDateFormat should work', () => {
      render(
        <DayRangePicker
          locale={{
            ...zh_CN,
            cellDateFormat: '!DD!',
          }}
          open
        />,
      );

      expect(document.querySelector('[title="1990-11-04"]').textContent).toEqual('!04!');
    });

    it('cellQuarterFormat should work', () => {
      render(
        <DayRangePicker
          locale={{
            ...zh_CN,
            cellQuarterFormat: '第Q季度',
          }}
          picker="quarter"
          open
        />,
      );

      expect(document.querySelector('[title="1990-Q1"]').textContent).toEqual('第1季度');
    });

    it('cellMeridiemFormat should work', () => {
      render(
        <DayRangePicker
          picker="time"
          locale={{
            ...zh_CN,
            cellMeridiemFormat: 'A',
          }}
          showTime={{
            use12Hours: true,
          }}
          open
        />,
      );

      expect(
        document.querySelectorAll('[data-type="meridiem"] .rc-picker-time-panel-cell')[0]
          .textContent,
      ).toEqual('早上');
      expect(
        document.querySelectorAll('[data-type="meridiem"] .rc-picker-time-panel-cell')[1]
          .textContent,
      ).toEqual('晚上');
    });
  });

  it('showTime.changeOnScroll', () => {
    const onCalendarChange = jest.fn();

    const { container } = render(
      <DayRangePicker
        picker="time"
        value={[getDay('1990-09-03 11:11:11'), getDay('1990-09-03 11:11:11')]}
        showTime={{
          changeOnScroll: true,
        }}
        onCalendarChange={onCalendarChange}
      />,
    );

    openPicker(container);
    act(() => {
      jest.runAllTimers();
    });

    fireEvent.scroll(document.querySelector('.rc-picker-time-panel-column'), {
      target: {
        scrollTop: 0,
      },
    });
    act(() => {
      jest.runAllTimers();
    });

    expect(onCalendarChange).toHaveBeenCalledWith(
      expect.anything(),
      ['00:11:11', '11:11:11'],
      expect.anything(),
    );
  });

  describe('disabled', () => {
    it('select time column should not trigger change', () => {
      const onCalendarChange = jest.fn();
      const { container } = render(
        <DayRangePicker disabledDate={() => true} onCalendarChange={onCalendarChange} showTime />,
      );

      openPicker(container);
      fireEvent.click(
        document.querySelector('.rc-picker-time-panel-column .rc-picker-time-panel-cell'),
      );

      expect(onCalendarChange).toHaveBeenCalled();

      // Check button disabled
      expect(document.querySelector('.rc-picker-ok button')).toBeDisabled();
    });

    it('not trigger on disabled all hours', () => {
      const onCalendarChange = jest.fn();
      const { container } = render(
        <DayRangePicker
          onCalendarChange={onCalendarChange}
          showTime={{
            disabledTime: () => ({
              disabledHours: () => new Array(24).fill(0).map((_, index) => index),
            }),
          }}
        />,
      );

      openPicker(container);
      selectCell(9);

      expect(onCalendarChange).toHaveBeenCalled();

      // Check button disabled
      expect(document.querySelector('.rc-picker-ok button')).toBeDisabled();
    });

    it('not trigger onChange if presets is invalidate', () => {
      const onChange = jest.fn();
      const onCalendarChange = jest.fn();
      const { container } = render(
        <DayRangePicker
          onChange={onChange}
          onCalendarChange={onCalendarChange}
          presets={[
            {
              label: 'Now',
              value: [dayjs(), dayjs()],
            },
          ]}
          disabledDate={() => true}
        />,
      );

      openPicker(container);
      fireEvent.click(document.querySelector('.rc-picker-presets li'));

      expect(onChange).not.toHaveBeenCalled();
      expect(onCalendarChange).toHaveBeenCalled();
    });

    it('not trigger onChange if showNow is invalidate', () => {
      const onChange = jest.fn();
      const onCalendarChange = jest.fn();
      const { container } = render(
        <DayRangePicker
          onChange={onChange}
          onCalendarChange={onCalendarChange}
          showNow
          showTime
          disabledDate={() => true}
        />,
      );

      openPicker(container);
      fireEvent.click(document.querySelector('.rc-picker-now-btn'));
      fireEvent.click(document.querySelector('.rc-picker-now-btn'));

      expect(document.querySelector('.rc-picker-now-btn-disabled')).toBeTruthy();

      expect(onChange).not.toHaveBeenCalled();
      expect(onCalendarChange).not.toHaveBeenCalled();
    });

    it('not select disabled time', () => {
      const onCalendarChange = jest.fn();
      const { container } = render(
        <DayRangePicker
          picker="time"
          showTime={{
            disabledTime: () => ({
              disabledMinutes: () => [0],
            }),
          }}
          onCalendarChange={onCalendarChange}
        />,
      );

      openPicker(container);
      fireEvent.click(
        document.querySelector('.rc-picker-time-panel-column .rc-picker-time-panel-cell'),
      );

      expect(onCalendarChange).toHaveBeenCalledWith(
        expect.anything(),
        ['00:01:00', ''],
        expect.anything(),
      );
    });

    it('disabledTime has error style', () => {
      // rc-picker-invalid
      const { container } = render(
        <DayRangePicker
          picker="time"
          showTime={{
            disabledTime: () => ({
              disabledHours: () => [0],
            }),
          }}
        />,
      );

      const startInput = container.querySelectorAll<HTMLInputElement>('input')[0];
      const endInput = container.querySelectorAll<HTMLInputElement>('input')[1];

      fireEvent.focus(startInput);
      fireEvent.change(startInput, {
        target: {
          value: '00:00:00',
        },
      });
      expect(startInput).toHaveAttribute('aria-invalid', 'true');
      fireEvent.keyDown(startInput, {
        key: 'Enter',
      });

      fireEvent.change(endInput, {
        target: {
          value: '00:00:00',
        },
      });
      expect(startInput).toHaveAttribute('aria-invalid', 'true');
    });

    it('type disabled time should not clickable ok', () => {
      const { container } = render(
        <DayRangePicker
          picker="time"
          showTime={{
            disabledTime: () => ({
              disabledHours: () => [0],
            }),
          }}
        />,
      );

      const input = container.querySelectorAll<HTMLInputElement>('input')[0];

      openPicker(container);

      // Enabled
      fireEvent.change(input, {
        target: {
          value: '01:00:00',
        },
      });
      expect(document.querySelector('.rc-picker-ok button')).not.toBeDisabled();

      // Disabled
      fireEvent.change(input, {
        target: {
          value: '00:00:00',
        },
      });
      expect(document.querySelector('.rc-picker-ok button')).toBeDisabled();
    });

    it('disabledDate provides info.type', () => {
      const disabledDate = jest.fn(() => false);

      render(<DayRangePicker open mode={['year', 'year']} disabledDate={disabledDate} />);

      expect(disabledDate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'year',
        }),
      );
    });

    it('disabled should patch className', () => {
      const { container, rerender } = render(<DayRangePicker disabled />);
      expect(container.querySelector('.rc-picker-disabled')).toBeTruthy();

      rerender(<DayRangePicker disabled={[true, false]} />);
      expect(container.querySelector('.rc-picker-disabled')).toBeFalsy();
    });
  });

  it('showTime.defaultValue', () => {
    const onCalendarChange = jest.fn();
    const { container } = render(
      <DayRangePicker
        onCalendarChange={onCalendarChange}
        showTime={{
          defaultValue: [getDay('01:03:05'), getDay('02:04:06')],
        }}
      />,
    );

    openPicker(container);

    // Start field
    selectCell(6);
    expect(onCalendarChange).toHaveBeenCalledWith(
      expect.anything(),
      ['1990-09-06 01:03:05', ''],
      expect.anything(),
    );
    onCalendarChange.mockReset();

    // End field
    fireEvent.click(document.querySelector('.rc-picker-ok button'));
    selectCell(7);
    expect(onCalendarChange).toHaveBeenCalledWith(
      expect.anything(),
      ['1990-09-06 01:03:05', '1990-09-07 02:04:06'],
      expect.anything(),
    );
  });

  it('not trigger onChange when in half', () => {
    const onChange = jest.fn();

    const { container } = render(
      <DayRangePicker
        onChange={onChange}
        defaultValue={[getDay('1990-09-10 00:00:00'), getDay('1990-09-20 00:00:00')]}
      />,
    );

    openPicker(container);
    selectCell(5);
    expect(onChange).not.toHaveBeenCalled();

    selectCell(22);
    expect(onChange).toHaveBeenCalledWith(expect.anything(), ['1990-09-05', '1990-09-22']);
  });

  describe('needConfirm', () => {
    it('normal picker need confirm', () => {
      const onChange = jest.fn();
      const { container } = render(
        <>
          <DayRangePicker onChange={onChange} needConfirm />
          <button className="focus" />
        </>,
      );

      // Nothing happen if not confirmed
      openPicker(container);
      selectCell(5);
      closePicker(container);

      expect(container.querySelectorAll('input')[0]).toHaveValue('');

      act(() => {
        jest.runAllTimers();
      });

      container.querySelector<HTMLButtonElement>('.focus').focus();

      // Changed by click OK
      openPicker(container);
      selectCell(10);
      fireEvent.click(document.querySelector('.rc-picker-ok button'));

      expect(container.querySelectorAll('input')[0]).toHaveValue('1990-09-10');

      // End time
      selectCell(15, 1);
      expect(onChange).not.toHaveBeenCalled();
      fireEvent.click(document.querySelector('.rc-picker-ok button'));

      expect(onChange).toHaveBeenCalledWith(expect.anything(), ['1990-09-10', '1990-10-15']);
    });

    it('no need confirm is blur to submit', () => {
      const onChange = jest.fn();
      const { container } = render(
        <DayRangePicker needConfirm={false} picker="time" onChange={onChange} />,
      );

      // Change start time (manually focus since fireEvent.focus not change activeElement)
      openPicker(container);
      const li6 = document.querySelector('.rc-picker-time-panel-column').querySelectorAll('li')[6];
      fireEvent.mouseDown(li6);
      fireEvent.click(li6);
      document.querySelector<HTMLDivElement>('.rc-picker-panel-container').focus();

      act(() => {
        jest.runAllTimers();
      });

      // Close panel to auto focus next end field
      fireEvent.mouseDown(document.body);
      act(() => {
        jest.runAllTimers();
      });

      expect(container.querySelectorAll('input')[1]).toHaveFocus();

      expect(isOpen()).toBeTruthy();

      // Select end time
      const li11 = document
        .querySelector('.rc-picker-time-panel-column')
        .querySelectorAll('li')[11];
      fireEvent.mouseDown(li11);
      fireEvent.click(li11);

      act(() => {
        jest.runAllTimers();
      });

      // Close panel to auto focus next end field
      fireEvent.mouseDown(document.body);

      act(() => {
        jest.runAllTimers();
      });

      expect(onChange).toHaveBeenCalledWith(expect.anything(), ['06:00:00', '11:00:00']);
    });

    it('Field switch should be locked even when the field already has the values', () => {
      const onChange = jest.fn();

      const { container } = render(<DayRangePicker onChange={onChange} showTime />);
      openPicker(container);
      selectCell(15);
      fireEvent.click(document.querySelector('.rc-picker-ok button'));

      selectCell(16);
      fireEvent.click(document.querySelector('.rc-picker-ok button'));

      expect(onChange).toHaveBeenCalledWith(expect.anything(), [
        '1990-09-15 00:00:00',
        '1990-09-16 00:00:00',
      ]);

      onChange.mockReset();
      openPicker(container, 0);
      selectCell(1);
      openPicker(container, 1);
      expect(container.querySelectorAll('input')[0]).toHaveFocus();
      expect(container.querySelectorAll('input')[1]).not.toHaveFocus();

      fireEvent.click(document.querySelector('.rc-picker-ok button'));
      openPicker(container, 1);
      expect(container.querySelectorAll('input')[1]).toHaveFocus();
      selectCell(2);
      fireEvent.click(document.querySelector('.rc-picker-ok button'));
      expect(onChange).toHaveBeenCalledWith(expect.anything(), [
        '1990-09-01 00:00:00',
        '1990-09-02 00:00:00',
      ]);
    });

    it('double click to confirm if needConfirm', () => {
      const onChange = jest.fn();

      const { container } = render(<DayRangePicker showTime onChange={onChange} />);
      openPicker(container);

      fireEvent.click(findCell(5));
      fireEvent.doubleClick(findCell(5));

      act(() => {
        jest.runAllTimers();
      });

      const li = document.querySelector('.rc-picker-time-panel-column').querySelectorAll('li')[11];
      fireEvent.click(li);
      fireEvent.doubleClick(li);

      expect(onChange).toHaveBeenCalledWith(expect.anything(), [
        '1990-09-05 00:00:00',
        '1990-09-05 11:00:00',
      ]);
    });

    it('double click should not take action if !needConfirm', () => {
      const { container } = render(<DayRangePicker />);

      openPicker(container);

      fireEvent.click(findCell(5));
      fireEvent.click(findCell(5));
      fireEvent.doubleClick(findCell(5));

      expect(container.querySelectorAll('input')[0]).toHaveValue('1990-09-05');
      expect(container.querySelectorAll('input')[1]).toHaveValue('1990-09-05');
    });

    it('not trigger open when !needConfirm', () => {
      const onChange = jest.fn();
      const onOpenChange = jest.fn();

      const { container } = render(
        <DayPicker showTime onChange={onChange} onOpenChange={onOpenChange} needConfirm={false} />,
      );
      openPicker(container);

      fireEvent.click(findCell(5));

      act(() => {
        jest.runAllTimers();
      });
      expect(onOpenChange).toHaveBeenCalledWith(true);

      // Window click to close
      fireEvent.mouseDown(document.body);
      act(() => {
        jest.runAllTimers();
      });

      expect(onOpenChange).toHaveBeenCalledTimes(2);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('open', () => {
    it('open = false can also submit', () => {
      const onChange = jest.fn();
      const { container } = render(
        <DayRangePicker onChange={onChange} picker="time" open={false} />,
      );

      const startInput = container.querySelectorAll<HTMLInputElement>('input')[0];
      const endInput = container.querySelectorAll<HTMLInputElement>('input')[1];

      startInput.focus();
      fireEvent.change(startInput, {
        target: {
          value: '00:00:00',
        },
      });
      fireEvent.keyDown(startInput, {
        key: 'Tab',
      });

      endInput.focus();
      fireEvent.change(endInput, {
        target: {
          value: '02:00:00',
        },
      });
      fireEvent.keyDown(startInput, {
        key: 'Tab',
      });

      expect(onChange).toHaveBeenCalledWith(expect.anything(), ['00:00:00', '02:00:00']);
    });

    // https://github.com/ant-design/ant-design/issues/30525
    it('strange open case', async () => {
      const onChange = jest.fn();
      const renderDemo = (open: boolean) => <DayRangePicker open={open} onChange={onChange} />;
      const { rerender } = render(renderDemo(true));
      await waitFakeTimer();

      fireEvent.focus(document.querySelector('.rc-picker-panel-container'));
      selectCell(5);
      selectCell(10);

      expect(onChange).toHaveBeenCalledWith(expect.anything(), ['1990-09-05', '1990-09-10']);
      onChange.mockReset();

      // Force close and open again
      rerender(renderDemo(false));
      fireEvent.blur(document.querySelector('.rc-picker-panel-container'));
      await waitFakeTimer();

      rerender(renderDemo(true));
      fireEvent.blur(document.querySelector('.rc-picker-panel-container'));
      await waitFakeTimer();

      fireEvent.focus(document.querySelector('.rc-picker-panel-container'));
      selectCell(7);
      selectCell(11);

      expect(onChange).toHaveBeenCalledWith(expect.anything(), ['1990-09-07', '1990-09-11']);
    });

    it('control mode expect onOpenChange trigger correct', async () => {
      const onChange = jest.fn();
      const onOpenChange = jest.fn();
      render(<DayRangePicker open onChange={onChange} onOpenChange={onOpenChange} />);

      await waitFakeTimer();

      fireEvent.focus(document.querySelector('.rc-picker-panel-container'));
      selectCell(5);
      selectCell(10);

      expect(onChange).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('components', () => {
    it('panel', () => {
      render(
        <DayRangePicker
          picker="time"
          components={{
            time: () => <h1 className="bamboo">Hello</h1>,
          }}
          open
        />,
      );

      expect(document.querySelector('.bamboo').textContent).toEqual('Hello');
    });

    it('input', () => {
      const Input = React.forwardRef<HTMLInputElement, React.HTMLAttributes<HTMLInputElement>>(
        (props, ref) => <input {...props} ref={ref} data-id="input-it" />,
      );

      const { container } = render(
        <DayRangePicker
          components={{
            input: Input,
          }}
        />,
      );

      expect(container.querySelector('input')).toHaveAttribute('data-id', 'input-it');
    });
  });

  describe('format', () => {
    const Demo = (props?: Partial<RangePickerProps<Dayjs>>) => (
      <DayRangePicker
        format={{
          format: 'YYYYMMDD',
          type: 'mask',
        }}
        {...props}
      />
    );

    it('key selection', () => {
      const { container } = render(<Demo />);

      const startInput = container.querySelectorAll<HTMLInputElement>('input')[0];

      // Year selection
      fireEvent.focus(startInput);

      expect(startInput.selectionStart).toEqual(0);
      expect(startInput.selectionEnd).toEqual(4);

      // Month selection
      fireEvent.keyDown(startInput, {
        key: 'ArrowRight',
      });

      expect(startInput.selectionStart).toEqual(4);
      expect(startInput.selectionEnd).toEqual(6);

      // Back to year selection
      fireEvent.keyDown(startInput, {
        key: 'ArrowLeft',
      });

      expect(startInput.selectionStart).toEqual(0);
      expect(startInput.selectionEnd).toEqual(4);
    });

    it('paste', async () => {
      const onChange = jest.fn();
      const { container } = render(<Demo onChange={onChange} />);

      const startInput = container.querySelectorAll<HTMLInputElement>('input')[0];
      const endInput = container.querySelectorAll<HTMLInputElement>('input')[1];

      fireEvent.focus(startInput);
      fireEvent.paste(startInput, {
        clipboardData: {
          getData: () => '20200903',
        },
      });
      fireEvent.keyDown(startInput, {
        key: 'Enter',
      });

      // End field
      await waitFakeTimer();
      fireEvent.focus(endInput);
      fireEvent.paste(endInput, {
        clipboardData: {
          getData: () => '20200905',
        },
      });
      fireEvent.keyDown(endInput, {
        key: 'Enter',
      });

      expect(onChange).toHaveBeenCalledWith(expect.anything(), ['20200903', '20200905']);
    });

    it('click to change selection cell', () => {
      const { container } = render(<Demo />);

      const startInput = container.querySelectorAll<HTMLInputElement>('input')[0];

      // Year selection
      fireEvent.focus(startInput);

      fireEvent.mouseDown(startInput);
      startInput.selectionStart = 5;
      fireEvent.mouseUp(startInput);
      expect(startInput.selectionStart).toEqual(4);
      expect(startInput.selectionEnd).toEqual(6);
    });

    it('blur to reset back text', async () => {
      const { container } = render(<Demo />);

      const firstInput = container.querySelectorAll<HTMLInputElement>('input')[0];

      fireEvent.focus(firstInput);
      expect(firstInput).toHaveValue('YYYYMMDD');

      fireEvent.blur(firstInput);
      await waitFakeTimer();
      expect(firstInput).toHaveValue('');
    });

    it('backspace to reset', async () => {
      const { container } = render(
        <Demo defaultValue={[getDay('2000-01-01'), getDay('2000-05-05')]} />,
      );

      const firstInput = container.querySelectorAll<HTMLInputElement>('input')[0];
      fireEvent.focus(firstInput);

      fireEvent.keyDown(firstInput, {
        key: 'Backspace',
      });

      expect(firstInput).toHaveValue('YYYY0101');
    });

    it('up and down', () => {
      const { container } = render(<Demo />);

      const firstInput = container.querySelectorAll<HTMLInputElement>('input')[0];
      fireEvent.focus(firstInput);

      fireEvent.keyDown(firstInput, {
        key: 'ArrowUp',
      });
      expect(firstInput).toHaveValue('1990MMDD');

      fireEvent.keyDown(firstInput, {
        key: 'ArrowDown',
      });
      expect(firstInput).toHaveValue('1989MMDD');
    });

    it('number key', () => {
      const { container } = render(<Demo />);

      const firstInput = container.querySelectorAll<HTMLInputElement>('input')[0];
      fireEvent.focus(firstInput);

      const fullText = '20000309';

      for (let i = 0; i < fullText.length; i += 1) {
        fireEvent.keyDown(firstInput, {
          key: fullText[i],
        });
      }

      expect(firstInput).toHaveValue('20000309');
    });
  });

  it('support required', () => {
    const { container } = render(<DayRangePicker required />);
    expect(container.querySelectorAll('input')[0]).toBeRequired();
    expect(container.querySelectorAll('input')[1]).toBeRequired();
  });

  it('renderExtraFooter not close', () => {
    const onOpenChange = jest.fn();
    const { container } = render(
      <DayRangePicker
        onOpenChange={onOpenChange}
        renderExtraFooter={() => <input className="bamboo" />}
      />,
    );

    openPicker(container);

    fireEvent.focus(document.querySelector('.bamboo'));

    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('halfway close should also trigger onCalendarChange', () => {
    const onCalendarChange = jest.fn();
    const { container } = render(<DayRangePicker onCalendarChange={onCalendarChange} />);

    openPicker(container);
    selectCell(5);

    expect(onCalendarChange).toHaveBeenCalled();
    onCalendarChange.mockReset();

    // Close
    closePicker(container);
    expect(onCalendarChange).toHaveBeenCalledWith([null, null], ['', ''], expect.anything());
  });

  it('showWeek', () => {
    const { container } = render(<DayRangePicker showWeek />);

    openPicker(container);

    expect(document.querySelector('.rc-picker-cell-week')).toBeTruthy();
    expect(
      document.querySelector('.rc-picker-date-panel.rc-picker-date-panel-show-week'),
    ).toBeTruthy();
  });

  it('focus event', () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();

    const { container } = render(<DayRangePicker onFocus={onFocus} onBlur={onBlur} />);

    openPicker(container);
    expect(onFocus).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ range: 'start' }),
    );
    onFocus.mockReset();

    closePicker(container);
    expect(onBlur).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ range: 'start' }),
    );
    onBlur.mockReset();

    // End field
    openPicker(container, 1);
    expect(onFocus).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ range: 'end' }),
    );

    closePicker(container, 1);
    expect(onBlur).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ range: 'end' }),
    );
  });

  it('pass tabIndex', () => {
    const { container } = render(
      <div>
        <DayRangePicker tabIndex={-1} />
      </div>,
    );

    expect(container.querySelector('input').getAttribute('tabIndex')).toBe('-1');
  });

  describe('7 days', () => {
    const SevenRangePicker = (props: Partial<RangePickerProps<Dayjs>>) => (
      <DayRangePicker
        {...props}
        disabledDate={(date, { from }) => {
          if (from) {
            return date.isBefore(from.add(-7, 'day')) || date.isAfter(from.add(7, 'day'));
          }
          return false;
        }}
      />
    );

    it('panel selection', () => {
      const onChange = jest.fn();
      const { container } = render(<SevenRangePicker onChange={onChange} />);

      openPicker(container);
      selectCell(15);

      expect(findCell(1)).toHaveClass('rc-picker-cell-disabled');
      expect(findCell(30)).toHaveClass('rc-picker-cell-disabled');

      selectCell(22);
      expect(onChange).toHaveBeenCalledWith(expect.anything(), ['1990-09-15', '1990-09-22']);
    });

    it('keyboard selection success', () => {
      const onChange = jest.fn();
      const { container } = render(<SevenRangePicker onChange={onChange} />);

      const startInput = container.querySelectorAll<HTMLInputElement>('input')[0];
      const endInput = container.querySelectorAll<HTMLInputElement>('input')[1];

      // Start
      fireEvent.focus(startInput);
      fireEvent.change(startInput, {
        target: {
          value: '2000-01-07',
        },
      });
      fireEvent.keyDown(startInput, {
        key: 'Enter',
      });

      // End
      fireEvent.focus(endInput);
      fireEvent.change(endInput, {
        target: {
          value: '2000-01-14',
        },
      });
      fireEvent.keyDown(endInput, {
        key: 'Enter',
      });

      expect(onChange).toHaveBeenCalledWith(expect.anything(), ['2000-01-07', '2000-01-14']);
    });

    it('keyboard selection out of range', () => {
      const onChange = jest.fn();
      const { container } = render(<SevenRangePicker onChange={onChange} />);

      const startInput = container.querySelectorAll<HTMLInputElement>('input')[0];
      const endInput = container.querySelectorAll<HTMLInputElement>('input')[1];

      // Start
      fireEvent.focus(startInput);
      fireEvent.change(startInput, {
        target: {
          value: '2000-01-07',
        },
      });
      fireEvent.keyDown(startInput, {
        key: 'Enter',
      });

      // End
      fireEvent.focus(endInput);
      fireEvent.change(endInput, {
        target: {
          value: '2001-01-08',
        },
      });
      fireEvent.keyDown(endInput, {
        key: 'Enter',
      });

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('minDate and maxDate', () => {
    it('correct disabled', () => {
      const { container } = render(
        <DayRangePicker minDate={dayjs()} maxDate={dayjs().add(1, 'month')} />,
      );

      openPicker(container);

      expect(document.querySelectorAll('.rc-picker-header-super-prev-btn')[0]).toBeDisabled();
      expect(document.querySelectorAll('.rc-picker-header-super-next-btn')[1]).toBeDisabled();

      expect(findCell(2)).toHaveClass('rc-picker-cell-disabled');
      expect(findCell(31, 1)).toHaveClass('rc-picker-cell-disabled');
    });

    it('auto switch pickerValue - minDate', () => {
      const { container } = render(<DayRangePicker minDate={dayjs().add(7, 'month')} />);

      openPicker(container);
      expect(document.querySelector('.rc-picker-header-view').textContent).toBe('1991年4月');
    });

    it('auto switch pickerValue - maxDate', () => {
      const { container } = render(<DayRangePicker maxDate={dayjs()} />);

      openPicker(container);
      expect(document.querySelector('.rc-picker-header-view').textContent).toBe('1990年8月');
    });

    it('typing should not exceed boundary', () => {
      const onChange = jest.fn();
      const { container } = render(
        <DayPicker minDate={getDay('2024-01-01')} onChange={onChange} />,
      );
      const inputEle = container.querySelector('input');

      // Out of range
      fireEvent.change(inputEle, {
        target: {
          value: '1/1/2000',
        },
      });
      fireEvent.keyDown(inputEle, {
        key: 'Enter',
      });
      expect(onChange).not.toHaveBeenCalled();

      // In range
      fireEvent.change(inputEle, {
        target: {
          value: '3/3/2024',
        },
      });
      fireEvent.keyDown(inputEle, {
        key: 'Enter',
      });
      expect(onChange).toHaveBeenCalled();
    });

    it('should disabled super prev correctly', () => {
      render(<DayRangePicker minDate={dayjs()} picker="year" open />);

      // Expect super prev disabled
      expect(document.querySelector('.rc-picker-header-super-prev-btn-disabled')).toBeDisabled();
    });
  });

  it('double click now button', () => {
    const onChange = jest.fn();
    const { container } = render(<DayRangePicker showNow onChange={onChange} />);

    openPicker(container);
    fireEvent.click(document.querySelector('.rc-picker-now-btn'));
    fireEvent.click(document.querySelector('.rc-picker-now-btn'));

    expect(onChange).toHaveBeenCalledWith(expect.anything(), ['1990-09-03', '1990-09-03']);
  });

  it('autoFocus', () => {
    const { container } = render(<DayRangePicker disabled={[true, false]} autoFocus />);
    expect(document.activeElement).toBe(container.querySelectorAll('input')[1]);
  });

  it('week panel not have date cell className', () => {
    const { unmount } = render(<DayRangePicker value={[dayjs(), dayjs().add(21, 'days')]} open />);
    expect(document.querySelector('.rc-picker-cell-range-start')).toBeTruthy();
    unmount();

    // Render with week panel
    render(<DayRangePicker picker="week" value={[dayjs(), dayjs().add(21, 'days')]} open />);
    expect(document.querySelector('.rc-picker-cell-range-start')).toBeFalsy();
  });

  it('click time should not modify date', async () => {
    const onChange = jest.fn();
    const { container } = render(
      <DayRangePicker showTime value={[dayjs(), dayjs().add(21, 'days')]} onChange={onChange} />,
    );

    openPicker(container);

    // Start
    fireEvent.click(document.querySelectorAll('li.rc-picker-time-panel-cell')[2]);
    fireEvent.click(document.querySelector('.rc-picker-ok button'));
    await waitFakeTimer();

    // End
    fireEvent.click(document.querySelectorAll('li.rc-picker-time-panel-cell')[2]);
    fireEvent.click(document.querySelector('.rc-picker-ok button'));
    await waitFakeTimer();

    expect(onChange).toHaveBeenCalledWith(expect.anything(), [
      '1990-09-03 02:00:00',
      '1990-09-24 02:00:00',
    ]);
  });

  it('disabledTime support `from` info', () => {
    const disabledTime = jest.fn(() => ({}));

    const { container } = render(
      <DayRangePicker
        showTime={{
          disabledTime,
        }}
      />,
    );

    openPicker(container);
    expect(disabledTime).toHaveBeenCalledWith(expect.anything(), 'start', {});
    disabledTime.mockReset();

    // Select
    selectCell(5);
    fireEvent.doubleClick(findCell(5));

    let existed = false;
    for (let i = 0; i < disabledTime.mock.calls.length; i += 1) {
      const args: any[] = disabledTime.mock.calls[i];
      if (
        args[1] === 'end' &&
        args[2]?.from?.format('YYYY-MM-DD HH:mm:ss') === '1990-09-05 00:00:00'
      ) {
        existed = true;
      }
    }
    expect(existed).toBeTruthy();
  });
});
