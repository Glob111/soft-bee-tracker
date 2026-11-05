import * as React from 'react';

import { useProjectsStore } from '@/lib/api/projects';

export function useProjectsOptions(isEnabled: boolean) {
  const projects = useProjectsStore((state) => state.projects);
  const isLoading = useProjectsStore((state) => state.isLoading);
  const error = useProjectsStore((state) => state.error);
  const getProjects = useProjectsStore((state) => state.getProjects);

  React.useEffect(() => {
    if (!isEnabled) {
      return;
    }

    void getProjects().catch(() => undefined);
  }, [getProjects, isEnabled]);

  return { projects, isLoading, error };
}
