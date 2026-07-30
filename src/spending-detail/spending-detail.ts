import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
// import { DialogService } from '../../../services/dialog/dialog.service';
// import { Card } from '../../../services/spending/spending-card/spending-card.model';
import { CommonModule, Location } from '@angular/common';
// import { CardService } from '../../../services/card/card.service';
// import { SpendingPayload } from '../../../services/card/card-payload.model';
import { finalize, firstValueFrom, take } from 'rxjs';
// import { TitleBarMobile } from '../../../components/title-bar-mobile/title-bar-mobile';
// import { UtilsService } from '@services/utils/utils';
// import { TranslateModule, TranslateService } from '@ngx-translate/core';
// import { InputComponent } from '@components/input/input.component';
import {
  AbstractControl,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
// import { SPENDING_CARDS_STORE } from '@core/const/local-storage-keys';
// import { ErrorMassageService } from '@services/error-message/error-massage.service';
import { HttpErrorResponse } from '@angular/common/http';
import { TitleBarMobile } from '../components/title-bar-mobile/title-bar-mobile';
// import { SpendingCardStore } from '@services/spending/spending-card/spending-card.service';
// import { CardStatusIds } from '@services/card/card.enum';

export interface Card {
  id: number;
  card_no: string;
  card_status_id: number;
  card_status_name: string;
  card_type_name: string;
  url_file: string;
  balance: number;
  amount: number;
  expired_at: string;

  card_policy: {
    id: number;
    name: string;
    description: string;
    spending_type: string;
    balance_limit: number;
    balance_limit_transaction: number;
    require_security_code: boolean;
    usage_type: string;
  };
}

@Component({
  selector: 'app-spending-detail',
  imports: [CommonModule, ReactiveFormsModule, TitleBarMobile],
  templateUrl: './spending-detail.html',
  styleUrl: './spending-detail.scss',
})
export class SpendingDetail implements OnInit, OnDestroy {
  readonly maxCards = 30;

  spendingAmount = 0;
  totalBalance = 0;
  remaining = signal(0);
  purchaseAmount = 0;
  balance = 0;

  isLoading = signal(false);
  isFullPayment = signal(false);
  canDeactivatePage = signal(true);
  removingCard = signal(false);

  modalShowing = signal<'' | 'enterAmount' | 'removeCard'>('');
  amountItems = signal<(number | 'Full')[]>([100, 300, 500, 1000, 'Full']);
  amountSelected = signal<number | null>(null);
  cards = signal<Card[]>([]);

  amountText = new FormControl<string>('', {
    validators: [Validators.required, this.amountGreaterThanZeroValidator],
  });
  editingCard!: Card;

  failedCards: {
    card_id: number;
    err_code: string;
    err_message: string;
  }[] = [];

  private router = inject(Router);
  // private dialog = inject(DialogService);
  private cdr = inject(ChangeDetectorRef);
  // private cardService = inject(CardService);
  // private untilService = inject(UtilsService);
  // private errorMessageService = inject(ErrorMassageService);
  private location = inject(Location);
  // private spendingCardStore = inject(SpendingCardStore);

  get amountInput() {
    return this.amountText.value
      ? Number(String(this.amountText.value ?? '').replace(/,/g, ''))
      : null;
  }

  amountGreaterThanZeroValidator(control: AbstractControl): ValidationErrors | null {
    const value = Number((control.value ?? '').toString().replace(/,/g, ''));

    return value > 0 ? null : { amountZero: true };
  }

  canAddCard(): boolean {
    return this.cards().length < this.maxCards;
  }

  hasFullyUsageCard(): boolean {
    return this.cards().some((card) => card.card_policy?.usage_type === 'Fully');
  }

  ngOnInit(): void {
    this.cards.set([
  {
    id: 1,
    card_no: '1234567890123456',
    card_status_id: 1,
    card_status_name: 'Active',
    card_type_name: 'Gift Card',
    url_file: 'https://picsum.photos/300/180?random=1',
    balance: 1000,
    amount: 1000,
    expired_at: '2032-07-01T00:00:00Z',
    card_policy: {
      id: 1,
      name: 'Standard Policy',
      description: 'Standard gift card policy',
      spending_type: 'FULL',
      balance_limit: 5000,
      balance_limit_transaction: 1000,
      require_security_code: true,
      usage_type: 'MULTIPLE',
    },
  },
  {
    id: 2,
    card_no: '1234567890123457',
    card_status_id: 1,
    card_status_name: 'Active',
    card_type_name: 'Gift Card',
    url_file: 'https://picsum.photos/300/180?random=2',
    balance: 850,
    amount: 850,
    expired_at: '2032-07-02T00:00:00Z',
    card_policy: {
      id: 1,
      name: 'Standard Policy',
      description: 'Standard gift card policy',
      spending_type: 'FULL',
      balance_limit: 5000,
      balance_limit_transaction: 1000,
      require_security_code: true,
      usage_type: 'MULTIPLE',
    },
  },
  {
    id: 3,
    card_no: '1234567890123458',
    card_status_id: 2,
    card_status_name: 'Inactive',
    card_type_name: 'Reward Card',
    url_file: 'https://picsum.photos/300/180?random=3',
    balance: 0,
    amount: 500,
    expired_at: '2032-07-03T00:00:00Z',
    card_policy: {
      id: 2,
      name: 'Reward Policy',
      description: 'Reward card policy',
      spending_type: 'PARTIAL',
      balance_limit: 3000,
      balance_limit_transaction: 500,
      require_security_code: false,
      usage_type: 'SINGLE',
    },
  },
  {
    id: 4,
    card_no: '1234567890123459',
    card_status_id: 1,
    card_status_name: 'Active',
    card_type_name: 'Meal Card',
    url_file: 'https://picsum.photos/300/180?random=4',
    balance: 2500,
    amount: 2500,
    expired_at: '2032-07-04T00:00:00Z',
    card_policy: {
      id: 3,
      name: 'Meal Policy',
      description: 'Meal allowance',
      spending_type: 'FULL',
      balance_limit: 10000,
      balance_limit_transaction: 2500,
      require_security_code: false,
      usage_type: 'MULTIPLE',
    },
  },
  {
    id: 5,
    card_no: '1234567890123460',
    card_status_id: 3,
    card_status_name: 'Expired',
    card_type_name: 'Gift Card',
    url_file: 'https://picsum.photos/300/180?random=5',
    balance: 0,
    amount: 1500,
    expired_at: '2032-07-05T00:00:00Z',
    card_policy: {
      id: 1,
      name: 'Standard Policy',
      description: 'Standard gift card policy',
      spending_type: 'FULL',
      balance_limit: 5000,
      balance_limit_transaction: 1000,
      require_security_code: true,
      usage_type: 'MULTIPLE',
    },
  },
]);
  }

  calculateTotalAndRemaining() {
    this.totalBalance = this.cards().reduce((sum, card) => sum + (card.amount || 0), 0);
    this.remaining.set(this.spendingAmount - this.totalBalance);
  }

  saveCard(cards: Card[]) {
    this.cards.set(cards);
    // sessionStorage.setItem(SPENDING_CARDS_STORE, JSON.stringify(this.cards()));
  }

  ngOnDestroy(): void {}

  async onContinue() {
   
  }

  getCardError(cardId: number) {
    return this.failedCards.find((item) => item.card_id === cardId);
  }

  isActiveAmountButton(item: number | 'Full') {
    return (item === 'Full' ? this.balance : item) === this.amountInput;
  }

  async onAddCard(): Promise<void> {
   
  }

  async removeCard(card: Card): Promise<void> {
    
  }

  async onEdit(data: Card): Promise<void> {
    
  }

  disableSubmitButton(): boolean {
    const total = this.cards().reduce((sum, card) => sum + (card.amount || 0), 0);
    return (
      this.cards().length === 0 ||
      (this.hasFullyUsageCard() ? total < this.spendingAmount : this.remaining() !== 0)
    );
  }

  onNext() {
    const amount = Number(this.amountText.value?.toString().replaceAll(',', ''));

    this.amountText.markAsTouched();
    if (this.amountText.invalid) {
      return;
    }

    if (this.editingCard) {
      this.saveCard(
        this.cards().map((card) => (card.id === this.editingCard.id ? { ...card, amount } : card)),
      );
    }

    this.totalBalance = this.cards().reduce((sum, card) => sum + (card.amount || 0), 0);
    this.remaining.set(this.spendingAmount - this.totalBalance);

    this.cdr.detectChanges();
    this.closeBottomSheet();
  }

  onAmountItemChange(amount: number | 'Full') {
    let value: number | null;

    if (amount === 'Full') {
      value = this.balance;
    } else {
      value = this.amountSelected() === amount ? null : amount;
    }

    this.amountSelected.set(value);
    this.amountText.setValue(value !== null ? `${value}` : '');
  }

  openModalEnterAmount(cardData: Card) {
    this.editingCard = cardData;
    this.balance = cardData.balance;
    this.amountText.setValue(String(cardData.amount));
    this.modalShowing.set('enterAmount');
  }

  openModalRemoveCard(cardData: Card) {
    this.editingCard = cardData;
    this.modalShowing.set('removeCard');
  }

  closeBottomSheet() {
    this.modalShowing.set('');
  }

  removeCardMobile(): void {
    
  }

  async removeAllCards() {
    
  }

  async onBack() {
    this.location.back();
  }

  canDeactivate(nextUrl: string): Promise<boolean> | boolean {
    if (['/terminal'].includes(nextUrl) || !this.cards().length) return true;
    // return this.confirmLeave();
    return true;
  }
}
