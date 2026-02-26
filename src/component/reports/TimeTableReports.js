import React from 'react';
import { makeStyles } from "@material-ui/core"
import { useSelector } from "react-redux";
import { brtoLf, formatDate } from "../../commonModule";
import { createContext, useContext } from "react";
import { grey } from '@material-ui/core/colors';
import { checkValueType } from '../dailyReport/DailyReportCommon';
import { convMinsIntoTimeStr, getMinutesFromTimeStr, getUsersTimeTableInitDateStr } from '../Users/TimeTable/UsersTimeTableCommon';
import { getJikanKubunAndEnchou } from '../../modules/elapsedTimes';
import { red } from '@material-ui/core/colors';
import { useLocation } from 'react-router-dom';

const DAYKEYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "holiday"];

const NOMAL_BORDER = '1px solid';
const BOLD_BORDER = "2px solid";
const DOTTED_BORDER = '1px dotted';

const getTimeTableTimes = (dayDt, displayService) => {
  const useKubun3 = dayDt.holiday || displayService==="児童発達支援";
  const basisStart = dayDt.basisStart;
  const basisEnd = dayDt.basisEnd;
  if(!basisStart || !basisEnd) return {};
  const kubun = getJikanKubunAndEnchou(basisStart, basisEnd, useKubun3);
  if(kubun.enchouMins > 0){
    // 延長あり
    const enchouMins = kubun.enchouMins;
    if(dayDt.enchoTarget==="before"){
      // 前延長
      const basisMins = getMinutesFromTimeStr(basisStart);
      const enchouEndMins = basisMins + enchouMins;
      const enchouEnd = convMinsIntoTimeStr(enchouEndMins);
      const teikyouMins = kubun.mins - enchouMins;
      return{
        enchouStart: basisStart, enchouEnd: enchouEnd,
        start: enchouEnd, end: basisEnd,
        teikyou: convMinsIntoTimeStr(teikyouMins),
        enchou: convMinsIntoTimeStr(enchouMins),
        teikyouMins, enchouMins,
      }
    }else if(dayDt.enchoTarget==="after"){
      // 後延長
      const basisMins = getMinutesFromTimeStr(basisEnd);
      const enchouStartMins = basisMins - enchouMins;
      const enchouStart = convMinsIntoTimeStr(enchouStartMins);
      const teikyouMins = kubun.mins - enchouMins;
      return{
        start: basisStart, end: enchouStart,
        enchouStart: enchouStart, enchouEnd: basisEnd,
        teikyou: convMinsIntoTimeStr(teikyouMins),
        enchou: convMinsIntoTimeStr(enchouMins),
        teikyouMins, enchouMins
      }
    }
  }
  return {
    start: basisStart, end: basisEnd,
    teikyou: convMinsIntoTimeStr(kubun.mins),
    teikyouMins: kubun.mins
  };
}

export const useStyles = makeStyles({
  sheets: {
    marginTop: 32,
    '@media print': {
      margin: 0,
      '& > div': {
        marginBottom: 0,
      }
    },
    '& > div': {
      marginBottom: 120,
      '&:not(:last-child)': {pageBreakAfter: 'always'}
    },
    '& .wideHeight': {
      '& td': {
        paddingTop: 9, paddingBottom: 9,
      }
    },
    '& .noData': {
      textAlign: 'center', fontWeight: 'bold', color: red['A700'],
      fontSize: 20, lineHeight: '30px',
      marginTop: 120,
    }
  },
  sheet: {
    '@media print': {
      margin: '4px 0 0 0',
    },
    '& .date': {
      fontSize: 14
    },
    '& .title': {
      fontSize: 24,
      marginBottom: 16
    },
    '& .infos': {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 12
    },
    '& table': {
      marginBottom: 16,
      borderCollapse: 'collapse',
      '& thead': {
        '& th': {
          whiteSpace: 'pre-wrap'
        }
      },
      '& tr': {
        '& th, td': {
          textAlign: 'center',
          padding: 2,
          border: '1px solid', borderCollapse: 'collapse',
          height: 18, lineHeight: '20px'
        },
        '& th': {
          padding: 8,
          fontWeight: 'normal', backgroundColor: grey[200]
        },
        '& td': {
        },
        '& .titleCol': {
          width: '15%'
        },
        '& .dayCol': {
          width: "calc(85% / 7)"
        },
        '& .times': {
          height: 24, fontSize: 14,
          '& .nami': {marginLeft: 4, marginRight: 2}
        },
        '& .sumTime': {
          height: 40,
        },
        '& .text': {
          textAlign: 'start', verticalAlign: 'baseline',
          whiteSpace: 'pre-wrap',
          fontSize: 14, padding: 8
        }
      }
    },
    '& .border': {border: NOMAL_BORDER},
    '& .borderTop': {borderTop: NOMAL_BORDER},
    '& .borderBottom': {borderBottom: NOMAL_BORDER},
    '& .borderRight': {borderRight: NOMAL_BORDER},
    '& .borderLeft': {borderLeft: NOMAL_BORDER},
    '& .boldBorder': {border: BOLD_BORDER},
    '& .boldBorderTop': {borderTop: BOLD_BORDER},
    '& .boldBorderBottom': {borderBottom: BOLD_BORDER},
    '& .boldBorderRight': {borderRight: BOLD_BORDER},
    '& .boldBorderLeft': {borderLeft: BOLD_BORDER},
    '& .noneBorder': {border: 'none'},
    '& .noneBorderTop': {borderTop: 'none'},
    '& .noneBorderBottom': {borderBottom: 'none'},
    '& .noneBorderRight': {borderRight: 'none'},
    '& .noneBorderLeft': {borderBottom: 'none'},
    '& .dottedBorderBottom': {borderBottom: DOTTED_BORDER},
    '& .dottedBorderTop': {borderTop: DOTTED_BORDER},
  },
  userNameTable: {
    marginBottom: '0 !important',
    '& .subTitle': {
      width: 135, paddingTop: 12, paddingBottom: 12
    },
    '& .userName': {width: 160}
  },
  parentConfirmation: {
    display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
  }
});

