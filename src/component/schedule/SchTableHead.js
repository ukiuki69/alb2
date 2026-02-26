import React from 'react';
import * as Actions from '../../Actions';
import { connect, useSelector } from 'react-redux';
import * as comMod from '../../commonModule';
import SchDailyDialog from './SchDailyDialog';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import * as cp from '../common/commonParts';
import {OccupancyRate} from './SchHeadNav';
import { HOHOU } from '../../modules/contants';
import { classroomCount, isClassroom,  } from '../../albCommonModule';
import { faSleigh } from '@fortawesome/free-solid-svg-icons';
import { setLocalStorage } from '../../modules/localStrageOprations';
import { SchDaySettingNDReturn, SchDaySettingNDTarget } from './SchDaySettingNoDialog';
import { useHistory } from 'react-router';
import { makeStyles } from '@material-ui/core';
import { teal } from '@material-ui/core/colors';

const useStyles = makeStyles({
  dateTitle: {
    position: 'relative',
    '& .colHover': {
      position: 'absolute', top:0 , height: 4, left: 0, right: 0,
    }
  }
})

// 日毎の利用数をカウント
const countVisitOfDate = (prms, did) => {
  let cnt = 0;
  const {countsOfUse, schedule, sSchedule, comAdic, users, classroom} = prms;
  // サービスごと単位かどうか
  // const serviceAsTanni = comAdic? comAdic.サービスごと単位: null;
  // カウント用のstateが設定されているときはそちらで確認
  if (countsOfUse){
    // didの下二桁（日付）-1がcountsOfUseのインデックスになる
    const ndx = parseInt(did.slice(7, 9)) - 1;
    const c = {...countsOfUse};
    // countsOfUseに1が立っているところをカウント
    cnt = Object.keys(c).filter(e=>c[e][ndx]).length;
    return cnt;
  }
  else return 0;
}

const DateOfTitle = (props) =>{
  const history = useHistory();
  const classes = useStyles();
  const holidayClass = ['', 'schoolOff', 'off'];
  const com = useSelector(state=>state.com);
  const users = useSelector(state=>state.users);
  const classroom = useSelector(state=>state.classroom);
  const sService = useSelector(state=>state.service);
  const serviceItems = useSelector(state=>state.serviceItems);
  // service取得方法変更 単一サービスでstateのserviceが''で与えられることがある
  // DateOfTitleではusersが利用できないため、props.serviceをフォールバックとして使用
  const service = sService || props.service;
  const comAdic = com.addiction[service];
  // この時点でサービスのステートが確定していない場合がある.
  // その場合は定員を借り設定する。
  const teiin = (comAdic)? parseInt(comAdic.定員): 10;
  const limit = comMod.upperLimitOfUseByDay(teiin);
  const {setSchStoreDispatch, hoveredCell} = props;
  // daysettingの起動
  const handleClick = (did) => {
    // serviceItemsが複数でredux stateのserviceが空文字列の場合は遷移を中止
    if (serviceItems.length > 1 && !sService) {
      return;
    }
    // did形式をYYYY-MM-DD形式に直す
    const d = did.slice(1, 5) + '-' + did.slice(5, 7) + '-' + did.slice(7, 9);
    setLocalStorage(SchDaySettingNDTarget, d);
    setLocalStorage(SchDaySettingNDReturn, '/schedule')
    history.push('/schedule/daysetting/')
  }

  // serviceItemsが複数でredux stateのserviceが空文字列の場合はクリック可能表示も停止
  const shouldAllowClick = !(serviceItems.length > 1 && !sService);

  // ここでのpropsのscheduleは切り出されたものなので全体のスケジュールも取得する
  const sSchedule = useSelector(state=>state.schedule);
  // countVisitOfDate で使うためにprmsに追加
  const prms = {...props, ...sSchedule, comAdic, users, classroom};
  const elm = props.value.map((e, i) => {
    const d = 'D' + comMod.formatDate(e.date, 'YYYYMMDD');
    // 月水金で有効になるクラス名
    const mwfClass = [1, 3, 5].indexOf(e.date.getDay()) >= 0 ? ' mwfClass' : '';
      // 日曜日が有効になるクラス
    const sunClass = e.date.getDay() === 0 ? ' sunClass' : '';

    const hClass = holidayClass[e.holiday];
    const visit = countVisitOfDate(prms, d);
    // 定員やリミットを超過したときのクラス名定義
    let classOver = visit > teiin ? 'higher ' : '';
    classOver = visit > limit ? 'over ' : classOver;
    const hoverStyle = (d === hoveredCell?.did) ? {backgroundColor: teal[300]}:{};
    return (
      <div
        className={
          'w03 lower small flxCenter dateTitle flxVirtical dateTitle '
          + hClass + mwfClass + sunClass + ' ' + classes.dateTitle
        }
        key={i} id={d}
        onClick={shouldAllowClick ? () => handleClick(d) : undefined}
        style={shouldAllowClick ? {} : {cursor: 'default'}}
      >
        <div className='center'>
          {e.date.getDate()}<br />{comMod.getWd(e.date.getDay()).jp}
        </div>
        {/* // 保訪の場合は表示しない 2024/07/06 */}
        <div className={'totalOfDay ' + classOver} style={{height: 17.8}}>
          {service !== HOHOU? visit: ''}
        </div>
        <cp.DAddictionContent did={d} />
        {/* 暫定処置。無限レンダリング回避できないため */}
        {/* {setSchStoreDispatch === undefined &&
          <SchDailyDialog date={e.date}/>
        } */}
        <div className='colHover' style={hoverStyle}></div>
        
      </div>
    )
  });
  return(elm);
}

export const SchTableHead = (props) =>{
  const dateList = useSelector(state=>state.dateList);
  const schedule = useSelector(state=>state.schedule);
  const sService = useSelector(state=>state.service);
  // service取得方法変更 単一サービスでstateのserviceが''で与えられることがある
  const service = sService || props.service;
  const com = useSelector(state=>state.com);
  const teiin = comMod.findDeepPath(
    com, service + '.定員'
  );
  const {
    countsOfUse, // setSchStoreDispatch,
    croneSch, 
    hoveredCell,
  } = props;
  const style = {borderRight: "1px solid #ddd"}
  
  return (
    <div className='flxTitle scheduleDays30' >
      <div className='wmin lower noBkColor'>No</div>
      <div className="w15 lower" style={style}> <div>氏名</div></div>
      <DateOfTitle
        value={dateList}
        schedule={schedule}
        service={service}
        teiin={teiin}
        countsOfUse={countsOfUse}
        hoveredCell={hoveredCell}
        // setSchStoreDispatch={setSchStoreDispatch}
      />
      {/* <OccupancyRate localSch={croneSch} /> */}
    </div>
  );
}
export default SchTableHead;


// class SchTableHead extends React.Component{
//   render() {
//     const teiin = comMod.findDeepPath(
//       this.props, 'com.addiction.' + this.props.service + '.定員'
//     );
//     return (
//       <div className='flxTitle scheduleDays30' >
//         <div className='wmin lower noBkColor'>No</div>
//         <div className="w15 lower" > <div>氏名</div></div>
//         <DateOfTitle
//           value={this.props.dateList}
//           schedule={this.props.schedule}
//           service={this.props.service}
//           teiin={teiin}
//         />
//         <OccupancyRate/>
//       </div>
//     );
//   }
// }
// function mapStateToProps(state) {
//   return (state);
// }
// export default connect(mapStateToProps, Actions)(SchTableHead);
