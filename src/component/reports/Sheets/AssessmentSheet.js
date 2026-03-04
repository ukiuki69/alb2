import { makeStyles, useMediaQuery } from '@material-ui/core';
import { blue, grey, teal } from '@material-ui/core/colors';
import React from 'react';
import { processDeepBrToLf } from '../../../modules/newlineConv';
import { safeBrtoLf } from '../../../modules/safeBrtoLf';
import { inputDefinitions, BLANK_HEIGHT_CONFIG } from '../../plan/PlanAssessment';
import { FIVEDOMAINS_LABELS as FIVEDOMAINS_CLASS, GENERAL_LABELS } from '../../plan/planCommonPart';
import { SheetHeader } from './SheetHeader';

const useStyles = makeStyles({
  sheetWrapper: {
    // 削除: sheet全体での改ページ禁止は行わない
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
          '&.subTitle::before': {
            content: "''",
            display: 'inline-block',
            width: '4px', height: '32px',
            backgroundColor: blue[800],
            verticalAlign: 'middle',
            marginRight: '4px'
          }
        },
        '& .margin': {
          height: '16px'
        },
      }
    },
    '& .bname, .service, .createDate': {
      padding: '4px'
    },
    '& tbody': {
    },
    // 削除: 行内での改ページを許容する
    '@media print': {
      '& tbody': {
      }
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
    '& tbody': {
    },
    '& tr': {
      breakInside: 'avoid',
      pageBreakInside: 'avoid'
    },
    // 削除: 行内での改ページを許容する
    '@media print': {
      '& tbody': {
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
  spSectionLabel: {
    backgroundColor: teal[100],
    borderBottom: `2px solid ${teal[600]}`,
    color: teal[900],
    padding: '4px 8px',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
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
  spGoalCard: {
    border: `1px solid ${grey[200]}`,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
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
});

// ─── PC用サブコンポーネント（git HEAD 完全復元） ───────────────────────────────

// 100文字程度で改行を入れるヘルパー
const wrapText = (text, maxLength = 100) => {
  if (typeof text !== 'string') return text;
  return text.split('\n').map(line => {
    let result = '';
    for (let i = 0; i < line.length; i += maxLength) {
      result += line.substring(i, i + maxLength) + (i + maxLength < line.length ? '\n' : '');
    }
    return result;
  }).join('\n');
};

const MainTable = ({user, content, useOriginalLabel}) => {
  const classes = useStyles();
  const [implYear, implMonth, implDate] = (content?.["アセスメント実施日"] ?? "").split("-");

  // ラベル表示の決定
  const staffLabel = useOriginalLabel ? 'アセスメント実施者' : '面談実施者';
  const dateLabel = useOriginalLabel ? 'アセスメント実施日時' : '面談実施日時';

  // 白紙表示時に、中身が空の場合のみ設定された高さを確保するためのスタイル取得関数
  // configKey: BLANK_HEIGHT_CONFIGのキー, contentKey: contentオブジェクトのキー（省略時はconfigKeyと同じ）
  const getBlankCellStyle = (configKey, contentKey = configKey) => {
    const val = content[contentKey];
    // 中身が空（または空白のみ）かどうかを判定
    const isEmpty = !val || (typeof val === 'string' && val.trim() === '');

    if (content.isBlank && isEmpty && BLANK_HEIGHT_CONFIG[configKey]) {
      return { height: `${BLANK_HEIGHT_CONFIG[configKey]}px`, verticalAlign: 'top' };
    }
    return {};
  };

  return(
    <table className={classes.contentTable}>
      <tbody>
        <tr><th>{staffLabel}</th><td>{wrapText(content["アセスメント実施者"])}</td></tr>
        <tr>
          <th>{dateLabel}</th>
          <td>
            {implYear && implMonth && implDate ? `${implYear}年${implMonth}月${implDate}日` : ""}
            {(content["開始時間"] || content["終了時間"]) && (
              <>　{content["開始時間"]}〜{content["終了時間"]}</>
            )}
          </td>
        </tr>
        {content['相談支援事業所'] && (
          <tr><th>相談支援事業所名</th><td>{wrapText(content['相談支援事業所'])}</td></tr>
        )}
        <tr><th>性別</th><td>{content["性別"]}</td></tr>
        <tr><th>電話番号</th><td>{user.pphone}</td></tr>
        <tr>
          <th>保護者名</th>
          <td>
            {user.pname}
            {content["保護者続柄"] ? `(${content["保護者続柄"]})` : ""}
            {content["実施対象者"] && (
              <>
                　アセスメント実施対象者：{content["実施対象者"]}
                {content["対象者続柄"] ? `(${content["対象者続柄"]})` : ""}
              </>
            )}
          </td>
        </tr>
        <tr><th>家族構成</th><td>{content["家族構成"]}</td></tr>
        <tr><th>アレルギー</th><td>{content["アレルギー"] || "なし"}</td></tr>
        <tr><th>症状</th><td style={getBlankCellStyle('症状')}>{content["症状"]}</td></tr>
        <tr>
          <th>得意なこと・好きなこと</th>
          <td style={getBlankCellStyle('得意')}>{content["得意"]}</td>
        </tr>
        <tr>
          <th>気をつけてほしいこと</th>
          <td style={getBlankCellStyle('気をつけてほしいこと', '注意事項')}>
            {safeBrtoLf(content["注意事項"])}
          </td>
        </tr>
        <tr><th>本人意向</th><td>{safeBrtoLf(content["本人意向"])}</td></tr>
        <tr><th>家族意向</th><td>{safeBrtoLf(content["家族意向"])}</td></tr>
      </tbody>
    </table>
  )
}

const DoctorTable = ({content}) => {
  const classes = useStyles();

  if(!content["病院名"] && !content["医師名"] && !content["病院連絡先"] && !content.isBlank) return null;

  return(
    <tbody>
      <tr><th colSpan={2} className='subTitle'>かかりつけ医</th></tr>
      <tr><td colSpan={2}>
        <table className={classes.contentTable}>
          <tbody>
            <tr><th>病院名</th><td>{content["病院名"]}</td></tr>
            <tr><th>医師名</th><td>{content["医師名"]}（{content["病院連絡先"]}）</td></tr>
          </tbody>
        </table>
      </td></tr>
      <tr><td colSpan={2} className='margin' /></tr>
    </tbody>
  )
}

const FiveDomainsTable = ({content}) => {
  const classes = useStyles();

  // 判定する関数（白紙登録対応）
  const hasContent = (value) => {
    if (content.isBlank) return true;
    if (!value) return false;
    return true;
  };

  const isExistFiveDomainsDt = Object.entries(FIVEDOMAINS_CLASS).some(([domain, labels]) => labels.some(label => hasContent(content[label])) );
  if(!isExistFiveDomainsDt) return null;

  const domainTrs = Object.entries(FIVEDOMAINS_CLASS).filter(([domain, labels]) => {
    return labels.some(label => hasContent(content[label]));
  }).map(([domain, labels]) => {
    const contents = labels.filter(label => {
      if(!hasContent(content[label])) return false;
      return true;
    }).map(label => (<div>{label}：{content[label]}</div>));
    return (
      <React.Fragment key={domain}>
      <tr><th>{domain}</th></tr>
      <tr><td><div style={{display: 'flex', flexWrap: 'wrap', columnGap: '32px'}}>{contents}</div></td></tr>
      </React.Fragment>
    )
  });

  return(
    <tbody>
      <tr><th colSpan={2} className='subTitle'>五領域支援チェック項目</th></tr>
      <tr><td colSpan={2}>
        <table className={classes.contentTable}>
          <tbody>
            {domainTrs}
          </tbody>
        </table>
      </td></tr>
      <tr><td colSpan={2} className='margin' /></tr>
    </tbody>
  )
}

const LifeWorkTable = ({content}) => {
  const classes = useStyles();
  const lifeWorks = content["生活歴"] ?? [];

  if(!lifeWorks.length && !content.isBlank) return null;

  // 判定する関数（白紙登録対応）
  const hasContent = (value) => {
    if (content.isBlank) return true;
    if (!value) return false;
    return true;
  };

  const trs = lifeWorks.filter(dt => {
    if(!hasContent(dt["項目"]) && !hasContent(dt["内容"])) return false;
    return true;
  }).map((dt, idx) => (
    <tr key={idx}><th style={{width: '100px'}}>{safeBrtoLf(dt["項目"])}</th><td>{safeBrtoLf(dt["内容"])}</td></tr>
  ));

  // 有効なデータが存在しない場合は表示しない
  if(trs.length === 0 && !content.isBlank) return null;

  return(
    <tbody>
      <tr><th colSpan={2} className='subTitle'>生活歴</th></tr>
      <tr><td colSpan={2}>
        <table className={classes.contentTable}>
          <thead>
            <tr><th style={{width: '100px'}}>項目</th><th>支援内容・留意事項</th></tr>
          </thead>
          <tbody>
            {trs}
          </tbody>
        </table>
      </td></tr>
      <tr><td colSpan={2} className='margin' /></tr>
    </tbody>
  )
}

const GeneralTable = ({content}) => {
  const classes = useStyles();

  // 判定する関数（白紙登録対応）
  const hasContent = (value) => {
    if (content.isBlank) return true;
    if (!value) return false;
    return true;
  };

  // 白紙表示時に、中身が空の場合のみ設定された高さを確保するためのスタイル取得関数
  const getBlankCellStyle = (configKey, contentKey) => {
    const val = content[contentKey];
    const isEmpty = !val || (typeof val === 'string' && val.trim() === '');

    if (content.isBlank && isEmpty && BLANK_HEIGHT_CONFIG[configKey]) {
      return { height: `${BLANK_HEIGHT_CONFIG[configKey]}px`, verticalAlign: 'top' };
    }
    return {};
  };

  const isExistGeneralDt = GENERAL_LABELS.some(key => hasContent(content[key]));
  if(!isExistGeneralDt) return null;

  const trs = GENERAL_LABELS.filter(label => {
    if(!hasContent(content[label])) return false;
    return true;
  }).map(label => {
    const question = inputDefinitions.find(def => def.label === label)?.question;
    const displayLabel = question ?? label;
    return(
      <tr key={label}><th style={{width: '100px'}}>{displayLabel}</th><td style={getBlankCellStyle(displayLabel, label)}>{safeBrtoLf(content[label])}</td></tr>
    )
  });

  return(
    <tbody>
      <tr><th colSpan={2} className='subTitle'>全般</th></tr>
      <tr><td colSpan={2}>
        <table className={classes.contentTable}>
          <thead>
            <tr><th style={{width: '100px'}}>項目</th><th>内容</th></tr>
          </thead>
          <tbody>
            {trs}
          </tbody>
        </table>
      </td></tr>
    </tbody>
  )
}

const HohouSupportTable = ({content}) => {
  const classes = useStyles();

  // 判定する関数（白紙登録対応）
  const hasContent = (value) => {
    if (content.isBlank) return true;
    if (!value) return false;
    return true;
  };

  // 保育所等訪問支援用のフィールドラベル
  const hohouLabels = [
    '訪問先種別',
    '在籍区分',
    '主な支援場面',
    '時間割/日課の要点',
    '合理的配慮/環境調整案',
    '訪問頻度',
    '直接と間接の配分'
  ];

  // いずれかのフィールドにデータが存在するかチェック
  const isExistHohouDt = hohouLabels.some(label => hasContent(content[label]));
  if(!isExistHohouDt) return null;

  const trs = hohouLabels.filter(label => {
    if(!hasContent(content[label])) return false;
    return true;
  }).map(label => {
    const labelDisplay = inputDefinitions.find(def => def.label === label)?.longLabel || label;
    return(
      <tr key={label}><th style={{width: '100px'}}>{labelDisplay}</th><td>{safeBrtoLf(content[label])}</td></tr>
    )
  });

  return(
    <tbody>
      <tr><th colSpan={2} className='subTitle'>保育所等訪問支援用</th></tr>
      <tr><td colSpan={2}>
        <table className={classes.contentTable}>
          <thead>
            <tr><th style={{width: '100px'}}>項目</th><th>内容</th></tr>
          </thead>
          <tbody>
            {trs}
          </tbody>
        </table>
      </td></tr>
      <tr><td colSpan={2} className='margin' /></tr>
    </tbody>
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
export const AssessmentSheet = (props) => {
  const classes = useStyles();
  const isMobile = useMediaQuery('(max-width:599px)');
  const {user, content, created, useOriginalLabel = false} = props;
  const [createdYear, createdMonth, createdDate] = created.split("-");

  const adjustedContent = processDeepBrToLf(content);

  // ── スマホ表示 ─────────────────────────────────────────────────────────────
  if (isMobile) {
    const staffLabel = useOriginalLabel ? 'アセスメント実施者' : '面談実施者';
    const dateLabel = useOriginalLabel ? 'アセスメント実施日時' : '面談実施日時';
    const [implYear, implMonth, implDate] = (adjustedContent?.["アセスメント実施日"] ?? "").split("-");
    const implDateStr = implYear && implMonth && implDate ? `${implYear}年${implMonth}月${implDate}日` : "";
    const timeStr = (adjustedContent["開始時間"] || adjustedContent["終了時間"])
      ? `　${adjustedContent["開始時間"]}〜${adjustedContent["終了時間"]}`
      : "";

    const lifeWorks = (adjustedContent["生活歴"] ?? []).filter(dt => dt["項目"] || dt["内容"]);

    // 五領域チェック項目（データがある領域のみ）
    const fiveDomainEntries = Object.entries(FIVEDOMAINS_CLASS).filter(([, labels]) =>
      labels.some(label => adjustedContent[label])
    );

    // 全般項目
    const generalEntries = GENERAL_LABELS.filter(label => adjustedContent[label]);

    // 保育所等訪問支援
    const hohouLabels = ['訪問先種別','在籍区分','主な支援場面','時間割/日課の要点','合理的配慮/環境調整案','訪問頻度','直接と間接の配分'];
    const hohouEntries = hohouLabels.filter(label => adjustedContent[label]);

    const hasDoctorInfo = adjustedContent["病院名"] || adjustedContent["医師名"] || adjustedContent["病院連絡先"];

    return (
      <div className={classes.spWrapper}>
        <div className={classes.spHeader}>
          <div className={classes.spTitle}>{user.name}さんのアセスメントシート</div>
          <div className={classes.spCreateDate}>作成日：{createdYear}年{createdMonth}月{createdDate}日</div>
        </div>

        <SpFieldBlock label={staffLabel} classes={classes}>
          {adjustedContent["アセスメント実施者"]}
        </SpFieldBlock>
        <SpFieldBlock label={dateLabel} classes={classes}>
          {implDateStr}{timeStr}
        </SpFieldBlock>
        {adjustedContent['相談支援事業所'] && (
          <SpFieldBlock label="相談支援事業所名" classes={classes}>
            {adjustedContent['相談支援事業所']}
          </SpFieldBlock>
        )}
        <SpFieldBlock label="性別" classes={classes}>{adjustedContent["性別"]}</SpFieldBlock>
        <SpFieldBlock label="電話番号" classes={classes}>{user.pphone}</SpFieldBlock>
        <SpFieldBlock label="保護者名" classes={classes}>
          {user.pname}
          {adjustedContent["保護者続柄"] ? `(${adjustedContent["保護者続柄"]})` : ""}
          {adjustedContent["実施対象者"] && (
            `\n実施対象者：${adjustedContent["実施対象者"]}${adjustedContent["対象者続柄"] ? `(${adjustedContent["対象者続柄"]})` : ""}`
          )}
        </SpFieldBlock>
        {adjustedContent["家族構成"] && (
          <SpFieldBlock label="家族構成" classes={classes}>{adjustedContent["家族構成"]}</SpFieldBlock>
        )}
        <SpFieldBlock label="アレルギー" classes={classes}>{adjustedContent["アレルギー"] || "なし"}</SpFieldBlock>
        {adjustedContent["症状"] && (
          <SpFieldBlock label="症状" classes={classes}>{adjustedContent["症状"]}</SpFieldBlock>
        )}
        {adjustedContent["得意"] && (
          <SpFieldBlock label="得意なこと・好きなこと" classes={classes}>{adjustedContent["得意"]}</SpFieldBlock>
        )}
        {adjustedContent["注意事項"] && (
          <SpFieldBlock label="気をつけてほしいこと" classes={classes}>{safeBrtoLf(adjustedContent["注意事項"])}</SpFieldBlock>
        )}
        {adjustedContent["本人意向"] && (
          <SpFieldBlock label="本人意向" classes={classes}>{safeBrtoLf(adjustedContent["本人意向"])}</SpFieldBlock>
        )}
        {adjustedContent["家族意向"] && (
          <SpFieldBlock label="家族意向" classes={classes}>{safeBrtoLf(adjustedContent["家族意向"])}</SpFieldBlock>
        )}

        {hasDoctorInfo && (
          <>
            <div className={classes.spSectionLabel}>かかりつけ医</div>
            {adjustedContent["病院名"] && (
              <SpFieldBlock label="病院名" classes={classes}>{adjustedContent["病院名"]}</SpFieldBlock>
            )}
            {(adjustedContent["医師名"] || adjustedContent["病院連絡先"]) && (
              <SpFieldBlock label="医師名" classes={classes}>
                {adjustedContent["医師名"]}（{adjustedContent["病院連絡先"]}）
              </SpFieldBlock>
            )}
          </>
        )}

        {fiveDomainEntries.length > 0 && (
          <>
            <div className={classes.spSectionLabel}>五領域支援チェック項目</div>
            {fiveDomainEntries.map(([domain, labels]) => {
              const checkedItems = labels.filter(l => adjustedContent[l]);
              if (!checkedItems.length) return null;
              return (
                <div key={domain} className={classes.spGoalCard}>
                  <div className={classes.spGoalHeader}>{domain}</div>
                  <div className={classes.spGoalBody}>
                    {checkedItems.map(label => (
                      <div key={label} style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
                        {label}：{adjustedContent[label]}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {lifeWorks.length > 0 && (
          <>
            <div className={classes.spSectionLabel}>生活歴</div>
            {lifeWorks.map((dt, idx) => (
              <div key={idx} className={classes.spGoalCard}>
                <div className={classes.spGoalHeader}>{safeBrtoLf(dt["項目"]) || `項目${idx + 1}`}</div>
                <div className={classes.spGoalBody} style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {safeBrtoLf(dt["内容"])}
                </div>
              </div>
            ))}
          </>
        )}

        {hohouEntries.length > 0 && (
          <>
            <div className={classes.spSectionLabel}>保育所等訪問支援用</div>
            {hohouEntries.map(label => {
              const labelDisplay = inputDefinitions.find(def => def.label === label)?.longLabel || label;
              return (
                <SpFieldBlock key={label} label={labelDisplay} classes={classes}>
                  {safeBrtoLf(adjustedContent[label])}
                </SpFieldBlock>
              );
            })}
          </>
        )}

        {generalEntries.length > 0 && (
          <>
            <div className={classes.spSectionLabel}>全般</div>
            {generalEntries.map(label => {
              const question = inputDefinitions.find(def => def.label === label)?.question;
              return (
                <SpFieldBlock key={label} label={question ?? label} classes={classes}>
                  {safeBrtoLf(adjustedContent[label])}
                </SpFieldBlock>
              );
            })}
          </>
        )}
      </div>
    );
  }

  // ── PC表示（git HEAD 完全復元） ───────────────────────────────────────────
  return(
    <div className={classes.sheetWrapper}>
      <SheetHeader user={user} created={created} title="アセスメントシート" />
      <table className={classes.sheet}>
        <tbody>
          <tr><td colSpan={2}><MainTable user={user} content={adjustedContent} useOriginalLabel={useOriginalLabel} /></td></tr>
          <tr><td colSpan={2} className='margin' /></tr>
        </tbody>
        <DoctorTable content={adjustedContent} />
        <FiveDomainsTable content={adjustedContent} />
        <LifeWorkTable content={adjustedContent} />
        <HohouSupportTable content={adjustedContent} />
        <GeneralTable content={adjustedContent} />
      </table>
    </div>
  )
}
