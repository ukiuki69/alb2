import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import * as comMod from '../../commonModule'
import * as albcm from '../../albCommonModule'
import Button from '@material-ui/core/Button';
import * as afp from '../common/AddictionFormParts'; 
import { makeStyles } from '@material-ui/core/styles';
import DateSelectionInMonth from './DateSelectionInMonth';
import Typography from '@material-ui/core/Typography';
import { DAYSETTING_MENU } from './SchDaySettingNoDialog';
import Radio from '@material-ui/core/Radio';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import { HOUDAY } from '../../modules/contants';

const useStyle = makeStyles((theme) => ({
  root: {
    ' & .MuiDialog-paperWidthSm': {
      maxWidth:'initial'
    }
  },
  dAddictionForm: {
    display: 'flex', flexWrap: 'wrap', maxWidth: 800, padding: '8px 16px',
  },
  categoryWrapper: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
    borderBottom: '1px solid #f0f0f0',
    paddingBottom: 4,
  },
  componentWrapper: {
    transition: 'opacity 0.2s',
    width: '100%',
  },
  componentInner: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
  },
  componentContent: {
    flex: '1 1 auto',
    minWidth: 0,
  },
  deleteControl: {
    display: 'flex',
    alignItems: 'center',
  },
  deleteButtonConfirmed: {
    backgroundColor: '#c62828',
    color: '#fff',
    '&:hover': {
      backgroundColor: '#a71d1d',
    },
  },
  disabled: {
    opacity: 0.3,
    pointerEvents: 'none',
  }
}));

