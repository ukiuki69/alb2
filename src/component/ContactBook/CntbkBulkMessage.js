import { Button, Collapse, Divider, List, ListItem, ListItemIcon, ListItemText, makeStyles } from '@material-ui/core';
import { blue, red, teal, yellow } from '@material-ui/core/colors';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { isClassroom, isService, univApiCall } from '../../albCommonModule';
import { brtoLf, formatDate, getLodingStatus, randomStr } from '../../commonModule';
import { LoadErr, LoadingSpinner } from '../common/commonParts';
import SnackMsg from '../common/SnackMsg';
import { AlbHMuiTextField, PdfCard } from '../common/HashimotoComponents';
import { AddedImgs, CntbkButton, CntbkCancelButton, CntbkFileAttachmentButton, CntbkLinksTab, checkCntbkLineUser, SavedMiniImgs, sendImgs, sendPdfs, fetchContacts } from './CntbkCommon';
import { checkValueType } from '../dailyReport/DailyReportCommon';
import UserSelectDialogWithButton from '../common/UserSelectDialogWithButton';
import DoneIcon from '@material-ui/icons/Done';
import WarningIcon from '@material-ui/icons/Warning';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import MailOutlineIcon from '@material-ui/icons/MailOutline';
import PictureAsPdfIcon from '@material-ui/icons/PictureAsPdf';
import ImageIcon from '@material-ui/icons/Image';
import QueryBuilderIcon from '@material-ui/icons/QueryBuilder';
import { faLine } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useGetHeaderHeight } from '../common/Header';
import BlockIcon from '@material-ui/icons/Block';

const SIDEBAR_WIDTH = 61.25;
const API_CALL_COUNTLIMIT = 5;
const TEXT_LIMIT = 600;

// スナックメッセージステート用コンテキスト
const SnackContext = createContext(null);

const useStyles = makeStyles((theme) => ({
  AppPage: {
    width: '95vw', maxWidth: '960px',
    margin: `114px auto`,
    "@media (min-width: 1080px)": {
      paddingLeft: SIDEBAR_WIDTH,
    },
    "@media (max-width: 500px)": {
      marginTop: '160px'
    },
  },
  MainForm: {
    '& .pdfs': {
      '& > div': {marginBottom: '8px'}
    },
    '& .caution': {
      textAlign: 'end', color: red["A700"], marginBottom: '8px'
    },
    '& .buttons': {
      textAlign: 'end',
      '& > *:not(:last-child)': { marginRight: '8px' }
    }
  },
  Archives: {
    marginTop: 32,
    '& .title': {
      backgroundColor: teal[800], color: '#fff',
      padding: '8px 16px',
    },
    '& .wait': { 
      backgroundColor: yellow[50],
      '& .icon': {color: yellow[800]}
    },
    '& .cancel': { 
      backgroundColor: blue[50],
      '& .icon': {color: blue[800]}
    },
    '& .sent': { 
      backgroundColor: teal[50],
      '& .icon': {color: teal[800]}
    },
    '& .error': { 
      backgroundColor: red[50],
      '& .icon': {color: red[800]}
    },
    '& .icon': {fontSize: '32px'},
    '& .userListItem': {
      paddingLeft: theme.spacing(4),
      '& .line.icon': {color: '#00B900'},
      '& .mail.icon': {color: blue[800], marginRight: '-2px'}
    },
    '& .status': {
      '& > span:not(:last-child)': {marginRight: 8}
    },
    '& .about': {
      wordBreak: "break-all",
      overflow: "hidden",
      display: "-webkit-box",
      textOverflow: "ellipsis",
      "-webkit-box-orient": "vertical",
      "-webkit-line-clamp": 2,
    }
  },
  ArchiveContents: {
    flexDirection: 'column', alignItems: 'flex-start',
    '& > *:not(:last-child)': {marginBottom: '8px'},
    '& .message': {
      fontSize: '14px', lineHeight: '1.4rem',
      whiteSpace: 'pre-wrap'
    },
    '& .images': {
      marginTop: '8px'
    },
    '& .pdfs': {
      maxWidth: '100%',
      '& > *:not(:last-child)': {
        marginBottom: '8px',
      }
    }
  },
  CancelSenndingButton: {
    '& .button': {
      color: '#fff',
      backgroundColor: '#f44336',
      '&:hover': {backgroundColor: '#d32f2f'}
    }
  }
}));

