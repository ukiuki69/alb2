import React, { useState } from 'react';
import * as Actions from '../../Actions';
import { 
  connect, useDispatch, useSelector, 
  // ReactReduxContext  
} from 'react-redux';
import * as comMod from '../../commonModule';
import SchEditDetailDialog from './SchEditDetailDialog';
import SchByUserDialog from './SchByUserDialog';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import NotInterestedIcon from '@material-ui/icons/NotInterested';
import { useLocation } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import teal from '@material-ui/core/colors/teal';
import red from '@material-ui/core/colors/red';


// const useStyles = makeStyles({
//   dateCellAddEdit:{
//     cursor:'pointer',
//     '&:hover' : {
//       backgroundColor: teal[200],
//     },
//   },
//   dateCellAddRemove:{
//     cursor:'pointer',
//     '&:hover' : {
//       backgroundColor: red[200],
//     },

//   },
// });

// import { renderIntoDocument } from 'react-dom/test-utils';
// import SchExRow from './SchExRow';
// import SchUserContModal from './SchUserContMuiModal';
// import CheckIcon from '@material-ui/icons/Check';
// import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
// import EmojiEmotionsRoundedIcon from '@material-ui/icons/EmojiEmotionsRounded';
// import CheckCircleRoundedIcon from '@material-ui/icons/CheckCircleRounded';
// import RadioButtonUncheckedRoundedIcon from '@material-ui/icons/RadioButtonUncheckedRounded';

// 2020/07/13
// 大幅に作り変える
// 旧バージョンではstateの変更に問題あり。原因不明。
// 現状、Scheduleは
// DataBodyDatesを廃止しDateCellsOfTableBodyとして作り変える
// jsxを返すcomponentは全て作り変える
// Propsは全て子モジュールに引き継ぎを行いuseSelecterは原則使わない
// ↑↑↑↑これが問題かどうかわからんが混乱を避けるため
// DateCellにモーダルのアンカーを置くと挙動が複雑になりそうなので
// modalstarterも改造する。stateを渡して（またはコネクトする？）それ自身の
// stateではなく外部のstateをみて表示を行う

// 日付セルのホバーにより日付見出しと利用者見出しに色付け
const dateCellGetHover = (e) => {
  e.preventDefault();
  // 行見出しのidを取得
  const rtid = (e.target.getAttribute('uid') + 'RT');
  const rt = document.getElementById(rtid);
  // 日付見出しのID
  const dtid = (e.target.getAttribute('did'));
  const dt = document.getElementById(dtid);
  try{
    rt.classList.add('titleHover');
    dt.classList.add('titleHover');
  }
  catch {
    return(false);
  }
}
const dateCellLostHover = (e) => {
  e.preventDefault();
  // 行見出しのidを取得
  const rtid = (e.target.getAttribute('uid') + 'RT');
  const rt = document.getElementById(rtid);
  // 日付見出しのID
  const dtid = (e.target.getAttribute('did'));
  const dt = document.getElementById(dtid);

  // console.log('rtid dtid', rtid, dtid);
  try {
    rt.classList.remove('titleHover');
    dt.classList.remove('titleHover');
  }
  catch{
    return(false);
  }
}

// 日付セルの内側に描画するコンテンツ
const DateCellInner = (props)=>{
  const  Cnt = ()=>{
    const scd = props.schedule[props.UID][props.did];
    const iconClass = (scd.offSchool === 1) ? 'offSchool' : ''
    const transfer = scd.transfer.filter(e=>e !== '').length;
    const actualCost = Object.keys(scd.actualCost).length;
    const dAddiction = (scd.dAddiction !== undefined)?
      Object.keys(scd.dAddiction).length : 0;
    return (
      <div key={props.did}>
        <div>
          {/* 送迎数を表示 */}
          <i className={"fas fa-car fa-fw " + iconClass}></i>
          <span className="num">{transfer}</span>
        </div>
        <div>
          {/* 実費の数を表示 */}
          <i className={"fas fa-yen-sign fa-fw " + iconClass}></i>
          <span className="num">{actualCost}</span>
        </div>
        <div>
          {/* 加算減算数を表示 */}
          <i className={"fas fa-plus-circle fa-fw " + iconClass}></i>
          <span className="num">{dAddiction}</span>
        </div>
      </div>
    )
  }
  if (!(props.UID in props.schedule))  return null;
  else if (!(props.did in props.schedule[props.UID])) return null;
  else return <Cnt/>;
}

