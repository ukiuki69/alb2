import React, {useState, useEffect,useRef, } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getLodingStatus } from '../../commonModule';
import { LoadErr, LoadingSpinner } from '../common/commonParts';
import SnackMsg from '../common/SnackMsg';
import { sendPartOfSchedule, univApiCall } from '../../albCommonModule';
import axios from 'axios';
import { Button, Switch, makeStyles } from '@material-ui/core';
import * as Actions from '../../Actions';
import { blue, red, teal } from '@material-ui/core/colors';
import { permissionCheck } from '../../modules/permissionCheck';
import { PERMISSION_DEVELOPER } from '../../modules/contants';

const useStyles = makeStyles({
  restoreRoot :{
    '& h2' : {
      fontSize: '1rem', backgroundColor: teal[50],
      padding: "8px 0 8px 16px", 
      borderBottom: `1px solid ${teal[800]}`,
      color: teal[900],
      marginBottom: 16,
    },
    '& .text': {
      paddingBottom: 8, fontSize: '.9rem', lineHeight: 1.6,
      textAlign: 'justify',
      '& >p': {marginTop: 8},
    },
    '& .text.warning': {color: red[800]},
    '& .datas': {
      margin: '16px auto', width: 360,
      '& .row': {
        display: 'flex',
        '& .timestamp': {
          paddingTop: 24, paddingBottom: 24, transition: '.4s',
          marginLeft: 40, opacity: .6,
        },
        '& .timestamp.current': {color: blue[900], opacity: 1},
        '& .MuiSwitch-root': {marginLeft: 16, marginTop: 10, },
        '& .titleTs': {marginLeft: 40, width: 172, paddingBottom: 8},
        '& .titleSw': {paddingBottom: 8},
      },

    },
    '& .buttons': {
      textAlign: 'right', paddingBottom: 8, paddingTop: 8,
      '& > button': {marginInlineStart: 16},
      '& .MuiButtonBase-root.finalconfirm': {backgroundColor: red[800]}
    }
  },
});

/*
 * MainSchAutoBkRestore Componentは、バックアップデータのリストを取得し、
 * ユーザーが選択したバックアップを復元する機能を提供します。
 * コンポーネントがマウントされたとき、univApiCallを使ってバックアップデータのリストを非同期に取得します。
 * 
 * ステート"bkList"には取得したバックアップデータのリストが格納され、
 * "apiResponse"にはAPI呼び出しからの応答が格納されます。
 * 
 * ユーザーがバックアップデータを選択すると、スイッチの状態を管理するステート"switches"が更新され、
 * "confirm"ステートが更新されて、選択したバックアップデータを復元するか確認します。
 * 
 * ユーザーが復元を確認すると、再度APIを呼び出して選択したバックアップデータを復元します。
 * 復元後は、新たに取得したスケジュールデータを元にReduxストアのスケジュールデータを更新します。
 */

