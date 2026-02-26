import React from 'react';
import { useMediaQuery } from '@material-ui/core';
import { useSelector } from 'react-redux';
import * as comMod from '../../commonModule';
import * as sfp from '../common/StdFormParts';
import { SetUisCookieChkBox } from '../common/commonParts';
import SchAutoBkRestore from '../schedule/SchAutoBkRestore';
import { permissionCheckTemporary } from '../../modules/permissionCheck';
import { PERMISSION_DEVELOPER } from '../../modules/contants';
import BrowserNotificationSetting from './BrowserNotificationSetting';
import { Links, useSettingStyles } from './settingCommon';

export const ExtraSettings = () => {
  const account = useSelector(state => state.account);
  const limit500px = useMediaQuery("(max-width:500px)");
  const classes = useSettingStyles();
  
  const Spacer = () => {
    return (
      <div style={{height: 16}}></div>
    )
  }

  // スマホ表示
  if(limit500px) return(
    <>
    <Links />
    <div className="AppPage setting" style={{maxWidth: 960, minWidth: 0}}>
      <Spacer/>
      <BrowserNotificationSetting />
      <Spacer/>
    </div>
    </>
  );

  return (<>
    <Links />
    <div className="AppPage setting">
      <Spacer/>
      <BrowserNotificationSetting />
      <Spacer/>
      <sfp.SetUiCookies />
      <Spacer/>
      <sfp.RemoveCookieAll />
      <Spacer/>
      <SetUisCookieChkBox 
        p={comMod.uisCookiePos.useHohouService}
        label='保育訪問のサービスを追加可能にする'
      />
      <SetUisCookieChkBox 
        p={comMod.uisCookiePos.useExtraShortCutKey}
        label='拡張ショートカットキーを利用可能にします。'
      />
      <div className={classes.extShortcutText}>
        <p>shift+h ホーム画面に移動します</p>
        <p>shift+a アカウント切り替え画面に移動します</p>
      </div>

      <SetUisCookieChkBox 
        p={comMod.uisCookiePos.notDisplaySchMarker}
        label='予定実績‐月間のマーカー表示をしません'
      />
      <SetUisCookieChkBox 
        p={comMod.uisCookiePos.displayKobetuSupportOnSchEditDetail}
        label='予定実績詳細設定で個別サポート加算を表示します。2024年9月以降で有効です。'
      />
      <SetUisCookieChkBox 
        p={comMod.uisCookiePos.kbShortCutDisabled}
        label='キーボードショートカットを無効にします。有効にするにはアプリの再読み込みを行ってください。'
      />

      <SetUisCookieChkBox 
        p={comMod.uisCookiePos.planAiButtonDisplay}
        label='個別支援計画関連でテスト中のAIボタンも含めて表示します。'
      />

      <SetUisCookieChkBox 
        p={comMod.uisCookiePos.noOccuRateDispOnPrint}
        label='予定実績ｰ月間の印刷時に稼働率表示を行いません。'
      />

      <SetUisCookieChkBox 
        p={comMod.uisCookiePos.notAutoScrollOnProseed}
        label='自動スクロールを行いません。'
      />
      {permissionCheckTemporary(PERMISSION_DEVELOPER, account) &&
        <SetUisCookieChkBox 
          p={comMod.uisCookiePos.useEncryption}
          label='暗号化通信を行う'
        />
      }

      <SchAutoBkRestore />
    </div>
  </>)
};

// 後方互換性のため ExstraSettings もエクスポート
export const ExstraSettings = ExtraSettings;

export default ExtraSettings;
