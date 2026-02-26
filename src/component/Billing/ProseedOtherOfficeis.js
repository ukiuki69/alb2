import { Button, makeStyles } from '@material-ui/core';
import { red, teal } from '@material-ui/core/colors';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSomeState, univApiCall } from '../../albCommonModule';
import { 
  getLodingStatus, parsePermission, fdp, null2Zero, formatNum, formatDate, 
  formatTelNum,
  shortWord
} from '../../commonModule';
import BarChartIcon from '@material-ui/icons/BarChart';
import { 
  DisplayInfoOnPrint,
  LoadErr, LoadingSpinner, PermissionDenied, SendBillingToSomeState 
} from '../common/commonParts';
import { ProseedLinksTab } from './Proseed';
import { BorderTop, Opacity } from '@material-ui/icons';
import { Radio, RadioGroup, FormControlLabel, FormControl, FormLabel } from '@material-ui/core';
import { serviceSyubetu } from './BlCalcData2021';
import { downloadCsv } from './utils/csvExporter';
import GetAppIcon from '@material-ui/icons/GetApp';
import { permissionCheck } from '../../modules/permissionCheck';
import { PERMISSION_DEVELOPER } from '../../modules/contants';

const useStyles = makeStyles({
  company :{width: '100%', fontSize: 12, color: teal[900], paddingBottom: 2},
  notFixed: {
    margin: 8, marginTop: 16, color: red[800], fontSize: '.8rem',
  },
  displaySelectorRoot: {
    textAlign: 'center',
  },
  proseedOthers:{
    maxWidth: 900, margin:'96px auto 40px',
    '@media print': {marginTop: 24,},
  },
  titleStyle: {
    position: 'sticky', top: 82, paddingTop: 16, background: '#fff', zIndex: 90,
    '@media print': {position: 'static'},

  }
});
// 数字整形のエイリアス
const fmtNum = (v) => (formatNum(null2Zero(v), 1));

const JOUGEN_KANRI_KASAN_CODE = ['635370', '615370', '645370'];

// 処遇改善加算のネーム属性
const syoguuTargetNames = [
  '福祉・介護職員等ベースアップ等支援加算', '福祉・介護職員処遇改善加算', '特定処遇改善加算',
]

// オブジェクトを配列化する
const toArray = (v) => {
  if (Array.isArray(v)) return v;
  const r = [];
  Object.keys(v).forEach(e=>{
    if ((typeof v[e]) !== 'object') return null;
    if (Array.isArray(v[e])) return null;
    if (!Object.keys(v[e]).length)  return null;
    r.push(v[e]);
  });
  return r;
}
// 1年間、遡った、日付を得る
const getPastYearDates = (inputDate) => {
  const dates = [];
  const date = new Date(inputDate);
  date.setMonth(date.getMonth() - 1);  // 最初に1ヶ月遡る

  for (let i = 0; i < 12; i++) {
    dates.push(date.toISOString().slice(0, 7) + "-01");
    date.setMonth(date.getMonth() - 1);
  }

  return dates;
};

const makeSyoguuData = (date, bdt, proseedHist, syoguuHist, setSyoguuHist) => {
  // データを集計する
  const aggregateData = (data) => {
    const aggregated = {};

    data.forEach(item => {
        const key = `${item.s}_${item.c}`;
        if (!aggregated[key]) {
            aggregated[key] = { ...item, santei: 0, tanniNum: 0 };
        }
        aggregated[key].santei += item.santei;
        aggregated[key].tanniNum += item.tanniNum;
    });
    return Object.values(aggregated);
  };
  const syoguuList = bdt.reduce((result, usersBdt)=>{
    const t = usersBdt.itemTotal.filter(e=>syoguuTargetNames.includes(e.name));
    result.push(...t);
    return result;
  },[]);
  // console.log(syoguuList, 'syoguuList');
  const aggregate = aggregateData(syoguuList);
  aggregate.forEach(e=>{e.date = date});
  const pickup = aggregate.map(e=>(
    {date, c: e.c, tanniNum: e.tanniNum, santei: e.santei})
  )
  console.log(aggregate, pickup, 'aggregate, pickup')
  const t = [...syoguuHist, ...aggregate];
  t.sort((a, b) => a.date < b.date? -1: 1);
  t.forEach(e=>{
    const p = proseedHist.find(f=>f.date === e.date);
    e.locked = p?.locked;
  })
  setSyoguuHist(t);
  // console.log([...syoguuHist, ...syoguuList], 'syoguuHist');
}

