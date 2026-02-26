import React, { useState, useCallback, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button, IconButton } from "@material-ui/core";
import SearchIcon from '@material-ui/icons/Search';
import CloseIcon from '@material-ui/icons/Close';
import { width } from '@material-ui/system';
import { NoEncryption } from '@material-ui/icons';
import { seagull } from '../../modules/contants';

const useStyle = makeStyles({
  helpSearch:{
    padding: "6px",
  },
  modalWindow:{
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    '& .contants':{
      width: '35em',
      '& .search':{
        marginTop: "30vh",
        // width: "35em",
        height: "3em",
        backgroundColor: "#fff",
        borderRadius: "4px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0px 11px 15px -7px rgb(0 0 0 / 20%), 0px 24px 38px 3px rgb(0 0 0 / 14%), 0px 9px 46px 8px rgb(0 0 0 / 12%)",
        padding: "0 0.75em",
        '& .searchText':{
          width: "100%",
          height: "100%",
          fontSize: "1em",
          padding: "0 0.5em",
          backgroundColor: "transparent",
          outline: "none",
          border: "none",
          '&::placeholder':{
  
          },
        },
        '& .searchIcon':{
          padding: "0px"
        },
        '& .closeButton':{
          padding: "0px"
        }
      },
      '& .tagSearch':{
        padding: '0.5em',
        marginTop: '1em',
        borderRadius: "4px",
        backgroundColor: '#fff',
        '& .tagSearchTitle':{
          color: '#004d40',
          margin: '0.5em',
          textDecoration: 'none',
          borderBottom: 'solid #c3c3c3 1px',
          paddingBottom: 8,
        },
        '& .tagLinks':{
          marginTop: '0.75em',
          display: 'flex',
          flexWrap: 'wrap',
          // gap: '0.125em 0.125em',
          '& a':{
            textAlign: 'center',
            borderRadius: "4px",
            padding: "0.5em",
            color: "#616161",
            '&:hover':{
              color: "black",
              backgroundColor: "#eeeeee",
            }
          },
        },
      },
      '& .links': {
        padding: '0.5em',
        marginTop: '1em',
        borderRadius: "4px",
        backgroundColor: '#fff',

      }
    }
  }
})

const Modal = (props) => {
  const {show, setShow, classes} = props;

  const TagSearch = () => {
    const tagsearch_links = {
      "利用者編集": "users",
      "予定実績": "schedule",
      "上限管理": "upperlimit",
      "加算設定": "addiction",
      "売上管理": "proseed",
      "アカウント": "account",
      "設定": "setting",
      "請求": "billing",
      "福祉ソフト互換": "compatible",
    }

    const links = Object.keys(tagsearch_links).map(key => {
      const link = `https://rbatos.com/lp/tag/${tagsearch_links[key]}/`;
      return(
        <a href={link} target="_blank" onClick={e => setShow(false)} key={tagsearch_links[key]}>{key}</a>
      )
    })

    return(
      <div className='tagLinks'>{links}</div>
    )
  }

  const closeWithClickOutSide = (e) => {
    if(e.target === e.currentTarget){
      setShow(false)
    }
  }
  
  const handleSubmit = (e) => {
    const blog_url = "https://rbatos.com/lp/?s=";
    const search_value = document.getElementById("searchValue").value;
    const url = blog_url + search_value;
    window.open(url, "_blank");
    setShow(false);
  }

  const escFunction = useCallback((event) => {
    if (event.keyCode === 27) setShow(false);
  }, []);
  useEffect(() => {
    document.addEventListener("keydown", escFunction, false);
    return () => {
      document.removeEventListener('keydown', escFunction, false);
    }
  }, []);

  if(show){
    return(
      <div className={classes.modalWindow} onClick={e => closeWithClickOutSide(e)}>
        <div className='contants'>
          <form className='search' onSubmit={e => handleSubmit(e)}>
            <IconButton className="searchIcon">
              <SearchIcon style={{fontSize: "1.5em", color: "#00796b"}} />
            </IconButton>
            <input autoFocus type="text" id="searchValue" className='searchText' placeholder="ヘルプ検索"/>
            <IconButton type='button' className='closeButton' onClick={e => setShow(false)}>
              <CloseIcon style={{fontSize: "1.5em", color: "#9e9e9e"}}/>
            </IconButton>
          </form>
          <div className='tagSearch'>
            <div className='tagSearchTitle'>おすすめキーワード</div>
            <TagSearch />
          </div>
          <div className='links'>
            <a href='https://rbatos.com/lp/2024/09/12/%e3%83%98%e3%83%ab%e3%83%97%e3%82%a4%e3%83%b3%e3%83%87%e3%83%83%e3%82%af%e3%82%b9/'
              target='_blank'
            >
              <Button color='primary'>ヘルプインデックス</Button>
            </a>
            <a href='https://rbatos.com/lp/2024/11/26/faq%ef%bc%9a%e3%82%88%e3%81%8f%e3%81%82%e3%82%8b%e8%b3%aa%e5%95%8f/'
              target='_blank'
            >
              <Button color='primary'>よくある質問</Button>
            </a>
          </div>
        </div>
      </div>
    )
  }else{
    return null;
  }
}

export default () => {
  const classes = useStyle();
  const [show, setShow] = useState(false);
  const handleClick = () => {
    setShow(true);
  }
  if (seagull) return null;
  const prms = {show, setShow, classes};
  useEffect(() => {
    const target = document.querySelector('.sideToolBar');
    if (target) {
      target.style.display = show ? 'none' : 'block';
      // target.style.zIndex = show ? '1' : '2000';
    }
  }, [show]);
  
  return(
    <>
    <IconButton type="button" className={classes.helpSearch} onClick={handleClick}>
      <SearchIcon style={{fontSize: "1em", color: "#eeeeee"}}/>
    </IconButton>
    <Modal {...prms} />
    </>
  )
}