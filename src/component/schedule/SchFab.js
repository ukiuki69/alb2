import React, { useEffect, useState , useRef} from 'react';
import { getSchInitName } from './schUtility/getSchInitName';
import { useTobeInit } from './schUtility/useTobeInit';
import { Fab, makeStyles, Tooltip } from '@material-ui/core';
import { getUisCookie, getUisCookieInt, uisCookiePos } from '../../commonModule';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import { useSelector } from 'react-redux';
import SchLokedDisplay from '../common/SchLockedDisplay';
import SchEditDisabledDisplay from '../common/SchEditDisabledDisplay';
import ExposureIcon from '@material-ui/icons/Exposure';
import EditIcon from '@material-ui/icons/Edit';
import { KeyListener } from '../common/KeyListener';
import { AddictionConfirming } from '../common/materialUi';
import { blue } from '@material-ui/core/colors';
import FilterNoneIcon from '@material-ui/icons/FilterNone';
import EventAvailableIcon from '@material-ui/icons/EventAvailable';
import ForwardIcon from '@material-ui/icons/Forward';

const useStyle = makeStyles({
  fabAnimationStart: {opacity:0, transition: 'all 600ms 600ms ease'},
  fabAnimationEnd: {opacity:1},
  extendedIcon: {marginRight: 8,},
  customTooltip: {maxWidth: 300, fontSize: 12},

});

export const FAV_ADDREMOVE = 1;
export const FAV_REMOVE = 3;
export const FAV_ADDEDIT = 2;
export const FAV_PASTE = 4;
export const FAV_NOOPE = 0;
export const FAV_AUTOFILL = 5;

