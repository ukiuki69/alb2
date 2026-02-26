import React, {useEffect, useState, useRef, forwardRef, useMemo} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, makeStyles, TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, Checkbox, DialogContentText } from '@material-ui/core';
import { convUID, getLodingStatus, getUser } from '../../commonModule';
import SnackMsg from '../common/SnackMsg';
import { blue, red, teal, grey, indigo, orange } from '@material-ui/core/colors';
import DeleteIcon from '@material-ui/icons/Delete';
import { SideSectionUserSelect } from '../schedule/SchByUser2';
import { DateInput, NumInputGP } from '../common/StdFormParts';
import { LinksTab, LoadErr, LoadingSpinner, StdErrorDisplay, GoBackButton } from '../common/commonParts';
import { univApiCall, setRecentUser, getFilteredUsers } from '../../albCommonModule';
import { AddCircleOutline } from '@material-ui/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { handleSelectInputAuto } from '../../albCommonModule';
import ControlPointIcon from '@material-ui/icons/ControlPoint';
import { planMenu, PlanPrintButton, UserInfoDisplay, PlanDateChangeCopy, deepEqual } from './planCommonPart';
import { processDeepBrToLf, processDeepLfToBr } from '../../modules/newlineConv';
import { cleanSpecialCharacters } from '../../modules/cleanSpecialCharacters';
import { getLS, setLS } from '../../modules/localStrageOprations';
import { planlsUid, PLAN_ADD_MODE_KEY, PLAN_ADD_MODE_ITEM } from './planConstants';
import { PlanRelatedItemsPanel } from './PlanRelatedItemsPanel';
import { saveCreatedDateToLS } from './utility/planLSUtils';
import { isPlanAddMode, resetPlanAddMode } from './planCommonPart';


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
      const firstRow = {};
      def.fields.forEach(field => {
        firstRow[field.label] = field.defaultValue !== undefined ? field.defaultValue : '';
      });
      init[def.label] = [firstRow];
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

  const handleChange = (field, value) => {
    setLocalRowData(prev => ({ ...prev, [field]: value }));
  };

  const syncWithParent = () => {
    setTimeout(() => {
      if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
        Object.keys(localRowData).forEach((fld) => {
          handleGroupChange(groupLabel, rowIndex, fld, localRowData[fld]);
        });
      }
    }, 100);
  };

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

  const psDispaInLine = () => {
    const ps = personalSupport?.['支援目標']?.[rowIndex]?.['達成目標'];
    const content = personalSupport?.['支援目標']?.[rowIndex]?.['支援内容'] || '';
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


const PlanMonitoringSenmonDetail = (props) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const allState = useSelector(s => s);
  const { hid, bid, users } = allState;
  const { 
    uid, suid, allPersonalData, setAllPersonalData, snack, setSnack, 
    allPersonalSupportData, setAllPersonalSupportData, withSideSection
  } = props;
  const history = useHistory();
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const createdParam = urlParams.get('created');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  
  const urlUid = urlParams.get('uid');
  const effectiveUid = urlUid || uid || suid;
  
  const user = getUser(effectiveUid, users);
  const uids = convUID(uid).str;
  const required = true;
  const initialValues = getInitialValues();
  const [originInputs, setOriginInputs] = useState(initialValues);
  const [inputs, setInputs] = useState(initialValues);
  const [personalSupport, setPersonalSupport] = useState({});
  const [dateDisabled, setDateDisabled] = useState(false);
  const createdBase = originInputs?.['実施日'] || inputs?.['実施日'];
  const [errors, setErrors] = useState({});

  const inputValueRef = useRef({});
  const groupInputValueRef = useRef({});
  const timeoutRef = useRef(null);

  // 新規追加モードの判定
  const isAddMode = useMemo(() => {
    return isPlanAddMode(location, 'monitoringSenmon');
  }, [location.search]);

  const lineRenderRefs = useRef([]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ rowIndex: null, groupLabel: null });

  const isEditingRef = useRef(false);

  useEffect(() => {
    if (isEditingRef.current) {
      return;
    }
    
    const hasUnsavedChanges = !deepEqual(originInputs, inputs);
    if (hasUnsavedChanges) {
      return;
    }
    
    if (isAddMode) {
      setOriginInputs(initialValues);
      setInputs(initialValues);
      setDateDisabled(false);
      return;
    }
    
    let t;
    if (createdParam) {
      t = allPersonalData.find(item => 
        item.uid === effectiveUid && 
        item.content && 
        item.content['実施日'] === createdParam
      );
    } else {
      t = allPersonalData.find(item => item.uid === effectiveUid);
    }
    
    if (t) {
      setOriginInputs(processDeepBrToLf(t.content));
      setInputs(processDeepBrToLf(t.content));
      setDateDisabled(!!(t.content && t.content['実施日'] && t.content['実施日'].toString().trim() !== ''));
    } else {
      setOriginInputs(initialValues);
      setInputs(initialValues);
      setDateDisabled(false);
    }
  }, [effectiveUid, allPersonalData, allPersonalSupportData, isAddMode, createdParam]);

  // 実施日の変更を監視し、senmonShienデータを更新する
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      let p;
      if (inputs['実施日'] && /^\d{4}-\d{2}-\d{2}$/.test(inputs['実施日'])) {
        p = allPersonalSupportData.find(item => 
          item.uid === effectiveUid && 
          item?.content?.['開始日'] && 
          item?.content?.['開始日'] <= inputs['実施日']
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

    return () => clearTimeout(timeoutId);
  }, [inputs['実施日'], effectiveUid, allPersonalSupportData, isAddMode]);

  useEffect(() => {
    // personalSupportに支援目標データがあり、inputsに支援経過データがある場合
    if (personalSupport?.['支援目標'] && inputs?.['支援経過']) {
      const supportGoalsLength = personalSupport['支援目標'].length;
      const progressLength = inputs['支援経過'].length;
      
      if (supportGoalsLength > progressLength) {
        setInputs(prev => {
          const currentProgress = [...prev['支援経過']];
          const itemsToAdd = supportGoalsLength - progressLength;
          const progressDefinition = inputDefinitions.find(def => def.label === '支援経過');
          
          const newItems = Array(itemsToAdd).fill().map(() => {
            const newItem = {};
            progressDefinition.fields.forEach(field => {
              newItem[field.label] = field.defaultValue !== undefined ? field.defaultValue : '';
            });
            return newItem;
          });
          
          return {
            ...prev,
            '支援経過': [...currentProgress, ...newItems]
          };
        });
      }
    }
  }, [personalSupport]);


  const handleDelete = async () => {
    if (!deleteConfirm){
      setDeleteConfirm(true);
    } else {
      const prms = {
        a: 'deleteUsersPlan',hid, bid, uid: effectiveUid, item: 'monitoringSenmon', 
        created: inputs['実施日'] || createdParam
      };
      const res = await univApiCall(
        prms, 'E23441', '', setSnack, '削除されました', '削除に失敗しました', false
      );
      if (res && res.data && res.data.result) {
        setInputs(initialValues);
        setDeleteConfirm(false);
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
        setDeleteConfirm(false);
      }
    }
  }
  const handleCancel = () => {
    let t;
    if (createdParam) {
      t = allPersonalData.find(item => 
        item.uid === effectiveUid && 
        item.content && 
        item.content['実施日'] === createdParam
      );
    } else {
      t = allPersonalData.find(item => item.uid === effectiveUid);
    }
    if (t) {
      setInputs(t.content || []);
    } else {
      setInputs(initialValues);
    }
  }
  const handleSubmit = async () => {
    isEditingRef.current = true;
    
    if (lineRenderRefs.current) {
      lineRenderRefs.current.forEach(ref => {
        if (ref && ref.forceSync) {
          ref.forceSync();
        }
      });
    }

    await new Promise(resolve => setTimeout(resolve, 100));
    
    const newErrors = {};
    inputDefinitions.forEach(def => {
      if (def.required && (!inputs[def.label] || inputs[def.label].toString().trim() === '')) {
        newErrors[def.label] = true;
      }
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      if (newErrors['実施日'] && inputs['実施日']) {
        setSnack({ msg: '日付が不正または重複があります', severity: 'warning' });
      } else {
        setSnack({ msg: '必須項目が未入力です', severity: 'warning' });
      }
      isEditingRef.current = false;
      return;
    }

    try {
      const prms = {
        a: 'sendUsersPlan',
        hid,
        bid,
        uid,
        item: 'monitoringSenmon',
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
        
        const newAllPersonalData = [...allPersonalData];
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
        
        setOriginInputs({ ...inputs });
        
        setTimeout(() => {
          isEditingRef.current = false;
        }, 50);
        
        setSnack({ msg: 'モニタリング（専門）が保存されました', severity: 'success' });
        
        saveCreatedDateToLS(inputs['実施日']);
      } else {
        console.error('API呼び出し失敗:', res);
        isEditingRef.current = false;
        setSnack({ msg: '保存に失敗しました。再度お試しください。', severity: 'error' });
      }
    } catch (error) {
      console.error('handleSubmit エラー:', error);
      isEditingRef.current = false;
      setSnack({ msg: '予期しないエラーが発生しました。入力内容を確認して再度お試しください。', severity: 'error' });
    }
  };

  const findInputByLabel = (label) => {
    if (!inputDefinitions || !Array.isArray(inputDefinitions)) return undefined;
    return inputDefinitions.find(item => item.label === label);
  };

  const handleInputChange = (label, newValue) => {
    const fieldDef = findInputByLabel(label);
    
    if (fieldDef?.type === 'DateInput') {
      const valueToStore = typeof newValue === 'object' && newValue !== null ? 
        (newValue.value || '') : newValue;
      
      setInputs(prev => ({
        ...prev,
        [label]: valueToStore
      }));
      return;
    }
    
    setInputs(prev => ({
      ...prev,
      [label]: newValue
    }));
  };

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

  const handleBlur = (label, value) => {
    const inputDef = findInputByLabel(label);
    if (inputDef && inputDef.required && (!value || value.toString().trim() === '')) {
      console.warn(`${label} は入力必須です。`);
    }
    
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

  const getInputDefinition = (label) => {
    return inputDefinitions.find(def => def.label === label);
  };

  const getGroupItemsDefinitions = (groupLabel) => {
    const group = inputDefinitions.find(def => def.label === groupLabel && def.type === 'group');
    return group ? group.fields : [];
  };

  const handleRowDelete = (rowIndex, groupLabel) => {
    setDeleteTarget({ rowIndex, groupLabel });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteTarget.rowIndex !== null && deleteTarget.groupLabel) {
      removeGroupRow(deleteTarget.rowIndex, deleteTarget.groupLabel);
    }
    setDeleteDialogOpen(false);
  };

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
            onRemove={handleRowDelete}
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

  const FieldRender = (name) => {
    const fieldDef = findInputByLabel(name);
    if (!fieldDef) return null;
    
    switch (fieldDef.type) {
      case 'DateInput':
        const dateValue = typeof inputs[name] === 'object' && inputs[name] !== null ? 
          (inputs[name].value || '') : inputs[name];
        
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

  const groupProps = {
    inputs,
    handleGroupChange,
    handleBlur,
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
        currentPlanType="monitoringSenmon"
      />
      <form id='ed95rbb78' className='planForm'>
        <div className='title'>
          <div className='main'>
            モニタリング
            <span style={{ color: orange[800], fontWeight: 'bold', marginLeft: 8 }}>（専門）</span>
          </div>
          <UserInfoDisplay user={user} uid={effectiveUid} />
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <Button
              startIcon={<AddCircleOutline />}
              style={{ color: indigo[500], marginRight: 8 }}
              onClick={() => {
                const params = new URLSearchParams(location.search);
                params.set('mode', 'add');
                history.replace({
                  pathname: location.pathname,
                  search: params.toString()
                });
                setLS(PLAN_ADD_MODE_KEY, 'true');
                setLS(PLAN_ADD_MODE_ITEM, 'monitoringSenmon');
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
              item="monitoringSenmon"
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
          
            <PlanPrintButton
              item="monitoringSenmon"
              created={originInputs?.['実施日']} 
              uid={effectiveUid}
              originInputs={originInputs} 
              inputs={inputs}
            />
          </div>
        </div>
        
        {/* 基本情報 */}
        <div className="fpRow">
          {FieldRender('実施日')}
          {FieldRender('作成者')}
        </div>
        <div className="fpRow">{FieldRender('長期目標')}</div>
        {psDisp('長期目標')}
        <div className="fpRow">{FieldRender('短期目標')}</div>
        {psDisp('短期目標')}
        <div className="fpRow">{FieldRender('本人の希望')}</div>
        <div className="fpRow">{FieldRender('ご家族の希望')}</div>
        <div className="fpRow">{FieldRender('関係者の希望')}</div>
        <div className="fpRow">{FieldRender('備考')}</div>
        {/* グループ「支援経過」のレンダリング */}
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

export const PlanMonitoringSenmon = () => {
  const allState = useSelector(s=>s);
  const {users, hid, bid, stdDate, service, classroom} = allState;
  const loadingStatus = getLodingStatus(allState);
  const location = useLocation();
  const history = useHistory();
  const isMountedRef = useRef(true);
  
  const urlParams = new URLSearchParams(location.search);
  const createdParam = urlParams.get('created');
  const modeParam = urlParams.get('mode');
  const uidParam = urlParams.get('uid');
  const lastmonthParam = urlParams.get('lastmonth');
  const lastMonth = lastmonthParam || getLS('planCurMonth');
  
  let defUid = uidParam || getLS(planlsUid);
  const filterdUsers = getFilteredUsers(users, service, classroom);
  const found = filterdUsers.find(item => item.uid === String(defUid));
  if (!found) {
    defUid = filterdUsers?.[0]?.uid;
  }

  useEffect(() => {
    if (modeParam === 'add') {
      setLS(PLAN_ADD_MODE_KEY, 'true');
      setLS(PLAN_ADD_MODE_ITEM, 'monitoringSenmon');
    }
  }, [modeParam]);
  
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

  useEffect(() => {
    isMountedRef.current = true;
    
    const fetchData = async (senmonShienOnly = false) => {
      try {
        const prmsPs = {a: 'fetchUsersPlan', hid, bid, item: 'senmonShien', lastmonth: lastMonth};
        
        const resPs = await univApiCall(prmsPs, 'E23441', '', '');
        
        let resMo = null;
        let resDone = false;
        
        if (senmonShienOnly) {
          resDone = resPs?.data?.result;
        } else {
          const prmsMo = {a: 'fetchUsersPlan', hid, bid, item: 'monitoringSenmon', lastmonth: lastMonth};
          resMo = await univApiCall(prmsMo, 'E23441', '', '');
          resDone = resPs?.data?.result && resMo?.data?.result;
        }
        
        if (isMountedRef.current && resDone) {
          if (senmonShienOnly) {
            const psDt = (resPs.data?.dt ?? []).map(item => ({...item.content ?? {}}));
            setAllPersonalSupportData(psDt);
            setAllPersonalData([]);
          } else {
            const pdt = (resMo.data?.dt ?? []).map(item => ({...item.content ?? {}}));
            setAllPersonalData(pdt);
            const psDt = (resPs.data?.dt ?? []).map(item => ({...item.content ?? {}}));
            setAllPersonalSupportData(psDt);
          }
        } else if (isMountedRef.current && !resDone) {
          const errorMsg = senmonShienOnly 
            ? 'senmonShienデータ取得に失敗しました' 
            : 'データ取得に失敗しました';
          setSnack({
            msg: errorMsg, severity: 'error', errorId: 'EP23442', 
            onErrorDialog: true
          });
        }
      } catch (error) {
        if (isMountedRef.current) {
          console.error('データ取得エラー:', error);
        }
      }
    };
    
    if (modeParam === 'add') {
      if (loadingStatus.loaded && (!allPersonalSupportData || allPersonalSupportData.length === 0)) {
        fetchData(true);
      }
    } else {
      if (loadingStatus.loaded && (!allPersonalData || allPersonalData.length === 0)){
        fetchData(false);
      }
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [loadingStatus.loaded, stdDate, hid, bid, location.search, lastmonthParam]);

  useEffect(() => {
    if (suid) {
      setLS(planlsUid, String(suid));
      setRecentUser(suid);
    }
  }, [suid]);

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
      <PlanMonitoringSenmonDetail 
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
