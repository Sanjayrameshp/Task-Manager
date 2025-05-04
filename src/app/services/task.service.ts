import { Injectable, inject,signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject,catchError, tap, throwError,map, filter, from, switchMap, of } from 'rxjs';
import { adminRegUser } from '../common/interfaces/user.interface';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc, collection, getDocs, query, where, addDoc, collectionData, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { Message } from '../common/interfaces/message.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);
  private getUserFromLC = localStorage.getItem('user');
  private parsedUser = this.getUserFromLC ? JSON.parse(this.getUserFromLC) : null;
  public $user: BehaviorSubject<any> = new BehaviorSubject<any>(this.parsedUser);

  private alertMessage = signal<Message[]>([]);
  private loading = signal<boolean>(false);
  private getAdminPassFromLC = localStorage.getItem('pass');
  private parsedPass = this.getAdminPassFromLC ? this.getAdminPassFromLC : '';
  public adminPassword: BehaviorSubject<any> = new BehaviorSubject<any>(this.parsedPass);

  private getAdminEmailFromLC = localStorage.getItem('admin_email');
  private parsedAdminEmail = this.getAdminEmailFromLC ? this.getAdminEmailFromLC : '';
  public adminEmail: BehaviorSubject<string> = new BehaviorSubject(this.parsedAdminEmail);

  private currentUserAndPass = localStorage.getItem('CurrentUP');
  private parsedUserDetails = this.currentUserAndPass ? JSON.parse(this.currentUserAndPass) : null;
  public userAndPass : BehaviorSubject<any> = new BehaviorSubject<any>(this.parsedUserDetails);


  constructor(private auth: Auth, private firestore: Firestore) { }

  submitRegistrationForm(userData: adminRegUser) {
    console.log("USER DATA > ", userData);
    
    return from(createUserWithEmailAndPassword(this.auth, userData.email, userData.password)).pipe(
      switchMap((userCredential) => {
        const uid = userCredential.user.uid;
        const userRef = doc(this.firestore, `users/${uid}`);
        return from(setDoc(userRef, {
          name: userData.name,
          email: userData.email,
          role: userData.role,
          phone: userData.phone,
          project: userData.project,
          adminId: userData.adminId ? userData.adminId : null
        })).pipe(
          map(() => ({ ...userData, uid }))
        );
      })
    );
  }

  registerUserAndRestoreAdmin(userData: adminRegUser) {
    const adminEmail = this.adminEmail.value;
    const adminPassword = this.adminPassword.value;

    console.log("adminEmail .", adminEmail);
    console.log("adminPassword .", adminPassword);
    

    if (!adminEmail || !adminPassword) {
      this.showAlertMessage('error', 'An error occured, Please logout and login again.', 8000);
      return throwError(() => new Error('Missing admin credentials'));
    }


    return this.submitRegistrationForm(userData).pipe(
      switchMap(() => {
        // Log out newly registered user
        return from(this.auth.signOut());
      }),
      switchMap(() => {

        // Log back in as admin
        return this.loginUser(adminEmail, adminPassword);
      }),
      tap(() => {
        this.showAlertMessage('success', 'User registered and admin session restored.', 3000);
      }),
      catchError((err) => {
        this.showAlertMessage('error', 'Failed to restore admin session: ' + err.message, 4000);
        return throwError(() => err);
      })
    );
  }

  loginUser(email: string, password: string) {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap((userCredential) => {
        const uid = userCredential.user.uid;
        const userRef = doc(this.firestore, `users/${uid}`);
        return from(getDoc(userRef)).pipe(
          switchMap((docSnap) => {
            if (!docSnap.exists()) {
              throw new Error('User profile not found.');
            }
  
            const userData = docSnap.data();

            if (userData['role'] === 'Admin') {
              this.adminPassword.next(password);
              localStorage.setItem('pass', password);
              localStorage.setItem('admin_email', email);
              this.adminEmail.next(email)
            }

            if(userData) {
              this.userAndPass.next({userMail: email, userPass: password});
              localStorage.setItem('CurrentUP', JSON.stringify({userMail: email, userPass: password}))
            }

            return from(userCredential.user.getIdToken()).pipe(
              map((token) => ({
                ...userData,
                token,
                uid,
              })),
              tap((user)=> {
                this.$user.next(user);
                localStorage.setItem('user', JSON.stringify(user));
              })
            );
          })
        );
      })
    );
  }

  getAdminPassword() {
    return this.adminPassword.asObservable()
  }

  getLoggedUser(): any | null {
    return this.$user.asObservable();
  }

  getUserEmailAndPass() {
    return this.userAndPass.asObservable();
  }

  logoutUser() {
    return from(this.auth.signOut()).pipe(
      tap(() => {
        this.$user.next(null);
        localStorage.removeItem('user');
        // Optional: keep admin_email & pass for session restoration
      })
    );
  
  }

  fetchAllUsers(loggedUser:any) {
    const usersCollection = collection(this.firestore, 'users');
    const q = query(
      usersCollection,
      where('role', '==', 'User'),
      where('adminId', '==', loggedUser.uid)
    );
  
    return from(getDocs(q)).pipe(
      map(snapshot =>
        snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        }))
      )
    );
  }

  getUserById(uid: string) {
    const userRef = doc(this.firestore, `users/${uid}`);
    return from(getDoc(userRef)).pipe(
      map((docSnap) => {
        if (!docSnap.exists()) {
          throw new Error('User not found.');
        }
        return { uid, ...docSnap.data() };
      })
    );
  }

  addTaskToUser(uid: string, taskData: any) {
    const tasksRef = collection(this.firestore, `users/${uid}/tasks`);
    return from(addDoc(tasksRef, taskData));
  }

  updateTaskForUser(uid: string, taskId: string, taskData: any) {
    const taskDocRef = doc(this.firestore, `users/${uid}/tasks/${taskId}`);
    return from(updateDoc(taskDocRef, taskData));
  }

  deleteTaskFromUser(uid: string, taskId: string) {
    const taskDoc = doc(this.firestore, `users/${uid}/tasks/${taskId}`);
    return from(deleteDoc(taskDoc));
  }

  getTasksForUser(uid: string) {
    const tasksRef = collection(this.firestore, `users/${uid}/tasks`);
    return collectionData(tasksRef, { idField: 'taskId' });
  }

  showAlertMessage(type:Message['severity'], message: string, duration: number) {
    const messageModel = {
      severity: type,
      summary: message,
      life: duration
    }
    this.alertMessage.set([messageModel])
  }

  get getAlertMessages() {
    return this.alertMessage.asReadonly();
  }
  clearMessages() {
    this.alertMessage.set([]);
  }

  // Function for show loading
  showloading(value: boolean) {
    this.loading.set(value)
  }

  isLoading () {
    return this.loading();
  }

}
