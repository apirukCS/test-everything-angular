import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
// import { BackButton } from '../back-button/back-button';
// import { TranslateModule } from '@ngx-translate/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-title-bar-mobile',
  imports: [CommonModule],
  templateUrl: './title-bar-mobile.html',
  styleUrl: './title-bar-mobile.scss',
})
export class TitleBarMobile {
  @Input() onClick?: () => void;
  @Input() title = '';
  @Input() padding = 'p-8';
  @Input() useMobileIconBack = true;

  private router = inject(Router);

  constructor() {
    this.setTitle();

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.setTitle();
      });
  }

  private setTitle() {
    let route = this.router.routerState.snapshot.root;

    while (route.firstChild) {
      route = route.firstChild;
    }

    this.title = route.data['title'] ?? '';
  }
}
