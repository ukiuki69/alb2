import React from 'react';
import RegistedParams from './RegistedParams';
import { Links } from './settingCommon';

export const RegParamsSettings = () => {
  return (<>
    <Links />
    <div className="AppPage setting">
      <RegistedParams />
    </div>
  </>)
};

export default RegParamsSettings;
