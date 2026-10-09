import { useParams } from 'react-router-dom';
import { usePageTitle } from '@/components/PageHeader';
import { EmptyState } from '@/components/ui';
import { ResourceManager } from './ResourceManager';
import { getResourceConfig } from './resourceConfigs';

export default function ResourcePage() {
  const { resource = '' } = useParams();
  const config = getResourceConfig(resource);
  usePageTitle(config?.title ?? 'Admin');
  if (!config) {
    return <EmptyState title="Unknown section" description={`There is no admin resource named "${resource}".`} />;
  }
  return <ResourceManager config={config} />;
}
