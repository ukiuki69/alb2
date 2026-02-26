import React, { useState } from "react";
import { Menu, MenuItem, Button, makeStyles } from "@material-ui/core";

// useStylesでスタイルを定義
const useStyles = makeStyles({
  root:{
    position: 'fixed', top: 88, right: 24, zIndex: 95,
    paddingTop: 10, paddingBottom: 10,
    '@media print':{display: 'none'},
  },
  button: {width: 168},
  buttonLabel: {
    display: "flex", flexDirection: "column", alignItems: "flex-start",
  },
  smallText: { fontSize: "0.6rem",},
  largeText: {fontSize: ".8rem",},
});

const OfficeSelectButton = ({ officeNo, setOfficeNo, officeList }) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (selectedNo) => {
    setAnchorEl(null);
    setOfficeNo(selectedNo);
  };

  // 選択中の事業所の名前を取得し、10文字を超える場合に短縮
  const selectedOffice = officeList.find((item) => item.no === officeNo);
  const formatName = (name) => {
    if (name.length > 10) {
      return `${name.slice(0, 4)}…${name.slice(-5)}`;
    }
    return name;
  };

  return (
    <div className={classes.root}>
      <Button className={classes.button}
        onClick={handleClick}
        classes={{ label: classes.buttonLabel }}
        color='primary'
        variant="contained"
      >
        {officeNo ? (
          <>
            <span className={classes.smallText}>選択中</span>
            <span className={classes.largeText}>
              {selectedOffice ? formatName(selectedOffice.name) : ""}
            </span>
          </>
        ) : (
          <>
            <span className={classes.smallText}>
              管理事業所・協力事業所が
            </span>
            <span className={classes.largeText}>
              選択できます
            </span>
          </>
        )}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleClose(officeNo)}
      >
        <MenuItem onClick={() => handleClose("")}>全て</MenuItem>
        {officeList.map((item) => (
          <MenuItem key={item.no} onClick={() => handleClose(item.no)}>
            {item.name}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
};

export default OfficeSelectButton;
