import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Button, Checkbox, Paper, Typography, Box, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import { setBillInfoToSch } from './blMakeData';
import { univApiCallJson, univApiCall } from '../../albCommonModule';
import { rev } from '../../Rev';
import { getLS, setLS } from '../../modules/localStrageOprations';
import * as comMod from '../../commonModule';

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: 96, marginLeft: 84,
    padding: theme.spacing(3),
    '& .MuiTableCell-root': {
      padding: 0,
      fontSize: '0.875rem',
    },
    '& .MuiTableCell-head': {
      padding: '8px',
      fontSize: '0.875rem',
      fontWeight: 600,
    },
    '& .MuiTableCell-body': {
      padding: '4px 8px',
    },
  },
  section: {
    marginBottom: theme.spacing(4),
  },
  table: {
    minWidth: 650,
  },
  compareButton: {
    marginTop: theme.spacing(2),
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(4),
  },
  error: {
    color: theme.palette.error.main,
  },
  success: {
    color: theme.palette.success.main,
  },
  diffDetail: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.grey[100],
  },
  noPrint: {
    '@media print': {
      display: 'none !important',
    },
  },
}));

const STORAGE_KEY = 'billingDtCompare_checkedList';
const API_SECRET = 'fqgjlAAS4Mjb9lYUJPRBfV6hVLZHab'; // APIのsecretキー
const DEBUG_MODE = false; // true: エラーをそのまま表示, false: try-catchでラップ

