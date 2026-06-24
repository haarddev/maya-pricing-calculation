import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/Layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { TemplateListPage } from './pages/TemplateListPage';
import { TemplateFormPage } from './pages/TemplateFormPage';
import { CatalogListPage } from './pages/CatalogListPage';
import { CatalogFormPage } from './pages/CatalogFormPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/templates" replace />} />
            <Route path="/templates" element={<TemplateListPage />} />
            <Route path="/templates/new" element={<TemplateFormPage />} />
            <Route path="/templates/:id" element={<TemplateFormPage />} />
            <Route path="/catalogs" element={<CatalogListPage />} />
            <Route path="/catalogs/new" element={<CatalogFormPage />} />
            <Route path="/catalogs/:id" element={<CatalogFormPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/templates" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
