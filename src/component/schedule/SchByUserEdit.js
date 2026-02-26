import React, { useState } from 'react';
import Modal from 'react-modal';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import { useDispatch, useSelector } from 'react-redux';
import * as mui from '../common/materialUi';
import * as comMod from '../../commonModule';
import * as Actions from '../../Actions'
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import { CenterFocusStrong } from '@material-ui/icons';

// フィールドごとにステイトと更新用の関数を持つ
// 特にチェックボックスなどでエレメントに寄り添ったステイトを作成する
// handleChangeはフォームで一括処理。処理が重複だけど問題ないやろ
// ボツ予定
export const SchEditModalContent = (props) => {
  const scheduleTemplate = useSelector(state => state.scheduleTemplate);
  const users = useSelector(state => state.users);
  const thisUser = comMod.getUser(props.uid, users);
  const service = thisUser.service;
  const stdDate = useSelector(state => state.stdDate);
  const config = useSelector(state => state.config);
  const dateList = useSelector(state => state.dateList);
  const dispatch = useDispatch();

  // 平日開始終了時間
  const [weekDayStart, setWeekDayStart] = React.useState({
    label: '開始',
    name: 'weekdayStart',
    time: scheduleTemplate[service].weekday.start,
    listStart: config.timeSetLower,
    listEnd: config.timeSetHigher,
    step: config.timeSetStep,
  });
  const [weekDayEnd, setWeekDayEnd] = React.useState({
    label: '終了',
    name: 'weekdayEnd',
    time: scheduleTemplate[service].weekday.end,
    listStart: weekDayStart.time,
    listEnd: config.timeSetHigher,
    step: config.timeSetStep,
  });

  // 休校日
  const [schoolOffStart, setSchoolOffStart] = React.useState({
    label: '開始',
    name: 'schoolOffStart',
    time: scheduleTemplate[service].schoolOff.start,
    listStart: config.timeSetLower,
    listEnd: config.timeSetHigher,
    step: config.timeSetStep,
  });
  const [schoolOffEnd, setSchoolOffEnd] = React.useState({
    label: '終了',
    name: 'schoolOffEnd',
    time: scheduleTemplate[service].schoolOff.end,
    listStart: schoolOffStart.time,
    listEnd: config.timeSetHigher,
    step: config.timeSetStep,
  });
  // 送迎
  const transferOptionList = [
    { value: '---', label: '無し' },
    { value: '学校', label: '学校' },
    { value: '自宅', label: '自宅' },
  ]
  // 送迎平日
  const [weekDayPickup, setWeekDayPickup] = React.useState({
    label: 'お迎え',
    name: 'weekDayPickup',
    value: scheduleTemplate[service].weekday.transfer[0],
    options: transferOptionList,
  });
  const [weekDaySend, setWeekDaySend] = React.useState({
    label: 'お送り',
    name: 'weekDaySend',
    value: scheduleTemplate[service].weekday.transfer[1],
    options: transferOptionList,
  });
  // 休校日
  const [schoolOffPickup, setSchoolOffPickup] = React.useState({
    label: 'お迎え',
    name: 'schoolOffPickup',
    value: scheduleTemplate[service].schoolOff.transfer[0],
    options: transferOptionList,
  });
  const [schoolOffSend, setSchoolOffSend] = React.useState({
    label: 'お送り',
    name: 'schoolOffSend',
    value: scheduleTemplate[service].schoolOff.transfer[1],
    options: transferOptionList,
  });

  // 実費チェックボックス用オブジェクト作成
  const acturlChkBoxWk = [];
  Object.keys(config.actualCostList).forEach(e => {
    acturlChkBoxWk.push({
      value: e,
      amount: config.actualCostList[e],
      checked: false,
    });
  });
  // チェック入れるところに入れて新しい配列 平日用
  const acturlChkBoxWkWeekDay = JSON.parse(JSON.stringify(acturlChkBoxWk));
  acturlChkBoxWkWeekDay.forEach(e => {
    if (e.value in scheduleTemplate[service].weekday.actualCost) {
      e.checked = true;
    }
    e.name = 'actualCostWD';  // 平日を示す名前を入れる
  });
  // チェック入れるところに入れて新しい配列 休日用
  const acturlChkBoxWkSchoolOff = JSON.parse(JSON.stringify(acturlChkBoxWk));
  acturlChkBoxWkSchoolOff.forEach(e => {
    if (e.value in scheduleTemplate[service].schoolOff.actualCost) {
      e.checked = true;
    }
    e.name = 'actualCostSO';  // 休日
  });
  // 休日と平日を分けてstateの定義
  const [acturlChkBoxWeekDay, setActurlChkBoxWeekDay] =
    React.useState(acturlChkBoxWkWeekDay);
  const [acturlChkBoxSchoolOff, setActurlChkBoxSchoolOff] =
    React.useState(acturlChkBoxWkSchoolOff);

  // 加算チェックボックス
  const addictionChkBoxWk = [];
  const chekboxLst = (service === '放課後等デイサービス') ?
    config.addctionHoudayByDate : config.addctionJihatsuByDate

  Object.keys(chekboxLst).forEach(e => {
    addictionChkBoxWk.push({
      // name: 'addictionWD',    // チェックボックス全体の名前 後から入れる
      value: e,               // オプションの名前
      amount: chekboxLst[e],  // オブジェクトのバリューを入れる
      // 使い方はケースバイケース
      checked: false,         // チェックの値。後から設定
    });
  });
  // チェック入れるところに入れて新しい配列 平日用
  const addictionChkBoxWkWeekDay = JSON.parse(JSON.stringify(addictionChkBoxWk));
  addictionChkBoxWkWeekDay.forEach(e => {
    if (e.value in scheduleTemplate[service].weekday.dAddiction) {
      e.checked = true;
    }
    e.name = 'addictionWD'; // 平日用の名前。チェックボックス全体
  });
  // 休日用
  const addictionChkBoxWkSchoolOff = JSON.parse(JSON.stringify(addictionChkBoxWk));
  addictionChkBoxWkSchoolOff.forEach(e => {
    if (e.value in scheduleTemplate[service].schoolOff.dAddiction) {
      e.checked = true;
    }
    e.name = 'addictionSO'; // 平日用の名前。チェックボックス全体
  });
  // 休日と平日を分けてstateの定義
  const [addictionChkBoxWeekDay, setAddictionChkBoxWeekDay] =
    React.useState(addictionChkBoxWkWeekDay);
  const [addictionChkBoxSchoolOff, setAddictionChkBoxSchoolOff] =
    React.useState(addictionChkBoxWkSchoolOff);

  // 曜日チェックボックス
  const days = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
  const daysWeekDayWk = days.map((e, i) => {
    return ({
      name: 'addictionWD',    // チェックボックス全体の名前
      value: e,               // オプションの名前兼ラベル
      amount: i,             // オブジェクトのバリューを入れる
      checked: false,         // チェックの値
    });
  });
  const daysSchoolOffWk = JSON.parse(JSON.stringify(daysWeekDayWk));
  daysWeekDayWk.forEach(e => {
    e.name = 'addictionSO';
  });
  const [daysWeekDay, setDaysWeekDay] = React.useState(daysWeekDayWk)
  const [daysSchoolOff, setDaysSchoolOff] = React.useState(daysSchoolOffWk)
  // -----------------------------------------------------
  // イベントハンドラはフォーム全体のchangeで一括させる
  // -----------------------------------------------------
  const handleFormChenage = (e) => {
    // 放デイと自発で処理が変わるのでフラグをセット
    const houday = (service === '放課後等デイサービス') ? true : false;
    const form = document.getElementById('wehtys76gh');
    const elms = form.elements;
    setWeekDayStart({
      ...weekDayStart,
      time: elms['weekdayStart'].value
    });
    setWeekDayEnd({
      ...weekDayEnd,
      time: elms['weekdayEnd'].value
    });
    setWeekDayPickup({
      ...weekDayPickup,
      value: elms['weekDayPickup'].value
    });
    setWeekDaySend({
      ...weekDaySend,
      value: elms['weekDaySend'].value
    });
    if (houday) {
      setSchoolOffStart({
        ...schoolOffStart,
        time: elms['schoolOffStart'].value
      });
      setSchoolOffEnd({
        ...schoolOffEnd,
        time: elms['schoolOffEnd'].value
      });
      setSchoolOffPickup({
        ...schoolOffPickup,
        value: elms['schoolOffPickup'].value
      });
      setSchoolOffSend({
        ...schoolOffSend,
        value: elms['schoolOffSend'].value
      });


    }
    // チェックボックスを作成する配列からターゲットになるチェックボックスの
    // chekedを取得、配列に反映させる
    const wkA = Object.assign([], acturlChkBoxWeekDay);
    wkA.forEach(e => {
      e.checked = form.querySelector(
        'input[name=' + e.name + '][value=' + e.value + ']'
      ).checked;
    });
    setActurlChkBoxWeekDay(wkA);

    // 放デイのときは配列構築。自発のときは空白配列にして処理を抑制
    const wkA0 = (houday) ? Object.assign([], acturlChkBoxSchoolOff) : [];
    wkA0.forEach(e => {
      console.log(e);
      e.checked = form.querySelector(
        'input[name=' + e.name + '][value=' + e.value + ']'
      ).checked;
    });
    setActurlChkBoxSchoolOff(wkA0);

    const wkB = Object.assign([], addictionChkBoxWeekDay);
    wkB.forEach(e => {
      e.checked = form.querySelector(
        'input[name=' + e.name + '][value=' + e.value + ']'
      ).checked;
    });
    setAddictionChkBoxWeekDay(wkB);

    const wkB0 = (houday) ? Object.assign([], addictionChkBoxSchoolOff) : [];
    wkB0.forEach(e => {
      e.checked = form.querySelector(
        'input[name=' + e.name + '][value=' + e.value + ']'
      ).checked;
    });
    setAddictionChkBoxSchoolOff(wkB0);


    const wkC = Object.assign([], daysWeekDayWk);
    wkC.forEach(e => {
      e.checked = form.querySelector(
        'input[name=' + e.name + '][value=' + e.value + ']'
      ).checked;
    });
    setDaysWeekDay(wkC);

    const wkC0 = (houday) ? Object.assign([], daysSchoolOffWk) : [];
    wkC0.forEach(e => {
      e.checked = form.querySelector(
        'input[name=' + e.name + '][value=' + e.value + ']'
      ).checked;
    });
    setDaysSchoolOff(wkC0);

  };
  // okボタン(submit)押下
  // スケジュールを月内に配置する
  const callDispatch = (e) => {
    e.preventDefault();
    // export const scheduleMonthlySet = (
    //   uid, stdDate, schedule, weekDays, dateList, holiday
    // ) => {
    const UID = 'UID' + props.uid;
    // 一旦、スケジュールをテンプレートから拾う
    const weekDaySchedule = Object.assign({}, scheduleTemplate[service].weekday);
    const schoolOffSchedule =
      Object.assign({}, scheduleTemplate[service].schoolOff);
    // 開始終了時間
    weekDaySchedule.start = weekDayStart.time;
    weekDaySchedule.end = weekDayEnd.time;
    // 送迎
    weekDaySchedule.transfer = [
      weekDayPickup.value,
      weekDaySend.value,
    ];
    // 実費
    weekDaySchedule.actualCost = {};
    // チェックボックス用配列から値を拾ってくる
    acturlChkBoxWeekDay.map(e => {
      if (e.checked) {
        weekDaySchedule.actualCost[e.value] = e.amount;
      }
    });
    // 加算項目も同じ処理
    weekDaySchedule.dAddiction = {}
    addictionChkBoxWeekDay.map(e => {
      if (e.checked) {
        weekDaySchedule.dAddiction[e.value] = e.amount;
      }
    });
    // 同じく曜日をチェックボックスより取得
    const daysWd = daysWeekDay.map(e => {
      if (e.checked) return e.amount;
    })

    // 開始終了時間
    schoolOffSchedule.start = schoolOffStart.time;
    schoolOffSchedule.end = schoolOffEnd.time;
    // 送迎
    schoolOffSchedule.transfer = [
      schoolOffPickup.value,
      schoolOffSend.value,
    ];
    // 実費
    schoolOffSchedule.actualCost = {};
    // チェックボックス用配列から値を拾ってくる
    acturlChkBoxSchoolOff.map(e => {
      if (e.checked) {
        schoolOffSchedule.actualCost[e.value] = e.amount;
      }
    });
    // 加算項目も同じ処理
    schoolOffSchedule.dAddiction = {}
    addictionChkBoxSchoolOff.map(e => {
      if (e.checked) {
        schoolOffSchedule.dAddiction[e.value] = e.amount;
      }
    });
    // 同じく曜日をチェックボックスより取得
    const daysSO = daysSchoolOff.map(e => {
      if (e.checked) return e.amount;
    })


    dispatch(Actions.scheduleMonthlySet(
      UID, stdDate, weekDaySchedule, daysWd, dateList, 0
    ));
    dispatch(Actions.scheduleMonthlySet(
      UID, stdDate, schoolOffSchedule, daysSO, dateList, 1
    ));
  }
  const WeekDayContent = () => {
    return (
      <>
        <div className="schEditSubtitle">平日設定</div>
        <div className="formRow">
          <mui.SelectTime
            onChange={(e) => handleFormChenage(e)}
            {...weekDayStart}
          />
          <mui.SelectTime
            onChange={(e) => handleFormChenage(e)}
            {...weekDayEnd}
          />
          <mui.SelectStd
            {...weekDayPickup}
            onChange={(e) => handleFormChenage(e)}
          />
          <mui.SelectStd
            {...weekDaySend}
            onChange={(e) => handleFormChenage(e)}
          />
        </div>
        <div className="formRow">
          <mui.checkBoxGroupe
            array={acturlChkBoxWeekDay}
            onChange={(e) => handleFormChenage(e)}
          />
        </div>
        <div className="formRow">
          <mui.checkBoxGroupe
            array={addictionChkBoxWeekDay}
            onChange={(e) => handleFormChenage(e)}
          />
        </div>
        <div className="formRow">
          <mui.checkBoxGroupe
            array={daysWeekDay}
            onChange={(e) => handleFormChenage(e)}
          />
        </div>
      </>
    )
  }
  const SchoolOffContent = () => {
    if (service === '児童発達支援') return null;
    return (
      <>
        <div className="schEditSubtitle">学校休日設定</div>
        <div className="formRow">
          <mui.SelectTime
            onChange={(e) => handleFormChenage(e)}
            {...schoolOffStart}
          />
          <mui.SelectTime
            onChange={(e) => handleFormChenage(e)}
            {...schoolOffEnd}
          />
          <mui.SelectStd
            {...schoolOffPickup}
            onChange={(e) => handleFormChenage(e)}
          />
          <mui.SelectStd
            {...schoolOffSend}
            onChange={(e) => handleFormChenage(e)}
          />
        </div>
        <div className="formRow">
          <mui.checkBoxGroupe
            array={acturlChkBoxSchoolOff}
            onChange={(e) => handleFormChenage(e)}
          />
        </div>
        <div className="formRow">
          <mui.checkBoxGroupe
            array={addictionChkBoxSchoolOff}
            onChange={(e) => handleFormChenage(e)}
          />
        </div>
        <div className="formRow">
          <mui.checkBoxGroupe
            array={daysSchoolOff}
            onChange={(e) => handleFormChenage(e)}
          />
        </div>
      </>
    )
  }
  return (
    <div className="modalFormWrqapper">
      {/* <div className="formTitle">
        ご利用予定月次設定
      </div>
      <div className="formSubTitle">
        <div className="date">{
          stdDate.split('-')[0] + '年' + stdDate.split('-')[1] + '月'
        }</div>
        <div className="user">{thisUser.name + ' 様 '}</div>
        <div className="age">{thisUser.ageStr}</div>
      </div> */}

      <form id="wehtys76gh">
        <WeekDayContent />
        <SchoolOffContent />
        <div className="buttonWrapper">
          <mui.ButtonCancel onClick={() => props.closeEvent()} />
          <mui.ButtonOK onClick={(e) => callDispatch(e)} />
        </div>
      </form>
    </div>
  )
}
