import React, { useEffect, useState, useRef } from 'react';
import { Button, Checkbox, FormControlLabel, makeStyles, Typography, Box } from '@material-ui/core';
import { blue, teal } from '@material-ui/core/colors';
import { Link as LinkIcon } from '@material-ui/icons';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';

const dev = false;
const oneDay = 24 * 60 * 60 * 1000;
const oneMin = 60 * 1000; // 1 min
const notDispShort =  60 * 30 * 1000;
const autoHideDelay = dev? 60 * 1000: 30 * 1000
const notDispInterval = dev? oneMin: oneDay;
const displayDelay = 5000; // 5 seconds
const fadeOutDuration = 1 * 1000; // 1sec

const useStyles = makeStyles({
  root: {
    zIndex: 8900,
    position: 'fixed',
    backgroundColor: teal[50],
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
    '& .infoIcon': {
      textAlign: 'center',
      '& .MuiSvgIcon-root': {color: teal[800], fontSize: '3rem',},
    },
    '& .text': {
      marginBottom: 8,marginTop:8,textAlign: 'justify',lineHeight: 1.5,
    },
    '& .buttonWrap, .chkWrap': {
      textAlign: 'center'
    },
    '& .buttonWrap': {
      marginTop: 16,
      '& .MuiButton-root ': {padding: '5px 24px'}
    },
    '& a': {
      color: blue[800],
      display: 'inline-flex'
    },
    '& img': {
      display: 'block', width: '100%', borderRadius: 2, 
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

// このコードは、ユーザーに操作方法のヒントを表示するReactコンポーネントです。
// プロパティとして、表示するテキスト、関連情報へのリンク、表示位置、表示幅、
// ヒントのID、ヒントグループ名、ヒントの表示フラグ、画像のURL、画像の幅などを受け取ります。
// ヒントは指定された遅延後に表示され、指定された時間が経過するとフェードアウトします。
// ユーザーはヒントを閉じたり、今後表示しないように選択することができます。

// localStorageの仕様について:
// 1. ヒントの表示状態の保存:
//    - キー: `hint-${id}`（`${id}`はヒントのID）
//    - 値:
//      - "true": ユーザーが「知ってるから大丈夫」を選択した場合、このヒントは今後表示されない。
//      - ISO形式の日付文字列: ユーザーが「あとで知らせて」を選択した場合、
//        このヒントの最後の表示時刻が保存される。
//
// 2. ヒントグループの表示状態の保存:
//    - キー: `hint-${hintGroupName}`（`${hintGroupName}`はヒントグループ名）
//    - 値: ISO形式の日付文字列: ユーザーが「知ってるから大丈夫」を選択し、ヒントグループ
//      全体が表示されないように選択された場合、その時刻が保存される。
//
// 3. ヒントの表示ロジック:
//    - ユーザーが「知ってるから大丈夫」を選択したヒントは、今後表示されない。
//    - ユーザーが「あとで知らせて」を選択したヒントは、一定時間（`notDispInterval`）
//      経過するまで表示されない。
//    - ユーザーがヒントグループ全体を表示しないように選択した場合、一定時間
//      （`notDispInterval`）経過するまで、そのグループのヒントは表示されない。

const DisplayHint = (props) => {
  const {
    text, // 表示するテキスト（stringまたはstringの配列）
    links, // 関連情報へのリンク（stringの配列）
    left, top, bottom, right, // 表示位置（ピクセル単位）
    width, // 表示幅（初期値200px）
    id, // ヒントのID
    hintGroupName, // 同じグループで同じ値を持つ。今後表示しないが選択されたときに同じグループのidを一定期間表示しない
    hideHint, // ヒントを表示するかどうかを指定するフラグ
    img, // 画像のURL
    imgWidth // 画像の幅
  } = props;


  const classes = useStyles({ left, top, bottom, right, width });
  const [show, setShow] = useState(false);
  const [never, setNever] = useState(false);

  const hintRef = useRef(null);

  useEffect(() => {
    // ヒントを表示するためのタイムアウト設定
    const timeout = setTimeout(() => {
      // ローカルストレージからヒントの表示情報を取得
      const storedValue = localStorage.getItem(`hint-${id}`);
      const grpTimeStamp = localStorage.getItem(`hint-${hintGroupName}`);
  
      // ヒントがまだ表示されていない場合
      if (storedValue !== "true") {
        let shouldShow = !hideHint;
  
        // 前回表示した時刻を取得し、一定時間経過していない場合は表示しない
        if (storedValue) {
          const storedTime = new Date(storedValue);
          const currentTime = new Date();
          if ((currentTime.getTime() - storedTime.getTime()) < notDispInterval) {
            shouldShow = false;
          }
        }
  
        // 同じヒントグループの表示時刻を取得し、一定時間経過していない場合は表示しない
        if (grpTimeStamp) {
          const storedTime = new Date(grpTimeStamp);
          const currentTime = new Date();
          if ((currentTime.getTime() - storedTime.getTime()) < notDispInterval) {
            shouldShow = false;
          }
        }
  
        // 上記の条件を満たす場合、ヒントを表示
        setShow(shouldShow);
      }
    }, displayDelay);
  
    // ヒントを自動的に非表示にするためのタイムアウト設定
    const autoHideTimeout = setTimeout(() => {
      if (hintRef.current) {
        // フェードアウトアニメーションの設定
        hintRef.current.style.transition = `opacity ${fadeOutDuration}ms`;
        hintRef.current.style.opacity = 0;
        const currentTime = new Date().toISOString();

        if (never){
          localStorage.setItem(`hint-${id}`,"true");
          localStorage.setItem(`hint-${hintGroupName}`, currentTime);
        }
        else{
          localStorage.setItem(`hint-${id}`, currentTime);
        }
      }
    }, autoHideDelay + displayDelay);
  
    // コンポーネントのクリーンアップ時にタイムアウトをクリア
    return () => {
      clearTimeout(timeout);
      clearTimeout(autoHideTimeout);
    };
  }, [id, hideHint]); // 依存配列：idとhideHintが変更された場合に再実行
  

  const handleOk = () => {
    setShow(false);
    const currentTime = new Date().toISOString();
    if (never){
      localStorage.setItem(`hint-${id}`,"true");
      localStorage.setItem(`hint-${hintGroupName}`, currentTime);
    }
    else{
      localStorage.setItem(`hint-${id}`, currentTime);
    }
  };

  const handleCheckboxChange = (event) => {
    setNever(event.target.checked);
  };
  const imgStyle = imgWidth? {width: imgWidth, margin: '0 auto'}: {};

  return (
    show &&
    <div className={classes.root} ref={hintRef}>
      {img && <img src={img}  style={imgStyle} alt="Hint" />}
      {!img && <div className='infoIcon'><InfoOutlinedIcon/></div>}
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
        <Button id='hintGoAway' variant="contained" onClick={handleOk}>
          {never && '閉じる'}
          {!never && 'あとで知らせて'}
          
        </Button>
      </div>
      <div className='chkWrap'>
        <FormControlLabel
          id='hintIKouw'
          control={<Checkbox checked={never} onChange={handleCheckboxChange} />}
          label="知ってるから大丈夫"
        />
      </div>
    </div>
  );
};

/**
 * DisplayHintGroups: ヒントグループを表示するReactコンポーネント
 * Props:
 * - hintGroupName: ヒントグループの名前（string）
 * - hintList: 表示するヒントのリスト（オブジェクトの配列）
 * - commonPrms: 全てのヒントに共通するプロパティ（オブジェクト）
 *
 * localStorageの仕様:
 * - キー: `hint-${hintGroupName}-${hint.id}` は個別のヒントの表示状態
 * - キー: `hint-last-${hintGroupName}` は最後に表示されたヒントのID
 */
const DisplayHintGroups = ({ hintGroupName, hintList = [], commonPrms = {} }) => {
  const [selectedHint, setSelectedHint] = useState(null);

  useEffect(() => {
    // 最後に表示されたヒントのIDを取得
    const lastHintId = localStorage.getItem(`hint-last-${hintGroupName}`);
    let sortedList = [...hintList];

    // 最後に表示されたヒントがあれば、リストの最後に移動
    if (lastHintId) {
      const lastHintIndex = sortedList.findIndex(hint => hint.id === lastHintId);
      if (lastHintIndex !== -1) {
        const lastHint = sortedList.splice(lastHintIndex, 1)[0];
        sortedList.push(lastHint);
      }
    }

    // 未表示のヒントを選択し、最後に表示されたヒントとして保存
    for (let hint of sortedList) {
      const storageValue = localStorage.getItem(`hint-${hintGroupName}-${hint.id}`);
      if (storageValue !== "true") {
        const v = {...hint, id: `${hintGroupName}-${hint.id}`}
        setSelectedHint(v);
        localStorage.setItem(`hint-last-${hintGroupName}`, hint.id);
        break;
      }
    }
  }, [hintGroupName, hintList]);

  // 選択されたヒントがなければ何も表示しない
  if (!selectedHint) {
    return null;
  }

  const hintProps = { ...selectedHint, ...commonPrms, hintGroupName};
  return (
    <div style={{position:'relative'}}>
      <DisplayHint {...hintProps} />
    </div>
  );
};


export { DisplayHint, DisplayHintGroups };
