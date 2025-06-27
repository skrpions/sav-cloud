import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private _supabaseClient: SupabaseClient;

  constructor() {
    this._supabaseClient = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  get supabaseClient(): SupabaseClient {
    return this._supabaseClient;
  }
} 