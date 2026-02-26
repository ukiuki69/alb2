// import React from 'react';
// import { makeStyles } from "@material-ui/core"
// import { useSelector } from "react-redux";
// import { formatDate, getBrothers, getDateEx, getHiddenName, getLodingStatus, randomStr } from "../../commonModule";
// import { LoadingSpinner } from "../common/commonParts";
// import { setBillInfoToSch } from '../Billing/blMakeData';

// const NOMAL_COLS = 4;
// const SIBLING_COLS = 16;

// const NOMAL_CELL_SIZE = 16;
// const NOMAL_BORDER = '1px solid';
// const BOLD_BORDER = "2px solid";
// export const KOBE_REPORT_STYLES = {
//   entireTable: {
//     width: '100%', padding: 32,
//     '&:not(:last-child)': {marginBottom: 256, pageBreakAfter: 'always',},
//     '& .pageTitle': {textAlign: 'center', fontSize: 26, marginBottom: 32},
//     '& table': {
//       textAlign: 'center',
//       border: BOLD_BORDER, borderCollapse: 'collapse',
//       '& th, td': {
//         padding: '4px 8px',
//         border: NOMAL_BORDER,
//         // fontSize: '0.8rem'
//       },
//       '& th': {
//         fontWeight: 'initial', fontSize: '.8rem',
//       },
//       '& td': {
//         width: 8
//       },
//       '& .num': {
//         textAlign: 'right'
//       },
//       '& .anyNumberElement': {
//         padding: "0!important", minWidth: 20
//       },
//       '& .lines1': {height: NOMAL_CELL_SIZE},
//       // '& .lines2': {height: NOMAL_CELL_SIZE * 2},
//       '& .lines3': {height: NOMAL_CELL_SIZE * 3},
//       '& .lines4': {height: NOMAL_CELL_SIZE * 4},
//       '& .lines5': {height: NOMAL_CELL_SIZE * 5},
//     },
//     '& .border': {border: NOMAL_BORDER},
//     '& .borderTop': {borderTop: NOMAL_BORDER},
//     '& .borderBottom': {borderBottom: NOMAL_BORDER},
//     '& .borderRight': {borderRight: NOMAL_BORDER},
//     '& .borderLeft': {borderLeft: NOMAL_BORDER},
//     '& .boldBorder': {border: BOLD_BORDER},
//     '& .boldBorderTop': {borderTop: BOLD_BORDER},
//     '& .boldBorderBottom': {borderBottom: BOLD_BORDER},
//     '& .boldBorderRight': {borderRight: BOLD_BORDER},
//     '& .boldBorderLeft': {borderLeft: BOLD_BORDER},
//     '& .noneBorder': {border: 'none'},
//     '& .noneBorderTop': {borderTop: 'none'},
//     '& .noneBorderBottom': {borderBottom: 'none'},
//     '& .noneBorderRight': {borderRight: 'none'},
//     '& .noneBorderLeft': {borderBottom: 'none'},
//     '& .infoTables': {
//       display: 'flex', justifyContent: 'space-between',
//       marginBottom: 32
//     },
//   },
//   kanriKekkaTable: {
//     border: 'none', width: '100%', marginBottom: 32,
//     '& .description': {
//       '& td': {
//         borderLeft: BOLD_BORDER, borderRight: BOLD_BORDER,
//         borderTop: 'none', borderBottom: 'none'
//       },
//       '&:first-child td': {borderTop: BOLD_BORDER},
//       '&:last-child td': {borderBottom: BOLD_BORDER}
//     },
//   },
//   amountPerJigyosyoTable: {
//     width: '100%',
//     '& td': {
//       // width: '12px!important',
//       padding: "6px!important"
//     },
//     '& .tcol': {width: 16},
//     '& .index': {height: 16},
//     '& .jino': {height: 16},
//     '& .jname': {minHeight: 64},
//     '& .sumAmount, .userAmount, .hutangaku': {height: 16},
//     '& .hutangaku': {
//       fontSize: '0.7rem'
//     },
//   },
//   kobeAmountTable: {
//     width: '100%', marginBottom: 128,
//     '& td': {
//       // width: '12px!important',
//       padding: "6px!important"
//     },
//   },
//   confirmationForm: {
//     width: '50%',
//     margin: '0 0 0 auto',
//     '&>div': {
//       '&:not(:last-child)': {marginBottom: 16}
//     },
//     '& .year, .month, .date': {
//       width: '2rem', textAlign: 'end'
//     },
//     '& .pname': {marginLeft: 16}
//   },
//   siblingUserInfoTable: {
//     border: 'none'
//   },
//   siblingAmountPerJigyosyoTable: {
//     width: '100%',
//     '& td': {
//       padding: '6px !important'
//     },
//     '& .mainHeaderItem': {width: 16, padding: 0},
//     '& .headerItem': {width: '6rem'},
//     '& .bodyItem': {width: '6.5rem'},
//   }
// }
// const useStyles = makeStyles(KOBE_REPORT_STYLES);

// export const makeAnyNumberOfElements = (argumentObj) => {
//   const {
//     string="", elementsLength=1, colSpan=1, rowSpan=1,
//     className="", firstChildClassName="", lastChildClassName="",
//     style={}, firstChildStyle={}, lastChildStyle={}, elementKey=null
//   } = argumentObj;
//   const key = elementKey ?elementKey :randomStr(6);
//   const nodes = [...string].map((str, index) => {
//     let addStyle = {};
//     let marginedClassName = className;
//     if(index === 0){
//       addStyle = firstChildStyle;
//       if(firstChildClassName) marginedClassName += " "+firstChildClassName;
//     }
//     if(index+1 === string.length){
//       addStyle = lastChildStyle;
//       if(lastChildClassName) marginedClassName += " "+lastChildClassName;
//     }

//     return(
//       <td colSpan={colSpan} rowSpan={rowSpan} key={key+(index+1)}
//         className={`${marginedClassName} anyNumberElement`}
//         style={{...style, ...addStyle}}
//       >
//         {str}
//       </td>
//     )
//   });
//   let keyIndex = 10;
//   while(nodes.length < elementsLength){
//     keyIndex++;
//     let addStyle = {};
//     let marginedClassName = className;
//     if(nodes.length === 0){
//       addStyle = lastChildStyle;
//       if(lastChildClassName) marginedClassName += " "+lastChildClassName;
//     }
//     if(nodes.length+1 === elementsLength){
//       addStyle = firstChildStyle;
//       if(firstChildClassName) marginedClassName += " "+firstChildClassName;
//     }

//     nodes.unshift(
//       <td colSpan={colSpan} rowSpan={rowSpan} key={key+keyIndex}
//         className={`${marginedClassName} anyNumberElement`}
//         style={{...style, ...addStyle}}
//       />
//     )
//   }

//   return nodes
// }

// export const DateTable = (props) => {
//   const classes = useStyles();
//   const {stdDate, style={}} = props;
//   const stdDateParts = stdDate.split("-").map(d => parseInt(d));
//   const dateEx = getDateEx(stdDateParts[0], stdDateParts[1], 1);
//   const wareki = dateEx.wr.l;
//   const warekiYear = String(dateEx.wr.y).padStart(2, "0");
//   const month = String(dateEx.m).padStart(2, "0");

//   const numStyles = {width: NOMAL_CELL_SIZE}
//   return(
//     <table style={{margin: '0 0 32px auto', ...style}}>
//       <tbody>
//         <tr>
//           <td className='lines1' style={{width: 32}}>{wareki}</td>
//           <td className='lines1' style={numStyles}>{warekiYear[0]}</td>
//           <td className='lines1' style={numStyles}>{warekiYear[1]}</td>
//           <td className='lines1' style={numStyles}>年</td>
//           <td className='lines1' style={numStyles}>{month[0]}</td>
//           <td className='lines1' style={numStyles}>{month[1]}</td>
//           <td className='lines1' style={{width: 32}} >月分</td>
//         </tr>
//       </tbody>
//     </table>
//   )
// }

