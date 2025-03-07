/* eslint-disable @typescript-eslint/no-loop-func */
import { fireEvent, render } from '@testing-library/react';
import { resetWarned } from 'rc-util/lib/warning';
import React from 'react';
import { DayPicker, getDay, isOpen, openPicker, selectCell } from './util/commonUtil';

const fakeTime = getDay('1990-09-03 00:00:00').valueOf();

describe('Picker.Multiple', () => {
  // let errorSpy: ReturnType<typeof jest.spyOn>;

  beforeAll(() => {
    // errorSpy = jest.spyOn(console, 'error').mockImplementation(() => null);
  });

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(fakeTime);
    // errorSpy.mockReset();
    resetWarned();
  });
  afterAll(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('onChange', () => {
    const onChange = jest.fn();
    const onCalendarChange = jest.fn();
    const { container } = render(
      <DayPicker multiple onChange={onChange} onCalendarChange={onCalendarChange} needConfirm />,
    );

    expect(container.querySelector('.rc-picker-multiple')).toBeTruthy();

    openPicker(container);

    // Select 3, 1
    selectCell(3);
    selectCell(1);
    expect(onCalendarChange).toHaveBeenCalledWith(
      expect.anything(),
      ['9/1/1990', '9/3/1990'],
      expect.anything(),
    );

    // Select 5
    selectCell(5);
    expect(onChange).not.toHaveBeenCalled();
    expect(isOpen()).toBeTruthy();

    // Confirm
    fireEvent.click(document.querySelector('.rc-picker-ok button'));
    expect(onChange).toHaveBeenCalledWith(expect.anything(), ['9/1/1990', '9/3/1990', '9/5/1990']);

    expect(onChange.mock.calls[0][0]).toHaveLength(3);
  });

  it('panel click to remove', () => {
    const onChange = jest.fn();
    const { container } = render(<DayPicker multiple onChange={onChange} needConfirm />);

    openPicker(container);
    selectCell(1);
    selectCell(3);
    selectCell(5);
    selectCell(3);

    // Confirm
    fireEvent.click(document.querySelector('.rc-picker-ok button'));
    expect(onChange).toHaveBeenCalledWith(expect.anything(), ['9/1/1990', '9/5/1990']);
  });

  it('selector remove', () => {
    const onChange = jest.fn();
    const { container } = render(
      <DayPicker
        multiple
        onChange={onChange}
        defaultValue={[getDay('2000-09-03'), getDay('2000-01-28')]}
      />,
    );

    // Click remove icon
    const removeEle = container.querySelector('.rc-picker-selection-item-remove');
    fireEvent.mouseDown(removeEle);
    fireEvent.click(removeEle);
    expect(onChange).toHaveBeenCalledWith(expect.anything(), ['1/28/2000']);
  });

  it('open to remove selector should not trigger onChange', () => {
    const onChange = jest.fn();
    const { container } = render(
      <DayPicker
        multiple
        needConfirm
        onChange={onChange}
        defaultValue={[getDay('2000-09-03'), getDay('2000-01-28')]}
      />,
    );

    openPicker(container);
    expect(container.querySelectorAll('.rc-picker-selection-item')).toHaveLength(2);

    fireEvent.click(container.querySelector('.rc-picker-selection-item-remove'));
    expect(onChange).not.toHaveBeenCalled();
    expect(container.querySelectorAll('.rc-picker-selection-item')).toHaveLength(1);

    // Confirm
    fireEvent.click(document.querySelector('.rc-picker-ok button'));
    expect(onChange).toHaveBeenCalledWith(expect.anything(), ['1/28/2000']);
  });

  it('hide clearIcon', () => {
    const renderDemo = (allowClear: boolean) => (
      <DayPicker multiple defaultValue={[getDay('2000-01-01')]} allowClear={allowClear} />
    );

    const { container, rerender } = render(renderDemo(true));
    expect(container.querySelector('.rc-picker-clear')).toBeTruthy();

    rerender(renderDemo(false));
    expect(container.querySelector('.rc-picker-clear')).toBeFalsy();
  });

  it('removeIcon', () => {
    const { container } = render(
      <DayPicker
        multiple
        defaultValue={[getDay('2000-01-01')]}
        removeIcon={<span className="custom-remove">Remove</span>}
      />,
    );

    expect(container.querySelector('.custom-remove')).toBeTruthy();
  });

  describe('placeholder', () => {
    it('show placeholder', () => {
      const { container } = render(<DayPicker multiple placeholder="bamboo" />);
      expect(
        container.querySelector<HTMLSpanElement>('.rc-picker-selection-placeholder').textContent,
      ).toBe('bamboo');
    });

    it('hide if has value', () => {
      const { container } = render(
        <DayPicker multiple defaultValue={[getDay('2000-01-01')]} placeholder="bamboo" />,
      );
      expect(
        container.querySelector<HTMLSpanElement>('.rc-picker-selection-placeholder'),
      ).toBeFalsy();
    });
  });

  it('click year panel should not select', () => {
    const onChange = jest.fn();
    const onCalendarChange = jest.fn();
    const { container } = render(
      <DayPicker multiple onChange={onChange} onCalendarChange={onCalendarChange} needConfirm />,
    );

    expect(container.querySelector('.rc-picker-multiple')).toBeTruthy();

    openPicker(container);

    // Select year
    fireEvent.click(document.querySelector('.rc-picker-year-btn'));
    selectCell(1998);
    expect(onChange).not.toHaveBeenCalled();
    expect(onCalendarChange).not.toHaveBeenCalled();

    // Select Month
    selectCell('Oct');
    expect(onChange).not.toHaveBeenCalled();
    expect(onCalendarChange).not.toHaveBeenCalled();

    // Select Date
    selectCell(23);
    expect(onChange).not.toHaveBeenCalled();
    expect(onCalendarChange).toHaveBeenCalledWith(
      expect.anything(),
      ['10/23/1998'],
      expect.anything(),
    );

    // Confirm
    fireEvent.click(document.querySelector('.rc-picker-ok button'));
    expect(onChange).toHaveBeenCalledWith(expect.anything(), ['10/23/1998']);
  });
});
