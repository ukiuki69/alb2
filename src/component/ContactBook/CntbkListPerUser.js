import React, { useEffect, useState } from "react"
import { SideSectionUserSelect } from "../schedule/SchByUser2"
import { useSelector } from "react-redux";
import { brtoLf, getLodingStatus } from "../../commonModule";
import { DisplayInfoOnPrint, LoadingSpinner } from "../common/commonParts";
import { HOHOU } from '../../modules/contants';
import { defaultTitle, getFilteredUsers, getReportTitle } from '../../albCommonModule';
import SnackMsg from "../common/SnackMsg";
import { makeStyles } from "@material-ui/core";
import { DAY_LIST } from "../../hashimotoCommonModules";
import { CNTBK_CALENDAR_DATE_STORAGE_KEY, CntbkLinksTab, SavedMiniImgs, SendedJudg, VitalInfo, checkCntbkLineUser, checkCntbkMailUser, fetchContacts, getLatestTimestamp, getLatestTimestampValue } from "./CntbkCommon";
import { blue, red, teal } from "@material-ui/core/colors";
import ForwardIcon from '@material-ui/icons/Forward';
import { useHistory } from "react-router-dom";
import { checkValueType } from "../dailyReport/DailyReportCommon";
import { useSessionStorageState } from "../common/HashimotoComponents";

const SESSION_STORAGE_ITEM = "cntbkListPerUserSelectUid";

const useStyles = makeStyles({
  cntbkListPerUser: {
    width: '100%',
    margin: '0 auto', paddingLeft: 61.25
  },
  cntbkList: {
    maxWidth: 1080, minWidth: 680,
    margin: '128px auto 0',
    paddingLeft: 180+16, paddingRight: 16,
    '& .titleContents': {
      marginBottom: 32,
      display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
      '& .userInfo': {
        '& .name': {
          fontSize: 24, 
        },
        '& .honorificTitle': {
          marginLeft: 4
        },
        '& .ageStr': {
          marginLeft: 8
        }
      },
      '& .schCount': {
        marginLeft: 8
      }
    },
    '@media print': {margin:'16px auto 0', paddingLeft: 16,},

  },
  contents: {
    pageBreakInside: 'avoid',
    padding: '8px 0',
    marginBottom: 8,
    '&:hover': {
      cursor: 'pointer',
      '& .move': {
        opacity: 1
      },
    },
    '& .header': {
      display: 'flex', justifyContent: 'space-between',
      borderBottom: `1px solid ${teal[800]}`,
      paddingBottom: 4,
      fontSize: 18,
      '& .date': {
        lineHeight: "24px",
        // '& .day': {marginLeft: 8},
        '& .absence': {fontSize: '15px', fontWeight: 'bold', marginLeft: '8px'}
      },
      '& .holiday0': {},
      '& .holiday1': {backgroundColor: "#f8e3cb"},
      '& .holiday2': {backgroundColor: "#cacad9"},
      '& .move': {
        display: 'flex', alignItems: 'center',
        fontSize: 16, color: teal[800],
        opacity: 0,
        '@media print': {display: 'none '},

      }
    },
    '& .contents': {
      '& .content': {
        padding: '8px 0',
        '& .options': {

        },
        '& .preMessage, .familyMessage, .postMessage': {
          lineHeight: '1.5rem',
        },
        '& .preMessage, .postMessage': {
  
        },
        '& .familyMessage': {
          color: teal[800]
        },
        '& .noneMessage': {
          opacity: 0.6
        }
      }
    }
  }
});

