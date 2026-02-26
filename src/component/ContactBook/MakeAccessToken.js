import { Button, Checkbox, FormControlLabel, makeStyles, Switch, withStyles } from "@material-ui/core";
import { blue, red, teal } from "@material-ui/core/colors";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getFilteredUsers, univApiCall } from '../../albCommonModule';
import { getBrothers, getFirstBros, getLodingStatus, isMailAddress, parsePermission, randomStr } from "../../commonModule";
import { LoadingSpinner } from "../common/commonParts";
import SnackMsg from "../common/SnackMsg";
import { checkCntbkLineUser, checkCntbkMailUser, CntbkDeleteButton, CntbkLinksTab, CntbkSendButton, OFFICIALLINE_GUIDE_URL } from "./CntbkCommon";
import { AlbHMuiTextField, checkLineUser, checkMailUser, sendErrorLog, useSessionStorageState } from "../common/HashimotoComponents";
import { YesNoDialog } from "../common/GenericDialog";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLine } from '@fortawesome/free-brands-svg-icons';
import { setSnackMsg, setStore } from "../../Actions";
import MailOutlineIcon from '@material-ui/icons/MailOutline';
import { checkValueType } from "../dailyReport/DailyReportCommon";
import LaunchIcon from '@material-ui/icons/Launch';
import axios from "axios";

const SIDEBAR_WIDTH = 61.25;
const NO_WIDTH = 32;
const NAME_WIDTH = 112;
const LINESTATUS_WIDTH = 24;
const LINEBUTTON_WIDTH = 90;
const MAIL_WIDTH = 384;
const ACCESS_WIDTH = 70;

const SnackContext = createContext();

const useStyles = makeStyles({
  AppPage: {
    width: 'fit-content',
    margin: '80px auto', paddingLeft: SIDEBAR_WIDTH,
  },
  MainForm: {
    '& .header, .body': {
      '& .row': {
        display: 'flex',
        '& > div:not(:last-child)': {
          marginRight: 24
        },
        '& .no': {width: NO_WIDTH, textAlign: 'center'},
        '& .name': {width: NAME_WIDTH},
        '& .line': {width: LINESTATUS_WIDTH + LINEBUTTON_WIDTH + 4},
        '& .mail': {width: MAIL_WIDTH},
        '& .access': {width: ACCESS_WIDTH, textAlign: 'center', position: 'relative'},
        '& .faptoken': {width: 'calc(112px * 2 + 12px)'}
      },
    },
    '& .header': {
      zIndex: 3,
      position: 'sticky', top: 80,
      backgroundColor: '#fff', 
      paddingTop: 40, paddingBottom: 4, marginBottom: 16,
      borderBottom: `1px ${teal[800]} solid`
    },
    '& .body': {
      '& .no, .name': {
        marginTop: 8
      },
      '& .row': {
        marginBottom: 32,
      }
    },
    '& .discription' :{
      width: 400, margin: '120px auto 0', lineHeight: 1.4, 
      textAlign: "justify",
      '& .mainText': {marginBottom: 12},
      '& .content': {
        display: 'flex', marginBottom: 4,
        '& .icon': {width: 56,},
        '& .text': {},
      }
    }
  },
  MailAddressForm: {
    display: 'flex',
    '& .textForm': {
      width: 'calc(100% - 92px - 12px)'
    },
    '& .sendButton': {
      marginLeft: 12
    }
  },
  Description: {
    '& .offLine, .onLine': {
      display: 'flex', alignItems: 'center',
      marginBottom: 8,
      fontSize: '0.8rem',
      '& .icon': {
        width: 24, height: 24,
        marginRight: 4
      }
    },
    '& .offLine .icon': {
      color: "rgba(0, 0, 0, 0.26)"
    },
    '& .onLine .icon': {
      color: "#00B900"
    }
  }
});

const FormHeader = ({dispDeAuthButton}) => {
  const com = useSelector(state => state.com);
  const line = com?.ext?.settingContactBook?.line ?? false;
  const lineColStyle = {textAlign: 'center'}
  if (dispDeAuthButton){
    lineColStyle.width = LINESTATUS_WIDTH + LINEBUTTON_WIDTH + 4;
  }
  else{
    lineColStyle.width = LINESTATUS_WIDTH + 4;
  }
  return(
    <div className="header">
      <div className="row">
        <div className="no">No</div>
        <div className="name">保護者名</div>
        <div className="name">利用者名</div>
        {line &&<div className="line" style={lineColStyle}>LINE</div>}
        <div className="mail">メールアドレス</div>
        <div className="access">送受信</div>
      </div>
    </div>
  )
}

