import React, { useEffect, useState } from "react";
import { useHistory, useLocation } from 'react-router-dom';
import { IconButton, makeStyles, Menu, MenuItem } from "@material-ui/core";
import { LinksTab, LoadingSpinner } from "../../common/commonParts";
import { useSelector } from "react-redux";
import { getLodingStatus } from "../../../commonModule";
import { DispNameWithAttr, usersMenu } from "../Users";
import EditIcon from '@material-ui/icons/Edit';
import { getUsersTimeTableInitDateStr } from "./UsersTimeTableCommon";
import { grey, indigo, orange, pink, teal } from "@material-ui/core/colors";
import { getFilteredUsers, recentUserStyle } from '../../../albCommonModule';
import { getJikanKubunAndEnchou } from "../../../modules/elapsedTimes";
import { checkValueType } from "../../dailyReport/DailyReportCommon";
import { planMenu } from "../../plan/planCommonPart";

const INDEX_WIDTH = "32px";
const AGESTR_WIDTH = "56px";
const SETTINGDATE_WIDTH = "96px";
const TIME_WIDTH = "114px";
const NAME_WIDTH = "12rem";
const PAST_COLOR = "black";
const FUTURE_COLOR = "black";
const CONTENTS_OPACITY = 0.3;

const useStyles = makeStyles({
  AppPage: {
    width: '90vw', minWidth: 1080,
    margin: '84px 0 84px 5vw',
    '& .header, .body': {
      '& .row': {
        display: 'flex',
        '& > div': {
          padding: '8px 4px 4px',
          '&:nth-child(even)': {backgroundColor: "#fff"},
          '&:nth-child(odd)': {backgroundColor: grey[100]},
        },
        '& .index': {width: INDEX_WIDTH, textAlign: 'center'},
        '& .ageStr': {width: AGESTR_WIDTH},
        '& .etc': {
          width: '15%', flex: 1,
          '& .hno': {fontSize: 14}
        },
        '& .name': {
          width: '15%',
          flex: 1,
          // width: NAME_WIDTH,
          '& .kana': {fontSize: 14}
        },
        '& .timetable': {
          minWidth: SETTINGDATE_WIDTH, flex: 0.5,
          // '&.settingDate': {
          //   width: '7rem', flex: 'none'
          // },
          '& > div': {
            padding: 1
          }
        },
        '& .day': {minWidth: TIME_WIDTH, flex: 0.5},
        '& .flexEnd': {display: 'flex', alignItems: 'flex-end'}
      }
    },
    '& .header': {
      height: 45,
      position: 'sticky', top: 82,
      borderBottom: `1px solid ${teal[800]}`,
      zIndex: 3
    },
    '& .body': {
      '& .row': {
        cursor: 'pointer', borderBottom: `1px solid ${grey[300]}`,
        '&:hover': {
          '& > div': {backgroundColor: `${teal[50]} !important`},
          '& .name': {
            '& .editIcon': {
              '& .icon': {
                color: teal[800], fontSize: 40
              }
            }
          }
        },
        '& > div': {
          padding: 4
        },
        '& .name': {
          position: 'relative',
          '& .editIcon': {
            position: 'absolute', top: '50%', right: 0,
            transform: "translateY(-50%)",
            '& .icon': {
              opacity: 0.8, color: grey[400],
              fontSize: 20, transition: '0.4s',
            }
          }
        },
        '& .timetable': {
          fontSize: 14,
          '& > div': {
            '&:not(:last-child)': {
              marginBottom: 12
            }
          }
        },
        '& .day': {
          '& .contents': {
            '&:not(:last-child)': {
              marginBottom: 12
            }
          }
        }
      }
    }
  },
  timeTableContents: {
    // display: 'flex', flexWrap: 'wrap',
    fontSize: 14,
    '& .times': {fontSize: 14, marginRight: '4px'},
    '& .basis, .before, .after': {
      display: 'flex', alignItems: 'center',
      padding: 1,
      '& .subTitle': {color: '#fff', padding: 1, marginRight: 2},
      '& .times': {fontSize: 14, marginRight: '4px'}
    },
    '& .basis': {
      '& .subTitle': {backgroundColor: teal[800]}
    },
    '& .before': {
      '& .subTitle': {backgroundColor: indigo[800]}
    },
    '& .after': {
      '& .subTitle': {backgroundColor: pink[800]}
    }
  },
  kubunEncho: {
    position: 'relative',
    height: 16, width: 22,
    '& .kubunEnchoPillars': {
      display: 'flex',
      height: '100%', width: '100%',
      padding: '1px 0',
      '& .kubunEnchoPillar, .blank': {
        height: '100%', width: '20%'
      },
      '& .blank': {width: '5%'},
      '@media print': {display: 'none'}
    },
    '& .kubunEnchoContent': {
      position: 'absolute',
      bottom: 0, left: "50%",
      transform: "translateX(-50%)",
      width: 21,
      fontSize: 12,
      color: grey[500], fontSize: '.7rem',
      '@media print': {color: '#333', fontSize: '.7rem'}

    }
  },
});

