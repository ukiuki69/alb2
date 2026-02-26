import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setBillInfoToSch } from './blMakeData';
import { DAddictionContent, ExcahngeTotalizeButton, LoadingSpinner, PermissionDenied } from '../common/commonParts';
import { LoadErr } from '../common/commonParts';
import { 
  convHankaku, 
  findDeepPath, formatDate, formatNum, getDateEx, getLodingStatus, 
  parsePermission, randomStr,
  spfill,
  zen2han,
  zp,
} from '../../commonModule';
import { AddAlarm, RepeatRounded, TramRounded, TrendingUp, GetApp as GetAppIcon } from '@material-ui/icons';
import { SelectGp, } from '../common/FormPartsCommon';
import { Button, Checkbox, FormControlLabel, makeStyles } from '@material-ui/core';
import { genFKdatas, sendSomeState } from '../../albCommonModule';
import SnackMsg from '../common/SnackMsg';
import { blue, red, teal } from '@material-ui/core/colors';
import { DateInput } from '../common/StdFormParts';
import { faSleigh } from '@fortawesome/free-solid-svg-icons';
import { faLess } from '@fortawesome/free-brands-svg-icons';
import { KyoudoKoudou } from '../common/AddictionFormParts';
import { CALC2024 } from '../../Rev';
import { NotDispLowCh } from '../common/useSuspendLowChange';
import Encoding from 'encoding-japanese';
import { downloadCsv } from './utils/csvExporter';

const useStyles = makeStyles({
  cntRow: {display: 'flex', flexWrap:'wrap', minHeight: 88},
  buttonFKroot: {
    padding: 8, paddingTop: 16,
    '& .MuiButton-root': {minWidth: 140}
  },
  loading:{
    display: 'inline-flex', marginTop: 16,
    width: 140, height: 24, justifyContent: 'right', alignItems: 'center', 
    backGround: blue[100], color: blue[800],
  },
  checkboxRoot: {
    '& .MuiCheckbox-root': {padding:' 4px 12px'}
  },
  comAccountInfo: {
    display: 'flex', flexWrap: 'wrap', alignItems: 'end', padding: 8,
    marginBottom: 18,
    '& .label': {padding: 4, margin: '0, 4px 0 8px', fontSize: '.8rem'},
    '& .cont': {
      padding: 4, margin: '0, 8px 0 4px', fontSize: '1.1rem', color: teal[900]
    },
  },
  allowNoBankRoot: {
    padding: '16px 0 0 24px',
    '& .MuiCheckbox-root': {padding:' 4px'}
  },
  csvBtnRow: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '16px 0 0 40px',
    width: '100%',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 16,
    padding: '16px 0 16px 8px',
    width: '100%',
  },
});

const linkErase = 15; // リンク消失秒数

const fkItems = [
  {value: 'hamagin', label: '浜銀ファイナンス'},
  {value: 'std', label: '標準フォーマット'},
  // {value: 'mbs', label: 'MBS口振くん'},
  // {value: 'ufj', label: '三菱UFJニコス,共立コンピュータ'},
  // {value: 'yuucho', label: 'インターネット伝送ゆうちょ'},
  {value: 'fctSanin', label: '山陰信販ファクタリング'},
]

const downloadUrlRoot = 'https://houday.rbatos.com/'

const makeFactDt = (prms) => {
  const {masterRec, billingDt, allState} = prms;
  const {com} = allState;
  const {jino} = com;
  console.log(masterRec);
  const totalBilling = masterRec.totalized.reduce(
    (v, e) => (v + (e.userSanteiTotal - e.kanrikekkagaku)), 0
  )
  const r = [jino, masterRec.curMonth, masterRec.thisMonth, totalBilling];
  console.log(r, 'makeFactDt');
  return [r];
  
}

