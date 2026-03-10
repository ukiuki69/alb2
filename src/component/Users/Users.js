import React,{useState, useEffect} from 'react';
// import store from './store';
import * as Actions from '../../Actions';
import { connect, useDispatch, useSelector } from 'react-redux';
import * as comMod from '../../commonModule';
import { HOHOU, HOUDAY, KEIKAKU_SOUDAN, SYOUGAI_SOUDAN } from '../../modules/contants';
import * as albCM from '../../albCommonModule';
import { LoadingSpinner, LoadErr, DisplayInfoOnPrint, SetUisCookieChkBox} from '../common/commonParts';
import * as mui from '../common/materialUi'
import UserDialog from './UserDialog';
import UserSortDialog from './UserSortDialog';
import SnackMsg from '../common/SnackMsg';
import { LinksTab } from '../common/commonParts';
import { useHistory, useLocation, useParams, } from 'react-router-dom';
import UserEditNoDialog from './UserEditNoDialog';
import UserEdit2026 from './UserEdit2026';
import UserEditBankInfo from './UserEditBankInfo';
import { permissionCheckTemporary } from '../../modules/permissionCheck';
import { PERMISSION_DEVELOPER } from '../../modules/contants';
import { blue, grey, orange, pink, red, teal } from '@material-ui/core/colors';
import { Button, Tooltip, colors, makeStyles } from '@material-ui/core';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import { EachAddiction } from '../schedule/SchDaySetting';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import CreateIcon from '@material-ui/icons/Create';
import LockIcon from '@material-ui/icons/Lock';
import { SchInitilizer } from '../schedule/SchInitilizer';
import EmojiPeopleIcon from '@material-ui/icons/EmojiPeople';
import { END_OF_CONTRACT, END_OF_CONTRACT_NEXT, END_OF_USE, ICARE, JUUSHIN, NEXT_MONTH_BIRTHDAY, seagull, SOCHISEIKYUU, THIS_MONTH_BIRTHDAY } from '../../modules/contants';
import { UserAttrInfo } from './UserAttrInfo';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import ErrorIcon from '@material-ui/icons/Error';
import PriorityHighIcon from '@material-ui/icons/PriorityHigh';
import CallDispHintUsers from './CallDispHintUsers';
import HomeIcon from '@material-ui/icons/Home';
import { elapsedMonths } from '../../modules/elapsedTimes';
import GetBankInfo from './GetBankInfo';
import { convJdate } from '../../modules/convJdate';
import KanriKyouryokuFab from './KanriKyouryokuFab';
import KanriKyouryokuUserSelectMenu from './KanriKyouryokuUserSelectMenu';
import BrosAddMenu from './BrosAddMenu';
import BrosOrderSetter from './BrosOrderSetter';
import BrosCandidates from './BrosCandidates';
import { escapeSqlQuotes } from '../../modules/escapeSqlQuotes';
import { useAutoScrollToRecentUser } from '../common/useAutoScrollToRecentUser';
import { UserBankInfoWarning } from './UserBankInfoWarning';

const useStyles = makeStyles({
  '@keyframes brosOrderCellPulse': {
    '0%': { backgroundColor: '#fff' },
    '50%': { backgroundColor: teal[100], color: '#fff' },
    '100%': { backgroundColor: '#fff' },
  },
  dokujiJougen: {
    color: teal[400],
    '& .small': {fontSize: '.7rem'},
  },
  userNameDispWithEdit: {
    position: 'relative',
    '& > a': {
      display: 'flex', position :'absolute', top:0, bottom: 0, left:0, right: 0,
      paddingRight: 8,
      justifyContent: 'right', alignItems: 'center',
      '& .MuiSvgIcon-root':{
        fontSize: 20, opacity: .4, color: grey[600],
        transition: 'all 0.3s ease', // この行を修正
      },
      '&:hover .MuiSvgIcon-root': {
        fontSize: 40, opacity: .8, color: teal[800],
      },
    },
  },
  goodby:{
    fontSize: 16, color: red[600], marginInlineStart: 4,
  },
  contractEndWarning: {
    fontSize: 16, color: pink[300], marginInlineStart: 4,
  },
  contractEndWarningNext: {
    fontSize: 16, color: orange[300], marginInlineStart: 4,
  },
  byUserAddictionCell: {
    width: '100%', height: '100%', cursor: 'pointer',
    position: 'relative',
    '&:hover .icon': {
      opacity: .8, color: teal[800],
      '& .size': {fontSize: 40}
    },
    '& .icon': {
      color: grey[400], opacity: .8,
      position: 'absolute',
      right: 0, top: '50%', transform: 'translateY(-50%)',
      '& .size': {fontSize: 20, transition: '0.4s'}
    },
    '& .eachItem': {
      fontSize: '1rem', padding: '1px 0',
      display: 'flex', alignItems: 'center',
      '& .MuiSvgIcon-root':{
        fontSize: '1rem', color: teal[600],
      },
      '& .name': {margin: 2},
      '& > div': {display: 'flex', alignItems: 'center'}
    }
  },
  otherOfficies: {
    width: '100%', height: '100%',
    position: 'relative',
    '& .officeName': {width: '100%'},
    '& .officeName:not(:first-child)': {paddingTop: 4},
    '&:hover .create': {
      opacity: .8, color: teal[800],
      '& .size': {fontSize: 40}
    },
    '& .addiction': {fontSize: '0.8rem', padding: '1px 0'},
    '& .inconsistency': {color: 'red'},
    '& .icon': {
      position: 'absolute',
      right: 0, top: '50%', transform: 'translateY(-50%)',
      '& .size': {fontSize: 20, transition: '0.4s'}
    },
    '& .lock': { color: red[600] },
    '& .create': { color: grey[400], opacity: .8,},
  },
  explanationTexts: {
    padding: 8,
    '& >div': {
      display: 'flex', alignItems: 'center', padding: '4px 0'
    },
    '& .icon': {fontSize: '1rem'},
    '& .inconsistency': {color: red[600]}, '& .existence': {color: teal[600]},
    '@media print': {
      '& .existence': {display: 'none'},
    }
  },
  nameWithAttr: {
    display: 'inline-flex', alignItems: 'center',
    '& .heavy, .medical': {
      fontWeight: 300, 
      // fontSize: '.8rem', padding: '.1rem .2rem', 
      marginInlineStart: '.3rem',
      color: '#fff', position: 'relative',

    },
    noMaxWidth: {maxWidth: 'none',},
    '& .heavy': {background: teal[500]},
    '& .medical': {background: blue[500]},
    '& >span': {wordBreak: 'break-all', wordWrap: 'break-word'},
  },
  customTooltip: {maxWidth: 300, fontSize: 12},
  belongsRowClass: {
    // '&:hover': {
    //   cursor: 'pointer',
    //   '& > div': {
    //     backgroundColor: `${teal[50]} !important`
    //   },
    //   '& .cityAddress': {
    //     '& .homeIcon': {
    //       '& .icon': {
    //         color: teal[800], fontSize: 40, opacity: 1
    //       }
    //     }
    //   }
    // },
    '& .cityAddress': {
      position: 'relative',
      paddingRight: 16,
      '&:hover': {
        cursor: 'pointer',
        '& .homeIcon': {
          '& .icon': {
            color: teal[800], fontSize: 40, opacity: 1
          }
        }
      },
      '& .homeIcon': {
        position: 'absolute', top: '50%', right: 0,
        transform: "translateY(-50%)",
        position: 'absolute', right: 0,
        '& .icon': {
          opacity: 0.8, color: grey[400],
          fontSize: 20, transition: '0.4s',
        }
      }
    }
  },
  brosOrderCellAnimated: {
    animation: '$brosOrderCellPulse 2.5s ease-in-out infinite',
  },
  brosOrderCellAssigned: {
    backgroundColor: teal[300],
    transition: 'background-color 0.2s ease',
  },
  brosOrderCellWaiting: {
    backgroundColor: teal[50],
  },
  brosActionButtonsRow: {
    position: 'fixed',
    right: 24,
    bottom: 24,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    '& .MuiFab-root': {
      minHeight: 48,
    },
  }
});

