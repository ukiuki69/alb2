import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import { teal } from '@material-ui/core/colors';

const useStyles = makeStyles((theme) => ({
  fab: {
    position: 'fixed',
    bottom: theme.spacing(3),
    right: theme.spacing(3),
    zIndex: 50,
    backgroundColor: teal[500],
    color: '#fff',
    '&:hover': {
      backgroundColor: teal[700],
    },
  },
  inlineFab: {
    position: 'relative',
    bottom: 'auto',
    right: 'auto',
  },
}));

/**
 * /users/kanri 専用のFABコンポーネント
 * @param {Object} props
 * @param {Function} props.onClick - FABクリック時のハンドラー
 * @param {string} props.ariaLabel - アクセシビリティ用のラベル
 * @param {string} props.label - ボタンラベル（指定時は extended 表示）
 * @param {boolean} props.inline - true のとき固定配置を行わない
 */
const KanriKyouryokuFab = ({ onClick, ariaLabel = '管理・協力表示操作', label = '', inline = false }) => {
  const classes = useStyles();

  if (!onClick) {
    return null;
  }

  return (
    <Fab
      className={`${classes.fab} ${inline ? classes.inlineFab : ''}`}
      onClick={onClick}
      aria-label={ariaLabel}
      color="primary"
      variant={label ? 'extended' : undefined}
      size="medium"
    >
      <AddIcon style={label ? { marginRight: 8 } : {}} />
      {label}
    </Fab>
  );
};

export default KanriKyouryokuFab;

