import React, { useEffect, useState } from 'react';
import RoleHeader from '../../components/RoleHeader';
import {
  Typography, Container, Table, TableBody, TableCell, TableHead, TableRow,
  Paper, Button, Box, TextField, Card, CardContent, Grid, Chip,
  Alert, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, MenuItem, TableContainer, Stack
} from '@mui/material';
import {
  MonetizationOn, Receipt, PictureAsPdf, TableChart, CheckCircle,
  Pending, Cancel, CalendarToday, DirectionsBus, Route, Refresh,
  FilterList, AttachMoney, Analytics, Person, Today as TodayIcon,
  ChevronLeft, ChevronRight, Image, Visibility, Lock, History, TrendingUp
} from '@mui/icons-material';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { agregarLogosPDF } from '../../utils/pdfUtils';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const VALOR_POR_FRECUENCIA = 5.00;

// Función para convertir hora de 24h a 12h AM/PM
const convertirHoraAMPM = (hora24) => {
  if (!hora24) return '';
  const [horas, minutos] = hora24.split(':');
  const h = parseInt(horas);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutos} ${ampm}`;
};

const TesoreriaPage = () => {
  // Obtener userId del token
  const getUserIdFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch (error) {
      console.error('Error al decodificar token:', error);
      return null;
    }
  };

  const [userId] = useState(getUserIdFromToken());
  const [frecuencias, setFrecuencias] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [historialSolicitudes, setHistorialSolicitudes] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  });
  const [filtroFecha, setFiltroFecha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filtroHistorial, setFiltroHistorial] = useState('todos');
  const [openDetalleDialog, setOpenDetalleDialog] = useState(false);
  const [frecuenciaSeleccionada, setFrecuenciaSeleccionada] = useState(null);
  const [paginaHistorial, setPaginaHistorial] = useState(0);
  const [filasPorPagina] = useState(10);
  const [paginaFrecuencias, setPaginaFrecuencias] = useState(0);
  const [filasPorPaginaFrecuencias] = useState(5);
  const [openComprobanteDialog, setOpenComprobanteDialog] = useState(false);
  const [comprobanteSeleccionado, setComprobanteSeleccionado] = useState(null);
  
  // Estados para cierre de caja
  const [openCierreDialog, setOpenCierreDialog] = useState(false);
  const [montoCierre, setMontoCierre] = useState('');
  const [observacionesCierre, setObservacionesCierre] = useState('');
  const [datosCierre, setDatosCierre] = useState(null);
  const [loadingCierre, setLoadingCierre] = useState(false);
  const [cierresHistorial, setCierresHistorial] = useState([]);
  const [openHistorialCierres, setOpenHistorialCierres] = useState(false);
  const [resumenMensualCierres, setResumenMensualCierres] = useState(null);
  const [cierreHoyExiste, setCierreHoyExiste] = useState(false);
  const [cierreHoyData, setCierreHoyData] = useState(null);
  const [paginaCierres, setPaginaCierres] = useState(0);
  const [filasPorPaginaCierres] = useState(5);
  const [anioFiltroCierres, setAnioFiltroCierres] = useState(() => new Date().getFullYear());
  const [claveAdmin, setClaveAdmin] = useState(''); // Clave de autorizacién del admin

  const cargarSolicitudes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/clientes/solicitudes/pendientes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSolicitudes(response.data);
    } catch (error) {
      console.error("Error al cargar solicitudes:", error);
    }
  };

  const cargarHistorialSolicitudes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/clientes/solicitudes/historial`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHistorialSolicitudes(response.data);
    } catch (error) {
      console.error("Error al cargar historial:", error);
    }
  };

  const procesarSolicitud = async (id, accion) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/api/clientes/solicitudes/${id}/procesar`,
        { accion },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(`Solicitud ${accion === 'aprobar' ? 'aprobada' : 'rechazada'} correctamente`);
      cargarSolicitudes();
      cargarHistorialSolicitudes();
    } catch (error) {
      console.error("Error al procesar solicitud:", error);
      setError("Error al procesar solicitud");
    }
  };

  const cargarFrecuencias = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/frecuencias`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Filtrar frecuencias de la fecha seleccionada
      const frecuenciasFiltradas = response.data.filter(f => f.fecha === fechaSeleccionada);
      setFrecuencias(frecuenciasFiltradas);
      setError('');
    } catch (error) {
      console.error("Error al cargar frecuencias:", error);
      setError("Error al obtener frecuencias.");
    } finally {
      setLoading(false);
    }
  };

  const verDetalle = (frecuencia) => {
    setFrecuenciaSeleccionada(frecuencia);
    setOpenDetalleDialog(true);
  };

  // Exportar cierres de caja a PDF
  const exportarCierresPDF = async () => {
    if (!resumenMensualCierres || cierresHistorial.length === 0) {
      setError('No hay datos de cierres para exportar');
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // ===== ENCABEZADO CON LOGOS =====
      await agregarLogosPDF(doc, pageWidth);
      
      // Título principal centrado
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      const mesAnio = fechaSeleccionada.substring(0, 7);
      const [anio, mes] = mesAnio.split('-');
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const mesNombre = meses[parseInt(mes) - 1];
      const titulo = `CIERRES DE CAJA - ${mesNombre.toUpperCase()} ${anio}`;
      const titleWidth = doc.getTextWidth(titulo);
      doc.text(titulo, (pageWidth - titleWidth) / 2, 18);
      
      // Subtítulo
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const subtitulo = 'Reporte Mensual de Tesorería';
      const subWidth = doc.getTextWidth(subtitulo);
      doc.text(subtitulo, (pageWidth - subWidth) / 2, 25);
      
      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(10, 28, pageWidth - 10, 28);
      
      // ===== RESUMEN MENSUAL EN TARJETAS =====
      let yPos = 35;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('RESUMEN DEL MES:', 14, yPos);
      
      yPos += 8;
      doc.setFontSize(10);
      
      // Crear cuadros de resumen
      const boxWidth = 45;
      const boxHeight = 15;
      const startX = 14;
      let currentX = startX;
      
      // Cuadro 1: Total Cierres
      doc.setDrawColor(41, 128, 185);
      doc.setFillColor(240, 248, 255);
      doc.roundedRect(currentX, yPos, boxWidth, boxHeight, 2, 2, 'FD');
      doc.setTextColor(41, 128, 185);
      doc.setFont('helvetica', 'bold');
      doc.text('Total Cierres', currentX + 3, yPos + 5);
      doc.setFontSize(14);
      doc.text(resumenMensualCierres.total_cierres.toString(), currentX + 3, yPos + 11);
      
      currentX += boxWidth + 3;
      
      // Cuadro 2: Recaudado Total
      doc.setDrawColor(46, 204, 113);
      doc.setFillColor(240, 255, 240);
      doc.roundedRect(currentX, yPos, boxWidth, boxHeight, 2, 2, 'FD');
      doc.setTextColor(46, 204, 113);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Recaudado Total', currentX + 3, yPos + 5);
      doc.setFontSize(14);
      doc.text(`$${resumenMensualCierres.monto_real_total.toFixed(2)}`, currentX + 3, yPos + 11);
      
      currentX += boxWidth + 3;
      
      // Cuadro 3: Diferencia
      const diferencia = resumenMensualCierres.diferencia_total;
      const colorDif = diferencia >= 0 ? [255, 152, 0] : [244, 67, 54];
      const colorBgDif = diferencia >= 0 ? [255, 248, 225] : [255, 235, 238];
      doc.setDrawColor(...colorDif);
      doc.setFillColor(...colorBgDif);
      doc.roundedRect(currentX, yPos, boxWidth, boxHeight, 2, 2, 'FD');
      doc.setTextColor(...colorDif);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Diferencia', currentX + 3, yPos + 5);
      doc.setFontSize(14);
      doc.text(`${diferencia >= 0 ? '+' : ''}$${diferencia.toFixed(2)}`, currentX + 3, yPos + 11);
      
      currentX += boxWidth + 3;
      
      // Cuadro 4: Cuadres Exactos
      doc.setDrawColor(33, 150, 243);
      doc.setFillColor(232, 245, 253);
      doc.roundedRect(currentX, yPos, boxWidth, boxHeight, 2, 2, 'FD');
      doc.setTextColor(33, 150, 243);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Cuadres Exactos', currentX + 3, yPos + 5);
      doc.setFontSize(14);
      doc.text(resumenMensualCierres.cierres_exactos.toString(), currentX + 3, yPos + 11);
      
      doc.setTextColor(0, 0, 0);
      yPos += boxHeight + 10;

      // ===== TABLA DE CIERRES =====
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALLE DE CIERRES:', 14, yPos);
      yPos += 5;

      const tableData = cierresHistorial.map(c => {
        const diferencia = parseFloat(c.diferencia);
        return [
          new Date(c.fecha).toLocaleDateString('es-ES'),
          c.hora_cierre,
          `$${parseFloat(c.monto_sistema).toFixed(2)}`,
          `$${parseFloat(c.monto_real).toFixed(2)}`,
          `${diferencia >= 0 ? '+' : ''}$${diferencia.toFixed(2)}`,
          c.total_frecuencias,
          c.solicitudes_aprobadas,
          c.cerradoPor ? `${c.cerradoPor.nombres} ${c.cerradoPor.apellidos}` : 'N/A'
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['Fecha', 'Hora', 'Sistema', 'Real', 'Diferencia', 'Frec.', 'Sol.', 'Cerrado Por']],
        body: tableData,
        theme: 'striped',
        styles: { 
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 22 },
          1: { halign: 'center', cellWidth: 18 },
          2: { halign: 'right', cellWidth: 22 },
          3: { halign: 'right', cellWidth: 22 },
          4: { halign: 'right', cellWidth: 22 },
          5: { halign: 'center', cellWidth: 15 },
          6: { halign: 'center', cellWidth: 15 },
          7: { halign: 'left', cellWidth: 'auto' }
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      });

      // ===== PIE DE PÁGINA =====
      const finalY = doc.lastAutoTable.finalY + 25;
      
      if (finalY < pageHeight - 40) {
        // Espacio de firma - centrado
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const tituloFirma = 'REVISADO POR:';
        const tituloWidth = doc.getTextWidth(tituloFirma);
        doc.text(tituloFirma, (pageWidth - tituloWidth) / 2, finalY);
        
        const firmaY = finalY + 20;
        doc.setLineWidth(0.3);
        const lineaAncho = 80;
        const lineaX = (pageWidth - lineaAncho) / 2;
        doc.line(lineaX, firmaY, lineaX + lineaAncho, firmaY);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const textoFirma = 'Nombre y Firma del Tesorero';
        const textoWidth = doc.getTextWidth(textoFirma);
        doc.text(textoFirma, (pageWidth - textoWidth) / 2, firmaY + 6);
      }
      
      // Pie de página
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
          `Página ${i} de ${pageCount} - Generado el ${new Date().toLocaleDateString('es-ES')} - Sistema de Gestión de Rutas`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
      doc.setTextColor(0, 0, 0);

      doc.save(`cierres_caja_${mesAnio}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      setError('Error al generar el PDF de cierres');
    }
  };

  // Exportar cierres mensuales a Excel con formato profesional y logos
  const exportarCierresExcel = async () => {
    if (cierresHistorial.length === 0) {
      setError('No hay datos de cierres para exportar');
      return;
    }

    try {
      const mesAnio = fechaSeleccionada.substring(0, 7);
      const [anio, mes] = mesAnio.split('-');
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const mesNombre = meses[parseInt(mes) - 1];

      // Crear workbook y worksheet con ExcelJS
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Cierres de Caja', {
        pageSetup: { 
          paperSize: 9, 
          orientation: 'landscape', 
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
          scale: 85,
          margins: { 
            left: 0.4, 
            right: 0.4, 
            top: 0.6, 
            bottom: 0.6,
            header: 0.3,
            footer: 0.3
          },
          horizontalCentered: true,
          printArea: 'A1:L100',
          printTitlesRow: '1:17'
        },
        views: [{ showGridLines: false }]
      });

      // Encabezado institucional
      const headerRow1 = worksheet.addRow(['UNIVERSIDAD LAICA ELOY ALFARO DE MANABÍ']);
      worksheet.mergeCells(`A${headerRow1.number}:L${headerRow1.number}`);
      headerRow1.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1565C0' } };
      headerRow1.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow1.height = 18;

      const headerRow2 = worksheet.addRow(['SISTEMA DE GESTIÓN DE RUTAS - CANTÓN PAJÁN']);
      worksheet.mergeCells(`A${headerRow2.number}:L${headerRow2.number}`);
      headerRow2.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF424242' } };
      headerRow2.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow2.height = 16;

      worksheet.addRow([]);

      // Título principal con merge y estilo
      const titleRow = worksheet.addRow(['REPORTE DE CIERRES DE CAJA']);
      worksheet.mergeCells(`A${titleRow.number}:L${titleRow.number}`);
      titleRow.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1565C0' } };
      titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
      titleRow.height = 25;

      // Subtítulo
      const subtitleRow = worksheet.addRow([`${mesNombre} ${anio}`]);
      worksheet.mergeCells(`A${subtitleRow.number}:L${subtitleRow.number}`);
      subtitleRow.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF424242' } };
      subtitleRow.alignment = { horizontal: 'center', vertical: 'middle' };
      subtitleRow.height = 20;

      worksheet.addRow([]);

      // Información del resumen con estilo
      const infoHeaderRow = worksheet.addRow(['RESUMEN DEL PERIODO']);
      worksheet.mergeCells(`A${infoHeaderRow.number}:L${infoHeaderRow.number}`);
      infoHeaderRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      infoHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } };
      infoHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
      infoHeaderRow.height = 20;

      // Datos del resumen
      const addInfoRow = (label, value) => {
        const row = worksheet.addRow([label, value]);
        worksheet.mergeCells(`B${row.number}:L${row.number}`);
        row.getCell(1).font = { bold: true };
        row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
        row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
        row.eachCell(cell => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFB0BEC5' } },
            left: { style: 'thin', color: { argb: 'FFB0BEC5' } },
            bottom: { style: 'thin', color: { argb: 'FFB0BEC5' } },
            right: { style: 'thin', color: { argb: 'FFB0BEC5' } }
          };
        });
      };

      addInfoRow('Total de Cierres:', resumenMensualCierres?.total_cierres || 0);
      addInfoRow('Recaudado Total:', `$${(resumenMensualCierres?.monto_real_total || 0).toFixed(2)}`);
      addInfoRow('Monto Sistema:', `$${(resumenMensualCierres?.monto_sistema_total || 0).toFixed(2)}`);
      addInfoRow('Diferencia Total:', `$${(resumenMensualCierres?.diferencia_total || 0).toFixed(2)}`);
      addInfoRow('Cuadres Exactos:', resumenMensualCierres?.cierres_exactos || 0);

      worksheet.addRow([]);

      // Encabezado de tabla
      const tableHeaderRow = worksheet.addRow(['Fecha', 'Hora', 'Monto Sistema', 'Monto Real', 'Diferencia', 'Total Solicitudes', 'Solicitudes Aprobadas', 'Total Frecuencias', 'Cerrado Por', 'Email Usuario', 'Observaciones', 'Estado']);
      tableHeaderRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      tableHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1976D2' } };
      tableHeaderRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      tableHeaderRow.height = 30;
      tableHeaderRow.eachCell(cell => {
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF0D47A1' } },
          left: { style: 'thin', color: { argb: 'FF0D47A1' } },
          bottom: { style: 'medium', color: { argb: 'FF0D47A1' } },
          right: { style: 'thin', color: { argb: 'FF0D47A1' } }
        };
      });

      // Agregar datos con formato alternado
      cierresHistorial.forEach((c, index) => {
        const row = worksheet.addRow([
          new Date(c.fecha).toLocaleDateString('es-ES'),
          c.hora_cierre,
          parseFloat(c.monto_sistema),
          parseFloat(c.monto_real),
          parseFloat(c.diferencia),
          c.total_solicitudes,
          c.solicitudes_aprobadas,
          c.total_frecuencias,
          c.cerradoPor ? `${c.cerradoPor.nombres} ${c.cerradoPor.apellidos}` : 'N/A',
          c.cerradoPor?.email || 'N/A',
          c.observaciones || '-',
          c.estado
        ]);
        
        row.font = { name: 'Arial', size: 8 };
        row.alignment = { vertical: 'middle', wrapText: true };
        row.height = 18;
        
        // Color alternado
        const fillColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF5F5F5';
        row.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
          };
        });
        
        // Formato de moneda para columnas numéricas
        row.getCell(3).numFmt = '$#,##0.00';
        row.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
        row.getCell(4).numFmt = '$#,##0.00';
        row.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
        row.getCell(5).numFmt = '$#,##0.00';
        row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
      });

      // Fila de total
      if (resumenMensualCierres) {
        const totalRow = worksheet.addRow([
          '--- RESUMEN MENSUAL ---',
          '',
          resumenMensualCierres.monto_sistema_total,
          resumenMensualCierres.monto_real_total,
          resumenMensualCierres.diferencia_total,
          '',
          '',
          '',
          `Total: ${resumenMensualCierres.total_cierres} cierres`,
          `Exactos: ${resumenMensualCierres.cierres_exactos}`,
          '',
          ''
        ]);
        totalRow.font = { name: 'Arial', size: 10, bold: true };
        totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4CAF50' } };
        totalRow.alignment = { horizontal: 'center', vertical: 'middle' };
        totalRow.height = 25;
        totalRow.getCell(3).numFmt = '$#,##0.00';
        totalRow.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
        totalRow.getCell(4).numFmt = '$#,##0.00';
        totalRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
        totalRow.getCell(5).numFmt = '$#,##0.00';
        totalRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
        totalRow.eachCell(cell => {
          cell.border = {
            top: { style: 'medium', color: { argb: 'FF2E7D32' } },
            left: { style: 'thin', color: { argb: 'FF2E7D32' } },
            bottom: { style: 'medium', color: { argb: 'FF2E7D32' } },
            right: { style: 'thin', color: { argb: 'FF2E7D32' } }
          };
        });
      }

      worksheet.addRow([]);
      worksheet.addRow([]);

      // Sección de firma
      const firmaRow = worksheet.addRow(['REVISADO POR:']);
      worksheet.mergeCells(`A${firmaRow.number}:L${firmaRow.number}`);
      firmaRow.font = { name: 'Arial', size: 11, bold: true };
      firmaRow.alignment = { horizontal: 'center', vertical: 'middle' };
      firmaRow.height = 20;

      worksheet.addRow([]);
      worksheet.addRow([]);

      const lineaRow = worksheet.addRow(['_________________________________']);
      worksheet.mergeCells(`A${lineaRow.number}:L${lineaRow.number}`);
      lineaRow.alignment = { horizontal: 'center', vertical: 'middle' };

      const nombreRow = worksheet.addRow(['Nombre y Firma del Supervisor']);
      worksheet.mergeCells(`A${nombreRow.number}:L${nombreRow.number}`);
      nombreRow.font = { name: 'Arial', size: 10, bold: true };
      nombreRow.alignment = { horizontal: 'center', vertical: 'middle' };

      worksheet.addRow([]);

      // Pie de página
      const footerRow1 = worksheet.addRow([`Generado el: ${new Date().toLocaleString('es-ES')}`]);
      worksheet.mergeCells(`A${footerRow1.number}:L${footerRow1.number}`);
      footerRow1.font = { name: 'Arial', size: 8, color: { argb: 'FF9E9E9E' } };
      footerRow1.alignment = { horizontal: 'center', vertical: 'middle' };

      const footerRow2 = worksheet.addRow(['Sistema de Gestión de Rutas - Cantón Paján']);
      worksheet.mergeCells(`A${footerRow2.number}:L${footerRow2.number}`);
      footerRow2.font = { name: 'Arial', size: 8, color: { argb: 'FF9E9E9E' } };
      footerRow2.alignment = { horizontal: 'center', vertical: 'middle' };

      // Ajustar anchos de columna para una página
      worksheet.columns = [
        { width: 10 },  // Fecha
        { width: 8 },   // Hora
        { width: 12 },  // Monto Sistema
        { width: 12 },  // Monto Real
        { width: 10 },  // Diferencia
        { width: 12 },  // Total Solicitudes
        { width: 15 },  // Solicitudes Aprobadas
        { width: 12 },  // Total Frecuencias
        { width: 20 },  // Cerrado Por
        { width: 22 },  // Email Usuario
        { width: 25 },  // Observaciones
        { width: 10 }   // Estado
      ];

      // Generar y descargar archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `cierres_caja_${mesAnio}_${mesNombre}.xlsx`);
    } catch (error) {
      console.error('Error al exportar cierres:', error);
      setError('Error al exportar cierres');
    }
  };

  // Exportar solicitudes aprobadas a PDF (con ID de cierre, rango de fechas opcional)
  const exportarSolicitudesPDF = async (cierreId = null, fechaInicio = null, fechaFin = null, titulo = null) => {
    try {
      console.log('🔍 Exportando PDF con params:', { cierreId, fechaInicio, fechaFin, titulo });
      const token = localStorage.getItem('token');
      
      const params = cierreId 
        ? { cierre_id: cierreId }
        : fechaInicio && fechaFin 
        ? { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
        : { fecha_inicio: fechaSeleccionada, fecha_fin: fechaSeleccionada };
      
      console.log('📤 Enviando petición con params:', params);
      const response = await axios.get(`${API_URL}/api/cierre-caja/solicitudes-aprobadas`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      const solicitudes = response.data;
      console.log('✅ Solicitudes recibidas:', solicitudes.length);

      if (solicitudes.length === 0) {
        setError('No hay solicitudes aprobadas para exportar en este periodo');
        setTimeout(() => setError(''), 3000);
        return;
      }

      // Obtener datos del cierre específico si existe
      let datosCierreCompleto = null;
      if (cierreId) {
        try {
          const cierreResponse = await axios.get(`${API_URL}/api/cierre-caja/detalle/${cierreId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          datosCierreCompleto = cierreResponse.data;
        } catch (err) {
          console.error('Error al obtener datos del cierre:', err);
        }
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // ===== ENCABEZADO CON LOGOS =====
      await agregarLogosPDF(doc, pageWidth);
      
      // Título principal centrado
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      const tituloDoc = titulo || `Cierre ${fechaSeleccionada.split('-').reverse().join('/')}`;
      const titleWidth = doc.getTextWidth(tituloDoc);
      doc.text(tituloDoc, (pageWidth - titleWidth) / 2, 18);
      
      // Subtítulo
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const subtitulo = 'REPORTE DE SOLICITUDES APROBADAS';
      const subWidth = doc.getTextWidth(subtitulo);
      doc.text(subtitulo, (pageWidth - subWidth) / 2, 25);
      
      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(10, 28, pageWidth - 10, 28);
      
      // ===== INFORMACIÓN DEL CIERRE =====
      let yPos = 35;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      
      const totalRecaudado = solicitudes.reduce((sum, s) => sum + parseFloat(s.monto || 0), 0);
      
      // Información en dos columnas
      doc.text('Fecha de generación:', 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', month: 'long', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      }), 60, yPos);
      
      yPos += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Total Solicitudes:', 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(solicitudes.length.toString(), 60, yPos);
      
      yPos += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('Total Recaudado:', 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 128, 0);
      doc.text(`$${totalRecaudado.toFixed(2)}`, 60, yPos);
      doc.setTextColor(0, 0, 0);
      
      // Información del usuario que cerró (si existe)
      if (datosCierreCompleto && datosCierreCompleto.cerradoPor) {
        yPos += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Cerrado por:', 14, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `${datosCierreCompleto.cerradoPor.nombres} ${datosCierreCompleto.cerradoPor.apellidos}`,
          60, yPos
        );
        
        yPos += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Hora de cierre:', 14, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(datosCierreCompleto.hora_cierre || 'N/A', 60, yPos);
      }
      
      yPos += 8;
      
      // ===== TABLA DE SOLICITUDES =====
      const tableData = solicitudes.map(s => [
        s.id,
        s.Cliente ? `${s.Cliente.nombres} ${s.Cliente.apellidos}` : 'N/A',
        `$${parseFloat(s.monto).toFixed(2)}`,
        s.metodoPago || 'N/A',
        new Date(s.createdAt).toLocaleDateString('es-ES'),
        s.solicitadoPor === 'conductor' ? 'Conductor' : 'Dueño'
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['ID', 'Cliente', 'Monto', 'Método', 'Fecha', 'Tipo']],
        body: tableData,
        theme: 'striped',
        styles: { 
          fontSize: 9,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 15 },
          2: { halign: 'right' },
          4: { halign: 'center' },
          5: { halign: 'center' }
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      });
      
      // ===== PIE DE PÁGINA CON FIRMA =====
      const finalY = doc.lastAutoTable.finalY || yPos + 50;
      const espacioDisponible = pageHeight - finalY;
      
      if (espacioDisponible > 50) {
        // Espacio para firma en la misma página
        let firmaY = finalY + 30; // Más espacio desde la tabla
        
        // Sección de firma - centrada
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const tituloFirma = 'FIRMA Y SELLO DE RESPONSABLE:';
        const tituloWidth = doc.getTextWidth(tituloFirma);
        doc.text(tituloFirma, (pageWidth - tituloWidth) / 2, firmaY);
        
        firmaY += 20;
        // Línea para firma - centrada
        doc.setLineWidth(0.3);
        const lineaAncho = 80;
        const lineaX = (pageWidth - lineaAncho) / 2;
        doc.line(lineaX, firmaY, lineaX + lineaAncho, firmaY);
        
        firmaY += 6;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        if (datosCierreCompleto && datosCierreCompleto.cerradoPor) {
          const nombreCompleto = `${datosCierreCompleto.cerradoPor.nombres} ${datosCierreCompleto.cerradoPor.apellidos}`;
          const nombreWidth = doc.getTextWidth(nombreCompleto);
          doc.text(nombreCompleto, (pageWidth - nombreWidth) / 2, firmaY);
          
          firmaY += 4;
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          const email = datosCierreCompleto.cerradoPor.email || '';
          const emailWidth = doc.getTextWidth(email);
          doc.text(email, (pageWidth - emailWidth) / 2, firmaY);
          doc.setTextColor(0, 0, 0);
        } else {
          const textoGenerico = 'Nombre y Firma del Responsable';
          const textoWidth = doc.getTextWidth(textoGenerico);
          doc.text(textoGenerico, (pageWidth - textoWidth) / 2, firmaY);
        }
      } else {
        // Agregar nueva página para la firma
        doc.addPage();
        let firmaY = 30;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const tituloFirma = 'FIRMA Y SELLO DE RESPONSABLE:';
        const tituloWidth = doc.getTextWidth(tituloFirma);
        doc.text(tituloFirma, (pageWidth - tituloWidth) / 2, firmaY);
        
        firmaY += 20;
        doc.setLineWidth(0.3);
        const lineaAncho = 80;
        const lineaX = (pageWidth - lineaAncho) / 2;
        doc.line(lineaX, firmaY, lineaX + lineaAncho, firmaY);
        
        firmaY += 6;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        if (datosCierreCompleto && datosCierreCompleto.cerradoPor) {
          const nombreCompleto = `${datosCierreCompleto.cerradoPor.nombres} ${datosCierreCompleto.cerradoPor.apellidos}`;
          const nombreWidth = doc.getTextWidth(nombreCompleto);
          doc.text(nombreCompleto, (pageWidth - nombreWidth) / 2, firmaY);
          
          firmaY += 4;
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          const email = datosCierreCompleto.cerradoPor.email || '';
          const emailWidth = doc.getTextWidth(email);
          doc.text(email, (pageWidth - emailWidth) / 2, firmaY);
          doc.setTextColor(0, 0, 0);
        } else {
          const textoGenerico = 'Nombre y Firma del Responsable';
          const textoWidth = doc.getTextWidth(textoGenerico);
          doc.text(textoGenerico, (pageWidth - textoWidth) / 2, firmaY);
        }
      }
      
      // Pie de página en todas las páginas
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
          `Página ${i} de ${pageCount} - Generado el ${new Date().toLocaleDateString('es-ES')} - Sistema de Gestión de Rutas`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
      doc.setTextColor(0, 0, 0);

      const nombreArchivo = titulo 
        ? `solicitudes_${titulo.replace(/\s+/g, '_').toLowerCase()}.pdf`
        : `solicitudes_aprobadas_${fechaSeleccionada}.pdf`;
      doc.save(nombreArchivo);
    } catch (error) {
      console.error('Error al exportar solicitudes:', error);
      setError('Error al exportar solicitudes');
    }
  };

  // Exportar solicitudes aprobadas a Excel con formato profesional y logos
  const exportarSolicitudesExcel = async (cierreId = null, fechaInicio = null, fechaFin = null, titulo = null) => {
    try {
      const token = localStorage.getItem('token');
      
      const params = cierreId 
        ? { cierre_id: cierreId }
        : fechaInicio && fechaFin 
        ? { fecha_inicio: fechaInicio, fecha_fin: fechaFin }
        : { fecha_inicio: fechaSeleccionada, fecha_fin: fechaSeleccionada };
      
      const response = await axios.get(`${API_URL}/api/cierre-caja/solicitudes-aprobadas`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      const solicitudes = response.data;

      if (solicitudes.length === 0) {
        setError('No hay solicitudes aprobadas para exportar en este periodo');
        setTimeout(() => setError(''), 3000);
        return;
      }

      // Obtener datos del cierre si existe
      let datosCierreCompleto = null;
      if (cierreId) {
        try {
          const cierreResponse = await axios.get(`${API_URL}/api/cierre-caja/detalle/${cierreId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          datosCierreCompleto = cierreResponse.data;
        } catch (err) {
          console.error('Error al obtener datos del cierre:', err);
        }
      }

      const totalRecaudado = solicitudes.reduce((sum, s) => sum + parseFloat(s.monto || 0), 0);
      const tituloDoc = titulo || `Cierre ${fechaSeleccionada.split('-').reverse().join('/')}`;

      // Crear workbook y worksheet con ExcelJS
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Solicitudes Aprobadas', {
        pageSetup: { 
          paperSize: 9, 
          orientation: 'landscape', 
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
          scale: 85,
          margins: { 
            left: 0.4, 
            right: 0.4, 
            top: 0.6, 
            bottom: 0.6,
            header: 0.3,
            footer: 0.3
          },
          horizontalCentered: true
        },
        views: [{ showGridLines: false }]
      });

      // Encabezado institucional
      const headerRow1 = worksheet.addRow(['UNIVERSIDAD LAICA ELOY ALFARO DE MANABÍ']);
      worksheet.mergeCells(`A${headerRow1.number}:J${headerRow1.number}`);
      headerRow1.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1565C0' } };
      headerRow1.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow1.height = 18;

      const headerRow2 = worksheet.addRow(['SISTEMA DE GESTIÓN DE RUTAS - CANTÓN PAJÁN']);
      worksheet.mergeCells(`A${headerRow2.number}:J${headerRow2.number}`);
      headerRow2.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF424242' } };
      headerRow2.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow2.height = 16;

      worksheet.addRow([]);

      // Título principal con merge y estilo
      const titleRow = worksheet.addRow(['REPORTE DE SOLICITUDES APROBADAS']);
      worksheet.mergeCells(`A${titleRow.number}:J${titleRow.number}`);
      titleRow.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1565C0' } };
      titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
      titleRow.height = 25;

      // Subtítulo
      const subtitleRow = worksheet.addRow([tituloDoc]);
      worksheet.mergeCells(`A${subtitleRow.number}:J${subtitleRow.number}`);
      subtitleRow.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF424242' } };
      subtitleRow.alignment = { horizontal: 'center', vertical: 'middle' };
      subtitleRow.height = 20;

      worksheet.addRow([]);

      // Información del cierre con estilo
      const infoHeaderRow = worksheet.addRow(['INFORMACIÓN DEL CIERRE']);
      worksheet.mergeCells(`A${infoHeaderRow.number}:J${infoHeaderRow.number}`);
      infoHeaderRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      infoHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } };
      infoHeaderRow.alignment = { horizontal: 'center', vertical: 'middle' };
      infoHeaderRow.height = 20;

      // Datos del cierre
      const addInfoRow = (label, value) => {
        const row = worksheet.addRow([label, value]);
        worksheet.mergeCells(`B${row.number}:J${row.number}`);
        row.getCell(1).font = { bold: true };
        row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
        row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
        row.eachCell(cell => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFB0BEC5' } },
            left: { style: 'thin', color: { argb: 'FFB0BEC5' } },
            bottom: { style: 'thin', color: { argb: 'FFB0BEC5' } },
            right: { style: 'thin', color: { argb: 'FFB0BEC5' } }
          };
        });
      };

      addInfoRow('Fecha de generación:', new Date().toLocaleString('es-ES'));
      addInfoRow('Total Solicitudes:', solicitudes.length);
      addInfoRow('Total Recaudado:', `$${totalRecaudado.toFixed(2)}`);

      if (datosCierreCompleto?.cerradoPor) {
        addInfoRow('Cerrado por:', `${datosCierreCompleto.cerradoPor.nombres} ${datosCierreCompleto.cerradoPor.apellidos}`);
        addInfoRow('Email:', datosCierreCompleto.cerradoPor.email || 'N/A');
        addInfoRow('Hora de cierre:', datosCierreCompleto.hora_cierre || 'N/A');
      }

      worksheet.addRow([]);

      // Encabezado de tabla
      const tableHeaderRow = worksheet.addRow(['ID', 'Cliente', 'Email Cliente', 'Teléfono', 'Monto', 'Método de Pago', 'Fecha Aprobación', 'Solicitado Por', 'Descripción', 'Estado']);
      tableHeaderRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      tableHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1976D2' } };
      tableHeaderRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      tableHeaderRow.height = 30;
      tableHeaderRow.eachCell(cell => {
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF0D47A1' } },
          left: { style: 'thin', color: { argb: 'FF0D47A1' } },
          bottom: { style: 'medium', color: { argb: 'FF0D47A1' } },
          right: { style: 'thin', color: { argb: 'FF0D47A1' } }
        };
      });

      // Agregar datos con formato alternado
      solicitudes.forEach((s, index) => {
        const row = worksheet.addRow([
          s.id,
          s.Cliente ? `${s.Cliente.nombres} ${s.Cliente.apellidos}` : 'N/A',
          s.Cliente?.email || 'N/A',
          s.Cliente?.telefono || 'N/A',
          parseFloat(s.monto),
          s.metodoPago || 'N/A',
          new Date(s.createdAt).toLocaleString('es-ES'),
          s.solicitadoPor === 'conductor' ? 'Conductor' : 'Dueño',
          s.descripcion || 'Sin descripción',
          s.estado || 'Aprobada'
        ]);
        
        row.font = { name: 'Arial', size: 8 };
        row.alignment = { vertical: 'middle', wrapText: true };
        row.height = 18;
        
        // Color alternado
        const fillColor = index % 2 === 0 ? 'FFFFFFFF' : 'FFF5F5F5';
        row.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
            right: { style: 'thin', color: { argb: 'FFE0E0E0' } }
          };
        });
        
        // Formato de moneda
        row.getCell(5).numFmt = '$#,##0.00';
        row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
      });

      // Fila de total
      const totalRow = worksheet.addRow(['', '--- RESUMEN ---', '', '', totalRecaudado, '', `Total: ${solicitudes.length} solicitudes`, '', '', '']);
      totalRow.font = { name: 'Arial', size: 10, bold: true };
      totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4CAF50' } };
      totalRow.alignment = { horizontal: 'center', vertical: 'middle' };
      totalRow.height = 25;
      totalRow.getCell(5).numFmt = '$#,##0.00';
      totalRow.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
      totalRow.eachCell(cell => {
        cell.border = {
          top: { style: 'medium', color: { argb: 'FF2E7D32' } },
          left: { style: 'thin', color: { argb: 'FF2E7D32' } },
          bottom: { style: 'medium', color: { argb: 'FF2E7D32' } },
          right: { style: 'thin', color: { argb: 'FF2E7D32' } }
        };
      });

      worksheet.addRow([]);
      worksheet.addRow([]);

      // Sección de firma
      const firmaRow = worksheet.addRow(['FIRMA Y SELLO DE RESPONSABLE:']);
      worksheet.mergeCells(`A${firmaRow.number}:J${firmaRow.number}`);
      firmaRow.font = { name: 'Arial', size: 11, bold: true };
      firmaRow.alignment = { horizontal: 'center', vertical: 'middle' };
      firmaRow.height = 20;

      worksheet.addRow([]);
      worksheet.addRow([]);

      const lineaRow = worksheet.addRow(['_________________________________']);
      worksheet.mergeCells(`A${lineaRow.number}:J${lineaRow.number}`);
      lineaRow.alignment = { horizontal: 'center', vertical: 'middle' };

      const nombreRow = worksheet.addRow([datosCierreCompleto?.cerradoPor 
        ? `${datosCierreCompleto.cerradoPor.nombres} ${datosCierreCompleto.cerradoPor.apellidos}`
        : 'Nombre y Firma del Responsable']);
      worksheet.mergeCells(`A${nombreRow.number}:J${nombreRow.number}`);
      nombreRow.font = { name: 'Arial', size: 10, bold: true };
      nombreRow.alignment = { horizontal: 'center', vertical: 'middle' };

      if (datosCierreCompleto?.cerradoPor?.email) {
        const emailRow = worksheet.addRow([datosCierreCompleto.cerradoPor.email]);
        worksheet.mergeCells(`A${emailRow.number}:J${emailRow.number}`);
        emailRow.font = { name: 'Arial', size: 9, color: { argb: 'FF757575' } };
        emailRow.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      worksheet.addRow([]);

      // Pie de página
      const footerRow1 = worksheet.addRow([`Generado el: ${new Date().toLocaleString('es-ES')}`]);
      worksheet.mergeCells(`A${footerRow1.number}:J${footerRow1.number}`);
      footerRow1.font = { name: 'Arial', size: 8, color: { argb: 'FF9E9E9E' } };
      footerRow1.alignment = { horizontal: 'center', vertical: 'middle' };

      const footerRow2 = worksheet.addRow(['Sistema de Gestión de Rutas - Cantón Paján']);
      worksheet.mergeCells(`A${footerRow2.number}:J${footerRow2.number}`);
      footerRow2.font = { name: 'Arial', size: 8, color: { argb: 'FF9E9E9E' } };
      footerRow2.alignment = { horizontal: 'center', vertical: 'middle' };

      // Ajustar anchos de columna para que quepa en 1 página
      worksheet.columns = [
        { width: 6 },   // ID
        { width: 18 },  // Cliente
        { width: 22 },  // Email Cliente
        { width: 11 },  // Teléfono
        { width: 10 },  // Monto
        { width: 13 },  // Método de Pago
        { width: 16 },  // Fecha Aprobación
        { width: 11 },  // Solicitado Por
        { width: 28 },  // Descripción
        { width: 10 }   // Estado
      ];

      // Generar y descargar archivo
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const nombreArchivo = titulo 
        ? `solicitudes_${titulo.replace(/\s+/g, '_').toLowerCase()}.xlsx`
        : `solicitudes_aprobadas_${fechaSeleccionada}.xlsx`;
      saveAs(blob, nombreArchivo);
    } catch (error) {
      console.error('Error al exportar solicitudes:', error);
      setError('Error al exportar solicitudes');
    }
  };

  // Funciones para cierre de caja
  const abrirDialogoCierre = async () => {
    try {
      const token = localStorage.getItem('token');
      // Obtener fecha local en formato YYYY-MM-DD
      const hoy = new Date();
      const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
      console.log('??? Abriendo cierre diario:', { fechaHoy });
      
      // Obtener datos del déa
      const response = await axios.get(
        `${API_URL}/api/cierre-caja/datos-dia`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          params: { fecha: fechaHoy }
        }
      );
      
      console.log('?? Datos recibidos:', response.data);
      setDatosCierre(response.data);
      setMontoCierre(response.data.monto_sistema);
      setOpenCierreDialog(true);
    } catch (error) {
      console.error('? Error al obtener datos para cierre:', error);
      setError(error.response?.data?.error || 'Error al preparar cierre de caja');
    }
  };

  const registrarCierre = async () => {
    if (!montoCierre || parseFloat(montoCierre) < 0) {
      setError('Por favor ingrese un monto vélido');
      return;
    }

    if (!claveAdmin || claveAdmin.length < 4) {
      setError('Se requiere la clave de autorizacién del administrador (4-6 dégitos)');
      return;
    }

    setLoadingCierre(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/cierre-caja/registrar`,
        {
          fecha: datosCierre.fecha,
          monto_real: parseFloat(montoCierre),
          observaciones: observacionesCierre,
          clave_admin: claveAdmin
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const diferencia = parseFloat(montoCierre) - parseFloat(datosCierre.monto_sistema);
      const mensaje = diferencia === 0 
        ? `✅ Cierre de caja registrado! Cuadre perfecto 🎯`
        : diferencia > 0
        ? `Cierre de caja registrado. Sobrante: $${diferencia.toFixed(2)}`
        : `Cierre de caja registrado. Faltante: $${Math.abs(diferencia).toFixed(2)}`;
      
      setSuccess(mensaje);
      
      setOpenCierreDialog(false);
      setMontoCierre('');
      setObservacionesCierre('');
      setClaveAdmin(''); // Limpiar clave
      setDatosCierre(null);
      
      // Recargar todo para actualizar el estado
      await cargarHistorialCierres();
      await cargarFrecuencias();
      await cargarSolicitudes();
      await cargarHistorialSolicitudes();
    } catch (error) {
      console.error('Error al registrar cierre:', error);
      const errorMsg = error.response?.data?.error || 'Error al registrar cierre de caja';
      setError(errorMsg);
      
      // Si el error es de clave incorrecta, limpiar solo la clave para que pueda reintentarlo
      if (errorMsg.includes('Clave de autorizacién incorrecta') || errorMsg.includes('incorrecta')) {
        setClaveAdmin('');
      }
    } finally {
      setLoadingCierre(false);
    }
  };

  const cargarHistorialCierres = async () => {
    try {
      const token = localStorage.getItem('token');
      const [year, month] = fechaSeleccionada.split('-');
      
      const response = await axios.get(`${API_URL}/api/cierre-caja/historial`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { mes: month, anio: anioFiltroCierres }
      });
      
      console.log('?? Cierres recibidos del backend:', response.data.length, response.data.map(c => ({ id: c.id, fecha: c.fecha, periodo: c.periodo, cerradoPorId: c.cerradoPorId })));
      setCierresHistorial(response.data);

      // Obtener resumen mensual
      const resumenResponse = await axios.get(`${API_URL}/api/cierre-caja/resumen-mensual`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { mes: month, anio: anioFiltroCierres }
      });
      
      setResumenMensualCierres(resumenResponse.data);

      // Ya no necesitamos verificar si existe cierre, permitimos méltiples cierres parciales
      setCierreHoyExiste(false); // Siempre permitir cerrar si hay transacciones pendientes
      setCierreHoyData(null); // No necesitamos datos del cierre anterior
      
      console.log('?? Permitiendo cierres méltiples para:', { fecha: fechaSeleccionada, userId });
    } catch (error) {
      console.error('Error al cargar historial de cierres:', error);
    }
  };

  useEffect(() => {
    cargarFrecuencias();
    cargarSolicitudes();
    cargarHistorialSolicitudes();
    cargarHistorialCierres();
  }, [fechaSeleccionada, anioFiltroCierres]);

  const frecuenciasFiltradas = frecuencias.filter(f => {
    return !filtroFecha || f.fecha === filtroFecha;
  });

  // Filtrar historial por fecha seleccionada Y que NO estén incluidas en un cierre
  const solicitudesDia = historialSolicitudes.filter(sol => {
    const fechaSol = new Date(sol.fecha).toISOString().split('T')[0];
    // Solo mostrar si es del déa seleccionado Y no esté incluida en ningén cierre
    return fechaSol === fechaSeleccionada && !sol.incluidoEnCierreId;
  });

  // Fecha de hoy en hora local Ecuador (campo 'fecha' se guarda como fecha local, no UTC)
  const fechaHoy = (() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  })();
  
  // Combinar solicitudes pendientes con el historial para estadísticas del día
  const todasLasSolicitudes = [...solicitudes, ...historialSolicitudes];
  
  // Mostrar todas las solicitudes del día
  const solicitudesHoy = todasLasSolicitudes.filter(sol => {
    // 'fecha' es DATEONLY guardado como fecha local Ecuador → comparar string directo
    if (sol.fecha) {
      return String(sol.fecha).startsWith(fechaHoy);
    }
    // fallback con createdAt (UTC timestamp): convertir a fecha local
    if (!sol.createdAt) return false;
    const d = new Date(sol.createdAt);
    const localStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return localStr === fechaHoy;
  });

  const frecuenciasHoy = frecuencias.filter(f => f.fecha === fechaHoy);

  const estadisticasHoy = {
    total: solicitudesHoy.length,
    pagados: solicitudesHoy.filter(s => s.estado === 'aprobada').length,
    pendientes: solicitudesHoy.filter(s => s.estado === 'pendiente').length,
    cancelados: solicitudesHoy.filter(s => s.estado === 'rechazada').length
  };

  // Calcular total recaudado del déa
  const totalRecaudadoHoy = solicitudesHoy
    .filter(s => s.estado === 'aprobada')
    .reduce((sum, s) => sum + parseFloat(s.monto || 0), 0);

  // Las frecuencias NO son recaudacién adicional, son uso del saldo ya pagado
  // Solo se muestra como indicador de servicios prestados

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header con rol distintivo */}
        <RoleHeader 
          rol="tesoreria" 
          titulo="Panel de Tesorería"
          subtitulo="Gestión financiera y control de cierres de caja"
        />
        
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
          <Box display="flex" gap={2}>
            <Button 
              variant="contained" 
              startIcon={<Lock />} 
              onClick={abrirDialogoCierre}
              color="error"
              size="large"
            >
              Cerrar Caja Diaria
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<History />} 
              onClick={() => setOpenHistorialCierres(true)}
              color="primary"
            >
              Historial Cierres
            </Button>
            <Tooltip title="Actualizar">
              <IconButton 
                onClick={cargarFrecuencias} 
                disabled={loading}
                sx={{ backgroundColor: 'grey.100', '&:hover': { backgroundColor: 'grey.200' } }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {/* Filtros */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="Fecha"
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: <CalendarToday sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>
        </Grid>



        {/* Estadésticas del Déa */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" fontWeight="600" color="secondary" sx={{ display: 'flex', alignItems: 'center' }}>
            <TodayIcon sx={{ mr: 1 }} />
            Resumen de Hoy
          </Typography>
          {cierresHistorial.filter(c => c.fecha === fechaSeleccionada && c.cerradoPorId === userId).length > 0 && (
            <Chip 
              icon={<History />}
              label={`${cierresHistorial.filter(c => c.fecha === fechaSeleccionada && c.cerradoPorId === userId).length} Cierre(s) Hoy`}
              color="info"
              variant="outlined"
              sx={{ fontWeight: 'bold' }}
            />
          )}
        </Box>
        
        {cierresHistorial.filter(c => c.fecha === fechaSeleccionada && c.cerradoPorId === userId).length > 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight="600">
              ?? Has realizado {cierresHistorial.filter(c => c.fecha === fechaSeleccionada && c.cerradoPorId === userId).length} cierre(s) hoy
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Puedes realizar cierres adicionales si apruebas nuevas solicitudes
            </Typography>
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <Card elevation={1} sx={{ borderTop: 3, borderColor: 'secondary.main', minHeight: 140, flex: '1 1 calc(20% - 16px)', minWidth: 180, maxWidth: 'calc(20% - 16px)', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ textAlign: 'center', py: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ backgroundColor: 'secondary.main', color: 'white', borderRadius: 2, p: 1, display: 'inline-flex', mb: 2, alignSelf: 'center' }}>
                <Receipt />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {estadisticasHoy.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Solicitudes Hoy
                </Typography>
              </Box>
            </CardContent>
          </Card>
          <Card elevation={1} sx={{ borderTop: 3, borderColor: 'secondary.main', minHeight: 140, flex: '1 1 calc(20% - 16px)', minWidth: 180, maxWidth: 'calc(20% - 16px)', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ textAlign: 'center', py: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ backgroundColor: 'success.light', color: 'white', borderRadius: 2, p: 1, display: 'inline-flex', mb: 2, alignSelf: 'center' }}>
                <CheckCircle />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {estadisticasHoy.pagados}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Aprobadas Hoy
                </Typography>
              </Box>
            </CardContent>
          </Card>
          <Card elevation={1} sx={{ borderTop: 3, borderColor: 'secondary.main', minHeight: 140, flex: '1 1 calc(20% - 16px)', minWidth: 180, maxWidth: 'calc(20% - 16px)', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ textAlign: 'center', py: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ backgroundColor: 'warning.light', color: 'white', borderRadius: 2, p: 1, display: 'inline-flex', mb: 2, alignSelf: 'center' }}>
                <Pending />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {estadisticasHoy.pendientes}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pendientes Hoy
                </Typography>
              </Box>
            </CardContent>
          </Card>
          <Card elevation={1} sx={{ borderTop: 3, borderColor: 'secondary.main', minHeight: 140, flex: '1 1 calc(20% - 16px)', minWidth: 180, maxWidth: 'calc(20% - 16px)', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ textAlign: 'center', py: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ backgroundColor: 'info.light', color: 'white', borderRadius: 2, p: 1, display: 'inline-flex', mb: 2, alignSelf: 'center' }}>
                <DirectionsBus />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  {frecuenciasHoy.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Frecuencias Hoy
                </Typography>
              </Box>
            </CardContent>
          </Card>
          <Card elevation={1} sx={{ borderTop: 3, borderColor: 'secondary.main', minHeight: 140, flex: '1 1 calc(20% - 16px)', minWidth: 180, maxWidth: 'calc(20% - 16px)', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ textAlign: 'center', py: 3, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ backgroundColor: 'success.main', color: 'white', borderRadius: 2, p: 1, display: 'inline-flex', mb: 2, alignSelf: 'center' }}>
                <AttachMoney />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="bold" color="text.primary">
                  ${totalRecaudadoHoy.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Recaudado Hoy
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Solicitudes de Compra de Saldo */}
        <Card elevation={1} sx={{ mb: 4, borderLeft: 4, borderColor: 'warning.main' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Pending sx={{ mr: 1, color: 'warning.main' }} />
              <Typography variant="h6" fontWeight="600">
                Solicitudes de Compra de Saldo Pendientes ({solicitudes.length})
              </Typography>
            </Box>
            {solicitudes.length === 0 ? (
              <Alert severity="info">
                No hay solicitudes pendientes de aprobacién
              </Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Monto</TableCell>
                      <TableCell>Método de Pago</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell>Comprobante</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {solicitudes.map((sol) => (
                      <TableRow key={sol.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="600">
                            {sol.Cliente ? `${sol.Cliente.nombres} ${sol.Cliente.apellidos}` : 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {sol.Cliente?.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`$${parseFloat(sol.monto).toFixed(2)}`} 
                            color="primary" 
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" textTransform="capitalize">
                            {sol.metodoPago}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {sol.descripcion || 'Sin descripcién'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {sol.comprobante ? (
                            <Tooltip title="Ver comprobante">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => {
                                  setComprobanteSeleccionado(sol.comprobante);
                                  setOpenComprobanteDialog(true);
                                }}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              N/A
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {sol.fecha.split('-').reverse().join('/')}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="Aprobar">
                              <IconButton 
                                size="small" 
                                color="success"
                                onClick={() => procesarSolicitud(sol.id, 'aprobar')}
                              >
                                <CheckCircle />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Rechazar">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => procesarSolicitud(sol.id, 'rechazar')}
                              >
                                <Cancel />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Historial de Solicitudes */}
        <Card elevation={1} sx={{ mt: 3, borderLeft: 4, borderColor: 'info.main' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Box display="flex" alignItems="center">
                <Receipt sx={{ mr: 1, color: 'info.main' }} />
                <Typography variant="h6" fontWeight="600">
                  Historial de Solicitudes de Saldo
                </Typography>
              </Box>
              <TextField
                select
                size="small"
                value={filtroHistorial}
                onChange={(e) => setFiltroHistorial(e.target.value)}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="todos">Todos</MenuItem>
                <MenuItem value="aprobada">Aprobadas</MenuItem>
                <MenuItem value="rechazada">Rechazadas</MenuItem>
                <MenuItem value="pendiente">Pendientes</MenuItem>
              </TextField>
            </Box>
            {historialSolicitudes.filter(sol => 
              !sol.incluidoEnCierreId && (filtroHistorial === 'todos' || sol.estado === filtroHistorial)
            ).length === 0 ? (
              <Alert severity="info">
                No hay solicitudes en el historial
              </Alert>
            ) : (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Cliente</TableCell>
                        <TableCell>Solicitado Por</TableCell>
                        <TableCell>Monto</TableCell>
                        <TableCell>Método</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Fecha Solicitud</TableCell>
                        <TableCell>Descripción</TableCell>
                        <TableCell>Comprobante</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {historialSolicitudes
                        .filter(sol => !sol.incluidoEnCierreId && (filtroHistorial === 'todos' || sol.estado === filtroHistorial))
                        .slice(paginaHistorial * filasPorPagina, paginaHistorial * filasPorPagina + filasPorPagina)
                        .map((sol, index) => (
                      <TableRow key={sol.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="600">
                            #{paginaHistorial * filasPorPagina + index + 1}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="600">
                            {sol.Cliente ? `${sol.Cliente.nombres} ${sol.Cliente.apellidos}` : 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {sol.Cliente?.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={sol.solicitadoPor === 'conductor' ? 'Conductor' : 'Dueño'}
                            color={sol.solicitadoPor === 'conductor' ? 'secondary' : 'primary'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={`$${parseFloat(sol.monto).toFixed(2)}`} 
                            color="primary" 
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" textTransform="capitalize">
                            {sol.metodoPago}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={sol.estado.toUpperCase()}
                            color={
                              sol.estado === 'aprobada' ? 'success' :
                              sol.estado === 'rechazada' ? 'error' :
                              'warning'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(sol.fecha).toLocaleString('es-ES')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {sol.descripcion || 'Sin descripcién'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {sol.comprobante ? (
                            <Tooltip title="Ver comprobante">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => {
                                  setComprobanteSeleccionado(sol.comprobante);
                                  setOpenComprobanteDialog(true);
                                }}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              N/A
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, px: 2, pb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Mostrando {paginaHistorial * filasPorPagina + 1} - {Math.min((paginaHistorial + 1) * filasPorPagina, historialSolicitudes.filter(sol => !sol.incluidoEnCierreId && (filtroHistorial === 'todos' || sol.estado === filtroHistorial)).length)} de {historialSolicitudes.filter(sol => !sol.incluidoEnCierreId && (filtroHistorial === 'todos' || sol.estado === filtroHistorial)).length}
                </Typography>
                <Box>
                  <IconButton 
                    size="small" 
                    onClick={() => setPaginaHistorial(paginaHistorial - 1)}
                    disabled={paginaHistorial === 0}
                  >
                    <ChevronLeft />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => setPaginaHistorial(paginaHistorial + 1)}
                    disabled={(paginaHistorial + 1) * filasPorPagina >= historialSolicitudes.filter(sol => !sol.incluidoEnCierreId && (filtroHistorial === 'todos' || sol.estado === filtroHistorial)).length}
                  >
                    <ChevronRight />
                  </IconButton>
                </Box>
              </Box>
            </>
            )}
          </CardContent>
        </Card>

        {/* Dialog para ver comprobante */}
        <Dialog 
          open={openComprobanteDialog} 
          onClose={() => setOpenComprobanteDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Image color="primary" />
            <Typography variant="h6" component="span">
              Comprobante de Pago
            </Typography>
          </DialogTitle>
          <DialogContent>
            {comprobanteSeleccionado ? (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                minHeight: 300,
                backgroundColor: 'grey.100',
                borderRadius: 2,
                p: 2
              }}>
                <img 
                  src={comprobanteSeleccionado} 
                  alt="Comprobante de pago" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '70vh', 
                    objectFit: 'contain',
                    borderRadius: 8
                  }} 
                />
              </Box>
            ) : (
              <Alert severity="info">No hay comprobante disponible</Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={() => setOpenComprobanteDialog(false)} 
              variant="outlined"
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog para Cierre de Caja */}
        <Dialog 
          open={openCierreDialog} 
          onClose={() => !loadingCierre && setOpenCierreDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            backgroundColor: 'error.main', 
            color: 'white' 
          }}>
            <Lock />
            <Typography variant="h6" component="span">
              Cerrar Caja Diaria
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ mt: 3 }}>
            {datosCierre && (
              <Box>
                {/* Alertas de error y success dentro del modal */}
                {error && (
                  <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}
                {success && (
                  <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 3 }}>
                    {success}
                  </Alert>
                )}

                {cierresHistorial.filter(c => c.fecha === fechaSeleccionada && c.cerradoPorId === userId).length > 0 && (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2" fontWeight="600">
                      ℹ️ Cierre Parcial #{cierresHistorial.filter(c => c.fecha === fechaSeleccionada && c.cerradoPorId === userId).length + 1}
                    </Typography>
                    <Typography variant="caption">
                      Ya realizaste {cierresHistorial.filter(c => c.fecha === fechaSeleccionada && c.cerradoPorId === userId).length} cierre(s) hoy. Este será un cierre adicional.
                    </Typography>
                  </Alert>
                )}
                
                {/* Alerta si incluye días anteriores */}
                {datosCierre.incluye_dias_anteriores && (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    <Typography variant="body2" fontWeight="600" gutterBottom>
                      ⚠️ Transacciones Pendientes de Días Anteriores
                    </Typography>
                    <Typography variant="caption">
                      Este cierre incluye transacciones aprobadas de: {datosCierre.rango_fechas_pendientes}
                    </Typography>
                  </Alert>
                )}
                
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2" fontWeight="600" gutterBottom>
                    Resumen del Día - {datosCierre.fecha.split('-').reverse().join('/')}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      • Solicitudes Aprobadas: {datosCierre.solicitudes_aprobadas} de {datosCierre.total_solicitudes}
                    </Typography>
                    <Typography variant="body2">
                      • Frecuencias Realizadas: {datosCierre.total_frecuencias}
                    </Typography>
                    <Typography variant="body2" fontWeight="700" color="success.main" sx={{ mt: 1 }}>
                      • Monto Sistema: ${parseFloat(datosCierre.monto_sistema).toFixed(2)}
                    </Typography>
                  </Box>
                </Alert>

                <TextField
                  fullWidth
                  label="Monto Real Contado"
                  type="number"
                  value={montoCierre}
                  onChange={(e) => setMontoCierre(e.target.value)}
                  InputProps={{
                    startAdornment: <AttachMoney sx={{ color: 'action.active' }} />,
                  }}
                  sx={{ mb: 3 }}
                  helperText="Ingrese el monto que realmente contó en caja"
                />

                {montoCierre && (
                  <Alert 
                    severity={
                      parseFloat(montoCierre) === parseFloat(datosCierre.monto_sistema) ? 'success' :
                      parseFloat(montoCierre) > parseFloat(datosCierre.monto_sistema) ? 'warning' :
                      'error'
                    }
                    sx={{ mb: 3 }}
                  >
                    <Typography variant="body2" fontWeight="600">
                      Diferencia: ${(parseFloat(montoCierre) - parseFloat(datosCierre.monto_sistema)).toFixed(2)}
                    </Typography>
                    <Typography variant="caption">
                      {parseFloat(montoCierre) === parseFloat(datosCierre.monto_sistema) 
                        ? 'Cuadre perfecto ✅'
                        : parseFloat(montoCierre) > parseFloat(datosCierre.monto_sistema)
                        ? 'Sobrante en caja'
                        : 'Faltante en caja'}
                    </Typography>
                  </Alert>
                )}

                <TextField
                  fullWidth
                  label="Observaciones (opcional)"
                  multiline
                  rows={3}
                  value={observacionesCierre}
                  onChange={(e) => setObservacionesCierre(e.target.value)}
                  placeholder="Agregue cualquier nota relevante sobre el cierre..."
                  sx={{ mb: 3 }}
                />

                {/* Campo para clave de autorización del administrador */}
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight="600" gutterBottom>
                    🔒 Autorización Requerida
                  </Typography>
                  <Typography variant="caption">
                    Solicite al administrador su clave de autorización para completar el cierre
                  </Typography>
                </Alert>
                
                <TextField
                  fullWidth
                  required
                  label="Clave de Autorización del Administrador"
                  type="password"
                  value={claveAdmin}
                  onChange={(e) => setClaveAdmin(e.target.value.replace(/\D/g, ''))}
                  inputProps={{ maxLength: 6 }}
                  placeholder="Ingrese clave de 4-6 dégitos"
                  helperText="Clave numérica proporcionada por el administrador"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'warning.lighter',
                      fontSize: '1.2rem',
                      letterSpacing: '0.3em',
                      textAlign: 'center'
                    }
                  }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={() => setOpenCierreDialog(false)} 
              disabled={loadingCierre}
            >
              Cancelar
            </Button>
            <Button 
              onClick={registrarCierre} 
              variant="contained"
              color="error"
              disabled={loadingCierre || !montoCierre || !claveAdmin}
              startIcon={<Lock />}
            >
              {loadingCierre ? 'Registrando...' : 'Confirmar Cierre'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog para Historial de Cierres */}
        <Dialog 
          open={openHistorialCierres} 
          onClose={() => setOpenHistorialCierres(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <History color="primary" />
              <Typography variant="h6" component="span">
                Historial de Cierres de Caja
              </Typography>
              <TextField
                select
                size="small"
                label="Aéo"
                value={anioFiltroCierres}
                onChange={(e) => {
                  setAnioFiltroCierres(e.target.value);
                  setPaginaCierres(0);
                }}
                sx={{ minWidth: 100 }}
              >
                {[...Array(5)].map((_, i) => {
                  const year = new Date().getFullYear() + i;
                  return <MenuItem key={year} value={year}>{year}</MenuItem>;
                })}
              </TextField>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                startIcon={<PictureAsPdf />} 
                onClick={exportarCierresPDF}
                size="small"
              >
                PDF
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<TableChart />} 
                onClick={exportarCierresExcel}
                color="success"
                size="small"
              >
                Excel
              </Button>
            </Box>
          </DialogTitle>
          <DialogContent>
            {resumenMensualCierres && (
              <Box sx={{ mb: 3, mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight="bold" color="primary">
                          {resumenMensualCierres.total_cierres}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Cierres
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight="bold" color="success.main">
                          ${resumenMensualCierres.monto_real_total.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Recaudado Total
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography 
                          variant="h5" 
                          fontWeight="bold" 
                          color={resumenMensualCierres.diferencia_total >= 0 ? 'warning.main' : 'error.main'}
                        >
                          ${resumenMensualCierres.diferencia_total.toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Diferencia Total
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Typography variant="h5" fontWeight="bold" color="info.main">
                          {resumenMensualCierres.cierres_exactos}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Cuadres Exactos
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {cierresHistorial.length === 0 ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                No hay cierres de caja registrados para este mes
              </Alert>
            ) : (
              <TableContainer sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Hora</TableCell>
                      <TableCell>Monto Sistema</TableCell>
                      <TableCell>Monto Real</TableCell>
                      <TableCell>Diferencia</TableCell>
                      <TableCell>Frecuencias</TableCell>
                      <TableCell>Cerrado Por</TableCell>
                      <TableCell>Observaciones</TableCell>
                      <TableCell align="center">Solicitudes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cierresHistorial
                      .slice(paginaCierres * filasPorPaginaCierres, paginaCierres * filasPorPaginaCierres + filasPorPaginaCierres)
                      .map((cierre) => {
                      const diferencia = parseFloat(cierre.diferencia);
                      return (
                        <TableRow key={cierre.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="600">
                              {cierre.fecha.split('-').reverse().join('/')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {cierre.hora_cierre}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={`$${parseFloat(cierre.monto_sistema).toFixed(2)}`}
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={`$${parseFloat(cierre.monto_real).toFixed(2)}`}
                              size="small"
                              color="success"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={`${diferencia >= 0 ? '+' : ''}$${diferencia.toFixed(2)}`}
                              size="small"
                              color={diferencia === 0 ? 'success' : diferencia > 0 ? 'warning' : 'error'}
                              icon={diferencia === 0 ? <CheckCircle /> : diferencia > 0 ? <TrendingUp /> : <Cancel />}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {cierre.total_frecuencias}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {cierre.cerradoPor 
                                ? `${cierre.cerradoPor.nombres} ${cierre.cerradoPor.apellidos}` 
                                : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                              {cierre.observaciones || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              <Tooltip title="Exportar solicitudes a PDF">
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => {
                                    // Exportar solicitudes usando el ID del cierre
                                    const titulo = `Cierre ${cierre.fecha.split('-').reverse().join('/')}`;
                                    exportarSolicitudesPDF(cierre.id, null, null, titulo);
                                  }}
                                >
                                  <PictureAsPdf fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Exportar solicitudes a Excel">
                                <IconButton 
                                  size="small" 
                                  color="success"
                                  onClick={() => {
                                    // Exportar solicitudes usando el ID del cierre
                                    const titulo = `Cierre ${cierre.fecha.split('-').reverse().join('/')}`;
                                    exportarSolicitudesExcel(cierre.id, null, null, titulo);
                                  }}
                                >
                                  <TableChart fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            
            {cierresHistorial.length > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, px: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Mostrando {paginaCierres * filasPorPaginaCierres + 1} - {Math.min((paginaCierres + 1) * filasPorPaginaCierres, cierresHistorial.length)} de {cierresHistorial.length}
                </Typography>
                <Box>
                  <IconButton 
                    onClick={() => setPaginaCierres(prev => prev - 1)} 
                    disabled={paginaCierres === 0}
                    size="small"
                  >
                    <ChevronLeft />
                  </IconButton>
                  <IconButton 
                    onClick={() => setPaginaCierres(prev => prev + 1)} 
                    disabled={(paginaCierres + 1) * filasPorPaginaCierres >= cierresHistorial.length}
                    size="small"
                  >
                    <ChevronRight />
                  </IconButton>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={() => setOpenHistorialCierres(false)} 
              variant="outlined"
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default TesoreriaPage;