const makeToolTipText = ({})

// 利用者の名前を属性付きで返す 重症心身障害児と医療的ケア児
// インライン要素で返す
// 2025/03/22 敬称を追加
// withHonorific: trueのときは敬称を表示する
// props.style: 名前のスタイルを追加する
// props.honorificStyle: 敬称のスタイルを上書きする
// props.displayLimit: 表示制限の配列。falsy なら従来通り全表示。
//   次の要素名のみ指定可能（配列内は任意組み合わせ）：
//   [
//     'Heavy',              // 重症心身障害児アイコン「重」
//     'Medical',            // 医療的ケア児アイコン「医」
//     'GoodBy',             // 当月利用停止アイコン
//     'ThisMonthWarning',   // 受給者証期限 当月警告
//     'NextMonthWarning',   // 受給者証期限 次月警告
//     'BirthdayDisp',       // 今月誕生日アイコン 🎁
//     'BirthdayDispNext',   // 来月誕生日アイコン 🍬
//     'SochiseikyuuDisp',   // 措置請求（国保連に請求しない）🛡️
//   ]
//   備考: 'UidDisp' は displayLimit の影響を受けません（常時表示）。
export const DispNameWithAttr = (props) => {
  const classes = useStyles();
  const stdDate = useSelector(state=>state.stdDate);
  const allState = useSelector(state=>state);
  const developer = comMod.parsePermission(allState.account)[0][0] === 100;
  const {
    icareType, type, name, endDate, setUserAttr, userAttr, 
    uid, hasSch, birthday, withHonorific, etc, displayLimit,
    zIndex, // span要素のz-indexを指定する
  } = props;
  const sa = stdDate.split('-').map(e=>parseInt(e));
  const [titleTexts, setTitleTexsts] = useState('');
  // 次月のstdDateを得る
  const nextMonth = comMod.getDateEx(sa[0], sa[1] + 1, sa[2]).dt;
  const nextStdDate = comMod.formatDate(nextMonth, 'YYYY-MM-DD');
  const { contractEnd, uniqCEndAry } = getContractEndArray(props, );
  // 契約終了警告 当月と次月
  const ceWarning = (contractEnd && contractEnd.slice(0, 7) <= stdDate.slice(0, 7)) &&
  contractEnd !== '0000-00-00'
  const ceWarningNext = (contractEnd && contractEnd.slice(0, 7) === nextStdDate.slice(0, 7));
  // 誕生日表示
  const birthdayDisp = (() => {
    // if (ceWarning) return false;
    if (birthday && birthday.slice(5, 7) === stdDate.slice(5, 7)) return true;
    return false;
  })();
  const birthdayDispNext = (() => {
    // if (ceWarningNext) return false;
    if (birthday && birthday.slice(5, 7) === nextStdDate.slice(5, 7)) return true;
    return false;
  })();
  const sochiseikyuu = etc?.sochiseikyuu;
  useEffect(()=>{
    const t = Array.isArray(userAttr)? [...userAttr]: [];
    const goodby = (endDate && endDate.slice(0, 7) === stdDate.slice(0, 7));
    if (icareType && !t.includes(ICARE)) t.push(ICARE);
    if (goodby && !t.includes(END_OF_USE)) t.push(END_OF_USE);
    if (type === '重症心身障害児' && !t.includes(JUUSHIN)) t.push(JUUSHIN);
    if (ceWarning && !t.includes(END_OF_CONTRACT)) t.push(END_OF_CONTRACT);
    if (ceWarningNext && !t.includes(END_OF_CONTRACT_NEXT)) t.push(END_OF_CONTRACT_NEXT);
    if (birthdayDisp && !t.includes(THIS_MONTH_BIRTHDAY)) t.push(THIS_MONTH_BIRTHDAY);
    if (birthdayDispNext && !t.includes(NEXT_MONTH_BIRTHDAY)) t.push(NEXT_MONTH_BIRTHDAY);
    if (sochiseikyuu && !t.includes(SOCHISEIKYUU)) t.push(SOCHISEIKYUU);
    const titles = [];
    if (goodby) titles.push('利用停止処理が行われています。');
    if (ceWarning) titles.push('今月またはそれ以前に契約期限切れです。');
    if (ceWarningNext) titles.push('来月で契約期限切れです。');
    if (birthdayDisp) titles.push('今月がお誕生日です。');
    if (birthdayDispNext) titles.push('来月がお誕生日です。');
    if (icareType) titles.push('医療的ケア児が設定されています。');
    if (type === '重症心身障害児') titles.push('重症心身障害児が設定されています。');
    if (sochiseikyuu) titles.push('国保連に請求を行わない利用者です。');
    if (titles.length){
      setTitleTexsts(titles.join('\n'));
    }
    // userAttrが期待する値でないときだけ状態を更新
    if (userAttr && t.join(',') !== userAttr.join(',')) {
      if (typeof setUserAttr === 'function') setUserAttr(t);
    }
  }, [userAttr, setUserAttr])
  const Heavy = () => {
    if (type === '重症心身障害児'){
      // tooltipTexts.push(title);
      return (
        <span className='heavy'>重</span>
      )
    }
    else return null;
  }
  const Medical = () => {
    if (icareType){
      // tooltipTexts.push(title);
      return (
        <span className='medical'>医</span>
      )
    }
    else return null;
  }
  // 当月で利用停止のユーザー表示
  const GoodBy = () => {
    if (endDate && endDate.slice(0, 7) === stdDate.slice(0, 7)){
      // tooltipTexts.push(title);
      return (
        <EmojiPeopleIcon className={classes.goodby}/>
      )
    }
    else return null;
  }
  const ThisMonthWarning = () => {
    if (ceWarning){
      // tooltipTexts.push(title);
      return (
        <PriorityHighIcon className={classes.contractEndWarning} />
      )
    }
    else return null;

  }
  const NextMonthWarning = () => {
    if (ceWarningNext){
      // tooltipTexts.push(title);
      return (
        <PriorityHighIcon className={classes.contractEndWarningNext} />
      )
    }
    else return null;
  }
  const BirthdayDisp = () => {
    const style = (ceWarning || ceWarningNext)? {marginInlineStart: -6}: {};
    if (birthdayDisp){
      // tooltipTexts.push(title);
      return (
        <span className={classes.emoji} style={style}>🎁</span>
      )
    }
    else return null;
  }
  const BirthdayDispNext = () => {
    const style = (ceWarning || ceWarningNext)? {marginInlineStart: -6}: {};
    if (birthdayDispNext){
      // tooltipTexts.push(title);
      return (
        <span className={classes.emoji} style={style}>🍬</span>
      )
    }
    else return null;
  }
  const UidDisp = () => {
    if (developer && uid){
      return (
        <span className="noprint" style={{fontSize: '.7rem'}}>{uid}</span>
      )
    }
    else return null;
  }
  const SochiseikyuuDisp = () => {
    if (sochiseikyuu){
      return (
        <span className="noprint" style={{fontSize: '.9rem'}}>🛡️</span>
      )
    }
    else return null;
  }
  // 表示制限の判定: displayLimit が配列のときのみ適用
  const isAllowed = (name) => {
    if (Array.isArray(displayLimit)) return displayLimit.includes(name);
    return true;
  }
  let nameStyle = hasSch? {fontWeight: 600, color: teal[800]}: {};
  if (props.style){
    nameStyle = {...nameStyle, ...props.style};
  }
  let honorificStyle = {fontSize: '.8rem'};
  if (withHonorific){
    honorificStyle = {...honorificStyle, ...props.honorificStyle};
  }
  return (
    <Tooltip title={titleTexts} classes={{ tooltip: classes.customTooltip }}>
      <span className={classes.nameWithAttr} style={{zIndex: zIndex ?? 9999}}>
        <span style={nameStyle}>{name}</span>
        {withHonorific &&
          <span style={honorificStyle}>さん</span>
        }
        <UidDisp/>
        {isAllowed('Heavy') && <Heavy/>}
        {isAllowed('Medical') && <Medical/>}
        {isAllowed('GoodBy') && <GoodBy/>}
        {isAllowed('ThisMonthWarning') && <ThisMonthWarning/>}
        {isAllowed('NextMonthWarning') && <NextMonthWarning/>}
        {isAllowed('BirthdayDisp') && <BirthdayDisp/>}
        {isAllowed('BirthdayDispNext') && <BirthdayDispNext/>}
        {isAllowed('SochiseikyuuDisp') && <SochiseikyuuDisp/>}
      </span>
    </Tooltip>
  )
}