// ターゲットに応じたデータの作成をする
const makeData = (prms) => {
  const {allState, dt, target} = prms;
  const {com } = allState;
  // finddeeppath 
  const itakuCode = findDeepPath(com, 'etc.bank_info.委託者番号', '');
  const itakuName = findDeepPath(com, 'etc.bank_info.口座名義人', '');
  const bankCode = findDeepPath(com, 'etc.bank_info.金融機関番号', '');
  const brunchCode = findDeepPath(com, 'etc.bank_info.店舗番号', '');
  const syumokuName = findDeepPath(com, 'etc.bank_info.預金種目', '');
  const kouzaBango = findDeepPath(com, 'etc.bank_info.口座番号', '');
  if (target === 'fctSanin'){
    return (makeFactDt(prms));
  }
  
  // インプット要素より日付を取得 2022-04-01 -> 0401
  const FKdate = document.querySelector('#userbillingFKdate [name="振替日"')
  .value.replace(/\-/g, '').slice(-4);
  // ヘッダレコードのコード区分。何故か種類がある
  const headCodeKubun = {mbs: '2', hamagin: '2', std: '1'};
  const syumoku = {普通: '1', 当座: '2', 貯蓄: '4',}
  // const head0 = '191'; // 固定
  // const head1 = headCodeKubun[target]? headCodeKubun[target]: '1';
  // const head2Itaku = zp(itakuCode, 10); // 委託者番号
  // const head3Iname = spfill(convHankaku(itakuName), 40); // 委託者コード
  // const head5Date = spfill(FKdate, 4); // 引き落とし日
  // const head6bankCode = spfill(bankCode, 4); // 金融機関コード
  // const head7bankName = spfill('', 15); // 銀行名
  // const head8brunchCode = spfill(brunchCode, 15); // 銀行名
  const zenginHead = () => {
    const a = [
      '191', // 固定
      headCodeKubun[target]? headCodeKubun[target]: '1',
      zp(itakuCode, 10), // 委託者番号
      spfill(zen2han(itakuName), 40), // 委託者コード
      spfill(FKdate, 4), // 引き落とし日
      spfill(bankCode, 4), // 金融機関コード
      spfill('', 15), // 銀行名
      spfill(brunchCode, 3), // 支店コード
      spfill('', 15), // 支店名
      syumoku[syumokuName]? syumoku[syumokuName]: 1, // 預金種目 未入力は1
      zp(kouzaBango, 7),
      spfill('', 17), // 余白追加 2022/07/06

    ];
    let s = '';
    a.forEach(e=>{s += e});
    return s;
  }
  const zenginDetail = dt.filter(e=>e.check).map(e=>{
    let kokyakuCode;
    if (target === 'hamagin'){
      // 浜銀は８桁
      kokyakuCode = itakuCode? itakuCode.slice(-8) : zp(0, 8);
      kokyakuCode += zp(e.顧客コード.trim()? e.顧客コード: '0', 10);
    }
    else if (target === 'mbs'){
      kokyakuCode = itakuCode? itakuCode.slice(-8) : zp(0, 8);
      kokyakuCode += ('  ' + e.hno);
    }
    else{
      kokyakuCode = zp(e.顧客コード.trim()? e.顧客コード: '0', 20)
    }
    kokyakuCode = spfill(kokyakuCode, 20);
    const a = [
      '2', 
      zp(e.金融機関番号.trim()? e.金融機関番号: 0 , 4),
      spfill('', 15),
      zp(e.店舗番号.trim()? e.店舗番号: 0 , 3),
      spfill('', 15),
      spfill('', 4),
      syumoku[e.預金種目]? syumoku[e.預金種目]: 1, // 預金種目無入力の場合は1
      zp(e.口座番号.trim()?e.口座番号: 0, 7),
      spfill(zen2han(e.口座名義人), 30),      
      zp(e.actualCost + e.ketteigaku, 10),
      e.shinki? '1': '0',
      kokyakuCode,
      '0', // 振替結果コード ここでは0で固定
      spfill('', 8),
    ];
    let s = '';
    a.forEach(e=>{s += e});
    return s;
  });
  const zenginTraler = () => {
    const total = dt.filter(e=>e.check)
    .reduce((v, e) => (v + (e.ketteigaku + e.actualCost)), 0);
    const length = dt.filter(e=>e.check).length
    const a = [
      '8', // 8＝トレーラレコード
      zp(length, 6), // データレコードの合計件数（右詰、残り前ゼロ）
      zp(total, 12),// データレコードの合計金額（右詰、残り前ゼロ）
      zp(0, 6),// 全て「0」またはスペース　※振替結果連絡時：件数を記載
      zp(0, 12),// 全て「0」またはスペース　※振替結果連絡時：金額を記載
      zp(0, 6),// 全て「0」またはスペース　※振替結果連絡時：件数を記載
      zp(0, 12),// 全て「0」またはスペース　※振替結果連絡時：金額を記載
      spfill('', 65),
    ]
    let s = '';
    a.forEach(e=>{s += e});
    return s;
  }
  const zenginEnd = () => ('9' + spfill('', 119));
  // 全銀フォーマット
  if (['hamagin', 'mbs', 'std'].indexOf(target)> -1){
    const rt = [];
    if (target !== 'mbs') rt.push(zenginHead());
    rt.push(...zenginDetail);
    if (target !== 'mbs') rt.push(zenginTraler());
    if (target !== 'mbs') rt.push(zenginEnd());
    return rt;
  }

}
// brobによる作り直し