const MainForm = (props) => {
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const [stdYear, stdMonth] = stdDate.split("-").map(Number);
  const com = useSelector(state => state.com);
  const jino = com.jino;
  const service = useSelector(state => state.service);
  const classroom = useSelector(state => state.classroom);
  const {setSnack} = useContext(SnackContext);
  const classes = useStyles();
  const {setBulkMessages, userList} = props;
  const [message, setMessage] = useState("");
  const [images, setImages] = useState([]);
  const [pdfs, setPdfs] = useState([]);
  const [error, setError] = useState(false);
  const [helperText, setHelperText] = useState("");

  const handleChangeText = (e) => {
    const value = e.target.value;
    if(value.length > TEXT_LIMIT){
      setError(true);
      setHelperText(`${TEXT_LIMIT}文字以下で入力してください。（絵文字は4文字相当）`);
      return;
    }
    setError(false);
    setHelperText("");
    setMessage(e.target.value)
  }

  const handleClear = () => {
    setMessage("");
    setImages([]);
    setPdfs([]);
    setError(false);
    setHelperText("");
  }

  const handleSubmit = async() => {
    if(new Date().getTime() >= new Date(stdYear, stdMonth, 0, 23)){
      setSnack({msg: `${stdMonth}月分の一斉連絡は締め切りました。`, severity: 'warning'});
      setError(true);
      setHelperText("");
      return;
    }
    if(!message && !images.length && !pdfs.length){
      setSnack({msg: `未入力のため送信できません。`, severity: 'warning', id: new Date().getTime()});
      return;
    }
    // 画像送信処理
    const sendImgsRes = await sendImgs(images, jino, randomStr(8), setSnack);
    if(!sendImgsRes) return;
    const imageUrls = sendImgsRes.photos;
    const thumbnailUrls = sendImgsRes.thumbnails;
    // PDF送信処理
    const sendPdfsRes = await sendPdfs(pdfs, "contactbookimg");
    if(!sendPdfsRes){
      setSnack({msg: '送信に失敗しました。', severity: 'warning'});
      return;
    }
    const pdfUrls = sendPdfsRes;
    const targetUids = userList.filter(u => u.checked).map(u => u.uid);
    const newDt = {
      message, imageUrls, thumbnailUrls, pdfUrls, targetUids,
      sent: false, timestamp: new Date().getTime(),
      service, classroom
    };
    const params = {
      a: "sendDtUnderUidOfContact", hid, bid, date: stdDate, uid: "bulkMessages",
      content: JSON.stringify([newDt])
    };
    for(let apiCallCnt=0; apiCallCnt<API_CALL_COUNTLIMIT; apiCallCnt++){
      try{
        const res = await univApiCall(params);
        if(!res?.data?.result) continue;
        setSnack({msg: "送信しました。"});
        setBulkMessages(prevBulkMessages => ([newDt, ...prevBulkMessages]));
        handleClear();
        break;
      }catch(error){
        if(apiCallCnt+1 < API_CALL_COUNTLIMIT) continue;
        setSnack({msg: '失敗しました。', severity: 'warning'});
      }
    }
  }

  const pdfCards = pdfs.map((pdf, i) => {
    const handleDelete = () => {
      setPdfs(prevPdfs => {
        const newPdfs = [...prevPdfs];
        newPdfs.splice(i, 1);
        return newPdfs
      });
    }
    return(<PdfCard pdf={pdf} onDelete={handleDelete} />)
  });

  const lastDate = new Date(stdYear, stdMonth, 0).getDate();
  const now = new Date();
  const nowDate = now.getDate();
  const timeLimit = new Date(stdYear, stdMonth, 0, 23).getTime();
  const nowTime = now.getTime();
  return(
    <div className={classes.MainForm}>
      <form>
        <AlbHMuiTextField
          value={message} onChange={handleChangeText}
          variant="outlined" width="100%"
          multiline minRows={5}
          style={{marginBottom: '8px'}}
          error={error} helperText={helperText}
        />
        <AddedImgs addImgs={images} setAddImgs={setImages} />
        <div className='pdfs'>{pdfCards}</div>
        {(lastDate===nowDate && timeLimit>nowTime) &&<div className='caution'>23時以降は送信できなくなります。</div>}
        {timeLimit<=nowTime &&<div className='caution'>{stdMonth}月分の一斉連絡は締め切りました。</div>}
        <div className='buttons'>
          <CntbkCancelButton handleClick={handleClear} />
          <CntbkFileAttachmentButton setImages={setImages} setPdfs={setPdfs} disabled={error || timeLimit<=nowTime} />
          <CntbkButton label="送信" color="primary" onClick={handleSubmit} disabled={error || timeLimit<=nowTime} />
        </div>
      </form>
    </div>
  )
}

