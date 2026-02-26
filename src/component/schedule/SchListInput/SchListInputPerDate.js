import React, { createContext, useContext, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Button, ButtonGroup, Checkbox, makeStyles, useMediaQuery, withStyles } from "@material-ui/core";
import { GoBackButton, LinksTab, LoadingSpinner } from '../../common/commonParts';
import { useSelector } from 'react-redux';
import { MediaQueryGoBackButton, SchListInputBasicFormHeaderRow, SchListInputBasicFormRow, SchListInputCancelButton, SchListInputFormOptions, SchListInputKasanFormHeaderRow, SchListInputKasanFormRow, SchListInputSubmitButton, useGetDid, useSchListInputStyles } from './SchListInputCommon';
import { getFilteredUsers } from '../../../albCommonModule';
import { setInitDate } from '../SchDaily';
import { getLodingStatus } from '../../../commonModule';
import { makeSchMenuFilter, menu, extMenu } from '../Sch2';
import { SchDaySettingMenuTitle } from '../SchDaySettingNoDialog';
import { blue, orange, red } from '@material-ui/core/colors';
import { SchListInputSettingButton } from './SchListInputSetting';
import NotInterestedIcon from '@material-ui/icons/NotInterested';
import CloseIcon from '@material-ui/icons/Close';
import PauseIcon from '@material-ui/icons/Pause';
import SchConvUserReserveToAttendButton from '../../common/SchConvUserReserveToAttendButton';

const useGetTargetUids = (sortType) => {
  const schedule = useSelector(state => state.schedule);
  const users = useSelector(state => state.users);
  const service = useSelector(state => state.service);
  const classroom = useSelector(state => state.classroom);
  const did = useGetDid();

  const targetUids = Object.keys(schedule).filter(uidStr => {
    // UIDxxx以外は無視
    if(!/^UID\d+$/.test(uidStr)) return false;

    const schDt = schedule?.[uidStr]?.[did];
    // 予定がない場合は無視
    if(!schDt) return false;
    // ロックされている予定は無視
    if(schDt?.useResult)  return false;
    // 予定データのサービス
    const schService = schDt.service;
    if(service && schService && !schService.includes(service)) return false;
    // 予定データの単位
    const schClassroom = schDt.classroom;
    if(schClassroom && classroom && !schClassroom.includes(classroom)) return false;

    // 対象利用者がいない場合は無視
    const filteredUsers = getFilteredUsers(users, service, classroom);
    const user = filteredUsers.find(user => "UID"+user.uid === uidStr);
    if(!user) return false;

    return true;
  }).sort((aUidStr, bUidStr) => {
    if(sortType === "nomal"){
      const aUser = users.find(user => "UID"+user.uid === aUidStr);
      const bUser = users.find(user => "UID"+user.uid === bUidStr);
      return parseInt(aUser.sindex) - parseInt(bUser.sindex);
    }else if(sortType === "start"){
      const aSchDt = schedule[aUidStr][did];
      const bSchDt = schedule[bUidStr][did];
      const aStart = aSchDt?.start ?? "00:00";
      const bStart = bSchDt?.start ?? "00:00";
      const [hours1, minutes1] = aStart.split(":").map(x => parseInt(x));
      const [hours2, minutes2] = bStart.split(":").map(x => parseInt(x));
      if (hours1 !== hours2) {
        return hours1 - hours2;
      } else if (minutes1 !== minutes2) {
        // 分が異なる場合も時刻でソート
        return minutes1 - minutes2;
      } else {
        // 時刻が同じ場合はkeyでソート
        return (aSchDt.groupe ?? "").localeCompare((bSchDt.groupe ?? ""));
      }
    }
  }).map(uidStr => uidStr.replace("UID", ""));

  return targetUids;
}

const FormDtContext = createContext();

const useStyles = makeStyles({
  Buttons: {
    display: 'flex', justifyContent: 'space-between',
    margin: '16px 0',
    '& .button': {
      width: 112,
      '&:not(:last-child)': {
        marginRight: 8
      }
    },
    '& .sortButton': {
      width: 80
    }
  }
})

const SelectAllUidCheckbox = (props) => {
  const {targetUids, setSelectedUids} = props;

  const handleChange = (e) => {
    const checked = e.target.checked;
    if(checked){
      setSelectedUids(targetUids);
    }else{
      setSelectedUids([]);
    }
  }

  return(
    <Checkbox
      onChange={handleChange}
      color='primary'
      disabled={!targetUids.length}
      style={{padding: 4}}
    />
  )
}

