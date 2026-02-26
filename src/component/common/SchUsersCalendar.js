import { alpha, Fab, makeStyles } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { convDid, getUisCookie, uisCookiePos } from '../../commonModule';
import { DAY_LIST } from '../../hashimotoCommonModules';
import { grey, red, teal, yellow } from '@material-ui/core/colors';
import { DispNameWithAttr } from '../Users/Users';
import { getFilteredUsers, recentUserStyle } from '../../albCommonModule';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import CreateIcon from '@material-ui/icons/Create';
import { permissionCheckTemporary } from '../../modules/permissionCheck';
import { PERMISSION_DEVELOPER, PERMISSION_STAFF } from '../../modules/contants';
import { KeyListener } from './KeyListener';
import { useAutoScrollToRecentUser } from './useAutoScrollToRecentUser';

const NO_CELL_WIDTH = 32;
const USERNAME_CELL_WIDTH = 136;
const CELL_WIDTH = 24;

const DAY_EN_LIST = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const useStyles = makeStyles({
  root: {
    width: '100%',
    padding: '0 16px',
    '& .row': {
      display: 'flex',
      borderLeft: '4px solid transparent',
      '& .cell': {
        position: 'relative',
        padding: '8px 0px',
        textAlign: 'center',
        borderBottom: '1px solid #ddd',
        '&.no': {minWidth: NO_CELL_WIDTH, maxWidth: NO_CELL_WIDTH},
        '&.name': {
          display: 'flex', justifyContent: 'space-between',
          minWidth: USERNAME_CELL_WIDTH, width: USERNAME_CELL_WIDTH, flex: 0.5,
          textAlign: 'start',
          borderRight: '1px solid #ddd',
          paddingRight: 8, paddingLeft: 8,
        },
        '&.date': {
          minWidth: CELL_WIDTH, width: CELL_WIDTH, flex: 0.1,
          backgroundColor: '#fff',
          padding: '4px 0',
          '&.offschool': {backgroundColor: 'rgb(255, 241, 226)'},
          '&.weekend': {backgroundColor: '#cacad9'},
          '&.monday': {backgroundColor: grey[100], '&.offschool': {backgroundColor: '#ffe9d0'}},
          '&.wednesday': {backgroundColor: grey[100], '&.offschool': {backgroundColor: '#ffe9d0'}},
          '&.friday': {backgroundColor: grey[100], '&.offschool': {backgroundColor: '#ffe9d0'}},
        },
        '&.active': {
          cursor: 'pointer',
          '& .mask': {
            position: 'absolute', top: 0, left: 0,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            width: '100%', height: '100%',
            opacity: 0,
            '&:hover': {
              opacity: 1
            }
          },
          '&.delete': {
            '& .mask': {
              backgroundColor: alpha(red[100], 0.5)
            }
          },
          '&.confirm': {
            '& .mask': {
              backgroundColor: alpha(teal[100], 0.5)
            }
          },
          '&.edit': {
            '& .mask': {
              backgroundColor: alpha(teal[100], 0.5)
            }
          }
        },
        '&.editing': {
          '& .mask': {
            opacity: '1 !important'
          }
        },
      }
    },
    '& .header': {
      position: 'sticky', top: 84, zIndex: 2,
      paddingTop: 8, backgroundColor: '#fff',
      '& .row': {
        alignItems: 'flex-end',
        '& .cell': {
          borderTop: '4px solid transparent',
          '&.hover': {
            borderColor: teal[300],
          },
          borderBottom: `1px solid ${teal[800]}`,
          '&.date': {
            fontSize: '0.8rem'
          },
          '& .divider': {
            width: '80%', height: '1px', backgroundColor: '#ddd',
            margin: '4px auto', 
          },
          '& .option': {
            fontSize: '0.8rem',
          }
        }
      }
    },
    '& .body': {
      '& .row': {
        '&.hover': {
          borderColor: teal[300],
        },
        '& .cell': {
          alignItems: 'flex-start',
          '&.date': {
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            fontSize: 14
          }
        }
      }
    },
    '& .buttons': {
      position: 'fixed', bottom: 20, right: 20,
      '& button:not(:last-child)': {marginRight: 20},
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
    '&.edit': {
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

const DeleteFabButton = (props) => {
  const classes = useStyles();
  const {mode, setMode} = props;

  const handleClick = () => {
    setMode(prevMode => prevMode !== 'delete' ? 'delete' :null);
  }

  const disabledKbShortCut = getUisCookie(uisCookiePos.kbShortCutDisabled) === '1';
  return(
    <Fab
      variant="extended"
      className={`${classes.button} delete ${mode==='delete' ?'active' :''}`}
      onClick={handleClick}
    >
      <DeleteForeverIcon />
      <span style={{marginLeft: 8, marginRight: 4}}>削除</span>
      {!disabledKbShortCut &&<span>W</span>}
    </Fab>
  )
}

const EditFabButton = (props) => {
  const classes = useStyles();
  const {mode, setMode} = props;

  const handleClick = () => {
    setMode(prevMode => prevMode !== 'edit' ? 'edit' :null);
  }

  const disabledKbShortCut = getUisCookie(uisCookiePos.kbShortCutDisabled) === '1';
  return(
    <Fab
      variant="extended"
      className={`${classes.button} edit ${mode==='edit' ?'active' :''}`}
      onClick={handleClick}
    >
      <CreateIcon />
      <span style={{marginLeft: 8, marginRight: 4}}>追加・修正</span>
      {!disabledKbShortCut &&<span>E</span>}
    </Fab>
  )
}

const HeaderRow = (props) => {
  const dateList = useSelector(state => state.dateList);
  const {didOption, hoveredCell} = props;

  const dateCells = dateList.map(dateDt => {
    const date = dateDt.date.getDate();
    const day = dateDt.date.getDay();
    const holiday = dateDt.holiday ?? 0;
    const holidayClass = holiday===1 ?"offschool" :holiday===2 ?"weekend" :"";
    const did = convDid(dateDt.date);
    return(
      <div
        key={`headerDateCell${date}`}
        className={`date cell ${DAY_EN_LIST[day]} ${holidayClass} ${hoveredCell.did===did ?"hover" : ""}`}
      >
        <div>
          <div className='date'>{date}</div>
          <div className='day'>{DAY_LIST[day]}</div>
        </div>
        {Boolean(didOption?.[did]) &&(<>
          <div className='divider' />
          <div className='option'>{didOption?.[did]?.optionNode ?? ""}</div>
        </>)}
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

const DateCell = (props) => {
  const bid = useSelector(state => state.bid);
  const {dateDt, mode, didData, uid, did, handleDelete, handleEdit, editingCell, setHoveredCell} = props;
  const day = dateDt.date.getDay();

  const holiday = dateDt.holiday ?? 0;
  const holidayClass = holiday===1 ?"offschool" :holiday===2 ?"weekend" :"";

  const handleClick = (event) => {
    if(!mode) return;
    if(mode === 'delete') handleDelete(event, uid, did);
    if(mode === 'edit') handleEdit(event, uid, did);
  }

  const highlight = localStorage.getItem(bid + "UID"+uid + did);
  const isEditing = editingCell.uid===uid && editingCell.did===did;
  return (
    <div
      className={`date cell ${DAY_EN_LIST[day]} ${mode ?"active" :""} ${isEditing ? "editing" : ""} ${mode} ${holidayClass}`}
      onClick={handleClick}
      style={highlight ? {backgroundColor: yellow[100]} : {}}
      onMouseEnter={() => setHoveredCell({uid, did})}
      onMouseLeave={() => setHoveredCell({})}
    >
      <div>{didData?.cellNode ?? ""}</div>
      <div className='mask' />
    </div>
  )
}

const UserRow = (props) => {
  const dateList = useSelector(state => state.dateList);
  const {no, user, userData, userUidOption, mode, handleDelete, handleEdit, editingCell, hoveredCell, setHoveredCell} = props;
  const cells = dateList.map(dateDt => {
    const did = convDid(dateDt.date);
    const didData = userData?.[did] ?? {};
    return(
      <DateCell
        key={`dateCell${user.uid}${did}`}
        dateDt={dateDt}
        didData={didData}
        mode={mode}
        did={did}
        uid={user.uid}
        handleDelete={handleDelete}
        handleEdit={handleEdit}
        editingCell={editingCell}
        setHoveredCell={setHoveredCell}
      />
    )
  });
  return (
    <div className={`row ${hoveredCell.uid===user.uid ?"hover" : ""}`} id={'user-row-' + user.uid}>
      <div className='no cell' style={{...recentUserStyle(user.uid)}}>{no}</div>
      <div className='name cell'>
        <DispNameWithAttr {...user} zIndex={1} />
        {Boolean(userUidOption?.optionNode) &&<div className='uidOption'>{userUidOption.optionNode}</div>}
      </div>
      {cells}
    </div>
  )
}

/**
 * @param {data: Object} props.data
 * @param {uidOption: Object} props.uidOption
 * @param {didOption: Object} props.didOption
 * @param {stickyTop: number} props.stickyTop
 * @param {handleDelete: Function} props.handleDelete
 * @param {handleEdit: Function} props.handleEdit
 * @param {editingCell: Object} props.editingCell
 *{
    "UIDxxx": {
      "Dyyyymmdd": {
        "cellNode": React.ReactNode,
      }
    }
  }
 * @returns {React.ReactNode}
 */
const SchUsersCalendar = (props) => {
  const account = useSelector(state => state.account);
  const users = useSelector(state => state.users);
  const service = useSelector(state => state.service);
  const classroom = useSelector(state => state.classroom);
  const classes = useStyles();
  const {
    data={}, uidOption={}, didOption={}, stickyTop=84,
    handleDelete, handleEdit,
    editingCell={},
  } = props;

  // 最近操作したユーザーへの自動スクロール
  useAutoScrollToRecentUser('user-row-');

  // 操作ボタンのモードを管理
  const [mode, setMode] = useState(null);
  // ホバーしているセルの情報を管理するstate
  const [hoveredCell, setHoveredCell] = useState({});

  // ショートカットキー関連
  const [keyInfo, setKeyInfo] = useState({key: '', shift: false, ctrl: false, meta: false});
  useEffect(()=>{
    const {key, shift, ctrl, meta} = keyInfo;
    if (!shift && !ctrl && !meta){
      if (key === 'w') setMode('delete');
      if (key === 'e') setMode('edit');
    }
  }, [keyInfo]);

  const filteredUsers = getFilteredUsers(users, service, classroom);
  const rows = (filteredUsers || []).map((user, i) => {
    const uid = user.uid;
    const userData = data?.["UID"+uid] ?? {};
    const userUidOption = uidOption?.["UID"+uid] ?? {};
    return(
      <UserRow
        key={`userRow${uid}`}
        no={i+1}
        user={user} userData={userData} userUidOption={userUidOption}
        mode={mode} handleDelete={handleDelete} handleEdit={handleEdit}
        editingCell={editingCell}
        hoveredCell={hoveredCell} setHoveredCell={setHoveredCell}
      />
    )
  });

  return (
    <>
    <div className={classes.root}>
      <div className='header' style={{top: stickyTop}}>
        <HeaderRow didOption={didOption} hoveredCell={hoveredCell} />
      </div>
      <div className='body'>
        {rows}
      </div>
      {permissionCheckTemporary(PERMISSION_STAFF, account) &&<div className='buttons'>
        {typeof handleDelete === "function" &&<DeleteFabButton mode={mode} setMode={setMode} />}
        {typeof handleEdit === "function" &&<EditFabButton mode={mode} setMode={setMode} />}
      </div>}
    </div>
    <KeyListener setKeyInfo={setKeyInfo} />
    </>
  )
}
export default SchUsersCalendar;