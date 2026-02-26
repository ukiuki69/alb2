import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, LinearProgress, makeStyles } from "@material-ui/core";
import SendIcon from '@material-ui/icons/Send';
import { useDispatch, useSelector } from 'react-redux';
import html2pdf from 'html2pdf.js';
import { CntbkLinksTab, checkCntbkLineUser, SendedJudg, sendFapMail, sendPdfs, fetchContacts } from './CntbkCommon';
import UserSelectDialogWithButton from '../common/UserSelectDialogWithButton';
import { brtoLf, getLodingStatus, lfToBr, makeUrlSearchParams, null2Zero } from '../../commonModule';
import { LoadingSpinner } from '../common/commonParts';
import { endPoint, getFilteredUsers, univApiCall } from '../../albCommonModule';
import SnackMsg from '../common/SnackMsg';
import { OnePageOfInvoice } from '../reports/Invoice';
import { isKyoudaiJougen, setBillInfoToSch } from '../Billing/blMakeData';
import axios from 'axios';
import { YesNoDialog } from '../common/GenericDialog';
import { makeCntbkReportHtmlMailString } from './HtmlMailLayout/CntbkReportHtmlMailLayout';
import DoneIcon from '@material-ui/icons/Done';
import PauseIcon from '@material-ui/icons/Pause';
import { setSnackMsg, setStore } from '../../Actions';
import { AlbHMuiTextField, PdfCard, safeJsonParse, useAlbFetchDt, useSessionStorageState } from '../common/HashimotoComponents';
import { TuusyokyuuhuMeisaiOne } from '../reports/NewTuusyokyuuhuMeisai';
import AssignmentIcon from '@material-ui/icons/Assignment';
import { checkValueType } from '../dailyReport/DailyReportCommon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLine } from '@fortawesome/free-brands-svg-icons';
import MailIcon from '@material-ui/icons/Mail';
import { blue, grey, red, teal, yellow } from '@material-ui/core/colors';
import { TokyoDairiTsuchiOne } from '../reports/TokyoDairiTsuchi';
import CloseIcon from '@material-ui/icons/Close';
import { DateInput } from '../common/StdFormParts';

export const generatePdfBlob = async (element, filename, margin, format="a4") => {
  const option = {
    margin,
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format, orientation: 'portrait' },
  };

  return new Promise((resolve, reject) => {
    html2pdf()
      .set(option)
      .from(element)
      .toPdf()
      .output('blob') // ← blob, datauristring, arraybuffer, etc. を指定できる
      .then((pdfBlob) => {
        resolve(pdfBlob); // ここでBlobオブジェクトを受け取れる
      })
      .catch(reject);
  });
};

const sendPdf = async(stdYear, stdMonth, user, com, element, preview, margin=0, format="a4") => {
  const filename = `${preview}${stdYear}年${stdMonth}月-${(user?.name ?? "").replace(/\s|　/g, "")}.pdf`;
  const blob = await generatePdfBlob(element, filename, margin, format);
  const pdf = new File([blob], filename, { type: 'application/pdf' });
  const res = await sendPdfs([pdf], "docs");
  return res;
}

const sendContacts = async(sendDt, allState, setSnack) => {
  const {hid, bid, stdDate} = allState;
  const parms = {
    a: "sendPartOfContact", hid, bid, date: stdDate, partOfContact: JSON.stringify(sendDt)
  };
  const res = await univApiCall(parms);
  if(res?.data?.result){
    if(setSnack) setSnack({...{msg: '送信完了しました。', id: new Date().getTime()}});
    return true;
  }else{
    if(setSnack) setSnack({...{msg: '送信に失敗しました。', severity: 'warning'}});
    return false;
  }
}

const useStyles = makeStyles({
  AppPage: {
    maxWidth: 400,
    width: '100%',
    margin: '114px auto',
  },
  SendButton: {
    width: '100%',
    // marginBottom: '64px'
  },
  InvoiceWrapper: {
    transform: "scale(0.9)",
    '& .invoiceHead': {
      marginTop: '0px !important'
    }
  },
  NoticeForm: {
    // marginTop: -48, marginBottom: 32,
    '& .buttons': {
      marginTop: '8px',
      textAlign: 'end',
      '& .cancelButton, .submitButton': {width: 104},
      '& .cancelButton': {marginRight: 12}
    }
  },
  ProxyReceiptWrapper: {
    width: '1122px',
    '& .onePage': {
      maxWidth: '990px',
      margin: '32px auto 0'
    }
    // width: "60%",
    // '& .onePage': {
    //   width: 778,
    //   margin: '0px !important',
    //   '& *': {
    //     boxSizing: 'inherit'
    //   },
    //   '& td, th': {
    //     fontSize: '12px'
    //   },
    //   '& .title': {fontSize: '24px'},
    //   '& .subTitle': {fontSize: '12px'},
    // }
  },
  sentUserList: {
    margin: '32px auto',
    '& .contents': {
      '&:not(:last-child)': {marginBottom: 16}
    },
    '& .title': {
      borderBottom: `1px solid ${teal[600]}`, background: teal[50],
      padding: '8px 16px 6px', color: teal[800],
      '& span': {
        marginInlineStart: 16, color: grey[900], fontSize: '.8rem',
      },
    },
    '& .row': {
      display: 'flex',
      margin: '4px 0',
      '& > div': {padding: '4px 6px', marginTop: '8px'},
      '& .timestamp': {fontSize: 14, marginTop: 9},
      '& .userName': {flex: 1},
      '& .amount': {width: 84, textAlign: 'end'},
      // '& .delimiter': {margin: '0 2px'},
      '& .checked': {
        color: grey[600], fontSize: '.7rem'
      }
    },
    '& .rowHead': {
      borderBottom: `1px solid ${grey[600]}`,
      '& .timestamp': {color: '#111', fontSize: '1rem'},
      '& .amount': {textAlign: 'left'},
    },
  }
});

