import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@material-ui/core';
import { teal } from '@material-ui/core/colors';

// スタイルを定義
const useStyles = makeStyles((theme) => ({
  tableRoot: {
    marginTop: 80,
    marginLeft: 68,
    width: 'calc(100vw - 68px)',
    overflow: 'auto',
  },
  tableContainer: {
    maxHeight: 'calc(100vh - 92px)',
    overflow: 'auto',
  },
  stickyHeader: {
    position: 'sticky',
    top: 0,
    backgroundColor: teal[50],
    zIndex: 1,
  },
  printOnly: {
    display: 'none',
  },
  '@media print': {
    tableContainer: {
      overflow: 'visible !important',
      maxHeight: 'none',  // 印刷時にmax-heightをリセット
    },
    stickyHeader: {
      position: 'relative',
      top: 0,
      display: 'table-header-group',
      pageBreakInside: 'avoid',
    },
    tableRoot: {
      pageBreakInside: 'avoid',
      margin: 0,
      width: '100%',
    },
    tr: {
      pageBreakInside: 'avoid',
    },
    thead: {
      display: 'table-header-group',
    },
    tbody: {
      display: 'table-row-group',
    },
    table: {
      pageBreakInside: 'auto',
      breakInside: 'auto',
    },
    printOnly: {
      display: 'block',  // 印刷時に表示
    },
  },
}));

const createData = (id, col1, col2, col3, col4, col5, col6, col7) => {
  return { id, col1, col2, col3, col4, col5, col6, col7 };
};

const rows = [];
for (let i = 0; i < 100; i++) {
  rows.push(createData(i, `DT ${i+1}-1`, `DT ${i+1}-2`, `DT ${i+1}-3`, `DT ${i+1}-4`, `DT ${i+1}-5`, `DT ${i+1}-6`, `DT ${i+1}-7`));
}

const StickyTable = () => {
  const classes = useStyles();

  return (
    <div className={classes.tableRoot}>
      <div className={`${classes.printOnly} printHeader`}>ヘッダ印刷時のみ表示</div>
      <TableContainer component={Paper} className={classes.tableContainer}>
        <Table className={classes.table}>
          <TableHead className={classes.stickyHeader}>
            <TableRow>
              <TableCell>Header 1</TableCell>
              <TableCell>Header 2</TableCell>
              <TableCell>Header 3</TableCell>
              <TableCell>Header 4</TableCell>
              <TableCell>Header 5</TableCell>
              <TableCell>Header 6</TableCell>
              <TableCell>Header 7</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.col1}</TableCell>
                <TableCell>{row.col2}</TableCell>
                <TableCell>{row.col3}</TableCell>
                <TableCell>{row.col4}</TableCell>
                <TableCell>{row.col5}</TableCell>
                <TableCell>{row.col6}</TableCell>
                <TableCell>{row.col7}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <div className={`${classes.printOnly} printHooter`}>フッタ印刷時のみ表示</div>
    </div>
  );
}

export default StickyTable;
