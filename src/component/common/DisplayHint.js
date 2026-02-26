import React, { useEffect, useState } from 'react';
import { Button, Checkbox, FormControlLabel, makeStyles, Typography } from '@material-ui/core';
import { blue } from '@material-ui/core/colors';
import { Link as LinkIcon } from '@material-ui/icons';
import { Box } from '@material-ui/core';
import { getUisCookie, uisCookiePos } from '../../commonModule';

const notDispInterval = 1 * 60000;

const useStyles = makeStyles({
  root: {
    position: 'fixed',
    backgroundColor: blue[50],
    width: props => props.width || 300,
    left: props => (props.right == null ? props.left || 20 : "auto"),
    top: props => (props.bottom == null ? props.top || 20 : "auto"),
    right: props => props.right || "auto",
    bottom: props => props.bottom || "auto",
    padding: 8,
    animation: '$fadeIn 0.6s, $jump 11s infinite',
    opacity: 1,
    borderRadius: 3,
    boxShadow: '0px 3px 12px #999',
    '& .text': {
      marginBottom: 8,
      marginTop:8,
      textAlign: 'justify',
      lineHeight: 1.5,
    },
    '& .buttonWrap, .chkWrap': {
      textAlign: 'center'
    },
    '& .buttonWrap': {
      marginTop: 16,
      '& .MuiButton-root ': {
        padding: '5px 24px'
      }
    },
    '& a': {
      color: blue[800],
      display: 'inline-flex'
    },
  },
  '@keyframes fadeIn': {
    '0%': {
      opacity: 0,
    },
    '100%': {
      opacity: 1,
    },
  },
  '@keyframes jump': {
    '0%, 89%, 95%': {
      transform: 'translateY(0)',
    },
    '92%, 98%': {
      transform: 'translateY(-3px)',
    },
  },
});

const getMaxZIndex = () => {
  const elements = document.getElementsByTagName('*');
  let maxZ = 0;
  for (let i = 0; i < elements.length; i++) {
    const zIndex = window.getComputedStyle(elements[i]).zIndex;
    if (!isNaN(zIndex) && zIndex > maxZ) {
      maxZ = zIndex;
    }
  }
  return maxZ + 1;
};

// DisplayHint: 操作ヒントを表示するReactコンポーネント
// Props:
// - text: 表示するテキスト（stringまたはstringの配列）
// - links: 関連情報へのリンク（stringの配列）
// - left, top, bottom, right: 表示位置（ピクセル単位）
// - wdth: 表示幅（初期値200px）
// - id: ヒントのID
// - idBase: 同じグループで同じ値を持つ。今後表示しないが選択されたときに同じグループのidを
//   一定期間表示しない
// - hideHint: ヒントを表示するかどうかを指定するフラグ

const DisplayHint = (props) => {
  const {
    text, links, left, top, bottom, right, width, id, idBase, hideHint
  } = props;
  const classes = useStyles({ left, top, bottom, right, width });
  const [show, setShow] = useState(false);
  const [never, setNever] = useState(false);
  const [hintMinimum, setHintMinimum] = useState(
    getUisCookie(uisCookiePos.hintMinimum) === '1'
  );


  useEffect(() => {
    const timeout = setTimeout(() => {
      const storedValue = localStorage.getItem(`hint-${id}`);
      const grpTimeStamp = localStorage.getItem(`hint-${idBase}`)
      if (storedValue !== "true") {
        let shouldShow = !hideHint;
        // 前回表示した時刻を得る。一定時間経過しないと表示しない
        if (storedValue) {
          const storedTime = new Date(storedValue);
          const currentTime = new Date();
          if ((currentTime.getTime() - storedTime.getTime()) < notDispInterval) {
            shouldShow = false;
          }
        }
        // 同じidBaseを持つグループは一定期間表示しない
        if (grpTimeStamp){
          const storedTime = new Date(grpTimeStamp);
          const currentTime = new Date();
          if ((currentTime.getTime() - storedTime.getTime()) < notDispInterval) {
            shouldShow = false;
          }

        }
        setShow(shouldShow);
      }
    }, 2000);
  
    return () => {
      clearTimeout(timeout);
    };
  }, [id, hideHint]);
  
  const handleOk = () => {
    setShow(false);
    const currentTime = new Date().toISOString();
    if (never){
      localStorage.setItem(`hint-${id}`,"true");
      localStorage.setItem(`hint-${idBase}`, currentTime);
    }
    else{
      localStorage.setItem(`hint-${id}`, currentTime);
    }
  };
  const handleShowFullHint = () => {
    setHintMinimum(false);
  };

  const handleCheckboxChange = (event) => {
    setNever(event.target.checked);
    // localStorage.setItem(`hint${id}`, event.target.checked ? "true" : "false");
  };
  if (hintMinimum && show){
    return (
      <div className={classes.root} style={{ zIndex: getMaxZIndex() }}>
        Minimum
      </div>
    )
  }
  return (
    show &&
    <div className={classes.root} style={{ zIndex: getMaxZIndex() }}>
      <div className='text'>
        {Array.isArray(text)
          ? text.map((t, index) => <p key={index}>{t}</p>)
          : <p>{text}</p>}
      </div>
      {links && links.length > 1 && links.map((link, index) => (
        <Box display="flex" alignItems="center" key={index}>
          <a target='_blank' href={link}>
            <LinkIcon />
            <Typography>{`関連情報${index + 1}`}</Typography>
          </a>
        </Box>
      ))}
      {links && links.length === 1 &&
        <Box display="flex" alignItems="center">
          <a target='_blank' href={links[0]}>
            <LinkIcon />
            <Typography>{`関連情報`}</Typography>
          </a>
        </Box>
      }      
      <div className='buttonWrap'>
        <Button variant="contained" onClick={handleOk}>あとでまた知らせて</Button>
      </div>
      <div className='chkWrap'>
        <FormControlLabel
          control={<Checkbox checked={never} onChange={handleCheckboxChange} />}
          label="知ってるから大丈夫"
        />
      </div>
    </div>
  );
};

export default DisplayHint;
