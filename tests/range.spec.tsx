// Note: zombieJ refactoring

import { act, createEvent, fireEvent, render } from '@testing-library/react';
import { createRoot } from 'react-dom/client';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import KeyCode from 'rc-util/lib/KeyCode';
import { spyElementPrototypes } from 'rc-util/lib/test/domHook';
import { resetWarned } from 'rc-util/lib/warning';
import React from 'react';
import type { PickerRef, RangePickerProps } from '../src';
import type { PickerMode } from '../src/interface';
import {
  DayRangePicker,
  clearValue,
  clickButton,
  closePicker,
  findCell,
  getDay,
  inputValue,
  isOpen,
  isSame,
  openPicker,
  selectCell,
  waitFakeTimer,
} from './util/commonUtil';

global.error = console.error;

describe('Picker.Range', () => {
  let errorSpy;

  beforeAll(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => null);
  });

  function matchValues(container: HTMLElement, value1: string, value2: string) {
    expect(container.querySelectorAll('input')[0].value).toEqual(value1);
    expect(container.querySelectorAll('input')[1].value).toEqual(value2);
  }

  function findLast(container: HTMLElement | Document, selector: string) {
    const list = container.querySelectorAll(selector);
    return list[list.length - 1];
  }

  beforeEach(() => {
    errorSpy.mockReset();
    resetWarned();
    global.scrollCalled = false;
    jest.useFakeTimers().setSystemTime(getDay('1990-09-03 00:00:00').valueOf());
    document.body.innerHTML = '';
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  function keyDown(container: HTMLElement, index: number, keyCode: number) {
    fireEvent.keyDown(container.querySelectorAll('input')[index], {
      keyCode,
      which: keyCode,
      charCode: keyCode,
    });
  }

  describe('value', () => {
    it('defaultValue', () => {
      const { container } = render(
        <DayRangePicker defaultValue={[getDay('1989-11-28'), getDay('1990-09-03')]} />,
      );

      matchValues(container, '1989-11-28', '1990-09-03');
    });

    it('controlled', () => {
      const { container, rerender } = render(
        <DayRangePicker value={[getDay('1989-11-28'), getDay('1990-09-03')]} />,
      );

      matchValues(container, '1989-11-28', '1990-09-03');

      // Update
      rerender(<DayRangePicker value={[getDay('2000-01-01'), getDay('2011-12-12')]} />);

      matchValues(container, '2000-01-01', '2011-12-12');
    });

    it('uncontrolled', () => {
      const onChange = jest.fn();
      const onCalendarChange = jest.fn();
      const { container } = render(
        <DayRangePicker onChange={onChange} onCalendarChange={onCalendarChange} />,
      );

      // Start date
      openPicker(container);
      expect(onChange).not.toHaveBeenCalled();

      selectCell(13);
      expect(onChange).not.toHaveBeenCalled();

      expect(isSame(onCalendarChange.mock.calls[0][0][0], '1990-09-13')).toBeTruthy();
      expect(onCalendarChange.mock.calls[0][0][1]).toBeFalsy();
      expect(onCalendarChange.mock.calls[0][1]).toEqual(['1990-09-13', '']);

      // End date
      onCalendarChange.mockReset();
      selectCell(14);

      expect(onChange).toHaveBeenCalled();
      expect(isSame(onChange.mock.calls[0][0][0], '1990-09-13')).toBeTruthy();
      expect(isSame(onChange.mock.calls[0][0][1], '1990-09-14')).toBeTruthy();
      expect(onChange.mock.calls[0][1]).toEqual(['1990-09-13', '1990-09-14']);

      expect(isSame(onCalendarChange.mock.calls[0][0][0], '1990-09-13')).toBeTruthy();
      expect(isSame(onCalendarChange.mock.calls[0][0][1], '1990-09-14')).toBeTruthy();
      expect(onCalendarChange.mock.calls[0][1]).toEqual(['1990-09-13', '1990-09-14']);
    });
  });

  it('not re-order for given value', () => {
    const { container } = render(
      <DayRangePicker defaultValue={[getDay('1990-09-03'), getDay('1989-11-28')]} />,
    );

    matchValues(container, '1990-09-03', '1989-11-28');
  });

  describe('view is closed', () => {
    it('year', () => {
      const { container } = render(<DayRangePicker picker="year" />);
      openPicker(container);
      expect(document.querySelector('.rc-picker-footer')).toBeFalsy();
      expect(document.querySelectorAll('.rc-picker-header-view')[0].textContent).toEqual(
        '1990年-1999年',
      );
      expect(document.querySelectorAll('.rc-picker-header-view')[1].textContent).toEqual(
        '2000年-2009年',
      );
    });

    it('year with footer', () => {
      const { container } = render(
        <DayRangePicker renderExtraFooter={() => <p>footer</p>} picker="year" />,
      );
      openPicker(container);
      expect(document.querySelector('.rc-picker-footer-extra').textContent).toEqual('footer');
      expect(document.querySelectorAll('.rc-picker-header-view')[0].textContent).toEqual(
        '1990年-1999年',
      );
      expect(document.querySelectorAll('.rc-picker-header-view')[1].textContent).toEqual(
        '2000年-2009年',
      );
    });
  });

  describe('Can not select when part field disabled', () => {
    it('no selection of disabled start', () => {
      const { container } = render(
        <DayRangePicker
          disabled={[true, false]}
          defaultValue={[getDay('1990-01-15'), getDay('1990-02-15')]}
        />,
      );

      openPicker(container, 1);
      expect(findCell(14)).toHaveClass('rc-picker-cell-disabled');
    });

    it('no selection of disabled end', () => {
      const { container } = render(
        <DayRangePicker
          disabled={[false, true]}
          defaultValue={[getDay('1990-01-15'), getDay('1990-02-15')]}
        />,
      );

      openPicker(container, 0);
      expect(findCell(16, 1)).toHaveClass('rc-picker-cell-disabled');
    });
  });

  it('allowEmpty', () => {
    const onChange = jest.fn();
    const { container } = render(
      <DayRangePicker onChange={onChange} allowEmpty={[false, true]} allowClear />,
    );

    openPicker(container);
    selectCell(11);
    closePicker(container, 1);
    expect(onChange).toHaveBeenCalledWith([expect.anything(), null], ['1990-09-11', '']);

    clearValue();
    expect(onChange).toHaveBeenCalledWith(null, ['', '']);
    onChange.mockReset();

    // Not allow empty with startDate
    openPicker(container, 1);
    selectCell(23);
    closePicker(container, 1);
    expect(onChange).not.toHaveBeenCalled();
  });

  describe('disabled', () => {
    it('should no panel open with disabled', () => {
      const { baseElement } = render(<DayRangePicker disabled />);
      expect(baseElement.querySelectorAll('.rc-picker-input')).toHaveLength(2);
      fireEvent.click(baseElement.querySelector('.rc-picker-input'));
      expect(baseElement.querySelector('.rc-picker-dropdown')).toBeFalsy();
    });

    it('basic disabled check', () => {
      const { container } = render(<DayRangePicker disabled={[true, false]} />);
      expect(container.querySelectorAll('input')[0].disabled).toBeTruthy();
      expect(container.querySelectorAll('input')[1].disabled).toBeFalsy();
    });

    it('should close panel when finish choose panel and next is disabled with disabled = [false, true]/[true,false]', () => {
      const { baseElement } = render(<DayRangePicker disabled={[false, true]} />);
      expect(baseElement.querySelectorAll('.rc-picker-input')).toHaveLength(2);
      fireEvent.click(baseElement.querySelectorAll('.rc-picker-input')[0]);
      expect(baseElement.querySelector('.rc-picker-dropdown-hidden')).toBeFalsy();
      fireEvent.click(baseElement.querySelector('.rc-picker-cell-inner'));

      act(() => {
        jest.runAllTimers();
      });

      expect(baseElement.querySelector('.rc-picker-dropdown-hidden')).toBeTruthy();
    });

    it('should not be checked if the startDate is disabled', () => {
      const onChange = jest.fn();
      const { container } = render(
        <DayRangePicker
          disabled={[true, false]}
          defaultValue={[getDay('2024-10-28'), getDay('2024-11-20')]}
          disabledDate={(date: Dayjs) => date <= dayjs('2024-11-20').endOf('day')}
          onChange={onChange}
        />,
      );

      openPicker(container, 1);
      selectCell('21', 1);
      expect(onChange).toHaveBeenCalledWith(
        [expect.anything(), expect.anything()],
        ['2024-10-28', '2024-11-21'],
      );
    });
    it('should not be checked if the endDate is disabled', () => {
      const onChange = jest.fn();
      const { container } = render(
        <DayRangePicker
          disabled={[false, true]}
          defaultValue={[getDay('2024-10-28'), getDay('2024-11-20')]}
          disabledDate={(date: Dayjs) => date >= dayjs('2024-11-10').endOf('day')}
          onChange={onChange}
        />,
      );

      openPicker(container, 0);
      selectCell('21', 0);
      expect(onChange).toHaveBeenCalledWith(
        [expect.anything(), expect.anything()],
        ['2024-10-21', '2024-11-20'],
      );
    });

    it('should close panel when finish first choose with showTime = true and disabled = [false, true]', () => {
      const { baseElement } = render(<DayRangePicker showTime disabled={[false, true]} />);
      expect(baseElement.querySelectorAll('.rc-picker-input')).toHaveLength(2);
      fireEvent.click(baseElement.querySelectorAll('.rc-picker-input')[0]);
      expect(baseElement.querySelector('.rc-picker-dropdown-hidden')).toBeFalsy();
      fireEvent.click(baseElement.querySelector('.rc-picker-cell-inner'));
      fireEvent.click(baseElement.querySelector('.rc-picker-ok button'));

      act(() => {
        jest.runAllTimers();
      });

      expect(baseElement.querySelector('.rc-picker-dropdown-hidden')).toBeTruthy();
    });

    it('should close panel when finish second choose with showTime = true and disabled = [true, false]', () => {
      const { baseElement } = render(<DayRangePicker showTime disabled={[true, false]} />);
      expect(baseElement.querySelectorAll('.rc-picker-input')).toHaveLength(2);
      fireEvent.click(baseElement.querySelectorAll('.rc-picker-input')[1]);
      expect(baseElement.querySelector('.rc-picker-dropdown-hidden')).toBeFalsy();
      selectCell(11);
      fireEvent.click(baseElement.querySelector('.rc-picker-ok button'));

      act(() => {
        jest.runAllTimers();
      });

      expect(baseElement.querySelector('.rc-picker-dropdown-hidden')).toBeTruthy();
    });

    it('disabled should not open', () => {
      render(<DayRangePicker disabled open />);

      expect(isOpen()).toBeFalsy();
    });

    it('startDate will have disabledDate when endDate is not selectable', () => {
      const onChange = jest.fn();
      const { container } = render(
        <DayRangePicker
          disabled={[false, true]}
          defaultValue={[null, getDay('1990-09-22')]}
          onChange={onChange}
        />,
      );

      let cellNode: HTMLElement;

      // Disabled date
      openPicker(container);
      cellNode = selectCell(25, 1);
      expect(cellNode).toHaveClass('rc-picker-cell-disabled');
      expect(onChange).not.toHaveBeenCalled();

      // Enabled date
      openPicker(container);
      cellNode = selectCell(7);
      expect(cellNode).not.toHaveClass('rc-picker-cell-disabled');
      expect(onChange).toHaveBeenCalledWith(
        [expect.anything(), expect.anything()],
        ['1990-09-07', '1990-09-22'],
      );
    });

    it('null value with disabled', () => {
      // Should not warning with allowEmpty
      render(<DayRangePicker disabled={[false, true]} allowEmpty value={[null, null]} />);
      expect(errorSpy).not.toHaveBeenCalled();

      // Should warning
      render(<DayRangePicker disabled={[false, true]} value={[null, null]} />);

      expect(errorSpy).toHaveBeenCalledWith(
        'Warning: `disabled` should not set with empty `value`. You should set `allowEmpty` or `value` instead.',
      );
    });

    it('clear should trigger change', () => {
      const onChange = jest.fn();
      const { container } = render(
        <DayRangePicker
          disabled={[false, true]}
          defaultValue={[getDay('1990-01-01'), getDay('2000-11-11')]}
          onChange={onChange}
          allowClear
        />,
      );

      openPicker(container);
      clearValue();
      expect(isOpen()).toBeFalsy();
      expect(onChange.mock.calls[0][1]).toEqual(['', '2000-11-11']);
    });

    // https://github.com/ant-design/ant-design/issues/23726
    it('not fill when all disabled and no value', () => {
      const { container } = render(<DayRangePicker disabled />);
      expect(container.querySelectorAll('input')[0].value).toEqual('');
      expect(container.querySelectorAll('input')[1].value).toEqual('');
    });
  });

  function testRangePickerPresetRange(propsType: 'ranges' | 'presets') {
    const genProps = (ranges: Record<string, any>) => {
      const props: Partial<RangePickerProps<Dayjs>> = {};
      if (propsType === 'ranges') {
        // ranges is deprecated, but the case needs to be retained for a while
        props.ranges = ranges;
      } else if (propsType === 'presets') {
        props.presets = [];
        Object.entries(ranges).forEach(([label, value]) => {
          props.presets.push({ label, value });
        });
      }
      return props as RangePickerProps<Dayjs>;
    };

    it(`${propsType} work`, () => {
      const onChange = jest.fn();
      const { container } = render(
        <DayRangePicker
          {...genProps({
            test: [getDay('1989-11-28'), getDay('1990-09-03')],
            func: () => [getDay('2000-01-01'), getDay('2010-11-11')],
          })}
          onChange={onChange}
        />,
      );

      let testNode: HTMLElement;

      // Basic
      openPicker(container);
      testNode = document.querySelector('.rc-picker-presets li');
      expect(testNode.textContent).toEqual('test');
      // testNode.simulate('click');
      fireEvent.click(testNode);
      expect(onChange).toHaveBeenCalledWith(
        [expect.anything(), expect.anything()],
        ['1989-11-28', '1990-09-03'],
      );
      expect(isOpen()).toBeFalsy();

      // Function
      openPicker(container);
      testNode = document.querySelector('.rc-picker-presets li:last-child');
      expect(testNode.textContent).toEqual('func');
      // testNode.simulate('click');
      fireEvent.click(testNode);
      expect(onChange).toHaveBeenCalledWith(
        [expect.anything(), expect.anything()],
        ['2000-01-01', '2010-11-11'],
      );
      expect(isOpen()).toBeFalsy();
    });

    it(`${propsType} hover className`, () => {
      const { container } = render(
        <DayRangePicker
          {...genProps({
            now: [getDay('1990-09-11'), getDay('1990-09-13')],
          })}
        />,
      );

      openPicker(container);
      fireEvent.mouseEnter(document.querySelector('.rc-picker-presets li'));
      expect(findCell(11)).toHaveClass('rc-picker-cell-range-start');
      expect(findCell(12)).toHaveClass('rc-picker-cell-in-range');
      expect(findCell(13)).toHaveClass('rc-picker-cell-range-end');

      fireEvent.mouseLeave(document.querySelector('.rc-picker-presets li'));
      expect(findCell(11)).not.toHaveClass('rc-picker-cell-range-start');
      expect(findCell(12)).not.toHaveClass('rc-picker-cell-in-range');
      expect(findCell(13)).not.toHaveClass('rc-picker-cell-range-end');
    });
  }

  describe('ranges or presets', () => {
    testRangePickerPresetRange('ranges');
    testRangePickerPresetRange('presets');
  });

  it('placeholder', () => {
    const { container } = render(<DayRangePicker placeholder={['light', 'bamboo']} />);
    expect(container.querySelectorAll('input')[0].placeholder).toEqual('light');
    expect(container.querySelectorAll('input')[1].placeholder).toEqual('bamboo');
  });

  describe('defaultPickerValue', () => {
    it('defaultPickerValue works', () => {
      const { container } = render(
        <DayRangePicker defaultPickerValue={[getDay('1989-11-28'), getDay('1990-09-03')]} />,
      );

      openPicker(container);
      expect(document.querySelectorAll('.rc-picker-header-view')[0].textContent).toEqual(
        '1989年11月',
      );
      closePicker(container);

      openPicker(container, 1);
      expect(document.querySelectorAll('.rc-picker-header-view')[1].textContent).toEqual(
        '1990年10月',
      );
      closePicker(container, 1);
    });

    it('defaultPickerValue with showTime', () => {
      const startDate = getDay('1982-02-12');
      const endDate = getDay('1982-02-12');

      const { container } = render(
        <DayRangePicker defaultPickerValue={[startDate, endDate]} showTime />,
      );
      openPicker(container);
      expect(document.querySelector('.rc-picker-year-btn').textContent).toEqual(
        startDate.format('YYYY年'),
      );
    });

    it('defaultPickerValue with showTime should works when open panel', () => {
      const startDate = getDay('1982-02-12');
      const endDate = getDay('1982-02-12');

      const { container } = render(
        <DayRangePicker
          defaultValue={[startDate, endDate]}
          defaultPickerValue={[startDate, endDate]}
          showTime
        />,
      );
      expect(() => {
        openPicker(container);
      }).not.toThrow();
      expect(document.querySelector('.rc-picker-year-btn').textContent).toEqual(
        startDate.format('YYYY年'),
      );
    });
  });

  describe('focus test', () => {
    let domMock: ReturnType<typeof spyElementPrototypes>;
    let focused = false;
    let blurred = false;

    beforeAll(() => {
      domMock = spyElementPrototypes(HTMLElement, {
        focus(oriDesc: any, ...rest: any[]) {
          focused = true;

          // Call origin
          oriDesc.value.call(this, ...rest);
        },
        blur(oriDesc: any, ...rest: any[]) {
          blurred = true;

          // Call origin
          oriDesc.value.call(this, ...rest);
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
          <DayRangePicker ref={ref} />
        </div>,
      );

      ref.current!.focus();
      expect(focused).toBeTruthy();

      ref.current!.blur();
      expect(blurred).toBeTruthy();
    });

    it('not crash with showTime defaultValue', () => {
      const { container } = render(
        <>
          <DayRangePicker
            showTime={{
              defaultValue: [getDay('01:02:03'), getDay('05:06:07')],
            }}
          />
          <button tabIndex={0} />
        </>,
      );

      openPicker(container);
      selectCell(13);
      fireEvent.click(document.querySelector('.rc-picker-ok button'));
      selectCell(23);

      matchValues(container, '1990-09-13 01:02:03', '1990-09-23 05:06:07');
    });

    it('pass tabIndex', () => {
      const { container } = render(
        <div>
          <DayRangePicker tabIndex={-1} />
        </div>,
      );

      expect(container.querySelector('input').getAttribute('tabIndex')).toBe('-1');
    });
  });

  it('mode is array', () => {
    const { container } = render(<DayRangePicker mode={['year', 'month']} />);
    openPicker(container);
    expect(document.querySelector('.rc-picker-year-panel')).toBeTruthy();

    openPicker(container, 1);
    expect(document.querySelector('.rc-picker-month-panel')).toBeTruthy();
  });

  describe('onPanelChange is array args', () => {
    it('mode', () => {
      const onPanelChange = jest.fn();
      const { container } = render(
        <DayRangePicker mode={['month', 'year']} onPanelChange={onPanelChange} />,
      );

      openPicker(container);
      selectCell('2月');
      expect(isSame(onPanelChange.mock.calls[0][0][0], '1990-02-03'));
      expect(onPanelChange.mock.calls[0][1]).toEqual(['date', 'year']);

      closePicker(container);
      onPanelChange.mockReset();

      openPicker(container, 1);
      selectCell(1993);
      expect(isSame(onPanelChange.mock.calls[0][0][1], '1993', 'year'));
      expect(onPanelChange.mock.calls[0][1]).toEqual(['month', 'month']);
    });

    it('picker', () => {
      const onPanelChange = jest.fn();
      const { container } = render(<DayRangePicker picker="month" onPanelChange={onPanelChange} />);

      // First go to year panel
      openPicker(container);
      // document.querySelector('.rc-picker-year-btn').first().simulate('click');
      fireEvent.click(document.querySelector('.rc-picker-year-btn'));
      expect(isSame(onPanelChange.mock.calls[0][0][0], '1990-09-03'));
      expect(onPanelChange.mock.calls[0][1]).toEqual(['year', 'month']);

      // First nack to month panel
      onPanelChange.mockReset();
      selectCell(1993);
      expect(onPanelChange).toHaveBeenCalled();
      expect(isSame(onPanelChange.mock.calls[0][0][0], '1993-09-03'));
      expect(onPanelChange.mock.calls[0][1]).toEqual(['month', 'month']);

      // Last go to year panel
      closePicker(container);
      openPicker(container, 1);
      // document.querySelector('.rc-picker-year-btn').first().simulate('click');
      fireEvent.click(document.querySelector('.rc-picker-year-btn'));
      onPanelChange.mockReset();

      // Last nack to month panel
      selectCell(1998);
      expect(isSame(onPanelChange.mock.calls[0][0][1], '1998-09-03'));
      expect(onPanelChange.mock.calls[0][1]).toEqual(['month', 'month']);
    });

    it('should render correctly in rtl', () => {
      const { container } = render(<DayRangePicker direction="rtl" />);
      expect(container).toMatchSnapshot();
    });

    it('should render correctly in placement right', () => {
      const { container } = render(<DayRangePicker placement="bottomRight" />);
      openPicker(container);

      expect(container).toMatchSnapshot();
      expect(document.querySelector('.rc-picker-dropdown-placement-bottomRight')).toBeTruthy();
    });
  });

  it('type can not change before start time', () => {
    const onChange = jest.fn();
    const { container } = render(
      <DayRangePicker
        defaultValue={[getDay('2000-01-15'), getDay('2000-01-16')]}
        onChange={onChange}
      />,
    );

    fireEvent.change(container.querySelectorAll('input')[1], {
      target: {
        value: '2000-01-11',
      },
    });
    keyDown(container, 0, KeyCode.ENTER);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('should open last when first selected', () => {
    jest.useFakeTimers();
    const onOpenChange = jest.fn();
    const { container, unmount } = render(<DayRangePicker onOpenChange={onOpenChange} />);

    openPicker(container);
    expect(document.querySelectorAll('.rc-picker-input')[0]).toHaveClass('rc-picker-input-active');

    // Select to active next
    selectCell(11);
    jest.runAllTimers();
    expect(document.querySelectorAll('.rc-picker-input')[1]).toHaveClass('rc-picker-input-active');

    unmount();

    jest.useRealTimers();
  });

  describe('hover className', () => {
    [
      { picker: 'year', start: 1990, end: 1997, mid: 1991 },
      { picker: 'month', start: '2月', end: '10月', mid: '5月' },
      { picker: 'date', start: 11, end: 22, mid: 15 },
    ].forEach(({ picker, start, end, mid }) => {
      it(picker, () => {
        const { container } = render(<DayRangePicker picker={picker as any} />);
        openPicker(container);
        selectCell(start);

        // Hover it
        fireEvent.mouseEnter(findCell(end));

        expect(findCell(start)).toHaveClass('rc-picker-cell-range-start');
        expect(findCell(mid)).toHaveClass('rc-picker-cell-in-range');
        expect(findCell(end)).toHaveClass('rc-picker-cell-range-end');

        // Leave
        fireEvent.mouseLeave(findCell(end));

        expect(findCell(start)).toHaveClass('rc-picker-cell-range-start');
        expect(findCell(mid)).not.toHaveClass('rc-picker-cell-in-range');
        expect(findCell(end)).not.toHaveClass('rc-picker-cell-range-end');
      });
    });
  });

  it('should close when user focus out', () => {
    const { container } = render(<DayRangePicker />);
    openPicker(container);
    selectCell(11);
    expect(isOpen()).toBeTruthy();

    fireEvent.blur(container.querySelectorAll('input')[1]);

    act(() => {
      jest.runAllTimers();
    });

    expect(isOpen()).toBeFalsy();
  });

  it('prefix', () => {
    render(<DayRangePicker prefix={<span className="prefix" />} allowClear />);
    expect(document.querySelector('.prefix')).toBeInTheDocument();
  });

  it('icon', () => {
    const { container } = render(
      <DayRangePicker
        defaultValue={[getDay('1990-09-03'), getDay('1990-09-03')]}
        suffixIcon={<span className="suffix-icon" />}
        clearIcon={<span className="suffix-icon" />}
        allowClear
      />,
    );

    expect(container).toMatchSnapshot();
    expect(errorSpy).toHaveBeenCalledWith(
      'Warning: `clearIcon` will be removed in future. Please use `allowClear` instead.',
    );
  });

  // TODO: This may no need anymore
  it.skip('block native mouseDown in panel to prevent focus changed', () => {
    const { container } = render(<DayRangePicker />);
    openPicker(container);

    const cell = document.querySelector('td');
    const mouseDownEvent = createEvent.mouseDown(cell);
    fireEvent(cell, mouseDownEvent);

    expect(mouseDownEvent.defaultPrevented).toBeTruthy();
  });

  describe('arrow position', () => {
    let domMock: ReturnType<typeof spyElementPrototypes>;

    beforeAll(() => {
      domMock = spyElementPrototypes(HTMLElement, {
        offsetWidth: {
          get: () => 100,
        },
      });
    });

    afterAll(() => {
      domMock.mockRestore();
    });

    it('end date arrow should move panel left', () => {
      const { container } = render(<DayRangePicker />);
      openPicker(container, 1);

      expect(document.querySelector('.rc-picker-panel-container')).toHaveStyle({
        marginLeft: 200,
      });
    });
  });

  it('focus to next input not to onOpenChange', () => {
    const onOpenChange = jest.fn();
    const { container } = render(<DayRangePicker onOpenChange={onOpenChange} />);
    openPicker(container);
    onOpenChange.mockReset();

    act(() => {
      fireEvent.mouseDown(container.querySelectorAll('input')[1]);
      fireEvent.blur(container.querySelectorAll('input')[0]);
      fireEvent.focus(container.querySelectorAll('input')[1]);
      jest.runAllTimers();
    });

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('fixed open need repeat trigger onOpenChange', () => {
    const onOpenChange = jest.fn();
    render(<DayRangePicker onOpenChange={onOpenChange} open />);

    expect(onOpenChange).toHaveBeenCalledTimes(0);

    for (let i = 0; i < 10; i += 1) {
      act(() => {
        fireEvent.mouseDown(document.body);
        fireEvent.mouseUp(document.body);
        fireEvent.click(document.body);
      });
      act(() => {
        jest.runAllTimers();
      });
      expect(onOpenChange).toHaveBeenCalledTimes(i + 1);
    }
  });

  it('datetime display ok button', () => {
    const onCalendarChange = jest.fn();
    const onOk = jest.fn();
    const { container } = render(
      <DayRangePicker showTime onCalendarChange={onCalendarChange} onOk={onOk} />,
    );
    openPicker(container);

    // Not trigger when not value
    expect(document.querySelector<HTMLButtonElement>('.rc-picker-ok button').disabled).toBeTruthy();
    expect(onCalendarChange).not.toHaveBeenCalled();

    // Trigger when start Ok'd
    onCalendarChange.mockReset();
    selectCell(11);
    expect(onCalendarChange).toHaveBeenCalledWith(expect.anything(), ['1990-09-11 00:00:00', ''], {
      range: 'start',
    });
    fireEvent.click(document.querySelector('.rc-picker-ok button'));
    expect(onCalendarChange).toHaveBeenCalledWith(
      [expect.anything(), null],
      ['1990-09-11 00:00:00', ''],
      { range: 'start' },
    );
    expect(onOk).toHaveBeenCalledWith([expect.anything(), null]);
    onOk.mockClear();

    // Trigger when end Ok'd
    onCalendarChange.mockReset();
    selectCell(23);
    expect(onCalendarChange).toHaveBeenCalledWith(
      expect.anything(),
      ['1990-09-11 00:00:00', '1990-09-23 00:00:00'],
      { range: 'end' },
    );
    fireEvent.click(document.querySelector('.rc-picker-ok button'));
    expect(onOk).toHaveBeenCalledWith([expect.anything(), expect.anything()]);
  });

  it('datetime will reset by blur', () => {
    const { container } = render(<DayRangePicker showTime />);
    openPicker(container);
    selectCell(11);
    closePicker(container);
    act(() => {
      jest.runAllTimers();
    });

    expect(isOpen()).toBeFalsy();
    expect(document.querySelector('input').value).toEqual('');
  });

  describe('viewDate', () => {
    function matchTitle(title: string) {
      expect(document.querySelector('.rc-picker-header-view').textContent).toEqual(title);
    }

    [
      {
        picker: 'year',
        // Default picker value
        defaultPickerValue: [getDay('1990-09-03'), getDay('2000-11-28')],
        defaultPickerValueTitle: ['1990年-1999年', '2000年-2009年'],
        // Closing value
        closingValue: [getDay('1989-09-03'), getDay('1990-11-28')],
        closingValueTitle: '1980年-1989年',
        // Far away value
        farValue: [getDay('1989-09-03'), getDay('2090-11-28')],
        farValueTitle: ['1980年-1989年', '2080年-2089年'],
      },
      // {
      //   picker: 'month',
      //   // Default picker value
      //   defaultPickerValue: [getDay('1990-09-03'), getDay('2000-11-28')],
      //   defaultPickerValueTitle: ['1990年', '2000年'],
      //   // Closing value
      //   closingValue: [getDay('1989-09-03'), getDay('1989-10-11')],
      //   closingValueTitle: '1989年',
      //   // Far away value
      //   farValue: [getDay('1989-09-03'), getDay('2000-10-11')],
      //   farValueTitle: ['1989年', '1999年'],
      // },
      // {
      //   picker: 'date',
      //   // Default picker value
      //   defaultPickerValue: [getDay('1990-09-03'), getDay('2000-11-28')],
      //   defaultPickerValueTitle: ['1990年9月', '2000年11月'],
      //   // Closing value
      //   closingValue: [getDay('1989-09-03'), getDay('1989-10-11')],
      //   closingValueTitle: '1989年9月',
      //   // Far away value
      //   farValue: [getDay('1989-09-03'), getDay('2000-10-11')],
      //   farValueTitle: ['1989年9月', '2000年9月'],
      // },
    ].forEach(
      ({
        picker,
        defaultPickerValue,
        defaultPickerValueTitle,
        closingValue,
        closingValueTitle,
        farValue,
        farValueTitle,
      }) => {
        describe(picker, () => {
          it('defaultPickerValue', () => {
            const { container } = render(
              <DayRangePicker
                picker={picker as any}
                defaultPickerValue={defaultPickerValue as any}
              />,
            );

            openPicker(container);
            matchTitle(defaultPickerValueTitle[0]);
            openPicker(container, 1);
            matchTitle(defaultPickerValueTitle[1]);
          });

          it('with closing value', () => {
            const { container } = render(
              <DayRangePicker picker={picker as any} value={closingValue as any} />,
            );

            openPicker(container);
            matchTitle(closingValueTitle);
            openPicker(container, 1);
            matchTitle(closingValueTitle);
          });

          it('with far value', async () => {
            const { container } = render(
              <DayRangePicker picker={picker as any} value={farValue as any} />,
            );

            openPicker(container);
            matchTitle(farValueTitle[0]);
            closePicker(container);

            await waitFakeTimer();

            openPicker(container, 1);
            matchTitle(farValueTitle[1]);
          });

          it('no end date', () => {
            const { container } = render(
              <DayRangePicker picker={picker as any} value={[closingValue[0], null]} />,
            );

            openPicker(container);
            matchTitle(farValueTitle[0]);
            openPicker(container, 1);
            matchTitle(farValueTitle[0]);
          });
        });
      },
    );

    // https://github.com/ant-design/ant-design/issues/22991
    it('click switch 1 offset', () => {
      const { container } = render(<DayRangePicker />);
      openPicker(container);
      expect(document.querySelector('.rc-picker-header-view').textContent).toEqual('1990年9月');
      const nextBtns = document.querySelectorAll('.rc-picker-header-next-btn');
      fireEvent.click(nextBtns[nextBtns.length - 1]);
      expect(document.querySelector('.rc-picker-header-view').textContent).toEqual('1990年10月');
    });
  });

  // https://github.com/ant-design/ant-design/issues/20868
  it('change picker should reset mode', () => {
    const { container, rerender } = render(<DayRangePicker picker="date" />);
    openPicker(container);
    expect(document.querySelector('.rc-picker-date-panel')).toBeTruthy();

    rerender(<DayRangePicker picker="month" />);

    expect(document.querySelector('.rc-picker-date-panel')).toBeFalsy();
    expect(document.querySelector('.rc-picker-month-panel')).toBeTruthy();
  });

  describe('reorder onChange logic', () => {
    it('datetime should reorder in onChange if start is after end in same date', () => {
      const onChange = jest.fn();

      const { container } = render(<DayRangePicker onChange={onChange} showTime />);
      openPicker(container);
      selectCell(15);
      fireEvent.click(findLast(document.querySelector('ul'), 'li'));
      fireEvent.click(document.querySelector('.rc-picker-ok button'));

      selectCell(15);
      fireEvent.click(document.querySelector('ul').querySelector('li'));
      fireEvent.click(document.querySelector('.rc-picker-ok button'));

      expect(onChange).toHaveBeenCalledWith(expect.anything(), [
        '1990-09-15 00:00:00',
        '1990-09-15 23:00:00',
      ]);

      expect(isSame(onChange.mock.calls[0][0][0], '1990-09-15 00:00:00')).toBeTruthy();
      expect(isSame(onChange.mock.calls[0][0][1], '1990-09-15 23:00:00')).toBeTruthy();
    });

    function testOrderOnTime(order: boolean, start: string, end: string) {
      it(`order: ${String(order)} when picker is time`, () => {
        const onChange = jest.fn();

        const { container } = render(
          <DayRangePicker onChange={onChange} picker="time" order={order} />,
        );
        openPicker(container);
        fireEvent.click(findLast(document.querySelector('ul'), 'li'));
        fireEvent.click(document.querySelector('.rc-picker-ok button'));

        fireEvent.click(document.querySelector('ul').querySelectorAll('li')[2]);
        fireEvent.click(document.querySelector('.rc-picker-ok button'));

        expect(onChange).toHaveBeenCalledWith(expect.anything(), [start, end]);

        expect(isSame(onChange.mock.calls[0][0][0], start)).toBeTruthy();
        expect(isSame(onChange.mock.calls[0][0][1], end)).toBeTruthy();
      });
    }

    testOrderOnTime(false, '23:00:00', '02:00:00');
    testOrderOnTime(true, '02:00:00', '23:00:00');
  });

  describe('id', () => {
    it('basic', () => {
      const { container } = render(<DayRangePicker id="bamboo" />);
      expect(container.querySelector('input').id).toEqual('bamboo');
    });

    it('semantic', () => {
      const { container } = render(<DayRangePicker id={{ start: 'little', end: 'light' }} />);
      expect(container.querySelectorAll('input')[0].id).toEqual('little');
      expect(container.querySelectorAll('input')[1].id).toEqual('light');
    });
  });

  it('dateRender', () => {
    let range = '';

    const { container } = render(
      <DayRangePicker
        open
        cellRender={(date, info) => {
          range = info.range;
          if (typeof date !== 'number') {
            return (date as Dayjs).format('YYYY-MM-DD');
          }
        }}
      />,
    );
    expect(range).toBe('start');
    expect(findLast(document, 'tbody td').textContent).toEqual('1990-11-11');

    openPicker(container, 1);
    expect(range).toBe('end');
  });

  // https://github.com/ant-design/ant-design/issues/21084
  it('should not jump back to current date after select', () => {
    const { container } = render(<DayRangePicker />);
    openPicker(container);
    clickButton('super-prev');
    selectCell(3);
    selectCell(4);
    matchValues(container, '1989-09-03', '1989-09-04');
  });

  describe('can select endDate when in same level', () => {
    /**
     * Selection should support in same level.
     * Like `2020-12-31` ~ `2020-01-01` is validate in `year` picker.
     */
    const list: {
      picker: PickerMode;
      defaultValue: string[];
      targetCell: string;
      match: string[];
    }[] = [
      {
        picker: 'week',
        defaultValue: ['2020-06-13'],
        targetCell: '9',
        match: ['2020-24周'],
      },
      {
        picker: 'quarter',
        defaultValue: ['2020-03-30', '2020-05-20'],
        targetCell: 'Q1',
        match: ['2020-Q1'],
      },
    ];

    list.forEach(({ picker, defaultValue, match, targetCell }) => {
      it(picker, () => {
        const onChange = jest.fn();
        const { container } = render(
          <DayRangePicker
            picker={picker}
            onChange={onChange}
            defaultValue={[getDay(defaultValue[0]), getDay(defaultValue[1] || defaultValue[0])]}
          />,
        );

        openPicker(container, 1);
        selectCell(targetCell);
        closePicker(container, 1);
        expect(onChange).toHaveBeenCalled();
        expect(onChange).toHaveBeenCalledWith(expect.anything(), [match[0], match[1] || match[0]]);
      });
    });
  });

  it('should not disabled when week picker in diff year', () => {
    const { container } = render(
      <DayRangePicker picker="week" defaultValue={[getDay('2000-12-15'), getDay('2021-02-03')]} />,
    );

    openPicker(container, 1);
    expect(findCell('15')).not.toHaveClass('rc-picker-cell-disabled');
  });

  it('format', () => {
    const { container } = render(
      <DayRangePicker
        format={['YYYYMMDD', 'YYYY-MM-DD']}
        defaultValue={[getDay('2000-12-15'), getDay('2021-02-03')]}
      />,
    );

    // Start date
    openPicker(container);

    fireEvent.change(container.querySelector('input'), {
      target: {
        value: '1989-09-03',
      },
    });
    closePicker(container);

    // end date
    openPicker(container, 1);
    act(() => {
      jest.runAllTimers();
    });
    fireEvent.change(container.querySelectorAll('input')[1], {
      target: {
        value: '1990-11-28',
      },
    });

    // Force blur since fireEvent blur will not change document.activeElement
    container.querySelectorAll('input')[1].blur();
    closePicker(container, 1);

    expect(document.querySelectorAll('input')[0].value).toEqual('19890903');
    expect(document.querySelectorAll('input')[1].value).toEqual('19901128');
  });

  it('custom format', () => {
    const { container } = render(
      <DayRangePicker
        allowClear
        format={[(val: Dayjs) => `custom format:${val.format('YYYYMMDD')}`, 'YYYY-MM-DD']}
        defaultValue={[getDay('2020-09-17'), getDay('2020-10-17')]}
      />,
    );

    expect(document.querySelectorAll('input')[0]).toHaveAttribute('readOnly');
    expect(document.querySelectorAll('input')[1]).toHaveAttribute('readOnly');

    // Start date
    openPicker(container);
    selectCell(24);
    closePicker(container);

    // end date
    openPicker(container, 1);
    selectCell(24, 1);
    closePicker(container, 1);

    expect(document.querySelectorAll('input')[0].value).toEqual('custom format:20200924');
    expect(document.querySelectorAll('input')[1].value).toEqual('custom format:20201024');

    // clear
    clearValue();
    expect(document.querySelectorAll('input')[0].value).toEqual('');
    expect(document.querySelectorAll('input')[1].value).toEqual('');
  });

  describe('auto open', () => {
    it('empty: start -> end -> close', () => {
      const { container } = render(<DayRangePicker />);

      openPicker(container, 0);
      inputValue('1990-11-28');
      keyDown(container, 0, KeyCode.ENTER);
      expect(isOpen()).toBeTruthy();

      inputValue('1991-01-01', 1);
      keyDown(container, 1, KeyCode.ENTER);

      act(() => {
        jest.runAllTimers();
      });

      expect(isOpen()).toBeFalsy();
    });

    describe('valued: start -> end -> close', () => {
      it('in range', () => {
        const { container } = render(
          <DayRangePicker defaultValue={[getDay('1989-01-01'), getDay('1990-01-01')]} />,
        );

        openPicker(container, 0);
        inputValue('1990-11-28');
        keyDown(container, 0, KeyCode.ENTER);
        // closePicker(container, 0);
        expect(isOpen()).toBeTruthy();

        inputValue('1990-12-23');
        // closePicker(container, 1);
        keyDown(container, 1, KeyCode.ENTER);
        expect(isOpen()).toBeFalsy();
      });

      it('new start is after end', () => {
        const { container } = render(
          <DayRangePicker defaultValue={[getDay('1989-01-10'), getDay('1989-01-15')]} />,
        );

        openPicker(container, 0);
        inputValue('1989-01-20');
        // closePicker(container, 0);
        keyDown(container, 0, KeyCode.ENTER);
        expect(isOpen()).toBeTruthy();

        inputValue('1989-01-25');
        // closePicker(container, 1);
        keyDown(container, 1, KeyCode.ENTER);
        expect(isOpen()).toBeFalsy();
      });
    });

    it('empty: end -> start -> close', () => {
      const { container } = render(<DayRangePicker />);

      openPicker(container, 1);
      inputValue('1990-11-28', 1);
      keyDown(container, 1, KeyCode.ENTER);
      expect(isOpen()).toBeTruthy();

      inputValue('1989-01-01');
      keyDown(container, 0, KeyCode.ENTER);
      expect(isOpen()).toBeFalsy();
    });

    describe('valued: end -> start -> close', () => {
      it('in range', () => {
        const { container } = render(
          <DayRangePicker defaultValue={[getDay('1989-01-01'), getDay('1990-01-01')]} />,
        );

        openPicker(container, 1);
        inputValue('1990-11-28', 1);
        keyDown(container, 1, KeyCode.ENTER);
        // closePicker(container, 1);
        expect(isOpen()).toBeTruthy();

        inputValue('1989-01-01');
        keyDown(container, 0, KeyCode.ENTER);
        // closePicker(container, 0);
        expect(isOpen()).toBeFalsy();
      });

      it('new end is before start', () => {
        const { container } = render(
          <DayRangePicker defaultValue={[getDay('1989-01-10'), getDay('1989-01-15')]} />,
        );

        openPicker(container, 1);
        inputValue('1989-01-07', 1);

        keyDown(container, 1, KeyCode.ENTER);
        expect(isOpen()).toBeTruthy();

        inputValue('1989-01-01');
        keyDown(container, 0, KeyCode.ENTER);
        expect(isOpen()).toBeFalsy();
      });
    });

    it('not change: start not to end', () => {
      const { container } = render(
        <DayRangePicker defaultValue={[getDay('1989-01-01'), getDay('1990-01-01')]} />,
      );
      openPicker(container, 0);
      closePicker(container, 0);
      expect(isOpen()).toBeFalsy();
    });
  });

  describe('click at non-input elements', () => {
    it('should focus on the first element by default', () => {
      jest.useFakeTimers();
      const { container } = render(<DayRangePicker />);
      fireEvent.click(container.querySelector('.rc-picker'));
      expect(document.querySelector('.rc-picker-dropdown')).toBeTruthy();
      jest.runAllTimers();
      expect(document.activeElement).toBe(container.querySelector('input'));
      jest.useRealTimers();
    });

    it('should focus on the second element if first is disabled', () => {
      jest.useFakeTimers();
      const { container } = render(<DayRangePicker disabled={[true, false]} />);
      fireEvent.click(container.querySelector('.rc-picker'));
      expect(document.querySelector('.rc-picker-dropdown')).toBeTruthy();
      jest.runAllTimers();
      expect(document.activeElement).toBe(container.querySelectorAll('input')[1]);
      jest.useRealTimers();
    });

    it("shouldn't let mousedown blur the input", () => {
      jest.useFakeTimers();
      const { container } = render(<DayRangePicker />);
      const node = container.querySelector('.rc-picker');
      fireEvent.click(node);
      act(() => {
        jest.runAllTimers();
      });
      const mouseDownEvent = createEvent.mouseDown(node);
      fireEvent(node, mouseDownEvent);
      expect(isOpen()).toBeTruthy();
      expect(mouseDownEvent.defaultPrevented).toBeTruthy();
      jest.useRealTimers();
    });
  });

  it('panelRender', () => {
    render(<DayRangePicker open panelRender={() => <h1>Light</h1>} />);
    expect(document.body).toMatchSnapshot();
  });

  describe('Selection callbacks', () => {
    it('selection provide info for onCalendarChange', () => {
      const onCalendarChange = jest.fn();

      const { container } = render(<DayRangePicker onCalendarChange={onCalendarChange} />);

      openPicker(container);

      // Start date
      selectCell(11);
      expect(onCalendarChange).toHaveBeenCalledWith([expect.anything(), null], ['1990-09-11', ''], {
        range: 'start',
      });

      // End date
      selectCell(23);
      expect(onCalendarChange).toHaveBeenCalledWith(
        [expect.anything(), expect.anything()],
        ['1990-09-11', '1990-09-23'],
        { range: 'end' },
      );
    });
  });

  describe('hover placeholder', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    const defaultValue: [Dayjs, Dayjs] = [getDay('2020-07-22'), getDay('2020-08-22')];

    it('should restore when leave', () => {
      const { container } = render(<DayRangePicker defaultValue={defaultValue} />);

      // left
      openPicker(container, 0);
      const leftCell = findCell(24);
      fireEvent.mouseEnter(leftCell);

      act(() => {
        jest.runAllTimers();
      });

      expect(document.querySelectorAll('input')[0].value).toBe('2020-07-24');
      expect(document.querySelectorAll('input')[1].value).toBe('2020-08-22');
      expect(document.querySelectorAll('.rc-picker-input')[0]).toHaveClass(
        'rc-picker-input-placeholder',
      );
      expect(document.querySelectorAll('.rc-picker-input')[1]).not.toHaveClass(
        'rc-picker-input-placeholder',
      );

      fireEvent.mouseLeave(leftCell);
      act(() => {
        jest.runAllTimers();
      });

      expect(document.querySelectorAll('input')[0].value).toBe('2020-07-22');
      expect(document.querySelectorAll('input')[1].value).toBe('2020-08-22');
      expect(document.querySelectorAll('.rc-picker-input')[0]).not.toHaveClass(
        'rc-picker-input-placeholder',
      );
      expect(document.querySelectorAll('.rc-picker-input')[1]).not.toHaveClass(
        'rc-picker-input-placeholder',
      );

      closePicker(container, 0);

      // right
      openPicker(container, 1);
      const rightCell = findCell(24, 1);
      fireEvent.mouseEnter(rightCell);
      act(() => {
        jest.runAllTimers();
      });

      expect(document.querySelectorAll('input')[0].value).toBe('2020-07-22');
      expect(document.querySelectorAll('input')[1].value).toBe('2020-08-24');
      expect(document.querySelectorAll('.rc-picker-input')[0]).not.toHaveClass(
        'rc-picker-input-placeholder',
      );
      expect(document.querySelectorAll('.rc-picker-input')[1]).toHaveClass(
        'rc-picker-input-placeholder',
      );

      fireEvent.mouseLeave(rightCell);
      act(() => {
        jest.runAllTimers();
      });

      expect(document.querySelectorAll('input')[0].value).toBe('2020-07-22');
      expect(document.querySelectorAll('input')[1].value).toBe('2020-08-22');
      expect(document.querySelectorAll('.rc-picker-input')[0]).not.toHaveClass(
        'rc-picker-input-placeholder',
      );
      expect(document.querySelectorAll('.rc-picker-input')[1]).not.toHaveClass(
        'rc-picker-input-placeholder',
      );

      closePicker(container, 1);
    });

    it('should restore after selecting cell', () => {
      const onChange = jest.fn();
      const { container } = render(
        <DayRangePicker defaultValue={defaultValue} onChange={onChange} />,
      );

      // Left Field
      openPicker(container, 0);
      const leftCell = findCell(24, 0);
      fireEvent.mouseEnter(leftCell);
      act(() => {
        jest.runAllTimers();
      });
      expect(document.querySelectorAll('input')[0].value).toBe('2020-07-24');
      expect(document.querySelectorAll('input')[1].value).toBe('2020-08-22');
      expect(document.querySelectorAll('.rc-picker-input')[0]).toHaveClass(
        'rc-picker-input-placeholder',
      );
      expect(document.querySelectorAll('.rc-picker-input')[1]).not.toHaveClass(
        'rc-picker-input-placeholder',
      );

      // Select
      selectCell(24, 0);
      expect(document.querySelectorAll('input')[0].value).toBe('2020-07-24');
      expect(document.querySelectorAll('input')[1].value).toBe('2020-08-22');
      expect(document.querySelectorAll('.rc-picker-input')[0]).not.toHaveClass(
        'rc-picker-input-placeholder',
      );

      // Right Field
      const rightCell = findCell(24, 1);
      fireEvent.mouseEnter(rightCell);
      act(() => {
        jest.runAllTimers();
      });

      expect(document.querySelectorAll('input')[0].value).toBe('2020-07-24');
      expect(document.querySelectorAll('input')[1].value).toBe('2020-08-24');
      expect(document.querySelectorAll('.rc-picker-input')[0]).not.toHaveClass(
        'rc-picker-input-placeholder',
      );
      expect(document.querySelectorAll('.rc-picker-input')[1]).toHaveClass(
        'rc-picker-input-placeholder',
      );

      // Select
      selectCell(24, 1);
      expect(onChange).toHaveBeenCalledWith(expect.anything(), ['2020-07-24', '2020-08-24']);
      act(() => {
        jest.runAllTimers();
      });

      expect(document.querySelectorAll('input')[0].value).toBe('2020-07-24');
      expect(document.querySelectorAll('input')[1].value).toBe('2020-08-24');
      expect(document.querySelectorAll('.rc-picker-input')[0]).not.toHaveClass(
        'rc-picker-input-placeholder',
      );
      expect(document.querySelectorAll('.rc-picker-input')[1]).not.toHaveClass(
        'rc-picker-input-placeholder',
      );
    });

    // https://github.com/ant-design/ant-design/issues/26544
    it('should clean hover style when selecting the same value with last value', () => {
      const { container } = render(
        <DayRangePicker defaultValue={[getDay('2020-07-24'), getDay('2020-08-24')]} />,
      );

      openPicker(container);

      selectCell(24, 0);
      expect(document.querySelectorAll('input')[0].value).toBe('2020-07-24');
      expect(document.querySelectorAll('input')[0]).not.toHaveClass('rc-picker-input-placeholder');
      expect(isOpen()).toBeTruthy();
    });
  });

  // https://github.com/ant-design/ant-design/issues/25746
  it('ok button should be disabled when disabledDate is true', () => {
    const disabledDate = () => {
      // Can not select days before today and today
      return true;
    };
    const { container } = render(
      <DayRangePicker
        showTime
        disabledDate={disabledDate}
        defaultValue={[getDay('2020-07-24'), getDay('2020-08-24')]}
      />,
    );

    openPicker(container);

    expect(document.querySelector<HTMLButtonElement>('.rc-picker-ok button').disabled).toBeTruthy();

    fireEvent.click(
      document.querySelector('.rc-picker-time-panel-column').querySelectorAll('li')[6],
    );

    expect(document.querySelectorAll('input')[0].value).toEqual('2020-07-24 06:00:00');
    expect(document.querySelector<HTMLButtonElement>('.rc-picker-ok button').disabled).toBeTruthy();
  });

  // https://github.com/ant-design/ant-design/issues/26024
  it('panel should keep open when nextValue is empty', () => {
    const { container } = render(<DayRangePicker placeholder={['Start', 'End']} />);

    openPicker(container, 0);

    selectCell(7, 0);
    expect(document.querySelectorAll('input')[0].value).toBe('1990-09-07');

    // back to first panel and clear input value
    // `testing-lib` fire the `focus` event but not change the `document.activeElement`
    // We call `focus` manually here
    document.querySelectorAll('input')[0].focus();
    inputValue('', 0);

    // reselect date
    selectCell(9, 0);
    expect(document.querySelectorAll('input')[0].value).toBe('1990-09-09');

    // end date
    selectCell(9, 1);

    matchValues(container, '1990-09-09', '1990-10-09');
  });

  it('right date panel switch to month should keep in the same year', () => {
    const { container } = render(<DayRangePicker />);
    openPicker(container, 0);
    fireEvent.click(document.querySelectorAll('.rc-picker-month-btn')[1]);
    expect(document.querySelector('.rc-picker-year-btn').textContent).toEqual('1990年');
  });

  // https://github.com/ant-design/ant-design/issues/23167
  it('default endDate should be relative startDate', () => {
    const { container } = render(<DayRangePicker showTime />);
    openPicker(container);

    selectCell(24);
    fireEvent.click(document.querySelector('.rc-picker-ok button'));

    fireEvent.click(document.querySelector('ul').querySelector('li'));
    fireEvent.click(document.querySelector('.rc-picker-ok button'));

    matchValues(container, '1990-09-24 00:00:00', '1990-09-24 00:00:00');
  });

  it('default startDate should be relative endDate', () => {
    const { container } = render(<DayRangePicker showTime />);
    openPicker(container, 1);

    selectCell(24);
    fireEvent.click(document.querySelector('.rc-picker-ok button'));

    fireEvent.click(document.querySelector('ul').querySelector('li'));
    fireEvent.click(document.querySelector('.rc-picker-ok button'));

    matchValues(container, '1990-09-24 00:00:00', '1990-09-24 00:00:00');
  });

  // https://github.com/ant-design/ant-design/issues/30893
  it('range picker should have onMouseEnter and onMouseLeave event', () => {
    const handleMouseEnter = jest.fn();
    const handleMouseLeave = jest.fn();
    const { container } = render(
      <DayRangePicker onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} />,
    );
    fireEvent.mouseEnter(container.querySelector('.rc-picker'));
    expect(handleMouseEnter).toHaveBeenCalled();

    fireEvent.mouseLeave(container.querySelector('.rc-picker'));
    expect(handleMouseLeave).toHaveBeenCalled();
  });

  // https://github.com/ant-design/ant-design/issues/31334
  it('keyboard should not trigger on disabledDate', () => {
    const onCalendarChange = jest.fn();
    const now = dayjs();
    const disabledDate = (current: Dayjs) => {
      return current.diff(now, 'days') > 1 || current.diff(now, 'days') < -1;
    };
    const { container } = render(
      <DayRangePicker onCalendarChange={onCalendarChange} disabledDate={disabledDate} />,
    );
    fireEvent.focus(document.querySelector('input'));

    function pickerKeyDown(keyCode: number) {
      fireEvent.keyDown(container.querySelector('.rc-picker'), {
        keyCode,
        which: keyCode,
        charCode: keyCode,
      });
    }

    pickerKeyDown(KeyCode.ENTER);
    pickerKeyDown(KeyCode.TAB);
    // Make sure the selected value is disabledDate. Because only a few values are disabledDate
    pickerKeyDown(KeyCode.DOWN);
    pickerKeyDown(KeyCode.DOWN);
    pickerKeyDown(KeyCode.DOWN);
    pickerKeyDown(KeyCode.DOWN);
    pickerKeyDown(KeyCode.DOWN);
    pickerKeyDown(KeyCode.DOWN);
    pickerKeyDown(KeyCode.ENTER);
    expect(onCalendarChange).not.toHaveBeenCalled();
  });

  // https://github.com/ant-design/ant-design/issues/33662
  it('range picker should have onClick event', () => {
    const handleClick = jest.fn();
    const { container } = render(<DayRangePicker onClick={handleClick} />);
    fireEvent.click(container.querySelector('.rc-picker'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('range picker should have onMouseDown event', () => {
    const handleMouseDown = jest.fn();
    const { container } = render(<DayRangePicker onMouseDown={handleMouseDown} />);
    fireEvent.mouseDown(container.querySelector('.rc-picker'));
    expect(handleMouseDown).toHaveBeenCalled();
  });

  it('panel should be stable: left', () => {
    const mock = spyElementPrototypes(HTMLElement, {
      offsetWidth: {
        get() {
          if (this.className.includes('range-arrow')) {
            return 0;
          } else if (this.className.includes('panel-container')) {
            return 312;
          } else if (this.className.includes('input')) {
            return 236;
          } else if (this.className.includes('range-separator')) {
            return 10;
          }
        },
      },
      offsetLeft: {
        get() {
          if (this.className.includes('range-arrow')) {
            return 16;
          }
        },
      },
    });
    const { container } = render(
      <DayRangePicker
        allowClear
        defaultValue={[getDay('1990-09-03'), getDay('1989-11-28')]}
        clearIcon={<span>X</span>}
        suffixIcon={<span>O</span>}
      />,
    );
    openPicker(container, 1);
    expect(document.querySelector('.rc-picker-panel-container')).toHaveStyle({ marginLeft: 0 });
    mock.mockRestore();
  });

  it('panel should be stable: arrow right and panel left', () => {
    const mock = spyElementPrototypes(HTMLElement, {
      offsetWidth: {
        get() {
          if (this.className.includes('range-arrow')) {
            return 0;
          } else if (this.className.includes('panel-container')) {
            return 312;
          } else if (this.className.includes('input')) {
            return 236;
          } else if (this.className.includes('range-separator')) {
            return 10;
          }
        },
      },
      offsetLeft: {
        get() {
          if (this.className.includes('range-arrow')) {
            return 262;
          }
        },
      },
    });
    const { container } = render(
      <DayRangePicker
        allowClear
        defaultValue={[getDay('1990-09-03'), getDay('1989-11-28')]}
        clearIcon={<span>X</span>}
        suffixIcon={<span>O</span>}
      />,
    );
    openPicker(container, 1);
    expect(document.querySelector('.rc-picker-panel-container')).toHaveStyle({ marginLeft: 0 });
    mock.mockRestore();
  });

  it('panel should be stable: arrow right and panel right', () => {
    const mock = spyElementPrototypes(HTMLElement, {
      offsetWidth: {
        get() {
          if (this.className.includes('rc-picker-range-wrapper')) {
            return 200;
          }
        },
      },
      offsetLeft: {
        get() {
          if (this.className.includes('rc-picker-input')) {
            return 100;
          }
        },
      },
      getBoundingClientRect() {
        if (this.className.includes('rc-picker-dropdown')) {
          return {
            x: 0,
            y: 0,
            width: 300,
          };
        }
        if (this.className.includes('rc-picker-range')) {
          return {
            x: 0,
            y: 0,
            width: 200,
          };
        }
        if (this.className.includes('rc-picker-input')) {
          return {
            x: 100,
            y: 0,
            width: 100,
          };
        }
        if (this.className.includes('rc-picker')) {
          return {
            x: 0,
            y: 0,
            width: 200,
          };
        }
      },
    });
    const { container } = render(
      <DayRangePicker
        allowClear
        defaultValue={[getDay('1990-09-03'), getDay('1989-11-28')]}
        clearIcon={<span>X</span>}
        suffixIcon={<span>O</span>}
      />,
    );
    openPicker(container, 1);
    expect(document.querySelector('.rc-picker-panel-container')).toHaveStyle({
      marginLeft: '100px',
    });
    mock.mockRestore();
  });

  it('week range selection style', () => {
    const { container } = render(<DayRangePicker picker="week" />);
    openPicker(container);

    function findWeekCell(val: string) {
      const list = document.querySelectorAll('.rc-picker-cell-week');
      return Array.from(list).find((cell) => cell.textContent == val);
    }

    // Start
    fireEvent.mouseEnter(findWeekCell('35'));
    fireEvent.click(findWeekCell('35'));
    fireEvent.mouseLeave(findWeekCell('35'));

    expect(findWeekCell('35').parentElement).toHaveClass('rc-picker-week-panel-row-range-start');

    // End Hover
    fireEvent.mouseEnter(findWeekCell('37'));
    expect(findWeekCell('36').parentElement).toHaveClass('rc-picker-week-panel-row-range-hover');

    // End Click
    fireEvent.click(findWeekCell('37'));
    fireEvent.mouseLeave(findWeekCell('37'));

    expect(findWeekCell('37').parentElement).toHaveClass('rc-picker-week-panel-row-range-end');

    // No selected cell
    expect(document.querySelector('.rc-picker-cell-selected')).toBeFalsy();
  });

  it('range picker should use the passed in default when part is disabled', () => {
    render(<DayRangePicker defaultValue={[null, null]} disabled={[false, true]} />);

    expect(document.querySelectorAll('input')[1].value).toBeFalsy();
  });

  it('use dateRender and monthCellRender in month range picker', () => {
    const { container, baseElement } = render(
      <DayRangePicker
        picker="month"
        dateRender={(date) => <div>D{date.get('date')}</div>}
        monthCellRender={(date) => <div>M{date.get('month') + 1}</div>}
      />,
    );
    openPicker(container);
    expect(baseElement).toMatchSnapshot();
  });

  it('use dateRender and monthCellRender in date range picker', () => {
    const { container, baseElement } = render(
      <DayRangePicker
        picker="date"
        dateRender={(date) => <div>D{date.get('date')}</div>}
        monthCellRender={(date) => <div>M{date.get('month') + 1}</div>}
      />,
    );
    openPicker(container);
    expect(baseElement).toMatchSnapshot();
  });

  it('no -disabled cell when set open directly', () => {
    render(
      <DayRangePicker
        open
        picker="date"
        defaultValue={[getDay('2000-09-03'), getDay('2000-09-03')]}
      />,
    );

    expect(document.querySelector('.rc-picker-cell-disabled')).toBeFalsy();
  });

  it('custom clear icon', () => {
    render(
      <DayRangePicker
        allowClear={{ clearIcon: <span className="custom-clear">clear</span> }}
        defaultValue={[getDay('2000-09-03'), getDay('2000-09-03')]}
      />,
    );

    // clear
    expect(document.querySelector('.custom-clear')).toBeTruthy();
    clearValue();
    expect(document.querySelector('input').value).toEqual('');
  });

  it('selected date when open is true should switch panel', () => {
    const { container } = render(<DayRangePicker open />);

    fireEvent.focus(container.querySelector('input'));
    fireEvent.click(document.querySelector('.rc-picker-cell'));

    expect(document.querySelectorAll('.rc-picker-input')[1]).toHaveClass('rc-picker-input-active');
  });

  describe('trigger onCalendarChange', () => {
    const switchInput = (container: HTMLElement) => {
      openPicker(container, 0);

      selectCell(8, 0);

      openPicker(container, 1);

      // onBlur is triggered when the switch is complete
      closePicker(container, 0);
    };

    it('dateTime mode switch should trigger onCalendarChange', () => {
      const onCalendarChange = jest.fn();
      const { container } = render(<DayRangePicker showTime onCalendarChange={onCalendarChange} />);

      switchInput(container);

      expect(onCalendarChange).toHaveBeenCalled();
    });

    it('should only trigger onCalendarChange when showTime', () => {
      const onCalendarChange = jest.fn();
      const onChange = jest.fn();
      const { container, baseElement } = render(
        <DayRangePicker showTime onChange={onChange} onCalendarChange={onCalendarChange} />,
      );

      switchInput(container);

      // one of the panel should be open
      expect(baseElement.querySelector('.rc-picker-dropdown')).toBeTruthy();

      expect(onCalendarChange).toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  it('dateTime mode should be can use a confirm button to close the panel', async () => {
    const onOpenChange = jest.fn();

    const { container } = render(<DayRangePicker open showTime onOpenChange={onOpenChange} />);
    fireEvent.focus(container.querySelector('input'));

    for (let i = 0; i < 2; i++) {
      selectCell(24);
      fireEvent.click(document.querySelector('.rc-picker-ok button'));

      await waitFakeTimer();
    }

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('should save both dates, but not only the last that was changed without submit, enter, tab, etc.', async () => {
    const { container } = render(<DayRangePicker />);

    act(() => {
      fireEvent.focus(container.querySelectorAll('input')[0]);
      fireEvent.change(container.querySelectorAll('input')[0], {
        target: {
          value: '2024-06-13',
        },
      });
      fireEvent.blur(container.querySelectorAll('input')[0]);

      fireEvent.focus(container.querySelectorAll('input')[1]);
      fireEvent.change(container.querySelectorAll('input')[1], {
        target: {
          value: '2024-06-15',
        },
      });

      fireEvent.keyDown(container.querySelectorAll('input')[1], {
        key: 'Enter',
        code: 'Enter',
      });
    });

    expect(container.querySelectorAll('input')[1].value).toBe('2024-06-15');
    expect(container.querySelectorAll('input')[0].value).toBe('2024-06-13');
  });

  it('click on the input should trigger success when with !needConfirm', () => {
    const onChange = jest.fn();
    const { container } = render(
      <DayRangePicker showTime needConfirm={false} onChange={onChange} />,
    );

    // Select first field
    openPicker(container, 0);
    selectCell(1, 0);

    // Select second field
    openPicker(container, 1);
    selectCell(2, 0);

    // Click outside to blur
    fireEvent.mouseDown(document.body);
    fireEvent.mouseUp(document.body);
    fireEvent.click(document.body);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onChange).toHaveBeenCalledWith(expect.anything(), [
      '1990-09-01 00:00:00',
      '1990-09-02 00:00:00',
    ]);
    expect(isOpen()).toBeFalsy();
  });

  const renderShadow = (props?: any) => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    const shadowRoot = host.attachShadow({
      mode: 'open',
      delegatesFocus: false,
    });
    const container = document.createElement('div');
    shadowRoot.appendChild(container);

    act(() => {
      createRoot(container).render(<DayRangePicker {...props} />);
    });

    return shadowRoot;
  };

  it('the end date selector can be selected in shadow dom', () => {
    const shadowRoot = renderShadow();

    openPicker(shadowRoot, 1);

    expect(shadowRoot.querySelectorAll('.rc-picker-input')[1]).toHaveClass(
      'rc-picker-input-active',
    );
  });

  it('should not click to focus on next field if first field is not confirm', () => {
    const onCalendarChange = jest.fn();
    const { container } = render(
      <DayRangePicker onCalendarChange={onCalendarChange} showTime needConfirm />,
    );

    // Select first field
    openPicker(container, 0);
    selectCell(11);
    expect(onCalendarChange).toHaveBeenCalled();

    // Not click confirm and click next field
    openPicker(container, 1);
    expect(container.querySelectorAll('.rc-picker-input')[0]).toHaveClass('rc-picker-input-active');
  });
});
