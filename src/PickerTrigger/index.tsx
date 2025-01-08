import Trigger from '@rc-component/trigger';
import type { AlignType, BuildInPlacements } from '@rc-component/trigger/lib/interface';
import classNames from 'classnames';
import * as React from 'react';
import { getRealPlacement } from '../utils/uiUtil';
import PickerContext from '../PickerInput/context';

const BUILT_IN_PLACEMENTS = {
  bottomLeft: {
    points: ['tl', 'bl'],
    offset: [0, 4],
    overflow: {
      adjustX: 1,
      adjustY: 1,
    },
  },
  bottomRight: {
    points: ['tr', 'br'],
    offset: [0, 4],
    overflow: {
      adjustX: 1,
      adjustY: 1,
    },
  },
  topLeft: {
    points: ['bl', 'tl'],
    offset: [0, -4],
    overflow: {
      adjustX: 0,
      adjustY: 1,
    },
  },
  topRight: {
    points: ['br', 'tr'],
    offset: [0, -4],
    overflow: {
      adjustX: 0,
      adjustY: 1,
    },
  },
};

export type PickerTriggerProps = {
  popupElement: React.ReactElement;
  popupStyle?: React.CSSProperties;
  children: React.ReactElement;
  transitionName?: string;
  getPopupContainer?: (node: HTMLElement) => HTMLElement;
  popupAlign?: AlignType;
  range?: boolean;

  // Placement
  popupClassName?: string;
  placement?: string;
  builtinPlacements?: BuildInPlacements;
  direction?: 'ltr' | 'rtl';
  alignedPlacement?: string;
  // Visible
  visible: boolean;
  onClose: () => void;
};

function PickerTrigger({
  popupElement,
  popupStyle,
  popupClassName,
  popupAlign,
  transitionName,
  getPopupContainer,
  children,
  range,
  placement,
  builtinPlacements = BUILT_IN_PLACEMENTS,
  direction,
  alignedPlacement,
  // Visible
  visible,
  onClose,
}: PickerTriggerProps) {
  const { prefixCls, setAlignedPlacement } = React.useContext(PickerContext);
  const dropdownPrefixCls = `${prefixCls}-dropdown`;

  const realPlacement = getRealPlacement(alignedPlacement || placement, direction === 'rtl');

  return (
    <Trigger
      showAction={[]}
      hideAction={['click']}
      popupPlacement={realPlacement}
      builtinPlacements={builtinPlacements}
      prefixCls={dropdownPrefixCls}
      popupTransitionName={transitionName}
      popup={popupElement}
      popupAlign={popupAlign}
      popupVisible={visible}
      popupClassName={classNames(popupClassName, {
        [`${dropdownPrefixCls}-range`]: range,
        [`${dropdownPrefixCls}-rtl`]: direction === 'rtl',
      })}
      popupStyle={popupStyle}
      stretch="minWidth"
      getPopupContainer={getPopupContainer}
      onPopupAlign={(_, align) => {
        if (!setAlignedPlacement) return;

        const matchedKey = Object.keys(BUILT_IN_PLACEMENTS).find(
          (key) =>
            BUILT_IN_PLACEMENTS[key].points[0] === align.points[0] &&
            BUILT_IN_PLACEMENTS[key].points[1] === align.points[1],
        );

        if (matchedKey) {
          setAlignedPlacement(matchedKey);
        }
      }}
      onPopupVisibleChange={(nextVisible) => {
        if (!nextVisible) {
          onClose();
        }
      }}
    >
      {children}
    </Trigger>
  );
}

export default PickerTrigger;
