import { Button, ButtonGroup, Checkbox, FormControlLabel, makeStyles, useMediaQuery } from "@material-ui/core"
import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { SchDaySettingMenuTitle } from "../schedule/SchDaySettingNoDialog";
import { useDispatch, useSelector } from "react-redux";
import { brtoLf, getLodingStatus } from "../../commonModule";
import { processDeepBrToLf } from "../../modules/newlineConv";
import { LoadingSpinner } from "../common/commonParts";
import { HOHOU } from '../../modules/contants';
import { getFilteredUsers, recentUserStyle, schLocked, univApiCall } from '../../albCommonModule';
import { AlbHMuiTextField, useFetchAlbDt, useLocalStorageState, useSessionStorageState } from "../common/HashimotoComponents";
import { CntbkSendButton } from "../ContactBook/CntbkCommon";
import SnackMsg from "../common/SnackMsg";
import { useHistory } from "react-router-dom";
import { grey, red, teal } from "@material-ui/core/colors";
import EditIcon from '@material-ui/icons/Edit';
import { ActivitiesProvider, CarOptionsProvider, DailyReportLinksTab, StaffOptionsProvider, checkValueType, useGetInitDate } from "./DailyReportCommon";
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import NotInterestedIcon from '@material-ui/icons/NotInterested';
import CloseIcon from '@material-ui/icons/Close';
import AddIcon from '@material-ui/icons/Add';
import { useGetHeaderHeight } from "../common/Header";
import { setSnackMsg, setStore } from "../../Actions";
import Tooltip from '@material-ui/core/Tooltip';
import SchDailyReportSyncer from "../schedule/SchDailyReportSyncer";
import { MINTRANSFERTIME_INIT } from "./DailyReportSetting";
import LockIcon from '@material-ui/icons/Lock';
import DescriptionIcon from '@material-ui/icons/Description';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import { initializeApp } from "firebase/app";
import { collection, getFirestore, onSnapshot, Timestamp, query, where } from 'firebase/firestore';
import { YesNoDialog } from "../common/GenericDialog";
import { useSyncVitalDailyReportAndCntbk } from "./useSyncVitalDailyReportAndCntbk";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB-Lj2ECjCYup2FqFGCp2r61U9yD5u5luY",
  authDomain: "albatross-432004.firebaseapp.com",
  projectId: "albatross-432004",
  storageBucket: "albatross-432004.appspot.com",
  messagingSenderId: "238548710535",
  appId: "1:238548710535:web:ceb3a1b4513826ee2bb422"
};

const SIDEBAR_WIDTH = 61.25;

// 共通
const CHECKBOX_WIDTH = 42;
const INDEX_WIDTH = '2rem';
const NAME_WIDTH = '6rem';
const NAME_MAX_WIDTH = '12rem';
// 送迎関係
const LOCATION_WIDTH = '4rem';
const CAR_WIDTH = '4rem';
const STAFF_WIDTH = '4rem';
const TIME_WIDTH = '3.5rem';
// 送迎情報（スマホ用）
const TRANSFER_INFO_WIDTH = '10rem';
// 活動内容・記録
const ACTIVITY_WIDTH = '15rem';
const NOTICE_WIDTH = '20rem';
const ACTIVITY_AND_NOTICE_WIDTH = '10rem';
// バイタル
const VITAL_WIDTH = '6rem';


const DidContext = createContext("");
const SnackContext = createContext({});

const useMakeLastMonthStdDate = () => {
  const stdDate = useSelector(state => state.stdDate);
  const [stdYear, stdMonth] = stdDate.split("-");
  const dateObj = new Date(parseInt(stdYear), parseInt(stdMonth)-1-1, 1);
  return dateObj.toISOString().slice(0, 10);
}

const useGetTargetUids = (sortType="nomal") => {
  const schedule = useSelector(state => state.schedule);
  const users = useSelector(state => state.users);
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service ?service :serviceItems[0];
  const classroom = useSelector(state => state.classroom);
  const {did} = useContext(DidContext);
  const hohouDid = did + "H";

  const targetUids = Object.keys(schedule).filter(uidStr => {
    // UIDxxx以外は無視
    if(!/^UID\d+$/.test(uidStr)) return false;

    const schDt = schedule?.[uidStr]?.[did];
    const hohouSchDt = schedule?.[uidStr]?.[hohouDid];
    // 予定データがない場合は対象外
    if(!checkValueType(schDt, 'Object') && !checkValueType(hohouSchDt, 'Object')) return false;
    // 予定データのサービス
    let schService = "";
    if(schDt) schService += schDt.service ?? "";
    if(schDt && hohouSchDt) schService += ",";
    if(hohouSchDt) schService += HOHOU ?? "";
    // 選択したサービスに一致しない場合は対象外
    if(service && (schService && !schService.includes(service))) return false;
    // 予定データの単位
    let schClassroom = "";
    if(schDt) schClassroom = schDt.classroom ?? "";
    if(schDt && hohouSchDt) schClassroom += ",";
    if(hohouSchDt) schClassroom += hohouSchDt.classroom ?? "";
    // 選択した単位に一致しない場合は対象外
    if(classroom && (schClassroom && !schClassroom.includes(classroom))) return false;

    const filteredUsers = getFilteredUsers(users, displayService, classroom);
    const user = filteredUsers.find(user => "UID"+user.uid === uidStr);
    // 対象利用者がいない場合は無視
    if(!user) return false;
    return true;
  }).sort((aUidStr, bUidStr) => {
    if(sortType === "nomal"){
      const aUser = users.find(user => "UID"+user.uid === aUidStr);
      const bUser = users.find(user => "UID"+user.uid === bUidStr);
      return parseInt(aUser.sindex) - parseInt(bUser.sindex);
    }else if(sortType === "start"){
      const aSchDt = schedule[aUidStr][did];
      const bSchDt = schedule[bUidStr][did];
      const aStart = aSchDt?.start ?? "00:00";
      const bStart = bSchDt?.start ?? "00:00";
      const [hours1, minutes1] = aStart.split(":").map(x => parseInt(x));
      const [hours2, minutes2] = bStart.split(":").map(x => parseInt(x));
      if (hours1 !== hours2) {
        return hours1 - hours2;
      } else if (minutes1 !== minutes2) {
        // 分が異なる場合も時刻でソート
        return minutes1 - minutes2;
      } else {
        // 時刻が同じ場合はkeyでソート
        return (aSchDt?.groupe ?? "").localeCompare((bSchDt?.groupe ?? ""));
      }
    }
  }).map(uidStr => uidStr.replace("UID", ""));

  return targetUids;
}


/**
 * 利用者からのメッセージをキャッチする。
 * @param {*} setMessages 
 * @param {*} uid 
 */
const useEditingStatusOnSnapshot = (uids, editingId, setEditingStatus) => {
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);

  useEffect(() => {
    if(!editingId || !uids.length || !hid || !bid) return;
    const app = initializeApp(FIREBASE_CONFIG);
    const db = getFirestore(app, "dairyreport-editing");
    const unsubscribes = [];
    for(const uid of uids){
      const editingIdsCollection = collection(db, hid+bid, String(uid), "editingIds");
      const now = Timestamp.now();
      const q = query(editingIdsCollection, where("expireAt", ">", now));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const isEditing = snapshot.docs.some((doc) => doc.id !== editingId);
        setEditingStatus(prev => ({...prev, ["UID"+uid]: isEditing}));
      }, (error) => {
        console.log(error);
      });
      unsubscribes.push(unsubscribe);
    }
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [uids.length, editingId, hid, bid]);
}