// const UserInfoTable = (props) => {
//   const classes = useStyles();
//   const {user, hidePersonalInfo} = props;

//   const cityNumNodes = [...user.scity_no].map((num, index) => (<td key={`cityNum${index+1}`} className='lines1'>{num}</td>));
//   const hNumNodes = [...user.hno].map((num, index) => (<td key={`hNum${index+1}`} className='lines2'>{num}</td>));

//   return(
//     <table className={classes.userInfoTable}>
//       <tbody>
//         <tr>
//           <th className='lines1'>市町村番号</th>
//           {cityNumNodes}
//         </tr>
//         <tr>
//           <th className='lines2'>受給者証番号</th>
//           {hNumNodes}
//         </tr>
//         <tr>
//           <th className='noneBorderBottom'>給付決定保護者等<br />氏名</th>
//           <td className='lines2' colSpan="10">{getHiddenName(user.pname, hidePersonalInfo)}</td>
//         </tr>
//         <tr>
//           <th className='noneBorderBottom'>支給決定に係る児童<br />氏名</th>
//           <td className='lines2' colSpan="10">{getHiddenName(user.name, hidePersonalInfo)}</td>
//         </tr>
//       </tbody>
//     </table>
//   )
// }

// const OfficeInfoTable = (props) => {
//   const classes = useStyles();
//   const {com} = props;

//   const cellStyles = {width: NOMAL_CELL_SIZE}
//   const jigyosyoNumNodes = [...com.jino].map((num, index) => (<td key={`jNum${index+1}`} className='lines1' style={cellStyles}>{num}</td>));

//   return(
//     <table>
//       <tbody>
//         <tr>
//           <th className='lines1' style={{width: '7rem'}}>指定事業所番号</th>
//           {jigyosyoNumNodes}
//         </tr>
//         <tr>
//           <th>事業所及びその事業者の名称</th>
//           <td colSpan="10">{com.bname}</td>
//         </tr>
//       </tbody>
//     </table>
//   )
// }

// const UpperLimitAmountTable = (props) => {
//   const classes = useStyles();
//   const {billingDt, user} = props;

//   const upperLimit1 = String(billingDt?.upperlimit ?? "");
//   const upperLimit1Nodes = makeAnyNumberOfElements({string: upperLimit1, elementsLength: 6, key: "upperLimit"})

//   const upperLimit2 = String(user?.etc?.dokujiJougen ?? "");
//   const upperLimit2Nodes = makeAnyNumberOfElements({string: upperLimit2, elementsLength: 6, key: "kobeUpperLimit"});

//   const upperLimit3 = String("");
//   const upperLimit3Nodes = makeAnyNumberOfElements({string: upperLimit3, elementsLength: 6, key: "upperLimit"});

//   return(
//     <table style={{marginBottom: 32}}>
//       <tbody>
//         <tr>
//           <th>利⽤者負担上限⽉額（国）①</th>
//           {upperLimit1Nodes}
//           <th>利⽤者負担上限⽉額（市）②</th>
//           {upperLimit2Nodes}
//         </tr>
//         <tr>
//           <th colSpan={8}>地域⽣活⽀援事業の利⽤者負担上限⽉額③</th>
//           {upperLimit3Nodes}
//         </tr>
//       </tbody>
//     </table>
//   )
// }

// const KanriKekkaTable = (props) => {
//   const classes = useStyles();
//   const {billingDt, style={}} = props;

//   const tableStyles = {
//     border: 'none', width: '100%', marginBottom: 32,
//   }
//   const discriptionStyles = {
//     textAlign: 'start', width: 616, margin: '0 auto'
//   }
//   const numStyles = {marginRight: 8}
//   return(
//     <table className='noneBorder' style={{...tableStyles, ...style}}>
//       <tbody>
//         <tr>
//           <th className='boldBorderTop boldBorderLeft'>利用者負担上限額管理結果</th>
//           <td className='boldBorderTop boldBorderRight' style={{width: 32}}>{billingDt?.kanriKekka ?? ""}</td>
//           <td className='noneBorder' style={{width: '65%'}}></td>
//         </tr>
//         <tr>
//           <td colSpan='3'
//             className='discription boldBorderTop boldBorderRight boldBorderLeft noneBorderBottom'
//             style={{paddingTop: 24}}
//           >
//             <div style={discriptionStyles}>
//               <span style={numStyles}>1</span>管理事業所で利用者負担額を充当したため、他事業所の利用者負担は発生しない。
//             </div>
//           </td>
//         </tr>
//         <tr>
//           <td colSpan='3'
//             className='discription boldBorderRight boldBorderLeft noneBorderTop noneBorderBottom'
//           >
//             <div style={discriptionStyles}>
//               <span style={numStyles}>2</span>利用者負担額の合算額が、負担上限月額以下のため、調整事務は行わない。
//             </div>
//           </td>
//         </tr>
//         <tr>
//           <td colSpan='3'
//             className='discription boldBorderBottom boldBorderRight boldBorderLeft noneBorderTop'
//             style={{paddingBottom: 24}}
//           >
//             <div style={discriptionStyles}>
//               <span style={numStyles}>3</span>利用者負担額の合算額が、負担上限月額を超過するため、下記のとおり調整した。
//             </div>
//           </td>
//         </tr>
//       </tbody>
//     </table>
//   )
// }

// const AmountPerJigyosyoTable = (props) => {
//   const classes = useStyles();
//   const {billingDt, convJido, com, maxPageIndex, pageIndex} = props;
//   const nodes = Array(6).fill(null).map((_, i) => {
//     const result = {};
//     const bDt = billingDt["協力事業所"][i+(NOMAL_COLS*(pageIndex-1))] ?? {};
//     //事業所番号
//     let jigyosyoNum = bDt?.no ?? "";
//     if(jigyosyoNum === "0") jigyosyoNum = com?.jino ?? "";
//     result.jigyosyoNum = (<td key={`jigyosyoNum${i+1}`} colSpan="6" className='boldBorderRight'>{String(jigyosyoNum)}</td>);
//     //事業所名
//     let jigyosyoName = bDt?.lname ?bDt.lname :bDt?.name ?? "";
//     if(jigyosyoName === "thisOffice") jigyosyoName = com?.bname ?? "";
//     result.jigyosyoName = (<td key={`jigyosyoName${i+1}`} colSpan="6" className='boldBorderRight' style={{whiteSpace: 'pre-wrap'}}>{String(jigyosyoName)}</td>);
//     //総費用額
//     const amount = !isNaN(parseInt(bDt?.amount)) ?parseInt(bDt?.amount) : "";
//     result.amount = makeAnyNumberOfElements({string: String(amount), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//     //利用者負担額
//     let riyousyahutan = bDt.tyouseiGaku ?? Math.min(bDt.ichiwari, parseInt(billingDt?.priceLimit ?? bDt.ichiwari), parseInt(billingDt?.dokujiJougen ?? bDt.ichiwari));
//     riyousyahutan = !isNaN(riyousyahutan)
//       ?Math.min(parseInt(riyousyahutan), parseInt(billingDt?.dokujiJougen ?? bDt.ichiwari))
//       :"";
//     result.riyousyahutan = makeAnyNumberOfElements({string: String(riyousyahutan), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//     //（管理結果）利用者負担額
//     const kanriRiyosyahutan = !isNaN(parseInt(bDt?.kettei)) ?parseInt(bDt?.kettei) : "";;
//     result.kanriRiyosyahutan = makeAnyNumberOfElements({string: String(kanriRiyosyahutan), elementsLength: 6, className: "boldBorderTop", lastChildClassName: "boldBorderRight"});

