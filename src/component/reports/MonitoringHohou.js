import { makeStyles } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { univApiCall } from '../../albCommonModule';
import { getLodingStatus } from '../../commonModule';
import { MonitoringSheet } from './Sheets/MonitoringSheet';
import SnackMsg from '../common/SnackMsg';
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

export const MonitoringHohou = (props) => {
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const {users, service, hid, bid, stdDate} = allState;
  const classes = useStyles();
  const {userList, preview, created} = props;

  const [snack, setSnack] = useState({});
  const [dataList, setDataList] = useState([]);

  useEffect(() => {
    const isMounted = { current: true };
    const limit = users.length + 50;
    const fetchData = async () => {
      try {
        const prms = {a: 'fetchUsersPlan', hid, bid, item: 'monitoringHohou', limit};
        const res = await univApiCall(prms, 'E23441', '', setSnack);
        
        if (isMounted.current && res && res?.data?.result) {
          const newDataList = (res.data?.dt ?? []).map(item => {
            const newData = item.content ?? {};
            newData.created = item.created;
            return newData;
          });
          setDataList(newDataList);
        }
      } catch (error) {
        if (isMounted.current) {
          console.error('MonitoringHohou データ取得エラー:', error);
        }
      }
    };
    
    if (loadingStatus.loaded && (!dataList || dataList.length === 0)){
      fetchData();
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [loadingStatus.loaded, stdDate, hid, bid]);

  if(!preview.includes('モニタリング') || !preview.includes('保訪')) return null;

  const normalizePersonalSupportContent = (pSContent, monitoringContent) => {
    const base = pSContent ?? {};
    const supportGoals = Array.isArray(base["支援目標"]) ? base["支援目標"] : [];

    // 保訪データの旧形式・差分形式を吸収して、MonitoringSheetの期待形式にそろえる
    const normalizedGoals = supportGoals.map((goal, idx) => {
      const source = goal ?? {};
      return {
        ...source,
        "項目": source["項目"] || source["ニーズ"] || source["本人のニーズ等"] || '',
        "支援目標":
          source["支援目標"] ||
          source["具体的な達成目標"] ||
          source["達成目標"] ||
          source["支援内容"] ||
          '',
      };
    });

    // 目標件数が不足していても行数がずれないように、支援経過の件数ぶん補完する
    const progressRows = Array.isArray(monitoringContent?.["支援経過"]) ? monitoringContent["支援経過"] : [];
    while (normalizedGoals.length < progressRows.length) {
      normalizedGoals.push({ "項目": '', "支援目標": '' });
    }

    return {
      ...base,
      "支援目標": normalizedGoals,
    };
  };

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
    const pSContent = normalizePersonalSupportContent(data.personalSupportContent, content);
    const sheetProps = {user, content, created, pSContent, titleSuffix: '（保訪）'};
    return(
      <MonitoringSheet key={`MonitoringHohouSheet${i}`} {...sheetProps} />
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