const TimeTableKubunEnchoPillars = (props) => {
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service ?service :serviceItems[0];
  const classes = useStyles();
  const {start, end, holiday} = props;
  const useKubun3 = holiday || displayService==="児童発達支援";
  const kubunAndEncho = getJikanKubunAndEnchou(start, end, useKubun3);
  const kubun = kubunAndEncho["区分"];
  const enchouTwist = {"1": 2, "2": 3, "3": 1}
  const encho = enchouTwist?.[kubunAndEncho["延長支援"]];

  return(
    <div style={{display: 'flex'}}>
      {Boolean(kubun) &&<>
        <div className={classes.kubunEncho}>
          <div className='kubunEnchoPillars'>
            {checkValueType(parseInt(kubun), "Number")
              ? Array(parseInt(kubun)).fill(null).map((_, i) => (
                <React.Fragment key={i}>
                  <div className='kubunEnchoPillar' style={{backgroundColor: teal[200]}} />
                  {i+1 !== parseInt(kubun) && <div className="blank" key={`blank-${i}`} />}
                </React.Fragment>
              )) :null}
          </div>
          <div className='kubunEnchoContent' >区{kubun}</div>
        </div>
      </>}
      {Boolean(encho) &&<>
        <div className={classes.kubunEncho}>
          <div className='kubunEnchoPillars'>
            {checkValueType(parseInt(encho), "Number")
              ? Array(parseInt(encho)).fill(null).map((_, i) => (
                <React.Fragment key={i}>
                  <div className='kubunEnchoPillar' style={{backgroundColor: orange[200]}} />
                  {i + 1 !== parseInt(encho) && <div className="blank" key={`blank-${i}`} />}
                </React.Fragment>
              )) : null}
          </div>
          <div className='kubunEnchoContent' >延{String(encho)}</div>
        </div>
      </>}
    </div>
  )
}

const TimeTableContents = (props) => {
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const classes = useStyles();
  const {timeDt={}, disabled} = props;

  let start = "", end = "";
  if(timeDt.version === 2){
    start = timeDt.basisStart;
    end = timeDt.basisEnd;
  }else{
    start = timeDt.beforeStart ?timeDt.beforeStart :timeDt.basisStart;
    end = timeDt.afterEnd ?timeDt.afterEnd :timeDt.basisEnd;
  }

  const noneContents = !start || !end;
  return(
    <div className={`${classes.timeTableContents} contents`} style={{color: props.color, height: props.height, opacity: disabled?CONTENTS_OPACITY :1}}>
      {!noneContents &&<div className="times">{start}-{end}</div>}
      {!noneContents &&<TimeTableKubunEnchoPillars
        start={start} end={end}
        holiday={timeDt.holiday}
      />}
    </div>
  )
}

