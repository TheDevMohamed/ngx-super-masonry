import {Component, OnInit, ViewChild} from '@angular/core';
import {MasonryItemComponent, MasonryOptions, NgxSuperMasonryComponent} from 'ngx-super-masonry';
import {NgForOf} from '@angular/common';

interface ImageItem {
  id: number;
  src: string;
  imageLoaded: boolean;
  price: number;
}

@Component({
  selector: 'app-root',
  imports: [MasonryItemComponent, NgxSuperMasonryComponent, NgForOf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  @ViewChild(NgxSuperMasonryComponent) masonry!: NgxSuperMasonryComponent<ImageItem>;
  masonryOptions: MasonryOptions<ImageItem> = {
    columns: 2,
    columnWidth: 20,  // Adjust this based on your needs
    gutterX: 15,        // Space between items
    gutterY: 15,        // Space between rows
    animationDuration: 100,
    // sortFunction: (items: MasonryItemComponent<ImageItem>[]) => {
    //   return items.sort((a, b) => b.data.price - a.data.price);
    // }
  };

  images: ImageItem[] = [];

  onImageLoad(item: ImageItem) {
    item.imageLoaded = true;
  }

  ngOnInit() {
    this.images = this.generateImages(50);
  }

  private generateImages(count: number): ImageItem[] {
    return Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      // Random width between 200-800, height between 200-400
      src: `https://picsum.photos/${this.getRandomInt(200, 800)}/${this.getRandomInt(200, 400)}?random=${index}`,
      imageLoaded: false,
      price: this.getRandomInt(10, 1000)
    }));
  }

  private getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }


  trackByFn(index: number, item: ImageItem) {
    return `${item.id} - ${index}`;
  }
}

