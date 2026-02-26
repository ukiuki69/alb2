import { makeStyles, useMediaQuery } from '@material-ui/core';
import { blue, brown, green, grey, orange, red, teal } from '@material-ui/core/colors';
import axios from 'axios';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSelector, } from 'react-redux';
import { HOHOU } from '../../modules/contants';
import { getFilteredUsers, univApiCall } from '../../albCommonModule';
import { brtoLf, getLodingStatus, lfToBr, randomStr } from '../../commonModule';
import { LoadErr, LoadingSpinner } from '../common/commonParts';
import SnackMsg from '../common/SnackMsg';
import EditIcon from '@material-ui/icons/Edit';
import LockIcon from '@material-ui/icons/Lock';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { useHistory, useLocation } from 'react-router-dom';
import { AlbHMuiTextField, Calendar, checkLineUser, useFetchAlbDt } from '../common/HashimotoComponents';
import { DAY_LIST } from '../../hashimotoCommonModules';
import { AddedImgs, checkCntbkLineUser, checkCntbkMailUser, checkCntbkUser, checkContactDtLocked, CNTBK_CALENDAR_DATE_STORAGE_KEY, CNTBK_EDIT_HISTORY_PATH, CNTBK_INIT_CONTENTS, CntbkLinksTab, CntbkPostMessageButtons, fetchContacts, getLatestTimestamp, getLatestTimestampValue, getPostMessageDisabled, ImgWithDeleteFunc, INPUT_LIMIT, INPUT_LIMIT_HELPERTEXT, lockContactDt, SavedMiniImgs, SendedJudg, sendImgs, sendOneMessageOfContact, VitalInfo } from './CntbkCommon';
import { YesNoDialog } from '../common/GenericDialog';
import { deleteEscapeCharacter } from '../../modules/deleteEscapeCharacter';
import { checkValueType } from '../dailyReport/DailyReportCommon';
import { useSyncVitalDailyReportAndCntbk } from '../dailyReport/useSyncVitalDailyReportAndCntbk';
import { useGetHeaderHeight } from '../common/Header';
import WarningIcon from '@material-ui/icons/Warning';

const SIDEBAR_WIDTH = 61.25;

// スナックメッセージステート用コンテキスト
const SnackContext = createContext(null);

const useStyles = makeStyles({
  AppPage: {
    width: '95vw',
    margin: `${82+32}px auto`,
    "@media (min-width: 1080px)": {
      position: 'relative',
      maxWidth: 1080 + SIDEBAR_WIDTH,
      paddingLeft: SIDEBAR_WIDTH,
    },
    "@media (min-width: 501px) and (max-width: 1079px)": {
      position: 'relative',
    },
    "@media (max-width: 500px)": {

    },
  },
  broadcastMessage: {
    '& .confirmMessage': {
      fontSize: 14, color: red[500],
      marginTop: 8,
    },
    '& .buttons': {
      textAlign: 'end',
      marginTop: 8,
      '& .sendButton': {
        marginLeft: 12
      }
    },
    "@media (min-width:960px)": {
      width: 294,
      position: 'fixed', top: 394,
    },
    "@media (max-width:959px)": {
      marginTop: 64
    },
  },
  main: {
    '& .dateInfo': {
      marginBottom: 16,
      '& .monthdate': {fontSize: 20,},
      '& .day': {margin: '0 12px 0 2px'}
    },
    '& .noneFaptoken': {
      display: 'flex', alignItems: 'center',
      padding: '8px 12px', marginBottom: '32px',
      color: red['A700'],
      backgroundColor: red[50], border: `2px solid ${red['A700']}`,
      '& .icon': {fontSize: '20px', marginRight: '8px'}
    },
    '& .userInfo': {
      borderBottom: `1px solid ${teal[800]}`,
      paddingBottom: 4,
      '& .name': { fontSize: 28,},
      '& .honorificTitle': {fontSize: 16, marginRight: 8},
      '& .absence': {fontWeight: 'bold', marginLeft: 8}
    },
    '& .usersNum': {
      fontSize: 14,
      '&:not(:last-child)': {
        marginRight: 12
      },
      '&.hasIcon': {
        marginRight: 4
      },
      '& .count': {
        fontSize: 20, marginLeft: 2,
      },
      '&.sent': { color: green[600] },
      '&.waiting': { color: orange[700] },
      '&.draft': { color: grey[600] },
      '&.unfilled': { color: red[600] },
      '&.error': { color: red[600] },
    },
    "@media (min-width:960px)": {
      paddingLeft: 358,
    },
    "@media (max-width:959px)": {
      marginTop: 64
    },
  },
  templateForm: {
    marginBottom: 56
  },
  userContactField: {
    marginBottom: 56,
    position: 'relative',
    '& .lockEditIcon': {
      position: 'absolute', top: 4, right: 4,
      opacity: 1
    },
    '&:hover': {
      cursor: 'pointer',
      // '& .lockEditIcon': {
      //   opacity: 1
      // },
    },
  },
  messageField: {
    margin: '12px 0',
    '& .options': {
      height: "16px",
      display: 'flex', alignItems: 'flex-end',
    },
    '& .message, .noneMessage': { lineHeight: 1.5 },
    '& .noneMessage': { opacity: 0.4 }
  },
  preMessage: {
    
  },
  familyMessage: {
    color: teal[700],
    '& .noneMessage': {opacity: 0.6},
  },
  postMessage: {

  },
  dailyReportNotice: {
    color: brown[500],
  },
  imgField: {
    display: 'flex', flexWrap: 'wrap',
  },
});

