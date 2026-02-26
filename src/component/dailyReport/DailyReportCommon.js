import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { LinksTab } from "../common/commonParts";
import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, IconButton, Input, InputAdornment, InputLabel, MenuItem, OutlinedInput, Select, Tab, Tabs, makeStyles, useMediaQuery } from "@material-ui/core";
import CloseIcon from '@material-ui/icons/Close';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import { AlbHMuiTextField, TimeInput, useSessionStorageState } from "../common/HashimotoComponents";
import { Autocomplete } from "@material-ui/lab";
import { useSelector } from "react-redux";
import { grey } from "@material-ui/core/colors";

// const ACTIVITY_WIDTH = '60rem';

/**
 * セッションストレージに保存したカレンダーの日付とstdDateからフルデイトを取得。
 * @param {string} stdDate
 * @returns 
 */
export const getCalendarDate = (stdDate) => {
  const sessionStorageDate = sessionStorage.getItem(`schDailyReportDate${stdDate}`);
  const nowISO = new Date().toISOString();
  if(sessionStorageDate && sessionStorageDate!=='null'){
    return sessionStorageDate;
  }else if(stdDate.slice(0, 7) === nowISO.slice(0, 7)){
    return nowISO.slice(0, 10);
  }else{
    return stdDate;
  }
}

/**
 * valueの型が指定したものか確認するための関数
 * checkTypeには"Object", "String", "List", "Int"などを指定する。
 * @param {*} value 
 * @param {string} checkType 
 * @returns 
 */
export const checkValueType = (value, checkType) => {
  const type = Object.prototype.toString.call(value);
  return type.slice(8, -1) === checkType
}

/**
 * 利用者日報データを書き換える
 * @param {Object} userReportDt 
 * @param {String} dDate 
 * @param {String} dtKey 
 * @param {*} value 
 * @returns 
 */
export const changeUserReportDtValue = (userReportDt, dDate, dtKey, value) => {
  const newUserReportDt = JSON.parse(JSON.stringify(userReportDt));
  if(!checkValueType(newUserReportDt[dDate], "Object")) newUserReportDt[dDate] = {};
  const dDateDt = newUserReportDt[dDate];
  dDateDt[dtKey] = value;
  dDateDt.edited = true;

  return newUserReportDt;
}

export const useGetInitDate = () => {
  const stdDate = useSelector(state => state.stdDate);
  const nowISO = new Date().toISOString();
  if(stdDate.slice(0, 7) === nowISO.slice(0, 7)){
    return nowISO.slice(0, 10);
  }else{
    return stdDate;
  }
}

const useStyles = makeStyles({
  contentField: {
    padding: '10.5px 14px',
    border: '1px solid rgba(0, 0, 0, 0.2)', borderRadius: 4,
    '& .contents': {
      display: 'flex', flexWrap: 'wrap',
      minHeight: '1.5rem',
      '& .content': {
        lineHeight: '1.5rem', marginBottom: 4, marginLeft: "0 !important",
        '& .delimiter': {
          marginLeft: 4
        }
      }
    },
    cursor: 'pointer'
  },
  contentFieldHover: {
    '&:hover': {
      cursor: 'pointer',
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
      borderColor: 'rgba(0, 0, 0, 0.87)'
    }
  },
  checkboxes: {
    display: 'flex', flexWrap: 'wrap',
    marginBottom: 16
  },
  activitiesAddForm: {
    width: '100%', margin: '8px 0', padding: '0 24px',
    display: 'flex', alignItems: 'flex-end',
    '& .sendButton': {
      marginLeft: 4,
    }
  },
  freesoloField: {
    '& .MuiAutocomplete-endAdornment': {
      display: 'none',
    },
    '& .textField': {
      '& > div': {
        paddingRight: 0
      }
    }
  },
});

/**
 * 日報用リンクスタブ
 * @returns 
 */
export const DailyReportLinksTab = () => {
  const isLimit500px = useMediaQuery("(max-width:500px)");
  const menu = [
    { link: "/dailyreport", label: "日報" },
    { link: "/dailyreport/print", label: "印刷・Excel出力" },
    { link: "/dailyreport/browse/", label: "記録一覧", hide: isLimit500px, print: true},
    { link: "/dailyreport/setting", setting: true, permissionLower: 90},
  ];

  return (<LinksTab menu={menu} />)
}

