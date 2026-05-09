import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import {
  CategoriaComentario,
  categoriaToTipoDb,
  ComentarioTipoDb,
  ComentarioUsuario,
  tipoDbToCategoria,
} from '../storage/progress-storage';
import { MateriaId } from '../models/materia.model';

export interface CommentRow {
  id: string;
  materia_id: string;
  /** Columna en Supabase (`categoria`); valores: donde_cursar | opiniones | consejos */
  categoria: ComentarioTipoDb;
  contenido: string;
  nombre_usuario: string | null;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class CommentsService {
  private readonly client: SupabaseClient | null;

  constructor() {
    const url = environment.supabaseUrl?.trim();
    const key = environment.supabaseAnonKey?.trim();
    this.client =
      url && key
        ? createClient(url, key, { auth: { persistSession: false } })
        : null;
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async fetchByMateria(materiaId: MateriaId): Promise<CommentRow[]> {
    if (!this.client) {
      throw new Error('Supabase no está configurado.');
    }
    const { data, error } = await this.client
      .from('comments')
      .select('*')
      .eq('materia_id', String(materiaId))
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as CommentRow[];
  }

  async insert(params: {
    materiaId: MateriaId;
    categoria: CategoriaComentario;
    contenido: string;
    nombreUsuario: string | null;
  }): Promise<CommentRow> {
    if (!this.client) {
      throw new Error('Supabase no está configurado.');
    }
    const { data, error } = await this.client
      .from('comments')
      .insert({
        materia_id: String(params.materiaId),
        categoria: categoriaToTipoDb(params.categoria),
        contenido: params.contenido,
        nombre_usuario: params.nombreUsuario,
      })
      .select()
      .single();
    if (error) throw error;
    return data as CommentRow;
  }

  static rowToUsuario(row: CommentRow): ComentarioUsuario {
    return {
      id: row.id,
      texto: row.contenido,
      fecha: new Date(row.created_at).getTime(),
      nombreUsuario: row.nombre_usuario ?? undefined,
    };
  }

  static groupByCategoria(rows: CommentRow[]): Record<
    CategoriaComentario,
    ComentarioUsuario[]
  > {
    const buckets: Record<CategoriaComentario, ComentarioUsuario[]> = {
      'donde-cursar': [],
      'opiniones-profes': [],
      'consejos-parciales': [],
    };
    for (const row of rows) {
      const cat = tipoDbToCategoria(row.categoria);
      buckets[cat].push(CommentsService.rowToUsuario(row));
    }
    for (const cat of Object.keys(buckets) as CategoriaComentario[]) {
      buckets[cat].sort((a, b) => b.fecha - a.fecha);
    }
    return buckets;
  }
}
