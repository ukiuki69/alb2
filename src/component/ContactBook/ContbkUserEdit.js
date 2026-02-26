import { Button, InputAdornment, makeStyles, useMediaQuery } from '@material-ui/core';
import axios from 'axios';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { brtoLf, convHankaku, formatDate, getLodingStatus, lfToBr, makeUrlSearchParams, parsePermission, randomStr } from '../../commonModule';
import { GoBackButton, LoadingSpinner } from '../common/commonParts';
import { endPoint, univApiCall } from '../../albCommonModule';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import { teal, blue, red } from '@material-ui/core/colors';
import SnackMsg from '../common/SnackMsg';
import { AlbHMuiTextField, getNextSchedule, safeJsonParse, useFetchAlbDt, useLocalStorageState, useSessionStorageState } from '../common/HashimotoComponents';
import { useHistory, useParams } from 'react-router';
import { CNTBK_INIT_CONTENTS, SendedJudg, CntbkLinksTab, getPostMessageDisabled, VitalInfo, CntbkPostMessageButtons, CntbkCancelButton, CntbkSendButton, AddedImgs, ImgWithDeleteFunc, checkContactDtLocked, CNTBK_MAIN_HISTORY_PATH, isCntbkLineUser, isCntbkMailUser, CNTBK_CALENDAR_DATE_STORAGE_KEY, fetchContacts, getLatestTimestamp, getLatestTimestampValue, sendOneMessageOfContact, sendDtUnderUidOfContact, INPUT_LIMIT, INPUT_LIMIT_HELPERTEXT, lockContactDt, unlockContactDt, checkCntbkLineUser, checkCntbkMailUser } from './CntbkCommon';
import { DAY_LIST } from '../../hashimotoCommonModules';
import { YesNoDialog } from '../common/GenericDialog';
import { deleteEscapeCharacter } from '../../modules/deleteEscapeCharacter';
import EditIcon from '@material-ui/icons/Edit';
import { updateNotificationChecked } from '../FreeMessage/MessageBox';
import { useGetHeaderHeight } from '../common/Header';
import { checkValueType } from '../dailyReport/DailyReportCommon';
import { initializeApp } from 'firebase/app';
import { collection, doc, getFirestore, setDoc, addDoc, deleteDoc, onSnapshot, Timestamp, query, where } from 'firebase/firestore';

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB-Lj2ECjCYup2FqFGCp2r61U9yD5u5luY",
  authDomain: "albatross-432004.firebaseapp.com",
  projectId: "albatross-432004",
  storageBucket: "albatross-432004.appspot.com",
  messagingSenderId: "238548710535",
  appId: "1:238548710535:web:ceb3a1b4513826ee2bb422"
};

const SIDEBAR_WIDTH = 61.25;

const sendUserDailyReportNotice = async (dailyReportDt, dailyReportNotice, uid, dDate, hid, bid, stdDate, setSnack) => {
  const uidStr = "UID" + uid;
  const userDailyReportDt = JSON.parse(JSON.stringify(dailyReportDt?.[uidStr] ?? {}));
  if(!userDailyReportDt[dDate]) userDailyReportDt[dDate] = {};
  const dt = userDailyReportDt[dDate];
  if(dt.notice === dailyReportNotice) return;
  dt.notice = dailyReportNotice;
  const params = {
    "a": "sendPartOfDailyReportWith2Key",
    hid, bid, date: stdDate, key1: uidStr, key2: dDate,
    partOfRpt: JSON.stringify({notice: dailyReportNotice, edited: true})
  }
  const res = await univApiCall(params);
  if(res?.data?.result){
    setSnack({msg: '保存しました。'});
    return true;
  }else{
    setSnack({msg: '保存に失敗しました。', severity: 'error', id: new Date().getTime()});
    return false;
  }
}

/**
 * 利用者からのメッセージをキャッチする。
 * @param {*} setMessages 
 * @param {*} uid 
 */
const useEditingCntOnSnapshot = (uid, editingId, setEditingCnt) => {
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);

  useEffect(() => {
    // ローカルストレージにロック無効化フラグがある場合は無視
    if(safeJsonParse(localStorage.getItem("DisableCntbkAndDailyReportLock"), false)) return;
    if(!editingId || !uid || !hid || !bid) return;
    const app = initializeApp(FIREBASE_CONFIG);
    const db = getFirestore(app, "cntbk-editing");
    const editingIdsCollection = collection(db, hid+bid, String(uid), "editingIds");
    const now = Timestamp.now();
    const q = query(editingIdsCollection, where("expireAt", ">", now));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newEditingCnt = snapshot.docs.reduce((prevCnt, doc) => {
        if(doc.id !== editingId) prevCnt++;
        return prevCnt;
      }, 0);
      setEditingCnt(newEditingCnt);
    }, (error) => {
      console.log(error);
    });
    return () => {
      unsubscribe();
    };
  }, [uid, editingId, hid, bid]);
}

// 連絡帳データ用コンテキスト
const ContactsContext = createContext(null);
// スナックメッセージステート用コンテキスト
const SnackContext = createContext(null);
// 日報用コンテキスト
const DailyReportContext = createContext(null);

