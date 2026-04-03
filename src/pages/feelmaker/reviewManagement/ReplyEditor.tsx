import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import type { Editor } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { TextSelection } from '@tiptap/pm/state';
import {
  Bold,
  Heading2,
  Image as ImageIcon,
  Link as LinkIcon,
  List as ListIcon,
  ListOrdered,
  Redo2,
  Trash2,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';
import Modal from '../../../components/modal';
import './ReplyEditor.css';

type ImageNodeAttrs = { src?: string; alt?: string };
type ImageNodeLike = {
  attrs: ImageNodeAttrs;
  nodeSize: number;
  type: { name: string };
};
type ProseMirrorDocLike = {
  content: { size: number };
};
type TransactionLike = {
  setSelection: (selection: unknown) => unknown;
  delete: (from: number, to: number) => unknown;
};
type ImageEditorLike = {
  view: {
    state: { doc: ProseMirrorDocLike; tr: TransactionLike };
    dispatch: (tr: unknown) => void;
    focus: () => void;
  };
};

const ImageWithDeleteButton = ImageExtension.extend({
  addNodeView() {
    return (props: unknown) => {
      const { node, getPos, editor } = props as {
        node: ImageNodeLike;
        getPos?: () => number;
        editor: ImageEditorLike;
      };

      const dom = document.createElement('div');
      dom.className = 'reply-editor-image';

      const img = document.createElement('img');
      img.src = node.attrs.src ?? '';
      img.alt = node.attrs.alt || '';
      dom.appendChild(img);

      const overlay = document.createElement('div');
      overlay.className = 'reply-editor-image__overlay';
      dom.appendChild(overlay);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'reply-editor-image__delete-btn';
      btn.setAttribute('aria-label', '이미지 삭제');
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

      const activeClass = 'reply-editor-image--active';
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

      img.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      img.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const nextActive = !dom.classList.contains(activeClass);
        setActive(nextActive);

        const pos = getPos?.();
        if (typeof pos === 'number') {
          const afterPos = pos + node.nodeSize;
          const { state } = editor.view;
          const clamped = Math.min(afterPos, state.doc.content.size);
          const selection = TextSelection.create(state.doc as ProseMirrorNode, clamped, clamped);
          editor.view.dispatch(state.tr.setSelection(selection));
        }

        editor.view.focus();
      });

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
        update: (updatedNode: ImageNodeLike) => {
          if (updatedNode.type.name !== node.type.name) return false;
          img.src = updatedNode.attrs.src ?? '';
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
    <div className="reply-editor__toolbar" role="toolbar" aria-label="답변 서식">
      <button
        type="button"
        className={`reply-editor__tool ${editor.isActive('bold') ? 'is-active' : ''}`}
        onClick={() => editor.chain().focus().toggleBold().run()}
        aria-pressed={editor.isActive('bold')}
        aria-label="굵게"
      >
        <Bold size={18} strokeWidth={2} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={`reply-editor__tool ${editor.isActive('underline') ? 'is-active' : ''}`}
        onMouseDown={(e) => {
          e.preventDefault();
          onToggleUnderline();
        }}
        aria-pressed={editor.isActive('underline')}
        aria-label="밑줄"
      >
        <UnderlineIcon size={18} strokeWidth={2} aria-hidden="true" />
      </button>
      <button type="button" className="reply-editor__tool" onClick={onInsertLink} aria-label="링크">
        <LinkIcon size={18} strokeWidth={2} aria-hidden="true" />
      </button>
      <button type="button" className="reply-editor__tool" onClick={onAttachImage} aria-label="이미지">
        <ImageIcon size={18} strokeWidth={2} aria-hidden="true" />
      </button>
      <span className="reply-editor__toolbar-sep" aria-hidden />
      <button
        type="button"
        className={`reply-editor__tool ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        aria-pressed={editor.isActive('heading', { level: 2 })}
        aria-label="소제목"
      >
        <Heading2 size={18} strokeWidth={2} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={`reply-editor__tool ${editor.isActive('bulletList') ? 'is-active' : ''}`}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        aria-pressed={editor.isActive('bulletList')}
        aria-label="목록"
      >
        <ListIcon size={18} strokeWidth={2} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={`reply-editor__tool ${editor.isActive('orderedList') ? 'is-active' : ''}`}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        aria-pressed={editor.isActive('orderedList')}
        aria-label="번호"
      >
        <ListOrdered size={18} strokeWidth={2} aria-hidden="true" />
      </button>
      <span className="reply-editor__toolbar-sep" aria-hidden />
      <button
        type="button"
        className="reply-editor__tool"
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
        className="reply-editor__tool"
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
  const looksLikeRichHtml =
    trimmed.startsWith('<') || trimmed.includes('<img') || trimmed.includes('data:image') || trimmed.includes('<a ');
  if (looksLikeRichHtml) return body;
  return plainTextToHtml(body);
}

const FREQUENT_REPLIES_STORAGE_KEY = 'admin-reply-editor-frequent-replies';
const LEGACY_FREQUENT_REPLIES_STORAGE_KEY = 'admin-inquiry-frequent-replies';

const DEFAULT_FREQUENT_REPLIES = [
  '좋은리뷰 남겨주셔서 감사드립니다!',
  '고객님 소중한 후기 정말 감사합니다 ^^!',
  '소중한 리뷰 감사드립니다!',
  '앞으로도 편리한 서비스로 보답하겠습니다 :)',
  '앞으로도 좋은 서비스로 보답하겠습니다:)',
  '불편을 드려 죄송합니다. 조치 후 안내드리겠습니다.',
  '추가로 궁금하신 점이나 도움이 필요하시면 언제든지 편하게 문의 주세요.',
];

function loadFrequentReplies(): string[] {
  try {
    let raw = localStorage.getItem(FREQUENT_REPLIES_STORAGE_KEY);
    if (raw === null) {
      raw = localStorage.getItem(LEGACY_FREQUENT_REPLIES_STORAGE_KEY);
      if (raw !== null) {
        try {
          localStorage.setItem(FREQUENT_REPLIES_STORAGE_KEY, raw);
        } catch {
          /* ignore */
        }
      }
    }
    if (raw === null) return [...DEFAULT_FREQUENT_REPLIES];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [...DEFAULT_FREQUENT_REPLIES];
    return parsed.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
  } catch {
    return [...DEFAULT_FREQUENT_REPLIES];
  }
}

function saveFrequentReplies(list: string[]) {
  try {
    localStorage.setItem(FREQUENT_REPLIES_STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* ignore quota / private mode */
  }
}

export type ReplyEditorProps = {
  initialBody: string;
  variant: 'new' | 'edit';
  onCancel: () => void;
  onSave: (html: string) => void;
  onEmpty?: () => void;
};

export function ReplyEditor({ initialBody, variant, onCancel, onSave, onEmpty }: ReplyEditorProps) {
  const initialHtml = initialBodyToEditorHtml(initialBody);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const frequentActionsRef = useRef<HTMLDivElement | null>(null);
  const [frequentOpen, setFrequentOpen] = useState(false);
  const [frequentPresets, setFrequentPresets] = useState<string[]>(() => loadFrequentReplies());
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [newPresetDraft, setNewPresetDraft] = useState('');

  useEffect(() => {
    if (!frequentOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const el = frequentActionsRef.current;
      if (!el) return;
      const target = e.target as Node | null;
      if (target && !el.contains(target)) setFrequentOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFrequentOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [frequentOpen]);

  useEffect(() => {
    if (!manageModalOpen) setNewPresetDraft('');
  }, [manageModalOpen]);

  const persistFrequentPresets = (next: string[]) => {
    setFrequentPresets(next);
    saveFrequentReplies(next);
  };

  const handleDeletePreset = (index: number) => {
    persistFrequentPresets(frequentPresets.filter((_, i) => i !== index));
  };

  const handleAddPreset = () => {
    const t = newPresetDraft.trim();
    if (!t) return;
    persistFrequentPresets([...frequentPresets, t]);
    setNewPresetDraft('');
  };

  const openManageModal = () => {
    setFrequentOpen(false);
    setManageModalOpen(true);
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, Underline, LinkExtension.configure({ openOnClick: false }), ImageWithDeleteButton],
    content: initialHtml,
    editorProps: {
      attributes: {
        class: 'reply-editor__prose',
        'aria-label': '답변 내용',
      },
    },
  });

  const handleSave = () => {
    if (!editor) return;
    const html = editor.getHTML();
    const textOnly = editor.getText({ blockSeparator: '\n' }).trim();
    const hasImage = (() => {
      let found = false;
      editor.state.doc.descendants((node: unknown) => {
        const maybe = node as { type?: { name?: string } };
        if (maybe.type?.name === 'image') found = true;
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

  const handleInsertFrequentReply = (text: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(plainTextToHtml(text)).run();
    setFrequentOpen(false);
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!editor) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const insertPos = editor.state.selection.to;
      editor
        .chain()
        .focus()
        .insertContentAt(insertPos, { type: 'image', attrs: { src: dataUrl, alt: file.name || '첨부 이미지' } })
        .run();
    } finally {
      e.target.value = '';
    }
  };

  const frequentListId = 'reply-editor-frequent-list';

  return (
    <div className="reply-editor" data-variant={variant}>
      <div className="reply-editor__meta">
        <span className="reply-editor__mode-label">
          {variant === 'edit' ? '이 답변을 수정합니다.' : '새 답변을 등록합니다.'}
        </span>
        <div className="reply-editor-frequent__actions" ref={frequentActionsRef}>
          <div className="reply-editor-frequent">
            <button
              type="button"
              className="reply-editor-frequent__trigger"
              aria-expanded={frequentOpen}
              aria-haspopup="listbox"
              aria-controls={frequentListId}
              disabled={!editor}
              onClick={() => setFrequentOpen((o) => !o)}
            >
              자주 사용하는 답변
            </button>
            {frequentOpen && editor && (
              <div id={frequentListId} className="reply-editor-frequent__panel" role="listbox" aria-label="자주 사용하는 답변">
                {frequentPresets.length === 0 ? (
                  <div className="reply-editor-frequent__empty">
                    등록된 문구가 없습니다. 자주 사용하는 답변 관리에서 등록해 주세요.
                  </div>
                ) : (
                  frequentPresets.map((text, idx) => (
                    <button
                      key={`${idx}-${text.slice(0, 48)}`}
                      type="button"
                      role="option"
                      className="reply-editor-frequent__item"
                      onClick={() => handleInsertFrequentReply(text)}
                    >
                      {text}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <button type="button" className="reply-editor-frequent__manage" onClick={openManageModal}>
            자주 사용하는 답변 관리
          </button>
        </div>
      </div>
      <MenuBar
        editor={editor}
        onToggleUnderline={handleToggleUnderline}
        onInsertLink={handleInsertLink}
        onAttachImage={handleAttachImage}
      />
      <div className="reply-editor__surface">
        <EditorContent editor={editor} />
      </div>
      <div className="reply-editor__actions">
        <button type="button" className="filter-btn filter-btn--outline" onClick={onCancel}>
          취소
        </button>
        <button type="button" className="filter-btn filter-btn--primary" onClick={handleSave}>
          저장
        </button>
      </div>

      <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />

      <Modal open={manageModalOpen} onClose={() => setManageModalOpen(false)} variant="option" ariaLabel="자주 사용하는 답변 관리">
        <Modal.Header>
          <Modal.Title>자주 사용하는 답변 관리</Modal.Title>
          <Modal.Close />
        </Modal.Header>
        <Modal.Body>
          <div className="reply-editor-frequent-manage">
            <p className="reply-editor-frequent-manage__hint">
              목록에 추가한 문구는 이 브라우저에 저장되며, 자주 사용하는 답변 메뉴에서 바로 넣을 수 있습니다.
            </p>
            <ul className="reply-editor-frequent-manage__list" aria-label="저장된 답변 목록">
              {frequentPresets.map((text, idx) => (
                <li key={`${idx}-${text.slice(0, 48)}`} className="reply-editor-frequent-manage__row">
                  <span className="reply-editor-frequent-manage__text">{text}</span>
                  <button
                    type="button"
                    className="reply-editor-frequent-manage__delete"
                    onClick={() => handleDeletePreset(idx)}
                    aria-label={`삭제: ${text.slice(0, 80)}`}
                  >
                    <Trash2 size={16} strokeWidth={2} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            {frequentPresets.length === 0 && <p className="reply-editor-frequent-manage__empty">아직 등록된 문구가 없습니다.</p>}
            <div className="reply-editor-frequent-manage__add">
              <input
                type="text"
                className="reply-editor-frequent-manage__input"
                placeholder="추가할 답변 문구를 입력하세요"
                value={newPresetDraft}
                onChange={(e) => setNewPresetDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPreset();
                  }
                }}
              />
              <button type="button" className="reply-editor-frequent-manage__add-btn" onClick={handleAddPreset}>
                추가
              </button>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="filter-btn filter-btn--primary" onClick={() => setManageModalOpen(false)}>
            닫기
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
