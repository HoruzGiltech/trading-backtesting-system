import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import BacktestDetailPage from "./pages/BacktestDetailPage";
import BacktestListPage from "./pages/BacktestListPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/backtests"
            element={
              <ProtectedRoute>
                <BacktestListPage />
              </ProtectedRoute>
            }
          />
          <Route
  path="/backtests/:id"
  element={
    <ProtectedRoute>
      <BacktestDetailPage />
    </ProtectedRoute>
  }
/>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;