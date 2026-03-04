import { makeStyles, useMediaQuery } from '@material-ui/core';
import { grey, teal } from '@material-ui/core/colors';
import React from 'react';
import { useSelector } from 'react-redux';
import { processDeepBrToLf } from '../../../modules/newlineConv';
import { safeBrtoLf } from '../../../modules/safeBrtoLf';
import { SheetHeader } from './SheetHeader';
import { formatDate, parseDate } from '../../../commonModule';
import { DomainBadges, toDomainsArray } from '../../common/DomainBadges';

// ─── PC用スタイル（git HEAD 完全復元） ────────────────────────────────────────
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
  spHeader: {
    marginBottom: 12,
  },
  spTitle: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    wordBreak: 'break-all',
    lineHeight: 1.4,
    marginBottom: 2,
  },
  spCreateDate: {
    fontSize: '0.85rem',
    color: grey[600],
    marginBottom: 8,
  },
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
  spRow: {
    display: 'flex',
    flexWrap: 'wrap',
    marginBottom: 8,
    width: '100%',
    boxSizing: 'border-box',
  },
  spSection: {
    marginBottom: 12,
  },
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
  spGoalSection: {
    fontWeight: 'bold',
    color: teal[800],
    fontSize: '0.85rem',
  },
  spGoalBody: {
    padding: '6px 8px',
  },
  spGoalSubLabel: {
    fontSize: '0.75rem',
    color: grey[600],
    marginTop: 6,
    marginBottom: 2,
  },
  spGoalMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    marginTop: 4,
  },
  spGoalMetaItem: {
    fontSize: '0.8rem',
    color: grey[700],
  },
  spSignRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
  },
  spSignCol: {
    flex: '1 1 200px',
    borderBottom: `1px solid ${grey[700]}`,
    paddingBottom: 8,
    minHeight: 48,
  },
});

// ─── PC用サブコンポーネント（git HEAD 完全復元） ───────────────────────────────
const UserInfoTabel = ({user, content}) => {
  const classes = useStyles();
  const [implYear, implMonth, implDate] = (content?.["開始日"] ?? "").split("-");

  return(
    <table className={classes.contentTable}>
      <tbody>
        <tr>
          <th style={{width: '8rem'}}>受給者証番号</th><td>{user.hno}</td>
          <th style={{width: '8rem'}}>開始日</th><td>{implYear&&implMonth&&implDate ?`${implYear}年${implMonth}月${implDate}日` :""}</td>
          <th style={{width: '8rem'}}>有効期限</th><td>{content["有効期限"]}ヶ月</td>
        </tr>
      </tbody>
    </table>
  )
}

const MissionTable = ({content}) => {
  const classes = useStyles();

  return(
    <table className={classes.contentTable}>
      <tbody>
        <tr>
          <th>利用児及び家族の<br />生活に対する意向</th>
          <td colSpan={2}>
            {content["本人意向"] && `（本人）${safeBrtoLf(content["本人意向"])}`}
            {content["本人意向"] && content["家族意向"] && <br />}
            {content["家族意向"] && `（家族）${safeBrtoLf(content["家族意向"])}`}
          </td>
        </tr>
        {content["支援方針"] && (
          <tr>
            <th>総合的な支援の方針</th>
            <td colSpan={2}>{safeBrtoLf(content["支援方針"])}</td>
          </tr>
        )}
        <tr>
          <th>長期目標<br />（内容・期間等）</th>
          <td>{safeBrtoLf(content["長期目標"])}</td>
          <th style={{width: '300px'}}>
            支援の標準的な提供時間等<br />（曜日・頻度、時間）
          </th>
        </tr>
        <tr>
          <th>短期目標<br />（内容・期間等）</th>
          <td>{safeBrtoLf(content["短期目標"])}</td>
          <td>{content["支援提供時間"]}</td>
        </tr>
        <tr>
          <th>送迎</th>
          <td colSpan={2}>
            迎え：{content["迎え"]}<br />
            送り：{content["送り"]}
          </td>
        </tr>
      </tbody>
    </table>
  )
}

