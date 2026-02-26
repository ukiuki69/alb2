import React from 'react';
import * as Actions from '../../Actions';
import { useSelector, useDispatch } from 'react-redux';
import * as comMod from '../../commonModule';
import * as mui from '../common/materialUi';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import DriveEtaIcon from '@material-ui/icons/DriveEta';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import NotInterestedIcon from '@material-ui/icons/NotInterested';
import { makeStyles } from '@material-ui/core/styles';
import CheckIcon from '@material-ui/icons/Check';
import { grey, orange,blue,red, teal, yellow } from '@material-ui/core/colors';
import { HOHOU } from '../../modules/contants';
import {useStylesFade, cellHighlightLifeTime} from './SchTableBody2';
import { ViewDayRounded } from '@material-ui/icons';
import { getLocalStorageItemWithTimeStamp } from '../../modules/localStrageOprations';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import { checkValueType } from '../dailyReport/DailyReportCommon';
import CloseIcon from '@material-ui/icons/Close';
import { colors } from '@material-ui/core';
import PauseIcon from '@material-ui/icons/Pause';
import { kessekiSvc } from '../Billing/blMakeData2024';
import { kessekiSvc as kessekiSvc2021 } from '../Billing/blMakeData2021';
import { LC2024 } from '../../modules/contants';
import Tooltip from '@material-ui/core/Tooltip';
import Button from '@material-ui/core/Button';


const useStyles = makeStyles({
  absencedRoot:{
    '& .inner' :{
      opacity: .6,
    },
    '& .dateCellAbsenceIcon' : {
      position: 'absolute',
      color: red[900],
      opacity: 1,
      width: '32px',
      height: '32px',
      left: 'calc(50% - 16px)',
      top: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
      '& .MuiSvgIcon-root' : {
        fontSize: '2rem',
      },
      '&.reserve' : {
        top: 'auto',
        left: 'auto',
        bottom: 2,
        right: 2,
        width: '24px',
        height: '24px',
        '& .MuiSvgIcon-root' : {
          fontSize: '2.4rem',
        }
      }
    },
    '& .virticalAbsenceIcon' : {top: 4, left: 74,},
    '& .kessekiKasan': {color: blue[900]}
  },
  normalRoot:{
    '& .dateCellAbsenceIcon': {
      display: 'none',
    }
  },
  schoolOffRoot: {
    '& .icon':{color: '#e77052'},
    '& .dateCellAbsenceIcon': {
      display: 'none',
    },
  },
  notServiceRoot: {
    opacity: .4,
    '& .dateCellAbsenceIcon': {
      display: 'none',
    }
  },
  useCheck :{
    position:'absolute',
    top: 0,
    right: 0,
    color: teal[400],
    '& .MuiSvgIcon-root': {
      fontSize: '1.5rem',
    }
  },
  // グリッド表示時の共有。index.cssの定義を削除してこちらで再定義
  sqCommon: {
    textAlign: 'left',
    position: 'relative',
    '& .hohouSvcName': {display: 'flex', height: 30},
    '& .inner': {
      display:'flex',
      '& .icon': {
        width:'25%',
        '& svg':{fontSize: '1.1rem',},
      },
      '& .icon.fa': {fontSize: '.9rem',paddingRight: '.2rem',},
      '& .text':{
        width: '75%',display: 'flex',
        flexDirection: 'column',justifyContent: 'center',
        '& .transfer' :{
          paddingTop: 4,
          '& .transferChildren': {
            display: 'inline-block',maxWidth: '4rem',
            textOverflow: 'ellipsis',whiteSpace: 'nowrap',
            overflow: 'hidden', position: 'relative',
            background: 'transparent',
          },
          '& .marker': {
            position: 'relative', top: 12, left:0, right:0, 
            background: yellow[400], height: 4, zIndex: -1,
          },

          '& svg': {fontSize: '.7rem',verticalSlign: 'top',}
        },
      },
    },
    '& .hiliteMark': {
      display: 'none',
    },

  },
  // クリッド表示ではなく縦積み表形式
  // コンテンツは横長になる
  
  hzCommon: {
    display: 'flex',minHeight:32, alignItems: 'center', position:'relative',
    '& .hohouSvcName': {marginLeft: 16},
    width: 840, margin: '0 auto',
    '& .inner': {
      display:'flex',heigt: 28,
      '& .icon': {
        width:'40px',textAlign:'right',padding: 3,
        '& svg':{fontSize: '1.1rem',},
      },
      '& .icon.fa': {fontSize: '.9rem',paddingRight: '.2rem', marginTop: 2},
      '& .text.timeWrap': {
        display: 'flex', width: 180,
        '& .time': {width: 58, },
      },
      '& .text':{
        display:'flex',padding: 4,
        '& .transfer' :{
          width: 164,
          '& .transferChildren': {
            display: 'inline-block',maxWidth:80, textOverflow:'ellipsis',
            overflow: 'hidden', whiteSpace: 'nowrap', 
          },
          '& svg': {fontSize: '.7rem',verticalAlign: 'top', marginTop: 2,}
        },
      },
    },
    '& .inner.date': {
      width: 90, justifyContent: 'center',
      '& .d': {width: 30, textAlign:'center'},
      '& .w': {width: 20, textAlign:'center'},
    },
    '& .hiliteMark': {
      position: 'absolute', width: 16, height: '96%', left: 0,
      top: '3%', opacity: .5,
    },
  },
  etcOption: {
    display: 'flex', justifyContent: 'flex-end',
    '& .notice, .memo': {fontSize: 16},
    '& .notice': {color: teal[600]},
    '& .memo': {color: blue[600]}
  },
  virticalEtcOption: {
    marginLeft: 16, lineHeight: '1.5rem',
    '& div:nth-child(2)': {marginTop: 2},
    '& .notice, .memo': {
      display: 'flex', alignItems: 'flex-start'
    },
    '& .notice': {color: teal[600]},
    '& .memo': {color: blue[600]}
  },
  kubunEncho: {
    position: 'relative',
    height: 16, width: 24,
    '& .kubunEnchoPillars': {
      display: 'flex',
      height: '100%', width: '100%',
      padding: '1px 0',
      '& .kubunEnchoPillar, .blank': {
        height: '100%', width: '20%'
      },
      '& .blank': {width: '5%'},
      '@media print': {display: 'none'}
    },
    '& .kubunEnchoContent': {
      position: 'absolute',
      bottom: 0, left: "50%",
      transform: "translateX(-50%)",
      width: 21,
      fontSize: 12,
      color: grey[500], fontSize: '.7rem',
      '@media print': {color: '#333', fontSize: '.7rem'}

    }
  },
  customTooltip: {
    fontSize: '.8rem',
    maxWidth: 350,
  }
});

