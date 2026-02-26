import React, { useState } from "react";
import { 
  houdySirvice, houdayKasan, 
  jihatsuKasan,
  serviceNameBase,serviceNameBaseHD, jihatsuService,
  hohouService, hohouKasan, serviceSyubetu, ketteiScode, 
 } from "./BlCalcData2021";
 import { 
  keikakuSoudanAddiction, keikakuSoudanService, 
  syougaiSoudanAddiction, syougaiSoudanService 
} from './blCalcdataSoudan2021';
import { 
  hohouKasan as hohouKasan2024,
  hohouService as hohouService2024,
} from "./BlCalcData2024";
import{
  houdayKasan as houdayKasan2024,
  houdySirvice as houdySirvice2024,
  jihatsuKasan as jihatsuKasan2024,
  jihatsuService as jihatsuService2024,
} from "./BlCalcData2024";

const arrayToCSV = data => {
  if (data.length === 0) return '';

  const csvRows = [];
  // 最初のオブジェクトのキーを取得
  const baseKeys = Object.keys(data[0]);

  // 全てのオブジェクトをスキャンしてユニークなキーを集める
  const allKeys = data.reduce((keys, item) => {
    Object.keys(item).forEach(key => {
      if (!keys.includes(key)) keys.push(key);
    });
    return keys;
  }, baseKeys);

  // タイトル行を追加
  csvRows.push(allKeys.join(','));

  // 各要素をCSV形式の行に変換
  data.forEach(item => {
    const row = allKeys.map(key => {
      if (!item.hasOwnProperty(key)) return `"und"`;
      const value = item[key];
      // オブジェクトや配列の場合はJSON.stringify後、カンマをアンダースコアに置き換え
      if (typeof value === 'object' && value !== null) {
        return `"${JSON.stringify(value).replace(/,/g, '_')}"`;
      }
      return `"${value}"`;
    }).join(',');
    csvRows.push(row);
  });
  return csvRows.join('\n');
};
const datas = [
  {name: '放デイネームベース/serviceNameBase', item: serviceNameBase,},
  {name: '放デイサービス/houdySirvice', item: houdySirvice,},
  {name: '放デイ加算/houdayKasan', item: houdayKasan,},
  {name: '自発ネームベース/serviceNameBaseHD', item: serviceNameBaseHD,},
  {name: '自発サービス/jihatsuService', item: jihatsuService,},
  {name: '自発加算/jihatsuKasan', item: jihatsuKasan,},
  {name: '保訪加算/hohouKasan', item: hohouKasan,},
  {name: '保訪サービス/hohouService', item: hohouService,},
  {name: '計画相談サービス/keikakuSoudanService', item: keikakuSoudanService,},
  {name: '計画相談加算/keikakuSoudanAddiction', item: keikakuSoudanAddiction,},
  {name: '障害児相談サービス/syougaiSoudanService', item: syougaiSoudanService, },
  {name: '障害児相談加算/syougaiSoudanAddiction', item: syougaiSoudanAddiction,},
  {name: '決定サービスコード/ketteiScode', item: ketteiScode,},
  {name: '保訪加算2024/hohouKasan', item: hohouKasan2024,},
  {name: '保訪サービス2024/hohouKasan', item: hohouService2024,},
  {name: '児発加算2024/jihatsuKasan', item: jihatsuKasan2024,},
  {name: '児発サービス2024/jihatsuService', item: jihatsuService2024,},
  {name: '放デイ加算2024/houdayKasan', item: houdayKasan2024,},
  {name: '放デイサービス2024/houdySirvice', item: houdySirvice2024,},
]

// 算定用のデータをCSV形式で出力する
export const CalcDataExport = () => {
  const [val, setVall] = useState();
  const [isVisible, setIsVisible] = useState(false);
  const stylePdding = {padding: 8,};
  const styleTopBot = {paddingTop: 2, paddingBottom: 2};
  const handleClick = (e, i) => {
    const item = datas[i].item;
    const v = '[name]' + datas[i].name + '\n' + arrayToCSV(item);
    setVall(v);
  }
  const handleCopy = () => {
    if (val) {
      navigator.clipboard.writeText(val).then(() => {
        alert('コピーしました');
      }).catch(err => {
        console.error('コピーに失敗しました:', err);
      });
    }
  }
  const handleToggle = () => {
    setIsVisible(!isVisible);
  }
  const links = datas.map((item, i)=>{
    return (
      <a onClick={e=>handleClick(e, i)} key={i}>
        <div style={{...stylePdding, ...styleTopBot}}>{item.name}</div>
      </a>
    )
  })
  
  // 最初の10行のみを表示
  const displayValue = val ? val.split('\n').slice(0, 10).join('\n') : '';
  const totalLines = val ? val.split('\n').length : 0;
  
  return (
    <div>
      <button 
        onClick={handleToggle} 
        style={{padding: '8px 16px', cursor: 'pointer', marginBottom: 8}}
      >
        {isVisible ? '算定データエクスポートを閉じる' : '算定データエクスポートを開く'}
      </button>
      {isVisible && (
        <div>
          <div style={{...stylePdding}}>{links}</div>
          {val && (
            <div style={{...stylePdding}}>
              <div style={{display: 'flex', alignItems: 'center', marginBottom: 8, gap: 16}}>
                <span>表示: 10行 / 全{totalLines}行</span>
                <button onClick={handleCopy} style={{padding: '4px 12px', cursor: 'pointer'}}>
                  コピー
                </button>
              </div>
              <pre style={{
                ...stylePdding, 
                width: '100%', 
                border: '1px solid #ccc',
                backgroundColor: '#f5f5f5',
                overflow: 'auto',
                whiteSpace: 'pre',
                fontFamily: 'monospace',
                fontSize: '12px'
              }}>
                {displayValue}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
