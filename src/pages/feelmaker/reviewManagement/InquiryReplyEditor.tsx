import { useRef, type ChangeEvent } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import type { Editor } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';
import {
  Bold,
  Heading2,
  Image as ImageIcon,
  Link as LinkIcon,
  List as ListIcon,
  ListOrdered,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';

const ImageWithDeleteButton = ImageExtension.extend({
  addNodeView() {
    return (props: any) => {
      const { node, getPos, editor } = props as { node: any; getPos: () => number; editor: any };

      const dom = document.createElement('div');
      dom.className = 'inquiry-image-with-delete';

      const img = document.createElement('img');
      img.src = node.attrs.src;
      img.alt = node.attrs.alt || '';
      dom.appendChild(img);

      const overlay = document.createElement('div');
      overlay.className = 'inquiry-image-delete-overlay';
      dom.appendChild(overlay);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'inquiry-image-delete-btn';
      btn.setAttribute('aria-label', '이미지 삭제');
      // Trash icon (match requested "쓰레기통" icon).
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 6h18"></path>
          <path d="M8 6V4h8v2"></path>
          <path d="M19 6l-1 14H6L5 6"></path>
          <path d="M10 11v6"></path>
          <path d="M14 11v6"></path>
        </svg>
      `;

      const activeClass = 'inquiry-image-with-delete--active';
      let outsideMouseDownListener: ((e: MouseEvent) => void) | null = null;

      const setActive = (active: boolean) => {
        dom.classList.toggle(activeClass, active);

        if (active) {
          if (outsideMouseDownListener) return;
          outsideMouseDownListener = (e: MouseEvent) => {
            const target = e.target as Node | null;
            if (!target) return;
            if (dom.contains(target)) return;
            setActive(false);
          };
          document.addEventListener('mousedown', outsideMouseDownListener);
        } else {
          if (!outsideMouseDownListener) return;
          document.removeEventListener('mousedown', outsideMouseDownListener);
          outsideMouseDownListener = null;
        }
      };

      // "이미지 클릭" 시 오버레이 + 중앙 삭제버튼 표시.
      img.addEventListener('mousedown', (e) => {
        // 이미지 클릭으로 에디터 포커스가 사라지는 것을 방지.
        e.preventDefault();
        e.stopPropagation();
      });
      img.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const nextActive = !dom.classList.contains(activeClass);
        setActive(nextActive);

        // 이미지 노드가 선택 상태로 남으면(커서가 이미지에 잡히면)
        // 이후 입력/토글 동작에서 이미지가 덮어써지거나 제거될 수 있어서
        // 커서를 이미지 "바로 뒤"로 옮겨 안정화합니다.
        const pos = getPos?.();
        if (typeof pos === 'number') {
          const afterPos = pos + node.nodeSize;
          const { state } = editor.view;
          const clamped = Math.min(afterPos, state.doc.content.size);
          const selection = TextSelection.create(state.doc, clamped, clamped);
          editor.view.dispatch(state.tr.setSelection(selection));
        }

        editor.view.focus();
      });

      // Avoid losing editor focus.
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const pos = getPos?.();
        if (typeof pos !== 'number') return;
        const from = pos;
        const to = pos + node.nodeSize;
        editor.view.dispatch(editor.view.state.tr.delete(from, to));
        setActive(false);
        editor.view.focus();
      });

      dom.appendChild(btn);

      return {
        dom,
        update: (updatedNode: any) => {
          if (updatedNode.type.name !== node.type.name) return false;
          img.src = updatedNode.attrs.src;
          img.alt = updatedNode.attrs.alt || '';
          return true;
        },
        destroy: () => {
          setActive(false);
        },
      };
    };
  },
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function MenuBar({
  editor,
  onToggleUnderline,
  onInsertLink,
  onAttachImage,
}: {
  editor: Editor | null;
  onToggleUnderline: () => void;
  onInsertLink: () => void;
  onAttachImage: () => void;
}) {
  if (!editor) return null;

  const canUndo = editor.can().undo();
  const canRedo = editor.can().redo();

  return (
    <div className="inquiry-reply-editor__toolbar" role="toolbar" aria-label="답변 서식">
      <button
        type="button"
        className={`inquiry-reply-editor__tool ${editor.isActive('bold') ? 'is-active' : ''}`}
        onClick={() => editor.chain().focus().toggleBold().run()}
        aria-pressed={editor.isActive('bold')}
        aria-label="굵게"
      >
        <Bold size={18} strokeWidth={2} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={`inquiry-reply-editor__tool ${editor.isActive('underline') ? 'is-active' : ''}`}
        onMouseDown={(e) => {
          // Keep focus in the editor so marks/commands apply correctly.
          e.preventDefault();
          onToggleUnderline();
        }}
        aria-pressed={editor.isActive('underline')}
        aria-label="밑줄"
      >
        <UnderlineIcon size={18} strokeWidth={2} aria-hidden="true" />
      </button>
      <button type="button" className="inquiry-reply-editor__tool" onClick={onInsertLink} aria-label="링크">
        <LinkIcon size={18} strokeWidth={2} aria-hidden="true" />
      </button>
      <button type="button" className="inquiry-reply-editor__tool" onClick={onAttachImage} aria-label="이미지">
        <ImageIcon size={18} strokeWidth={2} aria-hidden="true" />
      </button>
      <span className="inquiry-reply-editor__toolbar-sep" aria-hidden />
      <button
        type="button"
        className={`inquiry-reply-editor__tool ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        aria-pressed={editor.isActive('heading', { level: 2 })}
        aria-label="소제목"
      >
        <Heading2 size={18} strokeWidth={2} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={`inquiry-reply-editor__tool ${editor.isActive('bulletList') ? 'is-active' : ''}`}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        aria-pressed={editor.isActive('bulletList')}
        aria-label="목록"
      >
        <ListIcon size={18} strokeWidth={2} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={`inquiry-reply-editor__tool ${editor.isActive('orderedList') ? 'is-active' : ''}`}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        aria-pressed={editor.isActive('orderedList')}
        aria-label="번호"
      >
        <ListOrdered size={18} strokeWidth={2} aria-hidden="true" />
      </button>
      <span className="inquiry-reply-editor__toolbar-sep" aria-hidden />
      <button
        type="button"
        className="inquiry-reply-editor__tool"
        disabled={!canUndo}
        onMouseDown={(e) => {
          e.preventDefault();
          if (!editor.can().undo()) return;
          editor.chain().focus().undo().run();
        }}
        aria-label="실행취소"
      >
        <Undo2 size={18} strokeWidth={2} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="inquiry-reply-editor__tool"
        disabled={!canRedo}
        onMouseDown={(e) => {
          e.preventDefault();
          if (!editor.can().redo()) return;
          editor.chain().focus().redo().run();
        }}
        aria-label="다시실행"
      >
        <Redo2 size={18} strokeWidth={2} aria-hidden="true" />
      </button>
    </div>
  );
}

function plainTextToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  if (!escaped.trim()) return '<p></p>';
  const parts = escaped.split(/\n/);
  return parts.map((line) => `<p>${line || '<br>'}</p>`).join('');
}

function initialBodyToEditorHtml(body: string): string {
  const trimmed = body.trim();
  // 저장된 Tiptap HTML이 항상 "<p>..." 같은 형태로 시작한다는 보장이 없어서,
  // 이미지(data:image)나 <img>, <a 가 포함된 경우엔 HTML로 보고 그대로 사용합니다.
  const looksLikeRichHtml =
    trimmed.startsWith('<') || trimmed.includes('<img') || trimmed.includes('data:image') || trimmed.includes('<a ');
  if (looksLikeRichHtml) return body;
  return plainTextToHtml(body);
}

type InquiryReplyEditorProps = {
  initialBody: string;
  variant: 'new' | 'edit';
  onCancel: () => void;
  onSave: (html: string) => void;
  onEmpty?: () => void;
};

export function InquiryReplyEditor({
  initialBody,
  variant,
  onCancel,
  onSave,
  onEmpty,
}: InquiryReplyEditorProps) {
  const initialHtml = initialBodyToEditorHtml(initialBody);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, Underline, LinkExtension.configure({ openOnClick: false }), ImageWithDeleteButton],
    content: initialHtml,
    editorProps: {
      attributes: {
        class: 'inquiry-reply-editor__prose',
        'aria-label': '답변 내용',
      },
    },
  });

  const handleSave = () => {
    if (!editor) return;
    const html = editor.getHTML();
    const textOnly = editor.getText({ blockSeparator: '\n' }).trim();
    // 텍스트가 비어있더라도 이미지가 있으면 저장 허용
    const hasImage = (() => {
      let found = false;
      editor.state.doc.descendants((node: any) => {
        if (node.type?.name === 'image') found = true;
      });
      return found;
    })();

    if (!textOnly && !hasImage) {
      onEmpty?.();
      return;
    }
    onSave(html);
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const handleToggleUnderline = () => {
    editor?.chain().focus().toggleUnderline().run();
  };

  const handleInsertLink = () => {
    if (!editor) return;
    const href = window.prompt('링크 URL을 입력하세요.');
    if (!href) return;

    const selected =
      editor.state.selection.empty
        ? ''
        : editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ');
    const label = selected || window.prompt('표시할 텍스트를 입력하세요.') || href;

    const safeHref = escapeHtml(href);
    const safeLabel = escapeHtml(label);
    editor.chain().focus().insertContent(`<a href="${safeHref}" target="_blank" rel="noopener noreferrer">${safeLabel}</a>`).run();
  };

  const handleAttachImage = () => {
    imageInputRef.current?.click();
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!editor) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const insertPos = editor.state.selection.to;
      // selection이 기존 이미지 노드를 포함한 경우 insertContent는 교체될 수 있음.
      // insertContentAt로 selection 끝 지점에 "삽입"되게 해서 기존 이미지가 유지되도록 처리.
      editor
        .chain()
        .focus()
        .insertContentAt(insertPos, { type: 'image', attrs: { src: dataUrl, alt: file.name || '첨부 이미지' } })
        .run();
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="inquiry-reply-editor" data-variant={variant}>
      <div className="inquiry-reply-editor__meta">
        <span className="inquiry-reply-editor__mode-label">
          {variant === 'edit' ? '이 답변을 수정합니다.' : '새 답변을 등록합니다.'}
        </span>
      </div>
      <MenuBar
        editor={editor}
        onToggleUnderline={handleToggleUnderline}
        onInsertLink={handleInsertLink}
        onAttachImage={handleAttachImage}
      />
      <div className="inquiry-reply-editor__surface">
        <EditorContent editor={editor} />
      </div>
      <div className="inquiry-reply-editor__actions">
        <button type="button" className="filter-btn filter-btn--outline" onClick={onCancel}>
          취소
        </button>
        <button type="button" className="filter-btn filter-btn--primary" onClick={handleSave}>
          저장
        </button>
      </div>

      <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
    </div>
  );
}
