import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { convDid, formatDate, getLodingStatus, getUser, parsePermission, shortWord } from '../../commonModule';
import { checkDupAddiction, chkContractPeriod } from './checkDupAddiction';
import { compareLastMonth } from './compareLastMonth';
import { setBillInfoToSch } from './blMakeData';
import { checkServiceCount } from './ServiceCountNotice';
import { doCheckProgress } from '../common/CheckProgress';
import { AppBar, Button, Dialog, IconButton, Slide, makeStyles } from '@material-ui/core';
import { blue, grey, red, teal } from '@material-ui/core/colors';
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min';
import LinkIcon from '@material-ui/icons/Link';
import { HOHOU, HOUDAY, JIHATSU } from '../../modules/contants';
import { inService, isClassroom, isService } from '../../albCommonModule';
import CloseIcon from '@material-ui/icons/Close';
import { timeDifferenceInMinutes } from '../../modules/timeDifferenceInMinutes';
import { NotDispLowCh, useSuspendLowChange } from '../common/useSuspendLowChange';
import { getJikanKubunAndEnchou } from '../../modules/elapsedTimes';
import { getLSTS, setLSTS } from '../../modules/localStrageOprations';
import { seagull, didPtn } from '../../modules/contants';

// 重複している加算を確認する
// 配列にして返す予定
// export const checkDupAddiction = (allState) => {
// userとスケジュールの加算のアンマッチ
// 前月との比較を行う
// export const compareLastMonth = async ({
// usersからユニークな管理事業所協力事業所の配列を得る
// otherOfficeNotMatch
//
// これらを実行して問題があるようならダイアログへのリンクを表示する
// 可能ならキー入力がない状態のときのみ処理を行う。

const useStyles = makeStyles({
  appBar: {
    '& >div': {
      padding: 16, textAlign: 'right', color: '#eee',
      '& .MuiButton-text ': {color: 'inherit'}
    }
  },
  inlineRoot: {
    width: 800,margin: '0 auto',display: 'flex',
    alignItems: 'center',justifyContent: 'center',
    fontSize: '1rem', minHeight: 40,
    color: blue[800],
    '@media print': {
      display: 'none'
    },
    '& .MuiButton-label': {color: red[800], fontSize: '1rem'}
  },
  detailRoot: {
    position: 'absolute',
    width: 'calc(100vw - 68px)', left:62, top: 92, height: 'calc(100vh - 92px)',
    background: '#fff', padding: '16px 16px ',
    // marginTop: 120, width: 800, marginLeft: 'calc((100vw - 800px) / 2)',
    '& .mainTitle': {
      width: 800, margin: '24px auto 8px',
      marginTop: 24, 
      color: blue[800], fontSize: '1.2rem',
      textAlign: 'center',
      '& .small': {
        fontSize: '.8rem', color: grey[600],
        width: 400, margin: '8px auto 24px', textAlign: 'justify',
        lineHeight: 1.4,
      }
    },
    '& .title': {
      backgroundColor: red[50], padding: '4px 8px', 
      borderBottom: `1px solid ${red[800]}`,
      display:'flex', alignItems: 'center', flexWrap: 'wrap',
      minHeight: 36,
      '& .small': {
        fontSize: '.8rem', color: teal[900], marginTop: 4, width: '100%',
      },
      width: 800, margin: '0 auto',
    },
    '& .subText': {
      fontSize: '.8rem', color: teal[900], marginTop: 4, width: '100%',
      paddingLeft: 8,
      width: 800, margin: '0 auto',
    },
    '& .detail': {
      display: 'flex', padding: '0px 4px', 
      '& >div': {
        padding: '8px 4px 4px', fontSize: '.9rem',
        '& a': {color: blue[600], textDecoration: 'underline'}
      },
    },
    '& .detailWrap': {
      marginBottom: 16,
      width: 800, margin: '0 auto',
    },
    '& .independence': {marginBottom: 24, backgroundColor: '#fff',},
    '& a': {color: blue[600], },
    '& .buttonWrap': {
      position: 'fixed', bottom: 16, textAlign: 'center', 
      width: 'calc(100vw - 68px)', left:62, 
    }
  },

});

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const formatDid = (did, short=false) => {
  if (short){
    return did.slice(5, 7)  + '-' + did.slice(7, 9)  
  }
  return did.slice(1, 5) + '-' + did.slice(5, 7)  + '-' + did.slice(7, 9)  
}

