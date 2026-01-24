'use client';

import { useState } from 'react';
import { useSettings, useBoardMappings } from '@/hooks/useSettings';
import { formatTime } from '@/lib/utils';

export default function SettingsPage() {
  const { settings, update: updateSettings, isLoading } = useSettings();
  const { mappings, updateMapping } = useBoardMappings();

  const [folderId, setFolderId] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveFolderId = async () => {
    setSaving(true);
    await updateSettings({ drive_folder_id: folderId });
    setSaving(false);
  };

  const handleIntervalChange = async (hours: number) => {
    await updateSettings({ posting_interval_hours: hours });
  };

  const handleTimeChange = async (time: string) => {
    await updateSettings({ default_post_time: time + ':00' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* Google Drive */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Google Drive</h2>

        <div className="flex items-center gap-2 mb-4">
          <span
            className={`w-2 h-2 rounded-full ${
              settings?.google_connected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm">
            {settings?.google_connected ? 'Connected' : 'Not connected'}
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Folder ID</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={folderId || settings?.drive_folder_id || ''}
                onChange={(e) => setFolderId(e.target.value)}
                placeholder="Enter Google Drive folder ID"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={handleSaveFolderId}
                disabled={saving}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Find this in the URL when viewing your Drive folder
            </p>
          </div>

          <button
            onClick={() => window.open('/api/auth/google/authorize', '_blank')}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            {settings?.google_connected ? 'Reconnect' : 'Connect'} Google Drive
          </button>
        </div>
      </section>

      {/* Pinterest */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Pinterest Account</h2>

        <div className="flex items-center gap-2 mb-4">
          <span
            className={`w-2 h-2 rounded-full ${
              settings?.pinterest_connected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm">
            {settings?.pinterest_connected ? 'Connected as @byyhafsa' : 'Not connected'}
          </span>
        </div>

        <button
          onClick={() => window.open('/api/auth/pinterest/authorize', '_blank')}
          className="px-4 py-2 bg-pinterest-red text-white rounded-lg text-sm font-medium hover:bg-red-700"
        >
          {settings?.pinterest_connected ? 'Reconnect' : 'Connect'} Pinterest
        </button>
      </section>

      {/* Posting Frequency */}
      <section className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Posting Frequency</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Post every</label>
            <select
              value={settings?.posting_interval_hours || 24}
              onChange={(e) => handleIntervalChange(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value={6}>6 hours</option>
              <option value={12}>12 hours</option>
              <option value={24}>24 hours (1/day)</option>
              <option value={48}>48 hours</option>
              <option value={168}>7 days (1/week)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Default time</label>
            <input
              type="time"
              value={settings?.default_post_time?.slice(0, 5) || '10:00'}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      {/* Board Mappings */}
      <section className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Board Mappings</h2>
        <p className="text-sm text-gray-500 mb-4">
          Configure which Pinterest board each category maps to, and optional links
        </p>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 font-medium text-gray-700">Category</th>
              <th className="text-left py-2 font-medium text-gray-700">Board</th>
              <th className="text-left py-2 font-medium text-gray-700">Link URL</th>
            </tr>
          </thead>
          <tbody>
            {mappings?.map((mapping) => (
              <BoardMappingRow key={mapping.id} mapping={mapping} onUpdate={updateMapping} />
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function BoardMappingRow({
  mapping,
  onUpdate,
}: {
  mapping: { id: string; category: string; board_name: string; link_url?: string };
  onUpdate: (category: string, data: { link_url?: string }) => void;
}) {
  const [linkUrl, setLinkUrl] = useState(mapping.link_url || '');
  const [editing, setEditing] = useState(false);

  const handleSave = async () => {
    await onUpdate(mapping.category, { link_url: linkUrl || undefined });
    setEditing(false);
  };

  return (
    <tr className="border-b border-gray-100">
      <td className="py-2 text-gray-900">{mapping.category}</td>
      <td className="py-2 text-gray-600">{mapping.board_name}</td>
      <td className="py-2">
        {editing ? (
          <div className="flex gap-1">
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs"
              placeholder="https://..."
            />
            <button
              onClick={handleSave}
              className="px-2 py-1 bg-gray-900 text-white rounded text-xs"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-2 py-1 bg-gray-200 rounded text-xs"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-gray-500">{mapping.link_url || '—'}</span>
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-blue-600 hover:underline"
            >
              Edit
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
