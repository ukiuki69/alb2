import { Button, ButtonGroup, Checkbox, FormControl, FormControlLabel, IconButton, InputLabel, makeStyles, MenuItem, Select } from '@material-ui/core';
import { teal } from '@material-ui/core/colors';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import React, {createContext, useContext, useEffect, useState} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { univApiCall } from '../../albCommonModule';
import SnackMsg from '../common/SnackMsg';
import { getLodingStatus } from '../../commonModule';
import { LoadingSpinner } from '../common/commonParts';
import { LICENSE_LIST, WorkShiftLinksTab } from './WorkShiftCommon';
import { AlbHMuiTextField } from '../common/HashimotoComponents';
import { checkValueType } from '../dailyReport/DailyReportCommon';

import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import AddIcon from '@material-ui/icons/Add';
import { resetStore, sendBrunch, setSnackMsg, setStore } from '../../Actions';
import CancelIcon from '@material-ui/icons/Cancel';

const SIDEBAR_WIDTH = 61.25;
const NAME_WIDTH = "10rem";
const INIT_STAFF_DT = {name: "", sname: "", license: []};

const SnackContext = createContext({});

const useStyles = makeStyles({
  AppPage: {
    width: '95vw',
    margin: `${82+32}px auto`,
    "@media (min-width: 1080px)": {
      position: 'relative',
      maxWidth: 1080 + SIDEBAR_WIDTH,
      paddingLeft: SIDEBAR_WIDTH,
    },
    "@media (min-width: 501px) and (max-width: 1079px)": {
      position: 'relative',
    },
    "@media (max-width: 500px)": {

    },
  },
  MainForm: {

  },
  FormRow: {
    display: 'flex', marginBottom: 64
  }
});

const FormRowMoveButton = (props) => {
  const {staffs, index, setStaffs, setSorting} = props;

  const handleClick = (e) => {
    const action = e.currentTarget.name;
    setStaffs(prevStaffs => {
      const newStaffs = JSON.parse(JSON.stringify(prevStaffs));
      // 移動対象のスタッフデータを抽出
      const splicedStaff = newStaffs.splice(index, 1);
      let moveIndex = index;
      if(action === "up"){
        moveIndex--;
      }else if(action === "down"){
        moveIndex++;
      }
      return [...newStaffs.slice(0, moveIndex), ...splicedStaff,  ...newStaffs.slice(moveIndex)];
    });
    setSorting(prevSorting => !prevSorting);
  }

  const iconStyle = {fontSize: 16};
  return(
    // <div style={{paddingTop: 19, marginRight: 16}}>
    <div style={{paddingTop: 8, marginRight: 16}}>
      <ButtonGroup orientation="vertical">
      {/* <ButtonGroup> */}
        <Button
          variant="outlined" size="small" onClick={handleClick}
          name="up" disabled={index===0}
        >
          <ArrowUpwardIcon style={{...iconStyle}} />
        </Button>
        <Button
          variant="outlined" size="small" onClick={handleClick}
          name="down" disabled={index+1===staffs.length}
        >
          <ArrowDownwardIcon style={{...iconStyle}} />
        </Button>
      </ButtonGroup>
    </div>
  )
}