// 車両用コンテキスト
const CarOptionsContext = createContext();
export const CarOptionsProvider = (props) => {
  const {children, dailyReportDt, lastMonthDailyReportDt} = props;
  const [carOptions, setCarOptions] = useState([]);
  useEffect(() => {
    const newCarOptions = [];
    const getCarOptions = ((sourceDt) => {
      Object.keys(sourceDt).forEach(uidStr => {
        const userData = sourceDt[uidStr];
        if(checkValueType(userData, 'Object')){
          Object.keys(userData).forEach(dDate => {
            const data = userData[dDate];
            const pickupCar = data?.pickupCar;
            if(pickupCar && !newCarOptions.includes(pickupCar)) newCarOptions.push(pickupCar);
            const dropoffCar = data?.dropoffCar;
            if(dropoffCar && !newCarOptions.includes(dropoffCar)) newCarOptions.push(dropoffCar);
          });
        }
      });
    });
    if(lastMonthDailyReportDt) getCarOptions(lastMonthDailyReportDt);
    if(dailyReportDt) getCarOptions(dailyReportDt);
    setCarOptions(newCarOptions);
  }, [dailyReportDt, lastMonthDailyReportDt]);
  
  return(
    <CarOptionsContext.Provider value={{carOptions, setCarOptions}}>
      {children}
    </CarOptionsContext.Provider>
  )
}

// 担当者用コンテキスト
const StaffOptionsContext = createContext();
export const StaffOptionsProvider = (props) => {
  const {children, dailyReportDt, lastMonthDailyReportDt} = props;
  const [staffOptions, setStaffOptions] = useState([]);
  useEffect(() => {
    const newStaffOptions = [];
    const makeStaffOptions = ((sourceDt) => {
      Object.keys(sourceDt).forEach(uidStr => {
        const userData = sourceDt[uidStr];
        if(checkValueType(userData, 'Object')){
          Object.keys(userData).forEach(dDate => {
            const data = userData[dDate];
            const pickupStaff = data?.pickupStaff;
            const pickupSubStaff = data?.pickupSubStaff;
            if(pickupStaff && !newStaffOptions.includes(pickupStaff)) newStaffOptions.push(pickupStaff);
            if(pickupSubStaff && !newStaffOptions.includes(pickupSubStaff)) newStaffOptions.push(pickupSubStaff);
            const dropoffStaff = data?.dropoffStaff;
            const dropoffSubStaff = data?.dropoffSubStaff;
            if(dropoffStaff && !newStaffOptions.includes(dropoffStaff)) newStaffOptions.push(dropoffStaff);
            if(dropoffSubStaff && !newStaffOptions.includes(dropoffSubStaff)) newStaffOptions.push(dropoffSubStaff);
          });
        }
      });
    });
    if(lastMonthDailyReportDt) makeStaffOptions(lastMonthDailyReportDt);
    if(dailyReportDt) makeStaffOptions(dailyReportDt);
    setStaffOptions(newStaffOptions);
  }, [dailyReportDt, lastMonthDailyReportDt]);
  
  return(
    <StaffOptionsContext.Provider value={{staffOptions, setStaffOptions}}>
      {children}
    </StaffOptionsContext.Provider>
  )
}

// 活動内容用コンテキスト
const ActivitiedContext = createContext();
export const ActivitiesProvider = (props) => {
  const {children, dailyReportDt, lastMonthDailyReportDt} = props;
  const [activities, setActivies] = useState([]);
  const [activitiesDid, setActivitiesDid] = useState({});
  useEffect(() => {
    const newActivities = [];
    const newActivitiesDid = {};
    const makeActivities = ((sourceDt) => {
      Object.keys(sourceDt).forEach(uidStr => {
        const userData = sourceDt[uidStr];
        if(checkValueType(userData, 'Object')){
          Object.keys(userData).forEach(dDate => {
            const data = userData[dDate];
            const currentActivities = data?.activities ?? [];
            currentActivities.forEach(activity => {
              if(!newActivities.includes(activity)) newActivities.push(activity);
              if(!newActivitiesDid[activity]){
                newActivitiesDid[activity] = dDate;
              }else{
                if(newActivitiesDid[activity].slice(-8) <= dDate.slice(-8)){
                  newActivitiesDid[activity] = dDate;
                }
              }
            })
          });
        }
      });
    });
    if(lastMonthDailyReportDt) makeActivities(lastMonthDailyReportDt);
    if(dailyReportDt) makeActivities(dailyReportDt);
    setActivies(newActivities);
    setActivitiesDid(newActivitiesDid);
  }, [dailyReportDt, lastMonthDailyReportDt]);

  return(
    <ActivitiedContext.Provider value={{activities, setActivies, activitiesDid, setActivitiesDid}}>
      {children}
    </ActivitiedContext.Provider>
  )
}

