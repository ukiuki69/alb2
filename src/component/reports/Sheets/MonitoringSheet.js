import { makeStyles, useMediaQuery } from '@material-ui/core';
import { grey, teal } from '@material-ui/core/colors';
import React from 'react';
import { useSelector } from 'react-redux';
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
      '& > tr > td': {padding: '4px 0',},
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
    },
    '& .signCol': {
      borderBottom: '1px solid',
      paddingBottom: '8px'
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
        textAlign: 'center',
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
    },
    '& .index': {width: '3%'},
    '& .needs': {width: '15%'},
    '& .achieveGoal': {width: '20%'},
    '& .achieveLevel': {width: '15%'},
    '& .evaluate': {width: '7%'},
    '& .consideration': {width: '40%'},
  },
  notEnoughData: {
    marginTop: 120, textAlign: 'center',
    '& .name': {
      fontSize: 24, marginBottom: 8
    },
    '@media print': {display: 'none'}
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
  spSection: { marginBottom: 12 },
  spGoalCard: {
    border: `1px solid ${grey[200]}`,
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
    breakInside: 'avoid',
    pageBreakInside: 'avoid',
  },
  spGoalHeader: {
    backgroundColor: teal[50],
    borderBottom: `1px solid ${teal[200]}`,
    padding: '4px 8px',
    fontWeight: 'bold',
    color: teal[800],
    fontSize: '0.85rem',
  },
  spGoalBody: { padding: '6px 8px' },
  spGoalSubLabel: { fontSize: '0.75rem', color: grey[600], marginTop: 6, marginBottom: 2 },
  spGoalMeta: { display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 },
  spGoalMetaItem: { fontSize: '0.8rem', color: grey[700] },
  spSignCol: {
    borderBottom: `1px solid ${grey[700]}`,
    paddingBottom: 8,
    minHeight: 48,
    marginBottom: 16,
  },
});

// ─── PC用サブコンポーネント（git HEAD 完全復元） ───────────────────────────────
const MakerInfoTable = ({content}) => {
  const classes = useStyles();

  return(
    <table className={classes.contentTable}>
      <tbody>
        {/* <tr><th>作成回数</th><td>{content?.["作成回数"] ?? ""}</td></tr> */}
        <tr><th>計画者</th><td>{content?.["作成者"] ?? ""}</td></tr>
      </tbody>
    </table>
  )
}

const GoalAchievementTable = ({content, pSContent}) => {
  const classes = useStyles();

  const trs = (content["支援経過"] ?? []).map((dt, i) => {
    const psDt = pSContent["支援目標"]?.[i] ?? {};
    return(
      <tr>
        <th style={{width: "1rem"}}>{i+1}</th>
        <td>{safeBrtoLf(psDt?.["項目"])}</td>
        <td>{safeBrtoLf(psDt?.["支援目標"])}</td>
        <td>{safeBrtoLf(dt?.["目標達成度"])}</td>
        <td>{safeBrtoLf(dt?.["評価"])}</td>
        <td>{safeBrtoLf(dt?.["考察"])}</td>
      </tr>
    )
  })

  return(
    <table className={classes.contentTable}>
      <thead>
        <tr>
          <th className='index' />
          <th className='needs'>項目</th>
          <th className='achieveGoal'>具体的な達成目標</th>
          <th className='achieveLevel'>目標達成度</th>
          <th className='evaluate'>評価</th>
          <th className='consideration'>考察</th>
        </tr>
      </thead>
      <tbody>
        {trs}
      </tbody>
    </table>
  )
}

const ThoughtsOnGoalsTable = ({content, pSContent}) => {
  const classes = useStyles();

  return(
    <table className={classes.contentTable}>
      <tbody>
        <tr><th>長期目標</th><td>{safeBrtoLf(pSContent["長期目標"])}</td></tr>
        <tr><th>長期目標に対する考察</th><td>{safeBrtoLf(content["長期目標"])}</td></tr>
        <tr><th>短期目標</th><td>{safeBrtoLf(pSContent["短期目標"])}</td></tr>
        <tr><th>短期目標に対する考察</th><td>{safeBrtoLf(content["短期目標"])}</td></tr>
      </tbody>
    </table>
  )
}

