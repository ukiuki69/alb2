import React, {useEffect, useState, useRef} from 'react';
// import Login from './component/common/Login'
import { useDispatch, useSelector } from 'react-redux';
// import * as Actions from './Actions'
import { AccordionActions, makeStyles } from '@material-ui/core';
import SnackMsg from '../common/SnackMsg';
// import UseEffectTest from './component/common/useEffectTest';
import { useHistory } from 'react-router-dom';
// import { SideToolBar, } from './DrowerMenu'
// import { UserSelectDialog, ServiceNotice} from './component/common/commonParts';
// import * as mui from './component/common/materialUi';
// import * as sfp from './component/common/StdFormParts';
import { Link, useLocation } from 'react-router-dom';
// import CheckProgress from './component/common/CheckProgress';
import * as comMod from '../../commonModule';
import * as albcm from '../../albCommonModule';
import * as thunks from '../../modules/thunks';
import { ArrowForwardIos, CenterFocusStrong, RepeatRounded, ReplyAll, TrendingUp } from '@material-ui/icons';
import axios from 'axios';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import PhotoCamera from '@material-ui/icons/PhotoCamera';
import { LoadingSpinner,LoadErr } from '../common/commonParts';
import DescriptionIcon from '@material-ui/icons/Description';
import CheckIcon from '@material-ui/icons/Check';
import { teal, red, grey, blue } from '@material-ui/core/colors';
import ClearIcon from '@material-ui/icons/Clear';
import useInterval from 'use-interval';
import ReplayIcon from '@material-ui/icons/Replay';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import { Links } from "../Setting/Setting";

// ファイルアップロード完了してからファイル解析開始までの秒数
const fileUploadWait = 3; // .5でもエラーは発生していないけど念の為

// 直近の処理結果を何分前まで表示するか
const estMinMax = 10;

const useStyles = makeStyles({
  fsconRoot: {
    width: 600, margin: '0 auto',
    '& > *': {margin: 8},
    '& .input': {display: 'none'},
    '& .senddingDisp': {lineHeight: 1.4, textAlign: 'justify'},
    '& .fileNameDisplay' : {lineHeight: 1.4, color: blue[600]},
    '& .notice': {
      lineHeight: 1.6, fontSize: '1.1rem', color: red[900],
      '& > span': {fontSize: '.7rem', opacity: .6},
    },
    '& .small': {fontSize: '.9rem'},
    '& .rcvSuccess': {
      marginTop: 24,
      '& .time': {fontSize: '.9rem'},
      '& .title': {
        fontSize: '1.5rem', color: teal[800], marginTop: 8, marginBottom: 8
      },
      '& .errTitle': {
        fontSize: '1.5rem', color: red[900],
        marginTop: 16, marginBottom: 8,
        '& >div': {color:grey[600], fontSize:'.7rem', marginTop: 2}
      },
      '& .parseErrDetail': {
        display: 'flex',marginTop: 8, marginBottom: 8,
        '& >div': {padding: '2px 8px 2px 0'},
      },
      '& .fixIt': {color: teal[800], marginTop: 8, marginBottom: 8},
      '& .buttonWrap': {marginTop: 16, marginBottom: 16}
    },
    '& .rcvNormal': {marginTop: 24},
    '& .rcvErr': {marginTop: 24, color: red[900]},
  },
  help: {
    '& > a': {
      display:'flex', alignItems: 'center', padding:'8px 0',
      '& .MuiSvgIcon-root': {marginInlineEnd: 8, color: blue[800]}
    }
  },
});

const sendAllState = async (prms) => {
  const {allState, setRes, setSnack} = prms;
  // {hid, bid, date, jino, item, state, } 
  const hid = allState.com.hid;
  const bid = allState.com.bid;
  const jino = allState.com.jino;
  const date = allState.stdDate;
  const sendData = {
    schedule: allState.schedule,
    users: allState.users,
    com: allState.com,
    dateList: allState.dateList,
    scheduleTemplate: allState.scheduleTemplate,
    serviceItems: allState.serviceItems,
    account: allState.account, // 2022/01/29 追加した
  };
  const sendPrms = {
    hid, bid, jino, date, item:'allState', state: JSON.stringify(sendData)
  };
  const r = await albcm.sendSomeState(
    sendPrms, setRes, setSnack, '内部データを送信しました。'
  );
  return r;
}

const sendHidBid = async (prms) => {
  const {allState, setRes, setSnack} = prms;
  // {hid, bid, date, jino, item, state, } 
  const hid = allState.com.hid;
  const bid = allState.com.bid;
  const jino = allState.com.jino;
  const date = allState.stdDate;
  const sendData = {hid, bid};
  const sendPrms = {
    hid, bid, jino, date, item:'hidbid', state: JSON.stringify(sendData)
  };
  const r = await albcm.sendSomeState(
    sendPrms, setRes, setSnack, '事業所IDを送信しました。'
  );
  return r;
}

