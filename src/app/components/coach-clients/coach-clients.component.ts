import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersWithCoachService } from '../../services/users-with-coach.service';
import { UserWithCoach } from '../../models/user-with-coach.model';
import { AuthService } from '../../services/auth.service';
import { ProgrammeService } from '../../services/programme.service';
import { SharedWeightHistoryComponent } from '../shared-weight-history/shared-weight-history.component';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-coach-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedWeightHistoryComponent],
  templateUrl: './coach-clients.component.html',
  styleUrls: ['./coach-clients.component.css']
})
export class CoachClientsComponent implements OnInit {
  clients: UserWithCoach[] = [];
  filteredClients: UserWithCoach[] = [];
  searchQuery: string = '';
  loading: boolean = false;
  errorMessage: string = '';
  coachId: number | null = null;
  selectedClientProgrammes: any[] = [];
  selectedClientName: string = '';
  selectedProgrammeDetails: any = null;
  showWeightHistoryModal: boolean = false;
  selectedClientId: number | null = null;
  selectedClientForWeightHistory: string = '';

  constructor(
    private usersWithCoachService: UsersWithCoachService,
    private authService: AuthService,
    private programmeService: ProgrammeService
  ) {}

  ngOnInit(): void {
    this.loadCoachId();
  }

  loadCoachId(): void {
    // Récupérer l'ID du coach connecté depuis le localStorage
    if (this.authService.isLoggedIn()) {
      const userId = localStorage.getItem('userId');
      if (userId) {
        this.coachId = parseInt(userId, 10);
        this.loadClients();
      } else {
        this.errorMessage = "Impossible de récupérer l'ID du coach connecté";
      }
    } else {
      this.errorMessage = "Vous n'êtes pas connecté";
    }
  }

  loadClients(): void {
    if (!this.coachId) {
      this.errorMessage = "ID du coach non disponible";
      return;
    }

    this.loading = true;
    this.usersWithCoachService.getUsersByCoachId(this.coachId).subscribe({
      next: (data) => {
        this.clients = data;
        this.filteredClients = data;
        this.loadProgrammeInfoForClients();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des clients', error);
        this.errorMessage = 'Erreur lors du chargement des clients';
        this.loading = false;
      }
    });
  }

  loadProgrammeInfoForClients(): void {
    let completedRequests = 0;
    const totalClients = this.clients.length;

    if (totalClients === 0) {
      this.loading = false;
      return;
    }

    this.clients.forEach(client => {
      this.programmeService.getProgrammesByUser(client.user_id).subscribe({
        next: (programmes) => {
          client.hasProgramme = programmes.length > 0;
          client.programmeCount = programmes.length;
          completedRequests++;
          
          if (completedRequests === totalClients) {
            this.loading = false;
          }
        },
        error: (error) => {
          console.error(`Erreur lors du chargement des programmes pour l'utilisateur ${client.user_id}`, error);
          client.hasProgramme = false;
          client.programmeCount = 0;
          completedRequests++;
          
          if (completedRequests === totalClients) {
            this.loading = false;
          }
        }
      });
    });
  }

