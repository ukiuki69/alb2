import React, { useState } from 'react';
import { useDispatch, useSelector, } from 'react-redux';
import Checkbox from '@material-ui/core/Checkbox';
import Button from '@material-ui/core/Button';
import { FormControlLabel } from '@material-ui/core';
import SnackMsg from '../common/SnackMsg';

export const checkConvertJido = (com) => {
  const checked = com?.ext?.reportsSetting?.convJido ?? com?.etc?.configReports?.convJido ?? false;
  return checked;
}

export const ConvJido = () => {
  const dispatch = useDispatch();
  const allstate = useSelector(state=>state);
  const {com, hid, bid} = allstate;
  const [convJido, setConvJido] = useState(checkConvertJido(com));
  const [snack, setSnack] = useState(null);

  const ConvCheckbox = () => {
    const handleChange = (ev) => {
      setConvJido(ev.target.checked);
    }

    return(
      <FormControlLabel
        control={
          <Checkbox
            checked={(convJido)}
            onClick={(ev) => handleChange(ev)}
            name='convCheckbox'
            color="primary"
          />
        }
        label='障害児を児童に変換し出力'
      />
    )
  }

  const RegisterButton = () => {
    const handleClick = async() => {
      try{
        const comExt = {...com?.ext};
        if(!comExt.reportsSetting) comExt.reportsSetting = {};
        comExt.reportsSetting.convJido = convJido;
        const params = {
          a: "sendComExt", hid, bid,
          ext: JSON.stringify(comExt)
        }
        const res = await univApiCall(params);
        if(!res?.data?.result){
          setSnack({msg: '保存に失敗しました。', severity: 'warning', id: new Date().getTime()});
          return;
        }
        dispatch(setStore({com: {...com, ext: comExt}}));
        dispatch(setSnackMsg('保存しました。'));
      }catch(error){
        setSnack({msg: '保存に失敗しました。', severity: 'warning', id: new Date().getTime()});
      }
    }

    return(
      <Button
        variant='contained'
        name='児童変換登録ボタン'
        onClick={()=>handleClick()}
      >
        登録
      </Button>
    )
  }

  return(
    <>
    <div style={{marginTop: 8}}>
      <ConvCheckbox />
      <RegisterButton />
    </div>
    <SnackMsg {...snack} />
    </>
  )
}