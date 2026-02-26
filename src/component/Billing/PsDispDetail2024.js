import { Button, Dialog, DialogContent, DialogTitle, IconButton, makeStyles } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { teal } from '@material-ui/core/colors';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { EditUserButton, SetUisCookieChkBox } from '../common/commonParts';
import { LC2024 } from '../../modules/contants';
import { checkValueType } from '../dailyReport/DailyReportCommon';
import * as comMod from '../../commonModule';

const getBillingItemName = (itemDt) => {
  const itemName = itemDt.c;
  if(!checkValueType(itemName, "String")) return "";
  if(itemName.slice(-1) === "・") return itemName.slice(-1);
  return itemName;
}

const getBillingItemOption = (itemDt) => {
  let option = "";
  const data = itemDt.baseItem ?itemDt :(itemDt.opt ?? {});
  if(itemDt.comment){
    option += `・${itemDt.comment}`;
  }
  if(data.fac){
    switch(data.fac){
      case "ce": {
        option += "・児童発達支援センター";
        break;
      }
      case "ji": {
        option += "・事業所";
        break;
      }
      case "kyo": {
        option += "・共生型サービス";
        break;
      }
    }
  }
  if(data.ftype) option += "・重心対応施設";
  if(data.trg){
    switch(data.trg){
      case "syo": {
        option += "・障害児";
        break;
      }
      case "juu": {
        option += "・重症心身障害児";
        break;
      }
      case "障害児": {
        option += "・障害児";
        break;
      }
      case "重症心身障害児": {
        option += "・重症心身障害児";
        break;
      }
    }
  }
  if(data.d == 0) option += "・平日";
  else if(data.d == 1) option += "・休日";
  if(data.cap) option += `・${data.cap}人以下`;
  if(data.pres == 1) option += "・主に未就学児";
  else if(data.pres == 2) option += "・主に未就学児以外";
  if(data.icare) option += `・医療的ケア児${data.icare}点以上`;
  if(data.ku) option += `・区分${data.ku}`;
  return option.slice(1);
}

const useStyles = makeStyles({
  psDispDetail: {
    '& .closeButton': {
      position: 'absolute', right: 0,
      marginTop: '8px', marginRight: '8px'
    },
    '& .dialogTitle': {color: teal[800], textAlign: 'center'},
  },
  userEditButtonWrap: {
    position: 'absolute', top: 8, left: 24,
  },
  detailTable: {
    '& .wMin': { width: "32px" },
    '& .w10': { width: "10%" },
    '& .w15': { width: "15%" },
    '& .w50': { width: "50%"},
    '& .wResidue': { width: "calc(55% - 32px)" },
    '& .left': { textAlign: "left", },
    '& .right': { textAlign: "right" },
    '& .center': { textAlign: "center", },
    '& .row': {
      display: 'flex',
      '& > div': {
        padding: "6px 4px"
      }
    },
    '& .header': {
      borderBottom: "#00695C 1px solid",
    },
    '& .body': {
      '& .row:nth-child(2n+1)':{
        backgroundColor: "#f5f5f5"
      }
    }
  },
  supplement: {
    padding: "8px 30px 0 24px",
    '& .name': {
      fontSize: "1.125em",
      marginBottom: '16px',
      textAlign: "center",
    }
  },
});

const CloseButton = ({setOpen}) => (
  <div style={{textAlign:'center', padding: 8}}>
    <Button onClick={e=>setOpen(false)} variant="contained">閉じる</Button>
  </div>
);

