import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Clock, Users, Tag, Share2, BookOpen, Copy, Mail, Twitter, Facebook, Linkedin, Link as LinkIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import { 
  getArticleById, 
  getRelatedArticles, 
  type Article 
} from "@/data/knowledgeBase";
import SEO from "@/components/SEO";

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
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

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

  // Share functionality
  const getShareUrl = () => {
    return `${window.location.origin}/guidance/article/${article?.id}`;
  };

  const getShareText = () => {
    return `${article?.title} - ${article?.summary}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Article link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out this article: ${article?.title}`);
    const body = encodeURIComponent(
      `Hi there,\n\nI thought you might find this article interesting:\n\n${article?.title}\n${article?.summary}\n\nRead it here: ${getShareUrl()}\n\nBest regards`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent(`${article?.title} - ${getShareUrl()}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const shareOnFacebook = () => {
    const url = encodeURIComponent(getShareUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    const url = encodeURIComponent(getShareUrl());
    const title = encodeURIComponent(article?.title || '');
    const summary = encodeURIComponent(article?.summary || '');
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`, '_blank');
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(`${article?.title} - ${getShareUrl()}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareViaSMS = () => {
    const text = encodeURIComponent(`${article?.title} - ${getShareUrl()}`);
    window.open(`sms:?body=${text}`);
  };

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
      <SEO
        title={article.title}
        description={article.summary}
        canonical={`https://wisebond.co.za/guidance/article/${article.id}`}
        openGraph={{
          title: article.title,
          description: article.summary,
          url: `https://wisebond.co.za/guidance/article/${article.id}`,
          images: [
            {
              url: `https://wisebond.co.za/og-image-${article.id}.jpg`,
              width: 1200,
              height: 630,
              alt: article.title,
            },
          ],
        }}
        additionalMetaTags={[
          {
            name: "keywords",
            content: `${article.relatedTopics.join(', ')}, home loan, mortgage, South Africa, property finance`,
          },
          {
            name: "author",
            content: "WiseBond",
          },
          {
            name: "article:section",
            content: article.categoryId,
          },
        ]}
      />
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Link href="/guidance">
            <Button variant="ghost" className="text-white hover:bg-orange-700 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Guidance
            </Button>
          </Link>
          
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
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">{article.title}</h1>
          <p className="text-lg sm:text-xl text-orange-100 max-w-4xl">{article.summary}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid xl:grid-cols-4 gap-8">
            {/* Article Content */}
            <div className="xl:col-span-3 order-1">
              <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 lg:p-8 xl:p-12 relative">
                {/* Floating Share Button for Mobile */}
                <div className="xl:hidden absolute top-4 right-4 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className="rounded-full w-10 h-10 p-0 shadow-lg">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={copyToClipboard}>
                        {copied ? (
                          <>
                            <Check className="mr-2 h-4 w-4 text-green-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Link
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={shareOnTwitter}>
                        <Twitter className="mr-2 h-4 w-4 text-blue-400" />
                        Share on Twitter
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={shareOnFacebook}>
                        <Facebook className="mr-2 h-4 w-4 text-blue-600" />
                        Share on Facebook
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={shareOnLinkedIn}>
                        <Linkedin className="mr-2 h-4 w-4 text-blue-700" />
                        Share on LinkedIn
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={shareOnWhatsApp}>
                        <div className="mr-2 h-4 w-4 bg-green-500 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">W</span>
                        </div>
                        Share on WhatsApp
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={shareViaEmail}>
                        <Mail className="mr-2 h-4 w-4" />
                        Share via Email
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={shareViaSMS}>
                        <div className="mr-2 h-4 w-4 bg-green-500 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">S</span>
                        </div>
                        Share via SMS
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Full Article Content */}
                {article.content && (
                  <div className="mb-8">
                    <div className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl max-w-none">
                      <ReactMarkdown>{article.content}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Key Points (shown if no full content or as summary) */}
                <div className="mb-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Key Points</h2>
                  <ul className="space-y-3">
                    {article.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-orange-600 font-semibold text-sm">{index + 1}</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{point}</p>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Related Topics */}
                <div className="mb-8">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Related Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {article.relatedTopics.map((topic) => (
                      <Badge key={topic} variant="outline" className="text-xs sm:text-sm">
                        <Tag className="mr-1 h-3 w-3" />
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Last Updated */}
                {article.lastUpdated && (
                  <div className="text-xs sm:text-sm text-gray-500 border-t pt-4">
                    Last updated: {new Date(article.lastUpdated).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="xl:col-span-1 order-2">
              {/* Share */}
              <Card className="mb-6 xl:sticky xl:top-8">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">Share This Article</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Copy Link Button */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Link
                      </>
                    )}
                  </Button>

                  {/* Social Media Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Share2 className="mr-2 h-4 w-4" />
                        Share on Social Media
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem onClick={shareOnTwitter}>
                        <Twitter className="mr-2 h-4 w-4 text-blue-400" />
                        Share on Twitter
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={shareOnFacebook}>
                        <Facebook className="mr-2 h-4 w-4 text-blue-600" />
                        Share on Facebook
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={shareOnLinkedIn}>
                        <Linkedin className="mr-2 h-4 w-4 text-blue-700" />
                        Share on LinkedIn
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={shareOnWhatsApp}>
                        <div className="mr-2 h-4 w-4 bg-green-500 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">W</span>
                        </div>
                        Share on WhatsApp
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Email and SMS */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="justify-start"
                      onClick={shareViaEmail}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Email
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="justify-start"
                      onClick={shareViaSMS}
                    >
                      <div className="mr-2 h-4 w-4 bg-green-500 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">S</span>
                      </div>
                      SMS
                    </Button>
                  </div>

                  {/* Quick Share Stats */}
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    <div className="flex justify-between">
                      <span>Reading time:</span>
                      <span>{article?.readingTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Target audience:</span>
                      <span>{article?.targetAudience}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Related Articles */}
              {relatedArticles.length > 0 && (
                <Card className="xl:sticky xl:top-32">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">Related Articles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {relatedArticles.map((relatedArticle) => (
                        <Link key={relatedArticle.id} href={`/guidance/article/${relatedArticle.id}`}>
                          <div className="p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors">
                            <h4 className="font-medium text-gray-900 mb-1 line-clamp-2 text-sm sm:text-base">
                              {relatedArticle.title}
                            </h4>
                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
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