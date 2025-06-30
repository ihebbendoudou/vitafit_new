import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-profile.component.html',
  styleUrls: ['./dashboard-profile.component.css']
})
export class DashboardProfileComponent implements OnInit {
  userName: string = '';
  userEmail: string = '';
  userId: string = '';

  constructor() {}

  ngOnInit(): void {
    this.loadUserInfo();
  }

  loadUserInfo(): void {
    // Récupérer les informations utilisateur depuis le localStorage
    this.userEmail = localStorage.getItem('userEmail') || '';
    this.userId = localStorage.getItem('userId') || '';
    
    // Extraire le nom d'utilisateur de l'email
    if (this.userEmail) {
      this.userName = this.userEmail.split('@')[0];
    }
  }
}