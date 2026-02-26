import { formatDate, makeUrlSearchParams, parsePermission, randomStr } from "../../commonModule";
import React, { useState } from 'react';
import { Done, PriorityHigh } from '@material-ui/icons';
import { amber, blue, orange, red, teal } from '@material-ui/core/colors';
import { Button, Checkbox, FormControlLabel, makeStyles, useMediaQuery, withStyles } from "@material-ui/core";
import { LinksTab } from "../common/commonParts";
import { useHistory } from 'react-router';
import axios from "axios";
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import { endPoint, univApiCall } from '../../albCommonModule';
import { checkValueType } from "../dailyReport/DailyReportCommon";
import { useDispatch, useSelector } from "react-redux";
import { YesNoDialog } from "../common/GenericDialog";
import ErrorIcon from '@material-ui/icons/Error';
import { resetStore } from "../../Actions";
import { AlbHButton, checkLineUser, checkMailUser, safeJsonParse, sendErrorLog } from "../common/HashimotoComponents";

// 定数
export const INPUT_LIMIT = 600;
export const INPUT_LIMIT_HELPERTEXT = "600文字以内で入力してください";

// APIコール回数制限
const API_CALL_COUNTLIMIT = 5;
export const CNTBK_CALENDAR_DATE_STORAGE_KEY = "cntbkCalendarDate";
export const CNTBK_MAIN_HISTORY_PATH = "/contactbook/";
export const CNTBK_EDIT_HISTORY_PATH = "/contactbook/edit/";
export const CNTBK_INIT_CONTENTS = [{content: ""}, {content: ""}, {content: ""}];

// 公式LINE案内用URL
export const OFFICIALLINE_GUIDE_URL = {
  "alfami": "https://rbatos.com/lp/2024/08/23/%e9%80%a3%e7%b5%a1%e5%b8%b3%e3%83%bb%e3%81%94%e5%ae%b6%e6%97%8f%e6%a7%98%e5%90%91%e3%81%91%e3%81%94%e6%a1%88%e5%86%85%e3%81%ab%e3%81%a4%e3%81%84%e3%81%a6/",
  "aqua": "https://rbatos.com/lp/2025/09/02/%e9%80%a3%e7%b5%a1%e5%b8%b3%e3%83%bb%e3%81%94%e5%ae%b6%e6%97%8f%e6%a7%98%e5%90%91%e3%81%91%e3%81%94%e6%a1%88%e5%86%85%e3%81%ab%e3%81%a4%e3%81%84%e3%81%a6%ef%bc%88%e3%81%82%e3%81%8f%e3%81%82%ef%bc%89/"
}


// 関数

/**
 * 連絡帳対象利用者か確認
 * @param {Object} user 
 * @returns {Boolean}
 */
export const checkCntbkUser = (user) => {
  // 送受信が許可されているか？
  if(!(user?.ext?.contactBookEnable ?? true)) return false;
  // faptokenは発行済みか？
  if(!user?.faptoken) return false;
  return true;
}

export const checkCntbkMailUser = (user) => {
  // 連絡帳利用者ではない場合は対象外
  if(!checkCntbkUser(user)) return false;
  // メール利用者ではない場合は対象外
  if(!checkMailUser(user)) return false;
  return true;
}

export const checkCntbkLineUser = (user, com) => {
  // 連絡帳利用者ではない場合は対象外
  if(!checkCntbkUser(user)) return false;
  // LINE利用者ではない場合対象外
  if(!checkLineUser(user, com)) return false
  return true;
}

export const getLatestTimestamp = (...timestamp) => {

  const latestTimestamp = timestamp.reduce((prevLatestTimestamp, t) => {
    if(prevLatestTimestamp && t){
      return prevLatestTimestamp <= t ?t :prevLatestTimestamp;
    }else if(!prevLatestTimestamp && t){
      return t;
    }
    return prevLatestTimestamp;
  }, null);

  return latestTimestamp;
}

