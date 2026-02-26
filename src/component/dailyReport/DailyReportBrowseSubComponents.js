import React from "react";
import {
  Button, ButtonGroup, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, makeStyles, Paper, Radio, RadioGroup, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography
} from "@material-ui/core";
import { deepOrange, grey, teal } from "@material-ui/core/colors";
import UserSelectDialogWithButton from "../common/UserSelectDialogWithButton";
import { getUser } from "../../commonModule";
import { getWdStyle, COLSPAN_ITEMS } from "./utils/browseHelpers";

export const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: 80,
    marginLeft: 72,
    width: 'calc(100vw - 82px)',
    '@media print': {
      marginTop: 0, marginLeft: 0, width: '100%',
    },
  },
  sidebar: {
    position: 'fixed',
    top: 128,
    left: 68,
    width: 200,
    height: 'calc(100vh - 128px)',
    overflowY: 'auto',
    padding: 8,
    boxSizing: 'border-box',
    '& .user': {
      width: '100%', 
      '& a': {
        paddingTop: 8, paddingBottom: 8,
        display: 'flex',
        '& .num': {
          width: 32, textAlign: 'center', fontSize: '.8rem',
          display: 'flex', alignItems: 'end', justifyContent: 'center',
        },
        '& .name': {},
      }
    },
    '@media print': {display: 'none'},
    '& .settingButton': {
      top: 96, position: 'fixed',
      '& .MuiSvgIcon-root': {color: teal[600]}
    },
    transition: 'width 0.3s ease',
  },
  tableContainer: {
    marginLeft: 200,
    position: 'relative',
    '@media print': { margin: 0, width: '100%' },
    transition: 'margin-left 0.3s ease',
  },

  stickyHeader: {
    position: 'sticky', top: 80,
    marginLeft: 200,
    backgroundColor: 'white',zIndex: 1,
    padding: '16px 0 8px',borderBottom: '1px solid #ccc',
    marginBottom: 16,
    display: 'flex', flexWrap: 'wrap',
    '& .checkbox':{flex: 1, flexBasis: "100%", paddingLeft: 16, paddingTop: 16},
    '& .buttonGroupeWarp':{flexBasis: 180},
    '& .buttonGroup': {height: 30, },
    '& .button': {
      padding: '4px 12px',
      fontSize: '0.875rem',
      lineHeight: '1.5',
    },
    '@media print': {display: 'none'},
    transition: 'width 0.3s ease',
  },
  stickyHeaderDate :{
    marginLeft: 128,
    transition: 'margin-left 0.3s ease',
  },
  tableContainerDate :{
    marginLeft: 128,
    '@media print': { margin: 0, width: '100%' },
    transition: 'margin-left 0.3s ease',
  },
  sidebarDate :{
    width: 128,
    transition: 'width 0.3s ease',
  },
  spacer: {
    height: 72,
  },
  tableCellName: { minWidth: 120 },
  nameSection: {
    marginBottom: 16, 
    marginLeft: 16,
    pageBreakInside: 'avoid',
    '& .ageStr': { fontSize: '.9rem', marginLeft: 16 },
    '& .san': { fontSize: '.7rem', marginLeft: 4 },
    '& .date': { width: 40, pageBreakInside: 'avoid', },
    '& .name': { width: 128, pageBreakInside: 'avoid', },
    '& .item': { width: 48 },
    '& .MuiTableCell-root': { padding: 8 },
    '& .MuiTableRow-root': { pageBreakInside: 'avoid', },
    '@media print': {
      '&:not(:first-child)': {pageBreakBefore: 'always',},
    },
    '& h6 span': {fontSize: '.8rem'}
  },
  nameSectionMulti:{
    '@media print': {
      '&:not(:first-child)': {pageBreakBefore: 'auto',},
    },
  },
  justifiedCell: {
    textAlign: 'justify',
    '&:after': {
      content: '""',
      display: 'inline-block',
      width: '100%',
    },
  },
  transferItems: {
    display: 'block',
    '& span': {
      marginInlineEnd: 8,
    },
  },
});

