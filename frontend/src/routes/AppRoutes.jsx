import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const HomePage = lazy(() =>
  import('../pages/HomePage').then((m) => ({ default: m.HomePage })),
);
const LoginPage = lazy(() =>
  import('../pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('../pages/ForgotPasswordPage').then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const RegisterPage = lazy(() =>
  import('../pages/RegisterPage').then((m) => ({ default: m.RegisterPage })),
);
const BulkUploadPage = lazy(() =>
  import('../pages/BulkUploadPage').then((m) => ({ default: m.BulkUploadPage })),
);
const WalletPage = lazy(() =>
  import('../pages/WalletPage').then((m) => ({ default: m.WalletPage })),
);
const MyBetsPage = lazy(() =>
  import('../pages/MyBetsPage').then((m) => ({ default: m.MyBetsPage })),
);
const AdminPage = lazy(() =>
  import('../pages/AdminPage').then((m) => ({ default: m.AdminPage })),
);
const ProfilePage = lazy(() =>
  import('../pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);

function RouteFallback() {
  return (
    <p style={{ padding: '2rem', textAlign: 'center', opacity: 0.7 }}>
      Cargando módulo…
    </p>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/carga-masiva" element={<BulkUploadPage />} />
        <Route path="/billetera" element={<WalletPage />} />
        <Route path="/mis-apuestas" element={<MyBetsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
