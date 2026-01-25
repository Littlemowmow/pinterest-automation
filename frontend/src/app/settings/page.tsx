'use client';

import { useState } from 'react';
import { HardDrive, Clock, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SectionCard } from '@/components/ui/SectionCard';
import { ConnectionStatus } from '@/components/settings/ConnectionStatus';
import { BoardMappingsTable } from '@/components/settings/BoardMappingsTable';
import { useSettings, useBoardMappings } from '@/hooks/useSettings';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const INTERVALS = [
  { value: '6', label: 'Every 6 hours' },
  { value: '12', label: 'Every 12 hours' },
  { value: '24', label: 'Every 24 hours (1/day)' },
  { value: '48', label: 'Every 2 days' },
  { value: '168', label: 'Every 7 days (1/week)' },
];

// Pinterest Pin icon component
function PinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
    </svg>
  );
}

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

  const handleIntervalChange = async (hours: string) => {
    await updateSettings({ posting_interval_hours: parseInt(hours) });
  };

  const handleTimeChange = async (time: string) => {
    await updateSettings({ default_post_time: time + ':00' });
  };

  const handleConnectGoogle = () => {
    window.location.href = `${API_URL}/auth/google/authorize`;
  };

  const handleConnectPinterest = () => {
    window.location.href = `${API_URL}/auth/pinterest/authorize`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div className="h-16 skeleton rounded-xl" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-40 skeleton rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-display text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your connections and posting preferences
        </p>
      </div>

      {/* Connections */}
      <SectionCard title="Connections" description="Connect your accounts to enable automation">
        <div className="space-y-4">
          <ConnectionStatus
            service="Google Drive"
            icon={<HardDrive className="w-6 h-6 text-blue-500" />}
            isConnected={settings?.google_connected || false}
            onConnect={handleConnectGoogle}
          />

          <ConnectionStatus
            service="Pinterest"
            icon={<PinIcon className="w-6 h-6 text-primary" />}
            isConnected={settings?.pinterest_connected || false}
            username={settings?.pinterest_connected ? '@byyhafsa' : undefined}
            onConnect={handleConnectPinterest}
          />
        </div>
      </SectionCard>

      {/* Google Drive Folder */}
      <SectionCard title="Google Drive Folder" description="Set the folder to sync photos from">
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                value={folderId || settings?.drive_folder_id || ''}
                onChange={(e) => setFolderId(e.target.value)}
                placeholder="Enter Google Drive folder ID"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Find this in the URL when viewing your Drive folder
              </p>
            </div>
            <Button
              onClick={handleSaveFolderId}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>

          {settings?.drive_folder_id && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
              <FolderOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Current: {settings.drive_folder_id}
              </span>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Posting Schedule */}
      <SectionCard title="Posting Schedule" description="Configure when and how often pins are posted">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Posting Interval</Label>
            <Select
              value={settings?.posting_interval_hours?.toString() || '24'}
              onValueChange={handleIntervalChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVALS.map((interval) => (
                  <SelectItem key={interval.value} value={interval.value}>
                    {interval.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Default Post Time</Label>
            <Input
              type="time"
              value={settings?.default_post_time?.slice(0, 5) || '10:00'}
              onChange={(e) => handleTimeChange(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-secondary/50">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Pins will be posted {INTERVALS.find(i => i.value === settings?.posting_interval_hours?.toString())?.label.toLowerCase() || 'every 24 hours'} starting at {settings?.default_post_time?.slice(0, 5) || '10:00'}
          </span>
        </div>
      </SectionCard>

      {/* Board Mappings */}
      <BoardMappingsTable
        mappings={mappings || []}
        onUpdate={updateMapping}
      />
    </div>
  );
}