export const getLatestTimestampValue = (...timestampAndValue) => {
  const result = timestampAndValue.reduce((prevResult, tAv) => {
    if(prevResult && tAv){
      return prevResult[0] <= tAv[0] ?tAv :prevResult;
    }else if(!prevResult && tAv){
      return tAv;
    }
    return prevResult
  }, null);

  return result ?result[1] :null;
}

export const fetchContacts = async(hid, bid, stdDate, uidStr, did, setSnack) => {
  const fetchContactsParams = {a: "fetchContacts", hid, bid, date: stdDate};
  if(uidStr) fetchContactsParams.uid = uidStr;
  if(did) fetchContactsParams.did = did;
  for(let retry=0; retry<API_CALL_COUNTLIMIT; retry++){
    try{
      const fetchContactsRes = await univApiCall(fetchContactsParams);
      if(!fetchContactsRes?.data?.result){
        if(retry+1 < API_CALL_COUNTLIMIT) continue;
        // 送信失敗
        const error = new Error("fetchContactsError");
        error.details = {apiParams: fetchContactsParams, apiRes: fetchContactsRes};
        throw error;
      }
      setSnack({});
      const contacts = fetchContactsRes.data.dt?.[0]?.contacts;
      return checkValueType(contacts, 'Object') ?contacts :{};
    }catch(error){
      if(retry+1 < API_CALL_COUNTLIMIT) continue;
      // エラーログ送信
      const errorCode = randomStr(8);
      sendErrorLog(hid, bid, `FCM${errorCode}`, error);
      setSnack({msg: "データの取得に失敗しました。", severity:'error', errorId:'CNTBKC001'});
      return null;
    }
  }  
}

export const sendOneMessageOfContact = async(hid, bid, stdDate, uidStr, dDate, messageIndex, sendDt, setSnack=null) => {
  const fetchParams = {
    a: "sendOneMessageOfContact", hid, bid, date: stdDate, uid: uidStr, did: dDate,
    msgIndex: messageIndex, message: JSON.stringify(sendDt)
  };
  for(let apiCallCnt=0; apiCallCnt<API_CALL_COUNTLIMIT; apiCallCnt++){
    try{
      const res = await univApiCall(fetchParams);
      if(!res?.data?.result) continue;
      if(setSnack) setSnack({...{msg: '連絡帳メッセージを送信しました。'}});
      return true;
    }catch(error){
      if(apiCallCnt+1 < API_CALL_COUNTLIMIT) continue;
      if(setSnack) setSnack({...{msg: 'データ書き込みに失敗しました。', severity: 'warning'}});
      return false;
    }
  }
}

export const sendDtUnderUidOfContact = async(hid, bid, stdDate, uidStr, sendDt, setSnack=null) => {
  const fetchParams = {
    a: "sendDtUnderUidOfContact", hid, bid, date: stdDate, uid: uidStr,
    content: JSON.stringify(sendDt)
  };
  for(let apiCallCnt=0; apiCallCnt<API_CALL_COUNTLIMIT; apiCallCnt++){
    try{
      const res = await univApiCall(fetchParams);
      if(!res?.data?.result) continue;
      if(setSnack) setSnack({...{msg: '連絡帳メッセージを送信しました。'}});
      return true;
    }catch(error){
      if(apiCallCnt+1 < API_CALL_COUNTLIMIT) continue;
      if(setSnack) setSnack({...{msg: 'データ書き込みに失敗しました。', severity: 'warning'}});
      return false;
    }
  }
}

export const checkContactDtLocked = async(hid, bid, stdDate, uidStr, setSnack) => {
  const contacts = await fetchContacts(hid, bid, stdDate, uidStr, null, setSnack);
  if(!contacts) return false;
  const prevLocked = contacts?.[uidStr]?.locked ?? false;
  return prevLocked;
}

