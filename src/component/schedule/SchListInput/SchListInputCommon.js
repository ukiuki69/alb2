import { Button, ButtonGroup, Checkbox, makeStyles, MenuItem, Select, useMediaQuery } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { ListInputActualCostCheckbox, TimeInput, Transfer } from '../../common/StdFormParts';
import { amber, blue, brown, cyan, deepPurple, green, grey, indigo, lightBlue, lightGreen, orange, pink, purple, red, teal, yellow } from '@material-ui/core/colors';
import { LC2024 } from '../../../modules/contants';
import { EnchouShien2024, IryouRenkei, JikanKubun, KankeiRenkei, KazokuShien1, KazokuShien2, Kosodate, SenmonJisshi, SenmonShien } from '../../common/AddictionFormParts';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import { checkValueType } from '../../dailyReport/DailyReportCommon';
import SnackMsg from '../../common/SnackMsg';
import { JIHATSU } from '../../../modules/contants';
import { sendPartOfScheduleCompt, setRecentUser } from '../../../albCommonModule';
import { getJikanKubunAndEnchou } from '../../../modules/elapsedTimes';
import { setSnackMsg, setStore } from '../../../Actions';
import { setLocalStorageItemWithTimeStamp } from '../../../modules/localStrageOprations';
import { useGetSchListInputSettingLSItem } from './SchListInputSetting';
import { shortWord } from '../../../commonModule';
import CheckIcon from '@material-ui/icons/Check';
import NotInterestedIcon from '@material-ui/icons/NotInterested';
import PauseIcon from '@material-ui/icons/Pause';
import CloseIcon from '@material-ui/icons/Close';


const MIN_WIDTH = 560;
const SIDEBAR_WIDTH = 61.25;
const OVERALL_MAX_WIDTH = 1080;
const MULTINPUT_WIDTH = 42;
const USERNAME_WIDTH = 112;
const DATE_WIDTH = 80;
const ABSENCE_WIDTH = 42;
const SCHSTATUS_WIDTH = 114;
const TIME_WIDTH = 68;
const KUBUN_WIDTH = 128;
const ENCHOUSHIEN_WIDTH = 128;
const TRANSFER_WIDTH = 120;
const GROUPE_WIDTH = 100;
const SCROLLBAR_WIDTH = 4;
const CHECKBOX_WIDTH = 32;
export const LISTINPUT_BAKCGROUND_COLORS = [
  red[700],indigo[800], pink[800], purple[500], green[800],
  brown[400], orange[800], cyan[500], 
  grey[600], deepPurple[300], amber[500], lightGreen[800],
];

/**
 * formDtの値を確認する。errorがある場合はfalseを返す
 * @param {Object} formDt 
 * @return {Boolean}
 */
export const checkSchListInputBasicDt = (dt) => {
  // 開始時間
  const formDtStart = dt.start;
  if(!checkValueType(formDtStart, 'String')) return false;
  if(!/^(0[0-9]|1[0-9]|2[0-3]|[0-9]):[0-5][0-9]$/.test(formDtStart)) return false;
  // 終了時間
  const formDtEnd = dt.end;
  if(!checkValueType(formDtEnd, 'String')) return false;
  if(!/^(0[0-9]|1[0-9]|2[0-3]|[0-9]):[0-5][0-9]$/.test(formDtEnd)) return false;
  
  return true;
};

export const updateSchListInputBasicDt = (formDt, newSchDt, com, config, stdDate, service, serviceItems, hideOnTabelEdit) => {
  const dispalyService = service ?service :serviceItems[0];
  const is2024ver = stdDate >= LC2024;

  // 出欠席の状態
  const formDtSchStatus =  formDt.schStatus;
  switch(formDtSchStatus){
    case "出席": {
      const isFixedFromReserve = newSchDt.reserve === true;
      newSchDt.absence = false;
      newSchDt.noUse = false;
      newSchDt.reserve = false;
      if(!checkValueType(newSchDt?.dAddiction, "Object")) newSchDt.dAddiction = {};
      delete newSchDt.dAddiction["欠席時対応加算"];
      
      if (isFixedFromReserve) {
        newSchDt.reserveFixedTimestamp = new Date().getTime();
      }
      break;
    }
    case "欠席": {
      newSchDt.absence = true;
      newSchDt.noUse = false;
      newSchDt.reserve = false;
      if(!checkValueType(newSchDt?.dAddiction, "Object")) newSchDt.dAddiction = {};
      delete newSchDt.dAddiction["欠席時対応加算"];
      break;
    }
    case "欠席加算": {
      newSchDt.absence = true;
      newSchDt.noUse = false;
      newSchDt.reserve = false;
      if(!checkValueType(newSchDt?.dAddiction, "Object")) newSchDt.dAddiction = {};
      newSchDt.dAddiction["欠席時対応加算"] = "1";
      break;
    }
    case "予約": {
      newSchDt.absence = true;
      newSchDt.noUse = false;
      newSchDt.reserve = true;
      if(!checkValueType(newSchDt?.dAddiction, "Object")) newSchDt.dAddiction = {};
      delete newSchDt.dAddiction["欠席時対応加算"];
      break;
    }
    case "利用なし": {
      newSchDt.absence = true;
      newSchDt.noUse = true;
      newSchDt.reserve = false;
      if(!checkValueType(newSchDt?.dAddiction, "Object")) newSchDt.dAddiction = {};
      delete newSchDt.dAddiction["欠席時対応加算"];
      break;
    }
  }

  // 開始時間
  const formDtStart = formDt.start;
  if(checkValueType(formDtStart, 'String')) newSchDt.start = formDtStart;

  // 終了時間
  const formDtEnd = formDt.end;
  if(checkValueType(formDtEnd, 'String')) newSchDt.end = formDtEnd;

  // 送迎先
  if(hideOnTabelEdit?.transfer ?? true){
    if(!checkValueType(newSchDt.transfer, 'Array')) newSchDt.transfer = ["", ""];
    const newTransfer = newSchDt.transfer;
    const formDtPickup = formDt.pickup;
    newTransfer[0] = checkValueType(formDtPickup, 'String') ?formDtPickup :"";
    const formDtDropoff = formDt.dropoff;
    newTransfer[1] = checkValueType(formDtDropoff, 'String') ?formDtDropoff :"";
  }

  // 実費
  const actualCostValueDt = com?.etc?.actualCostList ?? config.actualCostList;
  const formDtActualCost = formDt.actualCost;
  if(!checkValueType(newSchDt.actualCost, 'Object')) newSchDt.actualCost = {};
  const schActualCost = newSchDt.actualCost;
  if(checkValueType(formDtActualCost, 'Object')){
    Object.entries(formDtActualCost).forEach(([key, checked]) => {
      if(checked){
        schActualCost[key] = actualCostValueDt[key];
      }else{
        delete schActualCost[key];
      }
    });
  }else if(checkValueType(formDtActualCost, 'Array')){
    formDtActualCost.forEach(acDt => {
      if(acDt.checked){
        schActualCost[acDt.name] = acDt.price;
      }else{
        delete schActualCost[acDt.name];
      }
    });
  }

  // グループ
  const formDtGroupe = formDt?.groupe;
  if(checkValueType(formDtGroupe, 'String')) newSchDt.groupe = formDtGroupe;
  else delete newSchDt.groupe;

  // 担当スタッフ
  const formDtTeachers = formDt.teachers;
  if(checkValueType(formDtTeachers, 'Object')) newSchDt.teachers = Object.keys(formDtTeachers).filter(key => formDtTeachers[key]);
  else if(checkValueType(formDtTeachers, 'Array')) newSchDt.teachers = formDtTeachers;

  // dAddictionの現在の値を確認
  if(!checkValueType(newSchDt.dAddiction, 'Object')) newSchDt.dAddiction = {};
  const dAddiction = newSchDt.dAddiction;

  // 時間区分・延長支援関係
  if(is2024ver){
    const useKubun3 = dispalyService === JIHATSU || newSchDt.offSchool === 1;
    const t = getJikanKubunAndEnchou(newSchDt.start, newSchDt.end, useKubun3);
    const autoSetting = com?.addiction?.[dispalyService]?.["時間区分延長支援自動設定"];
    const jikanKubun = formDt?.["時間区分"] ?? formDt.jikanKubun ?? "";
    if(parseInt(autoSetting) >= 1 && !jikanKubun){
      dAddiction["時間区分"] = t["区分"];
    }else{
      dAddiction["時間区分"] = jikanKubun;
    }
    if(!dAddiction["時間区分"]) delete dAddiction["時間区分"];
    const enchouShien = formDt["延長支援"] ?? formDt.enchouShien ?? "";
    if(parseInt(autoSetting) >= 2 && !enchouShien){
      dAddiction["延長支援"] = t["延長支援"]===undefined ?'-1' :t["延長支援"];
    }else{
      dAddiction["延長支援"] = enchouShien;
    }
    if(!dAddiction["延長支援"]) delete dAddiction["延長支援"];
  }

  // タイムスタンプ付与
  newSchDt.timestamp = new Date().getTime();
}

