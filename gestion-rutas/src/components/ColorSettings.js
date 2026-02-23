import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
} from '@mui/material';
import BrushIcon from '@mui/icons-material/Brush';

const ColorSettings = () => {
  const [color, setColor] = useState(localStorage.getItem('userColor') || '#1976d2');

  const aplicarColor = () => {
    localStorage.setItem('userColor', color);
    window.location.reload();
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        mt: 4,
        borderRadius: 3,
        backgroundColor: '#f9f9f9',
      }}
    >
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <BrushIcon color="primary" />
        <Typography variant="h6" color="primary" fontWeight="bold">
          Personalización de Tema
        </Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="body2" sx={{ mb: 2, color: '#555' }}>
        Elige tu color preferido para personalizar la apariencia del sistema a tu estilo.
      </Typography>

      <Box display="flex" alignItems="center" gap={2}>
        <TextField
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          sx={{ width: 80 }}
          variant="outlined"
        />
        <Button variant="contained" onClick={aplicarColor}>
          Aplicar Tema
        </Button>
      </Box>
    </Paper>
  );
};

export default ColorSettings;