const useStyles = makeStyles({
  AppPage: {
    width: '95vw',
    margin: `${82+32}px auto`,
    "@media (min-width: 960px)": {
      maxWidth: 1080 + SIDEBAR_WIDTH,
      paddingLeft: SIDEBAR_WIDTH,
    },
    "@media (min-width: 960px) and (max-width: 1079px)": {

    },
    "@media (max-width: 959px)": {

    },
  },
  MainTable: {
    '& .options': {
      display: 'flex', justifyContent: 'space-between',
      padding: '16px 0', backgroundColor: '#fff',
      '& .schListInputPerDateTransitionButton': {textAlign: 'center'},
      "@media (max-width: 959px)": {
        '& .schListInputPerDateTransitionButton, .caution': {
          display: 'none'
        }
      },
    },
    '& .table': {
      width: '100%',
      '& .header, .body': {
        '& .row': {
          display: 'flex',
          '& >div:nth-child(odd)': {backgroundColor: '#fff'},
          '& >div:nth-child(even)': {backgroundColor: grey[100]},
          '& .checkbox': {minWidth: CHECKBOX_WIDTH, width: CHECKBOX_WIDTH},
          '& .index': {minWidth: INDEX_WIDTH, width: INDEX_WIDTH, textAlign: 'center'},
          '& .name': {minWidth: NAME_WIDTH, width: NAME_WIDTH, maxWidth: NAME_MAX_WIDTH, flexGrow: 1},
          '& .pickupLocation, .dropoffLocation': {minWidth: LOCATION_WIDTH, width: LOCATION_WIDTH, flexGrow: 1},
          '& .pickupCar, .dropoffCar': {minWidth: CAR_WIDTH, width: CAR_WIDTH, flexGrow: 0.5},
          '& .pickupStaff, .dropoffStaff': {minWidth: STAFF_WIDTH, width: STAFF_WIDTH, flexGrow: 0.5},
          '& .start, .end, .pickup, .dropoff': {minWidth: TIME_WIDTH, width: TIME_WIDTH, textAlign: 'center'},
          '& .transferInfo': {minWidth: TRANSFER_INFO_WIDTH, width: TRANSFER_INFO_WIDTH, flexGrow: 1},
          '& .notice': {minWidth: NOTICE_WIDTH, width: NOTICE_WIDTH, flexGrow: 1},
          '& .activity': {minWidth: ACTIVITY_WIDTH, width: ACTIVITY_WIDTH, flexGrow: 1},
          '& .activityAndNotice': {minWidth: ACTIVITY_AND_NOTICE_WIDTH, width: ACTIVITY_AND_NOTICE_WIDTH, flexGrow: 1},
          '& .vital': { width: VITAL_WIDTH, textAlign: 'center', flexGrow: 1},
        }
      },
      '& .header': {
        position: 'sticky', top: 142, zIndex: 2,
        borderBottom: `1px solid ${teal[800]}`,
        '& .row': {
          '& >div': {
            display: 'flex', justifyContent: 'center', alignItems: 'center'
          }
        }
      },
      '& .body': {
        '& .row': {
          borderBottom: '1px solid #ddd',
          '& .content': {
            padding: '9px 4px',
            lineHeight: '1.5rem'
          },
          '& .name': {position: 'relative'},
          '& .transferInfo': {
            padding: '9px 4px',
            '& .content': {
              padding: 0,
              '&:not(:last-child)': {
                marginBottom: 4
              }
            }
          },
          '& .activity': {
            display: 'flex', alignContent: 'flex-start', flexWrap: 'wrap'
          },
          '& .noticeTitle': {
            lineHeight: "21px", fontWeight: 'bold',
            fontSize: 14, color: teal[400]
          },
          '& .noticeText': {
            whiteSpace: 'pre-wrap', lineHeight: '1.5rem',
            '&:not(:last-child)': {
              marginBottom: 8
            }
          },
          '& .notice': {
            whiteSpace: 'pre-wrap'
          },
          '& .activityAndNotice': {
            padding: '9px 4px',
            '& .activities': {
              display: 'flex', alignContent: 'flex-start', flexWrap: 'wrap',
              '& > div': {
                padding: '4px 0',
                '&:last-child': {marginBottom: 8}
              }
            }
          },
          '& .editIcon': {
            color: grey[600], fontSize: 20,
            opacity: 0.4,
            position: 'absolute', right: 0,
            transition: 'all 0.3s ease'
          },
          '& .lockIcon': {
            color: red["A700"], fontSize: 20,
            position: 'absolute', right: 0,
            transition: 'all 0.3s ease'
          },
          '& .onHover': {
            fontSize: 40, opacity: .8,
            '&.editIcon': {
              color: teal[800]
            },
            '&.lockIcon': {
              color: red["A700"]
            },
          }
        },
        '& .hover:hover': {
          cursor: 'pointer',
          '& >div': {backgroundColor: `${teal[50]} !important`},
          '& .editIcon': {
            fontSize: 40, opacity: .8, color: teal[800],
          },
        },
        '& .selected': {
          '& >div': {backgroundColor: `${teal[50]} !important`}
        },
      }
    },
    '& .printable': {
      visibility: "visible"
    },
    customTooltip: {
      maxWidth: 300,
      fontSize: 12,
      transition: 'opacity 300ms ease-in-out', // 出現と消滅を滑らかに
      transitionDelay: '300ms', // ホバー後300msの遅延
    },
    customTooltipArrow: {
      transition: 'opacity 300ms ease-in-out',
      transitionDelay: '300ms',
    },
  },
  jigyosyoNotice: {
    mexWidth: 1080, 
    margin: '32px auto',
    "& .buttons": {
      marginTop: 8,
      display: 'flex', justifyContent: 'space-between',
    }
  },
  trainingTrigger: {
    marginTop: 16,
    marginBottom: 4,
    display: 'flex',
    justifyContent: 'center',
  },
  trainingButton: {
    minWidth: 260,
    minHeight: 64,
    textTransform: 'none',
    justifyContent: 'center',
    fontSize: '1rem',
  },
  trainingIcon: {
    fontSize: 36,
  },
  ChangeFormButtons: {
    '& .button': {
      width: 96, fontSize: 12, padding: '3px 12px'
    }
  }
});

const ChangeFormButtons = (props) => {
  const classes = useStyles();
  const com = useSelector(state => state.com);
  const service = useSelector(state => state.service);
  const isFilteredHohou = service && service === HOHOU;
  const dailyReportSetting = com?.ext?.schDailyReportSetting ?? {};
  const isDisplayActivities = dailyReportSetting?.activities!==false;
  const isDisplayNotice = dailyReportSetting?.notice!==false;
  const isDisplayVital = dailyReportSetting?.vital!==false;

  const noneTranfer = (
    dailyReportSetting.pickupLocation === false
    && dailyReportSetting.pickupCar === false
    && dailyReportSetting.pickupStaff === false
    && dailyReportSetting.pickup === false
    && dailyReportSetting.start === false
    && dailyReportSetting.end === false
    && dailyReportSetting.dropoff === false
    && dailyReportSetting.dropoffLocation === false
    && dailyReportSetting.dropoffCar === false
    && dailyReportSetting.dropoffStaff === false
  );
  const noneActivityAndNotice = (
    dailyReportSetting.activities===false &&
    dailyReportSetting.notice===false
  );
  const noneVital = (
    dailyReportSetting.vital ===false
    && dailyReportSetting.bloods ===false
    && dailyReportSetting.excretion ===false
    && dailyReportSetting.spo2 ===false
    && dailyReportSetting.meal ===false
    && dailyReportSetting.medication ===false
    && dailyReportSetting.sleep === "非表示"
  )

  const SESSIONSTORAGE_ITEM = "DailyReportFormSelect";
  const TRANSFER_KEY = "transfer";
  const NOTICE_KEY = "notice";
  const VITALS_KEY = "vitals";
  const [formType, setFormType] = useSessionStorageState(TRANSFER_KEY, SESSIONSTORAGE_ITEM);

  useEffect(() => {
    if(formType===TRANSFER_KEY && (noneTranfer || isFilteredHohou)){
      if(!noneActivityAndNotice){
        setFormType(NOTICE_KEY)
        if(props.setFormType) props.setFormType(NOTICE_KEY);
      }else if(!noneVital){
        setFormType(VITALS_KEY)
        if(props.setFormType) props.setFormType(VITALS_KEY);
      }
    }else if(formType===NOTICE_KEY && noneActivityAndNotice){
      if(!noneTranfer && !isFilteredHohou){
        setFormType(TRANSFER_KEY)
        if(props.setFormType) props.setFormType(TRANSFER_KEY);
      }else if(!noneVital){
        setFormType(VITALS_KEY)
        if(props.setFormType) props.setFormType(VITALS_KEY);
      }
    }else if(formType===VITALS_KEY && noneVital){
      if(!noneTranfer && !isFilteredHohou){
        setFormType(TRANSFER_KEY)
        if(props.setFormType) props.setFormType(TRANSFER_KEY);
      }else if(!noneActivityAndNotice){
        setFormType(NOTICE_KEY)
        if(props.setFormType) props.setFormType(NOTICE_KEY);
      }
    }else{
      setFormType(formType)
      if(props.setFormType) props.setFormType(formType);
    }
  }, [formType]);

  return(
    <ButtonGroup color="primary" className={classes.ChangeFormButtons} >
      {!noneTranfer && !isFilteredHohou &&<Button
        variant={formType===TRANSFER_KEY ?'contained' :'outlined'}
        onClick={() => {setFormType(TRANSFER_KEY)}}
        className="button"
      >
        送迎
      </Button>}
      {!noneActivityAndNotice &&<Button
        variant={formType===NOTICE_KEY ?'contained' :'outlined'}
        onClick={() => {setFormType(NOTICE_KEY)}}
        className="button"
      >
        {isDisplayActivities &&"活動"}
        {(isDisplayActivities && isDisplayNotice) &&"・"}
        {isDisplayNotice &&"記録"}
      </Button>}
      {!noneVital &&<Button
        variant={formType===VITALS_KEY ?'contained' :'outlined'}
        onClick={() => {setFormType(VITALS_KEY)}}
        className="button"
      >
        バイタル
      </Button>}
    </ButtonGroup>
  )
}

