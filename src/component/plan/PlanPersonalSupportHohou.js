import React, {useEffect, useState, useRef, forwardRef, useMemo} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, makeStyles, TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, Checkbox, DialogContentText, Menu, ListItemIcon, ListItemText } from '@material-ui/core';
import { convUID, getLodingStatus, getUisCookie, getUser, parseDate, parsePermission, uisCookiePos } from '../../commonModule';
import SnackMsg from '../common/SnackMsg';
import { blue, red, teal, grey, yellow, orange, indigo } from '@material-ui/core/colors';
import DeleteIcon from '@material-ui/icons/Delete';
import CreateIcon from '@material-ui/icons/Create';
import { Autocomplete } from '@material-ui/lab';
import { SideSectionUserSelect } from '../schedule/SchByUser2';
import { DateInput, NumInputGP } from '../common/StdFormParts';
import { AlbHTimeInput, AlbHMuiTextField } from '../common/HashimotoComponents';
import { LinksTab, LoadErr, LoadingSpinner, StdErrorDisplay, GoBackButton } from '../common/commonParts';
import { HOHOU } from '../../modules/contants';
import { univApiCall, setRecentUser, getFilteredUsers } from '../../albCommonModule';
import { AddCircleOutline, AddIcCallOutlined, ArrowDropUp, ArrowDropDown, SwapVert, Close } from '@material-ui/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { combineReducers } from 'redux';
import { handleSelectInputAuto } from '../../albCommonModule';
import ControlPointIcon from '@material-ui/icons/ControlPoint';
import { PlanPrintButton, UserInfoDisplay, PlanOverlay, ConfirmDialog, PlanDateChangeCopy, isPlanAddMode, resetPlanAddMode, findInputByLabel, getGroupItemsDefinitions, findGroupDefinitionByLabel, getUniqueOptionsFromPersonalData, FieldRender, addGroupRow, removeGroupRow, swapGroupRows, addGroupRowWithSync, deepEqual } from './planCommonPart';
import { processDeepBrToLf, processDeepLfToBr } from '../../modules/newlineConv';
import { cleanSpecialCharacters } from '../../modules/cleanSpecialCharacters';
import SchoolIcon from '@material-ui/icons/School';
import { planMenu } from './planCommonPart';
import { llmApiCall,  } from '../../modules/llmApiCall';
import { getLS, setLS } from '../../modules/localStrageOprations';
import { planlsUid, PLAN_ADD_MODE_KEY, PLAN_ADD_MODE_ITEM } from './planConstants';
import { getPriorityService } from '../Billing/blMakeData2021';
import { purple } from '@material-ui/core/colors';
import { datePtn } from '../../modules/contants';
import { saveCreatedDateToLS } from './utility/planLSUtils';
import { syncGroupRowStableIds } from './utility/groupRowIdUtils';
import { generateComprehensivePlan,  } from './planMakePrompt';
import { PlanRelatedItemsPanel } from './PlanRelatedItemsPanel';


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
  { label: '児発管', type: 'freesolo' ,  style: { width: '20%' ,marginRight: 8}},
  { label: '補助作成者', type: 'freesolo', style: { width: '20%', marginRight: 8 } },
  // { label: '実施回数', type: 'NumInputGP', required: true, defaultValue: 0 ,
  //   style: { width: 120 ,marginRight: 8, marginTop: -8}
  // },
  { label: '原案', type: 'checkbox', defaultValue: false, style: {}},
  { label: '開始日', type: 'DateInput', required: true, style: { width: 120, marginTop: -8 }},
  { label: '作成日', type: 'DateInput', required: true, style: { width: 120, marginTop: -8, marginLeft: -8 }},
  { 
    label: '有効期限', type: 'NumInputGP', required: true, defaultValue: 6 , 
    style: { width: 120 , marginTop: -8}
  },
  { label: '電子サイン依頼', type: 'checkbox', defaultValue: false, style: {}},
  { label: '説明同意日', type: 'DateInput', style: { width: 120, marginTop: -8}},
  { 
    label: '本人意向', type: 'text', style: { width: '100%' } , 
    placeholder: '生活に対する意向（本人）', multiline: true
  },
  { label: '家族意向', type: 'text', style: { width: '100%' } , 
    placeholder: '生活に対する意向（家族）', multiline: true, 
  },
  { label: '支援方針', type: 'text', style: { width: '100%' } , placeholder: '総合的な支援方針', multiline: true},
  { label: '長期目標', type: 'text', style: { width: '100%' } , multiline: true},
  { label: '短期目標', type: 'text', style: { width: '100%' } , multiline: true},
  // { label: '支援提供時間', type: 'text', style: { width: '100%' } , multiline: true},
  // { label: '迎え', type: 'text', style: { width: 200, marginRight: 8 } , placeholder: 'なし/あり（学校名等）'},
  // { label: '送り', type: 'text', style: { width: 200,  } , placeholder: 'なし/あり（自宅等）'},
  { 
    label: '支援目標', title: '支援目標及び具体的な支援内容',
    type: 'group', 
    fields: [
      { 
        label: '項目', type: 'select', required: true, value: '', 
        souce: ['直接支援', '間接支援', '本人支援', '家族支援', '地域支援', '移行支援', 'その他'], 
        style:{width: 120, marginLeft: 8}, 
      },
      { label: '支援目標', type: 'text', style:{width: 600, marginLeft: 8}, multiline: true},
      { label: '支援内容', type: 'text', style:{width: '95%', marginLeft: 24, }, multiline: true},
      { 
        label: '五領域', type: 'checkboxes', style:{width: '100%', marginLeft: 24} ,
        souce: ['人間関係・社会性', '運動・感覚', '認知・行動', '言語・コミュ', '健康・生活']
      },
      { 
        label: '達成期間', type: 'NumInputGP', required: true, defaultValue: 6 , 
        style:{marginLeft: 16}
      },
      { 
        label: '担当者・提供機関', type: 'freesolo', required: true, 
        style:{width: '25%', marginTop: 8, marginRight: 8}
      },
      { label: '留意事項', type: 'text', style:{width: '95%', marginLeft: 24, }, multiline: true},
      { label: '優先順位', type: 'NumInputGP', required: true, defaultValue: 0 ,  },
    ]
  },
  { label: '備考', type: 'text', style: { width: '100%' } , multiline: true},
  { 
    label: '日々の課題', type: 'text', placeholder: '設定で日報に反映されます', 
    style: { width: '100%' } , multiline: true
  },
];


