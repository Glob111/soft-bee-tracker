import { describe, expect, it, vi } from 'vitest';

import type { Project } from './types';
import { createUpdateProjectStatusStore, type UpdateProjectStatusRepository } from './update-project-status.store';

const archivedProject: Project = {
  id: 'project-1',
  createdAt: '2026-08-20T11:00:00.000Z',
  updatedAt: '2026-11-05T11:00:00.000Z',
  name: 'Project',
  client: 'Acme',
  note: null,
  pictureUrl: null,
  startDate: null,
  endDate: null,
  status: 'archived',
  type: 'fixed_price',
  managerId: 'user-1'
};

function createRepository(overrides: Partial<UpdateProjectStatusRepository> = {}): UpdateProjectStatusRepository {
  return {
    updateProjectStatus: vi.fn().mockResolvedValue(archivedProject),
    ...overrides
  };
}

describe('update project status store', () => {
  it('updates the status and publishes the project to the collection owner', async () => {
    const onUpdated = vi.fn();
    const repository = createRepository();
    const store = createUpdateProjectStatusStore(repository, onUpdated);

    const result = await store.getState().updateProjectStatus({ projectId: 'project-1', status: 'archived' });

    expect(repository.updateProjectStatus).toHaveBeenCalledWith({ projectId: 'project-1', status: 'archived' });
    expect(onUpdated).toHaveBeenCalledWith(archivedProject);
    expect(result).toEqual(archivedProject);
    expect(store.getState()).toMatchObject({ updatingProjectId: null, updateError: null });
  });

  it('marks the project as updating while the request is in flight', () => {
    const store = createUpdateProjectStatusStore(
      createRepository({ updateProjectStatus: vi.fn(() => new Promise<Project>(() => undefined)) }),
      vi.fn()
    );

    void store.getState().updateProjectStatus({ projectId: 'project-1', status: 'archived' });

    expect(store.getState().updatingProjectId).toBe('project-1');
  });

  it('keeps the error and does not publish on failure', async () => {
    const onUpdated = vi.fn();
    const store = createUpdateProjectStatusStore(
      createRepository({ updateProjectStatus: vi.fn().mockRejectedValue(new Error('Update failed')) }),
      onUpdated
    );

    await expect(store.getState().updateProjectStatus({ projectId: 'project-1', status: 'archived' })).rejects.toEqual({
      message: 'Update failed',
      statusCode: 500
    });
    expect(onUpdated).not.toHaveBeenCalled();
    expect(store.getState()).toMatchObject({
      updatingProjectId: null,
      updateError: { message: 'Update failed', statusCode: 500 }
    });
  });
});
