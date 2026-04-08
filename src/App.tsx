import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import useDragScroll from './hooks/useDragScroll';
import PageRouter from './pages/PageRouter';
import './App.css';

function Layout() {
  useDragScroll();

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
          <Route path=":navId" element={<PageRouter />} />
          <Route path=":navId/:sectionId/:itemId" element={<PageRouter />} />
          <Route path=":navId/:sectionId/:itemId/:subId" element={<PageRouter />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
