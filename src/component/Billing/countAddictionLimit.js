import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import { recentUserStyle } from '../../albCommonModule'
import { LC2024 } from '../../modules/contants'
import { houdayKasan, jihatsuKasan, hohouKasan } from "./BlCalcData2024"
import { getUser } from "../../commonModule"
import { HOUDAY, JIHATSU, HOHOU } from '../../modules/contants';

const kasanItems = (stdDate) => {
  if (stdDate < LC2024){
    return {
      houdayKasan: [],
      jihatsuKasanKasan: [],
      hohouKasan: [],
    }
  }
  else {
    return {
      houdayKasan: houdayKasan,
      jihatsuKasan: jihatsuKasan,
      hohouKasan: hohouKasan,
    }
  }
}

// 加算の取得済怪異数と上限回数を求める
// schedule: 全体的なスケジュールでも利用者社ごとのスケジュールでも可
// uid: 利用者ID スケジュールが利用者ごとのスケジュールであれば省略可
// addictionName: 加算のネーム属性 欠席時対応加算など
// service: 省略可 省略された場合は利用者のserviceより取得 利用者のサービスが複数の場合指定の必要あり
// 加算の利用数制限はkasanitemsで取得できる配列からname属性で検索を行いlimitの値を取得することを原則とする
// 加算の取得済回数はdid.daddictionからネーム属性を検索して取得する
// 戻り値 : 
// {name: '欠席時対応加算', count: 3, limit: 4, countOfUse: 3, dids: ['D20250901', 'D20250902']},
// 当面の使い方としてserviceはstateの値を指定。usersは必ず指定。
// 単機能だとserviceは""になることがあるが、その場合はモジュール内でusersから取得を主なっているので問題にならない