const NameTextField = (props) => {
  const {staff, index, setStaffs, error, sorting} = props;
  const [name, setName] = useState(staff.name ?? "");
  const [snameOpen, setSnameOpen] = useState(staff.sname ?true :false);
  const [sname, setSname] = useState(staff.sname ?? "");
  const [thisError, setThisError] = useState(false);

  useEffect(() => {
    if(!name && staff.license.length>=1) setThisError(true);
    else setThisError(false);
  }, [error, staff])

  useEffect(() => {
    setName(staff.name);
    setSname(staff.sname);
    setSnameOpen(staff.sname ?true :false);
  }, [sorting])

  const handleChange = (e) => {
    const key = e.currentTarget.name;
    setStaffs(prevStaffs => {
      const newStaffs = JSON.parse(JSON.stringify(prevStaffs));
      const newstaff = newStaffs[index];
      newstaff[key] = e.target.value;
      return newStaffs;
    });
  }

  const handleSnameOpen = () => {
    if(!sname) {
      const newSname = name.replace(/\s/g, "").slice(0, 3);
      setSname(newSname);
      setStaffs(prevStaffs => {
        const newStaffs = JSON.parse(JSON.stringify(prevStaffs));
        const newstaff = newStaffs[index];
        newstaff.sname = newSname;
        return newStaffs;
      });
    }
    setSnameOpen(true);
  }

  return(
    <div style={{marginRight: 16}}>
      <div>
        <AlbHMuiTextField
          label="スタッフ氏名"
          value={name}
          onChange={(e) => {setName(e.target.value); setThisError(false);}}
          onBlur={handleChange}
          width={NAME_WIDTH}
          name="name"
          error={thisError}
          required
        />
      </div>
      <div style={{marginTop: 8}}>
        {!snameOpen &&<Button onClick={handleSnameOpen}>
          <AddIcon style={{fontSize: 16}}/>略称追加
        </Button>}
        {snameOpen &&<AlbHMuiTextField
          label="略称"
          value={sname}
          onChange={(e) => setSname(e.target.value)}
          onBlur={handleChange}
          width={NAME_WIDTH}
          name="sname"
        />}
      </div>
    </div>
  )
}

const LicenseCheckboxes = (props) => {
  const com = useSelector(state => state.com);
  const displayLicense = com?.ext?.workShift?.setting?.displayLicense ?? {};
  const {staff, index, setStaffs} = props;

  const handleChange = (e) => {
    const licenseKey = e.target.name;
    setStaffs(prevStaffs => {
      const newStaffs = JSON.parse(JSON.stringify(prevStaffs));
      const newStaff = newStaffs[index];
      const newLicense = newStaff.license;
      const licenseKeyIndex = newLicense.findIndex(l => l === licenseKey);
      if(licenseKeyIndex+1){
        newLicense.splice(licenseKeyIndex, 1);
      }else{
        newLicense.push(licenseKey);
      }
      return newStaffs;
    });
  }

  return(
    <div className='licenseCheckboxes' style={{paddingTop: 10}}>
      {LICENSE_LIST.filter(license => displayLicense[license] ?? true).map(license => (
        <FormControlLabel
          control={
            <Checkbox
              checked={staff.license.includes(license)}
              onChange={handleChange}
              color="primary"
              name={license}
            />
          }
          label={license==="児童発達支援管理責任者" ?"児発管" :license}
        />
      ))}
    </div>
  )
}

const KahaiKasanSelect = (props) => {
  const {staff, index, setStaffs} = props;
  const [selectOpen, setSelectOpen] = useState(staff?.["児童指導員等加配加算"] ?true :false);

  if(!selectOpen) return(
    <div style={{margin: '6px 0'}}>
      <Button
        variant='contained'
        onClick={() => {
          setStaffs(prevStaffs => {
            const newStaffs = JSON.parse(JSON.stringify(prevStaffs));
            const newStaff = newStaffs[index];
            newStaff["児童指導員等加配加算"] = "常勤専従5年以上";
            return newStaffs;
          });
          setSelectOpen(true)
        }}
      >
        加配加算設定
      </Button>
    </div>
  )

  const handleChange = (e) => {
    const value = e.target.value;
    setStaffs(prevStaffs => {
      const newStaffs = JSON.parse(JSON.stringify(prevStaffs));
      const newStaff = newStaffs[index];
      newStaff["児童指導員等加配加算"] = value;
      return newStaffs;
    });
  }

  const handleClose = () => {
    setStaffs(prevStaffs => {
      const newStaffs = JSON.parse(JSON.stringify(prevStaffs));
      const newStaff = newStaffs[index];
      delete newStaff["児童指導員等加配加算"];
      return newStaffs;
    });
    setSelectOpen(false);
  }

  return(
    <div>
      <Select
        value={staff["児童指導員等加配加算"] ?? "常勤専従5年以上"}
        name='児童指導員等加配加算'
        onChange={handleChange}
        style={{width: '152px'}}
      >
        <MenuItem value={"常勤専従5年以上"}>常勤専従5年以上</MenuItem>
        <MenuItem value={"常勤専従5年以下"}>常勤専従5年以下</MenuItem>
        <MenuItem value={"常勤換算5年以上"}>常勤換算5年以上</MenuItem>
        <MenuItem value={"常勤換算5年以下"}>常勤換算5年以下</MenuItem>
        <MenuItem value={"その他"}>その他</MenuItem>
      </Select>
      <IconButton onClick={handleClose}>
        <CancelIcon />
      </IconButton>
    </div>
  )
}