const sendAndMakeBlob = async (prms) => {
  const {
    allState, dt, target, setTarget, 
    res, setRes, setSnack, masterRec, billingDt
  } = prms;

  const {hid, bid, com, stdDate} = allState;
  const jino = com.jino;
  const date = stdDate;
  const item = 'KF';

  const sendDt = makeData(prms);
  console.log(sendDt, 'sendDt');

  let mimeType, encodedData;

  if (target === 'fctSanin') {
    mimeType = 'text/csv';
    encodedData = Encoding.stringToCode(sendDt.join('\n'), 'UTF8'); // UTF-8の場合
  } else {
    mimeType = 'text/plain';
    const sjisArray = Encoding.stringToCode(sendDt.join('\n')); // Unicodeから配列へ変換
    encodedData = Encoding.convert(sjisArray, {
      to: 'SJIS',
      from: 'UNICODE'
    }); // Shift_JISに変換
  }

  try {
    // Blobを作成して返す
    const blob = new Blob([new Uint8Array(encodedData)], { type: mimeType });
    return blob;
  } catch (e) {
    console.error("sendAndMakeBlob Error:", e);
    throw new Error("Blobの作成に失敗しました。");
  }
};

const ItemSelect = (props) => {
  const {item, setItem} = props;
  const handleChange = (e) => {
    setItem(e.currentTarget.value)
  }
  return (
    <SelectGp
      onChange={e => handleChange(e)}
      name={'itemSelect'}
      label={'データ種別'}
      value={item}
      size={'large'}
      opts={fkItems}
    />
  )
}

const ButtonFKblob = (props) => {
  const {
    dt, target, setTarget, res, setRes, setSnack, masterRec, 
    billingDt, allowNoBankInfo
  } = props;
  
  const allState = useSelector(state => state);
  const classes = useStyles();
  const {com, stdDate} = allState;
  const prms = {
    dt, target, setTarget, allState, masterRec, billingDt, res, setRes, setSnack,
    allowNoBankInfo
  };
  
  // ダウンロードファイル名の作成
  const fPrefix = (com.fprefix? com.fprefix.toUpperCase() : "AAA");
  const fName = target === 'fctSanin'
  ? fPrefix + stdDate.slice(0, 7).replace('-', '') + 'FCT.csv'
  : fPrefix + stdDate.slice(0, 7).replace('-', '') + 'FURIKAE.TXT'
  const clickHandler = async () => {
    // Blobを作成し、結果を更新する
    try {
      const blob = await sendAndMakeBlob(prms);
      const url = URL.createObjectURL(blob);

      // ファイル名を設定

      // BlobのURLとファイル名をresにセットしてダウンロードリンク用に利用
      setRes({...res, result: true, loading: false, url, fName });
      
      // ダウンロードリンクのメモリ解放をセット
      setTimeout(() => {
        URL.revokeObjectURL(url);
        setRes({...res, result: false, url: '', });

      }, 1000 * 30); // 30秒後にURLを解放（適宜調整）
    } catch (error) {
      console.error("Blob作成エラー:", error);
      setSnack({msg: 'Blobの作成に失敗しました。', severity: 'error'});
      setRes({...res, result: false, loading: false});
    }
  };

  const disabled = !target ? true : false;

  const GenButton = () => (
    <div className={classes.buttonFKroot}>
      <Button 
        variant="contained" color="primary" component="span"
        onClick={clickHandler} disabled={disabled}
      >
        データの作成
      </Button>
    </div>
  );

  const Loading = () => (
    <span className={classes.loading}>作成中</span>
  );

  const DownloadButton = () => (
    <div className={classes.buttonFKroot} >
      <a href={res.url} download={res.fName}>
        <Button variant="contained" color="secondary" component="span">
          ダウンロード
        </Button>
      </a>
    </div>
  );

  // 状態に応じてボタンを表示
  if (!res.result && !res.loading) {
    return (<GenButton />);
  } else if (res.loading) {
    return (<Loading />);
  } else if (res.result && !res.loading) {
    return (<DownloadButton />);
  }
};


