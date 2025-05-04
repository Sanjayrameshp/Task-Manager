import { Component, EventEmitter, OnInit,Output,inject,Input } from '@angular/core';
import { PasswordModule } from 'primeng/password';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { FormGroup, FormControl, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserRole } from '../../common/interfaces/user.interface';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-register-user',
  imports: [ReactiveFormsModule, CommonModule, PasswordModule],
  templateUrl: './register-user.component.html',
  styleUrl: './register-user.component.css'
})
export class RegisterUserComponent implements OnInit {

  router = inject(Router)
  taskService = inject(TaskService)
  userRegisterForm!: FormGroup;
  role: UserRole = 'User';
  loggedUser: any;
  @Output() formSubmittted: EventEmitter<boolean> = new EventEmitter<boolean>(); 
  clear: boolean = false;
  AdminPass:string = '';

  ngOnInit(): void {
    this.userRegisterForm = new FormGroup({
      name: new FormControl(null, Validators.required),
      email: new FormControl(null, [Validators.required, Validators.email]),
      phone: new FormControl(null, [
        Validators.required,
        Validators.minLength(10),
        Validators.pattern(/^\d+$/)
      ]),
      project: new FormControl(null, Validators.required),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      confirmPassword: new FormControl('', Validators.required)
    }, { validators: this.passwordMatchValidator });


    this.taskService.getLoggedUser().subscribe({
      next: (user:any)=> {
        this.loggedUser = user;
        console.log("LOGGED USER >> ", this.loggedUser);
        this.taskService.getAdminPassword().subscribe((data:string)=> {
          this.AdminPass = data;
          console.log("Admin pass >> ", this.AdminPass);
          
        })
        
      },
      error: (err:any)=>{

      }
    })
  }

  passwordMatchValidator(formGroup: AbstractControl): { [key: string]: boolean } | null {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { 'passwordMismatch': true };
  }

  // Helper function to check if a form control is invalid and touched
  isInvalid(controlName: string, errorType?: string): boolean {
    const control = this.userRegisterForm.get(controlName);
    return control ? control.touched && control.invalid && (!errorType || control.hasError(errorType)) : false;
  }

  submitUserRegForm(): void {
    
    if (this.userRegisterForm.invalid) {
      return;
    }

    let postData = {
      ...this.userRegisterForm.value, role: this.role, adminId: this.loggedUser.uid
    };

    console.log("POst DATA >> ", postData);
    let email = this.loggedUser.email ? this.loggedUser.email : '';
    let password = this.AdminPass ? this.AdminPass : '';

    this.taskService.showloading(true);
    this.taskService.registerUserAndRestoreAdmin(postData).subscribe({
      next: (data: any) => {
        this.clear = false;
        console.log('User registered and saved to Firestore');
        // this.taskService.showloading(false);
        if(data) {
          this.taskService.showAlertMessage('success', 'User created successfully', 3000)
        } else {
          this.taskService.showAlertMessage('success', 'Error while creating user', 3000)
        }
        this.clearForm();
      },
      error: (err: Error) => {
        this.clear = false;
        this.taskService.showloading(false);
          this.taskService.showAlertMessage('success', 'Error while creating user / Please try again later', 3000)
          console.error('Registration error:', err);
          this.clearForm();
      }
    });
  }


  clearForm() {
    this.userRegisterForm.reset();
    this.formSubmittted.emit(this.clear);
  }

}