const useStyles = makeStyles({
  AppPage: {
    width: '95vw',
    margin: `${82+32}px auto`,
    "@media (min-width: 1080px)": {
      position: 'relative',
      maxWidth: (1080 - 358) + SIDEBAR_WIDTH,
      paddingLeft: SIDEBAR_WIDTH,
    },
    "@media (min-width: 501px) and (max-width: 1079px)": {
      position: 'relative',
    },
  },
  cntbkEdit: {
    '& .title': {
      padding: 8,
      textAlign: 'center',
      color: teal[800],
      fontWeight: 'bold',
      backgroundColor: teal[50],
      borderBottom: `1px solid ${teal[300]}`
    },
    '& .buttonContainer': {
      textAlign: 'right',
      marginTop: 8,
    },
  },
  messageFormTitle: {
    fontSize: '0.75rem',
    color: teal[800], fontWeight: 'bold',
    paddingBottom: 4,
    borderBottom: `1px solid ${teal[300]}`,
    marginBottom: 8
  },
  userInfo: {
    marginTop: 24, marginBottom: 24,
    fontSize: 18, textAlign: 'center',
    '& .date': {
      marginBottom: 12
    },
    '& .name': {
      fontSize: 20
    },
    '& .horificTitle, .schoolGrade': {
      fontSize: 14, 
    },
    '& .schoolGrade': {
      marginLeft: 8
    },
    '& .absence': {
      fontWeight: 'bold', marginLeft: 8
    }
  },
  messageField: {
    width: '100%', marginBottom: 24,
    '& .message, noneMessage': {
      lineHeight: '1.5rem', whiteSpace: 'pre-wrap'
    },
    '& .noneMessage': {
      opacity: '0.6'
    },
    '& .editIcon': {
      position: 'absolute', top: -4, right: 0,
    }
  },
  preMessageField: {
    '& .buttons': {
      textAlign: 'end',
      marginTop: 8,    
    },
    "@media (min-width:600px)": {
      '& .sendButton': {
        marginLeft: 12
      }
    },
    "@media (max-width:599px)": {
      '& .buttons': {
        '& .sendButton': {
          marginLeft: 8
        }
      }
    },
  },
  familyMessageField: {
    marginBottom: 56,
  },
  imgField: {
    display: 'flex', flexWrap: 'wrap',
  },
  vitalForm: {
    display: "flex", flexWrap: 'wrap',
    margin: '8px 0'
  },
  dailyReportPasteButton: {
    textAlign: 'end',
    marginTop: 8,
    '@media (max-width:599px)': {
      '& .button': {
        padding: '4px 10px',
        fontSize: 12
      },
    },
  }
})

export const BackHistoryButton = () => {
  const history = useHistory();
  return(
    <Button
      variant="outlined"
      color='primary'
      onClick={() => history.goBack()}
      style={{marginBottom: 8}}
    >
      <ArrowBackIosIcon />
      <span style={{fontSize: 16}}>戻る</span>
    </Button>
  )
}

const UserInfo = (props) => {
  const classes = useStyles();
  const {user, dDate, schedule} = props;
  const hohouDid = `${dDate}H`;

  const year = dDate.slice(1, 5);
  const month = dDate.slice(5, 7);
  const date = dDate.slice(7, 9);
  const day = new Date(parseInt(year), parseInt(month)-1, parseInt(date)).getDay();

  const uidStr = "UID"+user.uid;
  const schDt = schedule?.[uidStr]?.[dDate];
  const hohouSchDt = schedule?.[uidStr]?.[hohouDid];
  const absence = schDt && hohouSchDt
    ?schDt?.absence && hohouSchDt?.absence
    :schDt
      ?schDt?.absence
      :hohouSchDt
        ?hohouSchDt?.absence
        :false;
  const kessekiKasan = schDt?.dAddiction?.["欠席時対応加算"] || hohouSchDt?.dAddiction?.["欠席時対応加算"];
  const absenceColor = kessekiKasan ?blue[800] :red[800];

  return(
    <div className={classes.userInfo}>
      <div className='date'>
        {month}月{date}日({DAY_LIST[day]})
      </div>
      <div className='user'>
        <span className='name'>{user.name}</span>
        <span className='horificTitle'>さま</span>
        <span className='schoolGrade'>{user.ageStr}</span>
        {absence &&<span className='absence' style={{color: absenceColor}}>欠席</span>}
      </div>
    </div>
  )
}

const ContentTextField = (props) => {
  let {contentText, setContentText, disabled=false, setEdited, ...textFieldProps} = props;
  if (typeof contentText === 'object' && contentText !== null) {
    contentText = contentText.content;
  }
  const handleChange = (e) => {
    setContentText(e.target.value);
    if(setEdited) setEdited(true);
  }
  
  return(
    <AlbHMuiTextField
      value={brtoLf(contentText)}
      multiline
      minRows="4" maxRows="10"
      rows="4" rowsMax="10"
      variant="outlined"
      onChange={handleChange}
      disabled={disabled}
      style={{width: '100%'}}
      error={props.error}
      helperText={props.helperText}
      {...textFieldProps}
    />
  )
}

const exceptionVitalForm = (text, dtName, kind, vitalDt) => {
  if(kind || kind===0){
    if(dtName === "bloods"){
      const origin = vitalDt[dtName] ?[...vitalDt[dtName]] :["", "", ""];
      origin[kind] = text;
      return origin;
    }else if(dtName === "sleep" && kind !== "sleeptime"){
      const origin = vitalDt[dtName] ?vitalDt.sleep.includes("-") ?vitalDt.sleep.split("-") :null :null;
      if(origin && kind === "bedtime"){
        return `${text}-${origin[1]}`;
      }else if(origin && kind === "wakeuptime"){
        return `${origin[0]}-${text}`;
      }else if(!origin && kind === "bedtime"){
        return `${text}-`;
      }else if(!origin && kind === "wakeuptime"){
        return `-${text}`;
      }
    }
  }
  return text;
}

const VitalFormTextField = (props) => {
  const {
    dtName, kind="", vitalDt, setVitalDt, val, label, placeholder, adronment="", width, varidate=null, errMsg="",
    disabled=false, disabledDt, setDisabledDt,
  } = props;
  const [inputError, setInputError] = useState(false);
  const handleChange = (e) => {
    const text = e.target.value;
    const data = {...vitalDt};
    data[dtName] = exceptionVitalForm(text, dtName, kind, vitalDt);
    setVitalDt({...data});
    if(text && varidate && !new RegExp(varidate).test(text)){
      setInputError(true);
      setDisabledDt({...disabledDt, [dtName+kind]: true});
    }else{
      setDisabledDt({...disabledDt, [dtName+kind]: false});
      setInputError(false);
    }
  }
  const handleBlur = (e) => {
    const han_text = convHankaku(e.target.value);
    const data = {...vitalDt};
    data[dtName] = exceptionVitalForm(han_text, dtName, kind, vitalDt);
    setVitalDt({...data})
  }

  return(
    <AlbHMuiTextField
      error={inputError}
      label={label}
      placeholder={placeholder}
      value={val}
      InputLabelProps={{ shrink: true }}
      InputProps={{
        endAdornment: <InputAdornment position="end">{adronment}</InputAdornment>,
      }}
      helperText={inputError ?errMsg :""}
      disabled={disabled}
      style={{margin: "8px 8px 8px 4px", width}}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  )
}