const FormHeader = (props) => {
  const {formType, targetUids, setSelectedUids, formDt} = props;
  const otherItems = ["checkebox", "name"];

  return(
    <div className='formHeader' style={{paddingBottom: 0}}>
      <div className='row'>
        <div className='multInputCheckbox'>
          <SelectAllUidCheckbox targetUids={targetUids} setSelectedUids={setSelectedUids} />
        </div>
        <div className='name' style={{textAlign: 'start'}}>名前</div>
        {formType==="basic" &&<SchListInputBasicFormHeaderRow otherItems={otherItems} />}
        {formType==="kasan" &&<SchListInputKasanFormHeaderRow formDt={formDt} />}
      </div>
    </div>
  )
}

const UsersMultInputCheckbox = (props) => {
  const {selectedUids, setSelectedUids, uidStr} = props;
  const uid = uidStr.replace("UID", "");

  const handleChange = () => {
    setSelectedUids(prevSelectedUids => {
      let newSelectedUids = null;
      if(prevSelectedUids.includes(uid)){
        newSelectedUids = prevSelectedUids.filter(value => value !== uid);
      }else{
        newSelectedUids = [...prevSelectedUids, uid];
      }
      return newSelectedUids
    })
  }

  return(
    <div>
      <Checkbox
        checked={selectedUids.includes(uid)}
        onChange={handleChange}
        color="primary"
        className='checkbox'
      />
    </div>
  )
}

const FormBody = (props) => {
  const schedule = useSelector(state => state.schedule);
  const {targetUids, selectedUids, setSelectedUids, formType} = props;
  const users = useSelector(state => state.users);
  const did = useGetDid();
  const {formDt, setFormDt} = useContext(FormDtContext);
  const otherItems = ["checkebox", "name"];

  const userFormRows = targetUids.map(uid => {
    const uidStr = "UID" + uid;
    const user = users.find(u => u.uid === uid) ?? {};
    const formProps = {uid, did, formDt, setFormDt, otherItems};
    const schDt = schedule?.[uidStr]?.[did] ?? {};
    const userNotice = schDt?.userNotice ?? "";
    return(
      <React.Fragment key={`userFormRow${uid}`}>
      <div className='row'>
        <UsersMultInputCheckbox
          selectedUids={selectedUids} setSelectedUids={setSelectedUids}
          uidStr={uidStr}
        />
        <div className="name">{user.name ?? "未登録"}</div>
        <div style={{display: formType==="basic" ?'flex' :'none'}}><SchListInputBasicFormRow {...formProps} /></div>
        <div style={{display: formType==="kasan" ?'flex' :'none'}}><SchListInputKasanFormRow {...formProps} /></div>
      </div>
      {Boolean(userNotice) &&<div className='userNotice perDateRow'>{userNotice}</div>}
      </React.Fragment>
    )
  });

  return(
    <div className='formBody'>{userFormRows}</div>
  )
}

const SortButtons =  (props) => {
  const {sortType, setSortType} = props;

  const handleClick = (e) => {
    const name = e.currentTarget.name;
    sessionStorage.setItem("schListInputFormSortType", name);
    setSortType(name);
  }

  return(
    <ButtonGroup>
      <Button
        name="nomal"
        color='primary'
        variant='outlined'
        onClick={handleClick}
        disabled={sortType === "nomal"}
        className='sortButton'
      >
        標準
      </Button>
      <Button
        name="start"
        color='primary'
        variant='outlined'
        onClick={handleClick}
        disabled={sortType === "start"}
        className='sortButton'
      >
        時間順
      </Button>
    </ButtonGroup>
  )
}

const TransitionSchDailyPageButton = () => {
  const history = useHistory();
  const {date} = useParams();

  const handleClick = () => {
    setInitDate(parseInt(date));
    history.push("/schedule/daily/");
  }

  return(
    <Button
      variant='contained'
      onClick={handleClick}
      className='button'
    >
      1日予定へ
    </Button>
  )
}