export const updateSchListInputKasanDt = (formDt, newSchDt) => {
  // dAddictionの現在の値を確認
  if(!checkValueType(newSchDt.dAddiction, 'Object')) newSchDt.dAddiction = {};
  const dAddiction = newSchDt.dAddiction;

  if(!newSchDt?.absence){
    // absenceがない時だけ処理をするもの

    // 専門的支援加算
    const formDtSenmonShien = formDt.senmonShien ?? formDt["専門的支援加算"];
    if(formDtSenmonShien) dAddiction["専門的支援加算"] = formDtSenmonShien;
    else delete dAddiction["専門的支援加算"];

    // 専門的支援加算
    const formDtSenmonJisshi = formDt.senmonJisshi ?? formDt["専門的支援実施加算"];
    if(formDtSenmonJisshi) dAddiction["専門的支援実施加算"] = formDtSenmonJisshi;
    else delete dAddiction["専門的支援実施加算"];

    // 医療連携体制加算
    const formDtIryouRenkei = formDt.iryouRenkei ?? formDt["医療連携体制加算"];
    if(formDtIryouRenkei) dAddiction["医療連携体制加算"] = formDtIryouRenkei;
    else delete dAddiction["医療連携体制加算"];
  }

  // 家族支援加算Ⅰ
  const formDtKazokuShien1 = formDt.kazokuShien1 ?? formDt["家族支援加算Ⅰ"];
  if(formDtKazokuShien1) dAddiction["家族支援加算Ⅰ"] = formDtKazokuShien1;
  else delete dAddiction["家族支援加算Ⅰ"];

  // 家族支援加算Ⅱ
  const formDtKazokuShien2 = formDt.kazokuShien2 ?? formDt["家族支援加算Ⅱ"];
  if(formDtKazokuShien2) dAddiction["家族支援加算Ⅱ"] = formDtKazokuShien2;
  else delete dAddiction["家族支援加算Ⅱ"];

  // 家族支援加算Ⅱ
  const formDtKosodate = formDt.kosodate ?? formDt["子育てサポート加算"];
  if(formDtKosodate) dAddiction["子育てサポート加算"] = formDtKosodate;
  else delete dAddiction["子育てサポート加算"];

  // 関係機関連携加算
  const formDtKankeiRenkei = formDt.kankeiRenkei ?? formDt["関係機関連携加算"];
  if(formDtKankeiRenkei) dAddiction["関係機関連携加算"] = formDtKankeiRenkei;
  else delete dAddiction["関係機関連携加算"];

  // タイムスタンプ付与
  newSchDt.timestamp = new Date().getTime();
}

const getSchDtStatus = (schDt) => {
  if(schDt?.noUse) return "利用なし";
  if(schDt?.reserve) return "予約";
  if(schDt?.absence){
    if(schDt?.dAddiction?.["欠席時対応加算"] == 1) return "欠席加算";
    return "欠席";
  }
  return "出席"
}

export const useGetDid = () => {
  const {date} = useParams();
  const stdDate = useSelector(state => state.stdDate);
  const [stdYear, stdMonth] = stdDate.split("-");
  const did =  "D" + stdYear + stdMonth + String(date).padStart(2, '0');
  return did;
}

