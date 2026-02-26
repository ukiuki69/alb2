import React,{useState, useEffect} from 'react';
import { useSelector } from 'react-redux';
import { getLodingStatus } from '../../commonModule';

// 利用者のサービス一覧を取得するためのカスタムフック
// ボツっぽい
export const useGetUsersService = () => {
  const allState = useSelector(s=>s);
  const ls = getLodingStatus(allState);
  const {users} = allState;
  if (!ls.loaded) return [];
  if (!users.length) return [];
  const svcs = users.reduce((svc, user) => {
    svc.push(...user.service.split(','));
    return svc;
  }, []);

  return Array.from(new Set(svcs));
}