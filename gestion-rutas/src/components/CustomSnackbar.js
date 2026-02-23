import React from 'react';
import { Snackbar, Alert } from '@mui/material';

const CustomSnackbar = ({ open, handleClose, message, severity = "success" }) => {
  console.log('CustomSnackbar renderizado:', { open, message, severity });
  
  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ zIndex: 9999 }}
    >
      <Alert 
        onClose={handleClose} 
        severity={severity} 
        sx={{ 
          width: '100%',
          fontSize: '1.1rem',
          fontWeight: 500
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default CustomSnackbar;
