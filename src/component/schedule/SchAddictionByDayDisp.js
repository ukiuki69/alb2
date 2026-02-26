import React from 'react';
import { useSelector } from 'react-redux';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import { Tooltip } from '@material-ui/core';
import { blue, grey, orange, green, pink, amber, deepPurple } from '@material-ui/core/colors';
import { shortWord } from '../../commonModule';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';

/**
 * 加算設定の組み合わせを一意の文字列（フィンガープリント）にするヘルパー
 */
export const getAddictionFingerprint = (rawData, classroom) => {
  if (!rawData || typeof rawData !== 'object') return '';
  const ignoreKeys = ['timestamp', '利用者負担上限額管理加算', '上限管理結果'];
  
  const extract = (obj, targetClassroom) => {
    const result = {};
    if (!obj) return result;
    Object.entries(obj).forEach(([key, value]) => {
      if (ignoreKeys.includes(key)) return;
      if (value === "" || value === undefined || value === null) return;
      
      if (typeof value === 'object' && value !== null) {
        if (!targetClassroom || key === targetClassroom) {
          result[key] = extract(value);
        }
      } else {
        result[key] = value;
      }
    });
    // キーをソートして正規化
    const sortedResult = {};
    Object.keys(result).sort().forEach(k => {
      sortedResult[k] = result[k];
    });
    return sortedResult;
  };

  const processed = extract(rawData, classroom);
  return Object.keys(processed).length === 0 ? '' : JSON.stringify(processed);
};

/**
 * 日毎の加算設定を表示するコンポーネント
 * @param {Object} props
 * @param {string} props.did - 日付ID (Dyyyymmdd形式)
 * @param {boolean} props.disableTooltip - ツールチップを表示しない場合はtrue
 * @param {boolean} props.calenderView - カレンダー用の縦積み表示にする場合はtrue
 * @param {string} props.bgColor - 背景色（MUIカラーの文字列など）
 */