// 法人口座情報を表示
const ComAccountInfo = (props) => {
  const {allState, } = props;
  const {com } = allState;
  const classes = useStyles()
  // finddeeppath 
  const itakuCode = findDeepPath(com, 'etc.bank_info.委託者番号', '');
  const itakuName = findDeepPath(com, 'etc.bank_info.口座名義人', '');
  const bankCode = findDeepPath(com, 'etc.bank_info.金融機関番号', '');
  const brunchCode = findDeepPath(com, 'etc.bank_info.店舗番号', '');
  const syumokuName = findDeepPath(com, 'etc.bank_info.預金種目', '');
  const kouzaBango = findDeepPath(com, 'etc.bank_info.口座番号', '');
  return (
    <div className={classes.comAccountInfo}>
      <div className='label'>金融機関番号</div>
      <div className='cont'>{bankCode}</div>
      <div className='label'>店舗番号</div>
      <div className='cont'>{brunchCode}</div>
      <div className='label'>預金種目</div>
      <div className='cont'>{syumokuName}</div>
      <div className='label'>口座番号</div>
      <div className='cont'>{kouzaBango}</div>
      <div className='label'>口座名義人</div>
      <div className='cont'>{itakuName}</div>
      <div className='label'>委託者番号</div>
      <div className='cont'>{itakuCode}</div>
    </div>
  )
}

