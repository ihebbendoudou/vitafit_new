import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HttpHeaders } from '@angular/common/http';
import { NotificationService } from '../../../services/notification.service';

interface Reminder {
  id?: number;
  user_id: number;
  day_of_week: string;
  time: string;
  title: string;
  notify: boolean;
}

@Component({
  selector: 'app-reminder',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './reminder.component.html',
  styleUrls: ['./reminder.component.css']
})
export class ReminderComponent implements OnInit {
  reminders: Reminder[] = [];
  loading: boolean = false;
  error: string = '';
  success: string = '';
  notificationPermission: NotificationPermission = 'default';
  notificationSupported = false;
  userId: number = 0;

  // Formulaire pour nouveau rappel
  newReminder: Reminder = {
    user_id: 0,
    day_of_week: 'Monday',
    time: '08:00',
    title: 'Séance d\'entraînement',
    notify: true
  };

  // Options pour les jours de la semaine
  daysOfWeek = [
    { value: 'Monday', label: 'Lundi' },
    { value: 'Tuesday', label: 'Mardi' },
    { value: 'Wednesday', label: 'Mercredi' },
    { value: 'Thursday', label: 'Jeudi' },
    { value: 'Friday', label: 'Vendredi' },
    { value: 'Saturday', label: 'Samedi' },
    { value: 'Sunday', label: 'Dimanche' }
  ];

  constructor(
     private http: HttpClient,
     private notificationService: NotificationService
   ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  ngOnInit(): void {
    this.userId = parseInt(localStorage.getItem('userId') || '0');
    this.newReminder.user_id = this.userId;
    this.initializeNotifications();
    this.loadReminders();
  }

  private async initializeNotifications(): Promise<void> {
     this.notificationSupported = this.notificationService.isNotificationSupported();
     this.notificationPermission = this.notificationService.getPermissionStatus();
     
     this.notificationService.notificationPermission$.subscribe(permission => {
       this.notificationPermission = permission;
     });
   }

   private scheduleAllActiveNotifications(): void {
     // Charger tous les rappels actifs dans le pool de notifications
     if (this.notificationService.getPermissionStatus() === 'granted') {
       this.notificationService.loadTodayReminders(this.reminders);
     }
   }

  loadReminders(): void {
    this.loading = true;
    this.error = '';
    
    this.http.get<Reminder[]>(`http://localhost:3000/api/reminders/user/${this.userId}`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (response) => {
          this.reminders = response;
          // Programmer les notifications pour tous les rappels actifs
          this.scheduleAllActiveNotifications();
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Erreur lors du chargement des rappels';
          this.loading = false;
          console.error('Erreur:', error);
        }
      });
  }

  async requestNotificationPermission(): Promise<void> {
     const permission = await this.notificationService.requestPermission();
     if (permission === 'granted') {
       this.success = 'Permissions de notification accordées!';
       // Programmer les notifications pour les rappels existants
       this.scheduleAllActiveNotifications();
       setTimeout(() => this.success = '', 3000);
     } else {
       this.error = 'Permissions de notification refusées';
       setTimeout(() => this.error = '', 3000);
     }
   }

   testNotification(): void {
     if (this.notificationPermission === 'granted') {
       this.notificationService.showNotification(
         '🏋️ Test de Notification',
         {
           body: 'Les notifications push fonctionnent correctement !',
           icon: '/favicon.ico'
         }
       );
       this.success = 'Notification de test envoyée!';
       setTimeout(() => this.success = '', 3000);
     } else {
       this.error = 'Veuillez d\'abord activer les notifications';
       setTimeout(() => this.error = '', 3000);
     }
   }

  createReminder(): void {
    if (!this.newReminder.title.trim()) {
      this.error = 'Le titre est requis';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.http.post<any>('http://localhost:3000/api/reminders', this.newReminder, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (response) => {
          this.success = 'Rappel créé avec succès!';
          
          // Programmer la notification si activée
          if (this.newReminder.notify && this.notificationPermission === 'granted') {
            this.notificationService.scheduleReminderNotification({
              ...this.newReminder,
              id: response.id
            });
          }
          
          this.loadReminders();
          this.resetForm();
          this.loading = false;
          // Effacer le message de succès après 3 secondes
          setTimeout(() => this.success = '', 3000);
        },
        error: (error) => {
          this.error = 'Erreur lors de la création du rappel';
          this.loading = false;
          console.error('Erreur:', error);
        }
      });
  }

  deleteReminder(id: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rappel ?')) {
      return;
    }

    this.http.delete(`http://localhost:3000/api/reminders/${id}`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: () => {
          this.success = 'Rappel supprimé avec succès!';
          this.loadReminders();
          setTimeout(() => this.success = '', 3000);
        },
        error: (error) => {
          this.error = 'Erreur lors de la suppression du rappel';
          console.error('Erreur:', error);
        }
      });
  }

  updateReminderStatus(reminder: Reminder): void {
    this.http.put(`http://localhost:3000/api/reminders/${reminder.id}`, reminder, { headers: this.getAuthHeaders() })
      .subscribe({
        next: () => {
          this.success = 'Statut de notification mis à jour!';
          
          // Programmer ou annuler la notification selon le statut
          if (reminder.notify && this.notificationService.getPermissionStatus() === 'granted') {
            this.notificationService.scheduleReminderNotification(reminder);
          } else if (reminder.id) {
            this.notificationService.cancelScheduledNotification(reminder.id);
          }
          
          setTimeout(() => this.success = '', 3000);
        },
        error: (error) => {
          this.error = 'Erreur lors de la mise à jour';
          console.error('Erreur:', error);
        }
      });
  }

  resetForm(): void {
    this.newReminder = {
      user_id: this.userId,
      day_of_week: 'Monday',
      time: '08:00',
      title: 'Séance d\'entraînement',
      notify: true
    };
  }

  getDayLabel(dayValue: string): string {
    const day = this.daysOfWeek.find(d => d.value === dayValue);
    return day ? day.label : dayValue;
  }

  formatTime(time: string): string {
    return time.substring(0, 5); // Afficher seulement HH:MM
  }

  getNextOccurrence(dayOfWeek: string, time: string): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date();
    const targetDay = days.indexOf(dayOfWeek);
    const currentDay = today.getDay();
    
    let daysUntil = targetDay - currentDay;
    if (daysUntil < 0) {
      daysUntil += 7;
    }
    
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntil);
    
    return nextDate.toLocaleDateString('fr-FR');
  }
}