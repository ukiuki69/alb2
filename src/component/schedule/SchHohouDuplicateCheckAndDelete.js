import React, { useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import { Button, Paper, Typography, Box, Chip, CircularProgress } from '@material-ui/core';
import { teal, grey, red, green } from '@material-ui/core/colors';
import * as comMod from '../../commonModule';
import { HOHOU } from '../../modules/contants';
import { univApiCall } from '../../albCommonModule';
import * as Actions from '../../Actions';
import { getLSTS, setLSTS } from '../../modules/localStrageOprations';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(1),
    maxWidth: 500,
    margin: '0 0px 60px 60px',
  },
  title: {
    marginBottom: theme.spacing(1.5),
    fontWeight: 600,
    fontSize: '1rem',
    color: teal[700],
    magintop: 16,
  },
  duplicateList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1.5),
    marginBottom: theme.spacing(1.5),
    alignItems: 'center',
  },
  userItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },
  userName: {
    fontSize: '0.875rem',
  },
  countChip: {
    backgroundColor: red[100],
    color: red[900],
    fontWeight: 600,
    height: 20,
    fontSize: '0.75rem',
  },
  deleteButton: {
    backgroundColor: red[500],
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.875rem',
    padding: '6px 16px',
    '&:hover': {
      backgroundColor: red[700],
    },
    '&:disabled': {
      backgroundColor: grey[300],
    },
  },
  successButton: {
    backgroundColor: green[500],
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.875rem',
    padding: '6px 16px',
  },
  buttonProgress: {
    marginLeft: theme.spacing(1),
  },
  noDataMessage: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: grey[600],
    fontSize: '0.875rem',
  },
  summary: {
    marginBottom: theme.spacing(1),
    padding: theme.spacing(1),
    backgroundColor: teal[50],
    borderRadius: theme.spacing(0.5),
    border: `1px solid ${teal[200]}`,
    fontSize: '0.875rem',
  },
}));

/**
 * 保育所等訪問支援の重複スケジュールをチェックして削除するコンポーネント
 * D20251101とD20251101Hのように、Hなしとありの両方が存在し、
 * 両方のサービスが「保育所等訪問支援」である場合、Hなしを削除対象とする
 * 
 * 表示条件:
 * - permission === 100 (デベロッパー)
 * - serviceItemsにHOHOU(保育所等訪問支援)が含まれている
 * 
 * @param {Object} props.style - rootに適用するスタイル（オプション）
 * @param {boolean} props.onlyWhenServiceIsHohou - trueの場合、serviceがHOHOUの時のみ表示（Sch2用）
 */