const DisplaySelector = ({ dispSelect, setDispSelect }) => {
  const classes = useStyles();
  const handleChange = (event) => {
    setDispSelect(Number(event.target.value));
  };

  return (
    <div className={classes.displaySelectorRoot + ' noprint'}>
      <FormControl component="fieldset">
        {/* <FormLabel component="legend">表示切替</FormLabel> */}
        <RadioGroup row aria-label="display" name="display" value={dispSelect} onChange={handleChange}>
          <FormControlLabel value={0} control={<Radio />} label="売上表示" />
          <FormControlLabel value={1} control={<Radio />} label="処遇改善項目ごと" />
          <FormControlLabel value={2} control={<Radio />} label="処遇改善月ごと" />
        </RadioGroup>
      </FormControl>
    </div>
  );
};

const SyoguuItemsOne = ({syoguuHist, service, item, date}) => {
  const svcSyubetu = service? String(serviceSyubetu[service]): '';
  const rowsSrc = (() => {
    if (service){
      return syoguuHist.sort((a, b) => (a.date < b.date? -1: 1)).filter(e=>{
        if (e.name === item && svcSyubetu && e.s.slice(0, 2) === svcSyubetu) return true;
        else return false;
      })
    }
    else if (date){
      return syoguuHist.sort((a, b)=> (a.c < b.c? -1: 1)).filter(e=>(e.date === date))
    }
  })();
  
  const srows = rowsSrc.map((e, i)=>{
    const locked = e.locked; // 暫定
    const notLockedStyle = locked? {}: {opacity: .6};
    return (
      <div className='flxRow lower' key={i} style={notLockedStyle}>
        <div className='w10'>{e.date.slice(0, 4) + '年' + e.date.slice(5, 7) + '月'}</div>
        <div className='w07'>{e.s}</div>
        <div className='w30'>{e.c.replace(/・$/, '')}</div>
        <div className='w10 lowerRight'>{fmtNum(e.tanniNum)}</div>
        <div className='w15 lowerRight'>{fmtNum(Math.round(e.santei))}</div>
      </div>
    )
  });
  const tanniTotal = rowsSrc.reduce((sum, item)=>(sum + item.tanniNum), 0);
  const santeiTotal = rowsSrc.reduce((sum, item)=>(sum + item.santei), 0);
  const subTotalStyle = {
    background:"#FFF", borderTop: `1px ${teal[300]}`,
    borderBottom: 'none', marginBottom: 8,
  }
  const sumTitle = (
    item
      ? shortWord(service)+shortWord(item)
      : (date.slice(0, 4) + '年' + date.slice(5, 7) + '月')
  ) + '小計'
  const sumRow = (
    <div className='flxRow lower' key={'sum'} style={subTotalStyle}>
      <div className='w10'></div>
      <div className='w07'></div>
      <div className='w30'>{sumTitle}</div>
      <div className='w10 lowerRight'>{fmtNum(tanniTotal)}</div>
      <div className='w15 lowerRight'>{fmtNum(santeiTotal)}</div>
    </div>
  )
  if (rowsSrc.length){
    srows.push(sumRow);
  }
  return (
    <div>{srows}</div>
  )
}