const PlanDtContext = createContext();

const UserNameTable = (props) => {
  const classes = useStyles();
  const {user} = props;
  const name = user?.name ?? "";
  return(
    <table className={classes.userNameTable}>
      <tbody>
        <tr>
          <th className='subTitle'>利用児氏名</th>
          <td className='userName'>{name}</td>
        </tr>
      </tbody>
    </table>
  )
}

const DayHeaderTr = () => {
  const ths = DAYKEYS.map(dayKey => {
    const dayStr = (() => {
      switch(dayKey){
        case "monday": return "月";
        case "tuesday": return "火";
        case "wednesday": return "水";
        case "thursday": return "木";
        case "friday": return "金";
        case "saturday": return "土";
        case "holiday": return "日・祝日";
      }
    })();
    return (<th key={`header${dayKey}`} className='dayCol'>{dayStr}</th>);
  });
  return(
    <tr>
      <th className='titleCol'/>
      {ths}
    </tr>
  )
}

const BasisSumTimeTr = () => {
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service || serviceItems[0];
  const {planDt} = useContext(PlanDtContext);
  const tds = DAYKEYS.map(dayKey => {
    let sumTimes = 0;
    const dayDt = planDt?.[dayKey] ?? {};
    if(dayDt.version === 2){
      const times = getTimeTableTimes(dayDt, displayService);
      if(times.teikyouMins) sumTimes = times.teikyouMins;
    }else{
      const basisStart = dayDt.basisStart && dayDt.basisEnd ?dayDt.basisStart :"00:00";
      const basisEnd = dayDt.basisEnd && dayDt.basisEnd ?dayDt.basisEnd :"00:00";
      const basisStartMin = getMinutesFromTimeStr(basisStart);
      const basisEndMin = getMinutesFromTimeStr(basisEnd);
      sumTimes = basisEndMin - basisStartMin;
    }
    const hour = parseInt(sumTimes / 60);
    const minutes = String(sumTimes % 60).padStart(2, "0");
    const timeStr = `${hour}時間${minutes}分`;
    return(
      <td
        key={`basisSumTimeTr${dayKey}`}
        className='boldBorderBottom dottedBorderTop sumTime'
      >
        {sumTimes ?timeStr :""}
      </td>
    )
  });

  return(
    <tr>{tds}</tr>
  )
}

const BasisTrs = () => {
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service || serviceItems[0];
  const {planDt} = useContext(PlanDtContext);

  const tds = DAYKEYS.map(dayKey => {
    const dayDt = planDt?.[dayKey] ?? {};
    let start = "", end = "";
    if(dayDt.version === 2){
      const times = getTimeTableTimes(dayDt, displayService);
      start = times.start ?? "";
      end = times.end ?? "";
    }else{
      start = dayDt.basisStart ?? "";
      end = dayDt.basisEnd ?? "";
    }
    return(
      <td key={`timeTr${dayKey}`} className='noneBorderTop noneBorderBottom times'>
        <span>{start && end ?start :""}</span>
        <span className='nami'>〜</span>
        <span>{start && end ?end :""}</span>
      </td>
    )
  });

  return(
      <>
    <tr>
      <th rowSpan="3" className='boldBorderBottom'>提供時間</th>
      {DAYKEYS.map(dayKey => (
        <th
          key={`basisTrs${dayKey}`}
          className='noneBorderBottom'
        >
          利用開始<br />終了時間
        </th>
      ))}
    </tr>
    <tr>{tds}</tr>
    <BasisSumTimeTr planDt={planDt} />
    </>
  )
}

