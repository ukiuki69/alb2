import { makeStyles } from '@material-ui/core';
import { red, teal } from '@material-ui/core/colors';
import React from 'react';
import { useSelector } from 'react-redux';

const useStyles = makeStyles({
  root: {
    width: 400,
    margin: '24px auto 96px',
    '& h3': {
      padding: 8,
      borderBottom: `1px solid ${red[500]}`,
      backgroundColor: red[50],
      fontWeight: 300,
      marginBottom: 4,
    },
    '& p': {
      padding: '8px 4px',
    },
  },
});

export const ProseedJougenJigyousyoChk = () => {
  const classes = useStyles();
  const schedule = useSelector((state) => state.schedule);
  const users = useSelector((state) => state.users);

  const diffResults = users.map((user) => {
      // schedule側のデータはキー "UID{uid}" で取得
      const schedData = schedule['UID' + user.uid];
      if (!schedData) return null;

      // schedule側とuser側は「管理事業所」または「協力事業所」のどちらかを使用
      const schedOffice =
        schedData['管理事業所'] || schedData['協力事業所'];
      const userOffice = user.etc && (
        user.kanri_type === '管理事業所' ? user.etc['協力事業所'] : 
        user.kanri_type === '協力事業所' ? user.etc['管理事業所'] : 
        null
      );
      if (!schedOffice || !userOffice) return null;

      let differences = [];

      // まずは、各配列を「name」と「no」をキーにしたMapに変換する
      const buildMap = (officeArray) =>
        officeArray.reduce((map, item) => {
          const key = `${item.name}_${item.no}`;
          map.set(key, item);
          return map;
        }, new Map());

      const schedMap = buildMap(schedOffice);
      const userMap = buildMap(userOffice);

      // schedule側の各要素について、user側に存在するかをチェック（プロパティの比較は行わない）
      schedMap.forEach((schedItem, key) => {
        if (!userMap.has(key)) {
          differences.push(
            `scheduleに存在するがuserに存在しない要素: ${key}`
          );
        }
      });

      // user側にあってschedule側に無い要素をチェック
      userMap.forEach((userItem, key) => {
        if (!schedMap.has(key)) {
          differences.push(
            `userに存在するがscheduleに存在しない要素: ${key}`
          );
        }
      });

      // 両配列に同じ要素が含まれている場合、順番の違いもチェック
      const schedKeys = schedOffice.map(
        (item) => `${item.name}_${item.no}`
      );
      const userKeys = userOffice.map(
        (item) => `${item.name}_${item.no}`
      );

      // 要素数が同じ場合のみ順番を比較
      if (schedKeys.length === userKeys.length) {
        for (let i = 0; i < schedKeys.length; i++) {
          if (schedKeys[i] !== userKeys[i]) {
            differences.push(
              `配列の順番が異なります: index ${i} schedule(${schedKeys[i]}) vs user(${userKeys[i]})`
            );
          }
        }
      }

      return differences.length > 0 ? { user, differences } : null;
    })
    .filter((item) => item !== null);

    if (diffResults.length === 0) {
      return null;
    }

    return (
    <div className={classes.root}>
      <>
        <h3>上限管理情報に不整合があります</h3>
        {diffResults.map((result, idx) => {
          // ユーザーの事業所情報から、管理事業所が登録されていれば「管理」、なければ「協力」とする
          const officeType = result.user.etc && result.user.etc['管理事業所'] ? "管理" : "協力";
          // differences 配列の中で、「順番が異なります」という文言以外が１件でもあれば、不整合として扱う
          const hasNonOrderDiff = result.differences.some(d => !d.includes("順番が異なります"));
          // 違いの内容に応じて出力するメッセージを切り替え
          const message = hasNonOrderDiff
                          ? `${officeType}事業所番号等の不整合`
                          : `${officeType}事業所の順番相違`;
          return (<>
            <div key={idx} style={{ paddingLeft: 8 }}>
              <p>{`${result.user.name}: ${message}`}</p>
            </div>
            <p style={{ padding: '8px 12px', lineHeight: 1.5, fontSize: '.8rem', textAlign: 'justify'}}>
              前月以前に管理事業所・協力事業所の情報編集があると、このメッセージが表される場合があります。該当利用者の上限管理情報を一度開いて、事業所番号等を確認してから保存して下さい。
            </p>
            </>
          );
        })}
      </>
    </div>
  );
};
