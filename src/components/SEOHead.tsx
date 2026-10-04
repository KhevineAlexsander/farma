import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const SEOHead: React.FC = () => {
  const { currentView, selectedProductDetail, storeSettings } = useApp();

  useEffect(() => {
    const brandName = storeSettings.storeName || 'Peptide Imports Farma';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://peptideimportsfarma.com.br';

    let title = `${brandName} | Peptídeos Importados de Alta Pureza`;
    let description = 'E-commerce e sistema de gestão completo para peptídeos importados de alta pureza com catálogo, carrinho e painel administrativo ERP.';
    let currentPath = '/';

    // Handle view-specific SEO metadata
    switch (currentView) {
      case 'dosage-calculator':
        title = `Calculadora de Doses & Seringa (UI) | ${brandName}`;
        description = 'Calcule a reconstituição de peptídeos em água bacteriostática, concentração mg/mL e marcação em seringas de 50 UI e 100 UI com visualizador animado e gráfico de acúmulo.';
        currentPath = '/?view=dosage-calculator';
        break;
      case 'guide':
        title = `Guia Científico & Posologia de Peptídeos | ${brandName}`;
        description = 'Manual completo de farmacologia e protocolos de peptídeos: Retatrutida, Cagrilintida, CagriSema, BPC-157, TB-500, dicas de diluição e respostas para dúvidas frequentes.';
        currentPath = '/?view=guide';
        break;
      case 'benefits':
        title = `Pureza HPLC Garantida & Benefícios | ${brandName}`;
        description = 'Conheça nossos diferenciais: laudo analítico de pureza HPLC superior a 99%, cadeia fria de conservação, envio rastreado para todo o Brasil e suporte técnico especializado.';
        currentPath = '/?view=benefits';
        break;
      case 'diet-control':
        title = `Controle de Dieta & Protocolos | ${brandName}`;
        description = 'Acompanhe seu consumo diário de calorias, macronutrientes, metas de hidratação e sinergia com seu protocolo de peptídeos.';
        currentPath = '/?view=diet-control';
        break;
      case 'product-request':
        title = `Solicitar Peptídeo Sob Encomenda | ${brandName}`;
        description = 'Precisa de um peptídeo ou dosagem específica para sua pesquisa ou protocolo? Solicite um orçamento personalizado com nossa equipe técnica.';
        currentPath = '/?view=product-request';
        break;
      case 'store':
      default:
        title = `${brandName} | Peptídeos Importados de Alta Pureza`;
        description = 'E-commerce e sistema de gestão completo para peptídeos importados de alta pureza com catálogo, carrinho e painel administrativo ERP.';
        currentPath = '/';
        break;
    }

    // Override if a product detail modal is active
    if (selectedProductDetail) {
      const prodName = selectedProductDetail.name || 'Peptídeo';
      const prodDosage = selectedProductDetail.dosage || '';
      const prodCategory = selectedProductDetail.category || 'Peptídeos';
      title = `${prodName} ${prodDosage} - Pureza HPLC >99% | ${brandName}`;
      description = selectedProductDetail.description
        ? `${selectedProductDetail.description.slice(0, 150)}... Compre ${prodName} com laudo analítico na ${brandName}.`
        : `Compre ${prodName} ${prodDosage} com garantia de pureza HPLC >99%, envio rápido e suporte farmacêutico na ${brandName}.`;
      currentPath = `/?produto=${encodeURIComponent(prodName.toLowerCase())}`;
    }

    // Apply Page Title
    document.title = title;

    // Helper to safely set meta tag content
    const setMetaTag = (selector: string, attr: string, value: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        if (selector.includes('property=')) {
          const prop = selector.match(/property="([^"]+)"/)?.[1];
          if (prop) el.setAttribute('property', prop);
        } else if (selector.includes('name=')) {
          const name = selector.match(/name="([^"]+)"/)?.[1];
          if (name) el.setAttribute('name', name);
        }
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    // Update standard meta
    setMetaTag('meta[name="description"]', 'content', description);
    setMetaTag('meta[name="title"]', 'content', title);

    // Update OpenGraph
    setMetaTag('meta[property="og:title"]', 'content', title);
    setMetaTag('meta[property="og:description"]', 'content', description);
    setMetaTag('meta[property="og:url"]', 'content', `${baseUrl}${currentPath}`);

    // Update Twitter Cards
    setMetaTag('meta[name="twitter:title"]', 'content', title);
    setMetaTag('meta[name="twitter:description"]', 'content', description);
    setMetaTag('meta[name="twitter:url"]', 'content', `${baseUrl}${currentPath}`);

    // Update or create Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${baseUrl}${currentPath}`;

    // Dynamic Product Schema JSON-LD for Search Engines
    const existingDynamicScript = document.getElementById('dynamic-product-jsonld');
    if (selectedProductDetail) {
      const productSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: `${selectedProductDetail.name} ${selectedProductDetail.dosage || ''}`.trim(),
        description: selectedProductDetail.description || `Peptídeo ${selectedProductDetail.name} com pureza garantida superior a 99% e laudo analítico COA.`,
        image: selectedProductDetail.imageUrl || `${baseUrl}/favicon.png`,
        sku: selectedProductDetail.id || selectedProductDetail.name.toLowerCase().replace(/\s+/g, '-'),
        category: selectedProductDetail.category || 'Peptídeos',
        offers: {
          '@type': 'Offer',
          url: `${baseUrl}/?produto=${encodeURIComponent(selectedProductDetail.name.toLowerCase())}`,
          priceCurrency: 'BRL',
          price: selectedProductDetail.price ? selectedProductDetail.price.toFixed(2) : '0.00',
          priceValidUntil: '2027-12-31',
          availability: selectedProductDetail.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'Organization',
            name: brandName,
          },
        },
      };

      if (existingDynamicScript) {
        existingDynamicScript.textContent = JSON.stringify(productSchema);
      } else {
        const scriptEl = document.createElement('script');
        scriptEl.id = 'dynamic-product-jsonld';
        scriptEl.type = 'application/ld+json';
        scriptEl.textContent = JSON.stringify(productSchema);
        document.head.appendChild(scriptEl);
      }
    } else if (existingDynamicScript) {
      existingDynamicScript.remove();
    }
  }, [currentView, selectedProductDetail, storeSettings]);

  return null;
};
