import React from "react";
import { useSelector } from "react-redux"
import { parsePermission } from "../../commonModule";
import { red } from "@material-ui/core/colors";
// 法改正対応中のため機能の一部の表示などを非許可にする
export const useSuspendLowChange = () => {
  // const allState = useSelector(s=>s);
  // const {stdDate, account} = allState;
  // const permission = parsePermission(account)[0][0];
  // return (permission < 100 && stdDate >= '2024-04-01');
  return false;
}
export const NotDispLowCh = (props) => {
  const notAllowed = useSuspendLowChange(props);
  const {style} = props;
  const defaultStyle = {fontSize: '.8rem', color: red[800], textAlign: 'center', padding: 8}
  if (notAllowed){
    return (
      <div className="noprint" style={{...defaultStyle, ...style}} >
        法改正対応中のため機能の一部は制限されています
      </div>
    )
  }
  else return null;
}