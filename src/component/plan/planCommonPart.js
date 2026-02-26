import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { useHistory, useLocation } from 'react-router-dom';
import CreateIcon from '@material-ui/icons/Create';
import { DispNameWithAttr } from '../Users/Users';
import { brown, grey, teal } from '@material-ui/core/colors';
import { Button } from '@material-ui/core';
import DescriptionIcon from '@material-ui/icons/Description';
import { useSelector } from 'react-redux';
import { parsePermission } from '../../commonModule';
import { Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, Backdrop, CircularProgress, Box, TextField, FormControl, InputLabel, Select, MenuItem, FormLabel, FormControlLabel, Checkbox, FormHelperText } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import DateRangeIcon from '@material-ui/icons/DateRange';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { DateInput, NumInputGP } from '../common/StdFormParts';
import { univApiCall } from '../../albCommonModule';
import SnackMsg from '../common/SnackMsg';
import SnackMsgSingle from '../common/SnackMsgSingle';
import { ServiceItems } from '../common/StdFormParts';
import { HOHOU } from '../../modules/contants';
import { getLS, setLS } from '../../modules/localStrageOprations';
import { PLAN_ADD_MODE_KEY, PLAN_ADD_MODE_ITEM, planlsUid } from './planConstants';
import { processDeepLfToBr, processDeepBrToLf } from '../../modules/newlineConv';
import { cleanSpecialCharacters } from '../../modules/cleanSpecialCharacters';
import { datePtn } from '../../modules/contants';
import { saveCreatedDateToLS } from './utility/planLSUtils';

export const PREV_PLANPAGE_SEARCH_SESSIONSTORAGE_KEY = 'previousPlanPageSearch';

const useStyles = makeStyles((theme) => ({
  user: {
    display: 'flex',
    alignItems: 'center',
  },
  userLeft: {
    width: 240,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    '& .name': { fontSize: '1.2rem', padding: 4},
    '& .attr': { fontSize: '.8rem', padding: 4},
    '& .pname': { fontSize: '.8rem', paddingTop: 4, paddingBottom: 4},
  },
  userRight: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    cursor: 'pointer',
    padding: 4,
    position: 'relative',
    transition: 'all 0.4s',
    '&:hover': {
      backgroundColor: '#f5f5f5',
      borderRadius: 4,
      '& .icon': { color: teal[800] },
      '& .icon .size': { fontSize: 40 },
    },
    '& .postal': {
      fontSize: '.8rem',
      color: '#777',
    },
    '& .address': {
      fontSize: '.9rem',
      display: 'flex',
      '& span': {
        marginRight: 4,
      }
    },
    '& .icon': {
      position: 'absolute',
      right: 8,
      top: '50%',
      transform: 'translateY(-50%)',
      color: grey[400],
      opacity: 0.8,
      transition: '0.4s',
      '& .size': {
        fontSize: 20,
        transition: 'font-size 0.8s',
      }
    }
  }
}));

export const planMenu = [
  { link: "/plan/manegement", label: "計画一覧",  },
  { link: "/plan/timetable", label: "計画支援時間",  },
  { link: "/plan/setting", label: "設定", /*setting: true */ },
]

export const UserInfoDisplay = ({ user, uid }) => {
  const classes = useStyles();
  const history = useHistory();

  return (
    <div className={classes.user}>
      <div className={classes.userLeft}>
        <div>
          <DispNameWithAttr {...user} withHonorific={true} />
          <span className="attr">{user.ageStr}</span>
        </div>
        <div className="pname"><span>保護者：{user.pname} さん</span></div>
      </div>
      <div className={classes.userRight} /*onClick={() => history.push(`/users/belongs/edit/${uid}/`)}*/ >
        {user.postal && (
          <div className="postal">
            〒{user.postal}
          </div>
        )}
        <div className="address">
          <div>
            <span>{user.city}</span>
            <span>{user.address}</span>
          </div>
        </div>
        <div className="icon">
          <CreateIcon className="size" />
        </div>
      </div>
    </div>
  );
};


// 深い比較関数
export const deepEqual = (obj1, obj2) => {
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return obj1 === obj2;
  
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1 === obj2;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
};

