import React, {useEffect, useState, useRef, forwardRef, useMemo} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, makeStyles, TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, Checkbox, DialogContentText, Menu } from '@material-ui/core';
import { convUID, getLodingStatus, getUisCookie, getUser, uisCookiePos } from '../../commonModule';
import SnackMsg from '../common/SnackMsg';
import { blue, red, teal, grey, yellow, orange, purple, indigo } from '@material-ui/core/colors';
import DeleteIcon from '@material-ui/icons/Delete';
import CreateIcon from '@material-ui/icons/Create';
import { Autocomplete } from '@material-ui/lab';
import { SideSectionUserSelect } from '../schedule/SchByUser2';
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
import { planMenu, PlanPrintButton, UserInfoDisplay, PlanDateChangeCopy, PlanOverlay, deepEqual } from './planCommonPart';
import { processDeepBrToLf, processDeepLfToBr } from '../../modules/newlineConv';
import { cleanSpecialCharacters } from '../../modules/cleanSpecialCharacters';
import SchoolIcon from '@material-ui/icons/School';
import { generateMonitoring } from './planMakePrompt';
import { getAssessmentChanges, fetchAssessmentChanges } from './planCommonPart';
import { getLS, setLS } from '../../modules/localStrageOprations';
import { planlsUid, PLAN_ADD_MODE_KEY, PLAN_ADD_MODE_ITEM } from './planConstants';
import { PlanRelatedItemsPanel } from './PlanRelatedItemsPanel';
import { saveCreatedDateToLS } from './utility/planLSUtils';
import { isPlanAddMode, resetPlanAddMode } from './planCommonPart';
import { permissionCheckTemporary } from '../../modules/permissionCheck';
import { PERMISSION_DEVELOPER } from '../../modules/contants';


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
  psDisplay: {
    fontSize: '.8rem', marginLeft: 8, marginRight: 8, padding: 4,
    backgroundColor: blue[50], color: blue[800], lineHeight: 1.2,
  },
  psDisplayInLine: {
    fontSize: '.8rem', marginLeft: 32, marginRight: 24, padding: 4,
    backgroundColor: blue[50], color: blue[800], lineHeight: 1.2,
  },
});


// 入力項目の定数定義（設定情報）
const inputDefinitions = [
  { 
    label: '作成者', type: 'text' , placeholder: '児童発達管理責任者', 
    style: { width: '20%' ,marginRight: 8}
  },
  // { label: '作成回数', type: 'NumInputGP', required: true, defaultValue: 0 , 
  //   style: { width: 120 ,marginRight: 8, marginTop: -8}
  // },
  { label: '実施日', type: 'DateInput', required: true, defaultValue: 0 , 
    style: { width: 120 ,marginRight: 8, marginTop: -8, marginLeft: -8}
  },
  { 
    label: '長期目標', type: 'text', style: { width: '100%' } , 
    placeholder: '長期目標に対する考察', multiline: true
  },
  { 
    label: '短期目標', type: 'text', style: { width: '100%' } , 
    placeholder: '短期目標に対する考察', multiline: true, 
  },
  { label: '本人の希望', type: 'text', style: { width: '100%' } , multiline: true, },
  { label: 'ご家族の希望', type: 'text', style: { width: '100%' } , multiline: true, },
  { label: '関係者の希望', type: 'text', style: { width: '100%' } , multiline: true, },
  { label: '備考', type: 'text', style: { width: '100%' } , multiline: true, },
  { 
    label: '支援経過', title: '支援目標及び具体的な支援内容',
    type: 'group', 
    fields: [
      { 
        label: '目標達成度', type: 'select', required: true, defaultValue: '達成', 
        souce: ['達成', '一部達成', '未達成', 'その他'], 
        style:{width: '20%', marginLeft: 8}, 
      },
      { 
        label: '評価', type: 'select', required: true, defaultValue: '継続', 
        souce: ['継続', '修正', '終了', 'その他'], 
        style:{width: '20%', marginLeft: 8}, 
      },
      { label: '考察', type: 'text', style:{width: '95%', marginLeft: 24, }, multiline: true},
    ]
  },
  { label: '備考欄', type: 'text', style: { width: '100%' } , multiline: true},
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
const LineRender = forwardRef(({ rowIndex, groupLabel, inputs, handleGroupChange, handleBlur, onRemove, personalSupport }, ref) => {
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

  // useEffect(() => {
  //   // console.log(localRowData, 'localRowData');
  //   console.log(localRowData['五領域'], 'localRowData.五領域');
  // }, [localRowData]);

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
      />
    )
  }

  const selectField = (label) => {
    const optionList = getGroupFieldDefinition(label).souce;
    return (
      <FormControl style={getGroupFieldDefinition(label).style || {}}>
        <InputLabel>{label}</InputLabel>
        <Select
          value={localRowData[label] || optionList[0]}
          onChange={e => handleChange(label, e.target.value)}
          onBlur={syncWithParent}
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
    const currentValues = localRowData[label] ? localRowData[label].split(',') : [];
    
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
              />
            }
            label={option}
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
      />
    )
  }
  const psDispaInLine = () => {
    const ps = personalSupport?.支援目標?.[rowIndex]?.支援目標;
    const content = personalSupport?.支援目標?.[rowIndex]?.支援内容 || '';
    if (!ps) return null;
    return (<div className={classes.psDisplayInLine}>設定済の目標：{ps} / {content}</div>)
  }

  return (<>
    <div ref={containerRef} className="fpRow" >
      <div className={classes.rowIndex}>{rowIndex + 1}</div>
      {selectField('目標達成度')}
      {selectField('評価')}
    </div>
    <div className="fpRow">{textField('考察')}</div>
    {psDispaInLine()}
  </>);
});

