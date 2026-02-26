import React, { createContext, useContext, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { makeStyles, useMediaQuery } from "@material-ui/core";
import { GoBackButton, LinksTab, LoadingSpinner } from '../../common/commonParts';
import { useSelector } from 'react-redux';
import { MediaQueryGoBackButton, SchListInputBasicFormHeaderRow, SchListInputBasicFormRow, SchListInputCancelButton, SchListInputFormOptions, SchListInputKasanFormHeaderRow, SchListInputKasanFormRow, SchListInputSubmitButton, useSchListInputStyles } from './SchListInputCommon';
import { getLodingStatus } from '../../../commonModule';
import { makeSchMenuFilter, menu, extMenu } from '../Sch2';
import { DAY_LIST } from '../../../hashimotoCommonModules';
import { didPtn } from '../../../modules/contants';
import { SchListInputSettingButton } from './SchListInputSetting';
import NotInterestedIcon from '@material-ui/icons/NotInterested';
import CloseIcon from '@material-ui/icons/Close';
import { blue, red, teal } from '@material-ui/core/colors';
import PauseIcon from '@material-ui/icons/Pause';
import SchConvUserReserveToAttendButton from '../../common/SchConvUserReserveToAttendButton';

const useGetTargetDids = () => {
  const schedule = useSelector(state => state.schedule);
  const service = useSelector(state => state.service);
  const classroom = useSelector(state => state.classroom);
  const {uid} = useParams();
  const uidStr = "UID" + uid;

  const sch = schedule?.[uidStr] ?? {};
  const targetDids = Object.keys(sch).filter(did => {
    // didパターンに合わないものは無視
    if(!didPtn.test(did)) return false;

    const schDt = schedule?.[uidStr]?.[did];
    // 予定がない場合は無視
    if(!schDt) return false;
    // 予定データのサービス
    const schService = schDt.service;
    if(service && schService && !schService.includes(service)) return false;
    // 予定データの単位
    const schClassroom = schDt.classroom;
    if(schClassroom && classroom && !schClassroom.includes(classroom)) return false;
    // ロックされている予定は無視
    if(schDt?.useResult)  return false;
    return true;
  }).sort((aDid, bDid) => {
    const aDate = aDid.slice(7, 9);
    const bDate = bDid.slice(7, 9);
    return parseInt(aDate) - parseInt(bDate);
  });

  return targetDids;
}

const FormDtContext = createContext();

const useStyles = makeStyles({
  TitleInfo: {
    borderBottom: `1px solid ${teal[400]}`, paddingBottom: 4,
    '& .title': {
      fontSize: "1.2rem", padding: 4, textAlign: 'center'
    },
    '& .userInfo': {
      display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
      padding: 4,
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
    }
  },
  Buttons: {
    textAlign: 'end',
    margin: '16px 0',
    '& .button': {
      width: 112,
      '&:not(:last-child)': {
        marginRight: 8
      }
    }
  }
})

const FormHeader = (props) => {
  const {formType, formDt} = props;
  const otherItems = ["date"];

  return(
    <div className='formHeader'>
      <div className='row'>
        <div className='date'>日付</div>
        {formType==="basic" &&<SchListInputBasicFormHeaderRow otherItems={otherItems} />}
        {formType==="kasan" &&<SchListInputKasanFormHeaderRow formDt={formDt}/>}
      </div>
    </div>
  )
}

const FormBody = (props) => {
  const {formType} = props;
  const {uid} = useParams();
  const schedule = useSelector(state => state.schedule);
  const sch = schedule?.["UID"+uid];
  const {formDt, setFormDt} = useContext(FormDtContext);
  const targetDids = useGetTargetDids();

  const dateFormRows = targetDids.map(did => {
    const schDt = sch?.[did] ?? {};
    const offSchoolClassName = ['', 'offSchool', 'off'][schDt?.offSchool ?? 0];
    const dYear = did.slice(1, 5);
    const dMonth = did.slice(5, 7);
    const dDate = did.slice(7, 9);
    const day = new Date(parseInt(dYear), parseInt(dMonth)-1, parseInt(dDate)).getDay();
    const sundayClassName = day === 0 ?"sunday" :"";
    const formProps = {uid, did, formDt, setFormDt, otherItems: ["date"]};
    const userNotice = schDt?.userNotice ?? "";
    return(
      <>
      <div className='row' key={`dateFormRow${did}`}>
        <div className={`date ${offSchoolClassName} ${sundayClassName}`}>{dDate}日<span style={{margin: '0 4px'}}>({DAY_LIST[day]})</span></div>
        <div style={{display: formType==="basic" ?'flex' :'none'}}><SchListInputBasicFormRow {...formProps} /></div>
        <div style={{display: formType==="kasan" ?'flex' :'none'}}><SchListInputKasanFormRow {...formProps} /></div>
      </div>
      {Boolean(userNotice) &&(<div className='userNotice perUserRow'>{userNotice}</div>)}
      </>
    )
  });

  return(
    <div className='formBody'>{dateFormRows}</div>
  )
}

const Buttons = () => {
  const classes = useStyles();
  const {formDt} = useContext(FormDtContext);

  return(
    <div className={classes.Buttons}>
      <SchListInputCancelButton />
      <SchListInputSubmitButton formDt={formDt} />
    </div>
  )
}

const MainForm = () => {
  const {uid} = useParams();
  const classes = useSchListInputStyles();
  const [formType, setFormType] = useState(sessionStorage.getItem("SchListInputFormSelect") ?? "basic");
  const [formDt, setFormDt] = useState({});

  const targetDids = useGetTargetDids();

  // 予約一括出席ボタン用のデータ計算
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayDid = `D${y}${m}${d}`;

  let reserveCount = 0;
  let hasTodayReserve = false;
  let hasFutureReserve = false;

  Object.values(formDt).forEach(userFormDt => {
    Object.entries(userFormDt).forEach(([did, dt]) => {
      if (dt.schStatus === "予約") {
        reserveCount++;
        const datePart = did.substring(0, 9);
        if (datePart === todayDid) hasTodayReserve = true;
        else if (datePart > todayDid) hasFutureReserve = true;
      }
    });
  });

  const handleBulkAttend = () => {
    setFormDt(prevFormDt => {
      const newFormDt = {...prevFormDt};
      Object.keys(newFormDt).forEach(uidStr => {
        const newUserFormDt = newFormDt[uidStr];
        Object.keys(newUserFormDt).forEach(did => {
          if (newUserFormDt[did].schStatus === "予約") {
            newUserFormDt[did].schStatus = "出席";
          }
        });
      });
      return newFormDt;
    });
  };

  if(!targetDids.length) return(
    <div style={{textAlign: 'center', marginTop: 16, color: red["A700"]}}>
      対象の予定がありません
    </div>
  )

  return(
    <div className={classes.MainForm}>
      <FormDtContext.Provider value={{formDt, setFormDt}}>
        <form id="#wky78">
          <SchListInputFormOptions
            formDt={formDt}
            setFormDt={setFormDt} formType={formType} setFormType={setFormType} 
            style={{marginBottom: 16}}
          />
          <FormHeader formType={formType} formDt={formDt} />
          <FormBody formType={formType} />
          <Buttons />
        </form>
        <SchConvUserReserveToAttendButton 
          uid={uid} 
          onClick={handleBulkAttend}
          reserveCount={reserveCount}
          hasTodayReserve={hasTodayReserve}
          hasFutureReserve={hasFutureReserve}
        />
      </FormDtContext.Provider>
    </div>
  )
}

export const SchListInputPerUser = () => {
  const isLimit1400px = useMediaQuery("(max-width:1400px)");
  const schListInputClasses = useSchListInputStyles();
  const classes = useStyles();
  const history = useHistory();
  const {uid} = useParams();
  const allState = useSelector(state => state);
  const {users, stdDate} = allState;
  const user = users.find(uDt => uDt.uid === uid);
  const [stdYear, stdmMonth] = stdDate.split("-");

  if(!uid){
    // URLパラメータにuidがない場合はメイン画面に戻る
    history.push("/schedule/");
    return null;
  }
  if(!getLodingStatus(allState).loaded) return(<LoadingSpinner />);
  if(!user){
    // 対象利用者がいない場合はメイン画面に戻る
    history.push("/schedule/");
    return null;
  }

  return(
    <>
    <LinksTab menu={menu} menuFilter={makeSchMenuFilter(stdDate)} extMenu={extMenu} />
    <div className={schListInputClasses.AppPage}>
      <MediaQueryGoBackButton maxWidth="1400px" urlPath="/schedule/" />
      <div className={classes.TitleInfo}>
        <div className='title'>利用者別一覧入力</div>
        <div className="userInfo">
          <div className='date'>{stdYear}年{stdmMonth}月</div>
          <div className='userName'>{user?.name ?? "名前未登録"}<span className='honorificTitle'>様</span></div>
          <div className='ageStr'>{user?.ageStr ?? ""}</div>
          <div className='schoolName'>{user?.belongs1 ?? ""}</div>
        </div>
      </div>
      <MainForm />
      <SchListInputSettingButton />
    </div>
    {!isLimit1400px &&<GoBackButton url="/schedule/" posY={0} posX={120} />}
    </>
  )
}