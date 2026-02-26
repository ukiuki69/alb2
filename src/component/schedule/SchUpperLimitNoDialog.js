import { Button, IconButton, makeStyles, TextField, Tooltip } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { convHankaku, convUID, getAndRemoveSessionStrage, getLodingStatus, getUisCookie, uisCookiePos } from '../../commonModule';
import { GoBackButton, LoadingSpinner } from '../common/commonParts';
import { forbiddenPtn, OtherOffice } from '../common/StdFormParts';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import DeleteIcon from '@material-ui/icons/Delete';
import CheckIcon from '@material-ui/icons/Check';
import ClearIcon from '@material-ui/icons/Clear';
import { red, teal } from '@material-ui/core/colors';
import { ButtonCancel, ButtonOK } from '../common/materialUi';
import { recentUserStyle, sendUser, setRecentUser } from '../../albCommonModule';
import { setStore } from '../../Actions';
import { useHistory } from 'react-router';
import SnackMsg from '../common/SnackMsg';
import { AlbHMuiTextField } from '../common/HashimotoComponents';
import SchLokedDisplay from '../common/SchLockedDisplay';


const useStyles = makeStyles({
  otherOffice: {
    display: 'flex',
    '& .formParts': {padding: '0 8px'},
    '& .officeName': {width: 300},
    '& .officeNo': {width: 120}
  },
  upperLimitKanri: {
    margin: '24px 0',
    '& .form': {
      display: 'flex', alignItems: 'flex-start',
      '& .trash': {color: red[300], marginLeft: 40}
    }
  },
  deleteConfirm: {
    marginTop: 8, padding: '0 8px',
    '& .msg': {fontSize: '.9rem',background: red[50]},
    '& .yes': {color: red[800]},
    '& .no': {color: teal[800]}
  },
  deleteConfirmTrue: {
    backgroundColor: red[800],
    color: "#fff",
    '&:hover': { backgroundColor: red[900] },
  },
  upperLimitForm: {
    '& .buttonWrapper': {
      '& .button': {width: 128}
    }
  },
  schUpperLimitNoDialog: {
    maxWidth: 620, margin: '100px auto',
    '& .title': {
      textAlign: 'center', color: teal[800], fontSize: '1.2rem',
      borderBottom: '1px #ddd solid', padding: '4px 0', marginBottom: 8
    },
    '& .userInfo': {
      display: 'flex', justifyContent: 'center',
      '& div': {padding: '0 6px'}
    }
  }
});

const Dispatcher = ({idName, scrollVal}) => {
  useEffect(()=>{
    return () =>{
      setTimeout(()=>{
        const closed = !document.querySelector('#byUserAddictionNoDialog52');
        if (closed){
          const elm = document.getElementById(idName);
          if(elm){
            if(idName === "usersRootScrollCnt"){
              elm.scrollTop = scrollVal
            }else{
              document.documentElement.scrollTop = scrollVal
            }
          }
        }
      }, 100)
    }
  }, [])
  return (
    <div id='byUserAddictionNoDialog52' style={{display: 'none'}}></div>
  )
}

