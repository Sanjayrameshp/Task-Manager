import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ReactiveFormsModule } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';

import { CommonModule } from '@angular/common';
import { Taskstatus } from '../../common/interfaces/user.interface';
import { BreadcrumbComponent } from "../../common/breadcrumb/breadcrumb.component";
import { Chart, registerables} from 'chart.js';

Chart.register(...registerables)

@Component({
  selector: 'app-user-details',
  imports: [ReactiveFormsModule, DropdownModule, InputTextModule, ButtonModule, DialogModule, CommonModule, BreadcrumbComponent, TextareaModule, FloatLabelModule],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.css'
})
export class UserDetailsComponent implements OnInit {
  activateRoute = inject(ActivatedRoute);
  private taskService = inject(TaskService)
  userId: any='';
  userdetails: any;
  showTaskDialog = false;
  taskForm!: FormGroup;
  private fb =  inject(FormBuilder);
  taskStatus : Taskstatus = 'Pending';
  selectedTaskId: string | null = null;
  isEditMode = false;
  breadCrumbItems : any[] = [];
  taskSummary : string = '';
  taskName : string = '';
  displaySummary: boolean = false;

  barChartLabel : string[] = [];
  barChartData : string[] = [];
  chartInstance: any = null;
  pieChartLabel : string[] = [];
  pieChartData : number[] = [];
  pieChart : any = null;
  loggedUser : any;

  statusOptions = [
    { label: 'Completed', value: 'Completed' },
    { label: 'In Progress', value: 'In Progress' },
    { label: 'Started', value: 'Started' },
    { label: 'Pending', value: 'Pending' }
  ];

  ngOnInit(): void {

    this.activateRoute.paramMap.subscribe((userId)=> {
      this.userId = userId.get('uid');

      if(this.userId) {
        this.getUserDetails(this.userId)
      }
    });
    this.breadCrumbItems = [
      {label: 'Home', route: '/dashboard', icon: 'fa fa-home'},
      {label: 'User Details'}
    ]

    this.taskForm = this.fb.group({
      taskName: ['', Validators.required],
      startDate: [new Date(), Validators.required],
      endDate: ['', Validators.required],
      percentageCompleted: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
      status: ['', Validators.required],
      summary:['']
    });

    this.taskService.getLoggedUser().subscribe({
      next: (user:any)=> {
        this.loggedUser = user;
        console.log("LOGGED USER dash >> ", this.loggedUser);
      },
      error: (err:any)=>{

      }
    })
    
  }

  getUserDetails(userId: any) {
    this.taskService.showloading(true);
    this.taskService.getUserById(userId).subscribe({
      next: (data: any) => {
        console.log("USER DET >> ", data);
        if (data) {
          this.userdetails = data;
  
          if(data) {
            this.taskService.getTasksForUser(userId).subscribe({
              next: (tasks: any) => {
                this.userdetails = { ...this.userdetails, tasks };
                console.log("USER-DETAILS WITH TASKS >>", this.userdetails);
  
                if (this.userdetails.tasks) {
                  const statusMap: { [key: string]: { total: number; count: number } } = {};
                
                  this.barChartLabel = [];
                  this.barChartData = [];
                  this.pieChartLabel = [];
                  this.pieChartData = [];
                
                  this.userdetails.tasks.forEach((task: any) => {
                    const status = task.status;
                    const percent = task.percentageCompleted || 0;
                
                    // Bar chart - task-wise
                    this.barChartLabel.push(task.taskName);
                    this.barChartData.push(percent);
                
                    // Pie chart prep - status-wise
                    if (!statusMap[status]) {
                      statusMap[status] = { total: 0, count: 0 };
                    }
                    statusMap[status].total += percent;
                    statusMap[status].count += 1;
                  });
                
                  // Pie chart - status-wise
                  for (const status in statusMap) {
                    this.pieChartLabel.push(status); // string
                    const avg = statusMap[status].count;
                    this.pieChartData.push(parseFloat(avg.toFixed(2)));
                  }
                  setTimeout(() => {
                    this.RenderBarChart(this.barChartLabel, this.barChartData);
                    this.RenderPieChart(this.pieChartLabel,this.pieChartData )
                  }, 0);
                }
                this.taskService.showloading(false);
              },
              error: (taskErr) => {
                this.taskService.showloading(false);
                this.taskService.showAlertMessage('error', 'Error loading tasks', 3000);
                console.error("Error fetching tasks:", taskErr);
              }
            });
          }
  
        } else {
          this.taskService.showloading(false);
          this.taskService.showAlertMessage('error', 'User not found', 3000);
        }
      },
      error: (err) => {
        this.taskService.showloading(false);
        this.taskService.showAlertMessage('error', 'Error fetching user details', 3000);
        console.error("Error fetching user:", err);
      }
    });
  }

  openTaskDialog() {
    this.taskForm.reset();
    this.showTaskDialog = true;
    this.isEditMode = false;
    this.selectedTaskId = null;
  }

  editTask(task: any) {
    this.taskForm.patchValue({
      taskName: task.taskName,
      startDate: task.startDate,
      endDate: task.endDate,
      percentageCompleted: task.percentageCompleted,
      status: task.status,
      summary: task.summary
    });
    this.selectedTaskId = task.taskId;
    this.showTaskDialog = true;
    this.isEditMode = true;
  }

  deleteTask(taskId: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTaskFromUser(this.userId, taskId).subscribe(() => {
        this.getUserDetails(this.userId);
      });
    }
  }

  submitTask() {
    if (this.taskForm.invalid) return;
    this.taskService.showloading(true);
  
    const taskData = this.taskForm.value;
  
    if (this.isEditMode && this.selectedTaskId) {
      this.taskService.updateTaskForUser(this.userId, this.selectedTaskId, taskData).subscribe(() => {
        this.afterTaskSubmit();
      });
    } else {
      this.taskService.addTaskToUser(this.userId, taskData).subscribe(() => {
        this.afterTaskSubmit();
      });
    }
  }

  afterTaskSubmit() {
    this.taskForm.reset();
    this.showTaskDialog = false;
    this.selectedTaskId = null;
    this.isEditMode = false;
    this.getUserDetails(this.userId);
  }

  showSummary(summary:string, task:string) {
    this.taskSummary = summary !== '' ? summary : '';
    this.taskName = task !== '' ? task : '';
    this.displaySummary = true;
  }

  closeDialog(){
    this.displaySummary = false;
  }

  RenderBarChart(labelData: string[], valueData: string[]) {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  
    this.chartInstance = new Chart('bar-chart', {
      type: 'bar',
      data: {
        labels: labelData,
        datasets: [
          {
            label: 'Task Completion (%)',
            data: valueData,
            backgroundColor: '#8d9ead'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Completion %'
            },
            ticks: {
              callback: (value) => `${value}%`
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                return `${context.parsed.y}% completed`;
              }
            }
          }
        }
      }
    });
  }

  RenderPieChart(labelData:string[], valueData: number[]) {
    if (this.pieChart) {
      this.pieChart.destroy();
    }
    this.pieChart = new Chart('pie-chart',{
      type: 'pie',
      data: {
        labels: labelData,
        datasets: [
          {
            data: valueData
          }
        ]
      },
      options: {

      }

    })
  }


}
