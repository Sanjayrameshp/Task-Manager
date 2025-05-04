import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from "./components/header/header.component";
import { FooterComponent } from "./components/footer/footer.component";
import { CommonModule } from '@angular/common';
import { TaskService } from './services/task.service';
import { MessagesModule } from 'primeng/messages';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, CommonModule, MessagesModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'task-manager';
  private taskService = inject(TaskService)

  messages = computed(() => this.taskService.getAlertMessages());
  isLoading = computed(() => this.taskService.isLoading())
}