const NewOtherOffice = (props) => {
  const classes = useStyles();
  const {
    upperLimitDts, setUpperLimitDts, upperLimitDtIndex, allState, error, setError,
    type=0, changePos=false, setChangePos, 
  } = props;
  const [noDisabled, setNoDisabled] = useState(true);
  const [nameErr, setNameErr] = useState(false);
  const [nameErrMsg, setNameErrMsg] = useState("");
  const [noErr, setNoErr] = useState(false);
  const [noErrMsg, setNoErrMsg] = useState("");
  const {users, service} = allState;
  const filteredUsers = users.filter(userDt => {
    if(service === "" || userDt.service === service) return true;
    return false;
  });
  const offices = filteredUsers.reduce((result, userDt) => {
    if(!userDt.etc) return result;
    for(const upperLimitType of ["協力事業所", "管理事業所"]){
      if(!userDt.etc[upperLimitType]) continue;
      userDt.etc[upperLimitType].forEach(x => {
        if(result.every(y => y.name !== x.name)){
          result.push({name: x.name, no: x.no});
        }
      });
    }
    return result;
  }, []);

  useEffect(() => {
    const thisError = error[upperLimitDtIndex];
    if(!thisError) return;
    const nameValue = upperLimitDts[upperLimitDtIndex]
      ?upperLimitDts[upperLimitDtIndex].name
        ?upperLimitDts[upperLimitDtIndex].name :""
      :"";
    const noValue = upperLimitDts[upperLimitDtIndex]
        ?upperLimitDts[upperLimitDtIndex].no
          ?upperLimitDts[upperLimitDtIndex].no :""
      :"";
    if(!nameValue){
      setNameErr(true);
      setNameErrMsg("事業所名を入力してください")
    }
    if(!noValue){
      setNoErr(true);
      setNoErrMsg("事業所番号を入力してください")
    }
  }, [error])

  useEffect(() => {
    const result = JSON.parse(JSON.stringify(error));
    result[upperLimitDtIndex] = nameErr || noErr;
    setError([...result]);
  }, [nameErr, noErr]);

  const changeNameForm = (value) => {
    const dts = JSON.parse(JSON.stringify(upperLimitDts));
    if(!dts[upperLimitDtIndex]) {
      dts[upperLimitDtIndex] = {};
      if(nameErr){
        setNameErr(false);
        setNameErrMsg("");
      }
      if(noErr){
        setNoErr(false);
        setNoErrMsg("");
      }
    }
    dts[upperLimitDtIndex].name = value;
    if(offices.some(officeDt => officeDt.name === value)){
      const targetOfficeDt = offices.find(officeDt => officeDt.name === value);
      dts[upperLimitDtIndex].no = targetOfficeDt.no;
      setNoDisabled(true);
    }else{
      if(changePos) setChangePos(false);
      else if(noDisabled) dts[upperLimitDtIndex].no = "";
      setNoDisabled(false);
    }
    setUpperLimitDts([...dts]);
  }

  const changeNoForm = (e) => {
    const dts = JSON.parse(JSON.stringify(upperLimitDts));
    if(!dts[upperLimitDtIndex]) dts[upperLimitDtIndex] = {};
    dts[upperLimitDtIndex].no = e.target.value;
    setUpperLimitDts([...dts]);
  }

  const blurNameForm = (e) => {
    const value = e.currentTarget.value;
    const dts = JSON.parse(JSON.stringify(upperLimitDts));
    if(!dts[upperLimitDtIndex]) dts[upperLimitDtIndex] = {};
    if(value === ""){
      dts[upperLimitDtIndex].no = "";
      setNoErr(false);
      setNoErrMsg("");
      setUpperLimitDts([...dts]);
      setNoDisabled(true);
    }
    
    //バリデーション
    let errMsg = "";
    if(dts.some((officeDt, i) => (
      i!==upperLimitDtIndex && officeDt && officeDt.name===value
    ))){
      errMsg = "事業所名が重複しています。";
    }else if(forbiddenPtn.test(value)){
      errMsg = "利用できない文字があります";
    }
    setNameErr(errMsg ?true :false);
    setNameErrMsg(errMsg);
  }

  const blurNoForm = (e) => {
    const value = convHankaku(e.currentTarget.value);
    const dts = JSON.parse(JSON.stringify(upperLimitDts));
    if(!dts[upperLimitDtIndex]) dts[upperLimitDtIndex] = {};
    dts[upperLimitDtIndex].no = value;
    setUpperLimitDts([...dts]);

    //バリデーション
    let errMsg = "";
    if(!/^[0-9]{10}$/.test(value)){
      errMsg = "10桁の数字が必要です。"
    }else if(dts.some((officeDt, i) => (
      i!==upperLimitDtIndex && officeDt && officeDt.no===value
    ))){
      errMsg = "事業所番号が重複しています。";
    }else if(offices.some(officeDt => (
      officeDt.no === value && officeDt.name !== dts[upperLimitDtIndex].name
    ))){
      errMsg = "登録済みの番号です。"
    }
    setNoErr(errMsg ?true :false);
    setNoErrMsg(errMsg);
  }

  const nameValue = upperLimitDts[upperLimitDtIndex]
    ?upperLimitDts[upperLimitDtIndex].name
      ?upperLimitDts[upperLimitDtIndex].name :""
    :"";
  const noValue = upperLimitDts[upperLimitDtIndex]
      ?upperLimitDts[upperLimitDtIndex].no
        ?upperLimitDts[upperLimitDtIndex].no :""
    :"";
  const formNumber = type!==1 ?String(upperLimitDtIndex+1) :"";
  return(
    <div className={classes.otherOffice}>
      <Autocomplete
        freeSolo
        value={nameValue}
        className='officeName formParts'
        options={offices.map(officeDt => officeDt.name)}
        onInputChange={(_, v)=>changeNameForm(v)}
        renderInput={(params) => (
          <AlbHMuiTextField
            autoCompleteParams={params}
            name={`事業所名${formNumber}`}
            label={`事業所名${formNumber}`}
            error={nameErr} helperText={nameErrMsg}
            onChange={e=>changeNameForm(e.target.value)}
            onBlur={blurNameForm}
          />
        )}
      />
      <div className='formParts'>
        <AlbHMuiTextField
          name={`番号${formNumber}`}
          label={`番号${formNumber}`}
          value = {noValue}
          disabled={noDisabled}
          error={noErr} helperText={noErrMsg}
          required
          className='officeNo'
          onChange={changeNoForm}
          onBlur={blurNoForm}
        />
      </div>
    </div>
  )
}

