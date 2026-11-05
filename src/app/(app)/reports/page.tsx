import { PageHeader } from '@components/common/page-header/page-header';
import { ReportsView } from '@components/reports/reports-view/reports-view';
import content from './content.json';

export default function ReportsPage() {
  return (
    <>
      <PageHeader eyebrow={content.eyebrow} title={content.title} description={content.description} />
      <ReportsView />
    </>
  );
}
