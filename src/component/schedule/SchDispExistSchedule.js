import { makeStyles } from '@material-ui/core';
import { teal } from '@material-ui/core/colors';
import React, {useEffect, useState, } from 'react';
import { useSelector } from 'react-redux';
import { sendAddictionOfBrunch } from '../../Actions';
import { univApiCall } from '../../albCommonModule';
import { getLodingStatus } from '../../commonModule';

const useStyles = makeStyles({
  monthListRoot: {
    padding: 8,
    '& .flxDiv': {
      display: 'flex',
      // '& .cell': {height: '1.4rem', width: 64, padding: 4, overflow: 'display'},
      // '& .center': {textAlign: 'center'},
      // '& span': {fontSize: '.7rem'}
    }
  },
  monthInline: {
    textAlign: 'center',
    '& .small': {fontSize: '.7rem'},
    '& .month': {fontSize: '1.1rem'}
  }

});

// ４月から３月までの年度を求める。
// stdDateを受け取る
const monthListInFiscalYear = (stdDate) => {
  const a = stdDate.split('-');
  const pi = (v) => parseInt(v);
  let y = pi(a[0]), m = pi(a[1]), d = pi(a[2]);
  const l = [
    '04-01', '05-01', '06-01', '07-01', '08-01', '09-01', 
    '10-01', '11-01', '12-01', '01-01', '02-01', '03-01', 
  ]
  if (m < 4) y = y -1;
  const r = l.map((e, i)=>{
    if (pi(e.split('-')[0]) < 4) return (y + 1) + '-' + e;
    else return y + '-' + e;
  });
  return r;
}

const SchDispExistScheduleMain = () => {
  const allState = useSelector(state=>state);
  const {hid, bid, stdDate} = allState;
  const [monthLst, setMonthList] = useState([]);
  const [res, setRes] = useState([]);
  const classes = useStyles();

  useEffect(()=>{
    let isMounted = true;
    const f = async () => {
      setTimeout(()=>{
        setMonthList(res.data.dt.map(e=>e.date));
      }, 500)
    }
    if (res.data && res.data.result && isMounted) f();
    return (()=>{
      isMounted = false;
    });
  }, [res])
  
  useEffect(()=>{
    let isMounted = true;
    const f = async () => {
      const prms = {hid, bid, a:'fetchScheduleAria'}
      univApiCall(prms, '', setRes);
    };
    if (isMounted) f();
    return (()=>{
      isMounted = false;
    });
  }, []);
  const yearMonth = monthListInFiscalYear(stdDate).map((e, i)=>{
    const m = e.split('-')[1];
    const y = (m === '04' || m === '01')? e.split('-')[0]: '';
    const existMonth = monthLst.includes(e);
    const yDisp = (m === '04' || m === '01')? true: false;
    const style = existMonth? {color: teal[900]}: {opacity: .4}
    if (yDisp)  style.width = 88;
    else style.width = 48;
    return (
      <div className={classes.monthInline} style={style} key={i} id={e}>
        {yDisp === true &&
          <span className='small'>
            {e.split('-')[0]}年
          </span>
        }
        <span className='month'>
          {parseInt(e.split('-')[1])}
        </span>
        <span className='small'>月</span>
      </div>
    )
  });
  return (
    <div className={classes.monthListRoot} >
      <div className='flxDiv'>
        {yearMonth}
      </div>
    </div>
  )
  
}

export const SchDispExistSchedule = () => {
  const allState = useSelector(state=>state);
  const loadingStatus = getLodingStatus(allState);
  if (loadingStatus.loaded && !loadingStatus.error){
    return (<SchDispExistScheduleMain/>)
  }
  else return null;
}

export default SchDispExistSchedule;