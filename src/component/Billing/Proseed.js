import React, { Fragment, useEffect, useState, useMemo } from 'react';
import * as mui from '../common/materialUi'
import * as Actions from '../../Actions';
import * as comMod from '../../commonModule';
import { HOUDAY, JIHATSU, KEIKAKU_SOUDAN, SYOUGAI_SOUDAN } from '../../modules/contants';
import * as albcm from '../../albCommonModule';
import {formatNum, formatDate, getUser, } from '../../commonModule';
import { useDispatch, useSelector, } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import { 
  LoadingSpinner, UserSelectDialog, LoadErr, StdErrorDisplay, PermissionDenied, DisplayInfoOnPrint,
  SetUisCookieChkBox, 
} from '../common/commonParts';
import { RecalcButton } from './RecalcButton';
import { 
  setBillInfoToSch, makeBiling, makeJugenkanri, makeTeikyouJisseki, 
  svcCnt, getPriorityService, getJougekanriScvCd
} from './blMakeData';
import {
  serviceSyubetu,
  SOUGEY_SVC_CODE, // 送迎サービスコード
} from './BlCalcData';
import PrintIcon from '@material-ui/icons/Print';
import Button from '@material-ui/core/Button';
import teal from '@material-ui/core/colors/teal';
import blue from '@material-ui/core/colors/blue';
import red from '@material-ui/core/colors/red';
import Dialog from '@material-ui/core/Dialog';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { UpperLimitKanri } from '../schedule/SchUpperLimit';
import {LinksTab} from '../common/commonParts';
import CheckProgress, {doCheckProgress} from '../common/CheckProgress';
import EditIcon from '@material-ui/icons/Edit';
import { downloadCsv } from './utils/csvExporter';
import { getSvcNameByCd } from './blMakeData';
import { proseedByUsersDt, actualCostMTU } from './makeProseedDatas';
import GroupIcon from '@material-ui/icons/Group';
import ServiceCountNotice from './ServiceCountNotice'
import SnackMsg from '../common/SnackMsg';
import { Check,  } from '@material-ui/icons';
import LocalHospitalIcon from '@material-ui/icons/LocalHospital';
import SchHohouDuplicateCheckAndDelete from '../schedule/SchHohouDuplicateCheckAndDelete';
import GetAppIcon from '@material-ui/icons/GetApp';
import { blueGrey, brown, grey, yellow } from '@material-ui/core/colors';
import SearchIcon from '@material-ui/icons/Search';
import CloseIcon from '@material-ui/icons/Close';
import { PsDispDetailOfItem, PsDispDetailOfUsers } from './PsDispDetail';
import { fdp } from '../../commonModule';
import { DispNameWithAttr } from '../Users/Users';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import DisplayHint from '../common/DisplayHint';
import { DisplayHintGroups } from '../common/DisplayHintGroupes';
import SchLokedDisplay from '../common/SchLockedDisplay';
import { CheckBillingEtc } from './CheckBillingEtc';
import { UserAttrInfo } from '../Users/UserAttrInfo';
import { useSuspendLowChange } from '../common/useSuspendLowChange';
import { PsDispDetailOfItem2024, PsDispDetailOfUsers2024 } from './PsDispDetail2024';
import { NotJogenKanriUsers } from './NotJogenKanriUsers';
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min';
import DescriptionIcon from '@material-ui/icons/Description';
import { manualJichiJosei, PERMISSION_DEVELOPER, PERMISSION_MANAGER } from '../../modules/contants';
import { colors, FormControl, FormControlLabel, Radio, RadioGroup } from '@material-ui/core';
import ManualJosei from './ManualJosei';
import StrongWarning from './StrongWarning';
import { DisplayOnPrint } from '../common/DisplayPrint';
import { Scity } from '../common/StdFormParts';
import OfficeSelectButton from '../common/OfficeSelectButton';
import { getOtherOffices } from '../Setting/RegistedParams';
import { getLS, getLSTS, setLS, setLSTS } from '../../modules/localStrageOprations';
import { ProseedJougenJigyousyoChk } from './ProseedJougenJigyousyoChk';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalculator } from '@fortawesome/free-solid-svg-icons';
import { permissionCheckTemporary, permissionCheck } from '../../modules/permissionCheck';
import { isExistJougen } from './utils/isExistJougen';
import { addAdjustetUpperLimitUsers } from './utils/addAdjustetUpperLimitUsers';


// const fdp = (obj, path) => comMod.findDeepPath(obj, path);

// 売上情報を表示するモジュール。
// billingDt masterRec はstore stateに持ってく予定

// fontAWESOMEアイコンのスタイル
const iconStyle = { padding: 0, fontSize: 18, marginRight: 8 };
const appPageStyle = { paddingTop: 92 }
const stickyStyles = {position: 'sticky', top: 80, backgroundColor: 'white', zIndex: 100, paddingTop: 16}; //橋本追加 10/07
const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  hoverTarget: {
    '& .EditIcon': {
      top: '50%',
      right: 2,
      fontSize: '1.2rem',
      color: teal[700],
      position: 'absolute',
      transform: 'translateY(-50%)', // 上下位置を中央に固定
      transition: 'transform 0.4s ease, font-size 0.4s ease', // スムーズなアニメーション
    },
    '&:hover .EditIcon': {
      transform: 'translateY(-50%) scale(2)', // 中央位置を保ったままスケーリング
    },
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    fontWeight: theme.typography.fontWeightRegular,
  },
  "@keyframes fadeIn": {
    "0%, 70%": { opacity: 0 },
    "100%": { opacity: 1 }
  },
  "@keyframes jump": {
    "0%, 90%, 100%": { transform: 'translateY(0)' },
    "95%": { transform: 'translateY(-8px)' }
  },
  nodata: {
    maxWidth: 400,
    textAlign:'center',
    margin: '0 auto',
    opacity: 0, // 初期状態では透明
    // フェードイン後、ジャンプを繰り返す
    animation: `$fadeIn 6s forwards, $jump 8s infinite 4s ease-in-out`,
    '& .animate': {
      color: teal[600], textAlign: 'center',
      '& .icon': {fontSize: 32},
      '& .text': {fontSize: 16, lineHeight: 1.6,},
    }
  },
  proseedDiv: {
    pageBreakInside: 'avoid',
    marginBottom: 24,
    '& .H': {
      backgroundColor: teal[50],
      padding: 8,
      paddingLeft: 16,
      paddingTop: 12,
      borderBottom: '1px solid ' + teal[900],

    },
    '& .mtuNotice': {fontSize: '.7rem', color: teal[600], padding: '8px 0'},
    '& .countSummary': {
      paddingTop: 16,
      '& .title': {
        fontSize: '.9rem', background: '#F5F5F5', padding: '6px 4px 5px',
        borderBottom: '1px #bbb solid',
      },
      '& .detail': {
        display: 'flex', flexWrap: 'wrap', // paddingTop: 8, paddingBottom: 8,
        padding: '8px 4px',
        '& >div': {
          fontSize: '.8rem', marginRight: 12,
          '& > span': {
            fontSize: '1.0rem', color: teal[900], 
            paddingInlineStart: 4, paddingInlineEnd: 0,
          }
        }
      },
    },
    '& .flxRow:hover': {background: teal[50]},
    '& .flxRow:nth-child(odd):hover': {background: teal[50]},
    
    '& .flxRow .moreIcon': {
      position: 'absolute',
      top: 2, right: 2,
      color: teal[300],
      opacity: 0, transition: .4,
    },
    '& .flxRow:hover .moreIcon':{
      opacity: 1
    },
    // proseedDiv内で、flxTitleおよびflxRowの直下のdivのfont-sizeを指定
    '@media print': {
      '& .flxTitle > div, & .flxRow > div': {
        fontSize: '0.7rem',
      },
    },
  },
  narrow: {
    maxWidth: 600,
    margin: '24px auto',
  },
  upperLimitRoot: {
    width: 800,
    margin: '24px auto 80px',
    '& .grpTitle': {
      background: grey[100], color:teal[400], fontSize: '.7rem',
      fontWeight: 300, padding:'6px 0 6px 36px',
      position: 'sticky', top: 175, zIndex: 110,
      '& >span': {fontSize: '1.0rem', fontWeight: 600}
    },
    '& .userWrap': {
      display: 'flex', flexWrap: 'wrap',
      borderBottom: '1px solid #aaa',
      '& .Num': {
        width: 32, padding: '6px 4px', textAlign: 'right', background: '#fff',
        '& .MuiSvgIcon-root': {
          fontSize: '1.2rem', marginTop: 16, color: teal[500]
        },
        '& .brosCloseIcon .MuiSvgIcon-root': {
          fontSize: '1.2rem', marginTop: 16, color: grey[500]
        },

      },
      '& .user': {
        // width: 'calc(45% - 15px)',
        flexBasis: 345,
        alignContent: 'flex-start',
      },
      '& .detail': {
        paddingLeft: 16,
        // width: 'calc(55% - 17px)',
        flexBasis: 423,
        '& .detailRow': {
          width:404,
          backgroundColor: 'transparent',
          '>div': {padding: '6px 4px',}
        },
        '& .detailRow:last-child': {
          borderBottom: 'none',
        },
      },
      '& .cityAndHnoSpacer':{fontSize: '.7rem', padding: 2, flexBasis: '32px', background: '#fff'},
      '& .cityAndHno':{
        fontSize: '.7rem', flexBasis: 'calc(100% - 32px)',
        padding: '2px 0 8px 4px',
      },

    },
    '& .kanriOk': {backgroundColor: blueGrey[100],},
    '& .notUse': {backgroundColor: blue[100],},
    '& .user':{
      display: 'flex',
      flexWrap: 'wrap',
      '& >div' :{
        padding: '6px 4px',
      },
      '& .userName':{
        width: '50%',
        cursor:'pointer',
        position: 'relative',
        '& .icon':{
          right: 2,
          top: 4,
          fontSize: '1.2rem',
          position:'absolute',
          color:teal[800],
        },
      },
      // 兄弟表示のときはこのクラスが付与される
      '& .userName.bros':{
        cursor:'auto',
        // '& .icon':{display:'none'},
      },
      '& .haibunStatus': {
        width: '50%',
        fontSize: '.8rem',
        display:'flex',
        justifyContent: 'space-between',
      },
      '& .userInfo': {
        width: '50%',
      },
      '& .userInfo .t': {
        width: '50%',
        display: 'inline-block',
      },
      
      '& .userInfo .num': {
        width: '50%',
        textAlign: 'right',
        display: 'inline-block',
      },
      '& .userInfo .kanriNum': {
        fontWeight: 600,
        color:teal[500],
      },
      '& .userInfo .kanriNum.kyouryoku': { // 協力事業所用
        fontWeight: 600,
        color:blue[500],
      },
      '& .jougenStatus': {
        // padding: 2, 
        // marginTop: -6, 
        fontSize: '.8rem', color: teal[500],
        // marginBottom: -2, width: '100%', 
        fontWeight: 600,
      },
      '& .jougenStatus.hand': {color: blue[500]}, 
      '& .jougenStatus.off': {color: red[500]}, 
      // '& .userInfo .kanriNumKj': {
      //   fontWeight: 600,
      //   color:blue[500],
      // },
    },
    '& .titleOuter': {
      display: 'flex', position:'sticky', background: '#fff', top: 84,
      paddingTop: 64, zIndex: 90, marginTop: -40,
      '& .Num': {
        width: 32, padding: '6px 4px',
      },
      '& .titleLeft' :{
        width: '45%',
      },
      '& .titleRight':{
        width: '55%', 
        '& .flxTitle': {paddingLeft: 16},
      },
    },
    '& .small':{
      fontSize: '.7rem',
    }
  },
  H: {
    backgroundColor: teal[50],padding: 8,paddingLeft: 16,paddingTop: 12,
    position: 'relative',
    zIndex: 91,
    '& .notice':{
      position: 'absolute', top:12, right:8, fontSize: '.8rem',
      '& .MuiSvgIcon-root':{
        position: 'absolute', top: -4, left: -20,fontSize: '1.2rem',
        color: blue[800],
      }
    }

  },
  innerButton:{
    padding: 0,
  },
  dialogOpenButtonRoot:{
    // position: 'fixed',
    // top: 80, width: 180, right: 24, paddingTop: 10,
    paddingBottom: 8, textAlign: 'right',
    // zIndex: 120,
    // paddingLeft: 'calc(100vw - 240px)',
    '& .buttonText':{display: 'flex',},
    '& .buttonText soan':{display: 'block',},
    '& .buttonText span:nth-of-type(1)' :{
      fontSize: '.6rem',margin: '.7rem 2px 0',marginLeft: '.6rem',
    },
    '& .buttonText span:nth-of-type(2)': {
      fontSize: '1.2rem',margin: '0 2px 0'
    },
    '& .buttonText span:nth-of-type(3)': {
      fontSize: '.6rem',margin: '.7rem 2px 0'
    },
    '& .scheduleCount' : {
      padding: 6,textAlign: 'center',
      '& span' :{color:'#00695c',fontWeight: 'bold',}
    },
  },
  plusIcon: {
    '& .MuiSvgIcon-root': {
      display:'block', position: 'absolute',
      top: 4, right: 22,
      fontSize: '1.2rem', color: blue[800],
    }
  },
  brosOnlyDisplay: {
    width:'100%', textAlign:'center', marginBottom: 16,
  },
  brosOnlyDisplayAnc: {
    zIndex:110, display:'block', position:'relative',
  },

  detailOutputBrosRoot:{
    borderBottom: '1px #ddd solid',
    '& .detailRow': {borderBottom: 'none', flexWrap: 'wrap'},
    '& .kanrikekka': {
      fontSize: '.8rem', marginLeft:4, marginBottom: 2,
      '& .label': {color: teal[800]},
      '& .value': {color: blue[800], marginInlineStart: 8, },
    },
  },
  upperLimitDialogRoot: {
    '& .MuiDialog-paperWidthSm':{
      maxWidth: 700,
    }
  },
  printButton: {
    position: 'fixed',
    bottom: 32,
    left: "50%", transform: "translateX(-50%)",
    '& .fab': {
      height: 48, width: 'auto',
      padding: '0 16px',
      borderRadius: 24,
    },
    '& .button': {
      width: 200
    },
    zIndex: 999,
  },
}));

