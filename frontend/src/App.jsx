import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Router from './components/commonComponents/router/router';
import { AuthProvider } from './components/commonComponents/authContext/authContext';
import { SocketProvider } from './components/commonComponents/socketContext/socketContext';
import { ChatProvider } from './components/commonComponents/chatContext/chatContext';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <ChatProvider>
            <div className="App">
              <Router />
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-lg)',
                    fontSize: 'var(--font-size-sm)',
                    fontFamily: 'var(--font-family-primary)',
                    boxShadow: 'var(--shadow-lg)',
                  },
                  success: {
                    iconTheme: {
                      primary: 'var(--success-color)',
                      secondary: 'var(--bg-primary)',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: 'var(--error-color)',
                      secondary: 'var(--bg-primary)',
                    },
                  },
                  loading: {
                    iconTheme: {
                      primary: 'var(--primary-color)',
                      secondary: 'var(--bg-primary)',
                    },
                  },
                }}
              />
            </div>
          </ChatProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;