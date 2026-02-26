import { Button, makeStyles, useMediaQuery } from '@material-ui/core';
import { blue, grey, red, teal } from '@material-ui/core/colors';
import React, {useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { univApiCall } from '../../modules/api';
import { setMonthDirect, setNewMonth, fetchAll } from '../../modules/thunks';
import { formatDate, getLodingStatus, null2Zero, parsePermission } from '../../commonModule';
import KeyboardArrowLeftIcon from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import CloseIcon from '@material-ui/icons/Close';
import AddIcon from '@material-ui/icons/Add';
import { getSchInitName } from './schUtility/getSchInitName';
import { removeLocalStorageItem } from '../../modules/localStrageOprations';

const useStyles = makeStyles({
  monthListRoot: {
    padding: 8, marginBottom: 24,
    backgroundColor: "#fff",
    '& .flxDiv': {
      display: 'flex', justifyContent: 'center'
    }
  },
  monthInline: {
    textAlign: 'center', padding: '2px 8px 0',
    '& .small': {fontSize: '.7rem'},
    '& .month': {fontSize: '1.1rem'},
    '& .addIcon': {paddingTop: 4, color: blue[800], opacity: 1, cursor: 'pointer'}
  },
  monthOffset: {
    color: teal[900], cursor: 'pointer',
    '& .doubbleIcon .MuiSvgIcon-root':{marginInlineStart: '-.8em'}
  },
  yearMonthWrap: {
    display: 'flex', justifyContent: 'center', width: 450,
    "@media (max-width:500px)": {width: 224},
  },
  // addModeSw: {
  //   color: blue[800], marginLeft: 16, display: 'inline-flex', 
  //   alignItems: 'flex-start',
  //   '& span': {display: 'inline-block', marginInlineStart: 4, marginTop: 4}
  // }
  addModeSw: {
    marginTop: -6, marginLeft: 8,
  },
  msgBox:{
    textAlign: 'center', fontSize: '.8rem', marginBottom: 4, color: blue[800],
  }

});

// 当月を中心とした前後の月を得る
export const getMonthList = (stdDate, offset = 0, before = 4, after = 4) => {
  const pi = (v) => parseInt(v);
  // stdDateを分割して整数化
  const ymd = stdDate.split('-').map(e=>pi(e));
  const d = new Date(ymd[0], ymd[1] - 1, ymd[2]);
  const r = Array(before + after).fill(0).map((e, i)=>{
    const n = before * -1 + i + offset; // 表示する月を今から何ヶ月前に取るか
    const t = new Date(d.getTime());
    t.setDate(1);
    t.setMonth(d.getMonth() + n);
    return formatDate(t, 'YYYY-MM-DD');
  });

  return r;
}

const SchSelectMonthMain = (props) => {
  const allState = useSelector(state=>state);
  const {hid, bid, stdDate, com, schedule} = allState;
  const [res, setRes] = useState([]);
  const [moffset, setMoffset] = useState(0);
  const [addMode, setAddMode] = useState(false)
  const classes = useStyles();
  const limit500px = useMediaQuery("(max-width:500px)");
  const dispatch = useDispatch();
  const weekDayDefaultSet = allState.config.weekDayDefaultSet;
  const mountedRef = useRef(true);
  useEffect(() => () => {
    mountedRef.current = false;
  }, []);
  const style = props.style ?? {};
  const permission = parsePermission(allState.account)[0][0];
  // 先の月を追加するときはこの値を調整する
  const monthAddLimit = permission === 100 ? 2 : 2;
  // データ維持モードは月の追加が出来ないようにする
  const dataKeepOnly = com?.ext?.dataKeepOnly || com?.etc?.dataKeepOnly;

  // 予定が存在する月のリストを derive
  const monthLst = useMemo(() => {
    if (res.data && res.data.result && Array.isArray(res.data.dt)) {
      // 念のため yyyy-mm-dd 形式に正規化して比較するようにする
      return res.data.dt.map(e => e.date.slice(0, 10));
    }
    return [];
  }, [res]);
  
  useEffect(() => {
    const fetchSchedule = async () => {
      const prms = { hid, bid, a: 'fetchScheduleAria' };
      const result = await univApiCall(prms);
      if (mountedRef.current) {
        setRes(result);
      }
    };
    if (hid && bid) fetchSchedule();
  }, [hid, bid]);
  const handleClick = (month, existMonth) => {
    if (!existMonth) return false;
    const prms = {
      newStdDate: month, hid, bid, weekDayDefaultSet, dispatch, 
    }
    // スケジュールの利用者別加算などを初期化を制御するためのローカルストレージアイテム
    // 月の変更時には削除を行う
    const initName = getSchInitName(hid, bid);
    removeLocalStorageItem(initName);
    setMonthDirect(prms);
  }

  const handleClickNewMonth = async (month) => {
    const prms = {
      newStdDate: month, hid, bid, weekDayDefaultSet, dispatch, com, schedule
    }
    await setNewMonth(prms);
    const prms2 = { hid, bid, a: 'fetchScheduleAria' };
    const result = await univApiCall(prms2);
    if (mountedRef.current) {
      setRes(result);
    }
    fetchAll({...prms, stdDate: month});
  }
  const handleOffset = (v) => {
    const t = moffset + v;
    setMoffset(t);
  }
  // 今日時点での当月を得る 当月は10日以前では前月を示す
  let now = new Date();
  if (now.getDate() < 11) now.setMonth(now.getMonth() - 1)
  now.setDate(1);
  const thisMonth = formatDate(now, 'YYYY-MM-DD');
  // 追加可能な未来の月を得る
  now.setMonth(now.getMonth() + monthAddLimit)
  let nextLimit = formatDate(now, 'YYYY-MM-DD');
  // 法改正対応
  // if (nextLimit > '2024-04-01') nextLimit = '2024-04-01';
  // 月のリスト
  const mList = !limit500px ?getMonthList(stdDate, moffset) :getMonthList(stdDate, moffset, 1, 2);
  // 追加可能な月のカウントを得る
  let canBeAddMonthCnt = 0;
  const yearMonth = mList.map((e, i)=>{
    const m = e.split('-')[1];
    const y = (m === '01' || i === 0)? e.split('-')[0]: false;
    // 該当月に予定が存在するか
    const existMonth = monthLst.includes(e);
    const preExistMonth = monthLst.includes(mList[i - 1])
    const style = existMonth
    ? {color: teal[900], cursor: 'pointer'}: {color: grey[500]}
    let canBeAddMonth = false;
    if (e < thisMonth && !existMonth && e >= '2021-04-01') canBeAddMonth = true;
    if (e >= thisMonth && e <= nextLimit && preExistMonth && !existMonth){
      canBeAddMonth = true;
    }
    if (canBeAddMonth) canBeAddMonthCnt++;
    return (
      <div 
        className={classes.monthInline} style={style}
        onClick={() => handleClick(e, existMonth)} key={i} id={e}
      >
        {y !== false &&
          <span className='small'>
            {e.split('-')[0]}年
          </span>
        }
        <span className='month'>
          {parseInt(e.split('-')[1])}
        </span>
        <span className='small'>月</span>
        {addMode === true && canBeAddMonth &&
          <div className='addIcon' onClick={() => handleClickNewMonth(e)}>
            <AddIcon/>
          </div>
        }
      </div>
    )
  });
  const handleAddMode = () => {
    const t = addMode? false: true;
    setAddMode(t);
  }
  const MsgBox = () => {
    const mStart = mList[0];
    const mEnd = mList[mList.length - 1];
    const basicMsg = canBeAddMonthCnt
    ? '+をクリックして月の追加が出来ます。': '追加できる月がありません。'
    if (!addMode) return null;
    else if (mEnd > nextLimit){
      return (
        <div className={classes.msgBox}>
          {basicMsg + `${nextLimit.slice(0, 7)}以降の月はまだ追加できません。`}
        </div>
      )
    }
    else if (mStart < '2021-04-01'){
      return (
        <div className={classes.msgBox}>
          {basicMsg + `2021年3月以前の月は追加できません。`}
        </div>
      )
    }
    else {
      return (
        <div className={classes.msgBox}>
          {basicMsg}
        </div>
      )
    }
  }

  /*画面幅が500px以下（スマホ対応）*/
  if(limit500px){
    return(
      <div className={classes.monthListRoot} style={style}>
      <MsgBox/>
      <div className='flxDiv' style={{flexDirection: 'column', alignItems: 'center'}}>
        <div style={{display: 'flex'}}>
          <div className={classes.monthOffset} onClick={()=>handleOffset(-3)}>
            <KeyboardArrowLeftIcon/>
            <span className='doubbleIcon'>
              <KeyboardArrowLeftIcon/>
            </span>
          </div>
          <div className={classes.monthOffset} onClick={()=>handleOffset(-1)}>
            <KeyboardArrowLeftIcon/>
          </div>
          <div className={classes.yearMonthWrap}>
            {yearMonth}
          </div>
          <div className={classes.monthOffset} onClick={()=>handleOffset(1)}>
            <KeyboardArrowRightIcon/>
          </div>
          <div className={classes.monthOffset} onClick={()=>handleOffset(3)}>
            <KeyboardArrowRightIcon/>
            <span className='doubbleIcon'>
              <KeyboardArrowRightIcon/>
            </span>
          </div>
        </div>
        <div className={classes.addModeSw} >
          {addMode === false && <>
            <Button
              color="secondary" onClick={()=>handleAddMode()}
              startIcon={<AddCircleOutlineIcon/>}
              disabled={dataKeepOnly}
            >
              月を追加
            </Button>
          </>}
          {addMode === true && <> 
            <Button
              color="secondary" onClick={()=>handleAddMode()}
              startIcon={<CloseIcon/>}
            >
              終了
            </Button>
          </>}
        </div>
      </div>
    </div>
    )
  }

  return (
    <div className={classes.monthListRoot} style={style} >
      <MsgBox/>
      <div className='flxDiv'>
        <div className={classes.monthOffset} onClick={()=>handleOffset(-3)}>
          <KeyboardArrowLeftIcon/>
          <span className='doubbleIcon'>
            <KeyboardArrowLeftIcon/>
          </span>
        </div>
        <div className={classes.monthOffset} onClick={()=>handleOffset(-1)}>
          <KeyboardArrowLeftIcon/>
        </div>
        <div className={classes.yearMonthWrap}>
          {yearMonth}
        </div>
        <div className={classes.monthOffset} onClick={()=>handleOffset(1)}>
          <KeyboardArrowRightIcon/>
        </div>
        <div className={classes.monthOffset} onClick={()=>handleOffset(3)}>
          <KeyboardArrowRightIcon/>
          <span className='doubbleIcon'>
            <KeyboardArrowRightIcon/>
          </span>
        </div>
        <div className={classes.addModeSw} >
          {addMode === false && <>
            <Button
              color="secondary" onClick={()=>handleAddMode()}
              startIcon={<AddCircleOutlineIcon/>}
              disabled={dataKeepOnly}

            >
              月を追加
            </Button>
          </>}
          {addMode === true && <> 
            <Button
              color="secondary" onClick={()=>handleAddMode()}
              startIcon={<CloseIcon/>}
            >
              終了
            </Button>
          </>}
        </div>
      </div>
      {dataKeepOnly &&
        <div style={{textAlign:'center', padding: 8, color: red[800]}}>
          データ維持オプションが設定されています。月の追加は出来ません。
        </div>
      }
    </div>
  )
}

export const SchSelectMonth = (props) => {
  
  const allState = useSelector(state=>state);
  const {account} = allState;
  const permission = parsePermission(account)[0][0];
  const loadingStatus = getLodingStatus(allState);
  // 当面デベロッパーのみ
  // if (permission < 100){
  //   return <div style={{height: 60}}></div>
  // }
  if (loadingStatus.loaded && !loadingStatus.error){
    return (<SchSelectMonthMain {...props} />)
  }
  else return null;
}

export default SchSelectMonth;