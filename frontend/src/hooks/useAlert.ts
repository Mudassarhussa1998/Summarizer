import { useState, useCallback } from 'react';

export interface AlertState {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  isVisible: boolean;
}

export const useAlert = () => {
  const [alert, setAlert] = useState<AlertState>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  const showAlert = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setAlert({
      message,
      type,
      isVisible: true,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlert(prev => ({
      ...prev,
      isVisible: false,
    }));
  }, []);

  const showSuccess = useCallback((message: string) => {
    showAlert(message, 'success');
  }, [showAlert]);

  const showError = useCallback((message: string) => {
    showAlert(message, 'error');
  }, [showAlert]);

  const showWarning = useCallback((message: string) => {
    showAlert(message, 'warning');
  }, [showAlert]);

  const showInfo = useCallback((message: string) => {
    showAlert(message, 'info');
  }, [showAlert]);

  return {
    alert,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

export default useAlert;