//     return result;
//   });

//   return(
//     <table className={classes.amountPerJigyosyoTable} style={{marginBottom: 32}}>
//       <tbody>
//         <tr>
//           <th rowSpan="6" className='boldBorder' style={{writingMode: 'tb'}}>利用者負担額集計・調整欄</th>
//           <th className='boldBorder index'>項番</th>
//           <td colSpan="6" className='boldBorder'>1</td>
//           <td colSpan="6" className='boldBorder'>2</td>
//           <td colSpan="6" className='boldBorder'>3</td>
//           <td colSpan="6" className='boldBorder'>4</td>
//           <td colSpan="6" className='boldBorder'>5</td>
//           <td colSpan="6" className='boldBorder'>6</td>
//         </tr>
//         <tr>
//           <th className='boldBorderRight jino'>事業所番号</th>
//           {nodes.map(node => node.jigyosyoNum)}
//         </tr>
//         <tr>
//           <th className='lines3 boldBorderRight jName'>事業所名称</th>
//           {nodes.map(node => node.jigyosyoName)}
//         </tr>
//         <tr>
//           <th className='boldBorderRight sumAmount'>総費用額</th>
//           {nodes.map(node => node.amount)}
//         </tr>
//         <tr>
//           <th className='boldBorderRight userAmount'>利用者負担額</th>
//           {nodes.map(node => node.riyousyahutan)}
//         </tr>
//         <tr>
//           <th className='boldBorderTop boldBorderRight hutangaku'>管理結果後利用者負担額</th>
//           {nodes.map(node => node.kanriRiyosyahutan)}
//         </tr>
//       </tbody>
//     </table>
//   )
// }

// const AmountPerJigyosyoTable2 = (props) => {
//   const classes = useStyles();
//   const {billingDt, convJido, com, maxPageIndex, pageIndex} = props;
//   const nodes = Array(5).fill(null).map((_, j) => {
//     const result = {};
//     const i = j + 6;
//     const bDt = billingDt["協力事業所"][i+(NOMAL_COLS*(pageIndex-1))] ?? {};
//     //事業所番号
//     let jigyosyoNum = bDt?.no ?? "";
//     if(jigyosyoNum === "0") jigyosyoNum = com?.jino ?? "";
//     result.jigyosyoNum = (<td key={`jigyosyoNum${i+1}`} colSpan="6" className='boldBorderRight'>{String(jigyosyoNum)}</td>);
//     //事業所名
//     let jigyosyoName = bDt?.lname ?bDt.lname :bDt?.name ?? "";
//     if(jigyosyoName === "thisOffice") jigyosyoName = com?.bname ?? "";
//     result.jigyosyoName = (<td key={`jigyosyoName${i+1}`} colSpan="6" className='boldBorderRight' style={{whiteSpace: 'pre-wrap'}}>{String(jigyosyoName)}</td>);
//     //総費用額
//     const amount = !isNaN(parseInt(bDt?.amount)) ?parseInt(bDt?.amount) : "";
//     result.amount = makeAnyNumberOfElements({string: String(amount), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//     //利用者負担額
//     let riyousyahutan = bDt.tyouseiGaku ?? Math.min(bDt.ichiwari, parseInt(billingDt?.priceLimit ?? bDt.ichiwari), parseInt(billingDt?.dokujiJougen ?? bDt.ichiwari));
//     riyousyahutan = !isNaN(riyousyahutan)
//       ?Math.min(parseInt(riyousyahutan), parseInt(billingDt?.dokujiJougen ?? bDt.ichiwari))
//       :"";
//     result.riyousyahutan = makeAnyNumberOfElements({string: String(riyousyahutan), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//     //（管理結果）利用者負担額
//     const kanriRiyosyahutan = !isNaN(parseInt(bDt?.kettei)) ?parseInt(bDt?.kettei) : "";;
//     result.kanriRiyosyahutan = makeAnyNumberOfElements({string: String(kanriRiyosyahutan), elementsLength: 6, className: "boldBorderTop", lastChildClassName: "boldBorderRight"});

//     return result;
//   });
//   const totalNode = billingDt["協力事業所"].reduce((result, bDt, index) => {
//     if(pageIndex !== maxPageIndex) return result;
//     //総費用額
//     const amount = !isNaN(parseInt(bDt?.amount)) ?parseInt(bDt?.amount) : "";
//     if(amount || amount===0) result.amount = result.amount ?result.amount + amount :amount;
//     //利用者負担額
//     let riyousyahutan = bDt.tyouseiGaku ?? Math.min(bDt.ichiwari, parseInt(billingDt?.priceLimit ?? bDt.ichiwari), parseInt(billingDt?.dokujiJougen ?? bDt.ichiwari));
//     riyousyahutan = !isNaN(riyousyahutan) ?Math.min(parseInt(riyousyahutan), parseInt(billingDt?.dokujiJougen ?? bDt.ichiwari)) :"";
//     if(riyousyahutan || riyousyahutan===0) result.riyousyahutan = result.riyousyahutan ?result.riyousyahutan + riyousyahutan :riyousyahutan;
//     //（管理結果）利用者負担額
//     const kanriRiyosyahutan = !isNaN(parseInt(bDt?.kettei)) ?parseInt(bDt?.kettei) : "";;
//     if(kanriRiyosyahutan || kanriRiyosyahutan===0) result.kanriRiyosyahutan = result.kanriRiyosyahutan ?result.kanriRiyosyahutan + kanriRiyosyahutan :kanriRiyosyahutan;

//     if(billingDt["協力事業所"].length === 10 || billingDt["協力事業所"].length === index+1){
//       result.amount = makeAnyNumberOfElements({string: String(result.amount), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//       result.riyousyahutan = makeAnyNumberOfElements({string: String(result.riyousyahutan), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//       result.kanriRiyosyahutan = makeAnyNumberOfElements({string: String(result.kanriRiyosyahutan), elementsLength: 6, className: "boldBorderTop", lastChildClassName: "boldBorderRight"});
//     }
    
//     return result;
//   }, {amount: "", riyousyahutan: "", kyuhuhi: "", kanriRiyosyahutan: "", kanriKyuhu: ""});
//   if(!billingDt["協力事業所"].length || pageIndex!==maxPageIndex){
//     totalNode.amount = makeAnyNumberOfElements({string: String(totalNode.amount), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//     totalNode.riyousyahutan = makeAnyNumberOfElements({string: String(totalNode.riyousyahutan), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//     totalNode.kanriRiyosyahutan = makeAnyNumberOfElements({string: String(totalNode.kanriRiyosyahutan), elementsLength: 6, className: "boldBorderTop", lastChildClassName: "boldBorderRight"});
//   }

