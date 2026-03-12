import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Page from './pages/Page';
import './App.css';

function Layout() {
  return (
    <main className="app">
      <Sidebar />
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
          <Route path=":navId" element={<Page />} />
          <Route path=":navId/:sectionId/:itemId" element={<Page />} />
          <Route path=":navId/:sectionId/:itemId/:subId" element={<Page />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
