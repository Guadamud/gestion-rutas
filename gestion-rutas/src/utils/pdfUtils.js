import logoUleam from '../assets/LOGO-ULEAM.png';
import logoPajan from '../assets/logo del canton pajan .png';

// Función helper para agregar logos al PDF
export const agregarLogosPDF = async (doc, pageWidth) => {
  try {
    // Función para convertir imagen a base64 usando fetch
    const toDataURL = async (url) => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.warn('Error al cargar imagen:', error);
        return null;
      }
    };

    // Intentar cargar ambos logos
    const logoPajanBase64 = await toDataURL(logoPajan);
    const logoUleamBase64 = await toDataURL(logoUleam);

    // Agregar logos si están disponibles
    // Logo Paján (izquierda) - más grande
    if (logoPajanBase64) {
      doc.addImage(logoPajanBase64, 'PNG', 10, 10, 30, 15);
    }
    // Logo ULEAM (derecha) - más pequeño
    if (logoUleamBase64) {
      doc.addImage(logoUleamBase64, 'PNG', pageWidth - 30, 10, 20, 10);
    }
    
    return true;
  } catch (error) {
    console.warn('No se pudieron cargar los logos:', error);
    return false;
  }
};
