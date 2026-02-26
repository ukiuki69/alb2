import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Fab from '@material-ui/core/Fab';
import Button from '@material-ui/core/Button';
import FormatListNumberedIcon from '@material-ui/icons/FormatListNumbered';
import { blue, teal } from '@material-ui/core/colors';

const useStyles = makeStyles({
  '@keyframes brosOrderPulse': {
    '0%':   { opacity: 1,   transform: 'translateX(-50%) scale(1)' },
    '50%':  { opacity: 0.8, transform: 'translateX(-50%) scale(1.03)' },
    '100%': { opacity: 1,   transform: 'translateX(-50%) scale(1)' },
  },
  floatingInstruction: {
    position: 'fixed',
    bottom: 88,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 60,
    backgroundColor: teal[500],
    color: '#fff',
    padding: '12px 24px',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    whiteSpace: 'nowrap',
    animation: '$brosOrderPulse 2s ease-in-out infinite',
  },
  fab: {
    position: 'fixed',
    bottom: 88,
    right: 24,
    zIndex: 50,
    backgroundColor: blue[500],
    color: '#fff',
    '&:hover': {
      backgroundColor: blue[700],
    },
  },
  inlineFab: {
    position: 'relative',
    bottom: 'auto',
    right: 'auto',
  },
});

/**
 * /users/bros 専用の兄弟順番設定コンポーネント
 * 「順番設定」ボタン表示・順番設定モード中の案内フローティング表示を担当
 * @param {boolean} props.brosOrderMode - 順番設定モード中かどうか
 * @param {Function} props.onStart - 順番設定開始ハンドラー
 * @param {Function} props.onCancel - キャンセルハンドラー
 * @param {string} props.instruction - 案内テキスト
 * @param {boolean} props.inline - true のとき固定配置を行わない
 */
const BrosOrderSetter = ({ brosOrderMode, onStart, onCancel, instruction, inline = false }) => {
  const classes = useStyles();

  return (
    <>
      {/* 順番設定FAB（設定モード中は非表示） */}
      {!brosOrderMode && (
        <Fab
          className={`${classes.fab} ${inline ? classes.inlineFab : ''}`}
          onClick={onStart}
          size="medium"
          variant="extended"
          aria-label="兄弟順番設定"
        >
          <FormatListNumberedIcon style={{ marginRight: 8 }} />
          順番設定
        </Fab>
      )}
      {/* 順番設定モード中: 画面下部フローティング案内（2秒周期アニメーション） */}
      {brosOrderMode && (
        <div className={classes.floatingInstruction}>
          <span style={{ fontSize: '0.95rem' }}>{instruction}</span>
          <Button onClick={onCancel} style={{ color: '#fff', minWidth: 80 }}>
            キャンセル
          </Button>
        </div>
      )}
    </>
  );
};

export default BrosOrderSetter;
