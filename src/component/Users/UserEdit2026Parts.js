import React, { useState, useEffect } from 'react';
import TextField from '@material-ui/core/TextField';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import Tooltip from '@material-ui/core/Tooltip';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import ArrowLeftIcon from '@material-ui/icons/ArrowLeft';
import AddIcon from '@material-ui/icons/Add';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { makeStyles } from '@material-ui/core/styles';
import { red, teal } from '@material-ui/core/colors';
import { useSelector } from 'react-redux';
import {
  validateName, validateDate, validatePhone, validateMail,
  validateHno, validateVolume, validatePriceLimit, validateLineNo,
  validateNumeric, validateScityNo,
} from './utils/userEditValidation';
import { convHankaku } from '../../modules/stringUtils';
import { HOUDAY, JIHATSU, HOHOU, KEIKAKU_SOUDAN, SYOUGAI_SOUDAN } from '../../modules/contants';
import * as comMod from '../../commonModule';

const useStyles = makeStyles({
  nameInput: {
    display: 'flex', alignItems: 'flex-start',
    '& .nameCnt': {
      display: 'flex', alignItems: 'center', fontSize: '.7rem',
      color: '#666', whiteSpace: 'nowrap', paddingTop: 16,
    },
  },
  tfMiddle: { width: '12ch' },
  tfMiddleL: { width: '16ch' },
  tfMiddleXL: { width: '20ch' },
  tfMiddleXXL: { width: '28ch' },
  selectMiddle: { minWidth: 120, marginTop: 8 },
  selectMiddleL: { minWidth: 160, marginTop: 8 },
  partWrap: { marginRight: 8, marginBottom: 4 },
});

// ---- 名前入力 ----
export const NameTextField = ({
  nameLname, nameFname, labelLname, labelFname,
  lname, fname, onChange, onBlur,
  required, isKana,
  errLname, errFname,
  onActionLname, onActionFname,
  disableActionLname, disableActionFname,
  actionTitleLname = '再取得',
  actionTitleFname = '再取得',
}) => {
  const classes = useStyles();
  const [nameMod, setNameMod] = useState(false);
  const [localLname, setLocalLname] = useState(lname);
  const [localFname, setLocalFname] = useState(fname);

  useEffect(() => {
    setLocalLname(lname);
  }, [lname]);
  useEffect(() => {
    setLocalFname(fname);
  }, [fname]);

  // 名字と名前を分割する（初回）
  useEffect(() => {
    if (localLname && !localFname) {
      const l = Math.floor(localLname.length / 2);
      const newLname = localLname.slice(0, l);
      const newFname = localLname.slice(l);
      setLocalLname(newLname);
      setLocalFname(newFname);
      onChange(nameLname, newLname);
      onChange(nameFname, newFname);
      setNameMod(true);
    }
  }, []);

  const handleChange = (name, value) => {
    if (name === nameLname) setLocalLname(value);
    if (name === nameFname) setLocalFname(value);
    onChange(name, value);
  };

  const handleBlur = (name, value) => {
    const result = validateName(value, { required, isKana });
    if (name === nameLname) setLocalLname(result.value);
    if (name === nameFname) setLocalFname(result.value);
    onBlur(name, result);
  };

  const handleNameJustify = (d) => {
    let l = localLname;
    let f = localFname;
    if (d > 0 && l.length > 1) {
      f = l.slice(-1) + f;
      l = l.slice(0, -1);
    } else if (d < 0 && f.length > 1) {
      l = l + f.slice(0, 1);
      f = f.slice(1);
    }
    setLocalLname(l);
    setLocalFname(f);
    onChange(nameLname, l);
    onChange(nameFname, f);
  };

  return (
    <div className={classes.nameInput}>
      <div className={classes.partWrap}>
        <TextField
          name={nameLname} label={labelLname}
          value={localLname || ''}
          required={required}
          onChange={e => handleChange(nameLname, e.target.value)}
          onBlur={e => handleBlur(nameLname, e.target.value)}
          error={errLname?.error || false}
          helperText={errLname?.helperText || ''}
          className={classes.tfMiddle}
          InputProps={onActionLname ? {
            endAdornment: (
              <InputAdornment position='end'>
                <Tooltip title={actionTitleLname}>
                  <span>
                    <IconButton
                      size='small'
                      onClick={onActionLname}
                      disabled={disableActionLname}
                    >
                      <AutorenewIcon fontSize='small' />
                    </IconButton>
                  </span>
                </Tooltip>
              </InputAdornment>
            ),
          } : undefined}
        />
      </div>
      <div className={classes.partWrap}>
        <TextField
          name={nameFname} label={labelFname}
          value={localFname || ''}
          required={required}
          onChange={e => handleChange(nameFname, e.target.value)}
          onBlur={e => handleBlur(nameFname, e.target.value)}
          error={errFname?.error || false}
          helperText={errFname?.helperText || ''}
          className={classes.tfMiddle}
          InputProps={onActionFname ? {
            endAdornment: (
              <InputAdornment position='end'>
                <Tooltip title={actionTitleFname}>
                  <span>
                    <IconButton
                      size='small'
                      onClick={onActionFname}
                      disabled={disableActionFname}
                    >
                      <AutorenewIcon fontSize='small' />
                    </IconButton>
                  </span>
                </Tooltip>
              </InputAdornment>
            ),
          } : undefined}
        />
      </div>
      {nameMod &&
        <div className='nameCnt'>
          <IconButton size='small' onClick={() => handleNameJustify(1)}>
            <ArrowRightIcon />
          </IconButton>
          <span>姓名自動分割済</span>
          <IconButton size='small' onClick={() => handleNameJustify(-1)}>
            <ArrowLeftIcon />
          </IconButton>
        </div>
      }
    </div>
  );
};