const JiButtons = (props) => {
  const classes = useStyles();
  const {upperLimitDts, setUpperLimitDts, upperLimitDtIndex, setChangePos, error} = props;

  const clickUpButton = () => {
    if(upperLimitDtIndex===0) return;
    const a = JSON.parse(JSON.stringify(upperLimitDts));
    const hoge = a[upperLimitDtIndex-1]
      ?JSON.parse(JSON.stringify(a[upperLimitDtIndex-1])) :null;
    a[upperLimitDtIndex-1] = JSON.parse(JSON.stringify(a[upperLimitDtIndex]));
    if(hoge) a[upperLimitDtIndex] = hoge;
    else delete a[upperLimitDtIndex];
    setUpperLimitDts([...a]);
    setChangePos(true);
  }

  const clickDownButton = () => {
    if(upperLimitDtIndex===5) return;
    const a = JSON.parse(JSON.stringify(upperLimitDts));
    const hoge = a[upperLimitDtIndex+1]
      ?JSON.parse(JSON.stringify(a[upperLimitDtIndex+1])) :null;
    a[upperLimitDtIndex+1] = JSON.parse(JSON.stringify(a[upperLimitDtIndex]));
    if(hoge) a[upperLimitDtIndex] = hoge;
    else delete a[upperLimitDtIndex];
    setUpperLimitDts([...a]);
    setChangePos(true);
  }

  const disabled = error[upperLimitDtIndex];
  return(
    <div className={classes.jiButtons}>
      <IconButton
        color='primary'
        disabled={disabled}
        onClick={()=>clickUpButton()}
      >
        <ArrowUpwardIcon/>
      </IconButton>
      <IconButton
        color='primary'
        disabled={disabled}
        onClick={()=>clickDownButton()}
      >
        <ArrowDownwardIcon/>
      </IconButton>
    </div>
  )
}