const UserRow = (props) => {
  const com = useSelector(state => state.com);
  const history = useHistory();
  const location = useLocation();
  const stdDate = useSelector(state => state.stdDate);
  const {user, index} = props;
  const [planDts, setPlanDts] = useState(user?.timetable ?? []);
  const [initDateStr, setInitDateStr] = useState(getUsersTimeTableInitDateStr(planDts, stdDate));
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  useEffect(() => {
    // 編集画面から戻ってきた時に、メインデータを更新するための処理
    const newPlanDts = user?.timetable ?? [];
    setPlanDts([...newPlanDts]);
    setInitDateStr(getUsersTimeTableInitDateStr(newPlanDts, stdDate));
  }, [location.pathname]);

  const initDatePranDtIndex = planDts.findIndex(dt => dt.created === initDateStr);
  const planDt = planDts[initDatePranDtIndex];
  const pastPlanDt = planDts[initDatePranDtIndex+1];
  const futurePlanDt = planDts[initDatePranDtIndex-1];

  const handleClick = (created) => {
    const version = com?.ext?.userTimeTableSetting?.formVersion ?? "2";
    const query = created ?`?created=${created}` :"";
    const prefix = location.pathname.startsWith('/plan/') ? '/plan' : '/users';
    if(version === "1"){
      history.push(`${prefix}/timetable/old/edit/${user.uid}/${query}`);
    }else if(version === "2"){
      history.push(`${prefix}/timetable/edit/${user.uid}/${query}`);
    }
  }

  const handleOpenEditMenu = (e) => {
    e.stopPropagation();
    if(sortedCreatedDates.length < 2){
      handleClick();
      return;
    }
    setMenuAnchorEl(e.currentTarget);
  }

  const handleCloseEditMenu = () => {
    setMenuAnchorEl(null);
  }

  const handleSelectDate = (e, created) => {
    e.stopPropagation();
    e.preventDefault();
    handleCloseEditMenu();
    handleClick(created);
  }

  const sortedCreatedDates = Array.from(new Set(
    planDts
      .map(dt => dt?.created)
      .filter(Boolean)
  )).sort((a, b) => a <= b ?1 :-1);

  const prevHeight = 30, pastHeight = 30, futureHeight = 30;

  const recentStyle = recentUserStyle("UID"+user.uid);
  return(
    <div className="row" onClick={() => {
      if(menuAnchorEl) return;
      handleClick();
    }}>
      <div className='index col' style={recentStyle}>{index + 1}</div>
      <div className='ageStr col'>{user.ageStr}</div>
      <div className="name col">
        <DispNameWithAttr {...user} />
        <div className="kana">{user.kana}</div>
        <div className="editIcon">
          <IconButton
            className="iconButton"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleOpenEditMenu}
          >
            <EditIcon className="icon" />
          </IconButton>
          <Menu
            anchorEl={menuAnchorEl}
            keepMounted
            open={Boolean(menuAnchorEl) && sortedCreatedDates.length >= 2}
            onClose={handleCloseEditMenu}
            anchorOrigin={{vertical: "bottom", horizontal: "right"}}
            transformOrigin={{vertical: "top", horizontal: "right"}}
            getContentAnchorEl={null}
            MenuListProps={{onClick: (e) => e.stopPropagation()}}
          >
            {sortedCreatedDates.map((created) => (
                <MenuItem
                  key={created}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => handleSelectDate(e, created)}
                >
                  {created}
                </MenuItem>
              ))}
          </Menu>
        </div>
      </div>
      <div className="timetable settingDate">
        {planDt &&<div style={{height: prevHeight}}>{planDt.created ?? ""}</div>}
        {pastPlanDt &&<div style={{height: pastHeight, color: PAST_COLOR, opacity: CONTENTS_OPACITY}}>{pastPlanDt.created ?? ""}<div style={{}} /></div>}
        {futurePlanDt &&<div style={{height: futureHeight, color: FUTURE_COLOR, opacity: CONTENTS_OPACITY}}>{futurePlanDt.created ?? ""}</div>}
      </div>
      <div className="day monday">
        {planDt && <TimeTableContents timeDt={planDt?.content?.monday} height={prevHeight} />}
        {pastPlanDt && <TimeTableContents timeDt={pastPlanDt?.content?.monday} height={pastHeight} color={PAST_COLOR} disabled />}
        {futurePlanDt && <TimeTableContents timeDt={futurePlanDt?.content?.monday} height={futureHeight} color={FUTURE_COLOR} disabled />}
      </div>
      <div className="day tuesday">
        {planDt && <TimeTableContents timeDt={planDt?.content?.tuesday} height={prevHeight} />}
        {pastPlanDt && <TimeTableContents timeDt={pastPlanDt?.content?.tuesday} height={pastHeight} color={PAST_COLOR} disabled />}
        {futurePlanDt && <TimeTableContents timeDt={futurePlanDt?.content?.tuesday} height={futureHeight} color={FUTURE_COLOR} disabled />}
      </div>
      <div className="day wednesday">
        {planDt && <TimeTableContents timeDt={planDt?.content?.wednesday} height={prevHeight} />}
        {pastPlanDt && <TimeTableContents timeDt={pastPlanDt?.content?.wednesday} height={pastHeight} color={PAST_COLOR} disabled />}
        {futurePlanDt && <TimeTableContents timeDt={futurePlanDt?.content?.wednesday} height={futureHeight} color={FUTURE_COLOR} disabled />}
      </div>
      <div className="day thursday">
        {planDt && <TimeTableContents timeDt={planDt?.content?.thursday} height={prevHeight} />}
        {pastPlanDt && <TimeTableContents timeDt={pastPlanDt?.content?.thursday} height={pastHeight} color={PAST_COLOR} disabled />}
        {futurePlanDt && <TimeTableContents timeDt={futurePlanDt?.content?.thursday} height={futureHeight} color={FUTURE_COLOR} disabled />}
      </div>
      <div className="day friday">
        {planDt && <TimeTableContents timeDt={planDt?.content?.friday} height={prevHeight} />}
        {pastPlanDt && <TimeTableContents timeDt={pastPlanDt?.content?.friday} height={pastHeight} color={PAST_COLOR} disabled />}
        {futurePlanDt && <TimeTableContents timeDt={futurePlanDt?.content?.friday} height={futureHeight} color={FUTURE_COLOR} disabled />}
      </div>
      <div className="day saturday">
        {planDt && <TimeTableContents timeDt={planDt?.content?.saturday} height={prevHeight} />}
        {pastPlanDt && <TimeTableContents timeDt={pastPlanDt?.content?.saturday} height={pastHeight} color={PAST_COLOR} disabled />}
        {futurePlanDt && <TimeTableContents timeDt={futurePlanDt?.content?.saturday} height={futureHeight} color={FUTURE_COLOR} disabled />}
      </div>
      <div className="day holiday">
        {planDt && <TimeTableContents timeDt={planDt?.content?.holiday} height={prevHeight} />}
        {pastPlanDt && <TimeTableContents timeDt={pastPlanDt?.content?.holiday} height={pastHeight} color={PAST_COLOR} disabled />}
        {futurePlanDt && <TimeTableContents timeDt={futurePlanDt?.content?.holiday} height={futureHeight} color={FUTURE_COLOR} disabled />}
      </div> 
    </div>
  )
}