const SortButtons =  (props) => {
  const {sortType, setSortType, sessionStorageKey} = props;

  const handleClick = (e) => {
    const name = e.currentTarget.name;
    sessionStorage.setItem(sessionStorageKey, name);
    setSortType(name);
  }

  return(
    <ButtonGroup>
      <Button
        name="nomal"
        color='primary'
        variant='outlined'
        onClick={handleClick}
        disabled={sortType === "nomal"}
        className='sortButton'
      >
        標準
      </Button>
      <Button
        name="start"
        color='primary'
        variant='outlined'
        onClick={handleClick}
        disabled={sortType === "start"}
        className='sortButton'
      >
        時間順
      </Button>
    </ButtonGroup>
  )
}

const SelectAllCheckbox = (props) => {
  const schedule = useSelector(state => state.schedule);
  const {did} = useContext(DidContext);
  const hohouDid = did + "H";
  const {setSelectedUids} = props;
  const targetUids = useGetTargetUids();
  const filteredTargetUids = targetUids.filter(uid => {
    const uidStr = "UID"+uid;
    const schDt = schedule?.[uidStr]?.[did];
    const hohouSchDt = schedule?.[uidStr]?.[hohouDid];
    let absence = false;
    if(schDt && hohouSchDt){
      absence = schDt?.absence && hohouSchDt?.absence;
    }else if(schDt){
      absence = schDt?.absence;
    }else if(hohouSchDt){
      absence = hohouSchDt?.absence;
    }
    if(absence) return false;
    return true;
  });

  const handleChange = (e) => {
    const checked = e.target.checked;
    if(checked){
      setSelectedUids(filteredTargetUids);
    }else{
      setSelectedUids([]);
    }
  }

  return(
    <Checkbox
      onChange={handleChange}
      color='primary'
      disabled={!filteredTargetUids.length}
      style={{...props.style}}
    />
  )
}

const Header = ({formType, setSelectedUids}) => {
  const isLimit959px = useMediaQuery("(max-width:959px)");
  const headerHeight = useGetHeaderHeight();
  const com = useSelector(state => state.com);
  const schDailyReportSetting = com?.ext?.schDailyReportSetting ?? {};
  const schedule = useSelector(state => state.schedule);
  const {did} = useContext(DidContext);
  const users = useSelector(state => state.users);
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service ?service :serviceItems[0];
  const classroom = useSelector(state => state.classroom);
  const isSchLocked = schLocked(schedule, users, "", did, displayService, classroom);

  const noneTranfer = (
    schDailyReportSetting.pickupLocation === false
    && schDailyReportSetting.pickupCar === false
    && schDailyReportSetting.pickupStaff === false
    && schDailyReportSetting.pickup === false
    && schDailyReportSetting.start === false
    && schDailyReportSetting.end === false
    && schDailyReportSetting.dropoff === false
    && schDailyReportSetting.dropoffLocation === false
    && schDailyReportSetting.dropoffCar === false
    && schDailyReportSetting.dropoffStaff === false
  );
  const noneActivityAndNotice = (
    schDailyReportSetting.activities=== false
    && schDailyReportSetting.notice=== false
  );
  const noneVital = (
    schDailyReportSetting.vital === false
    && schDailyReportSetting.bloods === false
    && schDailyReportSetting.excretion === false
    && schDailyReportSetting.spo2 === false
    && schDailyReportSetting.meal === false
    && schDailyReportSetting.medication === false
    && schDailyReportSetting.sleep === "非表示"
  );
  const optionHide = [noneTranfer, noneActivityAndNotice, noneVital].filter(x => !x).length <= 1;

  // スマホ表示
  if(isLimit959px) return(
    <div
      className="header"
      style={
        headerHeight ?{top: optionHide ?headerHeight+48 :headerHeight+48+61} :{}
      }
    >
      <div className="row">
        {!isSchLocked &&<div className="checkebox">
          <SelectAllCheckbox
            setSelectedUids={setSelectedUids}
            style={{padding: 4, margin: '0 5px'}}
          />
        </div>}
        <div className="index">No</div>
        <div className="name">名前</div>
        {(formType === "transfer" && !noneTranfer) &&<div className="transferInfo">送迎情報</div>}
        {(formType === "notice" && !noneActivityAndNotice) &&(
          <div className="activityAndNotice">
            {schDailyReportSetting.activities!==false &&"活動"}
            {(schDailyReportSetting.activities!==false && schDailyReportSetting.notice!==false) &&"・"}
            {schDailyReportSetting.notice!==false &&"療育記録"}
          </div>
        )}
        {formType === "vitals" && !noneVital &&<div className="vital">バイタル</div>}
      </div>
    </div>
  );

  return (
    <div
      className="header"
      style={{top: optionHide ?82 :142}}
    >
      <div className="row">
        {!isSchLocked &&<div className="checkebox">
          <SelectAllCheckbox
            setSelectedUids={setSelectedUids}
            style={{padding: 4, margin: '0 5px'}}
          />
        </div>}
        <div className="index">No</div>
        <div className="name">名前</div>
        {formType === "transfer" && schDailyReportSetting.pickupLocation!==false &&<div className="pickupLocation">迎え先</div>}
        {formType === "transfer" && schDailyReportSetting.pickupCar!==false &&<div className="pickupCar">車両</div>}
        {formType === "transfer" && schDailyReportSetting.pickupStaff!==false &&<div className="pickupStaff">迎え担当</div>}
        {formType === "transfer" && schDailyReportSetting.pickup!==false &&<div className="pickup">迎え</div>}
        {formType === "transfer" && schDailyReportSetting.start!==false &&<div className="start">開始</div>}
        {formType === "transfer" && schDailyReportSetting.end!==false &&<div className="end">終了</div>}
        {formType === "transfer" && schDailyReportSetting.dropoff!==false &&<div className="dropoff">送り</div>}
        {formType === "transfer" && schDailyReportSetting.dropoffLocation!==false &&<div className="dropoffLocation">送り先</div>}
        {formType === "transfer" && schDailyReportSetting.dropoffCar!==false &&<div className="dropoffCar">車両</div>}
        {formType === "transfer" && schDailyReportSetting.dropoffStaff!==false &&<div className="dropoffStaff">送り担当</div>}
        {formType === "notice" && schDailyReportSetting.activities!==false &&<div className="activity">活動内容</div>}
        {formType === "notice" && schDailyReportSetting.notice!==false &&<div className="notice">療育記録</div>}
        {formType === "vitals" && schDailyReportSetting.vital!==false &&<div className="vital">体温</div>}
        {formType === "vitals" && schDailyReportSetting.bloods!==false &&<div className="vital">最高血圧</div>}
        {formType === "vitals" && schDailyReportSetting.bloods!==false &&<div className="vital">最低血圧</div>}
        {formType === "vitals" && schDailyReportSetting.bloods!==false &&<div className="vital">脈拍</div>}
        {formType === "vitals" && schDailyReportSetting.excretion!==false &&<div className="vital">排泄</div>}
        {formType === "vitals" && schDailyReportSetting.spo2!==false &&<div className="vital">血中酸素</div>}
        {formType === "vitals" && schDailyReportSetting.meal!==false &&<div className="vital">食事</div>}
        {formType === "vitals" && schDailyReportSetting.medication!==false &&<div className="vital">服薬</div>}
        {formType === "vitals" && (!schDailyReportSetting?.sleep || schDailyReportSetting?.sleep==="時間") &&<div className="vital">睡眠</div>}
        {formType === "vitals" && schDailyReportSetting.sleep==="就寝・起床" &&<div className="vital">就寝</div>}
        {formType === "vitals" && schDailyReportSetting.sleep==="就寝・起床" &&<div className="vital">起床</div>}
      </div>
    </div>
  )
};