const DeleteConfirm = (props) => {
  const classes = useStyles();
  const {upperLimitDts, setUpperLimitDts, trashed, setTrashed, upperLimitDtIndex} = props;
  if(trashed!==upperLimitDtIndex) return null;

  const handleClick = () => {
    const result = JSON.parse(JSON.stringify(upperLimitDts));
    delete result[trashed];
    setUpperLimitDts([...result]);
    setTrashed(null);
  }

  return(
    <div className={classes.deleteConfirm}>
      <span className='msg'>この事業所を削除しますか？</span>
      <Button
        className='yes'
        onClick={handleClick}
      >
        はい
      </Button>
      <Button
        className='no'
        onClick={()=>setTrashed(null)}
      >
        いいえ
      </Button>
    </div>
  )
}

const UpperLimitForm = ({uid, allState, type, setSnack}) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const history = useHistory();
  let formRow = null;
  let upperLimitType = null;
  if(type === 0){
    formRow = 6;
    upperLimitType = "協力事業所";
  }else if(type === 1){
    formRow = 1;
    upperLimitType = "管理事業所";
  }
  const {users, schedule} = allState;
  const [upperLimitDts, setUpperLimitDts] = useState((() => {
    const userDt = users.find(x => x.uid === uid);
    return userDt.etc ?userDt.etc[upperLimitType] ?userDt.etc[upperLimitType] :[] :[];
  })());
  const [error, setError] = useState(Array(formRow).fill(false));
  const [trashed, setTrashed] = useState(null);
  const [changePos, setChangePos] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const schLocked = schedule?.locked;
  // 対象の上限管理情報が存在するかどうか
  const suid = convUID(uid).str;
  const targetOtherOfficeScheduleDts = schedule?.[suid]?.[upperLimitType] || [];
  const deleteDisabledBySchedule = targetOtherOfficeScheduleDts.length >= 1;
  const deleteDisabled = schLocked || deleteDisabledBySchedule;
  const deleteTooltip = deleteDisabledBySchedule ? '今月の上限管理情報があるため削除できません' : '';
  const otherOfficeParams = {upperLimitDts, setUpperLimitDts, allState, error, setError, type, setChangePos, changePos};
  const deleteParams = {upperLimitDts, setUpperLimitDts, trashed, setTrashed};
  const formNodes = Array(formRow).fill(null).map((_, i) => {
    otherOfficeParams["upperLimitDtIndex"] = i;
    deleteParams["upperLimitDtIndex"] = i;
    return(
      <div className={classes.upperLimitKanri}>
        <div className='form'>
          <NewOtherOffice {...otherOfficeParams}/>
          {type===0 &&<JiButtons {...otherOfficeParams}/>}
          {type===0 &&<IconButton
            className='trash'
            onClick={()=>setTrashed(i)}
          >
            <DeleteIcon />
          </IconButton>}
        </div>
        {type===0 &&<DeleteConfirm {...deleteParams}/>}
      </div>
    )
  })

  const handleSubmit = async() => {
    const errorChecked = error.map((_, i) => {
      const thisDt = upperLimitDts[i];
      if(!thisDt) return false;
      if(!thisDt.name && !thisDt.no) return false;
      if(thisDt.name && thisDt.no) return false;
      return true;
    });
    setError([...errorChecked]);
    if(errorChecked.some(x => x)) return;
    const addDts = JSON.parse(JSON.stringify(upperLimitDts)).filter(dt => {
      if(!(dt && dt.name && dt.no)) return false;
      return !dt.name ?false :true
    });
    addDts.forEach(dt => {
      if(type===0) dt.amount = "";
      else if(type===1){
        dt.kanriKekka = "";
        dt.kettei = "";
      }
    });
    const resultUsers = JSON.parse(JSON.stringify(users));
    const targetIndex = resultUsers.findIndex(userDt => userDt.uid === uid);
    const sendDt = resultUsers[targetIndex];
    if(!sendDt) return;
    if(!sendDt.etc) sendDt.etc = {};
    sendDt.etc[upperLimitType] = addDts;
    // kanri_typeが設定されていない場合はセッションストレージから取得
    // 管理事業所を登録するときは利用者のkanri_typeは「協力事業所」
    // 協力事業所を登録するときは利用者のkanri_typeは「管理事業所」
    if(!sendDt.kanri_type || sendDt.kanri_type === ''){
      const sessionType = parseInt(sessionStorage.getItem("schUpperLimitNoDialogUpperLimitType"));
      if(sessionType === 0){
        sendDt.kanri_type = "管理事業所";
      } else if(sessionType === 1){
        sendDt.kanri_type = "協力事業所";
      }
    }
    const params = {...sendDt, a: 'sendUserWithEtc'};
    const res = await sendUser(params, '', setSnack, "情報を登録しました。", "情報の登録に失敗しました。");
    if(res.data.result){
      dispatch(setStore({users: resultUsers}));
      // /users/edit[uid]?goback=/users
      // /users/addnew?goback=/users
      setRecentUser(uid);
      
      // セッションストレージから戻り先URLを取得してaddnewをedit[uid]形式に変換
      const referrer = sessionStorage.getItem("schUpperLimitNoDialogReferrer");
      if (referrer && referrer.includes('addnew')) {
        const newReferrer = referrer.replace(/addnew/g, `edit${uid}`);
        const url = new URL(newReferrer);
        const hashPath = url.hash ? url.hash.substring(1) : (url.pathname + url.search);
        sessionStorage.removeItem("schUpperLimitNoDialogReferrer");
        history.push(hashPath);
      } else {
        history.goBack();
      }
    }
  }

  const handleDelete = async() => {
    if (!deleteConfirm){
      setDeleteConfirm(true);
      return;
    }
    const resultUsers = JSON.parse(JSON.stringify(users));
    const targetIndex = resultUsers.findIndex(userDt => userDt.uid === uid);
    const sendDt = resultUsers[targetIndex];
    if(!sendDt) return;
    if(!sendDt.etc) sendDt.etc = {};
    // etc[upperLimitType]を削除
    delete sendDt.etc[upperLimitType];
    // kanri_typeを空文字に設定
    sendDt.kanri_type = "";
    const params = {...sendDt, a: 'sendUserWithEtc'};
    const res = await sendUser(params, '', setSnack, "登録を解除しました。", "登録の解除に失敗しました。");
    if(res.data.result){
      dispatch(setStore({users: resultUsers}));
      setRecentUser(uid);
      setDeleteConfirm(false);
      
      // セッションストレージから戻り先URLを取得してaddnewをedit[uid]形式に変換
      const referrer = sessionStorage.getItem("schUpperLimitNoDialogReferrer");
      if (referrer && referrer.includes('addnew')) {
        const newReferrer = referrer.replace(/addnew/g, `edit${uid}`);
        const url = new URL(newReferrer);
        const hashPath = url.hash ? url.hash.substring(1) : (url.pathname + url.search);
        sessionStorage.removeItem("schUpperLimitNoDialogReferrer");
        history.push(hashPath);
      } else {
        history.goBack();
      }
    }
  }

  return(
    <div className={classes.upperLimitForm}>
      {formNodes}
      <div className='buttonWrapper'>
        <Tooltip
          title={deleteTooltip}
          disableHoverListener={!deleteDisabledBySchedule}
        >
          <span>
            <Button
              color='default'
              variant='contained'
              className={deleteConfirm ? classes.deleteConfirmTrue : ''}
              disabled={deleteDisabled}
              onClick={handleDelete}
            >
              <DeleteIcon />
              {deleteConfirm ? '解除実行' : '登録解除'}
            </Button>
          </span>
        </Tooltip>
        <Button 
          color="secondary"
          variant="contained"
          className='cancel button'
          onClick={() => history.goBack()}
        >
          <ClearIcon />
          キャンセル
        </Button>
        <Button
          color='primary'
          variant='contained'
          className='ok button'
          disabled={error.some(x=>x) || schLocked}
          onClick={handleSubmit}
        >
          <CheckIcon />
          書き込み
        </Button>
      </div>
    </div>
  )
}

