import React, {useState, useEffect} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import * as mui from '../common/materialUi';
import * as comMod from '../../commonModule';
import * as albcm from '../../albCommonModule';
import * as Actions from '../../Actions';
import * as sfp from '../common/StdFormParts';
import { useLocation } from 'react-router-dom';
import SnackMsg from '../common/SnackMsg';
import { DAYSETTING_MENU, DAYSETTING_START_END } from './SchDaySettingNoDialog';
import { Button } from '@material-ui/core';
import { setLocalStorageItemWithTimeStamp } from '../../modules/localStrageOprations';
import { LoadingSpinner } from '../common/commonParts';
import { orange, red } from '@material-ui/core/colors';

const useStyles = makeStyles({
  startendForm: {
    width: '100%',
    padding: '0 4px 4px 4px',
    maxHeight: 'calc(100vh - 250px)',
    overflowY: 'scroll',
  },
  cntRow: {
    display: 'flex',
    justifyContent: 'center',
    '& .name' : {
      marginTop: 4,
      marginRight: 8,
      padding: '12px 12px 0 ',
      height: 'calc(1rem + 20px)',
      width: 160,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    '& .offSchool' : {
      backgroundColor: 'rgb(248, 227, 203)',
    },
    '& .off': {
      backgroundColor: 'rgb(202,202,217)',
    },
  },
  formHead:{
    display: 'flex',
    justifyContent: 'center',
    '& .title':{
      width: 160,
      padding: '12px 12px 8px',
    },  
    '& .time': {
      width: 120,
      padding: '12px 0 8px',
    },
  },
});

const OneUser = (props) =>{
  const classes = useStyles();
  const {schedule, did, uid, classroom, ...other} = props;
  const dObj = comMod.convDid(did);
  const dStr = comMod.formatDate(dObj, 'MM月DD日 AAA');
  const start = schedule[uid][did].start;
  const end = schedule[uid][did].end;
  const users = useSelector(state=>state.users);
  const bid = useSelector(state=>state.bid);
  const thisUser = comMod.getUser(uid, users);
  const [updated, setUpdated] = useState(false);
  // 休校日、休日に対応したクラス名を取得
  // let offClass = ['', 'offSchool', 'off'][schedule[uid][did].offSchool];
  // offClass = (!offClass)? '' : offClass;

  const nameStart = uid + '-start';
  const nameEnd = uid + '-end';
  // 欠席扱いの場合
  const o = schedule[uid][did];
  // 更新があったらハイライト設定を行う
  useEffect(()=>{
    if (updated){
      setLocalStorageItemWithTimeStamp(bid + albcm.convUid(uid).s + did, true);
    }
  }, [updated])
  if (o.absence) return null;
  // mtu対応 対象外を除外
  if (o.classroom && o.classroom !== classroom) return null;
  // offschoolで色を変える
  const osStyle = (parseInt(o.offSchool) === 1) ?{backgroundColor: orange[50]}: {};
  return(
    <div className={classes.cntRow}>
      <div className={'name '} style={osStyle}>{thisUser.name}</div>
      <sfp.TimeInput 
        size='middle' name={nameStart} label={'開始'} def={start} noLabel 
        setUpdated={setUpdated}
      />
      <sfp.TimeInput 
        size='middle' name={nameEnd} label={'終了'} def={end} noLabel 
        setUpdated={setUpdated}
      />
    </div>
  )
}

export const SchByDateStartEndInput = (props)=>{
  const classes = useStyles();
  const {date, schedule, setSchedule, setSnack, mode, chMode} = props;
  // dateを文字列でも受け取るようにする
  const did = (typeof date === 'object')
  ? 'D' + comMod.formatDate(date, 'YYYYMMDD')
  : 'D' + date.replace(/[^0-9]/g, '');
  // const dispatch = useDispatch();
  const path = useLocation().pathname;
  const hid = useSelector(state=>state.hid);
  const bid = useSelector(state=>state.bid);
  const stdDate = useSelector(state=>state.stdDate);
  
  // const [snack, setSnack] = useState({msg: '', severity: ''});
  
  const [res, setRes] = useState({});
  
  const handleSubmit = (ev) => {
    const partOfSch = {};
    const inputs = document.querySelectorAll('#hy67a input');
    const fDt = comMod.getFormDatas([inputs]);
    const target = {};
    // fdt={UIDxx-start:'10:30', UIDxx-end:'17:30'}
    // target={UIDxx:{start:'10:30', end:'17:30'}, ...}
    Object.keys(fDt).map(e=>{
      const uid = e.split('-')[0];
      const item = e.split('-')[1]; // start or end
      target[uid] = {...target[uid], [item]: fDt[e]};
    });
    Object.keys(target).map(e=>{
      // newSch = {
      //    ...schedule[e][did], start: target[e].start, end: target[e].end
      // };
      // dispatch(Actions.replaceSchedule(e, did, newSch));
      partOfSch[e] = schedule[e];
      partOfSch[e][did].start = target[e].start;
      partOfSch[e][did].end = target[e].end;
    });
    const sendPrms = {hid, bid, date:stdDate, partOfSch}
    albcm.sendPartOfSchedule(sendPrms, '', setSnack);
    setSchedule({...schedule, ...partOfSch});
    if (typeof props.close === 'function'){
      setTimeout(() => {props.close()}, 300);
    }
    if (typeof chMode === 'function'){
      chMode(DAYSETTING_MENU);
    }
  
  }
  const cancelSubmit = () => {
    if (typeof props.close === 'function'){
      props.close();
    }
    if (typeof chMode === 'function'){
      chMode(DAYSETTING_MENU);
    }
  }
  // スケジュールが持つuidの配列
  const ptn = /^UID[0-9]/;
  const tUids = Object.keys(schedule).filter(e=>e.match(ptn));
  // didを含むuidの配列
  const tuids2 = [];
  tUids.map(e=>{
    if (schedule[e][did]){
      tuids2.push(e);
    }
  });
  // serviceとclassroomに応じたusersの絞り込みを実施
  const sUsers = useSelector(state=>state.users);
  const service = useSelector(state=>state.service);
  const classroom = useSelector(state=>state.classroom);
  const users = albcm.getFilteredUsers(sUsers, service, classroom);
  // usersの順番に並び替え
  const uids = [];
  users.map(e=>{
    if (tuids2.find(f=>f === 'UID' + e.uid)){
      uids.push('UID' + e.uid);
    }
  });
  const eachUsers = uids.map((e, i)=>{
    return (<OneUser 
      key={i} schedule={schedule} did={did} uid={e} classroom={classroom}
    />)
  });
  if (mode && mode[0] !== DAYSETTING_START_END) return null;
  if (!uids.length && Object.keys(schedule).length){
    return(<>
      <div>条件に一致する利用ユーザーがいません。</div>
      <div>
        <Button onClick={cancelSubmit}>
          戻る
        </Button>
      </div>
    </>)
  }
  if (!Object.keys(schedule).length){
    return <LoadingSpinner/>
  }
  return (<>
    <div className={classes.formHead}>
      <div className='title'>名前</div>
      <div className='time'>開始</div>
      <div className='time'>終了</div>
    </div>
    <form id="hy67a" className={classes.startendForm}>
      {eachUsers}
    </form>
    <div className="buttonWrapper">
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

  </>)
}
export default SchByDateStartEndInput;