const UserRowDAddictionContents = (props) => {
  const {reportDt, dAddiction} = props;
  const filteredDAddictions = Object.keys(dAddiction).filter(key => {
    if(key === "時間区分") return false;
    if(key === "延長支援") return false;
    return true;
  });
  const convDAddictionKeyToReportDtKey = (dAddictionKey) => {
    switch(dAddictionKey){
      case "保育訪問": return "hohouNotice";
      case "欠席時対応加算": return "kessekiNotice";
      case "家族支援加算Ⅰ": return "kazokuShienNotice";
      case "家族支援加算Ⅱ": return "kazokuShienNotice";
      case "子育てサポート加算": return "kosodateNotice";
      case "専門的支援実施加算": return "senmonShienNotice";
      case "関係機関連携加算": return "kankeiKikanNotice";
      case "医療連携体制加算": return "iryouKasanNotice";
      case "事業所間連携加算": return "jigyosyoKanNotice";
    }
  }

  const nodes = filteredDAddictions.map(key => {
    const reportDtKey = convDAddictionKeyToReportDtKey(key);
    const edited = reportDt?.[reportDtKey] ?true :false;
    const style = {
      fontSize: 12, fontWeight: edited ?600 :300,
      color: edited ?teal[600] :red[600],
      display: 'flex', alignItems: 'center'
    }
    return(
      <div
        key={key}
        style={{...style}}
      >
        {key}
        {edited &&<CheckBoxIcon style={{fontSize: 16}} />}
      </div>
    )
  });

  return(
    <div>{nodes}</div>
  )
}