const VitalForm = (props) => {
  const classes = useStyles();
  const {vitalDt, setVitalDt, com, disabled, disabledDt, setDisabledDt} = props;
  const comEtc = com?.etc;
  const vitalRequired = comEtc?.settingContactBook?.bitalRequired ?? [];
  if(!vitalRequired[2]) return null;
  const vital_info = comEtc?.settingContactBook?.vital ?? {};
  const temperature_val = vitalDt?.temperature ?? "";
  const maxBloodPressure_val = vitalDt?.bloods?.[0] ?? "";
  const minBloodPressure_val = vitalDt?.bloods?.[1] ?? "";
  const bloodPulse_val = vitalDt?.bloods?.[2] ?? "";
  const excretion_val = vitalDt?.excretion ?? "";
  const spo2_val = vitalDt?.spo2 ?? "";
  const meal_val = vitalDt?.meal ?? "";
  const medication_val = vitalDt?.medication ?? "";
  let sleeptime_val = "", bedtime_val = "", wakeuptime_val = "";
  const sleep_val = vitalDt?.sleep ?? "";
  if(sleep_val.includes("-")){
    bedtime_val = sleep_val.split("-")[0];
    wakeuptime_val = sleep_val.split("-")[1];
  }else{
    sleeptime_val = sleep_val;
  }

  const temperature = {
    dtName: 'temperature', val: temperature_val, label: "体温", placeholder: "例：36.5", adronment: "度", width: '8rem',
    varidate: "(^[1-9１-９][0-9０-９]\\.[0-9０-９]+$)|(^[1-9１-９][0-9０-９]$)", errMsg: "数字または小数点のみ"
  }
  const maxBloodPressure = {
    dtName: "bloods", kind: 0, val: maxBloodPressure_val, label: "最高血圧", placeholder: "例：120", adronment: "mmHg", width: '8rem',
    varidate: "^[1-9１-９][0-9０-９]{0,2}$", errMsg: "数字のみ"
  }
  const minBloodPressure = {
    dtName: "bloods", kind: 1, val: minBloodPressure_val, label: "最低血圧", placeholder: "例：80", adronment: "mmHg", width: '8rem',
    varidate: "^[1-9１-９][0-9０-９]{0,2}$", errMsg: "数字のみ"
  }
  const bloodPulse = {
    dtName: "bloods", kind: 2, val: bloodPulse_val, label: "脈拍", placeholder: "例：90", adronment: "回/分", width: '8rem',
    varidate: "^[1-9１-９][0-9０-９]{0,2}$", errMsg: "数字のみ"
  }
  const excretion = {
    dtName: "excretion", val: excretion_val, label: "排泄", placeholder: "例：大○回、小○回", width: '10rem',
  }
  const spo2 = {
    dtName: "spo2", val: spo2_val, label: "血中酸素濃度", placeholder: "例：96", adronment: "%", width: '8rem',
    varidate: "(^[1-9１-９][0-9０-９]{0,1}\\.[0-9０-９]+$)|(^[1-9１-９][0-9０-９]{0,2}$)", errMsg: "数字または小数点のみ"
  }
  const meal = {
    dtName: "meal", val: meal_val, label: "食事", placeholder: "例：全量・9割など", width: '10rem',
  }
  const medication = {
    dtName: "medication", val: medication_val, label: "服薬", placeholder: "例：リスパダール服用済", width: '15rem',
  }
  const sleeptime = {
    dtName: "sleep", kind: "sleeptime", val: sleeptime_val, label: "睡眠時間", placeholder: "例：8.5", width: '8rem', adronment: "時間",
    varidate: "(^[1-9１-９][0-9０-９]{0,1}\\.[0-9０-９]+$)|(^[1-9１-９][0-9０-９]{0,2}$)", errMsg: "数字または小数点のみ"
  }
  const bedtime = {
    dtName: "sleep", kind: "bedtime", val: bedtime_val, label: "就寝時間", placeholder: "例：22:00", width: '8rem',
    varidate: "^[1-2１-２]{0,1}[0-9０-９]:[0-5０-５][0-9０-９]$", errMsg: ":で分けた数字のみ"
  }
  const wakeuptime = {
    dtName: "sleep", kind: "wakeuptime", val: wakeuptime_val, label: "起床時間", placeholder: "例：7:00", width: '8rem',
    varidate: "^[1-2１-２]{0,1}[0-9０-９]:[0-5０-５][0-9０-９]$", errMsg: ":で分けた数字のみ"
  }
  const commonProps = {vitalDt, setVitalDt, disabled, disabledDt, setDisabledDt};

  return(
    <div className={classes.vitalForm}>
      {vital_info.temperature &&<div>
        <VitalFormTextField {...{...temperature, ...commonProps}}/>
      </div>}
      {vital_info.bloods &&<div>
        <VitalFormTextField {...{...maxBloodPressure, ...commonProps}}/>
        <VitalFormTextField {...{...minBloodPressure, ...commonProps}}/>
        <VitalFormTextField {...{...bloodPulse, ...commonProps}}/>
      </div>}
      {vital_info.spo2 &&<div>
        <VitalFormTextField {...{...spo2, ...commonProps}}/>
      </div>}
      {vital_info.meal &&<div>
        <VitalFormTextField {...{...meal, ...commonProps}}/>
      </div>}
      {vital_info.excretion &&<div>
        <VitalFormTextField {...{...excretion, ...commonProps}}/>
      </div>}
      {vital_info.medication &&<div>
        <VitalFormTextField {...{...medication, ...commonProps}}/>
      </div>}
      {vital_info.sleep==="時間" &&<div>
        <VitalFormTextField {...{...sleeptime, ...commonProps}}/>
      </div>}
      {vital_info.sleep==="就寝・起床" &&<div>
        <VitalFormTextField {...{...bedtime, ...commonProps}}/>
        <VitalFormTextField {...{...wakeuptime, ...commonProps}}/>
      </div>}
    </div>
  )
}

const MessageFormTitle = (props) => {
  const classes = useStyles();
  const {title, timestamp, option} = props;
  const sendedJudgProps = {timestamp, option}
  const sendedJudgStyle = {position: 'absolute', bottom: 4, right: 0,}
  return(
    <div className={classes.messageFormTitle} style={{position: 'relative'}}>
      {title}
      <SendedJudg {...sendedJudgProps} style={sendedJudgStyle}/>
    </div>
  )
}

