import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BetSlipProvider } from './context/BetSlipContext';
import { UiProvider } from './context/UiContext';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UiProvider>
          <BetSlipProvider>
            <AppRoutes />
          </BetSlipProvider>
        </UiProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
