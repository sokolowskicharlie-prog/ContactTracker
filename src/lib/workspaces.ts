import { supabase } from './supabase';

export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  color: string;
  is_default: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export async function getWorkspaces(userId: string): Promise<Workspace[]> {
  const { data: ownedWorkspaces, error: ownedError } = await supabase
    .from('workspaces')
    .select('*')
    .eq('user_id', userId)
    .order('display_order');

  if (ownedError) throw ownedError;

  return ownedWorkspaces || [];
}

export async function getOrCreateDefaultWorkspace(userId: string): Promise<Workspace> {
  const { data: existing } = await supabase
    .from('workspaces')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from('workspaces')
    .insert({
      user_id: userId,
      name: 'Work',
      color: '#3B82F6',
      is_default: true,
      display_order: 0
    })
    .select()
    .single();

  if (error) throw error;
  return created;
}

export async function createWorkspace(
  userId: string,
  name: string,
  color: string = '#3B82F6'
): Promise<Workspace> {
  const workspaces = await getWorkspaces(userId);
  const maxOrder = Math.max(...workspaces.map(w => w.display_order), -1);

  const { data, error } = await supabase
    .from('workspaces')
    .insert({
      user_id: userId,
      name,
      color,
      is_default: false,
      display_order: maxOrder + 1
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWorkspace(
  workspaceId: string,
  updates: Partial<Pick<Workspace, 'name' | 'color'>>
): Promise<void> {
  const { error } = await supabase
    .from('workspaces')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', workspaceId);

  if (error) throw error;
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', workspaceId);

  if (error) throw error;
}
