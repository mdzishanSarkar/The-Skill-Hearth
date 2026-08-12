import { FiBookmark } from 'react-icons/fi';
import PageHeader from '../../components/ui/PageHeader';
import SavedSearchManager from '../../components/discovery/SavedSearchManager';

export default function SavedSearchesPage() {
  return (
    <div className="page-shell animate-fade-in py-8">
      <PageHeader
        icon={<FiBookmark />}
        title="Saved Searches"
        subtitle="Keep an eye on your favorite skill searches and get notified when new matches appear."
      />
      <div className="mt-6">
        <SavedSearchManager />
      </div>
    </div>
  );
}