// 日付セルのクリックイベントを受けてスケジュールデータの追加削除を行う
// 追加 2020/10/24 remove=falseで削除は行わない
const addAndRemoveSchedule = (props, prms, dispatch, path, remove=true)=>{
  // スケジュールの有無を判定
  // 存在すれば削除を行う
  if (prms.uid in props.schedule){
    if (prms.did in props.schedule[prms.uid] && remove){
      props.removeSchedule(prms.uid, prms.did, {});
      comMod.setSchedleLastUpdate(dispatch, path)
      return false;
    }
  }
  // エレメントから得られた値で休日と平日のテンプレートオブジェクト名を得る
  const wOrH = ['weekday', 'schoolOff', 'schoolOff'][parseInt(prms.off)]
  // 該当するテンプレートから値取得
  // ディープコピーのためにjsonを使う
  const scheduleContent = JSON.parse(
    JSON.stringify(props.scheduleTemplate[prms.service][wOrH])
  );
  props.addSchedule(prms.uid, prms.did, scheduleContent);
  comMod.setSchedleLastUpdate(dispatch, path);
}
// // 日付セルからのクリックイベントで発火。既存スケジュールを修正を行うための
// // モーダルを表示する
// const openModalForEditSchedule = (props, prms)=>{
//   // 個別編集
//   // スケジュールの有無を判定
//   // スケジュールが存在しなければ何もしない
//   if (!(prms.uid in props.schedule) && prms.operation === '0') {
//     return false;
//   }
//   if (!(prms.did in props.schedule[prms.uid]) && prms.operation === '0') {
//     return false;
//   }
//   props.schEditModal(true, prms.uid, prms.did, prms.operation, prms.service);
// }

// 新規作り直し
const DatesOfBody = (props) =>{
  // const classes = useStyles();
  const dispatch = useDispatch();
  const path = useLocation().pathname;

  // 修正ダイアログ制御
  const [open, setopen] = useState({ open: false, UID: '', did: '' });
  const closeDialog = () => {
    setopen({ open: false, UID: '', did: '' });
  }

  // フローティングアクションボタンの値取得
  // 0 何もしない 1 追加削除 2 追加修正
  let cntMode = useSelector(state => state.controleMode.fabSchedule);
  cntMode = (cntMode === undefined) ? 0 : parseInt(cntMode);
  // const cellCllassHover = 
  //   ['', classes.dateCellAddRemove, classes.dateCellAddEdit][cntMode];
  // const cellStyleHover = [{},
  //   {cursor:'pointer', 
  //     '&:hover': {backgroundColor: red[200]}
  //   },
  //   {cursor:'pointer', '&:hover': {backgroundColor: teal[200]}},
  // ][cntMode];

  const hoverClass = ['', 'hoverAddRemove', 'hoverAddEdit'][cntMode];

  // クリックイベントシンプルに！！
  const clickHandler = (event, openDialog, setopenDialog)=>{
    event.preventDefault();
    const target = event.currentTarget;
    const attr = (name)=>target.getAttribute(name);
    const prms = {
      uid: attr('uid'),
      did: attr('did'),
      service: attr('service'),
      operation: attr('operation'),
      off: attr('holiday'),
    }
    if (cntMode === 0){
      return false; //何もしない
    }
    else if (cntMode === 1) {// 追加削除
      addAndRemoveSchedule(props, prms, dispatch, path);
    }
    else if (cntMode === 2) {// 追加修正
      // 既存のスケジュールを確認
      const curSch = comMod.findDeepPath(
        props.schedule, [prms.uid, prms.did]
      )
      if (!curSch){ // Scheduleが存在しない=>追加する
        addAndRemoveSchedule(props, prms, dispatch, path, false);
      }
      else{ // Scheduleが存在する=>修正用のダイアログオープン
        comMod.setSchedleLastUpdate(dispatch, path); // 保存予約をキャンセル
        // storeに対してdispatchで開く方法
        const p = { open: true, uid: prms.uid, did: prms.did};
        comMod.setOpenSchEditDetailDialog(dispatch, p);
        // setopenDialog({...openDialog ,open:true, UID:prms.uid, did:prms.did});
        // console.log('hoge');
      }
    }
  }
  const dateCell = props.dateList.map((e, i)=>{
    // if (i > 2) return null
    const did = 'D' + comMod.formatDate(e.date, 'YYYYMMDD');
    const UseChecked = () =>{
      const useResult = (comMod.findDeepPath(
        props.schedule,
        [props.UID, did, 'useResult'])
      );
      if (useResult){
        return(
          <div className='useChecked' key={did}>
            {/* <RadioButtonUncheckedRoundedIcon fontSize='inherit' color='primary' /> */}
          </div>
        )
      }
      else{
        return null;
      }
    }
    // 欠席の値を取得
    const thisAbsensed = comMod.findDeepPath(
      props.schedule, 
      [props.UID, did, 'absence']
    );
    // 欠席の表示を行う
    const Absense = () =>{
      return(
        <div className='dateCellAbsenceIcon'>
          <NotInterestedIcon/>
        </div>
      )
    }
    // 休業日、休校日を指定するクラス名
    const holidayClass = ['', 'schoolOff', 'off'][e.holiday];
    // 欠席のときのクラス名
    const absenceClass = (thisAbsensed) ? 'absensed' : '';
    return (
      <div
        uid={props.UID}
        did={did}
        onMouseEnter={dateCellGetHover}
        onMouseLeave={dateCellLostHover}
        className={
          hoverClass +
          ' dateCell w03 center small ' + holidayClass + ' ' + absenceClass
        }
        // style={cellStyleHover}
        key={i} id={props.UID + did}
        holiday={e.holiday}
        service={props.service}
        operation={0}
        onClick={e=>clickHandler(e, open, setopen)}
      >
        <UseChecked />
        <DateCellInner {...props} did={did} />
        <Absense />
      </div>

    )
  });
  return(<>
    {dateCell}
    {/* <SchEditDetailDialog 
      open={open} setopen={setopen} close={closeDialog} test={test}
    /> */}

  </>);
}

