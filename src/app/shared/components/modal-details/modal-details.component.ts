import {

  ChangeDetectionStrategy,

  Component,

  computed,

  effect,

  inject,

  input,

  output,

  signal,

} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {

  LucideAngularModule,

  MapPin,

  Users,

  Lightbulb,

  MessageCircle,

  User,

  Loader2,

  ThumbsUp,

} from 'lucide-angular';

import {
  OrdenComentariosModal,
  ProgressStore,
} from '../../../core/state/progress.store';

import { CategoriaComentario } from '../../../core/storage/progress-storage';

import { EvaluacionMateria } from '../../../core/models/materia.model';

import { ModalShellComponent } from '../modal-shell/modal-shell.component';



type Tab = CategoriaComentario;



interface TabDef {

  id: Tab;

  label: string;

  icon: typeof MapPin;

}



const TABS: TabDef[] = [

  { id: 'donde-cursar', label: 'Dónde Cursar', icon: MapPin },

  { id: 'opiniones-profes', label: 'Opiniones de Profes', icon: Users },

  { id: 'consejos-parciales', label: 'Consejos Parciales', icon: Lightbulb },

];



@Component({

  selector: 'app-modal-details',

  standalone: true,

  imports: [LucideAngularModule, FormsModule, ModalShellComponent],

  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `

    <app-modal-shell

      [open]="open()"

      [title]="evaluacion()?.materia?.nombre ?? ''"

      [subtitle]="subtituloMateria()"

      maxWidthClass="max-w-2xl"

      (cerrar)="cerrar.emit()"

    >

      @if (evaluacion(); as ev) {

        <div class="flex flex-wrap gap-2">

          @for (tab of tabs; track tab.id) {

            <button

              type="button"

              class="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition"

              [class]="

                activeTab() === tab.id

                  ? 'bg-teal-500 text-white shadow-sm'

                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'

              "

              (click)="setTab(tab.id)"

            >

              <lucide-icon [name]="tab.icon" class="h-4 w-4 shrink-0"></lucide-icon>

              {{ tab.label }}

            </button>

          }

        </div>



        <section class="mt-6 flex flex-col gap-4">

          <div

            class="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between"

          >

            <h3 class="text-base font-semibold text-slate-900">

              {{ activeTabLabel() }}

            </h3>

            <div

              class="inline-flex w-fit rounded-full bg-slate-100 p-1 ring-1 ring-slate-200/90"

              role="group"

              aria-label="Orden de comentarios"

            >

              <button

                type="button"

                class="rounded-full px-4 py-1.5 text-xs font-semibold transition"

                [class]="

                  ordenLista() === 'recientes'

                    ? 'bg-slate-900 text-white shadow-sm'

                    : 'text-slate-600 hover:text-slate-900'

                "

                (click)="setOrden('recientes')"

              >

                Recientes

              </button>

              <button

                type="button"

                class="rounded-full px-4 py-1.5 text-xs font-semibold transition"

                [class]="

                  ordenLista() === 'relevantes'

                    ? 'bg-slate-900 text-white shadow-sm'

                    : 'text-slate-600 hover:text-slate-900'

                "

                (click)="setOrden('relevantes')"

              >

                Relevantes

              </button>

            </div>

          </div>



          @if (!store.comentariosSupabaseConfigurado()) {

            <p

              class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-950"

            >

              Los comentarios compartidos requieren URL y anon key de Supabase en

              <code class="rounded bg-amber-100 px-1 py-0.5">environment</code>.

            </p>

          }



          @if (store.comentariosError(); as err) {

            <p

              class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-900"

              role="alert"

            >

              {{ err }}

            </p>

          }



          <div

            class="rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm ring-1 ring-slate-100"

          >

            <input

              type="text"

              class="mb-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/25"

              maxlength="80"

              placeholder="Nombre (opcional)"

              [ngModel]="nombreBorrador()"

              (ngModelChange)="nombreBorrador.set($event)"

            />

            <textarea

              class="min-h-[120px] w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-400/25"

              rows="4"

              maxlength="500"

              placeholder="Comparte tu experiencia..."

              [ngModel]="borrador()"

              (ngModelChange)="borrador.set($event)"

            ></textarea>

            <div

              class="mt-3 flex items-center justify-between border-t border-slate-100 pt-3"

            >

              <span class="text-xs font-medium text-slate-400">{{

                borrador().length

              }}/500</span>

              <button

                type="button"

                class="rounded-lg bg-teal-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:bg-teal-200 disabled:text-teal-700/80"

                [disabled]="!puedePublicar() || publicando()"

                (click)="publicar(ev)"

              >

                @if (publicando()) {

                  Publicando…

                } @else {

                  Publicar

                }

              </button>

            </div>

          </div>



          @if (cargandoComentarios()) {

            <div class="flex flex-col items-center justify-center gap-3 py-10">

              <lucide-icon

                [name]="iconLoader"

                class="h-9 w-9 animate-spin text-teal-500"

                aria-hidden="true"

              ></lucide-icon>

              <span class="text-xs font-medium text-slate-500"

                >Cargando comentarios…</span

              >

            </div>

          } @else {

            <div class="flex flex-col gap-3">

              @if (comentariosOrdenados().length > 0) {

                @for (c of comentariosOrdenados(); track c.id) {

                  <article

                    class="rounded-xl border border-slate-100 bg-white p-4 text-sm text-slate-800 shadow-sm"

                    [class]="

                      tieneNombre(c)

                        ? 'border-l-4 border-l-teal-500'

                        : 'border-dashed'

                    "

                  >

                    <div class="mb-2 flex flex-wrap items-center gap-2">

                      @if (tieneNombre(c)) {

                        <span

                          class="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold text-teal-900"

                        >

                          <lucide-icon [name]="iconUser" class="h-3 w-3"></lucide-icon>

                          {{ c.nombreUsuario }}

                        </span>

                      } @else {

                        <span

                          class="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium italic text-slate-600"

                        >

                          Anónimo

                        </span>

                      }

                      <span class="text-[11px] text-slate-400">

                        {{ formatFecha(c.fecha) }}

                      </span>

                    </div>

                    <p class="leading-relaxed text-slate-700">{{ c.texto }}</p>

                    <div

                      class="mt-3 flex items-center justify-end border-t border-slate-100 pt-3"

                    >

                      <button

                        type="button"

                        class="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800 disabled:cursor-not-allowed disabled:opacity-60"

                        [disabled]="

                          store.comentariosVotadosPorUsuario().has(c.id) ||

                          votandoComentarioId() === c.id ||

                          !store.comentariosSupabaseConfigurado()

                        "

                        (click)="votarUtil(c.id)"

                      >

                        <lucide-icon

                          [name]="iconThumbsUp"

                          class="h-3.5 w-3.5 shrink-0"

                        ></lucide-icon>

                        Es útil

                        <span class="tabular-nums text-slate-500">{{

                          c.votos_count ?? 0

                        }}</span>

                      </button>

                    </div>

                  </article>

                }

              } @else {

                <div

                  class="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center"

                >

                  <lucide-icon

                    [name]="iconChat"

                    class="h-7 w-7 text-slate-300"

                  ></lucide-icon>

                  <p class="text-sm font-medium text-slate-600">

                    Aún no hay comentarios en esta categoría

                  </p>

                  <p class="text-xs text-slate-400">

                    ¡Sé el primero en compartir tu experiencia!

                  </p>

                </div>

              }

            </div>

          }

        </section>

      }

    </app-modal-shell>

  `,

})