const CancelSenndingButton = (props) => {
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const {setSnack} = useContext(SnackContext);
  const classes = useStyles();
  const {messageDt, statusClassName, bulkMessages, setBulkMessages} = props;
  const timestamp = messageDt?.timestamp;
  if(!timestamp || messageDt.cancel || messageDt.sent || new Date().getTime()-timestamp > 25*60*1000) return null;
  const handleClick = async() => {
    const sendDt = bulkMessages.map(dt => {
      if(JSON.stringify(dt) !== JSON.stringify(messageDt)) return dt;
      const newDt = JSON.parse(JSON.stringify(dt));
      newDt.cancel = true;
      newDt.timestamp = new Date().getTime();
      return newDt;
    }).sort((a, b) => a.timestamp < b.timestamp ?1 :-1);
    const params = {
      a: "sendPartOfContact", hid, bid, date: stdDate,
      partOfContact: JSON.stringify({bulkMessages: sendDt})
    };
    const res = await univApiCall(params);
    if(res?.data?.result){
      setBulkMessages(sendDt);
      setSnack({msg: '送信取り消しました。'});
    }else{
      setSnack({msg: '一時保存に失敗しました。', severity: 'warning'});
    }
  }
  const timelimit = new Date(timestamp+25*60*1000);
  return(
    <ListItem className={`${classes.ArchiveContents} ${classes.CancelSenndingButton} ${statusClassName}`}>
      <div>
        {String(timelimit.getHours()).padStart(2, '0')}:{String(timelimit.getMinutes()).padStart(2, '0')}まで送信を取り消すことができます。
      </div>
      <div style={{width: '100%', textAlign: 'center'}}>
        <Button
          className='button'
          variant='contained'
          onClick={handleClick}
        >
          送信取り消し
        </Button>
      </div>
    </ListItem>
  )
};

const ArchiveContents = ({messageDt, statusClassName}) => {
  const classes = useStyles();

  const thumbnails = messageDt.thumbnailUrls ?? [];
  const pdfUrls = messageDt.pdfUrls ?? [];
  return(
    <ListItem className={`${classes.ArchiveContents} ${statusClassName}`}>
      {Boolean(messageDt.message) &&<div className='message'>{brtoLf(messageDt.message)}</div>}
      {thumbnails.length>0 &&<div className='images'>
        <SavedMiniImgs thumbnails={thumbnails} />
      </div>}
      {pdfUrls.length>0 &&<div className='pdfs'>
        {pdfUrls.map((url, i) => <PdfCard key={`PdfCard${messageDt.timestamp}-${i}`} url={url} style={{maxWidth: '100%'}} />)}
      </div>}
    </ListItem>
  )
}