//   return(
//     <table className={classes.amountPerJigyosyoTable} style={{marginBottom: 32}}>
//       <tbody>
//         <tr>
//           <th rowSpan="6" className='boldBorder' style={{writingMode: 'tb'}}>利用者負担額集計・調整欄</th>
//           <th className='boldBorder index'>項番</th>
//           <td colSpan="6" className='boldBorder'>7</td>
//           <td colSpan="6" className='boldBorder'>8</td>
//           <td colSpan="6" className='boldBorder'>9</td>
//           <td colSpan="6" className='boldBorder'>10</td>
//           <td colSpan="6" className='boldBorder'>11</td>
//           <td colSpan="6" rowSpan="3" className='boldBorder'>合計</td>
//         </tr>
//         <tr>
//           <th className='boldBorderRight jino'>事業所番号</th>
//           {nodes.map(node => node.jigyosyoNum)}
//         </tr>
//         <tr>
//           <th className='lines3 boldBorderRight jName'>事業所名称</th>
//           {nodes.map(node => node.jigyosyoName)}
//         </tr>
//         <tr>
//           <th className='boldBorderRight sumAmount'>総費用額</th>
//           {nodes.map(node => node.amount)}
//           {totalNode.amount}
//         </tr>
//         <tr>
//           <th className='boldBorderRight userAmount'>利用者負担額</th>
//           {nodes.map(node => node.riyousyahutan)}
//           {totalNode.riyousyahutan}
//         </tr>
//         <tr>
//           <th className='boldBorderTop boldBorderRight hutangaku'>管理結果後利用者負担額</th>
//           {nodes.map(node => node.kanriRiyosyahutan)}
//           {totalNode.kanriRiyosyahutan}
//         </tr>
//       </tbody>
//     </table>
//   )
// }

// const AmountPerJigyosyoTable3 = (props) => {
//   const classes = useStyles();
//   const {billingDt, convJido, com, maxPageIndex, pageIndex} = props;
//   const nodes = Array(5).fill(null).map((_, j) => {
//     const result = {};
//     const i = j + 11;
//     const bDt = billingDt["協力事業所"][i+(NOMAL_COLS*(pageIndex-1))] ?? {};
//     //事業所番号
//     let jigyosyoNum = bDt?.no ?? "";
//     if(jigyosyoNum === "0") jigyosyoNum = com?.jino ?? "";
//     result.jigyosyoNum = (<td key={`jigyosyoNum${i+1}`} colSpan="6" className='boldBorderRight'>{String(jigyosyoNum)}</td>);
//     //事業所名
//     let jigyosyoName = bDt?.lname ?bDt.lname :bDt?.name ?? "";
//     if(jigyosyoName === "thisOffice") jigyosyoName = com?.bname ?? "";
//     result.jigyosyoName = (<td key={`jigyosyoName${i+1}`} colSpan="6" className='boldBorderRight' style={{whiteSpace: 'pre-wrap'}}>{String(jigyosyoName)}</td>);
//     //総費用額
//     const amount = !isNaN(parseInt(bDt?.amount)) ?parseInt(bDt?.amount) : "";
//     result.amount = makeAnyNumberOfElements({string: String(amount), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//     //利用者負担額
//     let riyousyahutan = bDt.tyouseiGaku ?? Math.min(bDt.ichiwari, parseInt(billingDt?.priceLimit ?? bDt.ichiwari), parseInt(billingDt?.dokujiJougen ?? bDt.ichiwari));
//     riyousyahutan = !isNaN(riyousyahutan) ?Math.min(parseInt(riyousyahutan), parseInt(billingDt?.dokujiJougen ?? bDt.ichiwari)) :"";
//     result.riyousyahutan = makeAnyNumberOfElements({string: String(riyousyahutan), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//     //（管理結果）利用者負担額
//     const kanriRiyosyahutan = !isNaN(parseInt(bDt?.kettei)) ?parseInt(bDt?.kettei) : "";;
//     result.kanriRiyosyahutan = makeAnyNumberOfElements({string: String(kanriRiyosyahutan), elementsLength: 6, className: "boldBorderTop", lastChildClassName: "boldBorderRight"});

//     return result;
//   });
//   const totalNode = billingDt["協力事業所"].reduce((result, bDt, index) => {
//     if(index < 11) return result;
//     if(pageIndex !== maxPageIndex) return result;
//     //総費用額
//     const amount = !isNaN(parseInt(bDt?.amount)) ?parseInt(bDt?.amount) : "";
//     if(amount || amount===0) result.amount = result.amount ?result.amount + amount :amount;
//     //利用者負担額
//     let riyousyahutan = bDt.tyouseiGaku !== undefined
//     ? bDt.tyouseiGaku: Math.min(bDt.ichiwari, parseInt(bDt.priceLimit));
//     riyousyahutan = isNaN(riyousyahutan)? '': riyousyahutan;
//     if(riyousyahutan || riyousyahutan===0) result.riyousyahutan = result.riyousyahutan ?result.riyousyahutan + riyousyahutan :riyousyahutan;
//     //（管理結果）利用者負担額
//     const kanriRiyosyahutan = !isNaN(parseInt(bDt?.kettei)) ?parseInt(bDt?.kettei) : "";;
//     if(kanriRiyosyahutan || kanriRiyosyahutan===0) result.kanriRiyosyahutan = result.kanriRiyosyahutan ?result.kanriRiyosyahutan + kanriRiyosyahutan :kanriRiyosyahutan;

//     if(billingDt["協力事業所"].length === index+1){
//       result.amount = makeAnyNumberOfElements({string: String(result.amount), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//       result.riyousyahutan = makeAnyNumberOfElements({string: String(result.riyousyahutan), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//       result.kanriRiyosyahutan = makeAnyNumberOfElements({string: String(result.kanriRiyosyahutan), elementsLength: 6, className: "boldBorderTop", lastChildClassName: "boldBorderRight"});
//     }
    
//     return result;
//   }, {amount: "", riyousyahutan: "", kyuhuhi: "", kanriRiyosyahutan: "", kanriKyuhu: ""});
//   if(!billingDt["協力事業所"].length || billingDt["協力事業所"].length < 11 || pageIndex!==maxPageIndex){
//     totalNode.amount = makeAnyNumberOfElements({string: String(totalNode.amount), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//     totalNode.riyousyahutan = makeAnyNumberOfElements({string: String(totalNode.riyousyahutan), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//     totalNode.kanriRiyosyahutan = makeAnyNumberOfElements({string: String(totalNode.kanriRiyosyahutan), elementsLength: 6, className: "boldBorderTop", lastChildClassName: "boldBorderRight"});
//   }

//   return(
//     <table className={classes.amountPerJigyosyoTable} style={{marginBottom: 32}}>
//       <tbody>
//         <tr>
//           <th rowSpan="6" className='boldBorder tcol' style={{writingMode: 'tb'}}>利用者負担額集計・調整欄</th>
//           <th className='boldBorder index'>項番</th>
//           <td colSpan="6" className='boldBorder'>12</td>
//           <td colSpan="6" className='boldBorder'>13</td>
//           <td colSpan="6" className='boldBorder'>14</td>
//           <td colSpan="6" className='boldBorder'>15</td>
//           <td colSpan="6" className='boldBorder'>16</td>
//           <td colSpan="6" rowSpan="3" className='boldBorder'>合計</td>
//         </tr>
//         <tr>
//           <th className='boldBorderRight jino'>事業所番号</th>
//           {nodes.map(node => node.jigyosyoNum)}
//         </tr>
//         <tr>
//           <th className='lines3 boldBorderRight jName'>事業所名称</th>
//           {nodes.map(node => node.jigyosyoName)}
//         </tr>
//         <tr>
//           <th className='boldBorderRight sumAmount'>総費用額</th>
//           {nodes.map(node => node.amount)}
//           {totalNode.amount}
//         </tr>
//         <tr>
//           <th className='boldBorderRight userAmount'>利用者負担額</th>
//           {nodes.map(node => node.riyousyahutan)}
//           {totalNode.riyousyahutan}
//         </tr>
//         <tr>
//           <th className='boldBorderTop boldBorderRight hutangaku'>管理結果後利用者負担額</th>
//           {nodes.map(node => node.kanriRiyosyahutan)}
//           {totalNode.kanriRiyosyahutan}
//         </tr>
//       </tbody>
//     </table>
//   )
// }

