import React, { useEffect, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, withStyles } from "@material-ui/core";
import { useSelector } from 'react-redux';
import { formatDate, getLodingStatus, isMailAddress, randomStr } from '../../commonModule';
import { AlbHMuiTextField2, sendMail } from './HashimotoComponents';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import { grey, red } from '@material-ui/core/colors';
import CloseIcon from '@material-ui/icons/Close';
import axios from 'axios';
import SnackMsg from './SnackMsg';

// 最大APIリトライ回数
const API_MAXRETRY = 5;
// 最大添付ファイル数
const MAX_FILE_COUNT = 5;
// 添付可能なファイル形式
const ACCEPT_FILELIST = [
  { mime: "application/pdf", ext: ".pdf", icon: "" },
  { mime: "application/vnd.ms-excel", ext: ".xls", icon: "" },
  { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ext: ".xlsx", icon: "" },
  { mime: "application/vnd.ms-excel.sheet.macroEnabled.12", ext: ".xlsm", icon: "" },
  { mime: "application/vnd.ms-excel.template.macroEnabled.12", ext: ".xltm", icon: "" },
  { mime: "text/xml", ext: ".xml", icon: "" },
  { mime: "application/xml", ext: ".xml", icon: "" },
  { mime: "text/csv", ext: ".csv", icon: "" },
  { mime: "application/zip", ext: ".zip", icon: "" },
  { mime: "text/plain", ext: ".txt", icon: "" },
  { mime: "text/html", ext: ".html", icon: "" },
  { mime: "text/css", ext: ".css", icon: "" },
  { mime: "text/javascript", ext: ".js", icon: "" },
  { mime: "application/javascript", ext: ".js", icon: "" },
  { mime: "image/jpeg", ext: ".jpg", icon: "" },
  { mime: "image/jpeg", ext: ".jpeg", icon: "" },
  { mime: "image/png", ext: ".png", icon: "" }
];

const sendFiles = async(files=[], hname="不明な法人") => {
  if(!files.length) return false;
  const today = formatDate(new Date(), 'YYYYMMDD');
  const rnddir = randomStr(20) + hname.replaceAll("　| ", "");
  const url = 'https://houday.rbatos.com/api/uploadimgResizeEtc.php';
  const headers = {'content-type': 'multipart/form-data'};
  const fileUrls = [];
  for(const file of files){
    const params = new FormData();
    const fileName = file.name;
    params.append('file', file, fileName);
    params.append('rnddir', rnddir);
    params.append('today', today);
    params.append('directory', "from_jigyousyo");
    for(let retry=0; retry<API_MAXRETRY; retry++){
      try{
        const res = await axios.post(url, params, headers);
        if(!res.data.result){
          // 送信失敗
          if(retry+1 !== API_MAXRETRY) continue;
          throw new Error("uploadimgResizeEtcError");
        }
        const path = res.data.filename.replace("..", "");
        fileUrls.push(encodeURI("https://houday.rbatos.com"+path));
        break;
      }catch(error){
        if(retry+1 !== API_MAXRETRY) continue;
        throw error;
      }
    }
  }
  return fileUrls;
}

const FileUploadButton = (props) => {
  const {files, setFiles} = props;
  const [isOver, setIsOver] = useState(false);

  const handleChange = (e) => {
    const newFiles = e.target.files;
    if((files.length + newFiles.length) > MAX_FILE_COUNT){
      // ファイル数が{MAX_FILE_COUNT}個以上の場合は警告
      setIsOver(true);
      return;
    }
    setIsOver(false);
    setFiles(prevFiles => ([...prevFiles, ...newFiles]));
  }

  const acceptMimeTypes = ACCEPT_FILELIST.map(prevAcceptFileDt => prevAcceptFileDt.mime);
  return(
    <div>
      <label htmlFor="upload-file-button">
        <input
          hidden
          accept={acceptMimeTypes.join(",")}
          id="upload-file-button"
          multiple
          type="file"
          onChange={handleChange}
          disabled={files.length>=MAX_FILE_COUNT}
        />
        <Button
          variant='outlined' color='primary'
          component="span"
          startIcon={<CloudUploadIcon />}
          disabled={files.length>=MAX_FILE_COUNT}
        >
          ファイル選択
        </Button>
      </label>
      <div style={{color: isOver ?red["A700"] :null, marginTop: 8}}>最大{MAX_FILE_COUNT}個までファイルを追加できます。</div>
    </div>
  )
}