const makeChkItems = ({
  svcCntAry, unmatchCheck, duplicateCheck, compareCom, compareUsers,
  progressChecks, cmpLastMonth, otherOfficeAry, kdChk, tobeFixed,contractPeriod,
  serviceTimeCheck, jikankubunCheck, badCombination,
}) => {
  const chkItems = [];
  if (jikankubunCheck.length){
    chkItems.push({
      name: '時間区分', description: '時間区分未設定の利用があります', 
      count: Object.keys(jikankubunCheck).length,
    })

  }
  if (Object.keys(duplicateCheck).length){
    chkItems.push({
      name: '加算の重複', description: '加算設定に重複があります', 
      count: Object.keys(duplicateCheck).length,
    })
  }
  if (Object.keys(unmatchCheck).length){
    chkItems.push({
      name: '加算不整合', description: '加算設定に不整合があります。',
      count: Object.keys(unmatchCheck).length,
    })
  }
  // 前月との差異結果件数を求める
  const cl = (compareCom || [])?.length;
  const ul = (compareUsers || []).length;
  const cmpLastMonthCnt = cl || 0 + ul || 0;
  if (cmpLastMonthCnt){
    chkItems.push({
      name: '前月との差異', description: '事業所の加算設定に前月との差異が認められました。',
      count: Object.keys(cmpLastMonth).length,
    })
  }
  if (svcCntAry.length){
    chkItems.push({
      name: 'サービス回数', description: 'サービス回数の超過があります。',
      count: svcCntAry.length,
    })
  }
  if (otherOfficeAry.length){
    chkItems.push({
      name: '管理協力事業所', 
      description: '管理事業所・協力事業所として設定された事業所番号に不一致が認められました。',
      count: svcCntAry.length,
    })
  }
  if (progressChecks?.hnoChk?.result === false){
    chkItems.push({
      name: '受給者証番号', 
      description: '仮受給者証番号の利用者がいます。',
    })
  }
  if (progressChecks?.jougenChk?.result === false){
    chkItems.push({
      name: '上限管理', 
      description: '上限管理が完了していない可能性があります。',
    })
  }
  if (!kdChk?.result){
    chkItems.push({
      name: '兄弟設定', 
      description: '兄弟設定が正しくありません。',
    })
  }
  if (kdChk?.kyBros.length > 0){
    chkItems.push({
      name: '兄弟設定（協力事業所）', 
      description: '協力事業所の兄弟設定があります。',
    })
  }
  if (kdChk?.noJikohutan.length > 0){
    chkItems.push({
      name: '兄弟設定（自己負担額0）', 
      description: '自己負担額が0の兄弟設定があります。',
    })
  }
  if (tobeFixed){
    chkItems.push({
      name: '確定処理', 
      description: '確定処理が行われていません。',
    })
  }
  if (contractPeriod.length){
    chkItems.push({
      name: '契約期間外', description: '契約期間外の利用があります。',
      count: contractPeriod.length,
    })
  }
  if (serviceTimeCheck.length) {
    chkItems.push({
      name: '提供時間', description: 'サービス提供時間が不適切です。',
      count: serviceTimeCheck.length,
    })
  }
  if (badCombination.length) {
    chkItems.push({
      name: '同日算定出来ない加算', description: '同日算定の確認が必要です。',
      count: badCombination.length,
    })
  }

  let inlineStr = '';
  if (!chkItems.length){
    inlineStr = '請求情報に問題は認められません。';
  }
  else if (chkItems.length === 1){
    inlineStr = `${chkItems[0].name}を確認して下さい。`
  }
  else if (chkItems.length === 2){
    inlineStr = `${chkItems[0].name}と${chkItems[1].name}を確認して下さい。`
  }
  else{
    inlineStr = `${chkItems[0].name}や${chkItems[1].name}などの確認項目があります。`
  }
  return {chkItems, inlineStr}
}

// サービス提供時間の確認を行う
const chechServiceTime = (allState) => {
  const {schedule, users} = allState;
  const checkResult = [];
  const UIDS = Object.keys(schedule).filter(e=>e.match(/^UID\d+/));
  UIDS.forEach(UID=>{
    const dids = Object.keys(schedule[UID]).filter(e=>e.match);
    const user = getUser(UID, users);
    if (!user) return false;
    const name = user?.name;
    dids.forEach(did=>{
      const dobj = schedule[UID][did];
      if (!dobj.start || !dobj.end) return false;
      const svcTime = timeDifferenceInMinutes(dobj);
      // 欠席時対応加算２のときは利用時間が３０分以内
      if (dobj?.dAddiction?.欠席時対応加算 === '欠席時対応加算２'){
        if (!svcTime || svcTime > 30){
          checkResult.push({
            UID, did, str: '欠席時対応加算２を取得している場合の提供時間は30分以内です。',
            start: dobj.start, end: dobj.end, name,
          })
        }
      }
      if (dobj.absence) return false;
      if (svcTime <= 30){
        checkResult.push({
          UID, did, str: 'サービス提供時間が短すぎます',
          start: dobj.start, end: dobj.end, name,
        })
      }      
    })
  });
  return checkResult;
}