// const SiblingAmountPerJigyosyoTable1 = (props) => {
//   const classes = useStyles();
//   const {billingDts, siblingUsers, com, pageIndex} = props;
//   const allKyoryokuJigyosyo = billingDts.flatMap((billingDt, i) => {
//     const kjlist = JSON.parse(JSON.stringify(billingDt?.["協力事業所"] ?? []));
//     const user = siblingUsers[i];
//     kjlist.forEach(bDt => {
//       let jigyosyoName = bDt?.lname ?bDt.lname :bDt?.name ?? "";
//       if(jigyosyoName === "thisOffice") jigyosyoName = com?.bname ?? "";
//       jigyosyoName += `\n（${user.name}）`
//       bDt.lname = jigyosyoName;
//       bDt.priceLimit = billingDt.priceLimit;
//       bDt.dokujiJougen = billingDt.dokujiJougen;
//     })
//     return kjlist;
//   });
//   const myJigyosyo = allKyoryokuJigyosyo.filter(x => x.no === "0");
//   const etcJigyosyo = allKyoryokuJigyosyo.filter(x => x.no !== "0");
//   const kyoryokuJigyosyo = [...myJigyosyo, ...etcJigyosyo];
//   const nodes = Array(6).fill(null).map((_, i) => {
//     const result = {};
//     const bDt = kyoryokuJigyosyo[i+(NOMAL_COLS*(pageIndex-1))] ?? {};
//     //事業所番号
//     let jigyosyoNum = bDt?.no ?? "";
//     if(jigyosyoNum === "0") jigyosyoNum = com?.jino ?? "";
//     result.jigyosyoNum = (<td key={`jigyosyoNum${i+1}`} colSpan="6" className='boldBorderRight'>{String(jigyosyoNum)}</td>);
//     //事業所名
//     let jigyosyoName = bDt?.lname ?bDt.lname :bDt?.name ?? "";
//     if(jigyosyoName === "thisOffice") jigyosyoName = com?.bname ?? "";
//     result.jigyosyoName = (<td key={`jigyosyoName${i+1}`} colSpan="6" className='boldBorderRight' style={{whiteSpace: 'pre-wrap'}}>{String(jigyosyoName)}</td>);
//     //総費用額
//     const amount = !isNaN(parseInt(bDt?.amount)) ?parseInt(bDt?.amount) : "";
//     result.amount = makeAnyNumberOfElements({string: String(amount), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//     //利用者負担額
//     let riyousyahutan = bDt.tyouseiGaku ?? Math.min(bDt.ichiwari, parseInt(bDt?.priceLimit ?? bDt.ichiwari), parseInt(bDt?.dokujiJougen ?? bDt.ichiwari));
//     riyousyahutan = !isNaN(riyousyahutan)
//       ?Math.min(parseInt(riyousyahutan), parseInt(bDt?.dokujiJougen ?? bDt.ichiwari))
//       :"";
//     result.riyousyahutan = makeAnyNumberOfElements({string: String(riyousyahutan), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//     //（管理結果）利用者負担額
//     const kanriRiyosyahutan = !isNaN(parseInt(bDt?.kettei)) ?parseInt(bDt?.kettei) : "";;
//     result.kanriRiyosyahutan = makeAnyNumberOfElements({string: String(kanriRiyosyahutan), elementsLength: 6, className: "boldBorderTop", lastChildClassName: "boldBorderRight"});

//     return result;
//   });

//   return(
//     <table className={classes.amountPerJigyosyoTable} style={{marginBottom: 32}}>
//       <tbody>
//         <tr>
//           <th rowSpan="6" className='boldBorder' style={{writingMode: 'tb'}}>利用者負担額集計・調整欄</th>
//           <th className='boldBorder index'>項番</th>
//           <td colSpan="6" className='boldBorder'>1</td>
//           <td colSpan="6" className='boldBorder'>2</td>
//           <td colSpan="6" className='boldBorder'>3</td>
//           <td colSpan="6" className='boldBorder'>4</td>
//           <td colSpan="6" className='boldBorder'>5</td>
//           <td colSpan="6" className='boldBorder'>6</td>
//         </tr>
//         <tr>
//           <th className='boldBorderRight jino'>事業所番号</th>
//           {nodes.map(node => node.jigyosyoNum)}
//         </tr>
//         <tr>
//           <th className='lines3 boldBorderRight jName'>事業所名称</th>
//           {nodes.map(node => node.jigyosyoName)}
//         </tr>
//         <tr>
//           <th className='boldBorderRight sumAmount'>総費用額</th>
//           {nodes.map(node => node.amount)}
//         </tr>
//         <tr>
//           <th className='boldBorderRight userAmount'>利用者負担額</th>
//           {nodes.map(node => node.riyousyahutan)}
//         </tr>
//         <tr>
//           <th className='boldBorderTop boldBorderRight hutangaku'>管理結果後利用者負担額</th>
//           {nodes.map(node => node.kanriRiyosyahutan)}
//         </tr>
//       </tbody>
//     </table>
//   )
// }

// const SiblingAmountPerJigyosyoTable2 = (props) => {
//   const classes = useStyles();
//   const {billingDts, siblingUsers, com, pageIndex, maxPageIndex} = props;
//   const allKyoryokuJigyosyo = billingDts.flatMap((billingDt, i) => {
//     const kjlist = JSON.parse(JSON.stringify(billingDt?.["協力事業所"] ?? []));
//     const user = siblingUsers[i];
//     kjlist.forEach(bDt => {
//       let jigyosyoName = bDt?.lname ?bDt.lname :bDt?.name ?? "";
//       if(jigyosyoName === "thisOffice") jigyosyoName = com?.bname ?? "";
//       jigyosyoName += `\n（${user.name}）`
//       bDt.lname = jigyosyoName;
//       bDt.priceLimit = billingDt.priceLimit;
//       bDt.dokujiJougen = billingDt.dokujiJougen;
//     })
//     return kjlist;
//   });
//   const myJigyosyo = allKyoryokuJigyosyo.filter(x => x.no === "0");
//   const etcJigyosyo = allKyoryokuJigyosyo.filter(x => x.no !== "0");
//   const kyoryokuJigyosyo = [...myJigyosyo, ...etcJigyosyo];

//   const nodes = Array(5).fill(null).map((_, j) => {
//     const result = {};
//     const i = j + 6;
//     const bDt = kyoryokuJigyosyo[i+(NOMAL_COLS*(pageIndex-1))] ?? {};
//     //事業所番号
//     let jigyosyoNum = bDt?.no ?? "";
//     if(jigyosyoNum === "0") jigyosyoNum = com?.jino ?? "";
//     result.jigyosyoNum = (<td key={`jigyosyoNum${i+1}`} colSpan="6" className='boldBorderRight'>{String(jigyosyoNum)}</td>);
//     //事業所名
//     let jigyosyoName = bDt?.lname ?bDt.lname :bDt?.name ?? "";
//     if(jigyosyoName === "thisOffice") jigyosyoName = com?.bname ?? "";
//     result.jigyosyoName = (<td key={`jigyosyoName${i+1}`} colSpan="6" className='boldBorderRight' style={{whiteSpace: 'pre-wrap'}}>{String(jigyosyoName)}</td>);
//     //総費用額
//     const amount = !isNaN(parseInt(bDt?.amount)) ?parseInt(bDt?.amount) : "";
//     result.amount = makeAnyNumberOfElements({string: String(amount), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//     //利用者負担額
//     let riyousyahutan = bDt.tyouseiGaku ?? Math.min(bDt.ichiwari, parseInt(bDt?.priceLimit ?? bDt.ichiwari), parseInt(bDt?.dokujiJougen ?? bDt.ichiwari));
//     riyousyahutan = !isNaN(riyousyahutan) ?Math.min(parseInt(riyousyahutan), parseInt(bDt?.dokujiJougen ?? bDt.ichiwari)) :"";
//     result.riyousyahutan = makeAnyNumberOfElements({string: String(riyousyahutan), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//     //（管理結果）利用者負担額
//     const kanriRiyosyahutan = !isNaN(parseInt(bDt?.kettei)) ?parseInt(bDt?.kettei) : "";
//     result.kanriRiyosyahutan = makeAnyNumberOfElements({string: String(kanriRiyosyahutan), elementsLength: 6, className: "boldBorderTop", lastChildClassName: "boldBorderRight"});