const ReportDateForm = (props) => {
  const {item, setSnack} = props;
  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth()+1;
  const nowDate = now.getDate();
  const initDate = `${nowYear}-${String(nowMonth).padStart(2, '0')}-${String(nowDate).padStart(2, '0')}`;
  const sessionStorageKey = `CntbkReportDate-${item}`;
  const tagName = `reportdate_${item}`;

  const handleSubmit = () => {
    const newReportDate = document.getElementsByName(tagName)[0].value;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(newReportDate)){
      setSnack({msg: "日付が不正です。", id: new Date().getTime(), severity: 'warning'});
      return;
    }
    sessionStorage.setItem(sessionStorageKey, newReportDate);
    setSnack({msg: "日付を登録しました。", id: new Date().getTime()});
  }

  const def = sessionStorage.getItem(sessionStorageKey) ?? initDate;
  return(
    <div style={{display: 'flex'}}>
      <div style={{width: 140}}>
        <DateInput
          name={tagName}
          label="日付設定"
          required
          def={def}
        />
      </div>
      <div>
        <Button
          variant='contained'
          onClick={handleSubmit}
          style={{marginTop: 20}}
        >
          登録
        </Button>
      </div>
    </div>
  )
}

const SendButton = (props) => {
  const classes = useStyles();
  const {label, ...buttonProps} = props;
  return(
    <Button
      variant='contained' color="primary"
      endIcon={<SendIcon/>}
      className={classes.SendButton}
      {...buttonProps}
    >
      {label}
    </Button>
  )
}

const SendingDialog = (props) => {
  const {isSending, sendProgress, sendingUid, sentUids, targetUsers, sendErrorUids, preview, onClose, cancelRef, ...dialogProps} = props;

  useEffect(() => {
    if(!isSending) return;
    sendProgress();
  }, [isSending]);

  const value = ((sentUids.length + sendErrorUids.length) / targetUsers.length) * 100;
  const completed = (sentUids.length + sendErrorUids.length) === targetUsers.length;
  return(
    <Dialog maxWidth="sm" fullWidth onClose={onClose} {...dialogProps}>
      <DialogTitle>{preview}送信{!completed ?"中" :sendErrorUids.length>=1 ?"一部失敗" :"完了"} {sentUids.length+sendErrorUids.length}/{targetUsers.length}</DialogTitle>
      <DialogContent dividers>
        <div style={{display: 'flex', flexWrap: 'wrap'}}>
          {targetUsers.map(user => (
            <div style={{margin: '4px 8px', display: 'flex', alignItems: 'center'}}>
              <span>{user.name}</span>
              {(user.uid!==sendingUid && !sendErrorUids.includes(user.uid)  && !sentUids.includes(user.uid)) &&<PauseIcon color='secondary' />}
              {user.uid===sendingUid &&<CircularProgress color='primary' style={{width: '16px', height: '16px', marginLeft: '4px'}} />}
              {sentUids.includes(user.uid) &&<DoneIcon color='primary' />}
              {sendErrorUids.includes(user.uid) &&<CloseIcon style={{color: red['A700']}} />}
            </div>
          ))}
        </div>
      </DialogContent>
      <DialogActions>
        <div style={{width: '100%', textAlign: 'end'}}>
          <div style={{marginBottom: '8px'}}>
            <LinearProgress variant="determinate" value={value} />
          </div>
          {!completed &&<div style={{lineHeight: '1.5rem', color: yellow[900], textAlign: 'end'}}>
            送信中です。画面を閉じたり移動しないでください。
          </div>}
          {!completed &&<Button
            variant='outlined' color="secondary"
            onClick={() => {cancelRef.current = true}}
          >
            キャンセル
          </Button>}
          {completed &&<Button
            variant='contained' color="primary"
            onClick={onClose}
          >
            閉じる
          </Button>}
        </div>
      </DialogActions>
    </Dialog>
  )
}