// 事前送信メッセージフォーム
const PreMessageForm = () => {
  const classes = useStyles();
  const history = useHistory();
  const {uid, calenderDate} = useParams();
  const uidStr = "UID" + uid;
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const [viewYear, viewMonth] = stdDate.split("-");
  const dDate = `D${viewYear}${viewMonth}${calenderDate.padStart(2, '0')}`;
  const account = useSelector(state => state.account);
  const {setSnack} = useContext(SnackContext);
  const {contacts} = useContext(ContactsContext);
  const preContents = checkValueType(contacts?.[uidStr]?.[dDate]?.[0], 'Object') ?contacts[uidStr][dDate][0] :{};
  const [text, setText] = useSessionStorageState(brtoLf(preContents?.content ?? ""), `cntbkPreMessageText${uid}${dDate}`);
  useEffect(() => {
    if(!text && preContents?.content){
      setText(brtoLf(preContents?.content));
    }
  }, []);
  const {dailyReportDt, dailyReportNotice, dailyReportEdited} = useContext(DailyReportContext);

  const [error, setError] = useState(false);
  const [helperText, setHelperText] = useState("");

  // フォーム全体の入力制御
  const disabled = useMemo(() => {
    // 開発者権限の場合はいつでも入力可能（デバッグ用）
    if(parsePermission(account)[0][0] >= 95) return false;
    // 当日の15時まで事前メッセージを書き込める
    const timeLimiTime = new Date(parseInt(viewYear), parseInt(viewMonth)-1, parseInt(calenderDate)-1, 15).getTime();
    const nowTime = new Date().getTime();
    return nowTime > timeLimiTime
  }, []);

  const handleSubmit = async() => {
    if(text.length > INPUT_LIMIT){
      setError(true);
      setHelperText(INPUT_LIMIT_HELPERTEXT);
      return;
    }

    if(dailyReportEdited) sendUserDailyReportNotice(dailyReportDt, dailyReportNotice, uid, dDate, hid, bid, stdDate, setSnack);

    if(!contacts?.[uidStr]?.ctoken){
      // ctokenがない時に送信処理が必要
      const ctoken = randomStr(16);
      await sendDtUnderUidOfContact(hid, bid, stdDate, uidStr, {ctoken}, setSnack);
    }

    const processedText = deleteEscapeCharacter(lfToBr(text));
    if(!processedText){
      // 入力されたメッセージがない場合は送信しない。
      setSnack({...{
        msg: 'メッセージを入力してください。', severity: 'warning', id: new Date().getTime()
      }});
      return;
    }
    const newPreContents = JSON.parse(JSON.stringify(preContents));
    // 事前送信メッセージ格納
    newPreContents.content = processedText;
    // 書き込みタイムスタンプ格納
    newPreContents.timestampSaved = new Date().getTime();
    // メールLINE送信フラグ初期化
    newPreContents.sent = false;
    const res = await sendOneMessageOfContact(hid, bid, stdDate, uidStr, dDate, 0, newPreContents, setSnack);
    if(res){
      setSnack({...{msg: '書き込みました。', id: new Date().getTime()}});
      history.push(CNTBK_MAIN_HISTORY_PATH);
      setError(false);
      setHelperText("");
    }else{
      setSnack({...{msg: '書き込みに失敗しました。もう一度お試しください。', severity: 'warning'}});
    }
  }

  const timestampSaved = preContents?.timestampSaved;
  const timestampSent = preContents?.timestampSent;
  const timestampError = preContents?.timestampError;
  const timestamp = getLatestTimestamp(timestampSaved, timestampSent, timestampError);
  const option = getLatestTimestampValue([timestampSaved, "saved"], [timestampSent, "sent"], [timestampError, "error"]);

  const messageFormTitleProps = {title: "事前メッセージ", timestamp, option}
  const contentTextFeildProps = {contentText: text, setContentText: setText, error, helperText};
  const sendButtonProps = {handleClick: handleSubmit};
  return(
    <>
    <div className={`${classes.preMessageField} ${classes.messageField}`}>
      <MessageFormTitle {...messageFormTitleProps} />
      {!disabled &&(
        <div>
          <ContentTextField {...contentTextFeildProps}/>
          <div className='buttons'>
            <CntbkCancelButton historyPath={"/contactbook"} />
            <CntbkSendButton {...sendButtonProps}/>
          </div>
        </div>
      )}
      {(disabled && text) &&<div className='message'>{brtoLf(text)}</div>}
      {(disabled && !text) &&<div className='noneMessage'>メッセージはありません。</div>}
    </div>
    </>
  )
}

// ご家族からのメッセージ
const FamilyMessage = () => {
  const classes = useStyles();
  const {uid, calenderDate} = useParams();
  const uidStr = "UID" + uid;
  const stdDate = useSelector(state => state.stdDate);
  const [viewYear, viewMonth] = stdDate.split("-");
  const dDate = `D${viewYear}${viewMonth}${calenderDate.padStart(2, '0')}`;
  const {contacts} = useContext(ContactsContext);
  const familyContents = contacts?.[uidStr]?.[dDate]?.[1] ?? {};
  const content = familyContents?.content ?? "";
  const timestamp = familyContents?.timestampSent;
  const vital = familyContents?.vital;

  const messageFormTitleProps = {title: "ご家族からのメッセージ", timestamp, option: 'familyMsg'};
  return(
    <div className={`${classes.familyMessageField} ${classes.messageField}`}>
      <MessageFormTitle {...messageFormTitleProps} />
      <div>
        {content &&<div className='message'>{brtoLf(content)}</div>}
        {!content &&<div className='noneMessage'>メッセージはありません。</div>}
        <VitalInfo vitalDt={vital}/>
      </div>
    </div>
  )
}

