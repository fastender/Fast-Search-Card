import { useState, useMemo, useCallback, useRef } from 'preact/hooks';
import Fuse from 'fuse.js';

export const useFuzzySearch = (items = [], options = {}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef(null);
  
  const fuse = useMemo(() => {
    return new Fuse(items, {
      keys: [
        { name: 'name', weight: 0.4 },
        { name: 'area', weight: 0.3 },
        { name: 'id', weight: 0.2 },  // Angepasst für deine 'id' statt 'entity_id'
        { name: 'domain', weight: 0.1 }
      ],
      threshold: 0.3,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 1,  // Schon ab 1 Zeichen
      ...options
    });
  }, [items]);
  
  const search = useCallback((term) => {
    clearTimeout(searchTimeout.current);
    setSearchTerm(term);
    
    if (!term) {
      setIsSearching(false);
      return items;
    }
    
    setIsSearching(true);
    searchTimeout.current = setTimeout(() => {
      setIsSearching(false);
    }, 150);
    
    const results = fuse.search(term);
    return results.map(r => ({ 
      ...r.item, 
      score: r.score, 
      matches: r.matches 
    }));
  }, [fuse, items]);
  
  const getSuggestions = useCallback((term, limit = 5) => {
    if (!term) return [];
    
    const results = fuse.search(term).slice(0, limit);
    return results.map(r => ({
      ...r.item,
      highlight: highlightMatches(r.item.name, r.matches)
    }));
  }, [fuse]);
  
  const results = useMemo(() => search(searchTerm), [searchTerm, search]);
  
  return {
    searchTerm,
    setSearchTerm,
    results,
    isSearching,
    getSuggestions,
    search
  };
};

const highlightMatches = (text, matches) => {
  if (!matches) return text;
  
  const nameMatch = matches.find(m => m.key === 'name');
  if (!nameMatch) return text;
  
  let result = '';
  let lastIndex = 0;
  
  nameMatch.indices.forEach(([start, end]) => {
    result += text.slice(lastIndex, start);
    result += `<mark>${text.slice(start, end + 1)}</mark>`;
    lastIndex = end + 1;
  });
  
  result += text.slice(lastIndex);
  return result;
};