export const lockContactDt = async(hid, bid, stdDate, uidStr, setSnack) => {
  // ローカルストレージにロック無効化フラグがある場合は無視
  if(safeJsonParse(localStorage.getItem("DisableCntbkAndDailyReportLock"), false)) return true;
  // ロックした連絡帳メッセージデータを送信
  const sendRes = await sendDtUnderUidOfContact(hid, bid, stdDate, uidStr, {locked: true}, setSnack);
  return sendRes;
}

export const unlockContactDt = async(hid, bid, stdDate, uidStr, setSnack) => {
  // ロックした連絡帳メッセージデータを送信
  const sendRes = await sendDtUnderUidOfContact(hid, bid, stdDate, uidStr, {locked: false}, setSnack);
  return sendRes;
}

export const sendImgs = async(addImgs, jino, rndfname, setSnack) => {
  const photos = [], thumbnails = [];
  const today = formatDate(new Date(), 'YYYYMMDD');
  const rnddir = `${jino}_${randomStr(8)}`;
  // const rndfname = `${String(uid).padStart(6, '0')}_${randomStr(8)}`;
  const url = 'https://houday.rbatos.com/api/uploadimgResize.php';
  const headers = {'content-type': 'multipart/form-data'}
  let index = 0;
  for(const img of addImgs){
    index++;
    const params = new FormData();
    const fileName = img.name;
    const extension = fileName.split('.').slice(-1)[0]; // 拡張子を取得
    params.append('file', img, `${rndfname}_${index}.${extension}`);
    params.append('rnddir', rnddir);
    params.append('today', today);
    const res = await axios.post(url, params, headers);
    if(res.data.result){
      const path = res.data.filename.replace("..", "");
      photos.push("https://houday.rbatos.com"+path);
      const tnPath = res.data.thumbnail.replace("..", "");
      thumbnails.push("https://houday.rbatos.com"+tnPath);
    }else{
      setSnack({...{msg: '送信に失敗しました。', severity: 'warning'}});
      return;
    }
  }

  return {photos, thumbnails};
}

export const sendPdfs = async(pdfs, directory="contactbookimg") => {
  const today = formatDate(new Date(), 'YYYYMMDD');
  const rnddir = randomStr(32);
  const url = 'https://houday.rbatos.com/api/uploadimgResizePdf.php';
  const headers = {'content-type': 'multipart/form-data'};
  const pdfUrls = [];
  for(const pdf of pdfs){
    const params = new FormData();
    const fileName = pdf.name;
    params.append('file', pdf, fileName);
    params.append('rnddir', rnddir);
    params.append('today', today);
    params.append('directory', directory)
    const res = await axios.post(url, params, headers);
    if(res.data.result){
      const path = "https://houday.rbatos.com" + res.data.filename.replace("..", "");
      pdfUrls.push(path);
    }else{
      return false;
    }
  }

  return pdfUrls;
}

// カスタムフック

