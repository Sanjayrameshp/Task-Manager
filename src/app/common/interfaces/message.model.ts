export interface Message {
    severity : 'success' | 'warn' | 'info' | 'error',
    summary : string,
    life : number
}