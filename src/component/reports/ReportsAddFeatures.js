import { makeStyles, TextField } from '@material-ui/core';
import React, { useState } from 'react';
import { useDispatch, useSelector, } from 'react-redux';
import * as comMod from '../../commonModule';

import Button from '@material-ui/core/Button';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import { lightBlue } from '@material-ui/core/colors';
import SnackMsg from '../common/SnackMsg';

const useStyles = makeStyles({
    invoiceOpt: {
        display: 'flex',
        flexDirection: 'column',
        '& .opts': {
            display: 'flex',
            justifyContent: "end",
            justifyContent: 'space-between',
            padding: 8
        },
        '& .comment': {
            marginTop: 4,
            padding: '0 8px',
            '& .commentButtons': {
                textAlign: 'end',
                marginTop: 8
            }
        }
    }
})

export const convStrToZenspace = (str, triger=false) => {
    let result = "";
    if(triger){
        for(let i=0; i<str.length; i++){
            result += "　";
        }
    }else{
        result = str;
    }

    return result;
}


export const InvoiceOpt = () => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const allstate = useSelector(state=>state);
    const {com, hid, bid} = allstate;
    const [snack, setSnack] = useState({});

    const notice = com?.ext?.reportsSetting?.invoice?.notice ?? com?.etc?.reports?.invoice?.notice ?? "";
    const [displayDate, setDisplayDate] = useState(com?.ext?.reportsSetting?.invoice?.displayDate ?? com?.etc?.configReports?.invoice?.displayDate ?? true);
    const [displayNotice, setDisolayNotice] = useState(com?.ext?.reportsSetting?.invoice?.displayNotice ?? com?.etc?.configReports?.invoice?.displayNotice ?? true);
    const [comment, setComment] = useState(notice ?comMod.brtoLf(notice) :"");
    const [openForm, setOpenForm] = useState(false);

    const DisplayDate = () => {
        const handleChange = (ev) => {
            setDisplayDate(ev.target.checked);
        }
    
        return(
            <FormControlLabel
                control={
                    <Checkbox
                    checked={(displayDate)}
                    onChange={handleChange}
                    name='displayDate'
                    color="primary"
                    />
                }
                label='日付表示'
            />
        )
    }
    
    const DisplayNotice = () => {
        const handleChange = (ev) => {
            setDisolayNotice(ev.target.checked);
        }
    
        return(
            <FormControlLabel
                control={
                    <Checkbox
                    checked={(displayNotice)}
                    onChange={(ev)=>handleChange(ev)}
                    name='displayNotice'
                    color="primary"
                    />
                }
                label='備考表示'
            />
        )
    }
    
    const DisplayOptButton = () => { 
        const comExt = {...com?.ext};
        if(!comExt.reportsSetting) comExt.reportsSetting = {};
        if(!comExt.reportsSetting.invoice) comExt.reportsSetting.invoice = {};
        const handleClick = async () => {
            comExt.reportsSetting.invoice["displayDate"] = displayDate;
            comExt.reportsSetting.invoice["displayNotice"] = displayNotice;
            const sendPrms = {
                a: "sendComExt", hid, bid,
                ext: JSON.stringify(comExt)
            };
            const res = await univApiCall(sendPrms);
            if(!res?.data?.result){
                setSnack({msg: '保存に失敗しました。', severity: 'warning', id: new Date().getTime()});
                return;
            }
            dispatch(setStore({com: {...com, ext: comExt}}));
            dispatch(setSnackMsg('保存しました。'));
        }
    
        return(
            <Button
                variant='contained'
                name='帳票オプション書き込み'
                onClick={()=>handleClick()}
            >
                登録
            </Button>
        )
    }

    const clickCommentSendButton = async () => {
        const comExt = {...com?.ext};
        if(!comExt.reportsSetting) comExt.reportsSetting = {};
        if(!comExt.reportsSetting.invoice) comExt.reportsSetting.invoice = {};
        comExt.reportsSetting.invoice.notice = comMod.lfToBr(comment);
        const sendPrms = {
            a: "sendComExt", hid, bid,
            ext: JSON.stringify(comExt)
        };
        const res = await univApiCall(sendPrms);
        if(!res?.data?.result){
            setSnack({msg: '保存に失敗しました。', severity: 'warning', id: new Date().getTime()});
            return;
        }
        dispatch(setStore({com: {...com, ext: comExt}}));
        setOpenForm(false);
    }

    return(
        <>
        <div className={`${classes.invoiceOpt} reportCntRow`} style={{marginBottom: 32}}>
            <div className='opts'>
                <Button
                    variant="contained"
                    disabled={openForm}
                    style={{opacity: openForm ?0 :1}}
                    color='primary'
                    onClick={() => setOpenForm(!openForm)}
                >
                    コメント追加・編集
                </Button>
                <div>
                    <DisplayDate />
                    <DisplayNotice />
                    <DisplayOptButton />
                </div>
            </div>
            {openForm
                ?<div className='comment'>
                    <TextField
                        id="outlined-multiline-flexible"
                        variant="outlined"
                        label="コメント"
                        multiline
                        maxRows={4}
                        value={comment ?comment :""}
                        style={{width: '100%'}}
                        onChange={e => setComment(e.target.value)}
                    />
                    <div className='commentButtons'>
                        <Button
                            variant='contained'
                            style={{marginRight: 8, backgroundColor: lightBlue[800], color: 'white'}}
                            onClick={() => {setComment(originComment); setOpenForm(false)}}
                        >
                            キャンセル
                        </Button>
                        <Button
                            variant='contained'
                            color="primary"
                            onClick={clickCommentSendButton}
                        >
                            書き込み
                        </Button>
                    </div>
                </div>
                :comment ?<div className='comment'>
                    {/* {originComment} */}
                    <TextField
                        // id="outlined-multiline-flexible"
                        variant="outlined"
                        label="コメント"
                        disabled={!openForm}
                        multiline
                        maxRows={4}
                        value={comment}
                        style={{width: '100%'}}
                        onChange={e => setComment(e.target.value)}
                    />
                </div> :null
            }
        </div>
        <SnackMsg {...snack} />
        </>
    )
}