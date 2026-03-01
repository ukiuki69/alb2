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
import { PlanPrintButton, UserInfoDisplay, PlanOverlay, ConfirmDialog, PlanDateChangeCopy, isPlanAddMode, resetPlanAddMode, findInputByLabel, getGroupItemsDefinitions, findGroupDefinitionByLabel, getUniqueOptionsFromPersonalData, FieldRender, addGroupRow, removeGroupRow, swapGroupRows, addGroupRowWithSync, deepEqual, fetchAssessmentChanges, formatAssessmentChanges } from './planCommonPart';
import { syncGroupRowStableIds } from './utility/groupRowIdUtils';
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
import { generateComprehensivePlan,  } from './planMakePrompt';
import { PlanRelatedItemsPanel } from './PlanRelatedItemsPanel';
import { green } from '@material-ui/core/colors';


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
  { label: '支援提供時間', type: 'text', style: { width: '100%' } , multiline: true},
  { label: '迎え', type: 'text', style: { width: 200, marginRight: 8 } , placeholder: 'なし/あり（学校名等）'},
  { label: '送り', type: 'text', style: { width: 200,  } , placeholder: 'なし/あり（自宅等）'},
  { 
    label: '支援目標', title: '支援目標及び具体的な支援内容',
    type: 'group', 
    fields: [
      { 
        label: '項目', type: 'select', required: true, value: '', 
        souce: ['本人支援', '家族支援', '地域支援', '移行支援', '家族・地域支援', '家族・移行支援', 'その他'], 
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
    missingFiveDomains, 
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

  const textField = (label) => {
    const fieldDef = getGroupFieldDefinition(label);
    return (
      <TextField
        label={label}
        value={localRowData[label] || ''}
        onChange={e => handleChange(label, e.target.value)}
        onBlur={syncWithParent}
        variant="standard"
        style={fieldDef.style || {}}
        multiline={fieldDef.multiline || false}
        disabled={sortMode}
      />
    )
  }

  const selectField = (label) => {
    const fieldDef = getGroupFieldDefinition(label);
    const optionList = fieldDef.souce;
    return (
      <FormControl style={fieldDef.style || {}}>
        <InputLabel>{label}</InputLabel>
        <Select
          value={localRowData[label] || ''}
          onChange={e => handleChange(label, e.target.value)}
          onBlur={syncWithParent}
          disabled={sortMode}
        >
          {optionList.map((option) => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </Select>
      </FormControl>
    )
  }

  const checkBoxField = (label) => {
    const fieldDef = getGroupFieldDefinition(label);
    const options = fieldDef.souce || [];
    const rawValue = localRowData[label];


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
      
      // 新しい値を文字列として保存
      const newValueString = newValues.join(',');
      
      // ローカルの状態を更新
      handleChange(label, newValueString);
      
      // チェックボックスの場合は特別に処理
      // フォーカスチェックを無視して直接同期する
      setTimeout(() => {
        handleGroupChange(groupLabel, rowIndex, label, newValueString);
      }, 10);
    };

    
    return (
      <div style={{ ...fieldDef.style || {}}}>
        {options.map((option, index) => (
          <FormControlLabel
            key={index}
            control={
              <Checkbox
                checked={currentValues.includes(option)}
                onChange={(e) => handleCheckboxChange(option, e.target.checked)}
                color="primary"
                size="small"
                disabled={sortMode}
              />
            }
            label={
              <span style={{ color: (missingFiveDomains || []).includes(option) ? red[500] : undefined }}>
                {option}
              </span>
            }
            style={{ marginRight: '12px', fontSize: '0.9rem' }}
          />
        ))}
      </div>
    );
  };
  const numInputField = (label) => {
    const fieldDef = getGroupFieldDefinition(label);
    const defaultValue = fieldDef?.defaultValue !== undefined ? fieldDef.defaultValue : 0;
    const value = localRowData[label] !== undefined ? localRowData[label] : defaultValue;
    
    return (
      <NumInputGP 
        label={label} 
        def={value} 
        propsVal={value}
        setPropsVal={newValue => handleChange(label, newValue)}
        propsOnBlur={syncWithParent} 
        cls='tfSmall'
        wrapperStyle={fieldDef.style || {}}
        disabled={sortMode}
      />
    )
  }

  const freesoloField = (label) => {
    const fieldDef = getGroupFieldDefinition(label);
    
    // 担当者・提供機関の場合は親から渡された候補、項目の場合は定義のsouceを候補として使用
    const options = label === '担当者・提供機関' ? providerOptions : (label === '項目' ? (fieldDef?.souce || []) : []);

    return (
      <Autocomplete
        freeSolo
        options={options}
        getOptionLabel={(option) => option || ""}
        value={localRowData[label] || ''}
        onInputChange={(event, newInputValue) =>
          handleChange(label, newInputValue)
        }
        style={fieldDef.style || {}}
        onChange={(event, newValue) =>
          handleChange(label, newValue || '')
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            variant="standard"
            onBlur={syncWithParent}
            required={fieldDef.required}
            disabled={sortMode}
          />
        )}
        disabled={sortMode}
      />
    )
  }

  // ここにJSX以外のロジックや変数宣言を自由に記述できます
  const itemForGoryouik = ['本人支援', '家族支援', '移行支援', '地域支援', 'その他'];

  return (
    <div style={{ position: 'relative' }}>
      <div ref={containerRef} className="fpRow" >
        <div className={classes.rowIndex}>{rowIndex + 1}</div>
        {planItemFreeSolo ? freesoloField('項目') : selectField('項目')}
        {textField('支援目標')}
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
      <div className="fpRow">{textField('支援内容')}</div>
      {!sortMode && (
        <>
          <div className="fpRow">{checkBoxField('五領域')}</div>
          <div className="fpRow">{textField('留意事項')}</div>
        </>
      )}
      {!sortMode && (
        <div className="fpRow">
          {numInputField('達成期間')}
          {freesoloField('担当者・提供機関')}
          {numInputField('優先順位')}
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

const PlanPersonalSupportDetail = (props) => {
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
  
  // 生成前確認メッセージと事前フェッチ結果
  const [confirmMessage, setConfirmMessage] = useState('');
  const [preflightAssessment, setPreflightAssessment] = useState(null);
  
  // 五領域のマスター
  const fiveDomainMaster = useMemo(() => (
    ['人間関係・社会性', '運動・感覚', '認知・行動', '言語・コミュ', '健康・生活']
  ), []);
  // 未選択の五領域一覧
  const [missingFiveDomains, setMissingFiveDomains] = useState([]);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [pendingLocation, setPendingLocation] = useState(null);

  const hasUnsavedChanges = !deepEqual(originInputs, inputs);
  const hasUnsavedChangesRef = useRef(false);
  const unblockRef = useRef(null);
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);
  useEffect(() => {
    if (unblockRef.current) { unblockRef.current(); unblockRef.current = null; }
    unblockRef.current = history.block((nextLocation) => {
      if (!hasUnsavedChangesRef.current) return true;
      setPendingLocation(nextLocation);
      setLeaveConfirmOpen(true);
      return false;
    });
    return () => { if (unblockRef.current) { unblockRef.current(); unblockRef.current = null; } };
  }, [history]);
  const closeLeaveConfirm = () => { setLeaveConfirmOpen(false); setPendingLocation(null); };
  const confirmLeave = () => {
    const next = pendingLocation;
    setLeaveConfirmOpen(false);
    setPendingLocation(null);
    if (unblockRef.current) { unblockRef.current(); unblockRef.current = null; }
    if (next) history.push(`${next.pathname || ''}${next.search || ''}${next.hash || ''}`);
  };

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

  // 本人支援のみから選択済みの五領域を集計し、未選択の五領域のみを算出
  useEffect(() => {
    const goalsAll = Array.isArray(inputs?.['支援目標']) ? inputs['支援目標'] : [];
    const goals = goalsAll.filter(g => (g?.['項目'] || '') === '本人支援');
    const domainSet = new Set();
    goals.forEach((g) => {
      const raw = g && g['五領域'];
      const domains = Array.isArray(raw)
        ? raw
        : (typeof raw === 'string' && raw.length > 0
            ? raw.split(',').map(s => s.trim()).filter(Boolean)
            : []);
      domains.forEach(d => { if (d) domainSet.add(d); });
    });
    const selectedDomains = Array.from(domainSet);
    const missing = fiveDomainMaster.filter(d => !selectedDomains.includes(d));
    setMissingFiveDomains(missing);
  }, [inputs?.['支援目標'], fiveDomainMaster]);

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
              // 重複排除のためSetを使用（表記ゆれを防ぐため正規化も考慮する場合はここで処理）
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
    return isPlanAddMode(location, 'personalSupport');
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
      t = allPersonalData.find(item => 
        item.uid === uid
      );
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
        a: 'deleteUsersPlan',hid, bid, uid: effectiveUid, item: 'personalSupport', 
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
            !(item.uid === uid && 
              item.content && 
              item.content['作成日'] === createdParam &&
              item.item === 'personalSupport') // personalSupportのみを対象とする
          );
        } else {
          updatedPersonalData = allPersonalData.filter(item => 
            !(item.uid === uid && item.item === 'personalSupport') // personalSupportのみを対象とする
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
      t = allPersonalData.find(item => 
        item.uid === uid
      );
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
      if (newErrors['作成日'] && inputs['作成日']) {
        setSnack({ msg: '日付が不正または重複があります', severity: 'warning' });
      } else {
        setSnack({ msg: '必須項目が未入力です', severity: 'warning' });
      }
      isEditingRef.current = false; // エラー時もフラグを下ろす
      return false; // 送信中断
    }
    // 新規追加モードの場合、作成日の重複チェック
    if (isAddMode) {
      // relatedItemsから同じ作成日のアイテムが存在するかチェック
      const duplicateItem = relatedItems.find(item => 
        item.uid === uid && 
        item.item === 'personalSupport' && 
        item.created === targetInputs['作成日']
      );
      
      if (duplicateItem) {
        setSnack({
          msg: '同じ作成日の個別支援計画が既に存在します。別の日付を指定してください。',
          severity: 'warning'
        });
        isEditingRef.current = false; // エラー時もフラグを下ろす
        return false;
      }
    } else {
      // 編集モードの場合、自分以外の同じ作成日のアイテムが存在するかチェック
      const duplicateItem = relatedItems.find(item => 
        item.uid === uid && 
        item.item === 'personalSupport' && 
        item.created === targetInputs['作成日'] &&
        item.created !== originInputs['作成日'] // 自分自身は除外
      );
      
      if (duplicateItem) {
        setSnack({
          msg: '同じ作成日の個別支援計画が既に存在します。別の日付を指定してください。',
          severity: 'warning'
        });
        isEditingRef.current = false; // エラー時もフラグを下ろす
        return false;
      }
    }

    try {

      // データ処理を安全に行う
      let processedContent;
      try {
        processedContent = processDeepLfToBr(cleanSpecialCharacters(targetInputs));
      } catch (processingError) {
        console.error('データ処理エラー:', processingError);
        setSnack({ msg: 'データの処理中にエラーが発生しました。入力内容を確認してください。', severity: 'error' });
        isEditingRef.current = false; // エラー時もフラグを下ろす
        return false;
      }
      const planId = effectiveUid + '_' + targetInputs['開始日'];
      const prms = {
        a: 'sendUsersPlan',
        hid,
        bid,
        uid: effectiveUid,
        item: 'personalSupport',
        created: targetInputs['作成日'],
        content: { uid: effectiveUid, content: processedContent, planId },
      };

      const res = await univApiCall(prms, 'E23442', '', setSnack, '', '', false);
      
      if (res && res.data && res.data.result) {
        // 新規追加モードの場合、先にURL変更を行う（useEffectの競合を防ぐため）
        if (isAddMode) {
          resetPlanAddMode(history, inputs['作成日']);
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
            item.item === 'personalSupport' // personalSupportのみを対象とする
          );
        } else {
          existingIndex = newAllPersonalData.findIndex(item => 
            item.uid === effectiveUid && 
            item.item === 'personalSupport' // personalSupportのみを対象とする
          );
        }

        if (existingIndex !== -1) {
          newAllPersonalData[existingIndex] = { uid: effectiveUid, content: targetInputs, item: 'personalSupport', created: targetInputs['作成日'] };
        } else {
          newAllPersonalData.push({ uid: effectiveUid, content: targetInputs, item: 'personalSupport', created: targetInputs['作成日'] });
        }
        setAllPersonalData(newAllPersonalData);
        // 保存成功後、originInputsを現在のinputsの値で更新
        setOriginInputs({ ...targetInputs });
        
        // 少し待ってからフラグを下ろす（state更新が完了するまで）
        setTimeout(() => {
          isEditingRef.current = false;
        }, 50);
        
        setSnack({ msg: '個別支援計画が保存されました', severity: 'success' });
        
        // 作成日をローカルストレージの履歴に保存（日付のみ）
        saveCreatedDateToLS(targetInputs['作成日']);

        return true; // 成功
      } else {
        // API呼び出し失敗時の処理
        console.error('API呼び出し失敗:', res);
        isEditingRef.current = false; // 失敗時もフラグを下ろす
        setSnack({ msg: '保存に失敗しました。再度お試しください。', severity: 'error' });
        return false; // 失敗
      }
    } catch (error) {
      console.error('handleSubmit エラー:', error);
      isEditingRef.current = false; // エラー時もフラグを下ろす
      setSnack({ msg: '予期しないエラーが発生しました。入力内容を確認して再度お試しください。', severity: 'error' });
      return false; // 失敗
    }
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
    
    // 作成日の場合は重複チェック
    // if (label === '作成日' && value) {
    //   const normalizedValue = parseDate(value).date.dt.toLocaleDateString('sv-SE');;
      
    //   // 正規化された値でinputsを更新
    //   setInputs(prev => ({
    //     ...prev,
    //     [label]: normalizedValue
    //   }));
      
    //   const existingData = relatedItems.find(item => 
    //     item.uid === uid && item.content && item.content['作成日'] === normalizedValue
    //   );
      
    //   if (existingData) {
    //     setSnack({ msg: 'すでに存在している日付は指定できません', severity: 'warning' });
    //     setErrors(prev => ({ ...prev, [label]: true }));
    //   } else {
    //     setErrors(prev => {
    //       const newErr = { ...prev };
    //       delete newErr[label];
    //       return newErr;
    //     });
    //   }
    // } else {
      // その他のフィールドの処理
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
            missingFiveDomains={missingFiveDomains}
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
        a: 'fetchUsersPlan', hid, bid, uid: effectiveUid, item: 'assessment'
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
        a: 'fetchUsersPlan', hid, bid, uid: effectiveUid, item: 'assessment'
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
        return;
      }
      
      // <br>タグを改行に変換
      const convertedText = processDeepBrToLf(confModify);
      
      // 表題付きのテキストを作成
      const titledText = `【直近の担当者会議での修正内容】\n${convertedText}`;
      
      // 既存の内容がある場合は追記
      const currentModifyItems = modifyItems || '';
      const newContent = currentModifyItems && currentModifyItems.trim().length > 0 
        ? `${currentModifyItems}\n\n${titledText}` 
        : titledText;
      
      setModifyItems(newContent);
      setSnack({ msg: 'カンファレンスの修正内容を取得しました', severity: 'success' });
    } catch (e) {
      console.error(e);
      setSnack({ msg: 'カンファレンスからの取得に失敗しました', severity: 'error' });
    } finally {
      setIsFetchingFromConference(false);
    }
  };

  // 五領域の不足を修正内容に挿入
  const handleInsertFiveDomainCheck = () => {
    try {
      const missing = Array.isArray(missingFiveDomains) ? missingFiveDomains.filter(Boolean) : [];
      if (!missing.length) {
        setSnack({ msg: '五領域は既にすべてカバーされています', severity: 'info' });
        return;
      }
      const msg = `【五領域カバレッジの確認】\n五領域は本人支援でカバーすることが要求されています。\n五領域で${missing.join('・')}が欠けています。最小限の変更で五領域をカバーするようにしてください。`;
      
      // 既存の内容がある場合は追記
      const currentModifyItems = modifyItems || '';
      const newContent = currentModifyItems && currentModifyItems.trim().length > 0 
        ? `${currentModifyItems}\n\n${msg}` 
        : msg;
      
      setModifyItems(newContent);
      setSnack({ msg: '五領域の確認内容を追加しました', severity: 'success' });
    } catch (e) {
      console.error(e);
      setSnack({ msg: '五領域の再確認に失敗しました', severity: 'error' });
    }
  };

  // アセスメント変更点を取得して修正内容に挿入
  const handleFetchAssessmentChanges = async () => {
    try {
      const createdDate = inputs?.['作成日'];
      if (!createdDate) {
        setSnack({ msg: '作成日を先に入力してください', severity: 'warning' });
        return;
      }

      // アセスメント変更点を取得
      const assessmentChanges = await fetchAssessmentChanges(
        hid, 
        bid, 
        uid, 
        createdDate, 
        createdDate, // personalSupportDateパラメータは使用されないが、互換性のため残す
        setSnack
      );

      if (assessmentChanges && Object.keys(assessmentChanges).length > 0) {
        // 変更点を平文に変換
        const changesText = formatAssessmentChanges(assessmentChanges);
        
        const msg = `【アセスメント変更点の確認】\nアセスメントの変更点を確認しました。\n${changesText}\n\n上記の変更点を踏まえて、個別支援計画の見直しが必要か検討してください。`;
        
        // 既存の内容がある場合は追記
        const currentModifyItems = modifyItems || '';
        const newContent = currentModifyItems && currentModifyItems.trim().length > 0 
          ? `${currentModifyItems}\n\n${msg}` 
          : msg;
        
        setModifyItems(newContent);
        setSnack({ msg: 'アセスメント変更点を取得しました', severity: 'success' });
      } else {
        setSnack({ msg: 'アセスメントの変更点はありません', severity: 'info' });
      }
    } catch (error) {
      console.error('アセスメント変更点取得エラー:', error);
      setSnack({ msg: 'アセスメント変更点の取得に失敗しました', severity: 'error' });
    }
  };

  // 修正生成ダイアログのキャンセルハンドラー
  const handleCancelModifyGenerate = () => {
    setModifyDialogOpen(false);
    setModifyItems('');
    setIsModifyMode(false); // 修正モードをリセット
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
      created: inputs?.['作成日'], hid, bid, uid: effectiveUid, users, inputs,
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

  // personalSupportからpersonalSupportHohouへのコピー機能
  const handleCopyToPersonalSupportHohou = async () => {
    try {
      // 未保存の変更があるかチェック
      const hasUnsavedChanges = !deepEqual(originInputs, inputs);
      if (hasUnsavedChanges) {
        const confirmed = window.confirm(
          '未保存の変更があります。先に保存してからコピーしますか？\n\n' +
          '「OK」: 保存してからコピー\n' +
          '「キャンセル」: 保存せずにコピー'
        );
        
        if (confirmed) {
          // 保存処理を実行
          const saveResult = await handleSubmit();
          if (!saveResult) {
            setSnack({ msg: '保存に失敗しました。コピーを中止します。', severity: 'error' });
            return;
          }
        }
      }
      
      // 現在の入力データをコピー
      const currentContent = { ...inputs };
      
      // 作成日の重複チェック（personalSupportHohouで）
      const duplicateCheck = await univApiCall({
        a: 'fetchUsersPlan',
        hid,
        bid,
        uid,
        item: 'personalSupport',
        created: currentContent['作成日'],
        limit: 1
      }, 'E23443', '', setSnack, '', '', false);

      if (duplicateCheck?.data?.result && duplicateCheck.data.dt && duplicateCheck.data.dt.length > 0) {
        setSnack({ 
          msg: `作成日 ${currentContent['作成日']} の保育所等訪問支援計画が既に存在します`, 
          severity: 'warning' 
        });
        return;
      }

      // データ処理
      let processedContent;
      try {
        processedContent = processDeepLfToBr(cleanSpecialCharacters(currentContent));
      } catch (processingError) {
        console.error('データ処理エラー:', processingError);
        setSnack({ msg: 'データの処理中にエラーが発生しました。', severity: 'error' });
        return;
      }

      const prms = {
        a: 'sendUsersPlan',
        hid,
        bid,
        uid: effectiveUid,
        item: 'personalSupport',
        created: currentContent['作成日'],
        content: { uid: effectiveUid, content: processedContent },
      };

      const res = await univApiCall(prms, 'E23442', '', setSnack, '', '', false);
      
      if (res && res.data && res.data.result) {
        // 成功時の処理
        setSnack({ msg: '保育所等訪問支援計画にコピーしました', severity: 'success' });
        
        // 作成日をローカルストレージの履歴に保存
        saveCreatedDateToLS(currentContent['作成日']);

        // 保訪画面に遷移
        const params = new URLSearchParams();
        params.set('created', currentContent['作成日']);
        params.set('hohou', 'true');
        history.push(`/plan/personalSupport?${params.toString()}`);
        
      } else {
        setSnack({ msg: 'コピーに失敗しました', severity: 'error' });
      }
    } catch (error) {
      console.error('コピー処理エラー:', error);
      setSnack({ msg: 'コピー処理中にエラーが発生しました', severity: 'error' });
    }
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

  return (
    <div 
      className={classes.planFormRoot}
      style={withSideSection ? { marginLeft: 'max(196px, calc((100% - 800px) / 2))' } : {}}
    >
      <PlanRelatedItemsPanel 
        uid={effectiveUid} 
        created={createdBase} 
        setRelatedItems={setRelatedItems}
        originInputs={originInputs}
        inputs={inputs}
        currentPlanType="personalSupport"
      />
      <form id='ed95rbb77' className='planForm'>
        <div className='title'>
          <div className='main'>個別支援計画登録</div>
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
                setLS(PLAN_ADD_MODE_ITEM, 'personalSupport');
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
              item="personalSupport"
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
            {/* 利用者のサービスが複数の場合、personalSupportHohouへコピーするボタンを表示 */}
            {(() => {
              const userServices = user?.service?.split(',').map(s => s.trim()).filter(Boolean) || [];
              const hasMultipleServices = userServices.length > 1;
              const hasHohouService = userServices.includes(HOHOU);
              
              if (hasMultipleServices && hasHohouService) {
                return (
                  <Button
                    startIcon={<AddCircleOutline />}
                    onClick={() => handleCopyToPersonalSupportHohou()}
                    style={{ color: green[600], marginRight: 8 }}
                    variant="outlined"
                    size="small"
                  >
                    保訪へコピー
                  </Button>
                );
              }
              return null;
            })()}
            <Button
              startIcon={<SchoolIcon />}
              onClick={handleGenerateMenuOpen}
              style={{ color: orange[800], marginRight: 8 }}
            >
              生成
            </Button>
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
                handleGenerateContent();
                handleGenerateMenuClose();
              }}>
                <ListItemIcon style={{ minWidth: 28, marginRight: 8, color: orange[800] }}>
                  <AddCircleOutline fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="新規生成" />
              </MenuItem>
              <MenuItem onClick={() => {
                handleModifyGenerateContent();
                handleGenerateMenuClose();
              }}>
                <ListItemIcon style={{ minWidth: 28, marginRight: 8, color: orange[800] }}>
                  <CreateIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="修正生成" />
              </MenuItem>
            </Menu>
            <PlanPrintButton
              item={originInputs?.["原案"] ? "personalSupportDraft" : "personalSupport"}
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
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={handleInsertFiveDomainCheck}
              size="small"
              style={{ marginLeft: 8 }}
            >
              五領域再確認
            </Button>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={handleFetchAssessmentChanges}
              size="small"
              style={{ marginLeft: 8 }}
            >
              アセスメント変更点取得
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

      <Dialog open={leaveConfirmOpen} onClose={closeLeaveConfirm} maxWidth='xs'>
        <DialogTitle>未保存の変更</DialogTitle>
        <DialogContent>
          変更が保存されていません。ページを離れますか？
        </DialogContent>
        <DialogActions>
          <Button onClick={closeLeaveConfirm}>キャンセル</Button>
          <Button onClick={confirmLeave} style={{ color: red[700] }}>破棄して移動</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export const PlanPersonalSupport = () => {
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
      setLS(PLAN_ADD_MODE_ITEM, 'personalSupport');
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
        const prms = {a: 'fetchUsersPlan', hid, bid, item: 'personalSupport', limit};
        
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

  console.log(allPersonalData, 'allPersonalData');
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
      <PlanPersonalSupportDetail 
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