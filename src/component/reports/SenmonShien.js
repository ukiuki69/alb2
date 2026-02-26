import { makeStyles } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getLodingStatus } from '../../commonModule';
import { univApiCall } from '../../albCommonModule';
import SnackMsg from '../common/SnackMsg';
import { SenmonShienSheet } from './Sheets/SenmonShienSheet';

const useStyles = makeStyles({
  sheets: {
    '& > div, & > table': {
      marginTop: 32
    },
    '@media print': {
      '& > div, & > table': {
        margin: 0,
        '&:not(:last-child)': {
          breakAfter: 'page'
        }
      },
    }
  }
});

export const SenmonShien = (props) => {
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const {users, service, hid, bid, stdDate, com} = allState;
  const hideGuardianSign = com?.ext?.reportsSetting?.usersPlan?.senmonShienHideGuardianSign ?? false;
  const classes = useStyles();
  const {userList, preview, created} = props;

  const [snack, setSnack] = useState({});
  const [dataList, setDataList] = useState([]);

  useEffect(() => {
    const isMounted = { current: true };  // useRefのようにオブジェクトリファレンスとして管理
    const limit = users.length + 50;
    const fetchData = async () => {
      try {
        // const month = stdDate.slice(0, 7);
        const prms = {a: 'fetchUsersPlan', hid, bid, item: 'senmonShien', limit};
        const res = await univApiCall(prms, 'E23441', '', setSnack);
        
        // API呼び出し後もコンポーネントがマウントされていることを確認
        if (isMounted.current && res && res?.data?.result) {
          const newDataList = (res.data?.dt ?? []).map(item => {
            const newData = item.content ?? {};
            newData.created = item.created;
            return newData;
          });
          setDataList(newDataList);
        }
      } catch (error) {
        // エラーハンドリング（必要に応じて）
        if (isMounted.current) {
          console.error('データ取得エラー:', error);
        }
      }
    };
    
    // データがまだロードされており、allPersonalDataが空配列の場合のみ実行
    if (loadingStatus.loaded && (!dataList || dataList.length === 0)){
      fetchData();
    }
    
    return () => {
      isMounted.current = false;  // クリーンアップ時に参照を更新
    };
  }, [loadingStatus.loaded, stdDate, hid, bid]);  // allPersonalDataは依存配列から除外

  if(!preview.includes('専門的支援実施計画')) return null;

  const filteredData = dataList.filter(data => {
    if(!data.uid || !data.content) return false;
    const [stdYear, stdMonth] = stdDate.split("-");
    const lastDate = new Date(parseInt(stdYear), parseInt(stdMonth), -1).getDate();
    const prevCreated = data?.created;
    if(!prevCreated) return false;
    if(created && prevCreated !== created) return false;
    if(!created && prevCreated < stdDate) return false;
    if(!created && `${stdYear}-${stdMonth}-${String(lastDate).padStart(2, '0')}` < prevCreated) return false;
    const uid = data.uid;
    if(!userList.find(dt => dt.uid === uid).checked) return false;
    const user = users.find(u => u.uid === uid);
    if(!user) return false;
    if(service && !new RegExp(service).test(user.service)) return false;
    return true;
  });

  // 署名欄が非表示設定なのに保護者サインが存在する場合の警告
  const hasAnySignUrl = filteredData.some(data => data?.content?.signUrl);
  const showSignWarning = hideGuardianSign && hasAnySignUrl;

  const sheets = filteredData.map((data, i) => {
    const uid = data.uid;
    const user = users.find(uDt => uDt.uid === uid);
    const content = data?.content ?? {};
    const sheetProps = {user, content, created: data.created};
    return(<SenmonShienSheet key={`SenmonShienSheet${i}`} {...sheetProps} />);
  });

  return(
    <>
    <div className={classes.sheets}>
      {showSignWarning && (
        <div className='noprint' style={{
          fontSize: '1.5rem', fontWeight: 'bold', color: '#ff9800',
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          pointerEvents: 'none', zIndex: 1000,
          backgroundColor: '#ffffffcc', padding: '16px 32px', borderRadius: 8,
          textAlign: 'center',
        }}>
          署名欄が非表示ですが保護者サインが存在します<br />
          <span style={{fontSize: '1rem', fontWeight: 300}}>
            印刷設定から署名欄の表示を有効にしてください
          </span>
        </div>
      )}
      {sheets}
    </div>
    <SnackMsg {...snack} />
    </>
  )
}