const CntbkContents = (props) => {
  const classes = useStyles();
  const history = useHistory();
  const {contentDts, dDate, holiday, absence=false, isKessekiKasan=false} = props;
  const year = dDate.slice(1, 5);
  const month = dDate.slice(5, 7);
  const date = dDate.slice(7, 9);
  const day = DAY_LIST[new Date(parseInt(year), parseInt(month)-1, parseInt(date)).getDay()];

  const handleClick = () => {
    const year = dDate.slice(1, 5);
    const month = dDate.slice(5, 7);
    const date = dDate.slice(7, 9);
    sessionStorage.setItem(`${CNTBK_CALENDAR_DATE_STORAGE_KEY}${year}${month}`, date);
    history.push("/contactbook/");
  }

  const preContent = contentDts?.[0] ?? {};
  const preMessage = preContent.content;
  const preTimestampSaved = preContent.timestampSaved;
  const preTimestampError = preContent.timestampError;
  const preTimestampSent = preContent.timestampSent;
  const familyContent = contentDts?.[1] ?? {};
  const familyMessage = familyContent.content;
  const familyTimestampSent = familyContent.timestampSent;
  const postContent = contentDts?.[2] ?? {};
  const postMessage = postContent.content;
  const postavedTimestampSaved = postContent.timestampSaved;
  const postavedTimestampError = postContent.timestampError;
  const postTimestampSent = postContent.timestampSent;

  const absenceColor = isKessekiKasan ?blue[800] :red[800];

  // レンダリング前にpreMessageを処理
  const displayMessage = preMessage 
    ? (typeof preMessage === 'object' ? preMessage.content : preMessage)
    : "事前メッセージ未入力";

  return(
    <div className={classes.contents} onClick={handleClick}>
      <div className="header">
        <div className={`date holiday${holiday}`}>
          <span className="year">{year}年</span>
          <span className="month">{month}月</span>
          <span className="date">{date}日</span>
          <span className="day">({day})</span>
          {absence &&<span className="absence" style={{color: absenceColor}}>欠席</span>}
        </div>
        <div className="move">
          <span>日付別表示へ</span>
          <ForwardIcon />
        </div>
      </div>
      <div className="contents">
        <div className="content">
          <div className="options">
            <SendedJudg
              timestamp={getLatestTimestamp(preTimestampSaved, preTimestampSent, preTimestampError)}
              option={getLatestTimestampValue([preTimestampSaved, "saved"], [preTimestampSent, "sent"], [preTimestampError, "error"])}
            />
          </div>
          <div className={`preMessage ${!displayMessage ?"noneMessage" :""}`}>
            {brtoLf(displayMessage)}
          </div>
        </div>
        <div className="content">
          <div className="options">
            <SendedJudg
              timestamp={familyTimestampSent}
              option="familyMsg"
            />
          </div>
          <div className={`familyMessage ${!familyMessage ?"noneMessage" :""}`}>
            {familyMessage ?brtoLf(familyMessage) :"ご家族からのメッセージはありません。"}
          </div>
          <VitalInfo vitalDt={familyContent.vital} />
        </div>
        <div className="content">
          <div className="options">
            <SendedJudg
              timestamp={getLatestTimestamp(postavedTimestampSaved, postTimestampSent, postavedTimestampError)}
              option={postContent?.draft ?"draft" :getLatestTimestampValue([postavedTimestampSaved, "saved"], [postTimestampSent, "sent"], [postavedTimestampError], "error")}
            />
          </div>
          <div className={`postMessage ${!postMessage ?"noneMessage" :""}`}>
            {postMessage ?brtoLf(postMessage) :"ご様子メッセージ未入力"}
          </div>
          <VitalInfo vitalDt={postContent.vital} />
          <SavedMiniImgs thumbnails={postContent?.thumbnails ?? []}/>
        </div>
      </div>
    </div>
  )
}