const SavedImgs = (props) => {
  const classes = useStyles();
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const {contacts, setContacts} = useContext(ContactsContext);
  const {uid, dDate, setSnack, disabled} = props;
  const uidStr = "UID" + uid;
  const postContents = contacts?.[uidStr]?.[dDate]?.[2] ?? {};
  const [thumbnails, setThumbnails] = useState([]);
  
  useEffect(() => {
    const prevThumbnails = postContents?.thumbnails ?? [];
    setThumbnails([...prevThumbnails]);
  }, [contacts]);

  const deleteImg = async(imgIndex) => {
    const imgUrl = JSON.parse(JSON.stringify(thumbnails))[imgIndex]
    const imgUrlParts = imgUrl.split("/");
    const imgFileName = imgUrlParts.pop();
    const noneFileNameUrl = imgUrlParts.join("/");
    let photoUrl = null, thumbnailUrl = null;
    if(/^tn_/.test(imgFileName)){
      photoUrl = `${noneFileNameUrl}/${imgFileName.replace("tn_", "")}`;
      thumbnailUrl = `${noneFileNameUrl}/${imgFileName}`;
    }else{
      photoUrl = `${noneFileNameUrl}/${imgFileName}`;
      thumbnailUrl = `${noneFileNameUrl}/tn_${imgFileName}`;
    }

    const newContacts = JSON.parse(JSON.stringify(contacts));
    if(!newContacts[uidStr]) newContacts[uidStr] = {};
    if(!newContacts[uidStr][dDate]) newContacts[uidStr][dDate] = CNTBK_INIT_CONTENTS;
    const newPostContents = newContacts[uidStr][dDate][2];
    const photos = newPostContents.photos;
    photos.splice(photos.indexOf(photoUrl), 1);
    const cThumbnails = newPostContents.thumbnails;
    cThumbnails.splice(cThumbnails.indexOf(thumbnailUrl), 1);
    const res = await sendOneMessageOfContact(hid, bid, stdDate, uidStr, dDate, 2, newPostContents, setSnack);
    if(res){
      setSnack({...{msg: '画像を削除しました。', id: new Date().getTime()}});
      setContacts({...newContacts});

      // サーバー上の画像を削除
      const isElseUserUsedImgUrl = Object.keys(contacts).some(uidStr => {
        if(uidStr === "UID"+uid) return false;
        const imgUrls = contacts[uidStr]?.[dDate]?.[2]?.photos ?? [];
        return imgUrls.includes(photoUrl);
      });
      if(!isElseUserUsedImgUrl){
        const path = photoUrl.replace("https://houday.rbatos.com/contactbookimg/", "");
        axios.post(`https://houday.rbatos.com/api/removeimg.php?path=${path}`);
      }
      const isElseUserUsedThumbnailUrl = Object.keys(contacts).some(uidStr => {
        if(uidStr === "UID"+uid) return false;
        const thumbnailUrls = contacts[uidStr]?.[dDate]?.[2]?.thumbnails ?? [];
        return thumbnailUrls.includes(thumbnailUrl);
      });
      if(!isElseUserUsedThumbnailUrl){
        const tnPath = thumbnailUrl.replace("https://houday.rbatos.com/contactbookimg/", "");
        axios.post(`https://houday.rbatos.com/api/removeimg.php?path=${tnPath}`);
      }
    }else{
      setSnack({...{msg: '画像の削除に失敗しました。', severity: 'warning'}});
    }
  }

  const imgNodes = thumbnails.map((imgUrl, imgIndex) => {
    const imgWithDeleteFuncProps = {imgUrl, imgIndex, deleteImg, option: '保存済み', disabled};
    return(
      <ImgWithDeleteFunc key={`savedImg${imgIndex}`} {...imgWithDeleteFuncProps} />
    )
  });
  return(
    <div className={classes.imgField}>
      {imgNodes}
    </div>
  )
}

const DailyReportPasteButton = (props) => {
  const classes = useStyles();
  const {setSnack} = useContext(SnackContext);
  const {text, setText, dailyReportDt, uidStr, dDate} = props;
  const drData = dailyReportDt?.[uidStr]?.[dDate] ?? {};
  
  const handleClick = () => {
    const contextList = text ?brtoLf(text).split("\n") : [];
    const drContextList = drData?.notice ?brtoLf(drData.notice).split("\n") : [];

    const matchCount = drContextList.filter(line => contextList.includes(line)).length;
    if (matchCount >= (drContextList.length > 3 ?3 :drContextList.length)){
      setSnack({...{msg: '同じ内容が検出されたため中断しました。', severity: 'warning', id: new Date().getTime()}});
      return;
    }

    setText(prevText => prevText ?`${prevText}\n\n${drData.notice}` :drData.notice);
  }

  return(
    <div className={classes.dailyReportPasteButton}>
      <Button
        className="button"
        variant="contained"
        onClick={handleClick}
      >
        日報からコピー
      </Button>
    </div>
  )
}