const useStyles = makeStyles({
  sendedJudg: {
    fontSize: '0.8rem',
    display: 'flex', alignItems: 'center',
    '@media print': {display: 'none'},
    '& .typeIcon': {
      '& .MuiSvgIcon-root': {
        width: 16, height: 'auto',
        verticalAlign: 'bottom'
      }
    },
    '& .type': {marginRight: 4},
    '& .monthdate': {marginRight: 2},
    '& .draftMsg': {
      display: 'flex', alignItems: 'center',
      '& .MuiSvgIcon-root': {fontSize: 16}
    },
    '& .done': {
      color: blue[800]
    },
    '& .notYet': {
      color: red[600]
    },
    '& .timestamp': {
      marginLeft: 4,
      '& .time': {marginLeft: 2}
    },
    '& .count': {
      color: blue[800]
    }
  },
  vitalInfo: {
    lineHeight: '1rem',
    display: 'flex', flexWrap: 'wrap'
  },
  vitalInfoParts: {
    padding: '4px 8px',
  },

  // ボタン全般
  cntbkButton: {
    width: 112,
    alignSelf: 'baseline',
    "@media (max-width:600px)": {
      fontSize: 12,
      width: 88,
      padding: '4px 10px'
    },
  },
  deleteButton: {
    color: red[700], borderColor: red[700]
  },
  cancelButton: {},
  sendButton: {},
  imageUploadButton: {
    '&:hover': {
      filter: 'brightness(85%)'
    },
    '& .button': {
      backgroundColor: amber[900], color: 'white',
    },
  },
  cntbkCheckbox: {
    margin: 0,
    "@media (max-width:600px)": {
      margin: 0,
      '& .MuiFormControlLabel-label': {
        fontSize: 12
      },
      '& .checkbox': {
        padding: 0
      }
    },
    
  },
  postMessageButtons: {
    textAlign: 'end', marginTop: 8,
    '& .button': {marginLeft: 12},
    "@media (max-width:600px)": {
      '& .button': {marginLeft: 8},
    },
  },
  imgWithDeleteFunc: {
    width: 'fit-content',
    margin: '8px calc(40px / 6)',
    display: 'flex', flexDirection: 'column',
    '& .imgField': {
      position: 'relative',
      '& .option': {
        position: 'absolute', top: 0, right: 0,
        fontSize: 12, fontWeight: 'bold', color: '#fff',
        padding: 4
      }
    },
    '& .deleteImg': {
      display: 'flex',
      alignItems: 'center',
      width: 'fit-content',
      margin: '0 auto',
      '& .iconButtonStr': {
        fontSize: '1rem'
      }
    }
  },
  addedImgs: {
    display: 'flex', flexWrap: 'wrap'
  },
  savedMiniImgs: {
    '& .img': {
      verticalAlign: 'top',
      margin: 4,
    }
  },
});


// コンポーネント

export const SendedJudg = (props) => {
  const classes = useStyles();
  const {timestamp, option, count} = props;

  if(!timestamp) return null;
  
  let type = "", typeIcon = null, color = null;
  switch(option){
    case 'draft': {
      type = "下書き";
      typeIcon = (<PriorityHigh/>);
      color = amber[900];
      break;
    }
    case 'saved': {
      type = "送信待ち";
      typeIcon = (<Done/>);
      color = teal[800];
      break;
    }
    case 'sent': {
      type = "送信済み";
      typeIcon = (<Done/>);
      color = blue[800];
      break;
    }
    case 'error': {
      type = "送信失敗";
      typeIcon = (<ErrorIcon />);
      color = red[600];
      break;
    }
    case 'familyMsg': {
      type = "受信";
      typeIcon = (<Done/>);
      color = blue[800];
      break;
    }
  }
  
  const newDate = new Date(timestamp);
  const month = String(newDate.getMonth()+1).padStart(2, "0");
  const date = String(newDate.getDate()).padStart(2, "0");
  const hour = String(newDate.getHours()).padStart(2, "0");
  const minutes = String(newDate.getMinutes()).padStart(2, "0");

  return(
    <div className={classes.sendedJudg} style={{color, ...props.style}}>
      <span className="typeIcon">{typeIcon}</span>
      <span className="type">{type}</span>
      <span className='monthdate'>{`${month}/${date}`}</span>
      <span className='time'>{`${hour}:${minutes}`}</span>
      {count &&<span className="count" style={{marginLeft: 16}}>{count}件</span>}
    </div>
  )
}

export const CntbkDeleteButton = (props) => {
  const classes = useStyles();
  const {label="削除", disabled=false} = props;

  const handleClick = () => {
    if(props.handleClick) props.handleClick();
  }

  return(
    <Button
      variant='outlined'
      onClick={handleClick}
      className={`${classes.deleteButton} ${classes.cntbkButton} button deleteButton`}
      style={{...props.style}}
      disabled={disabled}
    >
      {label}
    </Button>
  )
}

