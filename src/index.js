import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { Provider } from "react-redux";
import App from './App';
import store from './store';
import * as commod from './commonModule';

// 本番環境でconsole.logを抑制
if (process.env.NODE_ENV === 'production') {
  console.log = function() {};
}

ReactDOM.render(
  <Provider store={store}>
    <App/>
  </Provider>,
  document.getElementById('root')
);
