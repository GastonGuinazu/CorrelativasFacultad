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

/** Supabase/PostgREST suele devolver objetos planos, no `instanceof Error`. */
export function messageFromUnknown(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    const o = err as Record<string, unknown>;
    const m = o['message'];
    if (typeof m === 'string' && m.trim().length > 0) return m.trim();
    const details = o['details'];
    if (typeof details === 'string' && details.trim().length > 0) {
      return details.trim();
    }
    const hint = o['hint'];
    if (typeof hint === 'string' && hint.trim().length > 0) return hint.trim();
  }
  if (err instanceof Error && err.message) return err.message;
  return 'No se pudo registrar el voto.';
}

export interface CommentRow {
  id: string;
  materia_id: string;
  /** Columna en Supabase (`categoria`); valores: donde_cursar | opiniones | consejos */
  categoria: ComentarioTipoDb;
  contenido: string;
  nombre_usuario: string | null;
  created_at: string;
  votos_count?: number;
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
      votos_count: row.votos_count ?? 0,
    };
  }

  async incrementVotos(commentId: string): Promise<CommentRow> {
    if (!this.client) {
      throw new Error('Supabase no está configurado.');
    }

    const { error: rpcError } = await this.client.rpc('increment_comment_votes', {
      p_comment_id: commentId,
    });

    if (!rpcError) {
      return await this.fetchCommentRow(commentId);
    }

    if (CommentsService.rpcVoteUnavailable(rpcError)) {
      return await this.incrementVotosViaUpdate(commentId);
    }

    throw rpcError;
  }

  private static rpcVoteUnavailable(err: unknown): boolean {
    const code =
      typeof err === 'object' && err !== null && 'code' in err
        ? String((err as { code?: string }).code ?? '')
        : '';
    const msg =
      typeof err === 'object' && err !== null && 'message' in err
        ? String((err as { message?: string }).message ?? '')
        : '';
    return (
      code === 'PGRST202' ||
      code === '42883' ||
      /could not find|schema cache|increment_comment_votes|does not exist|function.*not.*exist|permission denied for function/i.test(
        msg,
      )
    );
  }

  private async fetchCommentRow(commentId: string): Promise<CommentRow> {
    const { data: row, error } = await this.client!
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .single();
    if (error) throw error;
    if (!row) {
      throw new Error('No se pudo actualizar el voto.');
    }
    return row as CommentRow;
  }

  /** Sin RPC atómico: lectura + escritura (requiere política UPDATE en Supabase). */
  private async incrementVotosViaUpdate(commentId: string): Promise<CommentRow> {
    const { data: cur, error: selErr } = await this.client!
      .from('comments')
      .select('votos_count')
      .eq('id', commentId)
      .single();
    if (selErr) throw selErr;
    const raw = cur as { votos_count?: number } | null;
    const next = (raw?.votos_count ?? 0) + 1;
    const { data: row, error: upErr } = await this.client!
      .from('comments')
      .update({ votos_count: next })
      .eq('id', commentId)
      .select()
      .single();
    if (upErr) throw upErr;
    if (!row) {
      throw new Error('No se pudo actualizar el voto.');
    }
    return row as CommentRow;
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