// フォームパーツ　複数コンテンツが存在する時に使う表示用コンポーネント
const ContentField = (props) => {
  const classes = useStyles();
  const {setDialogOpen, userReportDt, dDate, dtKey} = props;
  const contents = userReportDt?.[dDate]?.[dtKey] ?? [];
  const contentNodes = contents.map((content, i) => (
    <div className="content">
      {content}
      {contents.length!==i+1 &&<span className="delimiter" />}
    </div>
  ));

  const handleClick = () => {
    if(props.disabled) return;
    if(setDialogOpen) setDialogOpen(true);
  }

  const disabledStyle = props.disabled ?{border: 'dotted', opacity: 0.3, cursor: 'auto'} :{};

  return(
    <div
      className={`${classes.contentField} ${props.disabled ?"" :classes.contentFieldHover}`}
      style={{width: props.width, ...disabledStyle}}
      onClick={handleClick}
    >
      <div className="contents">
        {contentNodes}
      </div>
    </div>
  )
}

// 活動内容ダイアログフォーム　活動内容単体を追加するフォーム
const ActivityAddForm = (props) => {
  const {userReportDt, setUserReportDt, dDate, activities, setActivies, setSnack} = props;
  const inputRef = useRef(null);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);

  const handleClick = () => {
    if(!text){
      setSnack({msg: '活動内容を入力してください。', severity: 'warning', id: new Date().getTime()});
      return
    }
    const currentUserActivities = userReportDt?.[dDate]?.activities ?? [];
    const newUserActivities = currentUserActivities.includes(text) ?currentUserActivities :[...currentUserActivities, text];
    const newUserReportDt = changeUserReportDtValue(userReportDt, dDate, "activities", newUserActivities);
    setUserReportDt(newUserReportDt);
    setActivies((prevActivities) => prevActivities.includes(text) ?prevActivities :[...activities, text]);
    setText("");
    if(inputRef.current) inputRef.current.focus();
  }

  return(
    <FormControl variant="outlined" style={{width: '100%'}}>
      <OutlinedInput
        inputRef={inputRef}
        placeholder="活動内容追加"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onCompositionStart={() => {setTyping(true)}}
        onCompositionEnd={() => setTyping(false)}
        onKeyDown={(e) => {
          if(!typing && e.key==="Enter") handleClick();
        }}
        endAdornment={
          <InputAdornment position="end">
            <IconButton onClick={handleClick} edge="end">
              <AddCircleOutlineIcon />
            </IconButton>
          </InputAdornment>
        }
      />
    </FormControl>
  )
}

// 活動内容ダイアログフォームに使用する活動チェックボックス
// const DailyReportContentsCheckboxes = (props) => {
//   const classes = useStyles();
//   const {contents, userReportDt, setUserReportDt, dDate, dtKey} = props;
//   const defaultValue = userReportDt?.[dDate]?.[dtKey] ?? [];

//   const handleChange = (e) => {
//     const checkboxName = e.target.name;
//     const checked = e.target.checked;
//     let changedValue = JSON.parse(JSON.stringify(defaultValue));
//     if(checked){
//       changedValue.push(checkboxName);
//     }else{
//       changedValue = changedValue.filter(val => val !== checkboxName);
//     }
//     if(props.setValue){
//       props.setValue(changedValue);
//     }
//     if(setUserReportDt){
//       const newUserReportDt = changeUserReportDtValue(userReportDt, dDate, dtKey, changedValue);
//       setUserReportDt(newUserReportDt);
//     }
//   }

//   const checkboxes = contents.map(content => {
//     const defaultChecked = defaultValue.includes(content);
//     return(<FormControlLabel
//       control={
//         <Checkbox
//           color="primary"
//           checked={defaultChecked}
//           onChange={handleChange}
//           name={content}
//         />
//       }
//       label={content}
//     />)
//   });

//   if(!checkboxes.length) return null;
//   return(
//     <div className={classes.checkboxes}>
//       {checkboxes}
//     </div>
//   )
// }