//     return result;
//   });
//   const totalNode = kyoryokuJigyosyo.reduce((result, bDt, index) => {
//     if(index >= 11) return result;
//     if(pageIndex !== maxPageIndex) return result;
//     //総費用額
//     const amount = !isNaN(parseInt(bDt?.amount)) ?parseInt(bDt?.amount) : "";
//     if(amount || amount===0) result.amount = result.amount ?result.amount + amount :amount;
//     //利用者負担額
//     let riyousyahutan = bDt.tyouseiGaku ?? Math.min(bDt.ichiwari, parseInt(bDt?.priceLimit ?? bDt.ichiwari), parseInt(bDt?.dokujiJougen ?? bDt.ichiwari));
//     riyousyahutan = !isNaN(riyousyahutan) ?Math.min(parseInt(riyousyahutan), parseInt(bDt?.dokujiJougen ?? bDt.ichiwari)) :"";
//     if(riyousyahutan || riyousyahutan===0) result.riyousyahutan = result.riyousyahutan ?result.riyousyahutan + riyousyahutan :riyousyahutan;
//     //（管理結果）利用者負担額
//     const kanriRiyosyahutan = !isNaN(parseInt(bDt?.kettei)) ?parseInt(bDt?.kettei) : "";;
//     if(kanriRiyosyahutan || kanriRiyosyahutan===0) result.kanriRiyosyahutan = result.kanriRiyosyahutan ?result.kanriRiyosyahutan + kanriRiyosyahutan :kanriRiyosyahutan;

//     if(index === 10 || kyoryokuJigyosyo.length === index+1){
//       result.amount = makeAnyNumberOfElements({string: String(result.amount), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//       result.riyousyahutan = makeAnyNumberOfElements({string: String(result.riyousyahutan), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//       result.kanriRiyosyahutan = makeAnyNumberOfElements({string: String(result.kanriRiyosyahutan), elementsLength: 6, className: "boldBorderTop", lastChildClassName: "boldBorderRight"});
//     }
    
//     return result;
//   }, {amount: "", riyousyahutan: "", kyuhuhi: "", kanriRiyosyahutan: "", kanriKyuhu: ""});
//   if(!kyoryokuJigyosyo.length || pageIndex!==maxPageIndex){
//     totalNode.amount = makeAnyNumberOfElements({string: String(totalNode.amount), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//     totalNode.riyousyahutan = makeAnyNumberOfElements({string: String(totalNode.riyousyahutan), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//     totalNode.kanriRiyosyahutan = makeAnyNumberOfElements({string: String(totalNode.kanriRiyosyahutan), elementsLength: 6, className: "boldBorderTop", lastChildClassName: "boldBorderRight"});
//   }

//   return(
//     <table className={classes.amountPerJigyosyoTable} style={{marginBottom: 32}}>
//       <tbody>
//         <tr>
//           <th rowSpan="6" className='boldBorder tcol' style={{writingMode: 'tb'}}>利用者負担額集計・調整欄</th>
//           <th className='boldBorder index'>項番</th>
//           <td colSpan="6" className='boldBorder'>7</td>
//           <td colSpan="6" className='boldBorder'>8</td>
//           <td colSpan="6" className='boldBorder'>9</td>
//           <td colSpan="6" className='boldBorder'>10</td>
//           <td colSpan="6" className='boldBorder'>11</td>
//           <td colSpan="6" rowSpan="3" className='boldBorder'>合計</td>
//         </tr>
//         <tr>
//           <th className='boldBorderRight jino'>事業所番号</th>
//           {nodes.map(node => node.jigyosyoNum)}
//         </tr>
//         <tr>
//           <th className='lines3 boldBorderRight jName'>事業所名称</th>
//           {nodes.map(node => node.jigyosyoName)}
//         </tr>
//         <tr>
//           <th className='boldBorderRight sumAmount'>総費用額</th>
//           {nodes.map(node => node.amount)}
//           {totalNode.amount}
//         </tr>
//         <tr>
//           <th className='boldBorderRight userAmount'>利用者負担額</th>
//           {nodes.map(node => node.riyousyahutan)}
//           {totalNode.riyousyahutan}
//         </tr>
//         <tr>
//           <th className='boldBorderTop boldBorderRight hutangaku'>管理結果後利用者負担額</th>
//           {nodes.map(node => node.kanriRiyosyahutan)}
//           {totalNode.kanriRiyosyahutan}
//         </tr>
//       </tbody>
//     </table>
//   )
// }

// const SiblingAmountPerJigyosyoTable3 = (props) => {
//   const classes = useStyles();
//   const {billingDts, siblingUsers, com, pageIndex, maxPageIndex} = props;
//   const allKyoryokuJigyosyo = billingDts.flatMap((billingDt, i) => {
//     const kjlist = JSON.parse(JSON.stringify(billingDt?.["協力事業所"] ?? []));
//     const user = siblingUsers[i];
//     kjlist.forEach(bDt => {
//       let jigyosyoName = bDt?.lname ?bDt.lname :bDt?.name ?? "";
//       if(jigyosyoName === "thisOffice") jigyosyoName = com?.bname ?? "";
//       jigyosyoName += `\n（${user.name}）`
//       bDt.lname = jigyosyoName;
//       bDt.priceLimit = billingDt.priceLimit;
//       bDt.dokujiJougen = billingDt.dokujiJougen;
//     })
//     return kjlist;
//   });
//   const myJigyosyo = allKyoryokuJigyosyo.filter(x => x.no === "0");
//   const etcJigyosyo = allKyoryokuJigyosyo.filter(x => x.no !== "0");
//   const kyoryokuJigyosyo = [...myJigyosyo, ...etcJigyosyo];
//   const nodes = Array(5).fill(null).map((_, j) => {
//     const result = {};
//     const i = j + 11;
//     const bDt = kyoryokuJigyosyo[i+(NOMAL_COLS*(pageIndex-1))] ?? {};
//     //事業所番号
//     let jigyosyoNum = bDt?.no ?? "";
//     if(jigyosyoNum === "0") jigyosyoNum = com?.jino ?? "";
//     result.jigyosyoNum = (<td key={`jigyosyoNum${i+1}`} colSpan="6" className='boldBorderRight'>{String(jigyosyoNum)}</td>);
//     //事業所名
//     let jigyosyoName = bDt?.lname ?bDt.lname :bDt?.name ?? "";
//     if(jigyosyoName === "thisOffice") jigyosyoName = com?.bname ?? "";
//     result.jigyosyoName = (<td key={`jigyosyoName${i+1}`} colSpan="6" className='boldBorderRight' style={{whiteSpace: 'pre-wrap'}}>{String(jigyosyoName)}</td>);
//     //総費用額
//     const amount = !isNaN(parseInt(bDt?.amount)) ?parseInt(bDt?.amount) : "";
//     result.amount = makeAnyNumberOfElements({string: String(amount), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//     //利用者負担額
//     let riyousyahutan = bDt.tyouseiGaku ?? Math.min(bDt.ichiwari, parseInt(bDt?.priceLimit ?? bDt.ichiwari), parseInt(bDt?.dokujiJougen ?? bDt.ichiwari));
//     riyousyahutan = !isNaN(riyousyahutan) ?Math.min(parseInt(riyousyahutan), parseInt(bDt?.dokujiJougen ?? bDt.ichiwari)) :"";
//     result.riyousyahutan = makeAnyNumberOfElements({string: String(riyousyahutan), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//     // 管理結果後利用者負担額
//     const kanriRiyosyahutan = !isNaN(parseInt(bDt?.kettei)) ?parseInt(bDt?.kettei) : "";
//     result.kanriRiyosyahutan = makeAnyNumberOfElements({string: String(kanriRiyosyahutan), elementsLength: 6, className: "boldBorderTop", lastChildClassName: "boldBorderRight"});

