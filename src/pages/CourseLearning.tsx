import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import QuizTaker from '@/components/QuizTaker';
import ImprovementTracker from '@/components/ImprovementTracker';
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  Lock, 
  ArrowLeft, 
  ArrowRight, 
  Clock,
  FileText,
  HelpCircle,
  Menu,
  X,
  PlayCircle
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
}

interface Chapter {
  id: string;
  title: string;
  description: string;
  content: string;
  video_url: string;
  order_index: number;
  is_preview: boolean;
  has_start_quiz: boolean;
  has_end_quiz: boolean;
  pdf_attachments: string[];
}

interface Progress {
  id: string;
  completed: boolean;
  started_at: string;
  completed_at: string;
  quiz_attempts?: any;
}

interface Quiz {
  id: string;
  title: string;
  chapter_id: string;
  is_start_quiz: boolean;
  is_end_quiz: boolean;
  passing_score: number;
}

const CourseLearning = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showImprovementTracker, setShowImprovementTracker] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (courseId && profile) {
      fetchCourseData();
    }
  }, [courseId, profile]);

  useEffect(() => {
    if (chapters.length > 0) {
      calculateProgress();
    }
  }, [chapters, progress]);

  const fetchCourseData = async () => {
    if (!courseId || !profile) return;

    try {
      setIsLoading(true);

      // Check if user has access to this course
      const hasAccess = profile.purchased_courses?.includes(courseId) || 
                       profile.role === 'admin';

      if (!hasAccess) {
        toast({
          title: "Access Denied",
          description: "You don't have access to this course.",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id, title, description, category')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch chapters
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');

      if (chaptersError) throw chaptersError;
      setChapters(chaptersData || []);

      // Set first chapter as current if no chapter is selected
      if (chaptersData && chaptersData.length > 0) {
        setCurrentChapter(chaptersData[0]);
      }

      // Fetch progress
      const { data: progressData, error: progressError } = await supabase
        .from('student_progress')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', profile.user_id);

      if (progressError) throw progressError;

      const progressMap: Record<string, Progress> = {};
      progressData?.forEach(p => {
        progressMap[p.chapter_id] = p;
      });
      setProgress(progressMap);

    } catch (error) {
      console.error('Error fetching course data:', error);
      toast({
        title: "Error",
        description: "Failed to load course data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProgress = () => {
    const completedChapters = chapters.filter(chapter => 
      progress[chapter.id]?.completed
    ).length;
    const percentage = chapters.length > 0 ? Math.round((completedChapters / chapters.length) * 100) : 0;
    setCompletionPercentage(percentage);
  };

  const markChapterAsStarted = async (chapterId: string) => {
    if (!profile || progress[chapterId]?.started_at) return;

    try {
      const { error } = await supabase
        .from('student_progress')
        .upsert({
          user_id: profile.user_id,
          course_id: courseId,
          chapter_id: chapterId,
          started_at: new Date().toISOString(),
          completed: false
        }, {
          onConflict: 'user_id,chapter_id'
        });

      if (error) throw error;

      // Update local progress
      setProgress(prev => ({
        ...prev,
        [chapterId]: {
          ...prev[chapterId],
          started_at: new Date().toISOString(),
          completed: false
        } as Progress
      }));

    } catch (error) {
      console.error('Error marking chapter as started:', error);
    }
  };

  const markChapterAsCompleted = async (chapterId: string) => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('student_progress')
        .upsert({
          user_id: profile.user_id,
          course_id: courseId,
          chapter_id: chapterId,
          started_at: progress[chapterId]?.started_at || new Date().toISOString(),
          completed_at: new Date().toISOString(),
          completed: true
        }, {
          onConflict: 'user_id,chapter_id'
        });

      if (error) throw error;

      // Update local progress
      setProgress(prev => ({
        ...prev,
        [chapterId]: {
          ...prev[chapterId],
          completed_at: new Date().toISOString(),
          completed: true
        } as Progress
      }));

      toast({
        title: "Chapter Completed!",
        description: "Great job! Moving to the next chapter.",
      });

      // Auto-advance to next chapter
      const currentIndex = chapters.findIndex(ch => ch.id === chapterId);
      if (currentIndex < chapters.length - 1) {
        setCurrentChapter(chapters[currentIndex + 1]);
      }

    } catch (error) {
      console.error('Error marking chapter as completed:', error);
      toast({
        title: "Error",
        description: "Failed to save progress.",
        variant: "destructive"
      });
    }
  };

  const fetchQuizData = async (chapterId: string, isStartQuiz: boolean) => {
    try {
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('chapter_id', chapterId)
        .eq('is_start_quiz', isStartQuiz)
        .eq('is_end_quiz', !isStartQuiz)
        .limit(1);

      if (quizError) throw quizError;
      
      if (!quizData || quizData.length === 0) {
        throw new Error('No quiz found for this chapter');
      }
      
      const quiz = quizData[0]; // Get the first quiz

      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('order_index');

      if (questionsError) throw questionsError;

      setCurrentQuiz(quiz);
      setQuizQuestions(questionsData || []);
      setShowQuiz(true);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      toast({
        title: "Error",
        description: "Failed to load quiz.",
        variant: "destructive"
      });
    }
  };

  const handleQuizComplete = async (score: number, passed: boolean) => {
    if (!currentQuiz || !profile || !currentChapter) return;

    try {
      // Get current progress first
      const { data: currentProgress, error: fetchError } = await supabase
        .from('student_progress')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('chapter_id', currentChapter.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const quizAttempts = currentProgress?.quiz_attempts || {};
      
      const attemptData = {
        score,
        passed,
        completed_at: new Date().toISOString(),
        quiz_type: currentQuiz.is_start_quiz ? 'start' : 'end'
      };

      quizAttempts[currentQuiz.id] = attemptData;

      // Update existing progress or create new one
      const { error } = await supabase
        .from('student_progress')
        .upsert({
          user_id: profile.user_id,
          course_id: courseId,
          chapter_id: currentChapter.id,
          started_at: currentProgress?.started_at || new Date().toISOString(),
          completed: currentProgress?.completed || false,
          quiz_attempts: quizAttempts
        }, {
          onConflict: 'user_id,chapter_id'
        });

      if (error) throw error;

      // Update local progress
      setProgress(prev => ({
        ...prev,
        [currentChapter.id]: {
          ...prev[currentChapter.id],
          quiz_attempts: quizAttempts
        } as Progress
      }));

      setShowQuiz(false);
      setCurrentQuiz(null);
      setQuizQuestions([]);

      toast({
        title: passed ? "Quiz Passed!" : "Quiz Completed",
        description: `You scored ${score}%. ${passed ? "Great job!" : "Keep practicing!"}`,
        variant: passed ? "default" : "destructive"
      });

    } catch (error) {
      console.error('Error saving quiz attempt:', error);
      toast({
        title: "Error",
        description: "Failed to save quiz results.",
        variant: "destructive"
      });
    }
  };

  const hasCompletedStartQuiz = (chapterId: string) => {
    const chapterProgress = progress[chapterId];
    if (!chapterProgress?.quiz_attempts) return false;
    
    return Object.values(chapterProgress.quiz_attempts).some((attempt: any) => 
      attempt.quiz_type === 'start' && attempt.passed
    );
  };

  const hasCompletedEndQuiz = (chapterId: string) => {
    const chapterProgress = progress[chapterId];
    if (!chapterProgress?.quiz_attempts) return false;
    
    return Object.values(chapterProgress.quiz_attempts).some((attempt: any) => 
      attempt.quiz_type === 'end' && attempt.passed
    );
  };

  const canRetakeEndQuiz = (chapterId: string) => {
    const chapterProgress = progress[chapterId];
    if (!chapterProgress?.quiz_attempts) return false;
    
    // Check if student has taken the end quiz but failed
    const endQuizAttempts = Object.values(chapterProgress.quiz_attempts).filter((attempt: any) => 
      attempt.quiz_type === 'end'
    );
    
    // If they have attempts but none passed, they can retake
    return endQuizAttempts.length > 0 && !endQuizAttempts.some((attempt: any) => attempt.passed);
  };

  const getLatestEndQuizAttempt = (chapterId: string) => {
    const chapterProgress = progress[chapterId];
    if (!chapterProgress?.quiz_attempts) return null;
    
    const endQuizAttempts = Object.values(chapterProgress.quiz_attempts).filter((attempt: any) => 
      attempt.quiz_type === 'end'
    );
    
    if (endQuizAttempts.length === 0) return null;
    
    // Return the latest attempt (assuming attempts are stored with timestamps)
    return endQuizAttempts[endQuizAttempts.length - 1];
  };

  const hasCompletedAllChapters = () => {
    // Check if all chapters (except the last one which has the end quiz) are completed
    const chaptersToComplete = chapters.filter(ch => ch.order_index < chapters.length);
    
    return chaptersToComplete.every(chapter => {
      // For chapters with start quiz, check if start quiz is completed
      if (chapter.has_start_quiz) {
        return hasCompletedStartQuiz(chapter.id);
      }
      // For chapters without start quiz, check if chapter is marked as completed
      return progress[chapter.id]?.completed || false;
    });
  };

  const canAccessChapterContent = (chapter: Chapter) => {
    // If chapter has no start quiz, check if previous chapters are completed
    if (!chapter.has_start_quiz) {
      // For first chapter, always allow access
      if (chapter.order_index === 1) return true;
      
      // For other chapters, check if previous chapter is completed
      const previousChapter = chapters.find(ch => ch.order_index === chapter.order_index - 1);
      if (!previousChapter) return true;
      
      if (previousChapter.has_start_quiz) {
        return hasCompletedStartQuiz(previousChapter.id);
      } else {
        return progress[previousChapter.id]?.completed || false;
      }
    }
    
    // If chapter has start quiz, check if it's completed
    return hasCompletedStartQuiz(chapter.id);
  };

  const handleChapterSelect = (chapter: Chapter) => {
    setCurrentChapter(chapter);
    markChapterAsStarted(chapter.id);
  };

  // Helper function to get overall course quiz scores and improvement
  const getCourseQuizScoresAndImprovement = () => {
    if (!courseId) return null;
    
    // Find the first chapter (start quiz) and last chapter (end quiz)
    const firstChapter = chapters.find(ch => ch.order_index === 1);
    const lastChapter = chapters.find(ch => ch.order_index === chapters.length);
    
    if (!firstChapter || !lastChapter) return null;
    
    const firstChapterProgress = progress[firstChapter.id];
    const lastChapterProgress = progress[lastChapter.id];
    
    let startQuiz = null, endQuiz = null;
    
    // Get start quiz from first chapter
    if (firstChapterProgress?.quiz_attempts) {
      Object.values(firstChapterProgress.quiz_attempts).forEach((attempt: any) => {
        if (attempt.quiz_type === 'start') startQuiz = attempt;
      });
    }
    
    // Get end quiz from last chapter (get the latest attempt)
    if (lastChapterProgress?.quiz_attempts) {
      const endQuizAttempts = Object.values(lastChapterProgress.quiz_attempts).filter((attempt: any) => 
        attempt.quiz_type === 'end'
      );
      if (endQuizAttempts.length > 0) {
        endQuiz = endQuizAttempts[endQuizAttempts.length - 1]; // Get the latest attempt
      }
    }

    let improvement = null;
    if (startQuiz && endQuiz) {
      const improvementPoints = endQuiz.score - startQuiz.score;
      improvement = {
        points: improvementPoints,
        percentage: startQuiz.score > 0 ? Math.round((improvementPoints / startQuiz.score) * 100) : 0
      };
    }

    return { startQuiz, endQuiz, improvement };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Course Not Found</h2>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-20 border-b bg-card flex items-center px-4 md:px-6 sticky top-0 z-40">
        <div className="flex items-center space-x-4 flex-1">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">{course.title}</h1>
            <p className="text-sm text-muted-foreground truncate">{course.category}</p>
          </div>
        </div>

        {/* Quiz Scores and Improvement Display */}
        <div className="flex items-center space-x-3 mr-4">
          {(() => {
            const quizData = getCourseQuizScoresAndImprovement();
            if (!quizData) return null;
            
            return (
              <div className="flex items-center space-x-2">
                {/* Pre-Quiz Score */}
                {quizData.startQuiz && (
                  <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold border border-blue-200">
                    <span>Pre: {quizData.startQuiz.score}%</span>
                  </div>
                )}
                
                {/* End-Quiz Score and Improvement */}
                {quizData.endQuiz && (
                  <div className={`px-2 py-1 rounded text-xs font-semibold border ${
                    quizData.endQuiz.passed 
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : 'bg-red-100 text-red-800 border-red-200'
                  }`}>
                    <div className="flex items-center space-x-1">
                      <span>End: {quizData.endQuiz.score}%</span>
                      {quizData.endQuiz.passed ? (
                        quizData.improvement && (
                          <span className={`text-xs px-1 rounded ${
                            quizData.improvement.points > 0 
                              ? 'bg-green-200 text-green-700' 
                              : quizData.improvement.points < 0 
                                ? 'bg-red-200 text-red-700'
                                : 'bg-gray-200 text-gray-700'
                          }`}>
                            {quizData.improvement.points > 0 ? '+' : ''}{quizData.improvement.points}
                          </span>
                        )
                      ) : (
                        <span className="text-xs px-1 rounded bg-red-200 text-red-700">
                          Failed
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center space-x-2 mr-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const currentIndex = chapters.findIndex(ch => ch.id === currentChapter?.id);
              if (currentIndex > 0) {
                setCurrentChapter(chapters[currentIndex - 1]);
              }
            }}
            disabled={!currentChapter || chapters.findIndex(ch => ch.id === currentChapter.id) === 0}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const currentIndex = chapters.findIndex(ch => ch.id === currentChapter?.id);
              if (currentIndex < chapters.length - 1) {
                setCurrentChapter(chapters[currentIndex + 1]);
              }
            }}
            disabled={!currentChapter || chapters.findIndex(ch => ch.id === currentChapter.id) === chapters.length - 1}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{completionPercentage}% Complete</p>
            <Progress value={completionPercentage} className="w-24 h-1.5" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-80' : 'w-0'} md:w-80 transition-all duration-300 flex-shrink-0 relative`}>
          <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 absolute inset-0 bg-card border-r transition-transform duration-300 z-30`}>
            <div className="p-4 border-b bg-muted/50">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-sm">Course Content</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="md:hidden"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {chapters.filter(ch => progress[ch.id]?.completed).length} of {chapters.length} completed
              </p>
            </div>
            
            <div className="overflow-y-auto h-[calc(100vh-8rem)]">
              <div className="p-2 space-y-1">
                {chapters.map((chapter, index) => {
                  const isCompleted = progress[chapter.id]?.completed;
                  const isStarted = progress[chapter.id]?.started_at;
                  const isCurrent = currentChapter?.id === chapter.id;
                  
                  return (
                    <div
                      key={chapter.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all group ${
                        isCurrent 
                          ? 'border-primary bg-primary/10 shadow-sm' 
                          : 'border-transparent hover:border-primary/30 hover:bg-muted/50'
                      }`}
                      onClick={() => handleChapterSelect(chapter)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {isCompleted ? (
                            <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center">
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                          ) : isStarted ? (
                            <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                              <PlayCircle className="h-3 w-3 text-white" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex items-center justify-center">
                              <span className="text-xs font-medium">{chapter.order_index}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm leading-tight ${isCurrent ? 'text-primary' : ''}`}>
                            {chapter.title}
                          </p>
                          <div className="flex items-center space-x-1 mt-1">
                            {chapter.video_url && (
                              <PlayCircle className="h-3 w-3 text-muted-foreground" />
                            )}
                            {chapter.content && (
                              <FileText className="h-3 w-3 text-muted-foreground" />
                            )}
                            {chapter.has_start_quiz && (
                              <HelpCircle className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {currentChapter ? (
            <div className="flex-1 flex flex-col">
              {/* Video/Content Area */}
              <div className="bg-black relative">
                {currentChapter.video_url && canAccessChapterContent(currentChapter) ? (
                  <div className="aspect-video">
                    {currentChapter.video_url.includes('youtube.com') || currentChapter.video_url.includes('youtu.be') ? (
                      <iframe
                        src={currentChapter.video_url.replace('watch?v=', 'embed/')}
                        className="w-full h-full"
                        allowFullScreen
                        title={`${currentChapter.title} Video`}
                      />
                    ) : currentChapter.video_url.includes('vimeo.com') ? (
                      <iframe
                        src={currentChapter.video_url.replace('vimeo.com/', 'player.vimeo.com/video/')}
                        className="w-full h-full"
                        allowFullScreen
                        title={`${currentChapter.title} Video`}
                      />
                    ) : (
                      <video
                        controls
                        className="w-full h-full"
                        src={currentChapter.video_url}
                        preload="metadata"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          console.error('Video failed to load:', e);
                          toast({
                            title: "Video Error",
                            description: "Failed to load video. Please refresh and try again.",
                            variant: "destructive"
                          });
                        }}
                        onLoadStart={() => console.log('Video loading started')}
                        onCanPlay={() => console.log('Video can play')}
                      >
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center bg-muted">
                    <div className="text-center">
                      {!canAccessChapterContent(currentChapter) ? (
                        <>
                          <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Complete the Quiz First</h3>
                          <p className="text-muted-foreground">You need to pass the pre-chapter quiz to access this content.</p>
                        </>
                      ) : (
                        <>
                          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Text-Based Chapter</h3>
                          <p className="text-muted-foreground">This chapter contains reading material and exercises.</p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Chapter Info & Actions */}
              <div className="p-6 border-b">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold mb-2">
                      {currentChapter.order_index}. {currentChapter.title}
                    </h1>
 <div
  className="text-muted-foreground mb-4"
  dangerouslySetInnerHTML={{ __html: currentChapter.description }}
/>                                        
                    <div className="flex items-center space-x-2">
                      {progress[currentChapter.id]?.completed ? (
                        <Badge className="bg-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="secondary">In Progress</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {currentChapter.has_start_quiz && !hasCompletedStartQuiz(currentChapter.id) && (
                      <Button 
                        onClick={() => fetchQuizData(currentChapter.id, true)}
                        variant="outline"
                        size="sm"
                      >
                        <HelpCircle className="h-4 w-4 mr-1" />
                        Take Pre-Quiz
                      </Button>
                    )}
                    
                    {/* End Quiz - First attempt */}
                    {currentChapter.has_end_quiz && hasCompletedAllChapters() && !hasCompletedEndQuiz(currentChapter.id) && !canRetakeEndQuiz(currentChapter.id) && (
                      <Button 
                        onClick={() => fetchQuizData(currentChapter.id, false)}
                        variant="outline"
                        size="sm"
                        className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      >
                        <HelpCircle className="h-4 w-4 mr-1" />
                        Take End-Quiz
                      </Button>
                    )}
                    
                    {/* End Quiz - Retake after failure */}
                    {currentChapter.has_end_quiz && hasCompletedAllChapters() && canRetakeEndQuiz(currentChapter.id) && (
                      <div className="flex flex-col space-y-2">
                        <div className="text-xs text-red-600 font-medium">
                          Failed - Score: {(getLatestEndQuizAttempt(currentChapter.id) as any)?.score}%
                        </div>
                        <Button 
                          onClick={() => fetchQuizData(currentChapter.id, false)}
                          variant="outline"
                          size="sm"
                          className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                        >
                          <HelpCircle className="h-4 w-4 mr-1" />
                          Retake End-Quiz
                        </Button>
                      </div>
                    )}
                    
                    {canAccessChapterContent(currentChapter) && !progress[currentChapter.id]?.completed && (
                      <Button 
                        onClick={() => markChapterAsCompleted(currentChapter.id)}
                        size="sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Reading Material */}
              {currentChapter.content && canAccessChapterContent(currentChapter) && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Reading Material</h3>
                  <div className="prose prose-sm max-w-none bg-card p-6 rounded-lg border">
                    <div className="whitespace-pre-wrap">{currentChapter.content}</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Welcome to {course.title}!</h3>
                <p className="text-muted-foreground mb-4">Select a chapter from the sidebar to begin learning</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quiz Modal */}
      {showQuiz && currentQuiz && quizQuestions.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {currentQuiz.is_start_quiz ? "Pre-Chapter Quiz" : "Chapter Test"}: {currentQuiz.title}
                </h2>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowQuiz(false);
                    setCurrentQuiz(null);
                    setQuizQuestions([]);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              <QuizTaker
                quiz={currentQuiz}
                questions={quizQuestions}
                onQuizComplete={handleQuizComplete}
                onBack={() => {
                  setShowQuiz(false);
                  setCurrentQuiz(null);
                  setQuizQuestions([]);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Improvement Tracker Modal */}
      {showImprovementTracker && courseId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Your Learning Progress</h2>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowImprovementTracker(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              <ImprovementTracker courseId={courseId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseLearning;
