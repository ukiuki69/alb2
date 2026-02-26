import React,{useState, useEffect} from 'react';
import { DisplayHintGroups } from '../common/DisplayHintGroupes';


const CallDispHintUsers = () => {
  // - text: 表示するテキスト（stringまたはstringの配列）
  // - links: 関連情報へのリンク（stringの配列）
  // - left, top, bottom, right: 表示位置（ピクセル単位）
  // - wdth: 表示幅（初期値200px）
  // - id: ヒントのID
  // - hideHint: ヒントを表示するかどうかを指定するフラグ

  // const {text, links, left, top, bottom, right, wdth = 200, id, hideHint} = props;
  const hintList = [
    {
      text: 'このヒントがうるさいと感じるときはヒントの最小化やヒントの非表示が出来ます。',
      id: '001',
      links:['https://houday.rbatos.com/#/setting/others:~:text=%E3%82%92%E3%81%97%E3%81%BE%E3%81%9B%E3%82%93-,%E3%83%92%E3%83%B3%E3%83%88%E3%81%AE,-%E8%A1%A8%E7%A4%BA%E3%82%92%E6%9C%80%E5%B0%8F'],
      imgWidth: 120

    },
    {
      text: '利用者の並び替えが出来ます。個別の並び替えと50音順などの一括並び替えが出来ます。',
      id: '002',
      img: 'https://rbatos.com/lp/wp-content/uploads/2023/08/447ed9990f0346d273a40d4ed5edffdd.jpg',
      imgWidth: 120

    },
    {
      text: 'ご利用者が利用停止になったときは編集画面で利用停止ボタンを押して下さい。当月の請求には影響しませんが次月から表示されなくなります。名前表示にさよならマークが付きます。',
      id: '003',
      img: 'https://rbatos.com/lp/wp-content/uploads/2023/08/5b5ef26fa2279bbe8229c6aa8f336225.jpg',
      imgWidth: 120

    },
    {
      text: '支給決定期間の終了日を契約終了日として入力することをお勧めします。終了日が近づくとビックリマークで知らせてくれます。',
      id: '004',
      img: 'https://rbatos.com/lp/wp-content/uploads/2023/08/d705fa6536fee086dae9e90bb337cd4b.jpg',
      imgWidth: 120
    },
    {
      text: '右下、ボタンに書いてあるアルファベットはキーボードショートカットです。キーを押すとボタンをクリックしたのと同じ機能になります。',
      id: '005',
      img: 'https://rbatos.com/lp/wp-content/uploads/2023/08/8b363548aa706b8dbffc702481ec4bcc.jpg',

    }
  ]
  const idBase = 'billing';
  const commonPrms = {bottom: 88, right: 24, }
  const p = {hintList, idBase, commonPrms, }
  return (
    <DisplayHintGroups {...p} />
  )
}
export default CallDispHintUsers;