//     return result;
//   });
//   const totalNode = kyoryokuJigyosyo.reduce((result, bDt, index) => {
//     if(pageIndex !== maxPageIndex) return result;
//     if(index < 11) return result;
//     //総費用額
//     const amount = !isNaN(parseInt(bDt?.amount)) ?parseInt(bDt?.amount) : "";
//     if(amount || amount===0) result.amount = result.amount ?result.amount + amount :amount;
//     //利用者負担額
//     let riyousyahutan = bDt.tyouseiGaku ?? Math.min(bDt.ichiwari, parseInt(bDt?.priceLimit ?? bDt.ichiwari), parseInt(bDt?.dokujiJougen ?? bDt.ichiwari));
//     riyousyahutan = !isNaN(riyousyahutan) ?Math.min(parseInt(riyousyahutan), parseInt(bDt?.dokujiJougen ?? bDt.ichiwari)) :"";
//     if(riyousyahutan || riyousyahutan===0) result.riyousyahutan = result.riyousyahutan ?result.riyousyahutan + riyousyahutan :riyousyahutan;
//     //（管理結果）利用者負担額
//     const kanriRiyosyahutan = !isNaN(parseInt(bDt?.kettei)) ?parseInt(bDt?.kettei) : "";;
//     if(kanriRiyosyahutan || kanriRiyosyahutan===0) result.kanriRiyosyahutan = result.kanriRiyosyahutan ?result.kanriRiyosyahutan + kanriRiyosyahutan :kanriRiyosyahutan;

//     if(kyoryokuJigyosyo.length === index+1){
//       result.amount = makeAnyNumberOfElements({string: String(result.amount), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//       result.riyousyahutan = makeAnyNumberOfElements({string: String(result.riyousyahutan), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//       result.kanriRiyosyahutan = makeAnyNumberOfElements({string: String(result.kanriRiyosyahutan), elementsLength: 6, className: "boldBorderTop", lastChildClassName: "boldBorderRight"});
//     }
    
//     return result;
//   }, {amount: "", riyousyahutan: "", kyuhuhi: "", kanriRiyosyahutan: "", kanriKyuhu: ""});
//   if(!kyoryokuJigyosyo.length || kyoryokuJigyosyo.length < 11 || pageIndex!==maxPageIndex){
//     totalNode.amount = makeAnyNumberOfElements({string: String(totalNode.amount), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//     totalNode.riyousyahutan = makeAnyNumberOfElements({string: String(totalNode.riyousyahutan), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//     totalNode.kanriRiyosyahutan = makeAnyNumberOfElements({string: String(totalNode.kanriRiyosyahutan), elementsLength: 6, className: "boldBorderTop", lastChildClassName: "boldBorderRight"});
//   }

//   return(
//     <table className={classes.amountPerJigyosyoTable} style={{marginBottom: 32}}>
//       <tbody>
//         <tr>
//           <th rowSpan="6" className='boldBorder tcol' style={{writingMode: 'tb'}}>利用者負担額集計・調整欄</th>
//           <th className='boldBorder index'>項番</th>
//           <td colSpan="6" className='boldBorder'>12</td>
//           <td colSpan="6" className='boldBorder'>13</td>
//           <td colSpan="6" className='boldBorder'>14</td>
//           <td colSpan="6" className='boldBorder'>15</td>
//           <td colSpan="6" className='boldBorder'>16</td>
//           <td colSpan="6" rowSpan="3" className='boldBorder'>合計</td>
//         </tr>
//         <tr>
//           <th className='boldBorderRight jino'>事業所番号</th>
//           {nodes.map(node => node.jigyosyoNum)}
//         </tr>
//         <tr>
//           <th className='lines3 boldBorderRight jName'>事業所名称</th>
//           {nodes.map(node => node.jigyosyoName)}
//         </tr>
//         <tr>
//           <th className='boldBorderRight sumAmount'>総費用額</th>
//           {nodes.map(node => node.amount)}
//           {totalNode.amount}
//         </tr>
//         <tr>
//           <th className='boldBorderRight userAmount'>利用者負担額</th>
//           {nodes.map(node => node.riyousyahutan)}
//           {totalNode.riyousyahutan}
//         </tr>
//         <tr>
//           <th className='boldBorderTop boldBorderRight hutangaku'>管理結果後利用者負担額</th>
//           {nodes.map(node => node.kanriRiyosyahutan)}
//           {totalNode.kanriRiyosyahutan}
//         </tr>
//       </tbody>
//     </table>
//   )
// }

// const AmountThatCanBeCollectedTable = () => {
//   const amount = "";
//   const manyAmount = makeAnyNumberOfElements({string: String(amount), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//   const fewAmount = makeAnyNumberOfElements({string: String(amount), elementsLength: 6, lastChildClassName: "boldBorderRight"});
//   return(
//     <table style={{marginBottom: 32}}>
//       <tbody>
//         <tr>
//           <th>地域⽣活⽀援事業徴収可能額 ：①もしくは②＞③の場合</th>
//           <th>（①もしくは②−④）</th>
//           {manyAmount}
//         </tr>
//         <tr>
//           <th>地域⽣活⽀援事業徴収可能額 ：①もしくは②≦③の場合</th>
//           <th>（③−④）</th>
//           {fewAmount}
//         </tr>
//       </tbody>
//     </table>
//   )
// }


// const ConfirmationForm = (props) => {
//   const {user, siblingUsers,  com, schedule, style={}} = props;
//   const classes = useStyles();

//   const displayName = com?.ext?.reportsSetting?.jogenKanri?.displayName ?? com?.etc?.configReports?.jogenKanri?.displayName ?? false;
//   const displayDate = com?.ext?.reportsSetting?.jogenKanri?.displayDate ?? com?.etc?.configReports?.jogenKanri?.displayDate ?? false;
//   const stateDate = (
//     schedule?.report?.thisUser?.service?.["上限管理結果票"] ?? formatDate(new Date(), 'YYYY-MM-DD')
//   );
//   const dateList = stateDate.split("-");
//   const exDate = getDateEx(dateList[0], dateList[1], dateList[2]);
//   const confWareki = exDate.wr.l;
//   let confYear = "", confMonth = "", confDate = "";
//   if(displayDate){
//     confYear = String(exDate.wr.y).padStart(2, '0');
//     confMonth = String(exDate.m).padStart(2, '0');
//     confDate = String(exDate.d).padStart(2, '0');
//   }

//   const pname = user ?user.pname
//     :siblingUsers.reduce((resutl, user) => {
//       if(!resutl) return user.pname;
//       return resutl === user.pname ?resutl :"問題発生";
//     }, null);

//   return(
//     <div className={classes.confirmationForm} style={{...style}}>
//       <div>上記内容について確認しました。</div>
//       <div style={{display: 'flex'}}>
//         <div>{confWareki}</div>
//         <div className='year'>{confYear}</div>
//         <div>年</div>
//         <div className='month'>{confMonth}</div>
//         <div>月</div>
//         <div className='date'>{confDate}</div>
//         <div>日</div>
//       </div>
//       <div>給付決定保護者等氏名<span className='pname'>{displayName ?pname :""}</span></div>
//     </div>
//   )
// }

