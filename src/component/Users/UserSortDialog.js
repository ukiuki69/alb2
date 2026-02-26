import React, { useState, useEffect } from 'react';
import Dialog from '@material-ui/core/Dialog';
import * as comMod from '../../commonModule'
import { useDispatch, useSelector } from 'react-redux';
import * as mui from '../common/materialUi';
import * as Actions from '../../Actions';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import IconButton from '@material-ui/core/IconButton';
import { HOHOU, HOUDAY, JIHATSU, KEIKAKU_SOUDAN, SYOUGAI_SOUDAN } from '../../modules/contants';
import { endPoint, getClassrooms, isClassroom, isService } from '../../albCommonModule';
import axios from 'axios';
import teal from '@material-ui/core/colors/teal';
import { DisplayHintGroups } from '../common/DisplayHintGroupes';

const useStyles = makeStyles({
  usersSortDialog:{
    ' & .MuiDialog-paperWidthSm': {
      width: '65%',
      minWidth: '500px',
      maxWidth: '600px',  
    },
    ' & .MuiDialogContent-root': {
      margin: 0,
      padding: 0,
      overflowX: 'hidden', // この設定がないと横スクロールバーが出ちゃう
    },
    '& .MuiDialogTitle-root': {
      padding: 0,
    },
    '& .MuiIconButton-root' : {
      padding: 6,
      marginLeft: 6,
    },
    '& .formTitle': {
      marginBottom: 0,
    },
    '& .flxRow .buttonWrap' :{
      padding: 0,
      backgroundColor: 'transparent',
    },
    '& .flxRow.cUser>div ': {
      backgroundColor: teal[50],      
    },
    '& .MuiDialogActions-root':{
      flexWrap: 'wrap',
      '& .stdSortButtons': {
        width: '100%',
        padding: '0, 16px',
        '& .MuiButton-label': {color: teal[800]}
      }
    },
  },
});

// ユーザーインデックスを更新する
export const requestUserIndexUpdate = async (prms)=> {
  // susers ソート済みのユーザー
  // users Storeのユーザー
  const {
    susers, hid, bid, setres, dispatch,
  } = prms;

  // dbに送信するための配列作成
  const indexset = susers.map(e => {
    return [e.uid, e.sindex];
  });
  const jindexset = JSON.stringify(indexset);
  // dbのアップデート 
  let res;
  const urlPrms = {
    hid, bid, indexset: jindexset, a: 'sendUsersIndex'
  };
  try {
    res = await axios.post(endPoint(), comMod.uPrms(urlPrms));
    if (!res.data.resulttrue > 0 || res.data.resultfalse) {
      throw new Error(res);
    }
    console.log('requestUserIndexUpdate', res);
    setres(res);
    if (typeof dispatch === 'function'){
      dispatch(Actions.setSnackMsg('ユーザーの並び順を更新しました。', ''));
    }
  }
  catch {
    setres(res);
    if (typeof dispatch === 'function'){
      dispatch(
        Actions.setSnackMsg('ユーザーの並び替えで問題が発生しました。', 'error')
      );
    }
  }
}


