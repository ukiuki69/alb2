import React, { useEffect, useState } from 'react';
import Button from '@material-ui/core/Button';
import CalendarTodayIcon from '@material-ui/icons/CalendarToday';
import CloseIcon from '@material-ui/icons/Close';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import { grey, orange } from '@material-ui/core/colors';
import * as comMod from '../../commonModule';

// 表示切り替えボタン
const ToggleButton = ({ show, onClick }) => (
  <div style={{ textAlign: 'center' }}>
    <Button
      variant="outlined"
      startIcon={show ? <CloseIcon /> : <CalendarTodayIcon />}
      color={show ? 'secondary' : 'primary'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      style={{ marginBottom: 16 }}
      type="button"
    >
      {show ? '閉じる' : '日付を選択'}
    </Button>
  </div>
);

// 個別日付アイテム
const DateItem = ({ d, dateStr, dateList, selectedDates, onDateChange }) => {
  const targetDateStr = d.split('T')[0];
  const day = targetDateStr.split('-')[2];
  const isCurrentDate = targetDateStr === dateStr;

  const dateItem = dateList.find(item => {
    let itemDateStr;
    if (typeof item.date === 'string') {
      itemDateStr = item.date.split('T')[0];
    } else if (item.date instanceof Date) {
      const y = item.date.getFullYear();
      const m = String(item.date.getMonth() + 1).padStart(2, '0');
      const dt = String(item.date.getDate()).padStart(2, '0');
      itemDateStr = `${y}-${m}-${dt}`;
    }
    return itemDateStr === targetDateStr;
  });

  const holiday = dateItem ? dateItem.holiday : 0;
  let labelColor = 'inherit';
  if (holiday === 1) labelColor = orange[500];
  else if (holiday === 2) labelColor = grey[400];

  return (
    <div style={{
      width: 70,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 4px',
      boxSizing: 'border-box'
    }}>
      <Checkbox
        checked={isCurrentDate || selectedDates.has(d)}
        disabled={isCurrentDate}
        onChange={(e) => onDateChange(d, e.target.checked)}
        size="small"
        style={{ padding: 2 }}
      />
      <span style={{ color: labelColor, fontSize: '0.85rem' }}>
        {`${day}日`}
      </span>
    </div>
  );
};

// 日付選択パネル
const DateSelectionPanel = ({
  filteredDateList,
  selectedDates,
  onSelectAll,
  onDateChange,
  onDatesChange,
  dateStr,
  dateList
}) => {
  // 全て選択されているかチェック
  const isAllSelected = filteredDateList.length > 0 && selectedDates.size === filteredDateList.length;
  const isIndeterminate = selectedDates.size > 0 && selectedDates.size < filteredDateList.length;
  
  // 1日の曜日を取得して、グリッドの開始位置を調整するための空セル数を計算
  // filteredDateListは昇順にソートされていると仮定
  // 日曜日が0, 月曜日が1... 土曜日が6
  // 右端を日曜日(0)にするため、各曜日のグリッド上の位置(column)を定義する
  // 月:1, 火:2, 水:3, 木:4, 金:5, 土:6, 日:7
  
  let emptyCells = 0;
  if (filteredDateList.length > 0) {
      // YYYY-MM-DD形式の場合、new Date()でUTC扱いになるブラウザとローカル扱いになるブラウザがあるため
      // 確実にローカルタイムとして扱うために / 区切りに変換するか、明示的にパースする
      // ここではYYYY-MM-DDT...形式(ISO)かYYYY-MM-DD形式が想定される
      let dStr = filteredDateList[0];
      if (dStr.indexOf('T') === -1 && dStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // YYYY-MM-DD -> YYYY/MM/DD に変換してローカルタイムとして解釈させる
        dStr = dStr.replace(/-/g, '/');
      }
      
      const firstDate = new Date(dStr);
      const dayOfWeek = firstDate.getDay(); // 0(Sun) - 6(Sat)
      
      // 日(0) -> 1列目, ... 土(6) -> 7列目
      emptyCells = dayOfWeek;
  }

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  // 週（行）ごとの日付グループ
  const rows = [];
  if (filteredDateList.length > 0) {
    let currentRow = [];
    for (let i = 0; i < emptyCells; i += 1) currentRow.push(null);
    filteredDateList.forEach(d => {
      currentRow.push(d);
      if (currentRow.length === 7) {
        rows.push(currentRow);
        currentRow = [];
      }
    });
    if (currentRow.length > 0) {
      while (currentRow.length < 7) currentRow.push(null);
      rows.push(currentRow);
    }
  }

  return (
    <div style={{
      border: '1px solid #ccc', padding: 16, borderRadius: 4,
    }}>
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={isAllSelected}
              indeterminate={isIndeterminate}
              onChange={(e) => onSelectAll(e.target.checked)}
            />
          }
          label="全て選択"
        />
      </div>
      
      <div style={{ marginTop: 8 }}>
        {filteredDateList.length === 0 ? (
          <div style={{ color: 'orange', textAlign: 'center' }}>
            日付が見つかりません。
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px repeat(7, 1fr)',
            gap: '6px',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div />
            {weekDays.map((w) => (
              <div key={w} style={{
                textAlign: 'center',
                fontSize: '0.75rem',
                color: w === '日' ? orange[500] : (w === '土' ? grey[500] : 'inherit'),
                fontWeight: 'bold',
                paddingBottom: '4px'
              }}>
                {w}
              </div>
            ))}

            {rows.map((row, rowIndex) => {
              const rowDates = row.filter(d => d !== null);
              const activeRowDates = rowDates.filter(d => d.split('T')[0] !== dateStr);
              const rowSelectedCount = activeRowDates.filter(d => selectedDates.has(d)).length;
              const isRowAllSelected = activeRowDates.length > 0 && rowSelectedCount === activeRowDates.length;
              const isRowIndeterminate = rowSelectedCount > 0 && rowSelectedCount < activeRowDates.length;

              return (
                <React.Fragment key={`row-${rowIndex}`}>
                  <div style={{ textAlign: 'center' }}>
                    <Checkbox
                      size="small"
                      style={{ padding: 2 }}
                      checked={isRowAllSelected}
                      indeterminate={isRowIndeterminate}
                      onChange={(e) => onDatesChange(activeRowDates, e.target.checked)}
                    />
                  </div>
                  {row.map((d, i) => (
                    <div key={d ? d : `empty-${rowIndex}-${i}`}>
                      {d ? (
                        <DateItem
                          d={d}
                          dateStr={dateStr}
                          dateList={dateList}
                          selectedDates={selectedDates}
                          onDateChange={onDateChange}
                        />
                      ) : (
                        <div style={{ width: 70, height: 32 }} />
                      )}
                    </div>
                  ))}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// 日付選択コンポーネント（メイン）
const DateSelectionInMonth = (props) => {
  const { 
    date, dateList, selectedDates: propSelectedDates, onDateSelection, showAllDates = true,
    defaultShow = false,
  } = props;
  const [showDateList, setShowDateList] = useState(defaultShow);
  const [selectedDates, setSelectedDates] = useState(new Set(propSelectedDates));
  
  // propsのselectedDatesが変更されたときに状態を同期
  useEffect(() => {
    setSelectedDates(new Set(propSelectedDates));
  }, [propSelectedDates]);
  
  // dateを文字列形式に統一
  const dateStr = typeof date === 'string' ? date : comMod.formatDate(date, 'YYYY-MM-DD');
  
  // dateListから日付文字列を抽出し、date以降の日付のみをフィルタリング
  const filteredDateList = dateList.filter(item => {
    try {
      // 型をチェックして適切に処理
      let dateOnly;
      if (typeof item.date === 'string') {
        // 文字列の場合はISO文字列から日付部分を抽出
        dateOnly = item.date.split('T')[0];
      } else if (item.date instanceof Date) {
        // Dateオブジェクトの場合はローカル時間で日付を取得
        const year = item.date.getFullYear();
        const month = String(item.date.getMonth() + 1).padStart(2, '0');
        const day = String(item.date.getDate()).padStart(2, '0');
        dateOnly = `${year}-${month}-${day}`;
      } else {
        return false;
      }

      if (showAllDates) return true;
      
      const isAfterOrEqual = dateOnly >= dateStr;
      
      return isAfterOrEqual;
    } catch (error) {
      return false;
    }
  }).map(item => {
    // フィルタリング後に適切な形式でISO文字列を取得
    if (typeof item.date === 'string') {
      return item.date;
    } else if (item.date instanceof Date) {
      // Dateオブジェクトの場合はローカル時間でISO文字列を作成
      const year = item.date.getFullYear();
      const month = String(item.date.getMonth() + 1).padStart(2, '0');
      const day = String(item.date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}T00:00:00.000Z`;
    }
    return null;
  }).filter(date => date !== null); // nullを除外
  
  // 全て選択/解除のハンドラー
  const handleSelectAll = (checked) => {
    if (checked) {
      const allDates = new Set(filteredDateList);
      setSelectedDates(allDates);
      onDateSelection(Array.from(allDates));
    } else {
      setSelectedDates(new Set());
      onDateSelection([]);
    }
  };
  
  // 個別日付の選択ハンドラー
  const handleDateChange = (targetDate, checked) => {
    const newSelectedDates = new Set(selectedDates);
    if (checked) {
      newSelectedDates.add(targetDate);
    } else {
      newSelectedDates.delete(targetDate);
    }
    setSelectedDates(newSelectedDates);
    onDateSelection(Array.from(newSelectedDates));
  };

  // 週単位の選択・解除
  const handleDatesChange = (targetDates, checked) => {
    const newSelectedDates = new Set(selectedDates);
    targetDates.forEach(d => {
      if (checked) newSelectedDates.add(d);
      else newSelectedDates.delete(d);
    });
    setSelectedDates(newSelectedDates);
    onDateSelection(Array.from(newSelectedDates));
  };
  
  return (
    <div>
      {!defaultShow && (
        <ToggleButton 
          show={showDateList} 
          onClick={() => setShowDateList(!showDateList)} 
        />
      )}
      
      {showDateList && (
        <DateSelectionPanel
          filteredDateList={filteredDateList}
          selectedDates={selectedDates}
          onSelectAll={handleSelectAll}
          onDateChange={handleDateChange}
          onDatesChange={handleDatesChange}
          dateStr={dateStr}
          dateList={dateList}
        />
      )}
    </div>
  );
};

export default DateSelectionInMonth;