const TemplateSavedImgs = (props) => {
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const classes = useStyles();
  const {setSnack} = useContext(SnackContext);
  const {dDate, templateMessages, setTemplateMessages, disabled} = props;

  const [thumbnails, setThumbnails] = useState([]);
  useEffect(() => {
    setThumbnails([...templateMessages?.[dDate]?.thumbnails ?? []]);
  }, [templateMessages, dDate]);

  const deleteImg = async(imgIndex) => {
    try{
      // 画像URL周り
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

      let delete_serverimg_res = null, delete_servertn_res = null;
      const imgUrls = templateMessages?.[dDate]?.photos ?? [];
      if(imgUrls.includes(photoUrl)){
        const path = photoUrl.replace("https://houday.rbatos.com/contactbookimg/", "");
        delete_serverimg_res = await axios.post(`https://houday.rbatos.com/api/removeimg.php?path=${path}`);
      }
      const thumbnailUrls = templateMessages?.[dDate]?.thumbnails ?? [];
      if(thumbnailUrls.includes(thumbnailUrl)){
        const tnPath = thumbnailUrl.replace("https://houday.rbatos.com/contactbookimg/", "");
        delete_servertn_res = await axios.post(`https://houday.rbatos.com/api/removeimg.php?path=${tnPath}`);
      }
      if(delete_serverimg_res && delete_servertn_res && !(delete_serverimg_res.data.result || delete_servertn_res.data.result)){
        setSnack({msg: '画像の削除に失敗しました。', severity: 'warning', errorId: "CNBT02"});
        return;
      }

      // データ書き込み処理
      const newTemplateMessages = JSON.parse(JSON.stringify({...templateMessages}));
      const templateDt = newTemplateMessages[dDate];
      const photos = templateDt.photos;
      photos.splice(photos.indexOf(photoUrl), 1);
      const cThumbnails = templateDt.thumbnails;
      cThumbnails.splice(cThumbnails.indexOf(thumbnailUrl), 1);
      // データ送信処理
      const params = {
        a: "sendPartOfContact",
        hid, bid, date: stdDate,
        partOfContact: JSON.stringify({templateMessages: newTemplateMessages})
      };
      const res = await univApiCall(params);
      if(res.data.result){
        setSnack({msg: '画像を削除しました。', id: new Date().getTime()});
        setTemplateMessages(newTemplateMessages);
      }else{
        setSnack({msg: '画像の削除に失敗しました。', severity: 'warning', errorId: "CNBT03"});
      }
    }catch(error){
      console.log("error", error);
      setSnack({msg: '画像の削除に失敗しました。', severity: 'warning', errorId: "CNBT04"});
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

const TemplateForm = (props) => {
  const classes = useStyles();
  const account = useSelector(state => state.account);
  const com = useSelector(state => state.com);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const schedule = useSelector(state => state.schedule);
  const service = useSelector(state => state.service);
  const {setSnack} = useContext(SnackContext);
  const {targetUsers, contactsDt, setContactsDt, dDate} = props;
  const hohouDid = `${dDate}H`;
  const [text, setText] = useState("");
  // 一時保存用フラグ
  const [temporarySave, setTemporarySaves] = useState(true);
  const [addImgs, setAddImgs] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const disabled = getPostMessageDisabled(dDate, account);
  const jino = com?.jino;
  const imgNumLimit = com?.etc?.settingContactBook?.numOfPhotos ?? 3;

  const [error, setError] = useState(false);
  const [helperText, setHelperText] = useState("");

  const [sendLoading, setSendLoading] = useState(false);

  // 雛形データ
  const [templateMessages, setTemplateMessages] = useState({});
  useEffect(() => {
    if(disabled) return;
    if(!hid || !bid || !stdDate || !dDate) return;
    let isMounted = true;
    // 連絡帳雛形データ取得
    fetchContacts(hid, bid, stdDate, "templateMessages", null, setSnack).then(dt => {
      if (isMounted) {
        const newTemplateMessages = dt?.templateMessages ?? {};
        setTemplateMessages(newTemplateMessages);
        const prevTemplateDt = newTemplateMessages?.[dDate] ?? {};
        setText(brtoLf(prevTemplateDt?.content ?? ""));
      }
    }).catch(error => {
      console.log("error", error);
      setSnack({msg: "雛形メッセージの取得に失敗しました。", severity: "error", errorId: "CNBT01"});
    })
    return () => {
      isMounted = false;
    };
  }, [hid, bid, stdDate, dDate]);
  const templateDt = templateMessages?.[dDate] ?? {};

  if(disabled) return null;

  const handleCancel = () => {
    setText(templateDt?.content ?? "");
    setAddImgs([]);
    setTemporarySaves(true);
  }

  // 雛形を一時保存
  const handleTemplateSave = async() => {
    if(text.length > INPUT_LIMIT){
      // 文字数制限エラー
      setError(true);
      setHelperText(INPUT_LIMIT_HELPERTEXT);
      return;
    }
    try{
      // 画像送信
      const sendedImgRes = await sendImgs(addImgs, jino, randomStr(8), setSnack);
      const newTemplateMessages = JSON.parse(JSON.stringify(templateMessages));
      if(!checkValueType(newTemplateMessages[dDate], 'Object')) newTemplateMessages[dDate] = {};
      const templateDt = newTemplateMessages[dDate];
      // 雛形メッセージ
      templateDt.content = lfToBr(deleteEscapeCharacter(text));
      // 画像
      const existingPhotos = templateDt.photos ?? [];
      const newPhotos = [...existingPhotos, ...sendedImgRes.photos];
      templateDt.photos = newPhotos;
      // サムネイル
      const existingThumbnails = templateDt.thumbnails ?? [];
      const newThumbnails = [...existingThumbnails, ...sendedImgRes.thumbnails];
      templateDt.thumbnails = newThumbnails;
      // 一時保存タイムスタンプ
      templateDt.timestampSaved = new Date().getTime();
      const params = {
        a: "sendPartOfContact", hid, bid, date: stdDate,
        partOfContact: JSON.stringify({templateMessages: newTemplateMessages})
      };
      const res = await univApiCall(params);
      if(res?.data?.result){
        setSnack({msg: '一時保存しました。', id: new Date().getTime()});
        setTemplateMessages(newTemplateMessages);
        setAddImgs([]);
        setError(false);
        setHelperText("");
      }else{
        setSnack({msg: '一時保存に失敗しました。', severity: 'warning', id: new Date().getTime()});
      }
    }catch(error){
      console.log("error", error);
      setSnack({msg: '予期せぬエラー', severity: 'error', errorId: "CNBT05"});
    }
  }

  // 利用者に雛形を適用
  const saveAndSendMessage = async() => {
    if(text.length > INPUT_LIMIT){
      setError(true);
      setHelperText(INPUT_LIMIT_HELPERTEXT);
      return;
    }

    const sendedImgRes = await sendImgs(addImgs, jino, randomStr(8), setSnack);
    const newContactsDt = JSON.parse(JSON.stringify(contactsDt));

    const requests = targetUsers.filter(prevUser => {
      const uidStr = "UID" + prevUser.uid;
      const schDt = schedule?.[uidStr]?.[dDate];
      const hohouSchDt = schedule?.[uidStr]?.[hohouDid];
      // 表示サービスに応じて対象とする予定データを場合分け
      if(service){
        // サービス選択時
        if(service===HOHOU){
          if(hohouSchDt?.absence) return false;
        }else{
          if(schDt?.absence) return false;
        }
      }else{
        // 全サービス選択時
        if(schDt?.absence && hohouSchDt?.absence) return false;
      }
      // ご様子メッセージ入力済みの利用者には適用しない。
      if(newContactsDt?.[uidStr]?.[dDate]?.[2]?.content) return false;
      return true;
    }).map(prevUser => {
      const uidStr = "UID" + prevUser.uid;
      if(!newContactsDt[uidStr]) newContactsDt[uidStr] = {};
      const contactDt = newContactsDt[uidStr];
      if(!contactDt[dDate]) contactDt[dDate] = JSON.parse(JSON.stringify(CNTBK_INIT_CONTENTS));
      const postContentDt = contactDt[dDate][2];
      postContentDt.content = lfToBr( deleteEscapeCharacter(text));
      const existingPhotos = postContentDt.photos ?? [];
      const existingTemplatePhotos = templateMessages?.[dDate]?.photos ?? [];
      const newPhotos = [...existingPhotos, ...sendedImgRes.photos, ...existingTemplatePhotos];
      postContentDt.photos = newPhotos;
      const existingThumbnails = postContentDt.thumbnails ?? [];
      const existingTemplateThumbnails = templateMessages?.[dDate]?.thumbnails ?? [];
      const newThumbnails = [...existingThumbnails, ...sendedImgRes.thumbnails, ...existingTemplateThumbnails];
      postContentDt.thumbnails = newThumbnails;
      postContentDt.draft = true;
      postContentDt.timestampSaved = new Date().getTime();
      const res = sendOneMessageOfContact(hid, bid, stdDate, uidStr, dDate, 2, postContentDt);
      return res;
    });

    Promise.all(requests).then(() => {
      // 一時保存用データに送信済みフラグ建て&送信
      const newTemplateMessages = JSON.parse(JSON.stringify(templateMessages));
      if(newTemplateMessages[dDate]){
        const newTemplateDt = newTemplateMessages[dDate];
        newTemplateDt.content = "";
        newTemplateDt.photos = [];
        newTemplateDt.thumbnails = [];
        newTemplateDt.sent = true;
        newTemplateDt.timestampSent = new Date().getTime();
      }
      const params = {
        a: "sendPartOfContact",
        hid, bid, date: stdDate,
        partOfContact: JSON.stringify({templateMessages: newTemplateMessages})
      };
      univApiCall(params).then(res => {
        if(!res?.data?.result){
          setSnack({msg: '送信に失敗しました。', severity: 'warning', id: new Date().getTime()});
        }
        setTemplateMessages(newTemplateMessages);
        setContactsDt(newContactsDt);
        setText("");
        setAddImgs([]);
        setError(false);
        setHelperText("");
        setSnack({...{msg: '送信完了しました。', id: new Date().getTime()}});
      }).catch(() => {
        setSnack({msg: '送信に失敗しました。', severity: 'warning', id: new Date().getTime()});
      });
    }).catch(() => {
      setSnack({msg: '送信に失敗しました。', severity: 'warning', id: new Date().getTime()});
    }).finally(() => {
      setSendLoading(false);
    });

    setSendLoading(true);
  }

  const handleSend = () => {
    if(!temporarySave){
      setDialogOpen(true);
    }else{
      saveAndSendMessage();
    }
  }

  const initImgsNum = targetUsers.reduce((result, userDt) => {
    const postContentDt = contactsDt?.["UID"+userDt.uid]?.[dDate]?.[2];
    if(postContentDt) return result;
    const thumbnails = postContentDt?.thumbnails ?? [];
    const photos = postContentDt?.photos ?? [];
    const thisMaxImgsNums = thumbnails.length <= photos.length ?photos.length :thumbnails.length;
    if(result < thisMaxImgsNums) result = thisMaxImgsNums;
    return result;
  }, 0);

  const buttonsProps = {
    temporarySave, setTemporarySaves,
    handleCancel,
    addImgs, setAddImgs, setSnack, initImgsNum, imgNumLimit,
    handleSend, handleTemplateSave,
    loading: sendLoading,
    templateForm: true
  }
  const savedImgsProps = {dDate, templateMessages, setTemplateMessages, disabled};
  const yesnoDialogProps = {
    open: dialogOpen, setOpen: setDialogOpen, handleConfirm: saveAndSendMessage,
    prms: {
      title: "ご様子メッセージ雛形送信確認",
      message: "雛形を該当利用者へ下書きとして反映させます。\n\n"
        + "下記の利用者には反映されません。\n"
        + "・既にご様子メッセージが入力されている利用者\n"
        + "・欠席の利用者\n"
        + "\nご家族様へ送信するには、各利用者のメッセージ編集画面にて下書きを外し送信してください。"
    }
  };

  return(
    <>
    <div className={classes.templateForm}>
      <AlbHMuiTextField
        label="今日の雛形"
        multiline
        minRows={3} rows={3}
        variant="outlined"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className='textForm'
        style={{width: "100%"}}
        error={error}
        helperText={helperText}
      />
      <TemplateSavedImgs {...savedImgsProps} />
      <AddedImgs addImgs={addImgs} setAddImgs={setAddImgs} />
      <CntbkPostMessageButtons {...buttonsProps} />
    </div>
    <YesNoDialog {...yesnoDialogProps} />
    </>
  )
}

const UserInfo = ({user, dDate}) => {
  const service = useSelector(state => state.service);
  const schedule = useSelector(state => state.schedule);
  const uidStr = "UID" + user.uid;
  const hohouDid = `${dDate}H`;
  const sch = schedule?.[uidStr]?.[dDate];
  const hohouSch = schedule?.[uidStr]?.[hohouDid];
  // 児童名
  const name = user?.name ?? "";
  // 学年
  const schoolGrade = user?.ageStr ?? "";
  // 欠席かどうか？
  let absence = false;
  if(service){
    // サービス選択時
    if(service===HOHOU){
      absence = hohouSch?.absence;
    }else{
      absence = sch?.absence;
    }
  }else{
    // 全サービス選択時
    absence = sch?.absence || hohouSch?.absence;
  }
  // 欠席加算対象か？
  let isKessekiKasan = false;
  if(service){
    // サービス選択時
    if(service===HOHOU){
      isKessekiKasan = hohouSch?.dAddiction?.["欠席時対応加算"];
    }else{
      isKessekiKasan = sch?.dAddiction?.["欠席時対応加算"];
    }
  }else{
    // 全サービス選択時
    isKessekiKasan = sch?.dAddiction?.["欠席時対応加算"] || hohouSch?.dAddiction?.["欠席時対応加算"];
  }
  const absenceColor = isKessekiKasan ?blue[800] :red[800];
  return(
    <div className='userInfo'>
      <span className='name'>{name}</span>
      <span className='honorificTitle'>さま</span>
      <span className='schoolGrade'>{schoolGrade}</span>
      {absence &&<span className='absence' style={{color: absenceColor}}>欠席</span>}
    </div>
  )
}

const PreMessage = ({preContentDt}) => {
  const classes = useStyles();
  let text = "";
  if (typeof preContentDt?.content === "string") {
    text = preContentDt.content;
  } else if (typeof preContentDt?.content === "object" && preContentDt.content !== null) {
    text = preContentDt.content.content || "";
  }
  const message = brtoLf(text);
  const timestampSaved = preContentDt?.timestampSaved;
  const timestampSent = preContentDt?.timestampSent;
  const timestampError = preContentDt?.timestampError;
  const timestamp = getLatestTimestamp(timestampSaved, timestampSent, timestampError);
  const option = getLatestTimestampValue([timestampSaved, "saved"], [timestampSent, "sent"], [timestampError, "error"]);
  
  return(
    <div className={`${classes.preMessage} ${classes.messageField}`}>
      <div className='options'>
        <SendedJudg timestamp={timestamp} option={option} />
      </div>
      {message
        ?<div className='message'>{message}</div>
        :<div className='noneMessage'>事前メッセージ未入力</div>
      }
    </div>
  )
}

const FamilyMessage = ({familyContentDt}) => {
  const classes = useStyles();
  const message = brtoLf(familyContentDt?.content ?? "");
  const timestampSent = familyContentDt?.timestampSent;
  const option = "familyMsg"
  const vital = familyContentDt?.vital;
  return(
    <div className={`${classes.familyMessage} ${classes.messageField}`}>
      <div className='options'>
        <SendedJudg timestamp={timestampSent} option={option}/>
      </div>
      {message
        ?<div className='message'>{message}</div>
        :<div className='noneMessage'>ご家族からのメッセージはありません。</div>
      }
      <VitalInfo vitalDt={vital} />
    </div>
  )
}

const PostMessgae = ({postContentDt}) => {
  const classes = useStyles();
  const message = postContentDt?.content;
  const timestampSaved = postContentDt?.timestampSaved;
  const timestampSent = postContentDt?.timestampSent;
  const timestampError = postContentDt?.timestampError;
  const timestamp = getLatestTimestamp(timestampSaved, timestampSent, timestampError);
  const option = getLatestTimestampValue([timestampSaved, "saved"], [timestampSent, "sent"], [timestampError, "error"]);
  const draft = postContentDt?.draft ?? false;
  const thumbnails = postContentDt?.thumbnails ?? [];
  const vitalDt = postContentDt?.vital;
  return(
    <div className={`${classes.postMessage} ${classes.messageField}`}>
      <div className='options'>
        <SendedJudg timestamp={timestamp} option={draft ?"draft" :option}/>
      </div>
      {message && checkValueType(message, 'String')
        ?<div className='message'>{brtoLf(message)}</div>
        :<div className='noneMessage'>ご様子メッセージ未入力</div>
      }
      <VitalInfo vitalDt={vitalDt} />
      <SavedMiniImgs thumbnails={thumbnails} />
    </div>
  )
}

const DailyRepportNotice = ({dailyReportNotice}) => {
  const classes = useStyles();

  if(!dailyReportNotice) return null;
  const sanitizedNotice = typeof dailyReportNotice === 'string'
    ? dailyReportNotice.replace(/<br[\s/]*>/ig, '')
    : dailyReportNotice;
  return(
    <div className={`${classes.dailyReportNotice} ${classes.messageField}`} style={{marginTop: 28}}>
      <div className='options'>
      </div>
      <div className='message'>{sanitizedNotice}</div>
    </div>
  )
}

const UserContactField = (props) => {
  const classes = useStyles();
  const history = useHistory();
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const {setSnack} = useContext(SnackContext);
  const {user, dDate, contacts, dailyReportDt} = props;
  const uid = user.uid;
  const uidStr = "UID" + uid;
  const messageContents = contacts?.[uidStr]?.[dDate] ?? CNTBK_INIT_CONTENTS;
  const [locked, setLocked] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    // ロック状態を確認
    const prevLocked = contacts?.[uidStr]?.locked ?? false;
    setLocked(prevLocked);
  }, [contacts]);

  const handleLockedAndTransition = async() => {
    const lockRes = await lockContactDt(hid, bid, stdDate, uidStr, setSnack);
    if(lockRes){
      // 画面が戻った時用にスクロール位置のuidを保存
      sessionStorage.setItem("cntbkMakeScrollPositionId", String(uid));
      sessionStorage.setItem("cntbkUserEditUid", String(uid));
      sessionStorage.setItem(CNTBK_CALENDAR_DATE_STORAGE_KEY, String(dDate.slice(-2)));
      history.push(`${CNTBK_EDIT_HISTORY_PATH}${uid}/${dDate.slice(-2)}/`);
    }else{
      setSnack({...{msg: '失敗しました。再度お試しください。', severity: 'warning'}});
    }
  }

  const handleClick = async() => {
    const prevLocked = await checkContactDtLocked(hid, bid, stdDate, uidStr, setSnack);
    if(prevLocked){
      setLocked(true);
      setDialogOpen(true);
    }else{
      await handleLockedAndTransition();
    }
  }

  const dailyReportNotice = dailyReportDt?.[uidStr]?.[dDate]?.notice;
  const yesnoDialogProps = {
    open: dialogOpen, setOpen: setDialogOpen, handleConfirm: handleLockedAndTransition,
    prms: {
      title: "ロックされています。",
      message: (
        "この利用者は現在編集中のためロックされています。\n"
        + "ロックを解除して編集を行いますか？"
      )
    }
  };
  return(
    <>
    <div
      id={uid}
      className={classes.userContactField}
      onClick={handleClick}
    >
      <div className='lockEditIcon'>
        {locked ?<LockIcon style={{color: red[600]}} /> :<EditIcon style={{color: teal[800]}} />}
      </div>
      <UserInfo user={user} dDate={dDate} />
      <PreMessage preContentDt={messageContents[0]}/>
      <FamilyMessage familyContentDt={messageContents[1]}/>
      <PostMessgae postContentDt={messageContents[2]}/>
      <DailyRepportNotice dailyReportNotice={dailyReportNotice} />
    </div>
    <YesNoDialog {...yesnoDialogProps} />
    </>
  )
}

const CntbkMakeMain = (props) => {
  const classes = useStyles();
  const location = useLocation();
  const schedule = useSelector(state => state.schedule);
  const users = useSelector(state => state.users);
  const com = useSelector(state => state.com);
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const dispalyService = service ?service :serviceItems;
  const classroom = useSelector(state => state.classroom);
  const stdDate = useSelector(state => state.stdDate);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const {setSnack} = useContext(SnackContext);
  const {calendarDate} = props;
  const [fetching, setFetching] = useState(true);
  const [contacts, setContacts] = useState({});
  const [dailyReportDt] = useFetchAlbDt({"a": "fetchDailyReport", hid, bid, date: stdDate}, ["dailyreport"], false, {}, setSnack);
  const [viewYear, viewMonth] = stdDate.split("-");
  const date = String(calendarDate).padStart(2, '0');
  const day = new Date(parseInt(viewYear), parseInt(viewMonth)-1, parseInt(date)).getDay();
  const dDate = `D${viewYear}${viewMonth}${date}`;
  const hohouDid = `D${viewYear}${viewMonth}${date}H`;

  // ページ遷移するごとに連絡帳データを取得しなおす
  useEffect(() => {
    if(!hid || !bid || !stdDate || !dDate) return;
    setFetching(true);
    let isMounted = true;
    fetchContacts(hid, bid, stdDate, null, dDate, setSnack).then(newContacts => {
      if (isMounted) {
        setContacts(newContacts);
        setFetching(false);
      }
    })
    return () => {
      isMounted = false;
    };
  }, [location.pathname, hid, bid, stdDate, dDate]);

  // スクロール位置関係
  useEffect(() => {
    if(fetching) return;
    const scrollPositionId = sessionStorage.getItem("cntbkMakeScrollPositionId");
    const element = document.getElementById(scrollPositionId);
    if (element) {
      element.scrollIntoView({
        block: 'center',
        inline: 'center',
      });
    }
    sessionStorage.removeItem("cntbkMakeScrollPositionId");
  }, [fetching]);

  // 30秒間隔で連絡帳データを更新
  useEffect(() => {
    if(!hid || !bid || !stdDate || !dDate) return;
    const fetched = setInterval(async() => {
      const prevContacts = await fetchContacts(hid, bid, stdDate, null, dDate, setSnack);
      if(prevContacts) setContacts({...prevContacts});
    }, 30000);
    return () => clearInterval(fetched);
  }, [hid, bid, stdDate, dDate]);

  // 連絡帳対象利用者でフィルターをかける
  const targetUsers = getFilteredUsers(users, service, classroom).filter(user => {
    // 連絡帳対象利用者か確認
    if(!checkCntbkMailUser(user) && !checkCntbkLineUser(user, com)) return false;
    const uidStr = "UID"+user.uid;
    const schDt = schedule?.[uidStr]?.[dDate];
    const hohouSchDt = schedule?.[uidStr]?.[hohouDid];
    // 予定データがない場合は対象外
    if(!checkValueType(schDt, 'Object') && !checkValueType(hohouSchDt, 'Object')) return false;
    // 予定データのサービス
    let schService = "";
    if(schDt) schService += schDt.service ?? "";
    if(schDt && hohouSchDt) schService += ",";
    if(hohouSchDt) schService += HOHOU ?? "";
    // 選択したサービスに一致しない場合は対象外
    if(service && (schService && !schService.includes(dispalyService))) return false;
    // 予定データの単位
    let schClassroom = "";
    if(schDt) schClassroom = schDt.classroom ?? "";
    if(schDt && hohouSchDt) schClassroom += ",";
    if(hohouSchDt) schClassroom += hohouSchDt.classroom ?? "";
    // 選択した単位に一致しない場合は対象外
    if(classroom && (schClassroom && !schClassroom.includes(classroom))) return false;
    // 利用なしの場合は対象外
    if(service){
      // サービス選択時
      if(service===HOHOU){
        if(hohouSchDt?.noUse) return false;
      }else{
        if(schDt?.noUse) return false;
      }
    }else{
      // 全サービス選択時
      if(schDt?.noUse && hohouSchDt?.noUse) return false;
    }
    return true;
  }).sort((a, b) => (parseInt(a.sindex) - parseInt(b.sindex)));
  const attendeeUsers = targetUsers.filter(user => {
    const uidStr = "UID"+user.uid;
    const schDt = schedule?.[uidStr]?.[dDate];
    const hohouSchDt = schedule?.[uidStr]?.[hohouDid];
    // 表示サービスに応じて対象とする予定データを場合分け
    if(service){
      // サービス選択時
      if(service===HOHOU){
        if(hohouSchDt?.absence) return false;
      }else{
        if(schDt?.absence) return false;
      }
    }else{
      // 全サービス選択時
      if(schDt?.absence || hohouSchDt?.absence) return false;
    }
    return true;
  });
  const numOfAttendees = attendeeUsers.length;

  // LINE認証完了しているが、送受信設定がOFFになっている。
  const isNoneFaptokenLineUser = getFilteredUsers(users, service, classroom).some(user => {
    // LINE認証済みではない場合は無視
    if(!checkLineUser(user, com)) return false;
    // 連絡帳利用者の場合は無視
    if(checkCntbkUser(user)) return false;
    return true;
  });

  let unfilledCount = 0;
  let draftCount = 0;
  let waitingCount = 0;
  let sendedCount = 0;
  let errorCount = 0;
  attendeeUsers.forEach(user => {
    const uidStr = "UID" + user.uid;
    const contactsPerDid = contacts?.[uidStr];
    const postMessageDt = contactsPerDid?.[dDate]?.[2];

    const sent = postMessageDt?.sent ?? false;
    const draft = postMessageDt?.draft ?? false;
    const error = postMessageDt?.error ?? false;
    const isContent = Boolean(postMessageDt?.content);
    // 未記入
    if(!sent && !draft && !error && !isContent) unfilledCount++;
    // 下書き
    if(!sent && draft && !error && isContent) draftCount++;
    // 送信待ち
    if(!sent && !draft && !error && isContent) waitingCount++;
    // 送信済み
    if(sent && !draft && !error && isContent) sendedCount++;
    // 送信失敗
    if(!sent && !draft && error && isContent) errorCount++;
  });

  const templateFormProps = {targetUsers, contactsDt: contacts, setContactsDt: setContacts, dDate}
  return(
    <div className={classes.main}>
      <div className='dateInfo'>
        <span className='monthdate'>{`${viewMonth}/${date}`}</span>
        <span className='day'>({DAY_LIST[day]})</span>
        <span className='usersNum'>利用人数<span className='count'>{numOfAttendees}</span>人</span>
        {!fetching && (
          <>
            {sendedCount > 0 && (
              <>
                <span className={`usersNum sent ${numOfAttendees === sendedCount ? 'hasIcon' : ''}`}>送信済み<span className='count'>{sendedCount}</span>人</span>
                {numOfAttendees === sendedCount && <CheckCircleIcon style={{ color: green[600], fontSize: 18, verticalAlign: 'middle', marginRight: 12 }} />}
              </>
            )}
            {waitingCount > 0 && (
              <>
                <span className={`usersNum waiting ${numOfAttendees === (sendedCount + waitingCount) && sendedCount < numOfAttendees ? 'hasIcon' : ''}`}>送信待ち<span className='count'>{waitingCount}</span>人</span>
                {numOfAttendees === (sendedCount + waitingCount) && sendedCount < numOfAttendees && (
                  <CheckCircleIcon style={{ color: grey[400], fontSize: 18, verticalAlign: 'middle', marginRight: 12 }} />
                )}
              </>
            )}
            {draftCount > 0 &&<span className='usersNum draft'>下書き<span className='count'>{draftCount}</span>人</span>}
            {unfilledCount > 0 &&<span className='usersNum unfilled'>未記入<span className='count'>{unfilledCount}</span>人</span>}
            {errorCount > 0 &&<span className='usersNum error'>送信失敗<span className='count'>{errorCount}</span>人</span>}
          </>
        )}
      </div>
      <TemplateForm {...templateFormProps} />
      {isNoneFaptokenLineUser &&(
        <div className='noneFaptoken'>
          <WarningIcon className='icon' />LINE認証済で送受信設定が済んでいない保護者がいます。
        </div>
      )}
      <div>
        {targetUsers.map(user => (
          <UserContactField
            key={`userMessageContents${user.uid}`}
            user={user} dDate={dDate}
            contacts={contacts} dailyReportDt={dailyReportDt}
          />
        ))}
      </div>
    </div>
  )
};

export const CntbkMake = () => {
  const limit959px = useMediaQuery("(max-width:959px)");
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const headerHeight = useGetHeaderHeight();
  const classes = useStyles();

  // 連絡帳と日報の体温データを同期する。（値がない場合にだけ値がある方のデータを挿入）
  useSyncVitalDailyReportAndCntbk();

  const {stdDate} = allState;
  const [snack, setSnack] = useState({});
  const [calendarDate, setCalendarDate] = useState((() => {
    const [viewPageYear, viewPageMonth] = stdDate.split("-");
    const now = new Date();
    const nowYear = String(now.getFullYear());
    const nowMonth = String(now.getMonth() + 1).padStart(2, '0');
    const sessionCalenderDate = sessionStorage.getItem(`${CNTBK_CALENDAR_DATE_STORAGE_KEY}${viewPageYear}${viewPageMonth}`);
    let resultDate = "01";
    if(sessionCalenderDate){
      resultDate = sessionCalenderDate;
    }else if(viewPageYear===nowYear && viewPageMonth===nowMonth){
      resultDate = String(now.getDate()).padStart(2, "0");
    }
    return resultDate;
  })());

  useEffect(() => {
    const [viewPageYear, viewPageMonth] = stdDate.split("-");
    sessionStorage.setItem(`${CNTBK_CALENDAR_DATE_STORAGE_KEY}${viewPageYear}${viewPageMonth}`, calendarDate);
  }, [calendarDate]);

  // ストアステート読み込みエラー
  if (loadingStatus.error) return (
    <>
    <CntbkLinksTab />
    <LoadErr loadStatus={loadingStatus} errorId={'CNB1556'} />
    </>
  );
  // ストアステート読み込み中はローディング画面
  if(!loadingStatus.loaded) return(
    <>
    <CntbkLinksTab />
    <LoadingSpinner />
    </>
  );

  const calender_parms = {
    allState, date: parseInt(calendarDate), setDate: setCalendarDate,
    style: limit959px ?{margin: '0 auto'} :{position: 'fixed'}
  };
  return (
    <>
    <CntbkLinksTab />
    <div className={classes.AppPage} style={headerHeight ?{marginTop: headerHeight+32} :{}}>
      <Calendar {...calender_parms}/>
      <SnackContext.Provider value={{setSnack}}>
        <CntbkMakeMain calendarDate={calendarDate} />
      </SnackContext.Provider>
    </div>
    <SnackMsg {...snack}/>
    </>
  )
}