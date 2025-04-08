import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appMockData]'
})
export class MockDataDirective implements OnChanges {
  @Input('appMockData') isMockData: boolean | undefined;
  
  constructor(private el: ElementRef) {}
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isMockData']) {
      if (this.isMockData) {
        this.el.nativeElement.classList.add('mock-data-border');
        this.el.nativeElement.classList.add('mock-data-indicator');
      } else {
        this.el.nativeElement.classList.remove('mock-data-border');
        this.el.nativeElement.classList.remove('mock-data-indicator');
      }
    }
  }
}
