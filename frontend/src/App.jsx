import React from 'react';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes';

const App = () => {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#ffffff',
            color: '#1f2937',
            fontSize: '0.875rem',
            borderRadius: '0.75rem',
            boxShadow:
              '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #f3f4f6',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#f43f5e',
              secondary: '#ffffff',
            },
          },
        }}
      />
      <AppRoutes />
    </>
  );
};

export default App;
