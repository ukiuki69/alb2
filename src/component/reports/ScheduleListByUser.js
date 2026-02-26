import { makeStyles } from '@material-ui/core';
import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { convUid } from '../../albCommonModule';
import { getUisCookie, uisCookiePos } from '../../commonModule';
import EachScheduleContent from '../schedule/SchEachScheduleContent';
import { getDispCont } from '../schedule/SchWeekly';
import { SetUisCookieSelect } from '../common/SetUisCookieSelect';
import * as comMod from '../../commonModule';

const useStyles = makeStyles({
  mainContents: {
    width: "fit-content",
    margin: '0 auto',
    "& .oneContent": {
      width: "fit-content",
      marginTop: 32,
      marginBottom: 32,
      "& .userInfo": {
        textAlign: 'center',
        marginBottom: 16,
        // marginTop: 16
      },
    },
    "@media print": {
      marginTop: 0,
      marginBottom: 0,
      "& .oneContent": {
        width: "fit-content",
        height: "fit-content",
        marginTop: 0,
        marginBottom: 0,
        // padding: '0 300px'
      },
      "& .printDisp": {
        height: '1530px',
        "&:not(:last-child)": {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          // justifyContent: 'space-around',
          pageBreakAfter: 'always',
        },
        "&:last-child": {
          pageBreakAfter: 'avoid'
        }
      }
    }
  },
  calender: {
    width: 'fit-content',
    "& .calenderRow": {
      display: 'flex',
      width: 'fit-content'
    },
    "& .headerCell": {
      width: 112,
      textAlign: 'center'
    },
    "& .cell":{
      width: 112,
      "& .date": {
        textAlign: 'center'
      },
      "& .content": {
        position: 'relative',
        minHeight: 80,
        padding: 4
      }
    },
  },
  verticalContents: {
    zIndex: -100,
    "& .oneContent": {
      margin: '64px 0',
      "& .userInfo": {
        textAlign: 'center',
        marginBottom: 16
      },
      "& .calenderRow": {
        margin: '0 auto',
        "&:nth-child(even)": {
          backgroundColor: "#eee"
        },
        "&:nth-child(odd)": {
          backgroundColor: "#f5f5f5"
        },
      },
    },
    "@media print": {
      "& .oneContent": {
        margin: 0,
        pageBreakAfter: "always",
        "&:last-child": {
          pageBreakAfter: 'avoid'
        }
      }
    }
  }
})

const NotDisplayItems = [
  { value: 0, label: "すべて表示" },
  { value: 2, label: "時間のみ" },
  { value: 3, label: "時間,実費" },
  { value: 4, label: "時間,実費,加算" },
  { value: 5, label: "時間,送迎" },
  { value: 6, label: "時間,送迎,実費" },
];


const TestCalender = (props) => {
  const classes = useStyles();
  const dateList = useSelector(state=>state.dateList);
  const {schedule, uid, dispCont} = props;
  if(!dateList || !dateList.length) return null;
  const dayList = ["日", "月", "火", "水", "木", "金", "土" ];
  const hoge = dateList.reduce((result, dateDt) => {
    const day = dateDt.date.getDay();
    result[day].push(dateDt)
    return result
  }, [...dayList.map(()=>[])]);
  const max_length = hoge.reduce((result, x) => result<x.length ?x.length :result, 0);
  const calenderList = hoge.map((x, index) => 
    x[0].date.getDate() > index+1
      ?x.length+1 < max_length ?[{}, ...x, {}] :[{}, ...x]
      :x.length < max_length ?[...x, {}] :x
  )
  const calenderjei = calenderList.reduce((result, x) => {
    x.forEach((y, index) => result[index].push(y))
    return result
  }, [...calenderList.map(()=>[])]);

  const header_node = dayList.map((dayStr, i) => <div key={"header"+i} className="headerCell">{dayStr}</div>);
  const calender_nodes = calenderjei.map((week, j) => {
    const one_week = week.map((dateDt, i) => {
      const year = dateDt.date ?dateDt.date.getFullYear() :"";
      const month = dateDt.date ?dateDt.date.getMonth()+1 :"";
      const date = dateDt.date ?dateDt.date.getDate() :"";
      // const day = dateDt.date ?dayList[dateDt.date.getDay()] :"";
      const d_date = `D${String(year)+String(month).padStart(2,'0')+String(date).padStart(2,'0')}`;
      const this_schedule = schedule["UID"+uid]
        ?schedule["UID"+uid][d_date] ?schedule["UID"+uid][d_date] :null
        :null
      const holiday = dateDt.holiday ?dateDt.holiday :"";
      const holiday_color = holiday===1?"#f8e3cb" :holiday===2?"#cacad9" :"#eee";
      return(
        <div className="cell" key={"week"+i}>
          <div className='date' style={{backgroundColor: holiday_color, padding: date ?4*0.8 :0, fontSize: '0.8rem'}}>{date}</div>
          <div className='content' style={{fontSize: '0.7rem'}}>
            <EachScheduleContent thisSchedule={this_schedule} virtical={false} d={dateDt} dispCont={dispCont}/>
          </div>
        </div>
      )
    })

    return(
      <div key={"calenderNode"+j} className='calenderRow'>
        {one_week}
      </div>
    )
  })

  return(
    <div className={classes.calender}>
      <div className='calenderRow'>{header_node}</div>
      <div>{calender_nodes}</div>
    </div>
  )
}

