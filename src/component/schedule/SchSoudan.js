import React, {useEffect, useRef, useState} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SideSectionUserSelect } from './SchByUser2';
import { Button, makeStyles } from '@material-ui/core';
import { SchInitilizer } from './SchInitilizer';
import { ChiikiKyoten, ChiikiKyoudou, IkouShienSoudan, IkouShienSoudanJouhou, KeizokuServiceShien, KikanRenkei, KoudaouSyougaiShien, KyotakuRenkei, KyotakuRenkeiJouhou, MonitorDate, Monitoring, NyuuinRenkei, ServiceRiyouShien, SyuuTyuuShienHoumon, SyuuTyuuShienKaisai, SyuuTyuuShienSanka, TaiinTaisyo, TantousyaKaigi, UnivAddictionSoudan } from '../common/SoudanAddictionFormParts';
import * as Actions from '../../Actions';
import { convUID, getFormDatas, getUser, parsePermission } from '../../commonModule';
import { KEIKAKU_SOUDAN, SYOUGAI_SOUDAN } from '../../modules/contants';
import { getTemplate, sendPartOfSchedule, setRecentUser, univApiCall } from '../../albCommonModule';
import { SyokaiKasan } from '../common/AddictionFormParts';
import SnackMsg from '../common/SnackMsg';
import { red, teal } from '@material-ui/core/colors';
import { getLocalStorage, setLocalStorage } from '../../modules/localStrageOprations';
import { ActualCostCheckBox } from '../common/StdFormParts';
import { FreeActualCost } from './SchEditDetailDialog';
import { LC2024 } from '../../modules/contants';
import { YesNoDialog } from '../common/GenericDialog';
import DeleteIcon from '@material-ui/icons/Delete';
import { LinksTab } from '../common/commonParts';
import { soudanMenu } from './Sch2';