const useGetCheckboxMaxCountDt = (otherItems=[]) => {
  const com = useSelector(state => state.com);
  const config = useSelector(state => state.config);
  const hideOnTabelEdit = useGetSchListInputSettingLSItem();

  let rowOverallWidth = 0;
  rowOverallWidth += 8; //実費の右マージ
  if(otherItems.includes("absence")) rowOverallWidth += ABSENCE_WIDTH;
  if(otherItems.includes("checkbox")) rowOverallWidth += MULTINPUT_WIDTH; //一括入力用チェックボックス
  if(otherItems.includes("name")) rowOverallWidth += USERNAME_WIDTH; // 利用者名
  if(otherItems.includes("date")) rowOverallWidth += DATE_WIDTH;
  rowOverallWidth += TIME_WIDTH * 2; //開始終了時間
  rowOverallWidth += KUBUN_WIDTH; //時間区分
  rowOverallWidth += ENCHOUSHIEN_WIDTH; //延長支援
  if(hideOnTabelEdit?.transfer !==false ) rowOverallWidth += TRANSFER_WIDTH * 2; //送迎場所
  if((com?.ext?.schGroupes ?? []).length && (hideOnTabelEdit?.groupes ?? true)) rowOverallWidth += GROUPE_WIDTH; //クラス
  rowOverallWidth += SCROLLBAR_WIDTH; // スクロールバー
  const actualCosts = Object.keys(com?.etc?.actualCostList ?? config.actualCostList ?? {}).filter(key => hideOnTabelEdit?.[key] !== false);
  let actualsCostMaxCount = actualCosts.length;
  let actualCostsOverallWidth = CHECKBOX_WIDTH * actualsCostMaxCount;
  if(hideOnTabelEdit?.teachers ?? true){
    const teachers = com?.ext?.schTeachers ?? [];
    let teachersMaxCount = teachers.length;
    let teachersOverallWidth = CHECKBOX_WIDTH * teachersMaxCount;
    while(rowOverallWidth+actualCostsOverallWidth+teachersOverallWidth > OVERALL_MAX_WIDTH){
      // 最大幅から溢れる
      if(actualsCostMaxCount === teachersMaxCount){
        actualsCostMaxCount -= 1;
        teachersMaxCount -= 1;
      }else if(actualsCostMaxCount > teachersMaxCount){
        actualsCostMaxCount -= 1;
      }else if(actualsCostMaxCount < teachersMaxCount){
        teachersMaxCount -= 1;
      }
      actualCostsOverallWidth = CHECKBOX_WIDTH * actualsCostMaxCount;
      teachersOverallWidth = CHECKBOX_WIDTH * teachersMaxCount;
    }
    return {actualsCost: actualsCostMaxCount, teachers: teachersMaxCount};
  }else{
    return {actualsCost: 5};
  }
}

export const useSchListInputStyles = makeStyles({
  AppPage: {
    width: 'fit-content', margin: '96px auto 0',
    minWidth: MIN_WIDTH + SIDEBAR_WIDTH,
    paddingLeft: SIDEBAR_WIDTH,
    position: 'relative',
    '& .title': {
      textAlign: 'center', fontSize: 20,
      // color: teal[800]
    },
    '& .options': {
      display: 'flex', justifyContent: 'space-between'
    },
    '& .setting': {
      position: 'absolute', top: 0, right: 0
    }
  },
  info: {
    display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
    margin: '16px 0',
    '& > div': {
      margin: '0 4px'
    },
    '& .date, .honorificTitle, .ageStr, .schoolName': {
      fontSize: 12
    },
    '& .userName': {
      fontSize: 18,
      '& .honorificTitle': {marginLeft: 2}
    },
  },
  MainForm: {
    width: 'fit-content', margin: '0 auto', minWidth: MIN_WIDTH,
    '& .options': {
      display: 'flex', justifyContent: 'space-between'
    },
    '& .formHeader, .formBody': {
      '& .row': {
        display: 'flex',
        // maxWidth: OVERALL_MAX_WIDTH,
        paddingRight: SCROLLBAR_WIDTH,
        '& .multInputCheckbox': {width: MULTINPUT_WIDTH},
        '& .date': {width: DATE_WIDTH},
        '& .name': {width: USERNAME_WIDTH},
        '& .absence': {width: ABSENCE_WIDTH, justifyContent: 'center'},
        '& .schStatus': {
          width: SCHSTATUS_WIDTH,
          '& .icon': {
            fontSize: 16, marginBottom: -2
          }
        },
        '& .time': {width: TIME_WIDTH},
        '& .kubun': {width: KUBUN_WIDTH},
        '& .enchou': {width: ENCHOUSHIEN_WIDTH},
        '& .transfer': {width: TRANSFER_WIDTH},
        '& .groupe': {width: GROUPE_WIDTH},
        '& .dAddiction': {width: 128},
      },
    },
    '& .formHeader': {
      paddingBottom: 4, marginBottom: 2,
      borderBottom: `1px solid ${teal[800]}`,
      '& .row': {
        textAlign: 'center', alignItems: 'center',
        '& .actualCost': {fontSize: 12, textAlign: 'start'},
        '& .scrollbar': {width: SCROLLBAR_WIDTH},
        '& .dAddiction': {
          position: 'relative',
          '& .count': {
            position: 'absolute', right: 0, top: -4,
            minWidth: '16px', height: '16px',
            textAlign: 'center', lineHeight: '16px', fontSize: '12px',
            padding: '0 4px',
            color: '#fff',
            backgroundColor: lightBlue[800],
            borderRadius: '8px'
          }
        }
      },
    },
    '& .formBody': {
      overflowY: 'scroll',
      maxHeight: 'calc(100vh - 368px)',
      '&::-webkit-scrollbar': {
        width: 4
      },
      '& .row': {
        '&:not(:last-child)': {
          marginBottom: 16
        },
        '& .date, .name, .absence': {
          fontSize: 16, height: 35,
          display: 'flex', alignItems: 'center', marginTop: 2,
        },
        '& .absence': {fontWeight: 'bold'},
        '& .offSchool' : { color: yellow[900]},
        '& .offSchool.sunday': {color: pink[500]},
        '& .off': { color: 'rgb(202,202,217)' },
        '& .aFormPartsWrapper': {
          marginBottom: 0
        },
        '& .actualCost': {
          paddingTop: 4,
          '& .MuiFormControlLabel-root': {
            marginRight: 0, marginLeft: 0
          }
        }
      },
      '& .userNotice': {
        fontSize: 14,
        marginTop: -12, marginBottom: 16,
        '&.perUserRow': {marginLeft: DATE_WIDTH},
        '&.perDateRow': {marginLeft: USERNAME_WIDTH+42}
      }
    },
    '& .buttons': {
      textAlign: 'end',
      marginTop: 16,
      '& .canselButton ,.sendButton, .transitionButton': {
        width: 104
      },
      '& .sendButton, .transitionButton': {
        marginLeft: 8
      },
      '& .transitionButton': {
        '&:hover': {
          
        }
      },
      '& .disabled': {
        backgroundColor: null
      }
    }
  },
  multInputMainForm: {
    width: 'fit-content', margin: '0 auto',
    '& .row': {
      display: 'flex',
      '& .date': {width: 84},
      '& .time': {width: TIME_WIDTH},
      '& .kubun': {width: KUBUN_WIDTH},
      '& .enchou': {width: ENCHOUSHIEN_WIDTH},
      '& .transfer': {width: TRANSFER_WIDTH},
      '& .groupe': {width: GROUPE_WIDTH},
    },
    '& .formHeader': {
      textAlign: 'center', borderBottom: `1px solid ${teal[800]}`,
      paddingBottom: 4,
      '& .row': {
        alignItems: 'center',
        '& .actualCost, .teacher': {
          textAlign: 'start', fontSize: 12
        }
      }
    },
    '& .formBody': {
      '& .actualCost': {
        paddingTop: 4,
        '& .MuiFormControlLabel-root': {
          marginRight: 0, marginLeft: 0
        }
      },
    },
    '& .buttons': {
      textAlign: 'end',
      marginTop: 16,
      '& .canselButton ,.sendButton': {
        width: 112
      },
      '& .sendButton': {
        marginLeft: 12
      }
    }
  },
});

