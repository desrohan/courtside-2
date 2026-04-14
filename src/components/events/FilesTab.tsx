import { FileText, Film, FileSpreadsheet, Download, Trash2, Plus, Upload } from 'lucide-react';
import { FileRecord } from '@/data/events';
import { format, parseISO } from 'date-fns';

interface Props {
  files: FileRecord[];
}

const typeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText size={18} className="text-red-500" />,
  video: <Film size={18} className="text-purple-500" />,
  xlsx: <FileSpreadsheet size={18} className="text-green-600" />,
};

const typeBg: Record<string, string> = {
  pdf: 'bg-red-50',
  video: 'bg-purple-50',
  xlsx: 'bg-green-50',
};

export default function FilesTab({ files }: Props) {
  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 rounded-2xl bg-dark-50 flex items-center justify-center mx-auto mb-3">
          <FileText size={24} className="text-dark-300" />
        </div>
        <p className="text-sm text-dark-400">No files attached</p>
        <button className="mt-3 text-xs font-semibold text-court-500 hover:underline flex items-center gap-1 mx-auto">
          <Upload size={14} /> Upload File
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-dark-500">{files.length} files</p>
        <button className="text-xs font-semibold text-court-500 hover:underline flex items-center gap-1">
          <Upload size={14} /> Upload
        </button>
      </div>

      <div className="space-y-2">
        {files.map(file => (
          <div
            key={file.id}
            className="flex items-center gap-3 p-3.5 bg-white border border-dark-100 rounded-xl hover:border-court-200 transition-colors group"
          >
            <div className={`w-10 h-10 rounded-xl ${typeBg[file.type] || 'bg-dark-50'} flex items-center justify-center shrink-0`}>
              {typeIcons[file.type] || <FileText size={18} className="text-dark-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-dark-800 truncate">{file.name}</p>
              <p className="text-xs text-dark-400">
                {file.size} &middot; {file.uploadedBy} &middot; {file.uploadedAt}
              </p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-1.5 rounded-lg hover:bg-dark-50 text-dark-400 hover:text-dark-700">
                <Download size={15} />
              </button>
              <button className="p-1.5 rounded-lg hover:bg-red-50 text-dark-400 hover:text-red-500">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