const InvoiceWrapper = forwardRef((props, ref) => {
  const classes = useStyles();
  const {specialStateDate} = props;
  const now = new Date();
  const stateDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return(
    <div ref={ref} className={classes.InvoiceWrapper}>
      <OnePageOfInvoice {...props} specialStateDate={specialStateDate || stateDate} />
    </div>
  );
});
const InvoiceButton = (props) => {
  const allState = useSelector(state => state);
  const users = useSelector(state => state.users);
  const com = useSelector(state => state.com);
  const service = useSelector(state => state.service);
  const stdDate = useSelector(state => state.stdDate);
  const account = useSelector(state => state.account);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const [stdYear, stdMonth] = stdDate.split("-");
  const {
    userList, billingDt, preview, dtKey, contactsDt, setContactsDt, setSnack, disabled,
    specialRowLength, specialStateDate
  } = props;
  const sheetRefs = useRef([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [sendingUid, setSendingUid] = useState(null);
  const [sentUids, setSentUids] = useState([]);
  const [sendErrorUids, setSendErrorUids] = useState([]);

  const cancelRef = useRef(false);

  // 請求書帳票設定
  const setting = com?.ext?.reportsSetting?.invoice ?? com?.etc?.configReports?.invoice ?? {};
  const adjustedUsers = users.filter(user => {
    // ユーザーリストにないデータは場合は対象外
    if(!userList.find(f => f.uid === user.uid)) return false;
    // ユーザーリストでチェックにないデータは場合は対象外
    if(!userList.find(f => f.uid === user.uid).checked) return false;
    // サービスが含まれていないユーザーは場合は対象外
    if(service!=="" && !new RegExp(service).test(user.service)) return false;
    const bDt = billingDt.find(f => f.UID === `UID${user.uid}`);
    // 連絡帳利用者か？
    if(!user.faptoken && !user.pmail) return false;
    // 請求データがない場合は対象外
    if(!bDt) return false;
    const grandTotal = (bDt?.actualCostDetail ?? []).reduce((prevTotal, dt) => {
      prevTotal += dt.price;
      return prevTotal;
    }, bDt.kanrikekkagaku - null2Zero(bDt.jichiJosei));
    // 「請求額がない利用者も印刷」設定がオフの時は、請求額がない場合表示しない。 
    if(!setting.doPrintBilling && !grandTotal) return false;
    // 請求額がないかつ「利用なし利用者も印刷」設定がオフの時は、出欠席回数が0の時は表示しない。
    if (!grandTotal && !setting.doPrintSchedule && !(bDt.countOfUse + bDt.countOfKesseki)) return false;
    return true;
  }).sort((userA, userB) => {
    return userA.sindex - userB.sindex;
  });

  const sheets = adjustedUsers.map((user, i) => {
    const bDt = billingDt.find(f => f.UID === `UID${user.uid}`);
    const oneProps = {
      thisBdt: bDt, userList, users, stdDate, com, service, preview,
      specialRowLength, specialStateDate
    };
    return(
      <InvoiceWrapper
        {...oneProps} key={`${dtKey}${i}`}
        ref={(el) => (sheetRefs.current[i] = el)}
      />
    ) 
  });

  const handleClose = () => {
    setIsSending(false);
    setSendingUid(null);
    setSentUids([]);
  }

  const handleClick = async() => {
    try{
      const elements = sheetRefs.current ?? [];
      const newContactDts = JSON.parse(JSON.stringify(contactsDt));
      let isError = false;
      for(const [index, element] of elements.entries()){
        if(!element) continue;
        if(cancelRef.current){
          handleClose();
          break;
        }
        while(sendingUid!==null){
          await new Promise((resolve) => setTimeout(resolve, 500)); // 0.5秒待つ
          continue;
        }
        const user = adjustedUsers[index];
        
        const uidStr = "UID" + user.uid;
        if(!newContactDts[uidStr]) newContactDts[uidStr] = {};
        const newContactDt = newContactDts[uidStr];
        if(!newContactDt[dtKey]) newContactDt[dtKey] = {};

        setSendingUid(user.uid);
        const res = await sendPdf(stdYear, stdMonth, user, com, element, preview, 0, "a4");
        const pdfUrl = res[0];

        if(checkCntbkLineUser(user, com)){
          // LINE送信
          const bname = (com.sbname ?? com.bname).slice(0, 20);
          const name = (user.name ?? "お子").slice(0, 15);
          const lineId = user?.ext?.line?.id;
          const text = "いつもご利用いただきありがとうございます。\n"
            + `${bname}から${preview}が発行されました。\n`
            + `${name} さま\n`
            + `${stdYear}年${stdMonth}月ご利用分`
          const body = {
            message: "LINEメッセージ", lineId, hid, bid,
            altText: `${preview}が発行されました`, text, label: `${preview}確認`, url: encodeURI(pdfUrl)
          };
          const headers = {
            'Content-Type': 'application/json'
          };
          const lineRes = await axios.post("https://asia-northeast1-albatross-432004.cloudfunctions.net/sendLineButtonMessage", body, {headers})
          if(lineRes.status !== 200){
            newContactDt[dtKey].error = true;
            setSendErrorUids(prevUids => ([...prevUids, user.uid]));
            isError = true;
          }else{
            newContactDt[dtKey].error = false;
            setSentUids(prevUids => ([...prevUids, user.uid]));
          }
          newContactDt[dtKey].line = true;
          setSendingUid(null);
        }else{
          // メール送信
          const mailTitle = `${com.sbname} ${preview}${stdYear}年${stdMonth}月 Albtross for family`;
          const contents = makeCntbkReportHtmlMailString(preview, pdfUrl, user, com, stdDate);
          const mailRes = await sendFapMail(user, account, mailTitle, contents, com, "noreply", [encodeURI(pdfUrl)]);
          if(!mailRes){
            newContactDt[dtKey].error = true;
            setSendErrorUids(prevUids => ([...prevUids, user.uid]));
            isError = true;
          }else{
            newContactDt[dtKey].error = false;
            setSentUids(prevUids => ([...prevUids, user.uid]));
          }
          newContactDt[dtKey].mail = true;
          setSendingUid(null);
        }
        const bDt = billingDt.find(f => f.UID === `UID${user.uid}`);
        let totalPrice = 0;
        const futangaku = bDt.kanrikekkagaku - null2Zero(bDt.jichiJosei);
        const price = parseInt(futangaku);
        totalPrice += !isNaN(parseInt(price)) ?parseInt(price) :0;
        bDt.actualCostDetail.forEach(actualCostDt => {
          const actualPrice = !isNaN(parseInt(actualCostDt.price)) ?parseInt(actualCostDt.price) :0;
          totalPrice += actualPrice;
        });
        newContactDt[dtKey].totalPrice = totalPrice;
        newContactDt[dtKey].pdfUrl = pdfUrl;
        if(!newContactDt.timestamps) newContactDt.timestamps = {};
        newContactDt.timestamps[dtKey] = new Date().getTime();
        const sendContactsRes = await sendContacts({[uidStr]: newContactDt}, allState);
        if(!sendContactsRes){
          console.log(`${dtKey}タイムスタンプ書き込み失敗`);
          throw new Error("pushLineMessageError");
        }
      }
      setContactsDt(newContactDts);
      if(!cancelRef.current){
        if(isError){
          setSnack({msg: "一部送信できなかった利用者がいます。", severity: 'warning', id: new Date().getTime()});
        }else{
          setSnack({msg: "送信完了", id: new Date().getTime()});
        }
      }else {
        setSnack({msg: "キャンセルしました。", severity:'secondary', id: new Date().getTime()});
        cancelRef.current = false;
      }
    }catch(error){
      setSnack({msg: "予期せぬエラーが発生しました。", severity:'error', errorId:'CNB398'});
    }
  }

  const sendedTimestamp = Object.keys(contactsDt).reduce((result, uidStr) => {
    if(!(/^UID[0-9]+?$/.test(uidStr) && users.some(user => "UID"+user.uid === uidStr))) return result;
    const timestamp = contactsDt[uidStr]?.timestamps?.[dtKey];
    if(!timestamp) return result;
    if(!isNaN(new Date(timestamp).getTime())){
      if(!result){
        result = timestamp;
      }else if(result < timestamp){
        result = timestamp;
      }
    }
    return result;
  }, null);
  const sendedCount = Object.keys(contactsDt).reduce((result, uidStr) =>{
    if(!/^UID[0-9]+?$/.test(uidStr)) return result;
    const timestamp = contactsDt[uidStr]?.timestamps?.[dtKey];
    if(timestamp) result++;
    return result;
  }, 0);
  const sendedJudgProps = {timestamp: sendedTimestamp, count: sendedCount, option: 'sent'};

  const yesnoDialogProps = {
    open: dialogOpen, setOpen: setDialogOpen, handleConfirm: (() => setIsSending(true)),
    prms: {
      title: "確認",
      message: (
        `${stdYear}年${stdMonth}月分の${preview}を${adjustedUsers.length}人の利用者へ送信します。\n`
        + "請求金額がない利用者には送信されません。\n"
        + "よろしいですか？\n"
      )
    }
  }
  return(
    <>
    <div>
      <div style={{marginBottom: 4}}>
        <SendedJudg {...sendedJudgProps} />
      </div>
      <SendButton
        label={`${preview} 送信`}
        onClick={() => setDialogOpen(true)}
        disabled={disabled}
      />
    </div>
    <YesNoDialog {...yesnoDialogProps} />
    <div style={{display: 'none'}}>{sheets}</div>
    <SendingDialog
      isSending={isSending} sendProgress={(cancel) => handleClick(cancel)}
      sendingUid={sendingUid} sentUids={sentUids} targetUsers={adjustedUsers}
      sendErrorUids={sendErrorUids}
      open={isSending} onClose={handleClose}
      cancelRef={cancelRef}
    />
    </>
  )
}

const NoticeForm = (props) => {
  const dispatch = useDispatch();
  const com = useSelector(state => state.com);
  const stdDate = useSelector(state => state.stdDate);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const classes = useStyles();
  const {dtKey, style, setSnack} = props;
  const label = dtKey==="notice" ?"請求書" :dtKey==="notice2" ?"受領書・領収書" :"";
  const initNotice = com?.ext?.reportsSetting?.invoice?.[dtKey] ?? com?.etc?.reports?.invoice?.[dtKey] ?? "";
  const [notice, setNotice] = useState(initNotice);

  /*書き込みボタンの処理*/
  const handleSubmit = async() => {
    const comExt = {...com.ext};
    if(!comExt.reportsSetting) comExt.reportsSetting = {};
    if(!comExt.reportsSetting.invoice) comExt.reportsSetting.invoice = {};
    comExt.reportsSetting.invoice[dtKey] = lfToBr(notice);
    const params = {
      a: 'sendComExt', hid, bid,
      ext: JSON.stringify(comExt)
    }
    try{
      const res = await univApiCall(params);
      if(!res?.data?.result){
        setSnack({msg: '設定に失敗しました。', severity: 'warning', id: new Date().getTime()});
        return;
      }
      dispatch(setStore({com: {...com, ext: comExt}}));
      dispatch(setSnackMsg('設定しました。'));
    }catch(error){
      setSnack({msg: '設定に失敗しました。', severity: 'warning', id: new Date().getTime()});
    }
  }

  return(
    <div className={classes.NoticeForm} style={{...style}}>
      <AlbHMuiTextField
        variant="outlined"
        label={`${label}コメント`}
        multiline minRows={2} rows={2}
        value={brtoLf(notice)}
        width="100%"
        onChange={e => setNotice(e.target.value)}
      />
      <div className='buttons'>
        <Button
          className='cancelButton'
          variant='contained'
          onClick={() => setNotice(initNotice)}
        >
          キャンセル
        </Button>
        <Button
          className='submitButton'
          variant='contained' color="primary"
          onClick={handleSubmit}
        >
          設定
        </Button>
      </div>
    </div>
  )
}

const ProxyReceiptWrapper = forwardRef((props, ref) => {
  const classes = useStyles();
  const {specialStateDate} = props;
  const now = new Date();
  const stateDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return(
    <div ref={ref} className={classes.ProxyReceiptWrapper}>
      <TuusyokyuuhuMeisaiOne {...props} specialStateDate={specialStateDate || stateDate} />
    </div>
  );
});
const TokyoProxyReceiptWrapper = forwardRef((props, ref) => {
  const classes = useStyles();
  const {specialStateDate} = props;
  const now = new Date();
  const stateDate = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return(
    <div ref={ref} className={classes.InvoiceWrapper}>
      <TokyoDairiTsuchiOne {...props} specialStateDate={specialStateDate || stateDate} />
    </div>
  );
});
const ProxyReceiptButton = (props) => {
  const allState = useSelector(state => state);
  const users = useSelector(state => state.users);
  const com = useSelector(state => state.com);
  const service = useSelector(state => state.service);
  const stdDate = useSelector(state => state.stdDate);
  const account = useSelector(state => state.account);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const schedule = useSelector(state => state.schedule);
  const [stdYear, stdMonth] = stdDate.split("-");
  const {
    userList, billingDt, masterRec, preview, dtKey, contactsDt, setContactsDt, setSnack, disabled,
    specialStateDate
  } = props;
  const sheetRefs = useRef([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [sendingUid, setSendingUid] = useState(null);
  const [sentUids, setSentUids] = useState([]);
  const [sendErrorUids, setSendErrorUids] = useState([]);

  const cancelRef = useRef(false);

  const adjustedUsers = users.filter(user => {
    if(!user) return false;
    // ユーザーリストにないデータは場合は対象外
    if(!userList.find(f => f.uid === user.uid)) return false;
    // ユーザーリストでチェックにないデータは場合は対象外
    if(!userList.find(f => f.uid === user.uid).checked) return false;
    const bDt = billingDt.find(f => f.UID === `UID${user.uid}`);
    // 請求額なしはスキップ
    if (!bDt.tanniTotal) return false;
    return true;
  }).sort((userA, userB) => {
    return userA.sindex - userB.sindex;
  });

  const sheets = adjustedUsers.map((user, i) => {
    const bDt = billingDt.find(f => f.UID === `UID${user.uid}`);
    const kyodaiJogen = isKyoudaiJougen(billingDt, users, bDt.UID, schedule);
    if(preview === "代理受領通知書"){
      const oneProps = {
        bDt, masterRec, com, user, stdDate, kyodaiJogen, service, preview: "代理受領通知", schedule,
        specialStateDate
      }
      return(
        <ProxyReceiptWrapper
          {...oneProps} key={`invoice${i}`}
          ref={(el) => (sheetRefs.current[i] = el)}
        />
      ) 
    }else if(preview === "東京都形式代理受領通知書"){
      const oneProps = {
        e: bDt, users, com, stdDate, userList, specialStateDate
      }
      return(
        <TokyoProxyReceiptWrapper
          {...oneProps} key={`invoice${i}`}
          ref={(el) => (sheetRefs.current[i] = el)}
        />
      )
    }
    
  });

  const handleClose = () => {
    setIsSending(false);
    setSendingUid(null);
    setSentUids([]);
  }

  const handleClick = async() => {
    try{
      const elements = sheetRefs.current ?? [];
      const newContactDts = JSON.parse(JSON.stringify(contactsDt));
      let isError = false;
      for(const [index, element] of elements.entries()){
        if(!element) continue;
        if(cancelRef.current){
          handleClose();
          break;
        }
        while(sendingUid!==null){
          await new Promise((resolve) => setTimeout(resolve, 500)); // 0.5秒待つ
          continue;
        }
        const user = adjustedUsers[index];
        
        const uidStr = "UID" + user.uid;
        if(!newContactDts[uidStr]) newContactDts[uidStr] = {};
        const newContactDt = newContactDts[uidStr];
        if(!newContactDt[dtKey]) newContactDt[dtKey] = {};

        setSendingUid(user.uid);
        const format = preview === "代理受領通知書" ?"a3" :"a4";
        const res = await sendPdf(stdYear, stdMonth, user, com, element, preview, 2, format);
        const pdfUrl = res[0];
        if(checkCntbkLineUser(user, com)){
          // LINE送信
          const bname = (com.sbname ?? com.bname).slice(0, 20);
          const name = (user.name ?? "お子").slice(0, 15);
          const lineId = user?.ext?.line?.id;
          const text = "いつもご利用いただきありがとうございます。\n"
            + `${bname}から${preview}が発行されました。\n`
            + `${name} さま\n`
            + `${stdYear}年${stdMonth}月ご利用分`
          const body = {
            message: "LINEメッセージ", lineId, hid, bid,
            altText: `${preview}が発行されました`, text, label: `${preview}確認`, url: encodeURI(pdfUrl)
          };
          const headers = {
            'Content-Type': 'application/json'
          };
          const lineRes = await axios.post("https://asia-northeast1-albatross-432004.cloudfunctions.net/sendLineButtonMessage", body, {headers})
          if(!lineRes.status === 200){
            newContactDt[dtKey].error = true;
            setSendErrorUids(prevUids => ([...prevUids, user.uid]));
            isError = true;
          }else{
            newContactDt[dtKey].error = false;
            setSentUids(prevUids => ([...prevUids, user.uid]));
          }
          newContactDt[dtKey].line = true;
          setSendingUid(null);
        }else{
          // メール送信
          const mailTitle = `${com.sbname} ${preview}${stdYear}年${stdMonth}月 Albtross for family`;
          const contents = makeCntbkReportHtmlMailString(preview, pdfUrl, user, com, stdDate);
          const mailRes = await sendFapMail(user, account, mailTitle, contents, com, "noreply", [encodeURI(pdfUrl)]);
          if(!mailRes){
            newContactDt[dtKey].error = true;
            setSendErrorUids(prevUids => ([...prevUids, user.uid]));
            isError = true;
          }else{
            newContactDt[dtKey].error = false;
            setSentUids(prevUids => ([...prevUids, user.uid]));
          }
          newContactDt[dtKey].mail = true;
          setSendingUid(null);
        }
        const bDt = billingDt.find(f => f.UID === `UID${user.uid}`);
        let totalPrice = 0;
        const futangaku = bDt.kanrikekkagaku - null2Zero(bDt.jichiJosei);
        const price = parseInt(futangaku);
        totalPrice += !isNaN(parseInt(price)) ?parseInt(price) :0;
        bDt.actualCostDetail.forEach(actualCostDt => {
          const actualPrice = !isNaN(parseInt(actualCostDt.price)) ?parseInt(actualCostDt.price) :0;
          totalPrice += actualPrice;
        });
        newContactDt[dtKey].totalPrice = totalPrice;
        newContactDt[dtKey].pdfUrl = pdfUrl;
        newContactDt[dtKey].pdfUrl = pdfUrl;
        if(!newContactDt.timestamps) newContactDt.timestamps = {};
        newContactDt.timestamps[dtKey] = new Date().getTime();
        const sendContactsRes = await sendContacts({[uidStr]: newContactDt}, allState);
        if(!sendContactsRes){
          console.log(`${dtKey}タイムスタンプ書き込み失敗`);
          throw new Error("pushLineMessageError");
        }
      }
      setContactsDt(newContactDts);
      if(!cancelRef.current){
        if(isError){
          setSnack({msg: "一部送信できなかった利用者がいます。", severity: 'warning', id: new Date().getTime()});
        }else{
          setSnack({msg: "送信完了", id: new Date().getTime()});
        }
      }else {
        setSnack({msg: "キャンセルしました。", severity:'secondary', id: new Date().getTime()});
        cancelRef.current = false;
      }
    }catch(error){
      setSnack({msg: "予期せぬエラーが発生しました。", severity:'error', errorId:'CNB398'});
    }
  }

  const sendedTimestamp = Object.keys(contactsDt).reduce((result, uidStr) => {
    if(!(/^UID[0-9]+?$/.test(uidStr) && users.some(user => "UID"+user.uid === uidStr))) return result;
    const timestamp = contactsDt[uidStr]?.timestamps?.[dtKey];
    if(!timestamp) return result;
    if(!isNaN(new Date(timestamp).getTime())){
      if(!result){
        result = timestamp;
      }else if(result < timestamp){
        result = timestamp;
      }
    }
    return result;
  }, null);
  const sendedCount = Object.keys(contactsDt).reduce((result, uidStr) =>{
    if(!/^UID[0-9]+?$/.test(uidStr)) return result;
    const timestamp = contactsDt[uidStr]?.timestamps?.[dtKey];
    if(timestamp) result++;
    return result;
  }, 0);
  const sendedJudgProps = {timestamp: sendedTimestamp, count: sendedCount, option: 'sent'};

  const yesnoDialogProps = {
    open: dialogOpen, setOpen: setDialogOpen, handleConfirm: (() => setIsSending(true)),
    prms: {
      title: "確認",
      message: (
        `${stdYear}年${stdMonth}月分の${preview}を${adjustedUsers.length}人の利用者へ送信します。\n`
        + "請求金額がない利用者には送信されません。\n"
        + "よろしいですか？"
      )
    }
  }
  return(
    <>
    <div>
      <div style={{marginBottom: 4}}>
        <SendedJudg {...sendedJudgProps} />
      </div>
      <SendButton
        label={`${preview} 送信`}
        onClick={() => setDialogOpen(true)}
        disabled={disabled}
      />
    </div>
    <YesNoDialog {...yesnoDialogProps} />
    <div style={{display: 'none'}}>{sheets}</div>
    <SendingDialog
      isSending={isSending} sendProgress={(cancel) => handleClick(cancel)}
      sendingUid={sendingUid} sentUids={sentUids} targetUsers={adjustedUsers}
      sendErrorUids={sendErrorUids}
      open={isSending} onClose={handleClose}
      cancelRef={cancelRef}
    />
    </>
  )
}

const SentUserInfo = (props) => {
  const {timestamp, amount, sentType, error=false, pdfUrl, userName} = props;
  const dateObj = new Date(timestamp);
  const month = String(dateObj.getMonth()+1).padStart(2, '0');
  const date = String(dateObj.getDate()).padStart(2, '0');
  const hour = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const amountStr = amount.toLocaleString();

  return(
    <div className='row'>
      <div className='timestamp'>
        <span>{month}</span>
        <span className='delimiter'>/</span>
        <span style={{marginRight: 2}}>{date}</span>
        <span>{hour}</span>
        <span className='delimiter'>:</span>
        <span>{minutes}</span>
      </div>
      <div className='sentType' style={{display: 'flex', marginTop: 4}}>
        {sentType==="line" &&(
          <FontAwesomeIcon
            icon={faLine}
            style={{
              width: 24, height: 24,
              color: "#00B900",
            }}
          />
        )}
        {sentType==="mail" &&(<MailIcon style={{color: blue[800]}} />)}
      </div>
      <div className='userName'>{userName}</div>
      {!error &&<div className='amount'>¥{amountStr}</div>}
      {!error &&<div style={{marginTop: 0}}>
        <PdfCard url={encodeURI(pdfUrl)} noLabel />
      </div>}
      {error &&<div style={{color: red['A700']}}>送信失敗</div>}
    </div>
  )
}

const SentHistoryItem = (props) => {
  const {contactsDt={}, dtKey, users} = props;
  const items = Object.entries(contactsDt).filter(([uidStr, contactDt]) => {
    if(!/^UID\d+$/.test(uidStr)) return false;
    if(!checkValueType(contactDt, 'Object')) return false;
    if(!contactDt.timestamps?.[dtKey]) return false;
    const user = users.find(u => "UID"+u.uid === uidStr);
    if(!checkValueType(user, 'Object')) return false;
    return true;
  }).sort(([aUidStr, aContactDt], [bUidStr, bContactDt]) => {
    const aTimestamp = aContactDt.timestamps?.[dtKey];
    const bTimestamp = bContactDt.timestamps?.[dtKey];
    return aTimestamp < bTimestamp ?1 :-1;
  }).map(([uidStr, contactDt]) => {
    const user = users.find(uDt => "UID"+uDt.uid === uidStr);
    const dt = contactDt[dtKey] ?? {};
    const props = {
      timestamp: contactDt.timestamps[dtKey],
      amount: dt.totalPrice ?? "",
      sentType: dt.mail ?"mail" :dt.line ?"line" :null,
      error: dt.error,
      pdfUrl: dt.pdfUrl ?? "",
      userName: user.name
    }
    return (<SentUserInfo key={`${dtKey}${user.uid}`} {...props} />);
  });
  return items;
}

const SentHistory = (props) => {
  const users = useSelector(state => state.users);
  const classes = useStyles();
  const {contactsDt} = props;
  const [open, setOpen] = useState(false);

  const invoiceSentHistory = SentHistoryItem({contactsDt, dtKey: 'invoice', users});
  const invoiceWithTanniSentHistory = SentHistoryItem({contactsDt, dtKey: 'invoiceWithTanni', users});
  const proxyReceiptSentHistory = SentHistoryItem({contactsDt, dtKey: 'proxyReciept', users});
  const proxyReceiptTokyoSentHistory = SentHistoryItem({contactsDt, dtKey: 'proxyRecieptTokyo', users});
  const receiptSentHistory = SentHistoryItem({contactsDt, dtKey: 'receipt', users});
  const userReceiptSentHistory = SentHistoryItem({contactsDt, dtKey: 'userReceipt', users});

  const noSentHistory = !invoiceSentHistory.length && !invoiceWithTanniSentHistory.length && !proxyReceiptSentHistory.length && !proxyReceiptTokyoSentHistory.length && !receiptSentHistory.length;
  return(
    <div>
      {!open &&(
        <Button
          color="primary"
          onClick={() => setOpen(true)}
          startIcon={<AssignmentIcon />}
          style={{width: '100%'}}
          disabled={noSentHistory}
        >
          送信済み確認
        </Button>
      )}
      {open &&(
        <div className={classes.sentUserList}>
          {invoiceSentHistory.length>=1 &&(
            <div className='contents'>
              <div className='title'>請求書<span>{invoiceSentHistory.length}件</span></div>
              {invoiceSentHistory}
            </div>
          )}
          {invoiceWithTanniSentHistory.length>=1 &&(
            <div className='contents'>
              <div className='title'>請求書単位明細付<span>{invoiceWithTanniSentHistory.length}件</span></div>
              {invoiceWithTanniSentHistory}
            </div>
          )}
          {proxyReceiptSentHistory.length>=1 &&(
            <div className='contents'>
              <div className='title'>代理受領通知書<span>{proxyReceiptSentHistory.length}件</span></div>
              {proxyReceiptSentHistory}
            </div>
          )}
          {proxyReceiptTokyoSentHistory.length>=1 &&(
            <div className='contents'>
              <div className='title'>東京都形式代理受領通知書<span>{proxyReceiptTokyoSentHistory.length}件</span></div>
              {proxyReceiptTokyoSentHistory}
            </div>
          )}
          {receiptSentHistory.length>=1 &&(
            <div className='contents'>
              <div className='title'>受領書<span>{receiptSentHistory.length}件</span></div>
              {receiptSentHistory}
            </div>
          )}
          {userReceiptSentHistory.length>=1 &&(
            <div className='contents'>
              <div className='title'>領収書<span>{userReceiptSentHistory.length}件</span></div>
              {userReceiptSentHistory}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const CntbkSendReports = () => {
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const {users, service, classroom, stdDate, hid, bid, schedule, com, serviceItems} = allState;
  const classes = useStyles();
  const [userList, setUserList] = useState([]);
  const [userListDialogOpen, setUserListDialogOpen] = useState(false);
  const [snack, setSnack] = useState({});

  const [contactsDt, setContactsDt] = useState(null);
  useEffect(() => {
    if(!hid || !bid || !stdDate) return;
    let isMounted = true;
    fetchContacts(hid, bid, stdDate, null, null, setSnack).then(newContacts => {
      if (isMounted) setContactsDt(newContacts);
    });
    return () => {
      isMounted = false;
    };
  }, [hid, bid, stdDate]);

  const [invoiceOption, setInvoiceOption] = useSessionStorageState("nomal", "cntbkReportsInvoiceOption");
  const [proxyReceiptOption, setProxyReceiptOption] = useSessionStorageState("nomal", "cntbkReportsProxyReceiptOption");
  const [receiptOption, setReceiptOption] = useSessionStorageState("nomal", "cntbkReportsReceiptOption");

  useEffect(() => {
    if(!loadingStatus.loaded) return;
    const billingParams = { stdDate, schedule, users, com, service, serviceItems, calledBy: "Invoice" };
    const { billingDt } = setBillInfoToSch(billingParams);
    const filteredUsers = getFilteredUsers(users, service, classroom);
    const adjustedUsers = filteredUsers.filter(user => {
      // faptokenがない場合は対象外
      if(!user.faptoken) return false;
      // 送受信設定がOFFの場合は対象外
      if(user?.ext?.contactBookEnable === false) return false;
      // メールアドレスとLINEIDが両方ない場合は対象外
      if(!user.pmail && !user.ext?.line?.id) return false;

      const bDt = billingDt.find(f => f.UID === `UID${user.uid}`);
      // 請求データがない場合は対象外
      if(!bDt) return false;
      return true;
    }).sort((userA, userB) => {
      return userA.sindex - userB.sindex;
    });
    const newUserList = adjustedUsers.map(user => ({"uid": user.uid, "checked": true}));
    setUserList(newUserList);
  }, [loadingStatus.loaded]);

  if(!loadingStatus.loaded || !contactsDt) return(
    <>
    <CntbkLinksTab />
    <LoadingSpinner />
    <SnackMsg {...snack} />
    </>
  );
  const [stdYear, stdMonth] = stdDate.split("-");
  const billingParams = { stdDate, schedule, users, com, service, serviceItems, calledBy: "Invoice" };
  const { billingDt, masterRec } = setBillInfoToSch(billingParams);
  const seikyuuDisabled = new Date().getTime() < new Date(stdYear, (stdMonth-1)+1, 10).getTime();
  const proxyReceiptDisabled = new Date().getTime() < new Date(stdYear, (stdMonth-1)+2, 10).getTime();
  const receiptDisabled = new Date().getTime() < new Date(stdYear, (stdMonth-1)+2, 10).getTime();
  const nextMonth = stdMonth === "12" ? "01" : ("0" + (parseInt(stdMonth, 10) + 1)).slice(-2);
  const nextAfterMonth = nextMonth === "12" ? "01" : ("0" + (parseInt(nextMonth, 10) + 1)).slice(-2);
  return(
    <>
    <CntbkLinksTab />
    <UserSelectDialogWithButton
      userList={userList} setUserList={setUserList}
      open={userListDialogOpen} setOpen={setUserListDialogOpen}
      lsName="userlistCntbkSendReports"
    />
    <div className={classes.AppPage}>
      <div style={{marginBottom: '32px'}}>
        <InvoiceButton
          userList={userList} billingDt={billingDt}
          preview={invoiceOption==="tanni" ?"請求書単位明細付" :"請求書"}
          dtKey={invoiceOption==="tanni" ?"invoiceWithTanni" :"invoice"}
          contactsDt={contactsDt} setContactsDt={setContactsDt}
          setSnack={setSnack}
          disabled={seikyuuDisabled}
          specialRowLength={5}
          specialStateDate={sessionStorage.getItem(`CntbkReportDate-invoice`)}
        />
        {seikyuuDisabled &&(
          <div style={{color: red[700], paddingTop: 8, fontSize: '.8rem'}}>
            請求書送信は{nextMonth}月10日以降になります。
          </div>
        )}

        <div style={{paddingLeft: 14}}>
          <FormControlLabel
            control={
              <Checkbox
                color='primary'
                checked={invoiceOption==="tanni"}
                onChange={() => setInvoiceOption(prevValue => prevValue==="tanni" ?"nomal" :"tanni")}
              />
            }
            label="単位明細付き"
          />
        </div>
        <ReportDateForm item="invoice" setSnack={setSnack} />
        <NoticeForm dtKey="notice" style={{marginTop: 8}} setSnack={setSnack}/>
      </div>
      <div style={{marginBottom: '32px'}}>
        <ProxyReceiptButton
          userList={userList} billingDt={billingDt} masterRec={masterRec}
          preview={proxyReceiptOption==="tokyo" ?"東京都形式代理受領通知書" :"代理受領通知書"}
          dtKey={proxyReceiptOption==="tokyo" ?"proxyRecieptTokyo" :"proxyReciept"}
          contactsDt={contactsDt} setContactsDt={setContactsDt}
          setSnack={setSnack}
          disabled={proxyReceiptDisabled}
          specialStateDate={sessionStorage.getItem(`CntbkReportDate-proxyReceipt`)}
        />
        {proxyReceiptDisabled &&(
          <div style={{color: red[700], paddingTop: 8, fontSize: '.8rem'}}>
            代理受領通知書送信は{nextAfterMonth}月10日以降になります。
          </div>
        )}
        <div style={{paddingLeft: 14}}>
          <FormControlLabel
            control={
              <Checkbox
                color='primary'
                checked={proxyReceiptOption==="tokyo"}
                onChange={() => setProxyReceiptOption(prevValue => prevValue==="tokyo" ?"nomal" :"tokyo")}
              />
            }
            label="東京都形式"
          />
        </div>
        <ReportDateForm item="proxyReceipt" setSnack={setSnack} />
      </div>
      <div style={{marginBottom: '32px'}}>
        <InvoiceButton
          userList={userList} billingDt={billingDt}
          preview={receiptOption==="userReceipt" ?"領収書" :"受領書"}
          dtKey={receiptOption==="userReceipt" ?"userReceipt" :"receipt"}
          contactsDt={contactsDt} setContactsDt={setContactsDt}
          setSnack={setSnack}
          disabled={receiptDisabled}
          specialStateDate={sessionStorage.getItem(`CntbkReportDate-receipt`)}
        />
        {receiptDisabled &&(
          <div style={{color: red[700], paddingTop: 8, fontSize: '.8rem'}}>
            {receiptOption==="userReceipt" ?"領収書" :"受領書"}送信は{nextAfterMonth}月10日以降になります。
          </div>
        )}
        <div style={{paddingLeft: 14}}>
          <FormControlLabel
            control={
              <Checkbox
                color='primary'
                checked={receiptOption==="userReceipt"}
                onChange={() => setReceiptOption(prevValue => prevValue==="userReceipt" ?"nomal" :"userReceipt")}
              />
            }
            label="領収書"
          />
        </div>
        <ReportDateForm item="receipt" setSnack={setSnack} />
        <NoticeForm dtKey="notice2" style={{marginTop: 20}} setSnack={setSnack}/>
      </div>
      <SentHistory contactsDt={contactsDt} />
    </div>
    <SnackMsg {...snack} />
    </>
  )
}
export default CntbkSendReports;