export const KubunEnchoPillars = (props) => {
  const schedule = useSelector(state => state.schedule);
  const classes = useStyles();
  const {uid, did, virtical} = props;
  const schDt = props.schDt ?? schedule?.["UID"+uid]?.[did] ?? {};
  const kubun = schDt?.dAddiction?.["時間区分"];
  const enchouTwist = {"1": 2, "2": 3, "3": 1}
  const enchou = enchouTwist[schDt?.dAddiction?.["延長支援"]];
  // const overwarapTextStyle = {color: grey[500], fontSize: '.7rem'}

  return(
    <div style={virtical ?{display: 'flex', alignItems: 'center', marginLeft: 8} :{}}>
      {Boolean(kubun) &&<>
        <div className={classes.kubunEncho}>
          <div className='kubunEnchoPillars'>
            {checkValueType(parseInt(kubun), "Number")
              ? Array(parseInt(kubun)).fill(null).map((_, i) => (
                <React.Fragment key={i}>
                  <div className='kubunEnchoPillar' style={{backgroundColor: teal[200]}} />
                  {i+1 !== parseInt(kubun) && <div className="blank" key={`blank-${i}`} />}
                </React.Fragment>
              )) :null}
          </div>
          <div className='kubunEnchoContent' >区{kubun}</div>
        </div>
      </>}
      {Boolean(enchou) &&<>
        <div className={classes.kubunEncho}>
          <div className='kubunEnchoPillars'>
            {checkValueType(parseInt(enchou), "Number")
              ? Array(parseInt(enchou)).fill(null).map((_, i) => (
                <React.Fragment key={i}>
                  <div className='kubunEnchoPillar' style={{backgroundColor: orange[200]}} />
                  {i + 1 !== parseInt(enchou) && <div className="blank" key={`blank-${i}`} />}
                </React.Fragment>
              )) : null}
          </div>
          <div className='kubunEnchoContent' >延{String(enchou)}</div>
        </div>
      </>}
    </div>
  )
}