const ArchiveListItems = (props) => {
  const com = useSelector(state => state.com);
  const users = useSelector(state => state.users);
  const {messageDt, bulkMessages, setBulkMessages} = props;
  const [open, setOpen] = useState(false);

  const userResultsPerSentTo = (messageDt.targetUids ?? []).reduce((userResultsPerSentTo, uid) => {
    const user = users.find(prevUser => prevUser.uid === uid);
    if(!user) return userResultsPerSentTo;
    const result = (messageDt.results ?? []).find(prevResult => prevResult.uid===uid) ?? {uid};
    let to = null;
    if(checkCntbkLineUser(user, com)){
      to = user?.ext?.line?.id;
    }else{
      to = user?.pmail;
    }
    if(!userResultsPerSentTo[to]) userResultsPerSentTo[to] = [];
    userResultsPerSentTo[to].push(result);
    return userResultsPerSentTo;
  }, {});
  const userResults = Object.values(userResultsPerSentTo).map((results, i) => {
    const user = users.find(prevUser => prevUser.uid === results[0].uid);
    const result = results[0] ?? {};
    const isSent = result.sent ?? false;
    const isError = result.error ?? false;
    const type = result.type ?? (user?.ext?.line?.id ?"line" :"mail");
    const statusClassName = (() => {
      if(messageDt.cancel) return "cancel";
      if(messageDt.sent){
        if(isSent) return "sent";
        return "error";
      }
      if(isError) return "error";
      return "wait"
    })();
    const pname = user?.pname ?? "親氏名";
    const names = results.map(result => (users.find(prevUser => prevUser.uid === result.uid)?.name ?? "名前未登録"))
    return(
      <React.Fragment key={`UserListItem${messageDt.timestamp}-${i}`}>
      <ListItem className={`userListItem ${statusClassName}`}>
        <ListItemText
          primary={`${pname}（${names.join("　")}）`}
          style={{marginLeft: '-16px'}}
        />
        {type==="line" &&<FontAwesomeIcon className='line icon' icon={faLine} />}
        {type==="mail" &&<MailOutlineIcon className='mail icon' />}
      </ListItem>
      <Divider />
      </React.Fragment>
    )
  });
  const waitCnt = Object.values(userResultsPerSentTo).length;
  const successCnt = Object.values(userResultsPerSentTo).reduce((prevCnt, results) => results?.[0]?.sent ?prevCnt+1 :prevCnt, 0);
  const errorCnt = Object.values(userResultsPerSentTo).reduce((prevCnt, results) => !results?.[0]?.sent || results?.[0]?.error ?prevCnt+1 :prevCnt, 0);
  const cancelCnt = Object.values(userResultsPerSentTo).length;

  const isError = Object.values(userResultsPerSentTo).some(results => {
    if(messageDt.cancel) return false;
    if(!messageDt.sent) return false;
    const result = results[0];
    return result.error || !result.sent
  });
  const formatedDate = formatDate(new Date(messageDt.timestamp), "YYYY/MM/DD hh:mm:ss");
  const statusClassName = messageDt.cancel ?"cancel" :!messageDt.sent ?"wait" :!isError ?"sent" :"error";
  return(
    <>
    <ListItem className={`listItemButton ${statusClassName}`} button onClick={() => setOpen(prevOpen => !prevOpen)}>
      <ListItemIcon>
        {messageDt.cancel &&<BlockIcon className='icon' />}
        {(!messageDt.cancel && !messageDt.sent) &&<QueryBuilderIcon className='icon' />}
        {(!messageDt.cancel && messageDt.sent && !isError) &&<DoneIcon className='icon' />}
        {(!messageDt.cancel && messageDt.sent && isError) &&<WarningIcon className='icon' />}
      </ListItemIcon>
      <ListItemText
        primary={(<>
          {`${messageDt.cancel ?"送信取り消し" :!messageDt.sent ?"送信待ち" :!isError ?"送信済み" :"一部送信失敗"} ${formatedDate}`}
          <div className='status' style={{fontSize: 14}}>
            {(!messageDt.cancel && !messageDt.sent && waitCnt>0) &&<span>待ち{waitCnt}件</span>}
            {(messageDt.sent && successCnt>0) &&<span>成功{successCnt}件</span>}
            {(isError && errorCnt>0) &&<span>失敗{errorCnt}件</span>}
            {(messageDt.cancel && cancelCnt>0) &&<span>取消{cancelCnt}件</span>}
          </div>
        </>)}
        secondary={(<>
          <span className="about">{brtoLf(messageDt.message)}</span>
          {(messageDt.imageUrls ?? []).map(() => <ImageIcon />)}
          {(messageDt.pdfUrls ?? []).map(() => <PictureAsPdfIcon />)}
        </>)}
      />
      {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
    </ListItem>
    <Divider />
    <Collapse in={open} timeout="auto" unmountOnExit>
      <List component="div" disablePadding>
        <CancelSenndingButton
          messageDt={messageDt} statusClassName={statusClassName}
          bulkMessages={bulkMessages} setBulkMessages={setBulkMessages}
        />
        <Divider />
        <ArchiveContents messageDt={messageDt} statusClassName={statusClassName} />
        <Divider />
        {userResults}
      </List>
    </Collapse>
    </>
  )
}

const Archives = (props) => {
  const service = useSelector(state => state.service);
  const classroom = useSelector(state => state.classroom);
  const classes = useStyles();
  const {bulkMessages, setBulkMessages} = props;

  const items = bulkMessages.filter(dt => {
    if(service && dt.service && service!==dt.service) return false;
    if(classroom && dt.classroom && classroom!==dt.classroom) return false;
    return true;
  }).sort((a, b) => {
    return b.timestamp - a.timestamp
  }).map((messageDt, i) => {
    return(
      <ArchiveListItems
        key={`ArchiveListItems${i}`}
        messageDt={messageDt}
        bulkMessages={bulkMessages} setBulkMessages={setBulkMessages}
      />
    )
  });

  return(
    <div className={classes.Archives}>
      <div className='title'>送信履歴</div>
      {Boolean(items.length) &&<List style={{padding: 0}}>{items}</List>}
      {!Boolean(items.length) &&<div style={{marginTop: '16px', marginLeft: '16px'}}>送信履歴はありません。</div>}
    </div>
  )
}

const CntbkBulkMessage = () => {
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const classes = useStyles();
  const {hid, bid, stdDate, users, com, service, classroom} = allState;
  const [snack, setSnack] = useState({});
  const headerHeight = useGetHeaderHeight();

  const [bulkMessages, setBulkMessages] = useState(null);
  useEffect(() => {
    if(!hid || !bid || !stdDate) return;
    let isMounted = true;
    fetchContacts(hid, bid, stdDate, null, null, setSnack).then(contacts => {
      const newBulkMessages = checkValueType(contacts?.bulkMessages, 'Array') ?contacts.bulkMessages :[];
      if(isMounted) setBulkMessages(newBulkMessages);
    });
    return () => {
      isMounted = false;
    }
  }, [hid, bid, stdDate]);

  const [userList, setUserList] = useState([]);
  useEffect(() => {
    const targetUserList = users.filter(user => {
      if(!isService(user, service)) return false;
      if(!isClassroom(user, classroom)) return false;
      if(!user.faptoken) return false;
      if(!user?.pmail && (com?.ext?.line && !user?.ext?.line?.id)) return false;
      return true;
    }).sort((aUser, bUser) => {
      return parseInt(aUser.sindex) - parseInt(bUser.sindex);
    }).map(user => ({"uid": user.uid, "checked": true}));
    setUserList(targetUserList);
  }, [users, com, service, classroom]);

  // ストアステート読み込みエラー
  if(loadingStatus.error) return(
    <>
    <CntbkLinksTab />
    <LoadErr loadStatus={loadingStatus} errorId={'E4933'} />
    </>
  );
  // ストアステート読み込み中はローディング画面
  if(!loadingStatus.loaded || bulkMessages===null) return(
    <>
    <CntbkLinksTab />
    <LoadingSpinner />
    <SnackMsg {...snack} />
    </>
  );

  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth();
  const [stdYear, stdMonth] = stdDate.split("-").map(Number);

  return(
    <>
    <CntbkLinksTab />
    <div className={classes.AppPage}  style={headerHeight ?{marginTop: headerHeight+32+16+20} :{}}>
      <SnackContext.Provider value={{setSnack}}>
        {(nowYear===stdYear && nowMonth===stdMonth-1) &&(
          <MainForm setBulkMessages={setBulkMessages} userList={userList} />
        )}
        <Archives bulkMessages={bulkMessages} setBulkMessages={setBulkMessages} />
      </SnackContext.Provider>
    </div>
    <UserSelectDialogWithButton
      userList={userList} setUserList={setUserList}
      style={headerHeight ?{top: headerHeight+32+16} :{}}
      lsName="userlistCntbkBulkMessage"
    />
    <SnackMsg {...snack} />
    </>
  )
}
export default CntbkBulkMessage;