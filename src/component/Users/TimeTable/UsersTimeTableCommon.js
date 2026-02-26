import { Button, ButtonGroup, Dialog, DialogActions, DialogContent, DialogTitle, useMediaQuery, withStyles } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { indigo, red, teal } from "@material-ui/core/colors";
import { checkValueType } from "../../dailyReport/DailyReportCommon";
import { formatDate, lfToBr } from "../../../commonModule";
import { DateInput } from "../../common/StdFormParts";
import { univApiCall } from '../../../albCommonModule';
import { setSnackMsg, setStore } from "../../../Actions";
import { YesNoDialog } from "../../common/GenericDialog";
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import { GoBackButton } from "../../common/commonParts";
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import DateRangeIcon from '@material-ui/icons/DateRange';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';

export const USERS_TIME_TABLE_DAYS = ["holiday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export const getUsersTimeTableInitDateStr = (planDts=[], stdDate) => {
  const [stdYear, stdMonth] = stdDate.split("-").map(x => parseInt(x));
  const lastStdDateStr = formatDate(new Date(stdYear, stdMonth, 0), "YYYY-MM-DD");
  const nowDateStr = formatDate(new Date(), "YYYY-MM-DD");
  const targetDateStr = (() => {
    if(nowDateStr < stdDate) return stdDate;
    if(stdDate <= nowDateStr && nowDateStr <= lastStdDateStr) return nowDateStr;
    if(lastStdDateStr < nowDateStr) return lastStdDateStr;
  })();
  const createds = planDts.map(dt => dt.created);
  createds.sort((a, b) => a <= b ?1 :-1);
  const initDateStr = createds.find(created => created <= targetDateStr);
  return initDateStr ?initDateStr :createds.length ?createds[0] :targetDateStr;
}

/**
 * 文字列の時間（hh:mm）を分に変換し整数値を返す
 * @param {String} timeStr 
 * @returns {Number}
 */
export const getMinutesFromTimeStr = (timeStr="00:00") => {
  const [hours, minutes] = timeStr.split(":").map(x => parseInt(x));
  return hours*60 + minutes;
}

/**
 * 分数を時間形式に変換
 * @param {Number} mins 
 * @returns {String}
 */