const ActivitiesContents = (props) => {
  const classes = useStyles();
  const {activitiesDid} = useContext(ActivitiedContext);
  const {contents, userReportDt, setUserReportDt, dDate, dtKey, contentsFilter} = props;
  const defaultValue = userReportDt?.[dDate]?.[dtKey] ?? [];
  const didYear = parseInt(dDate.slice(1, 5));
  const didMonth = parseInt(dDate.slice(5, 7))-1;
  const didDate = parseInt(dDate.slice(7, 9));

  const handleClick = (content) => {
    let changedValue = JSON.parse(JSON.stringify(defaultValue));
    if(!defaultValue.includes(content)){
      changedValue.push(content);
    }else{
      changedValue = changedValue.filter(val => val !== content);
    }
    if(props.setValue){
      props.setValue(changedValue);
    }
    if(setUserReportDt){
      const newUserReportDt = changeUserReportDtValue(userReportDt, dDate, dtKey, changedValue);
      setUserReportDt(newUserReportDt);
    }
  }

  const contentButtons = contents.filter(content => {
    const contentDid = activitiesDid[content];
    if(!contentDid) return true;
    const contentTime = new Date(parseInt(contentDid.slice(1, 5)), parseInt(contentDid.slice(5, 7))-1, parseInt(contentDid.slice(7, 9))).getTime();
    if(contentsFilter===2 && (contentTime < new Date(didYear, didMonth, didDate-15).getTime())) return false;
    if(contentsFilter===1 && (contentTime < new Date(didYear, didMonth, didDate-30).getTime())) return false;
    return true;
  }).sort((a, b) => {
    return a.localeCompare(b, 'ja');
  }).map(content => {
    return(
      <Button
        color="primary"
        variant={defaultValue.includes(content) ?"contained" :"outlined"}
        onClick={() => handleClick(content)}
        style={{borderRadius: '16px', margin: '4px 6px', textTransform: 'none'}}
      >
        {content}
      </Button>
    )
  });

  if(!contentButtons.length) return null;
  return(
    <div>
      {contentButtons}
    </div>
  )
}

// const ActivitiesSelectedContents = (props) => {
//   const {userReportDt, setUserReportDt, dDate, dtKey} = props;
//   const defaultValue = userReportDt?.[dDate]?.[dtKey] ?? [];

//   const handleChange = (content) => {
//     const changedValue = defaultValue.filter(val => val !== content)
//     if(setUserReportDt){
//       const newUserReportDt = changeUserReportDtValue(userReportDt, dDate, dtKey, changedValue);
//       setUserReportDt(newUserReportDt);
//     }
//   }

//   const contentButtons = defaultValue.map(content => {
//     return(
//       <Button
//         color="primary"
//         variant="contained"
//         onClick={() => handleChange(content)}
//         style={{borderRadius: '16px', margin: '4px 6px'}}
//       >
//         {content}
//       </Button>
//     )
//   });

//   if(!contentButtons.length) return null;
//   return(
//     <div style={{padding: '8px 18px', borderBottom: `1px solid ${grey[400]}`}}>
//       {contentButtons}
//     </div>
//   )
// }

// 活動内容ダイアログを構成
const DailyReportActivityContentDialog = (props) => {
  const classes = useStyles();
  const {
    activities, setActivies, dialogOpen, setDialogOpen, dtKey, userReportDt, setUserReportDt, dDate, setSnack
  } = props;
  const [contentsFilter, setContentsFilter] = useSessionStorageState(0, "dailyReportActivityContentsFilter");

  const handleClose = () => {
    setDialogOpen(false);
  };

  console.log(activities)

  const checkboxesProps = {contents: activities, userReportDt, setUserReportDt, dDate, dtKey, contentsFilter};
  const activityAddFormProps = {userReportDt, setUserReportDt, dDate, activities, setActivies, setSnack};
  return(
    <Dialog
      open={dialogOpen}
      onClose={handleClose}
      className={classes.activitiesContentDialog}
      fullWidth
      PaperProps={{
        style: {maxHeight: "70vh", minHeight: "70vh"}
      }}
    >
      <DialogTitle style={{borderBottom: `1px solid ${grey[400]}`}}>
        活動内容登録
        <IconButton
          onClick={handleClose}
          style={{position: 'absolute', right: 8, top: 8}}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <div style={{paddingBottom: '4px'}}>
        <Tabs
          value={contentsFilter}
          onChange={(e, nweEvent) => setContentsFilter(nweEvent)}
          indicatorColor="primary"
          textColor="primary"
          centered
          style={{minHeight: '32px'}}
        >
          <Tab style={{minHeight: '32px'}} label="通常" />
          <Tab style={{minHeight: '32px'}} label="直近30日" />
          <Tab style={{minHeight: '32px'}} label="直近15日" />
        </Tabs>
      </div>
      <DialogContent style={{padding: '8px 18px'}}>
        <ActivitiesContents {...checkboxesProps} />
      </DialogContent>
      <DialogActions style={{padding: '16px 24px', borderTop: `1px solid ${grey[400]}`}}>
        <ActivityAddForm {...activityAddFormProps} />
      </DialogActions>
    </Dialog>
  )
}

