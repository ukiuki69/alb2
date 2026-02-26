import React, { useState, useEffect, useRef } from 'react';
import {
  TextField, Button, Radio, RadioGroup, FormControlLabel, FormLabel, Box, Checkbox, FormControl,
} from '@material-ui/core';
import { red, teal } from '@material-ui/core/colors';
import SnackMsg from '../common/SnackMsg';
import { univApiCall } from '../../albCommonModule';

const TopPageMessageForm = () => {
  const formDataDefault = { message: '', link: '', color: teal[900], fixed: false };
  const messageLimit = 20; // 通常メッセージの最大件数
  const [formData, setFormData] = useState(formDataDefault);
  const [dataList, setDataList] = useState([]); // データ配列
  const [snack, setSnack] = useState({ msg: '', severity: '' });
  const [isLoading, setIsLoading] = useState(true);
  const timeoutRef = useRef(null);

  // マウント時にデータフェッチ
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const prms = {
        hid: '', bid: '', date: '0000-00-00',
        item: 'topPageMessage',
        a: 'fetchAnyState',
      };
      const r = await univApiCall(prms);
      if (r?.data?.result && r?.data?.dt?.[0]?.state) {
        setDataList(r.data.dt[0].state); // データをセット
      }
      setIsLoading(false);
    };

    // タイマーのクリアと2秒遅延処理
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fetchData();
      timeoutRef.current = null;
    }, 2000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // 入力変更ハンドラー
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // フォーム送信処理
  const handleSubmit = async () => {
    const newData = {
      key: new Date().getTime(),
      message: formData.message,
      link: formData.link,
      color: formData.color,
      ...(formData.fixed && { fixed: true }), // fixedがtrueなら追加
    };

    const updatedList = [
      newData,
      ...dataList.filter((item) => item.fixed || item.fixed === undefined),
    ]
      .filter((item) => item.fixed || item.fixed === undefined) // 固定メッセージは除外しない
      .sort((a, b) => b.key - a.key); // 降順ソート

    // 通常メッセージを20件に制限
    const normalMessages = updatedList.filter((item) => item.fixed === undefined).slice(0, messageLimit);
    const fixedMessages = updatedList.filter((item) => item.fixed);
    const finalList = [...fixedMessages, ...normalMessages];

    setDataList(finalList);

    const updatedState = JSON.stringify(finalList);

    const sendPrms = {
      date: '0000-00-00',
      jino: '',
      keep: 365,
      hid: '',
      bid: '',
      item: 'topPageMessage',
      state: updatedState,
      a: 'sendAnyState',
    };

    await univApiCall(sendPrms, 'E2252266', 'setRes', setSnack, 'トップページメッセージを送信しました。');
    setFormData(formDataDefault);

  };

  // フォームのクリア処理
  const handleCancel = () => {
    setFormData(formDataDefault);
  };

  return (
    <Box p={2}>
      <TextField
        label="メッセージ"
        name="message"
        variant="outlined"
        fullWidth
        margin="normal"
        multiline
        maxRows={10}
        value={formData.message}
        onChange={handleChange}
        disabled={isLoading}
      />
      <TextField
        label="リンク"
        name="link"
        variant="outlined"
        fullWidth
        margin="normal"
        value={formData.link}
        onChange={handleChange}
        disabled={isLoading}
      />
      <FormLabel component="legend">色選択</FormLabel>
      <RadioGroup row name="color" value={formData.color} onChange={handleChange}>
        <FormControlLabel value={teal[900]} control={<Radio />} label="Teal" disabled={isLoading} />
        <FormControlLabel value={red[800]} control={<Radio />} label="Red" disabled={isLoading} />
      </RadioGroup>
      <FormControl>
        <FormControlLabel
          control={<Checkbox checked={formData.fixed} onChange={handleChange} name="fixed" />}
          label="固定メッセージ"
          disabled={isLoading}
        />
      </FormControl>
      <Box mt={2} display="flex" justifyContent="flex-end">
        <Button variant="contained" onClick={handleCancel} disabled={isLoading} color="secondary">
          キャンセル
        </Button>
        <span style={{ marginInlineStart: 16 }}></span>
        <Button variant="contained" color="primary" onClick={handleSubmit} disabled={isLoading}>
          送信
        </Button>
      </Box>
      <SnackMsg {...snack} />
    </Box>
  );
};

export default TopPageMessageForm;
