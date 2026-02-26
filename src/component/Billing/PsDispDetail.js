import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, makeStyles } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { teal } from '@material-ui/core/colors';
import React from 'react';

import { serviceNameBase, serviceNameBaseHD } from './BlCalcData';
import { useSelector } from 'react-redux';
import { getUser } from '../../commonModule';
import { EditUserButton } from '../common/commonParts';
import { LC2024 } from '../../modules/contants';

const useStyles = makeStyles({
  userEditButtonWrap: {
    position: 'absolute', top: 8, left: 24,
  },
  detailTable: {
    '& .wMin': {
      width: "32px"
    },
    '& .w10': {
      width: "10%"
    },
    '& .w15': {
      width: "15%"
    },
    '& .w50': {
      width: "50%"
    },
    '& .wResidue': {
      width: "calc(55% - 32px)"
    },
    '& .left': {
      textAlign: "left",
    },
    '& .right': {
      textAlign: "right"
    },
    '& .center': {
      textAlign: "center",
    },
    '& .tableRow, .tableHeader':{
      display: 'flex',
    },
    '& .tableRow>div, .tableHeader>div': {
      padding: "6px 4px"
    },
    '& .tableHeader': {
      borderBottom: "#00695C 1px solid",
    },
    '& .tableRow:nth-child(2n+1)': {
      backgroundColor: "#f5f5f5"
    },
  },
  supplement: {
    padding: "8px 30px 0 24px",
    '& .name': {
      fontSize: "1.125em",
      marginBottom: '16px',
      textAlign: "center",
    }
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    marginTop: '8px',
    marginRight: '8px'
  },
  dialogTitle: {
    '& h2': {textAlign: 'center'},
  }
})

