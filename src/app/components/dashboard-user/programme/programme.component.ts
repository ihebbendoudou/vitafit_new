import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-programme',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './programme.component.html',
  styleUrls: ['./programme.component.css']
})
export class ProgrammeComponent implements OnInit {
  programmes: any[] = [];
  selectedProgramme: any = null;
  loading: boolean = false;
  error: string = '';
  userId: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId') || '';
    if (this.userId) {
      this.loadProgrammes();
    }
  }

  loadProgrammes(): void {
    this.loading = true;
    this.error = '';
    
    this.http.get(`http://localhost:3000/api/programmes/user/${this.userId}`)
      .subscribe({
        next: (response: any) => {
          this.programmes = response;
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Erreur lors du chargement des programmes';
          this.loading = false;
          console.error('Erreur:', error);
        }
      });
  }

  selectProgramme(programme: any): void {
    this.selectedProgramme = programme;
    this.loadProgrammeDetails(programme.id);
  }

  loadProgrammeDetails(programmeId: string): void {
    this.http.get(`http://localhost:3000/api/programmes/${programmeId}`)
      .subscribe({
        next: (response: any) => {
          this.selectedProgramme = response;
        },
        error: (error) => {
          this.error = 'Erreur lors du chargement des détails du programme';
          console.error('Erreur:', error);
        }
      });
  }

  backToList(): void {
    this.selectedProgramme = null;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  getTotalSets(jour: any): number {
    if (!jour.exercices || jour.exercices.length === 0) {
      return 0;
    }
    return jour.exercices.reduce((total: number, exercice: any) => {
      return total + (exercice.sets || 0);
    }, 0);
  }

  downloadPDF(programme?: any): void {
    const targetProgramme = programme || this.selectedProgramme;
    if (!targetProgramme) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Couleurs
    const primaryColor = [0, 123, 255]; // Bleu
    const secondaryColor = [108, 117, 125]; // Gris
    const textColor = [33, 37, 41]; // Noir foncé
    const accentColor = [40, 167, 69]; // Vert
    
    // Helper function pour ajouter l'en-tête sur chaque page
    const addHeader = () => {
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, pageWidth, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('VITAFIT', 15, 20);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('PROGRAMME D\'ENTRAÎNEMENT DÉTAILLÉ', 15, 26);
    };
    
    // Helper function pour ajouter le pied de page
    const addFooter = (pageNum: number) => {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(`Page ${pageNum} - Généré le ${new Date().toLocaleDateString('fr-FR')} par VitaFit`, 15, pageHeight - 10);
    };
    
    // Helper function pour créer un lien YouTube cliquable
    const addYouTubeLink = (url: string, x: number, y: number, width: number) => {
      doc.setTextColor(0, 0, 255);
      doc.setFont('helvetica', 'normal');
      doc.text('🎥 Voir la vidéo YouTube', x, y);
      doc.link(x, y - 3, width, 6, { url: url });
    };
    
    let pageNum = 1;
    
    // === PAGE 1: RÉSUMÉ DU PROGRAMME ===
    addHeader();
    
    let yPos = 45;
    
    // Nom du programme
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(targetProgramme.nom || 'Programme d\'entraînement', 15, yPos);
    yPos += 15;
    
    // Informations générales dans un cadre
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(15, yPos, pageWidth - 30, 60);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    
    // Informations du programme
    doc.text('INFORMATIONS GÉNÉRALES', 20, yPos + 12);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFontSize(10);
    
    doc.text(`Créé le: ${this.formatDate(targetProgramme.created_at)}`, 20, yPos + 22);
    
    if (targetProgramme.description) {
      doc.text('Objectif:', 20, yPos + 32);
      const description = doc.splitTextToSize(targetProgramme.description, pageWidth - 50);
      doc.text(description, 20, yPos + 40);
    }
    
    if (targetProgramme.coach_nom) {
      doc.text(`Coach: ${targetProgramme.coach_nom} ${targetProgramme.coach_prenom}`, 20, yPos + 52);
    }
    
    yPos += 75;
    
    // === RÉSUMÉ HEBDOMADAIRE ===
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('RÉSUMÉ HEBDOMADAIRE', 15, yPos);
    yPos += 10;
    
    const jours = targetProgramme.jours || [];
    const joursNoms = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE'];
    
    // Affichage compact du résumé
    joursNoms.forEach((jour, index) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(`${jour}:`, 20, yPos);
      
      doc.setFont('helvetica', 'normal');
      if (index < jours.length && jours[index] && jours[index].exercices && jours[index].exercices.length > 0) {
        doc.text(`${jours[index].exercices.length} exercice(s)`, 60, yPos);
      } else {
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text('Jour de repos', 60, yPos);
      }
      yPos += 8;
    });
    
    addFooter(pageNum);
    
    // === PAGES DÉTAILLÉES POUR CHAQUE JOUR ===
    jours.forEach((jour: any, dayIndex: number) => {
      if (!jour || !jour.exercices || jour.exercices.length === 0) return;
      
      doc.addPage();
      pageNum++;
      addHeader();
      
      let currentY = 45;
      
      // Titre du jour
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`${joursNoms[dayIndex]} - DÉTAIL DES EXERCICES`, 15, currentY);
      currentY += 15;
      
      // Statistiques du jour
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.text(`Nombre d'exercices: ${jour.exercices.length}`, 15, currentY);
      currentY += 15;
      
      // Détail de chaque exercice
      jour.exercices.forEach((exercice: any, exIndex: number) => {
        // Vérifier si on a assez d'espace, sinon nouvelle page
        if (currentY > pageHeight - 80) {
          addFooter(pageNum);
          doc.addPage();
          pageNum++;
          addHeader();
          currentY = 45;
        }
        
        // Cadre pour l'exercice
        const exerciceHeight = this.calculateExerciceHeight(exercice);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.rect(15, currentY, pageWidth - 30, exerciceHeight);
        
        // En-tête de l'exercice
        doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.rect(15, currentY, pageWidth - 30, 12, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`${exIndex + 1}. ${exercice.nom || 'Exercice sans nom'}`, 18, currentY + 8);
        
        currentY += 18;
        
        // Détails de l'exercice
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        // Muscle ciblé
        if (exercice.muscle_cible) {
          doc.setFont('helvetica', 'bold');
          doc.text('Muscle ciblé:', 18, currentY);
          doc.setFont('helvetica', 'normal');
          doc.text(exercice.muscle_cible, 55, currentY);
          currentY += 6;
        }
        
        // Paramètres d'entraînement
        const params = [];
        if (exercice.sets) params.push(`${exercice.sets} séries`);
        if (exercice.repetitions) params.push(`${exercice.repetitions} répétitions`);
        if (exercice.poids) params.push(`${exercice.poids} kg`);
        if (exercice.temps_repos) params.push(`${exercice.temps_repos}s de repos`);
        
        if (params.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.text('Paramètres:', 18, currentY);
          doc.setFont('helvetica', 'normal');
          doc.text(params.join(' • '), 18, currentY + 6);
          currentY += 12;
        }
        
        // Description
        if (exercice.description) {
          doc.setFont('helvetica', 'bold');
          doc.text('Description:', 18, currentY);
          doc.setFont('helvetica', 'normal');
          const descriptionLines = doc.splitTextToSize(exercice.description, pageWidth - 50);
          doc.text(descriptionLines, 18, currentY + 6);
          currentY += descriptionLines.length * 4 + 12;
        }
        
        // Médias
        if (exercice.medias && exercice.medias.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.text('Médias:', 18, currentY);
          currentY += 8;
          
          // Images
          const imageMedias = exercice.medias.filter((media: any) => media.type === 'image');
          if (imageMedias.length > 0) {
            doc.setFont('helvetica', 'normal');
            doc.text(`📷 ${imageMedias.length} image(s) disponible(s) sur L'application`, 20, currentY);
            currentY += 6;
          }
          
          // Vidéos YouTube
          const youtubeMedias = exercice.medias.filter((media: any) => media.type === 'youtube');
          youtubeMedias.forEach((media: any) => {
            addYouTubeLink(media.url, 20, currentY, 60);
            currentY += 8;
          });
          
          if (youtubeMedias.length > 0) {
            currentY += 6;
          }
        }
        
        currentY += 10; // Espacement entre exercices
      });
      
      addFooter(pageNum);
    });
    
    // Sauvegarder le PDF
    const fileName = `VitaFit_Programme_Detaille_${targetProgramme.nom || 'Entrainement'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }
  
  // Helper function pour calculer la hauteur nécessaire pour un exercice
  private calculateExerciceHeight(exercice: any): number {
    let height = 25; // Base height
    
    if (exercice.muscle_cible) height += 6;
    if (exercice.sets || exercice.repetitions || exercice.poids || exercice.temps_repos) height += 12;
    if (exercice.description) {
      const descriptionLength = exercice.description.length;
      height += Math.ceil(descriptionLength / 80) * 4 + 12;
    }
    if (exercice.medias && exercice.medias.length > 0) {
      const imageMedias = exercice.medias.filter((media: any) => media.type === 'image');
      const youtubeMedias = exercice.medias.filter((media: any) => media.type === 'youtube');
      
      if (imageMedias.length > 0) height += 12;
      if (youtubeMedias.length > 0) height += youtubeMedias.length * 8 + 12;
    }
    
    return Math.max(height, 40);
  }
}