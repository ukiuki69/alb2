import { makeStyles } from "@material-ui/core"
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getLodingStatus } from "../../commonModule";
import { LoadingSpinner } from "../common/commonParts";
import { useFetchAlbDt } from "../common/HashimotoComponents";
import SnackMsg from "../common/SnackMsg";
import { useHistory } from "react-router-dom";
import { teal, grey } from "@material-ui/core/colors";
import { DailyReportLinksTab } from "./DailyReportCommon";
import { SideSectionUserSelect } from "../schedule/SchByUser2";
import ForwardIcon from '@material-ui/icons/Forward';
import { getFilteredUsers } from '../../albCommonModule';

const SESSION_STORAGE_ITEM = "dailyReportPerUserSelectUid";

const useStyles = makeStyles({
  dailyReportListPerUser: {
    width: '100%',
    margin: '0 auto', paddingLeft: 61.25
  },
  dailyReportList: {
    maxWidth: 1080, minWidth: 680,
    margin: '128px auto 0',
    paddingLeft: 180+16, paddingRight: 16,
    '& .userInfo': {
      marginBottom: 32, textAlign: 'center',
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
    },
    '& .table': {
      minWidth: 680,
      '& .header, .body': {
        '& .row': {
          display: 'flex',
          backgroundColor: '#fff',
          '& >div:nth-child(odd)': {
            backgroundColor: grey[100]
          },
          '& .date': {
            maxWidth: 32, minWidth: 32
          },
          '& .start, .end': {
            maxWidth: 64, minWidth: 64
          },
          '& .temperature': {
            maxWidth: 64, minWidth: 64
          },
          '& .activities': {
            minWidth: 240,
            flex: 1.5
          },
          '& .notice': {
            minWidth: 100,
            flex: 1
          }
        }
      },
      '& .header': {
        textAlign: 'center',
        borderBottom: `1px solid ${teal[800]}`,
        '& .row': {
          '& >div': {
            padding: '4px 0',
          }
        }
      },
      '& .body': {
        '& .row': {
          position: 'relative',
          borderBottom: `1px solid #ddd`,
          '&:hover': {
            cursor: 'pointer',
            '& >div': {
              backgroundColor: `${teal[50]}!important`,
            },
            '& .moveMessage': {
              opacity: 1
            }
          },
          '& >div': {
            padding: '12px 4px',
          },
          '& .date, .start, .end, .temperature': {
            textAlign: 'center'
          },
          '& .activity': {
            marginRight: 8
          },
          '& .moveMessage': {
            position: 'absolute', right: 0, top: 0, bottom: 0,
            display: 'flex', alignItems: 'center',
            opacity: 0,
            color: teal[800], backgroundColor: teal[50]
          }
        }
      }
    }
  }
});

const DailyReportContents = (props) => {
  const history = useHistory();
  const {schDt, dRDt, dDate, stdDate, jNotice} = props;

  const date = dDate.slice(-2) ?? "";
  const start = dRDt.start ?? schDt.start ?? "";
  const end = dRDt.end ?? schDt.end ?? "";
  const temperature = dRDt.temperature ?dRDt.temperature+"℃" :"";
  const activities = (dRDt.activities ?? []).map((activity, i) => <span key={"activity"+i} className="activity">{activity}</span>);
  const notice = dRDt.notice ?? "";

  if(schDt.absence){
    // 欠席
    return(
      <div>
        <div className="absence"></div>
      </div>
    )
  }

  const handleClick = () => {
    const viewPageYear = dDate.slice(1, 5);
    const viewPageMonth = dDate.slice(5, 7);
    sessionStorage.setItem(`schDailyReportDate${stdDate}`, `${viewPageYear}-${viewPageMonth}-${date}`);
    history.push("/dailyreport/");
  }

  return(
    <div className="row" onClick={handleClick}>
      <div className="date">{date}</div>
      <div className="start">{start}</div>
      <div className="end">{end}</div>
      <div className="temperature">{temperature}</div>
      <div className="activities">{activities}</div>
      <div className="notice">{notice}</div>
      <div className="notice">{jNotice}</div>
      <div className="moveMessage">日付別表示へ<ForwardIcon /></div>
    </div>
  )
}

