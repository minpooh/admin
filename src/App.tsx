import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import DashboardSidebar from './components/DashboardSidebar';
import DashboardPage from './pages/DashboardPage';
import './App.css';

function Layout() {
  return (
    <main className="app">
      <DashboardSidebar />
      <div className="main-content">
        <Outlet />
      </div>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/feelmaker" replace />} />
          <Route path=":navId" element={<DashboardPage />} />
          <Route path=":navId/:sectionId/:itemId" element={<DashboardPage />} />
          <Route path=":navId/:sectionId/:itemId/:subId" element={<DashboardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
