import React, { useEffect, } from "react";
import { 
  LOCAL_STRAGE_PRINT_TITLE, removeLocalStorageItem, setLS 
} from "../../modules/localStrageOprations";

const SetPrintTitle = ({printTitle}) => {
  useEffect(()=>{
    setLS(LOCAL_STRAGE_PRINT_TITLE, printTitle);
    return (()=>{
      removeLocalStorageItem(LOCAL_STRAGE_PRINT_TITLE);
    })
  }, [])
  return null;
}
export default SetPrintTitle;