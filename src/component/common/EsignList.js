import { alpha, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, Fab, FormControlLabel, makeStyles } from '@material-ui/core';
import React, { createContext, useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import { convDid } from '../../commonModule';
import { DAY_LIST } from '../../hashimotoCommonModules';
import { grey, red, teal } from '@material-ui/core/colors';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import VisibilityIcon from '@material-ui/icons/Visibility';
import SnackMsg from './SnackMsg';
import { useSessionStorageState } from './HashimotoComponents';
import { DispNameWithAttr } from '../Users/Users';
import axios from 'axios';

const NO_CELL_WIDTH = 32;
const USERNAME_CELL_WIDTH = 136;
const CELL_WIDTH = 24;
// 削除時の確認ダイアログを表示しないようにするためのローカルストレージのキー
const NO_CONFIRM_TO_DELETE_ESIGN_LOCALSTORAGE_KEY = "EsignList_noConfirmToDeleteEsign";

const DAY_EN_LIST = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MAX_RETRY = 5;

const deleteEsign = async(hid, bid, uid, stdDate, data) => {
  const url = "https://houday.rbatos.com/api/uploadSignatureImg.php";
  const directory = ["teikyuouJisseki", hid, bid, uid, stdDate];
  const esignImgUrl = data.esignImgUrl;
  if(!esignImgUrl) return {};
  const params = new FormData();
  params.append('directory', JSON.stringify(directory));
  const filename = esignImgUrl.split("/").at(-1);
  params.append('delete', filename);
  const headers = {'content-type': 'multipart/form-data'}
  for(let retry=0; retry<MAX_RETRY; retry++){
    try{
      const res = await axios.post(url, params, headers);
      // 成功
      return res.data.result;
    }catch(error){
      console.error(`Error during attempt ${retry}:`, error);
      if(retry+1 < MAX_RETRY) continue;
      throw error;
    }
  }

  return {};
}

const SnackContext = createContext();
const DeleteConfirmDialogContext = createContext();
const ConfirmImgDialogContext = createContext();
const NoConfirmDeleteContext = createContext();

const useStyles = makeStyles({
  root: {
    width: '100%',
    padding: '0 16px',
    '& .row': {
      display: 'flex',
      '& .cell': {
        position: 'relative',
        padding: '8px 0px',
        textAlign: 'center',
        borderBottom: '1px solid #ddd',
        '&.no': {minWidth: NO_CELL_WIDTH, maxWidth: NO_CELL_WIDTH},
        '&.name': {
          minWidth: USERNAME_CELL_WIDTH, width: USERNAME_CELL_WIDTH, flex: 0.5,
          textAlign: 'start',
          borderRight: '1px solid #ddd',
          paddingRight: 8, paddingLeft: 8,
        },
        '&.date': {
          minWidth: CELL_WIDTH, width: CELL_WIDTH, flex: 0.1,
          backgroundColor: '#fff',
          '&.offschool': {backgroundColor: 'rgb(255, 241, 226)'},
          '&.weekend': {backgroundColor: '#cacad9'},
          '&.monday': {backgroundColor: grey[100], '&.offschool': {backgroundColor: '#ffe9d0'}},
          '&.wednesday': {backgroundColor: grey[100], '&.offschool': {backgroundColor: '#ffe9d0'}},
          '&.friday': {backgroundColor: grey[100], '&.offschool': {backgroundColor: '#ffe9d0'}},
        },
        '&.active': {
          cursor: 'pointer',
        },
        '&.active .mask': {
          position: 'absolute', top: 0, left: 0,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          width: '100%', height: '100%',
          opacity: 0,
          '&:hover': {
            opacity: 1
          }
        },
        '&.active.delete': {
          '& .mask': {
            backgroundColor: alpha(red[100], 0.5)
          }
        },
        '&.active.confirm': {
          '& .mask': {
            backgroundColor: alpha(teal[100], 0.5)
          }
        }
      }
    },
    '& .header': {
      position: 'sticky', top: 84, zIndex: 2,
      paddingTop: 8, backgroundColor: '#fff',
      '& .row': {
        alignItems: 'flex-end',
        '& .cell': {
          borderBottom: `1px solid ${teal[800]}`,
          '&.date': {fontSize: '0.8rem', padding: '4px 0'}
        }
      }
    },
    '& .buttons': {
      position: 'fixed', bottom: 20, right: 20,
      '& button:not(:last-child)': {marginRight: 12},
    }
  },
  button: {
    '&.delete': {
      color: "#fff",
      backgroundColor: '#888',
      '&.active': {backgroundColor: red[800]},
      '&:hover': {
        backgroundColor: '#777',
        '&.active': {backgroundColor: red[900]}
      },
    },
    '&.confirm': {
      color: "#fff",
      backgroundColor: '#888',
      '&.active': {backgroundColor: teal[800]},
      '&:hover': {
        backgroundColor: '#777',
        '&.active': {backgroundColor: teal[900]}
      },
    },
  },
  confirmDialog: {
    '& .suffix': {
      marginInlineEnd: 4,
      '&.sama': {marginInlineEnd: 8},
    },
    '& .name': {fontSize: '1.2rem', color: teal[800], fontWeight: 'bold'},
    '& .month': {fontSize: '1.2rem', marginInlineEnd: 2},
    '& .date': {fontSize: '1.2rem', marginInlineEnd: 2},
    '& .delete.button': {
      backgroundColor: red[800], color: '#fff',
      '&:hover': {
        backgroundColor: red[900],
      }
    }
  }
});

const HeaderRow = () => {
  const dateList = useSelector(state => state.dateList);

  const dateCells = dateList.map(dateDt => {
    const date = dateDt.date.getDate();
    const day = dateDt.date.getDay();
    const holiday = dateDt.holiday ?? 0;
    const holidayClass = holiday===1 ?"offschool" :holiday===2 ?"weekend" :"";
    return(
      <div className={`date cell ${DAY_EN_LIST[day]} ${holidayClass}`} key={`headerDateCell${date}`}>
        <div className='date'>{date}</div>
        <div className='day'>{DAY_LIST[day]}</div>
      </div>
    )
  })

  return(
    <div className='row'>
      <div className='no cell'>No</div>
      <div className='name cell'>氏名</div>
      {dateCells}
    </div>
  )
}

const EsignDeleteConfirmDialog = (props) => {
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const {setSnack} = useContext(SnackContext);
  const {setNoConfirmDelete} = useContext(NoConfirmDeleteContext);
  const classes = useStyles();
  const {name, dateDt, did, data, setData, uid, onClose, ...dialogProps} = props;
  const [checked, setChecked] = useState(false);

  const handleClick = async() => {
    const deletedData = await deleteEsign(hid, bid, uid, stdDate, data);
    setData(deletedData);
    if(checked) setNoConfirmDelete(true);
    setSnack({msg: '削除しました。', id: new Date().getTime()});
    onClose();
  }

  const month = dateDt?.date?.getMonth()+1 ?? "";
  const date = dateDt?.date?.getDate() ?? "";
  const day = dateDt?.date?.getDay() ?? "";
  return(
    <Dialog className={classes.confirmDialog} {...dialogProps}>
      <DialogTitle
        style={{backgroundColor: red["A700"], color: '#fff', padding: '8px 24px'}}
      >
        電子サインを削除します
      </DialogTitle>
      <DialogContent dividers>
        <div>
          <div>
            <div style={{lineHeight: '2rem'}}>
              <span className='name'>{name}</span>
              <span className='sama suffix'>さま</span>
              <span className='month'>{month}</span>
              <span className='suffix'>月</span>
              <span className='date'>{date}</span>
              <span className='suffix'>日</span>
              <span className='day'>({DAY_LIST[day]})</span>
            </div>
            <div style={{lineHeight: '1.5rem'}}>電子サインを削除します。よろしいですか？</div>
          </div>
          <div style={{textAlign: 'center', marginTop: 4}}>
            <FormControlLabel
              control={<Checkbox
                color="primary"
                checked={checked}
                onChange={e => setChecked(e.target.checked)}
              />}
              label="次回から削除確認を表示しない"
            />
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          color="secondary"
          variant="contained"
        >
          キャンセル
        </Button>
        <Button
          className="delete button"
          onClick={handleClick}
          variant="contained"
        >
          削除
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const EsiginConfirmImgDialog = (props) => {
  const classes = useStyles();
  const {name, dateDt, dateEsignDt, onClose, ...dialogProps} = props;
  const esiginImgUrl = dateEsignDt?.esignImgUrl ?? "";

  const month = dateDt?.date?.getMonth()+1 ?? "";
  const date = dateDt?.date?.getDate() ?? "";
  const day = dateDt?.date?.getDay() ?? "";
  return(
    <Dialog className={classes.confirmDialog} {...dialogProps}>
      <DialogTitle
        style={{backgroundColor: teal[800], color: '#fff', padding: '8px 24px'}}
      >
        {name}さま　{month}月{date}日({DAY_LIST[day]})
      </DialogTitle>
      <DialogContent dividers style={{textAlign: 'center'}}>
        <img src={esiginImgUrl} alt="電子サイン" />
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          variant="contained"
        >
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const DateCell = (props) => {
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const {setSnack} = useContext(SnackContext);
  const {noConfirmDelete} = useContext(NoConfirmDeleteContext);
  const {setConfirmDialogParams} = useContext(DeleteConfirmDialogContext);
  const {setConfirmImgDialogParams} = useContext(ConfirmImgDialogContext);
  const {user, dateDt, did, dateEsignDt, mode} = props;
  const date = dateDt.date.getDate();
  const day = dateDt.date.getDay();
  const [data, setData] = useState(dateEsignDt);

  const handleClick = async() => {
    if(!mode) return;
    // 対象ではない場合は何もしない
    if(!data){
      setSnack({msg: '利用予定がありません。', severity: 'warning'});
      return;
    }
    // 電子サインが未入力の場合は警告を表示する
    if(!data.esignImgUrl){
      setSnack({msg: '電子サインは未入力です。', severity: 'warning'});
      return;
    }
    if(mode === 'delete'){
      if(noConfirmDelete){
        // 削除確認ダイアログを表示しない。
        // 直接削除処理を走らせる
        const deletedData = await deleteEsign(hid, bid, user.uid, stdDate, data);
        setData(deletedData);
        setSnack({msg: '削除しました。', id: new Date().getTime()});
      }else{
        // 削除確認ダイアログを表示する
        setConfirmDialogParams({open: true, name: user.name, dateDt, did, data, setData, uid: user.uid});
      }
      return;
    }
    // 確認ダイアログを開く
    if(mode === 'confirm'){
      setConfirmImgDialogParams({open: true, name: user.name, dateDt, dateEsignDt});
      return;
    }
  }

  const holiday = dateDt.holiday ?? 0;
  const holidayClass = holiday===1 ?"offschool" :holiday===2 ?"weekend" :"";
  return (
    <div
      className={`date cell ${DAY_EN_LIST[day]} ${mode ?"active" :""} ${mode} ${holidayClass}`}
      onClick={handleClick}
    >
      {Boolean(data) &&(
        <div>
          {!Boolean(data.esignImgUrl) &&<span style={{color: red["A700"], fontWeight: 'bold'}}>未</span>}
          {Boolean(data.esignImgUrl) &&<span style={{color: teal[800], fontWeight: 'bold'}}>済</span>}
        </div>
      )}
      <div className='mask' />
    </div>
  )
}

const UserRow = (props) => {
  const dateList = useSelector(state => state.dateList);
  const {no, user, userEsignDt, mode} = props;
  const cells = dateList.map(dateDt => {
    const did = convDid(dateDt.date);
    const dateEsignDt = userEsignDt[did];
    return(
      <DateCell
        key={`dateCell${did}`}
        user={user}
        dateDt={dateDt} did={did}
        dateEsignDt={dateEsignDt}
        mode={mode}
      />
    )
  })
  return (
    <div className='row'>
      <div className='no cell'>{no}</div>
      <div className='name cell'>
        <DispNameWithAttr {...user} />
      </div>
      {cells}
    </div>
  )
}

const EsignDeleteButton = (props) => {
  const classes = useStyles();
  const {mode, setMode} = props;

  const handleClick = () => {
    setMode(prevMode => prevMode !== 'delete' ? 'delete' :null);
  }

  return(
    <Fab
      variant="extended"
      className={`${classes.button} delete ${mode==='delete' ?'active' :''}`}
      onClick={handleClick}
    >
      <DeleteForeverIcon />
      <span style={{marginLeft: 8, marginRight: 4}}>削除</span>
    </Fab>
  )
}

const EsignConfirmButton = (props) => {
  const classes = useStyles();
  const {mode, setMode} = props;

  const handleClick = () => {
    setMode(prevMode => prevMode !== 'confirm' ? 'confirm' :null);
  }

  return(
    <Fab
      variant="extended"
      className={`${classes.button} confirm ${mode==='confirm' ?'active' :''}`}
      onClick={handleClick}
    >
      <VisibilityIcon />
      <span style={{marginLeft: 8, marginRight: 4}}>確認</span>
    </Fab>
  )
}

/**
 * @param {esignDt: Object} props 
 * esignDt: {
    "UID1": {
      "Dyyyymmdd": {
        "esignImgUrl": "https://example.com/esignImgUrl.png",
      }
    }
  }
 * @returns {React.ReactNode}
 */
const EsignList = (props) => {
  const users = useSelector(state => state.users);
  const dateList = useSelector(state => state.dateList);
  const classes = useStyles();
  const {esignDt} = props;
  const [snack, setSnack] = useState({});
  const [mode, setMode] = useState(null);
  const [noConfirmDelete, setNoConfirmDelete] = useSessionStorageState(false, NO_CONFIRM_TO_DELETE_ESIGN_LOCALSTORAGE_KEY);
  const [confirmDialogParams, setConfirmDialogParams] = useState({open: false});
  const [confirmImgDialogParams, setConfirmImgDialogParams] = useState({open: false});

  const rows = (users || []).filter(user => {
    const uid = user.uid;
    const userEsignDt = esignDt?.["UID"+uid] ?? {};
    if(!dateList.some(dateDt => userEsignDt?.[convDid(dateDt.date)])) return false;
    return true;
  }).map((user, i) => {
    const uid = user.uid;
    const userEsignDt = esignDt?.["UID"+uid] ?? {};
    return(
      <UserRow
        key={`userRow${uid}`}
        no={i+1}
        user={user}
        userEsignDt={userEsignDt}
        mode={mode}
      />
    )
  });

  return (
    <>
    <SnackContext.Provider value={{setSnack}}>
    <NoConfirmDeleteContext.Provider value={{noConfirmDelete, setNoConfirmDelete}}>
    <DeleteConfirmDialogContext.Provider value={{setConfirmDialogParams}}>
    <ConfirmImgDialogContext.Provider value={{setConfirmImgDialogParams}}>
    <div className={classes.root}>
      <div className='header'>
        <HeaderRow />
      </div>
      <div className='body'>
        {rows}
      </div>
      <div className='buttons'>
        <EsignDeleteButton mode={mode} setMode={setMode} />
        <EsignConfirmButton mode={mode} setMode={setMode} />
      </div>
    </div>
    <EsignDeleteConfirmDialog
      onClose={prevParams => setConfirmDialogParams({open: false, ...prevParams})}
      {...confirmDialogParams}
    />
    <EsiginConfirmImgDialog
      onClose={prevParams => setConfirmImgDialogParams({open: false, ...prevParams})}
      {...confirmImgDialogParams}
    />
    </ConfirmImgDialogContext.Provider>
    </DeleteConfirmDialogContext.Provider>
    </NoConfirmDeleteContext.Provider>
    </SnackContext.Provider>
    <SnackMsg {...snack} />
    </>
  )
}
export default EsignList;