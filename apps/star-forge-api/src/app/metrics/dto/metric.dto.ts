export class MetricType {
  id!: string;
  name!: string;
  value!: number;
  unit!: string;
  timestamp?: Date;
  source!: string;
  type!: string;
  color?: string;

  constructor(partial: Partial<MetricType> = {}) {
    Object.assign(this, partial);
  }
}

export class MetricInput {
  name!: string;
  value!: number;
  unit!: string;
  timestamp?: Date;
  source!: string;
  type!: string;
  color?: string;

  constructor(partial: Partial<MetricInput> = {}) {
    Object.assign(this, partial);
  }
}
