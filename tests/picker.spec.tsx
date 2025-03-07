/* eslint-disable @typescript-eslint/no-loop-func */
import { act, createEvent, fireEvent, render } from '@testing-library/react';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import moment from 'moment';
import 'moment/locale/zh-cn';
import KeyCode from 'rc-util/lib/KeyCode';
import { spyElementPrototypes } from 'rc-util/lib/test/domHook';
import { resetWarned } from 'rc-util/lib/warning';
import React from 'react';
import type { PickerRef } from '../src';
import type { PanelMode, PickerMode } from '../src/interface';
import enUS from '../src/locale/en_US';
import zhCN from '../src/locale/zh_CN';
import {
  // MomentPicker,
  DayPicker,
  DayRangePicker,
  clearValue,
  closePicker,
  confirmOK,
  findCell,
  getDay,
  isOpen,
  isSame,
  openPicker,
  selectCell,
  waitFakeTimer,
} from './util/commonUtil';

const fakeTime = getDay('1990-09-03 00:00:00').valueOf();

jest.mock('rc-util/lib/Dom/isVisible', () => {
  return () => true;
});

describe('Picker.Basic', () => {
  let errorSpy;
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(fakeTime);
  });

  beforeAll(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => null);
  });

  beforeEach(() => {
    errorSpy.mockReset();
    resetWarned();
  });
  afterAll(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  function keyDown(keyCode: number) {
    fireEvent.keyDown(document.querySelector('input'), {
      keyCode,
      which: keyCode,
      charCode: keyCode,
    });
  }

  function selectColumn(colIndex: number, rowIndex: number) {
    fireEvent.click(document.querySelectorAll('ul')[colIndex].querySelectorAll('li')[rowIndex]);
  }

  describe('mode', () => {
    const modeList: { mode: PanelMode; className: string }[] = [
      {
        mode: 'decade',
        className: '.rc-picker-decade-panel',
      },
      {
        mode: 'year',
        className: '.rc-picker-year-panel',
      },
      {
        mode: 'quarter',
        className: '.rc-picker-quarter-panel',
      },
      {
        mode: 'month',
        className: '.rc-picker-month-panel',
      },
      {
        mode: 'week',
        className: '.rc-picker-week-panel',
      },
      {
        mode: 'date',
        className: '.rc-picker-date-panel',
      },
      {
        mode: 'time' as any,
        className: '.rc-picker-time-panel',
      },
    ];

    modeList.forEach(({ mode, className }) => {
      it(mode, () => {
        render(<DayPicker mode={mode} open />);
        expect(document.querySelector(className)).toBeTruthy();
      });
    });
  });

  describe('picker', () => {
    const modeList: { picker: PickerMode; className: string }[] = [
      {
        picker: 'year',
        className: '.rc-picker-year-panel',
      },
      {
        picker: 'quarter',
        className: '.rc-picker-quarter-panel',
      },
      {
        picker: 'month',
        className: '.rc-picker-month-panel',
      },
      {
        picker: 'week',
        className: '.rc-picker-week-panel',
      },
      {
        picker: 'date',
        className: '.rc-picker-date-panel',
      },
      {
        picker: 'time',
        className: '.rc-picker-time-panel',
      },
    ];

    modeList.forEach(({ picker, className }) => {
      it(picker, () => {
        render(<DayPicker picker={picker as any} open />);
        expect(document.querySelector(className)).toBeTruthy();
      });
    });
  });

  describe('open', () => {
    it('should work', () => {
      const onOpenChange = jest.fn();
      const { container } = render(<DayPicker onOpenChange={onOpenChange} />);

      openPicker(container);
      expect(isOpen()).toBeTruthy();
      expect(onOpenChange).toHaveBeenCalledWith(true);
      onOpenChange.mockReset();

      closePicker(container);
      expect(isOpen()).toBeFalsy();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('controlled', () => {
      const { rerender } = render(<DayPicker open />);
      expect(isOpen()).toBeTruthy();

      rerender(<DayPicker open={false} />);
      expect(isOpen()).toBeFalsy();
    });

    it('fixed open need repeat trigger onOpenChange', () => {
      jest.useFakeTimers();
      const onOpenChange = jest.fn();
      render(<DayPicker onOpenChange={onOpenChange} open />);
      expect(onOpenChange).toHaveBeenCalledTimes(0);

      for (let i = 0; i < 10; i += 1) {
        act(() => {
          fireEvent.mouseDown(document.body);
          jest.runAllTimers();
        });
        expect(onOpenChange).toHaveBeenCalledTimes(i + 1);
      }
      act(() => {
        jest.runAllTimers();
      });
      jest.useRealTimers();
    });

    it('disabled should not open', () => {
      const { container } = render(<DayPicker open disabled />);
      expect(isOpen()).toBeFalsy();

      expect(container.querySelector('.rc-picker-disabled')).toBeTruthy();
    });
  });

  describe('value', () => {
    it('defaultValue', () => {
      const { container } = render(<DayPicker defaultValue={getDay('1989-11-28')} />);
      expect(container.querySelector('input').value).toEqual('11/28/1989');
    });

    it('uncontrolled', () => {
      const onChange = jest.fn();
      const { container } = render(<DayPicker onChange={onChange} />);
      openPicker(container);
      selectCell(11);
      closePicker(container);

      expect(onChange).toHaveBeenCalled();

      expect(isSame(onChange.mock.calls[0][0], '1990-09-11')).toBeTruthy();
      expect(onChange.mock.calls[0][1]).toEqual('9/11/1990');
      expect(container.querySelector('input').value).toEqual('9/11/1990');
    });

    it('controlled', () => {
      const onChange = jest.fn();
      const { container, rerender } = render(
        <DayPicker value={getDay('2011-11-11')} onChange={onChange} />,
      );

      openPicker(container);
      selectCell(3);
      closePicker(container);

      expect(isSame(onChange.mock.calls[0][0], '2011-11-03')).toBeTruthy();
      expect(document.querySelector('input').value).toEqual('11/11/2011');

      rerender(<DayPicker value={onChange.mock.calls[0][0]} onChange={onChange} />);

      expect(document.querySelector('input').value).toEqual('11/3/2011');

      // Raw change value
      rerender(<DayPicker value={getDay('1999-09-09')} onChange={onChange} />);

      expect(document.querySelector('input').value).toEqual('9/9/1999');
    });
  });

  describe('typing to change value', () => {
    [
      {
        name: 'basic',
        value: '11/11/2000',
        picker: 'date',
        selected: '.rc-picker-cell-selected',
        matchDate: '2000-11-11',
      },
      {
        name: 'week',
        picker: 'week',
        value: '2000-45th',
        matchDate: '2000-10-29',
        selected: '.rc-picker-week-panel-row-selected',
      },
    ].forEach(({ name, picker, value, matchDate, selected }) => {
      it(name, () => {
        const onChange = jest.fn();
        const { container } = render(
          <DayPicker onChange={onChange} picker={picker as any} allowClear />,
        );
        openPicker(container);
        fireEvent.focus(container.querySelector('input'));

        // Invalidate value
        fireEvent.change(container.querySelector('input'), {
          target: {
            value: 'abc',
          },
        });

        // Validate value
        fireEvent.change(container.querySelector('input'), {
          target: {
            value,
          },
        });

        expect(document.querySelector('input').value).toEqual(value);
        expect(onChange).not.toHaveBeenCalled();
        keyDown(KeyCode.ENTER);
        expect(onChange).toHaveBeenCalled();

        expect(isSame(onChange.mock.calls[0][0], matchDate, picker as any)).toBeTruthy();
        expect(document.querySelector(selected)).toBeTruthy();
        onChange.mockReset();

        clearValue();
        expect(onChange).toHaveBeenCalledWith(null, '');
        expect(isOpen()).toBeFalsy();

        openPicker(container);
        expect(document.querySelector(selected)).toBeFalsy();
      });
    });

    // https://github.com/ant-design/ant-design/issues/49400
    it('should not throw errow when input end year first', () => {
      const { container } = render(<DayRangePicker picker="year" />);
      openPicker(container);
      fireEvent.focus(container.querySelectorAll('input')[1]);
      expect(() => {
        fireEvent.change(container.querySelectorAll('input')[1], {
          target: {
            value: '2024',
          },
        });
      }).not.toThrow();
    });
  });

  describe('focus test', () => {
    let domMock: ReturnType<typeof spyElementPrototypes>;
    let focused = false;
    let blurred = false;

    beforeAll(() => {
      domMock = spyElementPrototypes(HTMLElement, {
        focus: () => {
          focused = true;
        },
        blur: () => {
          blurred = true;
        },
      });
    });

    beforeEach(() => {
      focused = false;
      blurred = false;
    });

    afterAll(() => {
      domMock.mockRestore();
    });

    it('function call', () => {
      const ref = React.createRef<PickerRef>();
      render(
        <div>
          <DayPicker ref={ref} />
        </div>,
      );

      ref.current!.focus();
      expect(focused).toBeTruthy();

      ref.current!.blur();
      expect(blurred).toBeTruthy();
    });

    it('style', () => {
      const onFocus = jest.fn();
      const onBlur = jest.fn();

      const { container } = render(
        <div>
          <DayPicker onFocus={onFocus} onBlur={onBlur} />
        </div>,
      );

      fireEvent.focus(container.querySelector('input'));
      expect(onFocus).toHaveBeenCalled();
      expect(document.querySelector('.rc-picker-focused')).toBeTruthy();

      fireEvent.blur(container.querySelector('input'));
      expect(onBlur).toHaveBeenCalled();
      expect(document.querySelector('.rc-picker-focused')).toBeFalsy();
    });

    it('pass tabIndex', () => {
      const { container } = render(
        <div>
          <DayPicker tabIndex={-1} />
        </div>,
      );

      expect(container.querySelector('input').getAttribute('tabIndex')).toBe('-1');
    });
  });

  // No need in latest version
  it.skip('block native mouseDown in panel to prevent focus changed', () => {
    const { container } = render(<DayPicker />);
    openPicker(container);

    const mouseDownEvent = createEvent.mouseDown(document.querySelector('td'));
    fireEvent(document.querySelector('td'), mouseDownEvent);

    expect(mouseDownEvent.defaultPrevented).toBeTruthy();
  });

  it('not fire blur when click inside and is in focus', () => {
    const onBlur = jest.fn();
    const { container } = render(
      <DayPicker onBlur={onBlur} suffixIcon={<div className="suffix-icon">X</div>} />,
    );

    const $input = container.querySelector('input');

    openPicker(container);
    $input.focus();
    keyDown(KeyCode.ESC);

    expect(document.activeElement).toBe($input);

    // Click suffix should preventDefault
    const $suffix = container.querySelector('.suffix-icon');
    const mouseDownEvent = createEvent.mouseDown($suffix);
    mouseDownEvent.preventDefault = jest.fn();
    fireEvent($suffix, mouseDownEvent);

    expect(mouseDownEvent.preventDefault).toHaveBeenCalled();
  });

  describe('full steps', () => {
    [
      {
        name: 'date',
        yearBtn: '.rc-picker-year-btn',
        finalPanel: '.rc-picker-date-panel',
        finalMode: 'date',
      },
      {
        name: 'datetime',
        yearBtn: '.rc-picker-year-btn',
        finalPanel: '.rc-picker-datetime-panel',
        finalMode: 'date',
        showTime: true,
      },
      {
        name: 'week',
        yearBtn: '.rc-picker-year-btn',
        finalPanel: '.rc-picker-week-panel',
        finalMode: 'week',
        picker: 'week',
      },
    ].forEach(({ name, finalMode, yearBtn, finalPanel, picker, showTime }) => {
      it(name, () => {
        const onChange = jest.fn();
        const onPanelChange = jest.fn();
        const { container } = render(
          <DayPicker
            picker={picker as any}
            showTime={showTime}
            onChange={onChange}
            onPanelChange={onPanelChange}
          />,
        );

        openPicker(container);

        function expectPanelChange(dateStr: string, mode: PanelMode) {
          expect(onPanelChange).toHaveBeenCalled();
          expect(isSame(onPanelChange.mock.calls[0][0], dateStr)).toBeTruthy();
          expect(onPanelChange.mock.calls[0][1]).toEqual(mode);
          onPanelChange.mockReset();
        }

        // Year
        onPanelChange.mockReset();
        fireEvent.click(document.querySelector(yearBtn));
        expectPanelChange('1990-09-03', 'year');

        // Decade
        onPanelChange.mockReset();
        fireEvent.click(document.querySelector('.rc-picker-decade-btn'));
        expectPanelChange('1990-09-03', 'decade');

        // Next page
        fireEvent.click(document.querySelector('.rc-picker-header-super-next-btn'));
        expectPanelChange('2090-09-03', 'decade');

        // Select decade
        selectCell('2010-2019');
        expectPanelChange('2010-09-03', 'year');

        // Select year
        selectCell('2019');
        expectPanelChange('2019-09-03', 'month');

        // Select month
        selectCell('Aug');
        expectPanelChange('2019-08-03', finalMode as any);

        // Select date
        selectCell('18');
        expect(onPanelChange).not.toHaveBeenCalled();

        expect(document.querySelector(finalPanel)).toBeTruthy();

        if (showTime) {
          confirmOK();
        }
        closePicker(container);
        expect(isSame(onChange.mock.calls[0][0], '2019-08-18')).toBeTruthy();
      });
    });

    // Origin `date > year > date`, now is always step by step
    it('date -> year -> month -> date', () => {
      const { container } = render(<DayPicker />);
      openPicker(container);
      fireEvent.click(document.querySelector('.rc-picker-year-btn'));
      selectCell(1990);
      selectCell('Jan');
      expect(document.querySelector('.rc-picker-date-panel')).toBeTruthy();
    });

    it('time', () => {
      const onChange = jest.fn();
      const onOk = jest.fn();
      const { container } = render(<DayPicker picker="time" onChange={onChange} onOk={onOk} />);
      openPicker(container);

      selectColumn(0, 13);
      selectColumn(1, 22);
      selectColumn(2, 33);

      expect(onOk).not.toHaveBeenCalled();
      confirmOK();
      expect(onOk).toHaveBeenCalled();
      expect(isSame(onOk.mock.calls[0][0], '1990-09-03 13:22:33', 'second')).toBeTruthy();
      expect(isSame(onChange.mock.calls[0][0], '1990-09-03 13:22:33', 'second')).toBeTruthy();
    });
  });

  it('renderExtraFooter', () => {
    const renderExtraFooter = jest.fn((mode) => <div>{mode}</div>);
    const { container } = render(
      <DayPicker showNow={false} renderExtraFooter={renderExtraFooter} />,
    );

    function matchFooter(mode: string) {
      expect(document.querySelector('.rc-picker-footer-extra').textContent).toEqual(mode);
      expect(renderExtraFooter.mock.calls[renderExtraFooter.mock.calls.length - 1][0]).toEqual(
        mode,
      );
    }

    // Date
    openPicker(container);
    matchFooter('date');

    // Month
    fireEvent.click(document.querySelector('.rc-picker-month-btn'));

    matchFooter('month');

    // Year
    fireEvent.click(document.querySelector('.rc-picker-year-btn'));

    matchFooter('year');
  });

  describe('showToday', () => {
    it('only works on date', () => {
      const onCalendarChange = jest.fn();
      const { container } = render(<DayPicker onCalendarChange={onCalendarChange} showToday />);
      openPicker(container);
      fireEvent.click(document.querySelector('.rc-picker-now-btn'));
      expect(isSame(onCalendarChange.mock.calls[0][0], '1990-09-03')).toBeTruthy();
    });

    it('disabled when in disabledDate', () => {
      const onCalendarChange = jest.fn();
      const { container } = render(
        <DayPicker onCalendarChange={onCalendarChange} disabledDate={() => true} showToday />,
      );
      openPicker(container);
      expect(document.querySelector('.rc-picker-now-btn')).toHaveClass(
        'rc-picker-now-btn-disabled',
      );
      fireEvent.click(document.querySelector('.rc-picker-now-btn'));
      expect(onCalendarChange).not.toHaveBeenCalled();
    });

    ['decade', 'year', 'quarter', 'month', 'week'].forEach((name) => {
      it(`not works on ${name}`, () => {
        const { container } = render(<DayPicker picker={name as any} showToday />);
        openPicker(container);
        expect(document.querySelector('.rc-picker-now-btn')).toBeFalsy();
      });
    });
  });

  it('prefix', () => {
    render(<DayPicker prefix={<span className="prefix" />} allowClear />);
    expect(document.querySelector('.prefix')).toBeInTheDocument();
  });

  it('icon', () => {
    expect(errorSpy).not.toHaveBeenCalled();
    render(
      <DayPicker
        defaultValue={getDay('1990-09-03')}
        suffixIcon={<span className="suffix-icon" />}
        clearIcon={<span className="suffix-icon" />}
        allowClear
      />,
    );
    expect(document.querySelector('.rc-picker-input')).toMatchSnapshot();
    expect(errorSpy).toHaveBeenCalledWith(
      'Warning: `clearIcon` will be removed in future. Please use `allowClear` instead.',
    );
  });

  it('inputRender', () => {
    render(<DayPicker inputRender={(props) => <input data-customize="yes" {...props} />} />);

    expect(document.querySelector('.rc-picker-input')).toMatchSnapshot();
  });

  describe('showNow', () => {
    it('datetime should display now', () => {
      const onCalendarChange = jest.fn();
      const { container } = render(<DayPicker onCalendarChange={onCalendarChange} showTime />);
      openPicker(container);
      fireEvent.click(document.querySelector('.rc-picker-now > a'));

      expect(
        isSame(onCalendarChange.mock.calls[0][0], '1990-09-03 00:00:00', 'second'),
      ).toBeTruthy();
    });

    it('date close showNow', () => {
      const onCalendarChange = jest.fn();
      const { container } = render(
        <DayPicker onCalendarChange={onCalendarChange} showNow={false} />,
      );
      openPicker(container);
      expect(document.querySelector('.rc-picker-now > a')).toBeFalsy();
    });

    it('datetime close showNow', () => {
      const onCalendarChange = jest.fn();
      const { container } = render(
        <DayPicker onCalendarChange={onCalendarChange} showTime showNow={false} />,
      );
      openPicker(container);
      expect(document.querySelector('.rc-picker-now > a')).toBeFalsy();
    });

    it('time should display now', () => {
      const onCalendarChange = jest.fn();
      const { container } = render(<DayPicker onCalendarChange={onCalendarChange} picker="time" />);

      openPicker(container);
      expect(document.querySelector('.rc-picker-header')).toBeFalsy();

      fireEvent.click(document.querySelector('.rc-picker-now > a'));

      expect(
        isSame(onCalendarChange.mock.calls[0][0], '1990-09-03 00:00:00', 'second'),
      ).toBeTruthy();
    });

    it("time shouldn't display now when showNow is false", () => {
      const onCalendarChange = jest.fn();
      const { container } = render(
        <DayPicker onCalendarChange={onCalendarChange} picker="time" showNow={false} />,
      );
      openPicker(container);
      expect(document.querySelector('.rc-picker-now > a')).toBeFalsy();
    });
  });

  describe('time step', () => {
    it('work with now', () => {
      jest.setSystemTime(getDay('1990-09-03 00:11:00').valueOf());
      const onCalendarChange = jest.fn();
      const { container } = render(
        <DayPicker onCalendarChange={onCalendarChange} picker="time" minuteStep={10} />,
      );

      openPicker(container);
      fireEvent.click(document.querySelector('.rc-picker-now > a'));

      expect(
        isSame(onCalendarChange.mock.calls[0][0], '1990-09-03 00:10:00', 'second'),
      ).toBeTruthy();
      jest.setSystemTime(getDay('1990-09-03 00:00:00').valueOf());
    });

    it('should show warning when hour step is invalid', () => {
      expect(errorSpy).not.toBeCalled();
      const { container } = render(<DayPicker picker="time" hourStep={9} />);
      openPicker(container);
      expect(errorSpy).toBeCalledWith(
        'Warning: `hourStep` 9 is invalid. It should be a factor of 24.',
      );
    });

    it('should change 12 hours format correctly', () => {
      const onTimeChange = jest.fn();
      const { getByText } = render(
        <DayPicker
          disabledTime={() => ({
            disabledHours: () => [0],
            disabledMinutes: (hour) => {
              onTimeChange(hour);
              return [0];
            },
            disabledSeconds: () => [0],
          })}
          value={getDay('2000-01-01 21:40:40')}
          format="YYYY-MM-DD hh:mm:ss A"
          use12Hours
          showTime
          open
        />,
      );

      fireEvent.click(getByText('PM'));

      expect(onTimeChange).not.toBeCalledWith(9);
      expect(onTimeChange).toBeCalledWith(21);
    });

    it('should show warning when minute step is invalid', () => {
      expect(errorSpy).not.toBeCalled();
      const { container } = render(<DayPicker picker="time" minuteStep={9} />);
      openPicker(container);
      expect(errorSpy).toBeCalledWith(
        'Warning: `minuteStep` 9 is invalid. It should be a factor of 60.',
      );
    });

    it('should show warning when second step is invalid', () => {
      expect(errorSpy).not.toBeCalled();
      const { container } = render(<DayPicker picker="time" secondStep={9} />);
      openPicker(container);
      expect(errorSpy).toBeCalledWith(
        'Warning: `secondStep` 9 is invalid. It should be a factor of 60.',
      );
    });

    // https://github.com/ant-design/ant-design/issues/40914
    ['hour', 'minute', 'second'].forEach((unit, index) => {
      it(`should show integer when step is not integer (${unit})`, () => {
        const props = {
          [`${unit}Step`]: 5.5,
        };
        const { container } = render(<DayPicker picker="time" {...props} />);
        openPicker(container);

        const column = document.querySelector(
          `.rc-picker-time-panel-column:nth-child(${index + 1})`,
        );
        expect(column).toBeTruthy();

        const cells = column.querySelectorAll('.rc-picker-time-panel-cell-inner');
        cells.forEach((cell) => {
          expect(Number.isInteger(Number(cell.textContent))).toBeTruthy();
        });
      });
    });

    it('should work when hourStep < 0', () => {
      // @ts-ignore
      const { container } = render(<DayPicker picker="time" hourStep={-1} />);
      openPicker(container);
      expect(document.querySelectorAll('.rc-picker-time-panel-column')[0].children.length).toBe(24);
    });
  });

  it('pass data- & aria- & role', () => {
    const { container } = render(<DayPicker data-test="233" aria-label="3334" role="search" />);

    expect(container).toMatchSnapshot();
  });

  it('support name & autoComplete prop', () => {
    const { container } = render(<DayPicker name="bamboo" autoComplete="on" />);

    expect(container.querySelector('input')).toHaveAttribute('name', 'bamboo');
    expect(container.querySelector('input')).toHaveAttribute('autoComplete', 'on');
  });

  it('blur should reset invalidate text', async () => {
    const { container } = render(<DayPicker />);
    openPicker(container);
    fireEvent.change(container.querySelector('input'), {
      target: {
        value: 'Invalidate',
      },
    });
    closePicker(container);

    await waitFakeTimer();

    expect(document.querySelector('input').value).toEqual('');
  });

  it('should render correctly in rtl', () => {
    const { container } = render(<DayPicker direction="rtl" allowClear />);
    expect(container).toMatchSnapshot();

    openPicker(container);
    expect(document.querySelector('.rc-picker-dropdown-rtl')).toBeTruthy();
  });

  it('week picker show correct year', () => {
    const { container } = render(<DayPicker value={getDay('2019-12-31')} picker="week" />);

    expect(container.querySelector('input').value).toEqual('2020-1st');
  });

  it('Picker should open when click inside', () => {
    const onClick = jest.fn();
    render(<DayPicker onClick={onClick} />);
    const inputElement = document.querySelector('input');
    inputElement.focus = jest.fn();

    fireEvent.click(document.querySelector('.rc-picker'));
    expect(inputElement.focus).toHaveBeenCalled();
    expect(isOpen()).toBeTruthy();

    expect(onClick).toHaveBeenCalled();
  });

  it('not open when disabled', () => {
    const { rerender } = render(<DayPicker disabled />);
    fireEvent.click(document.querySelector('.rc-picker'));
    expect(isOpen()).toBeFalsy();

    rerender(<DayPicker disabled={false} />);
    expect(isOpen()).toBeFalsy();
  });

  it('not open when mouseup', () => {
    render(<DayPicker />);
    const inputElement = document.querySelector('input');
    inputElement.focus = jest.fn();

    fireEvent.mouseUp(document.querySelector('.rc-picker'));
    expect(inputElement.focus).toHaveBeenCalledTimes(0);
    expect(isOpen()).toBeFalsy();
  });

  it('defaultOpenValue in timePicker', () => {
    resetWarned();
    const onChange = jest.fn();
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = render(
      <DayPicker
        picker="time"
        defaultOpenValue={getDay('2000-01-01 00:10:23')}
        onChange={onChange}
      />,
    );

    openPicker(container);
    fireEvent.click(document.querySelector('.rc-picker-ok button'));

    expect(isSame(onChange.mock.calls[0][0], '2000-01-01 00:10:23')).toBeTruthy();

    errSpy.mockRestore();
  });

  it('close to reset', () => {
    const { container } = render(<DayPicker defaultValue={getDay('2000-01-01')} />);

    openPicker(container);
    fireEvent.change(document.querySelector('input'), {
      target: {
        value: 'aaaaa',
      },
    });
    expect(document.querySelector('input').value).toEqual('aaaaa');

    closePicker(container);
    expect(document.querySelector('input').value).toEqual('1/1/2000');
  });

  it('switch picker should change format', () => {
    const { rerender } = render(
      <DayPicker picker="date" showTime defaultValue={getDay('1999-09-03')} />,
    );
    expect(document.querySelector('input').value).toEqual('1999-09-03 00:00:00');

    [
      ['date', '9/3/1999'],
      ['month', '1999-09'],
      ['quarter', '1999-Q3'],
      ['year', '1999'],
    ].forEach(([picker, text]) => {
      rerender(
        <DayPicker picker={picker as any} showTime={false} defaultValue={getDay('1999-09-03')} />,
      );

      expect(document.querySelector('input').value).toEqual(text);
    });
  });

  it('id', () => {
    const { container } = render(<DayPicker id="light" />);
    expect(container.querySelector('input').id).toEqual('light');
  });

  it('dateRender', () => {
    render(<DayPicker open dateRender={(date) => date.format('YYYY-MM-DD')} />);
    const tdList = document.querySelectorAll('tbody td');
    expect(tdList[tdList.length - 1].textContent).toEqual('1990-10-06');
  });

  it('format', () => {
    const { container } = render(<DayPicker format={['YYYYMMDD', 'YYYY-MM-DD']} />);
    openPicker(container);
    fireEvent.change(container.querySelector('input'), {
      target: {
        value: '2000-01-01',
      },
    });
    closePicker(container);
    expect(document.querySelector('input').value).toEqual('20000101');
  });

  it('custom format', () => {
    const { container } = render(
      <DayPicker
        allowClear
        defaultValue={getDay('2020-09-17')}
        format={[(val: Dayjs) => `custom format:${val.format('YYYYMMDD')}`, 'YYYY-MM-DD']}
      />,
    );
    expect(document.querySelector('input')).toHaveAttribute('readOnly');
    openPicker(container);
    selectCell(24);
    closePicker(container);
    expect(document.querySelector('input').value).toEqual('custom format:20200924');

    // clear
    clearValue();
    expect(document.querySelector('input').value).toEqual('');
  });

  it('custom clear icon', () => {
    render(
      <DayPicker
        allowClear={{ clearIcon: <span className="custom-clear">clear</span> }}
        defaultValue={getDay('2020-09-17')}
      />,
    );

    // clear
    expect(document.querySelector('.custom-clear')).toBeTruthy();
    clearValue();
    expect(document.querySelector('input').value).toEqual('');
  });

  it('panelRender', () => {
    render(<DayPicker open panelRender={() => <h1>Light</h1>} />);
    expect(document.querySelector('.rc-picker')).toMatchSnapshot();
  });

  it('change panel when `picker` changed', () => {
    const { rerender } = render(<DayPicker open picker="week" />);
    expect(document.querySelector('.rc-picker-week-panel')).toBeTruthy();
    rerender(<DayPicker open picker="month" />);

    expect(document.querySelector('.rc-picker-week-panel')).toBeFalsy();
    expect(document.querySelector('.rc-picker-month-panel')).toBeTruthy();
  });

  describe('hover value', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should restore when leave', () => {
      render(<DayPicker open defaultValue={getDay('2020-07-22')} />);
      const cell = findCell(24);
      fireEvent.mouseEnter(cell);
      jest.runAllTimers();

      expect(document.querySelector('input').value).toBe('7/24/2020');
      expect(document.querySelector('.rc-picker-input')).toHaveClass('rc-picker-input-placeholder');

      fireEvent.mouseLeave(cell);
      jest.runAllTimers();

      expect(document.querySelector('input').value).toBe('7/22/2020');
      expect(document.querySelector('.rc-picker-input')).not.toHaveClass(
        'rc-picker-input-placeholder',
      );
    });

    it('should restore after selecting cell', () => {
      const { container } = render(<DayPicker defaultValue={getDay('2020-07-22')} />);
      openPicker(container);
      const cell = findCell(24);
      // cell.simulate('mouseEnter');
      fireEvent.mouseEnter(cell);
      jest.runAllTimers();

      expect(document.querySelector('input').value).toBe('7/24/2020');
      expect(document.querySelector('.rc-picker-input')).toHaveClass('rc-picker-input-placeholder');

      selectCell(24);
      expect(document.querySelector('input').value).toBe('7/24/2020');
      expect(document.querySelector('.rc-picker-input')).not.toHaveClass(
        'rc-picker-input-placeholder',
      );
    });

    it('change value when hovering', () => {
      const { container } = render(<DayPicker defaultValue={getDay('2020-07-22')} />);
      openPicker(container);
      const cell = findCell(24);
      fireEvent.mouseEnter(cell);
      jest.runAllTimers();

      expect(document.querySelector('input').value).toBe('7/24/2020');
      expect(document.querySelector('.rc-picker-input')).toHaveClass('rc-picker-input-placeholder');

      fireEvent.mouseLeave(cell);
      fireEvent.change(container.querySelector('input'), {
        target: {
          value: '2020-07-23',
        },
      });

      expect(document.querySelector('input').value).toBe('2020-07-23');
      expect(document.querySelector('.rc-picker-input')).not.toHaveClass(
        'rc-picker-input-placeholder',
      );

      closePicker(container);
      expect(document.querySelector('input').value).toBe('7/22/2020');
      expect(document.querySelector('.rc-picker-input')).not.toHaveClass(
        'rc-picker-input-placeholder',
      );
    });
  });

  describe('time picker open to scroll', () => {
    let domMock: ReturnType<typeof spyElementPrototypes>;
    let triggered = false;

    beforeAll(() => {
      domMock = spyElementPrototypes(HTMLElement, {
        offsetTop: {
          get() {
            const childList = Array.from(this.parentNode?.childNodes || []);
            return childList.indexOf(this) * 30;
          },
        },

        scrollTop: {
          get: () => 0,
          set: () => {
            triggered = true;
          },
        },
      });
    });

    beforeEach(() => {
      triggered = false;
    });

    afterAll(() => {
      domMock.mockRestore();
    });

    it('work', async () => {
      jest.useFakeTimers();
      const { unmount } = render(
        <DayPicker picker="time" defaultValue={getDay('2020-07-22 09:03:28')} open />,
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(triggered).toBeTruthy();

      jest.useRealTimers();
      unmount();
    });

    it('not repeat scroll if disabledTime return same value', () => {
      const getDisabledTimeFn =
        (num = 10) =>
        () => ({
          disabledHours: () => [num],
          disabledMinutes: () => [num],
          disabledSeconds: () => [num],
        });

      const renderDemo = (disabledTime: any) => (
        <DayPicker
          picker="time"
          defaultValue={getDay('2020-07-22 09:03:28')}
          open
          disabledTime={disabledTime}
        />
      );

      const { rerender } = render(renderDemo(getDisabledTimeFn()));

      act(() => {
        jest.advanceTimersByTime(1000);
        jest.clearAllTimers();
      });
      expect(triggered).toBeTruthy();

      // New disabledTime
      triggered = false;
      renderDemo(getDisabledTimeFn());

      act(() => {
        jest.advanceTimersByTime(1000);
        jest.clearAllTimers();
      });
      expect(triggered).toBeFalsy();

      // New disabledTime but different disabled value
      triggered = false;
      rerender(renderDemo(getDisabledTimeFn(11)));

      act(() => {
        jest.advanceTimersByTime(1000);
        jest.clearAllTimers();
      });
      expect(triggered).toBeTruthy();
    });
  });

  describe('prevent default on keydown', () => {
    it('should open picker panel if no prevent default', () => {
      const { container } = render(<DayPicker />);

      closePicker(container);
      keyDown(KeyCode.ENTER);
      expect(isOpen()).toBeTruthy();
    });

    it('should not open if prevent default is called', () => {
      const onKeyDown = jest.fn((event: React.KeyboardEvent) => {
        if (event.which === 13) {
          event.preventDefault();
        }
      });
      const { container } = render(<DayPicker onKeyDown={onKeyDown} />);

      openPicker(container);
      expect(isOpen()).toBeTruthy();

      keyDown(KeyCode.ESC);
      act(() => {
        jest.runAllTimers();
      });

      expect(onKeyDown).toHaveBeenCalled();
      expect(isOpen()).toBeFalsy();
      onKeyDown.mockClear();

      keyDown(KeyCode.ENTER);
      expect(onKeyDown).toHaveBeenCalled();
      expect(isOpen()).toBeFalsy();
    });
  });

  it('disabledDate should not crash', () => {
    const { container } = render(<DayPicker open disabledDate={(d) => d.isAfter(Date.now())} />);
    fireEvent.change(container.querySelector('input'), {
      target: { value: moment().add(1, 'year').format('YYYY-MM-DD') },
    });

    keyDown(KeyCode.ENTER);
  });

  it('presets', () => {
    const onChange = jest.fn();

    render(
      <DayPicker
        onChange={onChange}
        open
        presets={[{ label: 'Bamboo', value: dayjs().add(1, 'day') }]}
      />,
    );

    const presetEle = document.querySelector('.rc-picker-presets li');
    expect(document.querySelector('.rc-picker-presets li').textContent).toBe('Bamboo');

    // Hover
    fireEvent.mouseEnter(presetEle);
    expect(findCell(4)).toHaveClass('rc-picker-cell-hover');

    // Click
    fireEvent.click(document.querySelector('.rc-picker-presets li'));
    expect(onChange.mock.calls[0][0].format('YYYY-MM-DD')).toEqual('1990-09-04');
  });

  it('presets support callback', () => {
    const onChange = jest.fn();
    const mockPresetValue = jest.fn().mockImplementationOnce(() => getDay('2000-09-03'));

    render(
      <DayPicker
        onChange={onChange}
        open
        presets={[
          {
            label: 'Bamboo',
            value: mockPresetValue,
          },
        ]}
      />,
    );

    const firstPreset = document.querySelector('.rc-picker-presets li');
    expect(firstPreset.textContent).toBe('Bamboo');

    fireEvent.click(firstPreset);

    expect(mockPresetValue).toHaveBeenCalled();
    expect(onChange.mock.calls[0][0].format('YYYY-MM-DD')).toEqual('2000-09-03');

    mockPresetValue.mockImplementationOnce(() => getDay('2023-05-01 12:34:56'));

    fireEvent.click(firstPreset);

    expect(mockPresetValue).toBeCalledTimes(2);
    expect(onChange).toBeCalledTimes(2);

    expect(onChange.mock.calls[1][0].format('YYYY-MM-DD HH:mm:ss')).toEqual('2023-05-01 12:34:56');
  });

  it('switch picker locale should reformat value', () => {
    const { container, rerender } = render(
      <DayPicker value={getDay('2011-11-11')} format={'dddd'} locale={enUS} />,
    );
    expect(container.querySelector('input').value).toEqual('Friday');

    // Switch locale
    moment.locale('zh-cn');
    rerender(<DayPicker value={getDay('2011-11-11')} format={'dddd'} locale={zhCN} />);
    expect(container.querySelector('input').value).toEqual('星期五');

    // Reset locale
    moment.locale('en');
  });

  it('select time directly in dateTime to find validate time', () => {
    const rangeNum = (start: number, end: number) => {
      const list: number[] = [];
      for (let i = start; i <= end; i += 1) {
        list.push(i);
      }

      return list;
    };

    const { container } = render(
      <DayPicker
        showTime
        disabledHours={() => rangeNum(0, 6)}
        disabledSeconds={() => rangeNum(0, 20)}
      />,
    );

    openPicker(container);

    // Select minute
    selectColumn(1, 5);

    expect(container.querySelector('input')).toHaveValue('1990-09-03 07:05:21');
  });

  it('customize `popupPlacement`', () => {
    render(
      <DayPicker
        open
        placement="notExist"
        builtinPlacements={{
          notExist: {
            points: ['tl', 'bl'],
          },
        }}
      />,
    );

    expect(document.querySelector('.rc-picker-dropdown-placement-notExist')).toBeTruthy();
  });

  describe('disabledTime should block submit', () => {
    const propsNames: string[] = [
      'disabledHours',
      'disabledMinutes',
      'disabledSeconds',
      'disabledMilliseconds',
    ];

    propsNames.forEach((proPname) => {
      it(proPname, () => {
        const onChange = jest.fn();

        const { container } = render(
          <DayPicker
            onChange={onChange}
            showTime={{
              disabledTime: () => ({ [proPname]: () => [0] }),
            }}
            format="YYYY-MM-DD HH:mm:ss.SSS"
          />,
        );
        const inputEle = container.querySelector('input');

        // Invalid time
        fireEvent.change(inputEle, {
          target: { value: '2020-09-17 00:00:00.000' },
        });
        fireEvent.keyDown(inputEle, {
          keyCode: KeyCode.ENTER,
        });
        expect(onChange).not.toHaveBeenCalled();

        // Valid time
        fireEvent.change(inputEle, {
          target: { value: '2020-09-17 01:01:01.001' },
        });
        fireEvent.keyDown(inputEle, {
          keyCode: KeyCode.ENTER,
        });
        expect(onChange).toHaveBeenCalled();
      });
    });
  });

  it('pickerValue change', () => {
    const onPickerValueChange = jest.fn();
    const { container } = render(<DayPicker onPickerValueChange={onPickerValueChange} />);

    fireEvent.change(container.querySelector('input'), {
      target: {
        value: '11/11/1888',
      },
    });
    expect(onPickerValueChange).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        mode: 'date',
      }),
    );
  });

  it('classNames.popup', () => {
    render(
      <DayPicker
        classNames={{
          popup: 'bamboo',
        }}
        open
      />,
    );

    expect(document.querySelector('.rc-picker-dropdown')).toHaveClass('bamboo');
  });

  it('showTime config should have format', () => {
    render(
      <DayPicker
        showTime={{
          format: undefined,
        }}
        open
        defaultValue={getDay('2000-01-01 03:05:07')}
      />,
    );

    expect(document.querySelector('.rc-picker-time-panel .rc-picker-header').textContent).toBe(
      '03:05:07',
    );
  });

  it('select date should keep time with showTime', () => {
    const onCalendarChange = jest.fn();
    const { container } = render(<DayPicker showTime onCalendarChange={onCalendarChange} />);

    openPicker(container);

    // Select time column
    selectColumn(0, 13);
    expect(onCalendarChange).toHaveBeenCalledWith(
      expect.anything(),
      '1990-09-03 13:00:00',
      expect.anything(),
    );

    // Hover date
    const cell = findCell(18);
    fireEvent.mouseEnter(cell);
    expect(container.querySelector('input')).toHaveValue('1990-09-18 13:00:00');

    // Click to trigger onChange
    fireEvent.click(cell);
    expect(onCalendarChange).toHaveBeenCalledWith(
      expect.anything(),
      '1990-09-18 13:00:00',
      expect.anything(),
    );
  });

  it('showTime kk format', () => {
    const { container } = render(
      <DayPicker picker="time" defaultValue={getDay('2000-01-01 00:23:00')} format="kk:mm" open />,
    );
    expect(container.querySelector('input')).toHaveValue('24:23');

    expect(document.querySelectorAll('.rc-picker-time-panel-column')).toHaveLength(2);
  });

  it('autoFocus', () => {
    const { container } = render(<DayPicker autoFocus />);
    expect(document.activeElement).toBe(container.querySelector('input'));
  });

  it('all not showXXX should be fallback to show', () => {
    render(
      <DayPicker
        showTime
        open
        format={['YYYY-MM-DD']}
        defaultValue={getDay('2000-01-01 01:02:03')}
      />,
    );

    expect(document.querySelectorAll('.rc-picker-header-view')[1].textContent).toEqual('01:02:03');
  });

  it('use12Hours has longer size', () => {
    const { container } = render(
      <DayPicker use12Hours picker="time" defaultValue={getDay('18:03:04')} />,
    );

    const inputEle = container.querySelector('input');
    expect(inputEle.size).toBe(12);
    expect(inputEle).toHaveValue('06:03:04 PM');
  });

  it('compatible with disabledTime on prop directly', () => {
    render(
      <DayPicker
        disabledTime={() => ({
          disabledHours: () => [0],
        })}
        hideDisabledOptions
        showTime
        open
      />,
    );

    expect(document.querySelectorAll('.rc-picker-time-panel-column:first-child li')).toHaveLength(
      23,
    );
    expect(
      document.querySelector('.rc-picker-time-panel-column:first-child li').textContent,
    ).toEqual('01');
  });

  describe('time with defaultPickerValue', () => {
    beforeEach(() => {
      jest.useFakeTimers().setSystemTime(getDay('1990-09-03 01:03:05').valueOf());
    });

    it('time picker should align to 0', () => {
      const onCalendarChange = jest.fn();
      render(<DayPicker picker="time" open showNow onCalendarChange={onCalendarChange} />);

      const submitBtn = document.querySelector('.rc-picker-ok button');
      expect(submitBtn).toHaveAttribute('disabled');

      selectCell('00');
      expect(submitBtn).not.toHaveAttribute('disabled');
      expect(onCalendarChange).toHaveBeenCalledWith(
        expect.anything(),
        '00:00:00',
        expect.anything(),
      );
      onCalendarChange.mockReset();

      fireEvent.click(document.querySelector('.rc-picker-now-btn'));
      expect(submitBtn).not.toHaveAttribute('disabled');
      expect(onCalendarChange).toHaveBeenCalledWith(
        expect.anything(),
        '01:03:05',
        expect.anything(),
      );
    });

    function testPropsName(propName: string) {
      it(`${propName} with showTime`, () => {
        const onCalendarChange = jest.fn();
        render(
          <DayPicker
            showTime={{
              [propName]: dayjs(),
            }}
            open
            onCalendarChange={onCalendarChange}
            defaultPickerValue={dayjs()}
          />,
        );

        selectCell(15);
        expect(onCalendarChange).toHaveBeenCalledWith(
          expect.anything(),
          '1990-09-15 01:03:05',
          expect.anything(),
        );
      });
    }

    testPropsName('defaultValue');
    testPropsName('defaultOpenValue');
  });

  it('auto switch pickerValue - maxDate', () => {
    const { container } = render(<DayPicker maxDate={dayjs('1989-01-01')} />);

    openPicker(container);
    expect(document.querySelector('.rc-picker-header-view').textContent).toBe('Jan1989');
  });
});
