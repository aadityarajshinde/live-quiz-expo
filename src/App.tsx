import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import AuthPage from '@/components/auth/AuthPage';
import Index from '@/pages/Index';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminDashboard from '@/pages/AdminDashboard';
import { useAuth } from '@/hooks/useAuth';

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/auth" 
        element={user ? <Navigate to="/" replace /> : <AuthPage />} 
      />
      <Route 
        path="/admin" 
        element={user ? <AdminSettings /> : <Navigate to="/auth" replace />} 
      />
      <Route 
        path="/dashboard" 
        element={user ? <AdminDashboard /> : <Navigate to="/auth" replace />} 
      />
      <Route 
        path="/" 
        element={user ? <Index /> : <Navigate to="/auth" replace />} 
      />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <BrowserRouter>
          <AppContent />
          <Toaster />
          <SonnerToaster />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;