import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import * as Actions from '../../Actions';
import { connect } from 'react-redux';
import { useDispatch, useSelector } from 'react-redux'
import * as comMod from '../../commonModule';
import SchCalender from './SchCalender'
import { Link, useLocation } from 'react-router-dom';
import * as mui from '../common/materialUi';
import Button from '@material-ui/core/Button';
import teal from '@material-ui/core/colors/teal';
import blue from '@material-ui/core/colors/blue';
import orange from '@material-ui/core/colors/orange';
import grey from '@material-ui/core/colors/grey';
import { display, height } from '@material-ui/system';
import { isClassroom } from '../../albCommonModule';


// import { SchEditTemplate, SchEditTemplateWrapper } from './SchByUserMonthly';

const useStyles = makeStyles({
  linktabRoot: {
    marginTop: 47,
    '& > .MuiButton-text': {
      // margin: theme.spacing(1),
      padding: 0,
    },
  },
  occuRateStyleFlx: {
    position: 'absolute', fontSize: '.7rem', width: '13vw', minWidth: 150,
    '& .text': {padding: 4},
    '& .large': {fontSize: '1.3rem', },
    '& .middle': {fontSize: '.9rem',},
    '& .rateWrap': {position: 'relative', top: -40, zIndex: -1},
    '& .seccond':{
      '@media screen and (max-width: 1300px) ':{
        '& .hideWhenNallow': {display:'none'}
      },
    },
    '& .inner': {display:'flex', flexWrap: 'wrap'},
    '& .barRate': {height:25, background:teal[100]},
    '& .rest': {background:grey[100]},
    '& .bar100': {width:'76.92%',height:14, background:blue[100]},
      '& .bar30': {width:'23.08%',height:14, background:orange[100]},
  },
  
  occuRateStyleWide: {
    fontSize: '.7rem', // display:'flex', 
    margin: '0 auto',width: '60%', maxWidth: 600,
    '& .text': {
      padding: 4, with:60, display: 'flex', justifyContent: 'center',
      alignItems: 'flex-end',
    },
    '& .large': {fontSize: '1.3rem', },
    '& .middle': {fontSize: '.9rem',},
    '& .rateWrap': {flex: 1},
    '& .seccond': {paddingBottom: 2.7, marginLeft: 4,},
    '& .inner': {display:'flex', flexWrap: 'wrap'},
    '& .barRate': {height:12, background:teal[100]},
    '& .rest': {background:grey[300]},
    '& .bar100': {width:'76.92%',height:6, background:blue[100]},
    '& .bar30': {width:'23.08%',height:6, background:orange[100]},
  }
});

const Links = () => {
  const classes = useStyles();
  // react-routerからロケーション取得
  const ref = useLocation().pathname;
  const prms = [
    { link: "/schedule", label: "月間" },
    { link: "/schedule/weekly", label: "週間" },
    { link: "/schedule/users", label: "ユーザー別" },
    { link: "/schedule/calender", label: "休校・休日設定" },
  ];
  const linkList = prms.map((e, i) => {
    let cls = (ref === e.link) ? 'current' : '';
    return (
      <Button key={i} >
        <Link className={cls} to={e.link}>{e.label}</Link>
      </Button>
    )
  });
  return (<>
    <div className={'linksTab ' + classes.linktabRoot}>
      {linkList}
    </div>
  </>);
}