export class ModalDetailsComponent {

  readonly store = inject(ProgressStore);



  readonly open = input<boolean>(false);

  readonly evaluacion = input<EvaluacionMateria | null>(null);



  readonly cerrar = output<void>();



  readonly tabs = TABS;

  readonly activeTab = signal<Tab>('donde-cursar');

  readonly ordenLista = signal<OrdenComentariosModal>('recientes');

  readonly borrador = signal<string>('');

  readonly nombreBorrador = signal<string>('');

  readonly publicando = signal(false);



  readonly iconChat = MessageCircle;

  readonly iconUser = User;

  readonly iconLoader = Loader2;

  readonly iconThumbsUp = ThumbsUp;

  readonly votandoComentarioId = signal<string | null>(null);



  readonly subtituloMateria = computed(() => {

    const ev = this.evaluacion();

    if (!ev) return null;

    return `Código: ${ev.materia.id}`;

  });



  readonly activeTabLabel = computed(

    () => TABS.find((t) => t.id === this.activeTab())?.label ?? '',

  );



  readonly cargandoComentarios = computed(() => {

    const ev = this.evaluacion();

    if (!ev) return false;

    return this.store.comentariosCargandoMateria() === String(ev.materia.id);

  });



  readonly comentariosOrdenados = computed(() => {

    const ev = this.evaluacion();

    if (!ev) return [];

    return this.store.comentariosDe(

      ev.materia.id,

      this.activeTab(),

      this.ordenLista(),

    );

  });



  readonly puedePublicar = computed(() => this.borrador().trim().length > 0);



  constructor() {

    effect(() => {

      const abierto = this.open();

      const ev = this.evaluacion();

      if (abierto && ev && this.store.comentariosSupabaseConfigurado()) {

        void this.store.cargarComentariosMateria(ev.materia.id);

      }

    });

  }



  tieneNombre(c: { nombreUsuario?: string | null }): boolean {

    return Boolean(c.nombreUsuario?.trim());

  }



  setTab(tab: Tab): void {

    this.activeTab.set(tab);

  }



  setOrden(orden: OrdenComentariosModal): void {

    this.ordenLista.set(orden);

  }



  async votarUtil(commentId: string): Promise<void> {

    if (this.votandoComentarioId() !== null) return;

    this.votandoComentarioId.set(commentId);

    try {

      await this.store.votarComentario(commentId);

    } catch {

      /* mensaje en comentariosError */

    } finally {

      this.votandoComentarioId.set(null);

    }

  }



  async publicar(ev: EvaluacionMateria): Promise<void> {

    if (!this.puedePublicar() || this.publicando()) return;

    this.publicando.set(true);

    this.store.comentariosError.set(null);

    try {

      const nombre = this.nombreBorrador().trim();

      await this.store.agregarComentario(

        ev.materia.id,

        this.activeTab(),

        this.borrador(),

        nombre.length > 0 ? nombre : null,

      );

      this.borrador.set('');

      this.nombreBorrador.set('');

    } catch {

      /* mensaje en comentariosError */

    } finally {

      this.publicando.set(false);

    }

  }



  formatFecha(ts: number): string {

    try {

      return new Date(ts).toLocaleString('es-AR', {

        day: '2-digit',

        month: 'short',

        hour: '2-digit',

        minute: '2-digit',

      });

    } catch {

      return '';

    }

  }

}


