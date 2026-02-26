import React, { useEffect, useState } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Dialog from '@material-ui/core/Dialog';
import AddBoxIcon from '@material-ui/icons/AddBox';
import IndeterminateCheckBoxIcon from '@material-ui/icons/IndeterminateCheckBox';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import * as comMod from '../../commonModule'
import { JIHATSU } from '../../modules/contants';
import * as albcm from '../../albCommonModule'
import { useDispatch, useSelector } from 'react-redux';
import { setUseResult } from '../../Actions';
import * as mui from '../common/materialUi';
import * as Actions from '../../Actions';
import CancelIcon from '@material-ui/icons/Cancel';
import PersonIcon from '@material-ui/icons/Person';
import Button from '@material-ui/core/Button';
import Avatar from '@material-ui/core/Avatar';
import AddIcon from '@material-ui/icons/Add';
import Typography from '@material-ui/core/Typography';
import { blue } from '@material-ui/core/colors';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import DoubleArrowIcon from '@material-ui/icons/DoubleArrow';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import DialogTitle from '@material-ui/core/DialogTitle';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import * as sfp from '../common/StdFormParts';
import * as afp from '../common/AddictionFormParts';
import { useLocation } from 'react-router-dom';
import { faSleigh } from '@fortawesome/free-solid-svg-icons';
import { getJikanKubunAndEnchou } from '../../modules/elapsedTimes';

const useStyle = makeStyles((theme)=>({
  root :{
    ' & .MuiDialog-paperWidthSm':{
      minWidth:100, maxWidth:700, width:700,
    }
  },
  links: {
    '& > a > .MuiButton-text': {
      // margin: theme.spacing(1),
      padding: 0,
      color: '#fff'
    },
  },
}));