const OrangeButton = withStyles(() => ({
  root: {
    color: "#fff",
    backgroundColor: orange[800],
    '&:hover': {
      backgroundColor: orange[900],
    },
  },
}))(Button);
const TransitionMultInputFormButton = (props) => {
  const history = useHistory();
  const {date} = useParams();
  const {selectedUids, formType} = props;

  const handleClick = () => {
    const uidsPath = selectedUids.join(",");
    history.push(`/schedule/listinput/perdate/mult/${formType}/${date}/${uidsPath}/`)
  }

  const disabled = selectedUids.length < 1;
  return(
    <OrangeButton
      variant='contained'
      className='button'
      onClick={handleClick}
      disabled={disabled}
    >
      一括入力
    </OrangeButton>
  )
}

const Buttons = (props) => {
  const classes = useStyles();
  const {sortType, setSortType, selectedUids, formType} = props;
  const {formDt} = useContext(FormDtContext);

  return(
    <div className={classes.Buttons}>
      <div>
        <SortButtons sortType={sortType} setSortType={setSortType} />
      </div>
      <div>
        <TransitionSchDailyPageButton />
        <TransitionMultInputFormButton selectedUids={selectedUids} formType={formType} />
        <SchListInputCancelButton />
        <SchListInputSubmitButton formDt={formDt} />
      </div>
    </div>
  )
}

const MainForm = () => {
  const classes = useSchListInputStyles();

  const [selectedUids, setSelectedUids] = useState([]);
  const [sortType, setSortType] = useState(sessionStorage.getItem("schListInputFormSortType") ?? "nomal");
  const [formType, setFormType] = useState(sessionStorage.getItem("SchListInputFormSelect") ?? "basic");

  const targetUids = useGetTargetUids(sortType);
  const [formDt, setFormDt] = useState({});

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

  if(!targetUids.length) return(
    <div style={{textAlign: 'center', color: red["A700"]}}>
      対象の予定がありません
    </div>
  )

  const formBodyProps = {targetUids, selectedUids, setSelectedUids, sortType, formType};
  const buttonsProps = {sortType, setSortType, selectedUids, formType};
  return(
    <div className={classes.MainForm}>
      <FormDtContext.Provider value={{formDt, setFormDt}}>
        <form id="#wky78">
          <SchListInputFormOptions formDt={formDt} setFormDt={setFormDt} formType={formType} setFormType={setFormType} />
          <FormHeader formType={formType} targetUids={targetUids} setSelectedUids={setSelectedUids} formDt={formDt} />
          <FormBody {...formBodyProps} />
          <Buttons {...buttonsProps} />
        </form>
        <SchConvUserReserveToAttendButton 
          onClick={handleBulkAttend}
          reserveCount={reserveCount}
          hasTodayReserve={hasTodayReserve}
          hasFutureReserve={hasFutureReserve}
        />
      </FormDtContext.Provider>
    </div>
  )
}

export const SchListInputPerDate = () => {
  const isLimit1400px = useMediaQuery("(max-width:1400px)");
  const classes = useSchListInputStyles();
  const history = useHistory();
  const {date} = useParams();
  const did = useGetDid();
  const allState = useSelector(state => state);
  const {schedule, stdDate} = allState;

  if(!date){
    // URLパラメータにdateがない場合はメイン画面に戻る
    history.push("/schedule/");
    return null;
  }
  if(!getLodingStatus(allState).loaded) return(<LoadingSpinner />);
  if(Object.values(schedule).every(sch => !sch?.[did])){
    // 予定実績データに対象didデータががない場合はメイン画面に戻る
    history.push("/schedule/");
    return null;
  }

  const [stdYear, stdmMonth] = stdDate.split("-");
  const targetDate = `${stdYear}-${stdmMonth}-${String(date).padStart(2, '0')}`;

  return(
    <>
    <LinksTab menu={menu} menuFilter={makeSchMenuFilter(stdDate)} extMenu={extMenu} />
    <div className={classes.AppPage}>
      <MediaQueryGoBackButton maxWidth="1400px" urlPath="/schedule/" />
      <SchDaySettingMenuTitle title="日付別一覧入力" targetDate={targetDate} style={{}} />
      <MainForm />
      <SchListInputSettingButton />
    </div>
    {/* SchDailyReportSyncer はここでは不要。
       同期によるscheduleのdispatchがフォーム全行の再レンダリング連鎖を引き起こし
       React16の非バッチング環境でフリーズの原因となるため削除。
       メインスケジュールページ(Sch2)側で同期は行われる。 */}
    {!isLimit1400px &&<GoBackButton url="/schedule/" posY={0} posX={120} />}
    </>
  )
}