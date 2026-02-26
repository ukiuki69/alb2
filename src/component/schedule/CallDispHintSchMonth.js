import React,{useState, useEffect} from 'react';
import { DisplayHintGroups } from '../common/DisplayHintGroupes';
import { useSelector } from 'react-redux';
import { getLocalStorage } from '../../modules/localStrageOprations';
import { getLodingStatus } from '../../commonModule';
import { getClassrooms } from '../../albCommonModule';


const CallDispHintSchMonth = () => {
  // - text: 表示するテキスト（stringまたはstringの配列）
  // - links: 関連情報へのリンク（stringの配列）
  // - left, top, bottom, right: 表示位置（ピクセル単位）
  // - wdth: 表示幅（初期値200px）
  // - id: ヒントのID
  // - hideHint: ヒントを表示するかどうかを指定するフラグ

  // const {text, links, left, top, bottom, right, wdth = 200, id, hideHint} = props;
  const allState = useSelector(s=>s);
  const {users, serviceItems, account} = allState;
  const ls = getLodingStatus(allState);
  if (!ls.loaded || ls.error) return null;
  const clasrooms = getClassrooms(users);
  // 複数単位または多機能
  const isMulti = (clasrooms.length > 1 || serviceItems.length > 1);
  const src = [
    {
      text: '利用者名の右寄りをクリックすると利用者別メニューが表示されます。上部の日付をクリックすると日毎のメニューが表示されます。',
      id: '001',

    },
    {
      text: '予定実績の編集は複数のパソコンで同時に実施できます。ですが同じ利用者を同時に編集するとデータが上書きされてしまうことがあります。',
      id: '002',

    },
    {
      text: 'マウスカーソルに追随して利用者と日付が緑色にマーキングされます。動作が重くなってしまうとき、煩わしいときは設定で表示をオフにすることが出来ます。',
      links: ['https://houday.rbatos.com/#/setting/others:~:text=%E7%A7%BB%E5%8B%95%E3%81%97%E3%81%BE%E3%81%99-,%E4%BA%88%E5%AE%9A%E5%AE%9F%E7%B8%BE%E2%80%90%E6%9C%88%E9%96%93%E3%81%AE%E3%83%9E%E3%83%BC%E3%82%AB%E3%83%BC%E8%A1%A8%E7%A4%BA%E3%82%92%E3%81%97%E3%81%BE%E3%81%9B%E3%82%93,-%E3%83%92%E3%83%B3%E3%83%88%E3%81%AE%E8%A1%A8%E7%A4%BA'],
      id: '003',
    },
    {
      text: '薄い色で表示されている予定実績は別単位やサービスなどで設定されています。単位切り替え等を行えば消去できます。また、利用者予定全削除でも削除することが出来ます。',
      id: '004',
      onlyMulti: true, // 複数サービスまたは複数単位のみ表示
    },
    {
      text: '右下、ボタンに書いてあるアルファベットはキーボードショートカットです。キーを押すとボタンをクリックしたのと同じ機能になります。',
      id: '005',
    }
  ]
  const hintList = src.filter(e=>isMulti || !e.onlyMulti);
  // console.log(hintList.length, 'hintList.length');
  const idBase = 'schMonth';
  const commonPrms = {bottom: 88, right: 24, }
  const p = {hintList, idBase, commonPrms, }
  return (
    <DisplayHintGroups {...p} />
  )
}
export default CallDispHintSchMonth;