const UserRow = (props) => {
  const isLimit959px = useMediaQuery("(max-width:959px)");
  const history = useHistory();
  const com = useSelector(state => state.com);
  const schedule = useSelector(state => state.schedule);
  const users = useSelector(state => state.users);
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service ?service :serviceItems[0];
  const classroom = useSelector(state => state.classroom);
  const schDailyReportSetting = com?.ext?.schDailyReportSetting ?? {};
  const {did} = useContext(DidContext);
  const {setSnack} = useContext(SnackContext);
  const isSchLocked = schLocked(schedule, users, "", did, displayService, classroom);
  const {index, user, sch, hohouSch, dailyReportDt, formType, selectedUids, setSelectedUids, setTransferTimeError, isEditing, editingStatus} = props;
  const [dialogOpen, setDialogOpen] = useState(false);

  const uid = user.uid;
  const dAddiction = {...sch?.dAddiction, ...hohouSch?.dAddiction};

  const letStartBePickup = schDailyReportSetting?.letStartBePickup ?? true;
  const reportDt = dailyReportDt?.[did] ?? {};
  const pickupLocation = reportDt.pickupLocation ?? sch?.transfer?.[0];
  const pickupCar = reportDt.pickupCar;
  const pickupStaff = reportDt.pickupStaff;
  const pickupSubStaff = reportDt.pickupSubStaff;
  const pickup = reportDt.pickup ?? (letStartBePickup && sch?.transfer?.[0] ?sch?.start : "");
  const start = reportDt.start ?? (letStartBePickup && sch?.transfer?.[0] ?"" :sch?.start);
  const end = reportDt.end ?? (sch?.end ?? "");
  const dropoff = reportDt.dropoff ?? "";
  const dropoffLocation = reportDt.dropoffLocation ?? sch?.transfer?.[1];
  const dropoffCar = reportDt.dropoffCar;
  const dropoffStaff = reportDt.dropoffStaff;
  const dropoffSubStaff = reportDt.dropoffSubStaff;
  const activities = reportDt.activities ?? [];
  const notice = reportDt.notice ?? "";
  const hohouNotice = reportDt.hohouNotice ?? "";
  const isAbsenceKasan = Boolean(dAddiction["欠席時対応加算"] === "1");
  const isKazokuShien = Boolean(dAddiction["家族支援加算Ⅰ"] || dAddiction["家族支援加算Ⅱ"]);
  const isKosodate = Boolean(dAddiction["子育てサポート加算"]);
  // const isSenmonShien = Boolean(dAddiction["専門的支援実施加算"]);
  const isKankeiKikan = Boolean(dAddiction["関係機関連携加算"]);
  const isIryouKasan = Boolean(dAddiction["医療連携体制加算"]);
  const isJigyosyoKan = Boolean(dAddiction["事業所間連携加算"]);
  const kessekiNotice = isAbsenceKasan &&(reportDt.kessekiNotice ?? "");
  const kazokuShienNotice = isKazokuShien &&(reportDt.kazokuShienNotice ?? "");
  const kosodateNotice = isKosodate &&(reportDt.kosodateNotice ?? "");
  const senmonShienNotice = reportDt.senmonShienNotice ?? "";
  const hiyariHatto = reportDt.hiyariHatto ?? "";
  const kankeiKikanNotice = isKankeiKikan &&(reportDt.kankeiKikanNotice ?? "");
  const iryouKasanNotice = isIryouKasan &&(reportDt.iryouKasanNotice ?? "");
  const jigyosyoKanNotice = isJigyosyoKan &&(reportDt.jigyosyoKanNotice ?? "");

  const edited = reportDt.edited ?? false;
  let absence = false;
  if(service){
    // サービス選択時
    if(service===HOHOU){
      if(hohouSch?.absence) absence = true;
    }else{
      if(sch?.absence) absence = true;
    }
  }else{
    // 全サービス選択時
    if(sch?.absence && hohouSch?.absence) absence = true;
  }
  let noUse = false;
  if(service){
    // サービス選択時
    if(service===HOHOU){
      if(hohouSch?.noUse) noUse = true;
    }else{
      if(sch?.noUse) noUse = true;
    }
  }else{
    // 全サービス選択時
    if(sch?.noUse && hohouSch?.noUse) noUse = true;
  }

  const [startError, setStartError] = useState(false);
  const [endError, setEndError] = useState(false);
  useEffect(() => {
    if(!sch) return;
    const minTransferTime = schDailyReportSetting?.minTransferTime ?? MINTRANSFERTIME_INIT;
    let newTransferTimeError = false;
    let newStartError = false;
    let newEndError = false;
    if(!absence && start && pickup && pickupLocation && !pickupLocation.startsWith("*") && !pickupLocation.endsWith("*")){
      const [startHours, startMinutes] = start.split(":");
      const startMin = parseInt(startHours)*60 + parseInt(startMinutes);
      const [pickupHours, pickupMinutes] = pickup.split(":");
      const pickupMin = parseInt(pickupHours)*60 + parseInt(pickupMinutes);
      if(startMin-pickupMin < minTransferTime){
        newTransferTimeError = true;
        newStartError = true;
      }
    }
    if(!absence && end && dropoff && dropoffLocation && !dropoffLocation.startsWith("*") && !dropoffLocation.endsWith("*")){
      const [dropoffHours, dropoffMinutes] = dropoff.split(":");
      const dropoffMin = parseInt(dropoffHours || "0")*60 + parseInt(dropoffMinutes || "0");
      const [endHours, endMinutes] = end.split(":");
      const endMin = parseInt(endHours || "0")*60 + parseInt(endMinutes || "0");
      if(dropoffMin-endMin < minTransferTime){
        newTransferTimeError = true;
        newEndError = true;
      }
    }
    setTransferTimeError(prevDt => {
      const newDt = {...prevDt};
      if(!newDt[uid]) newDt[uid] = {};
      newDt[uid][did] = newTransferTimeError;
      return newDt
    });
    setStartError(newStartError);
    setEndError(newEndError);
  }, [start, pickup, dropoff, end, did]);

  // バイタル関係
  const temperature = reportDt.temperature;
  const maxBloodPressure = reportDt?.bloods?.[0];
  const minBloodPressure = reportDt?.bloods?.[1];
  const bloodPulse = reportDt?.bloods?.[2];
  const excretion = reportDt?.excretion;
  const spo2 = reportDt?.spo2;
  const meal = reportDt?.meal;
  const medication = reportDt?.medication;
  let sleeptime = "";
  let bedtime = "";
  let wakeuptime = "";
  if((reportDt?.sleep ?? "").includes("-")){
    bedtime = (reportDt?.sleep ?? "").split("-")[0];
    wakeuptime = (reportDt?.sleep ?? "").split("-")[1];
  }else{
    sleeptime = reportDt?.sleep ?? "";
  }

  const handleChange = (e) => {
    const newBulkEditUids = JSON.parse(JSON.stringify(selectedUids));
    if(e.target.checked){
      if(!newBulkEditUids.includes(uid)) newBulkEditUids.push(uid);
    }else{
      if(newBulkEditUids.includes(uid)) newBulkEditUids.splice(newBulkEditUids.indexOf(uid), 1);
    }
    setSelectedUids(newBulkEditUids);
  }

  const handlePageTransition = () => {
    if(isSchLocked){
      setSnack({msg: '予定・実績はロックされています。', severity: 'warning', id: new Date().getTime()})
      return;
    }
    if(selectedUids.length >= 1 && absence){
      setSnack({msg: '欠席・利用なしの利用者は一括登録対象にできません。', severity: 'warning', id: new Date().getTime()})
      return;
    }
    const uids = [...new Set([uid, ...selectedUids])].join(",");
    const date = did.slice(-2);
    history.push(`/dailyreport/form/${uids}/${date}/${formType}`);
  }

  const handleClick = () => {
    if(selectedUids.length >= 2){
      const isSomeEditing = Object.entries(editingStatus).some(([uidStr, value]) => {
        if(!selectedUids.includes(uidStr.replace("UID", ""))) return false;
        return value;
      });
      if(isSomeEditing){
        setDialogOpen(true);
        return;
      }
    }
    if(isEditing){
      setDialogOpen(true);
      return;
    }
    
    handlePageTransition()
  }

  const isPickup = pickupLocation && !pickupLocation.startsWith("*") && !pickupLocation.endsWith("*");
  const isDropoff = dropoffLocation && !dropoffLocation.startsWith("*") && !dropoffLocation.endsWith("*");
  const iconStyle = {
    opacity: edited ?1 :0.5, padding: 9,
    color: isAbsenceKasan ?"rgb(13, 71, 161)" :"rgb(183, 28, 28)",
  };

  const yesnoDialogProps = {
    open: dialogOpen, setOpen: setDialogOpen, handleConfirm: handlePageTransition,
    prms: {
      title: "ロックされています。",
      message: (
        "この利用者は現在編集中のためロックされています。\n"
        + "ロックを解除して編集を行いますか？"
      )
    }
  };

  const isFilteredHohou = service && service === HOHOU;
  if(isLimit959px) return(
    <>
    <div
      className={`row ${!isSchLocked ?"hover" :""} ${selectedUids.includes(uid) ?"selected" :""}`}
      onClick={handleClick}
    >
      {!isSchLocked &&<div className="checkbox">
        {!absence &&<Checkbox
          color="primary"
          onChange={handleChange}
          checked={selectedUids.includes(uid)}
          onClick={(e) => e.stopPropagation()}
          disabled={sch?.absence ?? false}
        />}
        {absence && !noUse &&<NotInterestedIcon style={{...iconStyle}} />}
        {absence && noUse &&<CloseIcon style={{...iconStyle}} />}
      </div>}
      <div className="index content" style={{...recentUserStyle(String(uid))}}>{index+1}</div>
      <div className="name content">
        <div style={{display: 'flex', alignItems: 'center'}}>
          <div style={{color: edited ?null :grey[500], display: 'flex', alignItems: 'center'}}>{user.name}</div>
          {!isEditing && !isSchLocked && (selectedUids.length<1 || (selectedUids.length>=1 && !absence)) &&<EditIcon className={`editIcon ${selectedUids.includes(uid) ?"onHover" :""}`} />}
          {isEditing && !isSchLocked && (selectedUids.length<1 || (selectedUids.length>=1 && !absence)) &&<LockIcon className={`lockIcon ${selectedUids.includes(uid) ?"onHover" :""}`} />}
        </div>
        <UserRowDAddictionContents reportDt={reportDt} dAddiction={dAddiction} edited={edited} />
      </div>
      {(!isFilteredHohou && formType === "transfer") &&<div className="transferInfo">
        {(schDailyReportSetting?.pickupLocation!==false && pickupLocation) &&<div className="content">迎え先：{pickupLocation ?? ""}</div>}
        {(schDailyReportSetting?.pickupCar!==false && pickupCar && isPickup) &&<div className="content">車両：{pickupCar ?? ""}</div>}
        {(schDailyReportSetting?.pickupStaff!==false && Boolean(pickupStaff||pickupSubStaff) && isPickup) &&<div className="content">
          {pickupStaff &&<div>迎え担当：{pickupStaff ?? ""}</div>}
          {pickupSubStaff &&<div>添乗者：{pickupSubStaff ?? ""}</div>}
        </div>}
        {(schDailyReportSetting?.pickup!==false && pickup && isPickup) &&<div className="content"  style={{color: startError ?red["A700"] :null}}>迎え：{pickup ?? ""}</div>}
        {(schDailyReportSetting?.start!==false && start) &&<div className="content"  style={{color: startError ?red["A700"] :null}}>開始：{start ?? ""}</div>}
        {(schDailyReportSetting?.end!==false && end) &&<div className="content"  style={{color: endError ?red["A700"] :null}}>終了：{end ?? ""}</div>}
        {(schDailyReportSetting?.dropoff!==false && dropoff && isDropoff) &&<div className="content"  style={{color: endError ?red["A700"] :null}}>送り：{dropoff ?? ""}</div>}
        {(schDailyReportSetting?.dropoffLocation!==false && dropoffLocation) &&<div className="content">送り先：{dropoffLocation ?? ""}</div>}
        {(schDailyReportSetting?.dropoffCar!==false && dropoffCar && isDropoff) &&<div className="content">車両；{dropoffCar ?? ""}</div>}
        {(schDailyReportSetting?.dropoffStaff!==false && Boolean(dropoffStaff||dropoffSubStaff) && isDropoff) &&<div className="content">
          {dropoffStaff &&<div>送り担当：{dropoffStaff ?? ""}</div>}
          {dropoffSubStaff &&<div>添乗者：{dropoffSubStaff ?? ""}</div>}
        </div>}
      </div>}
      {formType === "notice" &&<div className="activityAndNotice">
        {(schDailyReportSetting?.activities!==false && activities.some(x=>x)) &&<div className="noticeTitle">活動内容</div>}
        {(schDailyReportSetting?.activities!==false && activities.some(x=>x)) &&<div className="activities">
          {activities.map((a, i) => <div key={`activity${i+1}`} style={{marginRight: 8}}>{a ?? ""}</div>)}
        </div>}
        {schDailyReportSetting?.notice!==false && notice ?<div className="noticeTitle">療育記録</div> :null}
        {schDailyReportSetting?.notice!==false && notice ?<div className="noticeText">{notice}</div> :null}
        {schDailyReportSetting?.notice!==false && hohouNotice ?<div className="noticeTitle">保育所等訪問支援</div> :null}
        {schDailyReportSetting?.notice!==false && hohouNotice ?<div className="noticeText">{hohouNotice}</div> :null}
        {schDailyReportSetting?.notice!==false && kessekiNotice ?<div className="noticeTitle">欠席時対応加算</div> :null}
        {schDailyReportSetting?.notice!==false && kessekiNotice ?<div className="noticeText">{kessekiNotice}</div> :null}
        {schDailyReportSetting?.notice!==false && kazokuShienNotice ?<div className="noticeTitle">家族支援加算</div> :null}
        {schDailyReportSetting?.notice!==false && kazokuShienNotice ?<div className="noticeText">{kazokuShienNotice}</div> :null}
        {schDailyReportSetting?.notice!==false && kosodateNotice ?<div className="noticeTitle">子育てサポート加算</div> :null}
        {schDailyReportSetting?.notice!==false && kosodateNotice ?<div className="noticeText">{kosodateNotice}</div> :null}
        {schDailyReportSetting?.notice!==false && kankeiKikanNotice ?<div className="noticeTitle">関係機関連携加算</div> :null}
        {schDailyReportSetting?.notice!==false && kankeiKikanNotice ?<div className="noticeText">{kankeiKikanNotice}</div> :null}
        {schDailyReportSetting?.notice!==false && iryouKasanNotice ?<div className="noticeTitle">医療連携体制加算</div> :null}
        {schDailyReportSetting?.notice!==false && iryouKasanNotice ?<div className="noticeText">{iryouKasanNotice}</div> :null}
        {schDailyReportSetting?.notice!==false && jigyosyoKanNotice ?<div className="noticeTitle">事業所間連携加算</div> :null}
        {schDailyReportSetting?.notice!==false && jigyosyoKanNotice ?<div className="noticeText">{jigyosyoKanNotice}</div> :null}
        {schDailyReportSetting?.notice!==false && senmonShienNotice ?<div className="noticeTitle">専門的支援実施加算</div> :null}
        {schDailyReportSetting?.notice!==false && senmonShienNotice ?<div className="noticeText">{senmonShienNotice}</div> :null}
        {schDailyReportSetting?.notice!==false && hiyariHatto ?<div className="noticeTitle">ヒヤリハット</div> :null}
        {schDailyReportSetting?.notice!==false && hiyariHatto ?<div className="noticeText">{hiyariHatto}</div> :null}
      </div>}
      {formType === "vitals" &&<div className="vital" style={{textAlign: 'start'}}>
        {schDailyReportSetting?.vital!==false && temperature ?<div className="content">{`体温：${temperature}℃`}</div> :null}
        {schDailyReportSetting?.bloods!==false && maxBloodPressure ?<div className="content">{`最高血圧：${maxBloodPressure}mmHg`}</div> :null}
        {schDailyReportSetting?.bloods!==false && minBloodPressure ?<div className="content">{`最低血圧：${minBloodPressure}mmHg`}</div> :null}
        {schDailyReportSetting?.bloods!==false && bloodPulse ?<div className="content">{`脈拍：${bloodPulse}回/分`}</div> :null}
        {schDailyReportSetting?.excretion!==false && excretion ?<div className="content">{`排泄：${excretion}`}</div> :null}
        {schDailyReportSetting?.spo2!==false && spo2 ?<div className="content">{`血中酸素濃度：${spo2}%`}</div> :null}
        {schDailyReportSetting?.meal!==false && meal ?<div className="content">{`食事：${meal}`}</div> :null}
        {schDailyReportSetting?.medication!==false && medication ?<div className="content">{`服薬：${medication}`}</div> :null}
        {(!schDailyReportSetting?.sleep || schDailyReportSetting?.sleep==="時間") && sleeptime ?<div className="content">{`睡眠：${sleeptime}時間`}</div> :null}
        {schDailyReportSetting?.sleep==="就寝・起床" && bedtime ?<div className="content">{`就寝：${bedtime}`}</div> :null}
        {schDailyReportSetting?.sleep==="就寝・起床" && wakeuptime ?<div className="content">{`起床：${wakeuptime}`}</div> :null}
      </div>}
    </div>
    <YesNoDialog {...yesnoDialogProps} />
    </>
  )
  return(
    <>
    <div
      className={`row ${!isSchLocked ?"hover" :""} ${selectedUids.includes(uid) ?"selected" :""}`}
      onClick={handleClick}
    >
      {!isSchLocked &&<div className="checkbox">
        {!absence &&<Checkbox
          color="primary"
          onChange={handleChange}
          checked={selectedUids.includes(uid)}
          onClick={(e) => e.stopPropagation()}
        />}
        {absence && noUse &&<CloseIcon style={{...iconStyle}} />}
        {absence && !noUse &&<NotInterestedIcon style={{...iconStyle}} />}
      </div>}
      <div className="index content" style={{...recentUserStyle(String(uid))}}>{index+1}</div>
      <div className="name content">
        <div style={{display: 'flex', alignItems: 'center'}}>
          <div style={{color: edited ?null :grey[500], display: 'flex', alignItems: 'center'}}>{user.name}</div>
          {!isEditing && !isSchLocked && (selectedUids.length<1 || (selectedUids.length>=1 && !absence)) &&<EditIcon className={`editIcon ${selectedUids.includes(uid) ?"onHover" :""}`} />}
          {isEditing && !isSchLocked && (selectedUids.length<1 || (selectedUids.length>=1 && !absence)) &&<LockIcon className={`lockIcon ${selectedUids.includes(uid) ?"onHover" :""}`} />}
        </div>
        <UserRowDAddictionContents reportDt={reportDt} dAddiction={dAddiction} edited={edited} />
      </div>
      {(!isFilteredHohou && formType === "transfer" && schDailyReportSetting?.pickupLocation!==false) &&<div className="pickupLocation content">{pickupLocation ?? ""}</div>}
      {(!isFilteredHohou && formType === "transfer" && schDailyReportSetting?.pickupCar!==false) &&<div className="pickupCar content">{isPickup ?pickupCar ?? "" :""}</div>}
      {(!isFilteredHohou && formType === "transfer" && schDailyReportSetting?.pickupStaff!==false) &&<div className="pickupStaff content">
        <div>{isPickup ?pickupStaff ?? "" :""}</div>
        <div>{isPickup ?pickupSubStaff ?? "" :""}</div>
      </div>}
      {(!isFilteredHohou && formType === "transfer" && schDailyReportSetting?.pickup!==false) &&<div className="pickup content" style={{color: startError ?red["A700"] :null}}>{isPickup ?pickup ?? "" :""}</div>}
      {(!isFilteredHohou && formType === "transfer" && schDailyReportSetting?.start!==false) &&<div className="start content" style={{color: startError ?red["A700"] :null}}>{start ?? ""}</div>}
      {(!isFilteredHohou && formType === "transfer" && schDailyReportSetting?.end!==false) &&<div className="end content" style={{color: endError ?red["A700"] :null}}>{end ?? ""}</div>}
      {(!isFilteredHohou && formType === "transfer" && schDailyReportSetting?.dropoff!==false) &&<div className="dropoff content" style={{color: endError ?red["A700"] :null}}>{isDropoff ?dropoff ?? "" :""}</div>}
      {(!isFilteredHohou && formType === "transfer" && schDailyReportSetting?.dropoffLocation!==false) &&<div className="dropoffLocation content">{dropoffLocation ?? ""}</div>}
      {(!isFilteredHohou && formType === "transfer" && schDailyReportSetting?.dropoffCar!==false) &&<div className="dropoffCar content">{isDropoff ?dropoffCar ?? "" :""}</div>}
      {(!isFilteredHohou && formType === "transfer" && schDailyReportSetting?.dropoffStaff!==false) &&<div className="dropoffStaff content">
        <div>{isDropoff ?dropoffStaff ?? "" :""}</div>
        <div>{isDropoff ?dropoffSubStaff ?? "" :""}</div>
      </div>}
      {formType === "notice" && schDailyReportSetting?.activities!==false &&<div className="activity content">
        {activities.map((a, i) => <div key={`activity${i+1}`} style={{marginRight: 8}}>{a ?? ""}</div>)}
      </div>}
      {formType === "notice" && schDailyReportSetting?.notice!==false &&<div className="notice content">
        {notice ?<div className="noticeText">{notice}</div> :null}
        {hohouNotice ?<div className="noticeTitle">保育所等訪問支援</div> :null}
        {hohouNotice ?<div className="noticeText">{hohouNotice}</div> :null}
        {kessekiNotice ?<div className="noticeTitle">欠席時対応加算</div> :null}
        {kessekiNotice ?<div className="noticeText">{kessekiNotice}</div> :null}
        {kazokuShienNotice ?<div className="noticeTitle">家族支援加算</div> :null}
        {kazokuShienNotice ?<div className="noticeText">{kazokuShienNotice}</div> :null}
        {kosodateNotice ?<div className="noticeTitle">子育てサポート加算</div> :null}
        {kosodateNotice ?<div className="noticeText">{kosodateNotice}</div> :null}
        {kankeiKikanNotice ?<div className="noticeTitle">関係機関連携加算</div> :null}
        {kankeiKikanNotice ?<div className="noticeText">{kankeiKikanNotice}</div> :null}
        {iryouKasanNotice ?<div className="noticeTitle">医療連携体制加算</div> :null}
        {iryouKasanNotice ?<div className="noticeText">{iryouKasanNotice}</div> :null}
        {jigyosyoKanNotice ?<div className="noticeTitle">事業所間連携加算</div> :null}
        {jigyosyoKanNotice ?<div className="noticeText">{jigyosyoKanNotice}</div> :null}
        {senmonShienNotice ?<div className="noticeTitle">専門的支援実施加算</div> :null}
        {senmonShienNotice ?<div className="noticeText">{senmonShienNotice}</div> :null}
        {hiyariHatto ?<div className="noticeTitle">ヒヤリハット</div> :null}
        {hiyariHatto ?<div className="noticeText">{hiyariHatto}</div> :null}
      </div>}
      {formType === "vitals" && schDailyReportSetting?.vital!==false &&<div className="vital content">{temperature ?`${temperature}℃` :""}</div>}
      {formType === "vitals" && schDailyReportSetting?.bloods!==false &&<div className="vital content">{maxBloodPressure ?`${maxBloodPressure}mmHg` :""}</div>}
      {formType === "vitals" && schDailyReportSetting?.bloods!==false &&<div className="vital content">{minBloodPressure ?`${minBloodPressure}mmHg` :""}</div>}
      {formType === "vitals" && schDailyReportSetting?.bloods!==false &&<div className="vital content">{bloodPulse ?`${bloodPulse}回/分` :""}</div>}
      {formType === "vitals" && schDailyReportSetting?.excretion!==false &&<div className="vital content">{excretion ?`${excretion}` :""}</div>}
      {formType === "vitals" && schDailyReportSetting?.spo2!==false &&<div className="vital content">{spo2 ?`${spo2}%` :""}</div>}
      {formType === "vitals" && schDailyReportSetting?.meal!==false &&<div className="vital content">{meal ?`${meal}` :""}</div>}
      {formType === "vitals" && schDailyReportSetting?.medication!==false &&<div className="vital content">{medication ?`${medication}` :""}</div>}
      {formType === "vitals" && (!schDailyReportSetting?.sleep || schDailyReportSetting?.sleep==="時間") &&<div className="vital content">{sleeptime ?`${sleeptime}時間` :""}</div>}
      {formType === "vitals" && schDailyReportSetting?.sleep==="就寝・起床" &&<div className="vital content">{bedtime ?`${bedtime}` :""}</div>}
      {formType === "vitals" && schDailyReportSetting?.sleep==="就寝・起床" &&<div className="vital content">{wakeuptime ?`${wakeuptime}` :""}</div>}
    </div>
    <YesNoDialog {...yesnoDialogProps} />
    </>
  )
}