const FileCard = withStyles({
  root: ({rootStyle}) => ({
    width: '100%',
    display: 'flex', alignItems: 'center',
    backgroundColor: grey[300], borderRadius: '8px',
    padding: '4px 8px', margin: '8px 0',
    cursor: 'pointer',
    '&:hover': {backgroundColor: grey[400]},
    '& .fileName': {
      flex: 1,
      fontSize: '14px', lineHeight: '1.4rem',
      overflow: "hidden",
      textOverflow: "ellipsis",
      margin: '0 4px'
    },
    ...rootStyle
  })
})((props) => {
  const {classes, file, onDelete, ...rootProps} = props;

  const handleClick = () => {
    const fileUrl = URL.createObjectURL(file);
    window.open(fileUrl, '_blank');
  }

  const handleDelete = (e) => {
    e.stopPropagation();
    if(onDelete) onDelete(e);
  }

  const name = file?.name ?? "不明なファイル";
  return(
    <div className={classes.root} onClick={handleClick} {...rootProps}>
      <div className='fileName'>{name}</div>
      {Boolean(onDelete) &&(
        <IconButton onClick={handleDelete} style={{padding: '4px'}}>
          <CloseIcon/>
        </IconButton>
      )}
    </div>
  )
});

const UploadFormDialog = (props) => {
  const hid = useSelector(state => state.hid);
  const com = useSelector(state => state.com);
  const account = useSelector(state => state.account);
  const {onClose, setSnack, ...dialogProps} = props;
  const [hname, setHname] = useState("");
  const [hnameError, setHnameError] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientNameError, setClientNameError] = useState(false);
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if(hid){
      setHname(com?.hname ?? "");
    }
  }, [hid, com])

  const handleSubmit = async() => {
    if(!hname){
      // 法人名未入力
      setHnameError(true);
      setSnack({msg: "法人名を入力してください。", severity: 'warning', id: new Date().getTime()});
      return;
    }else{
      setHnameError(false);
    }
    if(!hid){
      if(!email || !isMailAddress(email)){
        setEmailError(true);
        setSnack({msg: "メールアドレスを入力してください。", severity: 'warning', id: new Date().getTime()});
        return;
      }else{
        setEmailError(false);
      }
      if(!clientName){
        setClientNameError(true);
        setSnack({msg: "ご担当者名を入力してください。", severity: 'warning', id: new Date().getTime()});
        return;
      }else{
        setClientNameError(false);
      }
    }
    if(files.length < 1){
      // ファイル未選択
      setSnack({msg: "ファイルを選択してください。", severity: 'warning', id: new Date().getTime()});
      return;
    }
    try{
      const fileUrls = await sendFiles(files, hname);
      if(!fileUrls) throw new Error();

      const clientMail = account?.mail ?? email;
      const cName = clientName ?clientName :account?.lname&&account?.fname ?(account?.lname ?? "")+" "+(account?.fname ?? "") :"";
      if(clientMail){
        // 問い合わせ者宛に送信内容をメール送信
        const content = (
          `${cName} 様<br />`
          + "<br />"
          + "システムにてファイルの送信を受け付けました。<br />"
          + "内容を確認のうえ、担当よりご連絡いたします。<br />"
          + "<br />"
          + "--------------------------------------<br />"
          + "■ 受付内容<br />"
          + `・受付日時：${new Date().toLocaleString()}<br />`
          + `・送信ファイル名：${files?.[0]?.name ?? ""} ${files.length>1 ?`他${files.length-1}件` :""}<br />`
          + "<br />"
          + "本メールはシステムから自動送信されています。<br />"
          + "返信いただいても回答はできませんのでご了承ください。<br />"
          + "--------------------------------------<br />"
        )
        sendMail(clientMail, "noreply", "", "", `ファイルが送信されました。`, content);
      }

      // アルバトロス管理者宛にファイルURLを記載したメール送信
      const content = (
        `${hname} 様よりファイル送信がありました。<br />`
        + "<br />"
        + `${email ?`メールアドレス：${email}<br />` :""}`
        + `${clientName ?`ご担当者名：${clientName}<br />` :""}`
        + `${comment ?`ひとことコメント：${comment.replaceAll("\n", "　")}<br />` :""}`
        + `${!hid || comment ?"<br />" :""}`
        + "ファイルURL<br />"
        + fileUrls.join("<br /><br />")
      )
      sendMail("info@rbatosmail.com", "noreply", "", "", `【アルバシステム】${hname}様よりファイル送信`, content);

      setFiles([]);
      setSnack({msg: "送信完了", id: new Date().getTime()});
    }catch{
      setSnack({msg: "送信に失敗しました。", severity: 'error', errorId: "AFU9281", id: new Date().getTime()});
    }
  }

  const fileCards = files.map((file, i) => {
    const handleDelete = () => {
      setFiles(prevFiles => {
        const newFiles = [...prevFiles];
        newFiles.splice(i, 1);
        return newFiles;
      });
    }
    return(
      <FileCard file={file} onDelete={handleDelete} />
    )
  });

  return(
    <Dialog
      fullWidth maxWidth='sm'
      onClose={onClose}
      {...dialogProps}
    >
      <DialogTitle className="dialogTitle">
        ファイル送信
      </DialogTitle>
      <DialogContent dividers>
        <div>
          <AlbHMuiTextField2
            label="法人名"
            variant="outlined"
            value={hname}
            onChange={(e) => setHname(e.target.value)}
            onBlur={(e) => {
              if(!e.target.value){
                setHnameError(true);
              }else{
                setHnameError(false);
              }
            }}
            disabled={hid && com?.hname}
            error={hnameError}
            helperText={hnameError ?"入力してください。" :""}
            rootStyle={{height: null, marginBottom: 16}}
            required
          />
          {!Boolean(hid) &&(
            <>
            <div>
              <AlbHMuiTextField2
                label="メールアドレス"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={(e) => {
                  if(!e.target.value || !isMailAddress(e.target.value)){
                    setEmailError(true);
                  }else{
                    setEmailError(false);
                  }
                }}
                error={emailError}
                helperText={emailError ?"入力してください。" :""}
                required
                rootStyle={{height: null, marginBottom: 16}}
              />
            </div>
            <div>
              <AlbHMuiTextField2
                label="ご担当者名"
                variant="outlined"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                onBlur={(e) => {
                  if(!e.target.value){
                    setClientNameError(true);
                  }else{
                    setClientNameError(false);
                  }
                }}
                error={clientNameError}
                helperText={clientNameError ?"入力してください。" :""}
                required
                rootStyle={{height: null, marginBottom: 16}}
              />
            </div>
            </>
          )}
          <div>
            <AlbHMuiTextField2
              label="ひとことコメント"
              variant="outlined"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rootStyle={{height: null, marginBottom: 16}}
              multiline minRows={2} rows={2}
            />
          </div>
          <FileUploadButton files={files} setFiles={setFiles} />
          <div style={{height: 144, marginTop: 8}}>
            {fileCards}
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained" color="secondary"
          onClick={onClose}
          style={{width: 112}}
        >
          キャンセル
        </Button>
        <Button
          variant="contained" color="primary"
          onClick={handleSubmit}
          style={{width: 112}}
        >
          送信
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const AnyFileUploadButton = ({skipLoadingCheck = false}) => {
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const [open, setOpen] = useState(false);
  const [snack, setSnack] = useState({});

  return(
    <>
    <Button
      variant="outlined"
      color="primary"
      disabled={!skipLoadingCheck && !loadingStatus.loaded}
      onClick={() => setOpen(true)}
      style={{margin: '16px 0'}}
    >
      ファイル送信
    </Button>
    <UploadFormDialog
      open={open} onClose={() => {setOpen(false); setSnack({})}}
      setSnack={setSnack}
    />
    <SnackMsg {...snack} />
    </>
  )
}
export default AnyFileUploadButton;