const EntyouSumTimeTr = () => {
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service || serviceItems[0];
  const {planDt} = useContext(PlanDtContext);
  const tds = DAYKEYS.map(dayKey => {
    const dayDt = planDt?.[dayKey] ?? {};
    let sumTimes = 0;
    if(dayDt.version === 2){
      const times = getTimeTableTimes(dayDt, displayService);
      if(times.enchouMins) sumTimes = times.enchouMins;
    }else{
      const beforeStart = dayDt.beforeStart && dayDt.beforeEnd ?dayDt.beforeStart :"00:00";
      const beforeStartMin = getMinutesFromTimeStr(beforeStart);
      const beforeEnd = dayDt.beforeEnd && dayDt.beforeStart ?dayDt.beforeEnd :"00:00";
      const beforeEndMin = getMinutesFromTimeStr(beforeEnd);
      const beforeSumTimes = beforeEndMin - beforeStartMin;
      const afterStart = dayDt.afterStart && dayDt.afterEnd ?dayDt.afterStart :"00:00";
      const afterStartMin = getMinutesFromTimeStr(afterStart);
      const afterEnd = dayDt.afterEnd && dayDt.afterEnd ?dayDt.afterEnd :"00:00";
      const afterEndMin = getMinutesFromTimeStr(afterEnd);
      const afterSumTimes = afterEndMin - afterStartMin;
      sumTimes = beforeSumTimes > afterSumTimes ?beforeSumTimes :afterSumTimes;
    }
    const hour = parseInt(sumTimes / 60);
    const minutes = parseInt(sumTimes % 60); 
    const timeStr = hour||minutes ?`${hour}時間${String(minutes).padStart(2, '0')}分` :"";
    return(
      <td
        key={`entyouSumTimeTr${dayKey}`}
        className='boldBorderBottom dottedBorderTop sumTime'
      >
        {timeStr}
      </td>
    )
  });

  return(
    <tr>{tds}</tr>
  )
}

const EntyouTrs = () => {
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service || serviceItems[0];
  const {planDt} = useContext(PlanDtContext);

  const beforeTds = DAYKEYS.map(dayKey => {
    const dayDt = planDt?.[dayKey] ?? {};
    let start = "", end = "";
    if(dayDt.version === 2){
      if(dayDt.enchoTarget==="before"){
        const times = getTimeTableTimes(dayDt, displayService);
        start = times.enchouStart ?? "";
        end = times.enchouEnd ?? "";
      }
    }else{
      start = dayDt.beforeStart ?? "";
      end = dayDt.beforeEnd ?? "";
    }
    return(
      <td key={`timeTr${dayKey}`} className='noneBorderTop noneBorderBottom times'>
        <span>{start && end ?start :""}</span>
        <span className='nami'>〜</span>
        <span>{start && end ?end :""}</span>
      </td>
    )
  });

  const afterTds = DAYKEYS.map(dayKey => {
    const dayDt = planDt?.[dayKey] ?? {};
    let start = "", end = "";
    if(dayDt.version === 2){
      if(dayDt.enchoTarget==="after"){
        const times = getTimeTableTimes(dayDt, displayService);
        start = times.enchouStart ?? "";
        end = times.enchouEnd ?? "";
      }
    }else{
      start = dayDt.afterStart ?? "";
      end = dayDt.afterEnd ?? "";
    }
    return(
      <td key={`timeTr${dayKey}`} className='noneBorderTop noneBorderBottom times'>
        <span>{start && end ?start :""}</span>
        <span className='nami'>〜</span>
        <span>{start && end ?end :""}</span>
      </td>
    )
  });

  return(
    <>
    <tr>
      <th rowSpan="5" className='boldBorderBottom' style={{lineHeight: '1rem'}}>
        延長支援時間<br /><span style={{fontSize: 12, lineHeight: 0}}>※ 延長支援時間は、支援前・支援後それぞれ１時間以上から</span>
      </th>
      {DAYKEYS.map(dayKey => (<th key={`beforeHeader${dayKey}`} className='noneBorderBottom'>【支援前】<br />延長支援時間</th>))}
    </tr>
    <tr>{beforeTds}</tr>
    <tr>
      {DAYKEYS.map(dayKey => (<th key={`afterHeader${dayKey}`}>【支援後】<br />延長支援時間</th>))}
    </tr>
    <tr>{afterTds}</tr>
    <EntyouSumTimeTr planDt={planDt} />
    </>
  )
}

const TextTr = ({title, text}) => (
  <tr>
    <th className='boldBorderBottom' style={{height: 72}}>{title}</th>
    <td colSpan={DAYKEYS.length} className='boldBorderBottom text'>{text}</td>
  </tr>
)