const OtherOfficies = (props) => {
  const classes = useStyles();
  const history = useHistory();
  const {type, uetc, uid, schedule} = props;
  let officeis = [];
  let upperLimitType = null;
  if (type === '管理事業所'){
    officeis = uetc && uetc.協力事業所? uetc.協力事業所: [];
    upperLimitType = "0";
  }
  else if (type === '協力事業所'){
    officeis = uetc && uetc.管理事業所? uetc.管理事業所: [];
    upperLimitType = "1";
  }

  const nothing = officeis.length===0 && !upperLimitType;
  if(nothing) return null;

  const elms = officeis.map(e=>{
    return (
      <div className="officeName">{e.name}</div>
    )
  })

  const inconsistency = schedule[`UID${uid}`]
    && (
      (schedule[`UID${uid}`]["協力事業所"] && schedule[`UID${uid}`]["協力事業所"].length)
      || (schedule[`UID${uid}`]["管理事業所"] && schedule[`UID${uid}`]["管理事業所"].length)
    )
      ?true :false;
  
  const handleClick = () => {
    if(inconsistency) return;
    const scrollVal = document.documentElement.scrollTop;
    sessionStorage.setItem("schUpperLimitNoDialogUid", uid);
    sessionStorage.setItem("schUpperLimitNoDialogUpperLimitType", upperLimitType);
    sessionStorage.setItem("schUpperLimitNoDialogScrollVal", String(scrollVal));
    sessionStorage.setItem("schUpperLimitNoDialogIdName", "userscroll322");
    sessionStorage.setItem("schUpperLimitNoDialogReferrer", window.location.href);
    history.push(`/schedule/userUpperLimit`);
  }

  return (
    <div
      className={classes.otherOfficies}
      style={{cursor: inconsistency ?'default' :'pointer'}}
      onClick={()=>handleClick()}
    >
      {elms}
      <div className={`icon ${inconsistency ?"lock" :"create"}`}>
        {inconsistency ?<LockIcon /> :<CreateIcon className='size'/>}
      </div>
    </div>
  )
}

const UserNameDispWithEdit = ({user, userAttr, setUserAttr, uprms}) => {
  const classes = useStyles();
  const history = useHistory();

  return (
    <div className={'w20 ' + classes.userNameDispWithEdit}>
      <div >
        <DispNameWithAttr {...user} userAttr={userAttr} setUserAttr={setUserAttr}/>
      </div>
      <div className='small'>{user.kana}</div>
      {(uprms === 'kanri' || uprms === 'bros') &&
        <a onClick={()=>{history.push(`/users/edit${user.uid}`)}}>
          <CreateIcon/>
        </a>
      }
    </div>
  )
}

//橋本追加 02/16
const ADDICTION_IGNORE_LIST = ["利用者負担上限額管理加算", "上限管理結果"];
const ByUserAddictionCell = ({usersAddiction, uid, schedule, service}) => {
  const classes = useStyles();
  const history = useHistory();
  if(!(uid && schedule && service)) return null;

  // const addiction = comMod.findDeepPath(schedule, `${service}.${`UID${uid}`}.addiction`, {});
  const addiction = {...schedule?.[service]?.[`UID${uid}`]?.addiction} || {};
  const inconsistency = Object.keys(addiction).map(key => {
    const value = addiction[key];
    if(ADDICTION_IGNORE_LIST.some(x => x===key)) return false;
    return !(usersAddiction[key] && usersAddiction[key]===value) ?true :false;
  });
  
  if (addiction.多子軽減措置 && service === HOUDAY) {
    delete addiction.多子軽減措置;
  }
  if (Number(addiction?.個別サポート加算１) === 2) addiction.個別サポート加算１ = '一定';
  if (Number(addiction?.個別サポート加算１) === 3) addiction.個別サポート加算１ = '重度';
  const nodes = Object.keys(addiction).map((key, i) => {
    if(ADDICTION_IGNORE_LIST.some(x => x===key)) return null;
    return(
      <div className={`eachItem`} key={i}>
        <div className='name'>
          <FiberManualRecordIcon  style={{color: inconsistency[i] ?red[600] :teal[600]}}/>
          {comMod.shortWord(key)}
        </div>
        <div className='val'>
          {parseInt(comMod.shortWord(addiction[key])) !== 1 &&<ArrowForwardIosIcon />}
          {parseInt(comMod.shortWord(addiction[key])) === 1 ?
          '': comMod.shortWord(addiction[key])}
        </div>
      </div>
    );
  });

  const handleClick = () => {
    const scrollVal = document.documentElement.scrollTop;
    sessionStorage.setItem("byUserAddictionNoDialogUid", String(uid));
    sessionStorage.setItem("byUserAddictionNoDialogScrollVal", String(scrollVal));
    sessionStorage.setItem("byUserAddictionNoDialogIdName", "userscroll322");
    history.push(`/schedule/userAddiction/`);
  }

  return(
    <div className={classes.byUserAddictionCell} onClick={handleClick}>
      {nodes}
      <div className='icon'><CreateIcon className="size"/></div>
    </div>
  )
}

const UserListTitle =(props)=> {
  const {classroomCnt, brosCnt, uprms, dispContractEnd} = props;
  // 教室未設定の場合は項目表示しない
  const Std = () => {
    return(
      <div className = "flxTitle oddColor" >
        <div className="wmin lower"><div>No</div></div>
        <div className="w08 lower"><div>年齢<br />学齢</div></div>
        <div className="w20 lower">
          <div>種別/サービス<br />受給者証番号</div>
        </div>
        {!dispContractEnd &&
          <div className="wzen4 lower"><div>契約<br/>支給量</div></div>
        }
        {dispContractEnd &&
          <div className="wzen4 lower"><div>受給者<br/>証期限</div></div>
        }

        {/* <div className="wzen4 lower"><div>受給者<br/>証期限</div></div> */}
        {classroomCnt > 0 &&
         <div className="w07 lower"><div>単位</div></div>
        }
        <div className="w10 lower"><div>上限額</div></div>
        <div className="wmin lower"><div>管</div></div>
        <div className="w20 lower"><div>氏名</div></div>
        {brosCnt > 0 &&
         <div className="w07 lower"><div>兄弟</div></div>
        }
        {(uprms !== 'kanri' && uprms !== 'bros' && uprms !== 'addiction') &&
          <div className="w20 lower"><div>保護者</div></div>
        } 
        {(uprms === 'kanri' || uprms === 'bros' || uprms === 'addiction') &&
          <div className="w20 lower"><div>保護者・TEL</div></div>
        }
        {(uprms !== 'kanri' && uprms !== 'bros' && uprms !== 'addiction') &&
          <div className="w30 lower"><div>連絡先</div></div>
        }
        {(uprms === 'kanri' || uprms === 'bros') &&
          <div className="w30 lower"><div>管理・協力事業所</div></div>
        }
        {uprms === 'addiction' &&
          <div className="w30 lower"><div>加算</div></div>
        }
      </div >
    )
  }
  const Belongs = () => {
    return (
      <div className = "flxTitle oddColor" >
        <div className="wmin lower"><div>No</div></div>
        <div className="w07 lower"><div>年齢<br />学齢</div></div>
        {/* <div className="w20 lower">
          <div>種別/サービス<br />受給者証番号</div>
        </div> */}
        <div className="w20 lower"><div>種別/サービス<br/>受給者証番号</div></div>
        <div className="w20 lower"><div>氏名</div></div>
        <div className="w20 lower"><div>市区町村</div></div>
        <div className="w20 lower"><div>住所</div></div>
        <div className="w25 lower"><div>所属１</div></div>
        <div className="w25 lower"><div>所属２</div></div>
      </div >
    )
  }
  const BankInfo = () => {
    return (<>
      <GetBankInfo/>
      <div className = "flxTitle oddColor" >
        <div className="wmin lower"><div>No</div></div>
        <div className="w15 lower"><div>保護者<br></br>児童名</div></div>
        <div className="w10 lower"><div>金融機関</div></div>
        <div className="w10 lower"><div>支店</div></div>
        <div className="w05 lower"><div>種別</div></div>
        <div className="w15 lower"><div>口座番号</div></div>
        <div className="w15 lower"><div>口座名義</div></div>
        <div className="w15 lower"><div>顧客コード</div></div>
      </div >
    </>)
  }
  if (uprms === 'belongs')        return <Belongs/>
  else if (uprms === 'bankinfo')  return <BankInfo/>
  else return <Std/>
}