const Names = (props) => {
  const {siblingUsers} = props;
  const names = siblingUsers.map(user => (
    <div
      key={`name${user.uid}`}
      style={{opacity: user.faptoken ?1 :0.5}}
    >
      {user.name}
    </div>
  ));

  return(
    <div className="name">{names}</div>
  )
}

const LineWrapper = (props) => {
  const com = useSelector(state => state.com);
  const users = useSelector(state => state.users);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const dispatch = useDispatch();
  const {setSnack} = useContext(SnackContext);
  const {siblingUsers, dispDeAuthButton, setDispDeAuthButton} = props;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogParams, setDialogParams] = useState({});
  const [dialogHandleConfirm, setDialogHandleConfirm] = useState(null);

  const line = com?.ext?.settingContactBook?.line ?? false;
  if(!line) return null;

  const isLineAuthed = siblingUsers.some(user => user?.ext?.line?.auth?.checked);

  const handleDeauthorization = async() => {
    const newSiblingUsers = JSON.parse(JSON.stringify(siblingUsers));
    const newUsers = JSON.parse(JSON.stringify(users));
    try{
      for(const user of siblingUsers){
        const lineId = user?.ext?.line?.id;
        if(!lineId) continue;
        const body = {lineId, hid, bid};
        const headers = {'Content-Type': 'application/json'};
        const lineRes = await axios.post("https://asia-northeast1-albatross-432004.cloudfunctions.net/resetLineRichmenu", body, {headers})
        if(!lineRes.data) throw new Error("sendLineButtonMessageError");
      }
    }catch(error){
      setSnack({msg: "認証解除に失敗しました。", severity:'error', errorId:'MAT530'});
      return;
    }
    let isSuccess = true;
    for(const newUser of newSiblingUsers){
      const hid = newUser.hid, bid = newUser.bid, uid = newUser.uid;
      try{
        if(!checkValueType(newUser?.ext, 'Object')) newUser.ext = {};
        const newUserExt = newUser.ext;
        // LINE情報を削除
        newUserExt.line = {};
        const isMailUsers = siblingUsers.every(user => user.pmail ?true :false);
        if(!isMailUsers){
          // メール利用者ではない場合は送受信設定をOFF
          newUserExt.contactBookEnable = false;
        }
        const deleteLineDtParams = {
          a: "sendUsersExt",
          hid, bid, uid,
          ext: JSON.stringify(newUserExt)
        }
        const sendUsersExtRes = await univApiCall(deleteLineDtParams);
        if(!sendUsersExtRes?.data?.result){
          // 送信失敗
          const error = new Error("sendUsersExtError");
          error.details = {apiParams: deleteLineDtParams, apiRes: sendUsersExtRes};
          throw error;
        }
        const targetUserIndex = newUsers.findIndex(prevUser => prevUser.uid === uid);
        newUsers[targetUserIndex] = newUser;
      }catch(error){
        // エラーログ送信
        const errorCode = randomStr(8);
        sendErrorLog(hid, bid, `MAT${errorCode}`, error);
        isSuccess = false;
        break;
      }
    }
    if(isSuccess){
      dispatch(setStore({users: newUsers}));
      dispatch(setSnackMsg("認証解除しました。"));
    }else{
      setSnack({msg: "認証解除に失敗しました。", severity:'error', errorId:'MAT001'});
    }
  }

  const handleClick = () => {
    const dialogTitle = "LINE認証を解除します。";
    const dialogMessage = "ご家族が行ったLINE認証を取り消しLINEへメッセージ送受信を停止します。\n"
      + "メールアドレスが登録されている場合は、メッセージはメール送信されます。\n"
      + "LINE認証を解除してよろしいですか？";
    const dialogHandleConfirm = handleDeauthorization;
    setDialogOpen(true);
    setDialogParams({title: dialogTitle, message: dialogMessage});
    setDialogHandleConfirm(() => dialogHandleConfirm);
  }

  const yesnoDailogProps = {
    open: dialogOpen, setOpen: setDialogOpen,
    handleConfirm: dialogHandleConfirm,
    prms: dialogParams
  }
  const iconColor = isLineAuthed ?"#00B900" :"rgba(0, 0, 0, 0.26)";
  const lineColStyle = {display: 'flex'}
  if (dispDeAuthButton){
    lineColStyle.width = LINESTATUS_WIDTH + LINEBUTTON_WIDTH + 4;
  }
  else{
    lineColStyle.width = LINESTATUS_WIDTH + 4;
  }

  let mouseDownTimerId = null;
  const handleMouseDownLineIcon = () => {
    let mouseDownTimerCount = 0;
    mouseDownTimerId = setInterval(() => {
      mouseDownTimerCount++;
      if(mouseDownTimerCount === 250 ){
        //長押し判定時の処理
        setDispDeAuthButton((prevValue) => !prevValue);
        clearInterval(mouseDownTimerId);
      }
    })
  }
  const handleMouseUpLineIcon = () => {
    clearInterval(mouseDownTimerId);
  }

  return(
    <>
    <div className="line" style={lineColStyle}>
      <div style={{marginRight: 4}}>
        <FontAwesomeIcon
          icon={faLine}
          style={{
            width: 24, height: 24,
            color: iconColor,
            marginTop: 4,
          }}
          onMouseDown={handleMouseDownLineIcon}
          onMouseUp={handleMouseUpLineIcon}
        />
      </div>
      {dispDeAuthButton &&
        <CntbkDeleteButton
          label="認証解除" disabled={!isLineAuthed}
          handleClick={handleClick}
          style={{width: 90}}
        />
      }
    </div>
    <YesNoDialog {...yesnoDailogProps}/>
    </>
  )
}

