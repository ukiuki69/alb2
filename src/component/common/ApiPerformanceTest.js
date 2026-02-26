import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Button, Box, Typography, List, ListItem, ListItemText, Divider, Switch, FormControlLabel, Paper } from '@material-ui/core';
import { univApiCall } from '../../modules/api';
import { uisCookiePos, setUisCookie, getUisCookieInt } from '../../modules/uiUtils';

/**
 * APIパフォーマンス計測用コンポーネント
 * a: lu (ログインユーザー情報取得等) を10回連続で実行し、
 * 暗号化の有無による所要時間の違いを計測します。
 */
const ApiPerformanceTest = () => {
  const [results, setResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [useEnc, setUseEnc] = useState(getUisCookieInt(uisCookiePos.useEncryption) === 1);

  // Reduxからパラメータを取得
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);

  // 暗号化設定をCookieに保存し、ステートを更新する
  const handleToggleEncryption = (e) => {
    const val = e.target.checked ? 1 : 0;
    setUisCookie(uisCookiePos.useEncryption, val);
    setUseEnc(e.target.checked);
  };

  // テスト実行
  const runTest = async () => {
    setIsRunning(true);
    setResults([]);
    const tempResults = [];
    
    // 10回連続実行
    for (let i = 0; i < 10; i++) {
      // a: 'lu' を実行。hid, bid, date(stdDate) などのパラメータが必要
      const prms = { a: 'lu', hid, bid, date: stdDate };
      const res = await univApiCall(prms, 'perf-test-' + i);
      
      if (res && res.duration !== undefined) {
        tempResults.push({ id: i + 1, duration: res.duration });
        // 進捗を反映させるためにループ内で更新
        setResults([...tempResults]);
      }
    }
    setIsRunning(false);
  };

  // 平均時間の計算
  const avgDuration = results.length > 0 
    ? results.reduce((acc, cur) => acc + cur.duration, 0) / results.length 
    : 0;

  return (
    <Paper style={{ padding: '20px', margin: '20px' }}>
      <Typography variant="h6" gutterBottom>
        APIパフォーマンス計測 (a: lu)
      </Typography>
      
      <Box mb={2}>
        <Typography variant="body2" color="textSecondary">
          暗号化の有無を切り替えて、10回連続でリクエストを送信した際の所要時間を計測します。
        </Typography>
      </Box>

      <Box display="flex" alignItems="center" mb={2}>
        <FormControlLabel
          control={
            <Switch 
              checked={useEnc} 
              onChange={handleToggleEncryption} 
              color="primary" 
              disabled={isRunning}
            />
          }
          label={`暗号化設定: ${useEnc ? 'ON' : 'OFF'}`}
        />
      </Box>

      <Button 
        variant="contained" 
        color="primary" 
        onClick={runTest} 
        disabled={isRunning}
        fullWidth
      >
        {isRunning ? '実行中...' : 'テスト実行 (10回連続)'}
      </Button>

      {results.length > 0 && (
        <Box mt={4}>
          <Divider />
          <Box my={2}>
            <Typography variant="h6">
              平均所要時間: <span style={{ color: '#3f51b5' }}>{avgDuration.toFixed(2)} ms</span>
            </Typography>
          </Box>
          <Divider />
          <List dense>
            {results.map((res) => (
              <React.Fragment key={res.id}>
                <ListItem>
                  <ListItemText 
                    primary={`${res.id}回目`} 
                    secondary={`${res.duration.toFixed(2)} ms`} 
                  />
                </ListItem>
                {res.id < results.length && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        </Box>
      )}
    </Paper>
  );
};

export default ApiPerformanceTest;

