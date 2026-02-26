import React, {useEffect, useState, useRef, forwardRef, useMemo} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, makeStyles, TextField, FormControl, InputLabel, Select, Menu, MenuItem, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, Checkbox, DialogContentText } from '@material-ui/core';
import { convUID, getLodingStatus, getUser, lfToBr, brtoLf, getUisCookie, uisCookiePos } from '../../commonModule';
import SnackMsg from '../common/SnackMsg';
import { blue, red, teal, grey, yellow, orange, purple, indigo } from '@material-ui/core/colors';
import DeleteIcon from '@material-ui/icons/Delete';
import CreateIcon from '@material-ui/icons/Create';
import { Autocomplete } from '@material-ui/lab';
import { DateInput, NumInputGP } from '../common/StdFormParts';
import { AlbHTimeInput, AlbHMuiTextField } from '../common/HashimotoComponents';
import { LinksTab, LoadErr, LoadingSpinner, StdErrorDisplay, GoBackButton } from '../common/commonParts';
import { univApiCall, setRecentUser, getFilteredUsers } from '../../albCommonModule';
import { AddCircleOutline, AddIcCallOutlined } from '@material-ui/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { combineReducers } from 'redux';
import DateRangeIcon from '@material-ui/icons/DateRange';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { handleSelectInputAuto } from '../../albCommonModule';
import ControlPointIcon from '@material-ui/icons/ControlPoint';
import { PlanPrintButton, UserInfoDisplay, PlanDateChangeCopy, PlanOverlay, deepEqual } from '../plan/planCommonPart';
import { processDeepBrToLf, processDeepLfToBr } from '../../modules/newlineConv';
import { cleanSpecialCharacters } from '../../modules/cleanSpecialCharacters';
import SchoolIcon from '@material-ui/icons/School';
import { planMenu } from './planCommonPart';
import { SideSectionUserSelect } from '../schedule/SchByUser2';
import { getLS, setLS } from '../../modules/localStrageOprations';
import { planlsUid, PLAN_ADD_MODE_KEY, PLAN_ADD_MODE_ITEM } from './planConstants';
import { PlanRelatedItemsPanel } from './PlanRelatedItemsPanel';
import { saveCreatedDateToLS } from './utility/planLSUtils';
import { generateConferenceNoteFromAssessmentAndDraft, generatePlanReviewProposal, generateConferenceNoteFromMonitoringAndAssessment } from './planMakePrompt';
import { fetchAssessmentChanges } from './planCommonPart';
import { isPlanAddMode, resetPlanAddMode } from './planCommonPart';
import { llmApiCall } from '../../modules/llmApiCall';


const useStyles = makeStyles({
  planFormRoot: {
    width: 800,
    marginLeft: 'calc((100% - 800px) / 2)',
    position: 'relative',
    '& .planForm': {
      position: 'relative',
    },
    '& .fpRow': { display: 'flex', padding: 8, flexWrap: 'wrap' },
    '& .fpRow.multi': {
      '& > div': { marginRight: 8 },
    },
    '& .btnWrap': {
      textAlign: 'right',
      position: 'fixed',
      bottom: 16,
      right: 24,
      '& .MuiButtonBase-root': { marginInlineStart: 8 },
    },
    '& .title': {
      textAlign: 'center',
      marginTop: -16,
      marginBottom: 8,
      position: 'sticky',
      top: 80,
      zIndex: 100,
      paddingTop: 32,
      backgroundColor: '#fff',
      '& .main': {
        fontSize: '1.1rem',
        padding: 8,
        marginBottom: 8,
        color: teal[800],
        backgroundColor: teal[50],
        borderBottom: `1px solid ${teal[200]}`,
      },
      '& .user': { fontSize: '.9rem' },
      '& .user .name': { fontSize: '1.2rem', marginInlineEnd: 8 },
      '& .user .attr': { marginInlineStart: 16 , fontSize: '.9rem'},
    },
  },
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
    '& .attr': { fontSize: '.9rem', padding: 4},
  },
  userRight: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    position: 'relative',
    cursor: 'pointer',
    transition: 'all 0.4s',
    '&:hover': {
      '& .icon': { color: teal[800] },
      '& .icon .size': { fontSize: 40 },
    },
    '& .postal': { fontSize: '.9rem', padding: 4 },
    '& .address': { fontSize: '.9rem', padding: 4 },
    '& .icon': {
      color: grey[400],
      opacity: 0.8,
      position: 'absolute',
      right: 8,
      top: '50%',
      transform: 'translateY(-50%)',
      transition: '0.4s',
      '& .size': { 
        fontSize: 20,
        transition: 'font-size 0.8s',
      },
    },
  },
  deleteConfirmTrue: {
    backgroundColor: red[800],
    color: "#fff",
    '&:hover': { backgroundColor: red[900] },
  },
  groupTitle: {
    marginTop: 16, marginBottom: 8, padding: 8, marginBottom: 8,
    fontWeight: 300,fontSize: '.9rem',
    color: teal[800],
    backgroundColor: teal[50], borderBottom: `1px solid ${teal[200]}`,
  },
  rowIndex: {fontWeight: 600, fontSize: '1.1rem', color: teal[800], paddingTop: 12, marginRight: 4},
});

