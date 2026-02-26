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
  }
});

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

export const SenmonShienSheet = (props) => {
  const com = useSelector(state => state.com);
  const classes = useStyles();
  const {user, content, created} = props;

  const adjustedContent = processDeepBrToLf(content);
  const hideGuardianSign = com?.ext?.reportsSetting?.usersPlan?.senmonShienHideGuardianSign ?? false;

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
              <>説明同意交付日付<span style={{paddingLeft: '32px'}}>
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
              </span></>
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