export const convMinsIntoTimeStr = (mins=0) => {
  const hour = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export const UsersTimeTableCreatedInput = (props) => {
  const {planDt, setPlanDt, originCreated} = props;
  return(
    <DateInput
      label="作成日"
      def={originCreated ?? planDt.created}
      setExtVal={(val) => setPlanDt({...planDt, created: val})}
      disabled={originCreated}
    />
  )
}

export const UsersTimeTableInfos = withStyles({
  root: {
    display: 'flex', marginBottom: 8,
    '& .userInfo': {
      paddingTop: 8, marginRight: 16,
      '& .name': {fontSize: 24},
      '& .sama, .ageStr': {fontSize: 14},
      '& .sama': {marginLeft: 2, marginRight: 8}
    }
  }
})((props) => {
  const {classes} = props;
  const {uid} = useParams();
  const users = useSelector(state => state.users);
  const user = users.find(prevUser => prevUser.uid === uid);

  return(
    <div className={classes.root}>
      <div className="userInfo">
        <span className="name">{user.name}</span>
        <span className="sama">さま</span>
        <span className="ageStr">{user.ageStr}</span>
      </div>
    </div>
  )
});

export const UsersTimeTableVersionSwitch = withStyles({

})(({setSnack}) => {
  const dispatch = useDispatch();
  const com = useSelector(state => state.com);
  const version = com?.ext?.userTimeTableSetting?.formVersion ?? "2";
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const history = useHistory();
  const {uid} = useParams();
  const location = useLocation();
  const urlParams = location.search;

  useEffect(() => {
    if(version === "1"){
      history.push(`/users/timetable/old/edit/${uid}/${urlParams}`);
    }
    if(version === "2"){
      history.push(`/users/timetable/edit/${uid}/${urlParams}`);
    }
  }, [version]);

  const handleClick = async(value) => {
    try{
      const newComExt = JSON.parse(JSON.stringify(checkValueType(com?.ext, "Object") ?com.ext :{}));
      if(!checkValueType(newComExt.userTimeTableSetting, 'Object')) newComExt.userTimeTableSetting = {};
      newComExt.userTimeTableSetting.formVersion = value;
      const params = {
        a: "sendComExt", hid, bid,
        ext: JSON.stringify(newComExt)
      }
      const res = await univApiCall(params);
      if(res?.data?.result){
        dispatch(setStore({com: {...com, ext: newComExt}}));
        if(value==="1"){
          history.push(`/users/timetable/old/edit/${uid}/`);
        }
        if(value==="2"){
          history.push(`/users/timetable/edit/${uid}/`);
        }
      }else{
        setSnack({msg: "問題が発生しました。再度お試しください。", severity: 'warning'})
      }
    }catch(error){
      setSnack({msg: "予期せぬエラーが発生しました。", severity: 'warning'});
    }
  }

  return(
    <ButtonGroup>
      <Button
        color='primary' size="small" variant='outlined'
        onClick={() => handleClick("1")}
        disabled={version === "1"}
        style={version==="1" ?{backgroundColor: teal[800], color: '#fff'} :{}}
      >
        詳細入力
      </Button>
      <Button
        color='primary' size="small" variant='outlined'
        onClick={() => handleClick("2")}
        disabled={version === "2"}
        style={version==="2" ?{backgroundColor: teal[800], color: '#fff'} :{}}
      >
        簡単入力
      </Button>
    </ButtonGroup>
  )
});

export const UsersTimeTableGoBackButton = () => {
  const limit1079px = useMediaQuery("(max-width:1079px)");
  const history = useHistory();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const historyParam = searchParams.get("history");

  const url = historyParam === "plan" ?`/plan/manegement` :`/users/timetable/`;
  if(limit1079px) return(
    <Button
      variant="outlined" color='primary'
      onClick={() => history.push(url)}
      style={{marginBottom: 8}}
    >
      <ArrowBackIosIcon />
      <span style={{fontSize: 16}}>戻る</span>
    </Button>
  )
  return(
    <GoBackButton posX={90} posY={0} url={url} />
  )
}

export const UsersTimeTableAddButton = (props) => {
  const {setPlanDt, setOriginPlanDt} = props;

  const handleClick = () => {
    setPlanDt({content: {}, created: null});
    setOriginPlanDt({content: {}, created: null});
  }

  return(
    <Button
      startIcon={<AddCircleOutlineIcon />}
      onClick={handleClick}
      style={{ color: indigo[500] }}
    >
      新規
    </Button>
  )
}

export const UsersTimeTableDateChangeButton = (props) => {
  const users = useSelector(state => state.users);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const dispatch = useDispatch();
  const {uid} = useParams();
  const {planDt, setPlanDt, setSnack} = props;
  const [open, setOpen] = useState(false);
  const [newDate, setNewDate] = useState("");

  const handleClose = () => {
    setOpen(false);
  }

  const handleChangeDate = async() => {
    try{
      if(!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) return;
      const targetUser = users.find(prevUser => prevUser.uid === uid);
      if(!targetUser) return;
      const newPlanDts = JSON.parse(JSON.stringify(targetUser?.timetable ?? []));
      const targetPlanDtIndex = newPlanDts.findIndex(prevPlanDt => prevPlanDt.created === planDt.created);
      if(targetPlanDtIndex !== -1){
        // 既存のデータがある場合は削除
        const deleteParams = {
          a: "deleteUsersPlan",
          hid, bid, uid,
          item: "timetable", created: planDt.created, 
        };
        const deleteRes = await univApiCall(deleteParams);
        if(!deleteRes?.data?.result){
          // 削除処理エラー
          setSnack({msg: "既存データの削除に失敗しました。", severity: 'warning'});
          return;
        }
        // 既存のデータを削除
        newPlanDts.splice(targetPlanDtIndex, 1);
      }
      // 新しい日付のデータを作成
      // const newPlanDt = {created: newDate, content: planDt.content};
      const newPlanDt = JSON.parse(JSON.stringify(planDt));
      newPlanDt.created = newDate;
      const newContent = newPlanDt.content;
      if(newContent.reason) newContent.reason = lfToBr(newContent.reason);
      if(newContent.note) newContent.note = lfToBr(newContent.note);
      const sendParams = {
        a: 'sendUsersPlan',
        hid, bid, uid,
        item: 'timetable', created: newPlanDt.created,
        content: JSON.stringify(newContent)
      };
      const sendRes = await univApiCall(sendParams);
      if(!sendRes?.data?.result){
        // 送信処理エラー
        setSnack({msg: "日付変更に失敗しました。", severity: 'warning'});
        return;
      }
      setPlanDt(newPlanDt);
      // ユーザー情報を更新
      newPlanDts.push(newPlanDt);
      newPlanDts.sort((a, b) => a.created <= b.created ?1 :-1);
      const newUsers = JSON.parse(JSON.stringify(users));
      const targetUserIndex = newUsers.findIndex(prevUser => prevUser.uid === uid);
      newUsers[targetUserIndex].timetable = newPlanDts;
      dispatch(setStore({users: newUsers}));
      dispatch(setSnackMsg("日付変更しました。"));
      setOpen(false);
    }catch(error){
      setSnack({msg: "書き込みに失敗しました。", severity: 'warning'});
    }
  }

  return(
    <>
    <Button
      color="primary"
      startIcon={<DateRangeIcon />}
      onClick={() => setOpen(true)}
      style={{ marginRight: 8 }}
    >
      日付変更
    </Button>
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>日付変更</DialogTitle>
      <DialogContent>
        <DateInput
          label="日付"
          required
          fullWidth
          setExtVal={(val) => setNewDate(val)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          キャンセル
        </Button>
        <Button onClick={handleChangeDate} color="primary">
          保存
        </Button>
      </DialogActions>
    </Dialog>
    </>
  )
}

export const UsersTimeTableCopyButton = (props) => {
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const users = useSelector(state => state.users);
  const dispatch = useDispatch();
  const {uid} = useParams();
  const {planDt, setPlanDt, setSnack} = props;
  const [open, setOpen] = useState(false);
  const [newDate, setNewDate] = useState("");

  const handleClose = () => {
    setOpen(false);
  }

  const handleCopy = async() => {
    try{
      if(!/^\d{4}-\d{2}-\d{2}$/.test(newDate)){
        setSnack({msg: "日付を入力してください。", severity: 'warning'});
        return;
      }
      const targetUser = users.find(prevUser => prevUser.uid === uid);
      if(!targetUser) return;
      // 新しい日付のデータを作成
      const newPlanDt = {created: newDate, content: planDt.content};
      const sendParams = {
        a: 'sendUsersPlan',
        hid, bid, uid,
        item: 'timetable', created: newPlanDt.created,
        content: JSON.stringify(newPlanDt.content)
      };
      const sendRes = await univApiCall(sendParams);
      if(!sendRes?.data?.result){
        // 送信処理エラー
        setSnack({msg: "コピーに失敗しました。", severity: 'warning'});
        return;
      }
      setPlanDt(newPlanDt);
      // ユーザー情報を更新
      const newPlanDts = JSON.parse(JSON.stringify(targetUser?.timetable ?? []));
      newPlanDts.push(newPlanDt);
      newPlanDts.sort((a, b) => a.created <= b.created ?1 :-1);
      const newUsers = JSON.parse(JSON.stringify(users));
      const targetUserIndex = newUsers.findIndex(prevUser => prevUser.uid === uid);
      newUsers[targetUserIndex].timetable = newPlanDts;
      dispatch(setStore({users: newUsers}));
      dispatch(setSnackMsg("コピーしました。"));
      setOpen(false);
    }catch(error){
      setSnack({msg: "コピーに失敗しました。", severity: 'warning'});
    }
  }

  return(
    <>
    <Button
      startIcon={<FileCopyIcon />}
      onClick={() => setOpen(true)}
      color="secondary"
      style={{ marginRight: 8 }}
    >
      コピー
    </Button>
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>コピー</DialogTitle>
      <DialogContent>
        <DateInput
          label="新しい日付"
          def={newDate}
          required
          fullWidth
          setExtVal={(val) => setNewDate(val)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          キャンセル
        </Button>
        <Button onClick={handleCopy} color="primary">
          保存
        </Button>
      </DialogActions>
    </Dialog>
    </>
  )
}

export const UsersTimeTableDeleteButton = (props) => {
  const users = useSelector(state => state.users);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const dispatch = useDispatch();
  const {uid} = useParams();
  const {planDt, setPlanDt, setSnack} = props;
  const [open, setOpen] = useState(false);

  const handleDelete = async() => {
    try{
      const targetUser = users.find(prevUser => prevUser.uid === uid);
      if(!targetUser) return;

      // サーバーから削除
      if(planDt.created){
        const deleteParams = {
          a: "deleteUsersPlan",
          hid, bid, uid,
          item: "timetable", created: planDt.created,
        };
        const deleteRes = await univApiCall(deleteParams);
        if(!deleteRes?.data?.result){
          setSnack({msg: "削除に失敗しました。", severity: 'warning'});
          return;
        }
      }

      // ローカルデータ更新
      const newPlanDts = JSON.parse(JSON.stringify(targetUser?.timetable ?? []));
      const targetPlanDtIndex = newPlanDts.findIndex(prevPlanDt => prevPlanDt.created === planDt.created);
      if(targetPlanDtIndex !== -1){
        newPlanDts.splice(targetPlanDtIndex, 1);
      }
      const newPlanDt = {created: null, content: {}};
      setPlanDt(newPlanDt);
      const newUsers = JSON.parse(JSON.stringify(users));
      const targetUserIndex = newUsers.findIndex(prevUser => prevUser.uid === uid);
      newUsers[targetUserIndex].timetable = newPlanDts;
      dispatch(setStore({users: newUsers}));
      dispatch(setSnackMsg("削除しました。"));
      setOpen(false);
    }catch(error){
      setSnack({msg: "削除に失敗しました。", severity: 'warning'});
    }
  }

  const [createdYear, createdMonth, createdDay] = (planDt.created ?? "").split("-");
  const yesnoDialogProps = {
    open, setOpen, handleConfirm: handleDelete,
    prms: {
      title: "計画支援時間を削除",
      message: (
        `${createdYear}年${createdMonth}月${createdDay}日の計画支援時間を削除します。\n`
        + "削除すると元に戻すことはできません。\n"
        + "削除してよろしいですか？"
      )
    }
  };
  return(
    <>
    <Button
      startIcon={<DeleteForeverIcon />}
      style={{ color: red["A700"] }}
      onClick={() => setOpen(true)}
    >
      削除
    </Button>
    <YesNoDialog {...yesnoDialogProps} />
    </>
  )
}