const VerticalCalender = (props) => {
  const {schedule, uid, dispCont} = props;
  const dateList = useSelector(state=>state.dateList);
  if(!dateList || !dateList.length) return null;
  const dayList = ["日", "月", "火", "水", "木", "金", "土" ];
  const date_node = dateList.map((dateDt, i) => {
    const year = dateDt.date ?dateDt.date.getFullYear() :"";
    const month = dateDt.date ?dateDt.date.getMonth()+1 :"";
    const date = dateDt.date ?dateDt.date.getDate() :"";
    const day = dateDt.date ?dayList[dateDt.date.getDay()] :"";
    const d_date = `D${String(year)+String(month).padStart(2,'0')+String(date).padStart(2,'0')}`;
    const this_schedule = schedule["UID"+uid]
      ?schedule["UID"+uid][d_date] ?schedule["UID"+uid][d_date] :null
      :null
    const holiday = dateDt.holiday ?dateDt.holiday :"";
    const calenderRow_style = {width: 'fit-content'}
    if(holiday) calenderRow_style["backgroundColor"] = holiday===1 ?"#f8e3cb" :"#cacad9"
    return(
      <div className='calenderRow' style={calenderRow_style} key={i}>
        <EachScheduleContent thisSchedule={this_schedule} virtical={true} d={dateDt} dispCont={dispCont}/>
      </div>
    )
  })

  return date_node
}
// スケジュールが存在するかどうか
const hasSchedule = (uid, schedule) => {
  const UID = convUid(uid).s;
  const usersSch = schedule[UID];
  if (!usersSch) return 0;
  const schLen = Object.keys(usersSch).filter(e=>e.match(/^D2[0-9]{7}/)).length;
  return schLen;
}

const ScheduleListByUser = (props) => {
  const classes = useStyles();
  const {userList, preview} = props;
  const vertical = getUisCookie(uisCookiePos.reportsUsersCalendarVerticalDisplay)==="1" ?true :false;
  
  // 表示制御のstate
  const [dispCont, setDispCont] = useState(getDispCont('reportsUsersCalendar'));
  const [dispContSw, setDispContSw] = useState(null);
  
  // 表示制御の更新
  useEffect(() => {
    setDispCont(getDispCont('reportsUsersCalendar'));
  }, [dispContSw]);
  const allState = useSelector(state => state);
  const {schedule, users, stdDate} = allState;
  const [stdYear, stdMonth] = stdDate.split("-");
  const c_userList = [...userList];
  c_userList.sort((a, b) => users.find(x => x.uid===a.uid).sindex - users.find(x => x.uid===b.uid).sindex);
  const main_nodes = c_userList.filter(e=>e.checked).map((u, i) => {
    const user = users.find(userDt => u.uid === userDt.uid);
    const c_content_props = {schedule, uid: u.uid, dispCont};
    if (!hasSchedule(u.uid, schedule)){
      return null;
    }
    return(
      <div className='oneContent' key={i}>
        <div style={{textAlign: 'end', fontSize: 14}}>
          <span>{stdYear}年</span>
          <span>{stdMonth}月</span>
        </div>
        <div className='userInfo'>
          <span style={{marginRight: 16}}>{user.name}様</span>
          <span>{user.ageStr}</span>
        </div>
        {vertical ?<VerticalCalender {...c_content_props}/> :<TestCalender {...c_content_props}/>}
      </div>
    )
  }).filter(x => x);
  const hoge = (() => {
    const result = [];
    for(let i=0; i<main_nodes.length; i+=2){
      result.push(main_nodes.slice(i, i+2));
    }
    const t = result.map((x, i) => (
      <div className='printDisp' key={i}>{x[0]}{x[1]}</div>
    ))
    return t.filter(e=>e.props.children[0] || e.props.children[1]);
  })();
  if(!preview.includes("利用者別スケジュール")) return null;
  return(
    <div>
      <div style={{
        position: 'fixed', top: 100, right: 24, width: '200', padding: 16, backgroundColor: '#ffffffcc',
        zIndex: 999, 
      }} className='noprint'>
        <SetUisCookieSelect
          p={comMod.uisCookiePos.displayContOnReportsUsersCalendar}
          label='表示項目を選択' opt={NotDisplayItems}
          setState={setDispContSw}
        />
      </div>
      <div className={vertical ?classes.verticalContents :classes.mainContents}>
        {vertical ?main_nodes :hoge}
        {/* {main_nodes} */}
      </div>
    </div>
  )
}
export default ScheduleListByUser