import { Component, OnInit,inject } from '@angular/core';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { PasswordModule } from 'primeng/password';
import { TaskService } from '../../services/task.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterModule, PasswordModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {

  private taskService = inject(TaskService)
  private router = inject(Router)
  loginForm!: FormGroup;

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      email : new FormControl(null, [Validators.required]),
      password: new FormControl(null, [Validators.required]),
    })

    const storedData = localStorage.getItem('CurrentUP');
    if (storedData) {
    try {
      const parsed = JSON.parse(storedData);
      this.loginForm.patchValue({
        email: parsed.userMail,
        password: parsed.userPass
      });
    } catch (err) {
      console.error("Failed to parse stored login credentials:", err);
    }
  }
  }
  submitLoginForm() {
    const { email, password } = this.loginForm.value;
    this.taskService.showloading(true)

    this.taskService.loginUser(email, password).subscribe({
      next: (user:any) => {
        this.taskService.showloading(false)
        console.log('Admin logged in:', user);
        if(user.role === 'Admin'){
        this.router.navigate(['/dashboard']);
        } else if(user.role === 'User') {
          this.router.navigate(['/user-details',user.uid])
        } else{
          console.log("error occured");
        }
      },
      error: (err) => {
        this.taskService.showloading(false)
        console.error('Login failed:', err.message);
        alert(err.message);
      }
    });
  }

  navigateToAdminRegister() {
    this.router.navigate(['/register-admin'])
  }
}
