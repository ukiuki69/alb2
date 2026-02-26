import { makeStyles } from '@material-ui/core';
import React from 'react';
import { useSelector, } from 'react-redux';
import {setBillInfoToSch} from '../Billing/blMakeData';
import * as comMod from '../../commonModule';
import { LoadErr, LoadingSpinner } from '../common/commonParts';

const useStyles = makeStyles({
    tokyoPage:{
        // breakAfter: 'page',
        marginBottom: "5em",
        '& #tokyoHeader>div':{
            marginBottom: '2em'
        },
        '& #tokyoTitle':{
            marginTop: '2em',
            marginBottom: '2em',
            fontWeight: 'bold',
            textAlign: 'center',
            fontSize: '1.5em'
        },
        '& #tokyoTitleCopy': {
            margin: '1em 0',
            fontWeight: 'bold',
            textAlign: 'center',
            fontSize: '1.5em'
        },
        '& #tokyoAbout':{
            marginBottom: '1em',
            lineHeight: 1.5
        },
        '& #tokyoTable':{
            width: '100%',
            border: '1px solid',
            borderWidth: '2px',
            marginTop: '2em',
            display: 'flex',
            flexDiretion: 'row',
            '& .tokyo_th':{
                width: '45%',
                borderRight: '1px solid',
                '& div:nth-child(4)':{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                },
                '& .tokyo_subtable > div':{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    '& p':{
                        textAlign: 'center',
                    },
                    '& p:nth-child(1)':{
                        width: '90%'
                    }
                },
                '& .service2': {height: '3rem'}
            },
            '& .tokyo_td':{
                width: '55%',
                '& p':{
                    margin: '0 30%'
                },
                '& .service': {
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                    justifyContent: 'space-evenly', padding: '16px 0',
                    '& p:not(:first-child)': {marginTop: 6}
                },
                '& .service2': {
                    height: '3rem',
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                    justifyContent: 'space-evenly', padding: '16px 0',
                    '& p:not(:first-child)': {marginTop: 6}
                }
            },
            '& #tokyoSubth':{
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                '& >div':{
                    width: '50%'
                },
                '& >div:nth-child(1)':{
                    borderRight: '1px solid',
                }
            },
            '& .tokyo_cell':{
                borderBottom: '1px solid',
            },
            '& .tokyo_row':{
                height: '5em',
                display: 'flex',
                alignItems: 'center',
            },
            '& .copy_tokyo_row':{
                height: '2.5em',
                display: 'flex',
                alignItems: 'center',
            },
            '& .tokyo_num':{
                justifyContent: 'flex-end',
            },
            '& p':{
                margin: '0 0.5em'
            }
        },
        '& #tokyoAnnotation':{
            marginTop: 4,
            textAlign: 'right'
        }
    }
})

// 2021-01-01フォーマットから和暦などの日付情報を取り出す
const str2gdex = (s) =>{
    return comMod.getDateEx(s.split('-')[0], s.split('-')[1], s.split('-')[2]);
}

