/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { TrustRibbon } from './components/TrustRibbon';
import { ProductCatalog } from './components/ProductCatalog';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { AuthModal } from './components/AuthModal';
import { InfoModals } from './components/InfoModals';
import { MobileBottomBar } from './components/MobileBottomBar';
import { AdminLoadingScreen } from './components/AdminLoadingScreen';
import { SEOHead } from './components/SEOHead';

// Views that are not part of the storefront's first paint are code-split,
// so visitors don't download the admin panel, xlsx, or secondary pages up front.
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const CheckoutModal = lazy(() => import('./components/CheckoutModal').then(m => ({ default: m.CheckoutModal })));
const ClientAccountModal = lazy(() => import('./components/ClientAccountModal').then(m => ({ default: m.ClientAccountModal })));
const ScientificGuide = lazy(() => import('./components/ScientificGuide').then(m => ({ default: m.ScientificGuide })));
const ProductRequestPage = lazy(() => import('./components/ProductRequestPage').then(m => ({ default: m.ProductRequestPage })));
const BenefitsPage = lazy(() => import('./components/client/BenefitsPage').then(m => ({ default: m.BenefitsPage })));
const DosageCalculatorPage = lazy(() => import('./components/client/DosageCalculatorPage').then(m => ({ default: m.DosageCalculatorPage })));
const DietControlPage = lazy(() => import('./components/client/DietControlPage').then(m => ({ default: m.DietControlPage })));

const ViewFallback: React.FC = () => (
  <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
    <span className="sr-only">Carregando…</span>
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" aria-hidden="true" />
  </div>
);

const MainLayout: React.FC = () => {
  const { currentView, currentUser, isAdminLoading } = useApp();

  // Loading Screen with stylish progress bar when navigating to Admin Panel
  if (isAdminLoading) {
    return <AdminLoadingScreen />;
  }

  // Direct dedicated view for Product Registration Form
  if (currentView === 'product-request') {
    return (
      <div className="min-h-screen bg-[#0b0712]">
        <SEOHead />
        <Suspense fallback={<ViewFallback />}>
          <ProductRequestPage />
        </Suspense>
      </div>
    );
  }

  // Strict Access Barrier: If user is not an ADMIN, block admin view immediately
  if (currentView === 'admin') {
    if (currentUser?.role !== 'ADMIN') {
      return (
        <div className="min-h-screen flex flex-col bg-[#120b1c]">
          <SEOHead />
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
      <div className="min-h-screen bg-[#120b1c]">
        <Suspense fallback={<AdminLoadingScreen />}>
          <AdminDashboard />
        </Suspense>
        <MobileBottomBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#120b1c]">
      {/* Dynamic SEO Meta & Title Manager */}
      <SEOHead />

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

        <Suspense fallback={<ViewFallback />}>
          {currentView === 'guide' && (
            <ScientificGuide />
          )}

          {currentView === 'benefits' && (
            <BenefitsPage />
          )}

          {currentView === 'dosage-calculator' && (
            <DosageCalculatorPage />
          )}

          {currentView === 'diet-control' && (
            <DietControlPage />
          )}

          {currentView === 'my-account' && (
            <ClientAccountModal />
          )}

          {currentView === 'checkout' && (
            <CheckoutModal />
          )}
        </Suspense>
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

