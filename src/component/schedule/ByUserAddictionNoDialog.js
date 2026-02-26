import { Checkbox, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, makeStyles } from '@material-ui/core';
import { red, teal } from '@material-ui/core/colors';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router';
import { setStore } from '../../Actions';
import { HOHOU, KEIKAKU_SOUDAN } from '../../modules/contants';
import { sendPartOfSchedule, sendUser, setRecentUser } from '../../albCommonModule';
import { findDeepPath, getFormDatas, getLodingStatus, getUisCookie, getUser, uisCookiePos } from '../../commonModule';
import { CareNeeds, FukushiSenmonHaichi, HohouTokuchi, IryouCareJi, IryouRenkei, JihatsuKetsujo, JinkouNaiji, JiShidouKaHai1, JougenKanri, KangoKahai, KankeiRenkei, KeikakuMisakusei, KobetsuSuport1, KobetsuSuport2, KobetsuSuport3, KyoudoKoudou, KyoudoKoudou90, Musyouka, SenmonShien, ShikakuTyoukaku, ShokujiTeikyou, SougeiItteiJouken, SougeiKasanSettei, TashiKeigen, TokubetsuShien, Tokuchi, TuusyoJiritsu, TyuukakuKyouka, TyuukakuKyoukaJigyousyo } from '../common/AddictionFormParts';
import { EditUserButton, GoBackButton, LoadingSpinner, SetUisCookieChkBox } from '../common/commonParts';
import { ButtonGP } from '../common/materialUi';
import SchLokedDisplay from '../common/SchLockedDisplay';
import { ChiikiKyoten, ChiikiKyoudou, ChouhukuGensan, NyuuinRenkei, SeishinShien, UnivAddictionSoudan, YouIryouShien } from '../common/SoudanAddictionFormParts';
import * as Actions from '../../Actions';
import { LC2024 } from '../../modules/contants';
import { NextUserDisp } from '../Users/UserEditNoDialog';


const useStyles = makeStyles({
  byUserAddiction: {
    maxWidth: 600, margin: '100px auto',
    '& .title': {
      width: '90%', textAlign: 'center', padding: 4, paddingBottom: 0,
      fontSize: '.8rem', color: teal[500], margin: '0 auto 12px auto'
    },
    '& .userInfo': {
      display: 'flex', justifyContent: 'center', alignItems: 'baseline', marginBottom: 12,
      '& .small': {fontSize: '.8rem', padding: 4},
      '& .large': {fontSize: '1.3rem', padding: 4, paddingBottom: 0},
    }
  },
  cntRow: {display: 'flex', flexWrap:'wrap', padding:8, }
});

const Dispatcher = ({idName, scrollVal}) => {
  // const dispatch = useDispatch();
  useEffect(()=>{
    return () =>{
      setTimeout(()=>{
        const closed = !document.querySelector('#byUserAddictionNoDialog52');
        if (closed){
          const elm = document.getElementById(idName);
          if(elm){
            if(idName === "usersRootScrollCnt"){
              elm.scrollTop = scrollVal
            }else{
              document.documentElement.scrollTop = scrollVal
            }
          }
          // dispatch(Actions.setStore({users: originUsers}));
        }
      }, 100)
    }
  }, [])
  return (
    <div id='byUserAddictionNoDialog52' style={{display: 'none'}}></div>
  )
}