  searchClients(): void {
    if (this.searchQuery.trim() === '') {
      this.filteredClients = this.clients;
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredClients = this.clients.filter(client => 
      client.user_nom.toLowerCase().includes(query) ||
      client.user_prenom.toLowerCase().includes(query) ||
      client.user_email.toLowerCase().includes(query)
    );
  }

  viewClientProgrammes(userId: number): void {
    const client = this.clients.find(c => c.user_id === userId);
    if (!client) return;

    this.selectedClientName = `${client.user_nom} ${client.user_prenom}`;
    this.loading = true;
    
    this.programmeService.getProgrammesByUser(userId).subscribe({
      next: (programmes) => {
        this.selectedClientProgrammes = programmes;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des programmes', error);
        this.errorMessage = 'Erreur lors du chargement des programmes';
        this.loading = false;
      }
    });
  }

  closeClientProgrammes(): void {
    this.selectedClientProgrammes = [];
    this.selectedClientName = '';
  }

  viewProgrammeDetails(programme: any): void {
    this.loading = true;
    this.programmeService.getProgrammeDetails(programme.id).subscribe({
      next: (details) => {
        this.selectedProgrammeDetails = details;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des détails du programme', error);
        this.errorMessage = 'Erreur lors du chargement des détails du programme';
        this.loading = false;
      }
    });
  }

  closeProgrammeDetails(): void {
    this.selectedProgrammeDetails = null;
  }

  viewClientWeightHistory(userId: number): void {
    const client = this.clients.find(c => c.user_id === userId);
    if (!client) return;

    this.selectedClientId = userId;
    this.selectedClientForWeightHistory = `${client.user_nom} ${client.user_prenom}`;
    this.showWeightHistoryModal = true;
  }

  closeWeightHistoryModal(): void {
    this.showWeightHistoryModal = false;
    this.selectedClientId = null;
    this.selectedClientForWeightHistory = '';
  }

  getTotalExercices(programme: any): number {
    if (!programme.jours) return 0;
    return programme.jours.reduce((total: number, jour: any) => {
      return total + (jour.exercices ? jour.exercices.length : 0);
    }, 0);
  }

  getYouTubeEmbedUrl(url: string): string {
    // Convertir l'URL YouTube en URL d'embed
    const videoId = this.extractYouTubeVideoId(url);
    return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
  }

  private extractYouTubeVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  downloadProgrammePDF(programme: any): void {
    if (!programme) return;

    // Charger d'abord les détails complets du programme
    this.loading = true;
    this.programmeService.getProgrammeDetails(programme.id).subscribe({
      next: (programmeDetails) => {
        this.loading = false;
        this.generatePDF(programmeDetails);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des détails du programme', error);
        this.errorMessage = 'Erreur lors du chargement des détails du programme';
        this.loading = false;
      }
    });
  }

  private generatePDF(programme: any): void {
    if (!programme) return;

    // Créer un nouveau document PDF en format portrait
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Couleurs
    const primaryColor = [41, 128, 185]; // Bleu
    const secondaryColor = [52, 73, 94]; // Gris foncé
    const accentColor = [231, 76, 60]; // Rouge
    
    // Helper function pour ajouter l'en-tête
    const addHeader = (pageNumber: number) => {
      // En-tête avec logo VitaFit
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('VitaFit', 15, 20);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Programme d\'Entraînement Détaillé', 105, 20);
      
      // Numéro de page
      doc.setFontSize(11);
      doc.text(`Page ${pageNumber}`, 175, 20);
    };
    
    // Helper function pour ajouter le pied de page
    const addFooter = () => {
      doc.setTextColor(128, 128, 128);
      doc.setFontSize(9);
      doc.text('Généré par VitaFit - Votre partenaire fitness', 15, 280);
      doc.text(`Créé le ${new Date().toLocaleDateString('fr-FR')}`, 140, 280);
    };
    
    // Helper function pour créer des liens YouTube cliquables
    const addYouTubeLink = (url: string, x: number, y: number, width: number, height: number) => {
      doc.setTextColor(0, 0, 255);
      doc.textWithLink('🎥 Voir la vidéo', x, y, { url: url });
    };
    
    // Helper function pour calculer la hauteur nécessaire pour un exercice
    const calculateExerciceHeight = (exercice: any): number => {
      let height = 35; // Hauteur de base augmentée
      if (exercice.muscle_cible) {
        height += 10; // Espace pour le muscle ciblé
      }
      if (exercice.description) {
        height += 12; // Espace pour la description
      }
      if (exercice.medias && exercice.medias.length > 0) {
        height += 15; // Espace pour les médias
      }
      return height;
    };
    
    let pageNumber = 1;
    
    // PAGE 1: Résumé du programme
    addHeader(pageNumber);
    
    let yPos = 45;
    
    // Titre du programme
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(programme.nom || 'Programme d\'Entraînement', 15, yPos);
    yPos += 20;
    
    // Informations générales dans un cadre
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.8);
    doc.rect(15, yPos - 5, 180, 50);
    
    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    doc.text(`Programme: ${programme.nom || 'Non spécifié'}`, 20, yPos + 8);
    doc.text(`Date de création: ${new Date(programme.created_at).toLocaleDateString('fr-FR')}`, 20, yPos + 20);
    doc.text(`Objectif: ${programme.description || 'Non spécifié'}`, 20, yPos + 32);
    
    // Informations du client
    const clientInfo = this.selectedClientName;
    if (clientInfo) {
      doc.text(`Client: ${clientInfo}`, 20, yPos + 44);
    }
    
    yPos += 65;
    
    // Résumé du planning hebdomadaire
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('RÉSUMÉ DU PLANNING HEBDOMADAIRE', 15, yPos);
    yPos += 20;
    
