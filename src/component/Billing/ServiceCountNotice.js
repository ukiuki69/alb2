import React, {useState, useEffect, } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { useDispatch, useSelector, ReactReduxContext } from 'react-redux';
import * as Actions from '../../Actions';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import teal from '@material-ui/core/colors/teal';
import blue from '@material-ui/core/colors/blue';
import red from '@material-ui/core/colors/red';
import lime from '@material-ui/core/colors/lime';
import deepOrange from '@material-ui/core/colors/deepOrange';
import Dialog from '@material-ui/core/Dialog';
import MouseIcon from '@material-ui/icons/Mouse';
import InfoIcon from '@material-ui/icons/Info';
import { getSvcNameByCd, setBillInfoToSch, svcCnt } from './blMakeData';
import * as comMod from '../../commonModule';
import { config } from '@fortawesome/fontawesome-svg-core';
import { 
  HOHOU, HOUDAY, JIHATSU, KANRI_JIGYOUSYO, KEIKAKU_SOUDAN, 
  KYOURYOKU_JIGYOUSYO, SYOUGAI_SOUDAN 
} from '../../modules/contants';
import { chekBillingDt, inService } from '../../albCommonModule';
import { getVolume } from '../schedule/SchTableBody2';
import { CheckBillingEtc } from './CheckBillingEtc';

const useStyles = makeStyles((theme) => ({
  close: {
    padding: theme.spacing(0.5),
  },
  snackNormal: {
    ' & .MuiSnackbar-root .MuiPaper-root': {
      backgroundColor:teal[900]
    }
  },
  snackWarning: {
    ' & .MuiSnackbar-root .MuiPaper-root': {
      backgroundColor: lime[900]
    }
  },
  snackSuccess: {
    ' & .MuiSnackbar-root .MuiPaper-root': {
      backgroundColor: blue[900]
    }
  },
  snackError: {
    ' & .MuiSnackbar-root .MuiPaper-root': {
      backgroundColor: red[800]
    }
  },
  snackClass:{
    '& .MuiSnackbar-root .MuiPaper-root': {
      backgroundColor: red[50],
    },
    '& .MuiSnackbarContent-message':{color:red[900]},
    '& .MuiSvgIcon-root': {color:red[900]},
    '& .detailLabl>span':{
      display:'inline-block', padding: 9, color:red[900],
      cursor:'pointer',
    },
    '& .detailLabl .MuiSvgIcon-root':{marginTop: -1},
    '@media print':{display: 'none'},
  },
  dialogRoot: {
    '& .MuiDialog-paperWidthSm':{width: 800, maxWidth: '90%'}
  },
  errDialog: {
    padding: 16, 
    lineHeight: 1.4, 
    // fontWeight:600,
    '& .inner': {paddingTop: 4, paddingBottom: 4},
    '& .buttonWrap': {textAlign: 'center', paddingTop: 8, paddingBottom: 4},
    '& .imgWrap': {textAlign: 'center'},
    '& .errId': {
      color: teal[100], fontSize:'1.2rem', fontWeight: 600, //padding: '0 4px',
    },
    '& .detail': {fontSize: '.9rem',color:deepOrange[900]}
  },
  divInSnack:{
    background:red[50],color:red[900],
  },
}));

