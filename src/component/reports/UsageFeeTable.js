import React, { useState } from "react";
import { makeStyles, Button } from "@material-ui/core";
import { red, teal } from "@material-ui/core/colors";
import { useSelector } from "react-redux";
import { univApiCall } from '../../albCommonModule';
import { LoadingSpinner } from "../common/commonParts";

// 起点となる月は当月から何ヶ月か？
const STARTING_MONTHS = -4;
// 表示する月数
const SHOW_MONTHS = 9;
// 消費税率（10%）
const TAX_PERCENTAGE = 10;

const getJigyousyoDts = (usageFeeDt) => {
  return Object.values(usageFeeDt).flat().reduce((result, dt) => {
    const bid = dt.bid;
    const jDt = result.find(j => j.bid === bid);
    if(!jDt) result.push(dt);
    return result;
  }, []);
}

const useStyle = makeStyles({
  usageFeeTable: {
    marginTop: 32,
    '& .loadingStatus': {
      position: 'absolute', top: 0, bottom: 0, right: 0, left: 0
    },
    '& table': {
      '& th, td': {padding: 4,},
      '& th': {fontWeight: 'initial'},
      '& .no': {width: 32, textAlign: 'center'},
      '& .name': {width: 'calc(40% - 32px)'},
      // '& .month': {minWidth: 80, width: '10%'},
      '& .month': {width: '80px'},
      '& .num': {
        textAlign: 'end'
      },
      '& .contents': {
        '& .content': {
          '&:not(:last-child)': {
            marginBottom: 4
          }
        }
      },
      '& thead, tbody': {
        '& th, td': {
          '&:nth-child(odd)': {
            backgroundColor: teal[50]
          }
        },
      },
      '& thead': {
        borderBottom: `1px solid ${teal[800]}`,
        paddingBottom: 4,
        '& .month': {
          fontSize: 14
        }
      },
      '& tbody': {
        '& tr': {
          '&:not(:last-child)': {
            '& td': {
              borderBottom: `1px solid ${teal[200]}`
            },
          }
        },
        '& .name': {
          '& .hname': {fontSize: 12, opacity: 0.8},
          '& .bname': {marginTop: 4}
        },
      },
      '& tfoot': {
        borderTop: `3px double ${teal[200]}`,
        borderBottom: `1px solid ${teal[800]}`, 
        '& th': {backgroundColor: null},
        '& td': {
          '&:nth-child(even)': {
            backgroundColor: teal[50]
          }
        }
      }
    }
  },
  showButton: {
    textAlign: 'center'
  }
});

const ShowButton = (props) => {
  const classes = useStyle();
  const {show, setShow, setUsageFeeDt, loading, setLoading} = props;
  const hid = useSelector(state => state.hid);
  const stdDate = useSelector(state => state.stdDate);
  const [stdYear, stdMonth] = stdDate.split("-");
  
  const handleClick = async() => {
    const data = {};
    for(let i=1; i<=SHOW_MONTHS; i++){
      const newDate = new Date(parseInt(stdYear), parseInt(stdMonth)+(STARTING_MONTHS-1)-1+(i), 1);
      const thisStdYear = String(newDate.getFullYear());
      const thisStdMonth = String(newDate.getMonth()+1).padStart(2, '0');
      const thisStdDate = `${thisStdYear}-${thisStdMonth}-01`;
      const fetchUsageFeeParams = {a: "fetchUsageFee", hid, date: thisStdDate};
      const res = await univApiCall(fetchUsageFeeParams);
      if(!res?.data?.result){
        // 問題発生
      }
      const dts = res?.data?.dt ?? [];
      data[thisStdDate] = dts;
    }
    setUsageFeeDt(data);
    setLoading(false);
    setShow(true);
  }

  return(
    <div className={classes.showButton}>
      <Button
        variant="contained"
        onClick={() => {setLoading(true); handleClick();}}
        disabled={show || loading}
      >
        ご請求補正と予定
      </Button>
    </div>
  )
}

const UsageFeeContents = ({data, thisStdDate}) => {
  const fee = data.fee ?parseInt(data.fee) :"";
  const adjust = data.adjust ?data.date===thisStdDate ?parseInt(data.adjust) :0 :"";
  const totalFee = fee && adjust ?parseInt(fee)+parseInt(adjust) :fee ?fee :adjust ?adjust :"";
  return(
    <div className="contents">
      <div className="num content">{fee.toLocaleString()}</div>
      <div className="num content">{adjust.toLocaleString()}</div>
      <div className="num content">{totalFee.toLocaleString()}</div>
    </div>
  )
}