export const CntbkCancelButton = (props) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const classes = useStyles();
  const {historyPath, label="キャンセル"} = props;

  const handleClick = () => {
    if(props.handleClick){
      props.handleClick();
    }else{
      dispatch(resetStore());
    }
    if(historyPath) history.push(historyPath);
  }

  return(
    <Button
      variant='contained'
      color='secondary'
      className={`${classes.cancelButton} ${classes.cntbkButton} button cancelButton`}
      onClick={handleClick}
    >
      {label}
    </Button>
  )
}

export const CntbkDraftMessageDeleteButton = (props) => {
  const classes = useStyles();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleDelete = () => {
    props.handleClick()
  }

  return(
    <>
    <Button
      variant='contained'
      style={{color: '#fff', backgroundColor: red[700]}}
      className={`${classes.cancelButton} ${classes.cntbkButton} button cancelButton`}
      onClick={() => setDialogOpen(true)}
    >
      下書き削除
    </Button>
    <YesNoDialog
      open={dialogOpen} setOpen={setDialogOpen}
      handleConfirm={handleDelete}
      prms={{
        title: "下書き削除の確認",
        message: (
          "削除すると元に戻すことはできません。\n"
          + "下書きを削除しますか？"
        )
      }}
    />
    </>
  )
}

export const CntbkSendButton = (props) => {
  const classes = useStyles();
  const {label="送信", disabled, color="primary", style={}} = props;
  const handleClick = () => {
    props.handleClick();
  }

  return(
    <Button
      variant='contained'
      color={color}
      className={`${classes.sendButton} ${classes.cntbkButton} button sendButton`}
      onClick={handleClick}
      disabled={disabled}
      style={style}
    >
      {label}
    </Button>
  )
}

export const CntbkButton = withStyles({
  root: ({rootStyle}) => ({
    width: 112,
    alignSelf: 'baseline',
    "@media (max-width:600px)": {
      fontSize: 12,
      width: 88,
      padding: '4px 10px'
    },
    ...rootStyle
  })
})((props) => {
  const {classes, label="ボタン", rootStyle={}, ...buttonProps} = props;

  return(
    <Button
      className={classes.root}
      variant='contained'
      {...buttonProps}
    >
      {label}
    </Button>
  )
});

const CntbkSaveButton = (props) => {
  const classes = useStyles();
  const {label="一時保存", disabled, color="primary", style={}} = props;
  const handleClick = () => {
    props.handleClick();
  }

  return(
    <Button
      variant='contained'
      color={color}
      className={`${classes.sendButton} ${classes.cntbkButton} button sendButton`}
      onClick={handleClick}
      disabled={disabled}
      style={style}
    >
      {label}
    </Button>
  )
}

export const CntbkConfirmSendButton = (props) => {
  const classes = useStyles();
  const {nomalLabel="送信", confirmLabel="送信実行"} = props;
  const [confirm, setConfirm] = useState(false);

  const handleClick = () => {
    if(props.confirm===true || props.confirm===false){
      if(props.confirm === false){
        props.setConfirm(true);
        return;
      }
    }else{
      if(confirm === false){
        setConfirm(true);
        return;
      }
    }
    if(props.handleClick) props.handleClick();
  }

  const confirmStyle = confirm || props.confirm ?{backgroundColor: red[600]} :{};
  return(
    <Button
      variant='contained'
      color="primary"
      onClick={handleClick}
      className={`${classes.confirmSendButton} ${classes.cntbkButton} button sendButton`}
      style={{...confirmStyle}}
    >
      {confirm || props.confirm ?confirmLabel :nomalLabel}
    </Button>
  )
}

export const CntbkDraftCheckBox = (props) => {
  const classes = useStyles();
  const limit599px = useMediaQuery("(max-width:599px)");
  const {draft, setDraft} = props;

  const handleChange = (e) => {
    setDraft(e.target.checked);
  }

  return(
    <FormControlLabel
      control={<Checkbox
        className='checkbox'
        checked={draft}
        onChange={handleChange}
      />}
      label="下書き"
      labelPlacement={limit599px ?"top" :"start"}
      className={`${classes.draftCheckBox} ${classes.cntbkCheckbox} checkbox draftCheckbox`}
      color='primary'
    />
  )
}