const shortenStr = (str) => {
  if (str.length > 8) {
    return `${str.slice(0, 3)}…${str.slice(-4)}`;
  }
  return str;
};



const NoData = () => {
  const classes = useStyles();
  return (
    <div className={classes.nodata}>
      {/* <div className='icon'>
        <FontAwesomeIcon icon={faCalculator} style={iconStyle} />
      </div> */}
      <div className='animate'>
        <div className='icon'>
          <ArrowUpwardIcon/>
        </div>
        <div className='text'>
          売上計算ボタンを押して下さい。
        </div>
      </div>
    </div>
  )
}


// 上限管理編集用のコンポーネントをラップするダイアログ
const UpperLimitWrapDialog = (props) =>{
  const classes = useStyles();
  const { open, setOpen, close, uid, specifyType, billingDt } = props;
  const titleStr = ['管理事業所', '協力事業所', '兄弟管理'][parseInt(specifyType)]
  // const titleStr = (specifyType==='1') ? '協力事業所' : '管理事業所';
  const stdDate = useSelector(state => state.stdDate);
  const users = useSelector(state=>state.users);
  const monthStr = stdDate.substr(0, 4) + '年' + stdDate.substr(5, 2) + '月';
  const thisUser = getUser(uid, users);
  const [snack, setSnack] = useState({msg: '', severity: ''});
  return (<>
    <Dialog 
      className={classes.upperLimitDialogRoot}
      open={open} onClose={close}
    >
      <div className='formTitle'>上限管理({titleStr})</div>
      <div className='formSubTitle'>
        <div className='date'>{monthStr}</div>
        <div className='user'>{thisUser.name}</div>
        <div className='age'>{thisUser.ageStr}</div>
      </div>
      <UpperLimitKanri 
        uid={uid} specifyType={specifyType} close={close} 
        snack={snack} setSnack={setSnack} billingDt={billingDt}
      />
    </Dialog>
    <SnackMsg {...snack} />
  </>)
}


// 児発無償化に対する表示を行う
export const JihatsuMusyouInfo = (props) => {
  const allState = useSelector(state=>state);
  const {style: propsStyle} = props;
  const {schedule, com, serviceItems, users} = allState;
  const isJihatsu = serviceItems.indexOf('児童発達支援') >= 0;
  // 法改正処置
  const v = useSuspendLowChange();
  if (v) return null;
  
  // 全体設定
  const comSetting = comMod.findDeepPath(
    com, 'addiction.児童発達支援.児童発達支援無償化'
  ) === '1';
  const comSettingStr = comSetting? '設定済み': '未設定';
  // 自動設定
  const comAutoSetting = comMod.findDeepPath(
    com, 'addiction.児童発達支援.児童発達支援無償化自動設定'
  ) === '1';

  // 個別設定
  const jhSchSetting = comMod.findDeepPath(schedule, '児童発達支援', {});
  const pSetting = Object.keys(jhSchSetting).reduce((v, e)=>{
    const t = comMod.findDeepPath(
      jhSchSetting[e], 'addiction.児童発達支援無償化'
    )
    // addiction.児童発達支援無償化に存在しないUIDが残っているのでそれをチェック
    const u = getUser(e, users).service
    ? getUser(e, users).service.includes(JIHATSU): false;

    if (parseInt(t) === 1 && u)  v++;
    return v;
  }, 0);
  // 自動無償化対象児童数
  const targetCnt = users.filter(e=>e.ageStr.match(/^[3-5]/)).length;
  // 無償化表示文字列
  let str = '';
  if (comSetting){
    str = '事業所全体の児発無償化が設定済みです。';
  }
  else if (comAutoSetting){
    str = `児発無償化自動設定済みです。${targetCnt}人の対象児童が登録されています。`;
  }
  else {
    str = `児発無償化は手動設定です。${pSetting}件が設定済みです。`;
  }
  const defaultStyle = {paddingTop:8, fontSize: '.8rem', color: blue[900],}
  const style = {...defaultStyle, ...propsStyle};
  if (!isJihatsu){
    return null;
  }
  else {
    return (
      <div style={style}>{str}</div>
    )
  }
}
// 自治体助成に関する表示を行う。stateのmasterRecを使う
export const JichiJoseiInfo = (props) => {
  const {style, masterRec} = props;
  // 法改正処置
  const v = useSuspendLowChange();
  if (v) return null;
  // const allState = useSelector(state=>state);
  // const {masterRec} = allState;
  const totalized = (masterRec && masterRec.totalized)? masterRec.totalized: [];
  const count = new Set(
    totalized.map(e=>e.jichiJosei?e.scityNo: null).filter(e=>e)
  );
  const val = totalized.reduce((v, e)=> (v + Number(e.jichiJosei)), 0);
  let str = '';
  if (val && totalized.length){
    str = `自治体助成金設定済みです。自治体数：${count.size} 金額：${formatNum(val, 1)}`;
  }
  else if (totalized.length){
    str = `自治体助成金の設定はありません。`;
  }
  else{
    str = `読込中`;
  }
  const defSt = {paddingTop:8, fontSize: '.8rem', color: teal[900],}
  const st = {...defSt, ...style}
  if (!masterRec) return null;
  return (
    <div style={st}>{str}</div>
  )

}