    if (programme.jours && programme.jours.length > 0) {
      programme.jours.forEach((jour: any, index: number) => {
        if (yPos > 250) {
          doc.addPage();
          pageNumber++;
          addHeader(pageNumber);
          yPos = 40;
        }
        
        // Cadre pour chaque jour
        doc.setFillColor(245, 245, 245);
        doc.rect(15, yPos - 3, 180, 20, 'F');
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(15, yPos - 3, 180, 20);
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text(`Jour ${index + 1}: ${jour.jour}${jour.titre ? ' - ' + jour.titre : ''}`, 20, yPos + 8);
        
        const exerciceCount = jour.exercices ? jour.exercices.length : 0;
        doc.setFont('helvetica', 'normal');
        doc.text(`${exerciceCount} exercice(s)`, 150, yPos + 8);
        
        yPos += 25;
      });
    } else {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(150, 150, 150);
      doc.text('Aucun jour programmé', 20, yPos);
    }
    
    addFooter();
    
    // PAGES SUIVANTES: Détails par jour
    if (programme.jours && programme.jours.length > 0) {
      programme.jours.forEach((jour: any) => {
        if (jour.exercices && jour.exercices.length > 0) {
          doc.addPage();
          pageNumber++;
          addHeader(pageNumber);
          
          yPos = 45;
          
          // Titre du jour
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.text(`${jour.jour}${jour.titre ? ' - ' + jour.titre : ''}`, 15, yPos);
          yPos += 20;
          
          // Notes du jour
          if (jour.notes) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100, 100, 100);
            const notes = jour.notes.length > 80 ? jour.notes.substring(0, 80) + '...' : jour.notes;
            doc.text(`Notes: ${notes}`, 15, yPos);
            yPos += 15;
          }
          
          // Exercices du jour
          jour.exercices.forEach((exercice: any, exerciceIndex: number) => {
            const exerciceHeight = calculateExerciceHeight(exercice);
            
            if (yPos + exerciceHeight > 265) {
              doc.addPage();
              pageNumber++;
              addHeader(pageNumber);
              yPos = 45;
            }
            
            // Cadre coloré pour l'exercice
            doc.setFillColor(249, 249, 249);
            doc.rect(15, yPos - 3, 180, exerciceHeight, 'F');
            doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
            doc.setLineWidth(0.8);
            doc.rect(15, yPos - 3, 180, exerciceHeight);
            
            // Nom de l'exercice
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
            const exerciceName = exercice.nom.length > 45 ? exercice.nom.substring(0, 45) + '...' : exercice.nom;
            doc.text(`${exerciceIndex + 1}. ${exerciceName}`, 20, yPos + 10);
            
            // Muscle ciblé
            if (exercice.muscle_cible) {
              doc.setFontSize(10);
              doc.setFont('helvetica', 'italic');
              doc.setTextColor(100, 100, 100);
              doc.text(`Muscle: ${exercice.muscle_cible}`, 20, yPos + 20);
            }
            
            // Détails de l'exercice
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            
            let detailsY = yPos + (exercice.muscle_cible ? 30 : 25);
            doc.text(`Sets: ${exercice.sets || 'N/A'}`, 20, detailsY);
            doc.text(`Répétitions: ${exercice.repetitions || 'N/A'}`, 75, detailsY);
            
            if (exercice.poids) {
              doc.text(`Poids: ${exercice.poids}kg`, 140, detailsY);
            }
            
            detailsY += 10;
            doc.text(`Temps de repos: ${exercice.temps_repos || 'N/A'}s`, 20, detailsY);
            
            // Description
            if (exercice.description) {
              detailsY += 10;
              doc.setFont('helvetica', 'italic');
              doc.setTextColor(60, 60, 60);
              const description = exercice.description.length > 90 ? exercice.description.substring(0, 90) + '...' : exercice.description;
              doc.text(`Description: ${description}`, 20, detailsY);
            }
            
            // Informations sur les médias
            if (exercice.medias && exercice.medias.length > 0) {
              detailsY += 12;
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(0, 0, 0);
           
              
            }
            
            yPos += exerciceHeight + 5;
          });
          
          addFooter();
        }
      });
    }
    
    // Sauvegarder le PDF
    const fileName = `VitaFit_Programme_${programme.nom || 'Entrainement'}_${this.selectedClientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }
}