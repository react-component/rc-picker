import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { closePicker, DayRangePicker, getDay, openPicker } from './util/commonUtil';

const fakeTime = getDay('1990-09-03 00:00:00').valueOf();

describe('Picker.DisabledTime', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(fakeTime);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('limit', async () => {
    const wrapper = render(
      <DayRangePicker
        defaultValue={[getDay('2021-06-01'), getDay('2021-06-02')]}
        disabledDate={(current, { from }) => {
          if (from) {
            return Math.abs(current.diff(from, 'days')) >= 2;
          }
          return false;
        }}
      />,
    );

    openPicker(wrapper.container);
    fireEvent.click(wrapper.getByTitle('2021-06-21'));
    fireEvent.click(wrapper.getByTitle('2021-06-26'));
    closePicker(wrapper.container);
    expect(
      [
        wrapper.container.querySelectorAll('input')?.[0]?.value,
        wrapper.container.querySelectorAll('input')?.[0]?.value,
      ].join(' '),
    ).toBe(['2021-06-21', '2021-06-21'].join(' '));
  });
});
