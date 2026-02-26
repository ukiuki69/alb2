import React, { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { Button, FormControl, InputLabel, MenuItem, Select, makeStyles } from "@material-ui/core"
import { useSelector } from 'react-redux';
import { Links } from './Setting';
import { teal, orange } from '@material-ui/core/colors';
import FiberNewIcon from '@material-ui/icons/FiberNew';
import { checkValueType } from '../dailyReport/DailyReportCommon';
import { univApiCall } from '../../albCommonModule';
import SnackMsg from '../common/SnackMsg';
import { GoBackButton } from '../common/commonParts';

const HOUDAY_ADDICTION_LIST = [
  "専門的支援実施加算", "入浴支援加算", "医療連携体制加算", "関係機関連携加算", "送迎加算設定", "事業所間連携加算", "集中的支援加算",
  "自立サポート加算", "通所自立支援加算", "強度行動障害児支援加算９０日以内", "保育・教育等移行支援加算"
];
const JIHATSU_ADDICTION_LIST = [
  "専門的支援実施加算", "入浴支援加算", "医療連携体制加算", "関係機関連携加算", "送迎加算設定", "事業所間連携加算", "集中的支援加算",
  "強度行動障害児支援加算９０日以内", "保育・教育等移行支援加算"
];
const HOHOU_ADDICTION_LIST = [];

// メインページのタイトル
const PAGE_TITLE = "加算の表示設定";
// メインページの説明文
const PAGE_DISCRIPTION = "利用者ごと、日付ごとのなどの加算減算設定で表示非表示を切り替えるために設定します。"
  + "普段利用しない項目は非表示設定にすることにより入力作業などがしやすくなります。"
  + "非表示設定にすることにより加算を見逃す可能性もあるので十分にご注意ください。";

// サイドメニューの幅
const SIDEMENU_WIDTH = 61.25;

// com.extに配置するプロパティ名
const HIDE_ADDICTION_COMEXT_KEY = "hideaddiction";

/**
 * 非表示設定のフォーム要素の値を取得するための関数
 * フォームの「ラベル」「ID」「説明分」「新しいか？」を取得する。
 * @param {str} kasanName 
 * @returns 
 */
const getHideSettingCardContents = (kasanName) => {
  let label = null;
  let id = null;
  let discription = null;
  let isNew = false;

  switch(kasanName){
    case "専門的支援実施加算": {
      label = "専門的支援実施加算";
      id = "専門的支援実施加算";
      discription = "専門的な支援の強化を図るため、基準の人員に加えて理学療法士等を配置していること。"
        + "理学療法士等により、個別・集中的な専門的支援を計画的に行った場合に算定できます。";
      isNew = true;
      break;
    }
    case "入浴支援加算": {
      label = "入浴支援加算";
      id = "入浴支援加算";
      discription = "こどもの発達や日常生活、家族を支える観点から、医療的ケア児や重症心身障害児に、"
        + "発達支援とあわせて入浴支援を行った場合に算定できる加算です。";
      isNew = true;
      break;
    }
    case "医療連携体制加算": {
      label = "医療連携体制加算";
      id = "医療連携体制加算";
      discription = "医療機関等から看護職員が放課後等デイサービスに訪問し、"
        + "看護の提供や認定特定行為業務従事者に対して喀痰吸引等の指導を行う取り組みを評価する加算です。";
      break;
    }
    case "関係機関連携加算": {
      label = "関係機関連携加算";
      id = "関係機関連携加算";
      discription = "関係機関連携加算加算とは、児童の関係者と連携し、情報を共有することにより児童に対する理解を深め、"
        + "サービスの質を高めていく取組を評価する加算となります。";
      break;
    }
    case "送迎加算設定": {
      label = "送迎加算設定";
      id = "送迎加算設定";
      discription = "該当する送迎加算に対する設定を行います。"
        + "医療的ケア児・重症心身障害児などの場合は加算が追加になる場合があります。"
        + "また同一敷地内の送迎がある場合はこちらで設定します。";
      isNew = true;
      break;
    }
    case "事業所間連携加算": {
      label = "事業所間連携加算";
      id = "事業所間連携加算";
      discription = "障害児支援の適切なコーディネートを進める観点から、セルフプランで複数事業所を併用する児について、"
        + "事業所間で連携し、こどもの状態や支援状況の共有等の情報連携を行った場合に算定できる加算です。"
        + "中核となる事業所として会議を開催するなどした場合は１、会議に参加するなどした場合は２を算定できます。";
      isNew = true;
      break;
    }
    case "集中的支援加算": {
      label = "集中的支援加算";
      id = "集中的支援加算";
      discription = "状態が悪化した強度行動障害を有する児者に対し、高度な専門性により地域を支援する広域的支援人材が、"
        + "事業所等を集中的に訪問等（情報通信機器を用いた地域外からの指導助言も含む）し、"
        + "適切なアセスメントと有効な支援方法の整理をともに行い、環境調整を進めることを評価する加算です。";
      isNew = true;
      break;
    }
    case "自立サポート加算": {
      label = "自立サポート加算";
      id = "自立サポート加算";
      discription = "高校２年生・３年生について、学校卒業後の生活に向けて、学校や地域の企業等と連携しながら、"
        + "相談援助や体験等の支援を計画的に行った場合に算定できる加算です。";
      isNew = true;
      break;
    }
    case "通所自立支援加算": {
      label = "通所自立支援加算";
      id = "通所自立支援加算";
      discription = "学校・居宅等と事業所間の移動について、自立して通所が可能となるよう、"
        + "職員が付き添って計画的に支援を行った場合に算定できます。";
      isNew = true;
      break;
    }
    case "強度行動障害児支援加算９０日以内": {
      label = "強度行動障害児支援加算９０日以内";
      id = "強度行動障害児支援加算９０日以内";
      discription = "強度行動障害児支援加算を算定開始後から９０日以内は追加で算定出来ることがあります。";
      isNew = true;
      break;
    }
    case "保育・教育等移行支援加算": {
      label = "保育・教育等移行支援加算";
      id = "保育・教育等移行支援加算";
      discription = "サービス提供を行う事業所が、退所前や退所後に地域の保育教育等を受けられるように支援を行った場合に算定できる加算です。";
      isNew = true;
      break;
    }
    default: {
      return null;
    }
  }

  return {label, id, discription, isNew}
}

const useStyles = makeStyles({
  AppPage: {
    // width: 640 + SIDEMENU_WIDTH,
    width: 640,
    margin: '104px auto',
    // paddingLeft: SIDEMENU_WIDTH,
    '& .pageTitle': {
      fontSize: '1.25rem', color: teal[800],
      textAlign: 'center',
      marginBottom: 16,
      marginTop: 32,
      // backgroundColor: teal[800],
      // color: '#fff',
      // padding: 8
    },
    '& .pageDiscription': {
      textAlign: 'justify', lineHeight: '1.5rem' ,
      marginBottom: 16
    }
  },
  hideSettingCard: {
    width: 640,
    padding: 8, marginBottom: 16,
    display: 'flex',
    border: '#00b6a166 1px solid', borderRadius: 4,
    boxShadow: '#b3b3b3 0px 1px 2px',
    '& .leftWrapper': {
      width: '45%',
      padding: 8,
    },
    '& .rightWrapper': {
      width: '55%',
      padding: 8,
      '& .title': {
        width: 'fit-content',
        fontSize: '1rem', color: teal[600],
        marginBottom: 8,
        position: 'relative',
        '& .newIcon': {
          position: 'absolute', top: -8, right: -24,
        }
      },
      '& .discription': {
        lineHeight: 1.5, fontSize: '0.9rem',
        textAlign: 'justify'
      }
    }
  },
  buttons: {
    width: 640, textAlign: 'end',
    position: 'fixed', bottom: 8, right: 'auto',
    '& .submitButton': {
      marginLeft: 20
    }
  }
});

export const AddictionHideSettingTransitionButton = () => {
  const history = useHistory();

  const handleTransition = () => {
    history.push("/setting/hideaddiction/")
  }

  return(
    <Button
      variant='outlined'
      onClick={handleTransition}
    >
      加算表示設定
    </Button>
  )
}

const AddictionSettingTransitionButton = () => {
  const history = useHistory();

  const handleTransition = () => {
    history.push("/setting/addiction/")
  }

  return(
    <Button
      variant='outlined'
      onClick={handleTransition}
    >
      事業所加算設定
    </Button>
  )
}

const HideSettingCard = (props) => {
  const classes = useStyles();
  const com = useSelector(state => state.com);
  const {kasanName, resetFlag} = props;
  const [value, setValue] = useState(0);

  useEffect(() => {
    // キャンセルボタンが押されるたびに、フォームの値を初期化
    const hideAddiction = com?.ext?.[HIDE_ADDICTION_COMEXT_KEY] ?? {};
    const initValue = hideAddiction?.[kasanName] ?? 0;
    setValue(initValue);
  }, [resetFlag])

  // フォーム要素に使うラベルとIDと説明分と新しいか？を取得
  const contentDt = getHideSettingCardContents(kasanName);
  if(!contentDt) return null;

  const handleChange = (e) => {
    setValue(e.target.value);
  }

  const {label, id, discription, isNew} = contentDt;
  const labelId = `${id}-label`;
  return(
    <div className={classes.hideSettingCard}>
      <div className='leftWrapper'>
        <FormControl style={{width: '100%'}}>
          <InputLabel id={labelId}>{label}</InputLabel>
          <Select
            labelId={labelId}
            id={id}
            name={id}
            value={value}
            onChange={handleChange}
          >
            <MenuItem value={0}>表示</MenuItem>
            <MenuItem value={1}>非表示</MenuItem>
          </Select>
        </FormControl>
      </div>
      <div className='rightWrapper'>
        <div className='title'>
          {label}
          {isNew &&<div className='newIcon'><FiberNewIcon style={{color: orange[600]}}/></div>}
        </div>
        <div className='discription'>{discription}</div>
      </div>
    </div>
  )
}

const Buttons = (props) => {
  const classes = useStyles();
  const com = useSelector(state => state.com);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const {formRef, setResetFlag} = props;
  const [snack, setSnack] = useState({});

  const handleCansel = () => {
    setResetFlag(prevResetFlag => !prevResetFlag);
    setSnack({msg: 'キャンセルしました。'});
  }

  const handleSubmit = async() => {
    const hideAddiction = {};
    const formElements = formRef.current.elements;
    for (let i = 0; i < formElements.length; i++) {
      const element = formElements[i];
      if (element.tagName === 'INPUT') {
        const name = element.name;
        const value = parseInt(element.value);
        if(value !== 0) hideAddiction[name] = value;
      }
    }
    const comExt = checkValueType(com?.ext, 'Object') ?com?.ext :{};
    comExt[HIDE_ADDICTION_COMEXT_KEY] = hideAddiction;
    const sendComExtParams = {
      "a": "sendComExt",
      hid, bid, ext: JSON.stringify(comExt)
    }
    await univApiCall(sendComExtParams, "", "", setSnack, "書き込みました。", "書き込みに失敗");
  }

  return(
    <>
    <div className={classes.buttons}>
      <Button
        variant='contained'
        color='secondary'
        className='canselButton'
        onClick={handleCansel}
      >
        キャンセル
      </Button>
      <Button
        variant='contained'
        color='primary'
        className='submitButton'
        onClick={handleSubmit}
      >
        書き込み
      </Button>
    </div>
    <SnackMsg {...snack} />
    </>
  )
}

export const AddictionHideSetting = () => {
  const classes = useStyles();
  const formRef = useRef(null);
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service ?service :serviceItems[0];
  const [resetFlag, setResetFlag] = useState(false);

  const kasanList = (() => {
    switch(displayService){
      case "放課後等デイサービス":
        return HOUDAY_ADDICTION_LIST
      case "児童発達支援":
        return JIHATSU_ADDICTION_LIST
      case "保育所等訪問支援":
        return HOHOU_ADDICTION_LIST
      default:
        return []
    }
  })();

  const cards = kasanList.map(kasanName => (
    <HideSettingCard
      key={kasanName}
      kasanName={kasanName}
      resetFlag={resetFlag}
    />
  ));

  return(
    <>
    <Links />
    <div className={classes.AppPage}>
      {/* <AddictionSettingTransitionButton /> */}
      <GoBackButton posX={100} posY={30} />
      <div className='pageTitle'>{PAGE_TITLE}</div>
      <div className='pageDiscription'>{PAGE_DISCRIPTION}</div>
      <form ref={formRef}>
        {cards}
        <Buttons formRef={formRef} setResetFlag={setResetFlag} />
      </form>
    </div>
    </>
  )
}