export const PsDispDetailOfUsers = (props) => {
  const stdDate = useSelector(state => state.stdDate);
  const {UID, billingDt, open, setOpen} = props;
  const classes = useStyles();
  if(stdDate >= LC2024) return null;
  if(!(UID && billingDt && open)) return null;
  const user_billingDt = billingDt.find(x => x.UID === UID);

  const DetailTable = (props) => {
    const {dtArray} = props;
    const classes = useStyles()
    if(!Array.isArray(dtArray)) return null;
    let total_num = 0;
    const table_rows = dtArray.sort((a, b)=>(a.s < b.s? -1: 1)).map((dt, index) => {
      total_num += dt.tanniNum;
      const service = typeof(dt.c)==="string" && dt.c.slice(-1)==="・" 
        ?dt.c.slice(0, -1) :dt.c;
      let service_opt = "";
      // if(serviceNameBase.some(x => Object.values(x).includes(service))){
      //   const opt_index = serviceNameBase.reduce((x, y, yIndex) => Object.values(y).includes(service) ?yIndex :x);
      //   const base_data = serviceNameBase[opt_index];
      //   const day = Object.keys(base_data)[Object.values(base_data).indexOf(service)];
      //   let day_name = "";
      //   if(day === "wd") day_name = "平日";
      //   else if(day === "hd") day_name = "休日";
      //   const target = base_data.target ?`・${base_data.target}` :"";
      //   const ku = base_data.ku ?`・${base_data.ku}` :"";
      //   const iryoucare = base_data.iryoucare && base_data.iryoucare!== ""
      //     ?`・医療的ケア児${base_data.iryoucare}点` :"";
      //   const teiin = base_data.max ?`・${base_data.max}人以下` :"";
      //   service_opt = day_name + target + ku + iryoucare + teiin;
      // }else if(serviceNameBaseHD.some(x => Object.values(x).includes(service))){
      //   const opt_index = serviceNameBaseHD.reduce((x, y, yIndex) => Object.values(y).includes(service) ?yIndex :x);
      //   const base_data = serviceNameBaseHD[opt_index];
      //   const type = base_data.type ?base_data.type :"";
      //   const syuugaku = base_data.syuugaku ?`・${base_data.syuugaku}` :"";
      //   const iCare = base_data.iCare && base_data.iCare!=="0"
      //     ?`・医療的ケア児${base_data.iCare}点` :"";
      //   const teiin = base_data.teiin ?`・${base_data.teiin}人以下` :""
      //   service_opt = type + syuugaku + iCare + teiin;
      // }else{
      //   service_opt = dt.opt
      //     ?typeof(dt.c)==="string" && dt.c.slice(-1)==="・"
      //       ?dt.opt.slice(0, -1) :dt.opt
      //     :"";
      //   // service_opt = (service_opt?? '').split(",") ?? [];
      //   console.log(service_opt);
      //   service_opt = service_opt? service_opt.split(","): [];
      //   service_opt.forEach((optStr, index) => {
      //     if(/^n[0-9]+$/.test(optStr)){
      //       const num = optStr.replace("n", "");
      //       service_opt[index] = String(num) + "人以下";
      //     }
      //   });
      //   service_opt = service_opt.join().replaceAll(",", "・");
      // }
      // if(service_opt.length <= 3) service_opt = "";
      
      return(
        <div className='tableRow' key={index}>
          <div className='wMin right'>{index+1}</div>
          <div className='w10'>{dt.s}</div>
          <div className='wResidue left'>
            <div>{service}</div>
            <span style={{fontSize: 'small'}}>{service_opt}</span>
          </div>
          <div className='w10 right'>{dt.v.toLocaleString()}</div>
          <div className='w10 right'>{dt.count.toLocaleString()}</div>
          <div className='w15 right'>{dt.tanniNum.toLocaleString()}</div>
        </div>
      )
    })
  
    return(
      <div className={classes.detailTable}>
        {/* <div className='tableHeader'>
          <div className='wMin'>No</div>
          <div className='w10'>コード</div>
          <div className='wResidue'>サービス名</div>
          <div className='w10 center'>単位</div>
          <div className='w10 center'>数量</div>
          <div className='w15 center'>単位数</div>
        </div> */}
        <div className='tableBody'>
          {table_rows}
          <div className='tableRow'>
            <div className='wMin'></div>
            <div className='w10'></div>
            <div className='wResidue'></div>
            <div className='w10 center'></div>
            <div className='w10 center'>合計</div>
            <div className='w15 right'>{total_num.toLocaleString()}</div>
          </div>
        </div>
      </div>
    )
  }

  if(!user_billingDt) return null;
  return (
    <Dialog
      open={open}
      onClose={e=>setOpen(false)}
      fullWidth={true}
      maxWidth="md"
      PaperProps={{style: {maxWidth: '800px'}}}
    >
      <IconButton className={classes.closeButton} onClick={e=>setOpen(false)}><CloseIcon /></IconButton>
      <DialogTitle align="center" className={classes.dialogTitle}>
        <span style={{color: teal[800]}}>利用者別単位明細</span>
      </DialogTitle>
        <div className={classes.supplement}>
          <div className='name'>
            {user_billingDt.name}
            <span style={{marginLeft: '16px'}}>{user_billingDt.ageStr}</span>
          </div>
          <div className={classes.detailTable}>
            <div className='tableHeader'>
              <div className='wMin'>No</div>
              <div className='w10'>コード</div>
              <div className='wResidue'>サービス名</div>
              <div className='w10 center'>単位</div>
              <div className='w10 center'>数量</div>
              <div className='w15 center'>単位数</div>
            </div>
          </div>
        </div>
      <DialogContent style={{paddingTop: 0, overflowY: "scroll"}}>
        <div className={classes.dialogTable}>
          <DetailTable dtArray={user_billingDt.itemTotal} />
        </div>
      </DialogContent>
      {/* <DialogActions style={{marginBottom: "8px"}}>
        <Grid container justifyContent="center">
          <Button onClick={e=>setOpen(false)} variant="contained">閉じる</Button>
        </Grid>
      </DialogActions> */}
      <div style={{textAlign:'center', padding: 8, position: 'relative'}}>
        <Button onClick={e=>setOpen(false)} variant="contained">閉じる</Button>
        <div className={classes.userEditButtonWrap}>
          <EditUserButton uid={UID}  />
        </div>
      </div>
    </Dialog>
  )
}