const SchHohouDuplicateCheckAndDelete = ({ style, onlyWhenServiceIsHohou = false }) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const schedule = useSelector((state) => state.schedule);
  const users = useSelector((state) => state.users);
  const account = useSelector((state) => state.account);
  const serviceItems = useSelector((state) => state.serviceItems);
  const service = useSelector((state) => state.service);
  const stdDate = useSelector((state) => state.stdDate);
  const hid = useSelector((state) => state.hid);
  const bid = useSelector((state) => state.bid);
  
  // ローカルストレージのキー名（hid, bid, stdDateを含める）
  const lsKey = `hohouDuplicateDeleted_${hid}_${bid}_${stdDate}`;
  const expirationSeconds = 600; // 10分 = 600秒
  
  // ローディング状態
  const [loading, setLoading] = useState(false);
  
  // ローカルストレージから削除完了フラグを取得
  const deletedFromLS = getLSTS(lsKey, expirationSeconds);
  
  // permissionをチェック
  const permission = comMod.parsePermission(account)[0][0];
  
  // 表示条件
  // onlyWhenServiceIsHohouがtrueの場合: serviceがHOHOUの時のみ表示
  // onlyWhenServiceIsHohouがfalseの場合: serviceItemsにHOHOUが含まれている時に表示
  const shouldDisplay = onlyWhenServiceIsHohou 
    ? service === HOHOU
    : serviceItems.includes(HOHOU);
    // && permission === 100;
  // 重複データを検出（Hooksは必ず条件分岐より前に呼ぶ）
  const duplicates = useMemo(() => {
    if (!shouldDisplay) return [];
    if (!schedule) return [];
    const duplicateList = [];
    Object.keys(schedule).forEach((uid) => {
      const userSchedule = schedule[uid];
      if (!userSchedule || typeof userSchedule !== 'object') return;
      const didsToDelete = [];
      // did一覧を取得
      const dids = Object.keys(userSchedule);

      // Hなしのdidをチェック
      dids.forEach((did) => {
        // 末尾にHがついていない場合のみチェック
        if (!did.endsWith('H')) {
          const didWithH = did + 'H';

          // 対応するHありのdidが存在するかチェック
          if (dids.includes(didWithH)) {
            const scheduleWithoutH = userSchedule[did];
            const scheduleWithH = userSchedule[didWithH];

            // 両方のサービスが「保育所等訪問支援」かチェック
            if (
              scheduleWithoutH?.service === HOHOU &&
              scheduleWithH?.service === HOHOU
            ) {
              didsToDelete.push(did);
            }
          }
        }
      });

      // 重複が見つかった場合、リストに追加
      if (didsToDelete.length > 0) {
        const user = comMod.getUser(uid, users);
        duplicateList.push({
          uid,
          userName: user?.name || '不明',
          count: didsToDelete.length,
          didsToDelete,
        });
      }
    });

    return duplicateList;
  }, [schedule, users, shouldDisplay]);
  
  // 成功フラグの判定: 重複データがない場合のみ削除完了フラグを参照
  // 重複データがある場合は、successをfalseにして削除を可能にする
  const success = duplicates.length === 0 && deletedFromLS === true;
  
  // 条件を満たさない場合は何も表示しない
  if (!shouldDisplay) {
    return null;
  }

  // 削除実行ハンドラー
  const handleDelete = async () => {
    if (loading || success) return;
    
    setLoading(true);
    
    try {
      // 削除対象のUID以下を新しいオブジェクトにコピー（削除対象のdidを除外）
      const partOfSch = {};
      
      duplicates.forEach((item) => {
        const { uid, didsToDelete } = item;
        const userSchedule = schedule[uid];
        
        if (userSchedule) {
          // このユーザーの削除後のスケジュールを作成
          const newUserSchedule = {};
          
          Object.keys(userSchedule).forEach((did) => {
            // 削除対象のdidでない場合のみコピー
            if (!didsToDelete.includes(did)) {
              newUserSchedule[did] = userSchedule[did];
            }
          });
          
          partOfSch[uid] = newUserSchedule;
        }
      });
      
      // sendPartOfSchedule APIを使って送信
      const params = {
        hid,
        bid,
        date: stdDate,
        partOfSch,
        a: 'sendPartOfSchedule',
      };
      
      const res = await univApiCall(
        params,
        'E-HOHOU-DEL',
        '',
        null,
        '重複データを削除しました。',
        '削除に失敗しました。'
      );
      
      if (res?.data?.result) {
        // 成功: 元のスケジュールと削除済オブジェクトをマージしてディスパッチ
        const newSchedule = { ...schedule, ...partOfSch };
        newSchedule.timestamp = new Date().getTime();
        dispatch(Actions.setStore({ schedule: newSchedule }));
        
        // ローカルストレージに削除完了フラグを保存（10分間有効）
        setLSTS(lsKey, true);
        
        setLoading(false);
        
        // スナックバーメッセージを表示
        dispatch(Actions.setSnackMsg('重複データを削除しました。', 'success'));
      } else {
        throw new Error('API returned false result');
      }
    } catch (error) {
      console.error('削除エラー:', error);
      setLoading(false);
      dispatch(Actions.setSnackMsg('削除に失敗しました。', 'error'));
    }
  };

  // 重複がない場合 かつ 削除完了フラグもない場合はnullを返す
  if (duplicates.length === 0 && !success) {
    return null;
  }

  // 削除完了後で重複がない場合は完了メッセージのみ表示
  if (duplicates.length === 0 && success) {
    return (
      <Paper className={classes.root} elevation={1} style={style}>
        <Typography variant="h6" className={classes.title}>
          保育所等訪問支援 重複データチェック
        </Typography>

        <Box className={classes.summary}>
          <Typography variant="body2" style={{ color: green[700] }}>
            <strong>✓</strong> 重複したデータを削除しました
          </Typography>
        </Box>
      </Paper>
    );
  }

  // 合計件数を計算
  const totalCount = duplicates.reduce((sum, item) => sum + item.count, 0);

  return (
    <Paper className={classes.root} elevation={1} style={style}>
      <Typography variant="h6" className={classes.title}>
        保育所等訪問支援 重複データチェック
      </Typography>

      <Box className={classes.summary}>
        <Typography variant="body2">
          <strong>{duplicates.length}名</strong>のユーザーで
          <strong> {totalCount}件</strong>の重複データが見つかりました
        </Typography>
      </Box>

      <div className={classes.duplicateList}>
        {duplicates.map((item) => (
          <div key={item.uid} className={classes.userItem}>
            <span className={classes.userName}>{item.userName}</span>
            <Chip
              label={`${item.count}件`}
              size="small"
              className={classes.countChip}
            />
          </div>
        ))}
      </div>

      <Box display="flex" justifyContent="center" alignItems="center">
        <Button
          variant="contained"
          className={success ? classes.successButton : classes.deleteButton}
          onClick={handleDelete}
          size="small"
          disabled={loading || success}
        >
          {success ? '削除完了' : loading ? '削除中...' : '重複データを削除する'}
        </Button>
        {loading && <CircularProgress size={20} className={classes.buttonProgress} />}
      </Box>
    </Paper>
  );
};

export default SchHohouDuplicateCheckAndDelete;

