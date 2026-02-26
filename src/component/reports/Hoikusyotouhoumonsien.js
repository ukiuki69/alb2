import { makeStyles } from '@material-ui/core';
import React from 'react';
import { useSelector } from 'react-redux';
import { convDid } from '../../commonModule';
import { DAY_LIST } from '../../hashimotoCommonModules';
import { gp, HeadGrid, LastRow, Title, useStyles as teikyouStyles } from './TeikyouJisseki';

const useStyles = makeStyles({
  teikyouJisseki: {
    '& .mainGrid': {
      gridTemplateColumns:'3ch 3ch 2fr 3fr 2fr 2fr 14fr !important'
    }
  }
});

export const HohouTeikyouJissekiOne = (props) => {
  const classes = useStyles();
  const teikyouClasses = teikyouStyles();
  const {selects, uidStr, service} = props;
  const allState = useSelector(state => state);
  const {users, schedule, com, stdDate, dateList} = allState;
  const thisUser = users.find(uDt => "UID"+uDt.uid === uidStr);
  const targetSchedule = schedule[uidStr] ?schedule[uidStr] :{};
  if(!Object.keys(targetSchedule).some(dDate => {
    if(
      !/^D[0-9]{8}$/.test(dDate) ||
      !targetSchedule[dDate] ||
      targetSchedule[dDate].service !== '保育所等訪問支援'
    ) return false;
    return true
  })) return null;

  const headerRow = (
    <>
    <div className='bb' style={gp(1,1,1,3)}>日付</div>
    <div className='bb' style={gp(2,1,1,3)}>曜日</div>
    <div style={gp(3,3,1,1)}>サービス提供実績</div>
    <div className='bb' style={gp(3,1,2,2)}>算定日数</div>
    <div style={gp(4,1,2,1)}>家庭連携加算</div>
    <div className='bb' style={gp(4,1,3,1)}>時間数</div>
    <div className='bb' style={gp(5,1,2,2)}>初回加算</div>
    <div className='bb' style={gp(6,1,1,3)}>保護者等<br/>確認欄</div>
    <div className="bb rb" style={gp(7,1,1,3)}>備考</div>
    </>
  );

  const blank = selects==='白紙' || selects==='白紙（利用なし含む）';
  let sumDate = 0;
  let sumKateirenkei = 0;
  let sumFirstAddiction = 0;

  let minRowsLength = 31;
  let lCls = '';
  switch(selects){
    case "23行": {
      minRowsLength = 23;
      lCls = 'repoTjTall'; 
      break
    }
    case "27行": {
      minRowsLength = 27;
      lCls = 'repoTj';
      break
    }
    case "白紙": {
      minRowsLength = dateList.filter(dDt => dDt.holiday < 2).length;
      lCls = 'repoTjShort'; 
      break
    }
    case "白紙（利用なし含む）": {
      minRowsLength = dateList.filter(dDt => dDt.holiday < 2).length;
      lCls = 'repoTjShort'; 
      break
    }
  }

  const targetDDateList = [...Object.keys(targetSchedule)].filter(dDate => (
    /^D[0-9]{8}$/.test(dDate) && targetSchedule[dDate].service === '保育所等訪問支援'
  ));
  const rowsLength = targetDDateList.length > minRowsLength
    ?targetDDateList.length :minRowsLength;
  const workdays = dateList.filter(e=>e.holiday < 2).map(e=>{
    return convDid(e.date);
  });
  const oneDayRows = [...Array(rowsLength)].map((_, i) => {
    const dDate = blank ?workdays[i] :targetDDateList[i];
    let dateObj = null;
    if(dDate){
      dateObj = new Date(
        parseInt(dDate.slice(1, 5)), parseInt(dDate.slice(5, 7))-1, parseInt(dDate.slice(7, 9))
      );
    }
    const rowBlank = blank || !dDate;
    let kateirenkei = null;
    let firstAddiction = null;
    if(!rowBlank){
      const dAddiction = targetSchedule[dDate].dAddiction;
      if(dAddiction){
        if(dAddiction["家庭連携加算"]){
          const min = parseInt(dAddiction["家庭連携加算"]);
          if(min > 0) kateirenkei = String(min / 60 + 1);
          sumKateirenkei++;
        }
        if(dAddiction["初回加算"]){
          firstAddiction = dAddiction["初回加算"];
          sumFirstAddiction++;
        }
      }
      sumDate++;
    }
    return(
      <>
      <div className={`date ${lCls}`}>{dateObj ?dateObj.getDate() :""}</div> {/*日付*/}
      <div className={`${lCls}`}>{dateObj ?DAY_LIST[dateObj.getDay()] :""}</div> {/*曜日*/}
      <div className={`${lCls}`}>{!rowBlank ?"1" :""}</div> {/*算定日数*/}
      <div className={`${lCls}`}>{!rowBlank ?kateirenkei :""}</div> {/*家庭連携加算 or 時間数*/}
      <div className={`${lCls}`}>{!rowBlank ?firstAddiction :""}</div> {/*初回加算*/}
      <div className={`${lCls}`}>{!rowBlank ?"" :""}</div> {/*保護者等確認欄*/}
      <div className={`${lCls} rb`}>{!rowBlank ?"" :""}</div> {/*備考*/}
      </>
    )
  });

  const footerRow = (
    <>
    <div className='uDbl' style={{gridColumnEnd:'span 2'}}>合計</div>
    <div className='uDbl'>{!blank ?`${sumDate}日` :""}</div>
    <div className='uDbl'>{!blank ?`${sumKateirenkei}回` :""}</div>
    <div className='uDbl'>{!blank ?`${sumFirstAddiction}回` :""}</div>
    <div className='uDbl'></div>
    <div className='uDbl rb'></div>
    </>
  )

  return(
    <>
    <div className={`${teikyouClasses.reportTeikyou} ${classes.teikyouJisseki}`}>
      <Title stdDate={stdDate} service={service}/>
      <HeadGrid thisUser={thisUser} com={com}/>
      <div className='mainGrid outerLine'>
        {headerRow}
        {oneDayRows}
        {footerRow}
      </div>
      <LastRow />
    </div>
    <div className='pageBreak'/>
    </>
  )
}