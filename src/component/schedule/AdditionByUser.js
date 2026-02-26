import { makeStyles } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import EachScheduleContent from './SchEachScheduleContent';

// const SevenDaysGrid = (props)=>{
//   const classes = useStyles();
//   const dateList = useSelector(state=>state.dateList);
//   const {
//     suid, sch, setSch, setSnack, localFabSch,
//   } = props;
//   const path = useLocation().pathname;
//   // const template = useSelector(state => state.scheduleTemplate);
//   const users = useSelector(state => state.users);
//   const service = useSelector(state=>state.service);
//   const classroom = useSelector(state=>state.classroom);
//   const schedule = useSelector(state=>state.schedule);
//   const allstate = useSelector(state=>state);
//   const template = {[service]:albcm.getTemplate(allstate, sch, suid)};
//   // 7曜グリッド作成
//   const daysGrid = comMod.makeDaysGrid(dateList);
//   // クリックハンドラ
//   const clickHandler = (e)=>{
//     e.stopPropagation();
//     e.preventDefault();

//     const did = e.currentTarget.getAttribute('did');
//     const UID = 'UID' + suid;
//     const date = comMod.convDid(did); // did形式を日付オブジェクトに
//     // 引数で受け取ったdatalist全体から該当日付の休日モードを取得
//     const holiday = dateList.filter(
//       f => f.date.getTime() === date.getTime()
//     )[0].holiday;
//     const holidayStr = ['weekday', 'schoolOff', 'schoolOff'][holiday];
//     // 同じようにserviceを取得
//     const thisService = users.filter(f => f.uid === suid)[0].service;
//     // 該当スケジュールの取得。見つからなければnull
//     let thisSchedule = sch[did];
    
//     const thisUser = comMod.getUser(suid, users);
//     // MTUの規制
//     if (!classroom && albcm.classroomCount(thisUser) > 1){
//       const id = new Date().getTime();
//       setSnack({
//         msg: 'この利用者は複数単位があるので編集できません。', 
//         severity: 'warning', id
//       });
//       return false;
//     }
//     // なにもしない
//     if (localFabSch === 0)  return false;
    
//     // スケジュールロックを検出
//     const locked = albcm.schLocked(
//       schedule, users, thisUser, did, service, classroom
//     )
//     if (locked){
//       const id = new Date().getTime();
//       setSnack({msg: '予定はロックされています。', severity: 'warning', id});
//       return false;
//     }

//     // 別単位のスケジュールロック
//     if (
//       thisSchedule &&
//       thisSchedule.classroom && classroom && 
//       classroom !== thisSchedule.classroom &&
//       localFabSch > 0
//     ){
//       const id = new Date().getTime();
//       setSnack({
//         msg: '別単位の予定なので編集できません。', 
//         severity: 'warning', id
//       });
//       return false;
//     }
//     else{
//       setSnack({msg: '', severity: '', id: new Date().getTime()})
//     }

//     // 追加削除、追加削除モードでスケジュールが存在しない->追加
//     if (localFabSch > 0 && !thisSchedule) {
//       // テンプレートからディープコピー
//       thisSchedule = {...template[thisService][holidayStr]};
//       thisSchedule.classroom = classroom;
//       const t = {...sch};
//       setSch({...t, [did]:thisSchedule})
//     }
//     // 追加削除モードでスケジュールが存在する->削除
//     else if (localFabSch === 1 && thisSchedule) {
//       const t = {...sch};
//       delete t[did];
//       setSch(t);
//     }
//   }

//   // ゆーざーがみつからないばあいはnullを返す
//   const susers = users.filter(e=>e.service === service);
//   const thisUser = (suid, susers);

//   if (!Object.keys(thisUser).length)  return null;
//   const oneUser = comMod.getUser(suid, thisUser);
//   const OneWeek = (props)=>{
//     const week = props.week.map((e, i)=>{
//       const cls = ['', 'schoolOff', 'off'];// 学校休日休業日を示すクラスリスト
//       const wdClass = (e !== '')? cls[e.holiday]:'';
//       // 日付オブジェクトをdid形式に変換
//       const did = (e !== '') ? comMod.convDid(e.date):''
//       // この日のスケジュール
//       let thisSchedule;
//       // そもそもデータがない
//       if (!sch)  thisSchedule = undefined;
//       // 該当日のデータがない
//       else if (Object.keys(sch).indexOf(did) === -1) 
//         thisSchedule = undefined;
//       else thisSchedule = sch[did];
//       const otherClassroomStyle = 
//       (
//         thisSchedule &&
//         thisSchedule && classroom && 
//         thisSchedule.classroom && 
//         thisSchedule.classroom !== classroom
//       )?{opacity: .3}: {};
    