const MailAddressForm = (props) => {
  const users = useSelector(state => state.users);
  const dispatch = useDispatch();
  const classes = useStyles();
  const {setSnack} = useContext(SnackContext);
  const {siblingUsers} = props;
  // メールアドレス初期値　兄弟で違うメールアドレスが入力されている時はなしと判定
  const initMailAddress = siblingUsers.reduce((result, user) => {
    const pmail = user?.pmail
    if(result === null) return pmail;
    if(result !== pmail) return "";
    return result;
  }, null);
  const [mailAddress, setMailAddress] = useState(initMailAddress ?? "");
  const [error, setError] = useState(false);

  const handleClick = async() => {
    if(!isMailAddress(mailAddress)){
      setError(true);
      setSnack({msg: 'メールアドレスを入力してください。', severity:'warning', id: new Date().getTime()});
      return;
    }
    const newSiblingUsers = JSON.parse(JSON.stringify(siblingUsers));
    const newUsers = JSON.parse(JSON.stringify(users));
    let isSuccess = true;
    for(const newUser of newSiblingUsers){
      const hid = newUser.hid, bid = newUser.bid;
      try{
        newUser.pmail = mailAddress;
        const sendUserWithEtcParams = {"a": "sendUserWithEtc", ...newUser};
        const sendUserWithEtcRes = await univApiCall(sendUserWithEtcParams);
        if(!sendUserWithEtcRes?.data?.result){
          // 送信失敗
          const error = new Error("sendUserWithEtcError");
          error.details = {apiParams: sendUserWithEtcParams, apiRes: sendUserWithEtcRes};
          throw error;
        }
        const targetUserIndex = newUsers.findIndex(u => u.uid === newUser.uid);
        newUsers[targetUserIndex] = newUser;
      }catch(error){
        // エラーログ送信
        const errorCode = randomStr(8);
        sendErrorLog(hid, bid, `MAT${errorCode}`, error);
        isSuccess = false;
        break;
      }
    }
    if(isSuccess){
      dispatch(setStore({users: newUsers}));
      dispatch(setSnackMsg("メールアドレスを更新しました。"));
    }else{
      setSnack({msg: "更新に失敗しました。再度お試しください。", severity:'error', errorId:'MAT002'});
    }
  }

  const handleChange = (e) => {
    setMailAddress(e.target.value);
  }

  const handleBlur = (e) => {
    if(!isMailAddress(e.target.value)){
      setError(true);
    }else{
      setError(false);
    }
  }

  return(
    <div className={`${classes.MailAddressForm} mail`}>
      <AlbHMuiTextField
        value={mailAddress}
        onChange={handleChange}
        onBlur={handleBlur}
        className="textForm"
        error={error}
        helperText={error ?"メールアドレスが不正です" :null}
      />
      <CntbkSendButton
        label="更新"
        handleClick={handleClick}
        style={{width: 80}}
      />
    </div>
  )
}