export const usersMenu = [
  { link: "/users", label: "基本", printTitle: '利用者一覧', print: true },
  { link: "/users/addiction", label: "利用者別加算", print: true },
  { link: "/users/belongs/", label: "所属", printTitle: '利用者一覧所属',print: true },
  { link: "/users/bankinfo", label: "口座情報", print: true },
  { link: "/users/bros", label: "兄弟表示", print: true },
  { link: "/users/kanri", label: "管理・協力表示", print: true },
  { link: "/users/timetable/", label: "計画支援時間" },
]
export const usersExtMenu = [
  { link: "/users/transfer", label: "他事業所への利用者コピー" },
  { link: "/users/regmonth", label: "利用者登録月変更" },
]

if (seagull) {
  // 兄弟表示と口座情報の項目を探して削除する
  let ndx = usersMenu.findIndex(item => item.link === "/users/bros");
  if (ndx !== -1) {
    usersMenu.splice(ndx, 1);
  }
  ndx = usersMenu.findIndex(item => item.link === "/users/bankinfo");
  if (ndx !== -1) {
    usersMenu.splice(ndx, 1);
  }
  ndx = usersMenu.findIndex(item => item.link === "/users/kanri");
  if (ndx !== -1) {
    usersMenu.splice(ndx, 1);
  }
  ndx = usersMenu.findIndex(item => item.link === "/users/addiction");
  if (ndx !== -1) {
    usersMenu.splice(ndx, 1);
  }
  
}

