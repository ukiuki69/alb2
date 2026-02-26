import { makeStyles } from '@material-ui/core';
import React, { useState, useEffect } from 'react';
import { fetchAll } from '../../modules/thunks';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom/cjs/react-router-dom.min';

const noActivityTime = 5;

const useStyles = makeStyles({
  root: {
    textAlign: 'center',
    zIndex: 9999999,
    position: 'fixed',
    width: '100vw', height: '100vh',
    top: 0, left: 0,
    paddingTop: '35vh',
    background: '#000000aa',
    color: '#fff',
    cursor: 'pointer',
    '& .img': {
      width: '10vw', 
      marginLeft: '45vw', 
      marginTop: '5vh',
      animation: '$float 6s ease-in-out infinite',
    },
  },
  '@keyframes float': {
    '0%': {
      transform: 'translateY(0)',
    },
    '50%': {
      transform: 'translateY(-8px)',
    },
    '100%': {
      transform: 'translateY(0)',
    },
  },
});



const useActivityMonitor = () => {
  const [lastActivity, setLastActivity] = useState(new Date().getTime());

  useEffect(() => {
    const updateLastActivity = () => {
      setLastActivity(new Date().getTime());
    };

    window.addEventListener('keydown', updateLastActivity);
    window.addEventListener('mousemove', updateLastActivity);
    window.addEventListener('mousedown', updateLastActivity);

    return () => {
      window.removeEventListener('keydown', updateLastActivity);
      window.removeEventListener('mousemove', updateLastActivity);
      window.removeEventListener('mousedown', updateLastActivity);
    };
  }, []);

  return lastActivity;
};

const NoActivity = ({setShowModal}) =>{
  const classes = useStyles();
  const allState = useSelector(state=>state);
  const {hid, bid, stdDate, weekDayDefaultSet} = allState;
  const dispatch = useDispatch();
  const handleClick = () => {
    fetchAll({hid, bid, stdDate, dispatch});
    setShowModal(false);
  }
  return (
    <div className={classes.root} id = 'noactivity'
      onClick={handleClick}
    >
       クリックで作業に戻ります。
       <div className='img'>
        <img src = 'https://houday.rbatos.com/img/sleeping.svg'></img>
       </div>
    </div>
  )
}


// ページ遷移を追加
const NoActivityDetector = () => {
  const [showModal, setShowModal] = useState(false);
  const history = useHistory();
  const location = useLocation();
  const [prevPath, setPrevPath] = useState(location.pathname);
  const [wasInactive, setWasInactive] = useState(false); // 無操作状態を記録
  const { hid, bid, stdDate } = useSelector((s) => ({
    hid: s.hid, bid: s.bid, stdDate: s.stdDate
  }));
  const dispatch = useDispatch();
  // NoActivityを無視するパターンを定義
  const ignorePatterns = [
    /^\/contactbook\/edit.*/, 
    /^\/contactbook\/message.*/, 
    /^\/dailyreport\/form.*/,
    /^\/plan\/assessment.*/, /^\/plan\/monitoring.*/, /^\/plan\/personalSupport.*/,
    /^\/plan\/conferenceNote.*/, 
  ];
  const lastActivity = useActivityMonitor();
  const doHideOnBackDrop = () => {
    const elms = document.querySelectorAll('.hideBackDrop');
    elms.forEach(elm=>{
      elm.style.display = 'none'
    })
  }
  useEffect(() => {
    // URL変更を検出
    if (prevPath !== location.pathname) {
      setPrevPath(location.pathname);

      // 無操作が検出されていた場合のみfetchAllを実行
      if (wasInactive) {
        fetchAll({ hid, bid, stdDate, dispatch }); // handleClick相当の処理
        setWasInactive(false); // 状態をリセット
      }
    }
  }, [location.pathname, prevPath, wasInactive]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (Date.now() - lastActivity > noActivityTime * 60 * 1000) {
        const isIgnored = ignorePatterns.some(pattern => pattern.test(location.pathname));

        if (!isIgnored) {
          doHideOnBackDrop();
          setShowModal(true); // 通常のNoActivity処理を実行
        } else {
          setWasInactive(true); // 無操作状態を記録
        }
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [lastActivity, location.pathname]);


  return showModal ? <NoActivity setShowModal={setShowModal} /> : null;
};
export default NoActivityDetector;