export const CheckBoxFilter = (props) => {
  const classes = useStyles();
  const {
    filters, setFilters, userList, setUserList, isDateView, setIsDateView, 
    specifiedDate, setSpecifiedDate
  } = props;
  const handleChange = (event) => {
    setFilters({
      ...filters,
      [event.target.name]: event.target.checked,
    });
  };

  const handleViewChange = (view) => {
    setIsDateView(view === 'date');
  };

  return (
    <div className={`${classes.stickyHeader} ${isDateView ? classes.stickyHeaderDate : ''}`} >
      <div className="buttonGroupeWarp">
        <ButtonGroup size="small" variant="contained" color="primary" className="buttonGroup">
          <Button
            onClick={() => handleViewChange('user')}
            variant={!isDateView ? 'contained' : 'outlined'}
            className="button"
          >
            利用者別
          </Button>
          <Button
            onClick={() => handleViewChange('date')}
            variant={isDateView ? 'contained' : 'outlined'}
            className="button"
          >
            日付別
          </Button>
        </ButtonGroup>        
      </div>
      {isDateView &&
        <div className="buttonGroupeWarp">
          <ButtonGroup size="small" variant="contained" color="primary" className="buttonGroup">
            <Button
              onClick={() => setSpecifiedDate(false)}
              variant={specifiedDate === false ? 'contained' : 'outlined'}
              className="button"
            >
              複数日付
            </Button>
            <Button
              onClick={() => setSpecifiedDate(true)}
              variant={specifiedDate !== false ? 'contained' : 'outlined'}
              className="button"
            >
              単独日付
            </Button>
          </ButtonGroup>        
        </div>
      }

      <UserSelectDialogWithButton 
        userList={userList} setUserList={setUserList} 
        lsName="userlistDailyReportBrowse"
      />
      <div className="checkbox">
        <FormControlLabel
          control={
            <Checkbox
              checked={Object.values(filters).every(val => val)}
              onChange={(e) => {
                const newVal = e.target.checked;
                const newFilters = {};
                Object.keys(filters).forEach((key) => {
                  newFilters[key] = newVal;
                });
                setFilters(newFilters);
              }}
            />
          }
          label="全て"
        />
         {Object.keys(filters).map((filterKey) => (
           <FormControlLabel
             key={filterKey}
             control={
               <Checkbox
                 name={filterKey} 
                 checked={filters[filterKey]} 
                 onChange={handleChange} 
               />
             }
             label={filterKey}
           />
         ))}
      </div>
    </div>
  );
};

export const PrintOptionDialog = ({ open, onClose, printOption, setPrintOption, isDateView }) => {
  const labelValue = isDateView? '日付': '利用者';
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>印刷改ページ設定</DialogTitle>
      <DialogContent>
        <RadioGroup
          value={printOption}
          onChange={(e) => setPrintOption(e.target.value)}
        >
          <FormControlLabel 
            value="single" control={<Radio />} 
            label={`${labelValue}ごとに改ページする`}
          />
          <FormControlLabel 
            value="multiple" control={<Radio />} 
            label={`${labelValue}ごとに改ページしない`}
          />
        </RadioGroup>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={onClose}>OK</Button>
      </DialogActions>
    </Dialog>
  )
};

// --- 日付ビュー用テーブル行 ---
export const DateViewTableRow = ({ row, array }) => {
  const sameNameEntries = array.filter(r => r.name === row.name);
  const isFirstOccurrence = sameNameEntries[0] === row;
  const isColSpanItem = COLSPAN_ITEMS.includes(row.item);
  return (
    <TableRow>
      {isFirstOccurrence && (
        <TableCell rowSpan={sameNameEntries.length} className="name">
          {row.name}
        </TableCell>
      )}
      {isColSpanItem ? (
        <TableCell colSpan={2} dangerouslySetInnerHTML={{ __html: row.content }} />
      ) : (
        <>
          <TableCell className="item" dangerouslySetInnerHTML={{ __html: row.item }} />
          <TableCell dangerouslySetInnerHTML={{ __html: row.content }} />
        </>
      )}
    </TableRow>
  );
};