const MainSchAutoBkRestore = () => {
  const allstate = useSelector(state => state);
  const { hid, bid, stdDate,schedule } = allstate;
  const [bkList, setBkList] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);
  const [snack, setSnack] = useState({ msg: '', severity: '' });
  // スイッチの値を保持するための配列
  const [switches, setSwitches] = useState(null);
  // -1: データ選択なし 0:データ選択あり 1: データ選択済み、最終確認 
  const [confirm, setConfim] = useState(-1);
  const [buttonCnt, setButtonCnt] = useState({
    disabled: true,
    classNm: 'normal',
    buttonLabel: '復元',
  })
  const classes = useStyles();
  const dispatch = useDispatch();

  useEffect(() => {
    let isMounted = true;
    const source = axios.CancelToken.source();
  
    const fetchBkList = async () => {
      const p = { hid, bid, a: 'fetchSchBackupList' };
      const r = await univApiCall(
        p, 'E65564', '', setSnack,
        '保存済みバックアップリストを取得しました', '通信エラーが発生しました',
        false, source  // Pass cancelToken to univApiCall
      );
      if (isMounted) {
        setApiResponse(r);
      }
    };
    fetchBkList();
    return () => {
      isMounted = false;
      source.cancel('API call cancelled due to component unmounting');  // Cancel request
    };
  }, [hid, bid, stdDate, setSnack]);

  useEffect(() => {
    if (apiResponse && apiResponse.data.result) {
      const l = apiResponse.data.dt.filter(e => e.date === stdDate);
      setBkList(l);  // レスポンスに基づいてbkListを更新
      setSwitches(Array(l.length).fill(false)); // スイッチ用のステイトを設定
    }
  }, [apiResponse, stdDate]);  // 依存配列にapiResponseを設定
  // confirmstateの値を取得してボタンの状態などを制御する
  useEffect(()=>{
    let disabled = true;
    let classNm = 'normal';
    let buttonLabel = '復元';
    if (confirm === -1){
      disabled = true;
      classNm = 'normal';
      buttonLabel = '復元';
    }
    else if (confirm === 0){
      disabled = false;
      classNm = 'normal';
      buttonLabel = '復元';
    }
    else if (confirm === 1){
      disabled = false;
      classNm = 'finalconfirm';
      buttonLabel = '復元実行';
    }
    setButtonCnt({disabled, classNm, buttonLabel});

  }, [confirm])
  // スイッチのイベント
  const handleChange = (ev, i) => {
    // 一旦すべてがfalseの配列にする
    const t = Array(switches.length).fill(false);
    t[i] = ev.target.checked;
    if (ev.target.checked && confirm === -1){
      setConfim(0);
    }
    else if (!ev.target.checked && confirm === 0){
      setConfim(-1);
    }
    setSwitches(t);
  }
  const a = bkList? [...bkList]: [];
  const eachBkDatas = a.map((e, i)=>{
    const tsCurrentClass = (switches[i])? 'current': '';
    return (
      <div className='row' key={i}>
        <div className={'timestamp ' + tsCurrentClass}>
          {e.timestamp?.slice(0, -3)}
        </div>
        <Switch
          name={'chk-' + i}
          checked = {switches[i]}
          onChange={(ev) => handleChange(ev, i)}
        />
      </div>
    )
  });
  const handleClick = () => {
    const source = axios.CancelToken.source();
    if (confirm === 0)  setConfim(1); // 確認状態の変更
    if (confirm !== 1) return false; // 1以外は処理しない
    const i = bkList.findIndex(e=>e); // 選択されたバックアップのインデックス
    if (i === -1){
      setSnack({text: 'バックアップの選択が不正です。', severity: 'warning'});
      return false;
    }
    const created = bkList[i].created;

    const f = async () => {
      const p = { hid, bid, a: 'fetchSchBackup', date: stdDate, created };
      const r = await univApiCall(
        p, 'E65565', '', setSnack,'', '通信エラーが発生しました',
        false, source
      );
      if (!r.data?.result) return false;
      if (!r.data.dt[0]?.schedule)  return false;
      const t = JSON.parse(r.data.dt[0].schedule);
      const u = JSON.parse(JSON.stringify(schedule));
      const newSch = {...u, ...t};
      const sp = {hid, bid, date: stdDate, partOfSch: t, a: 'sendPartOfSchedule'};
      await univApiCall(
        sp, 'E65566', '', setSnack,
        'データを送信しました', '通信エラーが発生しました',
        false, source
      );
      newSch.timestamp = new Date().getTime();
      dispatch(Actions.setStore({schedule: newSch}));
    }
    f();
    
  }
  const handleCancelClick = () => {
    // スイッチをすべてオフにする
    const t = switches;
    t.fill(false);
    setSwitches(t);
    // 操作状態を初期にする
    setConfim(-1);
  }

  return (<>
    <div className={classes.restoreRoot}>
      <h2>自動バックアップの復元</h2>
      <div className='text'>
        <p>
          クラウド上で自動バックアップされた予定実績のデータを復元します。データを間違えて入力してしまったときなどにご活用下さい。
        </p>
        <p>
          バックアップは操作があっときのみ、1時間に1回作成されます。データの保持数は事業所ごとに制限があります。制限を超えたとき、古いデータから破棄されます。
          複数月にまたがって作業を行った場合は単月で見たときのバックアップ数は少なくなります。
        </p>
        <p>
          復元は予定実績データのみになります。利用者ごとに設定された加算などは復元されないことがありますので充分にご注意下さい。
        </p>
      </div>
      <div className='datas'>
        <div className='row'>
          <div className='titleTs'>データ日時</div>
          <div className='titleSw'>復元</div>
        </div>
        {eachBkDatas}
      </div>

      <div className='buttons'>
        {confirm === 1 &&
          <span className='text warning'>
            復元実行すると現在のデータは失われます。
          </span>
        }
        <Button
          variant='contained' color='secondary'
          onClick={handleCancelClick}
          disabled={buttonCnt.disabled}
        >
          キャンセル
        </Button>
        <Button
          className={buttonCnt.classNm}
          variant='contained' color='primary'
          onClick={handleClick}
          disabled={buttonCnt.disabled}
        >
          {buttonCnt.buttonLabel}
        </Button>
      </div>
    </div>
    <SnackMsg {...snack} />
  </>);
}



// 保存されたスケジュールのバックアップからリストアを選択してもらう
const SchAutoBkRestore = () => {
  const allstate = useSelector(state=>state);
  const loadingStatus = getLodingStatus(allstate);
  const permissioncheck = permissionCheck(PERMISSION_DEVELOPER, allstate.account);
  if (!permissioncheck) return null;
  if (loadingStatus.loaded){
    return(<>
      <MainSchAutoBkRestore />
      {/* <div id={normalId}></div> */}
    </>)
  }
  else if (loadingStatus.error){
    return (<>
      <LoadErr loadStatus={loadingStatus} errorId={'E664841'} />
      {/* <div id={notNormalId}></div> */}
    </>)
  }
  else{
    return(<>
     <LoadingSpinner/>
     {/* <div id={notNormalId}></div> */}
    </>)
  }

}
export default SchAutoBkRestore;