// 後方互換性のための関数（既存のcallLLMを置き換え）
const callLLM = async (prms) => {
  // isModifyパラメータがtrueの場合は修正生成、falseまたは未定義の場合は新規生成
  if (prms.isModify) {
    // 修正生成の場合は既存の内容を考慮した生成を行う
    await generateComprehensivePlan({...prms, isModify: true});
  } else {
    // 新規生成の場合は従来通りの処理
    await generateComprehensivePlan(prms);
  }
};



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

// ファイルのトップレベルに LineRender コンポーネントを定義
const LineRender = forwardRef((props, ref) => {
  const { 
    rowIndex, 
    groupLabel, 
    inputs, 
    handleGroupChange, 
    handleBlur, 
    onRemove, 
    sortMode, 
    onSwapUp, 
    onSwapDown, 
    providerOptions,
    planItemFreeSolo 
  } = props;
  const containerRef = useRef(null);
  const classes = useStyles();
  const initialRowData = inputs[groupLabel] && inputs[groupLabel][rowIndex] ? inputs[groupLabel][rowIndex] : {};
  const [localRowData, setLocalRowData] = useState(initialRowData);
  
  const getGroupFieldDefinition = (fieldLabel) => {
    const group = inputDefinitions.find(def => def.label === groupLabel && def.type === 'group');
    return group ? group.fields.find(field => field.label === fieldLabel) : null;
  };

  useEffect(() => {
    setLocalRowData(initialRowData);
  }, [initialRowData]);

  const handleChange = (field, value) => {
    console.log(field, value, 'handleChange, field, value');
    setLocalRowData(prev => ({ ...prev, [field]: value }));
  };

  // 少し待ってから、コンテナ内にフォーカスが残っていないか確認して同期する
  const syncWithParent = () => {
    console.log('syncWithParent called');
    setTimeout(() => {
      console.log('Active element:', document.activeElement);
      console.log('Container contains active element:', 
        containerRef.current?.contains(document.activeElement));
      
      if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
        console.log('同期実行', localRowData);
        Object.keys(localRowData).forEach((fld) => {
          handleGroupChange(groupLabel, rowIndex, fld, localRowData[fld]);
        });
      } else {
        console.log('同期条件を満たしていない');
      }
    }, 100);
  };

  // 親から最新の値を強制同期できるようにする関数を公開
  React.useImperativeHandle(ref, () => ({
    forceSync: () => {
      Object.keys(localRowData).forEach((field) => {
        handleGroupChange(groupLabel, rowIndex, field, localRowData[field]);
      });
    }
  }));

  // FieldRenderを使用して各フィールドを描画する関数
  const renderField = (label) => {
    const fieldDef = getGroupFieldDefinition(label);
    if (!fieldDef) return null;

    // 必要に応じて定義を書き換える（freesoloのoptionsなど）
    let targetDef = fieldDef;
    if (label === '担当者・提供機関' && providerOptions) {
      targetDef = { ...fieldDef, souce: providerOptions };
    }
    // 項目を自由記述（freesolo）にする設定が有効なとき
    if (label === '項目' && planItemFreeSolo) {
      targetDef = { ...fieldDef, type: 'freesolo' };
    }

    // FieldRenderに渡すための疑似的な定義配列を作成
    const tempDefinitions = [targetDef];
    
    // FieldRender用のパラメータオブジェクト
    const prms = {
      inputDefinitions: tempDefinitions,
      inputs: localRowData,
      handleInputChange: (name, val) => {
        handleChange(name, val);
        // チェックボックスの場合は即時同期（onBlurがないため）
        if (targetDef.type === 'checkboxes' || targetDef.type === 'checkbox') {
           setTimeout(() => {
             handleGroupChange(groupLabel, rowIndex, name, val);
           }, 10);
        }
      },
      handleBlur: syncWithParent, // 引数無視してsync
      errors: {}, // LineRender内ではエラー表示なし
      dateDisabled: false,
      handleSelectInputAuto: () => {},
      allPersonalData: [], // freesoloのsouceを渡すので不要
      disabled: sortMode // sortMode中はdisabledにする
    };

    return FieldRender(label, prms);
  };

  // ここにJSX以外のロジックや変数宣言を自由に記述できます
  const itemForGoryouik = ['本人支援', '家族支援', '移行支援', '地域支援', 'その他'];

  return (
    <div style={{ position: 'relative' }}>
      <div ref={containerRef} className="fpRow" >
        <div className={classes.rowIndex}>{rowIndex + 1}</div>
        {renderField('項目')}
        {renderField('支援目標')}
        {inputs[groupLabel].length > 1 && (
          <IconButton 
            size="small" 
            onClick={() => onRemove(rowIndex, groupLabel)}
            style={{ marginLeft: 'auto', color: red[700] }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </div>
      <div className="fpRow">{renderField('支援内容')}</div>
      {!sortMode && (
        <>
          <div className="fpRow">{renderField('五領域')}</div>
          <div className="fpRow">{renderField('留意事項')}</div>
        </>
      )}
      {!sortMode && (
        <div className="fpRow">
          {renderField('達成期間')}
          {renderField('担当者・提供機関')}
          {renderField('優先順位')}
        </div>
      )}
      {sortMode && (
        <div style={{ 
          position: 'absolute', 
          right: '-60px', 
          top: '50%', 
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          {rowIndex > 0 && (
            <IconButton
              size="medium"
              onClick={() => onSwapUp(rowIndex, groupLabel)}
              style={{ color: teal[600] }}
            >
              <ArrowDropUp fontSize="large" />
            </IconButton>
          )}
          {rowIndex < inputs[groupLabel].length - 1 && (
            <IconButton
              size="medium"
              onClick={() => onSwapDown(rowIndex, groupLabel)}
              style={{ color: teal[600] }}
            >
              <ArrowDropDown fontSize="large" />
            </IconButton>
          )}
        </div>
      )}
    </div>
  );
});

const PlanPersonalSupportHohouDetail = (props) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const allState = useSelector(s => s);
  const { hid, bid, users, account } = allState;
  const permission = parsePermission(account)[0][0];
  const { 
    uid, suid, allPersonalData, setAllPersonalData, snack, setSnack ,withSideSection
  } = props;
  const history = useHistory();
  const location = useLocation();
  // URLからcreatedParamを取得（Detail側で該当レコードを特定するために使用）
  const urlParams = new URLSearchParams(location.search);
  const createdParam = urlParams.get('created');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  
  // URLパラメータからuidを取得し、確実に定義されたuidを使用
  const urlUid = urlParams.get('uid');
  const effectiveUid = urlUid || uid || suid;
  
  const user = getUser(effectiveUid, users);

  // 電子サイン依頼が可能かどうかの判定（LINE連携状態の確認）
  const canRequestSign = user?.ext?.line?.auth?.checked === true && !!user?.ext?.line?.id;

  const initialValues = getInitialValues();
  const [originInputs, setOriginInputs] = useState(initialValues);
  const [inputs, setInputs] = useState(initialValues);
  const [dateDisabled, setDateDisabled] = useState(false);
  const [relatedItems, setRelatedItems] = useState([]);
  const service = (user?.service || '').split(',');
  const onlyHohou = service.length === 1 && service[0] === HOHOU;
  const signRequireEnabled = allState.com?.ext?.usersPlanSettings?.signRequire ?? false;
  const planItemFreeSolo = allState.com?.ext?.usersPlanSettings?.planItemFreeSolo ?? false;
  const useSubCreator = allState.com?.ext?.usersPlanSettings?.useSubCreator ?? false;
  const showSignSection =
    inputs?.['原案'] !== true &&
    ((signRequireEnabled && canRequestSign) || !!originInputs?.signUrl);

  // 日付変更／コピーは共通コンポーネントへ移行

  // 子コンポーネントの ref を配列として管理する
  const lineRenderRefs = useRef([]);

  // PlanPersonalSupportDetail コンポーネント内に状態を追加
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ rowIndex: null, groupLabel: null });
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [generateConfirmDialogOpen, setGenerateConfirmDialogOpen] = useState(false);
  const [sortMode, setSortMode] = useState(false);
  
  // 生成メニュー用の状態
  const [generateMenuAnchorEl, setGenerateMenuAnchorEl] = useState(null);
  
  // 修正生成用のダイアログ状態
  const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
  const [modifyItems, setModifyItems] = useState('');
  const [isFetchingFromConference, setIsFetchingFromConference] = useState(false);
  
  // 修正生成の内容を保持する状態
  const [isModifyMode, setIsModifyMode] = useState(false);
  
  // 日付未入力警告ダイアログの状態
  const [dateWarningDialogOpen, setDateWarningDialogOpen] = useState(false);
  
  // 生成前確認メッセージと事前フェッチ結果
  const [confirmMessage, setConfirmMessage] = useState('');
  const [preflightAssessment, setPreflightAssessment] = useState(null);

  // 右側固定の関連アイテムパネル用の作成日ベース
  const createdBase = originInputs?.['作成日'] || inputs?.['作成日'];

  const syncSupportGoalIds = (sourceInputs) => {
    const baseInputs = sourceInputs || {};
    const synced = syncGroupRowStableIds({
      rows: baseInputs['支援目標'],
      uid: effectiveUid,
      createdDate: baseInputs['作成日'],
      startDate: baseInputs['開始日'],
      idField: 'ID',
      lineIdField: 'LineID',
      lineNoField: 'LineNo',
    });
    if (!synced.changed) {
      return baseInputs;
    }
    return {
      ...baseInputs,
      '支援目標': synced.rows,
    };
  };

  useEffect(() => {
    const next = syncSupportGoalIds(inputs);
    if (next !== inputs) {
      setInputs(next);
      if (deepEqual(originInputs, inputs)) {
        setOriginInputs(next);
      }
    }
  }, [effectiveUid, inputs?.['作成日'], inputs?.['開始日'], inputs?.['支援目標'], originInputs]);

  // 担当者・提供機関の候補を作成
  const providerOptions = useMemo(() => {
    const values = new Set();
    if (allPersonalData && Array.isArray(allPersonalData)) {
      allPersonalData.forEach(data => {
        const content = data.content || {};
        // '支援目標' グループを対象とする
        const groupData = content['支援目標'];
        if (Array.isArray(groupData)) {
          groupData.forEach(row => {
            const val = row['担当者・提供機関'];
            if (val && typeof val === 'string' && val.trim() !== '') {
              // 重複排除のためSetを使用
              values.add(val.trim());
            }
          });
        }
      });
    }
    return Array.from(values).sort();
  }, [allPersonalData]);

  // 新規追加モードの判定
  const isAddMode = useMemo(() => {
    return isPlanAddMode(location, 'personalSupportHohou');
  }, [location.search]);

  // 編集中フラグを管理するref（LineRender内の編集も考慮）
  const isEditingRef = useRef(false);

  useEffect(() => {
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
      return;
    }
    
    // createdParamが指定されている場合は、その日付のデータを特定
    let t;
    if (createdParam) {
      t = allPersonalData.find(item => 
        item.uid === uid && 
        item.content && 
        item.content['作成日'] === createdParam
      );
    } else {
      // createdParamが指定されていない場合は、uidのみで検索
      t = allPersonalData.find(item => item.uid === uid);
    }
    
    if (t) {
      // <br>を\nに変換してからセット
      const processedContent = processDeepBrToLf(t.content);
      
      // 説明同意日の自動設定（データに含まれていない場合のみ）
      if (!processedContent['説明同意日'] && processedContent.signUrl && processedContent.signTimestamp) {
        let timestampDate = '';
        const rawTs = processedContent.signTimestamp;
        
        // シリアル値（数値または数値文字列）または ISOString などの文字列を Date オブジェクトに変換
        let d = null;
        if (/^\d+$/.test(String(rawTs))) {
          d = new Date(Number(rawTs));
        } else if (typeof rawTs === 'string') {
          d = new Date(rawTs);
        }

        if (d && !isNaN(d.getTime())) {
          // ローカルタイムに基いて YYYY-MM-DD 形式にフォーマット（時差問題を回避）
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          timestampDate = `${year}-${month}-${day}`;
        }

        if (timestampDate && datePtn.test(timestampDate)) {
          processedContent['説明同意日'] = timestampDate;
        }
      }

      setOriginInputs(processedContent);
      setInputs(processedContent);
      // 作成日が有効な値であれば変更不可にする
      const hasValidCreatedDate = t.content && t.content['作成日'] && t.content['作成日'].toString().trim() !== '';
      setDateDisabled(hasValidCreatedDate);
    } else {
      setOriginInputs(processDeepBrToLf(initialValues));
      setInputs(processDeepBrToLf(initialValues));
      setDateDisabled(false);
    }
  }, [uid, allPersonalData, isAddMode, createdParam]);

  // 家族意向または本人意向が空白で、作成日が指定されている場合にassessmentデータから取得
  useEffect(() => {
    const fetchAssessmentData = async () => {
      // 作成日が指定されているかチェック
      const createdDate = inputs['作成日'];
      if (!createdDate || createdDate.toString().trim() === '') {
        return;
      }

      // 作成日が有効な日付形式かチェック
      if (!datePtn.test(createdDate.toString())) {
        return;
      }

      // 家族意向または本人意向が空白かチェック
      const familyIntention = inputs['家族意向'] || '';
      const personalIntention = inputs['本人意向'] || '';
      
      // if (familyIntention.trim() !== '' && personalIntention.trim() !== '') {
      //   return; // 両方とも入力済みの場合は何もしない
      // }

      try {
        // assessmentデータを取得
        const assessmentRes = await univApiCall({
          a: 'fetchUsersPlan', 
          hid, 
          bid, 
          uid, 
          item: 'assessment'
        }, 'E23443', '', setSnack, '', '', false);

        if (assessmentRes?.data?.result && assessmentRes.data.dt) {
          // createdで降順にソートされているので、作成日以下のデータの先頭を取得
          const targetAssessment = assessmentRes.data.dt.find(item => 
            item.created <= createdDate
          );

          if (targetAssessment?.content?.content) {
            const assessmentData = targetAssessment.content.content;
            
            // 既存の入力値を保持しつつ、空白の項目のみ更新（改行処理を含む）
            setInputs(prev => ({
              ...prev,
              家族意向: prev['家族意向'] && prev['家族意向'].trim() !== '' ? prev['家族意向'] : (familyIntention.trim() === '' ? processDeepBrToLf(assessmentData['家族意向'] || '') : familyIntention),
              本人意向: prev['本人意向'] && prev['本人意向'].trim() !== '' ? prev['本人意向'] : (personalIntention.trim() === '' ? processDeepBrToLf(assessmentData['本人意向'] || '') : personalIntention),
              アセスメント日付: assessmentData['アセスメント実施日'] || ''
            }));
          }
        }
      } catch (error) {
        console.error('Assessmentデータ取得エラー:', error);
      }
    };

    fetchAssessmentData();
  }, [inputs['作成日'], uid, hid, bid]);

  // 日付変更／コピーのロジックは PlanDateChangeCopy 内へ

  const handleDelete = async () => {
    if (!deleteConfirm){
      setDeleteConfirm(true);
    } else {
      const prms = {
        a: 'deleteUsersPlan',hid, bid, uid: effectiveUid, item: 'personalSupportHohou', 
        created: inputs['作成日'] || createdParam
      };
      const res = await univApiCall(
        prms, 'E23441', '', setSnack, '削除されました', '削除に失敗しました', false
      );
      if (res && res.data && res.data.result) {
        // 削除成功後、inputsを初期状態に戻す
        setInputs(initialValues);
        setDeleteConfirm(false);
        // 個別支援計画リストから該当項目を削除
        let updatedPersonalData;
        if (createdParam) {
          updatedPersonalData = allPersonalData.filter(item => 
            !(item.uid === effectiveUid && 
              item.content && 
              item.content['作成日'] === createdParam &&
              item.item === 'personalSupportHohou')
          );
        } else {
          updatedPersonalData = allPersonalData.filter(item => 
            !(item.uid === effectiveUid && item.item === 'personalSupportHohou')
          );
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
        item.content['作成日'] === createdParam
      );
    } else {
      // createdParamが指定されていない場合は、uidのみで検索
      t = allPersonalData.find(item => item.uid === uid);
    }
    if (t) {
      const processedContent = processDeepBrToLf(t.content || {});
      setOriginInputs(processedContent);
      setInputs(processedContent);  // contentプロパティにアクセス
    } else {
      setOriginInputs(initialValues);
      setInputs(initialValues);
    }
  }
  

  
  const handleSubmit = async () => {
    // 編集中フラグを立てる（useEffectでの上書きを防ぐ）
    isEditingRef.current = true;
    
    // 送信前に各LineRenderの内容を強制的に同期（バリデーションより先に実行）
    if (lineRenderRefs.current) {
      lineRenderRefs.current.forEach(ref => {
        if (ref && ref.forceSync) {
          ref.forceSync();
        }
      });
    }

    // 同期完了を待つ（Reactのstate更新が反映されるまで）
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const normalizedInputs = syncSupportGoalIds(inputs);
    const targetInputs = normalizedInputs;
    if (normalizedInputs !== inputs) {
      setInputs(normalizedInputs);
    }

    // 必須項目のバリデーション
    const newErrors = {};
    inputDefinitions.forEach(def => {
      if (def.required && (!targetInputs[def.label] || targetInputs[def.label].toString().trim() === '')) {
        newErrors[def.label] = true;
      }
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      // 作成日フィールドのエラーがある場合は特別なメッセージを表示
      if (newErrors['作成日'] && targetInputs['作成日']) {
        setSnack({ msg: '日付が不正または重複があります', severity: 'warning' });
      } else {
        setSnack({ msg: '必須項目が未入力です', severity: 'warning' });
      }
      isEditingRef.current = false; // エラー時もフラグを下ろす
      return; // 送信中断
    }
          // 新規追加モードの場合、作成日の重複チェック
    if (isAddMode) {
      // relatedItemsから同じ作成日のアイテムが存在するかチェック
      const duplicateItem = relatedItems.find(item => 
        item.uid === uid && 
        item.item === 'personalSupportHohou' && 
        item.created === targetInputs['作成日']
      );
      
      if (duplicateItem) {
        setSnack({
          msg: '同じ作成日の個別支援計画が既に存在します。別の日付を指定してください。',
          severity: 'warning'
        });
        isEditingRef.current = false; // エラー時もフラグを下ろす
        return;
      }
    } else {
      // 編集モードの場合、自分以外の同じ作成日のアイテムが存在するかチェック
      const duplicateItem = relatedItems.find(item => 
        item.uid === uid && 
        item.item === 'personalSupportHohou' && 
        item.created === targetInputs['作成日'] &&
        item.created !== originInputs['作成日'] // 自分自身は除外
      );
      
      if (duplicateItem) {
        setSnack({
          msg: '同じ作成日の個別支援計画が既に存在します。別の日付を指定してください。',
          severity: 'warning'
        });
        isEditingRef.current = false; // エラー時もフラグを下ろす
        return;
      }
    }

    try {

      // データ処理を安全に行う
      let processedContent;
      try {
        processedContent = processDeepLfToBr(cleanSpecialCharacters(targetInputs));
      } catch (processingError) {
        console.error('データ処理エラー:', processingError);
        isEditingRef.current = false; // エラー時もフラグを下ろす
        setSnack({ msg: 'データの処理中にエラーが発生しました。入力内容を確認してください。', severity: 'error' });
        return;
      }

      const planid = effectiveUid + '_' + targetInputs['開始日'];
      const prms = {
        a: 'sendUsersPlan',
        hid,
        bid,
        uid: effectiveUid,
        item: 'personalSupportHohou',
        created: targetInputs['作成日'],
        content: { uid: effectiveUid, content: processedContent, planid },
      };

      const res = await univApiCall(prms, 'E23442', '', setSnack, '', '', false);
      
      if (res && res.data && res.data.result) {
        // 新規追加モードの場合、先にLocalStorageをリセット
        if (isAddMode) {
          resetPlanAddMode(history, targetInputs['作成日']);
        }
        
        // API呼び出し成功後の処理
        const newAllPersonalData = [...allPersonalData];
        // createdParamが指定されている場合は、その日付のデータを特定して更新
        let existingIndex;
        if (createdParam) {
          existingIndex = newAllPersonalData.findIndex(item => 
            item.uid === effectiveUid && 
            item.content && 
            item.content['作成日'] === createdParam &&
            item.item === 'personalSupportHohou'
          );
        } else {
          existingIndex = newAllPersonalData.findIndex(item => 
            item.uid === effectiveUid && item.item === 'personalSupportHohou'
          );
        }

        if (existingIndex !== -1) {
          newAllPersonalData[existingIndex] = { uid: effectiveUid, content: targetInputs, item: 'personalSupportHohou', created: targetInputs['作成日'] };
        } else {
          newAllPersonalData.push({ uid: effectiveUid, content: targetInputs, item: 'personalSupportHohou', created: targetInputs['作成日'] });
        }
        setAllPersonalData(newAllPersonalData);
        // 保存成功後、originInputsを現在のinputsの値で更新
        setOriginInputs({ ...targetInputs });
        
        // 少し待ってからフラグを下ろす（state更新が完了するまで）
        setTimeout(() => {
          isEditingRef.current = false;
        }, 50);
        
        setSnack({ msg: '個別支援計画が保存されました', severity: 'success' });
        
        // 作成日をローカルストレージの履歴に保存
        saveCreatedDateToLS(targetInputs['作成日']);
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




  // 入力変更ハンドラーを単純化
  const handleInputChange = (label, newValue) => {
    // フィールド定義を取得
    const fieldDef = findInputByLabel(label, inputDefinitions);
    
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
    
    // チェックボックス（boolean）の場合はそのまま保存
    if (fieldDef?.type === 'checkbox') {
      setInputs(prev => ({
        ...prev,
        [label]: newValue
      }));
      return;
    }
    
    // その他の通常フィールド処理
    setInputs(prev => ({
      ...prev,
      [label]: newValue
    }));
  };

  // グループ変更ハンドラーも単純化
  const handleGroupChange = (groupLabel, rowIndex, fieldLabel, newValue) => {
    setInputs(prev => {
      const groupData = prev[groupLabel] ? [...prev[groupLabel]] : [];
      const updatedRow = { 
        ...groupData[rowIndex], 
        [fieldLabel]: newValue 
      };
      groupData[rowIndex] = updatedRow;
      return {
        ...prev,
        [groupLabel]: groupData,
      };
    });
  };



  // バリデーション用エラー状態
  const [errors, setErrors] = useState({});

  // ここでPlanAssessmentDetail専用のhandleBlurを追加
  // 各入力項目がrequiredの場合、空欄ならエラー状態をinputsに反映します
  const handleBlur = (label, value) => {
    const inputDef = findInputByLabel(label);
    
    if (inputDef && inputDef.required && (!value || value.toString().trim() === '')) {
      setErrors(prev => ({ ...prev, [label]: true }));
    } else {
      setErrors(prev => {
        const newErr = { ...prev };
        delete newErr[label];
        return newErr;
      });
    }
    // }
  };

  // FieldRender用の共通パラメータ
  const fieldRenderPrms = {
    inputDefinitions,
    inputs,
    handleInputChange,
    handleBlur,
    errors,
    dateDisabled,
    handleSelectInputAuto,
    allPersonalData
  };

  // // inputs 状態から生活歴項目を取得
  // const lifeHistoryItems = inputs['生活歴'] || [];



  // 削除確認処理
  const handleRowDelete = (rowIndex, groupLabel) => {
    setDeleteTarget({ rowIndex, groupLabel });
    setDeleteDialogOpen(true);
  };

  // 削除実行処理
  const confirmDelete = () => {
    if (deleteTarget.rowIndex !== null && deleteTarget.groupLabel) {
      removeGroupRow(deleteTarget.rowIndex, deleteTarget.groupLabel, inputs, setInputs);
    }
    setDeleteDialogOpen(false);
  };

  // groupRender関数を更新
  const groupRender = (groupLabel, groupProps) => {
    return (
      <div className="groupContainer" style={{ margin: '16px 0' }}>
        {inputs[groupLabel] && inputs[groupLabel].map((row, index) => (
          <LineRender 
            key={`${groupLabel}-row-${row?.LineID || String(index + 1).padStart(2, '0')}`} 
            rowIndex={index} 
            groupLabel={groupLabel} 
            inputs={inputs}
            handleGroupChange={handleGroupChange}
            handleBlur={handleBlur}
            onRemove={handleRowDelete}
            sortMode={sortMode}
            onSwapUp={(rowIndex, groupLabel) => swapGroupRows(groupLabel, rowIndex, rowIndex - 1, inputs, setInputs)}
            onSwapDown={(rowIndex, groupLabel) => swapGroupRows(groupLabel, rowIndex, rowIndex + 1, inputs, setInputs)}
            providerOptions={providerOptions}
            planItemFreeSolo={planItemFreeSolo}
            ref={el => { lineRenderRefs.current[index] = el; }}
          />
        ))}
        <div style={{textAlign: 'center'}}>
          <Button
            color="primary"
            onClick={() => addGroupRowWithSync(groupLabel, inputDefinitions, inputs, setInputs, lineRenderRefs)}
            startIcon={<ControlPointIcon fontSize="large" />}
          >
            項目を追加する
          </Button>
          <Button
            color={sortMode ? "secondary" : "primary"}
            onClick={() => setSortMode(!sortMode)}
            style={{ marginLeft: '8px' }}
            startIcon={sortMode ? <Close  /> : <SwapVert  />}
          >
            {sortMode ? '入れ替えを完了する' : '項目を入れ替える'}
          </Button>
        </div>
      </div>
    );
  };







  // 必要な値を直接子コンポーネントに渡すためのオブジェクト
  const groupProps = {
    inputs,
    handleGroupChange,
    handleBlur,
    findGroupDefinitionByLabel: (groupLabel, fieldLabel) => findGroupDefinitionByLabel(groupLabel, fieldLabel, inputDefinitions),
  };
    // ボタンのonClickで関数を呼び出す際に必要な引数を渡す
  // 新規生成用のハンドラー
  const handleGenerateContent = async () => {
    // 生成に必要な事前データのフェッチ（assessment）
    try {
      setOverlayOpen(true);
      const assessmentRes = await univApiCall({
        a: 'fetchUsersPlan', hid, bid, uid, item: 'assessment'
      }, 'E23443', '', setSnack, '', '', false);

      let assessmentDt = {};
      if (assessmentRes?.data?.result) {
        const dt = (assessmentRes.data.dt || []).filter(item => item.created <= inputs?.['作成日']);
        assessmentDt = dt?.[0]?.content?.content || {};
      }
      setPreflightAssessment(assessmentDt);

      // 確認メッセージを組み立て
      const dateStr = inputs['アセスメント日付'] || assessmentDt['アセスメント実施日'] || '';
      const hasAssessment = !!dateStr;
      const msg = hasAssessment
        ? `${dateStr}のアセスメント情報に基づき個別支援計画の提案を行います。\nアセスメント情報が充実していた方がよりよい計画を提案できます。\n特に「五領域支援チェック項目」の内容が反映されます。`
        : `個別支援計画の提案を行います。アセスメントの情報が確認出来ません。\nサンプルデータの作成を行います。アセスメントを入力してから実行することをお勧めします。\nその場合、五領域支援チェック項目の内容も入力して下さい。`;
      setConfirmMessage(msg);
      setGenerateConfirmDialogOpen(true);
    } catch (e) {
      console.error(e);
      setSnack({ msg: '生成前の確認に失敗しました', severity: 'error' });
    } finally {
      setOverlayOpen(false);
    }
  };

  // 修正生成用のハンドラー
  const handleModifyGenerateContent = async () => {
    setIsModifyMode(true);
    // まずは修正点入力ダイアログを開く（入力後にConfirmDialogを開く）
    setModifyDialogOpen(true);
  };

  // 修正生成ダイアログの確認ハンドラー
  const handleConfirmModifyGenerate = async () => {
    if (!modifyItems.trim()) {
      setSnack({ msg: '修正内容を入力してください', severity: 'warning' });
      return;
    }
    setModifyDialogOpen(false);
    try {
      setOverlayOpen(true);
      const assessmentRes = await univApiCall({
        a: 'fetchUsersPlan', hid, bid, uid, item: 'assessment'
      }, 'E23443', '', setSnack, '', '', false);

      let assessmentDt = {};
      if (assessmentRes?.data?.result) {
        const dt = (assessmentRes.data.dt || []).filter(item => item.created <= inputs?.['作成日']);
        assessmentDt = dt?.[0]?.content?.content || {};
      }
      setPreflightAssessment(assessmentDt);

      // 修正用の確認メッセージ作成
      const dateStr = inputs['アセスメント日付'] || assessmentDt['アセスメント実施日'] || '';
      const head = '既存の個別支援計画を基に、入力された修正内容に基づいて計画を改善します。';
      const body = `修正内容: ${modifyItems}`;
      const tail = dateStr
        ? `\n\n参考となるアセスメント日付: ${dateStr}`
        : '';
      setConfirmMessage(`${head}\n${body}${tail}`);
      setGenerateConfirmDialogOpen(true);
    } catch (e) {
      console.error(e);
      setSnack({ msg: '生成前の確認に失敗しました', severity: 'error' });
    } finally {
      setOverlayOpen(false);
    }
  };

  // 直近のカンファレンスから修正内容を取得してセット
  const handleFetchModifyFromConference = async () => {
    try {
      setIsFetchingFromConference(true);
      const prms = { a: 'fetchUsersPlan', hid, bid, uid: effectiveUid, item: 'conferenceNote' };
      const res = await univApiCall(prms, 'E23443', '', setSnack, '', '', false);
      const createdDate = inputs?.['作成日'];
      if (!res?.data?.dt || res.data.dt.length === 0) {
        setSnack({ msg: 'カンファレンスが見つかりません', severity: 'warning' });
        return;
      }
      let list = res.data.dt;
      if (createdDate) {
        list = list.filter(item => item.created <= createdDate);
      }
      list.sort((a, b) => String(b.created).localeCompare(String(a.created)));
      const latest = list[0];
      const confContent = latest?.content?.content || {};
      const confModify = confContent['修正'] || '';
      if (!confModify) {
        setSnack({ msg: 'カンファレンスの修正内容が見つかりません', severity: 'info' });
      }
      setModifyItems(confModify);
    } catch (e) {
      console.error(e);
      setSnack({ msg: 'カンファレンスからの取得に失敗しました', severity: 'error' });
    } finally {
      setIsFetchingFromConference(false);
    }
  };

  // 修正生成ダイアログのキャンセルハンドラー
  const handleCancelModifyGenerate = () => {
    setModifyDialogOpen(false);
    setModifyItems('');
    setIsModifyMode(false); // 修正モードをリセット
  };

  // 日付入力チェック関数
  const checkDateInput = () => {
    const createdDate = inputs?.['作成日'];
    if (!createdDate || createdDate.toString().trim() === '') {
      setDateWarningDialogOpen(true);
      return false;
    }
    return true;
  };

  // メニュー開閉用のハンドラー
  const handleGenerateMenuOpen = (event) => {
    setGenerateMenuAnchorEl(event.currentTarget);
  };

  const handleGenerateMenuClose = () => {
    setGenerateMenuAnchorEl(null);
  };

  const handleConfirmGenerate = () => {
    setGenerateConfirmDialogOpen(false);
    // ダイアログ確認後に実際の生成処理を実行
    generateComprehensivePlan({
      created: inputs?.['作成日'], hid, bid, uid, users, inputs,
      setInputs, setSnack, setOverlayOpen,
      assessmentDt: preflightAssessment,
      isModify: isModifyMode,
      modifyItems: modifyItems
    });
    // リセット
    setIsModifyMode(false);
    setModifyItems('');
    setPreflightAssessment(null);
    setConfirmMessage('');
  };

  const handleCancelGenerate = () => {
    setGenerateConfirmDialogOpen(false);
  };
  
  const generateMessage = useMemo(() => {
    if (isModifyMode) {
      return `既存の個別支援計画を基に、入力された修正内容に基づいて計画を改善します。
修正内容: ${modifyItems || '既存の内容を基に全体的な改善'}

既存の内容を保持しつつ、より具体的で実現可能な内容に修正・改善を行います。`;
    }
    return inputs['アセスメント日付']
      ? `${inputs['アセスメント日付']}のアセスメント情報に基づき個別支援計画の提案を行います。
アセスメント情報が充実していた方がよりよい計画を提案できます。
特に「五領域支援チェック項目」の内容が反映されます。`
      : `個別支援計画の提案を行います。アセスメントの情報が確認出来ません。
サンプルデータの作成を行います。アセスメントを入力してから実行することをお勧めします。
その場合、五領域支援チェック項目の内容も入力して下さい。`;
  }, [isModifyMode, modifyItems, inputs['アセスメント日付']]);

  return (
    <div 
      className={classes.planFormRoot}
      style={withSideSection ? { marginLeft: 'max(196px, calc((100% - 800px) / 2))' } : {}}
    >
      <PlanRelatedItemsPanel 
        uid={uid} 
        created={createdBase} 
        setRelatedItems={setRelatedItems}
        originInputs={originInputs}
        inputs={inputs}
        currentPlanType="personalSupportHohou"
      />
      <form id='ed95rbb77' className='planForm'>
        <div className='title'>
          <div className='main'>
            個別支援計画登録
            <span style={{ color: purple[500], fontWeight: 'bold', marginLeft: 8 }}>（保訪）</span>
          </div>
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
                setLS(PLAN_ADD_MODE_ITEM, 'personalSupportHohou');
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
              item="personalSupportHohou"
              created={originInputs?.['作成日']}
              createdField="作成日"
              inputs={inputs}
              setInputs={setInputs}
              originInputs={originInputs} 
              setOriginInputs={setOriginInputs}
              setSnack={setSnack}
              allPersonalData={allPersonalData}
              setAllPersonalData={setAllPersonalData}
            />
            {/* 利用者のサービスが複数の場合、personalSupportからコピーするボタンを表示 */}

            {/* <Button
              startIcon={<SchoolIcon />}
              onClick={handleGenerateMenuOpen}
              style={{ color: orange[800], marginRight: 8 }}
            >
              生成
            </Button> */}
            <Menu
              anchorEl={generateMenuAnchorEl}
              keepMounted
              open={Boolean(generateMenuAnchorEl)}
              onClose={handleGenerateMenuClose}
              getContentAnchorEl={null}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <MenuItem onClick={() => {
                if (checkDateInput()) {
                  handleGenerateContent();
                }
                handleGenerateMenuClose();
              }}>
                <ListItemIcon style={{ minWidth: 28, marginRight: 8, color: orange[800] }}>
                  <AddCircleOutline fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="新規生成" />
              </MenuItem>
              <MenuItem onClick={() => {
                if (checkDateInput()) {
                  handleModifyGenerateContent();
                }
                handleGenerateMenuClose();
              }}>
                <ListItemIcon style={{ minWidth: 28, marginRight: 8, color: orange[800] }}>
                  <CreateIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="修正生成" />
              </MenuItem>
            </Menu>
            <PlanPrintButton
              item={originInputs?.["原案"] ? "personalSupportHohouDraft" : "personalSupportHohou"}
              created={originInputs?.['作成日']}
              uid={effectiveUid}
              originInputs={originInputs}
              inputs={inputs}
            />
          </div>
        </div>
        {/* 日付変更／コピー用のボタン群 */}
        
        {/* アセスメント基本情報 - 1行目 */}
        <div className="fpRow">
          {FieldRender('作成日', fieldRenderPrms)}
          {FieldRender('児発管', fieldRenderPrms)}
          {useSubCreator && FieldRender('補助作成者', fieldRenderPrms)}
          {/* {FieldRender('実施回数')} */}
          {FieldRender('開始日', fieldRenderPrms)}
          {FieldRender('有効期限', fieldRenderPrms)}
          <FormControlLabel
            control={
              <Checkbox
                checked={inputs?.['原案'] === true}
                onChange={(e) => {
                  const val = e.target.checked;
                  handleInputChange('原案', val);
                  if (val) handleInputChange('電子サイン依頼', false);
                }}
                color="primary"
              />
            }
            label={findInputByLabel('原案', inputDefinitions)?.label || '原案'}
          />
          {showSignSection && (
            <>
              {signRequireEnabled && canRequestSign && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={inputs?.['電子サイン依頼'] === true}
                        onChange={(e) => handleInputChange('電子サイン依頼', e.target.checked)}
                        color="primary"
                        disabled={!!originInputs?.signUrl}
                      />
                    }
                    label={findInputByLabel('電子サイン依頼', inputDefinitions)?.label || '電子サイン依頼'}
                  />
                  {!originInputs?.signUrl && (
                    <div style={{ color: red[500], fontSize: '0.75rem', marginTop: -8, marginLeft: 32, marginBottom: 8 }}>
                      2025/12/30現在、この設定は有効でない場合があります
                    </div>
                  )}
                </div>
              )}
              {originInputs?.signUrl && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', marginLeft: 8 }}>
                    <img 
                      src={originInputs.signUrl} alt="電子サイン" 
                      style={{ height: 32, border: '1px solid #eee', borderRadius: 4 }} 
                    />
                  </div>
                  {FieldRender('説明同意日', fieldRenderPrms)}
                </>
              )}
            </>
          )}
        </div>
        {/* <div className="fpRow">
        </div> */}
        <div className="fpRow">
          {FieldRender('本人意向', fieldRenderPrms)}
        </div>
        <div className="fpRow">
          {FieldRender('家族意向', fieldRenderPrms)}
        </div>
        <div className="fpRow">
          {FieldRender('支援方針', fieldRenderPrms)}
        </div>
        <div className="fpRow">
          {FieldRender('長期目標', fieldRenderPrms)}
        </div>
        <div className="fpRow">
          {FieldRender('短期目標', fieldRenderPrms)}
        </div>
        <div className="fpRow">
          {FieldRender('支援提供時間', fieldRenderPrms)}
        </div>
        {!onlyHohou &&
          <div className="fpRow">
            {FieldRender('迎え', fieldRenderPrms)}
            {FieldRender('送り', fieldRenderPrms)}
          </div>
        }
        {/* グループ「支援目標」のレンダリング */}
        <div className="groupSection">
          <h3 className={classes.groupTitle}>支援目標及び具体的な支援内容</h3>
          {groupRender('支援目標', groupProps)}
        </div>
        <div className="fpRow">
          {FieldRender('備考', fieldRenderPrms)}
        </div>
        <div className="fpRow">
          {FieldRender('日々の課題', fieldRenderPrms)}
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
      {/* 日付変更／コピー用のダイアログは PlanDateChangeCopy 内に集約 */}
      {/* 削除確認ダイアログ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>行の削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            この行を削除してもよろしいですか？この操作は元に戻せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            キャンセル
          </Button>
          <Button onClick={confirmDelete} color="primary" autoFocus>
            削除する
          </Button>
        </DialogActions>
      </Dialog>
      <SnackMsg {...snack} />
      <PlanOverlay 
        open={overlayOpen} 
        zIndex={9999}
      >
        <span>
          
          <span style={{ 
            color: 'yellow', 
          }}>
            {user?.name?.split(' ')[1]}
          </span>
          さんの未来を考えています🤔
        </span>
      </PlanOverlay>
      <ConfirmDialog
        open={generateConfirmDialogOpen}
        onClose={handleCancelGenerate}
        onCancel={handleCancelGenerate}
        onConfirm={handleConfirmGenerate}
        title="生成確認"
        message={confirmMessage}
      />
      {/* 修正生成ダイアログ */}
      <Dialog
        open={modifyDialogOpen}
        onClose={handleCancelModifyGenerate}
        aria-labelledby="modify-dialog-title"
        aria-describedby="modify-dialog-description"
        maxWidth={false}
        PaperProps={{ style: { width: 800, maxWidth: '90%' } }}
      >
        <DialogTitle id="modify-dialog-title">計画の修正</DialogTitle>
        <DialogContent>
          <DialogContentText id="modify-dialog-description" style={{ marginBottom: 8 }}>
            修正したい点を簡潔に具体的に入力して下さい。<br/>
            例：粗大運動は○○公園で発達を促す
          </DialogContentText>
          <div style={{ marginBottom: 8 }}>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={handleFetchModifyFromConference}
              disabled={isFetchingFromConference}
              size="small"
            >
              直近の担当者会議から取得
            </Button>
          </div>
          <TextField
            autoFocus
            margin="dense"
            id="modify-items"
            label="修正したい点"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={6}
            value={modifyItems}
            onChange={(e) => setModifyItems(e.target.value)}
            placeholder="例：短期目標を具体化／支援内容を詳しく"
            helperText="必須。簡潔にお願いします。"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelModifyGenerate} color="primary">
            キャンセル
          </Button>
          <Button 
            onClick={handleConfirmModifyGenerate} 
            color="primary" 
            variant="contained"
            disabled={!modifyItems.trim()}
          >
            実行
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 日付未入力警告ダイアログ */}
      <Dialog
        open={dateWarningDialogOpen}
        onClose={() => setDateWarningDialogOpen(false)}
        aria-labelledby="date-warning-dialog-title"
        aria-describedby="date-warning-dialog-description"
      >
        <DialogTitle id="date-warning-dialog-title">日付の入力が必要です</DialogTitle>
        <DialogContent>
          <DialogContentText id="date-warning-dialog-description">
            生成機能を使用するには、まず「作成日」を入力してください。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDateWarningDialogOpen(false)} color="primary" autoFocus>
            了解
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export const PlanPersonalSupportHohou = () => {
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
      setLS(PLAN_ADD_MODE_ITEM, 'personalSupportHohou');
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
        const prms = {a: 'fetchUsersPlan', hid, bid, item: 'personalSupportHohou', limit};
        
        // lastmonthパラメータが指定されている場合は追加
        if (lastmonthParam) {
          prms.lastmonth = lastmonthParam;
          delete prms.limit; // lastmonthが指定されている場合はlimitを削除
        }
        
        // createdParamの送信は廃止（常に複数件取得し、詳細側で絞り込み）
        
        const res = await univApiCall(prms, 'E23441', '', '');
        
        // API呼び出し後もコンポーネントがマウントされていることを確認
        if (isMountedRef.current && res && res?.data?.result) {
          const personalSupports = (res.data?.dt ?? []).map(item => ({
            uid: item.uid,
            content: item.content?.content ?? item.content ?? {},
            item: item.item,
            created: item.created
          }));
          setAllPersonalData(personalSupports);
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
        errorSubText = '利用者の登録をしてからの登録を行って下さい。'
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
      <PlanPersonalSupportHohouDetail 
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