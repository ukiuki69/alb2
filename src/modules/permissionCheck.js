import { parsePermission } from "./parsePermission";
import store from "../store";

export const permissionCheck = (limitPermission, account) => {
  // accountが渡されていない場合はstoreから取得
  const permission = parsePermission(account)[0][0];
  if (permission >= limitPermission) {
    return true;
  }
  return false;
}
export const permissionCheckTemporary = permissionCheck;