const normalizeCalendarItem = (item) => {
  if (typeof item === 'string') {
    const dateOnly = item.split('T')[0];
    return { dateOnly, iso: item };
  }
  if (item instanceof Date) {
    const y = item.getFullYear();
    const m = String(item.getMonth() + 1).padStart(2, '0');
    const d = String(item.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${d}T00:00:00.000Z`;
    return { dateOnly: `${y}-${m}-${d}`, iso };
  }
  return null;
};

const buildFilteredDateList = ({ date, dateList, showAllDates = true }) => {
  const dateStr = date ? (typeof date === 'string' ? date : comMod.formatDate(date, 'YYYY-MM-DD')) : null;
  return dateList.reduce((acc, item) => {
    try {
      const normalized = normalizeCalendarItem(item.date);
      if (!normalized) return acc;
      if (!showAllDates && dateStr && normalized.dateOnly < dateStr) return acc;
      acc.push(normalized.iso);
      return acc;
    } catch (error) {
      return acc;
    }
  }, []);
};

const toDid = (dateStr) => {
  return 'D' + dateStr.split('T')[0].replace(/-/g, '');
};

const toIsoString = (value) => {
  const normalized = normalizeCalendarItem(value);
  return normalized ? normalized.iso : null;
};

const getAddictionNames = (stdDate) => [
  stdDate >= '2024-04-01' ? '児童指導員等加配加算' : '児童指導員等加配加算（Ⅰ）',
  '専門的支援体制加算',
  '福祉専門職員配置等加算',
  '定員超過減算',
  '栄養士配置加算',
  '職員欠如減算',
  '開所時間減算',
  '個別サポートⅠ１設定',
  '強度行動障害児支援加算無効化',
];

const formatSelectedDateLabel = (isoDate) => {
  const normalized = normalizeCalendarItem(isoDate);
  if (!normalized || !normalized.dateOnly) return '';
  const [year, month, day] = normalized.dateOnly.split('-');
  if (!month || !day) return '';
  return `${parseInt(month, 10)}月${parseInt(day, 10)}日`;
};

export const SchMultipleDateAddiction = (props) => {
  const {date, schedule, setSchedule, mode, chMode, setSnack} = props.prms || props;
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const sService = useSelector(state => state.service);
  const dateList = useSelector(state => state.dateList);
  const classroom = useSelector(state => state.classroom);
  const serviceItems = useSelector(state => state.serviceItems);
  const service = sService || (serviceItems.length > 0 ? serviceItems[0] : '');
  
  const classes = useStyle();
  const initialSelection = () => {
    const iso = toIsoString(date);
    return iso ? [iso] : [];
  };
  const [selectedDates, setSelectedDatesState] = useState(initialSelection());
  const selectedDatesRef = useRef(selectedDates);
  const updateSelectedDates = (dates) => {
    selectedDatesRef.current = dates;
    setSelectedDatesState(dates);
    setHasManualSelection(true);
  };
  useEffect(() => {
    selectedDatesRef.current = selectedDates;
  }, [selectedDates]);
  const [activeCategory, setActiveCategory] = useState('JiShidouKaHai1');
  const formRef = useRef();
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [hasManualSelection, setHasManualSelection] = useState(false);
  const availableDates = useMemo(
    () => buildFilteredDateList({ date, dateList }),
    [date, dateList]
  );
  const availableDids = useMemo(
    () => availableDates.map(toDid),
    [availableDates]
  );
  const sendPartOfScheduleUpdates = (updatedSchedule) => {
    const partOfSch = {[service]: {}};
    availableDids.forEach((selectedDid) => {
      const target = updatedSchedule[service] && updatedSchedule[service][selectedDid];
      partOfSch[service][selectedDid] = target ? {...target} : {};
    });
    const sendPrms = {hid, bid, date: stdDate, partOfSch};
    albcm.sendPartOfSchedule(sendPrms, setSnack);
  };

  useEffect(() => {
    const current = addictionList.find(a => a.id === activeCategory);
    if (current && current.svcs && !current.svcs.includes(service)) {
      setActiveCategory('JiShidouKaHai1');
    }
  }, [service]);

  useEffect(() => {
    setIsDeleteMode(false);
    setHasManualSelection(false);
  }, [service, activeCategory]);

  useEffect(() => {
    if (!isDeleteMode) {
      setDeleteConfirmed(false);
    }
  }, [isDeleteMode]);

  const manualSelection = hasManualSelection ? selectedDates : [];
  const manualSelectedDates = [...manualSelection].sort();
  const firstSelectedDateLabel = manualSelectedDates.length > 0
    ? formatSelectedDateLabel(manualSelectedDates[0])
    : '';
  const deleteInfoMessage = manualSelectedDates.length === 0
    ? '削除する日付を指定してください'
    : `${firstSelectedDateLabel || '該当日'}他、${manualSelectedDates.length}日分の該当項目を削除します。`;
  const deleteButtonLabel = isDeleteMode
    ? (deleteConfirmed ? '削除実行' : '削除')
    : '書き込み';

  useEffect(() => {
    if (!isDeleteMode) return;
    setDeleteConfirmed(false);
  }, [isDeleteMode, manualSelectedDates.length]);

  const did = (typeof date === 'object')
  ? 'D' + comMod.formatDate(date, 'YYYYMMDD')
  : 'D' + date.replace(/[^0-9]/g, '');

  const handleApply = () => {
    if (isDeleteMode) return;
    if (!formRef.current) return;
    if (availableDids.length === 0) return;

    const inputs = formRef.current.querySelectorAll('input');
    const selects = formRef.current.querySelectorAll('select');
    const formsVal = comMod.getFormDatas([inputs, selects]);
    
    const t = {...schedule};
    t[service] = t[service]? {...t[service]}: {};
    
    const applyFormDataToDate = (targetDid, values = {}) => {
      if (!t[service][targetDid]) t[service][targetDid] = {};
      else t[service][targetDid] = {...t[service][targetDid]};

      if (classroom && stdDate >= '2025-07-01') {
        t[service][targetDid][classroom] = t[service][targetDid][classroom]
          ? {...t[service][targetDid][classroom]} : {};
        Object.assign(t[service][targetDid][classroom], values);
      } else {
        Object.assign(t[service][targetDid], values);
      }
    };
    
    const currentSelection = new Set(selectedDatesRef.current);
    availableDids.forEach((selectedDid, index) => {
      if (Array.isArray(t[service][selectedDid])) t[service][selectedDid] = {};
      const values = currentSelection.has(availableDates[index]) ? formsVal : {};
      applyFormDataToDate(selectedDid, values);
    });

    setSchedule({...schedule, ...t});
    sendPartOfScheduleUpdates(t);
  };

  const handleDelete = () => {
    if (availableDids.length === 0) return;
    if (manualSelection.length === 0) return;
    const currentSelection = new Set(manualSelection);

    const t = {...schedule};
    t[service] = t[service]? {...t[service]} : {};
    const addictionNames = getAddictionNames(stdDate);

    const removeEntries = (targetDid) => {
      const target = t[service][targetDid];
      if (!target) return;

      if (classroom && stdDate >= '2025-07-01') {
        const classTarget = target[classroom];
        if (classTarget) {
          addictionNames.forEach(name => delete classTarget[name]);
          if (Object.keys(classTarget).length === 0) {
            delete target[classroom];
          }
        }
      } else {
        addictionNames.forEach(name => delete target[name]);
      }

      if (Object.keys(target).length === 0) {
        delete t[service][targetDid];
      }
    };

    availableDids.forEach((targetDid, index) => {
      if (!currentSelection.has(availableDates[index])) {
        return;
      }
      removeEntries(targetDid);
    });

    setSchedule({...schedule, ...t});
    sendPartOfScheduleUpdates(t);
  };

  const handleClose = () => {
    setIsDeleteMode(false);
    setDeleteConfirmed(false);
    setHasManualSelection(false);
    if (typeof props.close === 'function') {
      setTimeout(() => props.close(), 300);
    }
    if (typeof props.closehandler === 'function') {
      setTimeout(() => props.closehandler(), 300);
    }
    if (typeof chMode === 'function') {
      chMode(DAYSETTING_MENU);
    }
  };

  const handleSubmit = () => {
    if (isDeleteMode) {
      if (manualSelectedDates.length === 0) return;
      if (!deleteConfirmed) {
        setDeleteConfirmed(true);
        return;
      }
      handleDelete();
      handleClose();
      return;
    }
    handleApply();
    handleClose();
  };

  useEffect(() => {
    const handleFormChange = (event) => {
      if (event?.target?.dataset?.skipHandleApply === 'true') return;
      setTimeout(handleApply, 100);
    };
    const form = formRef.current;
    if (form) {
      form.addEventListener('change', handleFormChange);
      return () => form.removeEventListener('change', handleFormChange);
    }
  }, [selectedDates, activeCategory, isDeleteMode]);

  const addictionList = [
    { id: 'JiShidouKaHai1', Component: afp.JiShidouKaHai1, name: '児童指導員等加配加算' },
    { id: 'SenmonTaisei', Component: afp.SenmonTaisei, name: '専門的支援体制加算' },
    { id: 'FukushiSenmonHaichi', Component: afp.FukushiSenmonHaichi, name: '福祉専門職員配置等加算' },
    { id: 'TeiinChouka', Component: afp.TeiinChouka, name: '定員超過減算' },
    { id: 'EiyoushiHaichi', Component: afp.EiyoushiHaichi, name: '栄養士配置加算' },
    { id: 'ShokuinKetujo', Component: afp.ShokuinKetujo, name: '職員欠如減算' },
    { id: 'KaisyoGensan', Component: afp.KaisyoGensan, name: '開所時間減算' },
    { id: 'KobetsuSuport1Settei', Component: afp.KobetsuSuport1Settei, name: '個別サポート加算(Ⅰ)', svcs: [HOUDAY] },
    { id: 'KyoudokoudouDisable', Component: afp.KyoudokoudouDisable, name: '強度行動障害児支援加算無効化' },
  ];

  const activeAddiction = addictionList.find(a => a.id === activeCategory);

  return(<>
    <div style={{ padding: '16px', borderBottom: '1px solid #eee', marginBottom: '16px' }}>
      <Typography variant="subtitle2" gutterBottom>
        適用する日付を選択してください
      </Typography>
      <DateSelectionInMonth 
        dateList={dateList}
        selectedDates={selectedDates}
        onDateSelection={updateSelectedDates}
        defaultShow={true}
      />
    </div>

    <div style={{ padding: '0 16px 16px 16px', borderBottom: '1px solid #eee' }}>
      <Typography variant="subtitle2" gutterBottom>
        設定する項目を選択してください
      </Typography>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {addictionList.filter(a => !a.svcs || a.svcs.includes(service)).map(({id, name}) => (
          <FormControlLabel
            key={id}
            control={
              <Radio
                checked={activeCategory === id}
                onChange={() => setActiveCategory(id)}
                value={id}
                color="primary"
                size="small"
              />
            }
            label={<span style={{ fontSize: '0.85rem' }}>{name}</span>}
            style={{ margin: 0, marginRight: 8 }}
          />
        ))}
      </div>
    </div>
    {isDeleteMode && (
      <div style={{ padding: '0 16px 12px 16px' }}>
        <Typography variant="body2" style={{ color: '#c62828' }}>
          {deleteInfoMessage}
        </Typography>
      </div>
    )}

    <form ref={formRef} id='multiple-addiction-form' className={"addiction " + classes.dAddictionForm}>
      {activeAddiction && (
        <div className={classes.componentWrapper}>
          <div className={classes.componentInner}>
            <div className={classes.componentContent}>
              <activeAddiction.Component did={did} size='middleL' dLayer={2} schedule={schedule} />
            </div>
            <div className={classes.deleteControl}>
              <FormControlLabel
                control={
                  <Checkbox
                    color="primary"
                    checked={isDeleteMode}
                    onChange={(event) => setIsDeleteMode(event.target.checked)}
                    inputProps={{ 'data-skip-handle-apply': 'true' }}
                    size="small"
                  />
                }
                label="該当項目を削除する"
              />
            </div>
          </div>
        </div>
      )}
    </form>
    
    <div
      style={{
        textAlign: 'center',
        padding: '16px',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 8,
      }}
    >
      <Button variant="contained" color="secondary" onClick={handleClose}>
        閉じる
      </Button>
      <Button
        variant="contained"
        color={deleteConfirmed ? 'secondary' : 'primary'}
        disabled={selectedDates.length === 0 || (isDeleteMode && manualSelectedDates.length === 0)}
        onClick={handleSubmit}
        className={deleteConfirmed ? classes.deleteButtonConfirmed : undefined}
      >
        {deleteButtonLabel}
      </Button>
    </div>
  </>)
}

export default SchMultipleDateAddiction;