const closeThis = () => {
  console.log('close this clicked.');
}
// ローカルstateのスケジュールに曜日ごとのスケジュールを割り当てる
const setLocalSch = (prms) =>{
  const {
    UID, wdFval, daysWd, hlFval, daysHl, dateList,
    sch, setSch,
  } = prms;
  const newSch = {...sch};
  dateList.map(e=>{
    const wd = e.date.getDay();
    const did = comMod.convDid(e.date);
    if (e.holiday === 2)  return false; // 休業日は処理をしない 
    // 2022/06/22 休業日でも処理する
    // ↑やっぱやめる
    if (daysWd[wd] && e.holiday === 0){
      newSch[did] = {...wdFval}
    }
    if (daysHl[wd] && e.holiday === 1){
      newSch[did] = {...hlFval}
    }
  });
  setSch(newSch);
  return (newSch);
}
const jikanKubunAutoSet = (dAddiction, com, service, start, end, offSchool) => {
  const autoSetting = com?.addiction?.[service]?.時間区分延長支援自動設定;
  const jikankubunAuto = parseInt(autoSetting) >= 1;
  const enchouShienAuto = parseInt(autoSetting) >= 2;
  let jikankubun = dAddiction.時間区分? parseInt(dAddiction.jikankubun): 0;
  let enchouShien = dAddiction.延長支援? parseInt(dAddiction.jikankubun): 0;
  const useKubun3 = service === JIHATSU || offSchool === 1;
  const t = getJikanKubunAndEnchou(start, end, useKubun3);
  if (!dAddiction) dAddiction = {};
  if (!jikankubun && jikankubunAuto){
    dAddiction.時間区分 = t.区分;
  }
  if (enchouShien === 0 && enchouShienAuto && t.延長支援){
    dAddiction.延長支援 = t.延長支援;
  }
  else if (enchouShien === -1 && enchouShienAuto && dAddiction.dAddiction.延長支援){
    delete dAddiction.dAddiction.延長支援
    delete dAddiction.延長支援
  }
  if (!dAddiction.延長支援){
    delete dAddiction.延長支援;
  }

}
const FormInner = (props)=>{

  const { uid, template, sch, setSch, ...other } = props;
  const dispatch = useDispatch();
  const stdDate = useSelector(state => state.stdDate);
  const dateList = useSelector(state => state.dateList);
  const service = useSelector(state => state.service);
  const users = useSelector(state => state.users);
  const com = useSelector(state => state.com);
  const classroom = useSelector(state => state.classroom);
  const path = useLocation().pathname;
  const thisUser = comMod.getUser(uid, users);
  const isMtu = albcm.classroomCount(thisUser) > 1; // MTU判定
  const [startEnd, setStartEnd] = useState(null);

  const actualCostList = useSelector(state => state.config.actualCostList);
  const addic = [
    // '児童指導員等加配加算（Ⅰ）', '児童指導員等加配加算（Ⅱ）',
    // '看護職員加配加算', '延長支援加算', '特別支援加算', '家庭連携加算',
    // '訪問支援特別加算', '欠席時対応加算', '医療連携体制加算',
    // '事業所内相談支援加算', '強度行動障害児支援加算','保育・教育等移行支援加算',
    '時間区分', '延長支援',
  ];
  const jikankubun = '時間区分';
  const enchouShien = '延長支援';
  
  useEffect(()=>{
    if (uid && template){
      setStartEnd({start: template.start, end: template.end})
    }
  }, [uid, template])

  // const qSelect = s => document.querySelector(s);
  const qSelectAll = s => document.querySelectorAll(s);

  const handleSubmit = () => {
    // 休日と平日でフォームが別れているのでそれぞれ値を取得
    const wdInpt = qSelectAll('#er34weekday input');
    const wdSlct = qSelectAll('#er34weekday select');
    const wdFval = comMod.getFormDatas([wdInpt, wdSlct], false, true);
    const hlInpt = qSelectAll('#er34holiday input');
    const hlSlct = qSelectAll('#er34holiday select');
    const hlFval = comMod.getFormDatas([hlInpt, hlSlct], false, true);
    // 平日休日設定を追加
    wdFval.offSchool = 0; hlFval.offSchool = 1;

    [wdFval, hlFval].map(e=>{
      Object.keys(e.actualCost).map(f=>{
        // 実費項目をテンプレートと比較しながら処理
        if (e.actualCost[f]){
          e.actualCost[f] = actualCostList[f];
        }
        else{
          delete e.actualCost[f];
        }
      });
      // 加算項目を処理 指定されたキーを持つ値をdAddictionとしてまとめる
      e.dAddiction = {};
      Object.keys(e).map(f=>{
        if (addic.indexOf(f) > -1) {
          e.dAddiction[f] = e[f];
          delete e[f];
          jikanKubunAutoSet(e.dAddiction, com, service, e.start, e.end, e.offSchool);
        }
      });
      // 送迎の配列化処理
      e.transfer = [];
      e.transfer[0] = (e.pickup !== undefined) ? e.pickup : '';
      e.transfer[1] = (e.send !== undefined) ? e.send : '';
      delete e.pickup; delete e.send;
    });
    // サービスを追加。これが漏れていたと思われる 12/21
    wdFval.service = service;
    hlFval.service = service;
    // 2022/01/18 MTUのクラスルーム追加
    if (isMtu && classroom){
      wdFval.classroom = classroom;
      hlFval.classroom = classroom;
    }

    // 曜日指定を単純配列に変更
    const daysWd = Object.keys(wdFval.weekday).map(e=>{
      return wdFval.weekday[e];
    });
    const daysHl = Object.keys(hlFval.weekday).map(e => {
      return hlFval.weekday[e];
    });
    // weekdayのメンバはもういらないので削除
    delete wdFval.weekday;
    delete hlFval.weekday;
    if (sch){ // ローカルstateによる利用者別の予定が定義されている場合それを更新する
      const setLocalSchPrms = {
        UID: 'UID' + uid, wdFval, daysWd, hlFval, daysHl, dateList,
        sch, setSch,
      }
      setLocalSch(setLocalSchPrms);
      albcm.setRecentUser(uid);
      props.closeEvent();
    }
    else{
      dispatch(Actions.scheduleMonthlySet(
        'UID' + uid, stdDate, wdFval, daysWd, dateList, 0
      ));
      dispatch(Actions.scheduleMonthlySet(
        'UID' + uid, stdDate, hlFval, daysHl, dateList, 1
      ));
      comMod.setSchedleLastUpdate(dispatch, path);
    }
  }

  return(<>
    <div className='cntRow'>
      <sfp.TimeInput
        name='start' label='開始'
        value={template} uid={uid} 
        required size='middle'
        setStartEnd={setStartEnd}
        startEnd={startEnd}

      />
      <sfp.TimeInput
        name='end' label='終了'
        value={template} uid={uid} 
        required size='middle'
        setStartEnd={setStartEnd}
        startEnd={startEnd}
    />
    </div>
    <div className='cntRow'>
      <sfp.Transfer
        name='pickup' label='迎え'
        value={template} uid={uid} 
        required size='middle'
      />
      <sfp.Transfer
        name='send' label='送り'
        value={template} uid={uid} 
        required size='middle'
      />
    </div>
    <div className='cntRow'>
      <sfp.ActualCostCheckBox
        value={template} uid={uid} 
        required size='middle'
      />
    </div>
    {!props.editTemplate && <>
      <div className='cntRow'>
        <sfp.WeeksChkBox name={"weekday"} />
      </div>
      <div className='cntRow'>
        {/* <afp.JiShidouKaHai1 uid={uid} size='middle' dLayer={4} /> */}
        {/* <afp.JiShidouKaHai2 uid={uid} size='middle' dLayer={4} /> */}
        {/* <afp.KangoKahai uid={uid} size='middle' dLayer={4} /> */}
        {/* <afp.EnchouShien uid={uid} size='middle' dLayer={4} /> */}
        {/* <afp.TokubetsuShien uid={uid} size='middle' dLayer={4} /> */}
        {/* <afp.KateiRenkei uid={uid} size='middle' dLayer={4} /> */}
        {/* <afp.HoumonShien uid={uid} size='middle' dLayer={4} /> */}
        {/* <afp.KessekiTaiou uid={uid} size='middle' dLayer={4} /> */}
        {/* <afp.IryouRenkei uid={uid} size='middle' dLayer={4} /> */}
        {/* <afp.JigyousyoSoudan uid={uid} size='middle' dLayer={4} /> */}
        {/* <afp.KyoudoKoudou uid={uid} size='middle' dLayer={4} /> */}
        {/* <afp.HoikuKyouiku uid={uid} size='middle' dLayer={4} /> */}
        <afp.JikanKubun uid={uid} size='middle' dLayer={4} />
        <afp.EnchouShien2024 uid={uid} size='middle' dLayer={4} />
      </div>
    </>}
    <div className="buttonWrapper">
      <mui.ButtonCancel onClick={() => props.closeEvent()} />
      <mui.ButtonOK onClick={(e) => handleSubmit(e)} />
    </div>
  </>)
}

