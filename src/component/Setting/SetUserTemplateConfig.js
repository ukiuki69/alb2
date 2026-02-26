import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getLodingStatus } from '../../commonModule';
import { useHistory, useParams } from 'react-router-dom/cjs/react-router-dom.min';
import { Button, FormControl, InputLabel, Select, makeStyles } from '@material-ui/core';
import { setDeepPath } from '../../modules/handleDeepPath';
import * as Actions from '../../Actions';
import SnackMsg from '../common/SnackMsg';
import { univApiCall } from '../../albCommonModule';
import { GoBackButton, LoadErr, LoadingSpinner } from '../common/commonParts';
import { blue, teal } from '@material-ui/core/colors';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';

const useStyles = makeStyles({
  setTemplateRoot: {
    width: 600, marginTop: 120, marginLeft: 'calc((100vw - 600px - 80px) / 2)',
    position: 'relative',
    '& .text': {
      padding: '0 0 24px', lineHeight: 1.5, textAlign: 'justify', marginTop: 16,
      '& > p': {marginBottom: 8},
      '& a': {color: teal[800], fontWeight: 600, textDecoration: 'underline dotted'},
      '& b': {color: blue[800]}
    }

  }

})

const MainSetUserTemplateConfig = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const history = useHistory();
  const allstate = useSelector(state=>state);
  const {com} = allstate;
  const ext = com.ext? com.ext: {};
  const userTemplateSetting = ext.userTemplateSetting? ext.userTemplateSetting: '0';
  const [val, setVal] = useState(userTemplateSetting);
  const [snack, setSnack] = useState({msg: '', severity: ''})
  const  handleClick = async (ev) => {
    const v = ev.currentTarget.value;
    const prms = {
      a: "sendComExt",
      hid: com.hid,
      bid: com.bid,
      ext: JSON.stringify({...ext, userTemplateSetting: val})
    }
    const res = await univApiCall(
      prms, '', '', setSnack, "送信込みました。", "送信に失敗しました。"
    );
    if (!res.data.result) return false;
    const newCom = setDeepPath(com, 'ext.userTemplateSetting', val);
    if (!newCom){
      setSnack({text: '設定に有効な値が見つかりません。', severity: 'warning'});
      return false;
    }
    dispatch(Actions.setStore({com: newCom}))

  }
  return (<>
    <div className={classes.setTemplateRoot}>
      <div className='text'>
        <p>
          <a href='https://rbatos.com/lp/2022/08/01/templatebyuser/' target='_blank'>
            利用者別雛形
          </a>をどのように利用するかを指定します。<br></br>
          利用者型雛形は入力画面にあるチェックをオンにすることにより保存されます。
        </p>
        <p>
          <b>常に利用する</b>：利用者別雛形として設定されていれば常にその値を利用し保存を行います。
        </p>
        <p>
          <b>予定入力時のみ保存する</b>：
          雛形の値は常に利用します。予定入力時には値を保存しますが実績入力時には保存しません。入力する日付で実績か予定かを判断します。
        </p>
        <p>
          <b>常に利用しない</b>：利用者別の雛形の保存は行いません。また登録時に利用しません。実績のみ入力する事業所はこちらをご利用いただくとスムーズです。

        </p>
      </div>
      <FormControl>
        <InputLabel>利用者別雛形の設定</InputLabel>
        <Select
          native
          value={val}
          name={'userTemplateSetting'}
          onChange={(ev) => {setVal(ev.currentTarget.value)}}
        >
          <option key={0} value='0'>常に利用する</option>
          <option key={1} value='-1'>常に利用しない</option>
          <option key={2} value='1'>予定入力時のみ保存する</option>
        </Select>
      </FormControl>
      <div className='buttonWrapper'>
        <Button
            variant='contained' color='secondary'
            onClick={()=>{history.goBack()}}
          >
            キャンセル
        </Button>

        <Button
          variant='contained' color='primary'
          onClick={ev=>handleClick(ev)}
        >
          設定する
        </Button>
      </div>
      <GoBackButton/>

    </div>
    <SnackMsg {...snack} />
  </>)
}

const SetUserTemplateConfig = () => {
  const allstate = useSelector(state=>state);
  const loadingStatus = getLodingStatus(allstate);
  
  if (loadingStatus.loaded){
    return(<>
      <MainSetUserTemplateConfig />
    </>)
  }
  else if (loadingStatus.error){
    return (<>
      <LoadErr loadStatus={loadingStatus} errorId={'E46623'} />
    </>)
  }
  else{
    return(<>
     <LoadingSpinner/>
    </>)
  }
}
export default SetUserTemplateConfig;

