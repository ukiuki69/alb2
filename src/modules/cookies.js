import Cookies from 'js-cookie';

/**
 * クッキー操作に関連するユーティリティ
 */

export const setCookeis = (name, value, expires = 30) => {
  Cookies.set(name, value, { expires });
};

export const getCookeis = (name) => {
  return Cookies.get(name);
};

export const removeCookieAll = () => {
  const c = Cookies.get();
  Object.keys(c).forEach((e) => {
    Cookies.remove(e);
  });
  return c;
};

