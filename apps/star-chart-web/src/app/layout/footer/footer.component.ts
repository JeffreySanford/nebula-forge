import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  // Footer related properties and methods
  currentYear = new Date().getFullYear();
  
  // Keep About and Contact in the footer navigation
  navigationItems = [
    { path: '/dashboard', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' }
  ];
}
