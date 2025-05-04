import { Component, inject, OnInit } from '@angular/core';
import { PasswordModule } from 'primeng/password';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { FormGroup, FormControl, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserRole } from '../../common/interfaces/user.interface';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-register-admin',
  imports: [ReactiveFormsModule, CommonModule, PasswordModule],
  templateUrl: './register-admin.component.html',
  styleUrl: './register-admin.component.css'
})
export class RegisterAdminComponent implements OnInit {

  router = inject(Router)
  taskService = inject(TaskService)
  adminRegisterForm!: FormGroup;
  role: UserRole = 'Admin'

  ngOnInit(): void {
    this.adminRegisterForm = new FormGroup({
      name: new FormControl('', Validators.required),
      email: new FormControl('', [Validators.required, Validators.email]),
      phone: new FormControl('', [Validators.required, Validators.minLength(10), Validators.pattern(/^\d+$/)]),
      project: new FormControl('', Validators.required),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      confirmPassword: new FormControl('', Validators.required)
    }, { validators: this.passwordMatchValidator });
  }

  submitAdminRegForm () {
    console.log(this.adminRegisterForm.value);
    this.taskService.showloading(true);
    let postData = {
      ...this.adminRegisterForm.value,
      role: this.role,
      adminId: null
    }

    this.taskService.submitRegistrationForm(postData).subscribe({
      next: (data:any) => {
        console.log("data .. > ", data);
        
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('success', 'Admin Registered successfully, Please login to dashboard', 3000)
        if(data) {
          console.log('Admin registered and saved to Firestore');
          this.router.navigate(['/'])
        } else{
          this.taskService.showAlertMessage('error', 'Something went wrong, Please try again', 3000)
        }
      },
      error: (err) => {
        this.taskService.showAlertMessage('error', 'Something went wrong, Please try again 2', 3000)
        this.taskService.showloading(false);
        console.error('Registration error:', err);
        console.error('Registration error 2:', err.message);
      }
    });
  }

  passwordMatchValidator(formGroup: AbstractControl) {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  isInvalid(controlName: string, errorType: string = 'required'): boolean | undefined {
    const control = this.adminRegisterForm.get(controlName);
    return control?.touched && control.hasError(errorType);
  }

  passwordMismatch(): boolean {
    return this.adminRegisterForm.errors?.['mismatch'] && this.adminRegisterForm.get('confirmPassword')?.touched;
  }



}
