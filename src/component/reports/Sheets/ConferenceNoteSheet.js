import { makeStyles, useMediaQuery } from '@material-ui/core';
import { grey, teal } from '@material-ui/core/colors';
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
  },

  // ─── スマホ用スタイル ─────────────────────────────────────────────────────
  spWrapper: {
    fontFamily: 'inherit',
    width: '100%',
    maxWidth: '100vw',
    overflowX: 'hidden',
    boxSizing: 'border-box',
  },
  spHeader: { marginBottom: 12 },
  spTitle: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    wordBreak: 'break-all',
    lineHeight: 1.4,
    marginBottom: 2,
  },
  spCreateDate: { fontSize: '0.85rem', color: grey[600], marginBottom: 8 },
  spLabel: {
    backgroundColor: teal[50],
    borderBottom: `1px solid ${teal[600]}`,
    color: teal[900],
    padding: '4px 8px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    wordBreak: 'break-all',
  },
  spValue: {
    padding: '6px 8px',
    whiteSpace: 'pre-wrap',
    lineHeight: 1.6,
    minHeight: '1.6rem',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
  },
  spField: {
    marginBottom: 8,
    borderBottom: `1px solid ${grey[200]}`,
    width: '100%',
    boxSizing: 'border-box',
  },
});

// ─── PC用サブコンポーネント（git HEAD 完全復元） ───────────────────────────────
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

// ─── スマホ用サブコンポーネント ───────────────────────────────────────────────
const SpFieldBlock = ({ label, children, classes }) => (
  <div className={classes.spField}>
    <div className={classes.spLabel}>{label}</div>
    <div className={classes.spValue}>{children}</div>
  </div>
);

// ─── メインコンポーネント ────────────────────────────────────────────────────
export const ConferenceNoteSheet = (props) => {
  const classes = useStyles();
  const isMobile = useMediaQuery('(max-width:599px)');
  const {user, content, created} = props;
  const [createdYear, createdMonth, createdDate] = created.split("-");

  const adjustedContent = processDeepBrToLf(content);

  const [implYear, implMonth, implDate] = (adjustedContent?.["開催日"] ?? "").split("-");
  const dateStr = implYear && implMonth && implDate
    ? `${implYear}年${implMonth}月${implDate}日` : "";

  // ── スマホ表示 ─────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className={classes.spWrapper}>
        <div className={classes.spHeader}>
          <div className={classes.spTitle}>
            {user.name}さんのサービス担当者会議議事録
          </div>
          <div className={classes.spCreateDate}>作成日：{createdYear}年{createdMonth}月{createdDate}日</div>
        </div>

        <SpFieldBlock label="開催日" classes={classes}>{dateStr}</SpFieldBlock>
        <SpFieldBlock label="開催時間" classes={classes}>
          {safeBrtoLf(adjustedContent?.["開始時間"])}～{safeBrtoLf(adjustedContent?.["終了時間"])}
        </SpFieldBlock>
        <SpFieldBlock label="作成者" classes={classes}>{safeBrtoLf(adjustedContent?.["作成者"])}</SpFieldBlock>
        <SpFieldBlock label="会議参加者" classes={classes}>{safeBrtoLf(adjustedContent?.["会議参加者"])}</SpFieldBlock>
        {adjustedContent?.["欠席者"] && (
          <SpFieldBlock label="欠席者" classes={classes}>{safeBrtoLf(adjustedContent["欠席者"])}</SpFieldBlock>
        )}
        <SpFieldBlock label="議事録" classes={classes}>{safeBrtoLf(adjustedContent?.["議事録"])}</SpFieldBlock>
        {adjustedContent?.["修正"] && (
          <SpFieldBlock label="修正や追加内容" classes={classes}>{safeBrtoLf(adjustedContent["修正"])}</SpFieldBlock>
        )}
        {adjustedContent?.["課題"] && (
          <SpFieldBlock label="課題" classes={classes}>{safeBrtoLf(adjustedContent["課題"])}</SpFieldBlock>
        )}
      </div>
    );
  }

  // ── PC表示（git HEAD 完全復元） ───────────────────────────────────────────
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