// Schedule用fab
// 作り直し
// dispatch型は廃止する
// 追加削除と削除ボタンを選択できるようにする
// テンプレート適用ボタンも追加する予定
// thisMode 0 未選択 1 追加削除 2 追加修正 3 削除 4 ペースト
export const SchFab = ({fabSch, setFabSch, displayAutoFill, autoFillClicked})=>{
  const classes = useStyle();
  const allState = useSelector(state=>state);
  const {hid, bid, schedule, serviceItems, service} = allState;
  const scheduleLocked = schedule.locked;
  
  const addRemoveStyle = (fabSch === FAV_ADDREMOVE || fabSch === FAV_REMOVE) ?
    { backgroundColor: '#C62828', color: '#fff' } :
    { backgroundColor: '#888', color: '#eee' };
  const addEditStyle = (fabSch === FAV_ADDEDIT) ?
    { backgroundColor: '#00695c', color: '#fff' } :
    { backgroundColor: '#888', color: '#eee' };
  const pasteStyle = (fabSch === FAV_PASTE) ?
    { backgroundColor: blue[900], color: '#fff' } :
    { backgroundColor: '#888', color: '#eee' };
  const autoFillStyle = { backgroundColor: blue[900], color: '#fff' };
  
  const keyInfoInit = {key: '', shift: false, ctrl: false, meta: false,}
  const [keyInfo, setKeyInfo] = useState(keyInfoInit);
  const uisp = uisCookiePos;
  const useAddDeleteButton = getUisCookieInt(uisp.useAddDeleteButtonOnFab);
  const usePasteButton = getUisCookieInt(uisp.useTemplatePaste);
  const allowDispAll = getUisCookieInt(uisp.allowDispAllOnScheduleMonthly);
  
  // const {schedule} = allState;
  // let schCnt = 0;
  // Object.keys(schedule).filter(e=>e.match(/^UID/)).map(e=>{
  //   schCnt += Object.keys(schedule[e]).filter(f=>f.match(/^D2/)).length
  // });

  // 表示条件の追加。SchInitilizerに定義されているカスタムフックを利用する
  const schInitName = getSchInitName(hid, bid);
  const tobeInit = useTobeInit(schInitName);

  const clickHandler = (v) =>{
    setFabSch((v === fabSch)? FAV_NOOPE: v);
  }
  const [aniClass, setAniClass] = useState(classes.fabAnimationStart);
  const [schInitilizing, setSchInitilizing] = useState(true);

  useEffect(()=>{
    let isMounted = true;
    const chk = (
      !keyInfo.shift && !keyInfo.ctrl && !keyInfo.meta && isMounted
    )
    const shift = (
      keyInfo.shift && !keyInfo.ctrl && !keyInfo.meta && isMounted
    )
    const key = keyInfo.key.toLowerCase();
    // 追加削除
    if (key === 'w' && chk && useAddDeleteButton){
      clickHandler(FAV_ADDREMOVE);
      setKeyInfo(keyInfoInit);
    }
    // 削除
    if (key === 'w' && chk && !useAddDeleteButton){
      clickHandler(FAV_REMOVE);
      setKeyInfo(keyInfoInit);
    }
    // 追加修正
    if (key === 'e' && chk){
      clickHandler(FAV_ADDEDIT);
      setKeyInfo(keyInfoInit);
    }
    // ペースト
    if (key === 'q' && chk){
      clickHandler(FAV_PASTE);
      setKeyInfo(keyInfoInit);
    }
    // 保管
    if (key === 'e' && shift){
      autoFillClicked();
    }
    return (()=>{
      isMounted = false;
    })
    
  }, [keyInfo])

  useEffect(() => {
    let isMounted = true; // マウント状態を追跡するフラグ

    const f = async () => {
      setTimeout(() => {
        if (isMounted) { // マウントされている場合のみ状態を更新
          setAniClass(classes.fabAnimationEnd);
          setSchInitilizing(false);
        }
      }, 2000);
    };

    if (isMounted) {
      f();
    }

    return () => {
      isMounted = false; // クリーンアップ時にフラグをfalseに設定
    };
  }, []);

  if (scheduleLocked){
    return (
      <SchLokedDisplay/>
    )
  }
  if (allowDispAll && serviceItems.length > 1 && service === ''){
    return (
      <SchEditDisabledDisplay />
    )
  }

  const toolTipText = '入力した予定実績を週単位で補完します。Shit+Eキーでも実行できます。'
  return (
    <>
    {schInitilizing === true && tobeInit &&
      <>
      <AddictionConfirming />
      <div style={{display: 'none'}} id='floatingActionButtonsExist'></div>
      </>
    }
    <div className={"floatingActionButtons " + aniClass}>
      {displayAutoFill &&
        <Tooltip title={toolTipText} classes={{ tooltip: classes.customTooltip }}>
          <Fab variant="extended" style={autoFillStyle}
            onClick={()=>autoFillClicked()}
          >
          <EventAvailableIcon className={classes.extendedIcon} />
            補完 <ForwardIcon style={{ transform: 'rotate(270deg)', fontSize: '.9rem' }} />E
          </Fab>
        </Tooltip>
      
      }
      {usePasteButton === 1 &&
        <Fab variant="extended" style={pasteStyle}
          onClick={()=>clickHandler(FAV_PASTE)}
        >
          <FilterNoneIcon className={classes.extendedIcon} />
          雛形 Q
        </Fab>
    
      }
      {useAddDeleteButton === 1 &&
        <Fab variant="extended" style={addRemoveStyle}
          onClick={()=>clickHandler(FAV_ADDREMOVE)}
        >
          <ExposureIcon className={classes.extendedIcon} />
          追加・削除 W
        </Fab>
      }
      {useAddDeleteButton !== 1 &&
        <Fab variant="extended" style={addRemoveStyle}
          onClick={()=>clickHandler(FAV_REMOVE)}
        >
          <DeleteForeverIcon className={classes.extendedIcon} />
          削除 W
        </Fab>
      }
      <Fab variant="extended" style={addEditStyle}
        onClick={() => clickHandler(FAV_ADDEDIT)}
      >
        <EditIcon className={classes.extendedIcon} />
        追加・修正 E
      </Fab>
      <div style={{display: 'none'}} id='floatingActionButtonsExist'></div>
    </div>
    <KeyListener setKeyInfo={setKeyInfo}/>
    </>
  );
}