// 売上サマリを出力する
const ProseedSummary = (props) =>{
  const classes = useStyles();
  const {data, checkBilling, displaySwitch, users} = props;
  const schedule = useSelector(state=>state.schedule);
  const scheduleLocked = schedule.locked;
  const service = useSelector(state=>state.service);
  const serviceItems = useSelector(state=>state.serviceItems);
  const classroom = useSelector(state=>state.classroom);
  const com = useSelector(state=>state.com);
  // parseintとnull変換
  const pin = (v) => (parseInt(comMod.null2Zero(v)));

  // 利用回数、欠席数、欠席加算数を算定
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
  // mtuが存在していたら利用回数を別の方法で取得する
  const existMtu =  albcm.getExistMtu(users);
  let cntDt = {};
  if (existMtu){
    cntDt = comMod.getScheduleInfo(schedule, service, users, classroom);
  }
  let kanriOk = true;
  const Summary = ()=>{
    const sumDt = {
      利用人数: 0,
      利用回数: 0,
      単位数: 0,
      算定額: 0,
      利用者負担額: 0,
      自治体助成額: 0,
      実費: 0,
      国保連請求額: 0,
      処遇改善加算単位数: 0,
      処遇改善加算算定額: 0,
      処遇改善加算算差額: 0,
      売上: 0,
    }
    
    // usersでフィルタリングされたbillingDtを使用
    const filteredData = data ? data.filter(e => {
      const u = comMod.getUser(e.UID, users);
      // ユーザーが存在し、かつuidプロパティが存在することを確認
      return u && u.uid;
    }) : [];
    
    // デバッグ用ログ
    // console.log('users length:', users.length);
    // console.log('filteredData length:', filteredData.length);
    // console.log('users UIDs:', users.map(u => u.uid));
    // console.log('filteredData UIDs:', filteredData.map(d => d.UID));

    const isSudan = 
      albcm.inService(service, KEIKAKU_SOUDAN) || 
      albcm.inService(service, SYOUGAI_SOUDAN);
    
    if (filteredData.length > 0) {
      filteredData.forEach(e => {
        const u = comMod.getUser(e.UID, users);
        // 複数サービス対応
        if (service && !albcm.inService(u.service, service)) return false;
        if (classroom && !albcm.isClassroom(u, classroom)) return false;
        if (e.countOfUseMulti && service && !isSudan){
          if (e.countOfUseMulti[service]){
            sumDt.利用人数++;
            sumDt.利用回数 += e.countOfUseMulti[service]
          }
        }
        else if (e.countOfUse && !isSudan){
          sumDt.利用人数++;
          sumDt.利用回数 += e.countOfUse;
        }
        else if (isSudan){
          if (e.tanniTotal){
            sumDt.利用人数++;
          }
        }
        sumDt.利用者負担額 += isNaN(e.kanrikekkagaku)? 0: parseInt(e.kanrikekkagaku);
        sumDt.自治体助成額 += isNaN(e.jichiJosei)? 0: parseInt(e.jichiJosei);
        if (existMtu && classroom && e.clsTanniTotal){
          sumDt.単位数 += parseInt(e.clsTanniTotal[classroom]);
          sumDt.算定額 += parseInt(e.clsUserSanteiTotal[classroom]);
          sumDt.実費 += actualCostMTU(e.actualCostDetail, classroom);
        }
        else if (e.userSanteiTotalSvc && service){
          sumDt.単位数 += pin(e.tanniTotalSvc[service]);
          sumDt.算定額 += pin(e.userSanteiTotalSvc[service]);
          sumDt.実費 += parseInt(e.actualCost);
        }
        else{
          sumDt.単位数 += pin(e.tanniTotal);
          sumDt.算定額 += pin(e.userSanteiTotal);
          sumDt.実費 += pin(e.actualCost);
        }
        // 上限管理完了フラグは一度でもfalseになったらfalse
        kanriOk = (kanriOk && e.kanriOk)? true : false;
        const svcSyubetu = service? String(serviceSyubetu[service]): '';

        if (e.itemTotal && Array.isArray(e.itemTotal) && displaySwitch === 'syoguu') {
          const syoguuItems = e.itemTotal.filter(
            item => item.method === "syoguu" && item.s.startsWith(svcSyubetu)
          );
          const upMap = {};
          syoguuItems.forEach(item => {
            const itemUp = item.up;
            const tanni = Number(item.tanniNum) || 0;
            if (upMap[itemUp]) {
              upMap[itemUp] += tanni;
            } else {
              upMap[itemUp] = tanni;
            }
          });
          for (const itemUp in upMap) {
            const totalTanni = upMap[itemUp];
            sumDt.処遇改善加算単位数 += totalTanni;
            sumDt.処遇改善加算算定額 += Math.floor(totalTanni * parseFloat(itemUp));
          }
          sumDt.処遇改善加算算差額 = sumDt.算定額 - sumDt.処遇改善加算算定額;
        }
      });
      sumDt.国保連請求額 = sumDt.算定額 - sumDt.利用者負担額;
      sumDt.売上 = sumDt.算定額 + sumDt.実費;
      // MTUは利用回数カウント方法変更
      if (existMtu){
        // sumDt.利用回数 = cntDt.reduce((v, e) => (v + e.count, 0));
        let v = 0, w = 0;
        Object.keys(cntDt.uidCounts).forEach(e=>{
          v += cntDt.uidCounts[e].count;
          w += ((cntDt.uidCounts[e].count)? 1: 0);// 利用回数があれば利用人数カウント
        });
        sumDt.利用回数 = v;
        sumDt.利用人数 = w; 
      }
    }
    const rt = Object.keys(sumDt).filter(e=>sumDt[e]).map((e, i)=>{
      return(
        <div key={i} className='flxRow' >
          <div className='rowh w50'>{e}</div>
          <div className='rowd w50 right' >{
            comMod.formatNum(sumDt[e], 1)}
          </div>
        </div>
      )
    });
    const CountSummary = () =>{
      if (
        !serviceItems.includes(HOUDAY) && !serviceItems.includes(JIHATSU)
      ) return null;
      return (
        <div className='countSummary'>
          <div className='title'>利用回数等概要</div>
          <div className='detail'>
            <div>平日利用:<span>{weekDayCnt}</span>回</div>
            <div>休日利用:<span>{schoolOffCnt}</span>回</div>
            <div>利用計:<span>{schoolOffCnt + weekDayCnt}</span>回</div>
            <div>欠席回数:<span>{absenceCnt}</span>回</div>
            <div>うち欠席加算:<span>{kessekiAdicCnt}</span>回</div>
          </div>
        </div>
      )
    }
    return (<>
      <div className={classes.proseedDiv}>
        <div className='H'>
          売上概要
        </div>
        <div className={classes.narrow}>
          {rt}
          <JichiJoseiInfo/>
          <JihatsuMusyouInfo/>
          <CountSummary />
        </div>
      </div>
    </>);
  }
  // // 請求データのチェックが通ってない
  // if (!checkBilling.result)  return null;

  return(<>
    { data && <Summary />}
    { (!data || !checkBilling.result) && <NoData /> }
  </>)
}
// 利用者ごとの売上を求める
// ユーザー名、単位数、算定額、負担額、請求額
const ProseedByUsers = (props) => {
  const classes = useStyles();
  const {
    users, data, checkBilling, setOpen, setDialogIdent,
    userAttr, setUserAttr, dispCitiesHno, sortCities,
    displaySwitch
  } = props;
  const service = useSelector(state=>state.service);
  const classroom = useSelector(state=>state.classroom);
  const com = useSelector(state => state.com);
  const stdDate = useSelector(state => state.stdDate);
  const schedule = useSelector(state=>state.schedule);
  const [detailCsvMenuAnchor, setDetailCsvMenuAnchor] = useState(null);
  // 請求データのチェックが通ってない
  if (!checkBilling.result)  return null;
  let outa = []; // 出力用配列
  // 出力用配列を作成
  if (data){
    const addjustetUsers = addAdjustetUpperLimitUsers(users, schedule);
    outa = proseedByUsersDt(addjustetUsers, data, service, classroom, sortCities);
  }
  const existMtu = albcm.getExistMtu(users);

  const onClickDialog = (userInfo) => {
    setOpen(true);
    setDialogIdent(userInfo["UID"]);
  }

  const handleExportCsv = () => {
    // ファイル名を動的に構築
    let fileName = '';
    
    // fprefixを先頭に追加
    if (com.fprefix) {
      fileName += com.fprefix.toUpperCase();
    }
    
    // 基本のファイル名
    fileName += '利用者別売上';
    
    // サービス名を末尾に追加（有効な場合）
    if (service) {
      const shortServiceName = comMod.shortWord(service);
      fileName += `-${shortServiceName}`;
    }
    
    // 教室名を末尾に追加（有効な場合）
    if (classroom) {
      fileName += `-${classroom}`;
    }
    
    // 日付を追加（stdDateからYYMM形式）
    const yyMM = stdDate.slice(2, 4) + stdDate.slice(5, 7); // YYYY-MM-DD → YYMM
    fileName += `-${yyMM}.csv`;
    
    // 動的にカラムとタイトルを構築
    const columns = ['name'];
    const titles = ['利用者名'];
    
    // 受給者証番号と市町村を追加（dispCitiesHnoまたはsortCitiesがtrueの場合）
    if (dispCitiesHno || sortCities) {
      columns.push('hno');
      titles.push('受給者証番号');
      columns.push('scity');
      titles.push('市町村');
    }
    
    // 兄弟インデックスがある場合
    if (brosCnt > 0) {
      columns.push('brosIndex');
      titles.push('兄弟');
    }
    
    // 基本的なカラム
    columns.push('tanni', 'santei', 'userFutan');
    titles.push('単位数', '算定額', '利用者負担');
    
    // 自治体助成がある場合
    if (jichiJoseiCnt > 0) {
      columns.push('jichiJosei');
      titles.push('自治体助成額');
    }
    
    // 残りのカラム
    columns.push('kokuhoSeikyuu', 'countOfUse', 'actualCost', 'sougeiCnt', 'totalUseCount');
    titles.push('国保請求額', '利用回数', '実費', '送迎回数', '利用数');
    
    // 平日・休日利用数を合算したデータを作成
    const exportData = outa.map(item => ({
      ...item,
      totalUseCount: (item.holidayNum || 0) + (item.weekdayNum || 0)
    }));
    
    downloadCsv(exportData, { fileName, columns, titles });
  };

  const handleExportDetailCsv = (mode = 'all') => {
    // ファイル名を動的に構築
    let fileName = '';
    
    // fprefixを先頭に追加
    if (com.fprefix) {
      fileName += com.fprefix.toUpperCase();
    }
    
    // 基本のファイル名
    fileName += '利用者別単位明細';
    
    // モードに応じてファイル名を変更
    if (mode === 'noDuplicate') {
      fileName += '-重複除外';
    }
    
    // サービス名を末尾に追加（有効な場合）
    if (service) {
      const shortServiceName = comMod.shortWord(service);
      fileName += `-${shortServiceName}`;
    }
    
    // 教室名を末尾に追加（有効な場合）
    if (classroom) {
      fileName += `-${classroom}`;
    }
    
    // 日付を追加（stdDateからYYMM形式）
    const yyMM = stdDate.slice(2, 4) + stdDate.slice(5, 7); // YYYY-MM-DD → YYMM
    fileName += `-${yyMM}.csv`;
    
    // 利用者別単位明細データを作成
    const exportData = [];
    
    outa.forEach((user, userIndex) => {
      if (user.itemTotal && Array.isArray(user.itemTotal)) {
        user.itemTotal.forEach((item, itemIndex) => {
          const row = {
            name: user.name,
            brosIndex: user.brosIndex || '',
            tanni: user.tanni,
            santei: user.santei,
            serviceCode: item.s,
            serviceName: item.c,
            itemTanni: item.v,
            count: item.count,
            serviceTanni: item.tanniNum
          };
          
          // 受給者証番号と市町村を追加（dispCitiesHnoまたはsortCitiesがtrueの場合）
          if (dispCitiesHno || sortCities) {
            row.hno = user.hno;
            row.scity = user.scity;
          }
          
          // 重複除外モードの場合、最初の行以外は基本情報を空にする
          if (mode === 'noDuplicate' && itemIndex > 0) {
            row.name = '';
            row.brosIndex = '';
            row.tanni = '';
            row.santei = '';
            if (dispCitiesHno || sortCities) {
              row.hno = '';
              row.scity = '';
            }
          }
          
          exportData.push(row);
        });
      }
    });
    
    // 動的にカラムとタイトルを構築
    const columns = ['name'];
    const titles = ['利用者名'];
    
    // 受給者証番号と市町村を追加（dispCitiesHnoまたはsortCitiesがtrueの場合）
    if (dispCitiesHno || sortCities) {
      columns.push('hno');
      titles.push('受給者証番号');
      columns.push('scity');
      titles.push('市町村');
    }
    
    // 兄弟インデックスがある場合
    if (brosCnt > 0) {
      columns.push('brosIndex');
      titles.push('兄弟');
    }
    
    // 基本的なカラム（サービス算定額を除外）
    columns.push('tanni', 'santei', 'serviceCode', 'serviceName', 'itemTanni', 'count', 'serviceTanni');
    titles.push('単位数', '算定額', 'サービスコード', 'サービス内容', '単位数', '回数', 'サービス単位数');
    
    downloadCsv(exportData, { fileName, columns, titles });
  };

  const handleDetailCsvMenuClick = (event) => {
    setDetailCsvMenuAnchor(event.currentTarget);
  };

  const handleDetailCsvMenuClose = () => {
    setDetailCsvMenuAnchor(null);
  };

  const handleDetailCsvExport = (mode) => {
    handleExportDetailCsv(mode);
    handleDetailCsvMenuClose();
  };

  const citiesHnoStyle = {fontSize: '.7rem', padding: 2, paddingLeft: 0,}
  const firstCityStyle = {...citiesHnoStyle, fontWeight: 600, color: teal[800]};
  const rowStyle = {cursor: "pointer"};
  if (!dispCitiesHno){
    citiesHnoStyle.display = 'none';
  }
  if (!sortCities){
    firstCityStyle.display = 'none';
  }
  const brosCnt = outa.filter(e=>parseInt(e.brosIndex)>0).length;
  const jichiJoseiCnt = outa.filter(e=>e.jichiJosei).length;
  const userRows = outa.map((e, i)=>{
    const ruStyle = albcm.recentUserStyle(e.UID);
    const smallNum =  i >= 99 ? {fontSize: '.8rem', paddingTop: 8} :{};
    const uid = comMod.convUID(e.UID).num;
    return(<Fragment key={i}>
      <div className='flxRow' key={i} onClick={event => onClickDialog(e)} style={rowStyle} >
        <div className='wmin rowd right' style={{...ruStyle, ...smallNum}}>{i + 1}</div>
        <div className='w30 rowd' style={{position: 'relative'}}>
          <DispNameWithAttr {...e} userAttr={userAttr} setUserAttr={setUserAttr} uid={uid}/>
          <Check className="moreIcon"/>
          {e.firstCity && <div style={firstCityStyle}>{e.scity}</div>}
          <div style={citiesHnoStyle}>
            {sortCities ? '': e.scity + ' '}{e.hno}
          </div>
        </div>
        {brosCnt > 0 &&
          <div className='wzen3 rowd right'>{e.brosIndex}</div>
        }
        <div className='w15 rowd right'>
          {comMod.formatNum(e.tanni, 1)}
        </div>
        <div className='w20 rowd right'>
          {comMod.formatNum(e.santei, 1)}
        </div>
        {displaySwitch === 'normal' && <>
          <div className='w15 rowd right'>
            {comMod.formatNum(e.userFutan, 1)}
          </div>
          {jichiJoseiCnt > 0 &&
            <div className='w15 rowd right'>
              {comMod.formatNum(comMod.null2Zero(e.jichiJosei), 1)}
            </div>
          }        
          <div className='w15 rowd right'>
            {comMod.formatNum(e.actualCost, 1)}
          </div>
          <div className='w15 rowd right'>
            {comMod.formatNum(
              e.userFutan + e.actualCost -
              comMod.null2Zero(e.jichiJosei),
              1
            )}
          </div>
          <div className='w20 rowd right'>
            {comMod.formatNum(e.kokuhoSeikyuu, 1)}
          </div>
          <div className='w10 rowd right'>{e.sougeiCnt}</div>
          <div className='w10 rowd right'>{e.countOfUse}</div>
        </>}
        {displaySwitch === 'syoguu' && <>
          <div className='w20 rowd right'>
            {comMod.formatNum(e.totalSyoguuTanni, 1)}
          </div>
          <div className='w15 rowd right'>
            {comMod.formatNum(e.totalSyoguuSantei, 1)}
          </div>
          <div className='w15 rowd right'>
            {comMod.formatNum(e.santei - e.totalSyoguuSantei, 1)}
          </div>
        </>}
      </div>
    </Fragment>)
  })
  if (!data){
    return null;
  }
  else {
    return(<>

      <div className={classes.proseedDiv}>
        <div className='H'>
          利用者別売上
        </div>
        
        <div className='byUser' style={{marginTop: 8}}>
          <div className='flxTitle' style={stickyStyles} >
            <div className='wmin rowd'>No</div>
            <div className='w30 rowd'>利用者名</div>
            {brosCnt > 0 &&
              <div className='wzen3 rowd'>兄弟</div>
            }
            <div className='w15 rowd'>単位数</div>
            <div className='w20 rowd'>算定額</div>
            {displaySwitch === 'normal' && <>
              <div className='w15 rowd'>負担額</div>
              {jichiJoseiCnt > 0 &&
                <div className='w15 rowd'>助成額</div>
              }
              <div className='w15 rowd'>実費</div>
              <div className='w15 rowd'>請求計</div>
              <div className='w20 rowd'>国保請求</div>
              <div className='w10 rowd'>送迎</div>
              <div className='w10 rowd'>利用</div>
            </>}
            {displaySwitch === 'syoguu' && <>
              <div className='w20 rowd'>処遇改善単位数</div>
              <div className='w15 rowd'>処遇改善額</div>
              <div className='w15 rowd'>差額</div>
            </>}

          </div>
          {userRows}
          {existMtu === true && classroom !== '' &&
            <div className='mtuNotice'>
              複数単位利用者が存在します。端数処理により誤差が生じることがあります。
              また、利用者負担額・上限管理加算など按分できない項目もあるのでご注意下さい。    
            </div>
          }
          <div style={{textAlign: 'center', padding: 8}}>
            <Button
              variant="contained"
              size="small"
              onClick={handleExportCsv}
              startIcon={<GetAppIcon />}
              style={{marginTop: 8, marginRight: 8}}
            >
              利用者別売上CSV出力
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleDetailCsvMenuClick}
              startIcon={<GetAppIcon />}
              style={{marginTop: 8}}
            >
              利用者別単位明細CSV出力
            </Button>
            <Menu
              anchorEl={detailCsvMenuAnchor}
              keepMounted
              open={Boolean(detailCsvMenuAnchor)}
              onClose={handleDetailCsvMenuClose}
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              PaperProps={{
                style: {
                  fontSize: '0.875rem', // 14px
                }
              }}
            >
              <MenuItem 
                onClick={() => handleDetailCsvExport('all')}
                style={{ fontSize: '0.875rem' }}
              >
                全て出力
              </MenuItem>
              <MenuItem 
                onClick={() => handleDetailCsvExport('noDuplicate')}
                style={{ fontSize: '0.875rem' }}
              >
                重複内容を出力しない
              </MenuItem>
            </Menu>
          </div>
        </div>
      </div>
    </>)    
  }
}
// サービスコード別の売上を集計する
const ProseedByServiceCd = (props) =>{
  const classes = useStyles();
  const service = useSelector(state=>state.service);
  const classroom = useSelector(state=>state.classroom);

  const { users, billingDt, checkBilling, setOpen, setDialogIdent} = props;
  if (!checkBilling.result){
    return null;
  }
  const existMtu = albcm.getExistMtu(users);

  let outa = [];
  let itemTotal = [];
  if (billingDt){
    // usersでフィルタリングされたbillingDtを使用
    const filteredBillingDt = billingDt.filter(e => {
      const u = comMod.getUser(e.UID, users);
      // ユーザーが存在し、かつuidプロパティが存在することを確認
      return u && u.uid;
    });
    
    // ユニークなサービスコード作成
    // サービスアイテムの個人別集計を取り出す
    const uscd = new Set();
    filteredBillingDt.map(e=>{
      const u = comMod.getUser(e.UID, users);
      const isMtu = albcm.classroomCount(u) > 1;
      if (service && !albcm.inService(u.service, service)) return false;
      if (classroom && !albcm.isClassroom(u, classroom)) return false;
      const thisItemTotal = (isMtu && classroom && e.clsItemTotal)
      ? e.clsItemTotal[classroom]: e.itemTotal;
      if (Array.isArray(thisItemTotal)){
        thisItemTotal.map(f=>{
          uscd.add(f.s);
          itemTotal.push({...f});
        });
      }
    });
    // 配列化
    // サービスが不一致なコードは排除する
    const uscda = Array.from(uscd).filter(e=>{
      if (!service) return true;
      if (serviceSyubetu[service] === parseInt(e.slice(0,2))) return true;
      else return false;
    })
    uscda.map(e=>{
      itemTotal.map(f=>{
        if (e === f.s){
          const ndx = outa.findIndex(g=>g.s === e);
          // すでに配列に存在する場合は合算
          if (ndx > -1){
            outa[ndx].count += f.count;
            outa[ndx].tanniNum += f.tanniNum;
          }
          // 配列に存在しない場合はそのままpush
          else{
            outa.push(f);
          }
        }
      });
    });
  }

  outa.sort((a, b)=>{
    if (a.baseItem && !b.baseItem) return -1;
    if (!a.baseItem && b.baseItem) return 1;
    if (a.s > b.s) return 1;
    if (a.s < b.s) return -1;
  })

  const onClickDialog = (itemDt) => {
    setOpen(true);
    console.log(itemDt.s)
    setDialogIdent(itemDt.s);
  }

  const serviceRows = outa.map((e, i) => {
    return (
      <div className='flxRow' key={i} onClick={event => onClickDialog(e)} style={{cursor: "pointer"}}>
        <div className='wmin rowd right'>{i + 1}</div>
        <div className='w10 rowd'>{e.s}</div>
        <div className='w50 rowd' style={{position: 'relative'}}>
          {/* 末尾の中黒を削除して表示 */}
          {(e.c.replace(/・$/, ''))}
          <Check className="moreIcon"/>
        </div>
        <div className='w10 rowd right'>{comMod.formatNum(e.v, 1)}</div>
        <div className='w10 rowd right'>{comMod.formatNum(e.count, 1)}</div>
        <div className='w15 rowd right'>{comMod.formatNum(e.tanniNum, 1)}</div>
      </div>
    )
  });

  if (!billingDt){
    return null;
  }
  else{
    return (
      <div className={classes.proseedDiv}>
        <div className='H'>
          サービスコード別一覧
        </div>
        <div className='serviceCode' style={{marginTop: 8, marginBottom: 16}}>
          <div className='flxTitle' style={stickyStyles}>
            <div className='wmin rowd'>No</div>
            <div className='w10 rowd'>コード</div>
            <div className='w50 rowd'>サービス名</div>
            <div className='w10 rowd'>単位</div>
            <div className='w10 rowd'>数量</div>
            <div className='w15 rowd'>単位数</div>
          </div>
          {serviceRows}
          {existMtu === true && classroom !== '' &&
            <div className='mtuNotice'>
              複数単位利用者が存在します。計算結果の端数処理により誤差が生じることがあります。
            </div>
          }

        </div>
      </div>
      
    )
  }
}

