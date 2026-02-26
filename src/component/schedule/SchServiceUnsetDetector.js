import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import * as comMod from '../../commonModule';
import { didPtn } from '../../modules/contants';

/**
 * scheduleでサービスが未設定の要素を検出するコンポーネント（開発者向け）
 * state.schedule.UIDxxx.Dxxx.serviceを検出します
 */
const SchServiceUnsetDetector = () => {
  const schedule = useSelector((state) => state.schedule);
  const users = useSelector((state) => state.users);
  
  // サービスが未設定の要素を検出
  const unsetServices = useMemo(() => {
    if (!schedule) return [];
    
    const unsetList = [];
    
    // scheduleオブジェクトからUIDxxxのキーを取得
    Object.keys(schedule).forEach((uid) => {
      // UIDxxxパターンに一致しない場合はスキップ
      if (!/^UID\d+$/.test(uid)) return;
      
      const userSchedule = schedule[uid];
      if (!userSchedule || typeof userSchedule !== 'object') return;
      
      const unsetDids = [];
      
      // UIDxxx配下のDxxxキーを取得
      Object.keys(userSchedule).forEach((did) => {
        // didPtnパターン（D2xxxxxxx）に一致するもののみチェック
        if (!didPtn.test(did)) return;
        
        const scheduleItem = userSchedule[did];
        
        // scheduleItemがオブジェクトでない場合はスキップ
        if (!scheduleItem || typeof scheduleItem !== 'object') return;
        
        // serviceプロパティが存在しない、または空文字列の場合
        if (!scheduleItem.service || scheduleItem.service === '') {
          // 欠席や利用なしの予定は除外（これらはサービス未設定が正常な場合がある）
          if (!scheduleItem.absence && !scheduleItem.noUse) {
            unsetDids.push({
              did,
              date: did.replace(/^D/, '').substring(0, 8), // D20241116 -> 20241116
            });
          }
        }
      });
      
      // サービス未設定のdidが見つかった場合、リストに追加
      if (unsetDids.length > 0) {
        const user = comMod.getUser(uid, users);
        unsetList.push({
          uid,
          userName: user?.name || '不明',
          count: unsetDids.length,
          dids: unsetDids,
        });
      }
    });
    
    return unsetList;
  }, [schedule, users]);
  
  // サービスが未設定の要素がない場合
  if (unsetServices.length === 0) {
    return (
      <div style={{ padding: '12px', margin: '12px 0', border: '1px solid #4caf50', backgroundColor: '#e8f5e9' }}>
        <strong>✓ サービス設定チェック:</strong> すべての予定にサービスが設定されています
      </div>
    );
  }
  
  // 合計件数を計算
  const totalCount = unsetServices.reduce((sum, item) => sum + item.count, 0);
  
  return (
    <div style={{ 
      padding: '12px', margin: '12px 0', border: '2px solid #ff9800', backgroundColor: '#fff3e0' ,
      width: 500
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#e65100' }}>
        ⚠ サービス未設定: {unsetServices.length}名 / {totalCount}件
      </div>
      <div style={{ fontSize: '0.9em' }}>
        {unsetServices.map((item) => (
          <div key={item.uid} style={{ display: 'inline-block', marginRight: '12px', marginBottom: '4px' }}>
            {item.userName}: <strong>{item.count}件</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SchServiceUnsetDetector;

