import React, {useEffect, useState, useRef, forwardRef, useMemo} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, makeStyles, TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, Checkbox, DialogContentText } from '@material-ui/core';
import { convUID, getLodingStatus, getUisCookie, getUser, parseDate, uisCookiePos } from '../../commonModule';
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
import CloseIcon from '@material-ui/icons/Close';
import { useHistory, useLocation } from 'react-router-dom';
import { combineReducers } from 'redux';
 
import { handleSelectInputAuto } from '../../albCommonModule';
import ControlPointIcon from '@material-ui/icons/ControlPoint';
import { PlanPrintButton, UserInfoDisplay, PlanDateChangeCopy, isPlanAddMode, resetPlanAddMode, deepEqual } from './planCommonPart';
import { processDeepBrToLf, processDeepLfToBr } from '../../modules/newlineConv';
import { cleanSpecialCharacters } from '../../modules/cleanSpecialCharacters';
import SchoolIcon from '@material-ui/icons/School';
import { planMenu } from './planCommonPart';
import { llmApiCall } from '../../modules/llmApiCall';
import { getLS, setLS } from '../../modules/localStrageOprations';
import { planlsUid, PLAN_ADD_MODE_KEY, PLAN_ADD_MODE_ITEM } from './planConstants';
import { getPriorityService } from '../Billing/blMakeData2021';
import { purple } from '@material-ui/core/colors';
import { PlanRelatedItemsPanel } from './PlanRelatedItemsPanel';
import { saveCreatedDateToLS } from './utility/planLSUtils';
import { syncGroupRowStableIds } from './utility/groupRowIdUtils';
import { datePtn } from '../../modules/contants';