// 入力項目の定数定義（設定情報）
const inputDefinitions = [
  { label: '開催日', type: 'DateInput', required: true, style: { width: 120, marginLeft: -8 } },
  { label: '開始時間', type: 'TimeInput',  style: { width: 120, marginTop: 8, marginRight: 8 } },
  { label: '終了時間', type: 'TimeInput',  style: { width: 120, marginTop: 8 } },
  { label: '作成者', type: 'freesolo', style: { width: 120, marginTop: 8, marginLeft: 8 } },
  { label: '会議参加者', type: 'freesolo', style: { width: '55%', marginRight: 8 } },
  { label: '欠席者', type: 'freesolo', style: { width: '40%', marginRight: 8 } },
  { label: '議事録', type: 'text', style: { width: '100%' }, placeholder: '議事録', multiline: true },
  { label: '修正', type: 'text', style: { width: '100%' }, placeholder: '修正や追加する内容', multiline: true },
  { label: '課題', type: 'text', style: { width: '100%' }, placeholder: '課題', multiline: true },
];

// 初期値は文字列として設定する例
const getInitialValues = () => {
  const init = {};
  inputDefinitions.forEach(def => {
    if (def.type === 'group' && def.fields) {
      // グループの場合、0番目の要素（最初の行）として初期化
      const firstRow = {};
      def.fields.forEach(field => {
        firstRow[field.label] = field.defaultValue !== undefined ? field.defaultValue : '';
      });
      init[def.label] = [firstRow]; // 配列の最初の要素として設定
    } else {
      init[def.label] = def.defaultValue !== undefined ? def.defaultValue : '';
    }
  });
  return init;
};

// コンポーネントの外部に独立した関数として定義
const callLLM = async (prms) => {
  const { uid, users, inputs, setInputs, setSnack } = prms;
  
  // 生成に必要な情報を準備
  const user = getUser(uid, users);
  
  // 共通のプロンプト部分を関数化
  const getCommon = (letterCount) => `
    具体的かつ簡潔に記述してください
    専門的な表現を使用し、児童発達支援の文脈に沿った内容にしてください
    ${letterCount}文字程度
  `;

  // 生成したい項目の定義
  const items = [
    { key: '議事録', length: 300, instruction: '担当者会議の一般的な議事録のサンプルを作成してください。支援目標と支援内容について話し合われた内容を中心に記載してください。マークアップは使用せず平文のみでお願いします。表題、出席者、日時等は不要です。箇条書きも使用せず平文のみでお願いします。適切に改行は行って下さい。' },
    { key: '修正', length: 200, instruction: '支援計画の修正点についての記述を作成してください。前回からの変更点や改善点を記載してください。' },
    { key: '課題', length: 120, instruction: '今後の課題についての記述  を作成してください。支援における継続的な課題や新たに見えてきた課題を記載してください。' }
  ];

  // 並列処理で各項目を生成
  const promises = items.map(async (item) => {
    const prompt = `
      ${user.name}さんの${item.key}のサンプルを作成してください。
      ${item.instruction}
      ${getCommon(item.length)} 
    `;
    
    const res = await llmApiCall({prompt}, 'E23444', '', setSnack, '', '', false);
    
    if (res && res.data && res.data.response) {
      return { key: item.key, value: res.data.response };
    }
    return null;
  });
  
  // すべての非同期処理の結果を待つ
  const results = await Promise.all(promises);
  
  // 結果を一括で状態に反映
  const updates = {};
  results.forEach(result => {
    if (result) {
      updates[result.key] = result.value;
    }
  });
  
  setInputs(prev => ({ ...prev, ...updates }));
  
  // 生成完了を通知
  setSnack({ msg: '会議議事録の内容が生成されました', severity: 'success' });
};

