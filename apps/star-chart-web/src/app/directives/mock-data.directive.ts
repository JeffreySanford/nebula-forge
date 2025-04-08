import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appMockData]'
})
export class MockDataDirective implements OnChanges {
  @Input() appMockData: boolean | undefined;

  constructor(private el: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['appMockData']) {
      this.updateStyles();
    }
  }

  private updateStyles(): void {
    const element = this.el.nativeElement;
    
    if (this.appMockData) {
      element.classList.add('mock-data');
      
      // Add a small indicator that this is mock data
      const mockIndicator = document.createElement('span');
      mockIndicator.classList.add('mock-data-indicator');
      mockIndicator.setAttribute('title', 'Mock data');
      mockIndicator.textContent = '[Mock]';
      
      // Only add if it doesn't exist yet
      if (!element.querySelector('.mock-data-indicator')) {
        element.appendChild(mockIndicator);
      }
    } else {
      element.classList.remove('mock-data');
      
      // Remove the indicator if it exists
      const indicator = element.querySelector('.mock-data-indicator');
      if (indicator) {
        element.removeChild(indicator);
      }
    }
  }
}