// 組み合わせの悪い加算を検出する
const checkBadCombination = ({billingDt, stdDate, }) => {
  const rt = [];
  if (stdDate < '2024-04-01') return rt;
  if (!billingDt || !billingDt.length) return rt;
  const badCombi = [
    ['欠席時対応加算', '家族支援加算Ⅰ'],
    ['欠席時対応加算', '家族支援加算Ⅱ'],
    ['家族支援加算Ⅰ', '家族支援加算Ⅱ'],
    ['欠席時対応加算', '関係機関連携加算'],
  ];
  billingDt.forEach(bdt=>{
    const dida = Object.keys(bdt).filter(e=>e.match(didPtn));
    dida.forEach(did=>{
      const items = bdt[did]?.items || [];
      const itemNames = items.map(e=>e.name || '');
      const r = badCombi.find(combi => combi.every(badItem => itemNames.includes(badItem)));
      if (r){
        rt.push({uid: bdt.UID, did, name: bdt.name, badCombi: r})
      }
    })
  });
  return rt;
}


// 時間区分未設定の確認を行う
// checkCorrect: true 時間区分が適正かどうかの判断も行う
export const checkJikanuKubun = (schedule, users, stdDate, com, checkCorrect) => {
  const rt = [];
  const juushingataHD = com?.addiction?.[HOUDAY]?.重症心身型 === '1';
  const juushingataJH = com?.addiction?.[JIHATSU]?.重症心身型 === '1';

  if (stdDate < '2024-04-01' || 
      com?.addiction?.[HOUDAY]?.共生型サービス || 
      com?.addiction?.[JIHATSU]?.共生型サービス || 
      com?.addiction?.[HOUDAY]?.基準該当 || 
      com?.addiction?.[JIHATSU]?.基準該当) {
    return rt;
  }

  const trgSvc = [HOUDAY, JIHATSU]; // チェック対象サービス
  const uidsa = Object.keys(schedule).filter(e=>e.match(/^UID\d+/));
  uidsa.forEach(uids=>{
    const dida = Object.keys(schedule[uids])
    .filter(e=>e.match(/^D2\d+/)).filter((a, b)=>(a < b? -1: 1));
    const user = getUser(uids, users);
    const isJuushin = (user?.type || '').includes('重症心身障害児');
    // usersに存在しない
    if (!Object.keys(user).length) return;
    // console.log(uids, 'uids');
    // ターゲットサービスかどうか判定
    const svcs = user?.service.split(',') || [];
    const jihatsu = user?.service.includes(JIHATSU);
    const isTarget = svcs.some(e=>trgSvc.includes(e));
    if (!isTarget) return;
    // 重心型施設で利用者が重心の場合
    if (svcs.includes(HOUDAY) && juushingataHD && isJuushin) return;
    if (svcs.includes(JIHATSU) && juushingataJH && isJuushin) return;
    const name = user.name;
    dida.forEach(did=>{
      const item = schedule[uids][did];
      if (item.absence) return;
      if (item.service && !trgSvc.includes(item.service)) return;
      let exist = false; // 時間区分が存在するか
      if (item?.dAddiction?.時間区分 && Number(item?.dAddiction?.時間区分) > 0){
        exist = true;
      }
      if (!exist){
        rt.push({uid: uids, did, name, str: '時間区分未設定', service: item.service})
        return;
      }
      // 時間区分の適性チェック
      if (!checkCorrect) return;
      if (!item.start) return;
      const useEncho1 = Number(item?.dAddiction?.延長支援) === 3;
      const userKubun3 = jihatsu || Number(item.offSchool) >= 1;
      const autoJikanEnchou = getJikanKubunAndEnchou(item.start, item.end, userKubun3, useEncho1);
      const setKubun = Number(item?.dAddiction?.時間区分) || undefined;
      const setEnchou = Number(item?.dAddiction?.延長支援) || undefined;
      const jikanKubunNotCorrect = autoJikanEnchou.区分 !== setKubun;
      // -1を未設定として検出
      const enchoShienNotCorrect = autoJikanEnchou.延長支援 !== (setEnchou === -1? undefined: setEnchou);
  
      if (jikanKubunNotCorrect || enchoShienNotCorrect){
        const enchouTwist = {"1": "延長2", "2": "延長3", "3": "延長1"}
        const enchouText = item?.dAddiction?.延長支援 ? enchouTwist[String(item?.dAddiction?.延長支援)]: '';
        const kubunText = (Number(item.offSchool) >= 1 ? "(休日) ": "") + "区分" + item?.dAddiction?.時間区分;
        const str =  kubunText + (enchouText || '');
        const autoStr = autoJikanEnchou.str;
        // console.log(autoJikanEnchou, name, did, item, 'autoJikanEnchou');
        rt.push({
          uid: uids, did, name, sindex: user.sindex, service: user.service, 
          hours: (autoJikanEnchou.hours || 0).toFixed(2) + "時間", str, autoStr,
        })
      }
    })
  });
  // 出力結果をソート
  rt.sort((a, b)=>{
    if (a.sindex < b.sindex) return -1;
    if (a.sindex > b.sindex) return 1;
    if (a.uid635 < b.uid) return -1;
    if (a.uid > b.uid) return 1;
    if (a.did < b.did) return -1;
    if (a.did > b.did) return 1;
  })
  return rt;
}