const inputDefinitions = [
  { 
    label: '開始日', type: 'DateInput', required: true, 
    style: { width: 120, marginTop: -8,  }
  },
  { label: '作成日', type: 'DateInput', required: true, style: { width: 120, marginTop: -8 }},
  { label: '担当者', type: 'text', style: { width: 180, }},
  { label: '補助作成者', type: 'text', style: { width: 180, } },
  { 
    label: '有効期限', type: 'NumInputGP', required: true, defaultValue: 6 , 
    style: { width: 120 , marginTop: -8}
  },
  { label: '電子サイン依頼', type: 'checkbox', defaultValue: false, style: {}},
  { label: '説明同意日', type: 'DateInput', style: { width: 120, marginTop: -8}},
  { 
    label: 'アセスメント結果', type: 'text', style: { width: '100%' } , 
    multiline: true
  },
  { 
    label: '総合的な支援の方針', type: 'text', style: { width: '100%' } , 
    multiline: true
  },
  { 
    label: '長期目標', type: 'text', style: { width: '100%' } , 
    multiline: true
  },
  { 
    label: '短期目標', type: 'text', style: { width: '100%' } , 
    multiline: true
  },
  { 
    label: '支援目標', title: '支援目標及び具体的な支援内容',
    type: 'group', 
    fields: [
      { 
        label: '五領域', type: 'checkboxes', style:{width: '100%', marginLeft: 24} ,
        souce: ['人間関係・社会性', '運動・感覚', '認知・行動', '言語・コミュ', '健康・生活']
      },
      { label: '達成目標', type: 'text', style:{width: '95%', marginLeft: 24, }, multiline: true},
      { label: '支援内容', type: 'text', style:{width: '95%', marginLeft: 24, }, multiline: true},
      { label: '実施内容', type: 'text', style:{width: '95%', marginLeft: 24, }, multiline: true},
      { 
        label: '達成期間', type: 'NumInputGP', required: true, defaultValue: 6 , 
        style:{marginLeft: 16}
      },
      { 
        label: '担当者', type: 'text', required: true, 
        style:{width: '25%', marginTop: 8, marginRight: 8}
      },
    ]
  },
];

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
const LineRender = forwardRef(({ rowIndex, groupLabel, inputs, handleGroupChange, handleBlur, onRemove, sortMode, onSwapUp, onSwapDown }, ref) => {
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
      <div style={{ ...(fieldDef.style || {}) }}>
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
        disabled={sortMode}
      />
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <div ref={containerRef} className="fpRow" >
        <div className={classes.rowIndex}>{rowIndex + 1}</div>
        {textField('達成目標')}
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
      {!sortMode && (
        <>
          <div className="fpRow">{checkBoxField('五領域')}</div>
          <div className="fpRow">{textField('支援内容')}</div>
          <div className="fpRow">{textField('実施内容')}</div>
        </>
      )}
      {!sortMode && (
        <div className="fpRow">
          {numInputField('達成期間')}
          {textField('担当者')}
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

const PlanSenmonShienDetail = (props) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const allState = useSelector(s => s);
  const { hid, bid, users } = allState;
  const { uid, suid, allPersonalData, setAllPersonalData, snack, setSnack, withSideSection } = props;
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
  
  const user = getUser(effectiveUid, users);
  const uids = convUID(uid).str;
  const required = true;

  // 電子サイン依頼が可能かどうかの判定（LINE連携状態の確認）
  const canRequestSign = user?.ext?.line?.auth?.checked === true && !!user?.ext?.line?.id;

  const initialValues = getInitialValues();
  const [originInputs, setOriginInputs] = useState(initialValues);
  const [inputs, setInputs] = useState(initialValues);
  const [dateDisabled, setDateDisabled] = useState(false);
  const planAiButtonDisplay = getUisCookie(uisCookiePos.planAiButtonDisplay) !== '0';
  const signRequireEnabled = allState.com?.ext?.usersPlanSettings?.signRequire ?? false;
  const useSubCreator = allState.com?.ext?.usersPlanSettings?.useSubCreator ?? false;
  const showSignSection =
    (signRequireEnabled && canRequestSign) || !!originInputs?.signUrl;
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

  // 子コンポーネントの ref を配列として管理する
  const lineRenderRefs = useRef([]);

  // PlanSenmonShienDetail コンポーネント内に状態を追加
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ rowIndex: null, groupLabel: null });
  const [sortMode, setSortMode] = useState(false);
  const [relatedItems, setRelatedItems] = useState([]);
  
  // 個別支援計画データ取得用の状態
  const [availablePersonalSupport, setAvailablePersonalSupport] = useState(null);
  const [showReflectButton, setShowReflectButton] = useState(false);

  // 新規追加モードの判定
  const isAddMode = useMemo(() => {
    return isPlanAddMode(location, 'senmonShien');
  }, [location.search]);

  useEffect(() => {
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
        
        let d = null;
        if (/^\d+$/.test(String(rawTs))) {
          d = new Date(Number(rawTs));
        } else if (typeof rawTs === 'string') {
          d = new Date(rawTs);
        }

        if (d && !isNaN(d.getTime())) {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          timestampDate = `${year}-${month}-${day}`;
        }

        if (timestampDate && datePtn.test(timestampDate)) {
          processedContent['説明同意日'] = timestampDate;
        }
      }

      const { signUrl: signUrlFromContent, ...contentWithoutSignUrl } = processedContent;
      setOriginInputs(signUrlFromContent ? { ...contentWithoutSignUrl, signUrl: signUrlFromContent } : processedContent);
      setInputs(contentWithoutSignUrl);
      // 作成日が有効な値であれば変更不可にする
      const hasValidCreatedDate = t.content && t.content['作成日'] && t.content['作成日'].toString().trim() !== '';
      setDateDisabled(hasValidCreatedDate);
    } else {
      setOriginInputs(processDeepBrToLf(initialValues));
      setInputs(processDeepBrToLf(initialValues));
      setDateDisabled(false);
    }
  }, [uid, allPersonalData, isAddMode, createdParam]);

  // アセスメントデータから自動取得機能
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

      // アセスメント結果が空白かチェック
      const assessmentResult = inputs['アセスメント結果'] || '';
      
      if (assessmentResult.trim() !== '') {
        return; // 既に入力済みの場合は何もしない
      }

      try {
        // assessmentデータを取得
        const assessmentRes = await univApiCall({
          a: 'fetchUsersPlan', 
          hid, 
          bid, 
          uid: effectiveUid, 
          item: 'assessment'
        }, 'E23443', '', setSnack, '', '', false);

        if (assessmentRes?.data?.result && assessmentRes.data.dt) {
          // createdで降順にソートされているので、作成日以下のデータの先頭を取得
          const targetAssessment = assessmentRes.data.dt.find(item => 
            item.created <= createdDate
          );

          if (targetAssessment?.content?.content) {
            const assessmentData = targetAssessment.content.content;
            
            // 既存の入力値を保持しつつ、空白の項目のみ更新
            setInputs(prev => ({
              ...prev,
              アセスメント結果: assessmentData['アセスメント結果'] || ''
            }));
          }
        }
      } catch (error) {
        console.error('Assessmentデータ取得エラー:', error);
      }
    };

    fetchAssessmentData();
  }, [inputs['作成日'], uid, hid, bid]);

  // mode=add時に個別支援計画データを取得
  useEffect(() => {
    const fetchPersonalSupportData = async () => {
      // 新規追加モードでない場合は何もしない
      if (!isAddMode) {
        setAvailablePersonalSupport(null);
        setShowReflectButton(false);
        return;
      }

      // 作成日が指定されているかチェック
      const createdDate = inputs['作成日'];
      if (!createdDate || createdDate.toString().trim() === '') {
        setAvailablePersonalSupport(null);
        setShowReflectButton(false);
        return;
      }

      // 作成日が有効な日付形式かチェック
      if (!datePtn.test(createdDate.toString())) {
        setAvailablePersonalSupport(null);
        setShowReflectButton(false);
        return;
      }

      try {
        // personalSupportデータを取得（personalSupportとpersonalSupportHohou両方）
        const personalSupportRes = await univApiCall({
          a: 'fetchUsersPlan', 
          hid, 
          bid, 
          uid: effectiveUid, 
          item: 'personalSupport'
        }, 'E23443', '', setSnack, '', '', false);

        const personalSupportHohouRes = await univApiCall({
          a: 'fetchUsersPlan', 
          hid, 
          bid, 
          uid: effectiveUid, 
          item: 'personalSupportHohou'
        }, 'E23443', '', setSnack, '', '', false);

        // 両方の結果をマージして作成日以前のデータを検索
        let allPersonalSupportData = [];
        
        if (personalSupportRes?.data?.result && personalSupportRes.data.dt) {
          allPersonalSupportData = allPersonalSupportData.concat(
            personalSupportRes.data.dt.map(item => ({...item, sourceType: 'personalSupport'}))
          );
        }
        
        if (personalSupportHohouRes?.data?.result && personalSupportHohouRes.data.dt) {
          allPersonalSupportData = allPersonalSupportData.concat(
            personalSupportHohouRes.data.dt.map(item => ({...item, sourceType: 'personalSupportHohou'}))
          );
        }

        // 作成日以前のデータを検索（降順ソートされているので最初のものを取得）
        const targetPersonalSupport = allPersonalSupportData.find(item => 
          item.created <= createdDate
        );

        if (targetPersonalSupport?.content?.content) {
          setAvailablePersonalSupport(targetPersonalSupport);
          setShowReflectButton(true);
        } else {
          setAvailablePersonalSupport(null);
          setShowReflectButton(false);
        }
      } catch (error) {
        console.error('PersonalSupportデータ取得エラー:', error);
        setAvailablePersonalSupport(null);
        setShowReflectButton(false);
      }
    };

    fetchPersonalSupportData();
  }, [inputs['作成日'], effectiveUid, hid, bid, isAddMode]);

  // 個別支援計画データを反映する関数
  const handleReflectPersonalSupport = () => {
    if (!availablePersonalSupport?.content?.content) {
      setSnack({ msg: '反映するデータがありません', severity: 'warning' });
      return;
    }

    const personalSupportData = availablePersonalSupport.content.content;
    
    // 同名項目を反映（専門支援計画の項目名と一致するもの）
    const updatedInputs = { ...inputs };
    
    // 共通する項目名をマッピング
    const commonFields = [
      '総合的な支援の方針', // personalSupportでは「支援方針」
      '長期目標',
      '短期目標'
    ];
    
    // personalSupportのフィールド名との対応
    const fieldMapping = {
      '総合的な支援の方針': '支援方針'
    };
    
    commonFields.forEach(senmonField => {
      const personalField = fieldMapping[senmonField] || senmonField;
      if (personalSupportData[personalField] && personalSupportData[personalField].toString().trim() !== '') {
        updatedInputs[senmonField] = processDeepBrToLf(personalSupportData[personalField]);
      }
    });
    
    // 支援目標の配列を複写（「本人支援」の項目のみ）
    if (personalSupportData['支援目標'] && Array.isArray(personalSupportData['支援目標'])) {
      const personalSupportGoals = personalSupportData['支援目標']
        .filter(goal => goal['項目'] === '本人支援') // 本人支援のみをフィルタリング
        .map(goal => {
          // personalSupportの支援目標をsenmonShienの形式に変換
          return {
            '五領域': goal['五領域'] || '',
            '達成目標': goal['支援目標'] || '', // personalSupportの「支援目標」→senmonShienの「達成目標」
            '支援内容': goal['支援内容'] || '',
            '実施内容': '', // 実施内容は空白のまま
            '達成期間': goal['達成期間'] || 6,
            '担当者': goal['担当者・提供機関'] || '' // personalSupportの「担当者・提供機関」→senmonShienの「担当者」
          };
        });
      
      // 本人支援の項目が存在する場合のみ反映
      if (personalSupportGoals.length > 0) {
        updatedInputs['支援目標'] = personalSupportGoals;
      }
    }
    
    setInputs(updatedInputs);
    setShowReflectButton(false); // 反映後はボタンを非表示
    setSnack({ 
      msg: `${availablePersonalSupport.created}付けの個別支援計画を反映しました`, 
      severity: 'success' 
    });
  };

  const handleDelete = async () => {
    if (!deleteConfirm){
      setDeleteConfirm(true);
    } else {
      const prms = {
        a: 'deleteUsersPlan',hid, bid, uid: effectiveUid, item: 'senmonShien', 
        created: inputs['作成日'] || createdParam
      };
      const res = await univApiCall(
        prms, 'E23441', '', setSnack, '削除されました', '削除に失敗しました', false
      );
      if (res && res.data && res.data.result) {
        // 削除成功後、inputsを初期状態に戻す
        setInputs(initialValues);
        setDeleteConfirm(false);
        // 専門支援計画リストから該当項目を削除
        let updatedPersonalData;
        if (createdParam) {
          updatedPersonalData = allPersonalData.filter(item => 
            !(item.uid === uid && 
              item.content && 
              item.content['作成日'] === createdParam)
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
      return; // 送信中断
    }
    
    // 新規追加モードの場合、作成日の重複チェック
    if (isAddMode) {
      // relatedItemsから同じ作成日のアイテムが存在するかチェック
      const duplicateItem = relatedItems.find(item => 
        item.uid === uid && 
        item.item === 'senmonShien' && 
        item.created === targetInputs['作成日']
      );
      
      if (duplicateItem) {
        setSnack({
          msg: '同じ作成日の専門支援計画が既に存在します。別の日付を指定してください。',
          severity: 'warning'
        });
        return;
      }
    } else {
      // 編集モードの場合、自分以外の同じ作成日のアイテムが存在するかチェック
      const duplicateItem = relatedItems.find(item => 
        item.uid === uid && 
        item.item === 'senmonShien' && 
        item.created === targetInputs['作成日'] &&
        item.created !== originInputs['作成日'] // 自分自身は除外
      );
      
      if (duplicateItem) {
        setSnack({
          msg: '同じ作成日の専門支援計画が既に存在します。別の日付を指定してください。',
          severity: 'warning'
        });
        return;
      }
    }

    try {
      // 送信前に各LineRenderの内容を強制的に同期
      if (lineRenderRefs.current) {
        lineRenderRefs.current.forEach(ref => {
          if (ref && ref.forceSync) {
            ref.forceSync();
          }
        });
      }

      // 少し待ってから送信処理を行う（同期が完了するのを待つ）
      await new Promise(resolve => setTimeout(resolve, 150));

      // データ処理を安全に行う
      let processedContent;
      try {
        processedContent = processDeepLfToBr(cleanSpecialCharacters(targetInputs));
      } catch (processingError) {
        console.error('データ処理エラー:', processingError);
        setSnack({ msg: 'データの処理中にエラーが発生しました。入力内容を確認してください。', severity: 'error' });
        return;
      }

      const planid = effectiveUid + '_' + targetInputs['開始日'];
      const prms = {
        a: 'sendUsersPlan',
        hid,
        bid,
        uid: effectiveUid,
        item: 'senmonShien',
        created: targetInputs['作成日'],
        content: { uid: effectiveUid, content: processedContent, planid },
      };
      const res = await univApiCall(prms, 'E23442', '', setSnack, '', '', false);
      if (res && res.data && res.data.result) {
        // API呼び出し成功後の処理
        const newAllPersonalData = [...allPersonalData];
        // createdParamが指定されている場合は、その日付のデータを特定して更新
        let existingIndex;
        if (createdParam) {
          existingIndex = newAllPersonalData.findIndex(item => 
            item.uid === uid && 
            item.content && 
            item.content['作成日'] === createdParam
          );
        } else {
          existingIndex = newAllPersonalData.findIndex(item => item.uid === uid);
        }

        if (existingIndex !== -1) {
          newAllPersonalData[existingIndex] = { uid: effectiveUid, content: targetInputs };
        } else {
          newAllPersonalData.push({ uid: effectiveUid, content: targetInputs });
        }
        setAllPersonalData(newAllPersonalData);
        // 保存成功後、originInputsを現在のinputsの値で更新
        setOriginInputs({ ...targetInputs });
        setSnack({ msg: '専門支援計画が保存されました', severity: 'success' });
        
        // 作成日をローカルストレージの履歴に保存
        saveCreatedDateToLS(targetInputs['作成日']);

        setRecentUser(effectiveUid); // 成功時にuidを設定
        
        // 新規追加モードの場合、LocalStorageをリセット
        if (isAddMode) {
          resetPlanAddMode(history, targetInputs['作成日']);
        }
      } else {
        // API呼び出し失敗時の処理
        console.error('API呼び出し失敗:', res);
        setSnack({ msg: '保存に失敗しました。再度お試しください。', severity: 'error' });
      }
    } catch (error) {
      console.error('handleSubmit エラー:', error);
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

  // ここでPlanSenmonShienDetail専用のhandleBlurを追加
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
  };

  // 指定したラベルに該当する設定情報を返す
  const getInputDefinition = (label) => {
    return inputDefinitions.find(def => def.label === label);
  };

  // inputDefinitions 配列から指定したグループのフィールド定義を取得する
  const getGroupItemsDefinitions = (groupLabel) => {
    const group = inputDefinitions.find(def => def.label === groupLabel && def.type === 'group');
    return group ? group.fields : [];
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
            key={`${groupLabel}-row-${row?.LineID || String(index + 1).padStart(2, '0')}`} 
            rowIndex={index} 
            groupLabel={groupLabel} 
            inputs={inputs}
            handleGroupChange={handleGroupChange}
            handleBlur={handleBlur}
            onRemove={handleRowDelete}
            sortMode={sortMode}
            onSwapUp={(rowIndex, groupLabel) => swapGroupRows(groupLabel, rowIndex, rowIndex - 1)}
            onSwapDown={(rowIndex, groupLabel) => swapGroupRows(groupLabel, rowIndex, rowIndex + 1)}
            ref={el => { lineRenderRefs.current[index] = el; }}
          />
        ))}
        <div style={{textAlign: 'center'}}>
          <Button
            color="primary"
            onClick={() => addGroupRowWithSync(groupLabel)}
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

  const swapGroupRows = (groupLabel, fromIndex, toIndex) => {
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

  // FieldRenderを元の関数として残す
  const FieldRender = (name) => {
    const fieldDef = findInputByLabel(name);
    if (!fieldDef) return null;
    
    switch (fieldDef.type) {
      case 'DateInput':
        // 日付型の場合、オブジェクトか文字列かを判定して適切に処理
        const dateValue = typeof inputs[name] === 'object' && inputs[name] !== null ? 
          (inputs[name].value || '') : inputs[name];
        // 作成日フィールドの場合、dateDisabledの状態を適用
        const isDisabled = name === '作成日' ? dateDisabled : false;
        
        return (
          <DateInput
            label={fieldDef.label}
            def={dateValue}
            required={fieldDef.required}
            style={fieldDef.style || {}}
            setExtVal={(val) => handleInputChange(name, val)}
            onFocus={(e) => handleSelectInputAuto(e)}
            cls={`tfMiddle`}
            error={!!errors[name]}
            helperText={errors[name] ? '必須項目です' : ''}
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
            error={!!errors[name]}
            helperText={errors[name] ? '必須項目です' : ''}
          />
        );
    }
  };

  // 必要な値を直接子コンポーネントに渡すためのオブジェクト
  const groupProps = {
    inputs,
    handleGroupChange,
    handleBlur,
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
        currentPlanType="senmonShien"
      />
      <form id='ed95rbb77' className='planForm'>
        <div className='title'>
          <div className='main'>専門支援計画登録</div>
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
                setLS(PLAN_ADD_MODE_ITEM, 'senmonShien');
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
              item="senmonShien"
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
            {/* <span style={{
              marginLeft: 8, display: 'inline-block', paddingTop: 12, fontSize: 12, 
              color: grey[500]
            }}>
              帳票準備中</span> */}
            <PlanPrintButton
              item="senmonShien"
              created={originInputs?.['作成日']} 
              uid={effectiveUid}
              originInputs={originInputs} 
              inputs={inputs}
            />
          </div>
          {/* 個別支援計画反映ボタン */}
          {showReflectButton && availablePersonalSupport && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginTop: 8, 
              marginBottom: 8,
              padding: '8px 16px',
              backgroundColor: grey[50],
              borderRadius: 4,
              border: `1px solid ${purple[200]}`
            }}>
              <Button
                startIcon={<CreateIcon />}
                style={{ color: purple[600], marginRight: 8 }}
                onClick={handleReflectPersonalSupport}
                size="small"
              >
                {availablePersonalSupport.created}付けの個別支援計画を反映する
              </Button>
              <Button
                startIcon={<CloseIcon />}
                style={{ color: grey[600] }}
                onClick={() => setShowReflectButton(false)}
                size="small"
              >
                キャンセル
              </Button>
            </div>
          )}
        </div>
        
        {/* 専門支援計画基本情報 - 1行目 */}
        <div className="fpRow" style={{paddingLeft: 0}}>
          {FieldRender('作成日')}
          {FieldRender('開始日')}
          {FieldRender('担当者')}
          {useSubCreator && FieldRender('補助作成者')}
          {FieldRender('有効期限')}
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
                    label={findInputByLabel('電子サイン依頼')?.label || '電子サイン依頼'}
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
                  {FieldRender('説明同意日')}
                </>
              )}
            </>
          )}
        </div>
        <div className="fpRow">{FieldRender('アセスメント結果')}</div>
        <div className="fpRow">{FieldRender('総合的な支援の方針')}</div>
        <div className="fpRow">{FieldRender('長期目標')}</div>
        <div className="fpRow">{FieldRender('短期目標')}</div>
        
        {/* グループ「支援目標」のレンダリング */}
        <div className="groupSection">
          <h3 className={classes.groupTitle}>支援目標及び具体的な支援内容</h3>
          {groupRender('支援目標', groupProps)}
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
    </div>
  )
}

export const PlanSenmonShien = () => {
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
      setLS(PLAN_ADD_MODE_ITEM, 'senmonShien');
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
        const prms = {a: 'fetchUsersPlan', hid, bid, item: 'senmonShien', limit};
        
        // lastmonthパラメータが指定されている場合は追加
        if (lastmonthParam) {
          prms.lastmonth = lastmonthParam;
          delete prms.limit; // lastmonthが指定されている場合はlimitを削除
        }
        
        // createdParamの送信は廃止（常に複数件取得し、詳細側で絞り込み）
        
        const res = await univApiCall(prms, 'E23441', '', '');
        
        // API呼び出し後もコンポーネントがマウントされていることを確認
        if (isMountedRef.current && res && res?.data?.result) {
          const senmonShiens = (res.data?.dt ?? []).map(item => ({...item.content ?? {}}));
          setAllPersonalData(senmonShiens);
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
      <PlanSenmonShienDetail 
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