// ---- 日付入力 ----
export const DateTextField = ({
  name, label, value, onChange, onBlur, error,
  required, limit, helperTextShort, style,
}) => {
  const classes = useStyles();
  const [localVal, setLocalVal] = useState(value || '');

  useEffect(() => {
    setLocalVal(value || '');
  }, [value]);

  const handleBlur = (e) => {
    const result = validateDate(e.target.value, { required, limit, helperTextShort });
    setLocalVal(result.value);
    onChange(name, result.value);
    onBlur(name, result);
  };

  return (
    <div className={classes.partWrap} style={style}>
      <TextField
        name={name} label={label}
        value={localVal}
        required={required}
        onChange={e => { setLocalVal(e.target.value); onChange(name, e.target.value); }}
        onBlur={handleBlur}
        error={error?.error || false}
        helperText={error?.helperText || ''}
        style={{ width: style?.width || '16ch' }}
      />
    </div>
  );
};

// ---- 電話番号入力 ----
export const PhoneTextField = ({
  name, label, value, onChange, onBlur, error, required,
}) => {
  const classes = useStyles();
  const [localVal, setLocalVal] = useState(value || '');

  useEffect(() => {
    setLocalVal(value || '');
  }, [value]);

  const handleBlur = (e) => {
    const result = validatePhone(e.target.value, { required });
    setLocalVal(result.value);
    onChange(name, result.value);
    onBlur(name, result);
  };

  return (
    <div className={classes.partWrap}>
      <TextField
        name={name} label={label}
        value={localVal}
        required={required}
        onChange={e => { setLocalVal(e.target.value); onChange(name, e.target.value); }}
        onBlur={handleBlur}
        error={error?.error || false}
        helperText={error?.helperText || ''}
        className={classes.tfMiddle}
      />
    </div>
  );
};

// ---- 数値入力（汎用） ----
export const NumericTextField = ({
  name, label, value, onChange, onBlur, error,
  required, lower, upper, style, numMode,
}) => {
  const classes = useStyles();
  const [localVal, setLocalVal] = useState(value ?? '');

  useEffect(() => {
    setLocalVal(value ?? '');
  }, [value]);

  const handleBlur = (e) => {
    const result = validateNumeric(e.target.value, { required, lower, upper, numMode });
    setLocalVal(result.value);
    onChange(name, result.value);
    onBlur(name, result);
  };

  return (
    <div className={classes.partWrap} style={style}>
      <TextField
        name={name} label={label}
        value={localVal}
        required={required}
        onChange={e => { setLocalVal(e.target.value); onChange(name, e.target.value); }}
        onBlur={handleBlur}
        error={error?.error || false}
        helperText={error?.helperText || ''}
        style={{ width: style?.width || '12ch' }}
      />
    </div>
  );
};