const PlusIcon = () =>{
  const classes = useStyles()
  return (
    <span className={classes.plusIcon} >
      <LocalHospitalIcon/>
    </span>
  )
}

// 兄弟上限表示モードであることの表示とその解除
const BrosOnlyDisplay = () => {
  const classes = useStyles();
  const users = useSelector(state=>state.users);
  const controleMode = useSelector(state=>state.controleMode);
  const dispatch = useDispatch();
  const upperLimitBrosUid = 
  controleMode.upperLimitBrosUid?controleMode.upperLimitBrosUid:''
  const name = getUser(upperLimitBrosUid, users).name;
  const handleClick = () => {
    const t = controleMode;
    t.upperLimitBrosUid = '';
    dispatch(Actions.setStore({controleMode: t}))
  }
  
  if (!upperLimitBrosUid) return null;
  
  return (<>
    <a onClick={handleClick} className={classes.brosOnlyDisplayAnc}>
      <div className={classes.brosOnlyDisplay}>
        {name}さんの兄弟のみ表示しています。
        <Button
          variant='contained'
          color='secondary'
          startIcon={<CloseIcon/>}
        >
          解除
        </Button>
      </div>
    </a>
  </>)
}

// 上限管理の表示
const UpperLimitView = (props) =>{
  const classes = useStyles();
  const allState = useSelector(s=>s);
  const account = useSelector(state=>state.account);
  const users = useSelector(state=>state.users);
  const schedule = useSelector(state=>state.schedule);
  const scheduleLocked = schedule.locked;
  const service = useSelector(state=>state.service);
  const classroom = useSelector(state=>state.classroom) + '';
  const controleMode = useSelector(state=>state.controleMode);
  const stdDate = allState.stdDate;
  const upperLimitBrosUid = 
  controleMode.upperLimitBrosUid?controleMode.upperLimitBrosUid:''
  const permission = comMod.parsePermission(allState.account)[0][0];
  const dispatch = useDispatch();
  // 単位指定を無効にする
  // useEffect(()=>{
  //   if (classroom){
  //     dispatch(Actions.setStore({classroom: ''}));
  //   }
  // }, [classroom]);
  // 兄弟上限用フィルタ出力
  // ストアにdispatchして兄弟上限のみ表示するようにする
  const brosClickHandler = (ev) => {
    const uid = ev.currentTarget.getAttribute('firstbros');
    if (!uid) return false;
    const t = {...controleMode};
    t.upperLimitBrosUid = t.upperLimitBrosUid? '': uid
    dispatch(Actions.setStore({controleMode: t}));
  }
  // const users = susers.filter(e=>(service==='' || e.service === service))
  // .filter(e=>(classroom==='' || e.classroom === classroom));
  const [userSelectOpen, setUserSelectOpen] = useState(false);
  // 市区町村と受給者証番号を表示
  const [dispCitiesHno, setDispCitiesHno] = useState(
    comMod.getUisCookie(comMod.uisCookiePos.displayCitiesHnoOnProseed) !== '0'
  );
  // コンポーネントがリロードされるため値保持が必要
  const officeNoLsName = 'jougenkanriOfficeNo-' + allState.bid;
  const officeNoLsValue = getLSTS(officeNoLsName, 60);
  const [officeNo, setOfficeNo] = useState(officeNoLsValue? officeNoLsValue: '');
  const officeList = getOtherOffices(users);
  const { 
    billingDt , open, setOpen, dialogPrms, setDailogPrms, ...others
  } = props;
  // スクロールによりボタン周りの背景を不透過にする。
  // const buttonWraptransparency = () => {
  //   const st = document.documentElement.scrollTop;
  //   const tElm = document.querySelector('#wrrty45');
  //   if (st > 200){
  //     tElm.style.background = '#fff'; 
  //   }
  //   else{
  //     tElm.style.background = 'transparent';
  //   }
  // }
  // useEffect(()=>{
  //   window.addEventListener('scroll', buttonWraptransparency);
  //   return ()=>window.removeEventListener('scroll', buttonWraptransparency);
  // }, [])
  // 上限管理対象事業所を設定したときステイトがクリアになるのを保持
  useEffect(()=>{
    setLSTS(officeNoLsName, officeNo);
  }, [officeNo])

  const thisTitle = albcm.getReportTitle(allState, '上限管理');
  useEffect(()=>{
    const titleSet = () => document.title = thisTitle;
    const titleReset = () => document.title = albcm.defaultTitle;
    window.addEventListener('beforeprint', titleSet);
    window.addEventListener('afterprint', titleReset);
    return (()=>{
      window.removeEventListener('beforeprint', titleSet);
      window.removeEventListener('afterprint', titleReset);
    })
  }, [])


  // 利用実績ありのuidを配列化
  // 協力事業所に利用額がある場合、初期値として配列に加える
  const existUsing = (Array.isArray(billingDt))?
  billingDt.filter(
    e=>e.countOfUse>0 || e.userSanteiTotal > 0 ||
    (Array.isArray(e.協力事業所) && e.協力事業所.reduce((v, x)=>(v + (x.amount || 0)), 0) > 0)
  ).map(e=>comMod.convUID(e.UID).num):[];
  // 管理タイプ設定済みのユーザーを列挙
  const userListInit = users
  .filter(e=>(e.kanri_type || e.brosIndex === '1')).map(e=>{
    const r = {uid: e.uid, checked: false, kanriType: e.kanri_type};
    // 利用実績のあるユーザー
    if (existUsing.indexOf(parseInt(e.uid)) > -1) r.checked = true;
    return r;
  });
  // 手動上限管理設定されているユーザーを追加
  if (!schedule[service]) schedule[service] = {};
  Object.keys(schedule[service]).map(e=>{
    // eはUIDが格納されている
    const o = schedule[service][e]
    const thisJougen = fdp(o, 'addiction.利用者負担上限額管理加算');
    if (thisJougen !== null && thisJougen !== '0'){
      const u = String(comMod.convUID(e).num);
      const p = userListInit.findIndex(f=>f.uid === u);
      if (p > 0){
        userListInit[p].checked = true;
      }
    }
  });

  // すでに協力事業所の利用情報が登録されている場合もチェック
  Object.keys(schedule).filter(e=>e.match(/^UID[0-9]+/)).forEach(e=>{
    let amount = 0;
    if (Array.isArray(schedule[e].協力事業所)){
      amount = schedule[e].協力事業所.reduce((v, e)=>(v + parseInt(e.amount)),0);
    }
    if (amount){
      const u = String(comMod.convUID(e).num);
      const p = userListInit.findIndex(f=>f.uid === u);
      if (p > 0){
        userListInit[p].checked = true;
      }
    }
  });
  // チェックボックスのステイトとして設定
  const [userList, setUserList] = useState(userListInit);
  // officeNoにより限定された表示にする
  useEffect(()=>{
    const t = userListInit.filter(item=>{
      if (!officeNo) return true;
      const user = users.find(e=>item.uid === e.uid);
      if (!user) return false;
      // 管理事業所と協力事業所をマージした配列を得る
      const list = [...(user?.etc?.協力事業所 ?? []), ...(user?.etc?.管理事業所 ?? [])];
      const found = list.find(e=>e.no === officeNo);
      return found;
    });
    setUserList(t);
  }, [officeNo])
  if (!Array.isArray(billingDt)) return null;
  // ユーザーリストにより選択された請求データ
  const selectedBdt = billingDt.map(e=>{
    const t = userList.filter(f=>f.checked);
    const v = t.find(f=>parseInt(f.uid)===comMod.convUID(e.UID).num);
    if (v)  return e;
  }).filter(e=>e)
  .sort((a, b)=> (parseInt(a.sindex) < parseInt(b.sindex) ? -1: 1));
  ;
  // 管理事業所データ
  const kanri = selectedBdt.filter(e => e.kanriType === "管理事業所");
  // 協力事業所
  const kyouryoku = selectedBdt.filter(e => e.kanriType === "協力事業所");
  // 兄弟用、長兄のみの配列
  const kyoudaiFirst = selectedBdt.filter(e=>parseInt(e.brosIndex) === 1);
  // 数値を表示する。数値ではない場合---を表示
  const NumDisp = (props) => {
    const {n, style} = props;
    if (isNaN(n)){
      return(<span style={{color:red[500], fontWeight: 600,}}>---</span>);
    }
    else {
      return(<span style={style}>{formatNum(n, 1)}</span>)
    }
  }
  const DetailOutput = (props) => {
    if (!props.dt) return null;
    // 空白の配列が入ってきたときの処理。異常終了するので対応が必要
    if (!Array.isArray(props.dt)) return null;
    if (!props.dt.length) return null;
    
    // 管理事業所用出力
    if (!props.kyouryoku){
      const thisDetail = props.dt.map((e, i)=>{
        return (
          <div key={i}>
            <div className='flxRow detailRow'>
              <div className='w60 noBkColor textEclips'>
                {e.name === 'thisOffice' &&
                  '当事業所'
                }
                {e.name !== 'thisOffice' &&
                  shortenStr(e.name)              
                }
                {e.name !== 'thisOffice' &&
                  <span 
                    className='small'
                    style={{marginInlineStart: '8px'}}
                  >
                    ({e.no})
                  </span>
                }
              </div>
              <div className='w20 right noBkColor'><NumDisp n={e.amount}/></div>
              <div className='w20 right noBkColor'><NumDisp n={e.kettei}/></div>
            </div>
            {!isNaN(e.dokujiHojo) && <>
              <div className='flxRow detailRow' key = {i + 'dokujihojo'}>
                <div className='w60 noBkColor textEclips'/>
                <div className='w20 right noBkColor'>独自助成</div>
                <div className='w20 right noBkColor'><NumDisp n={e.dokujiHojo}/></div>
              </div>
            </>}
          </div>
        );
      });
      return thisDetail;
    }
    // 協力事業所用出力
    else if (props.kyouryoku){
      const e = props.dt[0]; // データは一個！
      return(<>
        <div className='flxRow detailRow' key={0}>
          <div className='w30 noBkColor textEclips' >
            管理事業所
          </div>
          <div className='w70 noBkColor textEclips'>
            {shortenStr(e.name)}
            <span
              style={{ marginInlineStart: '8px' }}
            >
              ({e.no})
            </span>
          </div>
        </div>
        <div className='flxRow detailRow' key={1}>
          <div className='w50 noBkColor textEclips' >
            当事業所
          </div>
          <div className='w35 right noBkColor'></div>
          <div className='w15 right noBkColor'>
            {formatNum(
              (isNaN(e.kettei)?0 : e.kettei), 1
            )}
          </div>
        </div>
      </>)
    }
  }
  // 複数児童用の詳細出力
  const DetailOutputBros = (props) => {
    const bros = (comMod.getBrothers(props.UID, users));
    const brosUid = bros.map(e=>('UID' + e.uid));
    const bilBros = billingDt.filter(e=>brosUid.indexOf(e.UID) > -1);
    bilBros.sort((a, b)=>(a.brosIndex < b.brosIndex)? -1: 1);
    const KanrikekkaDispa = (props) => {
      if (!props.k){
        return (
          <div className={'kanrikekka'}>
            <span className='label'>上限管理結果設定無し</span>
          </div>
        )
      }
      return (
        <div className={'kanrikekka'}>
          <span className='label'>上限管理結果</span>
          <span className='value'>{props.k}</span>
        </div>
      )
    }
    const thisDetail = bilBros.map((e, i)=>{
      return (
        <div key={i} className={classes.detailOutputBrosRoot}>
          <div className='flxRow detailRow' key = {i}>
            <div className='w50 noBkColor textEclips'>
              {e.name? e.name: e.pname + '(' + e.brosIndex + ')'}
            </div>
            <div className='w20 right noBkColor'>
              {formatNum(e.userSanteiTotal, 1)}
            </div>
            {/* <div className='w15 right noBkColor'>
              {formatNum(Math.floor(e.userSanteiTotal / 10, .1), 1)}
            </div> */}
            <div className='w15 right noBkColor'>{formatNum(e.ketteigaku, 1)}</div>
          </div>
          <KanrikekkaDispa k={e.kanriKekka}/>
        </div>
      )
    });
    return thisDetail;
  }

  // 配分が配列のどこに書いてあるかわからない！？
  const getHaibun = (ary) =>{
    let v = '未定';
    ary.map(e=>{
      if (e.haibun) v = e.haibun;
    });
    v = (v === '最多利用最大')? '最多最大': v;
    return v;
  }
  const userClickHandler = (ev) =>{
    if (scheduleLocked) return false;
    const uid = ev.currentTarget.getAttribute('uid');
    const specifyType = ev.currentTarget.getAttribute('specifytype');
    setDailogPrms({uid, specifyType});
    setOpen(true);
  }
  // 管理結果フラグに対応したラベルを返す
  // 協力事業所の場合、管理事業所開裂を受け取り管理結果設定しないを検出する
  const kanriKekkaName = (v, kJiArray) => {
    if (kJiArray && Array.isArray(kJiArray) && kJiArray.length){
      if (kJiArray[0].kanriKekka === '設定しない'){
        return '設定しない'
      }
    }
    v = isNaN(v) || !v ? 0: v;
    return ['未設定', '管理事業所充当', '上限内', '調整済み', '設定しない'][parseInt(v)]
  }
  

  const kanriTitle = (
    <div className='titleOuter' id='stickyTitle'>
      <div className='flxTitle'>
        <div className='wmin noBkColor'>No</div>
      </div>
      <div className='titleLeft'>
        <div className='flxTitle'>
          <div className='noBkColor'>利用者 / 概要</div>
        </div>
      </div>
      <div className='titleRight'>
        <div className='flxTitle'>
          <div className='w60 noBkColor'>事業所名/兄弟</div>
          <div className='w20 noBkColor'>総費用額</div>
          {/* <div className='w15 noBkColor'>一割</div> */}
          <div className='w20 noBkColor'>決定額</div>
        </div>
      </div>
    </div>
  )

  // ユーザー表示用。混乱しているので統合する
  const UserNodes = (props) => {
    const classes = useStyles();
    const {ary, items, numOffset} = props;
    const schedule = useSelector(s=>s.schedule);
    const manualJichiJoseiObj = schedule[manualJichiJosei] || {}; 
    // 受給者証番号を表示
    const [dispCitiesHno, ] = useState(
      comMod.getUisCookie(comMod.uisCookiePos.displayCitiesHnoOnProseed) !== '0'
    );

    // 管理事業所の余計な表示を排除
    const haibun = (v) => {
      if (items === 'kanri'){
        return '管理';
        // return '管理 / ' + ((v.協力事業所) ? getHaibun(v.協力事業所) : '未定');
      }
      else if (items === 'kyouryoku') return '協力'
      else if (items === 'bros') return '兄弟'
    }
    // スケジュールオブジェクトに上限管理設定項目もあることを確認する
    // 引数は請求データの1ユーザー分
    const getJougenStatus = (v) => {
      const UID = v.UID;
      const service = getPriorityService(v.service);
      // 手動設定の状態を取得
      const forth = fdp(
        schedule, [service, UID, 'addiction', '利用者負担上限額管理加算']
      );
      const rt = {};
      // 手動でonならその状態を返す
      if (forth !== null && parseInt(forth) !== 0){
        rt.forth = true;
        rt.set = (forth === '手動')? true: false;
        return rt;
      }
      // itemTotalに上限管理加算があるか
      // --上限管理サービスコード取得して配列化
      const JOUGEN_KANRI = getJougekanriScvCd(stdDate);
      const jougenSvc = Object.keys(JOUGEN_KANRI).map(e=>JOUGEN_KANRI[e].s);
      let jougenFound = false;
      jougenSvc.map(e=>{
        if (v.itemTotal.find(f=>f.s === e)) jougenFound = true;
      });
      rt.forth = false;
      rt.set = jougenFound;
      return rt;
    }
    const JougenDisplay = (props) => {
      const {jStatus} = props;
      return (<>
        {(jStatus.forth && jStatus.set) &&
          <div className='jougenStatus hand'>
            <span>上限手動</span>
          </div>
        }
        {(!jStatus.forth && jStatus.set) &&
          <div className='jougenStatus'>
            <span>上限自動</span>
          </div>
        }
        {(jStatus.forth && !jStatus.set) &&
          <div className='jougenStatus off'>
            <span>上限オフ</span>
          </div>
        }
      </>)
    }
    // ユーザータイプによる設定。ダイアログで使われる
    const st = ['kanri', 'kyouryoku', 'bros'].findIndex(e=>e===items);
    const nodes = ary.map((e, i)=>{
      const firstBros = comMod.getFirstBros(e.UID, users);
      const user = getUser(e.UID, users);
      const jStatus = getJougenStatus(e);
      // 兄弟上限モード 出力抑制
      if (upperLimitBrosUid && upperLimitBrosUid !== firstBros) return null;
      let numDivStyle = firstBros? {cursor: 'pointer'}: {};
      let ruStyle = albcm.recentUserStyle(e.UID);
      numDivStyle = {...numDivStyle, ...ruStyle};
      // 兄弟を検索するためのアイコンを提供する
      const BrosIcon = () => {
        if (!firstBros) return null;
        if (!upperLimitBrosUid){
          return (
            <div className='brosSerchIcon' >
              <SearchIcon />
            </div>
          )
        }
        else{
          return (
            <div className='brosCloseIcon' style={{color: grey[400]}} >
              <CloseIcon />
            </div>
          )
        }
      }
      const kanriOkClass = (e.kanriOk && items !== 'bros')? 'kanriOk': '';
      const notUseClass = (e.userSanteiTotal === 0)? 'notUse': '';
      const manualJichiJoseiVal = manualJichiJoseiObj[e.UID];
      const userWrapStyle = scheduleLocked !== true? {cursor: 'pointer'}: {};
      return(
        <div 
          className={`userWrap ${kanriOkClass} ${notUseClass} ${classes.hoverTarget}`} 
          key={i} onClick={userClickHandler} uid={e.UID} specifytype={st} style={userWrapStyle}
        >
          <div className='Num' style={numDivStyle} firstBros={firstBros ? firstBros : ''} onClick={brosClickHandler}>
            <div>
              {i + numOffset}
            </div>
            <BrosIcon />
          </div>
          <div className='user'>
            <div className={'userName ' + items}>
              <div style={{ width: 'calc(100% - 40px)' }}>
                <DispNameWithAttr {...user} />
              </div>
              {jStatus.set === true && <PlusIcon />}
              {scheduleLocked !== true && <EditIcon className='EditIcon' />}
            </div>
            <div className='haibunStatus'>
              {haibun(e)}
              {items !== 'bros' && <JougenDisplay jStatus={jStatus} />}
            </div>
            <div className='userInfo'>
              <span className='t'>算定額</span>
              <span className='num'><NumDisp n={e.userSanteiTotal} /></span>
            </div>
            <div className='userInfo'>
              <span className='t'>上限額</span>
              <span className='num'><NumDisp n={e.priceLimit} /></span>
            </div>
            <div className='userInfo'>
              <span className='t'>決定額</span>
              <span className='num'><NumDisp n={e.ketteigaku} /></span>
            </div>
            <div className='userInfo'>
              <span className={'kanriNum ' + items}>
                {isNaN(e.kanriKekka) || !e.kanriKekka ? 0 : e.kanriKekka}
              </span> :
              {kanriKekkaName(e.kanriKekka, e.管理事業所)}
            </div>
            {(manualJichiJoseiVal && manualJichiJoseiVal > 0) ? (
              <div className='userInfo'>
                <span className='t' style={{ color: blue[900], fontSize: '.7rem' }}>手動自治助成</span>
                <span className='num'>
                  <NumDisp style={{ color: blue[900] }} n={manualJichiJoseiVal} />
                </span>
              </div>
            ) : null}
          </div>
          <div className='detail'>
            {items === 'bros' && <DetailOutputBros UID={e.UID} />}
            {items === 'kanri' && <DetailOutput dt={e.協力事業所} />}
            {items === 'kyouryoku' && <DetailOutput dt={e.管理事業所} kyouryoku />}
          </div>
          {dispCitiesHno && <>
            <div className='cityAndHnoSpacer'></div>
            <div className='cityAndHno'>{e.scity} {e.hno}</div>
          </>}
        </div>
      )
    });
    return nodes;
  }
  // 兄弟限定表示のときを含め管理事業所の児童が存在するか
  const isKanriExist = () => {
    const t = kanri.filter(e=>{
      if (upperLimitBrosUid){
        return(
          comMod.getFirstBros(e.UID, users) === upperLimitBrosUid
        )
      }
      else return true;
    })
    return t.length > 0;
  }
  // 兄弟限定表示のときを含め協力事業所の児童が存在するか
  const isKyouryokuExist = () => {
    const t = kyouryoku.filter(e=>{
      if (upperLimitBrosUid){
        return(
          comMod.getFirstBros(e.UID, users) === upperLimitBrosUid
        )
      }
      else return true;
    })
    return t.length > 0;
  }
  const kanriExist = isKanriExist();
  const kyouryokuExist = isKyouryokuExist();
  if (!kyoudaiFirst.length && !kanriExist && !kyouryokuExist){
    const style = {textAlign: 'center', padding: 16}
    return (<>
      <div style={style}>表示するデータがありません</div>
      {officeList.length > 0 &&
        <OfficeSelectButton 
          officeNo={officeNo} officeList={officeList} setOfficeNo={setOfficeNo}
        />
      }
    </>)
  }
  const jougenInfo = billingDt ? isExistJougen(billingDt, users) : [];

  return(<>
    <div className={classes.H + ' noprint'}>
      上限管理一覧
      <div className='notice'>
        <LocalHospitalIcon/>上限管理加算算定しています。
      </div>
    </div>
    <div className={classes.upperLimitRoot} id='upperLimitRoot'>
      {/* 兄弟上限フィルタモード */}
      <BrosOnlyDisplay  />
      {kanriTitle}
      {/* {brosOutput} */}
      {kyoudaiFirst.length > 0 && 
        <div className='grpTitle'><span>兄弟</span>上限</div>
      }
      <UserNodes 
        ary={kyoudaiFirst} items='bros'
        numOffset={1}
      />
      {kanriExist && 
        <div className='grpTitle'>こちらが<span>管理</span>事業所</div>
      }
      <UserNodes 
        ary={kanri} items='kanri'
        numOffset={kyoudaiFirst.length + 1}
      />
      {/* 利用がない利用者の名前を表示して、クリックするとUserListをtrueにする */}
      <NotJogenKanriUsers userList={userList} setUserList={setUserList} />
      {kyouryokuExist && 
        <div className='grpTitle'>こちらが<span>協力</span>事業所</div>
      }
      <UserNodes 
        ary={kyouryoku} items='kyouryoku'
        numOffset={kyoudaiFirst.length + kanri.length + 1}
      />
      {billingDt && <>
        <SetUisCookieChkBox 
          setValue={setDispCitiesHno} p={comMod.uisCookiePos.displayCitiesHnoOnProseed}
          label='市区町村名と受給者証番号を表示する'
          style={{margin: 0}}
        />
        {permissionCheck(PERMISSION_DEVELOPER, account) &&
          <div style={{pdding: 4}}>
            上限管理結果票の数: {jougenInfo.uidsArray.length}
            <div style={{padding: 4}}>
              {jougenInfo.userList.map(e => <div key={e.name}>{e.name}</div>)}
            </div>
          </div>
        }
      </>}

    </div>
    {/* <div className={classes.dialogOpenButtonRoot + ' noprint'} id='wrrty45'>
      <Button
        onClick={() => setUserSelectOpen(true)}
        color='secondary'
        variant='contained'
      >
      <GroupIcon fontSize='large' />
        <div className='buttonText'>
          <span>設定済み</span>
          <span>{userList.filter(e=>e.checked).length}</span>
          <span>人</span>
        </div>
      </Button>
    </div> */}

    {/* <UserSelectDialog
      open={userSelectOpen}
      setOpen={setUserSelectOpen}
      userList={userList}
      setUserList={setUserList}
    /> */}
    <OfficeSelectButton 
      officeNo={officeNo} officeList={officeList} setOfficeNo={setOfficeNo}
    />

  </>);
}

