import { Directive, ElementRef, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[appLogHighlight]'
})
export class LogHighlightDirective implements OnInit {
  @Input() category: keyof typeof this.colorMap = '';
  
  private colorMap: { [key: string]: string } = {
    websocket: '#6a1b9a', // Purple
    http: '#00897b', // Teal
    router: '#ff5722', // Deep Orange
    auth: '#ffc107', // Amber
    database: '#3f51b5', // Indigo
    user: '#795548', // Brown
    metrics: '#009688', // Teal
    api: '#e91e63' // Pink
  };

  constructor(private el: ElementRef) {}

  ngOnInit() {
    if (this.category) {
      const colorKey = typeof this.category === 'string' ? this.category.toLowerCase() : '';
      const color = this.colorMap[colorKey] || '#757575';
      this.el.nativeElement.style.backgroundColor = `${color}20`; // Add transparency
      this.el.nativeElement.style.color = color;
      this.el.nativeElement.style.padding = '2px 6px';
      this.el.nativeElement.style.borderRadius = '4px';
      this.el.nativeElement.style.display = 'inline-block';
      this.el.nativeElement.style.fontWeight = '500';
    }
  }
}
