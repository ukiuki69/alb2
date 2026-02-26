import React from 'react';
import { makeStyles } from '@material-ui/core';
import { useSelector } from 'react-redux';

const useStyles = makeStyles({
  sheet: {
    width: '100%',
    marginBottom: 32,
    '& > thead': {
      display: 'table-row-group',
      '& > tr > td': { padding: '4px 0' },
      '& .name': { fontSize: '24px', fontWeight: 'bold' }
    },
    '& .bname, .service, .createDate': {
      padding: '4px'
    },
    '@media print': {
      pageBreakAfter: 'avoid',
      breakAfter: 'avoid',
    }
  }
});

/**
 * 個別支援計画関連書類の共通ヘッダーコンポーネント
 * @param {Object} user - ユーザー情報
 * @param {string} created - 作成日（YYYY-MM-DD形式）
 * @param {string} title - シートのタイトル（例：「アセスメントシート」）
 * @param {string} titleSuffix - タイトルの後ろに追加する文字列（例：「（原案）」）
 * @param {boolean} isThreeColumn - 3列レイアウトの場合true（デフォルトはfalse：2列）
 */
export const SheetHeader = ({ user, created, title, titleSuffix = '', isThreeColumn = false }) => {
  const classes = useStyles();
  const com = useSelector(state => state.com);
  const hideAddress = com?.ext?.reportsSetting?.usersPlan?.hideAddress ?? com?.etc?.configReports?.usersPlan?.hideAddress ?? false;
  
  
  const smallSt = { fontSize: '1rem' };
  const [createdYear, createdMonth, createdDate] = created.split("-");
  const [birthdayYear, birthdayMonth, birthdayDate] = (user?.birthday ?? "").split("-");

  // 3列レイアウトの場合のcolSpan設定
  const titleColSpan = isThreeColumn ? 3 : 2;
  const leftColSpan = isThreeColumn ? 2 : 1;

  return (
    <table className={classes.sheet}>
      <thead>
        <tr>
          <td colSpan={titleColSpan} className='name'>
            {user.name}さん<span style={smallSt}>の{title}</span>{titleSuffix}
          </td>
        </tr>
        <tr>
          <td colSpan={leftColSpan}>生年月日　　：{birthdayYear && birthdayMonth && birthdayDate ? `${birthdayYear}年${birthdayMonth}月${birthdayDate}日` : ""}（{user.ageStr}・{user.age}歳）</td>
          <td className='createDate'>作成日：{createdYear}年{createdMonth}月{createdDate}日</td>
        </tr>
        <tr>
          <td colSpan={leftColSpan}>受給者証番号：{user.hno ?? ""}</td>
          <td className='bname'>施設名：{user?.bname ?? ""}</td>
        </tr>
        <tr>
          <td colSpan={leftColSpan}>{!hideAddress && user.postal ? `住所　　　　：〒${user.postal}` : ""}</td>
          <td className='service'>利用サービス：{user?.service ?? ""}</td>
        </tr>
        {!hideAddress && Boolean(user.city || user.address) && (
          <tr>
            <td colSpan={leftColSpan}>　　　　　　　{user.city ?? ""}{user.address ?? ""}</td>
            <td></td>
          </tr>
        )}
      </thead>
    </table>
  );
};