export const UpperLimitInner = (props) => {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const [dialogPrms, setDailogPrms] = useState({ uid: '', specifyType: '' });
  const closeHandler = () => setOpen(false);
  const billingDt = useSelector(state => state.billingDt);
  const account = useSelector(state => state.account);
  const stdDate = useSelector(state => state.stdDate);
  const permission = comMod.parsePermission(account)[0][0];
  if (permission < 90){
    return <PermissionDenied marginTop='90' />
  }
  else{
    return (<>
      <div className="AppPage proseed" style={props.style}>
        <DisplayInfoOnPrint />
        {(permission === 100  || stdDate >= '2023-08-01') &&
          <CheckBillingEtc billingDt={billingDt} />
        }
        {(stdDate < '2023-08-01') &&
          <CheckProgress inline />
        }
        {billingDt &&
          <ManualJosei displayInline billingDt={billingDt} />
        }
        {/* <CheckProgress inline /> */}
        <RecalcButton hidePrint useAdjustetUpperLimit={false} />
        <div style={{ height: 16 }}></div>
        {!billingDt && <NoData/>}
        <UpperLimitView
          billingDt={billingDt}
          open={open} setOpen={setOpen}
          dialogPrms={dialogPrms} setDailogPrms={setDailogPrms}
        />
        <UpperLimitWrapDialog
          open={open} setOpen={setOpen}
          billingDt={billingDt}
          close={closeHandler}
          uid={dialogPrms.uid} specifyType={dialogPrms.specifyType}
        />
      </div>

    </>)
  }
}

