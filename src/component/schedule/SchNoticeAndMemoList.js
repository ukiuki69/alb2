import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { teal, blue } from '@material-ui/core/colors';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';

const useStyles = makeStyles({
  noticeAndMemoList: {
    marginTop: 16,
    width: 'calc(100% - 200px)', marginLeft: 200,
    '& .notice': {color: teal[600]}, '& .memo': {color: blue[600]},
    '& .dateRow': {
      width: '90%', maxWidth: 800, margin: '0 auto',
      marginBottom: 8,
      '& .notice, .memo': {
        lineHeight: "1.5rem",
        display: 'flex', alignItems: 'flex-start'
      },
      '& .dateStr': {marginRight: '1rem'},
      '& .dateItem': {display: 'flex', alignItems: 'center'}
    },
    '& .explanation': {
      width: '90%', maxWidth: 800, margin: '32px auto', fontSize: 12,
      '& .icon': {fontSize: 16},
      '& .notice, .memo': {
        display: 'flex', alignItems: 'center', margin: 4
      }
    }
  },
});

const getSch = (schedule, sch, uid) => {
  if (sch) return sch;
  else if (schedule["UID"+uid]) return schedule["UID"+uid];
  else return {}; 
}

export const SchNoticeAndMemoList = ({schedule, uid, virtical, sch}) => {
  const classes = useStyles();
  if(virtical) return null;

  const userScheduleDt = getSch(schedule, sch, uid);
  const nodes = Object.keys(userScheduleDt).reduce((result, dDate) => {
    if(!/^D[0-9]{8}$/.test(dDate)) return result;
    const scheduleDt = userScheduleDt[dDate];
    const notice = scheduleDt.notice;
    const memo = scheduleDt.memo;
    if(notice || memo){
      const month = dDate.slice(5, 7);
      const year = dDate.slice(7, 9);
      const dateStr = `${month}/${year}`;
      result.push((
        <div className='dateRow'>
          {notice 
            ?<div className='notice'>
              <div className='dateItem'>
                <FiberManualRecordIcon />
                <div className='dateStr'>{dateStr}</div>
              </div>
              <div>{notice}</div>
            </div> :null}
          {memo
            ?<div className='memo'>
              <div><FiberManualRecordIcon /></div>
              <div className='dateStr'>{dateStr}</div>
              <div>{memo}</div>
            </div> :null}
        </div>
      ));
    }
    return result;
  }, []);
 
  return(
    <div className={classes.noticeAndMemoList}>
      {nodes}
      {/* {nodes.length ?<div className='explanation'>
        <div className='notice'>
          <FiberManualRecordIcon className='icon'/>
          <div>家庭連携加算、欠席加算の説明など</div>
        </div>
        <div className='memo'>
          <FiberManualRecordIcon className='icon'/>
          <div>事業所内の連絡事項</div>
        </div>
      </div> :null} */}
    </div>
  )
}
