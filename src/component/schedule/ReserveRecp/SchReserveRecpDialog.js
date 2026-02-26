import React, { createContext, useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, makeStyles } from "@material-ui/core"
import CloseIcon from '@material-ui/icons/Close';
import { DAY_LIST } from '../../../hashimotoCommonModules';
import { useDispatch, useSelector } from 'react-redux';
import { grey, teal } from '@material-ui/core/colors';
import { doc, getFirestore, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { setStore } from '../../../Actions';
import { univApiCall } from '../../../albCommonModule';

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB-Lj2ECjCYup2FqFGCp2r61U9yD5u5luY",
  authDomain: "albatross-432004.firebaseapp.com",
  projectId: "albatross-432004",
  storageBucket: "albatross-432004.appspot.com",
  messagingSenderId: "238548710535",
  appId: "1:238548710535:web:ceb3a1b4513826ee2bb422"
};
const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app, "reserves");

const useStyles = makeStyles({
  dialog: {
    '& .title': {
      color: teal[800], 
    },
    '& .closeButton': {
      position: 'absolute', right: 8, top: 8,
      color: grey[600]
    },
  },
  reserveList: {
    '& .userRow': {
      display: 'flex', alignItems: 'center',
      '& .name': {width: '10rem'},
      '& .start, .end': {width: '5rem'},
      '& .location': {width: '8rem'},
    }
  },
  reserveContents: {
    width: '100%',
    '& th, td': {
      padding: '8px 12px',
      border: `1px solid ${teal[800]}`
    },
    '& th': {
      width: '64px',
      backgroundColor: teal[600], color: '#fff'
    }
  }
})

export const SchReserveRecpDialog = (props) => {
  const dispatch = useDispatch();
  const scheduleTemplate = useSelector(state => state.scheduleTemplate);
  const dateList = useSelector(state => state.dateList);
  const users = useSelector(state => state.users);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const schedule = useSelector(state => state.schedule);
  const {handleClose, reserve, uid, ...dialogProps} = props;
  const classes = useStyles();
  const user = users.find(prevUser => prevUser.uid === uid);
  const did = reserve?.data?.did ?? "";
  const year = parseInt(did.slice(1, 5)), month = parseInt(did.slice(5, 7)), date = parseInt(did.slice(7, 9));
  const day = new Date(year, month-1, date).getDay();
  const data = reserve?.data ?? {};

  const handleClick = async() => {
    const uidStr = "UID"+uid;
    const sendData = {[uidStr]: {}};
    try{
      const sch = sendData[uidStr];
      const newReserve = JSON.parse(JSON.stringify(reserve));
      const newSchedule = JSON.parse(JSON.stringify(schedule));

      const data = newReserve.data;
      const dateDt = dateList.find(dt => {
        const dateObj = new Date(dt.date);
        const year = dateObj.getFullYear(), month = dateObj.getMonth(), date = dateObj.getDate();
        const prevDid = `D${year}${String(month+1).padStart(2, '0')}${String(date).padStart(2, '0')}`;
        return did === prevDid;
      });
      const dateType = dateDt.holiday == 0 ?"weekday" :"schoolOff";
      const template = scheduleTemplate?.[user.service]?.[dateType] ?? {};
      const newSchDt = {...template, absence: true, reserve: true};
      if(data.start) newSchDt.start = data.start;
      if(data.end) newSchDt.end = data.end;
      if(data.pickupLocation) newSchDt.transfer[0] = data.pickupLocation;
      if(data.dropoffLocation) newSchDt.transfer[1] = data.dropoffLocation;
      sch[did] = newSchDt;
      data.status = "merged";
      // ステート更新
      if(!newSchedule[uidStr]) newSchedule[uidStr] = {};
      newSchedule[uidStr][did] = newSchDt;

      const sendParams = {
        a: "sendPartOfData",
        table: "ahdschedule", column: "schedule",
        hid, bid, date: stdDate, partOfData: JSON.stringify(sendData)
      };
      const sendRes = await univApiCall(sendParams);
      if(sendRes?.data?.result){
        await setDoc(doc(db, user.hno, newReserve.id), data);
        dispatch(setStore({schedule: newSchedule}));
      }
    }catch(error){
      console.log("予期せぬエラー");
    }
  }

  return(
    <Dialog
      fullWidth
      onClose={handleClose}
      className={classes.dialog}
      {...dialogProps}
    >
      <DialogTitle style={{padding: '8px 12px', textAlign: 'center', color: teal[800]}}>
        予約内容確認
        {/* <IconButton className="closeButton" onClick={handleClose}><CloseIcon /></IconButton> */}
      </DialogTitle>
      <DialogContent>
        <table className={classes.reserveContents}>
          <tr><th>児童名</th><td>{user?.name ?? ""}</td></tr>
          <tr><th>ご利用日</th><td>{year}年{month}月{date}日({DAY_LIST[day]})</td></tr>
          {Boolean(data.start) &&<tr><th>開始時間</th><td>{data.start}</td></tr>}
          {Boolean(data.end) &&<tr><th>終了時間</th><td>{data.end}</td></tr>}
          {Boolean(data.pickupLocation) &&<tr><th>お迎え場所</th><td>{data.pickupLocation}</td></tr>}
          {Boolean(data.dropoffLocation) &&<tr><th>送り場所</th><td>{data.dropoffLocation}</td></tr>}
          {Boolean(data.notice) &&<tr><th>備考</th><td>{data.notice}</td></tr>}
        </table>
      </DialogContent>
      <DialogActions>
        <Button variant='contained' color='secondary' onClick={handleClose}>キャンセル</Button>
        <Button variant='contained' color='primary' onClick={handleClick}>予約取込</Button>
      </DialogActions>
    </Dialog>
  )
}