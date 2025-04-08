import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.6s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(100, [
            animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class AboutComponent implements OnInit {
  features = [
    { name: 'Real-time Monitoring', icon: 'speed', description: 'Track application performance in real-time with millisecond accuracy' },
    { name: 'Database Analytics', icon: 'storage', description: 'Detailed insights into database operations and performance metrics' },
    { name: 'GraphQL Integration', icon: 'share', description: 'Seamless integration with GraphQL APIs for efficient data management' },
    { name: 'Advanced Logging', icon: 'receipt_long', description: 'Comprehensive logging system with filtering and search capabilities' },
    { name: 'System Metrics', icon: 'trending_up', description: 'Monitor CPU, memory, and network usage across your infrastructure' }
  ];
  
  teamMembers = [
    { name: 'Alex Chen', role: 'Lead Developer', avatar: 'assets/avatars/alex.jpg' },
    { name: 'Taylor Morgan', role: 'UX Designer', avatar: 'assets/avatars/taylor.jpg' },
    { name: 'Jordan Lee', role: 'Backend Engineer', avatar: 'assets/avatars/jordan.jpg' }
  ];

  ngOnInit(): void {
    // Animation initialization happens automatically
  }
}
