import { Component } from '@angular/core';

@Component({
  selector: 'app-top-nav',
  templateUrl: './top-nav.component.html',
  styleUrls: ['./top-nav.component.scss']
})
export class TopNavComponent {
  // Updated navigationItems without About and Contact
  navigationItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/logs', label: 'Logs' },
    { path: '/metrics', label: 'Metrics' },
    { path: '/performance', label: 'Performance' },
    { path: '/database', label: 'Database' },
    { path: '/graphql', label: 'GraphQL' }
  ];
}
