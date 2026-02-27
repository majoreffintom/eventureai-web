'use client';

import { useState } from 'react';
import { Monitor, Tablet, Smartphone, RefreshCw, ExternalLink, Code } from 'lucide-react';

interface PreviewPanelProps {
  previewUrl: string | null;
  consoleOutput: string[];
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

const DEVICE_SIZES: Record<DeviceMode, { width: string; height: string }> = {
  desktop: { width: '100%', height: '100%' },
  tablet: { width: '768px', height: '100%' },
  mobile: { width: '375px', height: '100%' },
};

export default function PreviewPanel({ previewUrl, consoleOutput }: PreviewPanelProps) {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [showConsole, setShowConsole] = useState(false);
  const [mode, setMode] = useState<'preview' | 'live'>('preview');

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="h-12 px-3 flex items-center justify-between border-b border-black/5 bg-white/50">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMode('preview')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mode === 'preview' ? 'bg-blue-500 text-white' : 'text-black/60 hover:bg-black/5'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setMode('live')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mode === 'live' ? 'bg-green-500 text-white' : 'text-black/60 hover:bg-black/5'
            }`}
          >
            Live
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setDeviceMode('desktop')}
            className={`p-1.5 rounded-lg transition-colors ${
              deviceMode === 'desktop' ? 'bg-black/10' : 'hover:bg-black/5'
            }`}
          >
            <Monitor size={16} />
          </button>
          <button
            onClick={() => setDeviceMode('tablet')}
            className={`p-1.5 rounded-lg transition-colors ${
              deviceMode === 'tablet' ? 'bg-black/10' : 'hover:bg-black/5'
            }`}
          >
            <Tablet size={16} />
          </button>
          <button
            onClick={() => setDeviceMode('mobile')}
            className={`p-1.5 rounded-lg transition-colors ${
              deviceMode === 'mobile' ? 'bg-black/10' : 'hover:bg-black/5'
            }`}
          >
            <Smartphone size={16} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
            <RefreshCw size={16} />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
            <ExternalLink size={16} />
          </button>
          <button
            onClick={() => setShowConsole(!showConsole)}
            className={`p-1.5 rounded-lg transition-colors ${
              showConsole ? 'bg-black/10' : 'hover:bg-black/5'
            }`}
          >
            <Code size={16} />
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center p-4 bg-[#1a1a1a] overflow-hidden">
        {previewUrl ? (
          <div
            className="bg-white rounded-lg overflow-hidden shadow-lg transition-all duration-200"
            style={DEVICE_SIZES[deviceMode]}
          >
            <iframe
              src={previewUrl}
              className="w-full h-full border-0"
              title="Preview"
            />
          </div>
        ) : (
          <div className="text-center text-white/40">
            <Monitor size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No preview available</p>
            <p className="text-xs mt-1">Build something to see it here</p>
          </div>
        )}
      </div>

      {/* Console */}
      {showConsole && (
        <div className="h-40 border-t border-black/5 bg-[#1a1a1a] overflow-y-auto">
          <div className="p-2 font-mono text-xs text-white/80">
            {consoleOutput.length === 0 ? (
              <div className="text-white/40">Console output will appear here...</div>
            ) : (
              consoleOutput.map((line, i) => (
                <div key={i} className="py-0.5">{line}</div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
