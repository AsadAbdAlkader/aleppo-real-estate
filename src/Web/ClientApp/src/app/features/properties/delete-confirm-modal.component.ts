import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Property } from '../../core/models/property.model';

@Component({
  selector: 'app-delete-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-confirm-modal.component.html',
  styleUrls: []
})
export class DeleteConfirmModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly property = input<Property | null>(null);

  readonly close = output<void>();
  readonly confirmed = output<string>();

  readonly deleting = signal<boolean>(false);

  onClose(): void {
    if (this.deleting()) return;
    this.close.emit();
  }

  onConfirm(): void {
    const prop = this.property();
    if (!prop || this.deleting()) return;
    this.deleting.set(true);
    this.confirmed.emit(prop.id);
  }

  resetDeleting(): void {
    this.deleting.set(false);
  }
}