// ご様子メッセージ
const PostMessageForm = () => {
  const classes = useStyles();
  const history = useHistory();
  const {uid, calenderDate} = useParams();
  const uidStr = "UID" + uid;
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const [viewYear, viewMonth] = stdDate.split("-");
  const dDate = `D${viewYear}${viewMonth}${calenderDate.padStart(2, '0')}`;
  const account = useSelector(state => state.account);
  const com = useSelector(state => state.com);
  const {setSnack} = useContext(SnackContext);
  const {contacts} = useContext(ContactsContext);
  const {dailyReportDt, dailyReportDtNextMonth, dailyReportNotice, dailyReportEdited} = useContext(DailyReportContext);
  const postContents = contacts?.[uidStr]?.[dDate]?.[2] ?? {};
  // メッセージ
  const [text, setText] = useSessionStorageState(brtoLf(postContents?.content ?? ""), `cntbkPostMessageText${uid}${dDate}`, );
  useEffect(() => {
    if(!text && postContents?.content){
      setText(brtoLf(postContents?.content));
      return;
    }
    let isMounted = true;
    const inputNextSchedule = com?.etc?.settingContactBook?.postMessage?.inputNextSchedule ?? false;
    if(!inputNextSchedule) return;
    if(text.includes("次回ご利用日：")) return;
    getNextSchedule(parseInt(uid), dDate, hid, bid, true).then(next => {
      if(isMounted) {
        setText((prevText) => {
          let newText = prevText + "\n\n";
          const nextDid = next.did;
          if(nextDid){
            const day = new Date(parseInt(nextDid.slice(1, 5)), parseInt(nextDid.slice(5, 7))-1, parseInt(nextDid.slice(7, 9))).getDay();
            const schDt = next.schDt;
            newText += `次回ご利用日：${nextDid.slice(5, 7)}月${nextDid.slice(7, 9)}日(${DAY_LIST[day]})${dailyReportDt?.[uidStr]?.[nextDid]?.pickup || dailyReportDtNextMonth?.[uidStr]?.[nextDid]?.pickup || schDt.start}`;
          }else{
            newText += "次回ご利用日：未定"
          }
          return newText;
        });
      }
    });
    return () => {
      isMounted = false;
    }
  }, []);
  // 追加画像
  const [addImgs, setAddImgs] = useState([]);
  // バイタルデータ
  const [vitalDt, setVitalDt] = useState(postContents?.vital ?? {});
  // 下書き
  const [draft, setDraft] = useState(postContents?.draft ?? true);
  // バイタルエラー状態
  const [disabledDt, setDisabledDt] = useState({});
  // 再送信確認ダイヤログを開く
  const [dialogOpen, setDialogOpen] = useState(false);
  // フォームの入力制限
  const disabled = useMemo(() => getPostMessageDisabled(dDate, account), []);

  const [error, setError] = useState(false);
  const [helperText, setHelperText] = useState("");

  const saveAndSendMessage = async() => {
    if(dailyReportEdited) sendUserDailyReportNotice(dailyReportDt, dailyReportNotice, uid, dDate, hid, bid, stdDate, setSnack);
    if(Object.keys(disabledDt).some(key => disabledDt[key])){
      setSnack({...{msg: '入力内容に誤りがあります。', severity: 'warning', id: new Date().getTime()}});
      return;
    }
    const processedText = deleteEscapeCharacter(lfToBr(text));
    if(!processedText && !draft){
      // 入力されたメッセージがない場合は送信しない。
      setSnack({...{
        msg: 'メッセージを入力してください。', severity: 'warning', id: new Date().getTime()
      }});
      return;
    }
    const newPostContents = JSON.parse(JSON.stringify(postContents));
    newPostContents.sent = false;
    newPostContents.content = lfToBr(processedText);
    newPostContents.timestampSaved = new Date().getTime();
    newPostContents.draft = draft;
    // バイタル関係
    const newVitalDt = Object.entries(vitalDt).reduce((prevVitalDt, [key, value]) => {
      if(value && value!=='-') prevVitalDt[key] = value;
      return prevVitalDt;
    }, {});
    newPostContents.vital = newVitalDt;
    // 画像関係
    if(!newPostContents.photos) newPostContents.photos = [];
    const photos = newPostContents.photos;
    if(!newPostContents.thumbnails) newPostContents.thumbnails = [];
    const thumbnails = newPostContents.thumbnails;
    const uidZp = String(uid).padStart(6, '0');
    const today = formatDate(new Date(), 'YYYYMMDD');
    const rnddir = com.jino + '_' + randomStr(8);
    const rndfname = uidZp + '_' + randomStr(8);
    let i = 0;
    for(const img of addImgs){
      i++;
      const prms = new FormData();
      const fname = img.name;
      const ext = fname.split('.').slice(-1)[0]; // 拡張子を取得
      prms.append('file', img, rndfname + '_' + i + '.' + ext);
      prms.append('rnddir', rnddir);
      prms.append('today', today);
      const url = 'https://houday.rbatos.com/api/uploadimgResize.php';
      const headers = {'content-type': 'multipart/form-data',}
      const res = await axios.post(url, prms, headers);
      if(!res.data.result){
        setSnack({...{msg: '送信に失敗しました。', severity: 'warning'}});
        return;
      }
      const path = res.data.filename.replace("..", "");
      photos.push("https://houday.rbatos.com"+path);
      const tnPath = res.data.thumbnail.replace("..", "");
      thumbnails.push("https://houday.rbatos.com"+tnPath);
    }

    if(!contacts?.[uidStr]?.ctoken){
      // ctokenがない時は追加
      const ctoken = randomStr(16);
      await sendDtUnderUidOfContact(hid, bid, stdDate, uidStr, {ctoken}, setSnack);
    }
    
    // 送信処理
    const res = await sendOneMessageOfContact(hid, bid, stdDate, uidStr, dDate, 2, newPostContents, setSnack);
    if(res){
      setSnack({...{msg: '書き込み完了しました。', id: new Date().getTime()}});
      sessionStorage.setItem("cntbkUserEditPageBack", "1");
      await unlockContactDt(hid, bid, stdDate, uidStr);
      history.push("/contactbook/");
    }else{
      setSnack({...{msg: '書き込みに失敗しました。もう一度お試しください。', severity: 'warning'}});
    }
  }

  const clickSendButton = async() => {
    if(text.length > INPUT_LIMIT){
      setError(true);
      setHelperText(INPUT_LIMIT_HELPERTEXT);
      return;
    }
    setError(false);
    setHelperText("");
    const latestContacts = await fetchContacts(hid, bid, stdDate, uidStr, dDate, setSnack);
    const latestPostContents = latestContacts?.[uidStr]?.[dDate]?.[2] ?? {};
    if(latestPostContents?.sent ?? false){
      // 前回のメッセージが送信済みの場合は、警告ダイアログ表示
      setDialogOpen(true);
    }else{
      // そのまま送信処理
      saveAndSendMessage();
    }
  }

  const handleDraftDelete = async() => {
    const newPostContents = {content: ""};

    // 送信処理
    const res = await sendOneMessageOfContact(hid, bid, stdDate, uidStr, dDate, 2, newPostContents, setSnack);
    if(res){
      setSnack({...{msg: '書き込み完了しました。', id: new Date().getTime()}});
      sessionStorage.setItem("cntbkUserEditPageBack", "1");
      history.push("/contactbook/");
    }else{
      setSnack({...{msg: '書き込みに失敗しました。もう一度お試しください。', severity: 'warning'}});
    }
  }

  const timestampSaved = postContents?.timestampSaved;
  const timestampSent = postContents?.timestampSent;
  const timestampError = postContents?.timestampError;
  const timestamp = getLatestTimestamp(timestampSaved, timestampSent, timestampError);
  const option = getLatestTimestampValue([timestampSaved, "saved"], [timestampSent, "sent"], [timestampError, "error"]);

  const messageFormTitleProps = {title: "ご様子メッセージ", timestamp, option: postContents?.draft ?"draft" :option};
  const contentTextFeildProps = {contentText: text, setContentText: setText, error, helperText};
  const savedImgsProps = {uid, dDate, setSnack, disabled};
  const imgProps = {addImgs, setAddImgs};
  const vitalProps = {vitalDt, setVitalDt, com, disabled, disabledDt, setDisabledDt};
  const initImgsNum = postContents?.photos ?postContents.photos.length :0;
  const imgNumLimit = com?.etc?.settingContactBook?.numOfPhotos ?? 3;
  const buttonsProps = {
    draft, setDraft,
    historyPath: "/contactbook/",
    addImgs, setAddImgs, setSnack, initImgsNum, imgNumLimit,
    handleSend: clickSendButton, handleDraftDelete,
    contents: postContents
  }
  return(
    <>
    <div className={classes.messageField}>
      <MessageFormTitle {...messageFormTitleProps} />
      <div>
        {!disabled &&<>
          <ContentTextField {...contentTextFeildProps}/>
          <SavedImgs {...savedImgsProps}/>
          <AddedImgs {...imgProps}/>
          <VitalForm {...vitalProps} />
          <DailyReportPasteButton text={text} setText={setText} dailyReportDt={dailyReportDt} uidStr={uidStr} dDate={dDate} setSnack={setSnack} />
          <CntbkPostMessageButtons {...buttonsProps} />
        </>}
        {disabled &&<>
          {text
            ?<div className='message'>{text}</div>
            :<div className='noneMessage'>メッセージはありません。</div>
          }
          <SavedImgs {...savedImgsProps}/>
          <VitalInfo vitalDt={vitalDt} />
        </>}
      </div>
    </div>
    <YesNoDialog
      open={dialogOpen} setOpen={setDialogOpen}
      handleConfirm={saveAndSendMessage}
      prms={{
        title: "ご様子メッセージ確認",
        message: (
          "前回のメッセージは既にご家族様へ送信されています。\n"
          + "新しくメッセージを送信して大丈夫ですか？"
        )
      }}
    />
    </>
  )
}

