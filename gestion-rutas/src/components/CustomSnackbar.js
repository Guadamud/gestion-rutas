import React from 'react';
import { Snackbar, Alert } from '@mui/material';

const CustomSnackbar = ({ open, handleClose, onClose, message, severity = "success" }) => {
  const closeHandler = handleClose || onClose;
  return (
    <Snackbar
      open={open}
      autoHideDuration={10000}
      onClose={closeHandler}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ zIndex: 9999 }}
    >
      <Alert 
        onClose={closeHandler} 
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
