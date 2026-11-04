import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { BetSlipProvider } from './context/BetSlipContext';
import { UiProvider } from './context/UiContext';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <UiProvider>
            <BetSlipProvider>
              <AppRoutes />
            </BetSlipProvider>
          </UiProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