const WeekDay = (props)=>{
  const {display, ...others} = props;
  return(
    <form id="er34weekday" className="dialogForm " style={display}>
      <FormInner {...props} />
    </form>
  )
}
const Holiday = (props) => {
  const { display, ...others } = props;
  return (
    <form id="er34holiday" className="dialogForm " style={display}>
      <FormInner {...props} />
    </form>
  )
}

const Links = (props) => {
  const { tab, settab } = props;
  const classes = useStyle();
  return (<>
    <div className={'linksTab ' + classes.links} style={{minWidth: '100%'}} >
      <a onClick={() => settab(0)} className={(tab === 0) ? 'current' : ''}>
        <Button >平日設定</Button>
      </a>
      <a onClick={() => settab(1)} className={(tab === 1) ? 'current' : ''}>
        <Button >休日設定</Button>
      </a>
    </div>
  </>)
}

export const SchByUserMonthly = (props)=>{
  // <SchByUserMonthly uid={props.uid} />
  const {sch, setSch, setSnack,} = props;
  const [tab, settab] = useState(0);
  const service = useSelector(state=>state.service);
  // const template = useSelector(
  //   state => state.scheduleTemplate[service]
  // );
  const hid = useSelector(state=>state.hid);
  const bid = useSelector(state=>state.bid);
  const stdDate = useSelector(state=>state.stdDate);
  const UID = comMod.convUID(props.uid).str;
  const users = useSelector(state=>state.users);
  const userName = comMod.getUser(UID, users).name;
  const [res, setRes] = useState(''); // sendUsersScheduleに渡す用 必要なのか？
  const allState = useSelector(state=>state);
  const template = albcm.getTemplate(allState, sch, UID);
  
  // 子Componentから親Componentが書き換わる場合は
  // useEffectでちゃんと監視する必要があるらしい
  useEffect(()=>{
    settab(tab)
  }, [tab, settab]);
  // ローカルstateのスケジュールを監視
  // LOCALstateが与えられていない場合は機能しない。
  useEffect(()=>{
    // const sendPrms = {
    //   uid: UID, hid, bid, date: stdDate, schedule: sch 
    // }
    // comMod.sendUsersSchedule(sendPrms, setRes, setSnack, userName);
  },[sch]);
  const disp = (tab === 0) ? 
    [{ display: 'block' }, { display: 'none' }]:
    [{ display: 'none' }, { display: 'block' }];
  return(<>
    <Links tab={tab} settab={settab} />
    <WeekDay {...props} display={disp[0]} template={template.weekday}/>
    <Holiday {...props} display={disp[1]} template={template.schoolOff}/>
  
  </>)
}

export default SchByUserMonthly;