export const EachScheduleContent = (props) => {
  const classes = useStyles();
  const classesFade = useStylesFade();
  const sSvc = useSelector(state=>state.service);
  const bid = useSelector(state=>state.bid);
  const {virtical, UID, did, dispCont = {}, onWeekly, noAbbreviation} = props;
  // if (!props.thisSchedule && !virtical) return null;
  const e = (props.thisSchedule)? props.thisSchedule: false;
  const transfer = (e && e.transfer)? e.transfer.concat(): ['',''];
  transfer[0] = (transfer[0] === '') ? '無し' : transfer[0];
  transfer[1] = (transfer[1] === '') ? '無し' : transfer[1];
  const isHohou = e.service === HOHOU; // 保訪かどうかのフラグ
  let hohouSvcName = isHohou ? comMod.fdp(e, 'dAddiction.保育訪問', ''): '';
  hohouSvcName = hohouSvcName.replace('保訪', '保育訪問');
  const uidDid = (UID && did)? UID + did: '';
  const notice = e ?e.notice :null;
  const memo = e ?e.memo :null;
  const noUse = e.noUse; // 利用無し
  const reserve = e.reserve; // 予約
  const absence = e.absence;
  const stdDate = useSelector(state=>state.stdDate);
  // ハイライト表示を保持するためのlocalstrageを問い合わせしてハイライト表示用のクラス名を得る
  const getHeighLightClassName = () => {
    // const t = getLocalStorageItemWithTimeStamp(
    //   hid + uidDid, cellHighlightLifeTime
    // );
    const t = localStorage.getItem(bid + uidDid);
    return t? classesFade.dateCellFadeEnd + ' ': ''
  }
  const hilightClassName = getHeighLightClassName();
  // 実費項目をjsxで表現しやすくする
  const actual = () => {
    let text = '';
    let cost = 0;
    let full = '';
    if (!e) return null;
    const separator = virtical ? '\n' : '\u3000';
    Object.keys((e.actualCost || {})).forEach(f => {
      text += f + ', ';
      cost += parseInt(e.actualCost[f]);
      full += `${f}: ${e.actualCost[f]}円${separator}`;
    });
    text = text.slice(0, -2); // 末尾二文字を削除
    let short = text;
    const length = Object.keys(e.actualCost || {}).length;
    if (short.length > 4) short = short.substr(0, 4) + '..';
    return { text, short, cost, length, full };
  }
  const actualObj = actual();
  //　加算項目を表現しやすいようにオブジェクト化
  // 延長支援加算: -1をカウントしてしまうのを抑制
  // テンプレートからundefinedの延長支援加算が定義されていることがある。加算名として表示されてしまうので抑制
  const aKeys = (e.dAddiction === undefined) ? [] : Object.keys(e.dAddiction)
  .filter(x => Number(e.dAddiction[x]) !== -1 && e.dAddiction[x])
  const ndx = aKeys.indexOf('時間区分');
  if (ndx !== -1) aKeys.splice(ndx, 1);
  // 欠席加算のありなしを確認
  // const kessekiItem = aKeys.find(f=>f.indexOf('欠席時対応加算') > -1);
  // 欠席でも表示する加算
  // const kessekiDispKasan = ['欠席時対応加算', '家族支援加算Ⅱ', '家族支援加算Ⅰ', '関係機関連携加算']
  const kessekiDispKasan = stdDate >= LC2024 ? kessekiSvc : kessekiSvc2021;
  const addiction = () => {
    let long = '';
    let short = '';
    let tAkeys = aKeys;
    // let tAkeys = absence && reserve ? [] : aKeys;
    if (absence && !reserve) tAkeys = tAkeys.filter(x=>kessekiDispKasan.includes(x));
    // 保育訪問が加算に入っちゃっているのでフィルタを追加
    const separator = virtical ? '\n' : '\u3000';
    tAkeys.filter(x=>x !== '保育訪問').map(f => {
      // long += e.dAddiction[f] + ', ';
      if (f === '延長支援'){
        long += `${f}${[0, 2, 3, 1][Number(e.dAddiction[f])]}${separator}`;
      }
      else if (Number(e.dAddiction[f]) === 1) long += `${f}${separator}`;
      else long += `${f}: ${e.dAddiction[f]}${separator}`;
      short += f + ', ';
    });
    // if (kessekiItem)
    if (short.length > 5) short = short.slice(0, 5) + '..';
    const length = tAkeys.filter(x=>x !== '保育訪問').length;
    const hasOtherSvc = tAkeys.includes('保育訪問');
    return { long, short, length, names: tAkeys, hasOtherSvc };
  }
  const addictionObj = addiction();
  // 欠席の表示を行う
  const AbsenseIcon = (props) => {
    const {virtical, noUse, reserve} = props;
    const virticalStyle = virtical ? 'virticalAbsenceIcon ': '';
    const kessekiKasan = (aKeys.includes('欠席時対応加算'))? 'kessekiKasan ': ''
    const reserveClass = reserve ? 'reserve ' : '';

    return (
      <div className={'dateCellAbsenceIcon ' + virticalStyle + kessekiKasan + reserveClass} >
        {noUse === true &&
          <CloseIcon />
        }
        {reserve === true &&
          <PauseIcon style={{color: blue[600]}}/>
        }
        {noUse !== true && reserve !== true &&
          <NotInterestedIcon />
        }

      </div>
    )
  }
  // 欠席表示のためのクラス設定。
  let rootClass = (parseInt(e.offSchool) === 0 || isHohou)? 
    classes.normalRoot : classes.schoolOffRoot;
  rootClass = (e.absence) ? classes.absencedRoot : rootClass;
  // 予定データのサービスとstateのサービスが異なる場合
  rootClass = (e.service && sSvc && e.service !== sSvc)? classes.notServiceRoot: rootClass;
  const titleStrKesseki = (() => {
    if (noUse) return '利用なしで登録されています';
    if (reserve) return '予約・キャンセル待ちで登録されています';
    if (absence) return '欠席で登録されています';
    return '';
  })();
  const commonRoot = (virtical)? classes.hzCommon: classes.sqCommon;
  const d = (props.d)? props.d: {holiday: 0}; // 日付オブジェクト
  const wdClass = ['', 'schoolOff', 'off'][d.holiday];
  const t0style = transfer[0].match(/^\*|\*$/)? {color: grey[500]}: {};
  const t1style = transfer[1].match(/^\*|\*$/)? {color: grey[500]}: {};
  const absNodisp = e.absence && !e.reserve? {display: 'none'}: {};
  const absSpacer = e.absence && !e.reserve? {height: 32}: {};
  const timeWrapStyle = {width: (virtical? '60%': '50%')};
  const HoudayJihatsuContent = () => (
    <>
    {!dispCont.hideTime &&
      <div className="inner" style={absNodisp}>
        <div className='icon'>
          <AccessTimeIcon />
        </div>
        <div className='text timeWrap' style={timeWrapStyle}>
          <div className="time">{e.start}</div>
          <div className="time">{e.end}</div>
        </div>
        <KubunEnchoPillars schDt={e} virtical={virtical}/>
      </div>
    }
    {!dispCont.hideTranser && 
      <div className="inner" style={absNodisp}>
        <div className='icon'>
          <DriveEtaIcon />
        </div>
        <div className="text">
          <div className={"transfer" }>
            <div className={'transferChildren'} style={t0style}>
              {/* <div className='marker' style={t0style}></div> */}
              {transfer[0]}
            </div>
            <ArrowForwardIosIcon />
            <div className={'transferChildren'} style={t1style}>
              {/* <div className='marker' style={t1style}></div> */}
              {transfer[1]}
            </div>
          </div>
        </div>
      </div>
    }
    </>
  )
  const HohouContent = () => (<>
    <div className='hohouSvcName'>
      {hohouSvcName}
    </div>
  </>)
  const hasOtherSvcStyle = addictionObj.hasOtherSvc? {color: teal[400]}: {}
  const ThisContent = () => {
    const addictionNames = addictionObj.names;
    const tooltipText = addictionNames.length > 0 
      ? addictionNames.join('<br>') + `<br>件数: ${addictionNames.length}` + `<br>${titleStrKesseki}` 
      : titleStrKesseki;
    
    return (
      <Tooltip 
        title={tooltipText ? <span dangerouslySetInnerHTML={{ __html: tooltipText }} /> : ''} 
        classes={{ tooltip: classes.customTooltip }}
      >
        <div>
          <div style={virtical ? { display: 'flex' , alignItems: 'center'} : {}}>
            {!isHohou && <HoudayJihatsuContent />}
            {isHohou && <HohouContent />}
            {!dispCont.hideAcCost && (
              <div className="inner" style={absNodisp}>
                <div className='icon fa'>
                  <i className="fas fa-yen-sign fa-fw "></i>
                </div>
                <div className="text">
                  <div className="actual" style={virtical && noAbbreviation ? {whiteSpace: 'pre-line'} : {}}>
                    {noAbbreviation ? actualObj.full : actualObj.length + '件 ' + actualObj.cost + '円'}
                  </div>
                </div>
              </div>
            )}
            <div style={absSpacer}></div>
            {!dispCont.hideAddic && (
              <div className="inner">
                <div className="icon">
                  <AddCircleIcon style={hasOtherSvcStyle} />
                </div>
                <div className="text">
                  <div className="addiction" style={{
                    ...hasOtherSvcStyle,
                    ...(virtical && noAbbreviation ? {whiteSpace: 'pre-line'} : {})
                  }}>
                    {noAbbreviation ? addictionObj.long + ' ' + addictionObj.length + '件' : addictionObj.short + addictionObj.length + '件'}
                  </div>
                </div>
              </div>
            )}
            <div className={classes.etcOption}>
              {!virtical && notice ? <div title={notice}><FiberManualRecordIcon className='notice' /></div> : null}
              {!virtical && memo ? <div title={memo}><FiberManualRecordIcon className='memo' /></div> : null}
            </div>
          </div>
          <div className={classes.virticalEtcOption}>
            {virtical && notice ? <div className='notice'><FiberManualRecordIcon /><span>{notice}</span></div> : null}
            {virtical && memo ? <div className='memo'><FiberManualRecordIcon /><span>{memo}</span></div> : null}
          </div>
        </div>
      </Tooltip>
    );
  };
  const contentMinHeight = 72 - Object.keys(dispCont).length * 8;
  const style = virtical
    ? {padding: 4, width: "calc(100% - 110px)"}
    : {padding: '0 2px', minHeight: contentMinHeight}
  ;
  const dateContentStayle = virtical? {paddingTop: 4, paddingBtoom: 4}: {};
  // const dateContentStayle = {minHeight: contentMinHeight};
  const hlClassNameGrid = virtical? '': hilightClassName;
  const hlClassNameVrt = virtical? hilightClassName: '';
  const idGrid = virtical? '': uidDid;
  const idVrt = virtical? uidDid: '';
  // 週間予定のみチェックマークの位置を変更する
  const useCheckStyle = onWeekly? {top: -28}: {};

  return (
    <div 
      className={"dateContent " + rootClass + ' ' + commonRoot}
      id={idVrt} style={dateContentStayle}
      // title={titleStr}
    >
      {/* 利用実績チェック表示 */}
      {e.useResult === true &&
        <div className={classes.useCheck} style={useCheckStyle}>
          <CheckIcon />
        </div>
      }
      <AbsenseIcon virtical={virtical} noUse={noUse} reserve={reserve} />
      {virtical === true &&
        <div className={'inner date ' + wdClass}>
          <div className='d'>{d.date.getDate()}</div>
          <div className='w'>
            {'日月火水木金土'.slice(d.date.getDay(), d.date.getDay() + 1)}
          </div>        
        </div>
      }
      <div className={'hiliteMark ' + hlClassNameVrt}></div>
      <div className={hlClassNameGrid} style={style} id={idGrid}>
        {e !== false && 
          <ThisContent />
        }
      </div>
    </div>
  )
}
export default EachScheduleContent;