// usersからユニークな管理事業所協力事業所の配列を得る
export const otherOfficeisFromUsers = (users) => {
  const t = [];
  users.forEach(e=>{
    [KANRI_JIGYOUSYO, KYOURYOKU_JIGYOUSYO].forEach(f=>{
      // 管理タイプが協力の場合、登録されている協力は無視する
      if (f === KANRI_JIGYOUSYO && e.kanri_type !== KYOURYOKU_JIGYOUSYO) return;
      if (f === KYOURYOKU_JIGYOUSYO && e.kanri_type !== KANRI_JIGYOUSYO) return;
      if (!e.etc) return;
      const o = e.etc[f];
      if (!o) return;
      e.etc[f].forEach(g=>{
        t.push(g.no + ',' + g.name);
      })
    })
  });
  const u = Array.from(new Set(t)).map(e=>(
    {no: e.split(',')[0], name: e.split(',')[1]}
  ));
  return u;
}
export const otherOfficeisFromSchedule = (sch, users) => {
  const t = [];
  Object.keys(sch).filter(e=>e.match(/^UID[0-9]+/)).forEach(e=>{
    const u = comMod.getUser(e, users);
    const kanri_type = u.kanri_type;
    // console.log(u.uid, u.name);
    const o = sch[e];
    [KANRI_JIGYOUSYO, KYOURYOKU_JIGYOUSYO].forEach(f=>{
      // if (f === KANRI_JIGYOUSYO && kanri_type !== KYOURYOKU_JIGYOUSYO) return;
      // if (f === KYOURYOKU_JIGYOUSYO && kanri_type !== KANRI_JIGYOUSYO) return;
      if (!o[f]) return false;
      o[f].forEach(g=>{
        t.push(g.no + ',' + g.name);
      })
    });
  });
  const u = Array.from(new Set(t)).map(e=>(
    {no: e.split(',')[0], name: e.split(',')[1]}
  ));
  return u;
}
// 事業所番号の変更を可能にしたのでusersとscheduleで不一致が発生する可能性がある
// それを検出する
export const otherOfficeNotMatch = (users, schedule, stdDate) => {
  const d = new Date();
  const today = d.getDate();
  d.setDate(1);
  const thisMonth = comMod.formatDate(d, 'YYYY-MM-DD');
  // 先月の文字列を得る
  const p = new Date(d.getTime());
  p.setMonth(p.getMonth() - 1);
  const lastMonth = comMod.formatDate(p, 'YYYY-MM-DD');
  let match = false; // 当月先月請求期間中などの状態を得る
  if (stdDate == thisMonth){ // 当月で請求期間以外
    match = true;
  }
  else if (stdDate === lastMonth && today <= 10){
    match = true;
  }
  // 当月または請求期間以外は検出を行わない
  if (!match) return [];

  const ooUsers = otherOfficeisFromUsers(users);
  const ooSchedule = otherOfficeisFromSchedule(schedule, users);
  // usersに登録されている他事業所とスケジュールに登録されているそれを比較
  const ooNotUniq = [];
  ooSchedule.forEach(e=>{
    const o = ooUsers.find(f => f.name === e.name);
    if (!o) ooNotUniq.push(e.name);
    else if (o.no !== e.no){
      ooNotUniq.push(e.name);
    }
  });
  // ユーザー内での重複チェック
  ooUsers.forEach(e=>{
    if (ooUsers.filter(f=>f.name===e.name).length > 1){
      ooNotUniq.push(e.name);
    }
  });
  
  // スケジュール内での重複チェック
  ooSchedule.forEach(e=>{
    if (ooSchedule.filter(f=>f.name===e.name).length > 1){
      ooNotUniq.push(e.name);
    }
  });

  return ooNotUniq;
}

