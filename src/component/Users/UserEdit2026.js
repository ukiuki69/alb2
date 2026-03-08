import React, { useState, useEffect, useReducer, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router';
import * as comMod from '../../commonModule';
import * as Actions from '../../Actions';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import { indigo, orange, purple, red, teal, yellow, grey, blue } from '@material-ui/core/colors';
import {
  Checkbox, FormControlLabel, Menu, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, Switch,
} from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import EmojiPeopleIcon from '@material-ui/icons/EmojiPeople';
import EditIcon from '@material-ui/icons/Edit';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import DeleteIcon from '@material-ui/icons/Delete';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import * as mui from '../common/materialUi';
import { GoBackButton } from '../common/commonParts';
import { HOUDAY, JIHATSU, HOHOU, KEIKAKU_SOUDAN, SYOUGAI_SOUDAN, seagull } from '../../modules/contants';
import { univApiCall } from '../../albCommonModule';
import SnackMsg from '../common/SnackMsg';
import SchLokedDisplay from '../common/SchLockedDisplay';
import { GetNextHist } from './Users';
import { NextUserDisp } from './UserEditNoDialog';
import { UnivCheckbox } from '../common/univFormParts';

import { buildInitialFormValues } from './utils/userEditDefaults';
import { submitUserEdit } from './utils/userEditSubmit';
import {
  UPPER_LIMIT_TYPES, createOfficeRow, getInitialUpperLimitEtc, collectOfficeCandidates,
  resolveUpperLimitRole, getUpperLimitButtonLabel, getUpperLimitTextColor,
  getUpperLimitDisplayList, createUpperLimitRowError, buildUnsavedSnapshot,
  validateUpperLimitDialogRows, normalizeUpperLimitEtcForSnapshot,
} from './utils/upperLimitUtils';
import useKanaInput from './hooks/useKanaInput';
import { UserEditDialogs } from './UserEdit2026Dialogs';
import {
  NameTextField, DateTextField, PhoneTextField, NumericTextField,
  HnoTextField, MailTextField, VolumeTextField, PriceLimitTextField,
  ContractLineNoTextField, ServiceSelect, UserTypeSelect,
  IryouCareSelect, BrosIndexSelect, Over18Select,
  ScitySelect, BelongsAutocomplete, ClassRoomAutocomplete,
  MultiServiceCheckboxes, DokujiJougenTextField, AddictionDateField,
} from './UserEdit2026Parts';
import { getAddictionVisibility, ADDICTION_ITEMS, ADDICTION_RESTRICTED_KEYS } from '../../modules/addictionUtils';
import { getAddictionOption } from '../common/AddictionFormPartsCommon';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';

// Reducer
function formReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD': return { ...state, [action.name]: action.value };
    case 'SET_MULTIPLE': return { ...state, ...action.fields };
    case 'INIT': return action.payload;
    default: return state;
  }
}

const useStyles = makeStyles({
  extSettingDispSw: {
    position: 'absolute', top: 124, left: 80,
  },
  stopUseButtonRoot: {
    paddingTop: 18, paddingLeft: 8,
    '& .MuiButton-label': { color: red[600] },
    '& .MuiSwitch-colorSecondary.Mui-checked': {
      color: red[600],
    },
    '& .MuiSwitch-colorSecondary.Mui-checked + .MuiSwitch-track': {
      backgroundColor: red[400],
    },
    '& .MuiSwitch-track': {
      backgroundColor: grey[400],
    },
  },
  stopUseLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
  },
  stopUseLabelText: {
    color: grey[600],
  },
  stopUseLabelTextOn: {
    color: red[600],
  },
  stopUseLabelIcon: {
    color: red[600],
  },
  stopUseInner: {
    '& .chkBox': { padding: 16, width: 160, paddingTop: 8 },
    '& .disc': { padding: 16, flex: 1, color: red[600], lineHeight: 1.5 },
  },
  nextUserNotation: {
    flex: 1, display: 'flex', alignItems: 'center',
    paddingLeft: 8,
    '& > div': {
      background: red[900], color: yellow[200],
      fontSize: '.8rem', padding: 8,
    },
  },
  sameNameButton: {
    background: red[800], color: '#fff',
    '&:hover': { background: red[700] },
  },
  userEditRoot: {
    '& .outer': {
      marginTop: 88, maxWidth: 800, paddingRight: 8,
      marginLeft: 200,
    },
    '@media screen and (min-width: 1200px)': {
      '& .outer': {
        marginLeft: 'calc(100vw / 2 - 400px)',
      },
    },
    '& .editTitle': {
      textAlign: 'center', color: teal[800], fontWeight: '600',
      position: 'relative', borderBottom: '1px solid ' + teal[300],
      padding: 8, background: teal[50],
    },
    '& .lastUpdate': {
      position: 'absolute', right: 8, top: 12, fontSize: '.8rem',
      color: blue[900], fontWeight: 400,
    },
    '& .formBody': {
      minWidth: 600, padding: 4, paddingTop: 8,
    },
  },
  buttonWrapper: {
    marginTop: 32,
    marginBottom: 60,
    textAlign: 'right',
    '& > button': { marginLeft: 8 },
  },
  cntRow: {
    display: 'flex', padding: '4px 8px',
    alignItems: 'flex-start',
  },
  upperLimitDialogRows: {
    display: 'flex', flexDirection: 'column', gap: 12, minWidth: 500,
  },
  upperLimitDialogRow: {
    display: 'flex', alignItems: 'center', gap: 8,
  },
  upperLimitDialogRowActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    paddingTop: 6,
    minWidth: 64,
  },
  upperLimitDialogArrowButtons: {
    display: 'flex',
    flexDirection: 'row',
    '& button': { padding: 1 },
  },
  upperLimitTrashButton: {
    padding: 2,
    '& .MuiSvgIcon-root': { color: red[300] },
  },
  upperLimitField: {
    width: 260,
  },
  upperLimitNoField: {
    width: 120,
  },
  upperLimitListBox: {
    marginLeft: 8,
    padding: '4px 0',
  },
  upperLimitListRow: {
    fontSize: '.9rem',
    color: grey[700],
    lineHeight: 1.5,
  },
  subMenuItem: {
    padding: '8px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    '&:hover': {
      backgroundColor: teal[50],
    },
  },
  menuItemMain: {
    fontSize: '1rem',
    fontWeight: 500,
  },
  menuItemSub: {
    fontSize: '0.75rem',
    color: teal[700],
    marginTop: 4,
  },
});

const EMPTY_USER = {};

