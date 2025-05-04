export type UserRole = 'Admin' | 'User';

export interface adminRegUser {
    name: string,
    email: string,
    password:string,
    confirmPassword: string,
    role? :string,
    phone: string,
    project: string,
    adminId?: string
}

export type Taskstatus = 'Pending' | 'Started' | 'In Progress' | 'Completed'