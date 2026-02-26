import React from "react";
import { useSelector } from "react-redux";
import { makeStyles } from "@material-ui/core";
import { getDateEx } from "../../commonModule";
import { setBillInfoToSch } from "../Billing/blMakeData";
import { red } from "@material-ui/core/colors";
import SetPrintTitle from "../common/SetPrintTitle";

const ROWNUM_OF_TYPE = 3;

const useStyles = makeStyles({
  kyuhuhiOne: {
    margin: '120px auto',
    '@media print': {
      pageBreakAfter: 'always',
      '&:last-child': {
        pageBreakAfter: 'auto'
      },
      margin: 0
    },
    '& .title': {
      textAlign: 'center',
      fontSize: '1.8rem',
      marginBottom: 16
    },
    '& .printDate': {
      textAlign: 'end',
      marginBottom: 16
    },
    '& .info': {
      marginBottom: 16,
      display: 'flex',
      justifyContent: 'space-between'
    },
    '& td': {
      border: '1px solid',
      textAlign: 'center'
    },
    '& .rowTitle': {
      width: 16
    },
    '& .boldBorder': {
      border: '2px solid',
    },
    '& .boldBorderL': {
      borderLeft: '2px solid',
    },
    '& .boldBorderR': {
      borderRight: '2px solid',
    },
    '& .boldBorderT': {
      borderTop: '2px solid',
    },
    '& .boldBorderB': {
      borderBottom: '2px solid',
    },
  },
  jigyosyoInfoTable: {
    '& td': {
      padding: 4
    }
  },
  dateTable: {
    marginBottom: 8,
    '& td': {
      padding: '16px 8px'
    }
  },
  totalTable: {
    marginBottom: 8,
    '& .rowTitle': {
      width: 'auto',
      padding: 16
    },
    '& .supple': {
      fontSize: 'small',
      height: '16px',
      marginBottom: 8
    },
    '& td': {
      padding: '4px 16px 8px 16px',
      width: 32
    }
  },
  mainTable: {
    width: '100%',
    '& td': {
      padding: 16,
      height: 16,
    },
  }
})

const JigyosyoInfoTable = ({com}) => {
  const classes = useStyles();
  const jino_tds = com.jino.split("").map((num,i) => <td key={"jino"+i}>{num}</td>)

  return(
    <table className={classes.jigyosyoInfoTable+" boldBorder"}>
      <tbody>
        <tr>
          <td rowSpan="5" className="rowTitle">請求事業者</td>
          <td>指定事業所番号</td>
          {jino_tds}
        </tr>
        <tr>
          <td>
            <div>住所</div>
            <div>（所在地）</div>
          </td>
          <td colSpan="10">
            <div>〒{com.postal}</div>
            <div>{com.city+com.address}</div>
          </td>
        </tr>
        <tr>
          <td>電話番号</td>
          <td colSpan="10">{com.tel}</td>
        </tr>
        <tr>
          <td>名称</td>
          <td colSpan="10">
            <div>{(com?.ext?.hname || com.hname)}</div>
            <div>{com.bname}</div>
          </td>
        </tr>
        <tr>
          <td>職・氏名</td>
          <td colSpan="10"></td>
        </tr>
      </tbody>
    </table>
  )
}

const DateTable = ({stdDate}) => {
  const classes = useStyles();
  const date_list = stdDate.split("-");
  const date = getDateEx(date_list[0], date_list[1], 1);
  const wareki = date.wr.l;
  const wareki_year = String(date.wr.y).padStart(2, "0").split("");
  const month = String(date.m).padStart(2, "0").split("");
  return(
    <table className={classes.dateTable+" boldBorder"}>
      <tbody>
        <tr>
          <td>{wareki}</td>
          <td>{wareki_year[0]}</td>
          <td>{wareki_year[1]}</td>
          <td>年</td>
          <td>{month[0]}</td>
          <td>{month[1]}</td>
          <td>月分</td>
        </tr>
      </tbody>
    </table>
  )
}

const TotalTable = ({dtList}) => {
  const classes = useStyles();
  console.log("dtList", dtList)
  const totalfee = dtList.reduce((result, dt) => {
    const userSanteiTotal = dt.userSanteiTotal;
    const kanrikekkagaku = dt.kanrikekkagaku;
    result += userSanteiTotal - kanrikekkagaku;
    return result
  }, 0);
  const totalfee_str = ("¥"+String(totalfee)).padStart(9, " ");
  const fee_tds = totalfee_str.split("").map((x, i) => {
    let supple = null;
    if(i === 2) supple = "百万";
    else if(i === 5) supple = "千";
    else if(i === 8) supple = "円";
    return <td key={"fee"+i}><div className="supple">{supple ?supple :""}</div>{x===" " ?"" :x}</td>
  });
  return(
    <table className={classes.totalTable+" boldBorder"}>
      <tbody>
        <tr>
          <td className="rowTitle">請求金額</td>
          {fee_tds}
        </tr>
      </tbody>
    </table>
  )
}

