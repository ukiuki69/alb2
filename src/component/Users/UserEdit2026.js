import React, { useState, useEffect, useReducer, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router';
import * as comMod from '../../commonModule';
import * as Actions from '../../Actions';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import { blue, grey, indigo, orange, red, teal, yellow } from '@material-ui/core/colors';
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
import { AddBrotherButton } from './AddBrotherButton';
import { GotoUserAddiction } from '../common/GotoButtonsAroundUsers';
import { UnivCheckbox } from '../common/univFormParts';
import { llmApiCall } from '../../modules/llmApiCall';
import { forbiddenPtn } from '../common/StdFormParts';

import { buildInitialFormValues } from './utils/userEditDefaults';
import { submitUserEdit } from './utils/userEditSubmit';
import { UserEditDialogs } from './UserEdit2026Dialogs';
import {
  NameTextField, DateTextField, PhoneTextField, NumericTextField,
  HnoTextField, MailTextField, VolumeTextField, PriceLimitTextField,
  ContractLineNoTextField, ServiceSelect, UserTypeSelect,
  IryouCareSelect, BrosIndexSelect, Over18Select,
  ScitySelect, BelongsAutocomplete, ClassRoomAutocomplete,
  MultiServiceCheckboxes, DokujiJougenTextField,
} from './UserEdit2026Parts';
import { getAddictionVisibility } from '../../modules/addictionUtils';
import { getAddictionOption } from '../common/AddictionFormPartsCommon';
import { validateDate } from './utils/userEditValidation';
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

const createOfficeRow = (src = {}) => ({
  name: src?.name || '',
  no: src?.no || '',
  kanriKekka: src?.kanriKekka || '',
  kettei: src?.kettei || '',
  noDisabled: true,
});

const UPPER_LIMIT_TYPES = {
  KANRI: '管理事業所',
  KYOURYOKU: '協力事業所',
};
const EMPTY_USER = {};

const ADDICTION_ITEMS = [
  '個別サポート加算１', '個別サポート加算２', '個別サポート加算３',
  '医療的ケア児支援加算', '医療連携体制加算',
  '強度行動障害児支援加算', '強度行動障害児支援加算９０日以内',
  '人工内耳装用児支援加算', '食事提供加算', '視覚聴覚言語機能障害児支援加算',
  '送迎加算設定', '通所自立支援加算', '児童発達支援無償化',
  '福祉専門職員配置等加算', '児童指導員等加配加算', '看護職員加配加算',
  '専門的支援加算', '多子軽減措置', '通所支援計画未作成減算',
  '児童発達支援管理責任者欠如減算', '送迎加算Ⅰ一定条件',
  '特別支援加算', 'ケアニーズ対応加算',
  '中核機能強化加算', '中核機能強化事業所加算',
];

const ADDICTION_RESTRICTED_KEYS = [
  '福祉専門職員配置等加算', '看護職員加配加算', '児童指導員等加配加算',
];

// 加算ダイアログ内の日付入力（blur でフォーマット）
const AddictionDateField = ({ nameJp, label, value, onChange, disabled }) => {
  const [localVal, setLocalVal] = useState(value || '');
  const [err, setErr] = useState({ error: false, helperText: '' });
  useEffect(() => { setLocalVal(value || ''); }, [value]);
  const handleBlur = (e) => {
    const result = validateDate(e.target.value, { emptyVal: '' });
    setLocalVal(result.value);
    onChange(nameJp, result.value);
    setErr({ error: result.error, helperText: result.helperText });
  };
  return (
    <TextField
      label={label}
      value={localVal}
      onChange={e => { setLocalVal(e.target.value); }}
      onBlur={handleBlur}
      disabled={disabled}
      error={err.error}
      helperText={err.helperText}
      InputLabelProps={{ shrink: true }}
      style={{ minWidth: 200, margin: 4 }}
    />
  );
};

const getInitialUpperLimitEtc = (user = {}) => ({
  [UPPER_LIMIT_TYPES.KANRI]: Array.isArray(user?.etc?.[UPPER_LIMIT_TYPES.KANRI])
    ? user.etc[UPPER_LIMIT_TYPES.KANRI].map(e => createOfficeRow(e))
    : [],
  [UPPER_LIMIT_TYPES.KYOURYOKU]: Array.isArray(user?.etc?.[UPPER_LIMIT_TYPES.KYOURYOKU])
    ? user.etc[UPPER_LIMIT_TYPES.KYOURYOKU].map(e => createOfficeRow(e))
    : [],
});

const collectOfficeCandidates = (users = []) => {
  const result = [];
  users.forEach(userDt => {
    if (!userDt?.etc) return;
    [UPPER_LIMIT_TYPES.KYOURYOKU, UPPER_LIMIT_TYPES.KANRI].forEach(type => {
      const list = userDt.etc?.[type];
      if (!Array.isArray(list)) return;
      list.forEach(x => {
        const name = (x?.name || '').toString().trim();
        const no = comMod.convHankaku((x?.no || '').toString().trim());
        if (!name) return;
        if (!result.some(y => y.name === name)) {
          result.push({ name, no });
        }
      });
    });
  });
  return result;
};

const resolveUpperLimitRole = (upperLimitEtc = {}) => {
  const kyoryokuLen = Array.isArray(upperLimitEtc?.[UPPER_LIMIT_TYPES.KYOURYOKU])
    ? upperLimitEtc[UPPER_LIMIT_TYPES.KYOURYOKU].length
    : 0;
  const kanriLen = Array.isArray(upperLimitEtc?.[UPPER_LIMIT_TYPES.KANRI])
    ? upperLimitEtc[UPPER_LIMIT_TYPES.KANRI].length
    : 0;
  if (kyoryokuLen > 0) return UPPER_LIMIT_TYPES.KANRI;
  if (kanriLen > 0) return UPPER_LIMIT_TYPES.KYOURYOKU;
  return '';
};

const getUpperLimitButtonLabel = (upperLimitEtc = {}) => {
  const kanriLen = Array.isArray(upperLimitEtc?.[UPPER_LIMIT_TYPES.KANRI])
    ? upperLimitEtc[UPPER_LIMIT_TYPES.KANRI].length
    : 0;
  const kyoryokuLen = Array.isArray(upperLimitEtc?.[UPPER_LIMIT_TYPES.KYOURYOKU])
    ? upperLimitEtc[UPPER_LIMIT_TYPES.KYOURYOKU].length
    : 0;
  if (kanriLen > 0) return UPPER_LIMIT_TYPES.KANRI;
  if (kyoryokuLen > 0) return UPPER_LIMIT_TYPES.KYOURYOKU;
  return '管理・協力事業所';
};

const getUpperLimitTextColor = (role) => {
  if (role === UPPER_LIMIT_TYPES.KANRI) return teal[800];
  if (role === UPPER_LIMIT_TYPES.KYOURYOKU) return blue[800];
  return grey[700];
};

const getUpperLimitDisplayList = (upperLimitEtc = {}) => {
  const kanri = Array.isArray(upperLimitEtc?.[UPPER_LIMIT_TYPES.KANRI]) ? upperLimitEtc[UPPER_LIMIT_TYPES.KANRI] : [];
  const kyoryoku = Array.isArray(upperLimitEtc?.[UPPER_LIMIT_TYPES.KYOURYOKU]) ? upperLimitEtc[UPPER_LIMIT_TYPES.KYOURYOKU] : [];
  return [...kanri, ...kyoryoku]
    .filter(e => e?.name)
    .map(e => `${e.name}（${e.no || ''}）`);
};

const normalizeOfficeNameForDup = (name = '') => (
  (name || '')
    .toString()
    .normalize('NFKC')
    .replace(/[　\s]+/g, ' ')
    .trim()
    .toLowerCase()
);

const createUpperLimitRowError = () => ({ name: '', no: '' });

const normalizeUpperLimitEtcForSnapshot = (upperLimitEtc = {}) => {
  const normalizeRows = (rows) => (
    Array.isArray(rows)
      ? rows.map((row) => ({
        name: row?.name || '',
        no: row?.no || '',
        kanriKekka: row?.kanriKekka || '',
        kettei: row?.kettei || '',
      }))
      : []
  );
  return {
    [UPPER_LIMIT_TYPES.KANRI]: normalizeRows(upperLimitEtc?.[UPPER_LIMIT_TYPES.KANRI]),
    [UPPER_LIMIT_TYPES.KYOURYOKU]: normalizeRows(upperLimitEtc?.[UPPER_LIMIT_TYPES.KYOURYOKU]),
  };
};

const buildUnsavedSnapshot = (formValues, upperLimitEtc, stopUse, addictionValues = {}) => JSON.stringify({
  formValues,
  upperLimitEtc: normalizeUpperLimitEtcForSnapshot(upperLimitEtc),
  stopUse: !!stopUse,
  addictionValues,
});

const validateUpperLimitDialogRows = (rows = []) => {
  const normalizedRows = rows.map((row) => {
    const name = (row?.name || '').toString().trim();
    const no = comMod.convHankaku((row?.no || '').toString().trim());
    const normalizedName = normalizeOfficeNameForDup(name);
    return { name, no, normalizedName };
  });

  const nameCount = {};
  const noCount = {};
  const pairCount = {};
  normalizedRows.forEach(({ name, no, normalizedName }) => {
    if (!name && !no) return;
    if (name) nameCount[normalizedName] = (nameCount[normalizedName] || 0) + 1;
    if (no) noCount[no] = (noCount[no] || 0) + 1;
    if (name && no) {
      const pairKey = `${normalizedName}::${no}`;
      pairCount[pairKey] = (pairCount[pairKey] || 0) + 1;
    }
  });

  return normalizedRows.map(({ name, no, normalizedName }) => {
    const errors = createUpperLimitRowError();
    if (!name && !no) return errors;

    if (!name) errors.name = '事業所名を入力してください。';
    if (!no) errors.no = '事業所番号を入力してください。';

    if (name && forbiddenPtn.test(name)) {
      errors.name = '利用できない文字があります';
    }
    if (no && !/^[0-9]{10}$/.test(no)) {
      errors.no = '10桁の数字が必要です。';
    }

    const pairKey = `${normalizedName}::${no}`;
    if (name && no && pairCount[pairKey] > 1) {
      errors.name = '同じ事業所は登録できません。';
      errors.no = '同じ事業所は登録できません。';
      return errors;
    }
    if (name && nameCount[normalizedName] > 1 && !errors.name) {
      errors.name = '事業所名が重複しています。';
    }
    if (no && noCount[no] > 1 && !errors.no) {
      errors.no = '事業所番号が重複しています。';
    }
    return errors;
  });
};

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

  // ---- Errors state ----
  const [errors, setErrors] = useState({});

  // ---- Other state ----
  const [snack, setSnack] = useState({ msg: '', severity: '' });
  const [dialog, setDialog] = useState({ type: null, data: null });
  const [hnoList, setHnoList] = useState(null);
  const [isProvisionalHno, setIsProvisionalHno] = useState(false);
  const [kanaLoading, setKanaLoading] = useState({});
  const [kanaActionVisible, setKanaActionVisible] = useState({
    klname: false,
    kfname: false,
    pklname: false,
    pkfname: false,
  });
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
    return thisUser?.etc?.addiction ? { ...thisUser.etc.addiction } : {};
  });
  const [addictionDialogValues, setAddictionDialogValues] = useState({});

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
    setAddictionValues(thisUser?.etc?.addiction ? { ...thisUser.etc.addiction } : {});
  }, [thisUser]);
  useEffect(() => {
    const initAddiction = thisUser?.etc?.addiction ? { ...thisUser.etc.addiction } : {};
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
  const KANA_SYSTEM_ROLE = "日本人の読み仮名を教えてください。最近10年ぐらいで生まれた子どもの名前も考慮して下さい。シンプルに読み仮名だけ答えるようにしてください";
  const MAX_KANA_EXCLUSIONS = 10;
  const MAX_KANA_CANDIDATES = 5;
  const KANA_FIELDS = ['klname', 'kfname', 'pklname', 'pkfname'];
  const KANA_SOURCE_MAP = {
    klname: 'lname',
    kfname: 'fname',
    pklname: 'plname',
    pkfname: 'pfname',
  };
  const KANJI_TO_KANA_MAP = {
    lname: 'klname',
    fname: 'kfname',
    plname: 'pklname',
    pfname: 'pkfname',
  };
  const kanaExclusionHistoryRef = useRef({});
  const kanaCandidatesRef = useRef({});
  const kanaCandidateCursorRef = useRef({});
  const kanaActionTimerRef = useRef({});
  const kanaEditedRef = useRef({});
  const kanaInitialFilledRef = useRef({});
  const kanaAutoValueRef = useRef({});
  const kanjiBlurValueRef = useRef({});
  const kanaLoadingRef = useRef(kanaLoading);
  useEffect(() => { kanaLoadingRef.current = kanaLoading; }, [kanaLoading]);

  useEffect(() => {
    KANA_FIELDS.forEach((field) => {
      kanaEditedRef.current[field] = false;
      kanaInitialFilledRef.current[field] = !!(formValues[field] || '').toString().trim();
      kanaAutoValueRef.current[field] = (formValues[field] || '').toString().trim();
    });
    Object.keys(KANJI_TO_KANA_MAP).forEach((kanjiField) => {
      kanjiBlurValueRef.current[kanjiField] = (formValues[kanjiField] || '').toString().trim();
    });
  }, []);

  useEffect(() => {
    const nextHidden = {};
    KANA_FIELDS.forEach((field) => {
      if (kanaActionTimerRef.current[field]) {
        clearTimeout(kanaActionTimerRef.current[field]);
        kanaActionTimerRef.current[field] = null;
      }

      const sourceField = KANA_SOURCE_MAP[field];
      const hasSource = !!(formValues[sourceField] || '').toString().trim();
      const hasKana = !!(formValues[field] || '').toString().trim();
      const editedByUser = !!kanaEditedRef.current[field];
      const initiallyFilled = !!kanaInitialFilledRef.current[field];
      const loading = !!kanaLoading[field];
      const hasCandidates = (kanaCandidatesRef.current[field] || []).length > 0;

      if (!hasSource || initiallyFilled) {
        nextHidden[field] = false;
        return;
      }
      // ユーザー編集済みでも、空欄に戻したら再び1秒後表示を許可する
      if (editedByUser && hasKana) {
        nextHidden[field] = false;
        return;
      }
      if (hasKana && hasCandidates) {
        nextHidden[field] = true;
        return;
      }
      if (hasKana || loading) {
        nextHidden[field] = false;
        return;
      }

      nextHidden[field] = false;
      kanaActionTimerRef.current[field] = setTimeout(() => {
        const latestKana = (formValuesRef.current[field] || '').toString().trim();
        const latestSource = (formValuesRef.current[sourceField] || '').toString().trim();
        const latestLoading = !!kanaLoadingRef.current[field];
        if (!latestKana && latestSource && !kanaEditedRef.current[field] && !kanaInitialFilledRef.current[field] && !latestLoading) {
          setKanaActionVisible(prev => ({ ...prev, [field]: true }));
        }
      }, 1000);
    });

    setKanaActionVisible(prev => {
      const next = { ...prev, ...nextHidden };
      const changed = KANA_FIELDS.some(field => prev[field] !== next[field]);
      return changed ? next : prev;
    });

    return () => {
      KANA_FIELDS.forEach((field) => {
        if (kanaActionTimerRef.current[field]) {
          clearTimeout(kanaActionTimerRef.current[field]);
          kanaActionTimerRef.current[field] = null;
        }
      });
    };
  }, [
    formValues.lname, formValues.fname, formValues.plname, formValues.pfname,
    formValues.klname, formValues.kfname, formValues.pklname, formValues.pkfname,
    kanaLoading.klname, kanaLoading.kfname, kanaLoading.pklname, kanaLoading.pkfname,
  ]);

  const getKanaExclusionList = (kanaField, extraKana = '') => {
    const history = kanaExclusionHistoryRef.current[kanaField] || [];
    const merged = [...history];
    const extra = (extraKana || '').trim();
    if (extra && !merged.includes(extra)) merged.push(extra);
    return merged.slice(-MAX_KANA_EXCLUSIONS);
  };

  const rememberKanaExclusion = (kanaField, kana) => {
    const nextKana = (kana || '').trim();
    if (!nextKana) return;
    const prev = kanaExclusionHistoryRef.current[kanaField] || [];
    const unique = prev.filter(e => e !== nextKana);
    kanaExclusionHistoryRef.current[kanaField] = [...unique, nextKana].slice(-MAX_KANA_EXCLUSIONS);
  };

  const normalizeKana = (value = '') => (
    value
      .toString()
      .trim()
      .normalize('NFKC')
      .replace(/\s+/g, '')
      .replace(/[・･]/g, '')
  );

  const parseKanaCandidates = (rawText = '') => {
    const text = (rawText || '').trim();
    if (!text) return [];

    const normalizeArray = (arr) => [...new Set(
      (arr || [])
        .map(e => (e || '').toString().trim())
        .filter(Boolean)
    )];

    // 1) JSON配列そのもの
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return normalizeArray(parsed);
    } catch (_) {}

    // 2) 文章内に配列が埋め込まれているケース
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        const parsed = JSON.parse(arrayMatch[0]);
        if (Array.isArray(parsed)) return normalizeArray(parsed);
      } catch (_) {}
    }

    // 3) フォールバック: 改行や区切りで分解
    const fallback = text
      .split(/\n|、|,/)
      .map(e => e.replace(/^\s*\d+[\.\):：\s-]*/, '').trim())
      .filter(Boolean);
    return normalizeArray(fallback);
  };

  const setKanaCandidates = (kanaField, candidates, excludedKanaSet = new Set(), decidedKana = '') => {
    const decided = normalizeKana(decidedKana);
    const unique = [];
    const seen = new Set();
    (candidates || []).forEach(c => {
      const candidate = (c || '').trim();
      const n = normalizeKana(candidate);
      if (!n) return;
      if (excludedKanaSet.has(n)) return;
      if (seen.has(n)) return;
      seen.add(n);
      unique.push(candidate);
    });
    const picked = unique.slice(0, MAX_KANA_CANDIDATES);
    kanaCandidatesRef.current[kanaField] = picked;
    const decidedIndex = picked.findIndex(e => normalizeKana(e) === decided);
    // 初回採用候補の次から巡回開始（0採用なら次は1、最後の次は0）
    kanaCandidateCursorRef.current[kanaField] = (
      decidedIndex >= 0 && picked.length > 0
        ? (decidedIndex + 1) % picked.length
        : 0
    );
  };

  const popKanaFromCandidates = (kanaField, excludeKanaList = []) => {
    const current = kanaCandidatesRef.current[kanaField] || [];
    if (!current.length) return '';
    const len = current.length;
    let cursor = Number(kanaCandidateCursorRef.current[kanaField] || 0);
    if (cursor < 0 || cursor >= len) cursor = 0;
    const excludedSet = new Set(
      (excludeKanaList || [])
        .map(e => normalizeKana(e))
        .filter(Boolean)
    );
    // まずは除外リストを考慮して1周探索
    for (let i = 0; i < len; i++) {
      const idx = (cursor + i) % len;
      const n = normalizeKana(current[idx]);
      if (!n || excludedSet.has(n)) continue;
      kanaCandidateCursorRef.current[kanaField] = (idx + 1) % len;
      return current[idx];
    }
    // 全候補が除外済みなら循環を優先して、次候補を返す
    const fallback = current[cursor] || '';
    kanaCandidateCursorRef.current[kanaField] = (cursor + 1) % len;
    return fallback;
  };

  const resetKanaQueryState = (kanaField) => {
    kanaCandidatesRef.current[kanaField] = [];
    kanaCandidateCursorRef.current[kanaField] = 0;
    kanaExclusionHistoryRef.current[kanaField] = [];
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

  // ---- 読み仮名自動取得 ----
  useEffect(() => {
    const getMissingKana = async () => {
      const missingKanaMap = {};
      if (formValues.lname && !formValues.klname) missingKanaMap.klname = formValues.lname;
      if (formValues.fname && !formValues.kfname) missingKanaMap.kfname = formValues.fname;
      if (formValues.plname && !formValues.pklname) missingKanaMap.pklname = formValues.plname;
      if (formValues.pfname && !formValues.pkfname) missingKanaMap.pkfname = formValues.pfname;
      if (!Object.keys(missingKanaMap).length) return;

      for (const [kanaKey, kanjiValue] of Object.entries(missingKanaMap)) {
        setKanaLoading(prev => ({ ...prev, [kanaKey]: true }));
        try {
          const response = await llmApiCall(
            {
              prompt: kanjiValue,
              systemrole: "日本人の読み仮名を教えてください。最近10年ぐらいで生まれた子どもの名前も考慮して下さい。シンプルに読み仮名だけ答えるようにしてください",
            },
            'E232298', '', '',
            '', '', false
          );
          if (response && response.data && response.data.response) {
            const kana = response.data.response.trim();
            kanaAutoValueRef.current[kanaKey] = kana;
            kanaEditedRef.current[kanaKey] = false;
            formDispatch({ type: 'SET_FIELD', name: kanaKey, value: kana });
          }
        } catch (error) {
          console.error(`${kanjiValue}の読み仮名取得に失敗しました`, error);
        } finally {
          setKanaLoading(prev => ({ ...prev, [kanaKey]: false }));
        }
      }
    };

    // 漢字があるのに読み仮名がない場合のみ実行
    if ((formValues.lname && !formValues.klname) ||
      (formValues.fname && !formValues.kfname) ||
      (formValues.plname && !formValues.pklname) ||
      (formValues.pfname && !formValues.pkfname)) {
      getMissingKana();
    }
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

  // 読み仮名をLLMで取得し、関連フィールドも連動
  const fetchKanaForField = async (kanjiValue, kanaField, options = {}) => {
    const { isRetry = false, excludeKanaList = [] } = options;
    const parentKanaMap = { klname: 'pklname' };
    const normalizedExcludeKanaList = [...new Set(
      (excludeKanaList || [])
        .map(e => (e || '').trim())
        .filter(Boolean)
    )].slice(-MAX_KANA_EXCLUSIONS);
    const excludedKanaSet = new Set(
      normalizedExcludeKanaList.map(e => normalizeKana(e)).filter(Boolean)
    );
    setKanaLoading(prev => ({ ...prev, [kanaField]: true }));
    try {
      const prompt = [
          '次の漢字氏名の読み仮名候補を5個考えてください。',
        '必ずJSON配列のみで返答してください。例: ["たろう","じろう"]',
        '候補は読み仮名だけにしてください。',
        normalizedExcludeKanaList.length > 0
          ? `以下の読みは候補から除外してください: ${normalizedExcludeKanaList.join('、')}`
          : '',
        `漢字名: ${kanjiValue}`,
      ].filter(Boolean).join('\n');
      const response = await llmApiCall(
        { prompt, systemrole: KANA_SYSTEM_ROLE },
        'E232298', '', '',
        '', '', false
      );
      const rawResponse = response?.data?.response?.trim();
      if (!rawResponse) return;

      const candidates = parseKanaCandidates(rawResponse);
      const decidedKana = candidates.find(e => !excludedKanaSet.has(normalizeKana(e))) || '';
      setKanaCandidates(kanaField, candidates, excludedKanaSet, decidedKana);

      if (decidedKana) {
        rememberKanaExclusion(kanaField, decidedKana);
        kanaAutoValueRef.current[kanaField] = decidedKana;
        kanaEditedRef.current[kanaField] = false;
        formDispatch({ type: 'SET_FIELD', name: kanaField, value: decidedKana });
        // 保護者の読み仮名が空なら連動
        const parentKanaField = parentKanaMap[kanaField];
        if (parentKanaField && !formValuesRef.current[parentKanaField]) {
          kanaAutoValueRef.current[parentKanaField] = decidedKana;
          kanaEditedRef.current[parentKanaField] = false;
          formDispatch({ type: 'SET_FIELD', name: parentKanaField, value: decidedKana });
        }
      } else if (isRetry) {
        console.warn(`${kanjiValue}の読み仮名再取得で、除外候補以外の候補を取得できませんでした`);
      }
    } catch (error) {
      console.error(`${kanjiValue}の読み仮名取得に失敗しました`, error);
    } finally {
      setKanaLoading(prev => ({ ...prev, [kanaField]: false }));
    }
  };

  const refetchKanaForField = (kanaField) => {
    const sourceMap = {
      klname: 'lname',
      kfname: 'fname',
      pklname: 'plname',
      pkfname: 'pfname',
    };
    const kanjiField = sourceMap[kanaField];
    if (!kanjiField) return;
    const kanjiValue = formValuesRef.current[kanjiField];
    if (!kanjiValue) return;
    const currentKana = formValuesRef.current[kanaField];
    const excludeKanaList = getKanaExclusionList(kanaField, currentKana);
    const cachedKana = popKanaFromCandidates(kanaField, excludeKanaList);
    if (cachedKana) {
      const parentKanaMap = { klname: 'pklname' };
      rememberKanaExclusion(kanaField, cachedKana);
      kanaAutoValueRef.current[kanaField] = cachedKana;
      kanaEditedRef.current[kanaField] = false;
      formDispatch({ type: 'SET_FIELD', name: kanaField, value: cachedKana });
      const parentKanaField = parentKanaMap[kanaField];
      if (parentKanaField && !formValuesRef.current[parentKanaField]) {
        kanaAutoValueRef.current[parentKanaField] = cachedKana;
        kanaEditedRef.current[parentKanaField] = false;
        formDispatch({ type: 'SET_FIELD', name: parentKanaField, value: cachedKana });
      }
      return;
    }
    fetchKanaForField(kanjiValue, kanaField, { isRetry: true, excludeKanaList });
  };

  const handleFieldBlur = (name, result) => {
    if (result.value !== undefined) {
      formDispatch({ type: 'SET_FIELD', name, value: result.value });
    }
    let didKanjiChangeFetch = false;
    const kanaFieldFromKanji = KANJI_TO_KANA_MAP[name];
    if (kanaFieldFromKanji) {
      const nextKanji = (result.value || '').toString().trim();
      const prevKanji = (kanjiBlurValueRef.current[name] || '').toString().trim();
      const kanjiChanged = nextKanji !== prevKanji;
      kanjiBlurValueRef.current[name] = nextKanji;
      if (kanjiChanged) {
        // 漢字が変わった場合は、以前の候補を破棄して新しい漢字で再問い合わせする
        resetKanaQueryState(kanaFieldFromKanji);
        kanaInitialFilledRef.current[kanaFieldFromKanji] = false;
        kanaEditedRef.current[kanaFieldFromKanji] = false;
        kanaAutoValueRef.current[kanaFieldFromKanji] = '';
        formDispatch({ type: 'SET_FIELD', name: kanaFieldFromKanji, value: '' });
        setKanaActionVisible(prev => ({ ...prev, [kanaFieldFromKanji]: true }));
        if (nextKanji) {
          fetchKanaForField(nextKanji, kanaFieldFromKanji, { isRetry: true, excludeKanaList: [] });
          didKanjiChangeFetch = true;
        }
      }
    }
    if (KANA_SOURCE_MAP[name]) {
      const nextVal = (result.value || '').toString().trim();
      const autoVal = (kanaAutoValueRef.current[name] || '').toString().trim();
      // 空欄へ戻した場合は「再取得したい」ケースなので編集フラグを解除
      if (!nextVal) {
        kanaEditedRef.current[name] = false;
        resetKanaQueryState(name);
      } else if (nextVal !== autoVal) {
        kanaEditedRef.current[name] = true;
        setKanaActionVisible(prev => ({ ...prev, [name]: false }));
      }
    }
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

  const openAddictionDialog = () => {
    setAddictionDialogValues({ ...addictionValues });
    setAddictionDialogOpen(true);
  };

  const closeAddictionDialog = () => {
    setAddictionDialogOpen(false);
  };

  const registerAddictionDialog = () => {
    setAddictionValues({ ...addictionDialogValues });
    setAddictionDialogOpen(false);
  };

  const addictionRestrictedWarnings = ADDICTION_RESTRICTED_KEYS.filter(
    key => addictionDialogValues[key] && addictionDialogValues[key] !== ''
  );

  const addictionDisplayList = Object.entries(addictionValues)
    .filter(([_, v]) => v !== '' && v !== null && v !== undefined)
    .map(([key, val]) => ({ key, val }));

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
            <div className={classes.cntRow}>
              <Button
                onClick={openAddictionDialog}
                startIcon={<EditIcon />}
                variant='outlined'
                style={{ color: orange[800], minWidth: 220 ,  justifyContent: 'flex-start' }}
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
            <AddBrotherButton
              thisUser={thisUser}
              handleSubmit={handleSubmit}
              hnoList={hnoList}
              brosIndex={brosIndex}
              setBrosIndex={(v) => { setBrosIndex(v); handleFieldChange('brosIndex', v); }}
              history={history}
              setSnack={setSnack}
              editOn={editOn}
            />
            <GotoUserAddiction uid={uids} onBeforeNavigate={handleSubmit} />
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
      >
        <DialogTitle>利用者別加算・請求設定</DialogTitle>
        <DialogContent>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {ADDICTION_ITEMS.map(nameJp => {
              const vis = getAddictionVisibility(nameJp, { uid: uids, dLayer: 1 });
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
              const opts = getAddictionOption(nameJp, stdDate, service);
              return (
                <FormControl key={nameJp} style={{ minWidth: 200, margin: 4 }}>
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
