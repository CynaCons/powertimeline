import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/index.css'
import App from './App.tsx'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { createAppTheme } from './styles/theme'
import { ChronoThemeProvider, useTheme } from './contexts/ThemeContext'
// Firebase disabled for now - will be enabled in v0.4.x when needed
// import './lib/firebase'

// App wrapper to provide dynamic theme based on context
function AppWithTheme() {
  const { isDarkMode } = useTheme();
  const theme = createAppTheme(isDarkMode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChronoThemeProvider>
      <AppWithTheme />
    </ChronoThemeProvider>
  </StrictMode>,
)