const MainTable = (props) => {
  const classes = useStyles();
  const users = useSelector(state => state.users);
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const classroom = useSelector(state => state.classroom);
  const { linksMenu } = props;

  const displayService = service ?service :serviceItems[0];
  if(!(displayService==="放課後等デイサービス" || displayService==="児童発達支援")) return(
    <>
    <LinksTab menu={linksMenu}/>
    <div className={classes.AppPage}>
      <div style={{textAlign: 'center', marginTop: 120}}>保育所等訪問支援は対応していません。</div>
    </div>
    </>
  )

  const filteredUsers = getFilteredUsers(users, displayService, classroom);
  filteredUsers.sort((a, b) => (parseInt(a.sindex) - parseInt(b.sindex)));
  const userRows = filteredUsers.map((user, index) => (
    <UserRow key={`userRow${index}`} user={user} index={index} />
  ));

  return(
    <div>
      <div className="header">
        <div className="row">
          <div className="index flexEnd">No</div>
          <div className="ageStr">
            <div>年齢</div>
            <div>学齢</div>
          </div>
          <div className="name flexEnd">氏名</div>
          <div className="timetable settingDate flexEnd">設定日</div>
          <div className="day monday flexEnd">月</div>
          <div className="day tuesday flexEnd">火</div>
          <div className="day wednesday flexEnd">水</div>
          <div className="day thursday flexEnd">木</div>
          <div className="day friday flexEnd">金</div>
          <div className="day saturday flexEnd">土</div>
          <div className="day holiday flexEnd">日・祝日</div>
        </div>
      </div>
      <div className="body">
        {userRows}
      </div>
    </div>
  )
}

const UsersTimeTable = () => {
  const classes = useStyles();
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const location = useLocation();
  const linksMenu = location.pathname.startsWith('/plan/') ? planMenu : usersMenu;

  if(!loadingStatus.loaded) return(
    <>
    <LinksTab menu={linksMenu} />
    <LoadingSpinner />
    </>
  )

  return(
    <>
    <LinksTab menu={linksMenu} />
    <div className={classes.AppPage}>
      <MainTable linksMenu={linksMenu} />
    </div>
    </>
  )
}
export default UsersTimeTable;