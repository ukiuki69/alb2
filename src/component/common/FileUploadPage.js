import React from 'react';
import { makeStyles } from '@material-ui/core';
import AnyFileUploadButton from './AnyFileUploadButton';
import { seagull } from '../../modules/contants';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
    backgroundColor: '#fff',
  },
  logoContainer: {
    marginBottom: '40px',
    textAlign: 'center',
  },
  logo: {
    height: '20vh',
    width: 'auto',
  },
  title: {
    fontSize: '24px',
    fontWeight: 500,
    color: '#00695c',
    marginBottom: '16px',
    textAlign: 'center',
  },
  description: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '32px',
    textAlign: 'center',
    maxWidth: '500px',
    lineHeight: '1.6',
  }
});

const FileUploadPage = () => {
  const classes = useStyles();

  return (
    <div className={classes.container}>
      <div className={classes.logoContainer}>
        {!seagull && <img src="/img/logoMarkW800.png" alt="Logo" className={classes.logo} />}
        {Boolean(seagull) && 
          <img 
            src="/img/aitsubasa-teal-v.svg"
            alt="Logo"
            style={{height: 200, width: 'auto'}} 
          />
        }
      </div>
      <div className={classes.title}>ファイル送信</div>
      <div className={classes.description}>
        アルバトロス運営へファイルを送信できます。<br />
        お預かりしたデータは安全に保管され<br />
        丁寧に大切にお取り扱い致します。<br />
        送信したファイルは担当者が確認後、ご連絡いたします。<br />

      </div>
      <AnyFileUploadButton skipLoadingCheck={true} />
    </div>
  );
};

export default FileUploadPage;

