import { Button, Checkbox, FormControl, FormControlLabel, makeStyles, Radio, RadioGroup, TextField } from '@material-ui/core';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resetStore, sendBrunch, setStore } from '../../Actions';
import { univApiCall } from '../../albCommonModule';
import { convHankaku, findDeepPath, getLodingStatus, sendUsersCity } from '../../commonModule';
import { validateNumericInput } from '../../modules/numericValidation';
import { LoadingSpinner } from '../common/commonParts';
import { AlbHMuiTextField } from '../common/HashimotoComponents';
import SnackMsg from '../common/SnackMsg';
import { forbiddenPtn } from '../common/StdFormParts';
import { ReloadWarning } from './RegistedParams';
import { red } from '@material-ui/core/colors';

const useStyles = makeStyles({
  oneCity: {
    padding: 8, margin: '16px 0 24px',
    display: 'flex', justifyContent: 'space-between',
    '& .name': {width: '11rem'},
    '& .noCol': {
      fontSize: '0.8rem', paddingTop: 3,
      // lineHeight: 1.6, paddingTop: 1.5,
      // display: 'flex', flexDirection: 'column', justifyContent: 'center',
      '& .no': {marginTop: 12}
    },
    '& .newNo': {width: '11ch'},
    '& .josei': {
      justifyContent: 'flex-end', margin: 0,
      '& .checkbox': {padding: 4},
      '& .MuiFormControlLabel-label': {fontSize: '0.8rem'}
    },
    '& .joseiNo': {width: '11ch'}
  },
  smallRadio: {
    '& .MuiRadio-root': {
      padding: '3px',
      '& .MuiSvgIcon-root': {
        fontSize: '16px'
      }
    },
    '& .MuiFormControlLabel-label': {
      fontSize: '0.8rem'
    }
  }
});