const JigyosyoNoticeTextFeild = (props) => {
  const dispatch = useDispatch();
  const classes = useStyles();
  const schedule = useSelector(state => state.schedule);
  const users = useSelector(state => state.users);
  const com = useSelector(state => state.com);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service ?service :serviceItems[0];
  const classroom = useSelector(state => state.classroom);
  const stdDate = useSelector(state => state.stdDate);
  const {did} = useContext(DidContext);
  const {setSnack} = useContext(SnackContext);
  const {dailyReport} = props;

  const dailyReportSetting = com?.ext?.schDailyReportSetting ?? {};
  const [isNoticePerService, setIsNoticePerService] = useState(dailyReportSetting.isNoticePerService ?? false);
  const [isNoticePerClassroom, setIsNoticePerClassroom] = useState(dailyReportSetting.isNoticePerClassroom ?? false);
  const [showTraining, setShowTraining] = useState(false);

  const classrooms = users.filter(user => {
    if(!(user?.service ?? "").includes(displayService)) return false;
    if(!user?.classroom) return false;
    return true;
  }).reduce((prevClassrooms, user) => {
    const thisClassrooms = user.classroom.split(",");
    thisClassrooms.forEach(thisClassroom => {
      if(!prevClassrooms.includes(thisClassroom)) prevClassrooms.push(thisClassroom);
    });
    return prevClassrooms;
  }, []);

  let labelPrefix = "事業所全体の";
  let baseKey = "";
  if(isNoticePerService && isNoticePerClassroom && classroom!==""){
    labelPrefix = `${service}・${classroom}全体の`;
    baseKey = `${service}${classroom}`;
  }else if(isNoticePerService && classroom===""){
    labelPrefix = `${service}全体の`;
    baseKey = `${service}`;
  }else if(isNoticePerService){
    labelPrefix = `${service}全体の`;
    baseKey = `${service}`;
  }else if(isNoticePerClassroom && classroom!==""){
    labelPrefix = `${classroom}全体の`;
    baseKey = `${classroom}`;
  }

  const dtKey = baseKey ? `${baseKey}Notice` : "jNotice";
  const trainingDtKey = baseKey ? `${baseKey}TrainingNotice` : "jTrainingNotice";
  const textFieldLabel = `${labelPrefix}記録`;
  const trainingTextFieldLabel = "法定研修記録";

  const [originText, setOriginText] = useState("");
  const [text, setText] = useState("");
  const [originTrainingText, setOriginTrainingText] = useState("");
  const [trainingText, setTrainingText] = useState("");

  useEffect(() => {
    const jNotice = dailyReport?.[dtKey]?.[did] ?? "";
    setOriginText(jNotice);
    setText(jNotice);
    const jTrainingNotice = dailyReport?.[trainingDtKey]?.[did] ?? "";
    setOriginTrainingText(jTrainingNotice);
    setTrainingText(jTrainingNotice);
    if(jTrainingNotice) setShowTraining(true);
  }, [dailyReport ,did, service, classroom, isNoticePerClassroom, isNoticePerService]);

  const isSchLocked = schLocked(schedule, users, "", did, displayService, classroom);
  if(isSchLocked) return null;

  const handleFocus = (e) => {
    const val = e.target.value;
    if(val) return;
    const initValue = brtoLf(com?.ext?.dailyReportTemplate?.officeNotice ?? "");
    setText(initValue);
  }

  const handleTrainingFocus = (e) => {
    const val = e.target.value;
    if(val) return;
    const initValue = brtoLf(com?.ext?.dailyReportTemplate?.officeTrainingNotice ?? "");
    setTrainingText(initValue);
  }

  const handleClick = async() => {
    const newDailyReportDt = JSON.parse(JSON.stringify(dailyReport));
    
    // 通常記録の保存
    if(!checkValueType(newDailyReportDt[dtKey], 'Object')) newDailyReportDt[dtKey] = {};
    newDailyReportDt[dtKey][did] = text;
    
    // 法定研修記録の保存
    if(!checkValueType(newDailyReportDt[trainingDtKey], 'Object')) newDailyReportDt[trainingDtKey] = {};
    newDailyReportDt[trainingDtKey][did] = trainingText;

    // APIコール (まとめて送信できないため、複数回呼ぶか、別途APIがあるか確認だが、ここでは既存に従い個別送信を非同期で行う)
    // ただし、univApiCallはPromiseを返すので、並列実行可能
    
    const prms1 = {
      "a": "sendPartOfDailyReportWithKey",
      hid, bid, date: stdDate, key1: dtKey,
      partOfRpt: JSON.stringify(newDailyReportDt[dtKey])
    };
    
    const prms2 = {
      "a": "sendPartOfDailyReportWithKey",
      hid, bid, date: stdDate, key1: trainingDtKey,
      partOfRpt: JSON.stringify(newDailyReportDt[trainingDtKey])
    };

    const promises = [univApiCall(prms1)];
    // 変更がある場合のみ、あるいは常に送信するか。既存は常に送信しているようなのでそれに倣う
    // trainingTextが空でoriginも空なら送信不要かもしれないが、念のため送信しておく
    promises.push(univApiCall(prms2));

    const results = await Promise.all(promises);
    const isSuccess = results.every(res => res?.data?.result);

    if(!isSuccess){
      setSnack({msg: '保存に失敗しました。', severity: 'error', id: new Date().getTime()});
      return;
    }

    const newComExt = checkValueType(com?.ext, 'Object') ?JSON.parse(JSON.stringify(com.ext)) :{};
    if(!newComExt.schDailyReportSetting) newComExt.schDailyReportSetting = {};
    const newDailyReportSetting = newComExt.schDailyReportSetting;
    newDailyReportSetting.isNoticePerService = isNoticePerService;
    newDailyReportSetting.isNoticePerClassroom = isNoticePerClassroom;
    const sendExtParams = {
      a: "sendComExt",
      hid, bid, ext: JSON.stringify(newComExt)
    }
    univApiCall(sendExtParams)
    dispatch(setStore({com: {...com, ext: newComExt}}));
    dispatch(setSnackMsg("保存しました。"));
  }

  const handleRefActivities = () => {
    if(text.includes("活動内容：")) return;
    const todayActivities = Object.values(dailyReport).reduce((prevActivities, userDt) => {
      const userActivities = userDt?.[did]?.activities ?? [];
      userActivities.forEach(prevActivity => {
        if(!prevActivities.includes(prevActivity)) prevActivities.push(prevActivity);
      });
      return prevActivities;
    }, []);
    setText(prevText => {
      const activitiesStr = `活動内容：${todayActivities.join("、")}`;
      if(!prevText) return activitiesStr;
      return prevText + "\n\n" + activitiesStr;
    });
  }

  const buttonDisabled = originText === text && originTrainingText === trainingText;
  return(
    <div className={classes.jigyosyoNotice}>
      <AlbHMuiTextField
        value={text}
        onFocus={handleFocus}
        onChange={(e) => setText(e.target.value)}
        multiline
        minRows={4} maxRows={8}
        rows={4} rowsMax={8}
        label={textFieldLabel}
        variant="outlined"
        width="100%"
      />
      {showTraining && (
        <div style={{marginTop: 16}}>
          <AlbHMuiTextField
            value={trainingText}
            onFocus={handleTrainingFocus}
            onChange={(e) => setTrainingText(e.target.value)}
            multiline
            minRows={4} maxRows={8}
            rows={4} rowsMax={8}
            label={trainingTextFieldLabel}
            variant="outlined"
            width="100%"
          />
        </div>
      )}
      <div className="buttons">
        <div style={{minWidth: '144px', display: 'flex', flexDirection: 'column', gap: 8}}>
          <div style={{width: 144}}>
            <Button
              variant="outlined"
              onClick={handleRefActivities}
              className="button"
            >
              活動内容を反映
            </Button>
          </div>
          {(!showTraining || !trainingText.trim()) && (
            <div >
              <Button
                color={showTraining ? "default" : "primary"}
                onClick={() => setShowTraining(!showTraining)}
                className="button"
                startIcon={showTraining ? <VisibilityOffIcon /> : <DescriptionIcon />}
              >
                {showTraining ? '法定研修記録非表示' : '法定研修記録を表示'}
              </Button>
            </div>
          )}
        </div>
        <div style={{
            display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', 
            alignItems: 'start', gap: 8 
          }}>
          <div style={{
            display: 'flex', flexWrap: 'wrap', 
            justifyContent: 'flex-end', alignItems: 'start'
          }}>

            {serviceItems.length>=2 &&<FormControlLabel
              control={<Checkbox
                color="primary"
                checked={isNoticePerService}
                onChange={(e) => setIsNoticePerService(e.target.checked)}
              />}
              label="サービス別に記録"
            />}
            {(classrooms.length>=2 && classroom!=="") &&<FormControlLabel
              control={<Checkbox
                color="primary"
                checked={isNoticePerClassroom}
                onChange={(e) => setIsNoticePerClassroom(e.target.checked)}
              />}
              label="クラス別に記録"
            />}
          </div>
          <CntbkSendButton
            label="内容を保存"
            handleClick={handleClick}
            disabled={buttonDisabled}
          />
        </div>
      </div>
    </div>
  )
}

