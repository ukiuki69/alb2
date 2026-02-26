/**
 * Setting.js
 * 
 * 設定関連コンポーネントの統合エントリーポイント
 * 各コンポーネントは個別ファイルに分割されています。
 * 
 * ファイル構成:
 * - settingCommon.js     : 共通スタイル・Links・ユーティリティ関数
 * - AddictionSettings.js : 請求・加算設定（/setting/addiction）
 * - StandardSettings.js  : 基本設定（/setting）
 * - ExtraSettings.js     : その他設定（/setting/others）
 * - RegParamsSettings.js : 他事業所・市区町村（/setting/reg）
 */

import React from 'react';
import { Links } from './settingCommon';

// 共通部品
export { 
  Links, 
  useSettingStyles,
  updateToSotedUsers,
  requestUserIndexUpdate,
  userLstForSort,
} from './settingCommon';

// 各設定ページコンポーネント
export { AddictionSettings } from './AddictionSettings';
export { StandardSettings } from './StandardSettings';
export { ExtraSettings, ExstraSettings } from './ExtraSettings';
export { RegParamsSettings } from './RegParamsSettings';

// OthesSettings は使用されていないが後方互換性のため残す
export const OthesSettings = () => {
  return (
    <React.Fragment>
      <Links />
      <div className="AppPage setting">
        hoge
      </div>
    </React.Fragment>
  );
};

// デフォルトエクスポートは StandardSettings
export { default } from './StandardSettings';