const OneCity = (props) => {
  const {cities, setCities, index, validation, setValidation} = props;
  const classes = useStyles();
  const [error, setError] = useState({
    name: {err: false, msg: ''}, newNo: {err: false, msg: ''}, joseiNo: {err: false, msg: ''},
    duplicateJoseiType: {err: false, msg: ''},
    teiritsuJoseiRate: {err: false, msg: ''}
  });
  const [typingTarget, setTypingTarget] = useState(null);

  const handleChange = (ev) =>{
    const key = ev.currentTarget.name;
    const type = ev.currentTarget.type;
    const value = (type === 'checkbox') ?ev.currentTarget.checked :ev.currentTarget.value;
    const target = JSON.parse(JSON.stringify(cities));
    target[index][key] = value;
    // チェックボックスが複数選択されていないか確認
    const checkBoxies = ['josei', 'dokujiJougen', 'manualJosei', 'teiritsuJosei']
    .map(e=>(target[index][e])).filter(e=>e);
    const t = [...validation];
    if (checkBoxies.length > 1){
      setError({...error, duplicateJoseiType: {err: true, msg: '助成タイプは複数選択できません'}})
      t[index] = true
    }
    else{
      setError({...error, duplicateJoseiType: {err: false, msg: ''}})
      t[index] = false
    }
    setValidation(t);
    setCities([...target]);
  }

  // バリデーション
  const handleBlur = (ev) => {
    const elm = ev.currentTarget;
    const targetName = elm.name;
    let targetVal = elm.value;
    const tErr = JSON.parse(JSON.stringify(error));
    let errMsg = '';
    if (targetName === 'name'){
      const checkDup = cities.every((cityDt, i) => i===index||cityDt.name!==targetVal);
      if (elm.required && !targetVal){
        errMsg = '入力必須項目';
      }else if (targetVal.length > 16){
        errMsg = '16文字以内';
      }else if (targetVal.match(forbiddenPtn)){
        errMsg = '使用禁止文字あり';
      }else if (targetVal && !checkDup){
        errMsg = '名前が重複してます';
      }
    }else if (targetName === 'newNo' || targetName === 'joseiNo'){
      targetVal = convHankaku(targetVal);
      const data = JSON.parse(JSON.stringify(cities));
      data[index][targetName] = targetVal;
      setCities([...data]);
      const checkDup = cities.every((cityDt, i) => i===index||cityDt.no!==targetVal);
      if (targetVal && !/^[0-9]{6}\*?$/.test(targetVal)){
        errMsg = '6桁の数字';
      }else if (targetVal && !checkDup){
        errMsg = '番号が重複してます';
      }
    }
    tErr[targetName].err =  errMsg !== '';
    tErr[targetName].msg = errMsg;
    setError(tErr);
    const changeedValidation = JSON.parse(JSON.stringify(validation));
    changeedValidation[index] = errMsg !== '';
    setValidation([...changeedValidation]);
  }

  const thisCity = cities[index];

  return(<>
    <div className={classes.oneCity}>
      <AlbHMuiTextField
        name='name'
        label='市区町村名'
        value={thisCity.name}
        disabled={typingTarget&&typingTarget!=="name"}
        required
        error={error.name.err}
        helperText={typingTarget&&typingTarget!=="name" ?"入力不可" :error.name.msg}
        className='name'
        width="7rem"
        onChange={(ev)=>{setTypingTarget("name"); handleChange(ev);}}
        onBlur={handleBlur}
      />
      <div className='noCol'>
        <div>市区町村番号</div>
        <div className='no'>{thisCity.no}</div>
      </div>
      <AlbHMuiTextField
        name='newNo'
        label='番号変更'
        value={thisCity.newNo}
        disabled={typingTarget&&typingTarget!=="newNo"}
        error={error.newNo.err}
        helperText={typingTarget&&typingTarget!=="newNo" ?"入力不可" :error.newNo.msg}
        width="11ch"
        onChange={(ev)=>{setTypingTarget("newNo"); handleChange(ev);}}
        onBlur={handleBlur}
      />
      <FormControlLabel
        control={
          <Checkbox
            name='josei'
            checked={thisCity.josei}
            onChange={handleChange}
            className='checkbox'
            color="primary"
          />
        }
        label='自治体助成'
        labelPlacement="top"
        className='josei'
      />
      <FormControlLabel
        control={
          <Checkbox
            name='dokujiJougen'
            checked={thisCity.dokujiJougen}
            onChange={handleChange}
            className='checkbox'
            color="primary"
          />
        }
        label='独自上限'
        labelPlacement="top"
        className='josei'
      />
      <FormControlLabel
        control={
          <Checkbox
            name='manualJosei'
            checked={thisCity.manualJosei}
            onChange={handleChange}
            className='checkbox'
            color="primary"
          />
        }
        label='手動助成'
        labelPlacement="top"
        className='josei'
      />
      <FormControlLabel
        control={
          <Checkbox
            name='teiritsuJosei'
            checked={thisCity.teiritsuJosei}
            onChange={handleChange}
            className='checkbox'
            color="primary"
          />
        }
        label='定率助成'
        labelPlacement="top"
        className='josei'
      />
      <AlbHMuiTextField
        name='joseiNo'
        label='助成自治体番号'
        value={thisCity.joseiNo}
        error={error.joseiNo.err}
        helperText={error.joseiNo.msg}
        width="11ch"
        onChange={handleChange}
        onBlur={handleBlur}
      />
    </div>
    {thisCity.teiritsuJosei && (
      <div style={{ marginTop: -24, padding: '0 8px 8px 8px',  }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <TextField
              name='teiritsuJoseiRate'
              label='助成率'
              value={thisCity.teiritsuJoseiRate || ''}
              onChange={handleChange}
              onBlur={(ev) => {
                const res = validateNumericInput(ev.currentTarget.value, { lower: 1, upper: 99 });
                const target = JSON.parse(JSON.stringify(cities));
                target[index].teiritsuJoseiRate = res.value;
                setCities(target);
                setError(prev => ({
                  ...prev,
                  teiritsuJoseiRate: { err: res.error, msg: res.errorMsg }
                }));
                const t = [...validation];
                t[index] = res.error;
                setValidation(t);
              }}
              style={{ width: '8ch' }}
              error={error.teiritsuJoseiRate.err}
              helperText={error.teiritsuJoseiRate.msg}
            />
            <span style={{ fontSize: '16px', marginTop: '8px' }}>%</span>
          </div>
          <div className={classes.smallRadio} style={{ marginTop: '16px' }}>
            <FormControl component="fieldset">
              <RadioGroup
                name="teiritsuJoseiRound"
                value={thisCity.teiritsuJoseiRound || 'floor'}
                onChange={handleChange}
                row
                style={{ display: 'flex', gap: '20px' }}
              >
                <FormControlLabel 
                  value="floor" control={<Radio style={{ padding: '3px' }} />} 
                  label="切り捨て" style={{ margin: 0 }}
                />
                <FormControlLabel 
                  value="round" control={<Radio />} 
                  label="四捨五入" style={{ margin: 0 }}
                />
                <FormControlLabel 
                  value="ceil" control={<Radio />} 
                  label="切り上げ" style={{ margin: 0 }}
                />
              </RadioGroup>
            </FormControl>
          </div>
        </div>
      </div>
    )}
    <div style={{fontSize: '.8rem', color: red[600]}}>
      {error.duplicateJoseiType.msg}
    </div>
  </>)
}

const EditCities = () => {
  const dispatch = useDispatch();
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const {users, com, stdDate, hid, bid, schedule} = allState;
  // stateの中にdokujiJougenを追加。2023/09/20 吉村
  // stateの中にmanualJougen(手動上限)を追加 2024/06/18
  const [cities, setCities] = useState((() => {
    if(!users.length) return [];
    const comCities = com ?com.etc ?com.etc.cities ?com.etc.cities :null :null :null;
    const scityNoSet = new Set(users.map(userDt => userDt.scity_no));
    return Array.from(scityNoSet).map(scityNo => {
      const name = users.find(f=>f.scity_no === scityNo).scity;
      if(Array.isArray(comCities) && comCities.some(e=>e.no === scityNo)){
        const targetDt = comCities.find(e=>e.no === scityNo);
        return {
          no: scityNo, name, joseiNo: targetDt.joseiNo, josei: targetDt.josei,
          dokujiJougen: targetDt.dokujiJougen? targetDt.dokujiJougen: false,
          manualJosei: targetDt.manualJosei? targetDt.manualJosei: false,
          teiritsuJosei: targetDt.teiritsuJosei? targetDt.teiritsuJosei: false,
          teiritsuJoseiRate: targetDt.teiritsuJoseiRate || '',
          teiritsuJoseiRound: targetDt.teiritsuJoseiRound || 'floor',
        };
      }
      return {
        no: scityNo, name, joseiNo: scityNo, josei: false, dokujiJougen: false,
        manualJosei: false, teiritsuJosei: false, teiritsuJoseiRate: '', teiritsuJoseiRound: 'floor',
      };
    });
  })());
  const [validation, setValidation] = useState((() => {
    const scityNoSet = new Set(users.map(userDt => userDt.scity_no));
    return Array.from(scityNoSet).map(_=>false);
  })());
  const [snack, setSnack] = useState({});
  if(!loadingStatus.loaded) return(<LoadingSpinner/>)
  cities.sort((a, b)=>(a.no > b.no)? 1: -1);
  const eachCity = cities.map((_, i) => {
    const prms = {cities, setCities, index: i, validation, setValidation};
    return(<OneCity {...prms} key={i}/>);
  });

  const handleClick = () => {
    const tmpUsers = JSON.parse(JSON.stringify(users));
    tmpUsers.forEach(userDt => {
      const updateDt = cities.find(cityDt => cityDt.no === userDt.scity_no);
      if(updateDt.newNo) userDt.scity_no = updateDt.newNo;
      else if(userDt.scity !== updateDt.name) userDt.scity = updateDt.name;
    });
    dispatch(setStore({users: tmpUsers}));
    cities.forEach(cityDt => {
      const prms = {hid, bid, scity: cityDt.name};
      if(cityDt.newNo){
        prms.a = "replaceUsersCityNoByName";
        prms.scity_no = cityDt.newNo;
        univApiCall(prms, '', '', setSnack, "利用者データ更新", "利用者データ更新失敗");
      }else{
        prms.scity_no = cityDt.no;
        sendUsersCity(prms, ()=>null, dispatch);
      }
    });
    const newCities = JSON.parse(JSON.stringify(cities));
    newCities.forEach(cityDt => {
      if(cityDt.newNo){
        cityDt.no = JSON.parse(JSON.stringify(cityDt.newNo));
        delete cityDt.newNo;
      }
    });
    const comEtc = com.etc ?com.etc :{};
    dispatch(setStore({com: {...com, date:stdDate, etc: {...comEtc, cities: newCities}}}));
    dispatch(sendBrunch({...com, hid, bid, date:stdDate, etc: {...comEtc, cities: newCities}}));
  }

  const sendButtonDisabled = (() => {
    if(schedule.locked) return true;
    else if(validation.includes(true)) return true;
    return false;
  })();
  return(
    <>
    <div className='H'>
      市町村編集・助成額設定
      <div className='small'>
        登録されている市区町村名称や自治体助成の有無などを登録します。
      </div>
    </div>
    <ReloadWarning />
    <form>
      {eachCity}
    </form>
    <div className='buttonWrapper'>
      <Button
        variant='contained' color='secondary'
        onClick={()=>dispatch(resetStore())}
      >
        キャンセル
      </Button>
      <Button
        variant='contained' color='primary'
        disabled={sendButtonDisabled}
        onClick={handleClick}
      >
        更新
      </Button>
    </div>
    <SnackMsg {...snack}/>
    </>
  )
}
export default EditCities;