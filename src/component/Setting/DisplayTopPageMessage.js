import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, makeStyles, useMediaQuery } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import { grey } from '@material-ui/core/colors';
import { univApiCall } from '../../albCommonModule';

const useStyles = makeStyles({
  container: {
    transition: 'height 0.8s ease-in-out',
    height: '0px', // 初期状態
    overflow: 'hidden',
    position: 'relative',
    width: '100%', // 幅を100%に設定
    maxWidth: '100%', // 最大幅を制限
  },
  visibleContainer: {
    height: '48px', // 一行表示時の高さ
  },
  expanded: {
    height: '300px', // 拡張表示時の高さ
    overflowY: 'scroll',
  },
  singleLine: {
    display: 'flex',
    alignItems: 'center',
    height: '48px', // 固定の高さ
    paddingRight: '8px',
    width: '100%', // 幅を100%に設定
    boxSizing: 'border-box', // ボックスサイジングを設定
  },
  message: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    flexGrow: 1,
    fontSize: '.9rem',
    minWidth: 0, // flexアイテムの最小幅を0に設定
  },
  button: {
    flexShrink: 0,
    fontSize: '.9rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 8px',
    minWidth: 'auto', // 最小幅を自動に設定
  },
  expandedMessage: {
    whiteSpace: 'pre-wrap',
    padding: '8px',
    fontSize: '.9rem',
    wordBreak: 'break-word', // 長い単語を折り返し
  },
  alternatingRow: {
    backgroundColor: grey[100],
  },
  closeButton: {
    position: 'sticky',
    bottom: '0px',
    right: '8px',
    backgroundColor: grey[100],
    zIndex: 10,
    fontSize: '.9rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 8px',
    opacity: .8,
    '&:hover': {
      opacity: 1,
      backgroundColor: 'white', // 背景色も変わらないように指定
    },
  },
  // スマホビュー用のレスポンシブスタイル
  '@media (max-width: 500px)': {
    singleLine: {
      paddingRight: '4px', // パディングを縮小
      height: '40px', // 高さを少し縮小
    },
    message: {
      fontSize: '.8rem', // フォントサイズを縮小
    },
    button: {
      fontSize: '.8rem', // フォントサイズを縮小
      padding: '2px 4px', // パディングを縮小
      '& .MuiButton-startIcon': {
        marginRight: '2px', // アイコンのマージンを縮小
      },
    },
    expandedMessage: {
      fontSize: '.8rem', // フォントサイズを縮小
      padding: '6px', // パディングを縮小
    },
    closeButton: {
      fontSize: '.8rem', // フォントサイズを縮小
      padding: '2px 4px', // パディングを縮小
    },
  },
});

const DisplayTopPageMessages = () => {
  const limit500px = useMediaQuery("(max-width:500px)");
  const displayTime = 60 * 24 * 12; // 12日間
  const delaySec = 3; // 3秒
  const classes = useStyles();
  const [messages, setMessages] = useState([]); // メッセージ一覧
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [expandedDisp, setExpandedDisp] = useState(false);

  const [displayedMessage, setDisplayedMessage] = useState(null);

  useEffect(() => {
    const timeoutRef = setTimeout(async () => {
      setIsLoading(true);
      const prms = {
        hid: '', bid: '', date: '0000-00-00',
        item: 'topPageMessage',
        a: 'fetchAnyState',
      };
      const r = await univApiCall(prms);
      if (r?.data?.result && r?.data?.dt?.[0]?.state && !displayedMessage) {
        setMessages(r.data.dt[0].state);
      }
      setIsLoading(false);
    }, delaySec * 1000); // 3秒遅延

    return () => {
      clearTimeout(timeoutRef);
    };
  }, [displayedMessage]);

  useEffect(() => {
    if (isLoading && messages.length > 0) {
      const now = Date.now();

      // 5分以内の通常メッセージを確認
      const recentMessages = messages.filter(
        (msg) => !msg.fixed && now - msg.key <= displayTime * 60 * 1000
      );

      if (recentMessages.length > 0) {
        // 5分以内の新着通常メッセージがある場合、最新を表示
        const latestMessage = recentMessages.sort((a, b) => b.key - a.key)[0];
        setDisplayedMessage(latestMessage);
      } else {
        // 5分以内の新着がない場合、固定メッセージからランダムに1件表示
        const fixedMessages = messages.filter((msg) => msg.fixed);
        if (fixedMessages.length > 0) {
          const randomIndex = Math.floor(Math.random() * fixedMessages.length);
          setDisplayedMessage(fixedMessages[randomIndex]);
        }
      }
    }
  }, [isLoading, messages]);

  const handleExpandToggle = () => {
    setExpandedDisp(!expandedDisp);
    if (expanded){
      setTimeout(() => {
        setExpanded(!expanded);
      }, 1000 * .8);
    }
    else{
      setExpanded(!expanded);
    }
  };

  const handleLinkClick = (link) => {
    const isOwnDomain = link.startsWith(window.location.origin);
    if (isOwnDomain) {
      window.location.href = link;
    } else {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };
  return (
    <Box
      className={`
        ${classes.container} 
        ${displayedMessage && !expanded ? classes.visibleContainer : ''} 
        ${expandedDisp ? classes.expanded : ''} 
      `}
    >
      {/* 1行表示 */}
      {!isLoading && displayedMessage && !expanded && (
        <Box className={classes.singleLine}>
          <Typography
            variant="body1"
            className={classes.message}
            style={{ 
              color: displayedMessage.color || 'inherit', 
              cursor: displayedMessage.link? 'pointer': 'auto'
            }}
            onClick={() =>
              displayedMessage.link && handleLinkClick(displayedMessage.link)
            }
          >
            {displayedMessage.message}
          </Typography>
          <Button
            className={classes.button}
            startIcon={<ExpandMoreIcon />}
            onClick={handleExpandToggle}
          >
            もっと見る
          </Button>
        </Box>
      )}

      {/* エクスパンド表示 */}
      {expanded && (
        <>
          {messages
            .filter((msg) => msg.fixed === undefined || msg.key === displayedMessage?.key)
            .slice(0, 20)
            .map((msg, index) => (
              <React.Fragment key={msg.key}>
                <Typography
                  variant="body2"
                  className={`${classes.expandedMessage} ${index % 2 === 0 ? classes.alternatingRow : ''}`}
                  style={{ 
                    color: msg.color || 'inherit',
                    cursor: msg.link ? 'pointer' : 'auto'
                  }}
                  onClick={() => msg.link && handleLinkClick(msg.link)}
                >
                  {msg.message}
                  {msg.link && (
                    <Button 
                      variant="text" 
                      color="primary" 
                      onClick={() => handleLinkClick(msg.link)}
                    >
                      詳しく
                    </Button>
                  )}
                </Typography>
              </React.Fragment>
            ))}
          <Button
            className={classes.closeButton}
            endIcon={<ExpandLessIcon />}
            onClick={handleExpandToggle}
          >
            折りたたむ
          </Button>
        </>
      )}
    </Box>
  );
};

export default DisplayTopPageMessages;