export const getProseedMenu = (account, com, accountLst) => {
  const hideJichiJosei = (() => {
    // const permissionAllow = permissionCheck(PERMISSION_MANAGER, account);
    // com.etc.citiesに定率助成の設定があるか確認
    const hasTeiritsuJosei =
      com?.etc?.cities &&
      Array.isArray(com.etc.cities) &&
      com.etc.cities.some(city => city.teiritsuJosei === true);
    
    if (hasTeiritsuJosei) return false;
    
    return true;
  })();

  const menu = [
    { link: "/proseed", label: "一般", print: true },
    { link: "/proseed/upperlimit", label: "上限管理", print: true },
    { 
      link: "/billing/jichijoseiadjustment", 
      label: "自治体助成調整",
      hide: hideJichiJosei
    },
  ];

  if (Array.isArray(accountLst) && accountLst.length > 1){
    menu.push({link:'/proseed/otherOfficeis', label:'他事業所', print: true})
  }
  menu.push({ link: "/proseed/oneyear", label: "年間", print: true });

  return menu;
};

export const ProseedLinksTab = () => {
  const account = useSelector(state => state.account);
  const com = useSelector(state => state.com);
  const accountLst = useSelector(state=>state.accountLst);
  const stdDate = useSelector(state => state.stdDate);

  const menu = getProseedMenu(account, com, accountLst);
  // 現在が当月以前ならメニューから確定処理を外すフィルタを作成
  const d = new Date();
  const today = d.getDate();
  d.setDate(1);
  const thisMonth = comMod.formatDate(d, 'YYYY-MM-DD');
  let menuFilter = null;
  if (thisMonth <= stdDate){
    menuFilter = (e) => !e.pastMonthOnly
  }
  
  return (<LinksTab menu={menu} menuFilter={menuFilter}/>)
} 