const MainTable = (props)=> {
  const {usageFeeDt} = props;
  const jigyousyoDts = getJigyousyoDts(usageFeeDt);
  const stdDate = useSelector(state => state.stdDate);
  const [stdYear, stdMonth] = stdDate.split("-");
  const stdDates = Array(SHOW_MONTHS).fill(null).map((_, i) => {
    const newDate = new Date(parseInt(stdYear), parseInt(stdMonth)+(STARTING_MONTHS-1)-1+(i+1), 1);
    const thisStdYear = String(newDate.getFullYear());
    const thisStdMonth = String(newDate.getMonth()+1).padStart(2, '0');
    return `${thisStdYear}-${thisStdMonth}-01`;
  });

  const monthThs = stdDates.map(thisStdDate => {
    const [thisStdYear, thisStdMonth] = thisStdDate.split("-");
    return(
      <th
        key={`${thisStdYear}-${thisStdMonth}header`}
        className="month"
      >
        {/* {thisStdYear}年{thisStdMonth}月 */}
        {thisStdYear}/{thisStdMonth}
      </th>
    )
  });

  const jigyosyoTrs = jigyousyoDts.map((jDt, jDtIndex) => {
    const bid = jDt.bid;

    const monthTds = stdDates.map(thisStdDate => {
      const data = usageFeeDt[thisStdDate].find(dt => dt.bid === bid) ?? {};
      return(
        <td className="month">
          <UsageFeeContents data={data} thisStdDate={thisStdDate} />
        </td>
      )
    });
    
    const hname = jDt.hname;
    const bname = jDt.bname;
    return(
      <tr key={jDt.bid}>
        <td className="no">{jDtIndex+1}</td>
        <td className="name">
          <div className="hname">{hname}</div>
          <div className="bname">{bname}</div>
        </td>
        {monthTds}
      </tr>
    )
  });

  const TotalTr = () => {
  
    const monthTotalTds = stdDates.map(thisStdDate => {
      const dts = usageFeeDt[thisStdDate] ?? [];
      let totalFee = 0;
      dts.forEach(dt => {
        const fee = parseInt(dt.fee ?? 0);
        const adjust = dt.adjust ?dt.date===thisStdDate ?parseInt(dt.adjust) :0 :0;
        totalFee += (fee + adjust);
      });
      const taxFee = Math.round(totalFee * TAX_PERCENTAGE / 100);
      const totalFeeIncludingTax = totalFee + taxFee;
      return(
        <td className="month">
          <div className="contents">
            <div className="num content">{totalFee.toLocaleString()}</div>
            <div className="num content">{taxFee.toLocaleString()}</div>
            <div className="num content">{totalFeeIncludingTax.toLocaleString()}</div>
          </div>
        </td>
      )
    });

    return(
      <tr>
        <th colSpan={2}>合計</th>
        {monthTotalTds}
      </tr>
    )
  }

  return(
    <table>
      <thead>
        <tr>
          <th className="no">No</th>
          <th className="name">事業所名</th>
          {monthThs}
        </tr>
      </thead>
      <tbody>
        {jigyosyoTrs}
      </tbody>
      <tfoot>
        <TotalTr />
      </tfoot>
    </table>
  )
}

const Description = () => (
  <div style={{marginTop: 8, fontSize: 14}}>
    <div style={{padding: 2}}>事業所別　１行目：ご利用金額　2行目：未収分等補正　３行目：ご請求金額</div>
    <div style={{padding: 2}}>合計　１行目：税抜合計金額　2行目：消費税額　３行目：税込合計金額</div>
    <div style={{padding: 2, color: red[800], fontWeight: 600}}>金額は前月の27日にお振り替えとなります。</div>
  </div>
)

export const UsageFeeTable = () => {
  const classes = useStyle();
  const [usageFeeDt, setUsageFeeDt] = useState({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);


  const showButtonProps = {show, setShow, setUsageFeeDt, loading, setLoading};
  return(
    <div className={classes.usageFeeTable}>
      <ShowButton {...showButtonProps}/>
      <div style={{marginTop: 32}}>
        {loading &&<div className="loadingStatus"><LoadingSpinner /></div>}
        {show && !loading &&<MainTable usageFeeDt={usageFeeDt} />}
        {show && !loading &&<Description />}
      </div>
    </div>
  )
}