export const TokyoDairiTsuchiOne = (props) => {
    const classes = useStyles();
    const service = useSelector(state => state.service);
    const {e, users, com, schedule, stdDate, userList, keyIndex, reportDateDt, specialStateDate} = props;
    const convJido = com?.ext?.reportsSetting?.convJido ?? com?.etc?.configReports?.convJido ?? false;
    const user = users.reduce((result, user) => user.uid===e.UID.replace("UID", "") ?user :result, null);
    if(!user) return null;
    if(!userList.find(u => u.uid === user.uid).checked) return null;

    const c_price = "0";
    const dairiJuryoPrice = comMod.formatNum(parseInt(e.userSanteiTotal) - parseInt(e.ketteigaku) + parseInt(c_price), 1);
    const stddate_array = stdDate.split('-')
    const serv_wareki = comMod.getDateEx(stddate_array[0], stddate_array[1], stddate_array[2]);

    const tDate = comMod.parseDate(stdDate).date.dt;
    const nDate = new Date(tDate.getFullYear(), tDate.getMonth() + 2, 15);
    const jtInit = comMod.formatDate(nDate, 'YYYY-MM-DD');
    // const jtDate = reportDateDt?.['代理受領通知日'] ?? jtInit;
    let jtDate = localStorage.getItem("reportsSettingDate")
      ?JSON.parse(localStorage.getItem("reportsSettingDate"))?.["代理受領通知日"] ?? jtInit
      :jtInit;
    //   (comMod.findDeepPath(schedule, ['report', service, '代理受領通知日'])) ? 
    //   schedule.report[service].代理受領通知日 : jtInit;
    if(specialStateDate) jtDate = specialStateDate;
    const gengou = str2gdex(jtDate).wr.l; // 元号
    const wry = String(str2gdex(jtDate).wr.y).padStart(2, '0'); // 和暦の年
    const month = String(str2gdex(jtDate).m).padStart(2, "0");
    const day = String(str2gdex(jtDate).d).padStart(2, '0');

    const serviceStr = user.service.split(",").map(serv => <p>{serv}事業</p>);

    return(
        <div className='printPage'>
            <div className={classes.tokyoPage}>
                <div id='tokyoHeader'>
                    <div style={{"textAlign": "right"}}>{gengou}{wry}年{month}月{day}日</div>
                    <div style={{"textAlign": "left"}}>{e.pname}様</div>
                    <div style={{"textAlign": "right"}}>{com.hname}　{com.bname}</div>
                </div>
                <div id='tokyoTitle'>{`${convJido ?"通所給付費" :"介護給付費"}の受領のお知らせ`}<br/><span style={{"fontSize": "0.75em"}}>（法定代理受領のお知らせ）</span></div>
                <div id = 'tokyoAbout'>
                　{e.name || e.pname}様に提供した下記のサービスに要した費用について、{user.scity}から下記のとおり利用者様に代わり支払いを受けましたので、お知らせします。<br/>
                　このお知らせの内容に疑義がある場合は、当事業所もしくは{user.scity}にお問い合わせください。
                </div>
                <div style={{"textAlign": "center"}}>記</div>
                <div id='tokyoTable'>
                    <div className='tokyo_th'>
                        <div className='tokyo_cell tokyo_row'><p>サービス提供年月</p></div>
                        <div className='tokyo_cell tokyo_row'><p>サービス内容</p></div>
                        <div className='tokyo_cell tokyo_row'><p>受領日</p></div>
                        <div className='tokyo_cell tokyo_row'><p>代理受領金額</p><p>（A）-（B）+（C）</p></div>
                        <div id='tokyoSubth'>
                            <div style={{'display': 'flex', 'alignItems': 'center', 'justifyContent': 'center'}}><p>代理受領額の内訳</p></div>
                            <div className='tokyo_subtable'>
                                <div className='tokyo_cell tokyo_row'><p>サービスに要した<br/>費用の全体の額</p><p>（A）</p></div>
                                <div className='tokyo_cell tokyo_row'><p>利用者負担額</p><p>（B）</p></div>
                                <div className='tokyo_row'><p>特定{convJido ?'利用者':'障害者等'}特別<br/>給付費</p><p>（C）</p></div>
                            </div>
                        </div>
                    </div>
                    <div className='tokyo_td'>
                        <div className='tokyo_cell tokyo_row'><p>令和{("0"+serv_wareki.wr.y).slice(-2)}年{("0"+serv_wareki.m).slice(-2)}月</p></div>
                        {/* <div className='tokyo_cell tokyo_row'><p>{user.service.split(",")}事業</p></div> */}
                        <div className='tokyo_cell tokyo_row service'>{serviceStr}</div>
                        <div className='tokyo_cell tokyo_row'><p>{gengou}{wry}年{month}月{day}日</p></div>
                        <div className='tokyo_cell tokyo_row tokyo_num'><p>金{String(dairiJuryoPrice)}円</p></div>
                        <div className='tokyo_subtable'>
                            <div className='tokyo_cell tokyo_row tokyo_num'><p>金{comMod.formatNum(e.userSanteiTotal, 1)}円</p></div>
                            <div className='tokyo_cell tokyo_row tokyo_num'><p>金{comMod.formatNum(e.ketteigaku, 1)}円</p></div>
                            <div className='tokyo_row tokyo_num'><p>金{String(c_price)}円</p></div>
                        </div>
                    </div>
                </div>
                <div id='tokyoAnnotation'>※このお知らせは、請求書ではありません。</div>
            </div>
            <div className={'pageBreak'}></div>
        </div>
    )
}