const SupportContentTable = ({content}) => {
  const classes = useStyles();

  // 支援目標配列の安全な処理
  const supportGoals = content["支援目標"];
  if (!Array.isArray(supportGoals) || supportGoals.length === 0) {
    return (
      <table className={classes.contentTable}>
        <thead>
          <tr>
            <th style={{width: '30px'}}>項目</th>
            <th style={{width: '70px'}}>具体的な<br />達成目標</th>
            <th>支援内容</th>
            <th style={{width: '20px'}}>達成<br />時期</th>
            <th style={{width: '60px'}}>担当者<br />提供機関</th>
            <th style={{width: '100px'}}>留意事項<br />（本人の役割を含む）</th>
            <th style={{width: '20px'}}>優先順位</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colSpan={7} style={{textAlign: 'center'}}>支援目標データがありません</td></tr>
        </tbody>
      </table>
    );
  }

  const trs = supportGoals.map((dt, idx) => {
    // データの安全な取得
    if (!dt || typeof dt !== 'object') {
      return null;
    }

    const categoryStr = (dt?.["五領域"] ?? "").replaceAll(",", " ／ ").replace("言語・コミュ", "言語・コミュニケーション");
    return (
      <React.Fragment key={idx}>
        <tr>
          <th style={{width: '60px'}}>{safeBrtoLf(dt["項目"])}</th>
          <td>{safeBrtoLf(dt["支援目標"])}</td>
          <td>{safeBrtoLf(dt["支援内容"])}</td>
          <td>{safeBrtoLf(dt["達成期間"])}<span style={{fontSize: '.7rem'}}>ヶ月</span></td>
          <td>{safeBrtoLf(dt["担当者・提供機関"])}</td>
          <td>{safeBrtoLf(dt["留意事項"])}</td>
          <td style={{textAlign: 'center'}}>
            {Number(dt["優先順位"]) !== 0 ? safeBrtoLf(dt["優先順位"]) : ''}
          </td>
        </tr>
        {categoryStr.trim() && (
          <tr>
            <td colSpan={7}>五領域との関係性：{categoryStr}</td>
          </tr>
        )}
      </React.Fragment>
    );
  }).filter(Boolean); // null要素を除外

  return(
    <table className={classes.contentTable}>
      <thead>
        <tr>
          <th style={{width: '30px'}}>項目</th>
          <th style={{width: '70px'}}>具体的な<br />達成目標</th>
          <th>支援内容</th>
          <th style={{width: '20px'}}>達成<br />時期</th>
          <th style={{width: '60px'}}>担当者<br />提供機関</th>
          <th style={{width: '100px'}}>留意事項<br />（本人の役割を含む）</th>
          <th style={{width: '20px'}}>優先順位</th>
        </tr>
      </thead>
      <tbody>
        {trs}
      </tbody>
    </table>
  )
}

// ─── スマホ用サブコンポーネント ───────────────────────────────────────────────
const SpFieldBlock = ({ label, children, classes, style }) => (
  <div className={classes.spField} style={style}>
    <div className={classes.spLabel}>{label}</div>
    <div className={classes.spValue}>{children}</div>
  </div>
);

const SpInfoRow = ({ content, classes }) => {
  const [implYear, implMonth, implDate] = (content?.["開始日"] ?? "").split("-");
  const startDateStr = implYear && implMonth && implDate
    ? `${implYear}年${implMonth}月${implDate}日` : "";
  return (
    <div className={classes.spRow}>
      <SpFieldBlock label="開始日" classes={classes} style={{ flex: '1 1 120px' }}>
        {startDateStr}
      </SpFieldBlock>
      <SpFieldBlock label="有効期限" classes={classes} style={{ flex: '1 1 120px' }}>
        {content["有効期限"]}ヶ月
      </SpFieldBlock>
    </div>
  );
};