// export const ReportPageIndex = ({pageIndex, maxPageIndex, addStyle={}}) => (
//   <div style={{textAlign: 'end', marginTop: 64, ...addStyle}}>
//     {pageIndex}<span style={{margin: '0 4px'}}>/</span>{maxPageIndex}
//   </div>
// )

// const JogenKanriOnePage = (props) => {
//   const classes = useStyles();
//   const {
//     user, com, stdDate, billingDt, schedule, hidePersonalInfo, maxPageIndex, pageIndex
//   } = props;
//   const convJido = com?.ext?.reportsSetting?.convJido ?? com?.etc?.configReports?.convJido ?? false;
//   const dateTableProps = {stdDate};
//   const userInfoTableProps = {user, hidePersonalInfo};
//   const officeInfoTableProps = {com};
//   const totalAmountTableProps = {billingDt, convJido, user, com, maxPageIndex, pageIndex}
//   const confirmationFormProps = {user, com, schedule}
//   return(
//     <div className={classes.entireTable}>
//       <div className='pageTitle'>
//         利用者負担上限額管理結果票（京都市様式）
//       </div>
//       <DateTable {...dateTableProps} />
//       <div className='infoTables'>
//         <UserInfoTable {...userInfoTableProps} />
//         <OfficeInfoTable {...officeInfoTableProps} />
//       </div>
//       <UpperLimitAmountTable {...totalAmountTableProps} />
//       <KanriKekkaTable {...totalAmountTableProps} />
//       <AmountPerJigyosyoTable {...totalAmountTableProps} />
//       <AmountPerJigyosyoTable2 {...totalAmountTableProps} />
//       <AmountThatCanBeCollectedTable />
//       <AmountPerJigyosyoTable3 {...totalAmountTableProps} />
//       <ConfirmationForm {...confirmationFormProps} />
//       <ReportPageIndex pageIndex={pageIndex} maxPageIndex={maxPageIndex}/>
//     </div>
//   )
// }

// const SiblingJogenKanriOnePage = (props) => {
//   const classes = useStyles();
//   const {
//     siblingUsers, com, stdDate, billingDts, schedule, hidePersonalInfo, maxPageIndex, pageIndex
//   } = props;
//   const userInfoTableProps = {user: siblingUsers[0], hidePersonalInfo};
//   const officeInfoTableProps = {com};
//   const convJido = com?.ext?.reportsSetting?.convJido ?? com?.etc?.configReports?.convJido ?? false;
//   const dateTableProps = {stdDate, style: {marginBottom: 16}};
//   const upperLimit = {billingDt: billingDts[0], convJido, user: siblingUsers[0], com, maxPageIndex, pageIndex};
//   const totalAmountTableProps = {billingDts, convJido, siblingUsers, com, maxPageIndex, pageIndex, style: {marginBottom: 24}}
//   const confirmationFormProps = {siblingUsers, com, schedule, style: {marginBottom: 0}}

//   return(
//     <div className={classes.entireTable}>
//       <div className='pageTitle'>
//         利用者負担上限額管理結果表（京都市様式）
//       </div>
//       <DateTable {...dateTableProps} />
//       <div className='infoTables'>
//         <UserInfoTable {...userInfoTableProps} />
//         <OfficeInfoTable {...officeInfoTableProps} />
//       </div>
//       <UpperLimitAmountTable {...upperLimit} />
//       <KanriKekkaTable {...totalAmountTableProps} />
//       <SiblingAmountPerJigyosyoTable1 {...totalAmountTableProps} />
//       <SiblingAmountPerJigyosyoTable2 {...totalAmountTableProps} />
//       <AmountThatCanBeCollectedTable />
//       <SiblingAmountPerJigyosyoTable3 {...totalAmountTableProps} />
//       <ConfirmationForm {...confirmationFormProps} />
//       <ReportPageIndex pageIndex={pageIndex} maxPageIndex={maxPageIndex} addStyle={{margin: 0}}/>
//     </div>
//   )
// }

// export const KyotoJogenKnari = (props) => {
//   const classes = useStyles();
//   const {userList, preview, hidePersonalInfo, selects, ...others} = props;
//   const allState = useSelector(state => state);
//   if (!(preview==='上限管理結果票' && selects[preview]==='京都市形式')) return null;
//   const loadingStatus = getLodingStatus(allState);
//   if(!loadingStatus.loaded) return (<LoadingSpinner/>);
//   const {com, users, schedule, stdDate, service, serviceItems} = allState;
//   const billingParams = { calledBy: "KobeJogenKanri", stdDate, schedule, users, com, service, serviceItems };
//   const { billingDt } = setBillInfoToSch(billingParams);
//   const targetUsers = users.filter(user => userList.some(u => u.checked && u.uid===user.uid));
//   const pageNodes = targetUsers.flatMap((user, index) => {
//     if(user.kanri_type !== "管理事業所") return null;
//     if(user.brosIndex > 1) return null;
//     const bDt = billingDt.find(dt => dt.UID === "UID"+user.uid);
//     if(!bDt["協力事業所"]) bDt["協力事業所"] = [];
//     const kyouryokuJigyosyo = bDt["協力事業所"];
//     if(!kyouryokuJigyosyo.length) return null;
//     const totalAmount = kyouryokuJigyosyo.reduce((result, dt) => result += isNaN(parseInt(dt.amount)) ?dt.amount :0, 0);
//     if(!kyouryokuJigyosyo.length && bDt.userSanteiTotal===0) return null;
//     if(totalAmount===0 && bDt.userSanteiTotal===0) return null;
//     if(bDt.brosJougen){
//       //複数児童対応
//       const siblingUsers = getBrothers(user.uid, users);
//       siblingUsers.unshift(user);
//       const targetSiblingBDts = siblingUsers.map(u => {
//         const b = billingDt.find(dt => dt.UID === "UID"+u.uid);
//         return b?.["協力事業所"] ?b :null;
//       }).filter(u => u);
//       const siblingKyouryokuJigyosyo = targetSiblingBDts.flatMap(b => b?.["協力事業所"] ?? []);
//       const maxPageIndex = siblingKyouryokuJigyosyo.length ?Math.ceil(siblingKyouryokuJigyosyo.length/SIBLING_COLS) :1;
//       let pageIndex = 0;
//       const oneUserPageNodes = [];
//       do{
//         pageIndex++;
//         const onePageProps = {
//           siblingUsers, com, schedule, stdDate, billingDts: targetSiblingBDts,
//           hidePersonalInfo, maxPageIndex, pageIndex
//         };
//         oneUserPageNodes.push(
//           <SiblingJogenKanriOnePage key={`page${index+1}-${pageIndex}`} {...onePageProps} />
//         );
//       }while(pageIndex < maxPageIndex);
//       return oneUserPageNodes;
//     }else{
//       const maxPageIndex = kyouryokuJigyosyo.length ?Math.ceil(kyouryokuJigyosyo.length/NOMAL_COLS) :1;
//       let pageIndex = 0;
//       const oneUserPageNodes = [];
//       do{
//         pageIndex++;
//         const onePageProps = {
//           user, com, schedule, stdDate, billingDt: bDt, hidePersonalInfo, maxPageIndex, pageIndex
//         };
//         oneUserPageNodes.push(
//           <JogenKanriOnePage key={`page${index+1}-${pageIndex}`} {...onePageProps} />
//         );
//       }while(pageIndex < maxPageIndex);
//       return oneUserPageNodes;
//     }
//   })

//   return(
//     <div className={classes.pages}>
//       {pageNodes}
//     </div>
//   )
// }