const useStyles = makeStyles({
  SchListInputFormOptions: {
    display: 'flex', justifyContent: 'space-between',
    margin: '16px 0 8px'
  },
  TimeInputs: {
    display: 'flex'
  }
});

// --フォームオプション関係

const ChangeFormButtons = ({setFormType}) => {
  const SESSIONSTORAGE_ITEM = "SchListInputFormSelect";
  const BASIC_KEY = "basic";
  const KASAN_KEY = "kasan";
  const [form, setForm] = useState(sessionStorage.getItem(SESSIONSTORAGE_ITEM) ?? BASIC_KEY);

  const buttonStyle = {fontSize: 12, padding: '3px 12px'};
  return(
    <ButtonGroup color="primary" >
      <Button
        variant={form===BASIC_KEY ?'contained' :'outlined'}
        onClick={() => {
          sessionStorage.setItem(SESSIONSTORAGE_ITEM, BASIC_KEY);
          setFormType(BASIC_KEY);
          setForm(BASIC_KEY);
        }}
        style={buttonStyle}
      >
        基本入力
      </Button>
      <Button
        variant={form===KASAN_KEY ?'contained' :'outlined'}
        onClick={() => {
          sessionStorage.setItem(SESSIONSTORAGE_ITEM, KASAN_KEY);
          setFormType(KASAN_KEY);
          setForm(KASAN_KEY);
        }}
        style={buttonStyle}
      >
        加算入力
      </Button>
    </ButtonGroup>
  )
}