const DailyReportUserNotice = () => {
  const classes = useStyles();
  const {uid, calenderDate} = useParams();
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const com = useSelector(state => state.com);
  const [viewPageYear, viewPageMonth] = stdDate.split("-");
  const dDate = `D${viewPageYear}${viewPageMonth}${calenderDate.padStart(2, '0')}`;
  const {setSnack} = useContext(SnackContext);
  const {dailyReportDt, dailyReportNotice, setDailyReportNotice, setDailyReportEdited} = useContext(DailyReportContext);
  const [openForm, setOpenForm] = useState(false);

  const handleClick = async() => {
    const sendResult = await sendUserDailyReportNotice(dailyReportDt, dailyReportNotice, uid, dDate, hid, bid, stdDate, setSnack);
    if(sendResult){
      setOpenForm(false);
    }
  }

  const handleFocus = (e) => {
    const val = e.target.value;
    if(val) return;
    let initValue = brtoLf(com?.ext?.dailyReportTemplate?.userNotice ?? "");
    setDailyReportNotice(initValue);
  }

  const messageFormTitleProps = {title: "日報記録"};
  return(
    <div
      onClick={() => setOpenForm(true)}
      className={classes.messageField}
      style={{cursor: openForm ?'auto' :'pointer'}}
    >
      <div style={{position: 'relative'}}>
        <MessageFormTitle {...messageFormTitleProps} />
        {!openForm &&<div className='editIcon'>
          <EditIcon style={{fontSize: 18, color: teal[800]}}/>
        </div>}
      </div>
      <div>
        {openForm &&<>
          <ContentTextField
            contentText={dailyReportNotice} setContentText={setDailyReportNotice} setEdited={setDailyReportEdited}
            onFocus={handleFocus}
          />
          <div style={{textAlign: 'end', marginTop: 8}}>
            <CntbkCancelButton historyPath={"/contactbook"} />
            <CntbkSendButton label="書き込み" handleClick={handleClick} style={{marginLeft: 12}} />
          </div>
        </>}
        {!openForm &&<div className='message'>{dailyReportNotice ?dailyReportNotice :"記録なし"}</div>}
      </div>
    </div>
  )
}

const ContbkUserEditMain = ({editingId}) => {
  const users = useSelector(state => state.users);
  const schedule = useSelector(state => state.schedule);
  const stdDate = useSelector(state => state.stdDate);
  const classes = useStyles();
  const {uid, calenderDate} = useParams();
  
  const user = users.find(userDt => userDt.uid === uid);
  const [viewPageYear, viewPageMonth] = stdDate.split("-");
  const dDate = `D${viewPageYear}${viewPageMonth}${calenderDate.padStart(2, '0')}`;

  const [editingCnt, setEditingCnt] = useState(0);
  useEditingCntOnSnapshot(uid, editingId, setEditingCnt);

  return(
    <div className={classes.cntbkEdit}>
      <div className='title'>メッセージ編集画面</div>
      <UserInfo user={user} dDate={dDate} schedule={schedule}/>
      {editingCnt>0 &&<div style={{textAlign: 'center', color: red['A700'], marginTop: -8, marginBottom: 8}}>他{editingCnt}名が編集中</div>}
      <PreMessageForm />
      <FamilyMessage />
      <PostMessageForm />
      <DailyReportUserNotice />
    </div>
  )
}

