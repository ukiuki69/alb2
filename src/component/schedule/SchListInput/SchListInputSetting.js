import { Button, Checkbox, FormControlLabel, IconButton, makeStyles, TextField } from '@material-ui/core';
import React, { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { red, teal } from '@material-ui/core/colors';
import { checkValueType } from '../../dailyReport/DailyReportCommon';
import SnackMsg from '../../common/SnackMsg';
import { endPoint } from '../../../modules/api';
import { setSnackMsg, setStore } from '../../../Actions';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import DeleteIcon from '@material-ui/icons/Delete';
import SettingsIcon from '@material-ui/icons/Settings';
import axios from 'axios';
import { getLodingStatus, makeUrlSearchParams } from '../../../commonModule';
import { GoBackButton, LoadingSpinner } from '../../common/commonParts';

/**
 * 一覧入力フォームの設定を保存しているローカルストレージのアイテム名を取得する。
 * @return {string}
 */
export const useGetSchListInputSettingLSKey = () => {
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  return `hideOnTabelEdit-${hid}-${bid}`;
}

export const useGetSchListInputSettingLSItem = () => {
  const defaultValue = {};
  const settingLSKey = useGetSchListInputSettingLSKey();
  try{
    const value = localStorage.getItem(settingLSKey);
    const parsedValue = JSON.parse(value);
    return checkValueType(parsedValue, 'Object') ?parsedValue :defaultValue;
  }catch{
    return defaultValue;
  }
}

const useStyles = makeStyles({
  AppPage: {
    width: 640,
    margin: "80px auto 0", paddingLeft: 62,
    '& .title': {
      fontSize: '1.2rem', textAlign: 'center',
      padding: 12,
      backgroundColor: teal[800], color: '#fff',
    },
  },
  SettingForm: {
    '& .wrapper': {
      marginBottom: 24,
      '& .subTitle': {
        borderBottom: `1px solid ${teal[800]}`, backgroundColor: teal[50],
        padding: '8px 8px 7px',
      },
      '& .formParts': {
        padding: 8,
        '& .contents': {
          display: 'flex', flexWrap: 'wrap'
        }
      }
    }
  },
  AddContentTextField: {
    display: 'flex'
  },
  ContentWithDeleteFunc: {
    display: 'flex', alignItems: 'center',
    marginRight: 8
  },
  AddContentsForm: {
    margin: '16px 0',
    '& .contents': {
      display: 'flex', flexWrap: 'wrap'
    }
  },
  Buttons: {
    textAlign: 'end',
    '& .button': {
      width: 112,
      '&:not(:last-child)': {
        marginRight: 8
      },
    }
  }
});

const DisplaySettingCheckbox = (props) => {
  const {name, defaultChecked, label, setPropsState} = props;
  const [checked, setChecked] = useState(defaultChecked ?? true);

  useEffect(() => {
    if(setPropsState){
      setPropsState(prevState => ({...prevState, [name]: checked}));
    }
  }, [checked]);

  const handleChange = (e) => {
    const checked = e.target.checked;
    setChecked(checked);
  }

  return(
    <div>
      <FormControlLabel
        control={
          <Checkbox
            color='primary'
            checked={checked}
            onChange={handleChange}
            name={name}
          />
        }
        label={label}
      />
    </div>
  )
}

const DisplaySetting = (props) => {
  const com = useSelector(state => state.com);
  const config = useSelector(state => state.config);
  const {setPropsState} = props;
  const settingDt = useGetSchListInputSettingLSItem();

  const actualCostList = com?.etc?.actualCostList ?? config?.actualCostList ?? {};
  const actualCostCheckboxes = Object.keys(actualCostList).map((actualCost, i) => (
    <Fragment key={`actualCost${i}`}>
      <DisplaySettingCheckbox
        name={actualCost} label={actualCost}
        defaultChecked={settingDt[actualCost] ?? true}
        setPropsState={setPropsState}
      />
    </Fragment>
  ));

  return(
    <div className="wrapper">
      <div className='subTitle'>表示設定</div>
      <div className='formParts'>
        <div className='contentsTitle'>基本</div>
        <div className='contents'>
          <DisplaySettingCheckbox
            name="transfer" label="送迎先"
            defaultChecked={settingDt.transfer ?? true}
            setPropsState={setPropsState}
          />
          <DisplaySettingCheckbox
            name="groupes" label="クラス"
            defaultChecked={settingDt.groupes ?? true}
            setPropsState={setPropsState}
          />
          <DisplaySettingCheckbox
            name="teachers" label="担当者"
            defaultChecked={settingDt.teachers ?? true}
            setPropsState={setPropsState}
          />
        </div>
      </div>
      <div className='formParts'>
        <div className='contentsTitle'>実費</div>
        <div className='contents'>
          {actualCostCheckboxes}
        </div>
      </div>
    </div>
  )
}

const AddContentTextField = (props) => {
  const classes = useStyles();
  const {setContents} = props;
  const [value, setValue] = useState("");

  const handleChange = (e) => {
    setValue(e.target.value);
  }

  const handleClick = () => {
    if(!value) return;
    setContents(prevContents => ([...prevContents, value]));
    setValue("");
  }
  
  return(
    <div className={classes.AddContentTextField}>
      <div>
        <TextField
          value={value}
          label={props.label}
          onChange={handleChange}
          style={{width: 160}}
        />
      </div>
      <div>
        <IconButton
          onClick={handleClick}
        >
          <AddCircleIcon style={{color: teal[800]}}/>
        </IconButton>
      </div>
    </div>
  )
}

const ContentWithDeleteFunc = (props) => {
  const classes = useStyles();
  const {content, setContents} = props;

  const handleClick = () => {
    setContents(prevContents => prevContents.filter(c => c !== content));
  }

  return(
    <div className={classes.ContentWithDeleteFunc}>
      <div className='content'>{content}</div>
      <div className='deleteIconButton'>
        <IconButton
          onClick={handleClick}
        >
          <DeleteIcon style={{color: red[300]}}/>
        </IconButton>
      </div>
    </div>
  )
}

const AddGroupeForm = (props) => {
  const com = useSelector(state => state.com);
  const {setPropsState} = props;
  const classes = useStyles();
  const [groupes, setGroupes] = useState(com?.ext?.schGroupes ?? []);

  useEffect(() => {
    if(setPropsState) setPropsState(groupes);
  }, [groupes]);

  const contentNodes = groupes.map(groupe => (
    <Fragment key={groupe}>
      <ContentWithDeleteFunc content={groupe} setContents={setGroupes} />
    </Fragment>
  ));

  return(
    <div className="wrapper">
      <div className='subTitle'>クラス追加</div>
      <div className='formParts'>
        <div className='contents'>{contentNodes}</div>
        <AddContentTextField label="クラス" setContents={setGroupes} />
      </div>
    </div>
  )
}

const AddTeacherForm = (props) => {
  const com = useSelector(state => state.com);
  const {setPropsState} = props;
  const [teachers, setTeachers] = useState(com?.ext?.schTeachers ?? []);

  useEffect(() => {
    if(setPropsState) setPropsState(teachers);
  }, [teachers]);

  const contentNodes = teachers.map(teacher => (
    <Fragment key={teacher}>
      <ContentWithDeleteFunc content={teacher} setContents={setTeachers} />
    </Fragment>
  ));

  return(
    <div className="wrapper">
      <div className='subTitle'>担当者追加</div>
      <div className='formParts'>
        <div className='contents'>{contentNodes}</div>
        <AddContentTextField label="担当者" setContents={setTeachers} />
      </div>
    </div>
  )
}

const Buttons = (props) => {
  const history = useHistory();
  const dispatch = useDispatch();
  const com = useSelector(state => state.com);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const classes = useStyles();
  const [snack, setSnack] = useState({});
  const {displaySettingDt, groupes, teachers} = props;
  const settingLSKey = useGetSchListInputSettingLSKey();

  const handleCancel = () => {
    history.goBack();
  }

  const handleSubmit = async() => {
    // 表示設定をローカルストレージに保存
    const newDisplaySettingDt = Object.entries(displaySettingDt).reduce((newDt, [key, checked]) => {
      if(!checked) newDt[key] = checked;
      return newDt;
    }, {});
    localStorage.setItem(settingLSKey, JSON.stringify(newDisplaySettingDt));
    const comExt = checkValueType(com?.ext, "Object") ?com.ext :{};
    comExt.schGroupes = groupes;
    comExt.schTeachers = teachers;
    const params = {a: "sendComExt", hid, bid, ext: JSON.stringify(comExt)};
    const res = await axios.post(endPoint(), makeUrlSearchParams(params));
    if(res?.data?.result){
      dispatch(setStore({com: {...com, ["ext"]: comExt}}));
      dispatch(setSnackMsg('設定を保存しました。'));
      history.goBack();
    }else{
      setSnack({msg: '保存に失敗しました。再度お試しください。', severity: 'warning', id: new Date().getTime()});
    }
  }

  return(
    <>
    <div className={classes.Buttons}>
      <Button
        color='secondary'
        variant="contained"
        onClick={handleCancel}
        className='button'
      >
        キャンセル
      </Button>
      <Button
        color='primary'
        variant="contained"
        onClick={handleSubmit}
        className='button'
      >
        保存
      </Button>
    </div>
    <SnackMsg {...snack} />
    </>
  )
}

const SettingForm = () => {
  const classes = useStyles();
  const [displaySettingDt, setDisplaySettingDt] = useState({});
  const [groupes, setGroupes] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const buttonProps = {displaySettingDt, groupes, teachers};
  return(
    <div className={classes.SettingForm}>
      <form>
        <DisplaySetting setPropsState={setDisplaySettingDt} />
        <AddGroupeForm setPropsState={setGroupes} />
        <AddTeacherForm setPropsState={setTeachers} />
        <Buttons {...buttonProps} />
      </form>
    </div>
  )
}

export const SchListInputSetting = () => {
  const classes = useStyles();
  const allState = useSelector(state => state);

  if(!getLodingStatus(allState).loaded) return (<LoadingSpinner />);
  return(
    <>
    <GoBackButton posX={90} posY={0} />
    <div className={classes.AppPage}>
      <div className='title'>一覧入力設定</div>
      <SettingForm />
    </div>
    </>
  )
}

export const SchListInputSettingButton = () => {
  const history = useHistory();

  const handleClick = () => {
    history.push("/schedule/listinput/setting/");
  }

  return(
    <div className="setting">
      <IconButton
        onClick={handleClick}
      >
        <SettingsIcon />
      </IconButton>
    </div>
  )
}