const MainTable = ({dailyReport, lastMonthDailyReport}) => {
  const headerHeight = useGetHeaderHeight();
  const classes = useStyles();
  const history = useHistory();
  const users = useSelector(state => state.users);
  const schedule = useSelector(state => state.schedule);
  const [selectedUids, setSelectedUids] = useState([]);
  const [formType, setFormType] = useState("");
  const [sortType, setSortType] = useSessionStorageState("nomal", "dailyReportSortType");
  const {did} = useContext(DidContext);
  const hohouDid = did + "H";
  const targetUids = useGetTargetUids(sortType);
  const com = useSelector(state => state.com);
  const dailyReportSetting = com?.ext?.schDailyReportSetting ?? {};
  const [transferTimeError, setTransferTimeError] = useState({});
  const [editingId, setEditingId] = useLocalStorageState(null, "dairyReportEditingId");
  const [editingStatus, setEditingStatus] = useState({});
  useEditingStatusOnSnapshot(targetUids, editingId, setEditingStatus);

  const userRowNodes = targetUids.map((uid, index) => {
    const user = users.find(u => u.uid === uid);
    const uidStr = "UID"+uid;
    const sch = schedule[uidStr][did];
    const hohouSch = schedule[uidStr][hohouDid];
    const dailyReportDt = checkValueType(dailyReport?.[uidStr], 'Object') ?dailyReport[uidStr] :{};
    const userRowProps = {
      index, user, sch, hohouSch, dailyReportDt,
      formType, selectedUids, setSelectedUids,
      setTransferTimeError,
      isEditing: editingStatus[uidStr] ?? false,
      editingStatus
    };
    return(<UserRow key={`userRow${uid}`} {...userRowProps} />);
  });

  if(!userRowNodes.length) return(
    <div style={{textAlign: 'center'}}>利用者がいません。</div>
  )

  const noneTranfer = (
    dailyReportSetting.pickupLocation === false
    && dailyReportSetting.pickupCar === false
    && dailyReportSetting.pickupStaff === false
    && dailyReportSetting.pickup === false
    && dailyReportSetting.start === false
    && dailyReportSetting.end === false
    && dailyReportSetting.dropoff === false
    && dailyReportSetting.dropoffLocation === false
    && dailyReportSetting.dropoffCar === false
    && dailyReportSetting.dropoffStaff === false
  );
  const noneActivityAndNotice = (
    dailyReportSetting.activities===false &&
    dailyReportSetting.notice===false
  );
  const noneVital = (
    dailyReportSetting.vital === false
    && dailyReportSetting.bloods === false
    && dailyReportSetting.excretion === false
    && dailyReportSetting.spo2 === false
    && dailyReportSetting.meal === false
    && dailyReportSetting.medication === false
    && dailyReportSetting.sleep === "非表示"
  );
  const optionHide = [noneTranfer, noneActivityAndNotice, noneVital].filter(x => !x).length <= 1;

  const providerProps = {dailyReport, lastMonthDailyReport};
  const jigyosyoNoticeProps = {dailyReport};
  return(
    <>
    <div className={classes.MainTable}>
      <div
        className="options"
        style={{
          position: optionHide ?'unset' :'sticky', top: headerHeight ?headerHeight+48 :82, zIndex: 2,
          display: optionHide ?'none' :'flex'
        }}
      >
        <div className="leftOptioins"></div>
        <div className="rightOptions" style={{display: 'flex', alignItems: 'center'}}>
          {Object.values(transferTimeError).some(x => x[did]) &&<div style={{color: red["A700"], marginRight: '16px'}}>送迎時間に問題があります。</div>}
          <ChangeFormButtons setFormType={setFormType} />
        </div>
      </div>
      <div className="table">
        <Header formType={formType} setSelectedUids={setSelectedUids} />
        <div className="body">
          <CarOptionsProvider {...providerProps}>
            <StaffOptionsProvider {...providerProps}>
              <ActivitiesProvider {...providerProps}>
                {userRowNodes}
              </ActivitiesProvider>
            </StaffOptionsProvider>
          </CarOptionsProvider>
        </div>
      </div>
      <div className="options">
        <div className="leftOptioins">
          <SortButtons
            sortType={sortType} setSortType={setSortType}
            sessionStorageKey="dailyReportSortType"
          />
        </div>
        <div className="rightOptions">
          <div className="schListInputPerDateTransitionButton">
            <Tooltip 
              title="日付別一覧入力ページに移動します。日報編集のページから離れるのでご注意下さい。" 
              arrow
              classes={{ tooltip: classes.customTooltip, arrow: classes.customTooltipArrow }}
            >
              <Button
                variant="contained"
                onClick={() => history.push(`/schedule/listinput/perdate/${did.slice(-2)}/`)}
              >
                日付別一覧入力へ
              </Button>
            </Tooltip>
          </div>
          <span className="caution" style={{
            color: red[800], fontSize: '.7rem', display: 'block', 
            textAlign: 'center', marginTop: 8,
          }}>
            予定実績を編集します
          </span>
        </div>
      </div>
      <JigyosyoNoticeTextFeild {...jigyosyoNoticeProps} />
    </div>
    </>
  )
}