const UpperLimitKyouryoku = ({uid, allState}) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const {users} = allState;
  const [upperLimitDts, setUpperLimitDts] = useState((() => {
    const userDt = users.find(x => x.uid === uid);
    return userDt.etc ?userDt.etc["管理事業所"] ?userDt.etc["管理事業所"] :[] :[];
  })());
  const [error, setError] = useState(Array(1).fill(false));
  const [trashed, setTrashed] = useState(null);

  const otherOfficeParams = {upperLimitDts, setUpperLimitDts, allState, error, setError, type: 1};
  const deleteParams = {upperLimitDts, setUpperLimitDts, trashed, setTrashed};
  const formNodes = Array(1).fill(null).map((_, i) => {
    otherOfficeParams["upperLimitDtIndex"] = i;
    deleteParams["upperLimitDtIndex"] = i;
    return(
      <div className={classes.upperLimitKanri}>
        <div className='form'>
          <NewOtherOffice {...otherOfficeParams}/>
        </div>
      </div>
    )
  })

  const handleSubmit = () => {
    const addDts = JSON.parse(JSON.stringify(upperLimitDts)).filter(dt => !dt.name ?false :true);
    addDts.forEach(dt => dt.amount = "");
    const resultUsers = JSON.parse(JSON.stringify(users));
    const targetIndex = resultUsers.findIndex(userDt => userDt.uid === uid);
    const sendDt = resultUsers[targetIndex];
    if(!sendDt) return;
    if(!sendDt.etc) sendDt.etc = {};
    sendDt.etc["管理事業所"] = addDts;
    const params = {...sendDt, a: 'sendUserWithEtc'};
    sendUser(params);
    dispatch(setStore({users: resultUsers}));
  }

  return(
    <div>
      {formNodes}
      <div>
        <ButtonCancel />
        <Button
          color='primary'
          variant='contained'
          className='oK'
          disabled={error.some(x=>x)}
          onClick={handleSubmit}
        >
          <CheckIcon />
          OK
        </Button>
      </div>
    </div>
  )
}