// サブコンポーネント: アカウントリストテーブル
const AccountListTable = ({ accountLst, checkedList, onCheckChange, onCheckAll, classes }) => {
  // 全選択の状態を計算
  const allChecked = accountLst && accountLst.length > 0 && 
    accountLst.every(account => checkedList[`${account.hid}_${account.bid}`]);
  const someChecked = accountLst && accountLst.some(account => checkedList[`${account.hid}_${account.bid}`]);
  
  return (
    <TableContainer>
      <Table className={classes.table}>
        <TableHead>
          <TableRow>
            <TableCell>
              <Checkbox
                checked={allChecked}
                indeterminate={someChecked && !allChecked}
                onChange={onCheckAll}
              />
            </TableCell>
            <TableCell>法人ID</TableCell>
            <TableCell>事業所ID</TableCell>
            <TableCell>法人名</TableCell>
            <TableCell>事業所名</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {accountLst && accountLst.map((account, index) => {
            const key = `${account.hid}_${account.bid}`;
            return (
              <TableRow key={index}>
                <TableCell>
                  <Checkbox
                    checked={!!checkedList[key]}
                    onChange={() => onCheckChange(account.hid, account.bid)}
                  />
                </TableCell>
                <TableCell>{account.hid}</TableCell>
                <TableCell>{account.bid}</TableCell>
                <TableCell>{account.shname}</TableCell>
                <TableCell>{account.sbname}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableHead>
          <TableRow>
            <TableCell>
              <Checkbox
                checked={allChecked}
                indeterminate={someChecked && !allChecked}
                onChange={onCheckAll}
              />
            </TableCell>
            <TableCell>法人ID</TableCell>
            <TableCell>事業所ID</TableCell>
            <TableCell>法人名</TableCell>
            <TableCell>事業所名</TableCell>
          </TableRow>
        </TableHead>
      </Table>
    </TableContainer>
  );
};

// サブコンポーネント: 比較可能なデータリスト
const ComparableDataList = ({ comparableList }) => {
  if (comparableList.length === 0) return null;

  return (
    <Box mt={2}>
      <Typography variant="body1" gutterBottom>
        比較可能なデータ:
      </Typography>
      <Box display="flex" flexWrap="wrap" gap={1}>
        {comparableList.map((item, index) => (
          <Chip
            key={index}
            label={`${item.shname} - ${item.sbname} (Rev: ${item.revList.join(', ')})`}
            color="primary"
            variant="outlined"
          />
        ))}
      </Box>
    </Box>
  );
};

// サブコンポーネント: 比較結果テーブル
const CompareResultTable = ({ compareResult, onToggleDetail, expandedDetails, classes }) => {
  if (compareResult.length === 0) return null;

  return (
    <Box mt={2}>
      <Typography variant="body1" gutterBottom>
        比較結果:
      </Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>法人名</TableCell>
              <TableCell>事業所名</TableCell>
              <TableCell>Rev1</TableCell>
              <TableCell>Rev2</TableCell>
              <TableCell>状態</TableCell>
              <TableCell>差異数</TableCell>
              <TableCell className={classes?.noPrint}>詳細</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {compareResult.map((result) => {
              const rowKey = `${result.hid}_${result.bid}`;
              return (
                <React.Fragment key={rowKey}>
                  <TableRow>
                    <TableCell>{result.shname}</TableCell>
                    <TableCell>{result.sbname}</TableCell>
                    <TableCell>{result.rev1}</TableCell>
                    <TableCell>{result.rev2}</TableCell>
                    <TableCell>
                      {result.hasDifference ? (
                        <Chip label="差異あり" color="secondary" size="small" />
                      ) : (
                        <Chip label="一致" color="primary" size="small" />
                      )}
                    </TableCell>
                    <TableCell>{result.differences.length}</TableCell>
                    <TableCell className={classes?.noPrint}>
                      <Button
                        size="small"
                        onClick={() => onToggleDetail(result)}
                        disabled={!result.hasDifference}
                      >
                        詳細
                      </Button>
                    </TableCell>
                  </TableRow>
                  {result.hasDifference && expandedDetails[rowKey] && (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <Box className={classes.diffDetail}>
                          <Typography variant="subtitle1">
                            差異詳細: {result.shname} - {result.sbname} (rev {result.rev1} vs rev {result.rev2})
                          </Typography>
                          {result.differences?.length > 0 ? (
                            result.differences.map((diff, diffIndex) => (
                              <DifferenceItem
                                key={`${rowKey}_${diffIndex}`}
                                diff={diff}
                                classes={classes}
                                rev1={result.rev1}
                                rev2={result.rev2}
                              />
                            ))
                          ) : (
                            <Typography variant="body2">
                              差異データがありません。
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

// サブコンポーネント: 差異詳細フラットテーブル
const DifferenceDetailFlatTable = ({ compareResult, classes, stdDate }) => {
  // 差異があるデータのみを抽出してフラット化
  const flatData = [];
  
  compareResult.forEach(result => {
    if (!result.hasDifference) return;
    
    result.differences.forEach(diff => {
      if (diff.type === 'missing') {
        // ユーザーが片方のrevに存在しない場合はスキップ
        return;
      }
      
      // itemDiffsがある場合、各サービスコードごとに行を追加
      if (diff.itemDiffs && diff.itemDiffs.length > 0) {
        diff.itemDiffs.forEach(itemDiff => {
          flatData.push({
            stdDate: stdDate,
            hid: result.hid,
            bid: result.bid,
            sbname: result.sbname,
            uid: diff.uid,
            userName: diff.name,
            serviceCode: itemDiff.s,
            serviceName: itemDiff.c,
            rev1: result.rev1,
            rev2: result.rev2,
            tanniNum1: itemDiff.tanniNum?.rev1,
            tanniNum2: itemDiff.tanniNum?.rev2,
          });
        });
      }
    });
  });

  if (flatData.length === 0) return null;

  // クリップボードにコピー
  const copyToClipboard = () => {
    // ヘッダー
    const headers = [
      '対象日', 'HID', 'BID', '事業所名', 'UID', 'ユーザー名', 
      'サービスコード', 'サービス名', `単位数(rev ${flatData[0]?.rev1})`, `単位数(rev ${flatData[0]?.rev2})`
    ];
    
    // データ行
    const rows = flatData.map(row => [
      row.stdDate, row.hid, row.bid, row.sbname, row.uid, row.userName,
      row.serviceCode, row.serviceName, 
      row.tanniNum1 !== undefined ? row.tanniNum1 : 'undefined',
      row.tanniNum2 !== undefined ? row.tanniNum2 : 'undefined'
    ]);

    // TSV形式（タブ区切り）に変換
    const content = [headers, ...rows].map(r => r.join('\t')).join('\n');

    // コピー実行
    navigator.clipboard.writeText(content)
      .then(() => alert('クリップボードにコピーしました（Excel等に貼り付け可能です）'))
      .catch(err => console.error('コピー失敗:', err));
  };

  return (
    <Box mt={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          差異詳細一覧
        </Typography>
        <Button 
          variant="outlined" 
          size="small" 
          className={classes.noPrint}
          onClick={copyToClipboard}
        >
          内容をコピー
        </Button>
      </Box>
      <TableContainer>
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell>対象日</TableCell>
              <TableCell>HID</TableCell>
              <TableCell>BID</TableCell>
              <TableCell>事業所名</TableCell>
              <TableCell>UID</TableCell>
              <TableCell>ユーザー名</TableCell>
              <TableCell>サービスコード</TableCell>
              <TableCell>サービス名</TableCell>
              <TableCell>単位数(rev {flatData[0]?.rev1})</TableCell>
              <TableCell>単位数(rev {flatData[0]?.rev2})</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {flatData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.stdDate}</TableCell>
                <TableCell>{row.hid}</TableCell>
                <TableCell>{row.bid}</TableCell>
                <TableCell>{row.sbname}</TableCell>
                <TableCell>{row.uid}</TableCell>
                <TableCell>{row.userName}</TableCell>
                <TableCell>{row.serviceCode}</TableCell>
                <TableCell>{row.serviceName}</TableCell>
                <TableCell>{row.tanniNum1 !== undefined ? row.tanniNum1 : 'undefined'}</TableCell>
                <TableCell>{row.tanniNum2 !== undefined ? row.tanniNum2 : 'undefined'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

// サブコンポーネント: 差異詳細アイテム
const DifferenceItem = ({ diff, classes, rev1, rev2 }) => {
  return (
    <Box className={classes.diffDetail}>
      <Typography variant="subtitle1">
        {diff.name} (UID: {diff.uid})
      </Typography>
      
      {diff.type === 'missing' ? (
        <Typography color="error">{diff.message}</Typography>
      ) : (
        <>
          <Typography>
            userSanteiTotal: {diff.userSanteiTotal.rev1} → {diff.userSanteiTotal.rev2}
          </Typography>
          <Typography>
            tanniTotal: {diff.tanniTotal.rev1} → {diff.tanniTotal.rev2}
          </Typography>
          <Typography>
            kanrikekkagaku: {diff.kanrikekkagaku.rev1} → {diff.kanrikekkagaku.rev2}
          </Typography>

          {diff.itemDiffs && diff.itemDiffs.length > 0 && (
            <ItemTotalDifferences itemDiffs={diff.itemDiffs} rev1={rev1} rev2={rev2} />
          )}
        </>
      )}
    </Box>
  );
};

// サブコンポーネント: itemTotal差異
const ItemTotalDifferences = ({ itemDiffs, rev1, rev2 }) => {
  return (
    <Box mt={2}>
      <Typography variant="subtitle2">itemTotal差異:</Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>サービスコード</TableCell>
              <TableCell>サービス名</TableCell>
              <TableCell>単位数(rev {rev1})</TableCell>
              <TableCell>単位数(rev {rev2})</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {itemDiffs.map((itemDiff, itemIndex) => (
              <TableRow key={itemIndex}>
                <TableCell>{itemDiff.s}</TableCell>
                <TableCell>{itemDiff.c}</TableCell>
                <TableCell>
                  {itemDiff.tanniNum?.rev1 !== undefined ? itemDiff.tanniNum.rev1 : 'undefined'}
                </TableCell>
                <TableCell>
                  {itemDiff.tanniNum?.rev2 !== undefined ? itemDiff.tanniNum.rev2 : 'undefined'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

// メインコンポーネント
export const BillingDtCompare = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const allState = useSelector(state => state);
  const { accountLst, stdDate, account, users, schedule, com, serviceItems, hid, bid } = allState;

  // すべてのHooksを最初に呼び出す（条件分岐の前に）
  const [checkedList, setCheckedList] = useState({});
  const [loading, setLoading] = useState(false);
  const [createStatus, setCreateStatus] = useState({ status: '', message: '' });
  const [fetchStatus, setFetchStatus] = useState({ status: '', message: '' });
  const [comparableList, setComparableList] = useState([]);
  const [compareResult, setCompareResult] = useState([]);
  const [expandedDetails, setExpandedDetails] = useState({});
  const [isInitialized, setIsInitialized] = useState(false); // 初期化完了フラグ

  // 元のタイトルを保存し、離脱時に戻す
  useEffect(() => {
    const originalTitle = document.title;
    return () => {
      document.title = originalTitle;
    };
  }, []);

  // localStorageからチェック状態を復元
  useEffect(() => {
    console.log('=== localStorageからチェック状態を復元 ===');
    const saved = getLS(STORAGE_KEY);
    console.log('保存されていたデータ:', saved);
    console.log('データ型:', typeof saved);
    if (saved) {
      console.log('チェックリストを復元します:', saved);
      setCheckedList(saved);
    }
    setIsInitialized(true); // 初期化完了
  }, []);

  // チェック状態をlocalStorageに保存（初期化完了後のみ）
  useEffect(() => {
    if (!isInitialized) return; // 初期化前はスキップ
    console.log('チェック状態を保存:', checkedList);
    setLS(STORAGE_KEY, checkedList);
  }, [checkedList, isInitialized]);

  // パーミッションチェック: 100でないと実行できない
  const permission = comMod.parsePermission(account)[0][0];
  
  if (permission !== 100) {
    return (
      <div className={classes.root}>
        <Alert severity="error">
          このページにアクセスする権限がありません。パーミッション100が必要です。
        </Alert>
      </div>
    );
  }

  // チェックボックスの変更
  const handleCheckChange = (hid, bid) => {
    const key = `${hid}_${bid}`;
    setCheckedList(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // 全選択/全解除
  const handleCheckAll = () => {
    const allChecked = accountLst.every(account => 
      checkedList[`${account.hid}_${account.bid}`]
    );
    
    if (allChecked) {
      // 全て選択されている場合は全解除
      setCheckedList({});
    } else {
      // 一部またはゼロの場合は全選択
      const newCheckedList = {};
      accountLst.forEach(account => {
        newCheckedList[`${account.hid}_${account.bid}`] = true;
      });
      setCheckedList(newCheckedList);
    }
  };

  // billingDtの作成と送信
  const createAndSendBillingDt = async () => {
    console.log('=== billingDt作成・送信開始 ===', { date: stdDate, rev });
    
    setLoading(true);
    setCreateStatus({ status: '', message: '' });

    // DEBUG_MODE用の実行関数
    const executeProcess = async () => {
      const checkedItems = Object.keys(checkedList).filter(key => checkedList[key]);
      
      if (checkedItems.length === 0) {
        setCreateStatus({ status: 'error', message: 'チェックされた事業所がありません' });
        setLoading(false);
        return;
      }

      console.log(`処理対象: ${checkedItems.length}件`);
      
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < checkedItems.length; i++) {
        const key = checkedItems[i];
        const [hid, bid] = key.split('_');
        
        // 対象のアカウント情報を取得
        const account = accountLst.find(a => a.hid === hid && a.bid === bid);
        if (!account) continue;

        // 進捗を表示
        const statusMsg = `処理中: ${i + 1}/${checkedItems.length}件 (${account.shname})`;
        console.log('setCreateStatus:', statusMsg);
        setCreateStatus({ 
          status: 'info', 
          message: statusMsg
        });

        // 必要なデータをfetch
        const [usersRes, scheduleRes, comRes] = await Promise.all([
          univApiCall({ a: 'lu', hid, bid, date: stdDate }, 'E001'),
          univApiCall({ a: 'fetchSchedule', hid, bid, date: stdDate }, 'E002'),
          univApiCall({ a: 'companybrunchM', hid, bid, date: stdDate }, 'E003'),
        ]);

        if (!usersRes?.data?.result || !scheduleRes?.data?.result || !comRes?.data?.result) {
          console.error('データ取得失敗:', {
            users: usersRes?.data?.result,
            schedule: scheduleRes?.data?.result,
            com: comRes?.data?.result,
            errors: {
              users: usersRes?.data?.error,
              schedule: scheduleRes?.data?.error,
              com: comRes?.data?.error
            }
          });
          
          setCreateStatus({ 
            status: 'error', 
            message: `${account.shname} - ${account.sbname} のデータ取得失敗` 
          });
          errorCount++;
          continue;
        }
        
        console.log(`${account.shname} - ${account.sbname}: データ取得成功`);

        // usersにageStrなどを付与
        const usersRaw = usersRes.data.dt;
        const users = usersRaw.map(u => {
          const ages = comMod.getAge(u.birthday, stdDate, u.etc?.ageOffset);
          return {
            ...u,
            age: ages.age,
            ageStr: ages.flx,
            ageNdx: ages.ageNdx,
          };
        });

        const schedule = scheduleRes.data.dt[0]?.schedule || {};
        const com = comRes.data.dt[0];
        com.addiction = JSON.parse(com.addiction || '{}');

        // serviceItemsをusersから生成
        const svcSet = new Set();
        users.forEach(user => {
          if (user.service) {
            user.service.split(',').forEach(s => {
              svcSet.add(s);
            });
          }
        });
        const serviceItems = Array.from(svcSet);

        // setBillInfoToSchを実行
        let billingDt, masterRec;
        try {
          const prms = {
            stdDate: stdDate,
            schedule,
            users,
            com,
            serviceItems,
            calledBy: 'BillingDtCompare'
          };

          const result = setBillInfoToSch(prms);
          billingDt = result.billingDt;
          masterRec = result.masterRec;
        } catch (error) {
          console.error(`${account.shname}: setBillInfoToSchでエラー:`, error);
          setCreateStatus({ 
            status: 'error', 
            message: `${account.shname} - ${account.sbname} のbillingDt生成エラー: ${error.message}` 
          });
          errorCount++;
          continue;
        }

        if (!billingDt || billingDt.length === 0) {
          console.error(`${account.shname}: billingDt生成失敗`);
          setCreateStatus({ 
            status: 'error', 
            message: `${account.shname} - ${account.sbname} のbillingDt生成失敗` 
          });
          errorCount++;
          continue;
        }
        
        console.log(`${account.shname}: billingDt生成成功 (${billingDt.length}件)`);

        // anyStateに送信する前に、既存データを取得してマージ
        const fetchExistingPrms = {
          hid,
          bid,
          date: stdDate,
          item: 'billingDtCheck',
          a: 'fetchAnyState',
        };

        const existingRes = await univApiCall(fetchExistingPrms, 'E006');
        
        // 既存データを取得
        let existingData = {};
        if (existingRes?.data?.result && existingRes.data.dt.length > 0) {
          // 既存データがある場合、stateをパース
          existingData = existingRes.data.dt[0].state || {};
          console.log(`${account.shname}: 既存データあり`, Object.keys(existingData));
        } else {
          console.log(`${account.shname}: 初回送信`);
        }

        // 新データと既存データをマージ（新データで上書き）
        const mergedData = {
          ...existingData,
          [rev]: { billingDt }
        };

        console.log(`${account.shname}: マージ後のrevリスト`, Object.keys(mergedData));

        // マージしたデータを送信
        const sendPrms = {
          hid,
          bid,
          date: stdDate,
          item: 'billingDtCheck',
          state: JSON.stringify(mergedData),
          keep: 3,
          a: 'sendAnyState',
        };

        console.log('=== sendAnyState 実行 ===');
        console.log('送信パラメータ:', { hid, bid, date: stdDate, item: 'billingDtCheck', keep: 3 });
        console.log('送信データサイズ:', JSON.stringify(mergedData).length, 'bytes');

        const sendRes = await univApiCallJson(
          sendPrms, 
          'E004'
        );

        console.log('sendAnyState レスポンス:', sendRes);

        if (!sendRes?.data?.result) {
          console.error('送信失敗:', sendRes);
          errorCount++;
          setCreateStatus({ 
            status: 'error', 
            message: `${account.shname} - ${account.sbname} のデータ送信失敗` 
          });
        } else {
          console.log('送信成功:', account.shname, '-', account.sbname);
          successCount++;
          const successMsg = `成功: ${account.shname} - ${account.sbname} (${successCount}/${checkedItems.length}件)`;
          console.log('setCreateStatus SUCCESS:', successMsg);
          setCreateStatus({ 
            status: 'success', 
            message: successMsg
          });
        }
      }

      // 最終結果を表示
      if (errorCount > 0) {
        setCreateStatus({ 
          status: 'error', 
          message: `完了: 成功${successCount}件 / 失敗${errorCount}件` 
        });
      } else {
        setCreateStatus({ 
          status: 'success', 
          message: `全て成功: ${successCount}件` 
        });
      }
      
      // 比較可能なリストを更新
      await fetchComparableList();
    };

    // DEBUG_MODEで分岐
    if (DEBUG_MODE) {
      // デバッグモード: エラーをそのまま表示
      await executeProcess();
    } else {
      // 本番モード: try-catchでラップ
      try {
        await executeProcess();
      } catch (error) {
        console.error('エラー:', error);
        setCreateStatus({ status: 'error', message: '失敗' });
      }
    }

    setLoading(false);
    console.log('=== 処理完了 ===');
  };

  // 比較可能なリストを取得（30件ずつページネーション）
  const fetchComparableList = async () => {
    setLoading(true);
    setFetchStatus({ status: '', message: '' });
    
    try {
      const LIMIT = 30; // 1回のリクエストで取得する件数
      let offset = 0;
      let allData = [];
      let hasMore = true;
      let fetchCount = 0;

      // 30件ずつ取得してすべてのデータを集める
      console.log('データ取得開始...');
      while (hasMore) {
        fetchCount++;
        const statusMsg = `フェッチ中: ${LIMIT}件ずつ取得 (${fetchCount}回目, 累計${allData.length}件)`;
        console.log('setFetchStatus:', statusMsg);
        setFetchStatus({ 
          status: 'info', 
          message: statusMsg
        });

        const fetchPrms = {
          secret: API_SECRET,
          date: stdDate,
          item: 'billingDtCheck',
          a: 'fetchAnyStateAll',
          limit: LIMIT,
          offset: offset
        };

        const fetchRes = await univApiCall(fetchPrms, 'E005');
        
        if (!fetchRes?.data?.result) {
          setFetchStatus({ status: 'error', message: 'データ取得失敗' });
          setLoading(false);
          return;
        }

        const fetchedData = fetchRes.data.dt || [];
        allData = allData.concat(fetchedData);
        
        console.log(`取得: offset=${offset}, 件数=${fetchedData.length}, 累計=${allData.length}件`);

        // 取得したデータがLIMIT未満なら、これ以上データがない
        if (fetchedData.length < LIMIT) {
          hasMore = false;
        } else {
          offset += LIMIT;
        }
      }

      console.log(`データ取得完了: 合計${allData.length}件`);

      // 取得したデータをhid/bidでグループ化
      const groupedData = {};
      
      allData.forEach(item => {
        const key = `${item.hid}_${item.bid}`;
        if (!groupedData[key]) {
          groupedData[key] = [];
        }
        
        // revをキーとして保存されているので、それを展開
        const state = item.state;
        if (state && typeof state === 'object') {
          const revKeys = Object.keys(state);
          revKeys.forEach(revKey => {
            groupedData[key].push({
              ...item,
              rev: revKey,
              billingDt: state[revKey]?.billingDt
            });
          });
        }
      });

      console.log('グループ化されたデータ:', groupedData);

      // すべてのaccountLstから比較可能なものをフィルタリング（チェック状態に関係なく）
      const comparable = [];
      console.log('accountLst件数:', accountLst.length);
      
      for (const account of accountLst) {
        const key = `${account.hid}_${account.bid}`;
        const dataList = groupedData[key] || [];
        console.log(`${key} のdataList:`, dataList.length, '件');
        
        if (dataList.length >= 2) {
          // 2つ以上のrevが存在する場合
          const revList = dataList.map(d => d.rev).filter(r => r);
          const uniqueRevs = [...new Set(revList)];
          console.log(`${key} のuniqueRevs:`, uniqueRevs);
          
          if (uniqueRevs.length >= 2) {
            comparable.push({
              hid: account.hid,
              bid: account.bid,
              shname: account.shname,
              sbname: account.sbname,
              revList: uniqueRevs,
              data: dataList
            });
          }
        }
      }

      console.log('比較可能なデータ:', comparable);

      setComparableList(comparable);
      
      // 完了メッセージ
      const completeMsg = `取得完了: 合計${allData.length}件, 比較可能${comparable.length}件`;
      console.log('setFetchStatus SUCCESS:', completeMsg);
      setFetchStatus({ 
        status: 'success', 
        message: completeMsg
      });

    } catch (error) {
      console.error('Error in fetchComparableList:', error);
      setFetchStatus({ status: 'error', message: 'エラーが発生しました' });
    } finally {
      setLoading(false);
    }
  };

  // 比較実行
  const executeCompare = async () => {
    console.log('=== 比較実行開始 ===');
    setLoading(true);
    const results = [];

    try {
      for (const item of comparableList) {
        // 最新の2つのrevを取得（timestampでソート）
        const sortedData = item.data.sort((a, b) => {
          const timeA = a.updated || a.id || 0;
          const timeB = b.updated || b.id || 0;
          return timeB - timeA;
        });
        
        if (sortedData.length < 2) continue;

        const billingDt1 = sortedData[0].billingDt;
        const billingDt2 = sortedData[1].billingDt;

        // uidをキーにしてマップ化
        const map1 = {};
        billingDt1.forEach(b => {
          map1[b.UID] = b;
        });

        const map2 = {};
        billingDt2.forEach(b => {
          map2[b.UID] = b;
        });

        // 全てのuidを取得
        const allUids = [...new Set([...Object.keys(map1), ...Object.keys(map2)])];

        const differences = [];

        for (const uid of allUids) {
          const b1 = map1[uid];
          const b2 = map2[uid];

          if (!b1 || !b2) {
            differences.push({
              uid,
              type: 'missing',
              message: `UID ${uid} が片方のデータに存在しません`,
              name: b1?.name || b2?.name || '不明'
            });
            continue;
          }

          // userSanteiTotal, tanniTotal, kanrikekkagakuを比較
          const isSame = 
            b1.userSanteiTotal === b2.userSanteiTotal &&
            b1.tanniTotal === b2.tanniTotal &&
            b1.kanrikekkagaku === b2.kanrikekkagaku;

          if (!isSame) {
            // itemTotalを比較
            const itemDiffs = compareItemTotal(b1.itemTotal, b2.itemTotal);

            differences.push({
              uid,
              name: b1.name,
              type: 'different',
              userSanteiTotal: { rev1: b1.userSanteiTotal, rev2: b2.userSanteiTotal },
              tanniTotal: { rev1: b1.tanniTotal, rev2: b2.tanniTotal },
              kanrikekkagaku: { rev1: b1.kanrikekkagaku, rev2: b2.kanrikekkagaku },
              itemDiffs
            });
          }
        }

        results.push({
          hid: item.hid,
          bid: item.bid,
          shname: item.shname,
          sbname: item.sbname,
          rev1: sortedData[0].rev,
          rev2: sortedData[1].rev,
          hasDifference: differences.length > 0,
          differences
        });
      }

      setCompareResult(results);

      // 比較実行時にタイトルを変更（PDF出力時のファイル名用）
      if (results.length > 0) {
        document.title = `算定額確認[${results[0].rev1}-${results[0].rev2}]`;
      }

    } catch (error) {
      console.error('Error in executeCompare:', error);
    } finally {
      setLoading(false);
    }
  };

  // itemTotalの比較
  const compareItemTotal = (itemTotal1, itemTotal2) => {
    if (!Array.isArray(itemTotal1) || !Array.isArray(itemTotal2)) {
      return [];
    }

    const map1 = {};
    itemTotal1.forEach(item => {
      map1[item.s] = item;
    });

    const map2 = {};
    itemTotal2.forEach(item => {
      map2[item.s] = item;
    });

    const allCodes = [...new Set([...Object.keys(map1), ...Object.keys(map2)])];
    const diffs = [];

    for (const code of allCodes) {
      const item1 = map1[code];
      const item2 = map2[code];

      if (!item1 || !item2) {
        diffs.push({
          s: code,
          c: item1?.c || item2?.c || '不明',
          type: 'missing',
          tanniNum: { 
            rev1: item1?.tanniNum, 
            rev2: item2?.tanniNum 
          },
          santei: { 
            rev1: item1?.santei, 
            rev2: item2?.santei 
          }
        });
        continue;
      }

      if (item1.santei !== item2.santei || item1.tanniNum !== item2.tanniNum) {
        diffs.push({
          s: code,
          c: item1.c,
          santei: { rev1: item1.santei, rev2: item2.santei },
          tanniNum: { rev1: item1.tanniNum, rev2: item2.tanniNum }
        });
      }
    }

    return diffs;
  };

  // 詳細行の開閉
  const toggleDetailRow = (result) => {
    const key = `${result.hid}_${result.bid}`;
    setExpandedDetails(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className={classes.root}>
      <Typography variant="h4" gutterBottom>
        billingDt リビジョン比較ツール
      </Typography>

      <Box className={classes.section}>
        <Typography variant="h6" gutterBottom>
          現在のリビジョン: {rev}
        </Typography>
        <Typography variant="body2" gutterBottom>
          対象日付: {stdDate}
        </Typography>
      </Box>

      {/* ステップ1: データ作成 */}
      <Paper className={`${classes.section} ${classes.noPrint}`} style={{ padding: 16 }}>
        <Typography variant="h6" gutterBottom>
          ステップ1: データ作成
        </Typography>
        <AccountListTable
          accountLst={accountLst}
          checkedList={checkedList}
          onCheckChange={handleCheckChange}
          onCheckAll={handleCheckAll}
          classes={classes}
        />
        <Box style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={createAndSendBillingDt}
            disabled={loading}
            className={classes.compareButton}
          >
            {loading ? <CircularProgress size={24} /> : 'billingDt作成・送信'}
          </Button>
          <span style={{ 
            color: createStatus.status === 'success' ? '#4caf50' : 
                   createStatus.status === 'error' ? '#f44336' : '#666',
            fontWeight: 500,
            minWidth: 300,
            display: 'inline-block'
          }}>
            {createStatus.message || '　'}
          </span>
        </Box>
      </Paper>

      {/* ステップ2: 比較準備 */}
      <Paper className={`${classes.section} ${classes.noPrint}`} style={{ padding: 16 }}>
        <Typography variant="h6" gutterBottom>
          ステップ2: 比較準備
        </Typography>
        <Box style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={fetchComparableList}
            disabled={loading}
            className={classes.compareButton}
          >
            {loading ? <CircularProgress size={24} /> : '比較可能なデータを確認'}
          </Button>
          <span style={{ 
            color: fetchStatus.status === 'success' ? '#4caf50' : 
                   fetchStatus.status === 'error' ? '#f44336' : '#666',
            fontWeight: 500,
            minWidth: 300,
            display: 'inline-block'
          }}>
            {fetchStatus.message || '　'}
          </span>
        </Box>
        <ComparableDataList comparableList={comparableList} />
      </Paper>

      {/* ステップ3: 比較実行 */}
      <Paper className={classes.section} style={{ padding: 16 }}>
        <Typography variant="h6" gutterBottom>
          ステップ3: 比較実行
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={executeCompare}
          disabled={loading || comparableList.length === 0}
          className={`${classes.compareButton} ${classes.noPrint}`}
        >
          {loading ? <CircularProgress size={24} /> : '比較実行'}
        </Button>
        <CompareResultTable
          compareResult={compareResult}
          onToggleDetail={toggleDetailRow}
          expandedDetails={expandedDetails}
          classes={classes}
        />
      </Paper>

      {/* ステップ4: 差異詳細一覧 */}
      <Paper className={classes.section} style={{ padding: 16 }}>
        <DifferenceDetailFlatTable 
          compareResult={compareResult} 
          classes={classes}
          stdDate={stdDate}
        />
      </Paper>

    </div>
  );
};

export default BillingDtCompare;
