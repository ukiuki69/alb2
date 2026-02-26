import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Button, makeStyles, Paper, Typography, IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { blue } from '@material-ui/core/colors';
import { getLS, setLS } from '../../modules/localStrageOprations';
import { getCreatedDatesFromLS } from './utility/planLSUtils';

const normalizeMonth = (value, fallback) => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : fallback;
};

const useStyles = makeStyles({
  outsideNotify: {
    position: 'fixed',
    bottom: 32,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 300,
    padding: '16px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: blue[600],
    color: '#eee',
    '& .contentWrapper': {
      width: '100%',
    },
    '& .text': {
      color: '#eee',
      fontWeight: 500,
      textAlign: 'left',
      lineHeight: 1.4,
    },
    '& .btnWrapper': {
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
    },
    '& .btn': {
      fontWeight: 'bold',
      boxShadow: 'none',
      backgroundColor: '#eee',
      color: blue[700],
      '&:hover': {
        backgroundColor: '#fff',
      }
    },
    '& .closeBtn': {
      position: 'absolute',
      top: -12,
      right: -12,
      backgroundColor: blue[800],
      color: '#fff',
      padding: 4,
      '&:hover': {
        backgroundColor: blue[900],
      },
      '& .MuiSvgIcon-root': {
        fontSize: 18,
      }
    }
  }
});

/**
 * 表示範囲外の日付通知コンポーネント (独立版)
 */
const PlanOutsideNotify = () => {
  const classes = useStyles();
  const [isNotifyClosed, setIsNotifyClosed] = useState(false);
  const stdDate = useSelector(state => state.stdDate);

  // ローカルストレージから最新の状態を取得して計算（不正値はフォールバック）
  const curMonth = normalizeMonth(getLS('planCurMonth') || stdDate, stdDate);
  const createdDates = getCreatedDatesFromLS();

  // 表示範囲（7ヶ月間）を計算
  const getRange = (baseMonth) => {
    if (!baseMonth) return { start: '', end: '' };
    const date = new Date(baseMonth);
    const months = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(date);
      d.setMonth(d.getMonth() - i);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return { start: months[0], end: months[months.length - 1] };
  };

  const { start: startMonthStr, end: endMonthStr } = getRange(curMonth);

  // 過去と未来の範囲外日付を分離
  const pastOutsideDates = createdDates.filter(d => d.slice(0, 7) < startMonthStr).sort();
  const futureOutsideDates = createdDates.filter(d => d.slice(0, 7) > endMonthStr).sort();
  const outsideMonths = [...new Set([...pastOutsideDates, ...futureOutsideDates].map(d => d.slice(0, 7)))].sort();

  const hasPast = pastOutsideDates.length > 0;
  const hasFuture = futureOutsideDates.length > 0;
  const isAmbiguous = hasPast && hasFuture;

  // 通知を出す必要がない、または閉じられている場合は null
  if (!(hasPast || hasFuture) || isNotifyClosed) return null;

  const handleShowOutsideDates = () => {
    if (isAmbiguous) return;

    let targetMonth = '';
    if (hasPast) {
      const [y, m, d] = pastOutsideDates[0].split('-').map(Number);
      const date = new Date(y, m - 1 + 6, d);
      targetMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    } else if (hasFuture) {
      targetMonth = futureOutsideDates[futureOutsideDates.length - 1];
    }

    if (targetMonth) {
      const safeTargetMonth = normalizeMonth(targetMonth, stdDate);
      setLS('planCurMonth', safeTargetMonth);
      // 再表示時に自動スクロールを強制するフラグをセット
      sessionStorage.setItem('forceAutoScroll', '1');
      // カレンダーの月変更イベントを発火
      window.dispatchEvent(new CustomEvent('planMonthChanged', { detail: safeTargetMonth }));
    }
  };

  return (
    <Paper elevation={6} className={classes.outsideNotify}>
      <IconButton 
        className="closeBtn" 
        size="small" 
        onClick={() => setIsNotifyClosed(true)}
      >
        <CloseIcon />
      </IconButton>
      <div className="contentWrapper">
        <Typography variant="body2" className="text">
          {isAmbiguous 
            ? (outsideMonths.length <= 3 
                ? `${outsideMonths.join(' ')} など表示範囲外の書類が作成されています。`
                : "表示範囲外に複数の書類が作成されています。")
            : `${(hasPast ? pastOutsideDates[0] : futureOutsideDates[0]).slice(0, 7)} 付近の書類が作成されています。`
          }
        </Typography>
      </div>
      {!isAmbiguous && (
        <div className="btnWrapper">
          <Button 
            className="btn" 
            variant="contained" 
            size="small"
            onClick={handleShowOutsideDates}
          >
            表示する
          </Button>
        </div>
      )}
    </Paper>
  );
};

export default PlanOutsideNotify;