const SchAddictionByDayDisp = ({ did, disableTooltip = false, calenderView = false, bgColor = 'transparent' }) => {
  const schedule = useSelector(state => state.schedule);
  const classroom = useSelector(state => state.classroom);
  const serviceItems = useSelector(state => state.serviceItems);
  let service = useSelector(state => state.service);

  // serviceが""のときの判定ロジック
  if (service === "") {
    if (serviceItems && serviceItems.length === 1) {
      service = serviceItems[0];
    } else {
      return null;
    }
  }

  // データの取得
  const rawData = schedule?.[service]?.[did];
  if (!rawData || typeof rawData !== 'object') {
    return null;
  }

  // 表示用アイテムの作成
  const directItems = [];
  const classroomItems = [];
  const ignoreKeys = ['timestamp', '利用者負担上限額管理加算', '上限管理結果'];

  Object.entries(rawData).forEach(([key, value]) => {
    if (ignoreKeys.includes(key)) return;
    if (value === "") return;

    if (value && typeof value === 'object') {
      // オブジェクト（単位配下）の場合
      if (!classroom || key === classroom) {
        Object.entries(value).forEach(([subKey, subValue]) => {
          if (subValue === "") return;
          classroomItems.push({ classroom: key, key: subKey, value: subValue });
        });
      }
    } else {
      // オブジェクトでない（直下のデータ）の場合
      directItems.push({ classroom: null, key, value });
    }
  });

  // 直下のデータをソート
  directItems.sort((a, b) => a.key.localeCompare(b.key));
  // 単位配下のデータをソート (単位名 -> キー名の順)
  classroomItems.sort((a, b) => {
    if (a.classroom !== b.classroom) {
      return a.classroom.localeCompare(b.classroom);
    }
    return a.key.localeCompare(b.key);
  });

  if (directItems.length === 0 && classroomItems.length === 0) {
    return null;
  }

  const tooltipTitle = "この日に設定された加算を表示しています";

  const renderItems = () => {
    if (calenderView) {
      // カレンダー表示の場合
      const groupedClassroom = classroomItems.reduce((acc, item) => {
        if (!acc[item.classroom]) acc[item.classroom] = [];
        acc[item.classroom].push(item);
        return acc;
      }, {});

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
          {directItems.length > 0 && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '2px 4px', padding: '1px 2px',
            }}>
              {directItems.map((item, index) => (
                <AddictionItem key={`dir-${index}`} item={item} calenderView={calenderView} />
              ))}
            </div>
          )}
          {Object.entries(groupedClassroom).map(([clsName, cItems], idx) => (
            <div key={`cls-group-${idx}`} style={{
              display: 'flex', flexDirection: 'column', gap: '1px', padding: '1px 2px',
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: blue[800], display: 'flex', alignItems: 'center', lineHeight: 1 }}>
                <FiberManualRecordIcon style={{ fontSize: '0.5rem', marginRight: 1 }} />
                {shortWord(clsName)}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1px 4px', paddingLeft: 2 }}>
                {cItems.map((item, index) => (
                  <AddictionItem key={`cls-${index}`} item={item} calenderView={calenderView} hideClassroomName />
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // 通常の横並び表示
    const items = [...directItems, ...classroomItems];
    return (
      <div
        style={{
          display: 'flex', flexWrap: 'wrap', gap: '8px 16px',
        }}
      >
        {items.map((item, index) => (
          <AddictionItem key={index} item={item} />
        ))}
      </div>
    );
  };

  const content = (
    <div
      className="SchAddictionByDayDisp"
      style={{
        padding: calenderView ? '1px' : '4px 8px',
        backgroundColor: calenderView ? bgColor : grey[100],
        borderRadius: '4px',
        margin: calenderView ? '2px 0' : '8px auto',
        width: calenderView ? '100%' : 400,
      }}
    >
      {renderItems()}
    </div>
  );

  if (disableTooltip) return content;

  return (
    <Tooltip title={tooltipTitle} arrow>
      {content}
    </Tooltip>
  );
};

/**
 * 個別の加算項目を表示するサブコンポーネント
 */
const AddictionItem = ({ item, calenderView, hideClassroomName = false }) => {
  const isOne = String(item.value) === '1';
  // 直下のデータ（item.classroomがない場合）はbold、それ以外はnormal
  const fontWeight = item.classroom ? 'normal' : 'bold';
  const fontSize = '0.8rem';

  const valueDisp = typeof item.value === 'object'
    ? JSON.stringify(item.value)
    : shortWord(String(item.value));

  const isSpecialKey = calenderView && item.key === "児童指導員等加配加算";

  return (
    <div style={{ display: 'flex', alignItems: 'center', fontSize: fontSize, lineHeight: 1.1 }}>
      {item.classroom && !hideClassroomName && (
        <>
          <span style={{ fontWeight: 'bold', color: blue[700] }}>
            {shortWord(item.classroom)}
          </span>
          <PlayArrowIcon
            style={{ fontSize: calenderView ? '0.6rem' : '0.9rem', color: grey[600], margin: '0 1px' }}
          />
        </>
      )}
      {(!item.classroom || !hideClassroomName) && !calenderView && (
        <FiberManualRecordIcon style={{ fontSize: '0.6rem', marginRight: 2, color: grey[500] }} />
      )}
      {calenderView && !item.classroom && (
         <FiberManualRecordIcon style={{ fontSize: '0.5rem', marginRight: 1, color: blue[500] }} />
      )}
      {isSpecialKey ? (
        <span style={{ fontWeight: fontWeight }}>{valueDisp}</span>
      ) : (
        <>
          <span style={{ fontWeight: fontWeight }}>{shortWord(item.key)}</span>
          {!isOne && (
            <>
              <ChevronRightIcon
                style={{ fontSize: calenderView ? '0.6rem' : '1rem', color: grey[600], margin: calenderView ? '0 -4px' : '0 1px' }}
              />
              <span style={{ fontWeight: fontWeight }}>{valueDisp}</span>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default SchAddictionByDayDisp;