const TokyoDairiTsuchiWithCopy = (props) => {
    const classes = useStyles();
    const service = useSelector(state => state.service);
    const {e, users, com, schedule, stdDate, selectPreview, userList, keyIndex, reportDateDt} = props;
    const convJido = com?.ext?.reportsSetting?.convJido ?? com?.etc?.configReports?.convJido ?? false;
    const user = users.reduce((result, user) => user.uid===e.UID.replace("UID", "") ?user :result, null);
    if(!user) return null;
    if(!userList.find(u => u.uid === user.uid).checked) return null;
    const c_price = "0";
    const dairiJuryoPrice = comMod.formatNum(parseInt(e.userSanteiTotal) - parseInt(e.ketteigaku) + parseInt(c_price), 1);
    const stddate_array = stdDate.split('-')
    const serv_wareki = comMod.getDateEx(stddate_array[0], stddate_array[1], stddate_array[2]);
    
    const tDate = comMod.parseDate(stdDate).date.dt;
    const nDate = new Date(tDate.getFullYear(), tDate.getMonth() + 2, 15);
    const jtInit = comMod.formatDate(nDate, 'YYYY-MM-DD');
    // const jtDate = reportDateDt?.['代理受領通知日'] ?? jtInit;
    //   (comMod.findDeepPath(schedule, ['report', service, '代理受領通知日'])) ? 
    //   schedule.report[service].代理受領通知日 : jtInit;
    const jtDate = localStorage.getItem("reportsSettingDate")
      ?JSON.parse(localStorage.getItem("reportsSettingDate"))?.["代理受領通知日"] ?? jtInit
      :jtInit;

    const gengou = str2gdex(jtDate).wr.l; // 元号
    const wry = String(str2gdex(jtDate).wr.y).padStart(2, '0'); // 和暦の年
    const month = String(str2gdex(jtDate).m).padStart(2, "0");
    const day = String(str2gdex(jtDate).d).padStart(2, '0');

    const preview_list = [];
    if(selectPreview === "東京都形式控え付き"){
        preview_list.push(`${convJido ?"通所給付費" :"介護給付費"}の受領のお知らせ`);
        preview_list.push(`${convJido ?"通所給付費" :"介護給付費"}の受領のお知らせ控え`);
    }

    const serviceStr = user.service.split(",").map(serv => <p>{serv}事業</p>);
    const tokyoDairiTsuchiWithCopyNodes = preview_list.map(x => {
        const title = x;
        return(
            <div className={classes.tokyoPage}>
                <div id='tokyoHeader'>
                    <div style={{"textAlign": "right"}}>{gengou}{wry}年{month}月{day}日</div>
                    <div style={{"textAlign": "left"}}>{e.pname}様</div>
                    <div style={{"textAlign": "right"}}>{com.hname}　{com.bname}</div>
                </div>
                <div id='tokyoTitleCopy'>{title}<br/><span style={{"fontSize": "0.75em"}}>（法定代理受領のお知らせ）</span></div>
                <div id = 'tokyoAbout'>
                　{e.name || e.pname}様に提供した下記のサービスに要した費用について、{user.scity}から下記のとおり利用者様に代わり支払いを受けましたので、お知らせします。<br/>
                　このお知らせの内容に疑義がある場合は、当事業所もしくは{user.scity}にお問い合わせください。
                </div>
                <div style={{"textAlign": "center"}}>記</div>
                <div id='tokyoTable'>
                    <div className='tokyo_th'>
                        <div className='tokyo_cell copy_tokyo_row'><p>サービス提供年月</p></div>
                        <div className={`tokyo_cell copy_tokyo_row service${serviceStr.length}`}><p>サービス内容</p></div>
                        <div className='tokyo_cell copy_tokyo_row'><p>受領日</p></div>
                        <div className='tokyo_cell copy_tokyo_row'><p>代理受領金額</p><p>（A）-（B）+（C）</p></div>
                        <div id='tokyoSubth'>
                            <div style={{'display': 'flex', 'alignItems': 'center', 'justifyContent': 'center'}}><p>代理受領額の内訳</p></div>
                            <div className='tokyo_subtable'>
                                <div className='tokyo_cell copy_tokyo_row'><p>サービスに要した<br/>費用の全体の額</p><p>（A）</p></div>
                                <div className='tokyo_cell copy_tokyo_row'><p>利用者負担額</p><p>（B）</p></div>
                                <div className='copy_tokyo_row'><p>特定{convJido ?'利用者':'障害者等'}特別<br/>給付費</p><p>（C）</p></div>
                            </div>
                        </div>
                    </div>
                    <div className='tokyo_td'>
                        <div className='tokyo_cell copy_tokyo_row'><p>令和{("0"+serv_wareki.wr.y).slice(-2)}年{("0"+serv_wareki.m).slice(-2)}月</p></div>
                        <div className={`tokyo_cell copy_tokyo_row service${serviceStr.length}`}>{serviceStr}</div>
                        <div className='tokyo_cell copy_tokyo_row'><p>{gengou}{wry}年{month}月{day}日</p></div>
                        <div className='tokyo_cell copy_tokyo_row tokyo_num'><p>金{String(dairiJuryoPrice)}円</p></div>
                        <div className='tokyo_subtable'>
                            <div className='tokyo_cell copy_tokyo_row tokyo_num'><p>金{comMod.formatNum(e.userSanteiTotal, 1)}円</p></div>
                            <div className='tokyo_cell copy_tokyo_row tokyo_num'><p>金{comMod.formatNum(e.ketteigaku, 1)}円</p></div>
                            <div className='copy_tokyo_row tokyo_num'><p>金{String(c_price)}円</p></div>
                        </div>
                    </div>
                </div>
                <div id='tokyoAnnotation'>※このお知らせは、請求書ではありません。</div>
            </div>
        )
    })

    return (
        <div className='printPage'>
            {tokyoDairiTsuchiWithCopyNodes[0]}
            <div style={{marginTop: "150px"}}></div>
            {tokyoDairiTsuchiWithCopyNodes[1]}
            <div className={'pageBreak'}></div>
        </div>
      )
}