// アセスメントの変更点を抽出する関数
export const getAssessmentChanges = (latestData, previousData, excludeKeys = []) => {
  if (!latestData || !previousData) {
    return {};
  }
  
  const changes = {};
  const allKeys = new Set([...Object.keys(latestData), ...Object.keys(previousData)]);
  
  for (const key of allKeys) {
    // 除外キーはスキップ
    if (excludeKeys.includes(key)) {
      continue;
    }
    
    const latestValue = latestData[key];
    const previousValue = previousData[key];
    
    // 値が異なる場合のみ変更として記録
    if (!deepEqual(latestValue, previousValue)) {
      changes[key] = {
        previous: previousValue,
        current: latestValue
      };
    }
  }
  
  return changes;
};

// アセスメントの変更点をプロンプト用のテキストに変換する関数
export const formatAssessmentChanges = (changes, assessmentItems = []) => {
  if (!changes || Object.keys(changes).length === 0) return '';
  
  const changeTexts = [];
  
  for (const [key, change] of Object.entries(changes)) {
    // assessmentItemsから該当する項目を探すが、見つからない場合はキー名をそのまま使用
    const item = assessmentItems.find(item => item.key === key);
    const label = item ? item.label : key;
    
    const previousText = change.previous ? String(change.previous).trim() : 'なし';
    const currentText = change.current ? String(change.current).trim() : 'なし';
    
    // 変更前と変更後を明確に示し、変更後の内容を重視する形式
    changeTexts.push(`【${label}に変更あり】"${previousText}"から"${currentText}"に変更になりました`);
  }
  
  return changeTexts.join('\n');
};

export const PlanPrintButton = (props) => {
  const history = useHistory();
  const location = useLocation();
  const account = useSelector(state => state.account);
  // const permission = parsePermission(account)[0][0];
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const {item, created, uid, originInputs, inputs} = props;
  const [showWarning, setShowWarning] = useState(false);
  const [snack, setSnack] = useState({});
  const [snackSingle, setSnackSingle] = useState({});

  if(!created) return null;

  let reportsUrl = `/reports/usersplan/?item=${item}&created=${created}&uid=${uid}`;
  if(service) reportsUrl += `&service=${service}`;

  const handleChackService = () => {
    if(item.includes("personalSupport")){
      // 個別支援計画の場合
      if(service === "" && serviceItems.length >= 2 && serviceItems.includes(HOHOU)){
        setSnackSingle({msg: "サービス指定が必要です", severity: 'warning'});
        return;
      }
    }
  }
  
  const handlePrintClick = () => {
    // originInputsとinputsが異なる場合は警告を表示
    if (originInputs && inputs && !deepEqual(originInputs, inputs)) {
      setShowWarning(true);
    } else {
      sessionStorage.setItem(PREV_PLANPAGE_SEARCH_SESSIONSTORAGE_KEY, location.search);
      history.push(reportsUrl);
    }
  };

  const handleConfirmPrint = () => {
    setShowWarning(false);
    sessionStorage.setItem(PREV_PLANPAGE_SEARCH_SESSIONSTORAGE_KEY, location.search);
    history.push(reportsUrl);
  };

  const handleCancelPrint = () => {
    setShowWarning(false);
  };

  return(
    <>
      <div onClick={handleChackService}>
        <Button
          startIcon={<DescriptionIcon />}
          style={{ color: item.includes("personalSupport") && service==="" ?null :brown[500] }}
          onClick={handlePrintClick}
        >
          印刷
        </Button>
      </div>
      
      <Dialog
        open={showWarning}
        onClose={handleCancelPrint}
        aria-labelledby="print-warning-dialog-title"
        aria-describedby="print-warning-dialog-description"
      >
        <DialogTitle id="print-warning-dialog-title">印刷の確認</DialogTitle>
        <DialogContent>
          <DialogContentText id="print-warning-dialog-description">
            入力内容が保存されていません。印刷を続行しますか？
            <br />
            <strong>保存されていない変更がある場合、印刷内容に反映されません。</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelPrint} color="primary">
            キャンセル
          </Button>
          <Button onClick={handleConfirmPrint} color="primary" variant="contained">
            印刷する
          </Button>
        </DialogActions>
      </Dialog>
      <SnackMsg {...snack} />
      <SnackMsgSingle state={snackSingle} setState={setSnackSingle} />
    </>
  )
}