const KubunBulkChangeButton = ({setFormDt}) => {
  const com = useSelector(state => state.com);
  const stdDate = useSelector(state => state.stdDate);
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service ?service :serviceItems[0];
  const autoSetting = com?.addiction?.[displayService]?.["時間区分延長支援自動設定"] ?? "0";

  if(stdDate < LC2024) return null;
  if(Number(autoSetting) == 0) return null;
  if (Number(autoSetting) === 3) return null;
  const handleClick = () => {
    setFormDt(prevFormDt => {
      const newFormDt = {...prevFormDt};
      Object.keys(newFormDt).forEach(uidStr => {
        const newUserFormDt = newFormDt[uidStr];
        Object.keys(newUserFormDt).forEach(did => {
          newUserFormDt[did].jikanKubun = "";
          newUserFormDt[did].edit = true;
        });
      });
      return newFormDt;
    });
    const elements = document.getElementsByName("時間区分");
    elements.forEach(element => {
      const className = element.className;
      if(!className.includes("disabled")){
        element.value = "";
        element.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }

  return(
    <Button
      variant='contained'
      onClick={handleClick}
      style={{fontSize: 12, padding: '4px 12px'}}
    >
      時間区分を全て自動
    </Button>
  )
}

const EnchoBulkChangeButton = ({setFormDt}) => {
  const com = useSelector(state => state.com);
  const stdDate = useSelector(state => state.stdDate);
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service ?service :serviceItems[0];
  const autoSetting = com?.addiction?.[displayService]?.["時間区分延長支援自動設定"] ?? "0";

  if(stdDate < LC2024) return null;
  if(Number(autoSetting) != 2) return null;

  const handleClick = () => {
    setFormDt(prevFormDt => {
      const newFormDt = {...prevFormDt};
      Object.keys(newFormDt).forEach(uidStr => {
        const newUserFormDt = newFormDt[uidStr];
        Object.keys(newUserFormDt).forEach(did => {
          newUserFormDt[did].enchouShien = "";
          newUserFormDt[did].edit = true;
        });
      });
      return newFormDt;
    });
    const elements = document.getElementsByName("延長支援");
    elements.forEach(element => {
      const className = element.className;
      if(!className.includes("disabled")){
        element.value = "";
        element.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }

  return(
    <Button
      variant='contained'
      onClick={handleClick}
      style={{marginLeft: 16, fontSize: 12, padding: '4px 12px'}}
    >
      延長支援を全て自動
    </Button>
  )
}

export const SchListInputFormOptions = (props) => {
  const classes = useStyles();
  const {formDt, setFormDt, formType, setFormType, style} = props;

  return(
    <div className={classes.SchListInputFormOptions} style={style}>
      <div>
        {formType==="basic" &&<KubunBulkChangeButton setFormDt={setFormDt} />}
        {formType==="basic" &&<EnchoBulkChangeButton setFormDt={setFormDt} />}
      </div>
      <div>
        <ChangeFormButtons setFormType={setFormType} />
      </div>
    </div>
  )
}


// フォームオプション関係--


// --フォームパーツ

export const SchListInputActualConstFormParts = (props) => {
  const classes = useStyles();
  const com = useSelector(state => state.com);
  const config = useSelector(state => state.config);
  const {type, schDt, uidStr, did, exName, checkboxMaxCount} = props;
  const hideOnTabelEdit = useGetSchListInputSettingLSItem();

  if(type === "header"){
    const actualCostList = com?.etc?.actualCostList ?? config?.actualCostList ?? {};
    const filteredActualCostTitles = Object.keys(actualCostList).filter(key => hideOnTabelEdit?.[key] !== false);
    const actualCostTitle = filteredActualCostTitles.map((actualCost, i) => {
      const colorStyle = LISTINPUT_BAKCGROUND_COLORS[i];
      if(i !== filteredActualCostTitles.length-1){
        return(
          <React.Fragment key={`actualCostHeader${i+1}`}>
            <span style={{color: colorStyle}}>{actualCost}</span>
            <span>/</span>
          </React.Fragment>
        )
      }else{
        return(
          <React.Fragment key={`actualCostHeader${i+1}`}>
            <span style={{color: colorStyle}}>{actualCost}</span>
          </React.Fragment>
        )
      }
    });

    return(
      <div className='actualCost' style={{width: CHECKBOX_WIDTH*checkboxMaxCount, marginRight: 8}}>
        {actualCostTitle}
      </div>
    )
  }else if(type === "body"){
    return(
      <div className={`${classes.actualCostFormParts} actualCost`} style={{width: CHECKBOX_WIDTH * checkboxMaxCount, marginRight: 8}}>
        <ListInputActualCostCheckbox
          {...props}
          value={schDt} uid={uidStr} did={did}
          required noLabel exName={exName}
          disabled={props.disabled} size='small'
        />
      </div>
    )
  }
}

export const SchListInputGroupeFormParts = (props) => {
  const com = useSelector(state => state.com);
  const {type, schDt} = props;

  const hideOnTabelEdit = useGetSchListInputSettingLSItem();
  if(hideOnTabelEdit?.groupes === false) return null;

  const groupes = com?.ext?.schGroupes ?? [];
  if(!groupes.length) return null;

  if(type === "header"){
    return(
      <div className='groupe'>クラス</div>
    )
  }
  if(type === "body"){
    const menuItems = groupes.map((groupe, i) => (<MenuItem key={`groupeMenuItem${i+1}`} value={groupe}>{groupe}</MenuItem>));
    const defaultValue = schDt.groupe ?groupes.includes(schDt.groupe) ?schDt.groupe :"" :"";
    const handleChange = (e) => {
      const value = e.target.value;
      if(props.setPropsVal) props.setPropsVal(value);
    }
    return(
      <div className='groupe' style={{padding: 4}}>
        <Select
          defaultValue={defaultValue}
          name={props.name}
          displayEmpty
          style={{width: '100%'}}
          disabled={props.disabled}
          onChange={handleChange}
        >
          <MenuItem value="">
            <em>未設定</em>
          </MenuItem>
          {menuItems}
        </Select>
      </div>
    )
  }
  return null;
}

export const SchListInputTeacherFormParts = (props) => {
  const classes = useStyles();
  const com = useSelector(state => state.com);
  const {type, schDt, exName, checkboxMaxCount} = props;

  const hideOnTabelEdit = useGetSchListInputSettingLSItem();
  if(hideOnTabelEdit?.teachers===false) return null;

  const schTeachers = schDt?.teachers ?? [];
  const teachers = com?.ext?.schTeachers ?? [];
  if(!teachers.length) return null;

  if(type === "header"){
    const teacherTitle = teachers.map((teacherName, i) => {
      const colorStyle = LISTINPUT_BAKCGROUND_COLORS[i];
      if(i !== Object.keys(teachers).length-1){
        return(
          <React.Fragment key={`teacherHeader${i+1}`}>
          <span style={{color: colorStyle}}>{teacherName}</span>
          <span>/</span>
          </React.Fragment>
        )
      }else{
        return(
          <React.Fragment key={`teacherHeader${i+1}`}>
          <span style={{color: colorStyle}}>{teacherName}</span>
          </React.Fragment>
        )
      }
    });

    return(
      <div className='actualCost' style={{width: CHECKBOX_WIDTH*checkboxMaxCount}}>
        {teacherTitle}
      </div>
    )
  }
  if(type === "body"){
    const checkboxes = teachers.map((teacherName, i) => {
      const colorStyle = LISTINPUT_BAKCGROUND_COLORS[i];
      const handleChange = (e) => {
        const checked = e.target.checked;
        if(props.setPropsVal){
          props.setPropsVal(prevVal => {
            let newVal = [...prevVal];
            if(checked){
              if(!prevVal.includes(teacherName)) newVal.push(teacherName);
            }else{
              newVal = prevVal.filter(v => v !== teacherName);
            }
            return newVal;
          });
        }
      }
      return(
        <Checkbox
          key={`teacherCheckbox${i+1}`}
          defaultChecked={schTeachers.includes(teacherName)}
          name={teacherName}
          value={`${exName}-teachers`}
          color="primary"
          className='checkbox'
          disabled={props.disabled}
          onChange={handleChange}
          style={{color: !props.disabled ?colorStyle :null, padding: 4}}
        />
      )
    })

    return(
      <div className={`${classes.teacherFormParts} actualCost`} style={{width: CHECKBOX_WIDTH * checkboxMaxCount}}>
        {checkboxes}
      </div>
    )
  }
  return null;
}

const SchStatusSelect = (props) => {
  const {schStatus, setSchStatus} = props;

  return(
    <div className='schStatus' style={{padding: '4px'}}>
      <Select
        value={schStatus}
        onChange={(e) => setSchStatus(e.target.value)}
        displayEmpty
        name={props.name}
        style={{width: '100%'}}
      >
        <MenuItem value="出席"><CheckIcon className='icon' style={{color: teal[800]}} />出席</MenuItem>
        <MenuItem value="欠席"><NotInterestedIcon className='icon' style={{color: red[900]}} />欠席</MenuItem>
        <MenuItem value="欠席加算"><NotInterestedIcon className='icon' style={{color: blue[900]}} />欠席加算</MenuItem>
        <MenuItem value="予約"><PauseIcon className='icon' style={{color: blue[600]}} />予約</MenuItem>
        <MenuItem value="利用なし"><CloseIcon className='icon' style={{color: red[900]}} />利用なし</MenuItem>
      </Select>
    </div>
  )
}

// --フォームヘッダー

export const SchListInputBasicFormHeaderRow = ({otherItems}) => {
  const stdDate = useSelector(state => state.stdDate);
  const is2024ver = stdDate >= LC2024;
  const hideOnTabelEdit = useGetSchListInputSettingLSItem();
  const checkboxMaxCountDt = useGetCheckboxMaxCountDt(otherItems);

  return(
    <>
    <div className='schStatus'>出欠席</div>
    <div className='time'>開始</div>
    <div className='time'>終了</div>
    {is2024ver &&<div className='kubun'>時間区分</div>}
    {is2024ver &&<div className='enchou'>延長支援</div>}
    {(hideOnTabelEdit?.transfer ?? true) &&<div className='transfer'>迎え</div>}
    {(hideOnTabelEdit?.transfer ?? true) &&<div className='transfer'>送り</div>}
    <SchListInputActualConstFormParts type="header" checkboxMaxCount={checkboxMaxCountDt.actualsCost} />
    {(hideOnTabelEdit?.groupes ?? true) &&<SchListInputGroupeFormParts type="header" />}
    {(hideOnTabelEdit?.teachers ?? true) &&<SchListInputTeacherFormParts type="header" checkboxMaxCount={checkboxMaxCountDt.teachers} />}
    </>
  )
}

export const SchListInputKasanFormHeaderRow = (props) => {
  const stdDate = useSelector(state => state.stdDate);
  const is2024ver = stdDate >= LC2024;

  const com = useSelector(state => state.com);
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const thisService = service ?service :serviceItems[0];
  // 古い加算表示設定
  const oldHAS = com?.addiction?.[thisService] ?? {};
  // 新しい加算表示設定
  const newHAS = com?.ext?.hideaddiction ?? {};

  const {formDt={}} = props;
  const count = Object.values(formDt).reduce((prevCount, didDt={}) => {
    Object.values(didDt).forEach((dt={}) => {
      if(dt.kazokuShien1) prevCount["家族支援加算Ⅰ"] += 1;
      if(dt.kazokuShien2) prevCount["家族支援加算Ⅱ"] += 1;
      if(dt.kosodate) prevCount["子育てサポート加算"] += 1;
      if(dt.senmonJisshi) prevCount["専門的支援実施加算"] += 1;
      if(dt.iryouRenkei) prevCount["医療連携体制加算"] += 1;
      if(dt.kankeiRenkei) prevCount["関係機関連携加算"] += 1;
    });
    return prevCount;
  }, {"家族支援加算Ⅰ": 0, "家族支援加算Ⅱ": 0, "子育てサポート加算": 0, "専門的支援実施加算": 0, "医療連携体制加算": 0, "関係機関連携加算": 0});

  return(
    <>
    {(oldHAS?.["家族支援加算Ⅰ"]!=-1 && newHAS?.["家族支援加算Ⅰ"]!=1)
      &&<div className='dAddiction'>
        {shortWord("家族支援加算Ⅰ")}
        {count["家族支援加算Ⅰ"]>0 &&<div className='count'>{count["家族支援加算Ⅰ"]}</div>}
      </div>
    }
    {(oldHAS?.["家族支援加算Ⅱ"]!=-1 && newHAS?.["家族支援加算Ⅱ"]!=1)
      &&<div className='dAddiction'>
        {shortWord("家族支援加算Ⅱ")}
        {count["家族支援加算Ⅱ"]>0 &&<div className='count'>{count["家族支援加算Ⅱ"]}</div>}
      </div>
    }
    {(is2024ver && oldHAS?.["子育てサポート加算"]!=-1 && newHAS?.["子育てサポート加算"]!=1)
      &&<div className='dAddiction'>
        {shortWord("子育てサポート加算")}
        {count["子育てサポート加算"]>0 &&<div className='count'>{count["子育てサポート加算"]}</div>}
      </div>
    }
    {(!is2024ver && oldHAS?.["専門的支援加算"]!=-1 && newHAS?.["専門的支援加算"]!=1)
      &&<div className='dAddiction'>{shortWord("専門的支援加算")}</div>
    }
    {(is2024ver && oldHAS?.["専門的支援実施加算"]!=-1 && newHAS?.["専門的支援実施加算"]!=1)
      &&<div className='dAddiction'>
        {shortWord("専門的支援実施加算")}
        {count["専門的支援実施加算"]>0 &&<div className='count'>{count["専門的支援実施加算"]}</div>}
      </div>
    }
    {(oldHAS?.["医療連携体制加算"]!=-1 && newHAS?.["医療連携体制加算"]!=1)
      &&<div className='dAddiction'>
        {shortWord("医療連携体制加算")}
        {count["医療連携体制加算"]>0 &&<div className='count'>{count["医療連携体制加算"]}</div>}
      </div>
    }
    {(oldHAS?.["関係機関連携加算"]!=-1 && newHAS?.["関係機関連携加算"]!=1)
      &&<div className='dAddiction'>
        {shortWord("関係機関連携加算")}
        {count["関係機関連携加算"]>0 &&<div className='count'>{count["関係機関連携加算"]}</div>}
      </div>
    }
    </>
  )
}

// --フォームボディ

export const SchListInputBasicFormRow = (props) => {
  const schedule = useSelector(state => state.schedule);
  const com = useSelector(state => state.com);
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const thisService = service ?service :serviceItems[0];
  const users = useSelector(state => state.users);
  const {uid, did, formDt, setFormDt, otherItems} = props;
  const user = users.find(u => u.uid === uid);
  const checkboxMaxCountDt = useGetCheckboxMaxCountDt(otherItems);
  const uidStr = "UID" + uid;
  const schDt = schedule?.[uidStr]?.[did] ?? {};
  const hideOnTabelEdit = useGetSchListInputSettingLSItem();

  const [start, setStart] = useState(schDt?.start ?? "");
  const [end, setEnd] = useState(schDt?.end ?? "");
  const [jikanKubun, setJikanKubun] = useState(schDt?.dAddiction?.["時間区分"] ?? schDt?.["時間区分"]);
  const [enchouShien, setEnchouShien] = useState(schDt?.dAddiction?.["延長支援"] ?? schDt?.["延長支援"]);
  const [pickup, setPickup] = useState(schDt?.transfer?.[0] ?? "");
  const [dropoff, setDropoff] = useState(schDt?.transfer?.[1] ?? "");
  const [actualCost, setActualCost] = useState(Object.entries(checkValueType(schDt.actualCost, 'Object') ?schDt.actualCost :{}).map(
    ([acName, acVal]) => ({name: acName, price: acVal, checked: true})
  ));
  const groupes = com?.ext?.schGroupes ?? [];
  const [groupe, setGroupe] = useState(schDt?.groupe ?groupes.includes(schDt.groupe) ?schDt.groupe :"" :"");
  const [teachers, setTeachers] = useState(schDt?.teachers ?? []);
  const [schStatus, setSchStatus] = useState(getSchDtStatus(schDt));

  useEffect(() => {
    if(!checkValueType(formDt, 'Object')) return;
    if(setFormDt) setFormDt(prevFormDt => {
      const newFormDt = {...prevFormDt};
      if(!checkValueType(newFormDt?.[uidStr], 'Object')) newFormDt[uidStr] = {};
      const newUserFormDt = newFormDt[uidStr];
      newUserFormDt[did] = {
        ...newUserFormDt[did],
        schStatus, start, end, jikanKubun, enchouShien, pickup, dropoff, actualCost, groupe, teachers
      }
      
      const hasChanged = (() => {
        if(schStatus !== getSchDtStatus(schDt)) return true;
        if(start !== (schDt?.start ?? "")) return true;
        if(end !== (schDt?.end ?? "")) return true;
        if(jikanKubun !== (schDt?.dAddiction?.["時間区分"] ?? schDt?.["時間区分"])) return true;
        if(enchouShien !== (schDt?.dAddiction?.["延長支援"] ?? schDt?.["延長支援"])) return true;
        if(pickup !== (schDt?.transfer?.[0] ?? "")) return true;
        if(dropoff !== (schDt?.transfer?.[1] ?? "")) return true;
        const initialGroupe = schDt?.groupe ?groupes.includes(schDt.groupe) ?schDt.groupe :"" :"";
        if(groupe !== initialGroupe) return true;
        if(JSON.stringify(teachers) !== JSON.stringify(schDt?.teachers ?? [])) return true;
        const initialActualCost = Object.entries(checkValueType(schDt.actualCost, 'Object') ?schDt.actualCost :{}).map(
          ([acName, acVal]) => ({name: acName, price: acVal, checked: true})
        );
        if(JSON.stringify(actualCost) !== JSON.stringify(initialActualCost)) return true;
        return false;
      })();

      if(hasChanged){
        newUserFormDt[did].edit = true;
      }
      return newFormDt;
    });
    // schDt, groupes はオブジェクト参照が毎レンダリング変わるため依存配列に含めない
    // （含めると無限ループが発生する。hasChanged内でclosure経由で参照される）
  }, [schStatus, start, end, jikanKubun, enchouShien, pickup, dropoff, actualCost, groupe, teachers]);

  useEffect(() => {
    const prevSchStatus = formDt?.[uidStr]?.[did]?.schStatus;
    if(!prevSchStatus) return;
    setSchStatus(prevSchStatus);
  }, [formDt]);

  const isZyushin = com?.addiction?.[thisService]?.["重症心身型"] && user.type==="重症心身障害児";
  const isAbsence = schStatus !== "出席" && schStatus !== "予約";
  return(
    <>
    <SchStatusSelect
      schStatus={schStatus} setSchStatus={setSchStatus}
      name={`${uidStr}-schStatus`}
    />
    <TimeInput
      name={`${uidStr}-start`} form={uidStr}
      label="開始" noLabel
      def={schDt?.start}
      disabled={isAbsence}
      size="small"
      setPropsVal={setStart}
    />
    <TimeInput
      name={`${uidStr}-end`} form={uidStr}
      label="終了" noLabel
      def={schDt?.end}
      disabled={isAbsence}
      size="small" 
      setPropsVal={setEnd}
    />
    {!isZyushin ?<JikanKubun
      schedule={schedule} uid={uidStr} did={did}
      required size='middle' noLabel
      startEnd={{start: schDt?.start ?? "", end: schDt?.end ?? ""}}
      dLayer={3} offSchool={schDt?.offSchool}
      setPropsVal={setJikanKubun}
      disabled={isAbsence}
    /> :<div style={{width: '128px'}} />}
    {!isZyushin ?<EnchouShien2024
      schedule={schedule} uid={uidStr} did={did}
      required size='middle' noLabel
      startEnd={{start: schDt?.start ?? "", end: schDt?.end ?? ""}}
      dLayer={3}
      setPropsVal={setEnchouShien}
      disabled={isAbsence}
    /> :<div style={{width: '128px'}} />}
    {(hideOnTabelEdit?.transfer ?? true) &&<Transfer
      name={`${uidStr}-pickup`} label='迎え' noLabel
      value={schDt}
      uid={uid}
      disabled={isAbsence}
      required size='middle'
      setPropsVal={setPickup}
    />}
    {(hideOnTabelEdit?.transfer ?? true) &&<Transfer
      name={`${uidStr}-dropoff`} label='送り' noLabel
      value={schDt}
      disabled={isAbsence}
      required size='middle'
      setPropsVal={setDropoff}
    />}
    <SchListInputActualConstFormParts
      type="body" schDt={schDt} uidStr={uidStr} did={did}
      disabled={isAbsence} exName={uidStr}
      checkboxMaxCount={checkboxMaxCountDt.actualsCost}
      setPropsVal={setActualCost}
    />
    <SchListInputGroupeFormParts
      type="body" schDt={schDt} name={`${uidStr}-groupe`}
      setPropsVal={setGroupe}
      disabled={isAbsence}
    />
    <SchListInputTeacherFormParts
      type="body" schDt={schDt}
      disabled={isAbsence} exName={uidStr}
      checkboxMaxCount={checkboxMaxCountDt.teachers}
      setPropsVal={setTeachers}
    />
    </>
  )
}

export const SchListInputKasanFormRow = (props) => {
  const schedule = useSelector(state => state.schedule);
  const {uid, did, formDt, setFormDt} = props;
  const uidStr = "UID" + uid;
  const schDt = schedule?.[uidStr]?.[did] ?? {};

  const dAddiction = schDt?.dAddiction ?? {};
  const [kazokuShien1, setKazokuShien1] = useState(dAddiction["家族支援加算Ⅰ"]);
  const [kazokuShien2, setKazokuShien2] = useState(dAddiction["家族支援加算Ⅱ"]);
  const [kosodate, setKosodate] = useState(dAddiction["子育てサポート加算"]);
  const [senmonShien, setSenmonShien] = useState(dAddiction["専門的支援加算"]);
  const [senmonJisshi, setSenmonJisshi] = useState(dAddiction["専門的支援実施加算"]);
  const [iryouRenkei, setIryouRenkei] = useState(dAddiction["医療連携体制加算"]);
  const [kankeiRenkei, setKankeiRenkei] = useState(dAddiction["関係機関連携加算"]);

  useEffect(() => {
    if(!checkValueType(formDt, 'Object')) return;
    if(setFormDt) setFormDt(prevFormDt => {
      const newFormDt = {...prevFormDt};
      if(!checkValueType(newFormDt?.[uidStr], 'Object')) newFormDt[uidStr] = {};
      const newUserFormDt = newFormDt[uidStr];
      newUserFormDt[did] = {
        ...newUserFormDt[did],
        kazokuShien1, kazokuShien2, kosodate, senmonShien, senmonJisshi, iryouRenkei, kankeiRenkei
      }
      
      const hasChanged = (() => {
        if(kazokuShien1 !== dAddiction["家族支援加算Ⅰ"]) return true;
        if(kazokuShien2 !== dAddiction["家族支援加算Ⅱ"]) return true;
        if(kosodate !== dAddiction["子育てサポート加算"]) return true;
        if(senmonShien !== dAddiction["専門的支援加算"]) return true;
        if(senmonJisshi !== dAddiction["専門的支援実施加算"]) return true;
        if(iryouRenkei !== dAddiction["医療連携体制加算"]) return true;
        if(kankeiRenkei !== dAddiction["関係機関連携加算"]) return true;
        return false;
      })();

      if(hasChanged) newUserFormDt[did].edit = true;
      return newFormDt;
    });
    // dAddiction はオブジェクト参照が毎レンダリング変わるため依存配列に含めない
    // （含めると無限ループが発生する。hasChanged内でclosure経由で参照される）
  }, [kazokuShien1, kazokuShien2, kosodate, senmonShien, senmonJisshi, iryouRenkei, kankeiRenkei])

  const commonProps = {uid: uidStr, did, dLayer: 3, size: "middle", schedule, noLabel: true};
  const isAbsence = formDt?.[uidStr]?.[did]?.schStatus !== "出席" && formDt?.[uidStr]?.[did]?.schStatus !== "予約";
  return(
    <>
    <KazokuShien1 setPropsVal={setKazokuShien1} {...commonProps} />
    <KazokuShien2 setPropsVal={setKazokuShien2} {...commonProps} />
    <Kosodate setPropsVal={setKosodate} {...commonProps} />
    <SenmonShien setPropsVal={setSenmonShien} disabled={isAbsence} {...commonProps} />
    <SenmonJisshi setPropsVal={setSenmonJisshi} disabled={isAbsence} {...commonProps} />
    <IryouRenkei setPropsVal={setIryouRenkei} disabled={isAbsence} {...commonProps} />
    <KankeiRenkei setPropsVal={setKankeiRenkei} {...commonProps} />
    </>
  )
}


export const MediaQueryGoBackButton = (props) => {
  const history = useHistory();
  const {maxWidth, minWidth, urlPath} = props;
  let query = "";
  if(maxWidth) query += `max-width:${maxWidth}`;
  if(minWidth) query += `min-width:${minWidth}`;
  const isLimit = useMediaQuery(`(${query})`);

  if(!isLimit) return null;

  const handleClick = () => {
    if(urlPath) history.push(urlPath);
    else history.goBack();
  }

  return(
    <div style={{position: 'fixed', zIndex: 3}}>
      <Button
        variant='outlined'
        startIcon={<ArrowBackIosIcon/>}
        onClick={handleClick}
      >
        戻る
      </Button>
    </div>
  )
}

// フォームボディ--


// --ボタン類

export const SchListInputCancelButton = () => {
  const history = useHistory();

  const handleCancel = () => {
    history.push("/schedule/");
  }

  return(
    <Button
      variant='contained'
      color='secondary'
      onClick={handleCancel}
      className='button'
    >
      キャンセル
    </Button>
  )
}

export const SchListInputSubmitButton = ({formDt}) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const schedule = useSelector(state => state.schedule);
  const stdDate = useSelector(state => state.stdDate);
  const service = useSelector(state => state.service);
  const com = useSelector(state => state.com);
  const config = useSelector(state => state.config);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const serviceItems = useSelector(state => state.serviceItems);
  const [snack, setSnack] = useState({});
  const hideOnTabelEdit = useGetSchListInputSettingLSItem();

  const handleSubmit = async() => {
    // formDtの値を確認。
    const isNormally = Object.values(formDt).every(didDt => {
      return Object.values(didDt).every(dt => checkSchListInputBasicDt(dt));
    });
    if(!isNormally){
      setSnack({msg: "時刻が不正です。", severity: 'warning', id: new Date().getTime()});
      return;
    }

    const newSchedule = Object.entries(formDt).reduce((prevSchedule, [uidStr, didDt]) => {
      prevSchedule[uidStr] = checkValueType(schedule[uidStr], 'Object') ?JSON.parse(JSON.stringify(schedule[uidStr])) :{};
      const newSch = prevSchedule[uidStr];
      const isEditedUser = Object.values(didDt).some(dt => dt.edit);
      if(!isEditedUser) return prevSchedule;
      Object.entries(didDt).forEach(([did, dt]) => {
        if(!checkValueType(newSch?.[did], 'Object')) newSch[did] = {};
        const newSchDt = newSch[did];
        if(dt.edit){
          const targetFormDt = {...dt};
          delete targetFormDt.edit;
          // schDtに予定実績基本データを書き込み
          updateSchListInputBasicDt(targetFormDt, newSchDt, com, config, stdDate, service, serviceItems, hideOnTabelEdit);
          // schDtに予定実績加算データを書き込み
          updateSchListInputKasanDt(targetFormDt, newSchDt);
          // 予定更新ハイライト
          setLocalStorageItemWithTimeStamp(bid + uidStr + did, true);
        }
      });
      // 利用者更新ハイライト
      setRecentUser(uidStr);
      return prevSchedule;
    }, {});

    const modDid = Object.values(formDt).reduce((prevModDid, didDt) => {
      if(prevModDid === "multiple") return prevModDid;
      Object.keys(didDt).forEach(did => {
        if(prevModDid !== "multiple"){
          if(prevModDid === null) prevModDid = did;
          else if(prevModDid !== did) prevModDid = "multiple";
        }
      });
      return prevModDid;
    }, null);
    if(/^D\d{8}/.test(modDid)){
      // 一部書き込み
      newSchedule.modDid = modDid;
    }

    const sendPrms = { hid, bid, date: stdDate, partOfSch: newSchedule}
    const res = await sendPartOfScheduleCompt(sendPrms, '', setSnack);
    if(res?.data?.result){
      dispatch(setStore({schedule: {...schedule, ...newSchedule}}));
      dispatch(setSnackMsg('書き込みました。'));
      history.push("/schedule/");
    }else{
      // 書き込み失敗
      setSnack({msg: "書き込みに失敗しました。もう一度お試しください。", severity: 'warning'});
    }
  }

  return(
    <>
    <Button
      variant='contained'
      color='primary'
      onClick={handleSubmit}
      className='button'
    >
      書き込み
    </Button>
    <SnackMsg {...snack} />
    </>
  )
}


// ボタン類--