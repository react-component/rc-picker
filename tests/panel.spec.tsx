import { fireEvent, render } from '@testing-library/react';
import dayjs, { type Dayjs } from 'dayjs';
import { resetWarned } from 'rc-util/lib/warning';
import React from 'react';
import type { PanelMode } from '../src/interface';
import enUS from '../src/locale/en_US';
import zhCN from '../src/locale/zh_CN';
import { clickButton, DayPickerPanel, getDay, isSame, selectCell } from './util/commonUtil';

jest.mock('../src/utils/uiUtil', () => {
  const origin = jest.requireActual('../src/utils/uiUtil');

  return {
    ...origin,
    scrollTo: (...args) => {
      global.scrollCalled = true;
      return origin.scrollTo(...args);
    },
  };
});

describe('Picker.Panel', () => {
  beforeEach(() => {
    global.scrollCalled = false;
    jest.useFakeTimers().setSystemTime(getDay('1990-09-03 00:00:00').valueOf());
    document.body.innerHTML = '';
  });

  afterAll(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('value', () => {
    it('defaultValue', () => {
      render(<DayPickerPanel defaultValue={getDay('2000-01-01')} />);

      expect(document.querySelector('.rc-picker-cell-selected').textContent).toEqual('1');
    });

    it('controlled', () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <DayPickerPanel value={getDay('2000-01-01')} onChange={onChange} />,
      );

      selectCell(23);
      expect(isSame(onChange.mock.calls[0][0], '2000-01-23')).toBeTruthy();
      onChange.mockClear();

      // Trigger again since value is controlled
      selectCell(23);
      expect(isSame(onChange.mock.calls[0][0], '2000-01-23')).toBeTruthy();
      onChange.mockClear();

      // Not trigger
      rerender(<DayPickerPanel value={getDay('2000-01-23')} onChange={onChange} />);
      selectCell(23);
      expect(onChange).not.toHaveBeenCalled();

      // Should switch pickerValue of panel
      rerender(<DayPickerPanel value={getDay('2020-03-03')} onChange={onChange} />);
      selectCell(13);
      expect(isSame(onChange.mock.calls[0][0], '2020-03-13')).toBeTruthy();
    });

    it('uncontrolled', () => {
      const onChange = jest.fn();
      render(<DayPickerPanel onChange={onChange} />);

      selectCell(23);
      expect(isSame(onChange.mock.calls[0][0], '1990-09-23')).toBeTruthy();
      onChange.mockReset();

      // Not trigger
      selectCell(23);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Panel switch by picker', () => {
    it('year', () => {
      render(<DayPickerPanel picker="year" />);
      fireEvent.click(document.querySelector('.rc-picker-decade-btn'));
      expect(document.querySelector('.rc-picker-decade-panel')).toBeTruthy();

      selectCell('1990-1999');
      expect(document.querySelector('.rc-picker-year-panel')).toBeTruthy();

      selectCell('1999');
      expect(document.querySelector('.rc-picker-year-panel')).toBeTruthy();
    });

    [
      ['month', 'Aug'],
      ['quarter', 'Q3'],
    ].forEach(([picker, cell]) => {
      it(picker, () => {
        const { container } = render(<DayPickerPanel picker={picker as any} />);
        fireEvent.click(container.querySelector('.rc-picker-year-btn'));
        fireEvent.click(container.querySelector('.rc-picker-decade-btn'));
        expect(document.querySelector('.rc-picker-decade-panel')).toBeTruthy();

        selectCell('1990-1999');
        expect(document.querySelector('.rc-picker-year-panel')).toBeTruthy();

        selectCell('1999');
        expect(document.querySelector(`.rc-picker-${picker}-panel`)).toBeTruthy();

        selectCell(cell);
        expect(document.querySelector(`.rc-picker-${picker}-panel`)).toBeTruthy();
      });
    });
  });

  describe('click button to switch', () => {
    it('date', () => {
      render(<DayPickerPanel defaultValue={getDay('1990-09-03')} />);

      clickButton('prev');
      expect(document.querySelector('.rc-picker-header-view').textContent).toEqual('Aug1990');

      clickButton('next');
      expect(document.querySelector('.rc-picker-header-view').textContent).toEqual('Sep1990');

      clickButton('super-prev');
      expect(document.querySelector('.rc-picker-header-view').textContent).toEqual('Sep1989');

      clickButton('super-next');
      expect(document.querySelector('.rc-picker-header-view').textContent).toEqual('Sep1990');
    });

    ['month', 'quarter'].forEach((picker) => {
      it(picker, () => {
        render(<DayPickerPanel defaultValue={getDay('1990-09-03')} picker={picker as any} />);

        clickButton('super-prev');
        expect(document.querySelector('.rc-picker-header-view').textContent).toEqual('1989');

        clickButton('super-next');
        expect(document.querySelector('.rc-picker-header-view').textContent).toEqual('1990');
      });
    });

    it('year', () => {
      render(<DayPickerPanel defaultValue={getDay('1990-09-03')} picker="year" />);

      clickButton('super-prev');
      expect(document.querySelector('.rc-picker-header-view').textContent).toEqual('1980-1989');

      clickButton('super-next');
      expect(document.querySelector('.rc-picker-header-view').textContent).toEqual('1990-1999');
    });

    it('decade', () => {
      render(<DayPickerPanel defaultValue={getDay('1990-09-03')} mode="decade" />);

      clickButton('super-prev');
      expect(document.querySelector('.rc-picker-header-view').textContent).toEqual('1800-1899');

      clickButton('super-next');
      expect(document.querySelector('.rc-picker-header-view').textContent).toEqual('1900-1999');
    });
  });

  it('showTime.defaultValue only works at first render', () => {
    const onSelect = jest.fn();
    render(
      <DayPickerPanel
        showTime={{
          defaultValue: getDay('2001-01-02 01:03:07'),
        }}
        onSelect={onSelect}
      />,
    );

    selectCell(5);
    // use showTime.defaultValue
    expect(isSame(onSelect.mock.calls[0][0], '1990-09-05 01:03:07')).toBeTruthy();

    // set hour to 10
    fireEvent.click(document.querySelector('ul').querySelectorAll('li')[10]);

    // expect hour changed
    expect(isSame(onSelect.mock.calls[1][0], '1990-09-05 10:03:07')).toBeTruthy();

    selectCell(20);
    // expect using last selection time
    expect(isSame(onSelect.mock.calls[2][0], '1990-09-20 10:03:07')).toBeTruthy();
  });

  it('should hide bottom button when switch date interval in the head', () => {
    render(<DayPickerPanel showTime />);
    fireEvent.click(document.querySelector('.rc-picker-year-btn'));
    expect(document.querySelector('.rc-picker-ranges')).toBeFalsy();
  });

  it('DatePicker has defaultValue and showTime.defaultValue ', () => {
    const onSelect = jest.fn();
    render(
      <DayPickerPanel
        value={getDay('2001-01-02 10:10:10')}
        showTime={{
          defaultValue: getDay('2001-01-02 09:09:09'),
        }}
        onSelect={onSelect}
      />,
    );

    selectCell(5);
    // showTime.defaultValue not used
    expect(isSame(onSelect.mock.calls[0][0], '2001-01-05 10:10:10')).toBeTruthy();
  });

  describe('not trigger onSelect when cell disabled', () => {
    it('time', () => {
      const onSelect = jest.fn();
      const { container } = render(
        <DayPickerPanel picker="time" onSelect={onSelect} disabledHours={() => [0]} />,
      );

      // Disabled
      fireEvent.click(container.querySelectorAll('li')[0]);
      expect(onSelect).not.toHaveBeenCalled();

      // Enabled
      fireEvent.click(container.querySelectorAll('li')[1]);
      expect(onSelect).toHaveBeenCalled();
    });

    it('month', () => {
      const onSelect = jest.fn();
      render(
        <DayPickerPanel
          picker="month"
          onSelect={onSelect}
          disabledDate={(date) => date.month() === 0}
        />,
      );

      selectCell('Jan');
      expect(onSelect).not.toHaveBeenCalled();

      selectCell('Feb');
      expect(onSelect).toHaveBeenCalled();
    });

    it('year', () => {
      const onSelect = jest.fn();
      render(
        <DayPickerPanel
          picker="year"
          onSelect={onSelect}
          disabledDate={(date) => date.year() === 1990}
        />,
      );

      selectCell(1990);
      expect(onSelect).not.toHaveBeenCalled();

      selectCell(1993);
      expect(onSelect).toHaveBeenCalled();
    });

    describe('decade', () => {
      it('mode', () => {
        const onPanelChange = jest.fn();
        render(
          <DayPickerPanel
            mode="decade"
            onPanelChange={onPanelChange}
            disabledDate={(date) => 1900 <= date.year() && date.year() <= 1909}
          />,
        );

        // no picker is decade, it means alway can click
        selectCell('1900-1909');
        expect(onPanelChange).not.toHaveBeenCalled();
        onPanelChange.mockClear();

        selectCell('1910-1919');
        expect(onPanelChange).toHaveBeenCalled();
      });

      it('not trigger when same panel', () => {
        const onPanelChange = jest.fn();
        render(<DayPickerPanel onPanelChange={onPanelChange} />);

        selectCell('23');
        expect(onPanelChange).not.toHaveBeenCalled();
      });
    });
  });

  describe('time with use12Hours', () => {
    it('should work', () => {
      const onChange = jest.fn();
      render(
        <DayPickerPanel
          picker="time"
          defaultValue={getDay('2000-01-01 00:01:02')}
          use12Hours
          onChange={onChange}
        />,
      );

      const ulList = document.querySelectorAll('.rc-picker-time-panel-column');
      const liList = ulList[ulList.length - 1].querySelectorAll('li');
      fireEvent.click(liList[liList.length - 1]);
      expect(isSame(onChange.mock.calls[0][0], '2000-01-01 12:01:02', 'second')).toBeTruthy();
    });

    it('should display hour from 12 at AM', () => {
      render(
        <DayPickerPanel picker="time" defaultValue={getDay('2000-01-01 00:00:00')} use12Hours />,
      );

      const startHour = document
        .querySelector('.rc-picker-time-panel-column')
        .querySelectorAll('li')[0].textContent;
      expect(startHour).toEqual('12');
    });

    it('should display hour from 12 at AM', () => {
      render(
        <DayPickerPanel picker="time" defaultValue={getDay('2000-01-01 12:00:00')} use12Hours />,
      );

      const startHour = document
        .querySelector('.rc-picker-time-panel-column')
        .querySelectorAll('li')[0].textContent;

      expect(startHour).toEqual('12');
    });

    it('should disable AM when 00 ~ 11 is disabled', () => {
      render(
        <DayPickerPanel
          picker="time"
          defaultValue={getDay('2000-01-01 12:00:00')}
          use12Hours
          disabledHours={() => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]}
        />,
      );

      expect(document.querySelector('.rc-picker-time-panel-cell-disabled').textContent).toEqual(
        'AM',
      );
    });

    it('should disable PM when 12 ~ 23 is disabled', () => {
      render(
        <DayPickerPanel
          picker="time"
          defaultValue={getDay('2000-01-01 12:00:00')}
          use12Hours
          disabledHours={() => [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]}
        />,
      );

      const disabledCells = document.querySelectorAll('.rc-picker-time-panel-cell-disabled');

      expect(disabledCells[disabledCells.length - 1].textContent).toEqual('PM');
    });
  });

  describe('time disabled columns', () => {
    it('basic', () => {
      const { container } = render(
        <DayPickerPanel
          picker="time"
          disabledHours={() => [0, 1, 2, 3, 4, 5, 6, 7]}
          disabledMinutes={() => [2, 4, 6, 8, 10]}
          disabledSeconds={() => [10, 20, 30, 40, 50]}
        />,
      );

      const columns = container.querySelectorAll('.rc-picker-time-panel-column');
      expect(columns[0].querySelectorAll('.rc-picker-time-panel-cell-disabled')).toHaveLength(8);
      expect(columns[1].querySelectorAll('.rc-picker-time-panel-cell-disabled')).toHaveLength(5);
      expect(columns[2].querySelectorAll('.rc-picker-time-panel-cell-disabled')).toHaveLength(5);
    });

    it('use12Hour', () => {
      const disabledMinutes = jest.fn(() => []);
      const disabledSeconds = jest.fn(() => []);

      render(
        <DayPickerPanel
          picker="time"
          use12Hours
          value={getDay('2000-01-01 13:07:04')}
          disabledMinutes={disabledMinutes}
          disabledSeconds={disabledSeconds}
        />,
      );

      expect(disabledMinutes).toHaveBeenCalledWith(13);
      expect(disabledSeconds).toHaveBeenCalledWith(13, 7);
    });
  });

  it('warning with invalidate value', () => {
    resetWarned();
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const invalidateDate = dayjs('notValidate', 'YYYY', true);
    render(<DayPickerPanel value={invalidateDate} />);
    expect(errSpy).toHaveBeenCalledWith(
      'Warning: Invalidate date pass to `value` or `defaultValue`.',
    );

    errSpy.mockClear();
    resetWarned();

    render(<DayPickerPanel defaultValue={invalidateDate} />);
    expect(errSpy).toHaveBeenCalledWith(
      'Warning: Invalidate date pass to `value` or `defaultValue`.',
    );

    errSpy.mockRestore();
  });

  it('should render correctly in rtl', () => {
    const { container } = render(<DayPickerPanel direction="rtl" />);
    expect(container).toMatchSnapshot();
  });

  // No this prop now
  // describe('hideHeader', () => {
  //   ['decade', 'year', 'month', 'quarter', 'date', 'time'].forEach((mode) => {
  //     it(mode, () => {
  //       render(<DayPickerPanel mode={mode as any} hideHeader />);
  //       expect(document.querySelector('.rc-picker-header')).toBeFalsy();
  //     });
  //   });
  // });

  // No this prop now
  // it('onOk to trigger', () => {
  //   const onOk = jest.fn();
  //   const { container } = render(<DayPickerPanel picker="time" onOk={onOk} />);
  //   fireEvent.click(
  //     container.querySelector('.rc-picker-time-panel-column').querySelectorAll('li')[3],
  //   );

  //   expect(onOk).not.toHaveBeenCalled();
  //   confirmOK();
  //   expect(isSame(onOk.mock.calls[0][0], '1990-09-03 03:00:00')).toBeTruthy();
  // });

  it('monthCellRender', () => {
    const { container } = render(
      <DayPickerPanel picker="month" monthCellRender={(date) => date.format('YYYY-MM')} />,
    );

    expect(container.querySelector('tbody')).toMatchSnapshot();
  });

  it('pass dateRender when picker is month', () => {
    const { container } = render(
      <DayPickerPanel picker="month" dateRender={(date) => date.format('YYYY-MM')} />,
    );

    expect(container.querySelector('tbody')).toMatchSnapshot();
  });

  describe('start weekday should be correct', () => {
    [
      { locale: zhCN, startDate: '30' },
      { locale: enUS, startDate: '29' },
    ].forEach(({ locale, startDate }) => {
      it(locale.locale, () => {
        const { container } = render(
          <DayPickerPanel defaultValue={getDay('2020-04-02')} locale={locale} />,
        );

        expect(container.querySelector('td').textContent).toEqual(startDate);
      });
    });

    [
      { locale: zhCN, startDate: '24' },
      { locale: enUS, startDate: '1' },
    ].forEach(({ locale, startDate }) => {
      it(`another align test of ${locale.locale}`, () => {
        const { container } = render(
          <DayPickerPanel defaultValue={getDay('2020-03-01')} locale={locale} />,
        );

        expect(container.querySelector('td').textContent).toEqual(startDate);
      });
    });

    it('correct firstDayOfWeek', () => {
      const { container, rerender } = render(<DayPickerPanel locale={enUS} />);
      expect(container.querySelector('.rc-picker-cell-inner').textContent).toEqual('26');

      rerender(<DayPickerPanel locale={zhCN} />);
      expect(container.querySelector('.rc-picker-cell-inner').textContent).toEqual('27');
    });
  });

  const supportCellRenderPicker: PanelMode[] = [
    'year',
    'month',
    'date',
    'quarter',
    'week',
    'time',
    'decade',
  ];

  const getCurText = (picker: PanelMode, current: Dayjs | number | string) => {
    switch (picker) {
      case 'time':
        return current;
      case 'decade':
        return (current as Dayjs).get('year');
      case 'date':
      case 'year':
      case 'month':
      case 'quarter':
      case 'week':
        return (current as Dayjs).get(picker as any) as any;
    }
  };

  it(`override cell with cellRender when pass showTime`, () => {
    const App = () => (
      <DayPickerPanel
        showTime
        cellRender={(current, info) => (
          <div className="customWrapper">{getCurText(info.type, current)}</div>
        )}
      />
    );

    const { container } = render(<App />);

    expect(container.querySelector('.customWrapper')).toBeTruthy();
    expect(container.querySelector(`.rc-picker-date-panel`)).toBeTruthy();
    expect(container.querySelector(`.rc-picker-time-panel`)).toBeTruthy();
    expect(container).toMatchSnapshot();
  });

  supportCellRenderPicker.forEach((picker) => {
    it(`override cell with cellRender in ${picker}`, () => {
      const App = () => (
        <DayPickerPanel
          picker={picker as any}
          cellRender={(current) => (
            <div className="customWrapper">{getCurText(picker, current)}</div>
          )}
        />
      );

      const { container } = render(<App />);

      expect(container.querySelector('.customWrapper')).toBeTruthy();
      expect(container.querySelector(`.rc-picker-${picker}-panel`)).toBeTruthy();
      expect(container).toMatchSnapshot();
    });

    it('warning with dateRender and monthCellRender', () => {
      resetWarned();
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <DayPickerPanel
          picker={picker as any}
          dateRender={(current) => (
            <div className="customWrapper">{getCurText(picker, current)}</div>
          )}
          monthCellRender={(current) => (
            <div className="customWrapper">{getCurText(picker, current)}</div>
          )}
        />,
      );
      expect(errSpy).toHaveBeenCalledWith(
        "Warning: 'dateRender' is deprecated. Please use 'cellRender' instead.",
      );
      expect(errSpy).toHaveBeenCalledWith(
        "Warning: 'monthCellRender' is deprecated. Please use 'cellRender' instead.",
      );

      errSpy.mockRestore();
    });

    it(`append cell with cellRender in ${picker}`, () => {
      const App = () => (
        <DayPickerPanel
          picker={picker as any}
          cellRender={(current, info) =>
            React.cloneElement(
              info.originNode,
              {
                ...info.originNode.props,
                className: `${info.originNode.props.className} customInner`,
              },
              <div className="customWrapper">{getCurText(picker, current)}</div>,
            )
          }
        />
      );

      const { container } = render(<App />);

      expect(container.querySelector('.customWrapper')).toBeTruthy();
      expect(container.querySelector('.customInner')).toBeTruthy();
      expect(container.querySelector(`.rc-picker-${picker}-panel`)).toBeTruthy();
      expect(container).toMatchSnapshot();
    });
  });

  it('week picker current should check year', () => {
    const { container } = render(<DayPickerPanel picker="week" value={getDay('1990-09-03')} />);
    expect(
      container.querySelector('.rc-picker-week-panel-row-selected td[title="9/3/1990"]'),
    ).toBeTruthy();

    // Diff year
    fireEvent.click(container.querySelector('.rc-picker-header-super-next-btn'));
    expect(container.querySelector('td[title="9/3/1991"]')).toBeTruthy();
    expect(container.querySelector('.rc-picker-week-panel-row-selected')).toBeFalsy();
  });

  describe('TimePanel', () => {
    it('not crash', () => {
      const onChange = jest.fn();

      const { container } = render(
        <DayPickerPanel
          picker="time"
          value={null}
          pickerValue={null}
          onChange={onChange}
          hideDisabledOptions
          disabledTime={() => ({
            disabledHours: () => [0],
            disabledMinutes: () => [0, 1],
            disabledSeconds: () => [0, 1, 2],
          })}
        />,
      );

      fireEvent.click(container.querySelector('.rc-picker-time-panel-column').querySelector('li'));
      expect(isSame(onChange.mock.calls[0][0], '1990-09-03 01:02:03')).toBeTruthy();
    });

    it('support milliseconds', () => {
      const onChange = jest.fn();
      const { container } = render(
        <DayPickerPanel
          picker="time"
          format="HH:mm:ss.SSS"
          onChange={onChange}
          hideDisabledOptions
          disabledTime={() => ({
            disabledMilliseconds: () => [0],
          })}
        />,
      );

      fireEvent.click(
        container.querySelectorAll('.rc-picker-time-panel-column')[3].querySelector('li'),
      );
      expect(onChange.mock.calls[0][0].format('SSS')).toEqual('100');
    });

    it('meridiem', () => {
      const onChange = jest.fn();
      const { container } = render(
        <DayPickerPanel
          picker="time"
          defaultValue={getDay('2000-01-01 03:03:03')}
          format="HH:mm:ss a"
          onChange={onChange}
        />,
      );

      // PM
      fireEvent.click(
        container.querySelectorAll('.rc-picker-time-panel-column')[3].querySelectorAll('li')[1],
      );
      expect(onChange.mock.calls[0][0].format('HH:mm:ss')).toEqual('15:03:03');
      onChange.mockClear();

      // AM
      fireEvent.click(
        container.querySelectorAll('.rc-picker-time-panel-column')[3].querySelectorAll('li')[0],
      );
      expect(onChange.mock.calls[0][0].format('HH:mm:ss')).toEqual('03:03:03');
    });
  });

  it('showHour, showMinute, !showSecond', () => {
    const { container } = render(
      <DayPickerPanel
        showTime={{
          showHour: true,
          showMinute: true,
        }}
      />,
    );

    expect(container.querySelectorAll('.rc-picker-time-panel-column')).toHaveLength(2);
  });

  it('use12Hours with format', () => {
    const { container } = render(
      <DayPickerPanel picker="time" use12Hours defaultValue={getDay('2000-01-01 01:02:03')} />,
    );

    expect(container.querySelector('.rc-picker-header-view').textContent).toEqual('01:02:03 AM');
  });

  it('year panel disabled check', () => {
    const { container } = render(
      <DayPickerPanel
        picker="year"
        disabledDate={(date) => date.isBefore(getDay('1990-12-25'))}
        defaultValue={getDay('1990-01-01')}
      />,
    );

    expect(container.querySelector('.rc-picker-cell-selected').textContent).toEqual('1990');
  });
});