const IOSSwitch = withStyles((theme) => ({
  root: {
    width: 54,
    height: 26,
    padding: 0,
    margin: theme.spacing(1),
    overflow: 'initial'
  },
  switchBase: {
    padding: 1,
    '&$checked': {
      transform: 'translateX(28px)',
      color: theme.palette.common.white,
      '& + $track': {
        backgroundColor: teal[600],
        opacity: 1,
        border: 'none',
      },
    },
    '&$focusVisible $thumb': {
      color: teal[600],
      border: '6px solid #fff',
    },
  },
  thumb: {
    width: 24,
    height: 24,
  },
  track: {
    borderRadius: 26 / 2,
    border: `1px solid ${theme.palette.grey[400]}`,
    backgroundColor: theme.palette.grey[200],
    opacity: 1,
    transition: theme.transitions.create(['background-color', 'border']),
  },
  checked: {},
  focusVisible: {},
}))(({ classes, ...props }) => {
  return (
    <Switch
      focusVisibleClassName={classes.focusVisible}
      disableRipple
      classes={{
        root: classes.root,
        switchBase: classes.switchBase,
        thumb: classes.thumb,
        track: classes.track,
        checked: classes.checked,
      }}
      {...props}
    />
  );
});
const FaptokenForm = (props) => {
  const dispatch = useDispatch();
  const com = useSelector(state => state.com);
  const users = useSelector(state => state.users);
  const account = useSelector(state => state.account);
  const permission = parsePermission(account)[0][0];
  const {setSnack} = useContext(SnackContext);
  const {siblingUsers} = props;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogParams, setDialogParams] = useState({});
  const [dialogHandleConfirm, setDialogHandleConfirm] = useState(null);
  const faptoken = siblingUsers.find(user => user.faptoken)?.faptoken ?? "";
  const isMailUsers = siblingUsers.every(user => checkMailUser(user));
  const isLineUsers = siblingUsers.every(user => checkLineUser(user, com));
  const isCntbkMailUsers = siblingUsers.every(user => checkCntbkMailUser(user));
  const isCntbkLineUsers = siblingUsers.every(user => checkCntbkLineUser(user, com));
  const [checked, setChecked] = useState(isCntbkMailUsers || isCntbkLineUsers);

  const addFaptoken = async() => {
    const newSiblingUsers = JSON.parse(JSON.stringify(siblingUsers));
    const newUsers = JSON.parse(JSON.stringify(users));
    let isSuccess = true;
    for(const newUser of newSiblingUsers){
      const hid = newUser.hid, bid = newUser.bid;
      try{
        if(!newUser.faptoken){
          // faptokenがない場合は発行&送信
          newUser.faptoken = randomStr(8);
          const sendUserWithEtcParams = {"a": "sendUserWithEtc", ...newUser};
          const sendUserWithEtcRes = await univApiCall(sendUserWithEtcParams);
          if(!sendUserWithEtcRes?.data?.result){
            // 送信失敗
            const error = new Error("sendUserWithEtcError");
            error.details = {apiParams: sendUserWithEtcParams, apiRes: sendUserWithEtcRes};
            throw error;
          }
        }
        // 送受信許可用contactBookEnableフラグをtureにし送信する。
        newUser.ext = {...newUser.ext, contactBookEnable: true};
        const sendUsersExtParams = {
          a: "sendUsersExt",
          hid: newUser.hid, bid: newUser.bid, uid: newUser.uid,
          ext: JSON.stringify(newUser.ext)
        };
        const sendUsersExtRes = await univApiCall(sendUsersExtParams);
        if(!sendUsersExtRes?.data?.result){
          // 送信失敗
          const error = new Error("sendUsersExtError");
          error.details = {apiParams: sendUsersExtParams, apiRes: sendUsersExtRes};
          throw error;
        }
        const targetUserIndex = newUsers.findIndex(u => u.uid === newUser.uid);
        newUsers[targetUserIndex] = newUser;
      }catch(error){
        // エラーログ送信
        const errorCode = randomStr(8);
        sendErrorLog(hid, bid, `MAT${errorCode}`, error);
        isSuccess = false;
        break;
      }
    }
    if(isSuccess){
      setChecked(true);
      dispatch(setStore({users: newUsers}));
      dispatch(setSnackMsg("送受信設定を有効しました。"));
    }else{
      setSnack({msg: "更新に失敗しました。再度お試しください。", severity:'error', errorId:'MAT003'});
    }
  }

  const deleteFaptoken = async() => {
    const newUsers = JSON.parse(JSON.stringify(users));
    const newSiblingUsers = JSON.parse(JSON.stringify(siblingUsers));
    let isSuccess = true;
    for(const newUser of newSiblingUsers){
      const hid = newUser.hid, bid = newUser.bid, uid = newUser.uid;
      try{
        // 送受信許可OFF
        newUser.ext = {...newUser.ext, contactBookEnable: false};
        const sendUsersExtParams = {
          a: "sendUsersExt",
          hid, bid, uid,
          ext: JSON.stringify(newUser.ext)
        }
        const sendUsersExtRes = await univApiCall(sendUsersExtParams);
        if(!sendUsersExtRes?.data?.result){
          // 送信失敗
          const error = new Error("sendUsersExtError");
          error.details = {apiParams: sendUsersExtParams, apiRes: sendUsersExtRes};
          throw error;
        }
        const targetUserIndex = newUsers.findIndex(u => u.uid === newUser.uid);
        newUsers[targetUserIndex] = newUser;
      }catch(error){
        // エラーログ送信
        const errorCode = randomStr(8);
        sendErrorLog(hid, bid, `MAT${errorCode}`, error);
        isSuccess = false;
        break;
      }
    }
    if(isSuccess){
      setChecked(false);
      dispatch(setStore({users: newUsers}));
      dispatch(setSnackMsg("送受信設定を無効しました。"));
    }else{
      setSnack({msg: "送受信無効化に失敗しました。", severity:'error', errorId:'MAT004'});
    }
  }

  const handleSwitch = (e) => {
    let dialogMessage = "", dialogTitle = "", dialogHandleConfirm = null;
    if(e.target.checked){
      dialogTitle = "送受信設定を有効にする";
      dialogMessage = "ご家族様のメールもしくはLINEにメッセージが送信されるようになります。\n"
        + "送受信設定を有効にしてよろしいですか？";
      dialogHandleConfirm = addFaptoken;
    }else{
      dialogTitle = "送受信設定を無効にする";
      dialogMessage = "ご家族様へメッセージが送信されなくなります。\n"
        + "既に入力されているメッセージも送信されません。\n"
        + "送受信設定を無効にしてよろしいですか？";
      dialogHandleConfirm = deleteFaptoken;
    }
    setDialogOpen(true);
    setDialogParams({title: dialogTitle, message: dialogMessage});
    setDialogHandleConfirm(() => dialogHandleConfirm);
  }

  const disabled = !isMailUsers && !isLineUsers;
  const yesnoDailogProps = {
    open: dialogOpen, setOpen: setDialogOpen,
    handleConfirm: dialogHandleConfirm,
    prms: dialogParams
  }
  const statusDispStyle = {
    fontSize: '.7rem', height: 0, position: 'relative', top: -3,
    color: checked? teal[800]: red[600]
  }
  const statusText = checked? '送受信可': '送受信不可';
  return(
    <>
    <div
      className="access"
      onClick={() => {
        if(disabled) setSnack({...{msg: 'メールアドレスかLINE認証が必要です。', severity: 'warning', id: new Date().getTime()}});
      }}
    >
      <IOSSwitch
        checked={checked}
        onChange={handleSwitch}
        disabled={disabled}
      />
      <div style={statusDispStyle}>
        {statusText}
        {permission >= 100 &&(
          <div style={{textAlign: 'center', fontSize: '.6rem'}}>{faptoken}</div>
        )}
      </div>
    </div>
    <YesNoDialog {...yesnoDailogProps}/>
    </>
  )
}