const UserDetailTable = (props) => {
  const classes = useStyles();
  const {userBillingDt, displayAcCost} = props;
  const itemTotal = userBillingDt.itemTotal ?? [];
  itemTotal.sort((a, b) => {
    if(a.baseItem && !b.baseItem) return -1;
    if (!a.baseItem && b.baseItem) return 1;
    return a.s < b.s ?-1 :1;
  });

  const bodyRows = itemTotal.map((itemDt, index) => {
    if(itemDt.tanniNum == 0) return null;
    const itemName = getBillingItemName(itemDt);
    const itemOption = getBillingItemOption(itemDt);
    return(
      <div className='row' key={itemDt.s}>
        <div className='wMin right'>{index+1}</div>
        <div className='w10'>{itemDt.s}</div>
        <div className='wResidue left'>
          <div>{itemName}</div>
          <span style={{fontSize: 'small'}}>{itemOption}</span>
        </div>
        <div className='w10 right'>{itemDt.v.toLocaleString()}</div>
        <div className='w10 right'>{itemDt.count.toLocaleString()}</div>
        <div className='w15 right'>{itemDt.tanniNum.toLocaleString()}</div>
      </div>
    )
  });

  // 実費項目の表示
  const actualCostRows = displayAcCost ? (
    userBillingDt.actualCostDetail && userBillingDt.actualCostDetail.length > 0 ? 
      userBillingDt.actualCostDetail.map((costItem, index) => (
        <div className='row' key={`actualCost-${index}`}>
          <div className='wMin right'>{index + 1}</div>
          <div className='w10'>実費</div>
          <div className='wResidue left'>
            <div>{costItem.name}</div>
          </div>
          <div className='w10 right'>{costItem.unitPrice.toLocaleString()}</div>
          <div className='w10 right'>{costItem.count.toLocaleString()}</div>
          <div className='w15 right'>{costItem.price.toLocaleString()}</div>
        </div>
      )) : [
        <div className='row' key="no-actual-cost" style={{textAlign: 'center', padding: '20px'}}>
          <div style={{width: '100%', color: '#666'}}>実費項目はありません</div>
        </div>
      ]
  ) : [];

  const sumTanni = itemTotal.reduce((prevSumTanni, itemDt) => {
    prevSumTanni += (itemDt.tanniNum ?? 0);
    return prevSumTanni;
  }, 0);

  // 実費項目の合計
  const sumActualCost = displayAcCost && userBillingDt.actualCostDetail && userBillingDt.actualCostDetail.length > 0 ? 
    userBillingDt.actualCostDetail.reduce((sum, costItem) => sum + (costItem.price ?? 0), 0) : 0;

  return(
    <div className={classes.detailTable}>
      <div className='body'>
        {displayAcCost ? actualCostRows : bodyRows}
      </div>
      <div className='footer'>
        <div className='row'>
          <div className='wMin'></div>
          <div className='w10'></div>
          <div className='wResidue'></div>
          <div className='w10 center'></div>
          <div className='w10 center'>合計</div>
          <div className='w15 right'>{(displayAcCost ? sumActualCost : sumTanni).toLocaleString()}</div>
        </div>
      </div>
    </div>
  )
}

export const PsDispDetailOfUsers2024 = (props) => {
  const classes = useStyles();
  const stdDate = useSelector(state => state.stdDate);
  const {UID, billingDt, open, setOpen, dispCitiesHno} = props;
  const [displayAcCost, setDisplayAcCost] = useState(
    comMod.getUisCookie(comMod.uisCookiePos.displayAcCostOnPsDispDetailOfUsers) === '1'
  );
  
  if(stdDate < LC2024) return null;
  if(!(UID && billingDt && open)) return null;
  const userBillingDt = billingDt.find(x => x.UID === UID);
  if(!userBillingDt) return null;

  const tableProps = {userBillingDt, dispCitiesHno, displayAcCost};
  return (
    <Dialog
      open={open}
      onClose={e=>setOpen(false)}
      fullWidth={true}
      PaperProps={{style: {maxWidth: '800px'}}}
      className={classes.psDispDetail}
    >
      <IconButton className="closeButton" onClick={e=>setOpen(false)}><CloseIcon /></IconButton>
      <DialogTitle align="center" className="dialogTitle">利用者別単位明細</DialogTitle>
        <div className={classes.supplement}>
          <div className='name'>
            {userBillingDt.name || userBillingDt.pname}
            <span style={{marginLeft: '16px'}}>{userBillingDt.ageStr}</span>
          </div>
          <div className={classes.detailTable}>
            <div className='header'>
              <div className='row'>
                <div className='wMin'>No</div>
                <div className='w10'>{displayAcCost ? '種別' : 'コード'}</div>
                <div className='wResidue'>{displayAcCost ? '項目' : 'サービス名'}</div>
                <div className='w10 center'>{displayAcCost ? '単価' : '単位'}</div>
                <div className='w10 center'>数量</div>
                <div className='w15 center'>{displayAcCost ? '金額' : '単位数'}</div>
              </div>
            </div>
          </div>
        </div>
      <DialogContent style={{paddingTop: 0, overflowY: "scroll"}}>
        <UserDetailTable {...tableProps} />
      </DialogContent>
      <div style={{textAlign:'center', padding: 8, position: 'relative'}}>
        <Button onClick={e=>setOpen(false)} variant="contained">閉じる</Button>
        <div className={classes.userEditButtonWrap}>
          <EditUserButton uid={UID}  />
        </div>
        <div style={{position: 'absolute', top: 8, right: 24}}>
          <SetUisCookieChkBox 
            style={{margin: '-4px -16px 2px', width: 128, height: 32, padding: 0}}
            p={comMod.uisCookiePos.displayAcCostOnPsDispDetailOfUsers} 
            label="実費を表示"
            setValue={setDisplayAcCost}
          />
        </div>
      </div>
    </Dialog>
  )
}