const SyoguuItems = ({ syoguuHist, dispSelect }) => {
  const serviceItems = useSelector(state => state.serviceItems);
  // 月のユニークなリストを作成
  const monthList = Array.from(new Set(syoguuHist.map(e=>e.date)));
  const renderSyoguuItems = () => {
    const items = [];
    if (dispSelect === 1){
      serviceItems.forEach((service, idx) => {
        syoguuTargetNames.forEach((item, index) => {
          items.push(
            <SyoguuItemsOne 
              key={`${index}-${idx}`} service={service} item={item} syoguuHist={syoguuHist} 
            />
          );
        });
      });
    }
    else if (dispSelect === 2){
      monthList.forEach((month, i) => {
        items.push(
          <SyoguuItemsOne key={`${i}`} syoguuHist={syoguuHist} date={month}/>
        )
      })
    }
    return items;
  };
  const tanniTotal = syoguuHist.reduce((sum, item)=>(sum + item.tanniNum), 0);
  const santeiTotal = syoguuHist.reduce((sum, item)=>(sum + item.santei), 0);
  const subTotalStyle = {
    background:"#FFF", borderTop: `1px ${teal[300]}`,
    borderBottom: 'none', marginBottom: 4,
  }
  const sumRow = (
    <div className='flxRow lower' key={'sum'} style={subTotalStyle}>
      <div className='w10'>合計</div>
      <div className='w07'></div>
      <div className='w30'></div>
      <div className='w10 lowerRight'>{fmtNum(tanniTotal)}</div>
      <div className='w15 lowerRight'>{fmtNum(santeiTotal)}</div>
    </div>
  )


  return (
    <div>
      {renderSyoguuItems()}
      {syoguuHist.length > 0? sumRow: null}
    </div>
  );
};

