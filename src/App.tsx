/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { TrustRibbon } from './components/TrustRibbon';
import { ProductCatalog } from './components/ProductCatalog';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { AuthModal } from './components/AuthModal';
import { ClientAccountModal } from './components/ClientAccountModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { InfoModals } from './components/InfoModals';
import { MobileBottomBar } from './components/MobileBottomBar';
import { ScientificGuide } from './components/ScientificGuide';
import { ProductRequestPage } from './components/ProductRequestPage';

const MainLayout: React.FC = () => {
  const { currentView, currentUser } = useApp();

  // Direct dedicated view for Product Registration Form
  if (currentView === 'product-request') {
    return (
      <div className="min-h-screen bg-[#070A10]">
        <ProductRequestPage />
      </div>
    );
  }

  // Strict Access Barrier: If user is not an ADMIN, block admin view immediately
  if (currentView === 'admin') {
    if (currentUser?.role !== 'ADMIN') {
      return (
        <div className="min-h-screen flex flex-col bg-[#0B0F17]">
          <Navbar />
          <main className="flex-1">
            <HeroSection />
            <TrustRibbon />
            <ProductCatalog />
          </main>
          <Footer />
          <CartDrawer />
          <ProductDetailModal />
          <AuthModal />
          <InfoModals />
          <MobileBottomBar />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#0B0F17]">
        <AdminDashboard />
        <MobileBottomBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F17]">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Dynamic View */}
      <main className="flex-1">
        {currentView === 'store' && (
          <>
            <HeroSection />
            <TrustRibbon />
            <ProductCatalog />
          </>
        )}

        {currentView === 'guide' && (
          <ScientificGuide />
        )}

        {currentView === 'my-account' && (
          <ClientAccountModal />
        )}

        {currentView === 'checkout' && (
          <CheckoutModal />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Slide-over Cart & Modals */}
      <CartDrawer />
      <ProductDetailModal />
      <AuthModal />
      <InfoModals />

      {/* Mobile Fixed Bottom Bar */}
      <MobileBottomBar />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

