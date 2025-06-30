import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class PdfExportService {

  constructor() { }

  exportPaiementsToPdf(paiements: any[], totalAmount: number, month: number, year: number): void {
    // Create new PDF document
    const doc = new jsPDF();
    
    // Add title
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                       'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const monthName = monthNames[month - 1];
    
    // Add header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Rapport des Paiements', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Mois: ${monthName} ${year}`, 105, 30, { align: 'center' });
    doc.text(`Date d'exportation: ${new Date().toLocaleDateString('fr-FR')}`, 105, 37, { align: 'center' });
    
    // Prepare table data
    const headers = [['ID', 'Abonnement', 'Utilisateur', 'Montant', 'Date de paiement', 'Mode de paiement']];
    const data = paiements.map(p => [
      p.id,
      p.abonnement,
      p.utilisateur,
      `${p.montant} dt`,
      p.date,
      p.mode
    ]);
    
    // Add table using autoTable
    autoTable(doc, {
      head: headers,
      body: data,
      startY: 45,
      theme: 'grid',
      headStyles: {
        fillColor: [78, 115, 223],
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      }
    });
    
    // Add total
    const finalY = (doc as any).lastAutoTable.finalY || 45;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total des paiements: ${totalAmount.toFixed(2)} dt`, 14, finalY + 15);
    
    // Add page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} sur ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    // Save PDF
    doc.save(`Paiements_${monthName}_${year}.pdf`);
  }
}