export const DailyReport = () => {
  const headerHeight = useGetHeaderHeight();
  const classes = useStyles();
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const {stdDate, hid, bid} = allState;
  const [snack, setSnack] = useState({});
  const initCalendarDate = useGetInitDate();
  const [calendarDate, setCalendarDate] = useSessionStorageState(initCalendarDate, `schDailyReportDate${stdDate}`);
  const [dailyReport] = useFetchAlbDt({"a": "fetchDailyReport", hid, bid, date: stdDate}, ["dailyreport"], false, {}, setSnack);
  const lastMonthStdDate = useMakeLastMonthStdDate();
  const [lastMonthDailyReport] = useFetchAlbDt({"a": "fetchDailyReport", hid, bid, date: lastMonthStdDate}, ["dailyreport"], false, {}, setSnack);

  // ネストされたオブジェクトの改行処理を適用
  const processedDailyReport = useMemo(() => {
    return processDeepBrToLf(dailyReport);
  }, [dailyReport]);

  const processedLastMonthDailyReport = useMemo(() => {
    return processDeepBrToLf(lastMonthDailyReport);
  }, [lastMonthDailyReport]);

  // 連絡帳日報バイタルデータ同期処理
  useSyncVitalDailyReportAndCntbk();

  if(!loadingStatus.loaded || !calendarDate || !dailyReport || !lastMonthDailyReport) return(
    <> 
    <DailyReportLinksTab />
    <LoadingSpinner />
    </>
  )

  const did = "D" + calendarDate.replace(/-/g, "");
  return(
    <>
    <DailyReportLinksTab />
    <div className={classes.AppPage} style={headerHeight ?{marginTop: headerHeight+32} :{}}>
      <SchDaySettingMenuTitle title="日報" targetDate={calendarDate} setTargetDate={setCalendarDate}/>
      <DidContext.Provider value={{did}}>
        <SnackContext.Provider value={{setSnack}}>
          <MainTable dailyReport={processedDailyReport} lastMonthDailyReport={processedLastMonthDailyReport} />
        </SnackContext.Provider>
      </DidContext.Provider>
    </div>
    <SnackMsg {...snack} />
    <SchDailyReportSyncer />
    </>
  )
}