const MakeBody = (props) =>{
  // // 修正ダイアログ制御
  // const [open, setopen] = useState({ open: false, UID: '', did: '' });
  // const [test, settest] = useState(0);
  // const closeDialog = () => {
  //   setopen({ open: false, UID: '', did: '' });
  // }

  // ユーザーごとの利用回数を求める
  const countVisitByUsers = (uid) => {
    if (props.schedule[uid] === undefined){
      return 0;
    }
    else{
      const userShc = props.schedule[uid];
      let cnt = 0;
      Object.keys(userShc).map(e =>{
        if (e.indexOf('D') !== 0){
          return false;
        }
        if (userShc[e].absence)  return false;
        cnt++;
      })
      return cnt;
    }
  }
  const list = props.users.filter(e=>{
    if (
      (props.service === '' || e.service === props.service) &&
      (props.classroom === '' || props.classroom === e.classroom)
    )  return(e);
  });
  // ユーザーごとの加算をドットで表現
  const Uaddiction = (props)=>{
    if (props.addiction === undefined) return null;
    const l = Object.keys(props.addiction).length;
    if (l > 6){
      return (
        <FiberManualRecordIcon fontSize='inherit' /> + l
      )
    }
    const c = Object.keys(props.addiction).map((e, i)=>{
      return(<FiberManualRecordIcon fontSize='inherit' key={i} />);
    });
    return c;

  }
  // 管理タイプを表示
  const KanriType = (props)=>{
    if (!props.kanri_type)  return '';
    else{
      const c = (props.kanri_type.substr(0, 1) === '管') ? '管':'協';
      const cn = (props.kanri_type.substr(0, 1) === '管') ? '' : 'kyo'
      return(
        <span className={"kanriType " + cn}>{c}</span>
      )
    }
  }
  const Scdrow = list.map((e, i) => {
    // if (i > 1) return false;  // debug用
    const countVisit = countVisitByUsers('UID' + e.uid);
    const countClass = countVisit > e.volume ? ' over' : '';
    return (
      <div key={e.uid}>
        <div id={'UID' + e.uid} className='scdRow flxRow'>
          <div 
            className='wmin center rowTitle noBkColor' 
            id={'UID' + e.uid + 'RT'}
          >
            <div>{i + 1}</div>
            <div>
              <KanriType kanri_type={e.kanri_type} />
            </div>
          </div>
          <div className='w15 scdRowUserTitle'
            // onClick={clickHandler}
            uid={'UID' + e.uid}
            did={""}
            service={e.service}
            operation={1}
            off={""}
          >
            <div className="name">
              {e.name}
              {/* <KanriType kanri_type = {e.kanri_type} /> */}
            </div>
            <div className='small rowInformation'>
              {e.ageStr}
              <span className={'counter' + countClass}>
                <span className={'inNameVol'}>
                  {countVisit}
                </span>
                /
                <span className='inNameVol'>{e.volume}</span>
              </span>
              <span className="uaddiction">
              <Uaddiction {...e.etc} /></span>
            </div>
            <SchByUserDialog uid={e.uid}/>
          </div>
          <DatesOfBody
            {...props} UID={'UID' + e.uid}
          />
        </div>
      </div>
    )
  });
  return(<>
    <div className='tabelBodyWrapper'>
      {Scdrow}
    </div>
    <SchEditDetailDialog />
  </>)
}

class SchTableBody extends React.Component{
  render(){
    let k = new Date().getTime();
    return(
      <>
        <MakeBody key = {k} {...this.props}/>
      </>
    )
  }
}


function mapStateToProps(state) {
  return (state);
}
export default connect(mapStateToProps, Actions)(SchTableBody);
