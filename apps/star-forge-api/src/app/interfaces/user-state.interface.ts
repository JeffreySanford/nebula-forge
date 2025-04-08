export interface UserState {
  id: string;
  username: string;
  state: 'active' | 'suspended' | 'deleted';
  roles: string[];
}