const SpMissionSection = ({ content, classes }) => (
  <div className={classes.spSection}>
    <SpFieldBlock label="利用児及び家族の生活に対する意向" classes={classes}>
      {content["本人意向"] && `（本人）${safeBrtoLf(content["本人意向"])}`}
      {content["本人意向"] && content["家族意向"] && "\n"}
      {content["家族意向"] && `（家族）${safeBrtoLf(content["家族意向"])}`}
    </SpFieldBlock>
    {content["支援方針"] && (
      <SpFieldBlock label="総合的な支援の方針" classes={classes}>
        {safeBrtoLf(content["支援方針"])}
      </SpFieldBlock>
    )}
    <SpFieldBlock label="長期目標（内容・期間等）" classes={classes}>
      {safeBrtoLf(content["長期目標"])}
    </SpFieldBlock>
    <SpFieldBlock label="支援の標準的な提供時間等（曜日・頻度、時間）" classes={classes}>
      {content["支援提供時間"]}
    </SpFieldBlock>
    <SpFieldBlock label="短期目標（内容・期間等）" classes={classes}>
      {safeBrtoLf(content["短期目標"])}
    </SpFieldBlock>
    <div className={classes.spRow}>
      <SpFieldBlock label="送迎（迎え）" classes={classes} style={{ flex: '1 1 120px' }}>
        {content["迎え"]}
      </SpFieldBlock>
      <SpFieldBlock label="送迎（送り）" classes={classes} style={{ flex: '1 1 120px' }}>
        {content["送り"]}
      </SpFieldBlock>
    </div>
  </div>
);

const SpGoalCard = ({ dt, idx, classes }) => {
  if (!dt || typeof dt !== 'object') return null;
  const domains = toDomainsArray(dt["五領域"]);
  return (
    <div className={classes.spGoalCard}>
      <div className={classes.spGoalHeader}>
        <span className={classes.spGoalSection}>{dt["項目"] || `目標${idx + 1}`}</span>
        {domains.length > 0 && <DomainBadges domains={domains} />}
      </div>
      <div className={classes.spGoalBody}>
        <div className={classes.spGoalSubLabel}>具体的な達成目標</div>
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{safeBrtoLf(dt["支援目標"])}</div>
        {dt["支援内容"] && (
          <>
            <div className={classes.spGoalSubLabel}>支援内容</div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{safeBrtoLf(dt["支援内容"])}</div>
          </>
        )}
        <div className={classes.spGoalMeta}>
          {dt["達成期間"] && (
            <span className={classes.spGoalMetaItem}>達成時期：{safeBrtoLf(dt["達成期間"])}ヶ月</span>
          )}
          {dt["担当者・提供機関"] && (
            <span className={classes.spGoalMetaItem}>担当者・提供機関：{safeBrtoLf(dt["担当者・提供機関"])}</span>
          )}
          {Number(dt["優先順位"]) !== 0 && dt["優先順位"] && (
            <span className={classes.spGoalMetaItem}>優先順位：{safeBrtoLf(dt["優先順位"])}</span>
          )}
        </div>
        {dt["留意事項"] && (
          <>
            <div className={classes.spGoalSubLabel}>留意事項（本人の役割を含む）</div>
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{safeBrtoLf(dt["留意事項"])}</div>
          </>
        )}
      </div>
    </div>
  );
};

const SpGoalsSection = ({ content, classes }) => {
  const goals = content["支援目標"];
  if (!Array.isArray(goals) || goals.length === 0) {
    return (
      <div className={classes.spSection}>
        <div className={classes.spLabel} style={{ marginBottom: 8 }}>支援目標</div>
        <div className={classes.spValue} style={{ color: grey[500] }}>支援目標データがありません</div>
      </div>
    );
  }
  return (
    <div className={classes.spSection}>
      <div className={classes.spLabel} style={{ marginBottom: 8 }}>支援目標</div>
      <div style={{ paddingLeft: 4 }}>
        {goals.map((dt, idx) => (
          <SpGoalCard key={idx} dt={dt} idx={idx} classes={classes} />
        ))}
      </div>
    </div>
  );
};

