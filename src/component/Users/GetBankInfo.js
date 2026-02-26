import React,{useState, useEffect} from 'react';
import { useDispatch, useSelector } from "react-redux"
import { univApiCall } from '../../albCommonModule';
import * as Action from '../../Actions';

// comExtに金融機関名称や支店名を記載するデータを格納する
const GetBankInfo = () => {
  const users = useSelector((s) => s.users);
  const com = useSelector((s) => s.com);
  const comExt = useSelector((s) => s?.com?.ext) || {};
  const sBankNames = useSelector((s) => s.com?.ext?.bankNames) || {};
  const [bankNames, setBankNames] = useState({ ...sBankNames, update: false });
  const tBankNames = { ...bankNames };
  const dispatch = useDispatch();

  // タイマー遅延時間（ms）
  const DELAY_TIME = 500;

  const sendAndDispatch = async () => {
    comExt.bankNames = { ...bankNames, update: false }; // フラグをリセットして送信
    const p = {
      a: "sendComExt",
      hid: com.hid,
      bid: com.bid,
      ext: JSON.stringify({ ...comExt }),
    };
    const res = await univApiCall(p, "E924336");
    if (!res?.data?.result) {
      return { result: false, errorId: res.errorId };
    }
    const newCom = { ...com };
    newCom.ext = comExt;
    dispatch(Action.setStore({ com: newCom }));
  };

  useEffect(() => {
    let timer = null;

    if (bankNames.update) {
      if (timer) clearTimeout(timer); // 既存のタイマーをクリア
      timer = setTimeout(async () => {
        await sendAndDispatch(); // データ送信
        setBankNames((prev) => ({ ...prev, update: false })); // フラグをリセット
      }, DELAY_TIME);
    }

    return () => {
      if (timer) clearTimeout(timer); // コンポーネントのクリーンアップ
    };
  }, [bankNames.update]);

  useEffect(() => {
    const fetchBankData = async () => {
      const bankBranch = Array.from(
        new Set(
          users
            .filter((e) => e?.etc?.bank_info?.金融機関番号)
            .map(
              (e) =>
                e?.etc?.bank_info?.金融機関番号 +
                "-" +
                e?.etc?.bank_info?.店舗番号
            )
        )
      );

      const banks = Array.from(new Set(bankBranch.map((e) => e.split("-")[0])));

      const addBank = async (bankcode) => {
        const prms = { a: "fetchBankInfo", bankcode };
        const r = await univApiCall(prms, "", "", "");
        if (!r?.data?.code) return;

        const d = r.data;
        const bName =
          (d?.normalize?.name || "").length <= 6
            ? d?.normalize?.name
            : d?.name;
        if (!tBankNames[bankcode]?.name) {
          tBankNames[bankcode] = { name: bName };
          setBankNames({ ...tBankNames, update: true }); // 更新時にフラグをtrue
        }
      };

      const addBranch = async (bankcode, branchcode) => {
        const prms = { a: "fetchBankInfo", bankcode, branchcode };
        const r = await univApiCall(prms, "", "", "");
        let brName;
        if (r?.data?.code) {
          const d = r.data;
          brName =
            (d?.normalize?.name || "").length <= 6
              ? d?.normalize?.name
              : d?.name;
        } else {
          brName = "不明";
        }

        if (!tBankNames[bankcode]) {
          tBankNames[bankcode] = {};
        }
        if (!tBankNames[bankcode][branchcode]?.name) {
          tBankNames[bankcode][branchcode] = { name: brName };
          setBankNames({ ...tBankNames, update: true }); // 更新時にフラグをtrue
        }
      };

      for (const bank of banks) {
        if (!tBankNames[bank]?.name) {
          await addBank(bank);
        }

        const branches = bankBranch
          .filter((e) => e.startsWith(bank + "-"))
          .map((e) => e.split("-")[1]);

        for (const branchcode of branches) {
          if (
            !tBankNames[bank]?.[branchcode] ||
            tBankNames[bank]?.[branchcode] === "不明"
          ) {
            await addBranch(bank, branchcode);
          }
        }
      }
    };

    fetchBankData();
  }, [users]);

  return <div id="getBankInfo2233"></div>;
};

export default GetBankInfo;