const TemporarySaveMessageCheckbox = (props) => {
  const classes = useStyles();
  const limit599px = useMediaQuery("(max-width:599px)");
  const {temporarySave, setTemporarySaves} = props;

  const handleChange = (e) => {
    setTemporarySaves(e.target.checked);
  }

  return(
    <FormControlLabel
      control={<Checkbox
        className='checkbox'
        checked={temporarySave}
        onChange={handleChange}
      />}
      label="一時保存"
      labelPlacement={limit599px ?"top" :"start"}
      className={`${classes.draftCheckBox} ${classes.cntbkCheckbox} checkbox draftCheckbox`}
      color='primary'
    />
  )
}

export const CntbkImgUploadButton = (props) => {
  const classes = useStyles();
  const {addImgs, setAddImgs, com, setSnack, initImgsNum=0, imgNumLimit=0} = props;
  const photoNumLimit = com?.etc?.settingContactBook?.numOfPhotos ?? 3;
  const handleChange = (e) => {
    const imgs = [...e.target.files];
    if(initImgsNum + addImgs.length+imgs.length <= imgNumLimit){
      setAddImgs([...addImgs, ...e.target.files]);
    }else{
      if(setSnack) setSnack({...{msg: '画像追加枚数上限を超えています。', severity: 'warning', id: new Date().getTime()}});
    }
  }

  return(
    <label
      htmlFor="uploadImgButton"
      className={classes.imageUploadButton}
    >
      <input
        hidden
        multiple
        type="file"
        name="image"
        id="uploadImgButton"
        onChange={handleChange}
        accept="image/jpeg"
      />
      <Button
        variant="contained"
        component="span"
        className={`${classes.cntbkButton} button imageUploadButton`}
      >
        画像追加
      </Button>
    </label>
  )
}

export const CntbkFileAttachmentButton = (props) => {
  const {setImages, setPdfs, disabled} = props;

  const handleChange = (e) => {
    const files = e.target.files;
    for(const file of files){
      const fileType = file.type;
      if(fileType === "image/jpeg"){
        setImages(prevImages => [...prevImages, file]);
      }else if(fileType === "application/pdf"){
        setPdfs(prevPdfs => [...prevPdfs, file]);
      }
    }
  }

  return(
    <label htmlFor="upload-file-button">
      <input
        hidden
        accept="image/jpeg, application/pdf"
        id="upload-file-button"
        multiple
        type="file"
        onChange={handleChange}
        disabled={disabled}
      />
      <CntbkButton
        label="添付" component="span"
        rootStyle={{
          color: '#fff', backgroundColor: orange[800],
          '&:hover': {backgroundColor: orange[900]}
        }}
        disabled={disabled}
      />
    </label>
  )
};