const PlanConferenceNoteDetail = (props) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const allState = useSelector(s => s);
  const { hid, bid, users } = allState;
  const { uid, suid, allPersonalData, setAllPersonalData, snack, setSnack, withSideSection } = props;
  const history = useHistory();
  const location = useLocation();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  
  // URLパラメータからuidを取得し、確実に定義されたuidを使用
  const urlUid = new URLSearchParams(location.search).get('uid');
  const effectiveUid = urlUid || uid || suid;
  
  // 自由実費項目 open/close 用
  const user = getUser(effectiveUid, users);
  const initialValues = getInitialValues();
  const [originInputs, setOriginInputs] = useState(initialValues);
  const [inputs, setInputs] = useState(initialValues);
  const [dateDisabled, setDateDisabled] = useState(false);
  const planAiButtonDisplay = getUisCookie(uisCookiePos.planAiButtonDisplay) !== '0';
  const createdBase = originInputs?.['開催日'] || inputs?.['開催日'];
  const [genMenuAnchor, setGenMenuAnchor] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmInfo, setConfirmInfo] = useState({ psCreated: '', asCreated: '' });
  const [selectedRecords, setSelectedRecords] = useState({ personalSupport: null, assessment: null });
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [errors, setErrors] = useState({});
  
  // 計画見直し提案用のダイアログ状態
  const [planReviewDialogOpen, setPlanReviewDialogOpen] = useState(false);
  const [planReviewInfo, setPlanReviewInfo] = useState({ 
    monitoringDate: '', 
    personalSupportDate: '', 
    assessmentChanges: {},
    isImprovementMode: false // デフォルトは見守り（false）
  });

  // 日付変更／コピーは共通コンポーネントへ移行

  // 新規追加モードの判定
  const isAddMode = useMemo(() => {
    return isPlanAddMode(location, 'conferenceNote');
  }, [location.search]);

  // 子コンポーネントの ref を配列として管理する
  const lineRenderRefs = useRef([]);
  
  // 編集中フラグを管理するref（保存処理中の上書きを防ぐ）
  const isEditingRef = useRef(false);

  console.log(allPersonalData, 'allPersonalData PlanConferenceNoteDetail');
  console.log('uid:', uid, 'suid:', suid);

  // allPersonalDataから指定したフィールドのユニークな値を取得する関数
  const getUniqueOptionsFromPersonalData = (fieldName) => {
    const values = allPersonalData
      .map(item => item.content && item.content[fieldName])
      .filter(value => value && value.toString().trim() !== '')
      .map(value => value.toString().trim());
    
    // 重複を除去してソート
    return [...new Set(values)].sort();
  };

  // URLからcreatedParamを取得
  const urlParams = new URLSearchParams(location.search);
  const createdParam = urlParams.get('created');

  useEffect(() => {
    console.log('useEffect triggered - uid:', uid, 'allPersonalData length:', allPersonalData.length);
    
    // 編集中フラグが立っている場合はスキップ（保存処理中を保護）
    if (isEditingRef.current) {
      return;
    }
    
    // 編集中（未保存の変更がある）場合はuseEffectをスキップ
    // 保存後にallPersonalDataが更新されても、編集内容を上書きしない
    const hasUnsavedChanges = !deepEqual(originInputs, inputs);
    if (hasUnsavedChanges) {
      return;
    }
    
    // 新規追加モードの場合は初期値を設定（最優先）
    if (isAddMode) {
      setOriginInputs(initialValues);
      setInputs(initialValues);
      setDateDisabled(false);
      setErrors({});
      return;
    }
    
    // createdParamが指定されている場合は、その日付のデータを特定
    let t;
    if (createdParam) {
      t = allPersonalData.find(item => 
        item.uid === uid && 
        item.content && 
        item.content['開催日'] === createdParam
      );
    } else {
      // createdParamが指定されていない場合は、uidのみで検索
      t = allPersonalData.find(item => item.uid === uid);
    }
    
    console.log('Found data:', t);
    
    if (t) {
      // <br>タグを改行文字に戻す処理を汎用関数で置き換え
      const processedContent = processDeepBrToLf(t.content);
      console.log('Setting inputs with:', processedContent);
      setOriginInputs(processedContent);
      setInputs(processedContent);
      setDateDisabled(!!(t.content && t.content['開催日'] && t.content['開催日'].toString().trim() !== ''));
    } else {
      console.log('No data found, setting initial values');
      setOriginInputs(initialValues);
      setInputs(initialValues);
      setDateDisabled(false);
    }
    setErrors({}); // ユーザー切り替え時にエラーリセット
  }, [uid, allPersonalData, isAddMode, createdParam]);

  // 処理は PlanDateChangeCopy に集約

  const handleDelete = async () => {
    if (!deleteConfirm){
      setDeleteConfirm(true);
    } else {
      const prms = {
        a: 'deleteUsersPlan',hid, bid, uid: effectiveUid, item: 'conferenceNote', 
        created: inputs['開催日'] || createdParam
      };
      const res = await univApiCall(
        prms, 'E23441', '', setSnack, '削除されました', '削除に失敗しました', false
      );
      if (res && res.data && res.data.result) {
        // 削除成功後、inputsを初期状態に戻す
        setInputs(initialValues);
        setDeleteConfirm(false);
        // 担当者会議議事録リストから該当項目を削除
        let updatedPersonalData;
        
        if (createdParam) {
          updatedPersonalData = allPersonalData.filter(item => 
            !(item.uid === uid && 
              item.content && 
              item.content['開催日'] === createdParam)
          );
        } else {
          updatedPersonalData = allPersonalData.filter(item => item.uid !== uid);
        }
        setAllPersonalData(updatedPersonalData);
      }
    }
  }
  const handleCancel = () => {
    // createdParamが指定されている場合は、その日付のデータを特定
    let t;
    if (createdParam) {
      t = allPersonalData.find(item => 
        item.uid === uid && 
        item.content && 
        item.content['開催日'] === createdParam
      );
    } else {
      // createdParamが指定されていない場合は、uidのみで検索
      t = allPersonalData.find(item => item.uid === uid);
    }
    
    if (t) {
      setInputs(t.content || []);  // contentプロパティにアクセス
    } else {
      setInputs(initialValues);
    }
  }
  const handleSubmit = async () => {
    // 編集中フラグを立てる（useEffectでの上書きを防ぐ）
    isEditingRef.current = true;
    
    // 必須項目のバリデーション
    const newErrors = {};
    inputDefinitions.forEach(def => {
      if (def.required && (!inputs[def.label] || inputs[def.label].toString().trim() === '')) {
        newErrors[def.label] = true;
      }
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      // 開催日フィールドのエラーがある場合は特別なメッセージを表示
      if (newErrors['開催日'] && inputs['開催日']) {
        setSnack({ msg: '日付が不正または重複があります', severity: 'warning' });
      } else {
        setSnack({ msg: '必須項目が未入力です', severity: 'warning' });
      }
      isEditingRef.current = false; // エラー時もフラグを下ろす
      return; // 送信中断
    }

    try {
      // 入力データの改行文字を<br>タグに変換する処理を汎用関数で置き換え
      const processedInputs = processDeepLfToBr(cleanSpecialCharacters(inputs));

      const prms = {
        a: 'sendUsersPlan',
        hid,
        bid,
        uid: effectiveUid,
        item: 'conferenceNote',
        created: inputs['開催日'],
        content: { uid: effectiveUid, content: processedInputs },
      };
      const res = await univApiCall(prms, 'E23442', '', setSnack, '', '', false);
      if (res && res.data && res.data.result) {
        // 新規追加モードの場合、先にLocalStorageをリセット
        if (isAddMode) {
          resetPlanAddMode(history, inputs['開催日']);
        }
        
        // API呼び出し成功後の処理
        const newAllPersonalData = [...allPersonalData];
        
        // createdParamが指定されている場合は、その日付のデータを特定して更新
        let existingIndex;
        if (createdParam) {
          existingIndex = newAllPersonalData.findIndex(item => 
            item.uid === effectiveUid && 
            item.content && 
            item.content['開催日'] === createdParam
          );
        } else {
          existingIndex = newAllPersonalData.findIndex(item => item.uid === effectiveUid);
        }

        if (existingIndex !== -1) {
          newAllPersonalData[existingIndex] = { uid: effectiveUid, content: inputs };
        } else {
          newAllPersonalData.push({ uid: effectiveUid, content: inputs });
        }
        setAllPersonalData(newAllPersonalData);
        
        // 保存成功後、originInputsを現在のinputsの値で更新
        setOriginInputs({ ...inputs });
        
        // 少し待ってからフラグを下ろす（state更新が完了するまで）
        setTimeout(() => {
          isEditingRef.current = false;
        }, 50);
        
        setSnack({ msg: '担当者会議議事録が保存されました', severity: 'success' });
        
        // 作成日をローカルストレージの履歴に保存
        saveCreatedDateToLS(inputs['開催日']);
      } else {
        // API呼び出し失敗時の処理
        console.error('API呼び出し失敗:', res);
        isEditingRef.current = false; // 失敗時もフラグを下ろす
        setSnack({ msg: '保存に失敗しました。再度お試しください。', severity: 'error' });
      }
    } catch (error) {
      console.error('handleSubmit エラー:', error);
      isEditingRef.current = false; // エラー時もフラグを下ろす
      setSnack({ msg: '予期しないエラーが発生しました。入力内容を確認して再度お試しください。', severity: 'error' });
    }
  };

  // ラベルで項目を検索するヘルパー関数
  const findInputByLabel = (label) => {
    if (!inputDefinitions || !Array.isArray(inputDefinitions)) return undefined;
    return inputDefinitions.find(item => item.label === label);
  };

  

  // 入力変更ハンドラーを単純化
  const handleInputChange = (label, newValue) => {
    // フィールド定義を取得
    const fieldDef = findInputByLabel(label);
    
    // 入力タイプがDateInputの場合は特別な処理
    if (fieldDef?.type === 'DateInput') {
      // 日付オブジェクトの場合は値を取り出す
      const valueToStore = typeof newValue === 'object' && newValue !== null ? 
        (newValue.value || '') : newValue;
      
      setInputs(prev => ({
        ...prev,
        [label]: valueToStore
      }));
      return;
    }
    
    // TimeInputの場合も同様の処理
    if (fieldDef?.type === 'TimeInput') {
      // 時間オブジェクトの場合は値を取り出す
      const valueToStore = typeof newValue === 'object' && newValue !== null ? 
        (newValue.value || '') : newValue;
      
      setInputs(prev => ({
        ...prev,
        [label]: valueToStore
      }));
      return;
    }
    
    // その他の通常フィールド処理
    setInputs(prev => ({
      ...prev,
      [label]: newValue
    }));
  };



  // ここでPlanAssessmentDetail専用のhandleBlurを追加
  // 各入力項目がrequiredの場合、空欄ならエラー状態をinputsに反映します
  const handleBlur = (label, value) => {
    const inputDef = findInputByLabel(label);
    if (inputDef && inputDef.required && (!value || value.toString().trim() === '')) {
      console.warn(`${label} は入力必須です。`);
    }
    
    // 開催日の場合は重複チェック
    if (label === '開催日' && value) {
      const existingData = allPersonalData.find(item => 
        item.uid === uid && item.content && item.content['開催日'] === value
      );
      if (existingData) {
        setSnack({ msg: 'すでに存在している日付は指定できません', severity: 'warning' });
        setErrors(prev => ({ ...prev, [label]: true }));
      } else {
        setErrors(prev => {
          const newErr = { ...prev };
          delete newErr[label];
          return newErr;
        });
      }
    }
  };

  const getInputProps = (label) => {
    const def = getInputDefinition(label);
    const value = initialValues[label];
    return { ...def, value };
  };

  // 指定したラベルに該当する設定情報を返す
  const getInputDefinition = (label) => {
    return inputDefinitions.find(def => def.label === label);
  };

  // 同様にインデックスを取得する場合
  const getInputDefinitionIndex = (label) => {
    return inputDefinitions.findIndex(def => def.label === label);
  };

  // 削除実行処理
  // const confirmDelete = () => {
  //   if (deleteTarget.rowIndex !== null && deleteTarget.groupLabel) {
  //     removeGroupRow(deleteTarget.rowIndex, deleteTarget.groupLabel);
  //   }
  //   setDeleteDialogOpen(false);
  // };

  // FieldRenderを元の関数として残す
  const FieldRender = (name) => {
    const fieldDef = findInputByLabel(name);
    if (!fieldDef) return null;
    
    switch (fieldDef.type) {
      case 'DateInput':
        // 日付型の場合、オブジェクトか文字列かを判定して適切に処理
        const dateValue = typeof inputs[name] === 'object' && inputs[name] !== null ? 
          (inputs[name].value || '') : inputs[name];
        // 開催日フィールドの場合、dateDisabledの状態を適用
        const isDisabled = name === '開催日' ? dateDisabled : false;
        
        return (
          <DateInput
            label={fieldDef.longLabel || fieldDef.label}
            def={dateValue}
            required={fieldDef.required}
            style={fieldDef.style || {}}
            setExtVal={(val) => handleInputChange(name, val)}
            onFocus={(e) => handleSelectInputAuto(e)}
            onBlur={(e) => handleBlur(name, e.target.value)}
            cls={`tfMiddle`}
            disabled={isDisabled}
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
          />
        );
        case 'TimeInput':
          // 時間型の場合、オブジェクトか文字列かを判定して適切に処理
          const timeValue = typeof inputs[name] === 'object' && inputs[name] !== null ? 
            (inputs[name].value || '') : inputs[name];
          
          return (
            <AlbHTimeInput
              label={fieldDef.label}
              time={timeValue}
              setTime={newValue => handleInputChange(name, newValue)}
              required={fieldDef.required}
              style={fieldDef.style || {}}
            />
          );
  
      case 'freesolo':
        return (
          <Autocomplete
            freeSolo
            options={getUniqueOptionsFromPersonalData(name)}
            getOptionLabel={(option) => option || ""}
            value={inputs[name] || ''}
            onInputChange={(event, newInputValue) =>
              handleInputChange(name, newInputValue)
            }
            style={fieldDef.style || {}}
            onChange={(event, newValue) =>
              handleInputChange(name, newValue || '')
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={fieldDef.longLabel || fieldDef.label}
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
          />
        );
    }
  };

  // ボタンのonClickで関数を呼び出す際に必要な引数を渡す
  const openGenerateMenu = (e) => setGenMenuAnchor(e.currentTarget);
  const closeGenerateMenu = () => setGenMenuAnchor(null);

  const fetchAssessmentAndDraftForGeneration = async () => {
    try {
      const confDate = inputs?.['開催日'];
      if (!confDate) {
        setSnack({ msg: '開催日を先に入力してください', severity: 'warning' });
        return;
      }
      // 個別支援計画（原案）を取得
      const resPs = await univApiCall({ a: 'fetchUsersPlan', hid, bid, uid: effectiveUid, item: 'personalSupport' }, 'E23443', '', setSnack, '', '', false);
      const psCandidates = (resPs?.data?.dt || [])
        .filter(it => it.created <= confDate && it?.content?.content?.['原案'] === true)
        .sort((a, b) => String(b.created).localeCompare(String(a.created)));
      const psItem = psCandidates[0];
      if (!psItem) {
        setSnack({ msg: '条件に合致する個別支援計画原案が見つかりません', severity: 'warning' });
        return;
      }
      // アセスメントを取得（原案作成日以下）
      const resAs = await univApiCall({ a: 'fetchUsersPlan', hid, bid, uid: effectiveUid, item: 'assessment' }, 'E23443', '', setSnack, '', '', false);
      const asCandidates = (resAs?.data?.dt || [])
        .filter(it => it.created <= psItem.created)
        .sort((a, b) => String(b.created).localeCompare(String(a.created)));
      const asItem = asCandidates[0];
      if (!asItem) {
        setSnack({ msg: '条件に合致するアセスメントが見つかりません', severity: 'warning' });
        return;
      }
      setSelectedRecords({ personalSupport: psItem, assessment: asItem });
      setConfirmInfo({ psCreated: psItem.created, asCreated: asItem.created });
      setConfirmDialogOpen(true);
    } catch (e) {
      console.error(e);
      setSnack({ msg: '生成に必要なデータ取得でエラーが発生しました', severity: 'error' });
    } finally {
      closeGenerateMenu();
    }
  };

  // 計画見直し提案の生成（ダイアログ表示）
  const handlePlanReviewGeneration = async () => {
    try {
      const confDate = inputs?.['開催日'];
      if (!confDate) {
        setSnack({ msg: '開催日を先に入力してください', severity: 'warning' });
        return;
      }

      closeGenerateMenu();
      
      // 個別支援計画の最新データを取得
      const personalSupportRes = await univApiCall({
        a: 'fetchUsersPlan',
        hid,
        bid,
        uid,
        item: 'personalSupport'
      }, 'EFETCH10', '', setSnack, '', '', false);

      if (!personalSupportRes?.data?.result || !personalSupportRes.data.dt?.[0]) {
        setSnack({ msg: '個別支援計画のデータが見つかりません', severity: 'warning' });
        return;
      }

      const personalSupportDate = personalSupportRes.data.dt[0].created;

      // アセスメント変更点を取得
      const assessmentChanges = await fetchAssessmentChanges(
        hid, 
        bid, 
        uid, 
        confDate, 
        personalSupportDate, 
        setSnack
      );
      
      // ダイアログに表示する情報を設定
      setPlanReviewInfo({
        monitoringDate: confDate,
        personalSupportDate: personalSupportDate,
        assessmentChanges: assessmentChanges,
        isImprovementMode: false // デフォルトは見守り
      });
      
      // ダイアログを表示
      setPlanReviewDialogOpen(true);
    } catch (error) {
      console.error('計画見直し提案生成エラー:', error);
      setSnack({ msg: '計画見直し提案の生成に失敗しました', severity: 'error' });
    }
  };

  // 計画見直し提案の実行
  const handleConfirmPlanReview = async () => {
    try {
      setPlanReviewDialogOpen(false);
      setOverlayOpen(true);
      
      // 個別支援計画の最新データを取得
      const personalSupportRes = await univApiCall({
        a: 'fetchUsersPlan',
        hid,
        bid,
        uid,
        item: 'personalSupport'
      }, 'EFETCH10', '', setSnack, '', '', false);

      if (!personalSupportRes?.data?.result || !personalSupportRes.data.dt?.[0]) {
        setSnack({ msg: '個別支援計画のデータが見つかりません', severity: 'warning' });
        return;
      }

      const latestPersonalSupport = personalSupportRes.data.dt[0].content?.content || {};
      
      // モニタリングデータを取得
      const monitoringRes = await univApiCall({
        a: 'fetchUsersPlan',
        hid,
        bid,
        uid,
        item: 'monitoring'
      }, 'EFETCH10', '', setSnack, '', '', false);

      let monitoringData = {};
      if (monitoringRes?.data?.result && monitoringRes.data.dt) {
        const personalSupportDate = personalSupportRes.data.dt[0].created;
        const confDate = inputs?.['開催日'];
        
        // 個別支援計画作成日以降のモニタリングデータをフィルタリング
        const filteredMonitoring = monitoringRes.data.dt.filter(item => 
          item.created > personalSupportDate && item.created <= confDate
        );
        if (filteredMonitoring.length > 0) {
          // 最新のモニタリングデータを取得
          const latestMonitoring = filteredMonitoring.sort((a, b) => 
            String(b.created).localeCompare(String(a.created))
          )[0];
          monitoringData = latestMonitoring.content?.content || {};
        }
      }
      
      // 議事録を生成
      await generateConferenceNoteFromMonitoringAndAssessment({
        user,
        inputs,
        setInputs,
        personalSupport: latestPersonalSupport,
        monitoring: monitoringData,
        assessmentChanges: planReviewInfo.assessmentChanges,
        isImprovementMode: planReviewInfo.isImprovementMode,
        setSnack,
        hid,
        bid,
        uid: effectiveUid
      });
    } catch (error) {
      console.error('計画見直し提案生成エラー:', error);
      setSnack({ msg: '計画見直し提案の生成に失敗しました', severity: 'error' });
    } finally {
      setOverlayOpen(false);
    }
  };

  const handleConfirmGenerate = async () => {
    // 実行クリック: ダイアログを閉じて、オーバーレイ表示
    setConfirmDialogOpen(false);
    setOverlayOpen(true);
    try {
      const result = await generateConferenceNoteFromAssessmentAndDraft({
        uid: effectiveUid, users, hid, bid,
        conferenceCreated: inputs?.['開催日'],
        personalSupport: selectedRecords.personalSupport?.content?.content || {},
        assessment: selectedRecords.assessment?.content?.content || {},
        setSnack,
      });
      if (result) {
        setInputs(prev => ({
          ...prev,
          '議事録': result['議事録'] || '',
          '修正': result['修正'] || '',
          '課題': result['課題'] || '',
        }));
        setSnack({ msg: '原案・アセスメントから内容を生成しました', severity: 'success' });
      }
    } catch (e) {
      console.error(e);
      setSnack({ msg: '生成に失敗しました', severity: 'error' });
    } finally {
      setOverlayOpen(false);
    }
  };

  return (
    <div 
      className={classes.planFormRoot}
      style={withSideSection ? { marginLeft: 'max(196px, calc((100% - 800px) / 2))' } : {}}
    >
      <PlanRelatedItemsPanel 
        uid={effectiveUid} 
        created={createdBase}
        originInputs={originInputs}
        inputs={inputs}
        currentPlanType="conferenceNote"
      />
      <form id='ed95rbb77' className='planForm'>
        <div className='title'>
          <div className='main'>担当者会議議事録</div>
          <UserInfoDisplay user={user} uid={effectiveUid} />
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <Button
              startIcon={<AddCircleOutline />}
              style={{ color: indigo[500], marginRight: 8 }}
              onClick={() => {
                // URLにmode=addパラメータを追加
                const params = new URLSearchParams(location.search);
                params.set('mode', 'add');
                history.replace({
                  pathname: location.pathname,
                  search: params.toString()
                });
                // LocalStorageも設定（バックアップ）
                setLS(PLAN_ADD_MODE_KEY, 'true');
                setLS(PLAN_ADD_MODE_ITEM, 'conferenceNote');
                // 初期値にリセット
                setInputs(initialValues);
                setOriginInputs(initialValues);
                setDateDisabled(false);
              }}
            >
              新規
            </Button>
            <PlanDateChangeCopy
              hid={hid}
              bid={bid}
              uid={effectiveUid}
              item="conferenceNote"
              created={originInputs?.['開催日']}
              inputs={inputs}
              setInputs={setInputs}
              originInputs={originInputs}
              setOriginInputs={setOriginInputs}
              setSnack={setSnack}
              createdField="開催日"
              allPersonalData={allPersonalData}
              setAllPersonalData={setAllPersonalData}
            />
            <Button
              startIcon={<SchoolIcon />}
              onClick={openGenerateMenu}
              style={{ color: orange[800] }}
            >
              生成
            </Button>
            <Menu
              anchorEl={genMenuAnchor}
              keepMounted
              open={Boolean(genMenuAnchor)}
              onClose={closeGenerateMenu}
              getContentAnchorEl={null}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <MenuItem onClick={fetchAssessmentAndDraftForGeneration}>
                アセスメントと計画原案から生成
              </MenuItem>
              <MenuItem onClick={handlePlanReviewGeneration}>
                モニタリングとアセスメントの変更点から生成
              </MenuItem>
            </Menu>
            <PlanPrintButton 
              item="conferenceNote" 
              created={originInputs?.['開催日']} 
              uid={effectiveUid}
              originInputs={originInputs} 
              inputs={inputs}
            />
          </div>
        </div>
        {/* 日付変更／コピー用のボタン群 */}
        
        {/* アセスメント基本情報 - 1行目 */}
        <div className="fpRow">
          {FieldRender('開催日')}
          {FieldRender('開始時間')}
          {FieldRender('終了時間')}
          {/* {FieldRender('実施回数')} */}
          {FieldRender('作成者')}
        </div>
        <div className="fpRow">
          {FieldRender('会議参加者')}
          {FieldRender('欠席者')}
        </div>
        <div className="fpRow">{FieldRender('議事録')}</div>
        <div className="fpRow">{FieldRender('修正')}</div>
        <div className="fpRow">{FieldRender('課題')}</div>
        {/* グループ「支援目標」のレンダリング */}
        {/* <div className="groupSection">
          <h3 className={classes.groupTitle}>支援目標及び具体的な支援内容</h3>
          {groupRender('支援目標', groupProps)}
        </div> */}
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
      {/* 日付変更／コピーは PlanDateChangeCopy 内に集約 */}
      <SnackMsg {...snack} />
      <PlanOverlay open={overlayOpen} zIndex={9999}>
        <span>
          <span style={{ color: 'yellow' }}>
            {user?.name?.split(' ')[1]}
          </span>
          さんの会議内容を準備しています... ✏️
        </span>
      </PlanOverlay>
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>生成の確認</DialogTitle>
        <DialogContent>
          <DialogContentText>
            個別支援計画原案（作成日）：{confirmInfo.psCreated || '-'}
          </DialogContentText>
          <DialogContentText>
            アセスメント（作成日）：{confirmInfo.asCreated || '-'}
          </DialogContentText>
          <DialogContentText>
            上記のデータを基に議事録案を生成します。よろしいですか？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} color="default">キャンセル</Button>
          <Button onClick={handleConfirmGenerate} color="primary" variant="contained">実行</Button>
        </DialogActions>
      </Dialog>
      
      {/* 計画見直し提案用のダイアログ */}
      <Dialog open={planReviewDialogOpen} onClose={() => setPlanReviewDialogOpen(false)}>
        <DialogTitle>生成確認</DialogTitle>
        <DialogContent>
          <DialogContentText>
            モニタリング（実施日）：{planReviewInfo.monitoringDate || '-'}
          </DialogContentText>
          <DialogContentText>
            個別支援計画（作成日）：{planReviewInfo.personalSupportDate || '-'}
          </DialogContentText>
          
          {/* アセスメント変更点の表示 */}
          {planReviewInfo.assessmentChanges && Object.keys(planReviewInfo.assessmentChanges).length > 0 && (
            <div style={{ marginTop: 16, marginBottom: 16 }}>
              <DialogContentText style={{ fontWeight: 'bold', marginBottom: 8, color: teal[800] }}>
                アセスメント変更点：
              </DialogContentText>
              <div style={{ maxHeight: 200, overflowY: 'auto', padding: 8 }}>
                {Object.entries(planReviewInfo.assessmentChanges).map(([key, change]) => (
                  <div key={key} style={{ marginBottom: 12, padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: 4, color: teal[800], fontSize: '0.9rem' }}>
                      {key}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      変更後: {change.current ? String(change.current).trim() : 'なし'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 議事録モード選択 */}
          <div style={{ marginTop: 16, marginBottom: 16 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={planReviewInfo.isImprovementMode || false}
                  onChange={(e) => setPlanReviewInfo(prev => ({
                    ...prev,
                    isImprovementMode: e.target.checked
                  }))}
                  color="primary"
                />
              }
              label="改善議事録を作成する"
            />
            <DialogContentText style={{ fontSize: '0.8rem', color: '#666', marginTop: 4 }}>
              {(planReviewInfo.isImprovementMode || false)
                ? '支援策の改善提案に重点を置いた議事録を作成します'
                : '現在の状況確認と支援策の見守りに重点を置いた議事録を作成します（デフォルト）'
              }
            </DialogContentText>
          </div>
          
          <DialogContentText>
            上記の情報を基に議事録案を生成します。よろしいですか？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPlanReviewDialogOpen(false)} color="default">キャンセル</Button>
          <Button onClick={handleConfirmPlanReview} color="primary" variant="contained">実行</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export const PlanConferenceNote = () => {
  const allState = useSelector(s=>s);
  const {users, hid, bid, stdDate, service, classroom} = allState;
  const loadingStatus = getLodingStatus(allState);
  const location = useLocation();
  const history = useHistory();
  const isMountedRef = useRef(true);
  
  // URLパラメータからcreated、mode、uid、lastmonthを取得
  const urlParams = new URLSearchParams(location.search);
  const createdParam = urlParams.get('created');
  const modeParam = urlParams.get('mode');
  const uidParam = urlParams.get('uid');
  const lastmonthParam = urlParams.get('lastmonth');
  
  // uidの優先順位: URLパラメータ > ローカルストレージ > 最初のユーザー
  let defUid = uidParam || getLS(planlsUid);
  const filterdUsers = getFilteredUsers(users, service, classroom);
  const found = filterdUsers.find(item => item.uid === String(defUid));
  if (!found) {
    defUid = filterdUsers?.[0]?.uid;
  }

  // 新規追加モードの場合、LocalStorageに設定
  useEffect(() => {
    if (modeParam === 'add') {
      setLS(PLAN_ADD_MODE_KEY, 'true');
      setLS(PLAN_ADD_MODE_ITEM, 'conferenceNote');
    }
  }, [modeParam]);
  
  // URLパラメータでuidが指定された場合、ローカルストレージに保存
  useEffect(() => {
    if (uidParam && filterdUsers.find(item => item.uid === String(uidParam))) {
      setLS(planlsUid, String(uidParam));
    }
  }, [uidParam, filterdUsers]);

  const [suid, setSuid] = useState(String(defUid));
  const [userAttr, setUserAttr] = useState([]);
  const [allPersonalData, setAllPersonalData] = useState([]);
  const [snack, setSnack] = useState({msg: '', severity: ''});
  const appPageSStyle = {marginTop: 80}
  const limit = users.length + 50;
  
  useEffect(() => {
    isMountedRef.current = true;
    
    const fetchData = async () => {
      try {
        const prms = {a: 'fetchUsersPlan', hid, bid, item: 'conferenceNote', limit};
        
        // lastmonthパラメータが指定されている場合は追加
        if (lastmonthParam) {
          prms.lastmonth = lastmonthParam;
          delete prms.limit; // lastmonthが指定されている場合はlimitを削除
        }
        

        
        const res = await univApiCall(prms, 'E23441', '', '');
        
        // API呼び出し後もコンポーネントがマウントされていることを確認
        if (isMountedRef.current && res && res?.data?.result) {
          const assessments = (res.data?.dt ?? []).map(item => ({
            uid: item.uid,
            content: (() => {
              const raw = item?.content?.content ?? item?.content ?? {};
              if (typeof raw === 'string') {
                try {
                  return JSON.parse(raw);
                } catch (_) {
                  return {};
                }
              }
              return raw;
            })(),
            item: item.item,
            created: item.created,
          }));
          setAllPersonalData(assessments);
          // created 指定時でも表示ユーザーは URL/LS 優先（上書きしない）
        } else if (isMountedRef.current && res && !res?.data?.result) {
          // エラーレスポンスの場合のみスナックメッセージを表示
          setSnack({
            msg: 'データ取得に失敗しました', severity: 'error', errorId: 'EP23442', 
            onErrorDialog: true
          });
        }
      } catch (error) {
        if (isMountedRef.current) {
          console.error('データ取得エラー:', error);
        }
      }
    };
    
    // mode=addの場合はデータ取得をスキップ
    if (modeParam === 'add') {
      return;
    }
    
    // データがロードされている場合に実行（常に複数件取得し、詳細側で絞り込み）
    if (loadingStatus.loaded && (allPersonalData.length === 0)) {
      fetchData();
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [loadingStatus.loaded, stdDate, hid, bid, location.search, lastmonthParam, modeParam]);

  useEffect(() => {
    if (suid) {
      setLS(planlsUid, String(suid));
      setRecentUser(suid);
    }
  }, [suid]);

  // ユーザー変更時の処理
  const handleUserChange = (newUid) => {
    setSuid(newUid);
  };

  if (loadingStatus === 'loading'){
    return <LoadingSpinner/>
  }
  else if (loadingStatus.error){
    return (
      <LoadErr loadStatus={loadingStatus} errorId={'E49822'} />
    )
  }
  else if (loadingStatus.loaded && !users.length){
    console.log('E49413');
    return(
      <StdErrorDisplay 
        errorText = '利用者が未登録です。'
        errorSubText = {`利用者の登録をしてからの登録を行って下さい。`}
        errorId = 'E49413'
      />
    )
  }


  return (<>
    <LinksTab menu={planMenu} />
    <div className='AppPage' style={appPageSStyle}>
      {createdParam || modeParam === 'add' ? (
        <GoBackButton url="/plan/manegement" style={{top: 96, left: 60, position: 'fixed'}} />
      ) : (
        <SideSectionUserSelect
          suid={suid} setSuid={handleUserChange} 
          userAttr={userAttr} setUserAttr={setUserAttr} allowAnyService
        />
      )}
              <PlanConferenceNoteDetail 
          uid={uidParam || suid} 
          suid={suid}
          allPersonalData={allPersonalData} setAllPersonalData={setAllPersonalData}
          snack={snack} setSnack={setSnack}
          withSideSection={!createdParam}
        />
      <SnackMsg {...snack} />
    </div>
  </>)
}