const fetchFsConResult = async (prms) => {
  const {jino, date, setFsResult} = prms;
  prms.item = 'fsconResult';
  const r = await albcm.fetchSomeState(prms);
  await setFsResult(r);
  return true;
}
// 事業所情報エラー表示
const ParseErrDetail = (props) => {
  const {dt, title} = props;
  const detail = dt.map((e, i)=>{
    let d = e.did? comMod.convDid(e.did): false;
    d = d? comMod.formatDate(d, 'MM月DD日'): false;
    return (
      <div className='parseErrDetail' key = {i}>
        <div className='field'>{e.field}</div>
        {e.name !== undefined &&
          <div className='name'>{e.name}</div>
        }
        {d !== false &&
          <div className='name'>{d}</div>
        }
        {d === "" &&
          <div className='name'>'不正な日付を検出'</div>
        }
      </div>
    )
  });
  if (!dt.length){
    return null;
  }
  else{
    return(<>
      <div className='errTitle'>
        {title}情報エラー
        <div>
          以下の項目が見つからないか値が不正です。エクセルファイルを確認して下さい。
        </div>
      </div>
      {detail}
    </>)
  }
}

// 送信結果を表示する
const RecievedResult = () => {
  const com = useSelector(state=>state.com);
  const stdDate = useSelector(state=>state.stdDate);
  const jino = com.jino;
  const [fsResult, setFsResult] = useState({});
  const prms =  {jino, date: stdDate, setFsResult, };
  // この処理、ワーニングが出るけど対象方法がががが
  useEffect(()=>{
    if (!Object.keys(fsResult).length){
      fetchFsConResult(prms);
    }
  }, []);
 
 
  useInterval(()=>{
    fetchFsConResult(prms);
  }, 15000)
  useEffect(()=>{
    console.log(fsResult, 'fsResult');
  }, [fsResult]);
  const FsError = () => {
    return (
      <div className='rcvErr'>
        通信エラーが発生しています。インターネット接続環境を見直しして
        再度実行して下さい。<br></br>
        インターネット接続に問題がないのに複数回このメッセージが表示されるときは
        管理者またはサポートに連絡して下さい。
      </div>
    )
  }
  const FsNodata = () => {
    return (
      <div className='rcvNormal'>
        まだ集計結果はありません。
      </div>
    )
  }
  const FsNormal = () => {
    const v = {...fsResult.data.dt[0]};
    const timestamp = v.timestamp;
    const dt = [...v.state];
    const result = (dt.filter(e=>e.result).length)? true: false;
    const dtSuccess = dt.filter(e=>e.result)[0];
    const dtParseErr = dt.filter(e=>!e.result);
    const brunchErr = dtParseErr.filter(e=>e.item === 'brunch');
    const userErr = dtParseErr.filter(e=>e.item === 'user');
    const cityErr = dtParseErr.filter(e=>e.item === 'city');
    const scheduleErr = dtParseErr.filter(e=>e.item === 'schedule');
    const jougenErr = dtParseErr.filter(e=>e.item === 'jogen');
    // timestampから 前回の処理時間からの経過分を求める
    const t = timestamp.split(/[\-\s:]/).map(e=>parseInt(e));
    const tsTime = new Date(t[0], t[1] - 1, t[2], t[3], t[4], t[5]);
    const estMin = Math.floor((new Date().getTime() - tsTime) / 1000 / 60);
    console.log(estMin, 'estMin');
    const stdDate = useSelector(state => state.stdDate);
    const hid = useSelector(state => state.hid);
    const bid = useSelector(state => state.bid);
    const weekDayDefaultSet = 
      useSelector(state => state.config.weekDayDefaultSet);
    const dispatch = useDispatch();
    const clickHandler = () => {
      const prms = {stdDate, hid, bid, weekDayDefaultSet, dispatch, };
      thunks.fetchAll(prms);
    }
    if (dtSuccess && estMin < estMinMax){
      return (
        <div className='rcvSuccess'>
          <div className='time'>集計時刻: {timestamp}</div>
          <div className='title'>正常終了</div>
          <div className='content'>利用者数 {dtSuccess.userCnt} 人</div>
          <div className='content'>利用件数 {dtSuccess.scheduleCnt} 件</div>
          <div className='fixIt'>
            読み込みが完了しました。結果の確定ボタンを押してクラウドとの同期を行って下さい。
          </div>
          <div className='buttonWrap'>
            <Button 
              variant="contained" color="primary" component="span"
              onClick={clickHandler}
              startIcon={<ReplayIcon/>}
            >
              結果の確定
            </Button>
          </div>
        </div>
      )
    }
    else if (dtSuccess){
      return (
        <div className='rcvSuccess'>
          <div className='content'>直近の集計データはありません。</div>
        </div>
      )
    }
    else {
      return(
        <div className='rcvSuccess'>
          <div className='time'>集計時刻: {timestamp}</div>
          <ParseErrDetail dt={brunchErr} title='事業所' />
          <ParseErrDetail dt={cityErr} title='市区町村' />
          <ParseErrDetail dt={userErr} title='利用者' />
          <ParseErrDetail dt={scheduleErr} title='利用' />
          <ParseErrDetail dt={jougenErr} title='上限管理' />
        </div>      
      )
    }
  }
  if (!fsResult.data){
    return null;
  }
  else if (!fsResult.data.result){
    return <FsError />
  }
  else if (!fsResult.data.dt.length){
    return <FsNodata/>
  }
  else{
    return <FsNormal/>

  }

}