// 旧ローカル生成関数は廃止（planMakePrompt.generateMonitoring を使用）

const PlanMonitoringDetail = (props) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const allState = useSelector(s => s);
  const { hid, bid, users, account } = allState;
  const { 
    uid, suid, allPersonalData, setAllPersonalData, snack, setSnack, 
    allPersonalSupportData, setAllPersonalSupportData, withSideSection
  } = props;
  console.log(allPersonalSupportData, 'allPersonalSupportData PlanMonitoringDetail');
  const history = useHistory();
  const location = useLocation();
  // URLからcreatedParamを取得（Detail側で該当レコードを特定するために使用）
  const urlParams = new URLSearchParams(location.search);
  const createdParam = urlParams.get('created');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [yesNoDialogOpen, setYesNoDialogOpen] = useState(false);
  
  // URLパラメータからuidを取得し、確実に定義されたuidを使用
  const urlUid = urlParams.get('uid');
  const effectiveUid = urlUid || uid || suid;
  
  // 自由実費項目 open/close 用
  const user = getUser(effectiveUid, users);
  const isDev = permissionCheckTemporary(PERMISSION_DEVELOPER, account);
  const uids = convUID(uid).str;
  const required = true;
  const initialValues = getInitialValues();
  const [originInputs, setOriginInputs] = useState(initialValues);
  const [inputs, setInputs] = useState(initialValues);
  const [personalSupport, setPersonalSupport] = useState({});
  const [dateDisabled, setDateDisabled] = useState(false);
  const planAiButtonDisplay = getUisCookie(uisCookiePos.planAiButtonDisplay) !== '0';
  const createdBase = originInputs?.['実施日'] || inputs?.['実施日'];
  const canRequestSign = user?.ext?.line?.auth?.checked === true && !!user?.ext?.line?.id;
  const signRequireEnabled = allState.com?.ext?.usersPlanSettings?.signRequire ?? false;
  const showSignSection = (signRequireEnabled && canRequestSign) || !!originInputs?.signUrl;
  const [errors, setErrors] = useState({});
  // 生成確認用ダイアログと特記事項
  const [genDialogOpen, setGenDialogOpen] = useState(false);
  const [specialNote, setSpecialNote] = useState('');
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [assessmentChanges, setAssessmentChanges] = useState({});
  
  // 生成メニュー用の状態
  const [genMenuAnchor, setGenMenuAnchor] = useState(null);
  const [genMenuOpen, setGenMenuOpen] = useState(false);
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

  // 生成メニューのハンドラー
  const handleGenMenuOpen = (event) => {
    setGenMenuAnchor(event.currentTarget);
    setGenMenuOpen(true);
  };

  const handleGenMenuClose = () => {
    setGenMenuAnchor(null);
    setGenMenuOpen(false);
  };


  const genMessage = useMemo(() => {
    const d = inputs?.['実施日'] || '';
    const mmdd = d && /^(\d{4})-(\d{2})-(\d{2})$/.test(String(d))
      ? `${String(d).slice(5,7)}月${String(d).slice(8,10)}日` : `${d}`;
    const progress = Array.isArray(inputs?.['支援経過']) ? inputs['支援経過'] : [];
    const evalLines = progress.map((row, idx) => {
      const a = (row && row['目標達成度']) ? String(row['目標達成度']).trim() : '';
      const b = (row && row['評価']) ? String(row['評価']).trim() : '';
      const val = [a, b].filter(Boolean).join('・') || 'xxx';
      return `目標${idx + 1}：${val}`;
    }).join('\n');
    const evalBlock = progress.length
      ? `\n\n各目標に対する評価は以下の通りです。\n${evalLines}`
      : '';
    return `${mmdd}付けの目標に対する考察を作成します。\n各目標に対して[目標達成度][評価]で考察を行います。\nモニタリングに対して特記事項があったら記載してください${evalBlock}`;
  }, [inputs?.['実施日'], inputs?.['支援経過']]);

  // 日付変更／コピーは共通コンポーネントへ移行

  const inputValueRef = useRef({});
  const groupInputValueRef = useRef({});
  const timeoutRef = useRef(null);

  // 新規追加モードの判定
  const isAddMode = useMemo(() => {
    return isPlanAddMode(location, 'monitoring');
  }, [location.search]);

  // 子コンポーネントの ref を配列として管理する
  const lineRenderRefs = useRef([]);

  // PlanPersonalSupportDetail コンポーネント内に状態を追加
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ rowIndex: null, groupLabel: null });

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
      // setPersonalSupport({});
      return;
    }
    
    // createdParamが指定されている場合は、その日付のデータを特定
    let t;
    if (createdParam) {
      t = allPersonalData.find(item => 
        item.uid === effectiveUid && 
        item.content && 
        item.content['実施日'] === createdParam
      );
    } else {
      // createdParamが指定されていない場合は、effectiveUidのみで検索
      t = allPersonalData.find(item => item.uid === effectiveUid);
    }
    
    if (t) {
      // <br>を\nに変換してからセット
      setOriginInputs(processDeepBrToLf(t.content));
      setInputs(processDeepBrToLf(t.content));
      setDateDisabled(!!(t.content && t.content['実施日'] && t.content['実施日'].toString().trim() !== ''));
    } else {
      setOriginInputs(initialValues);
      setInputs(initialValues);
      setDateDisabled(false);
    }
    // personalSupport の選定は別の useEffect（実施日変更監視）で一元化
  }, [effectiveUid, allPersonalData, allPersonalSupportData, isAddMode, createdParam]);

  // 実施日の変更を監視し、PersonalSupportデータを更新する（デバウンス付き）
  useEffect(() => {

    // デバウンス処理（500ms待機）
    const timeoutId = setTimeout(() => {
      // inputs['実施日']がYYYY-MM-DD形式の場合は、item.createdがinputs['実施日']以下の値を求める
      let p;
      if (inputs['実施日'] && /^\d{4}-\d{2}-\d{2}$/.test(inputs['実施日'])) {
        p = allPersonalSupportData.find(item => 
          item.uid === effectiveUid && 
          item?.content?.作成日 && 
          item?.content?.作成日 <= inputs['実施日']
        );
      } else {
        p = allPersonalSupportData.find(item => item.uid === effectiveUid);
      }

      if (p) {
        setPersonalSupport(processDeepBrToLf(p.content));
      } else {
        setPersonalSupport({});
      }
    }, 500);

    // クリーンアップ関数
    return () => clearTimeout(timeoutId);
  }, [inputs['実施日'], effectiveUid, allPersonalSupportData, isAddMode]);

  useEffect(() => {
    console.log(personalSupport, 'personalSupport');
    
    // personalSupportに支援目標データがあり、inputsに支援経過データがある場合
    if (personalSupport?.['支援目標'] && inputs?.['支援経過']) {
      const supportGoalsLength = personalSupport['支援目標'].length;
      const progressLength = inputs['支援経過'].length;
      
      // 支援目標の配列長さが支援経過より大きい場合、支援経過の配列を拡張する
      if (supportGoalsLength > progressLength) {
        setInputs(prev => {
          // 現在の支援経過データをコピー
          const currentProgress = [...prev['支援経過']];
          
          // 追加する項目数を計算
          const itemsToAdd = supportGoalsLength - progressLength;
          
          // 支援経過の定義を取得
          const progressDefinition = inputDefinitions.find(def => def.label === '支援経過');
          
          // 新しい項目を作成して追加
          const newItems = Array(itemsToAdd).fill().map(() => {
            const newItem = {};
            progressDefinition.fields.forEach(field => {
              newItem[field.label] = field.defaultValue !== undefined ? field.defaultValue : '';
            });
            return newItem;
          });
          
          // 更新された配列を返す
          return {
            ...prev,
            '支援経過': [...currentProgress, ...newItems]
          };
        });
      }
    }
  }, [personalSupport]);


  // 処理は PlanDateChangeCopy に集約

  const handleDelete = async () => {
    if (!deleteConfirm){
      setDeleteConfirm(true);
    } else {
      const prms = {
        a: 'deleteUsersPlan',hid, bid, uid: effectiveUid, item: 'monitoring', 
        created: inputs['実施日'] || createdParam
      };
      const res = await univApiCall(
        prms, 'E23441', '', setSnack, '削除されました', '削除に失敗しました', false
      );
      if (res && res.data && res.data.result) {
        // 削除成功後、inputsを初期状態に戻す
        setInputs(initialValues);
        setDeleteConfirm(false);
        // モニタリングリストから該当項目を削除
        let updatedPersonalData;
        if (createdParam) {
          updatedPersonalData = allPersonalData.filter(item => 
            !(item.uid === effectiveUid && 
              item.content && 
              item.content['実施日'] === createdParam)
          );
        } else {
          updatedPersonalData = allPersonalData.filter(item => item.uid !== effectiveUid);
        }
        setAllPersonalData(updatedPersonalData);
      } else {
        // 削除失敗時も確認状態をリセット
        setDeleteConfirm(false);
      }
    }
  }
  const handleCancel = () => {
    // createdParamが指定されている場合は、その日付のデータを特定
    let t;
    if (createdParam) {
      t = allPersonalData.find(item => 
        item.uid === effectiveUid && 
        item.content && 
        item.content['実施日'] === createdParam
      );
    } else {
      // createdParamが指定されていない場合は、effectiveUidのみで検索
      t = allPersonalData.find(item => item.uid === effectiveUid);
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
    
    // 必須項目のバリデーション
    const newErrors = {};
    inputDefinitions.forEach(def => {
      if (def.required && (!inputs[def.label] || inputs[def.label].toString().trim() === '')) {
        newErrors[def.label] = true;
      }
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      // 実施日フィールドのエラーがある場合は特別なメッセージを表示
      if (newErrors['実施日'] && inputs['実施日']) {
        setSnack({ msg: '日付が不正または重複があります', severity: 'warning' });
      } else {
        setSnack({ msg: '必須項目が未入力です', severity: 'warning' });
      }
      isEditingRef.current = false; // エラー時もフラグを下ろす
      return; // 送信中断
    }

    try {
      const prms = {
        a: 'sendUsersPlan',
        hid,
        bid,
        uid,
        item: 'monitoring',
        created: inputs['実施日'],
        content: { 
          uid, 
          content: processDeepLfToBr(cleanSpecialCharacters(inputs)),
          personalSupportContent: processDeepLfToBr(cleanSpecialCharacters(personalSupport)),
        },
      };
      const res = await univApiCall(prms, 'E23442', '', setSnack, '', '', false);
      if (res && res.data && res.data.result) {
        // 保存成功後、URLにmode=addがある場合は必ず削除
        const currentUrlParams = new URLSearchParams(history.location.search);
        if (currentUrlParams.get('mode') === 'add' || isAddMode) {
          resetPlanAddMode(history, inputs['実施日']);
        }
        
        // API呼び出し成功後の処理
        const newAllPersonalData = [...allPersonalData];
        // createdParamが指定されている場合は、その日付のデータを特定して更新
        let existingIndex;
        if (createdParam) {
          existingIndex = newAllPersonalData.findIndex(item => 
            item.uid === effectiveUid && 
            item.content && 
            item.content['実施日'] === createdParam
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
        
        setSnack({ msg: 'モニタリングが保存されました', severity: 'success' });
        
        // 作成日をローカルストレージの履歴に保存
        saveCreatedDateToLS(inputs['実施日']);
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

  // ラベルからインデックスを取得するヘルパー関数
  const findInputIndexByLabel = (label) => {
    return inputs.findIndex(item => item.label === label);
  };

  // 生活歴グループのフィールド定義を取得
  const getLifeHistoryItemsDefinitions = () => {
    const lifeHistory = inputDefinitions.find(def => def.label === '生活歴');
    return lifeHistory ? lifeHistory.fields : [];
  };

  // 指定した生活歴内のフィールド定義を取得する
  const findLifeHistoryDefinitionByLabel = (fieldLabel) => {
    const items = getLifeHistoryItemsDefinitions();
    return items.find(item => item.label === fieldLabel);
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

  // 生活歴項目の追加ハンドラー
  const addLifeHistoryItem = () => {
    setInputs(prev => {
      const current = prev['生活歴'] || [];
      const nextPairNumber = Math.floor(current.length / 2) + 1;
      return {
        ...prev,
        '生活歴': [
          ...current,
          { label: `項目${nextPairNumber}`, value: '' },
          { label: `内容${nextPairNumber}`, value: '' }
        ]
      };
    });
  };

  // 生活歴項目の削除ハンドラー（特定のペアを削除）
  const removeLifeHistoryItem = (pairIndex) => {
    setInputs(prev => {
      const current = prev['生活歴'] || [];
      const startIndex = pairIndex * 2;
      if (startIndex < current.length) {
        const updated = [...current];
        updated.splice(startIndex, 2);
        return {
          ...prev,
          '生活歴': updated
        };
      }
      return prev;
    });
  };

  // ここでPlanAssessmentDetail専用のhandleBlurを追加
  // 各入力項目がrequiredの場合、空欄ならエラー状態をinputsに反映します
  const handleBlur = (label, value) => {
    const inputDef = findInputByLabel(label);
    if (inputDef && inputDef.required && (!value || value.toString().trim() === '')) {
      console.warn(`${label} は入力必須です。`);
    }
    
    // 実施日の場合は重複チェック
    if (label === '実施日' && value) {
      const existingData = allPersonalData.find(item => 
        item.uid === effectiveUid && item.content && item.content['実施日'] === value
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

  // // inputs 状態から生活歴項目を取得
  // const lifeHistoryItems = inputs['生活歴'] || [];

  // inputDefinitions 配列から指定したグループのフィールド定義を取得する
  const getGroupItemsDefinitions = (groupLabel) => {
    const group = inputDefinitions.find(def => def.label === groupLabel && def.type === 'group');
    return group ? group.fields : [];
  };

  // 指定したグループ内で、特定のフィールド定義（ラベルが fieldLabel と一致するもの）を取得する
  const findGroupDefinitionByLabel = (groupLabel, fieldLabel) => {
    const group = inputDefinitions.find(def => def.label === groupLabel && def.type === 'group');
    return group ? group.fields.find(field => field.label === fieldLabel) : null;
  };

  // 削除確認処理
  const handleRowDelete = (rowIndex, groupLabel) => {
    setDeleteTarget({ rowIndex, groupLabel });
    setDeleteDialogOpen(true);
  };

  // 削除実行処理
  const confirmDelete = () => {
    if (deleteTarget.rowIndex !== null && deleteTarget.groupLabel) {
      removeGroupRow(deleteTarget.rowIndex, deleteTarget.groupLabel);
    }
    setDeleteDialogOpen(false);
  };

  // groupRender関数を更新
  const groupRender = (groupLabel, groupProps) => {
    return (
      <div className="groupContainer" style={{ margin: '16px 0' }}>
        {inputs[groupLabel] && inputs[groupLabel].map((row, index) => (
          <LineRender 
            key={`${groupLabel}-row-${index}`} 
            rowIndex={index} 
            groupLabel={groupLabel} 
            inputs={inputs}
            handleGroupChange={handleGroupChange}
            handleBlur={handleBlur}
            onRemove={handleRowDelete}  // handleRowDeleteに変更
            ref={el => { lineRenderRefs.current[index] = el; }}
            personalSupport={personalSupport}
          />
        ))}
        <div style={{textAlign: 'center'}}>
          <IconButton
            color="primary"
            onClick={() => addGroupRowWithSync(groupLabel)}
          >
            <ControlPointIcon
              fontSize="large"
            />
          </IconButton>
        </div>
      </div>
    );
  };

  const addGroupRowWithSync = (groupLabel) => {
    if (lineRenderRefs.current) {
      lineRenderRefs.current.forEach(ref => {
        if (ref && ref.forceSync) {
          ref.forceSync();
        }
      });
    }
    setTimeout(() => {
      addGroupRow(groupLabel);
    }, 150);
  };

  const addGroupRow = (groupLabel) => {
    setInputs(prev => {
      const groupData = prev[groupLabel] ? [...prev[groupLabel]] : [];
      const groupFields = getGroupItemsDefinitions(groupLabel);
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

  const removeGroupRow = (rowIndex, groupLabel) => {
    setInputs(prev => {
      const groupData = prev[groupLabel] ? [...prev[groupLabel]] : [];
      groupData.splice(rowIndex, 1);
      return {
        ...prev,
        [groupLabel]: groupData,
      };
    });
  };

  // FieldRenderを元の関数として残す
  const FieldRender = (name) => {
    const fieldDef = findInputByLabel(name);
    if (!fieldDef) return null;
    
    switch (fieldDef.type) {
      case 'DateInput':
        // 日付型の場合、オブジェクトか文字列かを判定して適切に処理
        const dateValue = typeof inputs[name] === 'object' && inputs[name] !== null ? 
          (inputs[name].value || '') : inputs[name];
        
        // 実施日フィールドの場合、dateDisabledの状態を適用
        const isDisabled = name === '実施日' ? dateDisabled : false;

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
            onFocus={(e) => handleSelectInputAuto(e)}
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

  // 必要な値を直接子コンポーネントに渡すためのオブジェクト
  const groupProps = {
    inputs,
    handleGroupChange,
    handleBlur,
    findGroupDefinitionByLabel,
  };
  const psDisp = (label) => {
    const ps = personalSupport[label];
    if (!ps) return null;
    return (<div className={classes.psDisplay}>設定済の{label}：{ps}</div>)
  }
  
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
        currentPlanType="monitoring"
      />
      <form id='ed95rbb77' className='planForm'>
        <div className='title'>
          <div className='main'>モニタリング</div>
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
                setLS(PLAN_ADD_MODE_ITEM, 'monitoring');
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
              item="monitoring"
              created={originInputs?.['実施日']}
              inputs={inputs}
              setInputs={setInputs}
              originInputs={originInputs}
              setOriginInputs={setOriginInputs}
              setSnack={setSnack}
              createdField="実施日"
              allPersonalData={allPersonalData}
              setAllPersonalData={setAllPersonalData}
            />
            <Button
              startIcon={<SchoolIcon />}
              onClick={handleGenMenuOpen}
              style={{ color: orange[800] }}
            >
              生成
            </Button>
            <Menu
              anchorEl={genMenuAnchor}
              open={genMenuOpen}
              onClose={handleGenMenuClose}
              getContentAnchorEl={null}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <MenuItem onClick={async () => {
                // 実施日が指定されているかチェック
                if (!inputs?.['実施日'] || inputs['実施日'].toString().trim() === '') {
                  setSnack({ msg: '実施日を指定してから生成してください', severity: 'warning' });
                  handleGenMenuClose();
                  return;
                }
                
                // ダイアログを開く前にアセスメント変更を取得
                const assessmentChanges = await fetchAssessmentChanges(
                  hid, 
                  bid, 
                  uid, 
                  inputs?.['実施日'], 
                  personalSupport?.['作成日'], 
                  setSnack
                );
                setAssessmentChanges(assessmentChanges);
                setGenDialogOpen(true);
                handleGenMenuClose();
              }}>
                進捗を確認して生成
              </MenuItem>
            </Menu>
          
            <PlanPrintButton
              item="monitoring"
              created={originInputs?.['実施日']} 
              uid={effectiveUid}
              originInputs={originInputs} 
              inputs={inputs}
            />
          </div>
        </div>
        {/* 日付変更／コピー用のボタン群 */}
        
        {/* アセスメント基本情報 - 1行目 */}
        <div className="fpRow">
          {FieldRender('実施日')}
          {FieldRender('作成者')}
          {/* {FieldRender('作成回数')} */}
        </div>
        {/* <div className="fpRow">
        </div> */}
        <div className="fpRow">{FieldRender('長期目標')}</div>
        {psDisp('長期目標')}
        <div className="fpRow">{FieldRender('短期目標')}</div>
        {psDisp('短期目標')}
        <div className="fpRow">{FieldRender('本人の希望')}</div>
        {psDisp('本人意向')}
        <div className="fpRow">{FieldRender('ご家族の希望')}</div>
        {psDisp('家族意向')}
        <div className="fpRow">{FieldRender('関係者の希望')}</div>
        <div className="fpRow">{FieldRender('備考')}</div>
        {isDev && showSignSection && (
          <div className="fpRow">
            {signRequireEnabled && canRequestSign && (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={inputs?.['電子サイン依頼'] === true}
                    onChange={(e) => setInputs(prev => ({ ...prev, '電子サイン依頼': e.target.checked }))}
                    color="primary"
                    disabled={!!originInputs?.signUrl}
                  />
                }
                label="電子サイン依頼"
              />
            )}
            {originInputs?.signUrl && (
              <div style={{ display: 'flex', alignItems: 'center', marginLeft: 8 }}>
                <img
                  src={originInputs.signUrl} alt="電子サイン"
                  style={{ height: 32, border: '1px solid #eee', borderRadius: 4 }}
                />
              </div>
            )}
          </div>
        )}
        {/* グループ「支援目標」のレンダリング */}
        <div className="groupSection">
          <h3 className={classes.groupTitle}>達成目標と経過</h3>
          {groupRender('支援経過', groupProps)}
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
      {/* 日付変更／コピーは PlanDateChangeCopy 内に集約 */}
      {/* 生成確認ダイアログ（特記事項入力） */}
      <Dialog
        open={genDialogOpen}
        onClose={() => setGenDialogOpen(false)}
      >
        <DialogTitle>生成確認</DialogTitle>
        <DialogContent>
          <DialogContentText style={{ whiteSpace: 'pre-line' }}>
            {genMessage}
          </DialogContentText>
          
          {/* アセスメント変更点の表示 */}
          {assessmentChanges && Object.keys(assessmentChanges).length > 0 && (
            <div style={{ marginTop: 16, marginBottom: 16 }}>
              <DialogContentText style={{ fontWeight: 'bold', marginBottom: 8, color: teal[800] }}>
                アセスメント変更点：
              </DialogContentText>
              <div style={{ maxHeight: 200, overflowY: 'auto', padding: 8 }}>
                {Object.entries(assessmentChanges).map(([key, change]) => (
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
          
          <TextField
            label={'特記事項'}
            value={specialNote}
            onChange={(e) => setSpecialNote(e.target.value)}
            variant="standard"
            fullWidth
            multiline
            rows={3}
            style={{ marginTop: 8 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenDialogOpen(false)} color="primary">
            キャンセル
          </Button>
          <Button
            onClick={async () => {
              try {
                setGenDialogOpen(false);
                setOverlayOpen(true);
                await generateMonitoring({ user, inputs, setInputs, personalSupport, setSnack, specialNote, hid, bid, uid: effectiveUid, assessmentChanges });
              } catch (error) {
                console.error('Error in generate button click:', error);
                setSnack({ msg: 'エラーが発生しました', severity: 'error' });
              } finally {
                setOverlayOpen(false);
              }
            }}
            color="primary"
            variant="contained"
          >
            実行
          </Button>
        </DialogActions>
      </Dialog>
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
          さんの成長を振り返っています🥰
        </span>
      </PlanOverlay>
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
      <SnackMsg {...snack} />
    </div>
  )
}

export const PlanMonitoring = () => {
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
  const lastMonth = lastmonthParam || getLS('planCurMonth');
  
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
      setLS(PLAN_ADD_MODE_ITEM, 'monitoring');
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
  const [allPersonalSupportData, setAllPersonalSupportData] = useState([]);
  const [snack, setSnack] = useState({msg: '', severity: ''});
  const appPageSStyle = {marginTop: 80}
  const limit = users.length + 50;

  // const getLastMonthFirstDay = (stdDate) => {
  //   const date = new Date(stdDate);
  //   date.setMonth(date.getMonth() - 1);
  //   return date.toISOString().slice(0, 10); // YYYY-MM-DD 形式で返す
  // };

  // const lastMonth = getLastMonthFirstDay(stdDate).slice(0, 7);

  useEffect(() => {
    isMountedRef.current = true;
    
    const fetchData = async (personalSupportOnly = false) => {
      try {
        // const month = stdDate.slice(0, 7);
        const prmsPs = {a: 'fetchUsersPlan', hid, bid, item: 'personalSupport', lastmonth: lastMonth};
        
        const resPs = await univApiCall(prmsPs, 'E23441', '', '');
        
        let resMo = null;
        let resDone = false;
        
        if (personalSupportOnly) {
          // personalSupportのみの場合
          resDone = resPs?.data?.result;
        } else {
          // 両方取得する場合
          const prmsMo = {a: 'fetchUsersPlan', hid, bid, item: 'monitoring', lastmonth: lastMonth};
          resMo = await univApiCall(prmsMo, 'E23441', '', '');
          resDone = resPs?.data?.result && resMo?.data?.result;
        }
        
        // API呼び出し後もコンポーネントがマウントされていることを確認
        if (isMountedRef.current && resDone) {
          if (personalSupportOnly) {
            // personalSupportのみの場合
            const psDt = (resPs.data?.dt ?? []).map(item => ({...item.content ?? {}}));
            setAllPersonalSupportData(psDt);
            setAllPersonalData([]); // monitoringデータは空配列で初期化
          } else {
            // 両方取得する場合
            const pdt = (resMo.data?.dt ?? []).map(item => ({...item.content ?? {}}));
            setAllPersonalData(pdt);
            const psDt = (resPs.data?.dt ?? []).map(item => ({...item.content ?? {}}));
            console.log(psDt, 'psDt', resPs, 'resPs');
            setAllPersonalSupportData(psDt);
          }
        } else if (isMountedRef.current && !resDone) {
          // エラーレスポンスの場合のみスナックメッセージを表示
          const errorMsg = personalSupportOnly 
            ? 'personalSupportデータ取得に失敗しました' 
            : 'データ取得に失敗しました';
          setSnack({
            msg: errorMsg, severity: 'error', errorId: 'EP23442', 
            onErrorDialog: true
          });
        }
      } catch (error) {
        // エラーハンドリング（必要に応じて）
        if (isMountedRef.current) {
          console.error('データ取得エラー:', error);
        }
      }
    };
    
    // mode=addの場合はpersonalSupportのみ取得、通常モードは両方取得
    if (modeParam === 'add') {
      if (loadingStatus.loaded && (!allPersonalSupportData || allPersonalSupportData.length === 0)) {
        fetchData(true); // personalSupportのみ取得
      }
    } else {
      // 通常モード：両方のデータを取得
      if (loadingStatus.loaded && (!allPersonalData || allPersonalData.length === 0)){
        fetchData(false); // 両方取得
      }
    }
    
    return () => {
      isMountedRef.current = false;  // クリーンアップ時に参照を更新
    };
  }, [loadingStatus.loaded, stdDate, hid, bid, location.search, lastmonthParam]);  // modeParamを依存配列から削除

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

  console.log(allPersonalSupportData, 'allPersonalSupportData');
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
      <PlanMonitoringDetail 
        uid={uidParam || suid} 
        suid={suid}
        allPersonalData={allPersonalData} setAllPersonalData={setAllPersonalData}
        allPersonalSupportData={allPersonalSupportData} 
        setAllPersonalSupportData={setAllPersonalSupportData}
        snack={snack} setSnack={setSnack}
        withSideSection={!createdParam}
      />
      <SnackMsg {...snack} />
    </div>
  </>)
}