const CallDispHintProseed = () => {
  // - text: 表示するテキスト（stringまたはstringの配列）
  // - links: 関連情報へのリンク（stringの配列）
  // - left, top, bottom, right: 表示位置（ピクセル単位）
  // - wdth: 表示幅（初期値200px）
  // - id: ヒントのID
  // - hideHint: ヒントを表示するかどうかを指定するフラグ
  const billingDt = useSelector(state=>state.billingDt);
  // const {text, links, left, top, bottom, right, wdth = 200, id, hideHint} = props;
  const hideHint = (billingDt?.length)? false: true;
  const hintList = [
    {
      text: '利用予定を入力するとすぐに売上予測が確認出来ます。',
      id: '001'
    },
    {
      text: '利用者別売上の利用者をクリックすると単位明細が確認出来ます。サービスコード別一覧のサービスコードをクリックすると、サービスコードを取得している利用者一覧が見れます。',
      links: ['https://rbatos.com/lp/2022/08/27/displaydetailoftanni/'],
      id: '002',
    },
    {
      text: '複数の事業所にログインできるアカウントをお持ちの方は「他事業所」から、売上の一覧が確認出来ます。',
      id: '003'
    },
  ]
  const hintGroupName = 'proseed';
  const commonPrms = {bottom: 88, right: 24, hideHint}
  const p = {hintList: [...hintList], hintGroupName, commonPrms}
  return (
    <DisplayHintGroups {...p} />
  )
}


