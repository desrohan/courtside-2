import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Heading2, Minus,
} from 'lucide-react';

interface Props {
  content: string;
  onChange: (html: string) => void;
}

function ToolbarBtn({
  onClick, isActive, title, children,
}: {
  onClick: () => void;
  isActive: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      className={`p-1.5 rounded-lg transition-colors ${
        isActive
          ? 'bg-court-100 text-court-600'
          : 'text-dark-400 hover:bg-dark-100 hover:text-dark-700'
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-4 bg-dark-150 mx-0.5 shrink-0" />;
}

export default function RichTextEditor({ content, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: [
          'focus:outline-none min-h-[140px] px-3 py-3 text-sm text-dark-700 leading-relaxed',
          // heading
          '[&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-dark-900 [&_h2]:mt-2 [&_h2]:mb-0.5',
          // inline marks
          '[&_strong]:font-semibold [&_strong]:text-dark-900',
          '[&_em]:italic',
          '[&_u]:underline',
          '[&_s]:line-through [&_s]:text-dark-400',
          // lists
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-0.5 [&_ul]:my-1',
          '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-0.5 [&_ol]:my-1',
          '[&_li]:text-dark-700',
          // paragraphs
          '[&_p]:mb-1.5 [&_p:last-child]:mb-0',
          // hr
          '[&_hr]:border-dark-100 [&_hr]:my-2',
        ].join(' '),
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="rounded-xl border border-dark-100 overflow-hidden focus-within:border-court-400 focus-within:ring-1 focus-within:ring-court-400/30 transition-colors bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-dark-100 bg-dark-50/50 flex-wrap">
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough size={14} />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading"
        >
          <Heading2 size={14} />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet list"
        >
          <List size={14} />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered list"
        >
          <ListOrdered size={14} />
        </ToolbarBtn>

        <Divider />

        <ToolbarBtn
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          isActive={false}
          title="Divider"
        >
          <Minus size={14} />
        </ToolbarBtn>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />
    </div>
  );
}