// 日報フォームパーツ　活動内容ダイアログフォーム本体
export const ActivitiesContentsField = (props) => {
  const {activities, setActivies} = useContext(ActivitiedContext);
  const [dialogOpen, setDialogOpen] = useState(false);

  const contentFieldProps = {contents: activities, setDialogOpen, ...props};
  const dialogProps = {activities, setActivies, dialogOpen, setDialogOpen, ...props};
  return(
    <>
    <ContentField {...contentFieldProps} />
    <DailyReportActivityContentDialog {...dialogProps} />
    </>
  )
}

// 日報フォームパーツ　フリーソロ用
const DailyReportFreeSolo = (props) => {
  const classes = useStyles();
  const {options, setOptions, userReportDt, setUserReportDt, dDate, dtKey, label=""} = props;
  const [optionIndex, setOptionIndex] = useState(null);

  const handleChange = (e, value) => {
    const thisValue = value ?? e.target.value;
    if(props.setValue){
      props.setValue(thisValue);
    }
    if(setUserReportDt){
      const newUserReportDt = changeUserReportDtValue(userReportDt, dDate, dtKey, thisValue);
      setUserReportDt(newUserReportDt);
    }
  }

  const handleBlur = (e) => {
    const value = e.target.value;
    if(setOptions && value){
      const newOptions = JSON.parse(JSON.stringify(options));
      if(optionIndex === null){
        newOptions.push(value);
        setOptionIndex(newOptions.length - 1);
      }else{
        newOptions[optionIndex] = value;
      }
      setOptions([...new Set(newOptions)]);
    }
  }

  return(
    <Autocomplete
      freeSolo
      options={options}
      getOptionLabel={option => option || ""}
      value={userReportDt?.[dDate]?.[dtKey] ?? ""}
      onChange={handleChange}
      size="small"
      className={classes.freesoloField}
      disabled={props.disabled}
      renderInput={(params) => (
        <AlbHMuiTextField
          color="primary"
          autoCompleteParams={params}
          // variant="outlined"
          label={label}
          width={props.width}
          onChange={handleChange}
          onBlur={handleBlur}
          className="textField"
        />
      )}
    />
  )
}

/**
 * 車両フリーソロ
 * CarOptionsContextから取得した車両名をフリーソロアイテムとして使用
 * @param {*} props 
 * @returns 
 */
export const CarFreeSolo = (props) => {
  const {carOptions, setCarOptions} = useContext(CarOptionsContext);
  return(
    <DailyReportFreeSolo
      options={carOptions} setOptions={setCarOptions}
      label="車両"
      {...props}
    />
  )
}

export const SubStaffFormAddButton = (props) => {
  const {setSubStaffOpen, disabled} = props;

  const handleClick = () => {
    setSubStaffOpen(true);
  }

  return(
    <div style={{margin: '16px 8px 0 -8px', display: 'flex', alignItems: 'flex-start'}}>
      <IconButton
        onClick={handleClick}
        style={{padding: 4}}
        disabled={disabled}
      >
        <AddCircleOutlineIcon style={{fontSize: 20}} />
      </IconButton>
    </div>
  )
}

/**
 * 担当者フリーソロ
 * StaffOptionsContextから取得した担当者名をフリーソロアイテムとして使用
 * @param {*} props 
 * @returns 
 */
export const StaffFreeSolo = (props) => {
  const {staffOptions, setStaffOptions} = useContext(StaffOptionsContext);
  return(
    <DailyReportFreeSolo
      options={staffOptions} setOptions={setStaffOptions}
      label={props.label ?? "送迎担当"}
      {...props}
    />
  )
}

