// We'll create a simpler version without class-validator dependencies

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
  }
}
