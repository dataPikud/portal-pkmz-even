import React, { useState } from 'react';
import { Tag as TagIcon, X } from 'lucide-react';
import styles from './TagInput.module.css';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ tags, onChange, placeholder = 'הוסף תגית ולחץ Enter...' }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Remove last tag on backspace if input is empty
      onChange(tags.slice(0, -1));
    }
  }

  function addTag() {
    const trimmed = inputValue.trim().replace(/^#/, '').toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInputValue('');
    }
  }

  function removeTag(tagToRemove: string) {
    onChange(tags.filter(t => t !== tagToRemove));
  }

  return (
    <div className={styles.container}>
      <div className={styles.tagList}>
        {tags.map(tag => (
          <span key={tag} className={styles.chip}>
            <TagIcon size={12} className={styles.tagIcon} />
            #{tag}
            <button
              type="button"
              className={styles.removeBtn}
              onClick={() => removeTag(tag)}
              title="הסר תגית"
            >
              <X size={12} />
            </button>
          </span>
        ))}

        <input
          type="text"
          className={styles.input}
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? placeholder : 'הוסף...'}
        />
      </div>
    </div>
  );
}