//       return(
//         <div className={'day ' } key={i} 
//           did = {did}
//           onClick = {(e)=>clickHandler(e)}
//         >
//           {(e !== '') &&
//             <div className={'dayLabel ' + wdClass}>
//               {e.date.getDate()}
//             </div>
//           }
          
//           <div className='content' style={otherClassroomStyle}>
//             <EachScheduleContent thisSchedule={thisSchedule}/>
//           </div>
//         </div>
//       );
//     });
//     return (<div className='week'>{week}</div>);
//   }
//   // 縦型表示
//   // const VrtDisp = (props) => {
//   //   const classes = useStyles();
//   //   const days = dateList.map((e,i)=>{
//   //     const cls = ['', 'schoolOff', 'off'];// 学校休日休業日を示すクラスリスト
//   //     const wdClass = (e !== '')? ' ' + cls[e.holiday]:'';
//   //     // 日付オブジェクトをdid形式に変換
//   //     const did = (e !== '') ? comMod.convDid(e.date):'';
//   //     // mon wed fri 月水金で有効になるクラス名
//   //     const mwfClass = [1, 3, 5].indexOf(e.date.getDay()) >= 0 
//   //     ? ' mwfClass' : '';
//   //     // この日のスケジュール
//   //     let thisSchedule;
//   //     // そもそもデータがない
//   //     if (!sch)  thisSchedule = undefined;
//   //     // 該当日のデータがない
//   //     else if (Object.keys(sch).indexOf(did) === -1) 
//   //       thisSchedule = undefined;
//   //     else thisSchedule = sch[did];
//   //     return (
//   //       <div className={classes.vDayWrap} 
//   //         key={i} did = {did}
//   //         onClick = {(e)=>clickHandler(e)}
//   //       >
//   //         {/* <div className={'dayLabel ' + wdClass}>
//   //           {e.date.getDate()}
//   //         </div> */}
//   //         <div className={'content ' + wdClass + mwfClass}>
//   //           <EachScheduleContent 
//   //             thisSchedule={thisSchedule} virtical d={e}
//   //           />
//   //         </div>
//   //       </div>
//   //     );
//   //   });
//   //   return (
//   //     <>
//   //       <div className={classes.monthWrapperV}>
//   //         <div className={classes.userNameHeadDisp}>
//   //           <span>{oneUser.name} 様</span>
//   //           <span>{oneUser.ageStr}</span>
//   //         </div>
//   //         {days}
//   //       </div>
//   //     </>
//   //   )
//   // };

//   const weeks = daysGrid.map((e, i)=>{
//     return (
//       <OneWeek week={e} key={i} />
//     );
//   });
//   const GridDisp = () => (
//     <div className={'monthWrapper ' + classes.monthWrapper}>
//       <div className={classes.userNameHeadDisp}>
//         <span>{oneUser.name} 様</span>
//         <span>{oneUser.ageStr}</span>
//       </div>
//       <div className="month">
//         <div className='week'>
//           <div className='day weekLabel'>日</div>
//           <div className='day weekLabel'>月</div>
//           <div className='day weekLabel'>火</div>
//           <div className='day weekLabel'>水</div>
//           <div className='day weekLabel'>木</div>
//           <div className='day weekLabel'>金</div>
//           <div className='day weekLabel'>土</div>
//         </div>
//         {weeks}
//       </div>
//     </div>
//   );
//   return (<>
//     {/* {virtical === false && <GridDisp />}
//     {virtical === true && <VrtDisp />} */}
//     <GridDisp />
//   </>);
// }

const useStyles = makeStyles({
  calender: {
    width: 'fit-content',
    margin: '0 auto',
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
        minHeight: 48,
        padding: 4
      }
    },
  },
})

const TestCalender = (props) => {
  const classes = useStyles();
  const dateList = useSelector(state=>state.dateList);
  const {schedule, uid} = props;
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
          <div className='date' style={{backgroundColor: holiday_color, padding: date ?4 :0}}>{date}</div>
          <div className='content'>
            <EachScheduleContent thisSchedule={this_schedule} virtical={false} d={dateDt}/>
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

const AdditionByUser = () => {
  const allState = useSelector(state => state);
  const {schedule} = allState;
  const [snack, setSnack] = useState({msg: '', severity: '', id: 0});
  const uid = "6417"

  const c_content_props = {schedule, uid};
  return(
    <div>
      <div>利用者別加算テスト</div>
      <TestCalender {...c_content_props}/>
    </div>
  )
}
export default AdditionByUser