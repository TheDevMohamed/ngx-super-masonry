import {Component, ElementRef, inject, Input} from '@angular/core';

@Component({
  selector: 'lib-masonry-item',
  imports: [],
  templateUrl: './masonry-item.component.html',
  standalone: true,
  styles: [`
    :host {
      display: block;
      position: absolute;
      width: var(--masonry-column-width, auto);
      transition: transform var(--masonry-animation-duration, 300ms) ease-out;
    }
  `]
})
export class MasonryItemComponent<T> {
  @Input({required: true}) data: T = {} as T;
  public readonly elementRef = inject(ElementRef);
}
