import React, { useState, useEffect } from 'react';
import { Button, makeStyles, Box } from '@material-ui/core';
import { getLodingStatus } from '../../commonModule';
import { useDispatch, useSelector } from 'react-redux';
import { sendPartOfScheduleCompt } from '../../albCommonModule';
import { setSnackMsg, setStore } from '../../Actions';
import { blue, red } from '@material-ui/core/colors';

const useStyles = makeStyles((theme) => ({
  container: {
    position: 'fixed',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%) translateY(100px)',
    zIndex: 1100,
    transition: 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)',
    pointerEvents: 'none', // コンテナ自体はイベントを透過させる
  },
  visible: {
    transform: 'translateX(-50%) translateY(0)',
  },
  button: {
    pointerEvents: 'auto', // ボタン本体はイベントを受け取る
  },
  today: {
    backgroundColor: red[600],
    color: '#ffffff',
    '&:hover': {
      backgroundColor: red[700],
    },
  },
  future: {
    backgroundColor: blue[800],
    color: '#ffffff',
    '&:hover': {
      backgroundColor: blue[900],
    },
  },
}));

const SchConvUserReserveToAttendButton = (props) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const {schedule, hid, bid, stdDate} = allState;
  const {uid, onClick, reserveCount: propsReserveCount, hasTodayReserve: propsHasToday, hasFutureReserve: propsHasFuture} = props;
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 1秒待ってから表示開始
    const timer = setTimeout(() => {
      setShow(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // ストアデータロード中は非表示
  if(!loadingStatus.loaded) return null;

  const uidStr = uid ? "UID" + uid : null;
  const sch = uidStr ? (schedule?.[uidStr] ?? {}) : {};
  
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayDid = `D${y}${m}${d}`;

  const entries = Object.entries(sch);
  
  // propsで渡された値を優先、なければ自前で計算
  const reserveCount = propsReserveCount !== undefined 
    ? propsReserveCount 
    : entries.filter(([did, schDt]) => schDt?.reserve).length;

  const hasTodayReserve = propsHasToday !== undefined
    ? propsHasToday
    : entries.some(([did, schDt]) => schDt?.reserve && did.substring(0, 9) === todayDid);

  const hasFutureReserve = propsHasFuture !== undefined
    ? propsHasFuture
    : entries.some(([did, schDt]) => schDt?.reserve && did.substring(0, 9) > todayDid);

  // 予約データがない場合は非表示
  if(reserveCount === 0) return null;

  const handleClick = async() => {
    // propsのonClickがあればそれを実行
    if (onClick) {
      onClick();
      return;
    }

    const newSch = JSON.parse(JSON.stringify(sch));
    const timestamp = new Date().getTime();
    Object.values(newSch).forEach((schDt) => {
      if(schDt?.reserve){
        schDt.absence = false;
        schDt.reserve = false;
        schDt.timestamp = timestamp;
        schDt.reserveFixedTimestamp = timestamp;
      }
    });
    const sendParams = {
      bid, hid, date: stdDate, partOfSch: newSch, uid: uidStr
    }
    const res = await sendPartOfScheduleCompt(sendParams);
    if(res?.data?.result){
      if (uidStr) {
        dispatch(setStore({schedule: {...schedule, [uidStr]: newSch}}));
      }
      dispatch(setSnackMsg('予約を出席として保存しました。'));
    }else{
      dispatch(setSnackMsg('予約を出席として保存できませんでした。', 'error'));
    }
  }

  const isImmediateSave = !onClick;

  return(
    <Box className={`${classes.container} ${show ? classes.visible : ''}`}>
      <Button 
        variant='contained' 
        onClick={handleClick}
        className={`${hasTodayReserve ? classes.today : classes.future} ${classes.button}`}
      >
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          予約
          <span style={{ fontSize: '1.4rem', margin: '0 4px', lineHeight: 1, paddingTop: 2 }}>
            {reserveCount}
          </span>
          件の予約を全て出席に{isImmediateSave ? '変更して保存します' : '変更します'}
        </div>
      </Button>
    </Box>
  )
}
export default SchConvUserReserveToAttendButton;