import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import BacktestDetailPage from "./pages/BacktestDetailPage";
import BacktestListPage from "./pages/BacktestListPage";
import KillZonesPage from "./pages/KillZonesPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import NewsPage from "./pages/NewsPage";
import RegisterPage from "./pages/RegisterPage";
import RiskCalculatorPage from "./pages/RiskCalculatorPage";
import TradingPlanPage from "./pages/TradingPlanPage";




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

<Route
  path="/risk-calculator"
  element={
    <ProtectedRoute>
      <RiskCalculatorPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/kill-zones"
  element={
    <ProtectedRoute>
      <KillZonesPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/trading-plan"
  element={
    <ProtectedRoute>
      <TradingPlanPage />
    </ProtectedRoute>
  }
/>
<Route
  path="/news"
  element={
    <ProtectedRoute>
      <NewsPage />
    </ProtectedRoute>
  }
/>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;