export const countAddictionLimit = ({schedule, uid, addictionName, service, users = []}) => {
  // パラメータの検証
  if (!schedule || !addictionName) {
    return { name: addictionName, count: 0, limit: 0 };
  }

  // uidをUIDxxxx形式に統一
  if (uid) {
    const numericUid = String(uid).replace(/[^0-9]/g, ''); // 数字のみ抽出
    uid = `UID${numericUid}`;
  }

  // const isKateirenkei = (addictionName === '家庭連携加算');
  const isSenmonshien = (addictionName === '専門的支援実施加算');
  const isKazokushiten = (addictionName.startsWith('家族支援加算'));
  const countIfKesseki = (
    addictionName === '欠席時対応加算' || addictionName === '関係機関連携加算' || isKazokushiten
  ); 

  // 利用者データの取得
  let userData = null;
  let userService = service;

  // scheduleの構造を判定
  if (uid && schedule[uid]) {
    // 全体的なスケジュールから特定の利用者データを取得
    userData = schedule[uid];
  } else {
    // 利用者ごとのスケジュールの場合
    userData = schedule;
  }

  // usersからサービス情報を取得
  let isMultiService = false;
  if (uid && users.length > 0) {
    const user = getUser(uid, users);
    if (user && user.service) {
      // サービスが複数指定されている場合（カンマ区切り）
      if (user.service.includes(',')) {
        isMultiService = true;
        // 複数サービスの場合は0を返す
      } else {
        // 単一サービスの場合、指定されたserviceよりuser.serviceを優先
        userService = user.service;
      }
    }
  }

  if (!service && isMultiService && !isKazokushiten) {
    return { name: addictionName, count: 0, limit: 0 , isMultiService: true};
  }

  // 加算の上限回数を取得
  let limit = 0;
  if (userService) {
    const kasanData = kasanItems(new Date());
    let kasanArray = [];
    
    // サービスに応じて適切な加算配列を選択
    if (userService === HOUDAY) {
      kasanArray = kasanData.houdayKasan;
    } else if (userService === JIHATSU) {
      kasanArray = kasanData.jihatsuKasan;
    } else if (userService === HOHOU) {
      kasanArray = kasanData.hohouKasan;
    }

    // 加算名で検索してlimitを取得
    const kasanItem = kasanArray.find(item => item.name === addictionName);
    if (kasanItem) {
      limit = kasanItem.limit || 0;
    }
  }

  // 取得済回数をカウント
  let count = 0;
  let countOfUse = 0;
  const dayKeys = Object.keys(userData).filter(key => key.startsWith('D20'));
  const dids = [];

  dayKeys.forEach(dayKey => {
    const dayData = userData[dayKey];
    
    // 基本チェック
    if (!dayData) return;
    
    // スキップ条件
    if (isMultiService && !isKazokushiten && dayData.service && dayData.service !== userService) return;
    if (dayData.reserve) return;
    if (!isKazokushiten && dayData.noUse) return;
    if (!countIfKesseki && dayData.absence) return;
    
    // countOfUseをカウント（dAddictionの有無に関わらず）
    countOfUse++;
    
    // dAddictionがない場合はスキップ
    if (!dayData.dAddiction) return;
    
    // dAddictionのキーを取得してパターンマッチで判定
    const addictionKeys = Object.keys(dayData.dAddiction);
    let targetKeys = [];

    if (isKazokushiten) {
      // まずは完全一致を優先（家族支援加算Ⅰ / 家族支援加算Ⅱ など）
      if (addictionKeys.includes(addictionName)) {
        targetKeys = [addictionName];
      } else {
        // 「家族支援加算」などの前方一致にも対応
        targetKeys = addictionKeys.filter(key => key.startsWith(addictionName));
        if (targetKeys.length === 0) {
          // それでも見つからない場合は家族支援加算で始まるものをすべて対象
          targetKeys = addictionKeys.filter(key => key.startsWith('家族支援加算'));
        }
      }
    } else {
      // 通常の加算名で完全一致
      targetKeys = addictionKeys.filter(key => key === addictionName);
    }

    const hasValidValue = targetKeys.some(key => {
      const value = dayData.dAddiction[key];
      return (typeof value === 'number') || (typeof value === 'string' && value !== '');
    });

    if (hasValidValue) {
      count++;
      dids.push(dayKey);
    }
  });

  if (isSenmonshien) {
    if (countOfUse >= 12) {
      limit = 6;
    }
    else if (userService === HOUDAY && countOfUse >= 6) {
      limit = 4;
    }
  }
  return {
    name: addictionName,
    count,
    countOfUse, // 利用数
    limit,isMultiService,dids
  };
}
// テスト用コンポーネント
export const CountAddictionLimitTest = () => {
  const [uid, setUid] = useState('');
  const [addictionName, setAddictionName] = useState('');
  const [service, setService] = useState('');
  const [result, setResult] = useState(null);
  
  // useSelectorでscheduleとusersを取得
  const schedule = useSelector(state => state.schedule);
  const users = useSelector(state => state.users);
  
  // テスト実行
  const handleTest = () => {
    if (!uid || !addictionName) {
      alert('UIDと加算名を入力してください');
      return;
    }
    
    const testResult = countAddictionLimit({
      schedule,
      uid,
      addictionName,
      service: service || undefined,
      users
    });
    
    console.log('テスト結果:', testResult);
    setResult(testResult);
  };
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h3>countAddictionLimit テスト</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <label>UID: </label>
        <input
          type="text"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          placeholder="例: 1234 または UID1234"
          style={{ marginLeft: '10px', width: '200px' }}
        />
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <label>加算名: </label>
        <input
          type="text"
          value={addictionName}
          onChange={(e) => setAddictionName(e.target.value)}
          placeholder="例: 欠席時対応加算"
          style={{ marginLeft: '10px', width: '200px' }}
        />
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <label>サービス: </label>
        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          style={{ marginLeft: '10px', width: '200px' }}
        >
          <option value="">選択してください（省略可）</option>
          <option value={JIHATSU}>{JIHATSU}</option>
          <option value={HOUDAY}>{HOUDAY}</option>
          <option value={HOHOU}>{HOHOU}</option>
        </select>
      </div>
      
      <button onClick={handleTest} style={{ padding: '10px 20px' }}>
        テスト実行
      </button>
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p>schedule: {schedule ? '取得済み' : '未取得'}</p>
        <p>users: {users ? `${users.length}件` : '未取得'}</p>
      </div>
      
      {result && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '5px',
          border: '1px solid #ddd'
        }}>
          <h4 style={{ marginTop: 0 }}>テスト結果</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px', fontWeight: 'bold', width: '150px' }}>加算名</td>
                <td style={{ padding: '8px' }}>{result.name}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>取得済回数</td>
                <td style={{ padding: '8px', color: result.count > result.limit ? 'red' : 'green' }}>
                  {result.count}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>利用数</td>
                <td style={{ padding: '8px' }}>{result.countOfUse}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>上限回数</td>
                <td style={{ padding: '8px' }}>{result.limit}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>マルチサービス</td>
                <td style={{ padding: '8px' }}>{result.isMultiService ? 'はい' : 'いいえ'}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px', fontWeight: 'bold', verticalAlign: 'top' }}>対象日</td>
                <td style={{ padding: '8px' }}>
                  {result.dids.length > 0 ? (
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {result.dids.map((did, index) => (
                        <div key={index}>{did}</div>
                      ))}
                    </div>
                  ) : '該当なし'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};