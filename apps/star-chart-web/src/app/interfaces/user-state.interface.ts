export interface UserState {
  id: string;
  username: string;
  state: 'active' | 'inactive' | 'suspended';
  roles: string[];
}