// 日報フォームパーツ　記録用
export const DailyReportNoticeTextFeild = (props) => {
  const {userReportDt, setUserReportDt, dDate, defaultValue="",  dtKey, label=""} = props;

  const handleChange = (e) => {
    const value = e.target.value;
    if(props.setValue){
      props.setValue(value);
    }
    if(setUserReportDt){
      const newUserReportDt = changeUserReportDtValue(userReportDt, dDate, dtKey, value);
      setUserReportDt(newUserReportDt);
    }
  }

  return(
    <AlbHMuiTextField
      color="primary"
      variant="outlined"
      value={userReportDt?.[dDate]?.[dtKey] ?? defaultValue}
      width={props.width}
      size="small"
      multiline
      minRows={3} maxRows={5}
      rows={3} rowsMax={5}
      onChange={handleChange}
    />
  )
}

// 日報フォームパーツ　送迎先セレクター
export const DailyReportTransferSelect = (props) => {
  const classes = useStyles();
  const config = useSelector(state => state.config);
  const transferList = config?.transferList;
  const {userReportDt, setUserReportDt, dDate, defaultValue="", dtKey, label=""} = props;

  const handleChange = (e) => {
    const selectValue = e.target.value;
    if(props.setValue){
      props.setValue(selectValue);
    }
    if(setUserReportDt){
      const newUserReportDt = changeUserReportDtValue(userReportDt, dDate, dtKey, selectValue);
      setUserReportDt(newUserReportDt);
    }
  }

  const transferItems = transferList.map((location, i) => (
    <MenuItem key={dtKey+(i+1)} value={location}>{location}</MenuItem>
  ));

  return(
    <FormControl
      size="small"
      style={{width: props.width}}
    >
      {label &&<InputLabel shrink >{label}</InputLabel>}
      <Select
        lebel={label}
        value={userReportDt?.[dDate]?.[dtKey] ?? defaultValue}
        displayEmpty
        onChange={handleChange}
        disabled={props.disabled}
      >
        <MenuItem value="">送迎なし</MenuItem>
        {transferItems}
      </Select>
    </FormControl>
  )
}

// 日報フォームパーツ　テキスト用
export const DailyReportTextField = (props) => {
  const classes = useStyles();
  const {userReportDt, setUserReportDt, dDate, defaultValue="",  dtKey, label=""} = props;

  const handleChange = (e) => {
    const value = e.target.value;
    if(props.setValue){
      props.setValue(value);
    }
    if(setUserReportDt){
      const newUserReportDt = changeUserReportDtValue(userReportDt, dDate, dtKey, value);
      setUserReportDt(newUserReportDt);
    }
  }

  return(
    <AlbHMuiTextField
      color="primary"
      width={props.width}
      size="small"
      label={label}
      value={userReportDt?.[dDate]?.[dtKey] ?? defaultValue}
      onChange={handleChange}
    />
  )
}

// 日報のフォームパーツ　時間入力用
export const DailyReportTimeInput = (props) => {
  const {
    userReportDt, setUserReportDt, dDate, defaultValue="",  dtKey, label="",
    pairedStartTime, pairedEndTime, minMins=0
  } = props;

  const handleChange = (e) => {
    const value = e.target.value;
    if(props.setValue){
      props.setValue(value);
    }
    if(setUserReportDt){
      const newUserReportDt = changeUserReportDtValue(userReportDt, dDate, dtKey, value);
      setUserReportDt(newUserReportDt);
    }
  }

  const handleBlur = (value) => {
    const newUserReportDt = changeUserReportDtValue(userReportDt, dDate, dtKey, value);
    setUserReportDt(newUserReportDt);
  }

  const textFieldProps = {
    width: props.width, size: "small", label,
    value: userReportDt?.[dDate]?.[dtKey] ?? defaultValue,
    onChange: handleChange,
  }
  return(
    <TimeInput
      textFieldProps={textFieldProps}
      handleBlur={handleBlur}
      pairedStartTime={pairedStartTime}
      pairedEndTime={pairedEndTime}
      disabled={props.disabled}
      minMins={minMins}
    />
  )
}

// 日報の項目を切り替える
export const SchDailyReportTabs = (props) => {
  const {selectTab, setSelectTab} = props;

  const handleChange = (e, newValue) => {
    sessionStorage.setItem("schDailyReportSelectTab", String(newValue));
    setSelectTab(newValue);
  }

  return(
    <Tabs
      indicatorColor="primary"
      textColor="primary"
      centered
      value={selectTab}
      onChange={handleChange}
      style={{minHeight: "auto"}}
    >
      <Tab label="迎え" style={{minHeight: "auto"}} />
      <Tab label="送り" style={{minHeight: "auto"}} />
      <Tab label="活動・記録" style={{minHeight: "auto"}} />
    </Tabs>
  )
}