const CntbkList = (props) => {
  const classes = useStyles();
  const {contactDt, user, sch, dateList} = props;
  const service = useSelector(state => state.service);
  const targetDDates = Array.from(new Set(Object.keys(sch).filter(dDate => {
    if(!/^D[0-9]{8}.*$/.test(dDate)) return false;
      if(sch[dDate]?.noUse) return false;
      return true;
    }).map(dDate => {
      return dDate.match(/^D[0-9]{8}/)[0];
    })
  )).sort((aDDate, bDDate) => {
    const aDate = parseInt(aDDate.slice(7, 9));
    const bDate = parseInt(bDDate.slice(7, 9));
    return aDate - bDate;
  });
  const contentsNodes = targetDDates.map((dDate, index) => {
    const contentDts = contactDt[dDate] ?? [];
    const holiday = dateList.find(dt => dt.date.getDate() === parseInt(dDate.slice(-2)))?.holiday;
    const hohouDid = `${dDate}H`;
    const schDt = sch?.[dDate] ?? {};
    const hohouSchDt = sch?.[hohouDid] ?? {};
    let absence = false;
    if(service){
      // サービス選択時
      if(service===HOHOU){
        absence = hohouSchDt?.absence;
      }else{
        absence = schDt?.absence;
      }
    }else{
      // 全サービス選択時
      absence = schDt?.absence && hohouSchDt?.absence;
    }
    let isKessekiKasan = false;
    if(service){
      // サービス選択時
      if(service===HOHOU){
        isKessekiKasan = hohouSchDt?.dAddiction?.["欠席時対応加算"];
      }else{
        isKessekiKasan = schDt?.dAddiction?.["欠席時対応加算"];
      }
    }else{
      // 全サービス選択時
      isKessekiKasan = schDt?.dAddiction?.["欠席時対応加算"] || hohouSchDt?.dAddiction?.["欠席時対応加算"];
    }
    return(
      <CntbkContents
        key={`cntbkContent${index+1}`}
        dDate={dDate} contentDts={contentDts}
        holiday={holiday}
        absence={absence}
        isKessekiKasan={isKessekiKasan}
      />
    )
  });

  const isTargetUser = user?.faptoken ?true :false;
  return(
    <div className={classes.cntbkList}>
      <DisplayInfoOnPrint/>
      <div className="titleContents">
        <div className="userInfo">
          <span className="name">{user?.name ?? ""}</span>
          <span className="honorificTitle">さま</span>
          <span className="ageStr">{user?.ageStr ?? ""}</span>
        </div>
        <div className="schCount">利用日数{targetDDates.length}日</div>
      </div>
      {isTargetUser &&contentsNodes}
      {isTargetUser && !targetDDates.length &&<div style={{textAlign: 'center'}}>利用がありません。</div>}
      {!isTargetUser &&<div style={{textAlign: 'center'}}>連絡帳対象利用者ではありません。</div>}
    </div>
  )
}

export const CntbkListPerUser = () => {
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const {users, hid, bid, stdDate, schedule, dateList, com, service, classroom} = allState;
  const classes = useStyles();
  const [selectUid, setSelectUid] = useSessionStorageState(null, SESSION_STORAGE_ITEM);
  const [contactsDt, setContactsDt] = useState(null);
  const [snack, setSnack] = useState({});

  useEffect(()=>{
    const thisTitle = getReportTitle(allState, '連絡帳利用者別一覧');
    const titleSet = () => document.title = thisTitle;
    const titleReset = () => document.title = defaultTitle;
    window.addEventListener('beforeprint', titleSet);
    window.addEventListener('afterprint', titleReset);
    return (()=>{
      window.removeEventListener('beforeprint', titleSet);
      window.removeEventListener('afterprint', titleReset);
    })
  }, []);

  useEffect(() => {
    if(!hid || !bid || !stdDate || !selectUid) return;
    let isMounted = true;
    fetchContacts(hid, bid, stdDate, "UID"+selectUid, null, setSnack).then(data => {
      if(isMounted) setContactsDt(data);
    });
    return () => { isMounted = false; }
  }, [hid, bid, stdDate, selectUid]);

  if(!loadingStatus.loaded) return(
    <>
    <CntbkLinksTab />
    <LoadingSpinner />
    </>
  );

  const filterUids = getFilteredUsers(users, service, classroom).filter(prevUser => {
    const sch = schedule?.["UID"+prevUser.uid];
    // 予定データがない場合は対象外
    if(!checkValueType(sch, 'Object')) return false;
    // 利用予定がない場合は対象外
    if(!Object.keys(sch).some(did => /^D[0-9]{8}$/.test(did) && !sch[did]?.noUse)) return false;
    // 連絡帳利用者ではない場合は対象外
    if(!checkCntbkMailUser(prevUser) && !checkCntbkLineUser(prevUser, com)) return false;
    // uidがない場合は対象外
    if(!prevUser.uid) return false;
    return true;
  }).map(prevUser => prevUser.uid);

  const user = users.find(u => u.uid === selectUid);
  const sch = schedule["UID"+selectUid] ?? {};
  const contactDt = contactsDt?.["UID"+selectUid] ?? {};
  const cntbkListProps = { user, sch, contactDt, dateList };
  return(
    <>
    <CntbkLinksTab />
    <div className={classes.cntbkListPerUser}>
      <SideSectionUserSelect
        suid={selectUid} setSuid={setSelectUid} 
        filterUids={filterUids}
        allowAnyService={true}
      />
      <CntbkList {...cntbkListProps} />
    </div>
    <SnackMsg {...snack} />
    </>
  )
}