// オーバーレイコンポーネント
export const PlanOverlay = ({ 
  open, 
  message = '処理中です...', 
  zIndex = 1300,
  children
}) => {
  return (
    <Backdrop
      style={{
        color: '#fff',
        zIndex: zIndex,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      open={open}
    >
      <CircularProgress color="inherit" size={24} style={{ color: teal[600] }} />
      <div
        style={{
          marginTop: 16,
          textAlign: 'center',
          color: '#fff',
          fontSize: '1.1rem',
          fontWeight: 500,
        }}
      >
        {children || <span dangerouslySetInnerHTML={{ __html: message }} />}
      </div>
    </Backdrop>
  );
};

// 汎用確認ダイアログコンポーネント
export const ConfirmDialog = ({ 
  open, 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmText = "はい",
  cancelText = "キャンセル"
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onCancel}
      onBackdropClick={onCancel}
      disableEscapeKeyDown={false}
      disableBackdropClick={false}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="primary">
          {cancelText}
        </Button>
        <Button onClick={onConfirm} color="primary" variant="contained">
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};


// 個別支援系の「日付変更／コピー」共通コンポーネント
// 必要なAPI呼び出しとUI（ボタン＋ダイアログ）を内包
export const PlanDateChangeCopy = ({
  hid,
  bid,
  uid,
  item,
  created,
  inputs,
  setInputs,
  originInputs,
  setOriginInputs,
  setSnack,
  createdField,
  allPersonalData,
  setAllPersonalData,
  buttonStyle = {},
}) => {
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [operationType, setOperationType] = useState(''); // 'change' | 'copy'
  const [newDate, setNewDate] = useState('');
  const [dateError, setDateError] = useState(false);
  const [dateHelperText, setDateHelperText] = useState('');

  const handleUpdateOrCopy = async () => {
    if (!newDate) {
      setDateError(true);
      setDateHelperText('必須です');
      setSnack && setSnack({ msg: '日付を入力してください。', severity: 'warning' });
      return;
    }

    // 日付形式の妥当性チェック（YYYY-MM-DD形式）
    if (!datePtn.test(newDate)) {
      setDateError(true);
      setDateHelperText('無効な日付形式');
      setSnack && setSnack({ msg: '日付閉式が正しくありません。', severity: 'warning' });
      return;
    }

    // 実際の日付として有効かチェック
    const testDate = new Date(newDate);
    if (isNaN(testDate.getTime()) || testDate.toISOString().split('T')[0] !== newDate) {
      setDateError(true);
      setDateHelperText('存在しない日付');
      setSnack && setSnack({ msg: '存在しない日付です。正しい日付を入力してください。', severity: 'warning' });
      return;
    }

    // 同日付への変更は無効
    if (operationType === 'change' && created && newDate === created) {
      setDateError(true);
      setDateHelperText('同日付不可');
      setSnack && setSnack({ msg: '同じ日付は指定できません。別の日付を選択してください。', severity: 'warning' });
      return;
    }

    // 送信前のデータ前処理（保存時と同様に実施）
    let processedContentForSend;
    try {
      const merged = { ...inputs, [createdField]: newDate };
      const cleaned = cleanSpecialCharacters(merged);
      processedContentForSend = processDeepLfToBr(cleaned);
    } catch (processingError) {
      setSnack && setSnack({ msg: 'データの処理中にエラーが発生しました。入力内容を確認してください。', severity: 'error' });
      return;
    }

    const prms = {
      a: 'sendUsersPlan',
      hid,
      bid,
      uid,
      item,
      created: newDate,
      content: { uid, content: processedContentForSend },
    };
    const prmsDelete = {
      a: 'deleteUsersPlan',
      hid,
      bid,
      uid,
      item,
      created,
    };
    // 既存データの有無を確認（新しい作成日で検索）
    const fetchPrms = {
      a: 'fetchUsersPlan',
      hid,
      bid,
      uid,
      item,
      created: newDate,
      limit: 1,
    };
    const errCode = operationType === 'change' ? 'ECHANGE09' : 'ECOPY09';
    const successMsg = operationType === 'change' ? '日付変更が成功しました。' : 'コピーが成功しました。';
    const errorMsg = operationType === 'change' ? '日付変更に失敗しました。' : 'コピーに失敗しました。';
    
    // 既存確認フェッチ
    const fetchRes = await univApiCall(fetchPrms, 'EFETCH09', '', setSnack, '', '', false);
    if (!fetchRes || !fetchRes.data || fetchRes.data.result !== true) {
      setDateError(true);
      setDateHelperText('確認失敗');
      setSnack && setSnack({ msg: '既存データの確認に失敗しました。時間を置いて再度お試しください。', severity: 'error' });
      return;
    }
    const exists = Array.isArray(fetchRes.data.dt) && fetchRes.data.dt.length > 0;
    if (exists) {
      setDateError(true);
      setDateHelperText('既存データあり');
      setSnack && setSnack({ msg: '指定した日付のデータが既に存在します。別の日付を指定してください。', severity: 'warning' });
      return;
    }

    const res = await univApiCall(prms, errCode);
    if (res && res.data && res.data.result) {
      if (operationType === 'change' && inputs?.[createdField]) {
        univApiCall(prmsDelete, errCode, '', setSnack, successMsg, errorMsg, false);
      } else if (setSnack) {
        setSnack({ msg: successMsg, severity: 'success' });
      }
      
      // 作成日をローカルストレージの履歴に保存
      saveCreatedDateToLS(newDate);

      // 一覧状態の更新（ローダー側の allPersonalData を即時反映）
      let updatedAllPersonalData = allPersonalData;
      if (Array.isArray(allPersonalData) && typeof setAllPersonalData === 'function') {
        if (operationType === 'change') {
          updatedAllPersonalData = allPersonalData.map((rec) => {
            const recCreated = rec?.content?.[createdField];
            if (rec?.uid === uid && recCreated === created) {
              return { uid, content: { ...inputs, [createdField]: newDate }, item: rec.item, created: newDate };
            }
            return rec;
          });
          setAllPersonalData(updatedAllPersonalData);
        } else if (operationType === 'copy') {
          const newRecord = { uid, content: { ...inputs, [createdField]: newDate }, item, created: newDate };
          updatedAllPersonalData = [...allPersonalData, newRecord];
          setAllPersonalData(updatedAllPersonalData);
        }
      }

      // 状態更新（コピー後のデータを allPersonalData から読み込み）
      if (operationType === 'copy') {
        // コピー後の日付のデータを allPersonalData から取得
        const copiedData = updatedAllPersonalData.find(rec => 
          rec?.uid === uid && 
          rec?.content?.[createdField] === newDate &&
          rec?.item === item
        );
        
        if (copiedData && copiedData.content) {
          // <br>を\nに変換してからセット
          const processedContent = processDeepBrToLf(copiedData.content);
          setOriginInputs && setOriginInputs(processedContent);
          setInputs && setInputs(processedContent);
        } else {
          // fallback: 従来の処理
          setOriginInputs && setOriginInputs({ ...inputs, [createdField]: newDate });
          setInputs && setInputs({ ...inputs, [createdField]: newDate });
        }
      } else {
        // 日付変更の場合も allPersonalData から変更後のデータを読み込み
        const changedData = updatedAllPersonalData.find(rec => 
          rec?.uid === uid && 
          rec?.content?.[createdField] === newDate &&
          rec?.item === item
        );
        
        if (changedData && changedData.content) {
          // <br>を\nに変換してからセット
          const processedContent = processDeepBrToLf(changedData.content);
          setOriginInputs && setOriginInputs(processedContent);
          setInputs && setInputs(processedContent);
        } else {
          // fallback: 従来の処理
          setOriginInputs && setOriginInputs({ ...inputs, [createdField]: newDate });
          setInputs && setInputs({ ...inputs, [createdField]: newDate });
        }
      }
    } else if (setSnack) {
      setSnack({ msg: errorMsg, severity: 'error' });
    }

    setDateDialogOpen(false);
    setNewDate('');
    setDateError(false);
    setDateHelperText('');
    setOperationType('');
  };

  return (
    <>
      <Button
        startIcon={<DateRangeIcon />}
        onClick={() => { setOperationType('change'); setDateError(false); setDateHelperText(''); setDateDialogOpen(true); }}
        color="primary"
        style={{ marginRight: 8, ...buttonStyle }}
      >
        日付変更
      </Button>
      <Button
        startIcon={<FileCopyIcon />}
        onClick={() => { setOperationType('copy'); setDateError(false); setDateHelperText(''); setDateDialogOpen(true); }}
        color="secondary"
        style={{ marginRight: 8, ...buttonStyle }}
      >
        コピー
      </Button>

      <Dialog open={dateDialogOpen} onClose={() => setDateDialogOpen(false)}>
        <DialogTitle>{operationType === 'change' ? '日付変更' : 'コピー'}</DialogTitle>
        <DialogContent>
          <DateInput
            label="新しい日付"
            def={newDate}
            required
            fullWidth
            setExtVal={(val) => { setNewDate(val); setDateError(false); setDateHelperText(''); }}
            error={dateError}
            helperText={dateHelperText}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDateDialogOpen(false)} color="primary">
            キャンセル
          </Button>
          <Button onClick={handleUpdateOrCopy} color="primary">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// 新規追加モードで他のコンポーネントから呼び出せる汎用的な関数
export const navigateToPlanAdd = (history, planType, uid) => {
  let baseUrl = `/plan/${planType}`;
  const params = new URLSearchParams();
  
  // uidが指定されていない場合は、ローカルストレージから取得を試行
  const targetUid = uid || getLS(planlsUid);
  
  if (targetUid) {
    params.append('uid', targetUid);
  }
  params.append('mode', 'add');
  
  // personalSupportHohouの場合はpersonalSupportにhohouパラメータを追加
  if (planType === 'personalSupportHohou') {
    baseUrl = '/plan/personalSupport';
    params.append('hohou', 'true');
  }
  
  // monitoringHohouの場合はmonitoringhohouに遷移
  if (planType === 'monitoringHohou') {
    baseUrl = '/plan/monitoringhohou';
  }
  
  // monitoringSenmonの場合はmonitoringsenmonに遷移
  if (planType === 'monitoringSenmon') {
    baseUrl = '/plan/monitoringsenmon';
  }
  
  const url = `${baseUrl}?${params.toString()}`;
  history.push(url);
};

// 新規追加モードの判定関数
export const isPlanAddMode = (locationObj, planType) => {
  const urlParams = new URLSearchParams(locationObj.search);
  const modeParam = urlParams.get('mode');
  const storedAddMode = getLS(PLAN_ADD_MODE_KEY);
  const storedAddItem = getLS(PLAN_ADD_MODE_ITEM);
  
  return (modeParam === 'add' || storedAddMode === 'true') && storedAddItem === planType;
};

// 新規追加モードのリセット関数
export const resetPlanAddMode = (history, createdDate) => {
  setLS(PLAN_ADD_MODE_KEY, '');
  setLS(PLAN_ADD_MODE_ITEM, '');
  
  // URLからmodeパラメータを削除し、createdパラメータを追加（HashRouter 対応: history.location を利用）
  const { pathname, search } = history.location || {};
  const params = new URLSearchParams(search || '');
  params.delete('mode');
  
  // submitで使用した日付をcreatedパラメータとして追加
  if (createdDate) {
    params.set('created', createdDate);
  }
  
  const newSearch = params.toString();
  history.replace({
    pathname: pathname || '/',
    search: newSearch ? `?${newSearch}` : ''
  });
};

// 五領域分類で利用する設問ラベルのマスタ（共有）
export const FIVEDOMAINS_LABELS = {
  '健康・生活': [
    '睡眠は毎日安定していますか？',
    '食事は自分で適切にとれますか？',
    '排泄は一人でできますか？',
    'アレルギーや服薬など、健康上の特別な配慮は必要ですか？',
    '昼寝が必要ですか？',
    '着替え・洗面・歯磨きなどの生活習慣は身についていますか？',
    '学校への持ち物を自分で準備できますか？',
    '体調不良を言葉で伝えられますか？',
    '通学・外出の身支度は自立していますか？',
    '月経・服薬・体調管理を自分で行えますか？',
  ],
  '運動・感覚': [
    '走る・跳ぶなどの動きは年齢相応にできますか？',
    '大きな音・光などに敏感ですか？',
    '強い刺激を求めることがありますか？',
    'ハサミやクレヨンなど運筆動作はどうですか？',
    '箸・鉛筆の持ち方や筆圧は適切ですか？',
    '体育や遊びでのボール操作はどうですか？',
    '文字を書く際の筆圧や文字の整然性はどうですか？',
    '細かい作業（裁縫、工作、実験器具操作など）はどうですか？',
    'スポーツでの協調運動はどうですか？',
    '長時間のスマホ／PC使用で問題が出ますか？',
  ],
  '認知・行動': [
    '好きな活動に集中できますか？',
    '急な予定変更に柔軟に対応できますか？',
    '怒りや不安を切り替えられますか？',
    'ごっこ遊びなど想像遊びをしますか？',
    '色・形・数などの概念理解はどうですか？',
    '教室で座っていられる時間は？',
    '宿題や課題を期限までに提出できますか？',
    '読み書き・計算に困難がありますか？',
    '課題やテスト勉強を計画的に進められますか？',
    'スマホやゲームの利用時間を自己管理できますか？',
    '将来や進路について考える意欲はありますか？',
  ],
  '言語・コミュニケーション': [
    '話しかけられた内容を理解できますか？',
    '自分の思いを言葉で表現できますか？',
    '会話のやりとりが成立しますか？',
    '指差し・身振りなど非言語コミュニケーションは使えますか？',
    '授業中の発表や音読はスムーズですか？',
    '冗談や比喩を理解できますか？',
    'LINE等のSNSで適切にやりとりできますか？',
    '相手の立場や空気を読んで話題を変えられますか？',
  ],
  '人間関係・社会性': [
    '他児への興味はありますか？',
    '順番待ちや物の貸し借りができますか？',
    '困ったときに助けを求めることができますか？',
    'あいさつや「ありがとう」が言えますか？',
    '他児とのトラブルはありますか？',
    'ルールのある遊びや班活動に参加できますか？',
    'いじめやからかいにどう対応しますか？',
    'クラブ活動や委員会で協力的に行動できますか？',
    '対人トラブル時に話し合いで解決を図れますか？',
  ],
};

// 全般ラベル（帳票や分類で利用）
export const GENERAL_LABELS = [
  '支援での注意事項',
  '家族支援',
  '移行支援',
  '地域支援',
  '備考',
];

// 設問ラベルから五領域名を取得（無ければ空文字）
export const getFiveDomainForLabel = (label) => {
  if (!label) return '';
  for (const [domain, labels] of Object.entries(FIVEDOMAINS_LABELS)) {
    if (labels.includes(label)) return domain;
  }
  return '';
};

// フォームレンダリング関連の共通関数

// ラベルで項目を検索するヘルパー関数
export const findInputByLabel = (label, inputDefinitions) => {
  if (!inputDefinitions || !Array.isArray(inputDefinitions)) return undefined;
  return inputDefinitions.find(item => item.label === label);
};

// inputDefinitions 配列から指定したグループのフィールド定義を取得する
export const getGroupItemsDefinitions = (groupLabel, inputDefinitions) => {
  const group = inputDefinitions.find(def => def.label === groupLabel && def.type === 'group');
  return group ? group.fields : [];
};

// 指定したグループ内で、特定のフィールド定義（ラベルが fieldLabel と一致するもの）を取得する
export const findGroupDefinitionByLabel = (groupLabel, fieldLabel, inputDefinitions) => {
  const group = inputDefinitions.find(def => def.label === groupLabel && def.type === 'group');
  return group ? group.fields.find(field => field.label === fieldLabel) : null;
};

// allPersonalDataから指定したフィールドのユニークな値を取得する関数
export const getUniqueOptionsFromPersonalData = (fieldName, allPersonalData) => {
  const values = allPersonalData
    .map(item => item.content && item.content[fieldName])
    .filter(value => value && value.toString().trim() !== '')
    .map(value => value.toString().trim());
  
  // 重複を除去してソート
  return [...new Set(values)].sort();
};

// FieldRender関数
export const FieldRender = (
  name, prmsOrDef, inputs, handleInputChange, handleBlur, 
  errors, dateDisabled, handleSelectInputAuto, allPersonalData
) => {
  // 引数がオブジェクト（prms）として渡された場合の処理
  let inputDefinitions;
  let disabled = false;
  
  if (prmsOrDef && !Array.isArray(prmsOrDef) && prmsOrDef.inputDefinitions) {
    // prmsオブジェクトとして渡された場合
    const prms = prmsOrDef;
    inputDefinitions = prms.inputDefinitions;
    inputs = prms.inputs;
    handleInputChange = prms.handleInputChange;
    handleBlur = prms.handleBlur;
    errors = prms.errors;
    dateDisabled = prms.dateDisabled;
    handleSelectInputAuto = prms.handleSelectInputAuto;
    allPersonalData = prms.allPersonalData;
    disabled = prms.disabled || false;
  } else {
    // 従来通り個別の引数として渡された場合
    inputDefinitions = prmsOrDef;
    disabled = dateDisabled || false; // 従来はdateDisabledのみだったが、便宜上こうする（ただしDateInput以外には影響しなかった）
  }

  const fieldDef = findInputByLabel(name, inputDefinitions);
  if (!fieldDef) return null;
  
  switch (fieldDef.type) {
    case 'DateInput':
      // 日付型の場合、オブジェクトか文字列かを判定して適切に処理
      const dateValue = typeof inputs[name] === 'object' && inputs[name] !== null ? 
        (inputs[name].value || '') : inputs[name];
      
      // 作成日フィールドの場合、dateDisabledの状態を適用（優先）
      const isDateDisabled = name === '作成日' ? dateDisabled : disabled;
      
      return (
        <DateInput
          label={fieldDef.label}
          def={dateValue}
          required={fieldDef.required}
          style={fieldDef.style || {}}
          setExtVal={(val) => handleInputChange(name, val)}
          onFocus={(e) => handleSelectInputAuto(e)}
          onBlur={(e) => handleBlur(name, e.target.value)}
          cls={`tfMiddle`}
          error={!!errors[name]}
          helperText={errors[name] ? '必須項目です' : ''}
          disabled={isDateDisabled}
        />
      );
    case 'NumInputGP':
      return (
        <NumInputGP
          label={fieldDef.label}
          def={inputs[name]}
          required={fieldDef.required}
          style={fieldDef.style || {}}
          propsVal={inputs[name]}
          setPropsVal={newValue => handleInputChange(name, newValue)}
          onFocus={(e) => handleSelectInputAuto(e)}
          propsOnBlur={(e) => handleBlur(name, e)}
          disabled={disabled}
        />
      );
    case 'select':
      return (
        <FormControl style={fieldDef.style || {}} error={!!errors[name]}>
          <InputLabel>
            {fieldDef.longLabel || fieldDef.label}
          </InputLabel>
          <Select
            value={inputs[name] || ''}
            onChange={(e) => handleInputChange(name, e.target.value)}
            onBlur={(e) => handleBlur(name, e.target.value)}
            required={fieldDef.required}
            disabled={disabled}
          >
            {(fieldDef.souce || []).map((option, optIndex) => (
              <MenuItem key={`option-${optIndex}`} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
          {errors[name] && (
            <FormHelperText>必須項目です</FormHelperText>
          )}
        </FormControl>
      );
    case 'checkboxes':
      // チェックボックスのレンダリング
      const options = fieldDef.souce || [];
      const rawValue = inputs[name];
      const currentValues = Array.isArray(rawValue)
        ? rawValue
        : (typeof rawValue === 'string' && rawValue.length > 0 ? rawValue.split(',') : []);
      
      const handleCheckboxChange = (option, checked) => {
        let newValues = [...currentValues];
        
        if (checked && !newValues.includes(option)) {
          newValues.push(option);
        } else if (!checked && newValues.includes(option)) {
          newValues = newValues.filter(item => item !== option);
        }
        
        const newValueString = newValues.join(',');
        handleInputChange(name, newValueString);
      };

      return (
        <div style={fieldDef.style || {}}>
          <FormLabel component="legend" style={{ marginBottom: 8 }}>
            {fieldDef.longLabel || fieldDef.label}
          </FormLabel>
          {options.map((option, index) => (
            <FormControlLabel
              key={index}
              control={
                <Checkbox
                  checked={currentValues.includes(option)}
                  onChange={(e) => handleCheckboxChange(option, e.target.checked)}
                  color="primary"
                  size="small"
                  disabled={disabled}
                />
              }
              label={option}
              style={{ marginRight: '12px', fontSize: '0.9rem' }}
            />
          ))}
        </div>
      );
    case 'freesolo':
      // souceが定義されている場合はそれを使用、なければ既存データから取得
      const freesoloOptions = fieldDef.souce && fieldDef.souce.length > 0
        ? fieldDef.souce
        : getUniqueOptionsFromPersonalData(name, allPersonalData);
      
      return (
        <Autocomplete
          freeSolo
          options={freesoloOptions}
          getOptionLabel={(option) => option || ""}
          value={inputs[name] || ''}
          onInputChange={(event, newInputValue) =>
            handleInputChange(name, newInputValue)
          }
          style={fieldDef.style || {}}
          onChange={(event, newValue) =>
            handleInputChange(name, newValue || '')
          }
          disabled={disabled}
          renderInput={(params) => (
            <TextField
              {...params}
              label={fieldDef.longLabel || fieldDef.label}
              placeholder={fieldDef.placeholder}
              variant="standard"
              onBlur={(e) => handleBlur(name, e.target.value)}
              required={fieldDef.required}
              error={!!errors[name]}
              helperText={errors[name] ? '必須項目です' : ''}
            />
          )}
        />
      );
    case 'text':
    default:
      return (
        <TextField
          label={fieldDef.longLabel || fieldDef.label}
          placeholder={fieldDef.placeholder}
          value={inputs[name]}
          variant="standard"
          required={fieldDef.required}
          style={fieldDef.style || {}}
          onChange={(e) => handleInputChange(name, e.target.value)}
          onBlur={(e) => handleBlur(name, e.target.value)}
          onFocus={(e) => handleSelectInputAuto(e)}
          multiline={fieldDef.multiline}
          error={!!errors[name]}
          helperText={errors[name] ? '必須項目です' : ''}
          disabled={disabled}
        />
      );
  }
};

// グループ操作関連の共通関数

// グループ行の追加
export const addGroupRow = (groupLabel, inputDefinitions, inputs, setInputs) => {
  setInputs(prev => {
    const groupData = prev[groupLabel] ? [...prev[groupLabel]] : [];
    const groupFields = getGroupItemsDefinitions(groupLabel, inputDefinitions);
    // 新規行は各フィールドの初期値をフィールド定義に沿って設定する
    const newRow = {};
    groupFields.forEach(field => {
      newRow[field.label] = field.defaultValue !== undefined ? field.defaultValue : '';
    });
    return {
      ...prev,
      [groupLabel]: [...groupData, newRow],
    };
  });
};

// グループ行の削除
export const removeGroupRow = (rowIndex, groupLabel, inputs, setInputs) => {
  setInputs(prev => {
    const groupData = prev[groupLabel] ? [...prev[groupLabel]] : [];
    groupData.splice(rowIndex, 1);
    return {
      ...prev,
      [groupLabel]: groupData,
    };
  });
};

// グループ行の入れ替え
export const swapGroupRows = (groupLabel, fromIndex, toIndex, inputs, setInputs) => {
  setInputs(prev => {
    const groupData = prev[groupLabel] ? [...prev[groupLabel]] : [];
    if (fromIndex >= 0 && fromIndex < groupData.length && 
        toIndex >= 0 && toIndex < groupData.length) {
      const temp = groupData[fromIndex];
      groupData[fromIndex] = groupData[toIndex];
      groupData[toIndex] = temp;
      return {
        ...prev,
        [groupLabel]: groupData,
      };
    }
    return prev;
  });
};

// グループ行の追加（同期付き）
export const addGroupRowWithSync = (groupLabel, inputDefinitions, inputs, setInputs, lineRenderRefs) => {
  if (lineRenderRefs.current) {
    lineRenderRefs.current.forEach(ref => {
      if (ref && ref.forceSync) {
        ref.forceSync();
      }
    });
  }
  setTimeout(() => {
    addGroupRow(groupLabel, inputDefinitions, inputs, setInputs);
  }, 150);
};

// アセスメントの変更点を取得する関数
export const fetchAssessmentChanges = async (hid, bid, uid, inputDate, personalSupportDate, setSnack) => {
  if (!hid || !bid || !uid || !inputDate || !personalSupportDate) {
    return {};
  }

  try {
    const assessmentRes = await univApiCall({
      a: 'fetchUsersPlan', 
      hid, 
      bid, 
      uid, 
      item: 'assessment'
    }, 'E23443', '', setSnack, '', '', false);

    if (assessmentRes?.data?.result && assessmentRes.data.dt) {
      // inputの日付以前の全てのデータから取得
      const allAssessmentsInRange = assessmentRes.data.dt.filter(item => 
        item.created <= inputDate
      ).sort((a, b) => String(b.created).localeCompare(String(a.created))); // 新しい順にソート

      if (allAssessmentsInRange.length >= 2) {
        const latestAssessment = allAssessmentsInRange[0]; // 最新
        const previousAssessment = allAssessmentsInRange[1]; // 2番目に新しい

        if (latestAssessment?.content?.content && previousAssessment?.content?.content) {
          const latestData = latestAssessment.content.content;
          const previousData = previousAssessment.content.content;
          
          // 比較対象から除外する項目
          const excludeKeys = ['アセスメント実施者', 'アセスメント実施日', '開始時間', '終了時間'];
          
          // 変更点のみを抽出
          const changes = getAssessmentChanges(latestData, previousData, excludeKeys);
          return changes;
        } else {
          // アセスメントの内容が見つからない場合は空オブジェクトを返す（正常な状態）
          return {};
        }
      } else {
        // 比較するアセスメントが不足している場合は空オブジェクトを返す（正常な状態）
        return {};
      }
    } else {
      setSnack({ msg: 'アセスメントデータが見つかりません', severity: 'warning' });
      return {};
    }
  } catch (error) {
    console.error('Assessmentデータ取得エラー:', error);
  }
  
  return {};
};