export const CntbkPostMessageButtons = (props) => {
  const classes = useStyles();
  const {
    draft, setDraft,
    temporarySave, setTemporarySaves,
    historyPath, handleCancel,
    addImgs, setAddImgs, com, setSnack, initImgsNum=0, imgNumLimit=0,
    handleSend, handleTemplateSave, handleDraftDelete,
    contents,
    loading,
    templateForm=false
  } = props;

  const isDraft = checkValueType(draft, 'Boolean') && checkValueType(setDraft, 'Function');
  const isTemporarySave = checkValueType(temporarySave, 'Boolean') && checkValueType(setTemporarySaves, 'Function');

  const draftCheckboxProps = {draft, setDraft};
  const TemporarySaveMessageCheckboxProps = {temporarySave, setTemporarySaves}
  const cancelButtonProps = {historyPath, handleClick: handleCancel};
  const imgUploadButtonProps = {addImgs, setAddImgs, com, setSnack, initImgsNum, imgNumLimit};
  const sendButtonProps = {handleClick: handleSend}
  if(handleTemplateSave) sendButtonProps.label = "下書き適用"
  const saveButtonProps = {handleClick: handleTemplateSave, label: templateForm ?"一時保存" :"送信"} 
  return(
    <div className={classes.postMessageButtons}>
      {isDraft &&<CntbkDraftCheckBox {...draftCheckboxProps} />}
      {isTemporarySave &&<TemporarySaveMessageCheckbox {...TemporarySaveMessageCheckboxProps} />}
      <CntbkCancelButton {...cancelButtonProps} />
      {contents?.draft && handleDraftDelete &&<CntbkDraftMessageDeleteButton handleClick={handleDraftDelete}/>}
      <CntbkImgUploadButton {...imgUploadButtonProps} />
      {(templateForm && temporarySave) &&<CntbkSaveButton {...saveButtonProps} />}
      {(templateForm && !temporarySave) &&<AlbHButton className="button sendButton" loading={loading} label="下書き適用" onClick={handleSend} color="primary" variant='contained' />}
      {!templateForm &&<AlbHButton className="button sendButton" loading={loading} label={draft ?"下書き保存" :"送信"} onClick={handleSend} color="primary" variant='contained' />}
    </div>
  )
}

export const ImgWithDeleteFunc = (props) => {
  const classes = useStyles();
  const {imgUrl, imgIndex, deleteImg, option, disabled} = props;

  if(!imgUrl) return null;

  const handleClick = () => {
    deleteImg(imgIndex);
  }

  return(
    <div className={classes.imgWithDeleteFunc}>
      <div className='imgField'>
        <img src={imgUrl} width="200px" />
      </div>
      {!disabled &&<Button
        className="deleteImg"
        onClick={handleClick}
      >
        <HighlightOffIcon style={{color: red[600]}}/>
        <span className='iconButtonStr'>削除</span>
      </Button>}
    </div>
  )
}

export const AddedImgs = (props) => {
  const classes = useStyles();
  const {addImgs, setAddImgs} = props;

  const deleteImg = (imgIndex) => {
    const newAddImgs = addImgs.filter((_, i) => i !== imgIndex);
    setAddImgs([...newAddImgs]);
  }

  const imgNodes = addImgs.map((imgObj, imgIndex) => {
    const imgWithDeleteFuncProps = {imgUrl: URL.createObjectURL(imgObj), imgIndex, deleteImg, option: '未追加'};
    return(
      <ImgWithDeleteFunc key={`savedImg${imgIndex}`} {...imgWithDeleteFuncProps} />
    )
  });

  return(
    <div className={classes.addedImgs}>
      {imgNodes}
    </div>
  )
}

export const SavedMiniImgs = (props) => {
  const classes = useStyles();
  const {thumbnails} = props;
  if(!thumbnails) return null;

  const imgNodes = thumbnails.map((imgUrl, index) => (
    <img key={`savedMiniImg${index+1}`} src={imgUrl} className='img' width="100px" />
  ));

  return(
    <div className={classes.savedMiniImgs}>
      {imgNodes}
    </div>
  )
}

const VitalInfoParts = ({title, val}) => {
  const classes = useStyles();
  return(
    <div className={classes.vitalInfoParts} style={{marginRight: 16, lineHeight: 1.5}}>
      <span className='vitalTitle'>{title}</span>
      <span style={{margin: '0 4px'}}>:</span>
      <span className='val'>{val}</span>
    </div>
  )
}