const MainUserBilling = () => {
  const classes = useStyles();
  const allState = useSelector(state=>state);
  const {users, schedule, com, service, serviceItems, stdDate} = allState;
  const prms = { 
    stdDate, schedule, users, com, service, serviceItems,
    calledBy: 'MainUserBilling'
  };
  prms.calledBy = 'MainUserBilling';
  // calledBy対応済み
  const { billingDt, masterRec, bdtResult: result } = setBillInfoToSch(prms);
  const [item, setItem] = useState();
  const [res, setRes] = useState({done:false, loading: false, result:false});
  const [allowNoBankInfo, setAllowNoBankInfo] = useState(false);
  const [snack, setSnack] = useState({msg: '', severity: ''});

  // 保護者の配列作成
  const pa = Array.from(new Set(
    billingDt.map(e=>(e.pname + ',' + e.pphone))
  ));
  const tpArray = pa.map(e=>({
    pname: e.split(',')[0], pphone: e.split(',')[1]
  }));

  // 保護者配列に実費と利用者負担額付与 口座情報付与
  tpArray.forEach(e=>{
    const t = billingDt.filter(f=>f.pname === e.pname && f.pphone === e.pphone);
    const ketteigaku = t.reduce((v, f)=>(v + f.ketteigaku), 0);
    const actualCost = t.reduce((v, f)=>(v + f.actualCost), 0);
    e.actualCost = actualCost;
    e.ketteigaku = ketteigaku;
    e.names = [];
    // 有効な口座情報（口座名義人と口座番号が両方有効）を持つレコードを取得
    const validBankInfoRecord = t.find(f => {
      const bi = f.bank_info;
      return bi && bi.口座名義人 && bi.口座名義人.trim() && bi.口座番号 && bi.口座番号.trim();
    });

    t.forEach(f=>{
      e.hno = f.hno; // 受給者証番号は一個だけ取得する。
      e.names.push(f.name);
    });

    // 有効な口座情報がある場合のみ取得
    if (validBankInfoRecord) {
      const bi = validBankInfoRecord.bank_info;
      e.口座名義人 = bi.口座名義人;
      e.口座番号 = bi.口座番号;
      e.店舗番号 = bi.店舗番号 || ' ';
      e.預金種目 = bi.預金種目 || ' ';
      e.顧客コード = bi.顧客コード || ' ';
      e.金融機関番号 = bi.金融機関番号 || ' ';
    } else {
      // 有効な口座情報がない場合は全て空白
      e.口座名義人 = ' ';
      e.口座番号 = ' ';
      e.店舗番号 = ' ';
      e.預金種目 = ' ';
      e.顧客コード = ' ';
      e.金融機関番号 = ' ';
    }
    e.check = e.口座番号.trim() ? true: false;
    e.shinki = false;

  });
  const [pArray, setPArray] = useState(
    tpArray.filter(e=>e.actualCost + e.ketteigaku > 0)
  );
  const handleChange = (e, i) => {
    const target = e.currentTarget;
    // const row = parseInt(target.getAttribute('row'));
    const name = target.name;
    const value = target.checked;
    const t = [...pArray];
    t[i][name] = value;
    setPArray(t);
  }
  const handleNoBankInfoChange = (e) => {
    const target = e.currentTarget;
    const value = target.checked;
    setAllowNoBankInfo(value);
    // pArrayのcheckを制御する
    const t = [...pArray];
    t.forEach(e=>{
      e.check = e.口座番号.trim()? e.check: value;
    });
    setPArray(t);
  }
  
  // handleExportCsvの引数にfprefixを追加
  const handleExportCsv = (fprefix) => {
    const fileName = `${fprefix ?? ''}保護者請求データ_${new Date().toISOString().slice(0, 10)}.csv`;
    const columns = [
      'pname', 'names',  'actualCost', 'ketteigaku', 'total'
    ];
    const titles = [
      '保護者名', '利用者名',  '実費', '利用者負担', '合計'
    ];
    
    // namesを処理してCSV出力用に変換
    const exportData = pArray.map(item => {
      let processedNames;
      if (Array.isArray(item.names)) {
        if (item.names.length === 1) {
          // 一人の場合はそのまま
          processedNames = item.names[0];
        } else {
          // 複数人の場合は名前のみを抽出
          processedNames = item.names.map(name => {
            const parts = name.split(' ');
            return parts.length > 1 ? parts[1] : name; // 姓名が半角スペースで分割されている場合、名前（2番目）を取得
          }).join(', ');
        }
      } else {
        processedNames = item.names;
      }
      
      return {
        ...item,
        names: processedNames,
        total: item.actualCost + item.ketteigaku
      };
    });
    
    downloadCsv(exportData, { fileName, columns, titles });
  };
  
  console.log(pArray);
  const titleStyle = {
    position: 'sticky', top: 80, paddingTop: 16, background: '#fff',
    zIndex: 90,
  }
  const Title = () => (
    <div className='flxTitle' style={titleStyle}>
      <div className='wmin lower'>No</div>
      <div className='w13 lower'>保護者名</div>
      <div className='w13 lower'>利用者名</div>
      <div className='w07'><div>金融機関</div><div>店舗番号</div></div>
      <div className='w08'><div>預金種目</div><div>口座番号</div></div>
      <div className='w15'><div>口座名義人</div><div>顧客コード</div></div>
      <div className='w07 lower'>実費</div>
      <div className='w07'><div>利用者</div><div>負担</div></div>
      <div className='w07 lower'>請求計</div>
      <div className='wzen4 lower'>送信<br></br>実施</div>
      <div className='wzen4 lower'>新規</div>
    </div>
  )
  
  const detail = pArray.map((e, i)=>{
    const names = e.names.map((f, j)=>{
      return (<div key={j}>{f}</div>)
    })
    return(
      <div className='flxRow' key={i}>
        <div className='wmin right'>{i + 1}</div>
        <div className='w13'>{e.pname}</div>
        <div className='w13'>{names}</div>
        <div className='w07'>
          <div>{e.金融機関番号}</div><div>{e.店舗番号}</div>
        </div>
        <div className='w08'>
          <div>{e.預金種目}</div><div>{e.口座番号}</div>
        </div>
        <div className='w15'>
          <div>{e.口座名義人}</div><div>{e.顧客コード}</div>
        </div>
        <div className='w07 right'>{formatNum(e.actualCost, 1)}</div>
        <div className='w07 right'>{formatNum(e.ketteigaku, 1)}</div>
        <div className='w07 right'>
          {formatNum(e.actualCost + e.ketteigaku, 1)}
        </div>
        <div className={classes.checkboxRoot + ' wzen4'}>
          <Checkbox 
            checked={e.check} name='check'
            onChange={e=>handleChange(e, i)}
          />
        </div>
        <div className={classes.checkboxRoot + ' wzen4'}>
          <Checkbox 
            checked={e.shinki} name='shinki'
            onChange={e=>handleChange(e, i)}
          />
        </div>
      </div>
    )
  });
  const Total = () => {
    // 請求計
    const actualcost = pArray.reduce((v, e) => (v + e.actualCost), 0);
    const ketteigaku = pArray.reduce((v, e) => (v + e.ketteigaku), 0);
    const total = actualcost + ketteigaku;
    const count = pArray.length;
    // 振替計
    const checked = pArray.filter(e=>e.check);
    const actualcostFk = checked.reduce((v, e) => (v + e.actualCost), 0);
    const ketteigakuFk = checked.reduce((v, e) => (v + e.ketteigaku), 0);
    const totalFk = actualcostFk + ketteigakuFk;
    const countFk = checked.length;
    return (<>
      <div className='flxRow' style={{marginTop: 8}}>
        <div className='wmin'></div>
        <div className='w13'>請求計</div>
        <div className='w13'></div>
        <div className='w07'></div>
        <div className='w08'></div>
        <div className='w15 right'>{count}件</div>
        <div className='w07 right'>{formatNum(actualcost, 1)}</div>
        <div className='w07 right'>{formatNum(ketteigaku, 1)}</div>
        <div className='w07 right'>{formatNum(total, 1)}</div>
        <div className='wzen4'></div>
        <div className='wzen4'></div>
      </div>
      <div className='flxRow' style={{marginTop: 8}}>
        <div className='wmin'></div>
        <div className='w13'>振替計</div>
        <div className='w13'></div>
        <div className='w07'></div>
        <div className='w08'></div>
        <div className='w15 right'>{countFk}件</div>
        <div className='w07 right'>{formatNum(actualcostFk, 1)}</div>
        <div className='w07 right'>{formatNum(ketteigakuFk, 1)}</div>
        <div className='w07 right'>{formatNum(totalFk, 1)}</div>
        <div className='wzen4'></div>
        <div className='wzen4'></div>
      </div>
    </>)
  }
  const appPageStyle={paddingTop: 104, marginBottom: 40};
  let today = new Date();
  today.setDate(today.getDate() + 1)
  return(
    <div className='AppPage' style={appPageStyle}>
      <div className={classes.headerRow}>
        <ItemSelect item={item} setItem={setItem} />
        <DateInput 
          name='振替日' def={formatDate(today, 'YYYY-MM-DD')}
          id='userbillingFKdate' label='振替日'
        />
        <ButtonFKblob 
          dt={pArray} target={item} setTarget={setItem} res={res} 
          billingDt={billingDt} masterRec={masterRec} allowNoBankInfo={allowNoBankInfo}
          setRes={setRes} setSnack={setSnack} 
        />
        <FormControlLabel 
          control={
            <Checkbox 
              checked={allowNoBankInfo} name='noBankInfo'
              onChange={e=>handleNoBankInfoChange(e)}
              color="primary"
            />
          }
          label='口座情報なしでも送信'
        />
        <ExcahngeTotalizeButton />
        {pArray.length > 0 && (
          <Button
            variant='contained'
            onClick={() => handleExportCsv(com.fprefix)}
            startIcon={<GetAppIcon/>}
          >
            保護者請求CSV出力
          </Button>
        )}
      </div>
      <ComAccountInfo allState={allState} />
      {pArray.filter(e=>!((e.口座番号 || '').trim())).length > 0 && (
        <div style={{padding: '0 16px 8px 12px', fontSize: '0.9rem', color: red[600]}}>
          口座情報未登録が{pArray.filter(e=>!((e.口座番号 || '').trim())).length}件あります。
        </div>
      )}
      <Title />
      {detail}
      <Total />
      <SnackMsg {...snack} />
    </div>
  )
}

const UserBilling = ()=>{
  const allstate = useSelector(state=>state);
  const loadingStatus = getLodingStatus(allstate);
  const account = useSelector(state => state.account);
  const permission = parsePermission(account)[0][0];

  if (loadingStatus.loaded && permission >= 90){
      if (!CALC2024){
        return (<NotDispLowCh style={{marginTop: 200}} /> )
      }
      else{
        return(<>
          <MainUserBilling />
        </>)
      } 
  }
  else if (loadingStatus.error){
    return (<>
      <LoadErr loadStatus={loadingStatus} errorId={'E5958'} />
    </>)
  }
  else if (permission < 90) return <PermissionDenied marginTop='90'/>
  else{
    return(<>
     <LoadingSpinner/>
    </>)
  }
}
export default UserBilling;