// 稼働率の計算を行う
// comAddicの"サービスごと単位"を取得して
// サービスごとの稼働にするか、全体で見るかを設定する
// store stateのscheduleが常に更新されない場合がある。
// その場合、引数で当たれらたlocalSchを見て更新を行う。
export const OccupancyRate = (props) =>{
  const classes = useStyles();
  const {displayMode, style} = props;
  const localSch = props.localSch? props.localSch: {};
  const dateList = useSelector(state => state.dateList);
  const sSchedule = useSelector(state => state.schedule);
  const sService = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const svc1st = useSelector(state => state.serviceItems[0]);
  const users = useSelector(state => state.users);
  const classroom = useSelector(state => state.classroom);
  const comAdc = useSelector(state => state.com.addiction);
  const serviceAsTanni = comMod.findDeepPath(
    comAdc, [sService, 'サービスごと単位']
  );
  const schedule = {...sSchedule, ...localSch};
  const service = (serviceAsTanni === '1')? sService: '';
  let comEtc = useSelector(state => state.com.etc);
  comEtc = comEtc ? comEtc : {};
  // service取得方法変更 単一サービスでstateのserviceが''で与えられることがある
  // SchHeadNavでは既にserviceが適切に設定されているため、そのまま使用
  let teiin = comMod.findDeepPath(comAdc, service + '.定員');
  teiin = (teiin)? parseInt(teiin): 0;
  teiin = teiin ? teiin: comMod.findDeepPath(comAdc, svc1st + '.定員');
  // 保訪が最初に来ると定員を見つけられないことがある
  if (!teiin){
    let t = null;
    Object.keys(comAdc).forEach(e=>{
      if (comAdc[e].定員 && !t) t = parseInt(comAdc[e].定員);
    })
    teiin = t;
  }
  // サービスごとの利用数を保持
  const countByService = {};
  serviceItems.forEach(e=>{countByService[e] = 0;});
  // 稼働日
  let workDays = dateList.filter(e=>e.holiday !== 2).length;
  workDays = (comEtc.configOccupancyRate === '休業日を含めて稼働率計算')?
    dateList.length : workDays
  workDays = (comEtc.configOccupancyRate === '休業・休校を含めず稼働率計算') ?
    dateList.filter(e => e.holiday === 0).length : workDays
  // サービス提供回数を調べるためにスケジュールを舐める
  // let cnt = 0, kessekiCnt = 0;
  const schInfo = comMod.getScheduleInfo(schedule, service, users, classroom);
  const weekDayCnt = Object.keys(schInfo.uidCounts).reduce(
    (v, e)=>(v + schInfo.uidCounts[e].weekDayCnt), 0
  );
  const schoolOffCnt = Object.keys(schInfo.uidCounts).reduce(
    (v, e)=>(v + schInfo.uidCounts[e].schoolOffCnt), 0
  );
  const absenceCnt = Object.keys(schInfo.uidCounts).reduce(
    (v, e)=>(v + schInfo.uidCounts[e].absenceCnt), 0
  );
  const kessekiAdicCnt = Object.keys(schInfo.uidCounts).reduce(
    (v, e)=>(v + schInfo.uidCounts[e].kessekiAdicCnt), 0
  );
  const cnt = weekDayCnt + schoolOffCnt;
  const kessekiCnt = absenceCnt;
  
  let occuRate = comMod.formatNum(cnt / workDays / teiin * 100, 0, 0, 2);
  occuRate = isNaN(occuRate) ? '0.00' : occuRate;
  const occuFloat = parseFloat(occuRate);
  let ow = (occuFloat / 130) * 100; // 稼働率の幅
  ow = ow > 100.0? 100.0: ow;
  const lw = 100 - ow; // 残りの幅
  const displayStyle = displayMode === 'wide' 
    ? classes.occuRateStyleWide : classes.occuRateStyleFlx;
  const noPrint = comMod.getUisCookie(comMod.uisCookiePos.noOccuRateDispOnPrint) !== '1';
  const noPrintClass = noPrint ? '' : 'noprint';
  
  // 利用数分割表示するかどうか
  const spDisp = (serviceAsTanni !== '1' && serviceItems.length > 1)
  
  return(
    <section className={displayStyle + ' ' + noPrintClass} style={style}>
      <div className='text'>
        <div>
          <span className='large'>{occuRate.split('.')[0]}</span>
          <span className='middle'>.{occuRate.split('.')[1]}% </span>
          定員:{teiin} 
        </div>
        <div className='seccond'>
          {spDisp === true && <>
            {/* <span className='hideWhenNallow'>利用:</span><CountDisp/>  */}
            <span className='hideWhenNallow'>利用:</span><span>{cnt}</span> 
            日数:{workDays} 欠<span className='hideWhenNallow'>席</span>:{kessekiCnt}
          </>}
          {spDisp !== true && <>
            利用:{cnt} 日数:{workDays} 欠席:{kessekiCnt}
          </>}
        </div>
      </div>
      <div className='rateWrap'>
        <div className='inner'>
          <div className='barRate' style={{width:ow+'%',}}></div>
          <div className='barRate rest' style={{width:lw+'%', background:grey[100]}}></div>
          <div className='bar100'></div>
          <div className='bar30'></div>
        </div>
      </div>
    </section>
  )
}


class SchHeadNav extends React.Component {
  render (){
    return(
      <Links />
    )
  }
}

// class SchHeadNav extends React.Component{
//   render(){
//     return(
//       <div className='pageNav'>
//         <div className='buttonWrapperPN'>
//           {/* <mui.ServiceChangeButton allowUnSepcified={false}/> */}

//         </div>
//         {/* 次月前月 */}
//         <div className='buttonWrapperPN'>
//           {/* <mui.ButtonMonthNav set={-1} /> */}
//           {/* <mui.ButtonMonthNav set={1} /> */}
//         </div>
//         {/* <div className='month'>
//           <span className='small'>
//             {this.props.stdDate.split('-')[0]}年
//           </span><br/>
//           {this.props.stdDate.split('-')[1]}
//           <span className='small'>月</span>
//         </div> */}

//         {/* <div className='modalAnc'> */}
//           {/* <ModalWindow
//             ModalBody={SchCalender}
//             OpenModalText={'休校・休業日設定'}
//             modalIsOpen={false}
//           /> */}
//         {/* </div> */}
//         <Link className='menuItem' to="/schedule/calender/">
//           <mui.ButtonGP label='休校休日' />
//         </Link>
//         <Link className='menuItem' to="/schedule/users/">
//           <mui.ButtonGP label='利用者別'/>
//         </Link>
//         <Link className='menuItem' to="/schedule/weekly/">
//           <mui.ButtonGP label='週間予定' />
//         </Link>
//         {/* <SchEditTemplateWrapper/> */}
//         {/* <OccupancyRate /> */}
//       </div>
//     )
//   }
// }
function mapStateToProps(state) {
  return (state);
}
export default connect(mapStateToProps, Actions)(SchHeadNav);