export const VitalInfo = ({vitalDt}) => {
  const classes = useStyles();
  if(!vitalDt) return null;
  const vitalKeyOrder = ["temperature", "bloods", "spo2", "sleep", "excretion", "meal", "medication"];
  const nodes = vitalKeyOrder.reduce((result, key, i) => {
    let value = vitalDt[key];
    if(!value) return result;
    let title = "";
    switch(key){
      case "temperature": {
        title = "体温";
        value += "℃";
        break;
      }
      case "sleep": {
        title = "睡眠時間";
        if(!value.includes("-")) value += "時間";
        break;
      }
      case "spo2": {
        title = "血中酸素濃度";
        value += "%";
        break;
      }
      case "excretion": {
        title = "排泄";
        break;
      }
      case "meal": {
        title = "食事";
        break;
      }
      case "medication": {
        title = "服薬";
        break;
      }
    }
    if(key === "bloods"){
      if(value[0]) result.push(<VitalInfoParts key={"vitalInfo"+i} title={"最高血圧"} val={value[0]+"mmHg"}/>);
      if(value[1]) result.push(<VitalInfoParts key={"vitalInfo"+i} title={"最低血圧"} val={value[1]+"mmHg"}/>);
      if(value[2]) result.push(<VitalInfoParts key={"vitalInfo"+i} title={"脈拍"} val={value[2]+"回/分"}/>);
    }else{
      result.push(<VitalInfoParts key={"vitalInfo"+i} title={title} val={value}/>);
    }
    return result;
  }, []);

  return(
    <div className={classes.vitalInfo} style={{marginTop: 4}}>
      {nodes}
    </div>
  )
}

export const getPostMessageDisabled = (dDate, account) => {
  const permission = parsePermission(account)[0][0];
  if(permission >= 95) return false;
  const year = dDate.slice(1, 5);
  const month = dDate.slice(5, 7);
  const date = dDate.slice(7, 9);

  const afterTime = new Date(2024, 6, 23+6).getTime();
  const nowTime = new Date().getTime();
  // 現在から１週間前まで入力可能
  const lessLimitTime = nowTime >= afterTime
    ?new Date(parseInt(year), parseInt(month)-1, parseInt(date)+6, 24).getTime()
    :new Date(parseInt(year), parseInt(month)-1, parseInt(date), 24).getTime();
  return lessLimitTime <= nowTime
}

export const CntbkLinksTab = () => {
  const isLimit500px = useMediaQuery("(max-width:500px)");
  const com = useSelector(state => state.com);
  const line = com?.ext?.settingContactBook?.line ?? false;
  const bulkMessageAllowStaff = com?.etc?.settingContactBook?.bulkMessage?.allowStaff ?? false;
  const account = useSelector(state => state.account);
  const permission = parsePermission(account)[0][0];
  const permissionuseder90 = permission < 90;

  const menu = [
    { link: "/contactbook/", label: "メッセージ選択" },
    { link: "/contactbook/list/", label: "一覧表示", hide: isLimit500px },
    { link: "/contactbook/message/", label: "フリートーク", hide: !line },
    { link: "/contactbook/token/", label: "送受信設定",  hide: isLimit500px },
    { link: "/contactbook/invoice/", label: "請求書・受領書", hide: isLimit500px || permissionuseder90 },
    { link: "/contactbook/bulkmessage/", label: "一斉連絡", hide: permission < (bulkMessageAllowStaff ?80 :90) },
    { link: "/contactbook/bulkmail/", label: "メール一斉送信" },
    { link: "/contactbook/setting/", setting: true, hide: permission < 90 || isLimit500px }
  ];

  return (<LinksTab menu={menu} />)
}


// 連絡帳HTMLメール送信
export const sendFapMail = async(userDt={}, account={}, mailTitle="", htmltText="", com={}, from="support", attachFile=[]) => {
  const pmail = userDt?.pmail ?? "";
  if(!pmail) return false;
  const bccAddresses = com?.ext?.bccAddresses ?? [];
  const bcc = bccAddresses.length ?bccAddresses.join(",") :(account?.mail ?? "").replace(/\+.*@/, '@');
  const apiParams = {
    a: 'sendHtmlMail', bcc, replyto: bcc, 
    pmail: pmail, from,
    title: mailTitle, content: htmltText,
    attachFile: JSON.stringify(attachFile)
  };
  const res = await univApiCall(apiParams);
  if(!(res && res.data && res.data.result)){
    console.log("メール送信失敗");
    return false;
  }
  return true;
}