const ContbkUserEdit = () => {
  const history = useHistory();
  const {uid, calenderDate} = useParams();
  const limit1079px = useMediaQuery("(max-width:1079px)");
  const allState = useSelector(state => state);
  const classes = useStyles();
  const {hid, bid, stdDate, users, schedule, com} = allState;
  const [viewPageYear, viewPageMonth] = stdDate.split("-");
  const user = users.find(uDt => uDt.uid === uid);
  const uidStr = "UID" + user?.uid;
  const loadingStatus = getLodingStatus(allState);
  const [snack, setSnack] = useState({});
  const [contacts, setContacts] = useState(null);
  const [editingId, setEditingId] = useLocalStorageState(null, "cntbkEditingId");

  const headerHeight = useGetHeaderHeight();

  // スクロール位置をトップにする
  useEffect(() => {
    window.scroll({top: 0});
  }, []);

  useEffect(() => {
    if(!loadingStatus.loaded || !editingId || !uid) return;
    
    // データベースに編集者IDとタイムスタンプをセット・更新する
    const updateTimestamp = async () => {
      try {
        // ローカルストレージにロック無効化フラグがある場合は無視
        if(safeJsonParse(localStorage.getItem("DisableCntbkAndDailyReportLock"), false)) return;
        const app = initializeApp(FIREBASE_CONFIG);
        const db = getFirestore(app, "cntbk-editing");
        const editingIdsCollection = collection(db, hid+bid, String(uid), "editingIds");
        const docRef = doc(editingIdsCollection, editingId);
        const expireAt = Timestamp.fromDate(new Date(new Date().getTime() + 6 * 60 * 1000));
        const expireTimestamp = new Date().getTime() + 6 * 60 * 1000;
        await setDoc(docRef, {timestamp: new Date().getTime(), expireAt, expireTimestamp}, {merge: true});
      } catch (error) {
        console.error('Error updating timestamp:', error);
      }
    };
    
    updateTimestamp(); // 初回実行
    
    // 5分間隔で実行するタイマーを設定
    const timer = setInterval(updateTimestamp, 5 * 60 * 1000); // 5分 = 300,000ミリ秒
    
    // クリーンアップ関数
    return () => {
      if (timer) clearInterval(timer);
      setTimeout(async () => {
        const closed = !document.querySelector('#cntbkEditing');
        if (closed && editingId) {
          try {
            const app = initializeApp(FIREBASE_CONFIG);
            const db = getFirestore(app, "cntbk-editing");
            const editingIdsCollection = collection(db, hid+bid, String(uid), "editingIds");
            const docRef = doc(editingIdsCollection, editingId);
            await deleteDoc(docRef);
          } catch (error) {
            console.error('Error deleting editing document:', error);
          }
        }
      }, 300);
    };
  }, [loadingStatus.loaded, editingId, uid]);

  useEffect(() => {
    // ロカールストレージにeditingIdがなければ作成
    if(!editingId){
      const newEditingId = randomStr(16) + String(new Date().getTime());
      setEditingId(newEditingId);
    }
  }, []);

  useEffect(() => {
    if(!loadingStatus.loaded) return;
    let isMounted = true;
    (async() => {
      if(!(uid && calenderDate)){
        // uid calendarDateがなければメイン画面に戻す
        history.push(CNTBK_MAIN_HISTORY_PATH);
        return
      }
      if(!user){
        // 利用者データがなければメイン画面に戻す
        history.push(CNTBK_MAIN_HISTORY_PATH);
        return
      }
      const faptoken = user?.faptoken;
      if(!faptoken) {
        // faptokenがなければメイン画面に戻す
        history.push(CNTBK_MAIN_HISTORY_PATH);
        return
      }
      const [viewYear, viewMonth] = stdDate.split("-");
      const dDate = `D${viewYear}${viewMonth}${calenderDate.padStart(2, '0')}`;
      const hohouDid = `${dDate}H`;
      const schDt = schedule?.[uidStr]?.[dDate];
      const hohouSchDt = schedule?.[uidStr]?.[hohouDid];
      if(!schDt && !hohouSchDt){
        // 対象日に利用がなければメイン画面に戻す
        history.push(CNTBK_MAIN_HISTORY_PATH);
        return
      }
      if(!(checkCntbkMailUser(user) || checkCntbkLineUser(user, com))){
        // メールLINEユーザーでなければメイン画面に戻す
        history.push(CNTBK_MAIN_HISTORY_PATH);
        return
      }
      const locked = await checkContactDtLocked(hid, bid, stdDate, uidStr, setSnack);
      if(!locked){
        // ロックされている場合はメイン画面に戻す
        // 編集対象のためロックをかける
        await lockContactDt(hid, bid, stdDate, uidStr, setSnack);
      }
      // 現在の連絡帳データ取得
      const prevContacts = await fetchContacts(hid, bid, stdDate, uidStr, null, setSnack);
      if (isMounted && prevContacts) setContacts(prevContacts);

      // ご家族からのメッセージデータに通知IDがある場合は処理を行う
      const familyContents = prevContacts?.[uidStr]?.[dDate]?.[1] ?? {};
      if(familyContents.notificationId && familyContents.notificationChecked===false){
        updateNotificationChecked(hid, bid, familyContents.notificationId);
      }
    })();
    return () => {
      isMounted = false;
      unlockContactDt(hid, bid, stdDate, uidStr);
    };
  }, [loadingStatus.loaded]);

  // 日報関係
  const [dailyReportDt] = useFetchAlbDt({"a": "fetchDailyReport", hid, bid, date: stdDate}, ["dailyreport"], false, {}, setSnack);
  const nextMonthStdDate = formatDate(new Date(parseInt(viewPageYear), parseInt(viewPageMonth), 1), 'YYYY-MM-DD');
  const [dailyReportDtNextMonth] = useFetchAlbDt({"a": "fetchDailyReport", hid, bid, date: nextMonthStdDate}, ["dailyreport"], false, {}, setSnack);
  const [dailyReportNotice, setDailyReportNotice] = useState("");
  const [dailyReportEdited, setDailyReportEdited] = useState(false);
  useEffect(() => {
    const dDate = `D${viewPageYear}${viewPageMonth}${calenderDate.padStart(2, '0')}`;
    const originText = dailyReportDt?.["UID"+uid]?.[dDate]?.notice ?? "";
    setDailyReportNotice(brtoLf(originText));
  }, [dailyReportDt]);

  if(!loadingStatus.loaded || !contacts || !dailyReportDt || !dailyReportDtNextMonth) return(
    <>
    <CntbkLinksTab />
    <LoadingSpinner />
    <SnackMsg {...snack} />
    </>
  )

  return(
    <>
    <CntbkLinksTab />
    {!limit1079px &&<GoBackButton posX={90} posY={0} />}
    <div className={classes.AppPage} style={headerHeight ?{marginTop: headerHeight+32} :{}}>
      {limit1079px &&<BackHistoryButton />}
      <SnackContext.Provider value={{setSnack}}>
      <ContactsContext.Provider value={{contacts, setContacts}}>
      <DailyReportContext.Provider value={{dailyReportDt, dailyReportDtNextMonth, dailyReportNotice, setDailyReportNotice, dailyReportEdited, setDailyReportEdited}}>
        <ContbkUserEditMain editingId={editingId} />
      </DailyReportContext.Provider>
      </ContactsContext.Provider>
      </SnackContext.Provider>
    </div>
    <div id="cntbkEditing" />
    <SnackMsg {...snack} />
    </>
  )
}
export default ContbkUserEdit