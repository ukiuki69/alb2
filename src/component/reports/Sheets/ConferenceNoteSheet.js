import { makeStyles } from '@material-ui/core';
import { grey } from '@material-ui/core/colors';
import React from 'react';
import { processDeepBrToLf } from '../../../modules/newlineConv';
import { safeBrtoLf } from '../../../modules/safeBrtoLf';
import { SheetHeader } from './SheetHeader';

const useStyles = makeStyles({
  sheetWrapper: {
  },
  sheet: {
    width: '100%',
    '& > thead': {
      display: 'table-row-group',
      '& > tr > td': {padding: '4px 0'},
      '& .name': {fontSize: '24px', fontWeight: 'bold'}
    },
    '& > tbody': {
      '& > tr': {
        '& > th': {
          fontWeight: 'initial', fontSize: '20px',
          textAlign: 'start',
          paddingBottom: '8px'
        },
        '& .margin': {
          height: '16px'
        },
      }
    },
    '& .bname, .service, .createDate': {
      padding: '4px'
    }
  },
  contentTable: {
    width: '100%',
    '& th, td': {
      border: '1px solid',
      padding: '4px 8px',
      whiteSpace: 'pre-wrap',
      lineHeight: '1.5rem',
      '&::before': {
        content: "''",
        display: "block",
        float: "left",
        height: "24px",
      }
    },
    '& th': {
      width: '200px',
      fontWeight: 'initial',
      textAlign: 'start',
      backgroundColor: grey[100],
    },
    '& thead': {
      '& th': {
        backgroundColor: grey[300],
      },
    },
    '& tbody tr': {
      pageBreakInside: 'avoid',
      breakInside: 'avoid',
    },
    '@media print': {
      '& tbody tr': {
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }
    }
  }
});

const MainTable = ({user, content}) => {
  const classes = useStyles();
  const [implYear, implMonth, implDate] = (content?.["開催日"] ?? "").split("-");

  return(
    <table className={classes.contentTable}>
      <tbody>
        <tr><th>開催日</th><td>{implYear&&implMonth&&implDate ?`${implYear}年${implMonth}月${implDate}日` :""}</td></tr>
        <tr><th>開催時間</th><td>{safeBrtoLf(content?.["開始時間"])}
          ～{safeBrtoLf(content?.["終了時間"])}</td></tr>
        <tr><th>児童名</th><td>{user.name}</td></tr>
        {/* <tr><th>作成回数</th><td>{safeBrtoLf(content?.["実施回数"])}</td></tr> */}
        <tr><th>作成者</th><td>{safeBrtoLf(content?.["作成者"])}</td></tr>
        <tr><th>会議参加者</th><td>{safeBrtoLf(content?.["会議参加者"])}</td></tr>
        <tr><th>欠席者</th><td>{safeBrtoLf(content?.["欠席者"])}</td></tr>
        <tr><th>議事録</th><td>{safeBrtoLf(content?.["議事録"])}</td></tr>
        <tr><th>修正や追加内容</th><td>{safeBrtoLf(content?.["修正"])}</td></tr>
        <tr><th>課題</th><td>{safeBrtoLf(content?.["課題"])}</td></tr>
      </tbody>
    </table>
  )
}

export const ConferenceNoteSheet = (props) => {
  const classes = useStyles();
  const {user, content, created} = props;

  const adjustedContent = processDeepBrToLf(content);

  return(
    <div className={classes.sheetWrapper}>
      <SheetHeader user={user} created={created} title="サービス担当者会議（支援会議）の議事録" />
      <table className={classes.sheet}>
        <tbody>
          <tr><td colSpan={2}><MainTable user={user} content={adjustedContent} /></td></tr>
        </tbody>
      </table>
    </div>
  )
}