const TokyoDairiTsuchi = (props) => {
    const {userList, preview, selects, reportDateDt} = props;
    const allState = useSelector(state=>state);
    const loadingStatus = comMod.getLodingStatus(allState);
    if(!loadingStatus.loaded){
        return (<LoadingSpinner />);
    }else if(loadingStatus.error){
        return (<LoadErr loadStatus={loadingStatus} errorId={'E32592'} />);
    }
    const {stdDate, schedule, users, com, service, serviceItems} = allState;
    const filtered_users = users.filter(user => service==="" || user.service.includes(service));

    const nameList = ['代理受領通知'];
    if (nameList.indexOf(preview) < 0)  return null;
    if (!selects[preview].includes("東京都形式")) return null;
    const bdprms = { stdDate, schedule, users, com, service, serviceItems };
    bdprms.calledBy = 'TokyoDairiTsuchi';
    // calledBy対応済み
    const { billingDt } = setBillInfoToSch(bdprms);
    billingDt.sort((a, b)=>a.sindex < b.sindex? -1: 1);
    const pages = billingDt.map((e, keyIndex) => {
        if (!e.tanniTotal) return null;
        const rpprmas = {
            e, users: filtered_users, com, schedule, stdDate, selectPreview: selects[preview], userList, keyIndex,
            reportDateDt
        };
        if(selects[preview] === "東京都形式") return <TokyoDairiTsuchiOne {...rpprmas} />;
        else if(selects[preview] === "東京都形式控え付き") return <TokyoDairiTsuchiWithCopy {...rpprmas} />;
    })
    return pages
}

export default TokyoDairiTsuchi;