'use client';

import { ExternalLink, LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConnectionStatusProps {
  service: string;
  icon: React.ReactNode;
  isConnected: boolean;
  username?: string;
  onConnect: () => void;
  onDisconnect?: () => void;
}

export function ConnectionStatus({
  service,
  icon,
  isConnected,
  username,
  onConnect,
  onDisconnect,
}: ConnectionStatusProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-colors">
      <div className="flex items-center gap-4">
        {/* Brand Icon */}
        <div className="w-12 h-12 rounded-xl bg-card shadow-soft flex items-center justify-center">
          {icon}
        </div>

        <div>
          <h3 className="font-medium text-foreground">{service}</h3>
          <div className="flex items-center gap-2 mt-1">
            {isConnected ? (
              <>
                <span className="status-badge status-badge-success text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  Connected
                </span>
                {username && (
                  <span className="text-xs text-muted-foreground">{username}</span>
                )}
              </>
            ) : (
              <span className="status-badge status-badge-error text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                Not connected
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isConnected ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={onConnect}
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="w-4 h-4 mr-1.5" />
              Reconnect
            </Button>
            {onDisconnect && (
              <button
                onClick={onDisconnect}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Disconnect
              </button>
            )}
          </>
        ) : (
          <Button onClick={onConnect} size="sm">
            <LinkIcon className="w-4 h-4 mr-1.5" />
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}
