import React, { useEffect, useState } from 'react';
import * as Actions from '../../Actions';
import { connect, useDispatch, useSelector } from 'react-redux';
import * as comMod from '../../commonModule';
import * as albcm from '../../albCommonModule';
import { LoadingSpinner , LoadErr} from '../common/commonParts';
import { useLocation } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import teal from '@material-ui/core/colors/teal';
import lightBlue from '@material-ui/core/colors/lightBlue';
import { defaults } from 'js-cookie';
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min';
import { SchInitilizer } from './SchInitilizer';


const useStyles = makeStyles({
  buttonWrapper: {
    display:'flex', padding: 8, justifyContent:'flex-end',
    '& .oneButtonWrap': {
      marginLeft: 16,
    }
  },
  setcloseDayWrap :{
    padding: 8, textAlign: 'center', marginTop: 16,
  }
});

const ClenderTitle = (props)=>{
  const first = props.dateLocal[0].date;
  const titleMonth = comMod.formatDate(first,'YYYY年MM月');
  return (<div className="cldTitle">{titleMonth}</div>)
}

const WeekDays = ()=>{
  const wday = ['日','月','火','水','木','金','土',];
  const rt = wday.map((e, i)=>{
    return(<div key={i}>{e}</div>);
  });
  return rt;
}

const makeDaysGrid = (dateList) => {
  const monthGrid = [];
  let week = []; // 変数をletで宣言

  dateList.forEach(e => {
    const weekCopy = [...week, e]; // week配列にeを追加して新しい配列を作成
    if (e.date.getDay() == 6) {
      monthGrid.push(weekCopy); // 新しい配列をmonthGridに追加
      week = []; // weekを新しい空の配列で再初期化
    } else {
      week = weekCopy; // weekに新しい配列を代入
    }
  });

  if (week.length) monthGrid.push([...week]); // 最後の週を追加

  // 先頭の一行、配列の長さが7になるまで空白を挿入
  while (monthGrid[0].length < 7) monthGrid[0].unshift('');

  // 最後の一行。長さを揃える
  const lastWeek = monthGrid[monthGrid.length - 1];
  const filler = Array(7 - lastWeek.length).fill('');
  lastWeek.push(...filler);

  return monthGrid;
}


const Days = (props) =>{
  const dispatch = useDispatch();
  const path = useLocation().pathname;
  const {dateLocal, setDateLocal, setHolidayTarget, holidayTarget} = props;
  const [daysGrid, setDaysGrid] = useState([]);
  const oneDayClick = (dayobj)=>{
    // e.preventDefault();
    console.log(dayobj);
    let holidayMode = holidayTarget;
    if (dayobj.holiday !== 0) holidayMode = 0;
    setDateLocal(()=>{
      const t = [...dateLocal];
      const p = t.findIndex(e=>e.date === dayobj.date);
      if (p > -1){
        t[p].holiday = holidayMode;
      }
      return t;
    });
  }
  // 日曜始まりになるように日付を一週間ごとの配列化
  useEffect(()=>{
    setDaysGrid(makeDaysGrid(dateLocal));
  }, [dateLocal])
  console.log('daysGrid',daysGrid);
  const Week = (weeks) =>{
    const daysInWeek = weeks.weeks.map((elm, i)=>{
      let hClass = "";
      if (typeof elm == 'object'){
        if (elm.holiday === 1) hClass = 'schoolOff';
        else if (elm.holiday === 2) hClass = 'off';
        else if (elm.holiday === 0) hClass = 'weekday';
        return (
          <div 
            className={"oneDay " + hClass} key = {i}
            onClick={()=>oneDayClick(elm)}
          >
            {elm.date.getDate()}
          </div>
        )
      }
      else{
        return (
          <div key={i} className="oneDay"></div>
        )
      }
    });
    return (
      <div className="cldBodyRow cldDays">
        {daysInWeek}
      </div>
    )
  }
  const month = daysGrid.map((weeks, i)=>{
    return(<Week key={i} weeks={weeks}/>)
  });
  return month;
}