// ---- 受給者証番号 ----
export const HnoTextField = ({
  value, onChange, onBlur, error, uid, isProvisional, onProvisional, onResetProvisional,
}) => {
  const classes = useStyles();
  const users = useSelector(state => state.users);
  const [localVal, setLocalVal] = useState(value || '');
  // 3桁ロックはblurで確定させる（入力中は判定しない）
  const [lockedAsProvisional, setLockedAsProvisional] = useState(
    () => !!(value && value.length === 3)
  );

  useEffect(() => {
    const v = value || '';
    setLocalVal(v);
    setLockedAsProvisional(v.length === 3);
  }, [value]);

  const isDisabled = isProvisional || lockedAsProvisional;

  const handleBlur = (e) => {
    if (isDisabled) return;
    const result = validateHno(e.target.value, { users, uid });
    setLocalVal(result.value);
    onChange('hno', result.value);
    onBlur('hno', result);
    // blurで3桁確定したらロック
    if (result.value.length === 3) {
      setLockedAsProvisional(true);
    }
  };

  // 「本設定」: 仮設定をクリアして入力可能に戻す
  const handleResetProvisional = () => {
    setLocalVal('');
    setLockedAsProvisional(false);
    onChange('hno', '');
    onBlur('hno', { error: true, helperText: '仮登録は未入力', value: '' });
    if (onResetProvisional) onResetProvisional();
  };

  return (
    <div className={classes.partWrap} style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
      <TextField
        name='hno' label='受給者証番号'
        value={localVal}
        required
        disabled={isDisabled}
        onChange={e => { if (!isDisabled) { setLocalVal(e.target.value); onChange('hno', e.target.value); } }}
        onBlur={handleBlur}
        error={isDisabled ? false : (error?.error || false)}
        helperText={isDisabled ? '仮設定中' : (error?.helperText || '仮登録は未入力')}
        className={classes.tfMiddle}
        style={{ marginTop: 8 }}
      />
      {/* 仮設定中（3桁）→「本設定」ボタン、空白→「仮設定」ボタン */}
      {isDisabled && (
        <Button
          size='small'
          variant='outlined'
          onClick={handleResetProvisional}
          style={{ marginBottom: 24, whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          本設定
        </Button>
      )}
      {onProvisional && !localVal && (
        <Button
          size='small'
          variant='outlined'
          onClick={onProvisional}
          style={{ marginBottom: 24, whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          仮設定
        </Button>
      )}
    </div>
  );
};

// ---- メールアドレス ----
export const MailTextField = ({
  name, label, value, onChange, onBlur, error, required,
}) => {
  const classes = useStyles();
  const [localVal, setLocalVal] = useState(value || '');

  useEffect(() => {
    setLocalVal(value || '');
  }, [value]);

  const handleBlur = (e) => {
    const result = validateMail(e.target.value, { required });
    setLocalVal(result.value);
    onChange(name, result.value);
    onBlur(name, result);
  };

  return (
    <div className={classes.partWrap}>
      <TextField
        name={name} label={label}
        value={localVal}
        required={required}
        onChange={e => { setLocalVal(e.target.value); onChange(name, e.target.value); }}
        onBlur={handleBlur}
        error={error?.error || false}
        helperText={error?.helperText || ''}
        className={classes.tfMiddleXXL}
      />
    </div>
  );
};

// ---- 契約支給量 ----
export const VolumeTextField = ({
  name = 'volume', value, onChange, onBlur, error, style,
}) => {
  const classes = useStyles();
  const [localVal, setLocalVal] = useState(value ?? '');

  useEffect(() => {
    setLocalVal(value ?? '');
  }, [value]);

  const handleBlur = (e) => {
    const result = validateVolume(e.target.value);
    setLocalVal(result.value);
    onChange(name, result.value);
    onBlur(name, result);
  };

  return (
    <div className={classes.partWrap} style={style}>
      <TextField
        name={name} label='契約支給量'
        value={localVal}
        required
        onChange={e => { setLocalVal(e.target.value); onChange(name, e.target.value); }}
        onBlur={handleBlur}
        error={error?.error || false}
        helperText={error?.helperText || '0入力で原則の日数'}
        style={{ width: style?.width || '12ch' }}
      />
    </div>
  );
};

// ---- 上限額 ----
export const PriceLimitTextField = ({
  value, onChange, onBlur, error,
}) => {
  const classes = useStyles();
  const [localVal, setLocalVal] = useState(value ?? '');

  useEffect(() => {
    setLocalVal(value ?? '');
  }, [value]);

  const handleBlur = (e) => {
    const result = validatePriceLimit(e.target.value);
    setLocalVal(result.value);
    onChange('priceLimit', result.value);
    onBlur('priceLimit', result);
  };

  return (
    <div className={classes.partWrap}>
      <TextField
        name='priceLimit' label='上限額'
        value={localVal}
        required
        onChange={e => { setLocalVal(e.target.value); onChange('priceLimit', e.target.value); }}
        onBlur={handleBlur}
        error={error?.error || false}
        helperText={error?.helperText || ''}
        className={classes.tfMiddle}
      />
    </div>
  );
};

// ---- 記入欄番号 ----
export const ContractLineNoTextField = ({
  name = 'lineNo', value, onChange, onBlur, error, required = true, style,
}) => {
  const classes = useStyles();
  const [localVal, setLocalVal] = useState(value ?? '');

  useEffect(() => {
    setLocalVal(value ?? '');
  }, [value]);

  const handleBlur = (e) => {
    const result = validateLineNo(e.target.value, { required });
    setLocalVal(result.value);
    onChange(name, result.value);
    onBlur(name, result);
  };

  return (
    <div className={classes.partWrap} style={style}>
      <TextField
        name={name} label='記入欄番号'
        value={localVal}
        required={required}
        onChange={e => { setLocalVal(e.target.value); onChange(name, e.target.value); }}
        onBlur={handleBlur}
        error={error?.error || false}
        helperText={error?.helperText || ''}
        style={{ width: style?.width || '12ch' }}
      />
    </div>
  );
};

// ---- Select系コンポーネント共通ラッパー ----
const SelectField = ({
  name, label, value, onChange, opts, required, allowNull, nullLabel,
  style, formControlStyle,
}) => {
  const classes = useStyles();
  const emptyLabel = nullLabel || '未選択';
  return (
    <div className={classes.partWrap} style={style}>
      <FormControl className={classes.selectMiddle} style={formControlStyle}>
        <InputLabel shrink>{label}</InputLabel>
        <Select
          name={name}
          value={value || ''}
          onChange={e => onChange(name, e.target.value)}
          required={required}
          displayEmpty={!!allowNull}
          renderValue={(selected) => {
            if (selected === '' || selected === undefined || selected === null) {
              return allowNull ? emptyLabel : '';
            }
            return selected;
          }}
        >
          {(allowNull || nullLabel) &&
            <MenuItem value=''>{emptyLabel}</MenuItem>
          }
          {opts.map((opt, i) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const lab = typeof opt === 'object' ? opt.label : opt;
            return <MenuItem key={i} value={val}>{lab}</MenuItem>;
          })}
        </Select>
      </FormControl>
    </div>
  );
};

// ---- サービス種別 ----
export const ServiceSelect = ({ value, onChange }) => {
  const users = useSelector(s => s.users);
  const existHohou = users.some(e => (e.service || '').includes(HOHOU));
  const useHohou = Number(comMod.getUisCookie(comMod.uisCookiePos.useHohouService));
  const existSvc = Array.from(new Set(users.map(e => e.service)));

  let opts = [HOUDAY, JIHATSU];
  if (useHohou || existHohou) {
    opts.push(HOHOU, '複数サービス');
  }
  if (!users.length) {
    opts.push(KEIKAKU_SOUDAN, SYOUGAI_SOUDAN);
  }
  // 既存のサービスが相談支援の場合
  if (existSvc.includes(KEIKAKU_SOUDAN)) {
    opts = [KEIKAKU_SOUDAN];
  }
  if (existSvc.includes(SYOUGAI_SOUDAN)) {
    opts = [SYOUGAI_SOUDAN];
  }

  return (
    <SelectField
      name='service' label='サービス種別'
      value={value} onChange={onChange}
      opts={opts} required
    />
  );
};

// ---- 障害児種別 ----
export const UserTypeSelect = ({ value, onChange, service }) => {
  const opts = service === HOUDAY
    ? ['障害児', '重症心身障害児']
    : ['障害児', '重症心身障害児', '難聴児'];

  return (
    <SelectField
      name='type' label='障害児種別'
      value={value} onChange={onChange}
      opts={opts} required
    />
  );
};

// ---- 医療的ケア児設定 ----
export const IryouCareSelect = ({ value, onChange }) => {
  const opts = ['医療的ケア3点以上', '医療的ケア16点以上', '医療的ケア32点以上'];
  return (
    <SelectField
      name='icareType' label='医療的ケア児設定'
      value={value} onChange={onChange}
      opts={opts} required allowNull
      formControlStyle={{ minWidth: 190 }}
    />
  );
};

// ---- 管理区分 ----
export const KanriTypeSelect = ({ value, onChange }) => {
  const opts = ['管理事業所', '協力事業所'];
  return (
    <SelectField
      name='kanri_type' label='管理・協力'
      value={value} onChange={onChange}
      opts={opts} allowNull
    />
  );
};

// ---- 兄弟設定 ----
export const BrosIndexSelect = ({ value, onChange, style }) => {
  const opts = [
    { label: 'なし', value: '0' },
    { label: '1番目', value: '1' },
    { label: '2番目', value: '2' },
    { label: '3番目', value: '3' },
    { label: '4番目', value: '4' },
    { label: '5番目', value: '5' },
  ];
  return (
    <SelectField
      name='brosIndex' label='兄弟設定'
      value={value} onChange={onChange}
      opts={opts} required
      style={style}
    />
  );
};

// ---- 受給者証名義(18歳以上) ----
export const Over18Select = ({ value, onChange }) => {
  const opts = ['保護者', '本人'];
  return (
    <SelectField
      name='over18' label='受給者証名義'
      value={value} onChange={onChange}
      opts={opts} allowNull nullLabel='自動'
    />
  );
};

// ---- 支給市区町村 ----
export const ScitySelect = ({
  scity, scityNo, onChange, onBlur, errorScity, errorScityNo,
}) => {
  const classes = useStyles();
  const users = useSelector(state => state.users);

  // 既存の市区町村リストを構築
  const scityMap = new Map();
  users.forEach(e => {
    if (e.scity && !scityMap.has(e.scity)) {
      scityMap.set(e.scity, e.scity_no || '');
    }
  });
  const scityList = Array.from(scityMap, ([name, no]) => ({ scity: name, scity_no: no }));
  const [extraScityList, setExtraScityList] = useState([]);
  const mergedScityMap = new Map();
  scityList.forEach(e => mergedScityMap.set(e.scity, e.scity_no));
  extraScityList.forEach(e => {
    if (!mergedScityMap.has(e.scity)) {
      mergedScityMap.set(e.scity, e.scity_no);
    }
  });
  const mergedScityList = Array.from(mergedScityMap, ([name, no]) => ({ scity: name, scity_no: no }));
  const existNames = mergedScityList.map(e => e.scity);
  const existNumbers = Array.from(new Set(mergedScityList.map(e => convHankaku(e.scity_no || '')).filter(Boolean)));

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newScity, setNewScity] = useState('');
  const [newScityNo, setNewScityNo] = useState('');
  const [addErrors, setAddErrors] = useState({
    scity: { error: false, helperText: '' },
    scity_no: { error: false, helperText: '' },
  });

  const handleSelectChange = (e) => {
    const val = e.target.value;
    const found = mergedScityList.find(s => s.scity === val);
    onChange('scity', val);
    if (found) {
      onChange('scity_no', found.scity_no);
      onBlur('scity', { value: found.scity, error: false, helperText: '' });
      onBlur('scity_no', { value: found.scity_no, error: false, helperText: '' });
    } else {
      onChange('scity_no', '');
      onBlur('scity', { value: val, error: false, helperText: '' });
      onBlur('scity_no', { value: '', error: false, helperText: '' });
    }
  };

  const validateNewScityName = (value) => {
    const val = (value || '').trim();
    if (!val) {
      return { value: '', error: true, helperText: '入力必須項目です。' };
    }
    if (existNames.includes(val)) {
      return { value: val, error: true, helperText: '既存の市区町村名と重複しています' };
    }
    return { value: val, error: false, helperText: '' };
  };

  const handleDialogScityBlur = (e) => {
    const result = validateNewScityName(e.target.value);
    setNewScity(result.value);
    setAddErrors(prev => ({ ...prev, scity: { error: result.error, helperText: result.helperText } }));
  };

  const handleDialogNoBlur = (e) => {
    const result = validateScityNo(e.target.value, { existNumbers });
    setNewScityNo(result.value);
    setAddErrors(prev => ({ ...prev, scity_no: { error: result.error, helperText: result.helperText } }));
  };

  const openAddDialog = () => {
    setNewScity('');
    setNewScityNo('');
    setAddErrors({
      scity: { error: false, helperText: '' },
      scity_no: { error: false, helperText: '' },
    });
    setAddDialogOpen(true);
  };

  const closeAddDialog = () => {
    setAddDialogOpen(false);
  };

  const applyNewScity = () => {
    const nameResult = validateNewScityName(newScity);
    const noResult = validateScityNo(newScityNo, { existNumbers });

    setNewScity(nameResult.value);
    setNewScityNo(noResult.value);
    setAddErrors({
      scity: { error: nameResult.error, helperText: nameResult.helperText },
      scity_no: { error: noResult.error, helperText: noResult.helperText },
    });

    if (nameResult.error || noResult.error) return;

    onChange('scity', nameResult.value);
    onChange('scity_no', noResult.value);
    onBlur('scity', { value: nameResult.value, error: false, helperText: '' });
    onBlur('scity_no', { value: noResult.value, error: false, helperText: '' });
    setExtraScityList(prev => [...prev, { scity: nameResult.value, scity_no: noResult.value }]);
    setAddDialogOpen(false);
  };

  return (
    <>
      <div className={classes.partWrap} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <FormControl style={{ minWidth: '20ch' }}
          error={errorScity?.error || errorScityNo?.error || false}>
          <InputLabel>支給市区町村</InputLabel>
          <Select
            name='scity'
            value={existNames.includes(scity) ? scity : ''}
            onChange={handleSelectChange}
          >
            <MenuItem value=''><em>未選択</em></MenuItem>
            {mergedScityList.map(item => (
              <MenuItem key={item.scity} value={item.scity}>
                {item.scity}（{item.scity_no}）
              </MenuItem>
            ))}
          </Select>
          {errorScity?.helperText &&
            <FormHelperText>{errorScity.helperText}</FormHelperText>
          }
          {errorScityNo?.helperText &&
            <FormHelperText>{errorScityNo.helperText}</FormHelperText>
          }
        </FormControl>
        <Button
          variant='outlined'
          size='small'
          onClick={openAddDialog}
          startIcon={<AddIcon fontSize='small' />}
          style={{ marginTop: 12, color: teal[700], borderColor: teal[500] }}
        >
          市区町村を追加
        </Button>
      </div>
      <Dialog
        open={addDialogOpen}
        onClose={closeAddDialog}
        maxWidth='xs'
        PaperProps={{ style: { width: '280px' } }}
      >
        <DialogTitle>支給市区町村を追加</DialogTitle>
        <DialogContent>
          <TextField
            name='scity' label='市区町村名'
            value={newScity}
            onChange={e => setNewScity(e.target.value)}
            onBlur={handleDialogScityBlur}
            error={addErrors.scity.error}
            helperText={addErrors.scity.helperText}
            required
            fullWidth
            margin='dense'
          />
          <TextField
            name='scity_no' label='番号（6桁）'
            value={newScityNo}
            onChange={e => setNewScityNo(e.target.value)}
            onBlur={handleDialogNoBlur}
            error={addErrors.scity_no.error}
            helperText={addErrors.scity_no.helperText}
            required
            fullWidth
            margin='dense'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeAddDialog} color='default'>キャンセル</Button>
          <Button onClick={applyNewScity} color='primary' variant='contained'>設定</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// ---- 所属 ----
export const BelongsAutocomplete = ({
  name, label, value, onChange, options,
}) => {
  const classes = useStyles();
  const [localVal, setLocalVal] = useState(value || '');

  useEffect(() => {
    setLocalVal(value || '');
  }, [value]);

  return (
    <div className={classes.partWrap}>
      <Autocomplete
        freeSolo
        options={options || []}
        value={localVal}
        onInputChange={(e, v) => {
          setLocalVal(v);
          onChange(name, v);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label} name={name}
            className={classes.tfMiddleXL}
          />
        )}
      />
    </div>
  );
};

// ---- 単位 ----
export const ClassRoomAutocomplete = ({
  value, onChange,
}) => {
  const classes = useStyles();
  const users = useSelector(state => state.users);
  const clSet = new Set();
  users.forEach(e => { if (e.classroom) clSet.add(e.classroom); });
  const options = Array.from(clSet);

  const [localVal, setLocalVal] = useState(value || '');

  useEffect(() => {
    setLocalVal(value || '');
  }, [value]);

  const handleBlur = (e) => {
    const v = convHankaku(e.target.value);
    setLocalVal(v);
    onChange('classroom', v);
  };

  return (
    <div className={classes.partWrap}>
      <Autocomplete
        freeSolo
        options={options}
        value={localVal}
        onInputChange={(e, v) => {
          setLocalVal(v);
          onChange('classroom', v);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label='単位' name='classroom'
            onBlur={handleBlur}
            className={classes.tfMiddle}
          />
        )}
      />
    </div>
  );
};

// ---- 複数サービスチェックボックス ----
export const MultiServiceCheckboxes = ({
  defService, multiSvcCnt, setMultiSvcCnt, onChange,
}) => {
  const opts = [HOUDAY, JIHATSU, HOHOU];
  const defA = (defService || '').split(',');
  const [chkBoxVals, setChkBoxVals] = useState(() =>
    opts.map(e => defA.includes(e))
  );

  const [msg, setMsg] = useState({ text: '', isError: false });

  const checkValues = (vals) => {
    const selected = opts.filter((_, i) => vals[i]);
    const conStr = selected.join('');
    if (selected.length <= 1) {
      setMsg({
        text: 'サービスを２つ以上設定してください。単一サービスの場合はサービス種別で設定してください。',
        isError: true,
      });
    } else if (conStr.includes(HOUDAY) && conStr.includes(JIHATSU)) {
      setMsg({
        text: '同時設定できないサービスが設定されています',
        isError: true,
      });
    } else {
      setMsg({ text: 'チェックされたサービスを設定します。', isError: false });
    }
    // multiSvcCntを更新
    setMultiSvcCnt(selected.join(''));
  };

  useEffect(() => {
    checkValues(chkBoxVals);
  }, []);

  const handleChange = (i, checked) => {
    const newVals = [...chkBoxVals];
    newVals[i] = checked;
    setChkBoxVals(newVals);
    checkValues(newVals);

    // 各チェックボックスのnameをmultiServiceXXXとしてonChangeに通知
    opts.forEach((opt, j) => {
      onChange('multiService' + opt, newVals[j]);
    });
  };

  return (
    <div style={{ marginTop: -2, paddingTop: 0, flexWrap: 'wrap', display: 'flex', width: '100%' }}>
      {opts.map((e, i) => (
        <FormControlLabel key={i}
          control={
            <Checkbox
              checked={chkBoxVals[i]}
              onChange={ev => handleChange(i, ev.target.checked)}
              name={'multiService' + e}
              color='primary'
            />
          }
          label={e}
        />
      ))}
      <div
        style={{ width: '100%', fontSize: '.8rem', marginTop: -4, color: msg.isError ? red[800] : undefined }}
        className={msg.isError ? 'multiServiceError' : 'normal'}
      >
        {msg.text}
      </div>
    </div>
  );
};

// ---- 自治体独自上限額 ----
export const DokujiJougenTextField = ({
  value, onChange, uid,
}) => {
  const classes = useStyles();
  const allState = useSelector(s => s);
  const { users, com } = allState;
  const user = comMod.getUser(uid, users);
  const sCity = user.scity_no;
  const cities = com?.etc?.cities ?? [];
  const city = cities.find(e => e.no === sCity);
  const dokujiJougen = city?.dokujiJougen;

  const [localVal, setLocalVal] = useState(value ?? 0);

  useEffect(() => {
    setLocalVal(value ?? 0);
  }, [value]);

  if (!dokujiJougen) return null;

  const handleBlur = (e) => {
    const v = Number(convHankaku(e.target.value));
    setLocalVal(v);
    onChange('dokujiJougen', v);
  };

  return (
    <div className={classes.partWrap}>
      <TextField
        name='dokujiJougen' label='自治体独自上限額'
        value={localVal}
        onChange={e => { setLocalVal(e.target.value); }}
        onBlur={handleBlur}
        style={{ width: '14ch', marginTop: 8 }}
      />
    </div>
  );
};
