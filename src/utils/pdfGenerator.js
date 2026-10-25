// src/utils/pdfGenerator.js
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Convierte un elemento del DOM en un archivo PDF A4 de alta resolución
 * y gestiona su descarga o uso compartido en dispositivos móviles.
 */
export const exportElementToPdf = async (element, filename = 'reporte_maxima_potencia.pdf', options = {}) => {
  if (!element) {
    throw new Error('Elemento DOM no encontrado para exportar a PDF.');
  }

  const {
    orientation = 'portrait', // 'portrait' | 'landscape'
    backgroundColor = '#0f172a',
    quality = 2 // Factor de escala para nitidez retina/alta resolución
  } = options;

  try {
    // 1. Renderizar DOM a Canvas en alta resolución
    const canvas = await html2canvas(element, {
      scale: quality,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: backgroundColor,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });

    const imgData = canvas.toDataURL('image/png');

    // 2. Dimensiones A4 en milímetros
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pdfWidth = orientation === 'portrait' ? 210 : 297;
    const pdfHeight = orientation === 'portrait' ? 297 : 210;

    // Calcular proporción de imagen
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    // Si la altura entra en una sola página A4
    if (imgHeight <= pdfHeight) {
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
    } else {
      // Manejo de múltiples páginas si el contenido supera A4
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }
    }

    // 3. Descarga directa del archivo PDF
    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('Error generando PDF con html2canvas & jsPDF:', error);
    // Fallback: Si ocurre algún error en webview, intentar impresión nativa
    window.print();
    return false;
  }
};

/**
 * Comparte el PDF o reporte utilizando la Web Share API (ideal para móviles / tablets)
 */
export const shareReportNative = async ({ title, text, url }) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: title || 'Ficha de Rendimiento Máxima Potencia',
        text: text || '',
        url: url || window.location.href
      });
      return true;
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Error en navigator.share:', err);
      }
      return false;
    }
  }
  return false;
};