const MainTable = ({dtList}) => {
  const classes = useStyles();
  const servicename_list = {"61": "児童発達支援", "63": "放課後等デイサービス", "64": "保育所等訪問支援",};
  const tsusyokyuhu_keys = ["countOfUsers", "tanniTotal", "userSanteiTotal", "kyuhuhi", "kanrikekkagaku", "jichiJosei"]
  const tsusyokyuhu_trs = [...Array(ROWNUM_OF_TYPE)].map((_, i) => {
    const dt = dtList[i];
    const service_name = dt&&servicename_list[dt.serviceSyubetu] ?servicename_list[dt.serviceSyubetu].toLocaleString() :"";
    const countOfUsers = dt&&dt.countOfUsers ?dt.countOfUsers.toLocaleString() :"";
    const tanniTotal = dt&&dt.tanniTotal ?dt.tanniTotal.toLocaleString() :"";
    const userSanteiTotal = dt&&dt.userSanteiTotal ?dt.userSanteiTotal.toLocaleString() :"";
    const kyuhuhi = dt ?(dt.userSanteiTotal-(dt.kanrikekkagaku??0)).toLocaleString() :"";
    const riyousyaHutan = dt&&dt.kanrikekkagaku ?(dt.kanrikekkagaku-(dt.jichiJosei ?? 0)).toLocaleString() :"";
    const jichiJosei = dt&&dt.jichiJosei ?dt.jichiJosei.toLocaleString() :""
    return(
      <tr key={"tsusyokyuhu_trs"+i} className={`boldBorderL boldBorderR ${i===2 ?"boldBorderB" :""}`}>
        {i===0 ?<td rowSpan="3" className="rowTitle">障害児通所給付費</td>:null}
        <td className="boldBorderR">{service_name}</td>
        <td>{countOfUsers}</td>
        <td>{tanniTotal}</td>
        <td>{userSanteiTotal}</td>
        <td>{kyuhuhi}</td>
        <td>{riyousyaHutan ?riyousyaHutan :""}</td>
        <td>{jichiJosei}</td>
      </tr>
    )
  })
  const nyusyokyuhu_trs = [...Array(ROWNUM_OF_TYPE)].map((_, i) => {
    const tds = tsusyokyuhu_keys.map((_, i) => <td key={"tsusyokyuhu_keys"+i} className={i===0 ?"boldBorderR" :""}></td>);
    return(
      <tr key={"nyusyokyuhu"+i} className={`boldBorderL boldBorderR ${i===2 ?"boldBorderB" :""}`}>
        {i===0 ?<td rowSpan="3" className="rowTitle">障害児入所給付費</td>:null}
        {tds}
        <td></td>
      </tr>
    )
  })
  const subtotal_list = dtList.reduce((result, dt) => {
    const jichiJosei_tri = dt.jichiJosei ?true :false;
    tsusyokyuhu_keys.forEach((key, i) => {
      if(jichiJosei_tri){
        if(key === "kyuhuhi"){
          result[i] += dt.userSanteiTotal - dt.kanrikekkagaku;
        }else if(key === "kanrikekkagaku"){
          result[i] += (dt.kanrikekkagaku - (dt.jichiJosei ?? 0));
        }else{
          result[i] += dt[key];
        }
      }else{
        if(key === "kyuhuhi"){
          result[i] += dt.userSanteiTotal - dt.kanrikekkagaku;
        }else{
          result[i] += dt[key];
        }
      }
    });
    return result
  }, [...tsusyokyuhu_keys.map(()=>0)])
  const subtotal_tds = subtotal_list.map((val,i) => <td key={"subtotal"+i}>{val ?val.toLocaleString() :""}</td>);
  const adjust_tds = [...Array(tsusyokyuhu_keys.length)].map((x,i) => <td key={"tsusyokyuhu_keys"+i}></td>);
  const total_list = subtotal_list;
  const total_tds = total_list.map((val,i) => <td key={"total"+i}>{val ?val.toLocaleString() :""}</td>)

  return(
    <table className={classes.mainTable}>
      <tbody>
        <tr className="boldBorder"><td colSpan="2" className="boldBorderR">区分</td><td>件数</td><td>単位数</td><td>費用合計</td><td>給付費請求額</td><td>利用者負担額</td><td>自治体助成分</td></tr>
        {tsusyokyuhu_trs}
        {nyusyokyuhu_trs}
        <tr className="boldBorder">
          <td colSpan="2" className="boldBorderR">小計</td>
          {subtotal_tds}
        </tr>
        <tr className="boldBorder">
          <td colSpan="2" className="boldBorderR">特定入所障害児食費等給付費</td>
          {adjust_tds}
        </tr>
        <tr className="boldBorder">
          <td colSpan="2" className="boldBorderR">合計</td>
          {total_tds}
        </tr>
      </tbody>
    </table>
  )
}