// ─── メインコンポーネント ────────────────────────────────────────────────────
export const PersonalSupportSheet = (props) => {
  const classes = useStyles();
  const isMobile = useMediaQuery('(max-width:599px)');
  const {user, content, created, isOriginal} = props;
  const com = useSelector(state => state.com);
  // monitoringShowStaffName は命名がモニタリング専用だった名残だが、
  // 計画表・モニタリング表の両方に共通適用するためプロパティ名はそのまま維持
  const showStaffName = com?.ext?.reportsSetting?.usersPlan?.monitoringShowStaffName ?? com?.etc?.configReports?.usersPlan?.monitoringShowStaffName ?? false;
  const [createdYear, createdMonth, createdDate] = created.split("-");
  const [birthdayYear, birthdayMonth, birthdayDate] = (user?.birthday ?? "").split("-");

  // processDeepBrToLf関数の安全な実行
  let adjustedContent;
  try {
    adjustedContent = processDeepBrToLf(content);
  } catch (error) {
    console.error('processDeepBrToLf処理エラー:', error);
    // エラーが発生した場合は元のcontentをそのまま使用
    adjustedContent = content || {};
  }

  // ── スマホ表示（600px未満） ────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className={classes.spWrapper}>
        <div className={classes.spHeader}>
          <div className={classes.spTitle}>
            {user.name}さんの個別支援計画{isOriginal ? '（原案）' : ''}
          </div>
          <div className={classes.spCreateDate}>
            作成日：{createdYear}年{createdMonth}月{createdDate}日
          </div>
        </div>
        <SpInfoRow content={adjustedContent} classes={classes} />
        <SpMissionSection content={adjustedContent} classes={classes} />
        <SpGoalsSection content={adjustedContent} classes={classes} />
        {adjustedContent["備考"] && (
          <SpFieldBlock label="備考" classes={classes}>
            {safeBrtoLf(adjustedContent["備考"])}
          </SpFieldBlock>
        )}
        {!isOriginal && (
          <>
            <div style={{ marginTop: 16, paddingBottom: 8 }}>
              説明同意交付日付<span style={{ paddingLeft: 16 }}>
                {(() => {
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
                })()}
              </span>
            </div>
            <div className={classes.spSignCol} style={{ marginBottom: 32 }}>
              保護者氏名
              {adjustedContent.signUrl && (
                <img src={adjustedContent.signUrl} alt="電子サイン" className={classes.signImage} />
              )}
            </div>
            <div className={classes.spSignCol} style={{ margin: 16 }}>
              児童発達支援管理責任者{showStaffName && adjustedContent["児発管"] ? `　　${adjustedContent["児発管"]}` : ""}
              {showStaffName && adjustedContent["補助作成者"] && (
                <><br />補助作成者　　{adjustedContent["補助作成者"]}</>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── PC表示（600px以上・git HEAD 完全復元） ─────────────────────────────────
  return(
    <div className={classes.sheetWrapper}>
      <SheetHeader
        user={user}
        created={created}
        title="個別支援計画"
        titleSuffix={isOriginal ? '（原案）' : ''}
        isThreeColumn={true}
      />
      <table className={classes.sheet}>
        <tbody>
          <tr><td colSpan={3}><UserInfoTabel user={user} content={adjustedContent} /></td></tr>
          <tr><td colSpan={3} className='margin' /></tr>
          <tr><td colSpan={3}><MissionTable content={adjustedContent} /></td></tr>
          <tr><td colSpan={3} className='margin' /></tr>
          <tr><td colSpan={3}><SupportContentTable content={adjustedContent} /></td></tr>
          {adjustedContent["備考"] && (
            <>
              <tr><td colSpan={3} className='margin' /></tr>
              <tr>
                <td colSpan={3}>
                  <table className={classes.contentTable}>
                    <tbody>
                      <tr>
                        <th style={{width: '8rem'}}>備考</th>
                        <td>{safeBrtoLf(adjustedContent["備考"])}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </>
          )}
          {!isOriginal && (
            <>
              <tr><td colSpan={3} className='margin' /></tr>
              <tr><td style={{paddingBottom: '16px'}}>
                説明同意交付日付<span style={{paddingLeft: '32px'}}>
                  {(() => {
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
                  })()}
                </span>
              </td></tr>
              <tr>
                <td className='signCol' style={{verticalAlign: 'bottom'}}>
                  保護者氏名
                  {adjustedContent.signUrl && (
                    <img src={adjustedContent.signUrl} alt="電子サイン" className={classes.signImage} />
                  )}
                </td>
                <td style={{width: '64px'}}></td>
                <td className='signCol'>
                  児童発達支援管理責任者{showStaffName && adjustedContent["児発管"] ? `　　${adjustedContent["児発管"]}` : ""}
                  {showStaffName && adjustedContent["補助作成者"] && (
                    <><br />補助作成者　　{adjustedContent["補助作成者"]}</>
                  )}
                </td>
              </tr>
            </>
          )}
        </tbody>
      </table>
    </div>
  )
}
