import React, { useState } from 'react';
import { FormControl, FormControlLabel, RadioGroup, Radio, Checkbox, FormLabel, Button, makeStyles, Typography } from '@material-ui/core';
import { useSelector, useDispatch } from 'react-redux';
import { univApiCall } from '../../albCommonModule';
import * as Actions from '../../Actions';
import SnackMsg from '../common/SnackMsg';
import { sortUsers } from './sortUtils';
import { teal } from '@material-ui/core/colors';
import SendIcon from '@material-ui/icons/Send';
import DeleteIcon from '@material-ui/icons/Delete';
import { GoBackButton } from '../common/commonParts';

const useStyles = makeStyles({
  root: {
    padding: 8,
    maxWidth: 600,
    margin: '64px auto',
    '& .title': {
      padding: 8,
      borderBottom: `1px solid ${teal[800]}`,
      backgroundColor: teal[50],
    },
    '& .MuiFormGroup-root': {
      padding: 16,
    },
    '& .includeServiceUnitChkBox': {
      padding: 16, paddingBottom: 8,
    },
    '& .includeServiceUnitRadioGroup': {
      padding: 0, paddingLeft: 32, marginBottom: 16,
    },
    '& .description': {
      padding: 8, color: teal[800], fontSize: '.8rem',
      textAlign: 'justify', lineHeight: '1.4rem',
    },
  },
})

const SettingSortOrder = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const { com, users, hid, bid } = useSelector(state => ({
    com: state.com,
    users: state.users,
    hid: state.hid,
    bid: state.bid,
  }));

  const defaultOrder = { order: '', includeServiceUnit: false };

  const [selectedOrder, setSelectedOrder] = useState(() => {
    return com?.ext?.selectedOrder || defaultOrder;
  });

  const [snack, setSnack] = useState({msg: '', severity: ''});

  const handleRadioChange = (event) => {
    setSelectedOrder((prevState) => ({
      ...prevState,
      order: event.target.value
    }));
  };

  const handleCheckboxChange = (event) => {
    setSelectedOrder((prevState) => ({
      ...prevState,
      includeServiceUnit: event.target.checked
    }));
  };

  const handleSubmit = async () => {
    const sortedUsers = sortUsers([...users], selectedOrder);

    // sindexを10刻みで設定
    sortedUsers.forEach((user, index) => {
      user.sindex = index * 10 + 100;
    });

    const indexset = sortedUsers.map(e => {
      return [e.uid, e.sindex];
    });
    const jindexset = JSON.stringify(indexset);
    const urlPrms = {
      hid, bid, indexset: jindexset, a: 'sendUsersIndex'
    };
    const resIndex = await univApiCall(urlPrms, '', '', '');

    const comExt = { ...com.ext, selectedOrder };
    const params = {
      a: "sendComExt", hid, bid,
      ext: JSON.stringify(comExt)
    };

    const res = await univApiCall(params, '', '', );
    if (res?.data?.result && resIndex?.data?.resultfalse === 0) {
      dispatch(Actions.setStore({ com: { ...com, ext: comExt } }));
      dispatch(Actions.updateUsersAll(sortedUsers));
      dispatch(Actions.setSnackMsg('設定を保存しました。', '' ));
    } else {
      setSnack({ msg: '設定の保存に失敗しました。', severity: 'error' });
    }
  };

  const handleCancel = () => {
    setSelectedOrder(com?.ext?.selectedOrder || defaultOrder);
  };

  const handleDelete = async () => {
    setSelectedOrder(defaultOrder);
    const comExt = { ...com.ext, selectedOrder: defaultOrder };
    const params = {
      a: "sendComExt", hid, bid,
      ext: JSON.stringify(comExt)
    };
    const res = await univApiCall(params, '', '', '');
    if (res?.data?.result) {
      dispatch(Actions.setStore({ com: { ...com, ext: comExt } }));
      dispatch(Actions.setSnackMsg('設定を削除しました。', '' ));
    } else {
      setSnack({ msg: '設定の削除に失敗しました。', severity: 'error' });
    }
  };

  return (
    <div className={classes.root}>
      <div className='title'>並び順を選択</div>
      <div className='description'>
        こちらで並び順を設定すると常時この並び順が設定されます。従来の手動の並び順より優先されるのでご注意下さい。
        手動の並び順に戻すときはここでの設定を削除して下さい。
      </div>
      <FormControl component="fieldset">
        {/* <FormLabel component="legend">並び順を選択</FormLabel> */}
        <RadioGroup value={selectedOrder.order || ''} onChange={handleRadioChange}>
          <FormControlLabel 
            value="userAlphabetical" control={<Radio />} label="50音順（利用者）" 
          />
          <FormControlLabel 
            value="guardianAlphabeticalAge" control={<Radio />} 
            label="50音順（保護者）＋年齢順"
          />
          <Typography variant="caption" color="textSecondary" style={{ paddingLeft: '32px' }}>
            この並び順を選択すると五十音順を維持しながら兄弟が並んで表示されます。年齢を見て兄・姉から順に並びます。
          </Typography>
          <FormControlLabel 
            value="schoolAgeAlphabetical" control={<Radio />} label="学齢順＋50音順" 
          />
          <FormControlLabel 
            value="startDate" control={<Radio />} label="利用開始日順" 
          />
          <FormControlLabel 
            value="contractDate" control={<Radio />} label="契約日順" 
          />
          <FormControlLabel 
            value="schoolAlphabeticalAge" control={<Radio />} 
            label="所属（学校順）＋学齢順" 
          />
          <FormControlLabel 
            value="schoolAlphabeticalUser" control={<Radio />} 
            label="所属（学校順）＋50音順" 
          />
        </RadioGroup>
        <FormControlLabel
          className='includeServiceUnitChkBox'
          control={<Checkbox checked={selectedOrder.includeServiceUnit} onChange={handleCheckboxChange} />}
          label="並び順にサービス名、単位名を考慮する"
        />
        <RadioGroup
          className='includeServiceUnitRadioGroup'
          value={selectedOrder.radioValue || ''}
          onChange={(event) => {
            setSelectedOrder((prevState) => ({
              ...prevState,
              radioValue: event.target.value
            }));
          }}
        >
          <FormControlLabel 
            value="serviceUnit" 
            control={<Radio disabled={!selectedOrder.includeServiceUnit} />} 
            label="サービス名＋単位名で並べる" 
          />
          <FormControlLabel 
            value="unitService" 
            control={<Radio disabled={!selectedOrder.includeServiceUnit} />} 
            label="単位名＋サービス名で並べる" 
          />
        </RadioGroup>
      </FormControl>
      <div style={{ marginTop: '16px', textAlign: 'right' }}>
        <Button
          variant="contained"
          onClick={handleDelete}
          startIcon={<DeleteIcon />}
        >
          設定を削除
        </Button>
        <Button 
          variant="contained" color='secondary' 
          onClick={handleCancel} style={{ marginLeft: '8px' }}
        >
          キャンセル
        </Button>
        <Button 
          variant="contained" color="primary" 
          style={{ marginLeft: '8px' , marginRight: 8 }}
          startIcon={<SendIcon />}
          onClick={handleSubmit}
        >
          書き込み
        </Button>
      </div>
      <SnackMsg {...snack} />
      <GoBackButton posX={80} posY={0} />
    </div>
  );
}

export default SettingSortOrder;