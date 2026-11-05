import { mapProjectRowToProject, mapProjectToProjectRow, PROJECT_COLUMNS } from '@/lib/api/projects/mappers';
import type { CreateProjectInput, Project, UpdateProjectStatusInput } from '@/lib/api/projects/types';
import { createBrowserClient } from '@/lib/supabase/client';
import type { ApiError } from '@/types/api-error';
import content from './content.json';

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const supabase = createBrowserClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw {
      message: userError.message,
      statusCode: userError.status ?? 401
    } satisfies ApiError;
  }

  if (!userData.user) {
    throw {
      message: content.signInRequired,
      statusCode: 401
    } satisfies ApiError;
  }

  const { data, error, status } = await supabase
    .from('projects')
    .insert(mapProjectToProjectRow(input, userData.user.id))
    .select(PROJECT_COLUMNS)
    .single();

  if (error) {
    throw {
      message: error.message,
      statusCode: status
    } satisfies ApiError;
  }

  return mapProjectRowToProject(data);
}

export async function updateProjectStatus({ projectId, status }: UpdateProjectStatusInput): Promise<Project> {
  const supabase = createBrowserClient();
  const {
    data,
    error,
    status: responseStatus
  } = await supabase.from('projects').update({ status }).eq('id', projectId).select(PROJECT_COLUMNS).single();

  if (error) {
    throw {
      message: error.message,
      statusCode: responseStatus
    } satisfies ApiError;
  }

  return mapProjectRowToProject(data);
}