const SchUpperLimitNoDialog = () => {
  const classes = useStyles();
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const [snack, setSnack] = useState({});
  const uid = sessionStorage.getItem("schUpperLimitNoDialogUid");
  const type = parseInt(sessionStorage.getItem("schUpperLimitNoDialogUpperLimitType"));
  const idName = sessionStorage.getItem("schUpperLimitNoDialogIdName");
  const scrollVal = sessionStorage.getItem("schUpperLimitNoDialogScrollVal");

  if(!loadingStatus.loaded) return(<LoadingSpinner />);

  const {users, stdDate} = allState;
  const userDt = users.find(dt => dt.uid === uid);
  const dateList = stdDate.split("-");

  const upperLimitType = (() => {
    if(type === 0) return "協力事業所";
    else if(type === 1) return "管理事業所";
  })();

  const params = {uid, allState, type, setSnack};
  return(
    <div className='AppPage'>
      <GoBackButton posX={80} posY={"100px"}/>
      <div className={classes.schUpperLimitNoDialog}>
        <div className='title'>{`上限管理（${upperLimitType}）`}</div>
        <div className='userInfo'>
          <div className='date'>{`${dateList[0]}年${dateList[1]}月`}</div>
          <div className='name'>{userDt.name}</div>
          <div className='ageStr'>{userDt.ageStr}</div>
        </div>
        <UpperLimitForm {...params}/>
      </div>
      <SnackMsg {...snack}/>
      <Dispatcher idName={idName} scrollVal={scrollVal}/>
      <SchLokedDisplay/>
    </div>
  )
}
export default SchUpperLimitNoDialog;