const ItemDetailTable = (props) => {
  const classes = useStyles();
  const {targetUsers, billingDt, servCode} = props;

  const bodyRows = targetUsers.map(user => {
    const userBillingDt = billingDt.find(bDt => bDt.UID === "UID"+user.uid) ?? {};
    const itemTotal = userBillingDt.itemTotal ?? [];
    const itemDt = itemTotal.find(iDt => iDt.s === servCode) ?? {};
    if(itemDt.tanniNum == 0) return null;
    return(
      <div className='row' key={`bodyRow${user.uid}`}>
        <div style={{width: "65%"}}>{user.name}</div>
        <div className='w10 right'>{itemDt.v.toLocaleString()}</div>
        <div className='w10 right'>{itemDt.count.toLocaleString()}</div>
        <div className='w15 right'>{itemDt.tanniNum.toLocaleString()}</div>
        
      </div>
    )
  });

  const sumTanni = targetUsers.reduce((prevSumTanni, user) => {
    const userBillingDt = billingDt.find(bDt => bDt.UID === "UID"+user.uid) ?? {};
    const itemTotal = userBillingDt.itemTotal ?? [];
    const itemDt = itemTotal.find(iDt => iDt.s === servCode) ?? {};
    prevSumTanni += (itemDt.tanniNum ?? 0);
    return prevSumTanni;
  }, 0);

  return(
    <div className={classes.detailTable}>
      <div className='body'>
        {bodyRows}
      </div>
      <div className='footer'>
        <div className='row'>
          <div style={{width: "65%"}} />
          <div className='w10 center'></div>
          <div className='w10 center'>合計</div>
          <div className='w15 right'>{sumTanni.toLocaleString()}</div>
        </div>
      </div>
    </div>
  )
}

export const PsDispDetailOfItem2024 = (props) => {
  const classes = useStyles();
  const stdDate = useSelector(state => state.stdDate);
  const {servCode, billingDt, open, setOpen, users} = props;
  
  if(!(Array.isArray(billingDt) || servCode)) return null;
  if(stdDate < LC2024) return null;

  // 対象利用者
  const targetUsers = users.filter(user => {
    const uidStr = "UID" + user.uid;
    const userBillingDt = billingDt.find(bDt => bDt.UID === uidStr) ?? {};
    const itemTotal = userBillingDt.itemTotal ?? [];
    const isTarget = itemTotal.some(dt => dt.s === servCode);
    return isTarget;
  }).sort((a, b)=>(a.sindex > b.sindex? 1: -1));
  
  if(!targetUsers.length) return null;

  const targetUser = targetUsers[0];
  const userBillingDt = billingDt.find(bDt => bDt.UID === "UID"+targetUser.uid);
  const itemTotal = userBillingDt.itemTotal;
  const itemDt = itemTotal.find(iDt => iDt.s === servCode);
  const itemName = getBillingItemName(itemDt);
  const itemOption = getBillingItemOption(itemDt);

  const tableProps = {targetUsers, billingDt, servCode};
  return (
    <Dialog
      open={open}
      onClose={e=>setOpen(false)} 
      fullWidth={true}
      PaperProps={{style: {maxWidth: '560px'}}}
      className={classes.psDispDetail}
    >
      <IconButton className="closeButton" onClick={e=>setOpen(false)}><CloseIcon /></IconButton>
      <DialogTitle align="center" className="dialogTitle">サービス別利用者明細</DialogTitle>
      <div className={classes.supplement}>
        <div className='name'>
          <div>{itemName}</div>
          <div style={{fontSize: "small", marginTop: "4px"}}>{itemOption}</div>
        </div>
        <div className={classes.detailTable}>
          <div className='header'>
            <div className='row'>
              <div style={{width: "65%"}}>利用者名</div>
              <div className='w10 center'>単位</div>
              <div className='w10 center'>数量</div>
              <div className='w15 center'>単位数</div>
            </div>
          </div>
        </div>
      </div>
      <DialogContent style={{paddingTop: 0, overflowY: "scroll"}}>
        <ItemDetailTable {...tableProps} />
      </DialogContent>
      <CloseButton setOpen={setOpen} />
    </Dialog>
  )
}