const MainTable = () => {
  const {planDt} = useContext(PlanDtContext);

  return(
    <table className='boldBorder'>
      <thead className='boldBorderBottom'>
        <DayHeaderTr />
      </thead>
      <tbody>
        <BasisTrs />
        <EntyouTrs />
        <TextTr
          title="延長を必要とする理由"
          text={brtoLf(planDt?.reason)}
        />
        <TextTr
          title="特記事項"
          text={brtoLf(planDt?.note)}
        />
      </tbody>
    </table>
  )
}

const ParentConfirmation = ({user}) => {
  const classes = useStyles();
  const com = useSelector(state => state.com);
  const parentConfirmation = com?.ext?.reportsSetting?.timetable?.parentConfirmation ?? com?.etc?.configReports?.timetable?.parentConfirmation ?? {};
  if(parentConfirmation.checked === false) return null;
  let year = "", month = "", date = "";
  if(parentConfirmation.printDate){
    const nDate = new Date();
    const jtInit = formatDate(nDate, 'YYYY-MM-DD');
    const jtDate = localStorage.getItem("reportsSettingDate")
      ?JSON.parse(localStorage.getItem("reportsSettingDate"))?.["計画支援時間"] ?? jtInit
      :jtInit;
    year = jtDate.split("-")[0];
    month = jtDate.split("-")[1];
    date = jtDate.split("-")[2];
  }
  // サイン欄「印」表示設定
  const displayInn = com?.ext?.reportsSetting?.displayInn ?? com?.etc?.configReports?.displayInn ?? true;
  return(
    <div className={classes.parentConfirmation}>
      <div style={{width: '50%'}}>
        <div>
          {year ?year :<span style={{margin: '2rem'}}/>}年
          {month ?month :<span style={{margin: '1rem'}}/>}月
          {date ?date :<span style={{margin: '1rem'}}/>}日
        </div>
        <div style={{marginTop: 4}}>本計画書に基づき支援の説明を受け、内容に同意しました。</div>
      </div>
      <div>
        <div style={{display: 'inline-block', borderBottom: '1px solid', width: 360, paddingBottom: 2}}>
          <span style={{paddingRight: 16}}>名前</span>
          {parentConfirmation.bottomOfPage &&<span>{user.pname}</span>}
        </div>
        {displayInn &&<span>印</span>}
      </div>
    </div>
  )
}

const Sheet = (props) => {
  const location = useLocation();
  const urlCreated = new URLSearchParams(location.search).get("created");
  const classes = useStyles();
  const stdDate = useSelector(state => state.stdDate);
  const {user} = props;
  const timetable = user?.timetable ?? [];
  // 計画支援時間データがない場合は表示しない。
  if(!timetable.length) return null;
  const created = urlCreated ?urlCreated :getUsersTimeTableInitDateStr(timetable, stdDate);
  const [createdYear, createdMonth, createdDate] = created.split("-");
  const planDt = timetable.find(dt => dt.created === created)?.content;

  return(
    <PlanDtContext.Provider value={{planDt}}>
      <div className={classes.sheet}>
        <div className="title">個別支援計画別表</div>
        <div className='infos'>
          <div><UserNameTable user={user} /></div>
          <div>
            <span style={{marginRight: 8}}>作成日</span>
            <span className="createdYear">{createdYear}年</span>
            <span className="createdYear">{createdMonth}月</span>
            <span className="createdYear">{createdDate}日</span>
          </div>
        </div>
        <MainTable />
        <ParentConfirmation user={user} />
      </div>
    </PlanDtContext.Provider>
  )
}

export const TimeTableReports = (props) => {
  const classes = useStyles();
  const users = useSelector(state => state.users);
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);

  const {userList, preview} = props;

  if(preview !== '計画支援時間') return null;
  
  const displayService = service ?service :serviceItems[0];
  const filteredUsers = users.filter(user => {
    // 利用者データがObject型ではない時
    if(!checkValueType(user, 'Object')) return false;
    // 選択されているサービスではない利用者の時
    if(!(displayService==="" || new RegExp(displayService).test(user.service))) return false;
    // userListで選択されていない時
    if(!(userList.find(dt => dt.uid === user.uid)?.checked ?? false)) return false;
    return true;
  });
  const sheets = filteredUsers.map(user => {
    const sheetProps = {user};
    return(
      <Sheet key={`sheet${user.uid}`} {...sheetProps} />
    )
  });

  return(
    <div className={classes.sheets}>
      {!sheets.length &&(
        <div className='noData'>利用者情報が見つかりません。<br />サービスや単位の設定を見直して下さい。</div>
      )}
      {sheets.length>0 &&sheets}
    </div>
  )
}