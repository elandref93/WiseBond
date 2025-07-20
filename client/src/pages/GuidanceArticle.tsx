import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Clock, Users, Tag, Share2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import { 
  getArticleById, 
  getRelatedArticles, 
  type Article 
} from "@/data/knowledgeBase";

// Helper function to format target audience
const formatTargetAudience = (audience: string) => {
  return audience.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export default function GuidanceArticle() {
  const [location] = useLocation();
  const [article, setArticle] = useState<Article | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Extract article ID from URL
    const pathParts = location.split('/');
    const articleId = pathParts[pathParts.length - 1];
    
    if (articleId) {
      const foundArticle = getArticleById(articleId);
      if (foundArticle) {
        setArticle(foundArticle);
        const related = getRelatedArticles(foundArticle);
        setRelatedArticles(related);
      }
      setLoading(false);
    }
  }, [location]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4 animate-pulse" />
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Article Not Found</h1>
          <p className="text-gray-600 mb-6">The article you're looking for doesn't exist.</p>
          <Link href="/guidance">
            <Button>Back to Guidance</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" className="text-white hover:bg-orange-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Guidance
          </Button>
          
          <div className="flex items-center gap-4 text-sm mb-4">
            <div className="flex items-center gap-1 text-orange-100">
              <Clock className="h-4 w-4" />
              {article.readingTime}
            </div>
            <div className="flex items-center gap-1 text-orange-100">
              <Users className="h-4 w-4" />
              {formatTargetAudience(article.targetAudience)}
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">{article.title}</h1>
          <p className="text-xl text-orange-100">{article.summary}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Article Content */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border p-8">
                {/* Full Article Content */}
                {article.content && (
                  <div className="mb-8">
                    <div className="prose prose-lg max-w-none">
                      <ReactMarkdown>{article.content}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Key Points (shown if no full content or as summary) */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Points</h2>
                  <ul className="space-y-3">
                    {article.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-orange-600 font-semibold text-sm">{index + 1}</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{point}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Related Topics */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Related Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {article.relatedTopics.map((topic) => (
                      <Badge key={topic} variant="outline" className="text-sm">
                        <Tag className="mr-1 h-3 w-3" />
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Last Updated */}
                {article.lastUpdated && (
                  <div className="text-sm text-gray-500 border-t pt-4">
                    Last updated: {new Date(article.lastUpdated).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Share */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Share This Article</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Related Articles */}
              {relatedArticles.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Related Articles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {relatedArticles.map((relatedArticle) => (
                        <Link key={relatedArticle.id} href={`/guidance/article/${relatedArticle.id}`}>
                          <div className="p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors">
                            <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                              {relatedArticle.title}
                            </h4>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {relatedArticle.summary}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{relatedArticle.readingTime}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 