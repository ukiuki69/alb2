import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import SettingsIcon from '@material-ui/icons/Settings';
import { useLocation, useHistory } from 'react-router-dom';
import { FormControlLabel, Checkbox } from '@material-ui/core';
import { grey, teal } from '@material-ui/core/colors';
import { useDispatch, useSelector } from 'react-redux';
import { GoBackButton } from '../common/commonParts';
import { setStore, setSnackMsg } from '../../Actions';
import { findDeepPath } from '../../commonModule';
import { univApiCall } from '../../albCommonModule';
import { checkValueType } from '../dailyReport/DailyReportCommon';

const useStyles = makeStyles((theme) => ({
  buttonRoot: {
    position: 'fixed', 
    top: 100, 
    right: 24,
    '& .MuiSvgIcon-root': {
      marginInlineEnd: 0,
      marginRight: 0,
    },
  },
  settingsButton: {
    padding: '8px 12px',
    minWidth: 80,
  },
  settingsButtonLabel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  settingsIcon: {
    fontSize: '3rem',
    color: grey[500],
    marginBottom: 4,
    marginInlineEnd: '0 !important',
    marginRight: '0 !important',
    marginLeft: 0,
  },
  settingsButtonText: {
    fontSize: '0.875rem',
    textAlign: 'center',
  },
  printSettings: {
    maxWidth: 720,
    marginTop: 100,
    marginBottom: 100,
    marginLeft: 'calc(50% - 360px + 31px)',
    '& .title': {
      marginBottom: 8,
      textAlign: 'center',
      padding: 8,
      fontWeight: '600',
      color: teal[800],
      backgroundColor: teal[50],
      borderBottom: `1px solid ${teal[300]}`
    },
    '& .formParts': {
      padding: '4px 8px'
    }
  },
  buttonWrapper: {
    display: 'flex',
    justifyContent: 'right',
    gap: 16,
    marginTop: 24,
    padding: 8,
  }
}));

// 表示対象のitemリスト
const DISPLAY_ITEMS = [
  'assessment',
  'personalSupportDraft',
  'conferenceNote',
  'monitoring',
  'personalSupport',
  'senmonShien'
];

// ボタンコンポーネント
export const PrintSettingsButton = () => {
  const classes = useStyles();
  const location = useLocation();
  const history = useHistory();

  // URLが /reports/usersplan/ から始まり、クエリパラメータに対象のitemがあるかチェック
  const shouldDisplay = (() => {
    if (!location.pathname.startsWith('/reports/usersplan/')) return false;
    
    const params = new URLSearchParams(location.search);
    const item = params.get('item');
    
    return DISPLAY_ITEMS.includes(item);
  })();

  const handleSettingsClick = () => {
    const params = new URLSearchParams(location.search);
    const item = params.get('item');
    history.push(`/reports/printsettings?item=${item}`);
  };

  if (!shouldDisplay) return null;

  return (
    <div className={classes.buttonRoot}>
      <Button
        variant='text'
        onClick={handleSettingsClick}
        className={classes.settingsButton}
        classes={{
          label: classes.settingsButtonLabel
        }}
      >
        <SettingsIcon className={classes.settingsIcon} />
        <span className={classes.settingsButtonText}>印刷設定</span>
      </Button>
    </div>
  );
};

// キャンセルボタン
const CancelButton = () => {
  const history = useHistory();
  const handleClick = () => {
    history.goBack();
  };

  return (
    <Button
      variant="contained"
      onClick={handleClick}
    >
      キャンセル
    </Button>
  );
};

// 送信ボタン
const SendButton = ({ handleClick }) => {
  const history = useHistory();
  return (
    <Button
      color='primary'
      variant="contained"
      onClick={() => {
        handleClick();
        history.goBack();
      }}
    >
      送信
    </Button>
  );
};

// ボタンラッパー
const ButtonWrapper = ({ handleClick }) => {
  const classes = useStyles();
  return (
    <div className={classes.buttonWrapper}>
      <CancelButton />
      <SendButton handleClick={handleClick} />
    </div>
  );
};