// サブコンポーネント：サービス回数の超過表示
// 条件: svcCntAry.length > 0
const ServiceCountDetails = ({ svcCntAry, gotoUserSchedule }) => {
  if (svcCntAry.length === 0) return null;
  const itemDisp = (item) => {
    if (item === 'baseItem') return '利用回数';
    if (item === 'dayOfUse') return '一日の利用回数';
    else return item;
  }
  return (
    <>
      <div className="title">サービス回数の超過</div>
      <div className="detailWrap">
        {svcCntAry.map((e, i) => (
          <div className="detail" key={i}>
            <div className="name">
              <a onClick={(ev) => gotoUserSchedule(ev, e.UID)}>{e.name}</a>
            </div>
            <div className="item">{itemDisp(e.item)}</div>
            <div className="count">{`${e.count} / ${e.limit}`}</div>
            <div className="item">{e.date}</div>
          </div>
        ))}
      </div>
    </>
  );
};

// サブコンポーネント：時間区分の未設定・間違い表示
// 条件: jikankubunCheck.length > 0
const TimeCategoryDetails = ({ jikankubunCheck, gotoUserSchedule }) => {
  if (jikankubunCheck.length === 0) return null;
  // 複数サービスを含んでいるかどうかを確認
  const uniqSvc = [...new Set(jikankubunCheck.flatMap(item => item.service.split(',')))]
  .filter(item=>item!==HOHOU);
  // 複数サービスが存在するときはサービス名の一部を記述
  if (uniqSvc.length > 1){
    jikankubunCheck.forEach(item=>{
      const svcs = item.service.split(',').filter(e=>e!==HOHOU);
      const svcLetter = svcs[0].slice(0, 1);
      item.name = item.name + '(' + svcLetter + ')';
    })
  }
  return (
    <>
      <div className="title">時間区分未設定・または間違いの可能性</div>
      <div className="subText">
        実績時間に対して時間区分・延長支援が整合していません。設定値→推定値の順番で記述されています。
      </div>

      <div className="detailWrap">
        {jikankubunCheck.map((e, i) => (
          <div className="detail" key={i}>
            <div className="name">{e.name}</div>
            <div className="item">
              日付: 
              <a onClick={(ev) => gotoUserSchedule(ev, e.uid)}>
                {formatDid(e.did, true)}
              </a>
            </div>
            <div className="count">{e.hours ? `${e.hours} / ${e.str}` : e.str}</div>
            <div className="count"> {e.autoStr ? '→': ''} </div>
            <div className="count">{e.autoStr || ''}</div>
          </div>
        ))}
      </div>
    </>
  );
};