const Lower = (props) => {
  const dispatch = useDispatch();
  const path = useLocation().pathname;
  const { holidayTarget, setHolidayTarget, dateLocal, setDateLocal } = props;

  const radioHandler = (v) => {
    setHolidayTarget(v);
  }

  const clickHandler = (v) => {
    setDateLocal((prevDateLocal) => {
      const updatedDates = [...prevDateLocal];
      updatedDates.map(e => {
        if (e.holiday !== 2) {
          e.holiday = v;
        }
      });
      return updatedDates;
    });
  }

  // ラジオボタンのプロパティを格納する配列
  const radioDefault = ['','','',''];
  radioDefault[holidayTarget] = 'checked';

  return (
    <div className="clenderLower">
      <div className="controlewrapper">
        <label className={"radioWrapper " + radioDefault[1]}>
          <input 
            type="radio" value="2" name="offday" 
            checked={radioDefault[1] === 'checked'}
            onChange={() => radioHandler(1)}
          />
          休校日
        </label>
        <label className={"radioWrapper " + radioDefault[2]}>
          <input 
            type="radio" value="4" name="offday" 
            checked={radioDefault[2] === 'checked'}
            onChange={() => radioHandler(2)}
          />
          休業日
        </label>
        <span className={"radioWrapper"} onClick={() => clickHandler(1)}>
          <span>全て休校日</span>
        </span>
        <span className={"radioWrapper"} onClick={() => clickHandler(0)}>
          <span>全て平日</span>
        </span>
      </div>
    </div>
  );
}


const SchCalenderMain = (props) =>{
  const classes = useStyles();
  const dispatch = useDispatch();
  const history = useHistory();
  const hid = useSelector(state=>state.hid);
  const bid = useSelector(state=>state.bid);
  const stdDate = useSelector(state=>state.stdDate);
  const dateList = useSelector(state=>state.dateList);
  const t = JSON.parse(JSON.stringify(dateList)).map(e=>({...e, date: new Date(e.date)}));
  const [dateLocal, setDateLocal] = useState(t);
  // 日付をクリックしたときに休校日にするか休業日にするか
  const [holidayTarget, setHolidayTarget] = useState(1);
  const prms = {holidayTarget, setHolidayTarget, dateLocal, setDateLocal};
  const [res, setRes] = useState({data: false});
  useEffect(()=>{
    if (res.data.result){
      dispatch(Actions.setStore({dateList: dateLocal}));
      dispatch(Actions.setSnackMsg('カレンダーを送信しました。'));
    }
    else if (res.data.result === false){
      dispatch(Actions.setSnackMsg(
        'カレンダーを送信出来ませんでした', 'error', 'E32W33' 
      ));
    }
  }, [res]);
  const handleClick = (send) => {
    if (send){
      // ここでカレンダーの設定を行ったら初期化されないようにする
      // SchInitilizer->setCloseDayToCalender で初期化を行っている
      if (Array.isArray(dateLocal) && typeof dateLocal[0] === 'object'){
        dateLocal[0].calenderEdited = true;
      }
      albcm.sendCalender(
        {hid, bid, date: stdDate, dateList: dateLocal}, setRes
      );
    }

  }
  return (<>
    <div className='cld'>
      <ClenderTitle dateLocal={dateLocal} />
      <div className='cldBody'>
        <div className='cldBodyRow cldWeekDayTitle'>
          <WeekDays />
        </div>
        <Days {...prms} />
      </div>
      <Lower {...prms} />
      <div className={classes.buttonWrapper}>
        <div className='oneButtonWrap'>
          <Button 
            variant="contained" color="secondary" 
            onClick={()=>handleClick(false)}
          >
            キャンセル
          </Button>
        </div>
        <div className='oneButtonWrap'>
          <Button 
            variant="contained" color="primary" 
            onClick={()=>handleClick(true)}
          >
            送信
          </Button>
        </div>
      </div>
      <div className={classes.setcloseDayWrap}>
        <Button
          variant="contained"
          onClick={()=>{history.push('/setting/schedule/setcloseday/')}}
        >
          土日祝日等の休業日設定
        </Button>
      </div>
    </div>
    <SchInitilizer/>
  </>)

}

const SchCalender = ()=>{
  const allstate = useSelector(state=>state);
  const loadingStatus = comMod.getLodingStatus(allstate);

  if (loadingStatus.loaded && !loadingStatus.error){
    return(<>
      <SchCalenderMain />
    </>)
  }
  else if (loadingStatus.error){
    return (<>
      <LoadErr loadStatus={loadingStatus} errorId={'E4941'} />
    </>)
  }
  else{
    return(<>
     <LoadingSpinner/>
    </>)
  }
}
export default SchCalender;

