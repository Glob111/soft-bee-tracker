import { PageHeader } from '@components/common/page-header/page-header';
import { CreateProjectDialog } from '@components/projects/create-project-dialog/create-project-dialog';
import { UserProjectsList } from '@components/projects/user-projects-list';
import content from './content.json';

export default function ProjectsPage() {
  return (
    <>
      <PageHeader eyebrow={content.eyebrow} title={content.title} description={content.description} actions={<CreateProjectDialog />} />
      <UserProjectsList />
    </>
  );
}