const FormBody = ({dispDeAuthButton, setDispDeAuthButton}) => {
  const users = useSelector(state => state.users);
  const service = useSelector(state => state.service);
  const classroom = useSelector(state => state.classroom);

  const targetUsers = getFilteredUsers(users, service, classroom).sort((aUser, bUser) => {
    return parseInt(aUser.sindex) - parseInt(bUser.sindex);
  });
  const list_by_bros = targetUsers.map(userDt => getFirstBros(userDt.uid, users) ?getBrothers(userDt.uid, users, true) :[userDt]);
  const bros_dtlist = [...new Set(list_by_bros.map(JSON.stringify))].map(JSON.parse).filter(x => x.length!==0);
  const hoge = bros_dtlist.flat().map(x => [x]);
  const rows = hoge.map((siblingUsers, index) => {
    const isFaptoken = siblingUsers.some(user => user.faptoken);
    return(
      <div key={`BrosOneRow${index}`} className="row">
        <div className="no">{index+1}</div>
        <div className="name" style={{opacity: isFaptoken ?1 :0.5}}>
          {siblingUsers?.[0]?.pname ?? "氏名未登録"}
        </div>
        <Names siblingUsers={siblingUsers} />
        <LineWrapper
          siblingUsers={siblingUsers}
          dispDeAuthButton={dispDeAuthButton} setDispDeAuthButton={setDispDeAuthButton}
        />
        <MailAddressForm siblingUsers={siblingUsers} />
        <FaptokenForm siblingUsers={siblingUsers} />
      </div>
    )
  });

  return(
    <div className="body">{rows}</div>
  )
}

