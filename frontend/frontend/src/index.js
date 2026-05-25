import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import ChatWidget from './ChatWidget';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './mui-theme';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #0a2342 0%, #1e355e 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        <h1 style={{
          color: '#fff',
          fontWeight: 900,
          fontSize: '2.8rem',
          letterSpacing: 2,
          margin: 0,
          textAlign: 'center',
          userSelect: 'none',
          textShadow: '0 2px 16px #0008',
        }}>
          ABC-ECOMMERCE WEBSITE
        </h1>
        <ChatWidget />
      </div>
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