// サブコンポーネント：同日算定できない加算の表示
// 条件: badCombination.length > 0
const BadCombinationDetails = ({ badCombination, gotoUserSchedule }) => {
  if (badCombination.length === 0) return null;
  return (
    <>
      <div className="title">同日算定できない可能性のある加算</div>
      <div className="detailWrap">
        {badCombination.map((e, i) => (
          <div className="detail" key={i}>
            <div className="name">{e.name}</div>
            <div className="item">
              日付: 
              <a onClick={(ev) => gotoUserSchedule(ev, e.uid)}>
                {formatDid(e.did, true)}
              </a>
              <span style={{ marginInlineStart: 8 }}>
                {e.badCombi.join(' と ')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

// サブコンポーネント：提供時間が短すぎます
// 条件: serviceTimeCheck.length > 0
const ServiceTimeCheckDetails = ({ serviceTimeCheck, gotoUserSchedule }) => {
  if (serviceTimeCheck.length === 0) return null;
  return (
    <>
      <div className="title">提供時間が短すぎます</div>
      <div className="detailWrap">
        {serviceTimeCheck.map((e, i) => (
          <div className="detail" key={i}>
            <div className="name">{e.name}</div>
            <div className="item">
              日付: 
              <a onClick={(ev) => gotoUserSchedule(ev, e.UID)}>
                {formatDid(e.did, true)}
              </a>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

// サブコンポーネント：加算設定の重複表示
// 条件: Object.keys(duplicateCheck).length > 0
const DuplicateCheckDetails = ({ duplicateCheck, gotoUserAddictionEdit }) => {
  if (Object.keys(duplicateCheck).length === 0) return null;
  return (
    <>
      <div className="title">加算設定の重複</div>
      <div className="subText">重複が認められます。確認してください。</div>
      <div className="detailWrap">
        {Object.entries(duplicateCheck).map(([uid, checks]) =>
          checks.map((check, i) => (
            <div className="detail" key={i}>
              <div className="name">
                <a onClick={(ev) => gotoUserAddictionEdit(ev, uid)}>
                  {check.name}
                </a>
              </div>
              <div className="item">{check.item}</div>
            </div>
          ))
        )}
      </div>
    </>
  );
};


// サブコンポーネント：契約期間外の利用表示
// 条件: contractPeriod.length > 0
const ContractPeriodDetails = ({ contractPeriod, gotoUserEdit, gotoUserSchedule }) => {
  if (contractPeriod.length === 0) return null;
  
  // 契約期間外の利用と契約日チェックを分離
  const periodOutOfRange = contractPeriod.filter(e => e.did && e.startDid && e.endDid);
  const contractDateIssues = contractPeriod.filter(e => e.contractDate && e.message);
  
  return (
    <>
      {/* 契約期間外の利用 */}
      {periodOutOfRange.length > 0 && (
        <>
          <div className="title">契約期間外の利用</div>
          <div className="detailWrap">
            {periodOutOfRange.map((e, i) => (
              <div className="detail" key={`period-${i}`}>
                <div className="name">
                  <a onClick={(ev) => gotoUserEdit(ev, e.uid)}>{e.name}</a>
                </div>
                <div className="item">日付: </div>
                <div className="item">
                  <a onClick={(ev) => gotoUserSchedule(ev, e.uid)}>
                    {formatDid(e.did, 1)}
                  </a>
                </div>
                <div className="item">
                  契約期間: {formatDid(e.startDid)} ～ {formatDid(e.endDid)}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      
      {/* 契約日チェック */}
      {contractDateIssues.length > 0 && (
        <>
          <div className="title">契約日の確認</div>
          <div className="detailWrap">
            {contractDateIssues.map((e, i) => (
              <div className="detail" key={`contract-${i}`}>
                <div className="name">
                  <a onClick={(ev) => gotoUserEdit(ev, e.uid)}>{e.name}</a>
                </div>
                <div className="item">契約日: {e.contractDate}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
};


// サブコンポーネント：確定処理が行われていない警告
// 条件: tobeFixed
const FixedProcessWarning = ({ tobeFixed, history }) => {
  if (!tobeFixed) return null;
  return (
    <div className="title independence">
      確定処理が行われていません。
      <a onClick={() => history.push('/schedule/useresult/')}>
        <LinkIcon />
      </a>
    </div>
  );
};

// サブコンポーネント：受給者証番号確認
// 条件: progressChecks?.hnoChk?.result === false
const CertificateNumberWarning = ({ users, gotoUserEdit }) => {
  const filteredUsers = users.filter((e) => e.hno.length < 10);
  if (filteredUsers.length === 0) return null;

  return (
    <>
      <div className="title">受給者証番号の確認</div>
      <div className="detailWrap">
        {filteredUsers.map((e, i) => (
          <div className="detail" key={i}>
            <div className="name">
              <a onClick={(ev) => gotoUserEdit(ev, e.uid)}>{e.name}</a>
            </div>
            <div className="item">{e.hno}</div>
          </div>
        ))}
      </div>
    </>
  );
};

// サブコンポーネント：上限管理警告
// 条件: progressChecks?.jougenChk?.result === false
const UpperLimitWarning = ({ progressChecks, history }) => {
  if (progressChecks?.jougenChk?.result !== false) return null;
  return (
    <div className="title independence">
      上限管理が完了していない可能性があります。
      <a onClick={() => history.push('/proseed/upperlimit')}>
        <LinkIcon />
      </a>
    </div>
  );
};

// サブコンポーネント：兄弟設定警告
// 条件: !kdChk
const SiblingSettingWarning = ({ kdChk, history, gotoUserEdit }) => {
  const classes = useStyles();
  const warnings = [];
  
  if (!kdChk?.uniqCheck || !kdChk?.pairChk){
    warnings.push(<>
      <div className="title independence" key="sibling-setting-error">
        兄弟設定が正しくありません。
        <a onClick={() => history.push('/users/bros')}>
          <LinkIcon />
        </a>
      </div>
    </>);
  }
  if (kdChk?.noJikohutan.length > 0){
    warnings.push(
      <>
        <div className="title " key="no-self-pay-warning">
          自己負担額が0の児童は兄弟設定を行わないことを推奨します。
          <a onClick={() => history.push('/users/bros')}>
            <LinkIcon />
          </a>
        </div>
        <div className="detailWrap">
          {kdChk?.noJikohutan.map((e, i) => (
            <div className="detail" key={i}>
              <div className={classes.name}>
                <a onClick={(ev) => gotoUserEdit(ev, e.uid)}>{e.name}</a>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }
  if (kdChk?.kyBros.length > 0){
    warnings.push(
      <>
        <div className="title " key="cooperation-office-warning">
          当事業所が協力事業所の場合、兄弟設定は行わないことを推奨します。
          <a onClick={() => history.push('/users/bros')}>
            <LinkIcon />
          </a>
        </div>
        <div className="detailWrap">
          {kdChk?.kyBros.map((e, i) => (
            <div className="detail" key={i}>
              <div className={classes.name}>
                <a onClick={(ev) => gotoUserEdit(ev, e.uid)}>{e.name}</a>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }
  
  return warnings.length > 0 ? warnings : null;
};

// サブコンポーネント：加算不整合の表示
// 条件: Object.keys(unmatchCheck).length > 0
const UnmatchCheckDetails = ({ unmatchCheck, history, gotoUserAddictionEdit }) => {
  if (Object.keys(unmatchCheck).length === 0) return null;
  return (
    <>
      <div className="title">
        加算不整合
        <a onClick={() => history.push('/users/addiction')}>
          <LinkIcon />
        </a>
      </div>
      <div className="subText">
        加算設定に不整合が認められます。間違いがないか確認してください。
      </div>
      <div className="detailWrap">
        {Object.keys(unmatchCheck).map((e, i) => (
          <div className="detail" key={i}>
            <div className="name">
              <a onClick={(ev) => gotoUserAddictionEdit(ev, e)}>{unmatchCheck[e][0].name}</a>
            </div>
            <div className="item">{unmatchCheck[e][0].item}など</div>
          </div>
        ))}
      </div>

    </>
  );
};

// 利用者の加算の前月との差異
const DispPreAddictionUnmatch = ({
  compareUsers, compareCom, gotoUserAddictionEdit
}) => {
  const dispState = (v) => {
    if (v === 'modified') return '変更'
    if (v === 'deleted') return '削除'
    if (v === 'added') return '追加'
    else return '不明な変更'
  }
  if ((compareUsers || []).length + (compareCom || []).length === 0) return null;
  return (<>
    <div className="title">
      前月との差異
    </div>
    <div className="detailWrap">
      {compareUsers.map((e, i) => (
        <div className="detail" key={i}>
          <div className="name">
            <a onClick={(ev) => gotoUserAddictionEdit(ev, e.UID)}>{e.name}</a>
          </div>
          <div className="item">
            {e.item} 当月:{e.current || '未設定'} 前月:{e.pre || '未設定'}
          </div>
        </div>
      ))}
      {compareCom.map((e, i)=>(
        <div className="detail" key={i}>
          <div className="name">
            {e.name}
          </div>
          <div className="item">
            {e?.value?.value || e?.value}
          </div>
          <div className="item">
            {e.svc || ''}
          </div>
          <div className="item">
            {e.clasroom || ''}
          </div>
          <div className="item">
            {dispState(e.state)}
          </div>
        </div>

      ))}
    </div>
  </>)
}


const CheckBillingEtc = (props) => {
  const classes = useStyles();
  const allState = useSelector(state=>state);
  const {billingDt, disableSetBillInfoToSch} = props;
  const {
    com, users, stdDate, schedule, service, serviceItems, classroom, account
  } = allState;
  const permission = parsePermission(account)[0][0];
  const [cmpLastMonth, setCmpLastMonth] = useState(false);
  const [detailDisp, setDetailDisp] = useState(false);
  const [open, setOpen] = useState(false);
  const ls = getLodingStatus(allState);
  const {duplicateCheck, unmatchCheck} = checkDupAddiction(allState);
  const serviceTimeCheck =  chechServiceTime(allState);
  const classrooms = Array.from(new Set(users.map(e=>
    (e.classroom)? e.classroom: 'nc'
  )));
  // const NotDispLowCh = useSuspendLowChange();
  const NotDispLowCh = false;
  const history = useHistory()

    // const { stdDate, schedule, users, com, service, serviceItems, classroom} = prms;
  const [processedBillingDt, setProcessedBillingDt] = useState(billingDt);
  
  // propsのbillingdtが無効なら改めて取得（useEffectで一度だけ実行）
  useEffect(() => {
    if (!disableSetBillInfoToSch && ls.loaded && billingDt && (!processedBillingDt || !Array.isArray(processedBillingDt))){
      // calledBy対応済み
      const prms = {
        stdDate, schedule, users, com, classroom: '', classrooms, service: '', serviceItems,
        billingDt, calledBy: 'CheckBillingEtc'
      };
      const result = setBillInfoToSch(prms).billingDt;
      setProcessedBillingDt(result);
    }
  }, [ls.loaded, stdDate, disableSetBillInfoToSch, billingDt]); 
  
  // processedBillingDtが更新されたらprops.billingDtに合わせて更新
  useEffect(() => {
    if (billingDt && Array.isArray(billingDt)) {
      setProcessedBillingDt(billingDt);
    }
  }, [billingDt]);
  
  const prms = {
    stdDate, schedule, users, com, classroom: '', classrooms, service: '', serviceItems,
    billingDt: processedBillingDt, calledBy: 'CheckBillingEtc'
  };
  const svcCountNotice = prms.billingDt? checkServiceCount(prms): [];
  const progressChecks = prms.billingDt? doCheckProgress(prms): {};
  
  const callCompareLastMonth = async (isMounted) => {
    const lsName = 'CheckBillingEtc-compareLastMonthResult';
    if (ls.loaded) {
      try {
        // ローカルストレージから有効なデータを取得
        const cachedData = getLSTS(lsName, 30);
      
        if (cachedData) {
          // キャッシュが有効ならそれを利用
          if (isMounted.current) {
            setCmpLastMonth(cachedData);
          }
          return;
        }
      
        // キャッシュが無効なら compareLastMonth を呼び出す
        const result = await compareLastMonth(allState);
      
        if (isMounted.current) {
          setCmpLastMonth(result);
          // 結果をローカルストレージに保存
          setLSTS(lsName, result);
        }
      } catch (error) {
        console.error('compareLastMonth エラー:', error);
      }
    }
  };
  

  // console.log(contractPeriod, 'contractPeriod')
  useEffect(() => {
    // useRef を使用してマウント状態を追跡
    const isMounted = { current: true };
    
    if (!cmpLastMonth) {
      console.log('------callCompareLastMonth');
      callCompareLastMonth(isMounted);
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [ls.loaded, stdDate]); // cmpLastMonth は依存配列から削除
  // 利用者基本情報へ移動
  const gotoUserEdit = (ev ,uid) => {
    // UIDから数値だけ取り出す
    uid = uid.match(/\d+/g).join('');
    history.push(`/users/edit${uid}`);
  }
  // 利用者加算設定へ移動
  const gotoUserAddictionEdit = (ev, uid) => {
    uid = uid.match(/\d+/g).join('');
    sessionStorage.setItem("byUserAddictionNoDialogUid", uid)
    history.push(`/schedule/userAddiction/`);
  }
  // 利用者別予定へ移動
  const gotoUserSchedule = (ev, uid) => {
    uid = uid.match(/\d+/g).join('');
    history.push(`/schedule/users/${uid}/`);
  }
  const handleClose = () => {
    setOpen(false);
  }

   if (!ls.loaded || !billingDt) return null;
  const svcCntAry = svcCountNotice.filter(e=>e.item !== 'otherOffice')
  .filter(e=>{
    if (e.item === "dayOfUse") return true;
    const user = getUser(e.UID, users);
    return (isService(user, service) && isClassroom(user, classroom));
  });
  const otherOfficeAry = svcCountNotice.filter(e=>e.item === 'otherOffice');
  // const kdChk = progressChecks?.kdChk?.uniqCheck && progressChecks?.kdChk?.;
  // オブジェクトの形が複雑なので平易な配列にする
  const cmpLastMonthAsArray = (cLast) => {
    const cCom = {...cLast?.compareCom} || {};
    const compareCom = Object.keys(cCom).reduce((v, e) => {
      const o = cCom[e];
      return Object.keys(o.value || {}).reduce((w, f) => {
        const item = o.value[f];
        if (typeof item.value === 'object') {
          // 1階、2階などのプロパティの場合、中身をさらに反復処理
          return [
            ...w,
            ...Object.keys(item.value).map(g => ({
              state: item.state,
              value: item.value[g],
              svc: e,
              name: `${f}.${g}`
            }))
          ];
        } else {
          // その他のプロパティの場合
          return [...w, { ...item, svc: e, name: f }];
        }
      }, v);
    }, []);

    const cUser = {...cLast?.compareUsers} || {};
    const compareUsers = Object.keys(cUser).reduce((v, e)=>{
      const o = cUser[e]; // ユーザーごとの差異の配列
      const user = getUser(e, users);
      const t = o.map(f => ({
        UID: e, name: user.name, 
        service: user.service, clasroom: user.clasroom,
        item: Object.keys(f)[0],
        pre: f[Object.keys(f)[0]].pre,
        current: f[Object.keys(f)[0]].current,
      }))
      return ([...v, ...t]);
    }, [])
    // console.log({compareCom, compareUsers});
    return {compareCom, compareUsers};
  }
  const {compareCom, compareUsers} = cmpLastMonthAsArray(cmpLastMonth);

  // console.log(
  //   compareCom, compareUsers, cmpLastMonth, 'compareCom, compareUsers, cmpLastMonth'
  // );
  const curMonth = formatDate(new Date(new Date().setDate(1)), 'YYYY-MM-DD');
  const checkCorrect = permission === 100 || stdDate >= "2024-10-01"
  const jikankubunCheck = checkJikanuKubun(schedule, users, stdDate, com, checkCorrect);
  const badCombination = checkBadCombination({billingDt, stdDate, });
  const contractPeriod = chkContractPeriod(allState);

  // console.log(curMonth, 'curMonth');
  // 確定処理が必要なフラグ
  const tobeFixed = (curMonth > stdDate && !schedule.locked);
  const {chkItems, inlineStr}  = makeChkItems({
    svcCntAry, unmatchCheck, duplicateCheck, compareCom, compareUsers,
    progressChecks, cmpLastMonth, otherOfficeAry, kdChk: progressChecks?.kdChk, 
    tobeFixed, contractPeriod, serviceTimeCheck, jikankubunCheck,
    badCombination,
  })
  if (NotDispLowCh){
    return null
  }

  if (seagull) {
    return null;
  }
  if (!detailDisp && inlineStr.length && !open) {
    return (
      <a onClick={() => setOpen(true)}>
        <div className={`${classes.inlineRoot}`}>
          {inlineStr}
          {chkItems.length > 0 && <Button>詳細表示</Button>}
        </div>
      </a>
    );
  }

  // 詳細表示のダイアログ
  return (
    <Dialog fullScreen open={open} onClose={handleClose}>
      <AppBar className={classes.appBar}>
        <div>
          <Button endIcon={<CloseIcon />} onClick={handleClose}>
            閉じる
          </Button>
        </div>
      </AppBar>
      <div className={classes.detailRoot}>
        <ServiceCountDetails svcCntAry={svcCntAry} gotoUserSchedule={gotoUserSchedule} />
        <TimeCategoryDetails jikankubunCheck={jikankubunCheck} gotoUserSchedule={gotoUserSchedule} />
        <BadCombinationDetails badCombination={badCombination} gotoUserSchedule={gotoUserSchedule} />
        <ServiceTimeCheckDetails serviceTimeCheck={serviceTimeCheck} gotoUserSchedule={gotoUserSchedule} />
        
        <DuplicateCheckDetails duplicateCheck={duplicateCheck} gotoUserAddictionEdit={gotoUserAddictionEdit} />
        <ContractPeriodDetails 
          contractPeriod={contractPeriod} gotoUserSchedule={gotoUserSchedule} gotoUserEdit={gotoUserEdit}
        />
        <FixedProcessWarning tobeFixed={tobeFixed} history={history} />
        <CertificateNumberWarning progressChecks={progressChecks} users={users} gotoUserEdit={gotoUserEdit} />
        <UpperLimitWarning progressChecks={progressChecks} history={history} />
        <SiblingSettingWarning kdChk={progressChecks?.kdChk} history={history} gotoUserEdit={gotoUserEdit} />
        <DispPreAddictionUnmatch 
          compareUsers={compareUsers} compareCom={compareCom}
          gotoUserAddictionEdit={gotoUserAddictionEdit}
        />
        <UnmatchCheckDetails 
          unmatchCheck={unmatchCheck} history={history} gotoUserAddictionEdit={gotoUserAddictionEdit}
        />

        <div id='bottomSpacer' style={{height: 92}}></div>

        <div className='buttonWrap'>
          <Button
            variant='contained' color='primary' endIcon={<CloseIcon/>}
            onClick={handleClose}
          >
            閉じる
          </Button>
        </div>
      </div>

    </Dialog>
  );
};

export {CheckBillingEtc};