export const PsDispDetailOfItem = (props) => {
  const {servCode, billingDt, open, setOpen} = props;
  const users = useSelector(state => state.users);
  const stdDate = useSelector(state => state.stdDate);
  const classes = useStyles();
  if(stdDate >= LC2024) return null;
  if(!(Array.isArray(billingDt) || servCode)) return null;
  
  billingDt.forEach(e => {
    const u = getUser(e.UID, users);
    e.sindex = parseInt(u.sindex);
  });
  const bdt = billingDt.sort((a, b)=>(a.sindex > b.sindex? 1: -1));
  const data = bdt.reduce((xResult, x) => {
    if(!Array.isArray(x.itemTotal)) return xResult;
    const itemTotalDt = x.itemTotal.reduce((yResult,y) => y.s === servCode ?y :yResult ,null);
    if(!itemTotalDt) return xResult;
    xResult[x.UID] = itemTotalDt;
    return xResult
  }, {});

  const servName = Object.values(data).reduce((x, y) => {
    const subject = typeof(y.c)==="string" && y.c.slice(-1)==="・" ?y.c.slice(0, -1) :y.c;
    if(!x) return subject;
    return x === subject ?x :false
  }, null)
  if(!servName) return null;
  let opt = Object.values(data).reduce((x, y) => {
    if(!y.opt) return "";
    const subject = typeof(y.c)==="string" && y.c.slice(-1)==="・" ?y.opt.slice(0, -1) :y.opt;
    if(!x) return subject;
    return x === subject ?x :"";
  }, null)
  if(serviceNameBase.some(x => Object.values(x).includes(servName))){
    const opt_index = serviceNameBase.reduce((x, y, yIndex) => Object.values(y).includes(servName) ?yIndex :x);
    const base_data = serviceNameBase[opt_index];
    const day = Object.keys(base_data)[Object.values(base_data).indexOf(servName)];
    let day_name = "";
    if(day === "wd") day_name = "平日";
    else if(day === "hd") day_name = "休日";
    const target = base_data.target ?`・${base_data.target}` :"";
    const ku = base_data.ku ?`・${base_data.ku}` :"";
    const iryoucare = base_data.iryoucare && base_data.iryoucare!== ""
      ?`・医療的ケア児${base_data.iryoucare}点` :"";
    const teiin = base_data.max ?`・${base_data.max}人以下` :"";
    opt = day_name + target + ku + iryoucare + teiin;
  }
  else if(serviceNameBaseHD.some(x => Object.values(x).includes(servName))){
    const opt_index = serviceNameBaseHD.reduce((x, y, yIndex) => Object.values(y).includes(servName) ?yIndex :x);
    const base_data = serviceNameBaseHD[opt_index];
    const type = base_data.type ?base_data.type :"";
    const syuugaku = base_data.syuugaku ?`・${base_data.syuugaku}` :"";
    const iCare = base_data.iCare && base_data.iCare!=="0"
      ?`・医療的ケア児${base_data.iCare}点` :"";
    const teiin = base_data.teiin ?`・${base_data.teiin}人以下` :""
    opt = type + syuugaku + iCare + teiin;
  }else{
    opt = opt.split(",");
    opt.forEach((optStr, index) => {
      if(/^n[0-9]+$/.test(optStr)){
        const num = optStr.replace("n", "");
        opt[index] = String(num) + "人以下";
      }
    });
    opt = opt.join().replaceAll(",", "・");
  }
  if(opt.length <= 3) opt = "";

  const DetailTable = (props) => {
    const {data, billingDt} = props;
    const classes = useStyles()
    if(!Object.keys(data).length) return null;
    let total_num = 0;
    const table_rows = Object.keys(data).map((uid, index) => {
      const user_name = billingDt.reduce((x,y) => y.UID===uid ?y.name ?y.name :y.pname :x, "");
      const user_data = data[uid];
      if(user_data.tanniNum == 0) return null;
      total_num += user_data.tanniNum;
      return(
        <div className='tableRow' key={index}>
          <div style={{width: "65%"}}>{user_name}</div>
          <div className='w10 right'>{user_data.v.toLocaleString()}</div>
          <div className='w10 right'>{user_data.count.toLocaleString()}</div>
          <div className='w15 right'>{user_data.tanniNum.toLocaleString()}</div>
        </div>
      )
    })
  
    return(
      <div className={classes.detailTable}>
        <div className='tableBody'>
          {table_rows}
          <div className='tableRow'>
          <div style={{width: "65%"}}></div>
            <div className='w10 center'></div>
            <div className='w10 center'>合計</div>
            <div className='w15 right'>{total_num.toLocaleString()}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Dialog
      open={open}
      onClose={e=>setOpen(false)} 
      fullWidth={true}
      maxWidth="md"
      PaperProps={{style: {maxWidth: '560px'}}}
    >
      <IconButton className={classes.closeButton} onClick={e=>setOpen(false)}><CloseIcon /></IconButton>
      <DialogTitle align="center" className={classes.dialogTitle}>
        <span style={{color: teal[800]}}>サービス別利用者明細</span>
      </DialogTitle>
      <div className={classes.supplement}>
        <div className='name'>
          <div>{servName}</div>
          <div style={{fontSize: "small", marginTop: "4px"}}>{opt}</div>
        </div>
        <div className={classes.detailTable}>
          <div className='tableHeader'>
            <div style={{width: "65%"}}>利用者名</div>
            <div className='w10 center'>単位</div>
            <div className='w10 center'>数量</div>
            <div className='w15 center'>単位数</div>
          </div>
        </div>
      </div>
      <DialogContent style={{paddingTop: 0, overflowY: "scroll"}}>
        <div className={classes.dialogTable}>
          <DetailTable data={data} billingDt={billingDt}/>
        </div>
      </DialogContent>
      {/* <DialogActions style={{marginBottom: "8px"}}>
        <Grid container justifyContent="center">
          <Button onClick={e=>setOpen(false)} variant="contained">閉じる</Button>
        </Grid>
      </DialogActions> */}
      <div style={{textAlign:'center', padding: 8}}>
        <Button onClick={e=>setOpen(false)} variant="contained">閉じる</Button>
      </div>
    </Dialog>
  )
}