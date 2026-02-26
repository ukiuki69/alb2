import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core';
import Billing from './Billing';
import { getDidArray } from '../../albCommonModule';
import { useSelector } from 'react-redux';
import { grey, red } from '@material-ui/core/colors';
import { checkJikanuKubun } from './CheckBillingEtc';

const useStyles = makeStyles({
  root: {
    width: '50%', backgroundColor: red[900], color:grey[50], textAlign: 'center',
    padding: 8, paddingBottom: 4, fontSize: '.8rem', lineHeight: 1.6, 
    margin: '0 auto 16px', 
    '& .msg': {paddingBottom: 4}
  },
})

const StrongWarning = ({billingDt}) => {
  const classes = useStyles();
  const allState = useSelector(s=>s);
  const {users, com, stdDate, schedule} = allState;
  const chk = (billingDt || []).reduce((cnt,bdt)=>{
    const dida = getDidArray(bdt);
    let v = 0;
    dida.forEach(did=>{
      const da = bdt[did]?.dAddiction;
      if (da?.[`福祉・介護職員処遇改善加算`] && da?.[`福祉・介護職員処遇改善加算`].match(/^福祉/)) v++;
      if (da?.特定処遇改善加算 && da.特定処遇改善加算) v++;
      if (da?.[`福祉・介護職員等ベースアップ等支援加算`] && da?.[`福祉・介護職員等ベースアップ等支援加算`]) v++;
    })
    return cnt + v;
  }, 0);
  const jikanuKubunWarning = checkJikanuKubun(schedule, users, stdDate, com);
  const jikanKubunCnt = jikanuKubunWarning.length;
  const jikankubunNamesCnt = new Set(jikanuKubunWarning.map(e=>e.uid)).size;
  if (stdDate < '2024-06-01') return null;
  if (chk + jikanKubunCnt === 0) return null;
  return (
    <div className={classes.root}>
      {chk > 0 &&
        <div className='msg'>
          不正な処遇改善加算が{chk}件あります。<br></br>
          2024年6月より処遇改善加算は変更になっています。
        </div>
      }
      {jikanKubunCnt > 0 &&
        <div className='msg'>
          {`時間区分の未設定が${jikankubunNamesCnt}人分、${jikanKubunCnt}件あります。詳細表示で確認して下さい。`}
        </div>
      }
    </div>
  )
}

export default StrongWarning;