const DailyReportList = (props) => {
  const classes = useStyles();
  const {sch, user, dailyReportUserDt, stdDate, jNoticeDt} = props;

  if(!sch) return null;

  const targetDDates = Object.keys(sch).filter(dDate => /^D[0-9]{8}$/.test(dDate));
  targetDDates.sort((aDDate, bDDate) => {
    const aDate = parseInt(aDDate.slice(-2));
    const bDate = parseInt(bDDate.slice(-2));
    return aDate - bDate;
  });
  const nodes = targetDDates.map((dDate, index) => {
    const schDt = sch[dDate]
    const dRDt = dailyReportUserDt?.[dDate] ?? {};
    const jNotice = jNoticeDt?.[dDate] ?? "";
    const contentsProps = {schDt, dRDt, dDate, stdDate, jNotice};
    return(<DailyReportContents key={`DailyReportContents${index}`} {...contentsProps} />)
  });

  return(
    <div className={classes.dailyReportList}>
      <div className="userInfo">
        <span className="name">{user?.name ?? ""}</span>
        <span className="honorificTitle">さま</span>
        <span className="ageStr">{user?.ageStr ?? ""}</span>
        <span className="schCount">利用日数{targetDDates.length}日</span>
      </div>
      <div className="table">
        <div className="header">
          <div className="row">
            <div className="date">日</div>
            <div className="start">開始</div>
            <div className="end">終了</div>
            <div className="temperature">体温</div>
            <div className="activities">活動内容</div>
            <div className="notice">記録</div>
            <div className="notice">事業所行事</div>
            <div className=""></div>
          </div>
        </div>
        <div className="body">
          {nodes}
        </div>
      </div>
    </div>
  )
}

export const DailyReportListPerUser = () => {
  const classes = useStyles();
  const allState = useSelector(state => state);
  // 連絡帳と日報の体温データを同期する。（値がない場合にだけ値がある方のデータを挿入）
  // useSyncVitalDailyReportAndCntbk();
  const {stdDate, users, schedule, hid, bid, classroom, service} = allState;
  const filteredUsers = getFilteredUsers(users, service, classroom);
  const [snack, setSnack] = useState({});
  const [selectUid, setSelectUid] = useState(sessionStorage.getItem(SESSION_STORAGE_ITEM) ?? filteredUsers?.[0]?.uid);
  const [userAttr, setUserAttr] = useState([]);
  const [dailyReportDt] = useFetchAlbDt({"a": "fetchDailyReport", hid, bid, date: stdDate}, ["dailyreport"], false, {}, setSnack);

  useEffect(() => {
    if(!/^[0-9]+$/.test(selectUid)) return;
    sessionStorage.setItem(SESSION_STORAGE_ITEM, selectUid);
  }, [selectUid]);

  if(!(getLodingStatus(allState).loaded && /^\d+$/.test(selectUid) && dailyReportDt)) return(
    <>
    <DailyReportLinksTab />
    <LoadingSpinner />
    </>
  )

  const uidStr = "UID" + selectUid;
  const sch = schedule[uidStr];
  const user = filteredUsers.find(uDt => uDt.uid === selectUid);
  const dailyReportUserDt = dailyReportDt[uidStr];
  const jNoticeDt = dailyReportDt?.jNotice ?? {};
  const listProps = {sch, user, dailyReportUserDt, stdDate, jNoticeDt};
  return(
    <>
    <DailyReportLinksTab />
    <div className={classes.dailyReportListPerUser}>
      <SideSectionUserSelect
        suid={selectUid} setSuid={setSelectUid} 
        userAttr={userAttr} setUserAttr={setUserAttr}
      />
      <DailyReportList {...listProps} />
    </div>
    <SnackMsg {...snack} />
    </>
  )
}