const PartTimeSelect = (props) => {
  const {staff, index, setStaffs} = props;

  const handleChange = (e) => {
    const checked = e.target.checked;
    setStaffs(prevStaffs => {
      const newStaffs = JSON.parse(JSON.stringify(prevStaffs));
      newStaffs[index].partTime = checked;
      return newStaffs;
    })
  }

  return(
    <div>
      <FormControlLabel
        control={
          <Checkbox
            checked={staff.partTime ?? false}
            onChange={handleChange}
            color="primary"
            name="partTime"
          />
        }
        label="非常勤"
      />
    </div>
  )
}

const ServiceCheckboxes = (props) => {
  const {staff, index, setStaffs} = props;
  const serviceItems = useSelector(state => state.serviceItems);
  if(serviceItems.length < 2) return null;

  const handleChange = (e) => {
    const service = e.target.name;
    const checked = e.target.checked;
    setStaffs(prevStaffs => {
      const newStaffs = JSON.parse(JSON.stringify(prevStaffs));
      const newStaff = newStaffs[index];
      if(!newStaff.service) newStaff.service = {};
      newStaff.service[service] = checked;
      return newStaffs;
    });
  }

  return(
    <div className='licenseCheckboxes'>
      {serviceItems.map(service => (
        <FormControlLabel
          control={
            <Checkbox
              checked={staff.service?.[service] ?? true}
              onChange={handleChange}
              color="primary"
              name={service}
            />
          }
          label={service}
        />
      ))}
    </div>
  )
}

const ClassroomCheckboxes = (props) => {
  const {staff, index, setStaffs} = props;
  const users = useSelector(state => state.users);
  const classroomItems = users.reduce((prevClassroomItems, user) => {
    const classroom = user.classroom;
    if(classroom && !prevClassroomItems.includes(classroom)){
      prevClassroomItems.push(classroom);
    }
    return prevClassroomItems
  }, []);

  if(classroomItems.length < 2) return null;

  const handleChange = (e) => {
    const service = e.target.name;
    const checked = e.target.checked;
    setStaffs(prevStaffs => {
      const newStaffs = JSON.parse(JSON.stringify(prevStaffs));
      const newStaff = newStaffs[index];
      if(!newStaff.classroom) newStaff.classroom = {};
      newStaff.classroom[service] = checked;
      return newStaffs;
    });
  }

  return(
    <div className='licenseCheckboxes'>
      {classroomItems.map(classroom => (
        <FormControlLabel
          control={
            <Checkbox
              checked={staff.classroom?.[classroom] ?? true}
              onChange={handleChange}
              color="primary"
              name={classroom}
            />
          }
          label={classroom}
        />
      ))}
    </div>
  )
}

const FormRowDeleteButton = (props) => {
  const {index, setStaffs} = props;

  const handleDelete = () => {
    setStaffs((prevStaffs) => {
      const newStaffs = JSON.parse(JSON.stringify(prevStaffs));
      newStaffs.splice(index, 1);
      return newStaffs;
    });
  }

  return(
    <div style={{paddingTop: 11}}>
      <Button
        variant='contained'
        onClick={handleDelete}
      >
        削除
      </Button>
    </div>
  )
}

const FormRow = (props) => {
  const classes = useStyles();
  const {staff, index, staffs, setStaffs, error, sorting, setSorting} = props;

  const commonProps = {staff, index, staffs, setStaffs}
  return(
    <div className={classes.FormRow}>
      <FormRowMoveButton setSorting={setSorting} {...commonProps} />
      <NameTextField error={error} sorting={sorting} {...commonProps} />
      <div>
        <LicenseCheckboxes {...commonProps} />
        <KahaiKasanSelect {...commonProps} />
        <ServiceCheckboxes {...commonProps} />
        <ClassroomCheckboxes {...commonProps} />
        <PartTimeSelect {...commonProps} />
      </div>
      <FormRowDeleteButton {...commonProps} />
    </div>
  )
}