export const UserSortDialog = (props) =>{
  // stateのopenで開く、uidsはuidを持つ
  // editOnで修正モード、uidに従って修正を行う
  const dispatch = useDispatch();
  const {open, setopen, res, setres, ...other} = props;
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const classroom = useSelector(state => state.classroom);
  const serviceItems = useSelector(state => state.serviceItems);
  const service = useSelector(state => state.service);
  const schedule = useSelector(state => state.schedule);
  const classes = useStyles();
  const users = useSelector(state=>state.users);
  // 直前でクリックされたuid保持。画面強調表示用
  const [cuid, setCuid] = useState('');
  const classrooms = getClassrooms(users);
  // classroomによりsindexの末尾一桁を変更する
  const clsOffset = (classroom && users.length)
  ? classrooms.findIndex(e=>e === classroom) + 1 : 0;
  // スケジュール情報取得しておく
  const scheduleInfo = comMod.getScheduleInfo(schedule, service, users, classroom);
  // 順番入れ替え用のuser配列をstateに突っ込む
  const [tusers, setTusers] = useState(()=>{
    const t = JSON.parse(JSON.stringify(users));
    const r = t.map(e=>{
      // if (classroom !== '' && classroom !== e.classroom)  return false;
      if (!isClassroom(e, classroom)) return false;
      // if (service !== '' && service !== e.service) return false;
      if (!isService(e, service)) return false;
      return e;
    }).filter(e=>e);
    r.forEach(e=>{e.countOfUse = scheduleInfo?.uidCounts?.['UID' + e.uid]?.count || 0})
    r.sort((a, b)=>(a.sindex > b.sindex? 1: -1));
    // 2022/03/03 インデックスが重複することがあるので変更しておく
    let v = 100 + clsOffset;
    r.forEach(e => {
      e.sindex = v;
      v += 10;
    });
    return r;
  });
  // dbapi レスポンス格納用
  // const [res, setres] = useState({});

  const handleSubmit = (e)=>{
    // const t = [...users];
    // tusers.map(e=>{
    //   const i = t.findIndex(f=>f.uid === e.uid);
    //   if (i > -1) t[i] = e;
    // });
    // t.sort((a, b)=>(parseInt(a.sindex) > parseInt(b.sindex)? 1: -1));
    let initIndex = 100;
    const t = tusers.map(e=>({...e, sindex: initIndex += 10}));
    // t.forEach(e=>{console.log(e.name + ' / ' + e.sindex)});
    // const u = [...users]; シャローコピー問題？
    const u = JSON.parse(JSON.stringify(users));
    t.forEach(e=>{
      const p = u.findIndex(f=>f.uid === e.uid);
      u[p].sindex = e.sindex;
    });
    u.sort((a, b)=>(parseInt(a.sindex) > parseInt(b.sindex)? 1: -1));
    // u.forEach(e=>{console.log(e.name + ' / ' + e.sindex)});

    dispatch(Actions.updateUsersAll(u));
    const prms = {susers: t, hid, bid, setres, dispatch}
    requestUserIndexUpdate(prms);
    setopen(false);
  }
  const cancelSubmit = ()=>{
    setopen(false);
  }

  // アップダウンのクリックハンドラ
  const handleUpDownClick = (ev) =>{
    let uid = ev.currentTarget.getAttribute('uid');
    if (uid) setCuid(uid);
    else uid = cuid;
    const dir = parseInt(ev.currentTarget.getAttribute('dir'));
    const ndx = tusers.findIndex(e => e.uid === uid);
    const wk = [...tusers];
    if (ndx === -1) return false;
    if (ndx === 0 && dir < 0) return false;
    if (ndx === tusers.length - 1 && dir > 0) return false;
    let nextNdx = ndx + dir;
    if (dir >= 1) nextNdx++;
    if (nextNdx < 0) nextNdx = 0;
    if (nextNdx > tusers.length) nextNdx = tusers.length;
    const current = { ...wk[ndx] };
    // const target = { ...wk[nextNdx] };
    wk.splice(nextNdx, 0, current);
    if (dir > 0){
      wk.splice(ndx, 1);
    }
    else{
      wk.splice(ndx + 1, 1);
    }
    if (dir > 0) nextNdx--;

    // const t = wk[ndx].sindex;
    // wk[ndx].sindex = wk[nextNdx].sindex;
    // wk[nextNdx].sindex = t;

    setTusers(wk);
  }
  const rowClickHandler = (ev) => {
    ev.stopPropagation();
    const uid = ev.currentTarget.getAttribute('uid');
    setCuid(uid);

  }
  // 標準ソートボタン
  const stdSortClick = (ev, v) => {
    const t = [...tusers];
    const svcAry = [JIHATSU, HOUDAY, HOHOU, SYOUGAI_SOUDAN, KEIKAKU_SOUDAN];
    const n = (svc) => svcAry.findIndex(e=>e===svc);
    if (v === 0){ // 50音
      t.sort((a, b) => (a.kana < b.kana)? -1: 1);
    }
    else if (v === 1){ // 学齢
      t.sort((a, b) => (a.ageNdx < b.ageNdx)? -1: 1);
    }
    else if (v === 2){ // 利用開始日
      t.sort((a, b) => (a.startDate < b.startDate)? -1: 1);
    }
    else if (v === 3){ // 所属・学校
      t.sort((a, b) => (a.belongs1 < b.belongs1)? -1: 1);
    }
    else if (v === 4){ // 契約日
      t.sort((a, b) => (a.contractDate < b.contractDate)? -1: 1);
    }
    else if (v === 5){ // サービス順
      t.sort((a, b) => (n(a.service) < n(b.service))? -1: 1);
    }
    // 複数単位は最初に出現した単位でソートする
    else if (v === 6){ // 単位
      t.sort((a, b) => (a.classroom.split(',')[0] < b.classroom.split(',')[0])? -1: 1);
    }
    else if (v === 7){ // 利用回数
      t.sort((a, b) => (a.countOfUse < b.countOfUse)? 1: -1);
    }
    setTusers(t);
  }
  let ln = 0; // 行番号
  const userSortContentRows = tusers.map((e, i)=>{
    // if (classroom !== '' && classroom !== e.classroom)  return false;
    // if (service !== '' && service !== e.service) return false;
    const cUserClass = (e.uid === cuid) ? 'cUser' : '';
    ln++;
    return(
      <div 
        className={'flxRow oddColor ' + cUserClass} key={i}
        uid={e.uid} onClick={rowClickHandler} 
      >
        <div className='wmin'>{ln}</div>
        <div className='w25'>{e.name}</div>
        <div className='w10'>{e.ageStr}</div>
        <div className='w50'>{e.belongs1}</div>
        <div className='w20 buttonWrap'>
          <IconButton onClick={handleUpDownClick} uid={e.uid} dir={-1}>
            <ArrowUpwardIcon />
          </IconButton>
          <IconButton onClick={handleUpDownClick} uid={e.uid} dir={1}>
            <ArrowDownwardIcon />
          </IconButton>
        </div>

      </div>
    );
  });

  return(<>
    <Dialog className={classes.usersSortDialog}
      open={open}
      onClose={()=>setopen(false)}
    >
      <DialogTitle>
        <div className='formTitle'>
          利用者並び替え
        </div>
      </DialogTitle>
      <DialogContent className={classes.userDialogContentRoot}>
        {userSortContentRows}    
      </DialogContent>
      <DialogActions>
        <div className='stdSortButtons'>
          <Button onClick={ev=>stdSortClick(ev, 0)}>50音</Button>
          <Button onClick={ev=>stdSortClick(ev, 7)}>利用回数</Button>
          <Button onClick={ev=>stdSortClick(ev, 1)}>学齢</Button>
          <Button onClick={ev=>stdSortClick(ev, 2)}>利用開始日</Button>
          <Button onClick={ev=>stdSortClick(ev, 4)}>契約日</Button>
          <Button onClick={ev=>stdSortClick(ev, 3)}>所属学校</Button>
          {serviceItems.length > 1 &&
            <Button onClick={ev=>stdSortClick(ev, 5)}>サービス種別</Button>
          }
          {classrooms.length > 1 &&
            <Button onClick={ev=>stdSortClick(ev, 6)}>単位</Button>
          }

        </div>
        <IconButton onClick={handleUpDownClick} dir={-1}>
          <ArrowUpwardIcon />
        </IconButton>
        <IconButton onClick={handleUpDownClick} dir={1}>
          <ArrowDownwardIcon />
        </IconButton>
        <Button 
          startIcon={<ArrowUpwardIcon />}
          onClick={handleUpDownClick} dir={-5}
        >
          5
        </Button>
        <Button 
          startIcon={<ArrowDownwardIcon />}
          onClick={handleUpDownClick} dir={5}
        >
          5
        </Button>
        <div className='buttonWrapper'>
          <mui.ButtonGP
            color='secondary'
            label='キャンセル'
            onClick={cancelSubmit}
          />
          <mui.ButtonGP
            color='primary'
            label='送信'
            type="submit"
            onClick={handleSubmit}
          />

        </div>
      </DialogActions>
      
    </Dialog>
  </>)
}
export default UserSortDialog;