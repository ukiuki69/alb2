import { makeStyles } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { univApiCall } from '../../albCommonModule';
import { getLodingStatus } from '../../commonModule';
import { MonitoringSheet } from './Sheets/MonitoringSheet';
import SnackMsg from '../common/SnackMsg';
import { LoadingSpinner } from '../common/commonParts';
import { red } from '@material-ui/core/colors';

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
    },
    '& .noData': {
      textAlign: 'center', fontWeight: 'bold', color: red['A700'],
      fontSize: 20, lineHeight: '30px',
      marginTop: 120,
    }
  }
});

export const Monitoring = (props) => {
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const {users, service, hid, bid, stdDate} = allState;
  const classes = useStyles();
  const {userList, preview, created} = props;

  const [snack, setSnack] = useState({});
  const [dataList, setDataList] = useState(null);

  useEffect(() => {
    const isMounted = { current: true };  // useRefのようにオブジェクトリファレンスとして管理
    const limit = users.length + 50;
    const fetchData = async () => {
      try {
        const prms = {a: 'fetchUsersPlan', hid, bid, item: 'monitoring', limit};
        const res = await univApiCall(prms, 'E23441', '', setSnack);
        
        // API呼び出し後もコンポーネントがマウントされていることを確認
        if (isMounted.current && res && res?.data?.result) {
          const newDataList = (res.data?.dt ?? []).map(item => {
            const newData = item.content ?? {};
            newData.created = item.created;
            return newData;
          });
          console.log("newDataList", newDataList)
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

  if(preview !== 'モニタリング表') return null;
  if(!dataList) return( <LoadingSpinner /> );

  const sheets = dataList.filter(data => {
    if(!data.uid || !data.content || !data.created) return false;
    const [stdYear, stdMonth] = stdDate.split("-");
    const lastDate = new Date(parseInt(stdYear), parseInt(stdMonth), -1).getDate();
    const prevCreated = data.created;
    if(!prevCreated) return false;
    if(created && prevCreated !== created) return false;
    if(!created && prevCreated < stdDate) return false;
    if(!created && `${stdYear}-${stdMonth}-${String(lastDate).padStart(2, '0')}` < prevCreated) return false;
    const uid = data.uid;
    if(!userList.find(dt => dt.uid === uid)?.checked) return false;
    const user = users.find(u => u.uid === uid);
    if(!user) return false;
    if(service && !new RegExp(service).test(user.service)) return false;
    return true;
  }).map((data, i) => {
    const uid = data.uid;
    const user = users.find(uDt => uDt.uid === uid);
    const content = data.content ?? {};
    const created = data.created;
    const pSContent = data.personalSupportContent;
    const sheetProps = {user, content, created, pSContent};
    return(
      <MonitoringSheet key={`AssessmentSheet${i}`} {...sheetProps} />
    )
  });

  return(
    <>
    <div className={classes.sheets}>
      {!sheets.length &&(
        <div className='noData'>利用者情報が見つかりません。<br />サービスや単位の設定を見直して下さい。</div>
      )}
      {sheets.length>0 &&sheets}
    </div>
    <SnackMsg {...snack} />
    </>
  )
}