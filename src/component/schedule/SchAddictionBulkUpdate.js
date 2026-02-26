import React, {useState, useEffect} from 'react';
import { Button, Checkbox, FormControlLabel, makeStyles } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { 
  convUID, fdp, getFormDatas, getLodingStatus, 
  parsePermission 
} from '../../commonModule';
import { GoBackButton, LoadingSpinner } from '../common/commonParts';
import { 
  getClassrooms, getFilteredUsers, isClassroom, sendPartOfSchedule, sendUser, univApiCall 
} from '../../albCommonModule';
import { blue, red, teal } from '@material-ui/core/colors';
import { useHistory } from 'react-router';
import { AttachFileSharp } from '@material-ui/icons';
import {
  FukushiSenmonHaichi,
   IryouCareJi, JiShidouKaHai1, KangoKahai, KobetsuSuport1, KobetsuSuport2, Musyouka, SenmonShien 
} from '../common/AddictionFormParts';
import SnackMsg from '../common/SnackMsg';
import * as Actions from '../../Actions';
import { addUsersAddictionToSch } from './schUtility/addUsersAddictionToSch';

// usersに登録されている加算情報をscheduleに転写する
const elmWidth = 600;
const useStyles = makeStyles({
  root: {
    width: elmWidth, marginTop: 96,  position: 'relative',
    '& .mainTitle': {
      borderBottom: '1px solid ' + teal[600], padding: 8, marginBottom: 8,
      display: 'flex',
      '& .main': {fontSize: '1.2rem'},
      '& .count': {
        '& .l': {fontSize: '1.2rem', color: blue[800], marginInlineStart: 16},
        '& .s': {fontSize: '.8rem', color: teal[900], marginInlineStart: 16},
      }
    },
    '& .row': {
      display: 'flex', flexWrap: 'wrap', margin: '0 8px',
      '& .title': {
        flex: 1, paddingTop: 8,
      },
      '& .controle': {
        width: 280,
        '& .execute.MuiButton-root': {width: 130, marginInlineStart: 20},
        '& .cancel.MuiButton-root': {width: 130},
      },
      '& .text': {
        width: '100%', paddingTop: 12, fontSize: '.9rem', lineHeight: 1.5,
      },
    },
    '& .row1': {
      display: 'flex', flexWrap: 'wrap',
      '& .check': {flex: 1, paddingTop: 24, paddingBottom: 8},
      '& .controle': {width: 140, paddingTop: 6,},
    }
  },
  noClassroomNoticeRoot: {
    color: red[900], fontSize:'.9rem', lineHeight: 1.5,
    '& a': {fontSize: '1.2rem', color: blue[800]}
  }
});
// SchAddictionBulkUpdate 処理前にscheduleを読み込む
// EachAddictionBulkUpdate 処理前にscheduleを読み込まない
// 加算情報はschedule[service].addictionに記載されているのでどちらの関数も
// schedule[uid][did]には影響しない。
// SchAddictionBulkUpdateは作っちゃったのでこのままにしておく

