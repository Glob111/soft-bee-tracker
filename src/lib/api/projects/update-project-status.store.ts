'use client';

import { create } from 'zustand';

import { registerStoreReset } from '@/lib/api/reset-client-state';
import { toApiError } from '@/lib/api/to-api-error';
import type { ApiError } from '@/types/api-error';

import { updateProjectStatus as updateProjectStatusRequest } from './mutations';
import { useProjectsStore } from './store';
import type { Project, UpdateProjectStatusInput } from './types';

export interface UpdateProjectStatusRepository {
  updateProjectStatus: (input: UpdateProjectStatusInput) => Promise<Project>;
}

export interface UpdateProjectStatusStore {
  updatingProjectId: string | null;
  updateError: ApiError | null;
  updateProjectStatus: (input: UpdateProjectStatusInput) => Promise<Project>;
  reset: () => void;
}

const initialState = {
  updatingProjectId: null,
  updateError: null
} satisfies Pick<UpdateProjectStatusStore, 'updatingProjectId' | 'updateError'>;

export function createUpdateProjectStatusStore(repository: UpdateProjectStatusRepository, onUpdated: (project: Project) => void) {
  return create<UpdateProjectStatusStore>()((set) => {
    let generation = 0;
    let latestActionId = 0;

    return {
      ...initialState,
      updateProjectStatus: async (input) => {
        const requestGeneration = generation;
        const actionId = ++latestActionId;
        set({ updatingProjectId: input.projectId, updateError: null });

        try {
          const project = await repository.updateProjectStatus(input);

          if (requestGeneration === generation) {
            onUpdated(project);

            if (actionId === latestActionId) {
              set({ updatingProjectId: null, updateError: null });
            }
          }

          return project;
        } catch (error) {
          const apiError = toApiError(error);

          if (requestGeneration === generation && actionId === latestActionId) {
            set({ updatingProjectId: null, updateError: apiError });
          }

          throw apiError;
        }
      },
      reset: () => {
        generation += 1;
        latestActionId += 1;
        set(initialState);
      }
    };
  });
}

export const useUpdateProjectStatusStore = createUpdateProjectStatusStore({ updateProjectStatus: updateProjectStatusRequest }, (project) =>
  useProjectsStore.getState().replaceUserProject(project)
);

registerStoreReset(() => useUpdateProjectStatusStore.getState().reset());