export const MainProseedOtherOfficeis = ({mode}) => {
  const classes = useStyles();
  const allstate = useSelector(state=>state);
  const {stdDate, accountLst, hid, bid} = allstate;
  const account = useSelector(state => state.account);
  const permission = parsePermission(account)[0][0];
  const [fetchStatus, setFetchStatus] = useState(
    {count:accountLst.length ,loaded: 0, nodata: 0, error: 0}
  );
  const todayStr = formatDate(new Date(), 'YYYY-MM-DD');
  const [res, setRes] = useState({});
  const [officeis, setOfficeis] = useState(()=>{
    return accountLst.map(e=>e);
  });
  // 売上履歴格納
  const [proseedHist, setProseedHist] = useState([]);
  // 処遇改善加算格納用
  const [syoguuHist, setSyoguuHist] = useState([]);
  // 表示切替用 0: 売上表示 1: 処遇改善詳細 2:処遇改善集計
  const [dispSelect, setDispSelect] = useState(0);

  
  // 月が変わったときに他事業所売上情報正気化
  useEffect(()=>{
    return () => {
      const t = officeis;
      t.forEach(e=>{
        e.userSanteiTotal = 0;
      });
      setOfficeis(t);
    }
  }, [stdDate])

  useEffect(()=>{
    if (Object.keys(res).length){
      if (!res.data.result){
        const t = {...fetchStatus};
        t.error++;
        setFetchStatus(t);
      }
      else if (!res.data.dt.length){
        const t = {...fetchStatus};
        t.nodata++;
        setFetchStatus(t);
      }
      else{
        const t = {...fetchStatus};
        t.loaded++;
        setFetchStatus(t);
        // 他事業所の売上データ取得
        const b = fdp(res.data.dt[0], 'state.billingDt', []);
        const bdt = toArray(b); // fdpを通しているのでオブジェクトで戻ってくる！
        let loaded = res.data.dt[0].timestamp.slice(0, 10);
        loaded = (loaded === todayStr)
        ?res.data.dt[0].timestamp.slice(11, 20): loaded;
        const thisBid = res.data.dt[0].bid;
        const thisHid = res.data.dt[0].hid;
        const userSanteiTotal = bdt.reduce((v, e)=>(v + e.userSanteiTotal), 0);
        const countOfUse = bdt.reduce((v, e)=>(v + e.countOfUse), 0);
        const tanniTotal = bdt.reduce((v, e)=>(v + e.tanniTotal), 0);
        const ketteigaku = bdt.reduce((v, e)=>(v + e.ketteigaku), 0);
        const jichiJosei = bdt.reduce((v, e)=>(v + e.jichiJosei), 0);
        const actualCost = bdt.reduce((v, e)=>(v + e.actualCost), 0);
        const jougenKanriCount = bdt.reduce((v, e)=>(
          v + e.itemTotal.filter(f=>JOUGEN_KANRI_KASAN_CODE.includes(f.s)).length), 0
        );
        const allItemS = bdt.reduce((arr, e) => {
          e.itemTotal.forEach(item => arr.push(item.s));
          return arr;
        }, []);
        const itemCount = new Set(allItemS).size;
        const allServices = bdt.reduce((arr, e) => {
          if (e.service) {
            const services = e.service.split(',').map(s => s.trim());
            arr.push(...services);
          }
          return arr;
        }, []);
        const kyoudaiCount = bdt.filter(e => e.kdTyousei !== undefined).length;
        const serviceCount = new Set(allServices).size;
        const locked = res.locked;
        const v = {
          userSanteiTotal, countOfUse, tanniTotal, ketteigaku, jichiJosei, 
          actualCost, loaded, locked,
          jougenKanriCount, itemCount, serviceCount, kyoudaiCount,
        }
        if (!mode){
          const p = officeis.findIndex(e=>(e.bid === thisBid && e.hid === thisHid));
          const u = [...officeis];
          u[p] = {...u[p], ...v};
          setOfficeis(u);
        }
        else if (mode === 'year'){
          v.date = res.date;
          const t = [...proseedHist];
          t.push(v);
          t.sort((a, b)=>(a.date < b.date? -1: 1));
          setProseedHist([...t]);
          makeSyoguuData(res.date, bdt, t, syoguuHist, setSyoguuHist);
        }
      }
    }
  }, [res]);

  const companySet = new Set([...officeis].filter(e=>e.userSanteiTotal).map(e=>e.hid));
  const multiCamp = companySet.size > 1; // 複数法人表示
  let preHname = '';
  let n = 1;
  const bdtArray = (mode === 'year')? proseedHist: officeis;
  const officeisProseeds = bdtArray.map((e, i)=>{
    // 未確定の売上げデータは色を薄くする
    const notLockedStyle = e.locked? {}: {opacity: .6};
    if (!e.userSanteiTotal) return null;
    let displayHname = false;
    if (multiCamp && preHname !== e.hname){
      displayHname = true;
      preHname = e.hname;
    }
    // const kokuho = e.userSanteiTotal - e.ketteigaku - null2Zero(e.jichiJosei);
    return (
      <div className='flxRow lower' key={i} >
        <div className='wmin lowerRight'>{n++}</div>
        {!mode &&
          <div className='w15'>
            {displayHname === true &&
              <div className={classes.company}>{e.shname}</div>
            }
            {e.sbname}
          </div>
        }
        {mode === 'year' &&
          <div className='w07' style={notLockedStyle}>
            {e.date.slice(0, 4) + '年' + e.date.slice(5, 7) + '月'}
          </div>
        }
        <div style={notLockedStyle} className='w06 lowerRight'>{fmtNum(e.tanniTotal)}</div>
        <div style={notLockedStyle} className='w08 lowerRight'>{fmtNum(e.userSanteiTotal)}</div>
        <div style={notLockedStyle} className='w08 lowerRight'>{fmtNum(e.ketteigaku)}</div>
        <div style={notLockedStyle} className='w06 lowerRight'>{fmtNum(e.actualCost)}</div>
        <div style={notLockedStyle} className='w08 lowerRight'>{fmtNum(e.userSanteiTotal + e.actualCost)}</div>
        <div style={notLockedStyle} className='w04 lowerRight'>{fmtNum(e.countOfUse)}</div>
        <div style={notLockedStyle} className='w08 lowerRight'>{e.loaded}</div>
      </div>
    )
  });
  
  const displayLength = bdtArray.filter(e=>e.userSanteiTotal).length;
  // const titleStyle = {
  //   position: 'sticky', top: 82, paddingTop: 16, background: '#fff',
  //   zIndex: 90,
  // }
  const SyoguuTitle = () => {
    if (!displayLength) return null;
    if (dispSelect >= 1){
      return (
        <div className={classes.titleStyle + ' flxTitle'} >
          <div className='w10'>年月</div>
          <div className='w07'>コード</div>
          <div className='w30'>サービス名</div>
          <div className='w10'>単位数</div>
          <div className='w15'>算定額</div>
        </div>
      )
    }
    else return null;
  }
  const Title = () => {
    if (!displayLength) return null;
    return (
      <div className={classes.titleStyle + ' flxTitle'} >
        <div className='wmin'>No</div>
        {!mode &&
          <div className='w15'>事業所名</div>
        }
        {mode === 'year' &&
          <div className='w07'>年月</div>
        }

        <div className='w06'>単位数</div>
        <div className='w08'>算定額</div>
        <div className='w08'>利用者負担</div>
        <div className='w06'>実費</div>
        <div className='w08'>売上</div>
        <div className='w04'>利用数</div>
        <div className='w08'>更新日/時刻</div>
      </div>
    )
  }
  const Total = () => {
    const bdtArray = (mode === 'year')? proseedHist: officeis;
    if (!displayLength) return null;
    const total = bdtArray.reduce((v, e) =>{
      v += ((e.userSanteiTotal || 0) + (e.actualCost || 0));
      return v;
    }, 0);
    return (
      <div className='flxRow'>
        <div className='wmin'></div>
        {!mode &&
          <div className='w15'>合計</div>
        }
        {mode === 'year' &&
          <div className='w07'>合計</div>
        }

        <div className='w06'></div>
        <div className='w08'></div>
        <div className='w08'></div>
        <div className='w06'></div>
        <div className='w08 lowerRight'>{fmtNum(total)}</div>
        <div className='w04'></div>
        <div className='w08'></div>
      </div>
    )
  }
  const handleClick = () => {
    const f = async (e) => {
      const prms = {
        hid: e.hid, bid: e.bid, date: stdDate,
        item: 'billingDt',
        a: 'fetchAnyState',
      };
      const r = await univApiCall(prms);
      prms.a = 'fetchSchedule';
      const s = await univApiCall(prms);
      r.locked = s?.data?.dt?.[0]?.schedule?.locked;
      setRes(r);
    }
    const f1 = async (e) => {
      const prms = {
        hid, bid, date: e,
        item: 'billingDt',
        a: 'fetchAnyState',
      };
      const r = await univApiCall(prms);
      prms.a = 'fetchSchedule';
      const s = await univApiCall(prms);
      r.date = e; // resに日付を格納
      r.locked = s?.data?.dt?.[0]?.schedule?.locked;
      setRes(r);
    }
    if (!mode){
      accountLst.forEach(e=>{
        const permission = parsePermission(e)[0][0];
        if (permission >= 90){
          f(e);
        }
      });
    }
    else if (mode === 'year'){
      setProseedHist([]);
      setSyoguuHist([]);
      const days = getPastYearDates(stdDate);
      days.forEach((e)=>{
        f1(e)
      })
    }
  }
  const handleExportCsv = (includeIds = false) => {
    
    let bdtArray, fileName, columns, titles;
    
    if (mode === 'year') {
      if (dispSelect >= 1) {
        // 処遇改善表示の場合
        bdtArray = [...syoguuHist];
        bdtArray.forEach(e=>{
          e.santei = Math.round(e.tanniNum * e.up);
        });
        // 単位数が0のデータを除外
        bdtArray = bdtArray.filter(e => e.tanniNum > 0);
        fileName = `処遇改善加算_${new Date().toISOString().slice(0, 10)}.csv`;
        
        // 処遇改善項目用のカラムとタイトル
        columns = ['date', 's', 'c', 'tanniNum', 'santei'];
        titles = ['年月', 'コード', 'サービス名', '単位数', '算定額'];
      } else {
        // 年間売上表示の場合
        bdtArray = proseedHist;
        // 単位数が0のデータを除外
        bdtArray = bdtArray.filter(e => e.tanniTotal > 0);
        fileName = `年間売上_${new Date().toISOString().slice(0, 10)}.csv`;
        columns = ['date', 'tanniTotal', 'userSanteiTotal', 'ketteigaku', 'actualCost', 'countOfUse', 'loaded'];
        titles = ['年月', '単位数', '算定額', '利用者負担', '実費', '利用数', '更新日/時刻'];
      }
    } else {
      // 通常の他事業所売上表示
      bdtArray = officeis;
      // 単位数が0のデータを除外
      bdtArray = bdtArray.filter(e => e.tanniTotal > 0);
      if (includeIds) {
        fileName = `他事業所売上_ID付き_${new Date().toISOString().slice(0, 10)}.csv`;
        columns = [
          'hid', 'bid', 'sbname', 'tanniTotal', 'userSanteiTotal', 'ketteigaku', 'actualCost', 'countOfUse', 'loaded',
          'jougenKanriCount', 'itemCount', 'serviceCount', 'kyoudaiCount',
        ];
        titles = ['法人ID', '事業所ID', '事業所名', '単位数', '算定額', '利用者負担', '実費', '利用数', '更新日/時刻',
          '上限', 'アイテム', 'サービス', '兄弟',
        ];
      } else {
        fileName = `他事業所売上_${new Date().toISOString().slice(0, 10)}.csv`;
        columns = ['sbname', 'tanniTotal', 'userSanteiTotal', 'ketteigaku', 'actualCost', 'countOfUse', 'loaded'];
        titles = ['事業所名', '単位数', '算定額', '利用者負担', '実費', '利用数', '更新日/時刻'];
      }
    }
    
    downloadCsv(bdtArray, {fileName, columns, titles});
  };
  const FetchButton = () => {
    const style = {
      padding: 8, textAlign: 'center', paddingBottom: 24, position: 'relative',
    }
    const sendButtonStyle = {
      position: 'absolute', top:8, right: 8,
    }

    return (<>
      <div style={style} className='noprint'>
        <div style={sendButtonStyle}>
          <SendBillingToSomeState sendAnyTime={false} displayButton={true}/>
        </div>
        <Button
          variant='contained'
          onClick={handleClick}
          startIcon={<BarChartIcon/>}
        >
          売上情報取得
        </Button>
        {displayLength > 0 && (
          <>
            <Button
              variant='contained'
              onClick={() => handleExportCsv(false)}
              style={{ marginLeft: 8 }}
              startIcon={<GetAppIcon/>}
            >
              CSV出力
            </Button>
            {!mode && permissionCheck(PERMISSION_DEVELOPER, account) && (
              <Button
                variant='contained'
                onClick={() => handleExportCsv(true)}
                style={{ marginLeft: 8 }}
                startIcon={<GetAppIcon/>}
              >
                CSV出力(ID付き)
              </Button>
            )}
          </>
        )}
      </div>
      </>)
  }
  const contentStyle = {maxWidth: 900, margin:'96px auto 40px'};
  const notFixed = (() => {
    if (mode !== 'year') return false;
    if (proseedHist.find(e=>!e.locked)) return true;
    return false;
  })();
  return (<>
    <ProseedLinksTab/>
    <DisplayInfoOnPrint />
    <div className={classes.proseedOthers}>
      <FetchButton />
      {mode === 'year' && <DisplaySelector dispSelect={dispSelect} setDispSelect={setDispSelect} />}
      {dispSelect === 0 && <>
        <Title/>
        {officeisProseeds}
        <Total />
        </>}
      {dispSelect >= 1 && <>
        <SyoguuTitle/>
        <SyoguuItems syoguuHist={syoguuHist} dispSelect={dispSelect} />
      
      </>}

      {notFixed && <>
        <div className={classes.notFixed}>
          薄い色で示されている月は確定処理が行われていません。数値に誤差が発生している可能性があります。
        </div>
      </>}
    </div>
  </>)
}

const ProseedOtherOfficeis = ()=>{
  const allstate = useSelector(state=>state);
  const loadingStatus = getLodingStatus(allstate);
  const account = useSelector(state => state.account);
  const permission = parsePermission(account)[0][0];

  if (loadingStatus.loaded && permission >= 90){
    return(<>
      <MainProseedOtherOfficeis />
    </>)
  }
  else if (loadingStatus.error){
    return (<>
      <LoadErr loadStatus={loadingStatus} errorId={'E5966'} />
    </>)
  }
  else if (permission < 90) return <PermissionDenied marginTop='90'/>
  else{
    return(<>
     <LoadingSpinner/>
    </>)
  }
}
export default ProseedOtherOfficeis;