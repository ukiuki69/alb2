import { makeStyles, useMediaQuery } from '@material-ui/core';
import { grey, teal } from '@material-ui/core/colors';
import React from 'react';
import { useSelector } from 'react-redux';
import { processDeepBrToLf } from '../../../modules/newlineConv';
import { safeBrtoLf } from '../../../modules/safeBrtoLf';
import { SheetHeader } from './SheetHeader';
import { parseDate } from '../../../commonModule';
import { DomainBadges, toDomainsArray } from '../../common/DomainBadges';

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
    },
    '& .signCol': {
      borderBottom: '1px solid',
      paddingBottom: '8px'
    },
    '@media print': {
      zoom: '80%'
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
    }
  },
  signImage: {
    height: '48px',
    verticalAlign: 'middle',
    marginLeft: '16px'
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
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
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
const UserInfoTabel = ({user, content}) => {
  const classes = useStyles();

  return(
    <table className={classes.contentTable}>
      <tbody>
        <tr>
          <th style={{width: '8rem'}}>受給者証番号</th><td>{user.hno}</td>
          <th style={{width: '8rem'}}>支援期間</th><td>{content["有効期限"]}ヶ月</td>
          <th style={{width: '8rem'}}>担当者</th><td>{content["担当者"]}</td>
        </tr>
      </tbody>
    </table>
  )
}

const ResultTable = ({content}) => {
  const classes = useStyles();

  const getEndDate = (startDate, duration) => {
    if (!startDate || !duration) return "";
    const parts = startDate.split('-');
    if (parts.length !== 3) return "";

    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);

    const date = new Date(y, m, d);
    date.setMonth(date.getMonth() + parseInt(duration, 10));
    date.setDate(date.getDate() - 1);

    const ey = date.getFullYear();
    const em = ('0' + (date.getMonth() + 1)).slice(-2);
    const ed = ('0' + date.getDate()).slice(-2);

    return `${ey}-${em}-${ed}`;
  }

  return(
    <table className={classes.contentTable}>
      <tbody>
        <tr>
          <th>支援期間</th><td>{safeBrtoLf(content["有効期限"]) + 'ヶ月'}</td>
          <th>開始日〜終了日</th> <td>{content["開始日"]} 〜 {getEndDate(content["開始日"], content["有効期限"])}</td>
        </tr>
        <tr><th>アセスメント結果</th><td colSpan={3}>{safeBrtoLf(content["アセスメント結果"])}</td></tr>
        {content["総合的な支援の方針"] && (
          <tr>
            <th>総合的な支援の方針</th>
            <td colSpan={3}>{safeBrtoLf(content["総合的な支援の方針"])}</td>
          </tr>
        )}
        <tr><th>長期目標</th><td colSpan={3}>{safeBrtoLf(content["長期目標"])}</td></tr>
        <tr><th>短期目標</th><td colSpan={3}>{safeBrtoLf(content["短期目標"])}</td></tr>
      </tbody>
    </table>
  )
}