export const checkServiceCount = (prms) => {
  const {
    billingDt, serviceItems, classrooms, com, users, stdDate, schedule
  } = prms;
  if ([SYOUGAI_SOUDAN, KEIKAKU_SOUDAN].some(e=>serviceItems.includes(e))) return [];
  if (!Array.isArray(billingDt)) return [];
  const t = []; // 利用者ごとの通知用
  const s = []; // 利用日ごとの通知用
  // 日毎の利用数を記述するオブジェクト
  const dayofUse = {};
  serviceItems.map(e=>dayofUse[e] = {});
  Object.keys(dayofUse).map(e=>{
    classrooms.map(f=>{
      dayofUse[e][f] = {};  
    })
  })
  const names = [];
  billingDt.map(e=>{
    Object.keys(e).filter(f=>f.indexOf('D2') === 0).map(f=>{
      const o = e[f];
      if (o.absence)  return false;
      // 複数サービス対応
      let s;
      if (svcCnt(e.service) === 1) s = e.service;
      else if (o.service) s = o.service;
      else if (inService(e.service, HOUDAY)) s = HOUDAY;
      else if (inService(e.service, JIHATSU)) s = JIHATSU;
    
      const c = (e.classroom)? e.classroom: 'nc';
      // console.log(dayofUse, s, c, f, e);
      // if (!o.service) console.log(e.name);
      if (!dayofUse?.[s]?.[c]?.[f]){
        if (!dayofUse?.[s]){
          console.log(s, e, 's');
          dayofUse[s] = {};
        }
        if (!dayofUse?.[s]?.[c]){
          console.log(s, c, e, 's, c');
          dayofUse[s][c] = {};
        }

        dayofUse[s][c][f] = 1;
      }
      else{
        dayofUse[s][c][f]++;
      }
      // サービスごと単位でない場合のカウント
      if (s === HOHOU) return false; // ここでは保訪をカウントしない
      if (dayofUse[c] === undefined)  dayofUse[c] = {};
      if (dayofUse[c][f] === undefined){
        dayofUse[c][f] = 1;
      }
      else{
        dayofUse[c][f]++;
      }
    });
  });

  // 利用回数のチェック
  Object.keys(dayofUse).map(e=>{
    let teiin = comMod.findDeepPath(com, ['addiction', e, '定員']);
    teiin = parseInt(comMod.null2Zero(teiin));
    const limit = comMod.upperLimitOfUseByDay(teiin);
    // サービスごとの単位かどうか
    const SasT = comMod.findDeepPath(
      com, ['addiction', e, 'サービスごと単位']
    );
    if (!SasT)  return false; // サービスごと単位でない場合はここでは行わない
    // サービス名ではないキーはここでは扱わない
    if (serviceItems.indexOf(e) === -1) return false;
    Object.keys(dayofUse[e]).map(f=>{
      Object.keys(dayofUse[e][f]).map(g=>{
        if (dayofUse[e][f][g] > limit){
          const d = comMod.convDid(g);
          const fd = comMod.formatDate(d, 'MM月DD日');
          s.push({
            item:'dayOfUse', date:fd, limit, count:dayofUse[e][f][g],
            classroom: (f === 'nc')? '': f
          });
        }
      })
    })
  });
  // 利用回数チェック サービスごと単位でない場合
  // 定員は任意のサービスから取得する
  // const defSvc = serviceItems[0]; // 任意のサービス 定員取得用
  const defSvc = serviceItems.filter(e=>[HOUDAY,JIHATSU].includes(e))[0];
  let teiin = comMod.findDeepPath(com, ['addiction', defSvc, '定員']);
  teiin = parseInt(comMod.null2Zero(teiin));
  const limit = comMod.upperLimitOfUseByDay(teiin);
  // サービスごとの単位かどうか
  const SasT = comMod.findDeepPath(
    com, ['addiction', defSvc, 'サービスごと単位']
  );
  if (!SasT){
    Object.keys(dayofUse).forEach(e=>{
      if (SasT)  return false; // サービスごと単位の場合はここでは行わない
      // サービス名がキーの場合はスキップ
      if (serviceItems.indexOf(e) > -1) return false;

      Object.keys(dayofUse[e]).map(f=>{
        if (dayofUse[e][f] > limit){
          const d = comMod.convDid(f);
          const fd = comMod.formatDate(d, 'MM月DD日');
          s.push({
            item:'dayOfUse', date:fd, limit, count:dayofUse[e][f],
            classroom: (e === 'nc')? '': e
          });
        }
      })
    });
  }
  billingDt.map(e=>{
    // 回数集計された配列を舐めて利用数オーバーを検出
    // 検出された内容をmsgDetaiにセット
    if (!Array.isArray(e.itemTotal)) return false;
    // 専門的支援実施加算の利用回数を求める
    const senmonJisshi = '専門的支援実施加算';
    const KankeiRenkei = '関係機関連携加算';
    const senmonJisshiLimit = (() => {
      const countOfUse = e.countOfUse;
      const trgItem = e.itemTotal.find(f=>f.name === senmonJisshi)
      if (!trgItem) return false;
      if (countOfUse >= 12) return 6;
      if (e.service.includes(HOUDAY) && countOfUse >= 6) return 4;
      return trgItem.limit;
    })();
    e.itemTotal.map(f=>{
      if (f.limit === '') return false;
      // 専門的支援実施加算の処理
      if (f.name === senmonJisshi && senmonJisshiLimit && f.count > senmonJisshiLimit){
        t.push({
          name: e.name, item: f.name, 
          limit: parseInt(senmonJisshiLimit), count: f.count,
          UID: e.UID
        })
        return;
      }
      if (f.name !== senmonJisshi && f.count > parseInt(f.limit)){
        t.push({
          name: e.name, item: f.name, 
          limit: parseInt(f.limit), count: f.count,
          UID: e.UID
        })
      }
    });
    // 関係機関連携のチェック
    const kankeiRenkeiTotal = e.itemTotal.reduce((v, item)=>{
      if (item.name === KankeiRenkei) return v + Number(item.count);
      return v;
    }, 0);
    const kankeiRenkeiLimit = Number(e.itemTotal.find(item=>item?.name === KankeiRenkei)?.limit || 0);
    if (kankeiRenkeiTotal > kankeiRenkeiLimit){
      t.push({
        name: e.name, item: KankeiRenkei, 
        limit: kankeiRenkeiLimit, count: kankeiRenkeiTotal,
        UID: e.UID
      })
    }
    // 家族支援加算のチェック
    const kazokushitenItems = e.itemTotal.filter(f=>(f?.name || '').match(/^家族支援加算[ⅠⅡ]/));
    const kazokuShienCnt = kazokushitenItems.reduce((cnt, item)=>(cnt += item.count), 0);
    if (kazokuShienCnt > 4){
      t.push({
        name: e.name, item: '家族支援加算', 
        limit: 4, count: kazokuShienCnt,
        UID: e.UID
    })
    }

    // ベースアイテム
    // 複数サービスの場合
    const ms = Array.isArray(e.serviceSyubetu) && e.serviceSyubetu.length > 1;
    if (ms){
      e.serviceSyubetu.forEach(x=>{
        // この場合、xには　61, 64などが入る
        const baseCnt = e.itemTotal
        .filter(f=>f.baseItem && parseInt(f.s.slice(0, 2)) === x)
        .reduce((v, f)=>(v + f.count), 0);
        const thisUser = comMod.getUser(e.UID, users);
        const svcNm = getSvcNameByCd(x);
        // const vol = comMod.fdp(thisUser, `multiSvc.${svcNm}.volume`);
        const vol = getVolume(thisUser, svcNm, stdDate);
        if (baseCnt > vol){
          t.push({
            name: e.name, item: 'baseItem', 
            // limit: parseInt(e.volume), 
            limit: vol, 
            count: baseCnt,
            UID: e.UID

          });
        }
      })
    }
    else{
      // 通常
      const baseCnt = e.itemTotal.filter(f=>f.baseItem)
      .reduce((v, f)=>(v + f.count), 0);
      if (baseCnt > e.volume){
        t.push({
          name: e.name, item: 'baseItem', 
          limit: parseInt(e.volume), count: baseCnt,
          UID: e.UID
        });
      }
    }
    // 括って回数を出すパターン
    // --- 上限がありかつ上限内
    const inLimit = e.itemTotal
    .filter(f=>f.limit && f.count <= parseInt(f.limit));
    const kaRen = inLimit.filter(f=>f.name==='家庭連携加算');
    const kaRenCnt = kaRen.reduce((v, f)=>(v + f.count), 0);
    const kaRenLimit = (kaRen.length)? parseInt(kaRen[0].limit): 200;
    if (kaRenCnt > kaRenLimit){
      t.push({
        name: e.name, item: '家庭連携加算', 
        limit: kaRenLimit, count: kaRenCnt,
        UID: e.UID
      });
    }
  });
  const ooNotUniq = otherOfficeNotMatch(users, schedule, stdDate);
  // console.log(ooNotUniq, 'ooNotUniq');
  ooNotUniq.forEach(e=>{
    t.push({
      name: e, item: 'otherOffice',
    })
  });
  // 回数オーバーのメッセージ件数を検出したらセッターを起動
  t.push(...s); // 利用者ごとのアラートと日付ごとのアラートをマージ
  // t.push(...msgDetail);
  return t;
}