const MainFsCon = () => {
  const com = useSelector(state=>state.com);
  const jino = com.jino;
  const allState = useSelector(state=>state);
  const mail = allState.account.mail;
  const stdDate = allState.stdDate;
  const [files, setFiles] = useState([]);
  const [responces, setResponces] = useState([]);
  const [snack, setSnack] = useState({msg: '', severity: ''});
  const [sending, setSending] = useState({
    v: 0, // 0は未実行 1 実行中 2 完了 3 エラー
    t: `ファイルの指定をして下さい。複数ファイルが有るときは一つづつ追加して下さい。`
  });
  const classes = useStyles();
  // 複数のファイルをアップロードするとレスポンスを格納するステートを更新する
  // レスポンスの数が送信したファイルの数と一致したら次のアクションに移る
  useEffect(()=>{
    console.log(responces, 'responces');
    // ファイルが存在してレスポンスが完了しいていたら
    if (responces.length === files.length && files.length){
      let r = true; // 配列なめてすべてのresultを確認
      responces.forEach((e, i)=>{
        if (!e.data){
          r = false;
          return false;
        }
        if (!e.data.result){
          r = false;
          return false;
        }
      });
      setFiles([]); // 送信ファイルリストのクリア
      if (r){
        setSnack({msg: 'Excelファイルの送信が完了しました。', severity:''});
      }
      else{
        setSnack({msg: 'Excelファイルの送信に失敗しました', severity:'warning'});
      }
    }
  }, [responces]);
  
  const fileChangeHndler = (e) => {
    const t = e.currentTarget.files[0];
    console.log(t);
    if (t){
      // 古いエクセルファイル
      if (t.name.toLowerCase().match(/\.xls$/)){
        setSnack({msg:'古いエクセルファイルは使えません。', severity: 'warning'})
      }
      else{
        const a = [...files];
        a.push(t);
        setFiles(a);
      }
    }
  }

  const uploadFiles = () => {
    if (!files.length){
      return false;
    };
    console.log('hoge');
    // const elm = document.querySelector('#fileupload');
    const ress = []; // レスポンスをためておく配列
    files.forEach((e, i)=>{
      let prms = new FormData();
      const fname = e.name;
      console.log(fname, 'fname');
      const ext = fname.split('.').slice(-1)[0]; // 拡張子を取得
      // if (newData)  fileCount.current = 0;
      prms.append('file', e, jino + '-' + i + '.' + ext);
      const url = 'https://houday.rbatos.com/api/up.php';
      const headers = {'content-type': 'multipart/form-data',}
      axios.post(url, prms, headers)
      .then(res=>{
        ress.push(res);
        setResponces([...ress]);
      })
      .catch(res=>{
        console.log('error', res);
      });
    });
  }

  const uploadClickHnadler = async () => {
    uploadFiles();
    const prms = {allState, setRes:'', setSnack:''};
    const fsPrms = {jino, mail, date:stdDate, setRes:'', setSnack:''};
    setSending({
      v: 1,
      t: '送信されたエクセルファイルを解析しています。'
    })
    const resAll = await sendAllState(prms);
    const resHidBid = await sendHidBid(prms);
    // 非同期処理のリトライをしようと思ったが諦めた
    // let resCnv = {};
    // const retrylimit = 5;
    // const f = async () => {
    //   for await (let a of Array(retrylimit)){
    //     if (!resCnv.result){
    //       resCnv = await albcm.fsConCnvExcel(fsPrms);
    //       console.log(resCnv, 'resCnv in loop.');
    //       await comMod.asyncSleep(5);
    //     }
    //   }
    // }
    // f();
    await comMod.asyncSleep(fileUploadWait);
    const resCnv = await albcm.fsConCnvExcel(fsPrms);
    console.log(resAll, resHidBid, resCnv, 'uploadClickHnadler');
    const result = (
      resAll.data.result && resHidBid.data.result && resCnv.data.result 
    );
    if (result){
      setSending({
        v: 2,
        t: `${resCnv.data.rowcnt}行のデータが格納されました。
        クラウド上で処理を開始しています。
        通常、数分程度で処理が完了します。
        アクセス集中時にはもう少し時間がかかることもありますのでご理解をお願いします。
        完了すると下記の完了情報が更新されます。
        更新が確認できるまで一切の操作をしないで下さい。`
      })
    }
    else if (resCnv.data.msg === "Wrong Date"){
      let t = 'エクセルファイルの月とシステムの月が不一致です。'
      setSending({
        v: -1, t 
      })
    }
    else if (resCnv.data.msg === "Wrong File"){
      let t = 'エクセルファイルが不正です。事業所番号や設定月などを確認して下さい。'
      setSending({
        v: -1, t 
      })
    }
    else if (resCnv.data.msg === "SQL Error"){
      let t = 'エセルファイル解析中のエラー、またはサーバー側での実行エラーが発生しています。'
      + 'エクセル内に不正な記述がないか再確認して下さい。'
      setSending({
        v: -1, t 
      })
    }
    else {
      let t = `変換作業中にエラーが発生しました。インターネット接続を見直しして
      再実行してみて下さい。複数回実行して同じ結果であれば管理者または
      サポートまで連絡して下さい。
      `
      setSending({
        v: -1, t 
      })
    }
  }
  const fileNames = files.map((e, i)=>{
    return (
      <div className='oneFileName' key={i}>{e.name}</div>
    )
  });
  const addFileButtonDisabled = (sending.v === 0)? false: true;
  const sendButtonDisabled = (files.length > 0)? false: true;
  return(
    <div className='AppPage proseed' style={{marginTop:80}}>
      <Links />
      <div className={classes.fsconRoot}>
        <div className='notice'>
          福祉<span>の</span>ソフトのエクセルファイル（日報）を集計します。
          処理を実行すると今月のデータはすべてクリアされ
          利用者情報や加算設定なども変更されます。
          実行するときは慎重にお願いします。
        </div>
        <div className='notice small'>
          古いタイプのエクセルファイル(Excel97-2004)はご利用になれません。
          新しいタイプ(エクセルブック)に変換して下さい。
        </div>
        <div className='notice small'>
          原則として請求が出来る段階の完成したエクセルファイルを読み込むことを想定しています。
          月の途中で実行することは想定していません。
        </div>
        <input
          id='fileupload-button'
          type="file" name="excel" accept=".xlsx"
          onChange={fileChangeHndler}
          className='input'
        />
        <div className={classes.help}>
          <a href='https://rbatos.com/lp/2022/06/28/importexcel/' target='_blank'>
            <HelpOutlineIcon/>詳しくはこちらをご覧ください。
          </a>
        </div>
        <label htmlFor="fileupload-button">
          <Button 
            disabled={addFileButtonDisabled}
            variant="contained" color="primary" component="span"
            startIcon={<DescriptionIcon/>}
          >
            ファイルの追加
          </Button>
        </label>

        <Button 
          variant="contained" color="primary" component="span"
          onClick={uploadClickHnadler}
          disabled={sendButtonDisabled}
          startIcon={<CheckIcon/>}
        >
          ファイルの送信
        </Button>

        <Button 
          variant="contained" color="default" component="span"
          onClick={()=>{
            setFiles([]);
          }}
          disabled={sendButtonDisabled}
          startIcon={<ClearIcon/>}
        >
          取り消し
        </Button>

        <div className='senddingDisp'>
          {sending.t}
        </div>
        <div className='fileNameDisplay'>
          {fileNames}
        </div>
        <RecievedResult />
        <SnackMsg {...snack} />
      </div>
    </div>
  )
}

const FsCon = ()=>{
  const allstate = useSelector(state=>state);
  const loadingStatus = comMod.getLodingStatus(allstate);

  if (loadingStatus.loaded){
    return(<>
      <MainFsCon />
    </>)
  }
  else if (loadingStatus.error){
    return (<>
      <LoadErr loadStatus={loadingStatus} errorId={'E5958'} />
    </>)
  }
  else{
    return(<>
     <LoadingSpinner/>
    </>)
  }
}
export default FsCon;