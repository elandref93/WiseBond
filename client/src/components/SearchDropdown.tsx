import { useState, useEffect, useRef } from "react";
import { Search, BookOpen, Clock, Users, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  knowledgeBaseData, 
  searchKnowledgeBase, 
  type Article, 
  type Category 
} from "@/data/knowledgeBase";

interface SearchDropdownProps {
  placeholder?: string;
  className?: string;
  onArticleSelect?: (article: Article) => void;
}

// Helper function to highlight search terms in text
function highlightText(text: string, searchTerm: string) {
  if (!searchTerm.trim()) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => 
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 px-1 rounded">
        {part}
      </mark>
    ) : part
  );
}

// Helper function to format target audience
const formatTargetAudience = (audience: string) => {
  return audience.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export default function SearchDropdown({ 
  placeholder = "Search for property advice, home loans, investment tips...",
  className = "",
  onArticleSelect 
}: SearchDropdownProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Article[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      const results = searchKnowledgeBase(searchQuery);
      setSearchResults(results.slice(0, 8)); // Limit to 8 results for dropdown
      setIsSearching(false);
      setIsDropdownOpen(true);
      setSelectedIndex(-1);
    } else {
      setSearchResults([]);
      setIsDropdownOpen(false);
    }
  }, [searchQuery]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleArticleSelect(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle article selection
  const handleArticleSelect = (article: Article) => {
    if (onArticleSelect) {
      onArticleSelect(article);
    }
    setSearchQuery("");
    setIsDropdownOpen(false);
    setSelectedIndex(-1);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get category for an article
  const getCategory = (article: Article): Category | undefined => {
    return knowledgeBaseData.find(cat => cat.categoryId === article.categoryId);
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchQuery.trim() && searchResults.length > 0) {
              setIsDropdownOpen(true);
            }
          }}
          className="pl-10 pr-4 py-3 text-lg border-0 rounded-lg shadow-lg text-gray-900 bg-white placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Search Results Dropdown */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
              Searching...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((article, index) => {
                const category = getCategory(article);
                const isSelected = index === selectedIndex;
                
                return (
                  <div
                    key={article.id}
                    className={`px-4 py-3 cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-blue-50 border-l-4 border-blue-500' 
                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                    onClick={() => handleArticleSelect(article)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Category Icon */}
                      <div className="flex-shrink-0 mt-1">
                        <span className="text-lg">{category?.icon || "📄"}</span>
                      </div>
                      
                      {/* Article Content */}
                      <div className="flex-1 min-w-0">
                        {/* Title with highlighting */}
                        <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                          {highlightText(article.title, searchQuery)}
                        </h3>
                        
                        {/* Summary with highlighting */}
                        <p className="text-gray-600 text-xs leading-relaxed mb-2 line-clamp-2">
                          {highlightText(article.summary, searchQuery)}
                        </p>
                        
                        {/* Meta information */}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{article.readingTime}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{formatTargetAudience(article.targetAudience)}</span>
                          </div>
                          
                          {category && (
                            <Badge variant="outline" className="text-xs">
                              {category.title}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Key points preview */}
                        {article.keyPoints.length > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                              <Tag className="h-3 w-3" />
                              <span>Key points:</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {article.keyPoints.slice(0, 2).map((point, pointIndex) => (
                                <span
                                  key={pointIndex}
                                  className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                                >
                                  {highlightText(point, searchQuery)}
                                </span>
                              ))}
                              {article.keyPoints.length > 2 && (
                                <span className="text-xs text-gray-500">
                                  +{article.keyPoints.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Show more results indicator */}
              {searchResults.length === 8 && (
                <div className="px-4 py-2 text-center text-sm text-gray-500 border-t border-gray-100">
                  Type more to see additional results
                </div>
              )}
            </div>
          ) : searchQuery.trim() ? (
            <div className="p-4 text-center text-gray-500">
              <BookOpen className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm">No results found</p>
              <p className="text-xs">Try different keywords</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
} 