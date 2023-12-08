import classNames from 'classnames';
import * as React from 'react';
import {
  formatValue,
  getWeekStartDate,
  isSameDate,
  isSameMonth,
  WEEK_DAY_COUNT,
} from '../../../utils/dateUtil';
import type { PanelMode, SharedPanelProps } from '../../interface';
import { PanelContext, useInfo } from '../context';
import PanelBody from '../PanelBody';
import PanelHeader from '../PanelHeader';

export interface DatePanelProps<DateType> extends SharedPanelProps<DateType> {
  panelName?: PanelMode;
  rowClassName?: (date: DateType) => string;

  /** Used for `WeekPanel` */
  mode?: PanelMode;
}

export default function DatePanel<DateType = any>(props: DatePanelProps<DateType>) {
  const {
    prefixCls,
    panelName = 'date',
    locale,
    generateConfig,
    pickerValue,
    onPickerValueChange,
    onModeChange,
    mode,
    disabledDate,
    onChange,
    onHover,
    showWeek,
  } = props;

  const panelPrefixCls = `${prefixCls}-${panelName}-panel`;

  const cellPrefixCls = `${prefixCls}-cell`;

  // ========================== Base ==========================
  const [info, now] = useInfo(props);
  const weekFirstDay = generateConfig.locale.getWeekFirstDay(locale.locale);
  const baseDate = getWeekStartDate(locale.locale, generateConfig, pickerValue);
  const month = generateConfig.getMonth(pickerValue);

  // =========================== PrefixColumn ===========================
  const prefixColumn =
    mode === 'week' || showWeek
      ? (date: DateType) => {
          // >>> Additional check for disabled
          const disabled = disabledDate?.(date, { type: 'week' });

          return (
            <td
              key="week"
              className={classNames(cellPrefixCls, `${cellPrefixCls}-week`, {
                [`${cellPrefixCls}-disabled`]: disabled,
              })}
              // Operation: Same as code in PanelBody
              onClick={() => {
                if (!disabled) {
                  onChange(date);
                }
              }}
              onMouseEnter={() => {
                if (!disabled) {
                  onHover?.(date);
                }
              }}
              onMouseLeave={() => {
                if (!disabled) {
                  onHover?.(null);
                }
              }}
            >
              <div className={`${cellPrefixCls}-inner`}>
                {generateConfig.locale.getWeek(locale.locale, date)}
              </div>
            </td>
          );
        }
      : null;

  // ========================= Cells ==========================
  // >>> Header Cells
  const headerCells: React.ReactNode[] = [];
  const weekDaysLocale: string[] =
    locale.shortWeekDays ||
    (generateConfig.locale.getShortWeekDays
      ? generateConfig.locale.getShortWeekDays(locale.locale)
      : []);

  if (prefixColumn) {
    headerCells.push(<th key="empty" aria-label="empty cell" />);
  }
  for (let i = 0; i < WEEK_DAY_COUNT; i += 1) {
    headerCells.push(<th key={i}>{weekDaysLocale[(i + weekFirstDay) % WEEK_DAY_COUNT]}</th>);
  }

  // >>> Body Cells
  const getCellDate = (date: DateType, offset: number) => {
    return generateConfig.addDate(date, offset);
  };

  const getCellText = (date: DateType) => {
    return formatValue(date, {
      locale,
      format: locale.cellDateFormat,
      generateConfig,
    });
  };

  const getCellClassName = (date: DateType) => {
    const classObj = {
      [`${prefixCls}-cell-in-view`]: isSameMonth(generateConfig, date, pickerValue),
      [`${prefixCls}-cell-today`]: isSameDate(generateConfig, date, now),
    };

    return classObj;
  };

  // ========================= Header =========================
  const monthsLocale: string[] =
    locale.shortMonths ||
    (generateConfig.locale.getShortMonths
      ? generateConfig.locale.getShortMonths(locale.locale)
      : []);

  const yearNode: React.ReactNode = (
    <button
      type="button"
      key="year"
      onClick={() => {
        onModeChange('year', pickerValue);
      }}
      tabIndex={-1}
      className={`${prefixCls}-year-btn`}
    >
      {formatValue(pickerValue, {
        locale,
        format: locale.yearFormat,
        generateConfig,
      })}
    </button>
  );
  const monthNode: React.ReactNode = (
    <button
      type="button"
      key="month"
      onClick={() => {
        onModeChange('month', pickerValue);
      }}
      tabIndex={-1}
      className={`${prefixCls}-month-btn`}
    >
      {locale.monthFormat
        ? formatValue(pickerValue, {
            locale,
            format: locale.monthFormat,
            generateConfig,
          })
        : monthsLocale[month]}
    </button>
  );

  const monthYearNodes = locale.monthBeforeYear ? [monthNode, yearNode] : [yearNode, monthNode];

  // ========================= Render =========================
  return (
    <PanelContext.Provider
      value={{
        type: 'date',
        ...info,
      }}
    >
      <div className={panelPrefixCls}>
        {/* Header */}
        <PanelHeader
          onOffset={(offset) => {
            onPickerValueChange(generateConfig.addMonth(pickerValue, offset));
          }}
          onSuperOffset={(offset) => {
            onPickerValueChange(generateConfig.addYear(pickerValue, offset));
          }}
        >
          {monthYearNodes}
        </PanelHeader>

        {/* Body */}
        <PanelBody
          mode="date"
          titleFormat={locale.fieldDateFormat}
          {...props}
          colNum={WEEK_DAY_COUNT}
          rowNum={6}
          baseDate={baseDate}
          // Header
          headerCells={headerCells}
          // Body
          getCellDate={getCellDate}
          getCellText={getCellText}
          getCellClassName={getCellClassName}
          prefixColumn={prefixColumn}
        />
      </div>
    </PanelContext.Provider>
  );
}