const KyuhuhiOne = ({dtList, cityName, com, stdDate}) => {
  const service = useSelector(state => state.service);
  const classes = useStyles();
  const now = new Date();
  const wareki_date = getDateEx(now.getFullYear(), now.getMonth()+1, now.getDate());
  const wareki = wareki_date.wr.l;
  const wareki_year = String(wareki_date.wr.y).padStart(2, "0");
  const month = String(wareki_date.m).padStart(2, "0");
  const date = String(wareki_date.d).padStart(2, "0");
  const wareki_str = `${wareki}${wareki_year}年${month}月${date}日`;
  const title = (() => {
    if(service === "計画相談支援") return "計画相談支援給付費請求書";
    if(service === "障害児相談支援") return "障害児相談支援給付費請求書";
    return "障害児通所給付費・入所給付費等請求書";
  })();
  return(
    <div className={classes.kyuhuhiOne}>
      <div className="title">{title}</div>
      <div className="printDate">{wareki_str}</div>
      <div className="info">
        <div>
          <div style={{marginBottom:8}}>（請　求　先）</div>
          <div>{cityName}<span style={{marginLeft: 8}}>殿</span></div>
          <div style={{marginTop: 64}}>下記のとおり請求します</div>
        </div>
        <JigyosyoInfoTable com={com}/>
      </div>
      <DateTable stdDate={stdDate} />
      <TotalTable dtList={dtList} />
      <MainTable dtList={dtList} />
    </div>
  )
}

const Kyuhuhi = (props) => {
  const {preview, userList} = props;
  const allState = useSelector(state=>state);
  const {stdDate, schedule, users, com, service, serviceItems, classroom} = allState;
  const nameList = ['給付費請求書'];
  if (nameList.indexOf(preview) < 0)  return null;
  // serviceが全表示以外の場合は表示しない
  if(serviceItems.length > 1 && service !== "") return(
    <div style={
      {
        marginTop: 100, textAlign: 'center', paddingRight: 64, color: red[800],
        fontWeight: 600, fontSize: '1.2rem',
      }}
    >
      サービス種別を全表示に切り替えて下さい
    </div>
  )
  if (classroom){
    return (
      <div style={
        {
          marginTop: 100, textAlign: 'center', paddingRight: 64, color: red[800],
          fontWeight: 600, fontSize: '1.2rem',
        }}
      >
        単位設定を解除して下さい
      </div>

    )

  }
  const bdprms = { stdDate, schedule, users, com, service, serviceItems };
  bdprms.calledBy = 'Kyuhuhi';
  // calledBy対応済み
  const { masterRec } = setBillInfoToSch(bdprms, userList);
  const city_data = users.reduce((result, user) => {
    const scity_no = user.scity_no ? user.scity_no.slice(0, 6) : "";
    if(scity_no && !result[scity_no]) {
      result[scity_no] = user.scity;
      return result
    }
    return result
  }, {});
  const data = masterRec.totalized.reduce((result, cityDt) => {
    const scity_no = cityDt.scityNo ? cityDt.scityNo.slice(0, 6) : "";
    if(scity_no && !result[scity_no]) result[scity_no] = [];
    if(scity_no) result[scity_no].push(cityDt);
    return result
  }, {});

  const pages = Object.keys(data).map((cityNo, i) => {
    const city_name = city_data[cityNo.slice(0, 6)];
    return <KyuhuhiOne key={"kyuhuhi_one"+i} dtList={data[cityNo.slice(0, 6)]} cityName={city_name} com={com} stdDate={stdDate} />
  })

  return (
    <>
    {pages}
    {/* <SetPrintTitle printTitle="給付費請求書"/> */}
    </>
  )
}
export default Kyuhuhi