// 表示を行わないコンポーネント。ローディングが終わったらuserとcomの次月以降の
// データを取得しdispatchする
export const GetNextHist = () => {
  const dispatch = useDispatch();
  const allState = useSelector(state => state);
  const loadingStatus = comMod.getLodingStatus(allState);
  const { hid, bid, stdDate, nextUsers, nextCom } = allState;
  const DELAY_MS = 500; // 遅延時間（ミリ秒）

  useEffect(() => {
    let timer = null;
    if (!loadingStatus.loaded || loadingStatus.error) return;

    const dispatchItems = (r) => {
      if (!r.result) return;
      const rtnNextCom = r.fetchNextComInfo.data.dt.length
        ? r.fetchNextComInfo.data.dt[0].next
        : '';
      const rtnNextUsers = r.fetchNextUserInfo.data.dt.length
        ? r.fetchNextUserInfo.data.dt
        : [];
      dispatch(Actions.setStore({ nextUsers: rtnNextUsers, nextCom: rtnNextCom }));
    };

    if (loadingStatus.loaded && !loadingStatus.error && (!nextUsers && nextCom === undefined)) {
      timer = setTimeout(() => {
        albCM.getNextHist({ hid, bid, date: stdDate })
          .then(res => {
            dispatchItems(res);
          });
      }, DELAY_MS);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [loadingStatus]);

  return null;
}
const getContractEndArray = (user, ) => {
  const multiSvc = (
    user?.etc?.multiSvc && Object.keys(user?.etc?.multiSvc).length > 1
    && user?.service?.includes(',')
  ) 
  ? user?.etc?.multiSvc : {};
  
  const cEndAry = Object.keys(multiSvc).map(svc => (multiSvc[svc].contractEnd));
  const uniqCEndAry = [...new Set(cEndAry)];
  
  // 複数サービスの場合は最も早い終了日を設定
  const contractEnd = uniqCEndAry.length > 0 && uniqCEndAry.sort()[0] 
    ? uniqCEndAry.sort()[0] : user.contractEnd;
  
  return { contractEnd, uniqCEndAry };
};

// 2022/08/31 変更開始
// 修正をダイアログにしない。
const UserlistElms = (props)=>{
  const classes = useStyles();
  const dispatch = useDispatch();
  let listElms;
  // const service = useSelector(state => state.service);
  const classroom = useSelector(state =>state.classroom);
  const allstate = useSelector(state => state);
  const bankNames = allstate.com?.ext?.bankNames || {};
  const {controleMode, schedule, service, stdDate} = allstate;
  const permission = comMod.parsePermission(allstate.account)[0][0];
  const loadingStatus = comMod.getLodingStatus(allstate);
  const {uprms, editOn, setUserAttr, userAttr, dispContractEnd,
    brosOrderMode, handleBrosOrderCellClick, brosOrderPendingChanges, brosOrderFamilyKey} = props;
  const hist = useHistory();
  const location = useLocation().pathname;
  const prms = useParams().p;
  const soudanServiceNames = [KEIKAKU_SOUDAN, SYOUGAI_SOUDAN];

  const useJdateBirthddayDisp = comMod.getUisCookie(comMod.uisCookiePos.useJdateBirthddayDisp) !== '0';
  // const [snack, setSnack] = useState({msg:'', severity: ''})
  
  if (!loadingStatus.loaded) return null;

  const dispClassroom = (e) => {
    const v = e.classroom;
    if (Array.isArray(v) && v.length > 1) return '複数';
    else if (v.indexOf(',') > 0)  return '複数';
    else if (Array.isArray(v) && v.length === 1) return v[0];
    else return v;
  }
  const kdChk = (prms && prms.includes('bros'))? true: false;
  const clickHandler = (e)=>{
    // 修正モードでないときは何もしない
    if (!editOn) return false;
    // 吉村追加 指定urlでは処理を行わない
    if (['addiction', 'kanri', 'bros'].filter(f=>location.includes(f)).length){
      return false;
    }
    const uid = e.currentTarget.getAttribute('uid');
    const root = location.replace(prms, ''); // urlからもともと与えられているprmsを削除
    const defPrms = prms? prms: '';
    // スクロール位置をdispatchして保存
    // const elm = document.querySelector('#userscroll322');
    const v = document.scrollingElement.scrollTop;
    const t = controleMode;
    t.userPaeScroll = v;
    dispatch(Actions.setStore({controleMode: t}));
    let newLoc = root.replace(/\/$/, '') + '/edit' + defPrms + uid;
    newLoc += `?goback=${location.replace(/\/$/, '')}`;
    console.log(newLoc, 'newLoc');
    hist.push(newLoc);
  }
  const editonRowClass = (props.editOn) ? 'editOn ' : ' '
  const swaponRowClass = (props.swapOn)? 'swapOn ': ' '
  const OneUser = (props) => {
    const {e, i, classroomCnt, brosCnt, addiction, uid, dispContractEnd} = props;
    const t = comMod.findDeepPath(e, 'etc.bank_info');
    const binfo = t ? t: {};
    const kariNoClass = (e.hno.length < 10) ? 'kariHno' : '';
    // 最近使ったユーザーかどうか判定してスタイルを取得
    const ruSt = albCM.recentUserStyle(e.uid);
    // 兄弟組不能だった場合のスタイルとクラス名
    const brosErrStyle = kdChk && e.brosError? {color: red[900]}: {};
    const brosErr = e.brosError? ' brosErr': '';
    const serviceSw = (s) => {
      let r = '';
      s.split(',').forEach(e=>{
        r += comMod.shortWord(e) + '+';
      });
      return r.replace(/\+$/, '');
    }
    const numberFontSize = (i >= 99)? {fontSize: '.7rem'}: {};
    const numberStyle = {...ruSt, ...numberFontSize};
    // 行の中の共通項目
    const Common = () => {
      return (<>
          <div className='wmin center' style={numberStyle}>{i + 1}</div>
          <div className='w08'>
            {e.ageStr}<br></br>
            {!useJdateBirthddayDisp &&
              <span style={{fontSize: '.7rem'}}>
                {e.birthday ? e.birthday.slice(2) : ''}
              </span>
            }
            {useJdateBirthddayDisp &&
              <span style={{fontSize: '.7rem'}}>
                {e.birthday ? convJdate(e.birthday) : ''}
              </span>
            }
          </div>
          <div className='w20'>
            {!soudanServiceNames.includes(e.service) &&
              <div>
                {comMod.shortWord(e.type) + ' / ' + serviceSw(e.service)}
              </div>
            }
            {soudanServiceNames.includes(e.service) &&
              <div>
                {serviceSw(e.service)}
              </div>
            }

            <div className={'small ' + kariNoClass}>{e.hno}</div>
          </div>
      </>)
    }
    const BankInfo = () => {
      const bankName = bankNames?.[binfo.金融機関番号]?.name;
      binfo.bankName = bankName;
      const branchName = bankNames?.[binfo.金融機関番号]?.[binfo.店舗番号]?.name;
      binfo.branchName = branchName;
      const ruSt = albCM.recentUserStyle(e.uid);
      const numberStyle = {...ruSt, ...numberFontSize};

      return (<>
        <div 
          key={e.uid} uid={e.uid} id={'user-row-' + e.uid}
          className={'userRow flxRow oddColor ' + editonRowClass + swaponRowClass}
          onClick={e=>clickHandler(e)}
        >
          <div className='wmin center' style={numberStyle}>{i + 1}</div>
          <div className='w15'>
            <div>{e.pname}</div>
            <div className='small'><DispNameWithAttr {...e} /></div>
          </div>
          <div className='w10'>
            {binfo.bankName && <>
              <div>{binfo.bankName}</div>
              <div className='small'>{binfo.金融機関番号}</div>
            </>}
            {binfo.bankName === null && <>{binfo.金融機関番号}</>}
          </div>
          <div className='w10'>
            {binfo.branchName && <>
              <div>{binfo.branchName}</div>
              <div className='small'>{binfo.店舗番号}</div>
            </>}
            {binfo.branchName === null && <>{binfo.店舗番号}</>}

          </div>
          <div className='w05'>{binfo.預金種目}</div>
          <div className='w15'>{binfo.口座番号}</div>
          <div className='w15'>{binfo.口座名義人}</div>
          <div className='w15'>{binfo.顧客コード}</div>
        </div>
      </>)
    }
    const Belongs = () => {
      return (
        <div
          key={e.uid} uid={e.uid} id={'user-row-' + e.uid}
          className={'userRow flxRow oddColor ' + editonRowClass + swaponRowClass + classes.belongsRowClass}
        >
          <Common/>
          <div className='w20'>
            <div >{e.name}</div>
            <div className='small'>{e.kana}</div>
          </div>
          <div className='w20'>
            <div>{e.scity}</div>
            <div className='small'>{e.scity_no}</div>
          </div>
          <div className='w20 cityAddress' onClick={() => hist.push(`/users/belongs/edit/${e.uid}/`)}>
            {/* 住所関係 */}
            <div className='small'>{e.postal ?`〒${e.postal}` :""}</div>
            <div style={{fontSize: 14}}>{e.city ?? ""}{e.address ?? ""}</div>
            <div className='homeIcon'><HomeIcon className='icon' /></div>
          </div>
          <div className='w25'>
            <div>{e.belongs1}</div>
          </div>
          <div className='w25'>
            <div>{e.belongs2}</div>
          </div>
        </div>

      )
    }
    // 長すぎると表示が乱れるので
    const mailText = e.pmail.length > 25? e.pmail.slice(0,25) + '..': e.pmail;
    const contractEnd = (() => {
      const { contractEnd, uniqCEndAry } = getContractEndArray(e, );
      const eMonths = elapsedMonths(stdDate, e.contractEnd);
      const style = { fontSize: '.8rem' };
      if (!eMonths || eMonths <= 2) style.color = red[800];
      if (eMonths > 6) style.color = blue[800];
      if (contractEnd === '0000-00-00') return '';
      if (uniqCEndAry.length > 1) {
        return (<>
          <span style={style}>{uniqCEndAry[0].slice(2)}</span> <br></br>
          <span style={style}>{uniqCEndAry[1].slice(2)}</span> 
        </>);
      }
      return (<span style={style}>{(contractEnd ?? '').slice(2)}</span>);
    })();
    

    const Std = () =>{
      // 兄弟表示のときは電話番号を表示する
      const pinfo = uprms === 'bros'? e.pphone: e.pkana;
      // 複数サービス利用者の利用数
      const svcCnt = e.service.split(',').length;
      // 複数サービス用支給量表示
      const mltSvcVolStr = () => {
        const multiSvc = e?.etc?.multiSvc ?? {};
        // 出力順で保訪を常に後にする
        const keys = Object.keys(multiSvc).sort((a, b) => (
          a === HOHOU? 1: -1
        ))
        const vols = keys.map(e=>(
          multiSvc[e].volume === "0"? "原則": multiSvc[e].volume
        ));
        return vols.join("/")
      }
      let volStr = '';
      if (svcCnt > 1){
        volStr = mltSvcVolStr();
      }
      else{
        volStr = e.volumeStd? '原則': e.volume;
      }
      return (
        <div 
          key={e.uid} uid={e.uid} id={'user-row-' + e.uid}
          className={'userRow flxRow oddColor ' + editonRowClass + swaponRowClass}
          onClick={e=>clickHandler(e)}
        >
          <Common/>
          <div className='wzen4 right'>
            {dispContractEnd? contractEnd: volStr}
          </div>
          {classroomCnt > 0 &&
            <div className='w07'>{dispClassroom(e)}</div>
          }
          <div className='w10 right'>
            {comMod.formatNum(e.priceLimit, 1)}
            {e?.etc?.dokujiJougen && parseInt(e?.etc?.dokujiJougen) &&
              <div className={classes.dokujiJougen}>
                <span className='small'>独自</span>{comMod.formatNum(e.etc.dokujiJougen, 1)}
              </div>
            }
            {e?.etc?.dokujiJougenZero &&
              <div className={classes.dokujiJougen}>
                <span className='small'>独自 0</span>
              </div>
            }
          </div>
          <div className="wmin">{e.kanri_type.substr(0, 1)}</div>
          {/* <div className='w20'>
            <div >
              <DispNameWithAttr {...e} userAttr={userAttr} setUserAttr={setUserAttr}/>
            </div>
            <div className='small'>{e.kana}</div>
          </div> */}
          <UserNameDispWithEdit 
            user={e} uprms={uprms} userAttr={userAttr} setUserAttr={setUserAttr} 
          />
          {brosCnt > 0 && (() => {
            const brosIsAssigned = brosOrderPendingChanges?.[e.uid] !== undefined;
            const brosPendingOrder = brosOrderPendingChanges?.[e.uid];
            const brosInSameFamily = !brosOrderFamilyKey ||
              (e.pname + e.pphone === brosOrderFamilyKey);
            const brosIsClickable = brosOrderMode && !brosIsAssigned && brosInSameFamily;
            const brosOrderCellClass = brosOrderMode
              ? (brosIsAssigned
                ? classes.brosOrderCellAssigned
                : (brosIsClickable ? classes.brosOrderCellAnimated : classes.brosOrderCellWaiting))
              : '';
            return (
              <div
                className={`w07 right${brosErr} ${brosOrderCellClass}`}
                style={{
                  ...brosErrStyle,
                  ...(brosIsClickable ? { cursor: 'pointer' } : {}),
                }}
                onClick={brosIsClickable ? () => handleBrosOrderCellClick(e) : undefined}
              >
                <span style={brosOrderMode && !brosIsAssigned && !brosIsClickable ? { color: grey[400] } : {}}>
                  {brosIsAssigned ? brosPendingOrder : e.brosIndex}
                </span>
              </div>
            );
          })()}
          <div className='w20'>
            <div style={brosErrStyle}>{e.pname}</div>
            <div className='small' style={brosErrStyle}>{pinfo}</div>
          </div>
          <div className='w30'>
            {(uprms !== 'kanri' && uprms !== 'bros' && uprms !== 'addiction') && <>
              <div style={brosErrStyle}>{e.pphone}</div>
              <div className='small'>{e.pphone1}</div>
              <div className='small'>
                <a href={'mailto:'+e.pmail}>{mailText}</a>
              </div>
            </>}
            {(uprms === 'kanri' || uprms === 'bros') && 
              <OtherOfficies type={e.kanri_type} uetc={e.etc} uid={uid} schedule={schedule}/>
            }
            {uprms === 'addiction' &&
              <ByUserAddictionCell
                usersAddiction={addiction} uid={uid} schedule={schedule} service={service}
              />
            }
          </div>
        </div>
      )

    }
    if (uprms === 'belongs'){
      return <Belongs />
    }
    else if (uprms === 'bankinfo'){
      return <BankInfo />
    }
    else {
      return <Std/>
    }
    
  }
  // deepコピーにしないとだめらしい
  const tUsers = JSON.parse(JSON.stringify(props.users));
  // 両親の名前と電話番号をつなげた文字列の配列
  const parerents = tUsers.map(e=>e.pname+e.pphone);
  tUsers.forEach(e=>{
    // 兄弟の場合の保護者名と電話番号結合の出現回数をチェック
    if (parseInt(e.brosIndex)){
      const l = parerents.filter(f=>f === e.pname+e.pphone).length;
      if (l < 2) e.brosError = true;
      // 兄弟だけの配列
      const b = tUsers.filter(f=>e.pphone === f.pphone && e.pname === f.pname);
      if (!b.find(f=>parseInt(f.brosIndex) === 1)) e.brosError = true; // 長兄不在
      // brosIndexが被っていないかチェック
      if (new Set(b.map(f=>f.brosIndex)).size !== b.length) e.brosError = true;
    }
  });
  if (tUsers.find(e=>e.brosError)){
    props.setBrosErrExist(true);
    // setSnack({msg: '兄弟設定を見直す必要があります', severity: 'warning'})
  }  
  if (loadingStatus.loaded && !loadingStatus.error) {
    const users = tUsers.filter(e => {
      if (albCM.isService(e, service) && albCM.isClassroom(e, classroom)){
        return (e);
      }
    });
    listElms = users.map((e, i) => {
      if (e.delete)  return null;
      // 仮保険番号であることを示すクラス設定
      const kariNoClass = (e.hno.length < 10) ? 'kariHno' : '';
      const addiction = comMod.findDeepPath(e, 'etc.addiction', {});
      return (
        <OneUser 
          e={e} i={i} key={i} addiction={addiction} uid={e.uid}
          classroomCnt={props.classroomCnt} brosCnt={props.brosCnt} 
          dispContractEnd={dispContractEnd}
        />
      );
    });
  }
  else if (loadingStatus.error) {
    listElms = (
      <LoadErr loadStatus={loadingStatus} errorId={'E4931'} />
    )
  }
  else{
    listElms = (<LoadingSpinner />);
  }
  if (listElms.length){
    return (
      <>
        <div className='tabelBodyWrapper' >
          {listElms}
          {/* <SnackMsg {...snack} /> */}
        </div>
        {uprms === 'bros' && <BrosCandidates />}
      </>
    );
  }
  else {
    const style = {textAlign: 'center', padding: 16}
    return (
      <>
        <div className='tabelBodyWrapper' >
          <div style={style}>
            表示するユーザーが見つかりません。
          </div>
        </div>
        {uprms === 'bros' && <BrosCandidates />}
      </>
    );
  }
}

const ExplanationTexts = ({location, users, schedule, service}) => {
  const classes = useStyles();
  const history = useHistory();
  let resultNodes = null;
  if(location==="/users/addiction"){
    const existence = users.some(uDt => {
      const addiction = comMod.findDeepPath(schedule, `${service}.${`UID${uDt.uid}`}.addiction`, {});
      const userAddiction = comMod.findDeepPath(uDt, 'etc.addiction', {});
      return Object.keys(addiction).some(key => {
        const value = addiction[key];
        if(key === "利用者負担上限額管理加算" || key === "上限管理結果") return false;
        return addiction[key] && (userAddiction[key] && userAddiction[key]===value) ?true :false;
      });
    });
    const inconsistency = users.some(uDt => {
      const addiction = comMod.findDeepPath(schedule, `${service}.${`UID${uDt.uid}`}.addiction`, {});
      const userAddiction = comMod.findDeepPath(uDt, 'etc.addiction', {});
      return Object.keys(addiction).some(key => {
        const value = addiction[key];
        if(key === "利用者負担上限額管理加算" || key === "上限管理結果") return false;
        return !(userAddiction[key] && userAddiction[key]===value) ?true :false;
      })
    });
    resultNodes = (
      <>
      {inconsistency &&<div className="inconsistency">
        <FiberManualRecordIcon className='icon'/>今月のみに適用されている可能性があります。
      </div>}
      {existence &&<div className="existence">
        <FiberManualRecordIcon className='icon'/>通常通り設定されています。
      </div>}
      </>
    )
  }else if(location === "/users/kanri" || location === "/users/bros"){
    const inconsistency = users.some(uDt => {
      const uidStr = "UID" + uDt.uid;
      return schedule[uidStr] && (schedule[uidStr]["協力事業所"] || schedule[uidStr]["管理事業所"])
        ?true :false;
    });
    resultNodes = (
      <>
        {
          inconsistency &&
          <div className='inconsistency'>
            <LockIcon className='icon'　style={{marginInlineEnd: 8}} />
            既に上限管理データが存在するため編集できません。
            <Button
              onClick={()=>{history.push('/proseed/upperlimit')}}
              color='primary'
            >
              変更する場合はこちらから
            </Button>
          </div>
        }
      </>
    )
  }

  return(<div className={classes.explanationTexts}>{resultNodes}</div>);
}

// 作り直しトライ
// usersとusersMainに分ける
const UsersMain = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  // 編集ボタンの状態を保持するため
  const cntMode = useSelector(state=>state.controleMode);
  const prms = useParams().p;
  const hist = useHistory();
  const location = useLocation().pathname;
  const allState = useSelector(state=>state.allState);

  // 最近操作したユーザーへの自動スクロール
  useAutoScrollToRecentUser('user-row-');

  // 編集用ダイアログの制御
  const [userSortOpen, setUserSortOpen] = useState(false);
  const [userSortRes, setUserSortRes] = useState({});
  const [uids, setuids] = useState('');
  const [editOn, seteditOn] = useState(()=>{
    if (!cntMode.usersFabEdit){
      return false;
    }
    else return true;
  });
  const [snack, setSnack] = useState({msg:'', severity: ''});
  const [brosErrExist, setBrosErrExist] = useState(false); // 兄弟組不能があるかどうかを格納
  const [userAttr, setUserAttr] = useState([]); // 医療的ケア、重身、当月で終了などの属性表示チェック用
  const [dispContractEnd, setDispContractEnd] = useState(
    comMod.getUisCookie(comMod.uisCookiePos.usersDispContractEnd) !== '0'
  );
  const [useJdateBirthddayDisp, setUseJdateBirthddayDisp] = useState(
    comMod.getUisCookie(comMod.uisCookiePos.useJdateBirthddayDisp) !== '0'
  );
  // 管理・協力表示用メニューの状態
  const [kanriKyouryokuMenuAnchorEl, setKanriKyouryokuMenuAnchorEl] = useState(null);
  // 兄弟追加メニューの状態
  const [brosMenuAnchorEl, setBrosMenuAnchorEl] = useState(null);
  // 兄弟順番設定の状態
  const [brosOrderMode, setBrosOrderMode] = useState(false);
  const [brosOrderCurrentOrder, setBrosOrderCurrentOrder] = useState(1);
  const [brosOrderPendingChanges, setBrosOrderPendingChanges] = useState({});
  const [brosOrderFamilySize, setBrosOrderFamilySize] = useState(0);
  const [brosOrderFamilyKey, setBrosOrderFamilyKey] = useState('');
  const [brosOrderInstruction, setBrosOrderInstruction] = useState('');
  // const [swapOn, setswapOn] = useState(false);
  const users = useSelector(state => state.users);
  const schedule = useSelector(state => state.schedule);
  const service = useSelector(state => state.service);
  const stdDate = useSelector(state=>state.stdDate);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const controleMode = useSelector(state=>state.controleMode);
  const uprms = useParams().p; // url パラメータ取得
  let fusers;
  if (uprms === 'bros'){
    fusers = users.filter(e=>parseInt(e.brosIndex));
    fusers.sort((a, b)=>(a.pname + a.brosIndex < b.pname + b.brosIndex? -1 : 1));
  }
  else if (uprms === 'kanri'){
    fusers = users.filter(e=>e.kanri_type);
  fusers.sort((a, b)=>(Number(a.sindex || 0) - Number(b.sindex || 0)));
  }
  else{
    fusers = JSON.parse(JSON.stringify(users));
  }
  // 設定済み教室のカウント 0ならば一覧に教室を表示しない
  const classroomCnt = users.filter(e=>e.classroom).length;
  // 設定済みの兄弟のカウント 0ならば一覧に表示しない
  const brosCnt = users.filter(e=>parseInt(e.brosIndex) > 0).length;

  // 兄弟順番設定: 確定後に API 送信 + store 更新
  const finishBrosOrder = async (finalChanges) => {
    const updatedUsers = users.map(u => {
      if (finalChanges[u.uid] !== undefined) {
        return { ...u, brosIndex: finalChanges[u.uid] };
      }
      return u;
    });
    dispatch(Actions.setStore({ users: updatedUsers }));
    for (const uid of Object.keys(finalChanges)) {
      const user = users.find(u => u.uid === uid);
      if (!user) continue;
      const sendData = {
        ...user,
        brosIndex: finalChanges[uid],
        date: stdDate,
        hid, bid,
        etc: JSON.stringify(user.etc || {}),
      };
      delete sendData.users;
      await dispatch(Actions.updateUser({ ...escapeSqlQuotes(sendData), a: 'sendUserWithEtc' }));
    }
    dispatch(Actions.sortUsersAsync());
    setBrosOrderMode(false);
    setBrosOrderCurrentOrder(1);
    setBrosOrderPendingChanges({});
    setBrosOrderFamilySize(0);
    setBrosOrderFamilyKey('');
    setBrosOrderInstruction('');
  };

  // 兄弟順番設定: セルクリック時の処理
  const handleBrosOrderCellClick = (user) => {
    if (!brosOrderMode) return;
    if (brosOrderPendingChanges[user.uid] !== undefined) return;

    let familySize = brosOrderFamilySize;
    if (brosOrderCurrentOrder === 1) {
      // 1番目クリック時にファミリーグループを特定
      const familyKey = user.pname + user.pphone;
      const familyMembers = users.filter(
        u => u.pname === user.pname && u.pphone === user.pphone
      );
      familySize = familyMembers.length;
      setBrosOrderFamilySize(familySize);
      setBrosOrderFamilyKey(familyKey);
    } else {
      // 2番目以降: 同じファミリー以外は無視
      if (user.pname + user.pphone !== brosOrderFamilyKey) return;
    }

    const newPendingChanges = {
      ...brosOrderPendingChanges,
      [user.uid]: String(brosOrderCurrentOrder),
    };
    setBrosOrderPendingChanges(newPendingChanges);

    if (Object.keys(newPendingChanges).length >= familySize) {
      finishBrosOrder(newPendingChanges);
    } else {
      const nextOrder = brosOrderCurrentOrder + 1;
      setBrosOrderCurrentOrder(nextOrder);
      setBrosOrderInstruction(`${nextOrder}番目をクリックしてください`);
    }
  };

  const fabClickHandler = (e, name)=>{
    // const name = e.currentTarget.name;
    // nameはkeylistenerより与えられる
    if (!name) name = e? e.currentTarget.name: '';
    if (name === 'edit' && editOn){
      seteditOn(false);
      dispatch(Actions.setStore({controleMode:{usersFabEdit: false}}))
    };
    if (name === 'edit' && !editOn) {
      seteditOn(true);
      setUserSortOpen(false);
      dispatch(Actions.setStore({controleMode:{usersFabEdit: true}}))
    };
    // quitはkeylistenerにより発動
    if (name === 'quit'){
      seteditOn(false);
      dispatch(Actions.setStore({controleMode:{usersFabEdit: false}}))

    }
    // if (name === 'swap' && swapOn) {
    //   setUserSortOpen(false);
    // };
    if (name === 'swap') {
      setUserSortOpen(true);
      seteditOn(false);
    };
    if (name === 'add') {
      // setopen(true); 
      // seteditOn(false);
      // setuids('');
      const root = location.replace(prms, ''); // urlからもともと与えられているprmsを削除
      // ここでdefprmsを使っているのが意味不
      const defPrms = prms? prms: '';
      let newLoc = root.replace(/\/$/, '') + '/addnew';
      newLoc += `?goback=${root.replace(/\/$/, '') + defPrms}`;

      console.log(newLoc, 'newLoc');
      hist.push(newLoc);
    }
  }
  useEffect(() => {
    // console.log('res', userSortRes);
    if (Object.keys(userSortRes).length) {
      if (userSortRes.data.resulttrue && !userSortRes.data.resultfalse) {
        dispatch(Actions.setSnackMsg('利用者の順番を登録しました。', ''));
      }
      else {
        dispatch(Actions.setSnackMsg(
          '利用者の順番を登録できませんでした。', 'error'
        ));
      }
    }
  }, [userSortRes]);
  useEffect(()=>{
    // スクロール量を復元
    const prescroll = controleMode.userPaeScroll? controleMode.userPaeScroll: 0;
    if (prescroll){
      document.scrollingElement.scrollTop = prescroll;
    }
    // 直前に追加されたユーザーを検出しrecentuserにする
    const au = controleMode.appendUser;
    const nts = new Date().getTime();
    // ローディングが完了していない状態は何もしない
    if (!users && !users.length){
      return false;
    }
    // 直近に追加されたユーザーを検出できたとき
    if (au && au.ts && nts - au.ts < 1000){
      const t = users.find(e=>e.hno === au.hno);
      if (t) albCM.setRecentUser(t.uid);
    }
  },[]);
  // 兄弟・管理協力表示のときのメッセージ
  // useEffect(()=>{
  //   if (uprms === 'bros' || uprms === 'kanri'){
  //     setSnack({
  //       ...snack, 
  //       msg: 'この画面から管理事業所・協力事業所の編集は出来ません。',
  //       id: new Date().getTime(),
  //     })
  //   }
  // }, [uprms])
  const account = useSelector(state => state.account);
  const isDev = permissionCheckTemporary(PERMISSION_DEVELOPER, account);
  const useNew = isDev && comMod.getUisCookie(comMod.uisCookiePos.useUserEdit2026) === '1';
  if (prms && prms.includes('editbankinfo')){
    return <UserEditBankInfo />
  }
  if (prms && prms.includes('edit')){
    return useNew ? <UserEdit2026 /> : <UserEditNoDialog editOn={editOn} />;
  }
  if (prms && prms.includes('addnew')){
    return useNew ? <UserEdit2026 /> : <UserEditNoDialog editOn={false} />;
  }
  const kdChk = (prms && prms.includes('bros'))? true: false;
  // 管理表示と兄弟表示は追加禁止
  const hideAdd = uprms === 'bros' || uprms === 'kanri'? true: false
  const nonDisplayList = ["addiction", "kanri", "bros", "belongs"];
  const displayFabAddEdit = (() => {
    if(new RegExp(nonDisplayList.toString().replaceAll(",", "|")).test(location)) return false;
    return true
  })();
  // const inconsistency = 
  //   schedule[`UID${uid}`] && (schedule[`UID${uid}`]["協力事業所"] || schedule[`UID${uid}`]["管理事業所"])
  //     ?true :false;
  const explanationTextsProps = {location, users: fusers, schedule, service};
  return (<>
    <LinksTab menu={usersMenu} extMenu={usersExtMenu} />
    <div className='AppPage userLst fixed'>
      <DisplayInfoOnPrint />
      <UserListTitle
        classroomCnt={classroomCnt} brosCnt={brosCnt} dispContractEnd={dispContractEnd}
        uprms={uprms}
      />
    </div>
    <div className='AppPage userLst scroll' id='userscroll322'>
      <UserlistElms
        users={fusers} stdDate={stdDate}
        editOn={editOn}
        // open={open} setopen={setopen}
        uids={uids} setuids={setuids}
        uprms={uprms}
        setSnack={setSnack}
        classroomCnt={classroomCnt} brosCnt={brosCnt}
        // setSnack={setSnack}
        setBrosErrExist={setBrosErrExist}
        setUserAttr={setUserAttr} userAttr={userAttr}
        dispContractEnd={dispContractEnd}
        brosOrderMode={brosOrderMode}
        handleBrosOrderCellClick={handleBrosOrderCellClick}
        brosOrderPendingChanges={brosOrderPendingChanges}
        brosOrderFamilyKey={brosOrderFamilyKey}
      />
      {!location.includes('bankinfo') &&
        <div >
          <SetUisCookieChkBox 
            setValue={setDispContractEnd} p={comMod.uisCookiePos.usersDispContractEnd}
            label='受給者証期限を表示する'
            style={{margin: 0}}
          />
          <SetUisCookieChkBox
            setValue={setUseJdateBirthddayDisp} p={comMod.uisCookiePos.useJdateBirthddayDisp}
            label='誕生日を和暦で表示する'
            style={{margin: 0, marginTop: -8}}
          />
          <SetUisCookieChkBox
            p={comMod.uisCookiePos.useUserEdit2026}
            label='新しい利用者編集を使用（先行提供中）'
            style={{margin: 0, marginTop: -8}}
          />
        </div>
      }
      {brosErrExist === true && kdChk &&
        <div style={{padding:8, color: red[900]}}>
          兄弟順位や保護者名などが赤く表示されているときは兄弟設定に問題がある場合があります。
          設定の見直しをお勧めします。
        </div>
      }
      {/* {location==="/users/addiction" &&
        <div style={{padding:8}}>
          <div style={{color: red[600], display: 'flex', alignItems: 'center', padding: '4px 0'}}>
            <FiberManualRecordIcon style={{fontSize: '1rem'}}/>今月のみに適用されている可能性があります。
          </div>
          <div style={{color: teal[600], display: 'flex', alignItems: 'center', padding: '4px 0'}}>
            <FiberManualRecordIcon style={{fontSize: '1rem'}}/>通常通り設定されています。
          </div>
        </div>
      } */}
      <ExplanationTexts {...explanationTextsProps}/>
      {displayFabAddEdit &&<mui.FabAddEdit 
        clickHandler={fabClickHandler} 
        setUserSortOpen={setUserSortOpen}
        editOn={editOn} hideAdd={hideAdd}
        // swapOn={swapOn}
      />}
      <UserSortDialog
        open={userSortOpen} setopen={setUserSortOpen}
        res={userSortRes} setres={setUserSortRes}
        uids={uids} setuids={setuids}
      />
      <UserAttrInfo userAttr={userAttr} />
    </div>

    <GetNextHist />
    <SnackMsg {...snack} />
    {uprms === 'addiction' &&
      <SchInitilizer/>
    }
    {uprms === 'kanri' && (
      <>
        <KanriKyouryokuFab
          onClick={(e) => {
            setKanriKyouryokuMenuAnchorEl(e.currentTarget);
          }}
        />
        <KanriKyouryokuUserSelectMenu
          anchorEl={kanriKyouryokuMenuAnchorEl}
          open={Boolean(kanriKyouryokuMenuAnchorEl)}
          onClose={() => setKanriKyouryokuMenuAnchorEl(null)}
          onUserClick={(user) => {
            // TODO: 利用者クリック時の処理を実装
            console.log('User clicked:', user);
          }}
        />
      </>
    )}
    {uprms === 'bros' && (
      <>
        <div className={classes.brosActionButtonsRow}>
          <BrosOrderSetter
            brosOrderMode={brosOrderMode}
            onStart={() => {
              setBrosOrderMode(true);
              setBrosOrderInstruction('兄弟設定を行いたい利用者の1番目の児童を選んでください');
            }}
            onCancel={() => {
              setBrosOrderMode(false);
              setBrosOrderCurrentOrder(1);
              setBrosOrderPendingChanges({});
              setBrosOrderFamilySize(0);
              setBrosOrderFamilyKey('');
              setBrosOrderInstruction('');
            }}
            instruction={brosOrderInstruction}
            inline={true}
          />
          <KanriKyouryokuFab
            onClick={(e) => {
              setBrosMenuAnchorEl(e.currentTarget);
            }}
            ariaLabel='兄弟追加操作'
            label='兄弟追加'
            inline={true}
          />
        </div>
        <BrosAddMenu
          anchorEl={brosMenuAnchorEl}
          open={Boolean(brosMenuAnchorEl)}
          onClose={() => setBrosMenuAnchorEl(null)}
        />
      </>
    )}
    {/* <UserBankInfoRepair/> */}
    {/* <CallDispHintUsers/> */}
    <UserBankInfoWarning uprms={uprms} />
  </>)
}

// 作り直しトライ
// usersとusersMainに分ける
const Users = () => {
  const allstate = useSelector(state=>state);
  const ls = comMod.getLodingStatus(allstate);
  const com = useSelector(state=>state.com);
  if (ls.loaded && !ls.error){
    return (<UsersMain/>);
  }
  else if (!ls.loaded){
    return (<LoadingSpinner/>)
  }
  else {
    return (<LoadErr loadStatus={ls} errorId={'E49592'} />)
  }
}

export default Users;