const Description = () => {
  const com = useSelector(state => state.com);
  const classes = useStyles();
  const line = com?.ext?.settingContactBook?.line ?? false;
  if(!line) return null;
  return(
    <div className={classes.Description}>
      <div className="offLine">
        <FontAwesomeIcon icon={faLine} className="icon" />
        LINE未認証：ご家族様がLINE認証を行なっていない状態です。送受信スイッチオンの場合、メッセージは登録メールアドレスへ送信されます。
      </div>
      <div className="onLine">
        <FontAwesomeIcon icon={faLine} className="icon" />
        LINE認証済み：送受信スイッチオンの場合、メッセージはLINEへ送信されます。
      </div>
    </div>
  )
}

const MainForm = () => {
  const com = useSelector(state => state.com);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const classes = useStyles();
  const [dispDeAuthButton, setDispDeAuthButton] = useSessionStorageState(false, "cntbkaMakeAccessTokenDispDeAuthButton");
  const enableLine = com?.ext?.settingContactBook?.line ?? false;
  const [lineName, setLineName] = useState(null);
  useEffect(() => {
    if(!enableLine) return;
    univApiCall({a: "fetchLineAccount", hid, bid}).then(res => {
      const dt = res?.data?.dt?.[0];
      if(dt){
        setLineName(dt.lineName);
      }else{
        setLineName("alfami");
      };
    });
  }, [enableLine, hid, bid]);

  const lineIconStyle = {width: 24, height: 24, color: 'rgba(0, 185, 0)'};
  const mailIconStyle = {color: blue[800]};
  return(
    <div className={classes.MainForm}>
      <div className='discription'>
        <div className="mainText">
          送受信の設定を行います。送受信のスイッチをオンにするとその利用者は連絡帳対象となります。
        </div>
        {enableLine &&
          <div className="content">
            <div className="icon">
              <FontAwesomeIcon icon={faLine} className="lineIcon" style={lineIconStyle}/>
            </div>
            <div className="text">
              LINEの場合はご家族が認証完了してから送受信のスイッチをオンにしてください。
            </div>
          </div>
        }
        <div className="content">
          <div className="icon"><MailOutlineIcon style={mailIconStyle}/></div>
          <div className="text">
            {enableLine ?'メールの場合は' :''}メールアドレス入力してから送受信のスイッチをオンにしてください。
          </div>
        </div>
        {(enableLine && lineName!==null) &&(
          <div>
            <Button
              variant="outlined"
              href={OFFICIALLINE_GUIDE_URL[lineName]} target="_blank"
              rel="noopener noreferrer"
              startIcon={<LaunchIcon />}
            >
              ご家族様への案内はこちら
            </Button>
          </div>
        )}
      </div>
      <form>
        <FormHeader dispDeAuthButton={dispDeAuthButton} />
        <FormBody dispDeAuthButton={dispDeAuthButton} setDispDeAuthButton={setDispDeAuthButton} />
      </form>
      <Description />
      {enableLine &&
        <div style={{marginTop: 24, marginBottom: 8}}>
          <FormControlLabel
            control={
              <Checkbox
                color="primary"
                checked={dispDeAuthButton}
                onChange={e=>{setDispDeAuthButton(e.target.checked)}}
              />
            }
            label='ライン認証解除をする必要があるときはチェックをオンにしてください'
          />
        </div>
      }
    </div>
  )
}

const MakeAccessToken = () => {
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const classes = useStyles();
  const [snack, setSnack] = useState({});

  if(!loadingStatus.loaded){
    return (
      <>
      <CntbkLinksTab />
      <LoadingSpinner/>
      </>
    )
  }

  return(
    <>
    <CntbkLinksTab />
    <div className={classes.AppPage}>
      <SnackContext.Provider value={{setSnack}}>
        <MainForm />
      </SnackContext.Provider>
    </div>
    <SnackMsg {...snack} />
    </>
  )
  
}
export default MakeAccessToken