const AddFormRowButton = (props) => {
  const {setStaffs} = props;

  const handleClick = () => {
    // スタッフデータに新データを追加
    setStaffs((prevStaffs) => ([...prevStaffs, JSON.parse(JSON.stringify(INIT_STAFF_DT))]));
  }

  return(
    <div style={{textAlign: 'center'}}>
      <IconButton
        onClick={handleClick}
      >
        <AddCircleOutlineIcon
          style={{color: teal[800]}}
          fontSize="large"
        />
      </IconButton>
    </div>
  )
}

const Buttons = (props) => {
  const dispatch = useDispatch();
  const com = useSelector(state => state.com);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const {setSnack} = useContext(SnackContext);
  const {staffs, setError} = props;

  const handleSubmit = async() => {
    const sendDt = JSON.parse(JSON.stringify(staffs));
    // 氏名・略称・役職いずれかが入力されているもののみ処理（氏名・略称・役職がすべてないものは削除する。）
    const filteredSendDt = sendDt.filter(staff => staff.name || staff.sname || staff.license.length>=1);
    if(filteredSendDt.some(staff => staff.name === "")){
      setError(true);
      setSnack({msg: "氏名を入力してください。", severity: 'warning', id: new Date().getTime()});
      return;
    }
    filteredSendDt.forEach(staff => {
      staff.license = staff.license.filter(l => LICENSE_LIST.includes(l));
      if(!staff.id) staff.id = crypto.randomUUID();
    });
    const comEtc = checkValueType(com.etc, "Object") ?com.etc :{};
    if(!checkValueType(comEtc.workShift, 'Object')) comEtc.workShift = {};
    comEtc.workShift.staffs = filteredSendDt;
    const params = {
      ...com, hid, bid, date: stdDate,
      addiction: com.addiction,
      etc: comEtc,
    };
    dispatch(sendBrunch(params));
  }

  const handleCancel = () => {
    dispatch(resetStore());
  }

  const buttonStyle = {width: 104}
  return(
    <div className='buttons' style={{textAlign: 'end'}}>
      <Button
        color='secondary'
        variant='contained'
        onClick={handleCancel}
        style={{...buttonStyle, marginRight: 12}}
      >
        キャンセル
      </Button>
      <Button
        color='primary'
        variant='contained'
        onClick={handleSubmit}
        style={{...buttonStyle}}
      >
        保存
      </Button>
    </div>
  )
}

const MainForm = () => {
  const com = useSelector(state => state.com);
  const classes = useStyles();
  const comStaffs = com?.etc?.workShift?.staffs ?? com?.ext?.workShift?.staffs;
  const [staffs, setStaffs] = useState((checkValueType(comStaffs, 'Array') && comStaffs.length>=1) ?comStaffs :[JSON.parse(JSON.stringify(INIT_STAFF_DT))]);
  const [error, setError] = useState(false);
  const [sorting, setSorting] = useState(false);

  const commonProps = {staffs, setStaffs};

  const formRows = staffs.map((staff, i) => (
    <FormRow
      key={`FormRow${i}`}
      staff={staff} index={i}
      error={error} sorting={sorting} setSorting={setSorting}
      {...commonProps}
    />
  ));

  return(
    <div className={classes.MainForm}>
      <form>
        <div className='formRows'>{formRows}</div>
        <AddFormRowButton {...commonProps} />
        <Buttons setError={setError} {...commonProps} />
      </form>
    </div>
  )
}

const WorkShiftStaffSetting = () => {
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const classes = useStyles();
  const [snack, setSnack] = useState({});

  if(!loadingStatus.loaded) return(
    <>
    <WorkShiftLinksTab />
    <LoadingSpinner />
    </>
  )

  return(
    <>
    <WorkShiftLinksTab />
    <div className={classes.AppPage}>
      <SnackContext.Provider value={{setSnack}}>
        <MainForm />
      </SnackContext.Provider>
    </div>
    <SnackMsg {...snack} />
    </>
  )
}
export default WorkShiftStaffSetting