import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { Provider } from "react-redux";
import App from './App';
import store from './store';
import * as commod from './commonModule';

// 本番環境でconsole.logを抑制、開発環境ではログサーバーに転送
if (process.env.NODE_ENV === 'production') {
  console.log = function() {};
} else {
  const LOG_SERVER = 'http://localhost:3099/log';
  let logServerAvailable = true;

  const sendLog = (level, args) => {
    if (!logServerAvailable) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1000);
    fetch(LOG_SERVER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        level,
        timestamp: new Date().toISOString(),
        args: args.map(a => {
          try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
          catch(e) { return String(a); }
        }),
      }),
    }).then(() => clearTimeout(timer)).catch(() => {
      clearTimeout(timer);
      logServerAvailable = false;
    });
  };

  ['log', 'warn', 'error'].forEach(level => {
    const orig = console[level].bind(console);
    console[level] = (...args) => {
      orig(...args);
      try { sendLog(level, args); } catch (e) {}
    };
  });
}

ReactDOM.render(
  <Provider store={store}>
    <App/>
  </Provider>,
  document.getElementById('root')
);
