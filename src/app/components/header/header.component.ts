import { Component, inject, OnInit } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  private router = inject(Router)

  private taskService = inject(TaskService);
  user:any;
  isLogged: boolean = false
  ngOnInit(): void {
    this.taskService.getLoggedUser().subscribe({
      next: (user: any) => {
        this.user = user;
        this.isLogged = !!user;
      },
      error: (err:Error) => {
        console.error('Error fetching user:', err);
        this.isLogged = false;
      }
    });
  }

  navigateToLogin() {
    this.router.navigate(['/login'])
  }
  LogOut() {
    this.taskService.logoutUser().subscribe({
      next: (data)=> {
        this.taskService.showAlertMessage('success', 'Logged out successfully', 3000)
        this.router.navigate(['/login'])
      },
      error: (err)=> {
        this.taskService.showAlertMessage('success', 'something went wrong', 3000)
      }
    })
  }
}
