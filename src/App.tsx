import React from 'react';
import { useLocation } from './lib/router';
import Home from './pages/Home';
import AprendePage from './pages/AprendePage';
import ExploraPage from './pages/ExploraPage';
import AccesoAdminPage from './pages/AccesoAdminPage';

export default function App() {
  const { pathname } = useLocation();

  if (pathname.startsWith('/acceso-veeduria-k7q2x9')) {
    return <AccesoAdminPage />;
  }

  if (pathname.startsWith('/aprende')) {
    return <AprendePage />;
  }

  if (pathname.startsWith('/explora')) {
    return <ExploraPage />;
  }

  return <Home />;
}