const ByUserAddictionNoDialog =()=>{
  const dispatch = useDispatch();
  const classes = useStyles();
  const uid = sessionStorage.getItem("byUserAddictionNoDialogUid");
  const idName = sessionStorage.getItem("byUserAddictionNoDialogIdName");
  const scrollVal = sessionStorage.getItem("byUserAddictionNoDialogScrollVal");
  const history = useHistory();
  const allState = useSelector(state => state);
  const [res, setRes] = useState();
  const [snack, setSnack] = useState({msg:'', severity:''});
  const [displayLarge, setDisplayLarge] = useState(
    getUisCookie(uisCookiePos.addictionsDisplayLarge)
  )
  const [notDisplayWarning, setNotDisplayWarning] = useState(
    getUisCookie(uisCookiePos.byUserAddictionWarning) === '1'
  )
  const [displaySize, setDisplaySize] = useState('middleL')
  // 今月のみの書き込みを行う場合の指定、usersにdispatch、データ送信を行うか否か
  const [thisMonthOnly, setThisMonthOnly] = useState(false);
  const loadingStatus = getLodingStatus(allState);

  const {hid, bid, stdDate, service, users, nextUsers, schedule, controleMode} = allState;
  const UID = "UID" + uid;
  const thisUser = getUser(UID, users, nextUsers);
  useEffect(() => {
    if (parseInt(displayLarge) === 1 || displayLarge === true) setDisplaySize('large');
    else setDisplaySize('middleL');
  }, [displayLarge])
  // リロードなどでserviceが未設定になることがある。その場合、user情報から取得する
  useEffect(()=>{
    if (!service && thisUser.service){
      dispatch(Actions.setStore({service: thisUser.service.split(',')[0]}))
    }
  }, [service])

  // 警告ダイアログ用のステート追加
  const [warningDialog, setWarningDialog] = useState({
    open: false,
    message: '',
    keys: []
  });

  // チェック対象の加算キーリスト
  const restrictedAddictionKeys = [
    '福祉専門職員配置等加算', 
    '看護職員加配加算', 
    '児童指導員等加配加算',

  ];

  if(!loadingStatus.loaded) return(<LoadingSpinner />);

  const handleSubmit = (e)=>{
    e.preventDefault();
    // 値が必要なエレメントを用意しておく
    const inputs = document.querySelectorAll('#yuj78sb input',);
    const selects = document.querySelectorAll('#yuj78sb select');
    // フォームの値を取得
    // 未設定の値も取得
    const formsUserAddiction = getFormDatas([inputs, selects], false, true);
    const userAddiction = {...thisUser.etc?.addiction, ...formsUserAddiction};
    // 未設定の値を削除
    Object.keys(userAddiction).forEach(key => {
      if (userAddiction[key] === "") delete userAddiction[key];
    });
    Object.keys(formsUserAddiction).forEach(key => {
      if (formsUserAddiction[key] === "") delete formsUserAddiction[key];
    });
    // チェックボックスの体を使わないので削除
    delete userAddiction.thisMonthOnly;

    // 制限された加算項目をチェック
    const foundRestrictedKeys = restrictedAddictionKeys.filter(key => 
      userAddiction[key] && userAddiction[key] !== '0' && userAddiction[key] !== ''
    );

    if (foundRestrictedKeys.length > 0 && !notDisplayWarning) {
      // 警告ダイアログを表示
      setWarningDialog({
        open: true,
        message: '次の加算項目は共通設定で行うことをお勧めします：',
        keys: foundRestrictedKeys
      });
      return; // 処理を中断
    }

    // 警告がない場合は通常の処理を続行
    proceedWithSubmission(userAddiction, formsUserAddiction);
  }

  // 既存の送信処理を分離した関数
  const proceedWithSubmission = (userAddiction, formsUserAddiction) => {
    const isMultiSvc = thisUser.service.split(',').length > 1;
    // users 既存のetc部分（json部分）にaddictionを追加
    const userEtc = {...thisUser.etc, addiction: userAddiction};

    // 複数サービスの場合は、multiSvcにも追加
    if (isMultiSvc){
      const multiService = thisUser?.etc?.multiSvc? {...thisUser.etc.multiSvc} : {};
      multiService[service] = {...multiService[service], addiction: formsUserAddiction};
      userEtc.multiSvc = multiService;
    }

    const tuser = [...users];
    const i = tuser.findIndex(e=>e.uid === uid);
    // このオブジェクトを後でストアにディスパッチする
    tuser[i] = {...thisUser, etc:userEtc}; // store dispatch用
    
    // 以下は元のコードと同じ
    if (!thisMonthOnly){
      const newThisUser = {...thisUser, date:stdDate, etc:{...userEtc}}
      const f = async () => {
        const r = await sendUser(newThisUser, '', '');
        if (r.data.result){
          setSnack({msg:'ユーザー情報を更新しました', severity: ''})
        }
        else{
          setSnack({msg:'ユーザー情報を更新できませんでした', severity: 'error'})
        }
      }
      f();
    }
    
    // 残りの処理（スケジュールの更新など）は変更なし
    let t = findDeepPath(schedule, [service, UID]);
    t = t? t: {};
    const u = {...t, ...userAddiction};
    const s = {...schedule};
    if (!s.hasOwnProperty(service))      s[service] = {};
    if (!s[service].hasOwnProperty(UID)) s[service][UID] = {};
    s[service][UID] = {...s[service][UID], addiction: userAddiction};
    
    const usd = (thisMonthOnly)? {}: {users: tuser};
    s.timestamp = new Date().getTime();
    dispatch(setStore({schedule:s, ...usd}));
    
    dispatch(setStore({controleMode}));
    
    const partOfSch = {[service]: {}};
    partOfSch[service] = {...s[service]};
    partOfSch[service][UID] = {...s[service][UID]};
    const sndPrms = {hid, bid, date:stdDate, partOfSch};
    sendPartOfSchedule(sndPrms, setRes, setSnack);
    setRecentUser(uid);
    history.goBack();
  };

  // 警告ダイアログからの続行
  const handleProceed = () => {
    const inputs = document.querySelectorAll('#yuj78sb input');
    const selects = document.querySelectorAll('#yuj78sb select');
    // 未設定の値も取得
    const formsUserAddiction = getFormDatas([inputs, selects], false, true);
    const userAddiction = {...thisUser.etc?.addiction, ...formsUserAddiction};
    // 未設定の値を削除
    Object.keys(userAddiction).forEach(key => {
      if (userAddiction[key] === "") delete userAddiction[key];
    });
    Object.keys(formsUserAddiction).forEach(key => {
      if (formsUserAddiction[key] === "") delete formsUserAddiction[key];
    });
    delete userAddiction.thisMonthOnly;
    
    setWarningDialog({...warningDialog, open: false});
    proceedWithSubmission(userAddiction, formsUserAddiction);
  };

  // 警告ダイアログのキャンセル
  const handleCancel = () => {
    setWarningDialog({...warningDialog, open: false});
  };

  const handleChange = () =>{
    if (thisMonthOnly)  setThisMonthOnly(false);
    else setThisMonthOnly(true);
  }
  const scheduleLocked = schedule.locked ?true :false;
  const buttonWrapperStyle = {display: 'flex', justifyContent: 'flex-end'}
  // if (allState.service === HOHOU){
  //   return (<>
  //     <GoBackButton posX={120} posY={0}/>
  //     <div className={classes.byUserAddiction}>
  //       <div className='title'>利用者別加算設定</div>
  //       <div style={{padding: 16, textAlign: 'center'}}>
  //         このサービスでは表示する項目がありません。
  //       </div>

  //     </div>

  //   </>)
  // }
  const texts = {
    tokuchi: '豪雪地帯、特別豪雪地帯、辺地、過疎地域等であって、人口密度が希薄、交通が不便等の理由によりサービスの確保が著しく困難な地域に対してサービスを提供した場合に算定できる加算です。',
    youIryou: '重症心身障害など医療的なケアを要する児童や障害者に対して、適切な計画相談支援等を実施するために、定められた研修を修了し、専門的な知識及び支援技術を持つ相談支援専門員を事業所に配置することにより算定できます。',
    seishin: '精神障害者の障害特性や支援技法に関する研修を終了している支援相談員を1名以上配置し、その旨を公表している場合に算定できる加算です。',
    nouKinou: '精神障害者の障害特性や支援技法に関する研修を終了している支援相談員を1名以上配置し、その旨を公表している場合に算定できる加算です。',
    kyotenKyouka: '精神障害者の障害特性や支援技法に関する研修を終了している支援相談員を1名以上配置し、その旨を公表している場合に算定できる加算です。',
    chiikiSeikatsu: '地域生活支援拠点等である特定相談支援事業所の相談支援専門員が、コーディネーターの役割を担うものとして相談を受け、連携する短期入所事業所への緊急時の受入れの対応を行った場合に、短期入所事業所への受入れ実績（回数）に応じて、月４回を限度として加算されます。',
    chiikiTaisei: '地域生活支援拠点等である特定相談支援事業所の相談支援専門員が、支援困難事例等についての課題検討を通じ、情報共有等を行い、他の福祉サービス等の事業者と共同で対応し、協議会に報告した場合に、利用者１人につき、１月につき１回を限度として所定単位数が加算されます。',
    kinoukyouka1: '地域生活支援拠点において、情報連携等を担うコディネーターの配置を評価する加算です。機能強化型利用支援を算定していることなどが要件になります。',
    kinoukyouka2: '地域生活支援拠点において、情報連携等を担うコディネーターの配置を評価する加算です。機能強化型継続支援を算定していることなどが要件になります。',
    kyotaku1: '相談支援事業者が居宅支援事業者を訪問し支援内容検討に協力した場合に算定できます。',
    kyotaku2: '相談支援事業者が居宅支援事業者の会議に参加し支援内容検討に協力した場合に算定できます。',
    kyotaku3: '相談支援事業者が居宅支援事業者を情報提供し支援内容検討に協力した場合に算定できます。',
    kyotaku1: '相談支援事業者が居宅支援事業者を訪問し支援内容検討に協力した場合に算定できます。',
    enkaku: '特別地域加算の対象区域に所在し、かつ、指定特定相談支援事業所との間に一定の距離がある利用者の居宅等、病院等その他機関を訪問して、初回加算などの加算を算定する場合に、これらの加算の算定回数に応じて加算できる加算です。',

  }
  const LC2024SoudanParts = () => {
    const keikakuMon = ['計画作成月', 'モニタリング月'];
    const tokuchiDispliction = ''
    const eachPrms = [
      // 虐待防止措置未実施減算
      // 業務継続計画未策定減算
      // 情報公表未報告減算
      {nameJp: '特地加算', discriptionText: texts.tokuchi},
      // {nameJp: '児童強化型利用支援地域生活支援拠点等機能強化加算', svcs: [SYOUGAI_SOUDAN], },
      // {nameJp: '児童強化型継続支援地域生活支援拠点等機能強化加算', svcs: [SYOUGAI_SOUDAN], },
      // {nameJp: '初回加算', },
      // {nameJp: '主任相談支援専門員配置加算', optPtn: 'roman2', },
      // {nameJp: '入院時情報連携加算', optPtn: 'roman2', },
      // {nameJp: '退院退所加算', optPtn: 'num3',},
      // {nameJp: '保育教育等移行支援加算（訪問）', svcs: [SYOUGAI_SOUDAN], },
      // {nameJp: '保育教育等移行支援加算（会議参加）', svcs: [SYOUGAI_SOUDAN], },
      // {nameJp: '保育教育等移行支援加算（情報提供）', svcs: [SYOUGAI_SOUDAN], },
      // {nameJp: '機関等連携加算', svcs: [SYOUGAI_SOUDAN], },
      // {nameJp: '機関等連携加算（面談）', optPtn: keikakuMon},
      // {nameJp: '機関等連携加算（通院同行）', optPtn: 'num3',},
      // {nameJp: '機関等連携加算（情報提供（病院等、それ以外））', },
      // {nameJp: '集中支援加算（訪問）', },
      // {nameJp: '集中支援加算（会議開催）', },
      // {nameJp: '集中支援加算（会議参加）', },
      // {nameJp: '集中支援加算（通院同行）', optPtn: 'num3',},
      // {nameJp: '集中支援加算（情報提供（病院等、それ以外））', },
      // {nameJp: '遠隔地訪問加算（初回加算）', },
      // {nameJp: '遠隔地訪問加算（入院時情報連携加算Ⅰ）', },
      // この加算は障害と相談で選択肢が違う
      // {nameJp: '遠隔地訪問加算（退院退所加算）', optPtn: 'num3', svcs: [KEIKAKU_SOUDAN]},
      // {nameJp: '遠隔地訪問加算（退院退所加算）', svcs: [SYOUGAI_SOUDAN]},
      // {nameJp: '遠隔地訪問加算（保育教育等移行支援加算・訪問）', svcs: [SYOUGAI_SOUDAN]},
      // {nameJp: '遠隔地訪問加算（機関等連携加算・面談）', optPtn: keikakuMon},
      // {nameJp: '遠隔地訪問加算（機関等連携加算・通院同行）', optPtn: 'num3',},
      // {nameJp: '遠隔地訪問加算（集中支援加算・訪問）', },
      // {nameJp: '遠隔地訪問加算（集中支援加算・通院同行）', optPtn: 'num3',},
      // {nameJp: '担当者会議実施加算', },
      // {nameJp: 'モニタリング加算', },
      // {nameJp: '行動障害支援体制加算', optPtn: 'roman2', },
      {nameJp: '要医療児者支援体制加算', optPtn: 'roman2', discriptionText: texts.youIryou},
      {nameJp: '精神障害者支援体制加算', optPtn: 'roman2', discriptionText: texts.seishin},
      {nameJp: '高次脳機能障害支援体制加算', optPtn: 'roman2', discriptionText: texts.nouKinou},
      // {nameJp: 'ピアサポート体制加算', },
      {nameJp: '地域生活支援拠点等相談強化加算', discriptionText: texts.chiikiSeikatsu},
      {nameJp: '地域体制強化共同支援加算', discriptionText: texts.chiikiTaisei},
      {nameJp: '強化型利用支援地域生活支援拠点等機能強化加算', svcs: [KEIKAKU_SOUDAN], discriptionText: texts.kinoukyouka1},
      {nameJp: '強化型継続支援地域生活支援拠点等機能強化加算', svcs: [KEIKAKU_SOUDAN], discriptionText: texts.kinoukyouka2},
      {nameJp: '居宅介護支援事業所等連携加算（訪問）', svcs: [KEIKAKU_SOUDAN], discriptionText: texts.kyotaku1},
      {nameJp: '居宅介護支援事業所等連携加算（会議参加）', svcs: [KEIKAKU_SOUDAN], discriptionText: texts.kyotaku2},
      {nameJp: '居宅介護支援事業所等連携加算（情報提供）', svcs: [KEIKAKU_SOUDAN],discriptionText: texts.kyotaku3},
      {nameJp: '遠隔地訪問加算（居宅介護支援事業所等連携加算・訪問）', svcs: [KEIKAKU_SOUDAN],discriptionText: texts.enkaku},
    ]
    const style = {width: 600, display: 'flex', justifyContent: 'center'}
    const elms = eachPrms.map((e, i)=>{
      const addStyle = {}
      // if (i % 2 === 0) addStyle.backgroundColor = teal[50];
      // else addStyle.backgroundColor = '#fff';
      return (
        <div style={{...style, ...addStyle}} key={i}>
          <UnivAddictionSoudan
            uid={uid} size='large' dLayer={1} 
            nameJp={e.nameJp} svcs={e.svcs} optPtn={e.optPtn}
            labelOutside={false}
            discriptionText={e.discriptionText}
          />
        </div>
      )
    })
    return elms;
  }
  return (<>
    <GoBackButton posX={120} posY={0}/>
    <div className={classes.byUserAddiction}>
      <div className='title'>利用者別加算設定</div>
      <div className='userInfo'>
        <div className='small'>{stdDate.split('-')[0]}年{stdDate.split('-')[1]}月</div>
        <div className='large'>{thisUser.name.slice(0, 12)}</div>
        <div className='small'>{thisUser.ageStr}</div>
      </div>
      <form id = 'yuj78sb' className="addiction">
        <div className={classes.cntRow}>
          <KobetsuSuport1 uid={UID} size={displaySize} dLayer={1}/>
          <KobetsuSuport2 uid={UID} size={displaySize} dLayer={1} />
          <KobetsuSuport3 uid={UID} size={displaySize} dLayer={1} />
          <IryouCareJi uid={UID} size={displaySize} dLayer={1} />
          <IryouRenkei uid={UID} size={displaySize} dLayer={1} />
          {/* <KankeiRenkei uid={UID} size={displaySize} dLayer={1} /> */}
          <KyoudoKoudou uid={UID} size={displaySize} dLayer={1} />
          <KyoudoKoudou90 uid={UID} size={displaySize} dLayer={1} />
          <JinkouNaiji uid={UID} size={displaySize} dLayer={1} />
          <ShokujiTeikyou uid={UID} size={displaySize} dLayer={1} />

          <ShikakuTyoukaku uid={UID} size={displaySize} dLayer={1} />
          <SougeiKasanSettei uid={UID} size={displaySize} dLayer={1} />
          
          <TuusyoJiritsu uid={UID} size={displaySize} dLayer={1} />
          <ShokujiTeikyou uid={UID} size={displaySize} dLayer={1} />

          <Musyouka uid={UID} size={displaySize} dLayer={1} />
          {/* <JougenKanri uid={UID} size={displaySize} dLayer={1} /> */}
          <FukushiSenmonHaichi uid={uid} size={displaySize} dLayer={1} />
          <JiShidouKaHai1 uid={UID} size={displaySize} dLayer={1} />
          <KangoKahai uid={UID} size={displaySize} dLayer={1} />
          <SenmonShien uid={UID} size={displaySize} dLayer={1} />
          <TashiKeigen uid={UID} size={displaySize} dLayer={1} />
          <KeikakuMisakusei uid={UID} size={displaySize} dLayer={1} />
          <JihatsuKetsujo uid={UID} size={displaySize} dLayer={1} />
          <SougeiItteiJouken uid={UID} size={displaySize} dLayer={1} />
          <TokubetsuShien uid={UID} size={displaySize} dLayer={1} />
          <CareNeeds uid={UID} size={displaySize} dLayer={1} />
          <TyuukakuKyouka uid={UID} size={displaySize} dLayer={1} />
          <TyuukakuKyoukaJigyousyo uid={UID} size={displaySize} dLayer={1} />
          {/* 計画相談・障害児相談 */}
          {stdDate < LC2024 && <>
            <Tokuchi uid={UID} size={displaySize} dLayer={1} />
            <ChouhukuGensan uid={UID} size={displaySize} dLayer={1} />
            <YouIryouShien uid={UID} size={displaySize} dLayer={1} />
            <SeishinShien uid={UID} size={displaySize} dLayer={1} />
            <ChiikiKyoten uid={UID} size={displaySize} dLayer={1} />
            <ChiikiKyoudou uid={UID} size={displaySize} dLayer={1} />
          </>}
          {stdDate >= LC2024 && <>
            <LC2024SoudanParts/>
            <HohouTokuchi uid={UID} size={displaySize} dLayer={1} />
            
          </>}

        </div>
        {/* <div className={classes.cntRow}>
          <FormControlLabel
            control={
              <Checkbox
                checked={thisMonthOnly}
                onChange={handleChange}
                name={'thisMonthOnly'}
                color="primary"
              />
            }
            label='新しい月にこの変更を反映させない'
          />
        </div> */}
      </form>
      <NextUserDisp thisUser={thisUser} />
      <div className='buttonWrapper' style={buttonWrapperStyle}>
        <EditUserButton uid={UID}/>
        <ButtonGP
          color='secondary'
          label='キャンセル'
          onClick={()=>history.goBack()}
        />
        <ButtonGP
          color='primary'
          label='送信'
          type="submit"
          onClick={handleSubmit}
          disabled={scheduleLocked}
        />
      </div>
    </div>
    <SetUisCookieChkBox 
      p={uisCookiePos.addictionsDisplayLarge}
      label='加算項目などを拡大表示する。'
      setValue={setDisplayLarge}
      style={{margin: '16px auto', width: 600, paddingLeft: 120}}
    />
    <SetUisCookieChkBox 
      p={uisCookiePos.byUserAddictionWarning}
      label='加算設定警告を表示しない。'
      setValue={setNotDisplayWarning}
      style={{margin: '-32px auto', width: 600, paddingLeft: 120}}
    />

    <SchLokedDisplay />
    <Dispatcher idName={idName} scrollVal={scrollVal}/>
    {/* 警告ダイアログの追加 */}
    <Dialog
      open={warningDialog.open}
      onClose={handleCancel}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        {"注意：共通設定をお勧めします"}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {warningDialog.message}
          <ul style={{
            paddingLeft: 16, marginTop: 8, marginBottom: 8,
            color: red[800],
          }}>
            {warningDialog.keys.map((key, index) => (
              <li key={index}>{key}</li>
            ))}
          </ul>
          これらの項目は事業所や単位の共通設定として設定することをお勧めします。
          このまま個別設定を続けますか？
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <ButtonGP
          color='secondary'
          label='キャンセル'
          onClick={handleCancel}
        />
        <ButtonGP
          color='primary'
          label='続行'
          onClick={handleProceed}
        />
      </DialogActions>
    </Dialog>
  </>)
}
export default ByUserAddictionNoDialog