// --- 利用者ビュー用テーブル行 ---
export const UserViewTableRow = ({ row, array }) => {
  const sameDateEntries = array.filter(r => r.date === row.date);
  const isFirstOccurrence = sameDateEntries[0] === row;
  const hasDateHtml = typeof row.date === 'string' && row.date.includes('<br>');
  return (
    <TableRow>
      {isFirstOccurrence && (
        <TableCell rowSpan={sameDateEntries.length} className="date">
          {hasDateHtml
            ? <span dangerouslySetInnerHTML={{ __html: row.date }} />
            : row.date
          }
        </TableCell>
      )}
      {row.item === '利用時間' ? (
        <TableCell colSpan={2} dangerouslySetInnerHTML={{ __html: row.content }} />
      ) : (
        <>
          <TableCell className="item" dangerouslySetInnerHTML={{ __html: row.item }} />
          <TableCell dangerouslySetInnerHTML={{ __html: row.content }} />
        </>
      )}
    </TableRow>
  );
};

// --- サイドバー: 日付アイテム ---
export const SidebarDateItem = ({ id, index, stdDate, processedData, dateList, history, location, handleScroll, specifiedDate, setSpecifiedDate }) => {
  const did = 'D' + stdDate.split('-')[0] + id.replace('/', '');
  if (!processedData[id] || processedData[id].length === 0) return null;
  const day = Number(id.split('/')[1]);
  const holiday = dateList.find(e => e.date.getDate() === day).holiday;
  const wdStyle = getWdStyle(holiday);
  return (
    <div className="user">
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          history.push(`${location.pathname}#${id}`);
          handleScroll(id);
          setSpecifiedDate(specifiedDate ? did : false);
        }}
      >
        <div className="num">{index + 1}. </div>
        <div className="name" style={wdStyle}>{`${id}`}</div>
      </a>
    </div>
  );
};

// --- サイドバー: 利用者アイテム ---
export const SidebarUserItem = ({ id, index, users, history, location, handleScroll }) => {
  const user = getUser(id, users);
  if (!user) return null;
  return (
    <div className="user">
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          history.push(`${location.pathname}#${id}`);
          handleScroll(id);
        }}
      >
        <div className="num">{index + 1}. </div>
        <div className="name">{user.name}</div>
      </a>
    </div>
  );
};

// --- 日付ビューのテーブルセクション ---
export const DateViewSection = ({ processedData, dateList, stdDate, specifiedDate, classes, nameSectionMulti }) => {
  return Object.keys(processedData).sort((a, b) => (a < b ? -1 : 1)).map((date, dateIndex) => {
    const dateEntries = processedData[date];
    if (!dateEntries.length) return null;
    const day = Number(date.split('/')[1]);
    const dateItem = dateList.find(e => e.date.getDate() === day);
    const dayOfW = ['日','月','火','水','木','金','土'][dateItem.date.getDay()];
    const wdStyle = getWdStyle(dateItem.holiday);
    const did = 'D' + stdDate.split('-')[0] + date.replace('/', '');
    if (specifiedDate && specifiedDate !== true && specifiedDate !== did) return null;

    return (
      <div key={dateIndex} id={date} className={`${classes.nameSection} ${nameSectionMulti}`}>
        <Typography variant="h6" style={wdStyle}>{`${date}`}<span>（{dayOfW}）</span></Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className="name">利用者</TableCell>
                <TableCell className="item">項目</TableCell>
                <TableCell>内容</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dateEntries.map((row, index, array) => (
                <DateViewTableRow key={index} row={row} array={array} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    );
  });
};

// --- 利用者ビューのテーブルセクション ---
export const UserViewSection = ({ processedData, uniqueIds, classes, nameSectionMulti }) => {
  return uniqueIds.map((uid, uidIndex) => {
    const userEntries = processedData.filter((row) => row.uid === uid);
    if (userEntries.length === 0) return null;
    const { name, ageStr } = userEntries[0];

    return (
      <div key={uidIndex} id={uid} className={`${classes.nameSection} ${nameSectionMulti}`}>
        <Typography variant="h6">
          {name}<span className="san">さん</span>
          <span className="ageStr">{ageStr}</span>
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className="date">日付</TableCell>
                <TableCell className="item">項目</TableCell>
                <TableCell>内容</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userEntries.map((row, index, array) => (
                <UserViewTableRow key={index} row={row} array={array} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    );
  });
};
