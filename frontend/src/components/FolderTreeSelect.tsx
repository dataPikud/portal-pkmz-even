import type { CategoryFolder, MainCategory } from '../types';
import styles from './FolderTreeSelect.module.css';

interface FolderTreeSelectProps {
  folders: CategoryFolder[];
  mainCategories: MainCategory[];
  selectedFolderId: number | null;
  onChange: (folderId: number | null) => void;
  allowNull?: boolean;
  nullLabel?: string;
}

interface FlattenedOption {
  id: number;
  name: string;
  depth: number;
  mainCategoryName?: string;
}

export function FolderTreeSelect({
  folders,
  mainCategories,
  selectedFolderId,
  onChange,
  allowNull = true,
  nullLabel = '— ללא תיקייה (ברמת הקטגוריה הראשית) —',
}: FolderTreeSelectProps) {

  // Flatten nested folders with depth indicators
  function flattenFolders(
    nodes: CategoryFolder[],
    depth = 0,
    mainCatName?: string
  ): FlattenedOption[] {
    let result: FlattenedOption[] = [];
    nodes.forEach(folder => {
      result.push({
        id: folder.id,
        name: folder.name,
        depth,
        mainCategoryName: mainCatName,
      });
      if (folder.children && folder.children.length > 0) {
        result = result.concat(flattenFolders(folder.children, depth + 1, mainCatName));
      }
    });
    return result;
  }

  // Group root folders by main category
  const groupedOptions = mainCategories.map(cat => {
    const catFolders = folders.filter(f => f.mainCategoryId === cat.id && !f.parentId);
    const flat = flattenFolders(catFolders, 0, cat.name);
    return {
      category: cat,
      options: flat,
    };
  });

  return (
    <select
      className={styles.select}
      value={selectedFolderId ?? ''}
      onChange={e => {
        const val = e.target.value;
        onChange(val ? Number(val) : null);
      }}
    >
      {allowNull && <option value="">{nullLabel}</option>}

      {groupedOptions.map(({ category, options }) => (
        <optgroup key={category.id} label={`📁 ${category.name}`}>
          {options.map(opt => (
            <option key={opt.id} value={opt.id}>
              {'\u00A0\u00A0'.repeat(opt.depth)}
              {opt.depth > 0 ? '↳ ' : '📂 '}
              {opt.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
