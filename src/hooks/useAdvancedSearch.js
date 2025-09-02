// src/hooks/useAdvancedSearch.js
import { useFuzzySearch } from './useFuzzySearch';
import { useCallback } from 'preact/hooks';

export const useAdvancedSearch = (items) => {
  const fuzzySearch = useFuzzySearch(items);
  
  // Smart Query Parser
  const parseQuery = useCallback((query) => {
    const parts = {
      include: [],
      exclude: [],
      exact: [],
      fuzzy: []
    };
    
    // Parse query operators
    // "!term" = exclude
    // "=term" = exact match
    // "'term" = must include
    // "term~" = extra fuzzy
    
    const tokens = query.match(/([!='~]?)([^\s]+)/g) || [];
    
    tokens.forEach(token => {
      if (token.startsWith('!')) {
        parts.exclude.push(token.slice(1));
      } else if (token.startsWith('=')) {
        parts.exact.push(token.slice(1));
      } else if (token.startsWith("'")) {
        parts.include.push(token.slice(1));
      } else if (token.endsWith('~')) {
        parts.fuzzy.push(token.slice(0, -1));
      } else {
        parts.fuzzy.push(token);
      }
    });
    
    return parts;
  }, []);
  
  // Multi-field search with boost
  const searchWithBoost = useCallback((query) => {
    const parsed = parseQuery(query);
    let results = [...items];
    
    // Apply filters
    if (parsed.exact.length) {
      results = results.filter(item => 
        parsed.exact.some(term => 
          item.name.toLowerCase() === term.toLowerCase()
        )
      );
    }
    
    if (parsed.exclude.length) {
      results = results.filter(item =>
        !parsed.exclude.some(term =>
          item.name.toLowerCase().includes(term.toLowerCase())
        )
      );
    }
    
    // Fuzzy search on remaining
    if (parsed.fuzzy.length) {
      const fuzzyQuery = parsed.fuzzy.join(' ');
      results = fuzzySearch.search(fuzzyQuery);
    }
    
    return results;
  }, [items, parseQuery, fuzzySearch]);
  
  return {
    ...fuzzySearch,
    parseQuery,
    searchWithBoost
  };
};