import { Component, inject, OnInit } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';
import { RegisterUserComponent } from "../register-user/register-user.component";
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  imports: [ButtonModule, DialogModule, CommonModule, RegisterUserComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {

  private taskService = inject(TaskService);
  private router = inject(Router)
  users: any = [];
  visible: boolean = false;
  loggedUser : any;

  ngOnInit(): void {
    this.taskService.getLoggedUser().subscribe({
      next: (user:any)=> {
        this.loggedUser = user;
        console.log("LOGGED USER dash >> ", this.loggedUser);
      },
      error: (err:any)=>{
        this.loggedUser = null;
      }
    })
    this.fetchAllUsers(this.loggedUser);
  }

  fetchAllUsers(loggedUser:any) {
    this.taskService.showloading(true)
    this.taskService.fetchAllUsers(loggedUser).subscribe({
      next:(user)=> {
        this.taskService.showloading(false)
        this.users= user;
      },
      error:(err:any)=> {
        this.users = [];
        this.taskService.showloading(false)
      }
    })
  }

  navigateToUserDetails(userId: string) {
    this.router.navigate(['/user-details',userId])

  }

  showDialog() {
    this.visible = true;
  }

  reFetchUser(event: boolean) {
    this.visible = event;
    this.fetchAllUsers(this.loggedUser);
  }
}
