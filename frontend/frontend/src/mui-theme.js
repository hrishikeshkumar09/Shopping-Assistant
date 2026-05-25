// Optional: MUI theme customization file
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    background: {
      default: '#f0f2f5',
    },
  },
  shape: {
    borderRadius: 12,
  },
});

export default theme;