const UserEdit2026 = () => {
  const allState = useSelector(state => state);
  const {
    hid, bid, stdDate, dateList, users, nextUsers, controleMode,
    serviceItems, schedule, service, classroom, com,
  } = allState;
  const history = useHistory();
  const prms = useParams().p;
  const uids = prms.replace(/[^0-9]/g, '');
  const addnew = prms.includes('addnew');
  const dispatch = useDispatch();
  const classes = useStyles();
  const soudanServiceNames = [KEIKAKU_SOUDAN, SYOUGAI_SOUDAN];
  const scheduleLocked = comMod.fdp(allState, 'schedule.locked');

  const editOn = uids ? true : false;
  const titleStr = editOn ? '利用者修正削除' : '利用者追加';
  const locPrms = comMod.locationPrams();
  const goBack = comMod.fdp(locPrms, 'detail.goback');

  const pi = (v) => parseInt(v);
  const sindexMax = users.reduce((v, e) => (pi(e.sindex) > v ? v = pi(e.sindex) : v), 0);
  const thisUser = useMemo(
    () => (uids ? comMod.getUser(uids, users, nextUsers) : EMPTY_USER),
    [uids, users, nextUsers]
  );

  // ---- Form state (useReducer) ----
  const defService = (() => {
    let ds = (serviceItems.length === 1 && addnew) ? serviceItems[0] : thisUser.service;
    if (!ds) ds = HOUDAY;
    if (!editOn && service) ds = service;
    return ds;
  })();

  const [formValues, formDispatch] = useReducer(
    formReducer,
    buildInitialFormValues(thisUser, defService, addnew, classroom)
  );
  const formValuesRef = useRef(formValues);
  useEffect(() => { formValuesRef.current = formValues; }, [formValues]);

  const {
    kanaLoading,
    kanaActionVisible,
    refetchKanaForField,
    fetchKanaForField,
    handleKanaOnFieldBlur,
  } = useKanaInput({ formValues, formValuesRef, formDispatch });

  // ---- Errors state ----
  const [errors, setErrors] = useState({});

  // ---- Other state ----
  const [snack, setSnack] = useState({ msg: '', severity: '' });
  const [dialog, setDialog] = useState({ type: null, data: null });
  const [hnoList, setHnoList] = useState(null);
  const [isProvisionalHno, setIsProvisionalHno] = useState(false);
  const [curService, setCurService] = useState(
    defService.includes(',') ? '複数サービス' : defService
  );
  const [multiSvcCnt, setMultiSvcCnt] = useState('');
  const [brosIndex, setBrosIndex] = useState(thisUser.brosIndex);
  const [upperLimitEtc, setUpperLimitEtc] = useState(() => getInitialUpperLimitEtc(thisUser));
  const [upperLimitMenuAnchor, setUpperLimitMenuAnchor] = useState(null);
  const [upperLimitDialog, setUpperLimitDialog] = useState({
    open: false,
    type: '',
    rows: [],
  });
  const [upperLimitDialogErrors, setUpperLimitDialogErrors] = useState([]);
  const [confirmClearUpperLimit, setConfirmClearUpperLimit] = useState(false);
  // 加算設定
  const [addictionDialogOpen, setAddictionDialogOpen] = useState(false);
  const [addictionValues, setAddictionValues] = useState(() => {
    const etcAddiction = thisUser?.etc?.addiction ?? {};
    const schAddiction = schedule?.[service]?.['UID' + uids]?.addiction ?? {};
    return { ...etcAddiction, ...schAddiction };
  });
  const [addictionDialogValues, setAddictionDialogValues] = useState({});
  const [addictionDialogService, setAddictionDialogService] = useState(null);
  const [addictionValuesBySvc, setAddictionValuesBySvc] = useState(() => {
    const multiSvc = thisUser?.etc?.multiSvc ?? {};
    const result = {};
    Object.keys(multiSvc).forEach(svc => {
      if (multiSvc[svc]?.addiction) result[svc] = { ...multiSvc[svc].addiction };
    });
    // schedule優先でマージ（ByUserAddictionNoDialogと統一）
    const svcs = defService.includes(',') ? defService.split(',') : [];
    svcs.forEach(svc => {
      const schAddiction = schedule?.[svc]?.['UID' + uids]?.addiction ?? {};
      if (Object.keys(schAddiction).length) {
        result[svc] = { ...(result[svc] ?? {}), ...schAddiction };
      }
    });
    return result;
  });

  const [initialSnapshot, setInitialSnapshot] = useState('');
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [extSetting, setExtSetting] = useState(() => {
    if (thisUser?.etc?.dokujiJougen) return true;
    if (thisUser?.etc?.dokujiJougenZero) return true;
    if (thisUser?.etc?.over18) return true;
    if (thisUser?.etc?.sochiseikyuu) return true;
    if (thisUser?.etc?.ageOffset) return true;
    return false;
  });

  // 利用停止
  const [stopUse, setStopUse] = useState(
    thisUser.endDate && thisUser.endDate.slice(0, 7) === stdDate.slice(0, 7)
  );
  useEffect(() => {
    const stopUseByEndDate = !!(
      thisUser?.endDate &&
      thisUser.endDate.slice(0, 7) === stdDate.slice(0, 7)
    );
    setStopUse(stopUseByEndDate);
  }, [thisUser, stdDate]);

  // 削除ボタン
  const [deleteConfirm, setDeleteConfirm] = useState(
    { flg: false, label: '削除', buttonClass: '' }
  );

  const officeCandidates = collectOfficeCandidates(users);
  const officeNameOptions = officeCandidates.map(x => x.name);
  const officeByName = officeCandidates.reduce((acc, cur) => {
    acc[cur.name] = cur.no;
    return acc;
  }, {});
  const upperLimitDisplayList = getUpperLimitDisplayList(upperLimitEtc);
  const upperLimitButtonLabel = getUpperLimitButtonLabel(upperLimitEtc);
  const currentKanriTypeForMenu = resolveUpperLimitRole(upperLimitEtc);
  const upperLimitTextColor = getUpperLimitTextColor(currentKanriTypeForMenu);
  const showKyoryoku = currentKanriTypeForMenu !== UPPER_LIMIT_TYPES.KYOURYOKU;
  const showKanri = currentKanriTypeForMenu !== UPPER_LIMIT_TYPES.KANRI;
  const currentSnapshot = useMemo(
    () => buildUnsavedSnapshot(formValues, upperLimitEtc, stopUse, addictionValues),
    [formValues, upperLimitEtc, stopUse, addictionValues]
  );
  const hasUnsavedChanges = initialSnapshot !== '' && currentSnapshot !== initialSnapshot;
  const hasUnsavedChangesRef = useRef(false);
  const unblockRef = useRef(null);

  useEffect(() => {
    setUpperLimitEtc(getInitialUpperLimitEtc(thisUser));
    const etcAddiction = thisUser?.etc?.addiction ?? {};
    const schAddiction = schedule?.[service]?.['UID' + uids]?.addiction ?? {};
    setAddictionValues({ ...etcAddiction, ...schAddiction });
  }, [thisUser]);
  useEffect(() => {
    const etcAddiction = thisUser?.etc?.addiction ?? {};
    const schAddiction = schedule?.[service]?.['UID' + uids]?.addiction ?? {};
    const initAddiction = { ...etcAddiction, ...schAddiction };
    setInitialSnapshot(buildUnsavedSnapshot(formValues, getInitialUpperLimitEtc(thisUser), stopUse, initAddiction));
  }, [uids]);
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);
  useEffect(() => {
    if (unblockRef.current) {
      unblockRef.current();
      unblockRef.current = null;
    }
    unblockRef.current = history.block((nextLocation) => {
      if (!hasUnsavedChangesRef.current) return true;
      setPendingLocation(nextLocation);
      setLeaveConfirmOpen(true);
      return false;
    });
    return () => {
      if (unblockRef.current) {
        unblockRef.current();
        unblockRef.current = null;
      }
    };
  }, [history]);
  const closeLeaveConfirm = () => {
    setLeaveConfirmOpen(false);
    setPendingLocation(null);
  };
  const confirmLeave = () => {
    const next = pendingLocation;
    setLeaveConfirmOpen(false);
    setPendingLocation(null);
    if (unblockRef.current) {
      unblockRef.current();
      unblockRef.current = null;
    }
    if (next) {
      const nextPath = `${next.pathname || ''}${next.search || ''}${next.hash || ''}`;
      history.push(nextPath);
    }
  };

  // 所属リスト
  const belongs1Set = new Set();
  const belongs2Set = new Set();
  users.forEach(e => {
    belongs1Set.add(e.belongs1);
    belongs2Set.add(e.belongs2);
  });
  const belongs1List = Array.from(belongs1Set);
  const belongs2List = Array.from(belongs2Set);

  // スケジュール存在チェック
  const uSchedule = useSelector(state => state.schedule['UID' + uids]);
  const existUsch = uSchedule
    ? Object.keys(uSchedule).filter(e => e.match(/^D2[0-9]*/)).length : 0;
  const enableDelete = thisUser.date === stdDate && existUsch === 0;

  // 最終更新
  const lastUpdate = !thisUser.date ? ''
    : thisUser.date.slice(0, 4) + '年' + thisUser.date.slice(5, 7) + '月';
  const lastUpdateStr = lastUpdate ? '最終更新: ' + lastUpdate : '';
  const lustUpdateIsThisMonthStyle = (thisUser.date === stdDate) ? { color: grey[600] } : {};

  // 月末文字列
  const sda = stdDate.split('-');
  const endOfMonthStr = comMod.formatDate(
    comMod.getDateEx(sda[0], sda[1], 0).dt, 'YYYY-MM-DD'
  );

  // 契約終了日制限
  const contractEndLimit = stdDate + ',2299-12-31';
  const dateInputStyle = { width: 120 };
  const contractRowDateInputStyle = { width: 112 };
  const contractRowVolumeStyle = { width: 112 };
  const contractRowLineNoStyle = { width: 112 };

  // 次月情報表示
  const today = new Date();
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const stdDateObj = new Date(stdDate);
  const showNextChangeButton = thisUser.next && (stdDateObj >= lastMonthStart);
  const isSoudan = soudanServiceNames.includes(curService);

  // 自治体の独自上限
  const cities = com?.etc?.cities ?? [];
  const city = cities.find(e => e.no === thisUser.scity_no);
  const cityDokujiJougen = city?.dokujiJougen;

  // ---- HNOリスト取得 ----
  useEffect(() => {
    let isMounted = true;
    if (hnoList !== null) return;
    const fetchHno = async () => {
      const p = { hid, bid, a: 'fetchAllHnoFromUsers' };
      const r = await univApiCall(p);
      if (!r.data.result) {
        setHnoList(false);
        return;
      }
      const s = new Set(r.data.dt.map(e => e.hno).filter(e => e.length === 3));
      if (isMounted) setHnoList(Array.from(s));
    };
    fetchHno();
    return () => { isMounted = false; };
  }, []);

  // ---- ハンドラ ----
  const handleFieldChange = (name, value) => {
    formDispatch({ type: 'SET_FIELD', name, value });
    if (name === 'service') {
      setCurService(value);
    }
    if (name === 'brosIndex') {
      setBrosIndex(value);
    }
  };

  const handleFieldBlur = (name, result) => {
    if (result.value !== undefined) {
      formDispatch({ type: 'SET_FIELD', name, value: result.value });
    }
    const { didKanjiChangeFetch } = handleKanaOnFieldBlur(name, result.value);
    setErrors(prev => ({
      ...prev,
      [name]: { error: result.error, helperText: result.helperText },
    }));

    // 名字の連動: 名字 → 保護者名字 + よみがな取得 + 保護者よみがな
    if (name === 'lname' && result.value) {
      if (!formValues.plname) {
        formDispatch({ type: 'SET_FIELD', name: 'plname', value: result.value });
      }
      if (!formValues.klname && !didKanjiChangeFetch) {
        fetchKanaForField(result.value, 'klname');
      } else if (!formValues.pklname) {
        formDispatch({ type: 'SET_FIELD', name: 'pklname', value: formValues.klname });
      }
    }
    // 名前の連動: 名前 → よみがな取得（保護者側には連動しない）
    if (name === 'fname' && result.value) {
      if (!formValues.kfname && !didKanjiChangeFetch) {
        fetchKanaForField(result.value, 'kfname');
      }
    }
    // 保護者名字/名前のblur時は、それぞれの読み仮名を自動取得
    if (name === 'plname' && result.value && !formValues.pklname && !didKanjiChangeFetch) {
      fetchKanaForField(result.value, 'pklname');
    }
    if (name === 'pfname' && result.value && !formValues.pkfname && !didKanjiChangeFetch) {
      fetchKanaForField(result.value, 'pkfname');
    }
    // よみがな → 保護者よみがな連動（名字のみ）
    if (name === 'klname' && result.value && !formValues.pklname) {
      formDispatch({ type: 'SET_FIELD', name: 'pklname', value: result.value });
    }
  };

  // 受給者証番号の仮設定: 未使用の3桁番号を自動付番してフィールドを固定する
  const handleSetProvisionalHno = () => {
    if (!hnoList) return;
    for (let i = 1; i <= 999; i++) {
      const candidate = comMod.zp(i, 3);
      if (!hnoList.includes(candidate)) {
        handleFieldChange('hno', candidate);
        handleFieldBlur('hno', { error: false, helperText: '仮設定中', value: candidate });
        setIsProvisionalHno(true);
        return;
      }
    }
  };

  const handleAddictionChange = (nameJp, value) => {
    setAddictionDialogValues(prev => ({ ...prev, [nameJp]: value }));
  };

  const openAddictionDialog = (svc = null) => {
    setAddictionDialogService(svc);
    if (svc) {
      const svcVals = addictionValuesBySvc[svc] ?? {};
      setAddictionDialogValues({ ...svcVals });
    } else {
      setAddictionDialogValues({ ...addictionValues });
    }
    setAddictionDialogOpen(true);
  };

  const closeAddictionDialog = () => {
    setAddictionDialogOpen(false);
  };

  const registerAddictionDialog = () => {
    if (addictionDialogService) {
      setAddictionValuesBySvc(prev => ({
        ...prev,
        [addictionDialogService]: { ...addictionDialogValues },
      }));
      // マルチサービス時も etc.addiction を更新（ByUserAddictionNoDialogと統一）
      setAddictionValues(prev => ({ ...prev, ...addictionDialogValues }));
    } else {
      setAddictionValues({ ...addictionDialogValues });
    }
    setAddictionDialogOpen(false);
  };

  const addictionRestrictedWarnings = ADDICTION_RESTRICTED_KEYS.filter(
    key => addictionDialogValues[key] && addictionDialogValues[key] !== ''
  );

  const addictionDisplayList = (() => {
    const merged = { ...addictionValues };
    Object.values(addictionValuesBySvc).forEach(svcVals => Object.assign(merged, svcVals));
    return Object.entries(merged)
      .filter(([_, v]) => v !== '' && v !== null && v !== undefined)
      .map(([key, val]) => ({ key, val }));
  })();

  const openUpperLimitMenu = (event) => {
    setUpperLimitMenuAnchor(event.currentTarget);
  };

  const closeUpperLimitMenu = () => {
    setUpperLimitMenuAnchor(null);
  };

  const handleUpperLimitButtonClick = (event) => {
    // 既存設定がある場合はメニューを経由せず直接対象ダイアログを開く
    if (currentKanriTypeForMenu === UPPER_LIMIT_TYPES.KANRI) {
      openUpperLimitDialog(UPPER_LIMIT_TYPES.KYOURYOKU);
      return;
    }
    if (currentKanriTypeForMenu === UPPER_LIMIT_TYPES.KYOURYOKU) {
      openUpperLimitDialog(UPPER_LIMIT_TYPES.KANRI);
      return;
    }
    openUpperLimitMenu(event);
  };

  const openUpperLimitDialog = (type) => {
    const currentRows = Array.isArray(upperLimitEtc[type]) ? upperLimitEtc[type] : [];
    const defaultRows = currentRows.length
      ? currentRows.map(e => {
        const row = createOfficeRow(e);
        const knownNo = officeByName[row.name];
        if (knownNo) {
          row.no = knownNo;
          row.noDisabled = true;
        } else {
          row.noDisabled = !row.name;
        }
        return row;
      })
      : [createOfficeRow()];
    setUpperLimitDialog({
      open: true,
      type,
      rows: type === UPPER_LIMIT_TYPES.KANRI ? [defaultRows[0]] : defaultRows,
    });
    setUpperLimitDialogErrors(Array(type === UPPER_LIMIT_TYPES.KANRI ? 1 : defaultRows.length).fill(null).map(() => createUpperLimitRowError()));
    closeUpperLimitMenu();
  };

  const closeUpperLimitDialog = () => {
    setUpperLimitDialog({ open: false, type: '', rows: [] });
    setUpperLimitDialogErrors([]);
    setConfirmClearUpperLimit(false);
  };

  const runUpperLimitBlurValidation = (rows = upperLimitDialog.rows) => {
    const rowErrors = validateUpperLimitDialogRows(rows);
    setUpperLimitDialogErrors(rowErrors);
    return rowErrors;
  };

  const updateUpperLimitDialogRow = (idx, key, value) => {
    const rows = upperLimitDialog.rows.map((row, i) => {
      if (i !== idx) return row;
      if (key === 'name') {
        const name = (value || '').toString();
        const trimmed = name.trim();
        if (!trimmed) {
          return { ...row, name, no: '', noDisabled: true };
        }
        const knownNo = officeByName[trimmed];
        if (knownNo) {
          return { ...row, name, no: knownNo, noDisabled: true };
        }
        // 既存候補から外れた場合、以前が固定入力なら番号を空に戻す
        const no = row.noDisabled ? '' : row.no;
        return { ...row, name, no, noDisabled: false };
      }
      return { ...row, [key]: key === 'no' ? comMod.convHankaku(value) : value };
    });
    setUpperLimitDialog({ ...upperLimitDialog, rows });
  };

  const addUpperLimitDialogRow = () => {
    const nextRows = [...upperLimitDialog.rows, createOfficeRow()];
    setUpperLimitDialog({
      ...upperLimitDialog,
      rows: nextRows,
    });
    setUpperLimitDialogErrors(validateUpperLimitDialogRows(nextRows));
  };

  const moveUpperLimitDialogRow = (idx, delta) => {
    const target = idx + delta;
    if (target < 0 || target >= upperLimitDialog.rows.length) return;
    const rows = [...upperLimitDialog.rows];
    const tmp = rows[idx];
    rows[idx] = rows[target];
    rows[target] = tmp;
    setUpperLimitDialog({ ...upperLimitDialog, rows });
    setUpperLimitDialogErrors(validateUpperLimitDialogRows(rows));
  };

  const removeUpperLimitDialogRow = (idx) => {
    const rows = upperLimitDialog.rows.filter((_, i) => i !== idx);
    const nextRows = rows.length ? rows : [createOfficeRow()];
    setUpperLimitDialog({
      ...upperLimitDialog,
      rows: nextRows,
    });
    setUpperLimitDialogErrors(validateUpperLimitDialogRows(nextRows));
  };

  const registerUpperLimitDialog = () => {
    const rowErrors = runUpperLimitBlurValidation();
    if (rowErrors.some(e => e.name || e.no)) return;

    const cleaned = (upperLimitDialog.rows || []).map(row => ({
      name: (row.name || '').trim(),
      no: comMod.convHankaku((row.no || '').trim()),
      kanriKekka: row.kanriKekka || '',
      kettei: row.kettei || '',
    }));
    const targetRows = cleaned.filter(row => row.name || row.no);

    if (upperLimitDialog.type === UPPER_LIMIT_TYPES.KYOURYOKU) {
      setUpperLimitEtc({
        [UPPER_LIMIT_TYPES.KYOURYOKU]: targetRows,
        [UPPER_LIMIT_TYPES.KANRI]: [],
      });
    } else if (upperLimitDialog.type === UPPER_LIMIT_TYPES.KANRI) {
      setUpperLimitEtc({
        [UPPER_LIMIT_TYPES.KANRI]: targetRows.slice(0, 1),
        [UPPER_LIMIT_TYPES.KYOURYOKU]: [],
      });
    }
    closeUpperLimitDialog();
  };

  const clearUpperLimitRegistration = () => {
    if (!confirmClearUpperLimit) {
      setConfirmClearUpperLimit(true);
      return;
    }
    setUpperLimitEtc({
      [UPPER_LIMIT_TYPES.KANRI]: [],
      [UPPER_LIMIT_TYPES.KYOURYOKU]: [],
    });
    closeUpperLimitDialog();
  };

  const handleSubmit = async (e, deleteBankInfo, options = {}) => {
    if (e && e.preventDefault) e.preventDefault();

    const result = await submitUserEdit({
      formValues, errors, thisUser, users, schedule,
      hid, bid, stdDate, dateList, hnoList,
      editOn, stopUse, endOfMonthStr, sindexMax,
      dispatch, history, goBack, setSnack, setDialog,
      options: {
        ...options,
        controleMode,
        etcOverride: upperLimitEtc,
        addictionOverride: addictionValues,
        addictionSvcOverride: addictionValuesBySvc,
        stateService: service,
      },
    });

    if (result?.success) {
      setInitialSnapshot(buildUnsavedSnapshot(formValues, upperLimitEtc, stopUse, addictionValues));
    }

    return result;
  };

  const handleDialogOk = (dialogType) => {
    setDialog({ type: null, data: null });
    if (dialogType === 'tempRegistration') {
      handleSubmit(null, false, { tempRegistration: true });
    } else if (dialogType === 'kanriDelete') {
      handleSubmit(null, false, { kanriDelete: true });
    } else if (dialogType === 'sameName') {
      handleSubmit(null, false, { sameNameConfirmed: true });
    }
  };

  const cancelSubmit = () => {
    if (goBack) {
      history.push(goBack);
    } else {
      history.goBack();
    }
  };

  const deleteUser = () => {
    const uid = comMod.convUID(uids).num;
    if (!deleteConfirm.flg) {
      setDeleteConfirm({
        flg: true, label: '削除実行', buttonClass: 'buttonStrong',
      });
      setSnack({
        msg: '利用者の削除を行うと当月以降のこの利用者の操作に影響があります。充分に注意して削除して下さい。',
        severity: 'warning', id: Date.now(),
      });
      return;
    }
    let prmsDelete = { uid, users, delete: true };
    dispatch(Actions.editUser(prmsDelete));
    prmsDelete = { hid, bid, uid: uids, a: 'removeUser', date: stdDate };
    dispatch(Actions.updateUser(prmsDelete));
  };

  // キーボードハンドラ
  const keyHandler = (e) => {
    if (e.which === 13 && e.shiftKey && e.ctrlKey) {
      cancelSubmit();
    } else if (e.which === 13 && e.shiftKey) {
      e.preventDefault();
      setTimeout(() => {
        handleSubmit(e);
      }, 100);
    }
  };

  // 複数サービスの契約情報
  const infoFromEtc = (svc) => {
    if (thisUser?.etc?.multiSvc?.[svc]) return thisUser.etc.multiSvc[svc];
    return {
      volume: thisUser.volume, startDate: thisUser.startDate,
      contractDate: thisUser.contractDate, contractEnd: thisUser.contractEnd,
      lineNo: thisUser.lineNo,
    };
  };

  const multiServiceContractInfo = [HOUDAY, JIHATSU, HOHOU].map((svc, i) => {
    if (!multiSvcCnt || !multiSvcCnt.includes(svc)) return null;
    return (
      <div key={i}>
        <div style={{
          padding: '8px 0 4px 8px', background: teal[50],
          borderBottom: '1px solid ' + teal[900],
          marginTop: 8, marginLeft: 0, fontSize: '.7rem',
        }}>{svc}</div>
        <div className={classes.cntRow}>
          <VolumeTextField
            name={svc + '-volume'}
            value={formValues[svc + '-volume'] ?? (infoFromEtc(svc).volumeStd ? '0' : infoFromEtc(svc).volume)}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
            error={errors[svc + '-volume']}
          />
          <DateTextField
            name={svc + '-startDate'} label='利用開始日' required
            value={formValues[svc + '-startDate'] ?? infoFromEtc(svc).startDate}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
            error={errors[svc + '-startDate']}
            style={dateInputStyle} helperTextShort
          />
          <DateTextField
            name={svc + '-contractDate'} label='契約日' required
            value={formValues[svc + '-contractDate'] ?? infoFromEtc(svc).contractDate}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
            error={errors[svc + '-contractDate']}
            style={dateInputStyle} helperTextShort
          />
          <DateTextField
            name={svc + '-contractEnd'} label='受給者証期限'
            value={formValues[svc + '-contractEnd'] ?? infoFromEtc(svc).contractEnd}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
            error={errors[svc + '-contractEnd']}
            limit={contractEndLimit}
            style={dateInputStyle} helperTextShort
          />
          <ContractLineNoTextField
            name={svc + '-lineNo'}
            value={formValues[svc + '-lineNo'] ?? infoFromEtc(svc).lineNo}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
            error={errors[svc + '-lineNo']}
          />
        </div>
      </div>
    );
  });

  const stopUseComment = () => {
    if (stopUse && !thisUser.next) {
      return '利用停止処理が有効になっています。次月以降は表示されません。当月の利用や請求は通常通り処理されます。';
    } else if (!stopUse && !thisUser.next) {
      return '利用停止をチェックして保存すると当月で利用停止処理を行います。次月以降は表示されません。当月の利用や請求は通常通り処理されます。';
    } else if (stopUse && thisUser.next) {
      return `このユーザーの利用停止処理を行いますが当月以降に情報が存在するため完全に非表示にはなりません。${thisUser.next.slice(0, 7)}以降の情報を確認して下さい。`;
    }
    return `利用停止をチェックして保存するとユーザーの利用停止処理を行いますが当月以降に情報が存在するため完全に非表示にはなりません。${thisUser.next.slice(0, 7)}以降の情報を確認して下さい。`;
  };

  return (
    <>
      <div className={classes.userEditRoot}>
        <div className='outer'>
          <GoBackButton posX={80} posY={24} url={goBack} />
          <div className='editTitle'>
            {titleStr}
            <div className='lastUpdate' style={lustUpdateIsThisMonthStyle}>
              {lastUpdateStr}
            </div>
          </div>

          <div className='formBody' onKeyPress={keyHandler}>
            {/* 行1: 名前・かな・生年月日 */}
            <div className={classes.cntRow}>
              <NameTextField
                nameLname='lname' nameFname='fname'
                labelLname='名字' labelFname='名'
                lname={formValues.lname} fname={formValues.fname}
                onChange={handleFieldChange} onBlur={handleFieldBlur}
                required errLname={errors.lname} errFname={errors.fname}
              />
              <NameTextField
                nameLname='klname' nameFname='kfname'
                labelLname='みょうじ' labelFname='なまえ'
                lname={kanaLoading.klname ? '取得中…' : formValues.klname}
                fname={kanaLoading.kfname ? '取得中…' : formValues.kfname}
                onChange={handleFieldChange} onBlur={handleFieldBlur}
                onActionLname={kanaActionVisible.klname ? () => refetchKanaForField('klname') : undefined}
                onActionFname={kanaActionVisible.kfname ? () => refetchKanaForField('kfname') : undefined}
                disableActionLname={!!kanaLoading.klname}
                disableActionFname={!!kanaLoading.kfname}
                actionTitleLname='名字の読み仮名を取得'
                actionTitleFname='名前の読み仮名を取得'
                required isKana errLname={errors.klname} errFname={errors.kfname}
              />
              <DateTextField
                name='birthday' label='生年月日' required
                value={formValues.birthday}
                onChange={handleFieldChange} onBlur={handleFieldBlur}
                error={errors.birthday}
              />
            </div>

            {/* 行2: サービス・種別・医療ケア・受給者証番号 */}
            <div className={classes.cntRow}>
              <ServiceSelect
                value={formValues.service}
                onChange={handleFieldChange}
              />
              {!soudanServiceNames.includes(curService) && <>
                <UserTypeSelect
                  value={formValues.type}
                  onChange={handleFieldChange}
                  service={curService}
                />
                <IryouCareSelect
                  value={formValues.icareType}
                  onChange={handleFieldChange}
                />
              </>}
              <HnoTextField
                value={formValues.hno}
                onChange={handleFieldChange}
                onBlur={handleFieldBlur}
                error={errors.hno}
                uid={uids}
                isProvisional={isProvisionalHno}
                onProvisional={handleSetProvisionalHno}
                onResetProvisional={() => setIsProvisionalHno(false)}
              />
            </div>

            {/* 複数サービスチェックボックス */}
            {curService === '複数サービス' &&
              <div className={classes.cntRow} style={{ marginBottom: 12 }}>
                <MultiServiceCheckboxes
                  defService={defService}
                  multiSvcCnt={multiSvcCnt}
                  setMultiSvcCnt={setMultiSvcCnt}
                  onChange={handleFieldChange}
                />
              </div>
            }

            {/* 行3: 上限額・市区町村・管理区分 */}
            <div className={classes.cntRow}>
              <PriceLimitTextField
                value={formValues.priceLimit}
                onChange={handleFieldChange}
                onBlur={handleFieldBlur}
                error={errors.priceLimit}
              />
              <ScitySelect
                scity={formValues.scity}
                scityNo={formValues.scity_no}
                onChange={handleFieldChange}
                onBlur={handleFieldBlur}
                errorScity={errors.scity}
                errorScityNo={errors.scity_no}
              />
            </div>

            {/* 行4: 契約情報（単一サービス） */}
            {curService !== '複数サービス' &&
              <div className={classes.cntRow}>
                {!isSoudan && <>
                  <VolumeTextField
                    value={formValues.volume}
                    onChange={handleFieldChange}
                    onBlur={handleFieldBlur}
                    error={errors.volume}
                    style={contractRowVolumeStyle}
                  />
                  <DateTextField
                    name='startDate' label='利用開始日' required
                    value={formValues.startDate}
                    onChange={handleFieldChange}
                    onBlur={handleFieldBlur}
                    error={errors.startDate}
                    style={contractRowDateInputStyle} helperTextShort
                  />
                </>}
                <DateTextField
                  name='contractDate' label='契約日' required={!isSoudan}
                  value={formValues.contractDate}
                  onChange={handleFieldChange}
                  onBlur={handleFieldBlur}
                  error={errors.contractDate}
                  style={contractRowDateInputStyle} helperTextShort
                />
                <DateTextField
                  name='contractEnd' label='受給者証期限'
                  value={formValues.contractEnd}
                  onChange={handleFieldChange}
                  onBlur={handleFieldBlur}
                  error={errors.contractEnd}
                  limit={contractEndLimit}
                  style={contractRowDateInputStyle} helperTextShort
                />
                <ContractLineNoTextField
                  value={formValues.lineNo}
                  onChange={handleFieldChange}
                  onBlur={handleFieldBlur}
                  error={errors.lineNo}
                  required={!isSoudan}
                  style={contractRowLineNoStyle}
                />
              </div>
            }

            {/* 複数サービス契約情報 */}
            {curService === '複数サービス' &&
              <div style={{ marginTop: 32, marginBottom: 32 }}>
                {multiServiceContractInfo}
              </div>
            }

            {/* 行5: 保護者名・かな・兄弟設定 */}
            <div className={classes.cntRow}>
              <NameTextField
                nameLname='plname' nameFname='pfname'
                labelLname='保護者名字' labelFname='保護者名'
                lname={formValues.plname} fname={formValues.pfname}
                onChange={handleFieldChange} onBlur={handleFieldBlur}
                required errLname={errors.plname} errFname={errors.pfname}
              />
              <NameTextField
                nameLname='pklname' nameFname='pkfname'
                labelLname='みょうじ' labelFname='なまえ'
                lname={kanaLoading.pklname ? '取得中…' : formValues.pklname}
                fname={kanaLoading.pkfname ? '取得中…' : formValues.pkfname}
                onChange={handleFieldChange} onBlur={handleFieldBlur}
                onActionLname={kanaActionVisible.pklname ? () => refetchKanaForField('pklname') : undefined}
                onActionFname={kanaActionVisible.pkfname ? () => refetchKanaForField('pkfname') : undefined}
                disableActionLname={!!kanaLoading.pklname}
                disableActionFname={!!kanaLoading.pkfname}
                actionTitleLname='保護者名字の読み仮名を取得'
                actionTitleFname='保護者名前の読み仮名を取得'
                required isKana errLname={errors.pklname} errFname={errors.pkfname}
              />
              <BrosIndexSelect
                value={formValues.brosIndex}
                onChange={handleFieldChange}
                style={{ marginTop: -8 }}
              />
            </div>

            {/* 行6: メール・電話 */}
            <div className={classes.cntRow}>
              <MailTextField
                name='pmail' label='保護者メール'
                value={formValues.pmail}
                onChange={handleFieldChange}
                onBlur={handleFieldBlur}
                error={errors.pmail}
              />
              <PhoneTextField
                name='pphone' label='保護者電話1' required
                value={formValues.pphone}
                onChange={handleFieldChange}
                onBlur={handleFieldBlur}
                error={errors.pphone}
              />
              <PhoneTextField
                name='pphone1' label='保護者電話2'
                value={formValues.pphone1}
                onChange={handleFieldChange}
                onBlur={handleFieldBlur}
                error={errors.pphone1}
              />
            </div>

            {/* 行7: 所属・単位・利用停止 */}
            <div className={classes.cntRow}>
              <BelongsAutocomplete
                name='belongs1' label='所属1'
                value={formValues.belongs1}
                onChange={handleFieldChange}
                options={belongs1List}
              />
              <BelongsAutocomplete
                name='belongs2' label='所属2'
                value={formValues.belongs2}
                onChange={handleFieldChange}
                options={belongs2List}
              />
              <ClassRoomAutocomplete
                value={formValues.classroom}
                onChange={handleFieldChange}
              />
              <div className={classes.stopUseButtonRoot}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!stopUse}
                      onChange={(ev) => setStopUse(ev.target.checked)}
                      color='secondary'
                    />
                  }
                  label={
                    <span className={classes.stopUseLabel}>
                      <span className={stopUse ? classes.stopUseLabelTextOn : classes.stopUseLabelText}>
                        利用停止
                      </span>
                      <EmojiPeopleIcon fontSize='small' className={classes.stopUseLabelIcon} />
                    </span>
                  }
                />
              </div>
            </div>
            <div className={classes.cntRow}>
                <Button
                  onClick={handleUpperLimitButtonClick}
                  startIcon={<EditIcon />}
                  variant='outlined'
                  style={{ color: upperLimitTextColor, minWidth: 220,  justifyContent: 'flex-start' }}
                >
                  {upperLimitButtonLabel}
                </Button>
                {upperLimitDisplayList.length > 0 && (
                  <div className={classes.upperLimitListBox}>
                    {upperLimitDisplayList.map((entry, idx) => (
                      <div className={classes.upperLimitListRow} key={idx} style={{ color: upperLimitTextColor }}>
                        {entry}
                      </div>
                    ))}
                  </div>
                )}
                <Menu
                  anchorEl={upperLimitMenuAnchor}
                  open={Boolean(upperLimitMenuAnchor)}
                  onClose={closeUpperLimitMenu}
                  anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  {showKyoryoku && (
                    <MenuItem onClick={() => openUpperLimitDialog(UPPER_LIMIT_TYPES.KYOURYOKU)} className={classes.subMenuItem}>
                      <div className={classes.menuItemMain}>協力事業所を登録</div>
                      <div className={classes.menuItemSub}>自事業所が上限管理を行います</div>
                    </MenuItem>
                  )}
                  {showKanri && (
                    <MenuItem onClick={() => openUpperLimitDialog(UPPER_LIMIT_TYPES.KANRI)} className={classes.subMenuItem}>
                      <div className={classes.menuItemMain}>管理事業所を登録</div>
                      <div className={classes.menuItemSub}>他事業所が上限管理を行います</div>
                    </MenuItem>
                  )}
                </Menu>
              </div>

            {/* 利用者別加算・請求設定 */}
            <div className={classes.cntRow} style={defService.includes(',') ? { flexDirection: 'column' } : {}}>
              {defService.includes(',')
                ? defService.split(',').map(svc => {
                    const isHohou = svc === HOHOU;
                    const btnColor = isHohou ? purple[800] : orange[800];
                    const svcDisplayList = Object.entries(addictionValuesBySvc[svc] ?? {})
                      .filter(([_, v]) => v !== '' && v !== null && v !== undefined)
                      .map(([key, val]) => ({ key, val }));
                    return (
                      <div key={svc} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 4 }}>
                        <Button
                          onClick={() => openAddictionDialog(svc)}
                          startIcon={<EditIcon />}
                          variant='outlined'
                          style={{ color: btnColor, minWidth: 220, justifyContent: 'flex-start', borderColor: btnColor }}
                        >
                          利用者別加算・{comMod.shortWord(svc)}
                        </Button>
                        {svcDisplayList.length > 0 && (
                          <div className={classes.upperLimitListBox}>
                            {svcDisplayList.map(({ key, val }, idx) => (
                              <div className={classes.upperLimitListRow} key={idx} style={{ color: btnColor }}>
                                {val === 1 || val === '1'
                                  ? key
                                  : <>{key}<ArrowRightIcon style={{ fontSize: 16, verticalAlign: 'middle' }} />{val}</>
                                }
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                : (
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <Button
                        onClick={() => openAddictionDialog()}
                        startIcon={<EditIcon />}
                        variant='outlined'
                        style={{ color: orange[800], minWidth: 220, justifyContent: 'flex-start' }}
                      >
                        利用者別加算・請求設定
                      </Button>
                      {addictionDisplayList.length > 0 && (
                        <div className={classes.upperLimitListBox}>
                          {addictionDisplayList.map(({ key, val }, idx) => (
                            <div className={classes.upperLimitListRow} key={idx} style={{ color: orange[800] }}>
                              {val === 1 || val === '1'
                                ? key
                                : <>{key}<ArrowRightIcon style={{ fontSize: 16, verticalAlign: 'middle' }} />{val}</>
                              }
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
              }
            </div>

            {/* 拡張設定 */}
            {extSetting && <>
              <div style={{ marginTop: 16 }}></div>
              <div className={classes.cntRow}>
                <Over18Select
                  value={formValues.over18}
                  onChange={handleFieldChange}
                />
                <DokujiJougenTextField
                  value={formValues.dokujiJougen}
                  onChange={handleFieldChange}
                  uid={uids}
                />
                {cityDokujiJougen &&
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={!!formValues.dokujiJougenZero}
                        onChange={e => handleFieldChange('dokujiJougenZero', e.target.checked ? '1' : '')}
                        color='primary'
                      />
                    }
                    label='独自上限を0円にする'
                    style={{ marginTop: 8 }}
                  />
                }
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!formValues.sochiseikyuu}
                      onChange={e => handleFieldChange('sochiseikyuu', e.target.checked ? '1' : '')}
                      color='primary'
                    />
                  }
                  label='措置請求'
                  style={{ marginTop: 8 }}
                />
                <NumericTextField
                  name='ageOffset' label='年齢調整'
                  value={formValues.ageOffset}
                  onChange={handleFieldChange}
                  onBlur={handleFieldBlur}
                  error={errors.ageOffset}
                  lower={-5} upper={5} numMode
                  style={{ width: '90px' }}
                />
              </div>
              {thisUser?.etc?.dokujiJougen &&
                <div style={{ paddingLeft: 16, fontSize: '.8rem', color: grey[600] }}>
                  独自上限を削除するときは0を入力してから保存してください
                </div>
              }
            </>}

            {/* 利用停止 */}
            {stopUse === true &&
              <div className={'cntRow ' + classes.stopUseInner} style={{ display: 'flex' }}>
                <div className='disc'>
                  {stopUseComment()}
                </div>
              </div>
            }

            {/* エラーメッセージ */}
            {Object.values(errors).some(e => e && e.error) &&
              <div style={{ color: red[700], padding: 8, paddingLeft: 16, fontSize: '.95rem' }}>
                エラーの箇所をご確認下さい。
              </div>
            }
          </div>

          <NextUserDisp thisUser={thisUser} showNextChangeButton={showNextChangeButton} />

          <div className={classes.buttonWrapper}>
            {editOn && enableDelete &&
              <mui.ButtonGP
                addictionclass={classes[deleteConfirm.buttonClass]}
                label={deleteConfirm.label}
                onClick={deleteUser}
                id='useredit-deleteuser'
              />
            }
            <mui.ButtonGP
              color='secondary'
              label='キャンセル'
              onClick={cancelSubmit}
            />
            <mui.ButtonGP
              color='primary'
              label='保存'
              type='submit'
              disabled={scheduleLocked}
              onClick={handleSubmit}
            />
            {showNextChangeButton &&
              <Button
                style={{ backgroundColor: indigo[600], color: '#fff' }}
                variant='contained'
                type='submit'
                disabled={scheduleLocked}
                onClick={(e) => handleSubmit(e, undefined, { updateFuture: 1 })}
              >
                次月以降も変更
              </Button>
            }
            {showNextChangeButton &&
              <div style={{ paddingTop: 4, fontSize: '.7rem', color: red[600] }}>
                次月以降も変更をクリックすると、次月の情報も当月の内容で送信されます。利用者別加算などにご注意下さい。
              </div>
            }
          </div>
        </div>
      </div>

      {/* 拡張設定チェックボックス */}
      <div className={classes.extSettingDispSw}>
        <FormControlLabel
          control={
            <Checkbox
              checked={extSetting}
              onChange={(e) => setExtSetting(e.target.checked)}
              color='primary'
            />
          }
          label='拡張設定' labelPlacement='top'
        />
      </div>

      <Dialog
        open={upperLimitDialog.open}
        onClose={closeUpperLimitDialog}
        maxWidth='sm'
      >
        <DialogTitle>{upperLimitDialog.type ? `${upperLimitDialog.type}登録` : '上限管理登録'}</DialogTitle>
        <DialogContent>
          <div className={classes.upperLimitDialogRows}>
            {(upperLimitDialog.rows || []).map((row, idx) => (
              <div className={classes.upperLimitDialogRow} key={idx}>
                <Autocomplete
                  freeSolo
                  options={officeNameOptions}
                  value={row.name || ''}
                  className={classes.upperLimitField}
                  onChange={(_, v) => updateUpperLimitDialogRow(idx, 'name', v || '')}
                  onInputChange={(_, v) => updateUpperLimitDialogRow(idx, 'name', v || '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={`事業所名${upperLimitDialog.type === UPPER_LIMIT_TYPES.KYOURYOKU ? idx + 1 : ''}`}
                      onBlur={() => runUpperLimitBlurValidation()}
                      error={!!upperLimitDialogErrors[idx]?.name}
                      helperText={upperLimitDialogErrors[idx]?.name || ''}
                    />
                  )}
                />
                <TextField
                  label={`番号${upperLimitDialog.type === UPPER_LIMIT_TYPES.KYOURYOKU ? idx + 1 : ''}`}
                  value={row.no || ''}
                  className={classes.upperLimitNoField}
                  onChange={(e) => updateUpperLimitDialogRow(idx, 'no', e.target.value)}
                  onBlur={() => runUpperLimitBlurValidation()}
                  disabled={row.noDisabled}
                  error={!!upperLimitDialogErrors[idx]?.no}
                  helperText={upperLimitDialogErrors[idx]?.no || ''}
                />
                {upperLimitDialog.type === UPPER_LIMIT_TYPES.KYOURYOKU && (
                  <div className={classes.upperLimitDialogRowActions}>
                    <div className={classes.upperLimitDialogArrowButtons}>
                      <IconButton
                        color='primary'
                        size='small'
                        onClick={() => moveUpperLimitDialogRow(idx, -1)}
                        disabled={idx === 0}
                      >
                        <ArrowUpwardIcon fontSize='small' />
                      </IconButton>
                      <IconButton
                        color='primary'
                        size='small'
                        onClick={() => moveUpperLimitDialogRow(idx, 1)}
                        disabled={idx === upperLimitDialog.rows.length - 1}
                      >
                        <ArrowDownwardIcon fontSize='small' />
                      </IconButton>
                    </div>
                    <IconButton
                      size='small'
                      className={classes.upperLimitTrashButton}
                      onClick={() => removeUpperLimitDialogRow(idx)}
                    >
                      <DeleteIcon fontSize='small' />
                    </IconButton>
                  </div>
                )}
              </div>
            ))}
            {upperLimitDialog.type === UPPER_LIMIT_TYPES.KYOURYOKU && (
              <div>
                <Button color='primary' onClick={addUpperLimitDialogRow}>＋ 事業所を追加</Button>
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={clearUpperLimitRegistration}
            variant={confirmClearUpperLimit ? 'contained' : 'text'}
            style={confirmClearUpperLimit ? { color: '#fff', backgroundColor: red[800] } : { color: red[600] }}
          >
            {confirmClearUpperLimit ? '登録解除実行' : '登録解除'}
          </Button>
          <Button onClick={closeUpperLimitDialog}>キャンセル</Button>
          <Button color='primary' variant='contained' onClick={registerUpperLimitDialog}>
            登録
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={addictionDialogOpen}
        onClose={closeAddictionDialog}
        maxWidth='md'
        fullWidth
        PaperProps={{ style: { width: 640 } }}
      >
        <DialogTitle>
          {addictionDialogService
            ? `利用者別加算・${comMod.shortWord(addictionDialogService)}`
            : '利用者別加算・請求設定'}
        </DialogTitle>
        <DialogContent>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {ADDICTION_ITEMS.map(nameJp => {
              const dialogSvc = addictionDialogService || service;
              const vis = getAddictionVisibility(nameJp, { uid: uids, dLayer: 1, service: addictionDialogService || undefined });
              if (!vis.visible) return null;
              if (vis.disabled) return null;
              // 強度行動障害児支援加算９０日以内: 2024-11-01以降は日付入力
              if (nameJp === '強度行動障害児支援加算９０日以内' && stdDate >= '2024-11-01') {
                return (
                  <AddictionDateField
                    key={nameJp}
                    nameJp={nameJp}
                    label={comMod.shortWord(nameJp) + '終了日'}
                    value={addictionDialogValues[nameJp] ?? vis.defaultValue ?? ''}
                    onChange={handleAddictionChange}
                  />
                );
              }
              const opts = getAddictionOption(nameJp, stdDate, dialogSvc);
              return (
                <FormControl key={nameJp} style={{ width: 180, margin: 4 }}>
                  <InputLabel shrink>{comMod.shortWord(nameJp)}</InputLabel>
                  <Select
                    value={addictionDialogValues[nameJp] ?? vis.defaultValue ?? ''}
                    onChange={e => handleAddictionChange(nameJp, e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value=''>未設定</MenuItem>
                    {opts.map((opt, i) => {
                      const val = typeof opt === 'object' ? opt.value : opt;
                      const lab = typeof opt === 'object' ? opt.label : opt;
                      return <MenuItem key={i} value={val}>{lab}</MenuItem>;
                    })}
                  </Select>
                </FormControl>
              );
            })}
            {addictionRestrictedWarnings.length > 0 && (
              <div style={{ width: '100%', padding: '8px 4px', color: orange[900], fontSize: '.85rem' }}>
                次の加算項目は共通設定で行うことをお勧めします：{addictionRestrictedWarnings.join('、')}
              </div>
            )}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddictionDialog}>キャンセル</Button>
          <Button color='primary' variant='contained' onClick={registerAddictionDialog}>
            登録
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
          <Button onClick={confirmLeave} style={{ color: red[700] }}>
            破棄して移動
          </Button>
        </DialogActions>
      </Dialog>

      <SnackMsg {...snack} />
      <SchLokedDisplay />
      <GetNextHist />
      <UserEditDialogs
        dialog={dialog}
        setDialog={setDialog}
        onDialogOk={handleDialogOk}
      />
    </>
  );
};

export default UserEdit2026;