const SenmonShienPlanTable = ({content}) => {
  const classes = useStyles();

  const trs = (content["支援目標"] ?? []).map(dt => {
    const categoryStr = (dt?.["五領域"] ?? "").replaceAll(",", " \n").replace("言語・コミュ", "言語・コミュニケーション");
    return(
      <>
      <tr>
        <th>{safeBrtoLf(categoryStr)}</th>
        <td>{safeBrtoLf(dt["達成目標"])}</td>
        <td>{safeBrtoLf(dt["支援内容"])}</td>
        <td>{safeBrtoLf(dt["実施内容"])}</td>
        <td style={{padding: 0}}>
          <div style={{padding: '4px 8px',}}>{safeBrtoLf(dt["達成期間"])}<span style={{fontSize: '.7rem'}}>ヶ月</span></div>
          <div style={{padding: '4px 8px', fontSize: '.9rem'}}>{dt["担当者"]}</div>
        </td>
      </tr>
      </>
    )
  });

  return(
    <table className={classes.contentTable}>
      <thead>
        <tr>
          <th style={{width: '15%'}}>特に支援を要する項目</th>
          <th style={{width: '20%'}}>目指すべき達成目標</th>
          <th style={{width: '27.5%'}}>具体的な支援の内容</th>
          <th style={{width: '27.5%'}}>実施内容</th>
          <th style={{width: '10%', padding: 0}}>
            <div style={{padding: '4px 8px',}}>達成時期</div>
            <div style={{padding: '4px 8px'}}>担当者</div>
          </th>
        </tr>
      </thead>
      <tbody>
        {trs}
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

const SpPlanCard = ({ dt, idx, classes }) => {
  if (!dt || typeof dt !== 'object') return null;
  const domains = toDomainsArray(dt["五領域"]);
  return (
    <div className={classes.spGoalCard}>
      <div className={classes.spGoalHeader}>
        {domains.length > 0
          ? <DomainBadges domains={domains} />
          : <span style={{ fontSize: '0.85rem', color: teal[800] }}>{`項目${idx + 1}`}</span>
        }
      </div>
      <div className={classes.spGoalBody}>
        {dt["達成目標"] && (
          <>
            <div className={classes.spGoalSubLabel}>目指すべき達成目標</div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{safeBrtoLf(dt["達成目標"])}</div>
          </>
        )}
        {dt["支援内容"] && (
          <>
            <div className={classes.spGoalSubLabel}>具体的な支援の内容</div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{safeBrtoLf(dt["支援内容"])}</div>
          </>
        )}
        {dt["実施内容"] && (
          <>
            <div className={classes.spGoalSubLabel}>実施内容</div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{safeBrtoLf(dt["実施内容"])}</div>
          </>
        )}
        <div className={classes.spGoalMeta}>
          {dt["達成期間"] && (
            <span className={classes.spGoalMetaItem}>達成時期：{safeBrtoLf(dt["達成期間"])}ヶ月</span>
          )}
          {dt["担当者"] && (
            <span className={classes.spGoalMetaItem}>担当者：{dt["担当者"]}</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── メインコンポーネント ────────────────────────────────────────────────────
export const SenmonShienSheet = (props) => {
  const com = useSelector(state => state.com);
  const classes = useStyles();
  const isMobile = useMediaQuery('(max-width:599px)');
  const {user, content, created} = props;
  const [createdYear, createdMonth, createdDate] = created.split("-");

  const adjustedContent = processDeepBrToLf(content);
  const hideGuardianSign = com?.ext?.reportsSetting?.usersPlan?.senmonShienHideGuardianSign ?? false;

  const getEndDate = (startDate, duration) => {
    if (!startDate || !duration) return "";
    const parts = startDate.split('-');
    if (parts.length !== 3) return "";
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const date = new Date(y, m, d);
    date.setMonth(date.getMonth() + parseInt(duration, 10));
    date.setDate(date.getDate() - 1);
    const ey = date.getFullYear();
    const em = ('0' + (date.getMonth() + 1)).slice(-2);
    const ed = ('0' + date.getDate()).slice(-2);
    return `${ey}-${em}-${ed}`;
  };

  const signDateDisplay = (() => {
    let dateStr = adjustedContent["説明同意日"];
    if (!dateStr && adjustedContent.signTimestamp) {
      const rawTs = adjustedContent.signTimestamp;
      let d = null;
      if (/^\d+$/.test(String(rawTs))) {
        d = new Date(Number(rawTs));
      } else if (typeof rawTs === 'string') {
        d = new Date(rawTs);
      }
      if (d && !isNaN(d.getTime())) {
        dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
    }
    if (dateStr) {
      const parsed = parseDate(dateStr);
      if (parsed.result && parsed.date) {
        return parsed.date.wr.full + " " + parsed.date.m + "月 " + parsed.date.d + "日";
      }
    }
    return "令和　　年　　月　　日";
  })();

  // ── スマホ表示 ─────────────────────────────────────────────────────────────
  if (isMobile) {
    const goals = adjustedContent["支援目標"];
    return (
      <div className={classes.spWrapper}>
        <div className={classes.spHeader}>
          <div className={classes.spTitle}>{user.name}さんの専門的支援実施計画</div>
          <div className={classes.spCreateDate}>作成日：{createdYear}年{createdMonth}月{createdDate}日</div>
        </div>

        <SpFieldBlock label="支援期間" classes={classes}>
          {safeBrtoLf(adjustedContent["有効期限"])}ヶ月
        </SpFieldBlock>
        <SpFieldBlock label="開始日〜終了日" classes={classes}>
          {adjustedContent["開始日"]} 〜 {getEndDate(adjustedContent["開始日"], adjustedContent["有効期限"])}
        </SpFieldBlock>
        <SpFieldBlock label="アセスメント結果" classes={classes}>
          {safeBrtoLf(adjustedContent["アセスメント結果"])}
        </SpFieldBlock>
        {adjustedContent["総合的な支援の方針"] && (
          <SpFieldBlock label="総合的な支援の方針" classes={classes}>
            {safeBrtoLf(adjustedContent["総合的な支援の方針"])}
          </SpFieldBlock>
        )}
        <SpFieldBlock label="長期目標" classes={classes}>
          {safeBrtoLf(adjustedContent["長期目標"])}
        </SpFieldBlock>
        <SpFieldBlock label="短期目標" classes={classes}>
          {safeBrtoLf(adjustedContent["短期目標"])}
        </SpFieldBlock>

        {Array.isArray(goals) && goals.length > 0 && (
          <div className={classes.spSection}>
            <div className={classes.spLabel} style={{ marginBottom: 8 }}>支援計画</div>
            <div style={{ paddingLeft: 4 }}>
              {goals.map((dt, idx) => (
                <SpPlanCard key={idx} dt={dt} idx={idx} classes={classes} />
              ))}
            </div>
          </div>
        )}

        {!hideGuardianSign && (
          <div style={{ marginTop: 16, paddingBottom: 8 }}>
            説明同意交付日付<span style={{ paddingLeft: 16 }}>{signDateDisplay}</span>
          </div>
        )}
        <div style={{ fontSize: '0.85rem', marginBottom: 8 }}>{com.bname}</div>
        {!hideGuardianSign && (
          <div className={classes.spSignCol}>
            保護者氏名
            {adjustedContent.signUrl && (
              <img src={adjustedContent.signUrl} alt="電子サイン" className={classes.signImage} />
            )}
          </div>
        )}
        <div className={classes.spSignCol}>
          {'担当スタッフ' + (content["担当者"] ? `　　${content["担当者"]}` : "")}
          {content["補助作成者"] && (
            <><br />補助作成者　　{content["補助作成者"]}</>
          )}
        </div>
      </div>
    );
  }

  // ── PC表示（git HEAD 完全復元） ───────────────────────────────────────────
  return(
    <div className={classes.sheetWrapper}>
      <SheetHeader user={user} created={created} title="専門的支援実施計画" isThreeColumn={true} />
      <table className={classes.sheet}>
        <tbody>
        {/* <tr><td colSpan={3}><UserInfoTabel user={user} content={adjustedContent} /></td></tr>
        <tr><td colSpan={3} className='margin' /></tr> */}
        <tr><td colSpan={3}><ResultTable content={adjustedContent} /></td></tr>
        <tr><td colSpan={3} className='margin' /></tr>
        <tr><td colSpan={3}><SenmonShienPlanTable content={adjustedContent} /></td></tr>
        <tr><td colSpan={3} className='margin' /></tr>
        <tr><td colSpan={3} className='margin' /></tr>
        <tr>
          <td style={{paddingBottom: '16px', width: '58%'}}>
            {!hideGuardianSign ? (
              <>説明同意交付日付<span style={{paddingLeft: '32px'}}>{signDateDisplay}</span></>
            ) : <>&nbsp;</>}
          </td>
          <td style={{width: '4%'}}/>
          <td style={{paddingBottom: '16px', width: '38%'}}>{com.bname}</td>
        </tr>
        <tr>
          <td className='signCol' style={{width: '58%', borderBottom: hideGuardianSign ? 'none' : undefined, verticalAlign: 'bottom'}}>
            {!hideGuardianSign ? (
              <>
                保護者氏名
                {adjustedContent.signUrl && (
                  <img src={adjustedContent.signUrl} alt="電子サイン" className={classes.signImage} />
                )}
              </>
            ) : <>&nbsp;</>}
          </td>
          <td style={{width: '4%'}}/>
          <td className='signCol' style={{width: '38%'}}>
            {'担当スタッフ' + (content["担当者"] ? `　　${content["担当者"]}` : "")}
            {content["補助作成者"] && (
              <><br />補助作成者　　{content["補助作成者"]}</>
            )}
          </td>
        </tr>
      </tbody>
    </table>
    </div>
  )
}
