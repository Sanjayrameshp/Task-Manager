import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { TaskService } from './task.service';
import { map, tap, take } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {

  const router = inject(Router);
  const taskService = inject(TaskService);
  

  return taskService.getLoggedUser().pipe(
    take(1),
    map((user:any) => {
      if (!user) {
        router.navigate(['/login']);
        return false;
      }

      if (user.role === 'Admin') {
        if (state.url === '/' || state.url === '/login') {
          router.navigate(['/dashboard']);
          return false;
        }
        return true;
      }

      if (user.role === 'User') {
        if (state.url === '/' || state.url === '/login') {
          router.navigate([`/user-details/${user.uid}`]);
          return false;
        }
        return true;
      }

      router.navigate(['/login']);
      return false;
    })
  );
};
