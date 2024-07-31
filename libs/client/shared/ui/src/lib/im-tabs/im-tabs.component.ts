import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChild,
} from '@angular/core';
import { RxJSBaseClass } from '@involvemint/client/shared/util';
import { SuperTabs } from '@ionic-super-tabs/angular';
import { BehaviorSubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ImTabComponent } from './im-tab/im-tab.component';

@Component({
  selector: 'im-tabs',
  templateUrl: './im-tabs.component.html',
  styleUrls: ['./im-tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImTabsComponent extends RxJSBaseClass implements AfterContentInit {
  @Input() slot: 'top' | 'bottom' = 'top';
  @Input() activeTabIndex = 0;
  @Input() padding = '0px 0px 0px 0px';
  @Input() swipeEnabled = true;

  @Output() tabChange = new EventEmitter<number>();

  @ViewChild('superTabs') superTabs!: SuperTabs;

  @ContentChildren(ImTabComponent) tabs!: QueryList<ImTabComponent>;

  labels$ = new BehaviorSubject<string[]>([]);

  constructor() {
    super();
  }

  tabChangeEvent(event: Event) {
    const newIndex = (event as CustomEvent).detail.index;
    const tabArray = this.tabs.toArray();
    if (!tabArray[newIndex]?.disabled) {
      this.tabChange.emit(newIndex);
      this.activeTabIndex = newIndex; 
    } else {
      this.superTabs.selectTab(this.activeTabIndex);
    }
  }

  selectTab(index: number) {
    if (!this.tabs.toArray()[index]?.disabled) {
      this.superTabs.selectTab(index);
      this.activeTabIndex = index; 
    }
  }

  ngAfterContentInit() {
    this.resetLabels();
    this.tabs.changes.pipe(takeUntil(this.destroy$)).subscribe(() => this.resetLabels());
  }

  private resetLabels() {
    this.labels$.next(this.tabs.toArray().map((tab) => tab.label));
  }

  setIndex(index: number) {
    if (!this.tabs.toArray()[index]?.disabled) {
      this.superTabs.selectTab(index);
    }
  }
}
