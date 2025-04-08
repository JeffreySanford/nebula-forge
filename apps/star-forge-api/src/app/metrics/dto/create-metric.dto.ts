export class CreateMetricDto {
  name!: string;
  value!: number;
  unit!: string;
  timestamp?: Date;
  source!: string;
  type!: string;
  color?: string;
  
  // Add constructor to satisfy TypeScript's definite assignment
  constructor(partial: Partial<CreateMetricDto> = {}) {
    Object.assign(this, partial);
    
    // Set timestamp to current date if not provided
    if (!this.timestamp) {
      this.timestamp = new Date();
    }
  }
}
