import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  makeStyles,
  Box,
  Typography,
  CircularProgress
} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import { red } from '@material-ui/core/colors';
import * as albCM from '../../albCommonModule';
import * as Actions from '../../Actions';
import { parsePermission } from '../../commonModule';

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: theme.spacing(2),
    padding: '8px 8px 8px 0px',
    display: 'flex',
    gap: theme.spacing(2),
    flexDirection: 'column',
    maxWidth: 600,
  },
  buttonBox: {
    display: 'flex',
    gap: theme.spacing(2),
    flexWrap: 'wrap',
  },
  deleteButton: {
    backgroundColor: red[500],
    color: '#fff',
    '&:hover': {
      backgroundColor: red[700],
    },
  },
  warning: {
    color: red[500],
    fontWeight: 'bold',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  info: {
    marginTop: theme.spacing(1),
    fontSize: '0.9rem',
    color: '#666',
  },
  resultBox: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
}));

const DeleteCompanyAndBranch = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const account = useSelector(state => state.account);
  const com = useSelector(state => state.com);
  const permission = parsePermission(account)[0][0];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState(''); // 'hid' or 'hidBid'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [countData, setCountData] = useState(null);
  const [loadingCount, setLoadingCount] = useState(false);

  // パーミッションが100でない場合は表示しない
  if (permission !== 100) {
    return null;
  }

  // 削除件数を取得
  const fetchDeleteCount = async (type) => {
    setLoadingCount(true);
    setCountData(null);

    try {
      const secret = 'fqgjlAAS4Mjb9lYUJPRBfV6hVLZHab';
      
      let prms = {
        a: 'countDeleteData',
        secret: secret,
        hid: hid,
      };

      if (type === 'hidBid') {
        prms.bid = bid;
      }

      const response = await new Promise((resolve) => {
        albCM.univApiCall(prms, '', resolve);
      });

      setCountData(response.data);
      setLoadingCount(false);
    } catch (error) {
      console.error('件数取得エラー:', error);
      setCountData({ result: false, msg: 'エラーが発生しました' });
      setLoadingCount(false);
    }
  };

  // 法人削除ボタンクリック
  const handleDeleteHid = async () => {
    setDeleteType('hid');
    setResult(null);
    setCountData(null);
    setLoadingCount(true);
    
    // 先に件数を取得してからダイアログを開く
    await fetchDeleteCount('hid');
    setDialogOpen(true);
  };

  // 事業所削除ボタンクリック
  const handleDeleteHidBid = async () => {
    setDeleteType('hidBid');
    setResult(null);
    setCountData(null);
    setLoadingCount(true);
    
    // 先に件数を取得してからダイアログを開く
    await fetchDeleteCount('hidBid');
    setDialogOpen(true);
  };

  // 利用者・予定実績等削除ボタンクリック
  const handleDeleteUsersAndEtc = async () => {
    setDeleteType('usersAndEtc');
    setResult(null);
    setCountData(null);
    setLoadingCount(true);
    
    // 先に件数を取得してからダイアログを開く
    await fetchDeleteCount('hidBid');
    setDialogOpen(true);
  };

  // ダイアログを閉じる
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDeleteType('');
    setResult(null);
    setCountData(null);
  };

  // 削除実行
  const handleConfirmDelete = async () => {
    setLoading(true);
    setResult(null);

    try {
      const secret = 'fqgjlAAS4Mjb9lYUJPRBfV6hVLZHab'; // API秘密鍵
      
      let apiAction = 'deleteHid';
      if (deleteType === 'hidBid') {
        apiAction = 'deleteHidBid';
      } else if (deleteType === 'usersAndEtc') {
        apiAction = 'deleteUsersAndEtc';
      }

      let prms = {
        a: apiAction,
        secret: secret,
        hid: hid,
      };

      if (deleteType === 'hidBid' || deleteType === 'usersAndEtc') {
        prms.bid = bid;
      }

      // API呼び出し
      const response = await new Promise((resolve) => {
        albCM.univApiCall(prms, '', resolve);
      });

      setResult(response.data);
      setLoading(false);

      // 成功した場合の処理
      if (response.data && response.data.resulttrue > 0) {
        setTimeout(() => {
          setDialogOpen(false);
          // 利用者・予定実績等削除の場合を除き、ログアウト
          if (deleteType !== 'usersAndEtc') {
            dispatch(Actions.clearAcount());
          }
        }, 3000);
      }
    } catch (error) {
      console.error('削除エラー:', error);
      setResult({ 
        result: false, 
        msg: 'エラーが発生しました: ' + error.message 
      });
      setLoading(false);
    }
  };

  return (
    <Box className={classes.root}>      
      <Box className={classes.buttonBox}>
        <Button
          variant="contained"
          className={classes.deleteButton}
          startIcon={loadingCount && deleteType === 'hid' ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
          onClick={handleDeleteHid}
          disabled={!hid || loadingCount}
        >
          {loadingCount && deleteType === 'hid' ? '件数確認中...' : '法人削除'}
        </Button>

        <Button
          variant="contained"
          className={classes.deleteButton}
          startIcon={loadingCount && deleteType === 'hidBid' ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
          onClick={handleDeleteHidBid}
          disabled={!hid || !bid || loadingCount}
        >
          {loadingCount && deleteType === 'hidBid' ? '件数確認中...' : '事業所削除'}
        </Button>

        <Button
          variant="contained"
          className={classes.deleteButton}
          startIcon={loadingCount && deleteType === 'usersAndEtc' ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
          onClick={handleDeleteUsersAndEtc}
          disabled={!hid || !bid || loadingCount}
        >
          {loadingCount && deleteType === 'usersAndEtc' ? '件数確認中...' : '利用者・予定実績等削除'}
        </Button>
      </Box>

      {/* 確認ダイアログ */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {deleteType === 'hid' ? '法人データの削除' : 
           deleteType === 'hidBid' ? '事業所データの削除' : 
           '利用者・予定実績等の削除'}
        </DialogTitle>
        <DialogContent>
          <Typography className={classes.warning}>
            ⚠️ 警告：この操作は取り消せません！
          </Typography>
          {deleteType !== 'usersAndEtc' && (
            <Typography variant="body2" style={{ color: '#d32f2f', marginTop: 8, fontWeight: 'bold' }}>
              ※ 削除実行後は自動的にログアウトされます
            </Typography>
          )}

          {deleteType === 'hid' && (
            <Box mt={2}>
              <Typography variant="body1" style={{ marginBottom: 8 }}>
                以下の法人に紐づく全てのデータを削除します：
              </Typography>
              <Typography variant="body1" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                {com?.hname ? `${com.hname}${com.shname ? `(${com.shname})` : ''}` : 'ー'}
              </Typography>
              <Typography variant="body2" color="textSecondary" style={{ marginTop: 4 }}>
                hid: {hid}
              </Typography>
            </Box>
          )}

          {deleteType === 'hidBid' && (
            <Box mt={2}>
              <Typography variant="body1" style={{ marginBottom: 8 }}>
                以下の事業所に紐づく全てのデータを削除します：
              </Typography>
              <Typography variant="body1" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                {com?.bname ? `${com.bname}${com.sbname ? `(${com.sbname})` : ''}` : 'ー'}
              </Typography>
              <Typography variant="body2" color="textSecondary" style={{ marginTop: 4 }}>
                法人: {com?.hname ? `${com.hname}${com.shname ? `(${com.shname})` : ''}` : 'ー'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                hid: {hid}, bid: {bid}
              </Typography>
            </Box>
          )}

          {deleteType === 'usersAndEtc' && (
            <Box mt={2}>
              <Typography variant="body1" style={{ marginBottom: 8 }}>
                以下の事業所に紐づく利用者・予定実績等のデータを削除します：
              </Typography>
              <Typography variant="body1" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                {com?.bname ? `${com.bname}${com.sbname ? `(${com.sbname})` : ''}` : 'ー'}
              </Typography>
              <Typography variant="body2" color="textSecondary" style={{ marginTop: 4 }}>
                法人: {com?.hname ? `${com.hname}${com.shname ? `(${com.shname})` : ''}` : 'ー'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                hid: {hid}, bid: {bid}
              </Typography>
              <Typography variant="body2" style={{ marginTop: 8, color: '#ff6f00', fontWeight: 'bold' }}>
                ※ 事業所とアカウント情報は削除されません
              </Typography>
            </Box>
          )}

          {loadingCount && (
            <Box display="flex" justifyContent="center" mt={2}>
              <CircularProgress size={24} />
              <Typography variant="body2" style={{ marginLeft: 8, marginTop: 2 }}>
                削除件数を確認中...
              </Typography>
            </Box>
          )}

          {countData && countData.result && (
            <Box mt={2} mb={2} p={2} bgcolor="#fff3e0" borderRadius={1}>
              <Typography variant="subtitle2" style={{ fontWeight: 'bold', marginBottom: 8 }}>
                削除されるデータ：
              </Typography>
              {deleteType === 'hid' && (
                <>
                  <Typography variant="body2">
                    • 事業所: {countData.brunch_count} 件
                  </Typography>
                  <Typography variant="body2">
                    • 利用者: {countData.user_count} 件
                  </Typography>
                  <Typography variant="body2">
                    • スケジュール: {countData.schedule_count} 件
                  </Typography>
                  <Typography variant="body2">
                    • アカウント: {countData.account_count} 件
                  </Typography>
                </>
              )}
              {deleteType === 'hidBid' && (
                <>
                  <Typography variant="body2">
                    • 利用者: {countData.user_count} 件
                  </Typography>
                  <Typography variant="body2">
                    • スケジュール: {countData.schedule_count} 件
                  </Typography>
                  <Typography variant="body2">
                    • アカウント: {countData.account_count} 件
                  </Typography>
                </>
              )}
              {deleteType === 'usersAndEtc' && (
                <>
                  <Typography variant="body2">
                    • 利用者: {countData.user_count} 件
                  </Typography>
                  <Typography variant="body2">
                    • スケジュール: {countData.schedule_count} 件
                  </Typography>
                  <Typography variant="body2" style={{ color: '#666', fontStyle: 'italic' }}>
                    ※ 事業所とアカウント: 削除されません
                  </Typography>
                </>
              )}
            </Box>
          )}

          <Typography variant="body2" className={classes.info}>
            削除対象テーブル：
            <br />
            {deleteType === 'usersAndEtc' ? (
              <>
                ahdschedule, ahduser, ahdusersext, ahdAnyState, 
                ahdSomeState, ahdusagefee, ahdschedule_backup, ahdLog, 
                ahdUsersPlan, ahdbrunchext, ahdcalender, ahdcontacts, 
                ahddailyreport, ahdworkshift
              </>
            ) : (
              <>
                ahdcompany, ahdbrunch, ahdaccount, ahdschedule, ahduser, 
                ahdusersext, ahdAnyState, ahdSomeState, ahdusagefee, 
                ahdschedule_backup, ahdLog, ahdUsersPlan, ahdbrunchext, 
                ahdcalender, ahdcontacts, ahddailyreport, ahdworkshift
              </>
            )}
          </Typography>

          {loading && (
            <Box display="flex" justifyContent="center" mt={2}>
              <CircularProgress />
            </Box>
          )}

          {result && (
            <Box className={classes.resultBox}>
              <Typography variant="subtitle2">実行結果:</Typography>
              <Typography variant="body2">
                成功: {result.resulttrue || 0} 件
              </Typography>
              <Typography variant="body2">
                失敗: {result.resultfalse || 0} 件
              </Typography>
              <Typography variant="body2">
                合計: {result.count || 0} 件
              </Typography>
              {result.errsql && result.errsql.length > 0 && (
                <Typography variant="body2" color="error">
                  エラーSQL: {result.errsql.join(', ')}
                </Typography>
              )}
              {result.msg && (
                <Typography variant="body2" color="error">
                  {result.msg}
                </Typography>
              )}
              {result.resulttrue > 0 && deleteType !== 'usersAndEtc' && (
                <Typography variant="body2" style={{ marginTop: 8, color: '#d32f2f', fontWeight: 'bold' }}>
                  3秒後にログアウトします...
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            キャンセル
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            className={classes.deleteButton}
            disabled={loading || loadingCount || (result && result.resulttrue > 0)}
          >
            {loading ? '削除中...' : '削除を実行'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeleteCompanyAndBranch;