const HopeAndRequestTable = ({content}) => {
  const classes = useStyles();
  const fields = [
    { label: '本人の希望', key: '本人の希望' },
    { label: 'ご家族の要望', key: 'ご家族の希望' },
    { label: '関係者要望', key: '関係者の希望' },
  ];
  const rows = fields
    .map(field => ({
      ...field,
      value: content[field.key],
    }))
    .filter(row => row.value);

  if (!rows.length) return null;

  return (
    <table className={classes.contentTable}>
      <tbody>
        {rows.map(row => (
          <tr key={row.key}>
            <th>{row.label}</th>
            <td>{safeBrtoLf(row.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const NoticeTable = ({content}) => {
  const classes = useStyles();

  return(
    <table className={classes.contentTable}>
      <tbody>
        <tr><th>備考</th><td>{safeBrtoLf(content["備考"])}</td></tr>
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

const SpProgressCard = ({ dt, psDt, idx, classes }) => {
  return (
    <div className={classes.spGoalCard}>
      <div className={classes.spGoalHeader}>{idx + 1}. {safeBrtoLf(psDt?.["項目"]) || `項目${idx + 1}`}</div>
      <div className={classes.spGoalBody}>
        {psDt?.["支援目標"] && (
          <>
            <div className={classes.spGoalSubLabel}>具体的な達成目標</div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{safeBrtoLf(psDt["支援目標"])}</div>
          </>
        )}
        {dt?.["目標達成度"] && (
          <>
            <div className={classes.spGoalSubLabel}>目標達成度</div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{safeBrtoLf(dt["目標達成度"])}</div>
          </>
        )}
        <div className={classes.spGoalMeta}>
          {dt?.["評価"] && (
            <span className={classes.spGoalMetaItem}>評価：{safeBrtoLf(dt["評価"])}</span>
          )}
        </div>
        {dt?.["考察"] && (
          <>
            <div className={classes.spGoalSubLabel}>考察</div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{safeBrtoLf(dt["考察"])}</div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── メインコンポーネント ────────────────────────────────────────────────────
export const MonitoringSheet = (props) => {
  const classes = useStyles();
  const isMobile = useMediaQuery('(max-width:599px)');
  const {user, content, created, pSContent, titleSuffix} = props;
  const com = useSelector(state => state.com);
  const showStaffName = com?.ext?.reportsSetting?.usersPlan?.monitoringShowStaffName ?? com?.etc?.configReports?.usersPlan?.monitoringShowStaffName ?? false;
  const [createdYear, createdMonth, createdDate] = created.split("-");

  if(!pSContent) return(
    <div className={classes.notEnoughData}>
      <div className='name'>{user.name}</div>
      <div>表示するためのデータが不足しています。</div>
    </div>
  );

  const adjustedContent = processDeepBrToLf(content);
  const adjustedPSContent = processDeepBrToLf(pSContent);
  const sheetTitle = `モニタリング表${titleSuffix || ''}`;

  const hopeFields = [
    { label: '本人の希望', key: '本人の希望' },
    { label: 'ご家族の要望', key: 'ご家族の希望' },
    { label: '関係者要望', key: '関係者の希望' },
  ].filter(f => adjustedContent[f.key]);

  // ── スマホ表示 ─────────────────────────────────────────────────────────────
  if (isMobile) {
    const progressList = adjustedContent["支援経過"] ?? [];
    return (
      <div className={classes.spWrapper}>
        <div className={classes.spHeader}>
          <div className={classes.spTitle}>{user.name}さんの{sheetTitle}</div>
          <div className={classes.spCreateDate}>作成日：{createdYear}年{createdMonth}月{createdDate}日</div>
        </div>

        <SpFieldBlock label="計画者" classes={classes}>
          {adjustedContent?.["作成者"] ?? ""}
        </SpFieldBlock>

        {progressList.length > 0 && (
          <div className={classes.spSection}>
            <div className={classes.spLabel} style={{ marginBottom: 8 }}>支援経過・目標評価</div>
            <div style={{ paddingLeft: 4 }}>
              {progressList.map((dt, i) => (
                <SpProgressCard
                  key={i}
                  dt={dt}
                  psDt={adjustedPSContent["支援目標"]?.[i] ?? {}}
                  idx={i}
                  classes={classes}
                />
              ))}
            </div>
          </div>
        )}

        <SpFieldBlock label="長期目標" classes={classes}>
          {safeBrtoLf(adjustedPSContent["長期目標"])}
        </SpFieldBlock>
        <SpFieldBlock label="長期目標に対する考察" classes={classes}>
          {safeBrtoLf(adjustedContent["長期目標"])}
        </SpFieldBlock>
        <SpFieldBlock label="短期目標" classes={classes}>
          {safeBrtoLf(adjustedPSContent["短期目標"])}
        </SpFieldBlock>
        <SpFieldBlock label="短期目標に対する考察" classes={classes}>
          {safeBrtoLf(adjustedContent["短期目標"])}
        </SpFieldBlock>

        {hopeFields.map(f => (
          <SpFieldBlock key={f.key} label={f.label} classes={classes}>
            {safeBrtoLf(adjustedContent[f.key])}
          </SpFieldBlock>
        ))}

        <SpFieldBlock label="備考" classes={classes}>
          {safeBrtoLf(adjustedContent["備考"])}
        </SpFieldBlock>

        <div style={{ marginTop: 16, paddingBottom: 8 }}>
          説明同意交付日付<span style={{ paddingLeft: 16 }}>令和　　年　　月　　日</span>
        </div>
        <div className={classes.spSignCol}>保護者氏名</div>
        <div className={classes.spSignCol}>
          児童発達支援管理責任者{showStaffName && adjustedContent["作成者"] ? `　　${adjustedContent["作成者"]}` : ""}
        </div>
      </div>
    );
  }

  // ── PC表示（git HEAD 完全復元） ───────────────────────────────────────────
  return(
    <div className={classes.sheetWrapper}>
      <SheetHeader user={user} created={created} title={sheetTitle} isThreeColumn={true} />
      <table className={classes.sheet}>
        <tbody>
        <tr><td colSpan={3}><MakerInfoTable content={adjustedContent} /></td></tr>
        <tr><td colSpan={3} className='margin' /></tr>
        <tr><td colSpan={3}><GoalAchievementTable content={adjustedContent} pSContent={adjustedPSContent} /></td></tr>
        <tr><td colSpan={3} className='margin' /></tr>
        <tr><td colSpan={3}><ThoughtsOnGoalsTable content={adjustedContent} pSContent={adjustedPSContent} /></td></tr>
        <tr><td colSpan={3} className='margin' /></tr>
        <tr><td colSpan={3}><HopeAndRequestTable content={adjustedContent} /></td></tr>
        <tr><td colSpan={3} className='margin' /></tr>
        <tr><td colSpan={3}><NoticeTable content={adjustedContent} /></td></tr>
        <tr><td colSpan={3} className='margin' /></tr>
        <tr><td style={{paddingBottom: '16px'}}>説明同意交付日付<span style={{paddingLeft: '64px'}}>令和　　年　　月　　日</span></td></tr>
        <tr>
          <td className='signCol'>保護者氏名</td>
          <td style={{width: '64px'}}/>
          <td className='signCol'>
            児童発達支援管理責任者{showStaffName && adjustedContent["作成者"] ? `　　${adjustedContent["作成者"]}` : ""}
          </td>
        </tr>
      </tbody>
    </table>
    </div>
  )
}