const useStyles = makeStyles({
  soudanFormRoot: {
    width: 800, marginLeft: 'calc((100% - 800px) / 2)',
    '& .fpRow': {display: 'flex', padding: 8, flexWrap: 'wrap'},
    '& .btnWrap': {
      textAlign: 'right',
      position: 'fixed',
      bottom: 16, right: 24,
      '& .MuiButtonBase-root': {marginInlineStart: 8},
    },
    '& .title': {
      textAlign: 'center', marginTop: 16, marginBottom: 24,
      '& .main': {fontSize: '1.1rem', padding: 8, marginBottom: 8},
      '& .user': {fontSize: '.9rem',},
      '& .user .name': {fontSize: '1.2rem', color: teal[800], marginInlineEnd: 8},
      '& .user .attr': { marginInlineStart: 16},
    },
  },
  deleteConfirmTrue: {
    backgroundColor: red[800], color: "#fff",
    '&:hover': {backgroundColor: red[900],},
  }
});
const SchSoudanDetail = (props) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const allState = useSelector(s=>s);
  const {stdDate, hid, bid, users} = allState;
  const {uid, sch, setSch} = props;
  // ここではdidは固定 stdDateをdid形式に。
  const did = 'D' + stdDate.replace(/\-/g, '');
  // const [sch, setSch] = useState(JSON.parse(JSON.stringify(schedule)));
  const [res, setRes] = useState();
  const [snack, setSnack] = useState({msg: '', severity: ''});
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [yesNoDialogOpen, setYesNoDialogOpen] = useState(false);
  // 自由実費項目 open close 値保持用
  const [freeACostOpen, setFreeAconstOpen] = useState({open:false, value:0});
  const actualCostList = useSelector(state => state.config.actualCostList)
  const user = getUser(uid, users);
  const uids = convUID(uid).str;
  useEffect(()=>{
    if (!sch[uids] || !Object.keys(sch[uids] ?? {})){
      const t = {...sch};
      t[uids] = {};
      const u = getTemplate(allState, {}, uids).weekday;
      t[uids][did] = {...u}
      setSch(t);
    }
  }, [uid])

  useEffect(()=>{
    // ノード喪失時にdispatch実行
    return (()=>{
      setTimeout(()=>{
        // node消失確認
        const closed = !document.querySelector('#er5r677');
        // const prmsExist = (Object.keys(res ?? {}).length > 0);
        if (closed){
          const t = {...sch, timestamp: new Date().getTime()}
          dispatch(Actions.setStore({schedule: t}));          
        }
      }, 100);
    })
  }, [sch]);

  
  const handleDelete = () => {
    if (!deleteConfirm){
      setDeleteConfirm(true);
      return;
    }
    const partOfSch = {[convUID(uid).str]: {[did]: {dAddiction: {}}}};
    sendPartOfSchedule(
      {hid, bid, date:stdDate, partOfSch}, 
      setRes, setSnack, `${user.name}さんの利用を削除しました。`
    );
    setSch({...sch, ...partOfSch});
    setRecentUser(uid);
    setDeleteConfirm(false);
    return;
  }
  const handleCancel = () => {
    dispatch(Actions.resetStore());
  }
  const handleSubmit = () => {
    const trg = sch[convUID(uid).str];
    const tObj = (typeof trg === 'object' && !Array.isArray(trg))
    ? trg : {[did]: {dAddiction: {}}};
    const select = document.querySelectorAll('#er5r677 select');
    const input = document.querySelectorAll('#er5r677 input');
    const fDatas = getFormDatas([select, input]);
    // 実費項目の処理
    Object.keys(fDatas.actualCost).map(e => {
      if (fDatas.actualCost[e]) {
        fDatas.actualCost[e] = actualCostList[e];
      }
      else {
        delete fDatas.actualCost[e];
      }
    });
    // 実費項目に自由項目を追加
    if (fDatas.freeACostName){
      fDatas.actualCost = {
        ...fDatas.actualCost, 
        [fDatas.freeACostName]: fDatas.freeACostValue
      }
      delete fDatas.freeACostName;
    }
    // // 実費項目を作成
    tObj[did].actualCost = fDatas.actualCost;
    delete fDatas.actualCost;
    // did配下にdaddictionを作成
    tObj[did].dAddiction = {...fDatas};
    const partOfSch = {[convUID(uid).str]: tObj};
    console.log(partOfSch, 'partOfSch');
    sendPartOfSchedule(
      {hid, bid, date:stdDate, partOfSch}, 
      setRes, setSnack, `${user.name}さんの利用を書き込みしました。`
    );
    setSch({...sch, ...partOfSch});
    setRecentUser(uid);
    return false;
  }
  // const template = getTemplate(allState, sch, uid);
  const LC2024SoudanParts = () => {
    const keikakuMon = ['計画作成月', 'モニタリング月'];
    const eachPrms = [
      // 虐待防止措置未実施減算
      // 業務継続計画未策定減算
      // 情報公表未報告減算
      {nameJp: 'サービス利用支援', optPtn: 'normalWithGensan'},
      {nameJp: '継続サービス利用支援', optPtn: 'normalWithGensan'},
      // {nameJp: '特地加算', },
      {nameJp: '児童強化型利用支援地域生活支援拠点等機能強化加算', svcs: [SYOUGAI_SOUDAN], },
      {nameJp: '児童強化型継続支援地域生活支援拠点等機能強化加算', svcs: [SYOUGAI_SOUDAN], },
      {nameJp: '初回加算', },
      {nameJp: '主任相談支援専門員配置加算', optPtn: 'roman2', },
      {nameJp: '入院時情報連携加算', optPtn: 'roman2', },
      {nameJp: '退院退所加算', optPtn: 'num3',},
      {nameJp: '保育教育等移行支援加算（訪問）', svcs: [SYOUGAI_SOUDAN], },
      {nameJp: '保育教育等移行支援加算（会議参加）', svcs: [SYOUGAI_SOUDAN], },
      {nameJp: '保育教育等移行支援加算（情報提供）', svcs: [SYOUGAI_SOUDAN], },
      {nameJp: '機関等連携加算（面談）', optPtn: keikakuMon},
      {nameJp: '機関等連携加算（通院同行）', optPtn: 'num3',},
      {nameJp: '機関等連携加算（情報提供（病院等、それ以外））', },
      {nameJp: '集中支援加算（訪問）', },
      {nameJp: '集中支援加算（会議開催）', },
      {nameJp: '集中支援加算（会議参加）', },
      {nameJp: '集中支援加算（通院同行）', optPtn: 'num3',},
      {nameJp: '集中支援加算（情報提供（病院等、それ以外））', },
      {nameJp: '遠隔地訪問加算（初回加算）', },
      {nameJp: '遠隔地訪問加算（入院時情報連携加算Ⅰ）', },
      // この加算は障害と相談で選択肢が違う
      {nameJp: '遠隔地訪問加算（退院退所加算）', optPtn: 'num3', svcs: [KEIKAKU_SOUDAN]},
      {nameJp: '遠隔地訪問加算（退院退所加算）', svcs: [SYOUGAI_SOUDAN]},
      {nameJp: '遠隔地訪問加算（保育教育等移行支援加算・訪問）', svcs: [SYOUGAI_SOUDAN]},
      {nameJp: '遠隔地訪問加算（機関等連携加算・面談）', optPtn: keikakuMon},
      {nameJp: '遠隔地訪問加算（機関等連携加算・通院同行）', optPtn: 'num3',},
      {nameJp: '遠隔地訪問加算（集中支援加算・訪問）', },
      {nameJp: '遠隔地訪問加算（集中支援加算・通院同行）', optPtn: 'num3',},
      {nameJp: '担当者会議実施加算', },
      {nameJp: 'モニタリング加算', },
      {nameJp: '行動障害支援体制加算', optPtn: 'roman2', },
      {nameJp: '要医療児者支援体制加算', optPtn: 'roman2', },
      {nameJp: '精神障害者支援体制加算', optPtn: 'roman2', },
      {nameJp: '高次脳機能障害支援体制加算', optPtn: 'roman2', },
      {nameJp: 'ピアサポート体制加算', },
      {nameJp: '地域生活支援拠点等相談強化加算', },
      {nameJp: '地域体制強化共同支援加算', },
      {nameJp: '強化型利用支援地域生活支援拠点等機能強化加算', svcs: [KEIKAKU_SOUDAN]},
      {nameJp: '強化型継続支援地域生活支援拠点等機能強化加算', svcs: [KEIKAKU_SOUDAN]},
      {nameJp: '居宅介護支援事業所等連携加算（訪問）', svcs: [KEIKAKU_SOUDAN]},
      {nameJp: '居宅介護支援事業所等連携加算（会議参加）', svcs: [KEIKAKU_SOUDAN]},
      {nameJp: '居宅介護支援事業所等連携加算（情報提供）', svcs: [KEIKAKU_SOUDAN]},
      {nameJp: '遠隔地訪問加算（居宅介護支援事業所等連携加算・訪問）', svcs: [KEIKAKU_SOUDAN]},
    ]
    const style = {width: 600, display: 'flex', justifyContent: 'center'}
    const elms = eachPrms.map((e, i)=>{
      const addStyle = {}
      if (i % 2 === 0) addStyle.backgroundColor = teal[50];
      else addStyle.backgroundColor = '#fff';
      return (
        <div style={{...style, ...addStyle}} key={i}>
          <UnivAddictionSoudan 
            uid={uid} did={did} size='middleL' dLayer={3} schedule={sch}
            nameJp={e.nameJp} svcs={e.svcs} optPtn={e.optPtn}
          />
        </div>
      )
    })
    return elms;
  }
  return (
    <div className={classes.soudanFormRoot}>
      <form id='er5r677'>
        <div className='title'>
          <div className='main'>計画・障害児相談支援利用設定</div>
          <div className='user'>
            <span className='name'>{user.name}</span>さま
            <span className='attr'>{user.ageStr}</span>
          </div>
        </div>
        {stdDate < LC2024 &&
          <div className='fpRow'>
            <ServiceRiyouShien uid={uid} did={did} size='middleL' dLayer={3} schedule={sch}/>
            <KeizokuServiceShien uid={uid} did={did} size='middleL' dLayer={3} schedule={sch}/>
            <SyokaiKasan 
              uid={uid} did={did} size='middleL' dLayer={3} schedule={sch}
              label='相談初回加算' svcsStr={`${KEIKAKU_SOUDAN},${SYOUGAI_SOUDAN}`}
            />
            <TaiinTaisyo uid={uid} did={did} size='middleL' dLayer={3} schedule={sch}/>
            <KyotakuRenkei uid={uid} did={did} size='middleL' dLayer={3} schedule={sch}/>
            <KyotakuRenkeiJouhou uid={uid} did={did} size='middleL' dLayer={3} schedule={sch}/>
            <IkouShienSoudan uid={uid} did={did} size='middleL' dLayer={3} schedule={sch}/>
            <IkouShienSoudanJouhou uid={uid} did={did} size='middleL' dLayer={3} schedule={sch}/>
            <KikanRenkei uid={uid} did={did} size='middleL' dLayer={3} schedule={sch}/>
            <TantousyaKaigi uid={uid} did={did} size='middleL' dLayer={3} schedule={sch}/>
            <Monitoring uid={uid} did={did} size='middleL' dLayer={3} schedule={sch}/>
            <ChiikiKyoten uid={uid} did={did} size='middleL' dLayer={3} schedule={sch}/>
            <KoudaouSyougaiShien uid={uid} did={did} size='middleL' dLayer={3} schedule={sch}/>
            <SyuuTyuuShienHoumon uid={uid} did={did} size='middleL' dLayer={3} schedule={sch}/>
            <SyuuTyuuShienKaisai uid={uid} did={did} size='middleL' dLayer={3} schedule={sch}/>
            <SyuuTyuuShienSanka uid={uid} did={did} size='middleL' dLayer={3} schedule={sch}/>
            <ChiikiKyoudou uid={uid} did={did} size='middleL' dLayer={3} schedule={sch}/>
            <NyuuinRenkei uid={uid} did={did} size='middleL' dLayer={3} schedule={sch}/>
          </div>
        }
        {stdDate >= LC2024 &&
          <div className='fpRow' style={{justifyContent: 'center'}}>
            <LC2024SoudanParts />
          </div>

        }
        <div className='fpRow' style={{marginLeft: 100}}>
          <MonitorDate  uid={uid} did={did} size='middleL' dLayer={3} schedule={sch}/>
        </div>
        <div className='fpRow' style={{marginLeft: 100}}>
          <ActualCostCheckBox uid={convUID(uid).str} did={did} value={sch}/>
          <FreeActualCost 
            uid={convUID(uid).str} did={did} schedule={sch} 
            freeACostOpen={freeACostOpen} setFreeAconstOpen={setFreeAconstOpen}
          />
        </div>
      </form>
      <div style={{height: 48}}></div>
      <div className='btnWrap'>
        <Button
          className={deleteConfirm? classes.deleteConfirmTrue: ''}
          variant='contained' 
          onClick={handleDelete}
          startIcon={<DeleteIcon/>}
        >
          {deleteConfirm? '削除実行': '削除'}
        </Button>
        <Button
          variant='contained' color='secondary'
          onClick={handleCancel}
        >
          キャンセル
        </Button>
        <Button
          variant='contained' color='primary'
          onClick={handleSubmit}
        >
          書き込み
        </Button>
      </div>
      <SnackMsg {...snack} />
    </div>
  )
}

export const SchSoudan = () => {
  const allState = useSelector(s=>s);
  const {users, schedule, account} = allState;
  const [suid, setSuid] = useState(users[0].uid);
  const [userAttr, setUserAttr] = useState([]);
  const appPageSStyle = {marginTop: 80}
  const [sch, setSch] = useState(JSON.parse(JSON.stringify(schedule)));

  const permission = parsePermission(account)?.[0]?.[0] ?? 0;
  return (
    <>
    <LinksTab menu={soudanMenu} />
    <div className='AppPage' style={appPageSStyle}>
      <SideSectionUserSelect 
        suid={suid} setSuid={setSuid} 
        userAttr={userAttr} setUserAttr={setUserAttr}
        sch={sch}
      />
      <SchSoudanDetail uid={suid} sch={sch} setSch={setSch}/>
      <SchInitilizer/>
    </div>
    </>
  )
}