import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Search, BookOpen, Clock, Users, Tag, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  knowledgeBaseData, 
  searchKnowledgeBase, 
  type Article, 
  type Category 
} from "@/data/knowledgeBase";

// Helper function to format target audience
const formatTargetAudience = (audience: string) => {
  return audience.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export default function Guidance() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      const results = searchKnowledgeBase(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Get filtered categories
  const filteredCategories = selectedCategory 
    ? knowledgeBaseData.filter(cat => cat.categoryId === selectedCategory)
    : knowledgeBaseData;

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
    setSearchQuery(""); // Clear search when selecting category
  };

  const getCategoryIcon = (icon: string) => {
    return <span className="text-2xl">{icon}</span>;
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-6">
            Property Advice Hub
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8">
            Your complete guide to homeownership and property investment. Expert insights, 
            step-by-step guides, and market analysis to help you make informed decisions.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search for property advice, home loans, investment tips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-3 text-lg border-0 rounded-lg shadow-lg"
              />
            </div>
            {isSearching && (
              <p className="text-blue-200 mt-2">Searching...</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Search Results ({searchResults.length})
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {searchResults.map((article) => (
                  <SearchResultCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          )}

          {/* Category Navigation */}
          {!searchQuery && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Browse by Category
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {knowledgeBaseData.map((category) => (
                  <CategoryCard
                    key={category.categoryId}
                    category={category}
                    isSelected={selectedCategory === category.categoryId}
                    onClick={() => handleCategoryClick(category.categoryId)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Articles by Category */}
          {!searchQuery && (
            <div>
              {filteredCategories.map((category) => (
                <div key={category.categoryId} className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-2xl">{category.icon}</span>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {category.title}
                    </h2>
                    <Badge variant="secondary" className="ml-2">
                      {category.articles.length} articles
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-6 max-w-3xl">
                    {category.description}
                  </p>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {category.articles.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {searchQuery && searchResults.length === 0 && !isSearching && (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No results found
              </h3>
              <p className="text-gray-600 mb-6">
                Try searching with different keywords or browse our categories below.
              </p>
              <Button 
                onClick={() => setSearchQuery("")}
                variant="outline"
              >
                Clear Search
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Search Result Card Component
function SearchResultCard({ article }: { article: Article }) {
  const category = knowledgeBaseData.find(cat => cat.categoryId === article.categoryId);
  
  return (
    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{category?.icon}</span>
              <Badge variant="outline" className="text-xs">
                {category?.title}
              </Badge>
            </div>
            <CardTitle className="text-lg leading-tight">
              {article.title}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4">
          {article.summary}
        </CardDescription>
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {article.readingTime}
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {formatTargetAudience(article.targetAudience)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {article.relatedTopics.slice(0, 3).map((topic) => (
            <Badge key={topic} variant="secondary" className="text-xs">
              {topic}
            </Badge>
          ))}
        </div>
        <Link href={`/guidance/article/${article.id}`}>
          <Button variant="outline" size="sm" className="w-full">
            Read Article
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// Category Card Component
function CategoryCard({ 
  category, 
  isSelected, 
  onClick 
}: { 
  category: Category; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  return (
    <Card 
      className={`h-full cursor-pointer transition-all ${
        isSelected 
          ? 'ring-2 ring-blue-500 shadow-lg' 
          : 'hover:shadow-md'
      }`}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <div 
            className="p-3 rounded-lg"
            style={{ backgroundColor: `${category.color}20` }}
          >
            <span className="text-2xl">{category.icon}</span>
          </div>
          <div>
            <CardTitle className="text-lg">{category.title}</CardTitle>
            <CardDescription className="text-sm">
              {category.articles.length} articles
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          {category.description}
        </p>
        <Button 
          variant={isSelected ? "default" : "outline"} 
          size="sm" 
          className="w-full"
        >
          {isSelected ? "Selected" : "Browse Articles"}
        </Button>
      </CardContent>
    </Card>
  );
}

// Article Card Component
function ArticleCard({ article }: { article: Article }) {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader>
        <CardTitle className="text-lg leading-tight">
          {article.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4">
          {article.summary}
        </CardDescription>
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {article.readingTime}
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {formatTargetAudience(article.targetAudience)}
          </div>
        </div>
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Key Points:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {article.keyPoints.slice(0, 3).map((point, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {article.relatedTopics.slice(0, 2).map((topic) => (
            <Badge key={topic} variant="secondary" className="text-xs">
              {topic}
            </Badge>
          ))}
        </div>
        <Link href={`/guidance/article/${article.id}`}>
          <Button variant="outline" size="sm" className="w-full">
            Read Full Article
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
} 