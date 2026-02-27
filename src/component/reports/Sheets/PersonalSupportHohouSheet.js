import { makeStyles } from '@material-ui/core';
import { grey } from '@material-ui/core/colors';
import React from 'react';
import { useSelector } from 'react-redux';
import { processDeepBrToLf } from '../../../modules/newlineConv';
import { safeBrtoLf } from '../../../modules/safeBrtoLf';
import { SheetHeader } from './SheetHeader';
import { parseDate } from '../../../commonModule';

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
  }
});

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
        <tr><th>長期目標<br />（内容・期間等）</th><td colSpan={2}>{safeBrtoLf(content["長期目標"])}</td></tr>
        <tr><th>短期目標<br />（内容・期間等）</th><td colSpan={2}>{safeBrtoLf(content["短期目標"])}</td></tr>
        {/* <tr><th>送迎</th><td colSpan={2}>迎え：{content["迎え"]}<br />送り：{content["送り"]}</td></tr> */}
      </tbody>
    </table>
  )
}

const SupportContentTable = ({content}) => {
  const classes = useStyles();

  const trs = (content["支援目標"] ?? []).map((dt, idx) => {
    const categoryStr = (dt?.["五領域"] ?? "").replaceAll(",", " ／ ").replace("言語・コミュ", "言語・コミュニケーション");
    return (
      <React.Fragment key={idx}>
        <tr>
          <th style={{width: '60px'}}>{safeBrtoLf(dt["項目"])}</th>
          <td>{safeBrtoLf(dt["支援目標"])}</td>
          <td>{safeBrtoLf(dt["支援内容"])}</td>
          <td>{safeBrtoLf(dt["達成期間"])}ヶ月</td>
        </tr>
        {categoryStr.trim() && (
          <tr>
            <td colSpan={4}>五領域との関係性：{categoryStr}</td>
          </tr>
        )}
      </React.Fragment>
    );
  });

  return(
    <table className={classes.contentTable}>
      <thead>
        <tr>
          <th style={{width: '30px'}}>項目（本人  のニーズ等）</th>
          <th style={{width: '70px'}}>具体的な達成目標</th>
          <th>支援内容</th>
          <th style={{width: '20px'}}>達成<br />時期</th>
        </tr>
      </thead>
      <tbody>
        {trs}
      </tbody>
    </table>
  )
}

export const PersonalSupportHohouSheet = (props) => {
  const classes = useStyles();
  const {user, content, created, isOriginal} = props;
  const com = useSelector(state => state.com);
  const showStaffName = com?.ext?.reportsSetting?.usersPlan?.monitoringShowStaffName ?? com?.etc?.configReports?.usersPlan?.monitoringShowStaffName ?? false;
  
  const adjustedContent = processDeepBrToLf(content);

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
        {!isOriginal &&(
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