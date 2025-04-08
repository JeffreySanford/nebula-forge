import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appLogHighlight]'
})
export class LogHighlightDirective implements OnChanges {
  @Input() appLogHighlight: string = '';
  @Input() category: string = '';

  private readonly categoryColors: Record<string, string> = {
    error: '#ffebee',
    warning: '#fff8e1',
    info: '#e1f5fe',
    debug: '#f5f5f5',
    api: '#e8f5e9',
    frontend: '#e8eaf6',
    database: '#f3e5f5',
    websocket: '#e0f7fa'
  };

  constructor(private el: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appLogHighlight'] || changes['category']) {
      this.highlightLog();
    }
  }

  private highlightLog(): void {
    // Determine which style to apply based on the level or category
    const element = this.el.nativeElement;
    const level = this.appLogHighlight.toLowerCase();
    const backgroundColor = this.categoryColors[level] || 
                           this.categoryColors[this.category] || 
                           'transparent';
    
    // Apply the styles
    element.style.backgroundColor = backgroundColor;
    
    // Add extra styling for errors
    if (level === 'error') {
      element.style.fontWeight = 'bold';
      element.style.borderLeft = '4px solid #f44336';
    }
  }
}