// メイン設定コンポーネント
export const PrintSettings = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const location = useLocation();
  const com = useSelector(state => state.com);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);

  // URLからitemを取得
  const params = new URLSearchParams(location.search);
  const item = params.get('item');

  // 設定をオブジェクトで管理
  const [settings, setSettings] = useState(() => {
    const usersPlan = com?.ext?.reportsSetting?.usersPlan ?? com?.etc?.configReports?.usersPlan ?? {};
    return {
      hideAddress: usersPlan.hideAddress ?? false,
      monitoringShowStaffName: usersPlan.monitoringShowStaffName ?? false,
      senmonShienHideGuardianSign: usersPlan.senmonShienHideGuardianSign ?? false,
      assessmentUseOriginalLabel: usersPlan.assessmentUseOriginalLabel ?? false,
    };
  });

  // 個別の設定を更新するヘルパー関数
  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const HideAddress = () => {
    return (
      <FormControlLabel
        control={
          <Checkbox
            checked={settings.hideAddress}
            onChange={(e) => updateSetting('hideAddress', e.target.checked)}
            name='hideAddress'
            color="primary"
          />
        }
        label='住所を表示しない'
        className='hideAddress formParts'
      />
    );
  };

  const MonitoringShowStaffName = () => {
    return (
      <FormControlLabel
        control={
          <Checkbox
            checked={settings.monitoringShowStaffName}
            onChange={(e) => updateSetting('monitoringShowStaffName', e.target.checked)}
            name='monitoringShowStaffName'
            color="primary"
          />
        }
        label='計画表、モニタリング表の末尾に児発管の氏名を表示する'
        className='monitoringShowStaffName formParts'
      />
    );
  };

  const SenmonShienHideGuardianSign = () => {
    return (
      <FormControlLabel
        control={
          <Checkbox
            checked={settings.senmonShienHideGuardianSign}
            onChange={(e) => updateSetting('senmonShienHideGuardianSign', e.target.checked)}
            name='senmonShienHideGuardianSign'
            color="primary"
          />
        }
        label='専門的支援実施計画には保護者のサイン欄を表示しない'
        className='senmonShienHideGuardianSign formParts'
      />
    );
  };

  const AssessmentUseOriginalLabel = () => {
    return (
      <FormControlLabel
        control={
          <Checkbox
            checked={settings.assessmentUseOriginalLabel}
            onChange={(e) => updateSetting('assessmentUseOriginalLabel', e.target.checked)}
            name='assessmentUseOriginalLabel'
            color="primary"
          />
        }
        label='面談実施日、実施者をアセスメント実施日、実施者にする'
        className='assessmentUseOriginalLabel formParts'
      />
    );
  };

  const clickSendButton = async () => {
    const comExt = checkValueType(com?.ext, 'Object') ? {...com.ext} : {};
    if (!comExt.reportsSetting) comExt.reportsSetting = {};
    if (!comExt.reportsSetting.usersPlan) comExt.reportsSetting.usersPlan = {};
    
    // 全ての設定を保存
    comExt.reportsSetting.usersPlan.hideAddress = settings.hideAddress;
    comExt.reportsSetting.usersPlan.monitoringShowStaffName = settings.monitoringShowStaffName;
    comExt.reportsSetting.usersPlan.senmonShienHideGuardianSign = settings.senmonShienHideGuardianSign;
    comExt.reportsSetting.usersPlan.assessmentUseOriginalLabel = settings.assessmentUseOriginalLabel;
    
    const sendExtParams = {
      a: "sendComExt",
      hid,
      bid,
      ext: JSON.stringify(comExt)
    };
    
    const sendExtRes = await univApiCall(sendExtParams);
    if (!sendExtRes?.data?.result) {
      dispatch(setSnackMsg('保存に失敗しました。', 'warning'));
      return;
    }
    
    dispatch(setStore({com: {...com, ext: comExt}}));
    dispatch(setSnackMsg('保存しました。', 'success'));
  };

  return (
    <>
      <GoBackButton posX={90} posY={0} />
      <div className={classes.printSettings}>
        <div className='title'>個別支援計画関連書類の印刷設定</div>
        
        {/* 共通設定 */}
        <div className='formParts'>
          <HideAddress />
        </div>

        {/* アセスメント固有の設定 */}
        {item === 'assessment' && (
          <div className='formParts'>
            <AssessmentUseOriginalLabel />
          </div>
        )}

        {/* 計画表・モニタリング表末尾の氏名表示設定 */}
        {/* プロパティ名 monitoringShowStaffName はモニタリング専用だった名残。
            personalSupport/personalSupportDraft/monitoringに共通適用されるため
            名前は変えずラベルのみ変更して後方互換性を維持している */}
        {['monitoring', 'personalSupport', 'personalSupportDraft'].includes(item) && (
          <div className='formParts'>
            <MonitoringShowStaffName />
          </div>
        )}
        {item === 'senmonShien' && (
          <div className='formParts'>
            <SenmonShienHideGuardianSign />
          </div>
        )}

        <ButtonWrapper handleClick={clickSendButton} />
      </div>
    </>
  );
};
