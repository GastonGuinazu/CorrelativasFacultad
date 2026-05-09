import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  input,
  output,
} from '@angular/core';
import { LucideAngularModule, X } from 'lucide-angular';

@Component({
  selector: 'app-modal-shell',
  standalone: true,
  imports: [LucideAngularModule, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        (click)="onBackdrop()"
      >
        <div
          class="w-full overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200"
          [ngClass]="maxWidthClass()"
          (click)="$event.stopPropagation()"
        >
          <header class="flex items-start justify-between gap-4 px-6 pt-6">
            <div class="flex flex-col">
              <h2 class="text-lg font-semibold text-slate-900">
                {{ title() }}
              </h2>
              @if (subtitle()) {
                <span class="text-xs text-slate-600">{{ subtitle() }}</span>
              }
            </div>
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
              aria-label="Cerrar"
              (click)="cerrar.emit()"
            >
              <lucide-icon [name]="iconClose" class="h-4 w-4"></lucide-icon>
            </button>
          </header>
          <div class="px-6 pb-6 pt-4">
            <ng-content />
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalShellComponent {
  readonly open = input<boolean>(false);
  readonly title = input<string>('');
  readonly subtitle = input<string | null>(null);
  /** Clases Tailwind para el ancho máximo del panel (ej. `max-w-2xl`). */
  readonly maxWidthClass = input<string>('max-w-lg');

  readonly cerrar = output<void>();

  readonly iconClose = X;

  onBackdrop(): void {
    this.cerrar.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.cerrar.emit();
  }
}