const EachAddictionBulkUpdate = () => {
  const classes = useStyles();
  const history = useHistory();
  const dispatch = useDispatch();
  const allState = useSelector(state=>state);
  const {
    hid, bid, schedule, users, stdDate, dateList, service, classroom,
    account
  } = allState;
  // 対象ユーザー数を調べる
  const userLength = getFilteredUsers(users, service, classroom).length;
  // // レスポンスは多数存在するので配列で初期化する
  const [res, setRes] = useState();
  const [resa, setResa] = useState([]);
  const [snack, setSnack] = useState({msg: '', severity: ''});
  const [dispatchDt, setDispatchDt] = useState(false);
  
  const classrooms = getClassrooms(users);
  // 表示するコントロールの定義
  const controles = [
    {
      title: '児童指導員加配加算', 
      content: <JiShidouKaHai1 size='middle' dLayer={1}/>,service: ''
    },
    {
      title: '福祉専門職員配置等加算', 
      content: <FukushiSenmonHaichi size='middle' dLayer={1}/>,service: ''
    },
    {
      title: '専門的支援加算', 
      content: <SenmonShien size='middle' dLayer={1}/>,service: ''
    },

    {
      title: '看護師加配加算', 
      content: <KangoKahai size='middle' dLayer={1}/>,service: ''
    },
    {
      title: '児童発達支援無償化', 
      content: <Musyouka size='middle' dLayer={1}/>,service: '児童発達支援'
    },
  ];
  // サービスによりフィルタ
  const fContoles = controles.filter(e=>!e.service || e.service == service);
  // チェックボックスの値。コントロールの数で初期化
  const [checked, setChecked] = useState(Array(fContoles.length).fill(false));
  const handeleChange = (ev, i) => {
    const t = [...checked];
    t[i] = ev.target.checked;
    setChecked(t);
  }
  useEffect(()=>{
    const t = [...resa];
    t.push(res);
    setResa(t);
    const success = t.filter(e => e && e.data && e.data.result);
    const errs = t.filter(e => e && (!e.data || !e.data.result || e.status !== 200));
    // usersはユーザー数分、スケジュールは一回送信を行うので
    // レスポンスの数が規定の回数に達したら通知をする
    if (success.length == userLength + 1){
      // console.log(success, 'success');
      setSnack({
        msg: `${userLength}人の利用者情報と加算情報を更新しました。`, 
        severity: ''
      });
    }
    else if (success.length + errs.length === userLength + 1){
      setSnack({
        msg: `書き込みの一部でエラーが発生しています。成功${success.length} 失敗${errs.length}`, 
        severity: 'warning'
      });
    }
    else if (errs.length === userLength + 1){
      setSnack({
        msg: '書き込みできませんでした。', severity: 'warning'
      })
    }
  }, [res]);

  // scheduleとusersをdispatchする
  useEffect(()=>{
    return () => {
      setTimeout(()=>{
        const closed = !document.querySelector('#dgh65uui');
        if (closed && dispatchDt){
          dispatch(Actions.setStore({
            users: dispatchDt.users, schedule: dispatchDt.schedule
          }))
        }
      }, 300)
    }
  }, [])

  const handleClick = () => {
    setResa([]); // レスポンスバッファのクリア
    // 値の取得
    const select = document.querySelectorAll('#dgh65uui select');
    const fvals = getFormDatas([select], false, true); // disabledは取得しない 空白を取得する
    // usersの更新
    const newUsers = getFilteredUsers(users, service, classroom);
    // console.log(newUsers, 'newUsers');
    newUsers.forEach(e => {
      if (!e.etc) e.etc = {};
      if (!e.etc.addiction) e.etc.addiction = {};
      const target = e.etc.addiction;
      e.date = stdDate; // 追加 ユーザの更新月を更新する
      Object.keys(fvals).forEach(f => {
        // 値が存在するときは追加
        if (fvals[f]) target[f] = fvals[f];
        // form値が存在しない 加算項目の削除
        else delete target[f];
      });
    });
    // console.log(newUsers, 'newUsers');
    // usersの送信
    const sendUsersFunc = async (e, i) => {
      // 何故かイミュータブルが確保されていないのでここでオブジェクトのコピーを渡す
      const r = await sendUser({...e});
      r.item = 'sendUser'; r.uid = e.uid; r.name = e.name;
      setRes(r);
    }
    // scheduleの更新
    const sendScheduleFunc = async (e) => {
      const r = await sendPartOfSchedule({...e})
      r.item = 'sendScheduleAddiction';
      setRes(r);
    }
    // user情報の送信
    newUsers.forEach((e, i)=>{sendUsersFunc(e, i)});
    // scheduleの再構成
    const schAddiction = {...schedule[service]};
    newUsers.forEach(e=>{
      const UID = convUID(e.uid).str;
      // console.log(fdp(e, 'etc.addiction', {}), 'fdp');
      if (!schAddiction[UID] || Array.isArray(schAddiction[UID]))  schAddiction[UID] = {};
      schAddiction[UID].addiction = fdp(e, 'etc.addiction', {});
    })
    // sendPartOfScheduleの実施
    console.log(schAddiction, 'schAddiction');
    const partOfSch = {[service]: schAddiction};
    console.log(partOfSch, 'partOfSch')
    sendScheduleFunc({hid, bid, date:stdDate, partOfSch});
    // dispatch用のデータをstateにセット
    const ts = {timestamp: new Date().getTime()}
    setDispatchDt({users: newUsers, schedule: {...schedule, ...partOfSch, ...ts}});

  }
  const NoClassroomNotice = () => {
    const classes = useStyles();
    const history = useHistory();
    const handleClick = () => {
      history.push('/setting/addiction')
    }
    const Link = () => (
      <a onClick={handleClick}>こちらから</a>
    )
    // 複数単位無いときは警告
    if (classrooms.length < 2){
      return(
        <div className={classes.noClassroomNoticeRoot}>
          事業所全体に対する加算を変更するときは<Link/>変更することをお勧めします。
        </div>
      )
    }
    if (!classroom){
      return(
        <div className={classes.noClassroomNoticeRoot}>
          事業所全体に対する加算を変更するときは<Link/>変更することをお勧めします。単位ごとに加算を設定したいときは単位切り替えボタンで単位設定をお願いします。
        </div>
      )
    }
    else return null;
  }
  const nodes = fContoles.map((e, i)=>{
    return (
      <div className='row1' key = {i}>
        <div className='check'>
          <FormControlLabel 
            label={e.title + 'を一括変更する'}
            control={
              <Checkbox
                checked={checked[i]}
                onChange={ev => handeleChange(ev, i)}
              />
            }
          />
        </div>
        {checked[i] === true &&
          <div className='controle'>{e.content}</div>
        }
      </div>
    )
  });
  return (
    <form id='dgh65uui'>
      <div style={{height: 48}}></div>
      <NoClassroomNotice/>
      {nodes}
      <div style={{height: 32}}></div>
      <div className='row'>
        <div className='title'></div>
        <div className='controle'>
          <Button
            variant='contained' color='secondary'
            onClick={()=>{history.goBack()}}
            className='cancel'
          >キャンセル</Button>
          <Button
            variant='contained' color='primary'
            onClick={handleClick}
            className='execute'
          >実行</Button>
        </div>
      </div>
      <div style={{height: 48}}></div>
      <div id='nodeExist2334'></div>
      <SnackMsg {...snack} />
    </form>
  )
}
// SchAddictionBulkUpdate 処理前にscheduleを読み込む
// EachAddictionBulkUpdate 処理前にscheduleを読み込まない
// 加算情報はschedule[service].addictionに記載されているのでどちらの関数も
// schedule[uid][did]には影響しない。
// SchAddictionBulkUpdateは作っちゃったのでこのままにしておく
export const SchAddictionBulkUpdate = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const allState = useSelector(state=>state);
  const {
    hid, bid, schedule, users, stdDate, dateList, service, classroom,
    account, serviceItems
  } = allState;
  const classrooms = getClassrooms(users);
  const ls = getLodingStatus(allState);
  const history = useHistory();
  // const permission = parsePermission(account)[0][0];
  const [fetchedSch, setFetchedSch] = useState(null);
  const [snack, setSnack] = useState({msg:'', severity:''})


  const tUsers = getFilteredUsers(users, service, classroom);
  // const handleClick = () => {
  //   const p = {
  //     dateList, stdDate, schedule, hid, bid, users: tUsers, dispatch, 
  //     forthUpdate: true,
  //   }
  //   addUsersAddictionToSch(p);
  //   console.log('schedule init.');
  // }

  useEffect(()=>{
    let isMounted = true;
    if (isMounted && fetchedSch){
      const sch = {...fetchedSch.data.dt[0].schedule};
      const p = {
        dateList, stdDate, schedule: sch, hid, bid, users: tUsers, dispatch, 
        forthUpdate: true,serviceItems
      }
      addUsersAddictionToSch(p);
    }
    return (() => isMounted = false);
  }, [fetchedSch])

  const handleClick = () =>{
    const sendPrms = {a: 'fetchSchedule', date: stdDate, hid, bid};
    univApiCall(
      sendPrms, 'E49982', setFetchedSch, setSnack, 'データの再読み込みを行いました。',
      'データの再読み込みでエラーが発生しました。'
    );
  }

  // }
  if (!ls.loaded && !ls.error){
    return(
      <div className={classes.root}><LoadingSpinner/></div>
    )
  }
  if (ls.error){
    return (
      <div className={classes.root}>error occured.</div>
    )
  }
  // windows幅を取得してマージンレフトを求める
  const {innerWidth} = window;
  const marginLeft = ((innerWidth - elmWidth) / 2 > 180)?(innerWidth - elmWidth) / 2: 180;
  const svcStr = (serviceItems.length < 2)? '': service;
  const clsStr = (classrooms.length > 1 && !classroom)? '全単位': classroom; 
  const svcAndCls = (svcStr && clsStr)? svcStr + ' + ' + clsStr: svcStr + clsStr; 
  return (
    <div className={classes.root} style={{marginLeft}}>
      <div className='mainTitle'>
        <div className='main'>利用者別加算一括設定</div>
        <div className='count'>
          <span className='l'>{tUsers.length}</span>人分
          <span className='s'>{svcAndCls}</span>
        </div>
      </div>
      <div className='row'>
        <div className='title'>
          利用者別加算引き継ぎ 
        </div>
        <div className='text'>
          <p>利用者別加算を前月以前の設定に変更します。以下の場合には変更されませんのでご注意下さい。</p>
          <ol style={{listStyleType: 'decimal', marginLeft: '1.5em'}}>
            <li>前月以前、変更を行うとき「xx月以降に反映されません」と表示された場合</li>
            <li>前月以前、変更を行うとき「この項目を次月以降に反映させない」をチェックした場合</li>
            <li>当月にてすでに加算項目の変更を行っている場合</li>
          </ol>
        </div>
      </div>
      <div style={{height: 16}}></div>
      <div className='row' style={{justifyContent: 'flex-end'}}>
        <div className='controle'>
          <Button
            variant='contained' color='secondary'
            onClick={()=>{history.goBack()}}
            className='cancel'
          >キャンセル</Button>
          <Button
            variant='contained' color='primary'
            onClick={handleClick}
            className='execute'
          >実行</Button>
        </div>
      </div>

      <EachAddictionBulkUpdate/>
      <GoBackButton />
      <SnackMsg {...snack} />

    </div>
  )
}
export default SchAddictionBulkUpdate;