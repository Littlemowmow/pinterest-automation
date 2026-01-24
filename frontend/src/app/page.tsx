'use client';

import { useState } from 'react';
import { usePhotoStats, useSyncPhotos } from '@/hooks/usePhotos';
import { useSettings } from '@/hooks/useSettings';
import { useQueue } from '@/hooks/useQueue';
import { formatDate, formatTime } from '@/lib/utils';

export default function Dashboard() {
  const { stats, isLoading: statsLoading, mutate: mutateStats } = usePhotoStats();
  const { settings, update: updateSettings } = useSettings();
  const { nextPost, total: queueTotal } = useQueue();
  const { sync } = useSyncPhotos();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage('');
    try {
      const result = await sync();
      setSyncMessage(`Synced ${result.synced_count} new photos`);
      mutateStats();
    } catch (error: any) {
      setSyncMessage(error.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleIntervalChange = async (hours: number) => {
    await updateSettings({ posting_interval_hours: hours });
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="New" value={stats?.new || 0} color="bg-blue-500" />
        <StatCard label="Pending Review" value={(stats?.tagged || 0)} color="bg-yellow-500" />
        <StatCard label="Scheduled" value={queueTotal || 0} color="bg-purple-500" />
        <StatCard label="Posted" value={stats?.posted || 0} color="bg-green-500" />
      </div>

      {/* Sync Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Sync Photos from Drive</h2>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSync}
            disabled={syncing || !settings?.google_connected}
            className="px-4 py-2 bg-pinterest-red text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? 'Syncing...' : 'Sync Photos'}
          </button>

          {!settings?.google_connected && (
            <span className="text-sm text-red-600">
              Connect Google Drive in Settings first
            </span>
          )}

          {syncMessage && (
            <span className="text-sm text-gray-600">{syncMessage}</span>
          )}
        </div>

        {settings?.drive_folder_id && (
          <p className="mt-2 text-sm text-gray-500">
            Folder ID: {settings.drive_folder_id}
          </p>
        )}
      </div>

      {/* Posting Interval */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Posting Schedule</h2>

        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm text-gray-700">Post every:</label>
          <select
            value={settings?.posting_interval_hours || 24}
            onChange={(e) => handleIntervalChange(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-1.5"
          >
            <option value={6}>6 hours</option>
            <option value={12}>12 hours</option>
            <option value={24}>24 hours (1/day)</option>
            <option value={48}>48 hours (every 2 days)</option>
            <option value={168}>7 days (1/week)</option>
          </select>

          <span className="text-sm text-gray-500">
            at {settings ? formatTime(settings.default_post_time) : '10:00 AM'}
          </span>
        </div>

        {nextPost && (
          <p className="text-sm text-gray-600">
            Next pin scheduled for: <strong>{formatDate(nextPost)}</strong>
          </p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Status</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className={settings?.google_connected ? 'text-green-600' : 'text-red-600'}>
              {settings?.google_connected ? '●' : '○'}
            </span>
            Google Drive: {settings?.google_connected ? 'Connected' : 'Not connected'}
          </li>
          <li className="flex items-center gap-2">
            <span className={settings?.pinterest_connected ? 'text-green-600' : 'text-red-600'}>
              {settings?.pinterest_connected ? '●' : '○'}
            </span>
            Pinterest: {settings?.pinterest_connected ? 'Connected' : 'Not connected'}
          </li>
          <li className="flex items-center gap-2">
            <span className="text-gray-400">●</span>
            {queueTotal} pins in queue
          </li>
        </ul>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className={`w-2 h-2 rounded-full ${color} mb-2`} />
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}