// 請求データの不整合を検出する。
// 当初はdispatchされたbillingDtを使う設定だったがdispatch後の値に問題が発生しているため
// 都度、計算を実施する。
// 今後、dispatchしない方向で進めるようにする必要あるかも。
export const ServiceCountNotice = (props) => {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [msg, setmsg] = useState('');
  const [severity, setseverity] = useState('');
  const [errorId, setErrorId] = useState('');
  const [msgDetail, setMsgDetail] = useState([]);
  const [bdtObj, setBtdObj] = useState({}); // setBillingToSchの戻り地を格納
  // const billingDt = useSelector(state=>state.billingDt);
  const stdDate = useSelector(state=>state.stdDate);
  const schedule = useSelector(state=>state.schedule);
  const users = useSelector(state=>state.users);
  const com = useSelector(state=>state.com);
  const service = useSelector(state=>state.service);
  const serviceItems = useSelector(state=>state.serviceItems);
  const allstate = useSelector(state=>state);
  const loadingStatus = comMod.getLodingStatus(allstate);
  const permission = comMod.parsePermission(allstate.account);

  const dispatch = useDispatch();
  const prms = { 
    stdDate, schedule, users, com, service, serviceItems, dispatch,
    calledBy: 'ServiceCountNotice',
  };
  prms.calledBy = 'ServiceCountNotice';

  // classroomのユニーク配列を作成
  const classrooms = Array.from(new Set(users.map(e=>
    (e.classroom)? e.classroom: 'nc'
  )));

  const handleClose = (event, reason) => {
    if (event) event.preventDefault();
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };
  const handleDialogClose = () => {
    setDialogOpen(false);
  }
  // billingDtを取得
  useEffect(()=>{
    if (loadingStatus.loaded){
      // calledBy対応済み
      setBtdObj(setBillInfoToSch(prms));
    }
  }, []);
  // billingDtを監視
  useEffect(()=>{
    const p = {
      billingDt: bdtObj.billingDt, serviceItems, 
      classrooms, com, users, stdDate, schedule
    }
    const t = checkServiceCount(p);
    if (t.length) setMsgDetail(t);
  }, [bdtObj]);
  // msgDetailを監視
  useEffect(()=>{
    // 通知が一件の場合
    if (msgDetail.length === 1){
      const o = msgDetail[0];
      let t;
      if (o.item === 'baseItem'){
        t = `${o.name} さんの 利用回数に問題があります。`;
      }
      else if (o.item === 'dayOfUse'){
        t = `${o.date} の利用回数が制限を超えています。`;
        if (o.classroom) t = t + `単位 : ${o.classroom}`
      }
      else if (o.item === 'otherOffice'){
        t = `${o.name} 事業所の事業所番号に問題があります。`
      }
      else{
        t = `${o.name} さんの ${o.item} の設定件数に問題があります。`;
      }
      setmsg(t /* + '...詳細'*/);
      setOpen(true);
      // setseverity('warning')
    }
    // 通知が複数件の場合
    else if (msgDetail.length > 1){
      const o = msgDetail[0];
      const l = msgDetail.length;
      // const dispName = o.item === 'baseItem' ? '利用回数': o.item;
      let dispName;
      if (o.item === 'baseItem'){
        dispName = '利用回数'
      }
      else if (o.item === 'otherOffice'){
        dispName = '事業所番号'
      }
      const t = (o.item === 'dayOfUse')
      ? `${o.date} の利用回数など  ${l} 件の問題があります。`
      : `${o.name} さんの ${dispName} など ${l} 件の問題があります。`;
      setmsg(t /* + '...詳細'*/);
      setOpen(true);
      // setseverity('warning')
    }
  }, [msgDetail]);
  const classes = useStyles();
  let snackClass;
  const handleClick = (ev) => {
    setOpen(false);
    setDialogOpen(true);
    ev.stopPropagation();
  }
  
  const SnackDisp = () => (
    <div className={classes.snackClass}>
      {/* <Button onClick={handleClick}>Open simple snackbar</Button> */}
      <Snackbar
        // anchorOrigin={{vertical: 'bottom',horizontal: 'left',}}
        anchorOrigin={{vertical: 'bottom', horizontal:'right' }}
        open={open}
        autoHideDuration={12000}
        onClose={(ev)=>handleClose(ev)}
        // onClick={(ev)=>handleClick(ev)}
        message={msg}
        action={
          <>
            <div className='detailLabl' onClick={(ev)=>handleClick(ev)}>
              <span>詳細</span>
              <IconButton 
                size="small" aria-label="close" 
                onClick={(ev)=>handleClose(ev)}
              >
                <InfoIcon fontSize="small" />
              </IconButton>
            </div>

            <IconButton 
              size="small" aria-label="close" 
              onClick={(ev)=>handleClose(ev)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </>
        }
      >
        
      </Snackbar>
    </div>
  );
  const dialogDetail = msgDetail.map((e, i)=>{
    let str;
    if (e.item === 'baseItem'){
      str = `${e.name} さんの利用回数が上限を超えています。
             ${e.count + ' / ' + e.limit}`
    }
    else if (e.item === 'dayOfUse'){
      str = `${e.date} 利用回数が上限を超えています。
             ${e.count + ' / ' + e.limit}`
      if (e.classroom !== 'nc'){
        str = `${e.classroom} ` + str;
      }
    }
    else if (e.item === 'otherOffice'){
      str = `${e.name} 事業所の事業所番号に問題があります。`;
    }
    else{
      str = `${e.name} さんの ${e.item} の利用回数が上限を超えています。
             ${e.count + ' / ' + e.limit}`
    }
    return(
      <div className='detail' key={i}>
        {str}
      </div>
    )
  });
  const handleCloseClick = () => {
    setDialogOpen(false);
  }
  const DialogDisp = () => (
    <Dialog 
      onClose={handleDialogClose} open={dialogOpen} 
      className={classes.dialogRoot}
    >
      <div className={classes.errDialog}>
        <div className='inner'>
          {dialogDetail}
        </div>
        <div className='buttonWrap'>
          <Button variant="contained" onClick={handleCloseClick}>OK</Button>
        </div>
      </div>
    </Dialog>
  )
  // CheckBillingEtcに統合
  if (stdDate < '2023^08-01' || permission === 100){
    return(<>
      <DialogDisp />
      <SnackDisp />
    </>) 
  }
  else return null;
};
export default ServiceCountNotice;
