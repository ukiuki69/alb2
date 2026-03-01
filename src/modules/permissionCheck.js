import { parsePermission } from "./parsePermission";
import store from "../store";
import { PERMISSION_DEVELOPER } from "./contants";

export const permissionCheck = (limitPermission, account) => {
  // accountが渡されていない場合はstoreから取得
  const permission = parsePermission(account)[0][0];
  if (permission >= limitPermission) {
    return true;
  }
  return false;
}

export const permissionIsDev = (account) => {
  const permission = parsePermission(account)[0][0];
  return permission === contants.PERMISSION_DEVELOPER;
}

export const permissionCheckTemporary = permissionCheck;