const PrintButton = ({path, }) => {
  const classes = useStyles();
  const history = useHistory();

  const handleClick = () => {
    history.push(path);
  }
  return(
    <div className={classes.printButton + ' noprint hideBackDrop' }>
      <Button
        className="button"
        onClick={handleClick}
        variant="contained"
      >
        <DescriptionIcon style={{marginRight: 8, color: teal[500]}} />
        <span style={{marginRight: 6}}>帳票印刷</span>
      </Button>
    </div>
  )
}


export const ProseedUpperLimit = () =>{
  const allState = useSelector(state=>state);
  const ls = comMod.getLodingStatus(allState);
  if (!ls.loaded){
    return (
      <LoadingSpinner />
    )
  }
  else if (ls.error){
    return (
      <LoadErr loadStatus={ls} errorId={'E4935'} />
    )
  }
  else{
    return (<>
      <ProseedLinksTab/>
      <UpperLimitInner style={appPageStyle} />
      <SchLokedDisplay/>
      <PrintButton path='/reports/jogenkanri/' />
      <ProseedJougenJigyousyoChk />
    </>)
  }
}


const ProseedMain = () => {
  const classes = useStyles();
  const sUsers = useSelector(state => state.users);
  const dispatch = useDispatch();
  const allState = useSelector(state=>state);
  const {com, service, account, classroom, stdDate} = allState;
  const billingDt = useSelector(state=>state.billingDt);
  const ls = comMod.getLodingStatus(allState);
  const displaySwitchLsName = 'ProseedByUserdisplaySwitch';
  const [displaySwitch, setDisplaySwitch] = useState(getLS(displaySwitchLsName) || 'normal');
  const [checkBilling, setCheckBilling] = useState({result: false, done: false});
  const [errorState, setErrorState] = useState({
    errorText: '', errorSubText: '', errorId:'', errorDetail:'',
    erroOccured: false,
  });
  const hasSouchiseikyuu = sUsers.some(e=>e.etc?.sochiseikyuu);
  // 受給者証番号を表示
  const [dispCitiesHno, setDispCitiesHno] = useState(
    comMod.getUisCookie(comMod.uisCookiePos.displayCitiesHnoOnProseed) !== '0'
  );
  // 市区町村順に表示
  const [sortCities, setSortCities] = useState(
    comMod.getUisCookie(comMod.uisCookiePos.displaySortCitiesOnProseed) !== '0'
  );
  const [notDispSouchiseikyuu, setNotDispSouchiseikyuu] = useState(
    comMod.getUisCookie(comMod.uisCookiePos.notDispSochiseikyuuOnProseed) !== '0'
  );
  
  // notDispSouchiseikyuuの設定に応じてusersをフィルタリング
  const users = useMemo(() => {
    if (notDispSouchiseikyuu) {
      return sUsers.filter(user => !user.etc?.sochiseikyuu);
    }
    return sUsers;
  }, [sUsers, notDispSouchiseikyuu]);

  const [openPsUser, setOpenPsUser] = useState(false);
  const [openPsItem, setOpenPsItem] = useState(false);
  const [dialogIdent, setDialogIdent] = useState(null);
  const [userAttr, setUserAttr] = useState([]);
  
  const permission = comMod.parsePermission(account)[0][0];
  // 請求データのチェックを行う
  useEffect(()=>{
    const checkResult = albcm.chekBillingDt(billingDt);
    setCheckBilling(checkResult);
    if (checkResult.done && !checkResult.result){
      let msgDetail = '';
      checkResult.detail.map(e=>{
        msgDetail += (e.name + '/');
        msgDetail += (e.content.key) + '、';
      });
      msgDetail = msgDetail.slice(0, -1); // 末尾削除
      setErrorState({
        errorText: 'サービスコードエラーです。', 
        errorSubText: 
          '正しくないサービス、加算が指定されていると思われます。内容をご確認の上' +
          'データの訂正などを行って下さい。' + 
          'データに問題がないのにこのメッセージが表示されるときはサポートまで' +
          'ご連絡をお願いいたします。以下の項目でエラーが発生しています。', 
        errorId:'E334558', 
        errorDetail:msgDetail,
        erroOccured: true,
      });
    }
  },[billingDt]);


  const comAdic = comMod.findDeepPath(com, ['addiction', service]);  
  // 基本設定項目の確認
  if (ls.loaded && !comAdic && service){
    return(
      <StdErrorDisplay 
        errorText = '請求設定項目が未設定です。'
        errorSubText = {`予定作成開始に必要な基本設定項目がありません。設定メニューの
        「請求・加算」から定員や地域区分などを設定して下さい。`}
        errorId = 'E49419'
      />
    )
  }

  const DisplaySwitch = () => {
    if (!billingDt) return null;
    return (
      <FormControl className="noprint" 
        component="fieldset" 
        style={{
          marginTop: 0, marginBottom: 8, 
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}
      >
        <RadioGroup 
          row 
          name="displaySwitch" 
          value={displaySwitch} 
          onChange={(event) => {
            setDisplaySwitch(event.target.value);
            setLS(displaySwitchLsName, event.target.value);
          }}
        >
          <FormControlLabel
            value="normal" 
            control={<Radio />} 
            label="通常表示" 
          />
          <FormControlLabel 
            value="syoguu" 
            control={<Radio />} 
            label="処遇改善表示" 
          />
        </RadioGroup>
      </FormControl>
    )
  }

  if (permission < 90){
    return (<PermissionDenied marginTop='120' />)
  }
  else if (!ls.loaded){
    return (
      <LoadingSpinner />
    )
  }
  else if (ls.error){
    return (
      <LoadErr errorId={'E4932'} loadStatus={ls} />
    )
  }
  else if (errorState.erroOccured){
    return(
      <StdErrorDisplay {...errorState} />
    )
  }
  else{
    return(<>
      {/* <LinksTab menu={subMenu} /> */}
      <ProseedLinksTab/>
      <DisplayOnPrint />
      <div className="AppPage proseed" >
        {(permission === 100  || stdDate >= '2023-08-01') &&
          <CheckBillingEtc billingDt={billingDt} />
        }
        {(stdDate < '2023-08-01') &&
          <CheckProgress inline />
        }
        {billingDt &&
          <ManualJosei displayInline billingDt={billingDt} />
        }

        <StrongWarning billingDt={billingDt} />
        <RecalcButton hidePrint setCheckBilling={setCheckBilling} />
        <div style={{height:16}}></div>
        <DisplaySwitch />
        <ProseedSummary 
          data={billingDt} checkBilling={checkBilling} displaySwitch={displaySwitch} users={users} 
          notDispSouchiseikyuu={notDispSouchiseikyuu}
        />
        <ProseedByUsers 
          data={billingDt} users={users} checkBilling={checkBilling} setOpen={setOpenPsUser} 
          setDialogIdent={setDialogIdent}
          userAttr={userAttr} setUserAttr={setUserAttr}
          dispCitiesHno={dispCitiesHno} sortCities={sortCities}
          displaySwitch={displaySwitch}
        />
        <ProseedByServiceCd 
          billingDt={billingDt} checkBilling={checkBilling} users={users} setOpen={setOpenPsItem} setDialogIdent={setDialogIdent}
        />
        <PsDispDetailOfUsers 
          UID={dialogIdent} billingDt={billingDt} open={openPsUser} setOpen={setOpenPsUser} 
        />
        <PsDispDetailOfUsers2024
          UID={dialogIdent} billingDt={billingDt} open={openPsUser} setOpen={setOpenPsUser} 
        />
        <div style={{marginTop: 8, marginBottom: 24}}>
          <UserAttrInfo userAttr={userAttr}/>

        </div>
        <PsDispDetailOfItem 
          servCode={dialogIdent} billingDt={billingDt} open={openPsItem} setOpen={setOpenPsItem}
        />
        <PsDispDetailOfItem2024
          servCode={dialogIdent} billingDt={billingDt} open={openPsItem} setOpen={setOpenPsItem} users={users}
        />
        {/* <CallDispHintProseed /> */}
        {billingDt &&
          <SetUisCookieChkBox 
            setValue={setDispCitiesHno} p={comMod.uisCookiePos.displayCitiesHnoOnProseed}
            label='市区町村名と受給者証番号を表示する'
            style={{margin: 0}}
          />
        }
        {billingDt &&
          <SetUisCookieChkBox 
            setValue={setSortCities} p={comMod.uisCookiePos.displaySortCitiesOnProseed}
            label='利用者を市区町村・受給者証番号順に並び替えを行う'
            style={{margin: 0, marginTop: -12}}
          />
        }
        {hasSouchiseikyuu && billingDt &&
          <SetUisCookieChkBox 
            setValue={setNotDispSouchiseikyuu} p={comMod.uisCookiePos.notDispSochiseikyuuOnProseed}
            label='売上管理画面で措置請求を表示しない'
            style={{margin: 0, marginTop: -12}}
          />
        }
        <SchHohouDuplicateCheckAndDelete style={{ margin: '40px auto' }} />
        <div style={{height: 48}}></div>
        <PrintButton path='/reports/billing'  />
      </div>
    </>)
  }
}
const Proseed = () => {
  return (
    <ProseedMain />
  )
}
export default Proseed;