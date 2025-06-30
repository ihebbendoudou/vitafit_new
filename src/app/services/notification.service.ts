import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private notificationPermission = new BehaviorSubject<NotificationPermission>('default');
  public notificationPermission$ = this.notificationPermission.asObservable();
  private notificationPool: any[] = [];
  private checkInterval: any;

  constructor() {
    this.checkNotificationSupport();
    this.startNotificationChecker();
  }

  private checkNotificationSupport(): void {
    if ('Notification' in window) {
      this.notificationPermission.next(Notification.permission);
    } else {
      console.warn('Ce navigateur ne supporte pas les notifications push');
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Ce navigateur ne supporte pas les notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.notificationPermission.next(permission);
      return permission;
    }

    return Notification.permission;
  }

  showNotification(title: string, options?: NotificationOptions): void {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });

      // Auto-fermer la notification après 5 secondes
      setTimeout(() => {
        notification.close();
      }, 5000);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }

  scheduleReminderNotification(reminder: any): void {
    console.log('🔔 Ajout au pool de notifications:', reminder);
    
    if (Notification.permission !== 'granted' || !reminder.notify) {
      console.log('❌ Permission refusée ou notification désactivée');
      return;
    }

    // Ajouter au pool de notifications
    const existingIndex = this.notificationPool.findIndex(n => n.id === reminder.id);
    if (existingIndex >= 0) {
      this.notificationPool[existingIndex] = reminder;
      console.log('🔄 Notification mise à jour dans le pool');
    } else {
      this.notificationPool.push(reminder);
      console.log('➕ Nouvelle notification ajoutée au pool');
    }
    
    console.log('📊 Pool actuel:', this.notificationPool.length, 'notifications');
  }

  private getNextReminderTime(dayOfWeek: string, time: string): Date {
    console.log('📅 Calcul prochaine notification - Jour:', dayOfWeek, 'Heure:', time);
    
    const daysOfWeek = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
      'Sunday': 0
    };

    const targetDay = daysOfWeek[dayOfWeek as keyof typeof daysOfWeek];
    const [hours, minutes] = time.split(':').map(Number);
    
    const now = new Date();
    const today = now.getDay();
    
    console.log('📅 Jour cible (0=dim, 1=lun...):', targetDay);
    console.log('📅 Jour actuel:', today);
    console.log('📅 Heure cible:', hours + ':' + minutes);
    
    let daysUntilTarget = targetDay - today;
    console.log('📅 Jours jusqu\'au jour cible (initial):', daysUntilTarget);
    
    if (daysUntilTarget < 0) {
      daysUntilTarget += 7; // Prochaine semaine
      console.log('📅 Jour passé, report à la semaine prochaine:', daysUntilTarget);
    } else if (daysUntilTarget === 0) {
      // Même jour - vérifier si l'heure est passée
      const targetTime = new Date(now);
      targetTime.setHours(hours, minutes, 0, 0);
      
      console.log('📅 Même jour - Heure cible:', targetTime.toLocaleString('fr-FR'));
      console.log('📅 Même jour - Heure actuelle:', now.toLocaleString('fr-FR'));
      
      if (targetTime <= now) {
        daysUntilTarget = 7; // Prochaine semaine
        console.log('📅 Heure passée aujourd\'hui, report à la semaine prochaine');
      } else {
        console.log('📅 Heure pas encore passée aujourd\'hui');
      }
    }
    
    const reminderDate = new Date(now);
    reminderDate.setDate(now.getDate() + daysUntilTarget);
    reminderDate.setHours(hours, minutes, 0, 0);
    
    console.log('📅 Date finale calculée:', reminderDate.toLocaleString('fr-FR'));
    
    return reminderDate;
  }

  cancelScheduledNotification(reminderId: number): void {
    console.log('🗑️ Annulation notification pour reminder ID:', reminderId);
    const index = this.notificationPool.findIndex(n => n.id === reminderId);
    if (index >= 0) {
      this.notificationPool.splice(index, 1);
      console.log('✅ Notification supprimée du pool');
    } else {
      console.log('⚠️ Notification non trouvée dans le pool');
    }
    console.log('📊 Pool après suppression:', this.notificationPool.length, 'notifications');
  }

  private startNotificationChecker(): void {
    console.log('🚀 Démarrage du vérificateur de notifications');
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      console.log('🔄 Arrêt de l\'ancien vérificateur');
    }
    
    this.checkInterval = setInterval(() => {
      this.checkNotifications();
    }, 60000); // Vérifier toutes les minutes
    
    console.log('⏰ Vérificateur configuré (toutes les 60 secondes)');
    
    // Vérification immédiate
    this.checkNotifications();
  }

  private checkNotifications(): void {
    const now = new Date();
    console.log('🔍 Vérification des notifications à:', now.toLocaleString('fr-FR'));
    console.log('📊 Notifications dans le pool:', this.notificationPool.length);
    
    this.notificationPool.forEach((reminder, index) => {
      const reminderTime = this.getNextReminderTime(reminder.day_of_week, reminder.time);
      
      console.log(`📋 Reminder ${reminder.id} (${reminder.title}):`);
      console.log(`   - Heure prévue: ${reminderTime.toLocaleString('fr-FR')}`);
      
      // Vérifier si c'est le moment de déclencher la notification (avec une marge de 1 minute)
      const timeDiff = reminderTime.getTime() - now.getTime();
      console.log(`   - Différence: ${Math.round(timeDiff / 1000)} secondes`);
      
      if (timeDiff <= 60000 && timeDiff > -60000) { // Dans la minute
        console.log('🔔 DÉCLENCHEMENT de la notification!');
        this.showNotification(
          '🏋️ Rappel d\'Entraînement',
          {
            body: `Il est temps pour: ${reminder.title}`,
            icon: '/favicon.ico',
            tag: `reminder-${reminder.id}`,
            requireInteraction: true
          }
        );
        
        // Supprimer du pool après déclenchement
        this.notificationPool.splice(index, 1);
        console.log('🗑️ Notification supprimée du pool après déclenchement');
      }
    });
  }

  private shouldTriggerNotification(reminder: any, currentDay: string, currentTime: string): boolean {
    // Vérifier si c'est le bon jour
    if (reminder.day_of_week !== currentDay) {
      return false;
    }

    // Vérifier si c'est la bonne heure (avec une tolérance de 1 minute)
    const reminderTime = reminder.time.substring(0, 5); // HH:MM
    if (reminderTime !== currentTime) {
      return false;
    }

    // Vérifier si déjà déclenchée aujourd'hui
    const today = new Date().toDateString();
    if (reminder.lastTriggered === today) {
      return false;
    }

    return true;
  }

  private getCurrentDayName(): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  }

  loadTodayReminders(reminders: any[]): void {
    console.log('📅 Chargement des rappels du jour...');
    // Cette méthode sera appelée par le composant reminder pour charger les rappels du jour
    // et les ajouter au pool de notifications
    console.log('📊 Pool actuel avant chargement:', this.notificationPool.length, 'notifications');
    console.log('📅 Chargement des rappels du jour dans le pool');
    this.notificationPool = reminders.filter(r => r.notify);
    console.log('📊 Pool mis à jour:', this.notificationPool.length, 'notifications actives');
  }

  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  isNotificationSupported(): boolean {
    return 'Notification' in window;
  }

  ngOnDestroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}