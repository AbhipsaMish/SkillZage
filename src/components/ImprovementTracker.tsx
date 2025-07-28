import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Minus, Trophy, Target } from 'lucide-react';

interface QuizAttempt {
  quiz_id: string;
  score: number;
  passed: boolean;
  completed_at: string;
  is_start_quiz: boolean;
  is_end_quiz: boolean;
}

interface ImprovementData {
  chapterId: string;
  chapterTitle: string;
  startQuizScore: number | null;
  endQuizScore: number | null;
  improvementPercentage: number | null;
  improvementPoints: number | null;
  status: 'not_started' | 'in_progress' | 'improved' | 'declined' | 'same';
}

interface ImprovementTrackerProps {
  courseId: string;
}

const ImprovementTracker: React.FC<ImprovementTrackerProps> = ({ courseId }) => {
  const [improvementData, setImprovementData] = useState<ImprovementData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [overallImprovement, setOverallImprovement] = useState<number | null>(null);

  useEffect(() => {
    fetchImprovementData();
  }, [courseId]);

  const fetchImprovementData = async () => {
    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Get chapters for the course
      const { data: chapters } = await supabase
        .from('chapters')
        .select('id, title')
        .eq('course_id', courseId)
        .order('order_index');

      if (!chapters) return;

      // Get student progress with quiz attempts
      const { data: progressData } = await supabase
        .from('student_progress')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('course_id', courseId);

      const improvements: ImprovementData[] = [];
      let totalStartScore = 0;
      let totalEndScore = 0;
      let chaptersWithBothQuizzes = 0;

      for (const chapter of chapters) {
        const progress = progressData?.find(p => p.chapter_id === chapter.id);
        let startQuizScore: number | null = null;
        let endQuizScore: number | null = null;

        if (progress?.quiz_attempts) {
          const attempts = Array.isArray(progress.quiz_attempts) 
            ? (progress.quiz_attempts as unknown as QuizAttempt[]) 
            : [];
          
          // Find start and end quiz scores
          const startAttempt = attempts.find((attempt) => attempt.is_start_quiz);
          const endAttempt = attempts.find((attempt) => attempt.is_end_quiz);

          startQuizScore = startAttempt?.score ?? null;
          endQuizScore = endAttempt?.score ?? null;
        }

        let status: ImprovementData['status'] = 'not_started';
        let improvementPercentage: number | null = null;
        let improvementPoints: number | null = null;

        if (startQuizScore !== null && endQuizScore !== null) {
          improvementPoints = endQuizScore - startQuizScore;
          improvementPercentage = startQuizScore > 0 ? Math.round((improvementPoints / startQuizScore) * 100) : 0;
          
          if (improvementPoints > 0) {
            status = 'improved';
          } else if (improvementPoints < 0) {
            status = 'declined';
          } else {
            status = 'same';
          }

          totalStartScore += startQuizScore;
          totalEndScore += endQuizScore;
          chaptersWithBothQuizzes++;
        } else if (startQuizScore !== null || endQuizScore !== null) {
          status = 'in_progress';
        }

        improvements.push({
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          startQuizScore,
          endQuizScore,
          improvementPercentage,
          improvementPoints,
          status
        });
      }

      // Calculate overall improvement
      if (chaptersWithBothQuizzes > 0) {
        const avgStartScore = totalStartScore / chaptersWithBothQuizzes;
        const avgEndScore = totalEndScore / chaptersWithBothQuizzes;
        const overallPoints = avgEndScore - avgStartScore;
        setOverallImprovement(avgStartScore > 0 ? Math.round((overallPoints / avgStartScore) * 100) : 0);
      }

      setImprovementData(improvements);
    } catch (error) {
      console.error('Error fetching improvement data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: ImprovementData['status']) => {
    switch (status) {
      case 'improved':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declined':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'same':
        return <Minus className="h-4 w-4 text-yellow-500" />;
      case 'in_progress':
        return <Target className="h-4 w-4 text-blue-500" />;
      default:
        return <Target className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: ImprovementData['status'], improvementPercentage: number | null) => {
    switch (status) {
      case 'improved':
        return <Badge variant="default" className="bg-green-100 text-green-800">+{improvementPercentage}%</Badge>;
      case 'declined':
        return <Badge variant="destructive">{improvementPercentage}%</Badge>;
      case 'same':
        return <Badge variant="secondary">No Change</Badge>;
      case 'in_progress':
        return <Badge variant="outline">In Progress</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  if (isLoading) {
    return <div>Loading improvement data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Overall Improvement Card */}
      {overallImprovement !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span>Overall Course Improvement</span>
            </CardTitle>
            <CardDescription>Your average improvement across all completed chapters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">
                {overallImprovement > 0 ? '+' : ''}{overallImprovement}%
              </div>
              <p className="text-muted-foreground">
                {overallImprovement > 0 
                  ? "Great progress! Keep it up!" 
                  : overallImprovement < 0 
                  ? "Room for improvement - review the material and try again"
                  : "Consistent performance maintained"
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chapter-wise Improvement */}
      <Card>
        <CardHeader>
          <CardTitle>Chapter-wise Progress</CardTitle>
          <CardDescription>Track your improvement from start to end quizzes for each chapter</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {improvementData.map((data) => (
              <div key={data.chapterId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(data.status)}
                  <div>
                    <h4 className="font-medium">{data.chapterTitle}</h4>
                    <div className="text-sm text-muted-foreground">
                      {data.startQuizScore !== null && data.endQuizScore !== null ? (
                        <>Start: {data.startQuizScore}% → End: {data.endQuizScore}%</>
                      ) : data.startQuizScore !== null ? (
                        <>Start: {data.startQuizScore}% (End quiz pending)</>
                      ) : data.endQuizScore !== null ? (
                        <>End: {data.endQuizScore}% (Start quiz not taken)</>
                      ) : (
                        <>No quizzes taken yet</>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {data.improvementPoints !== null && (
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {data.improvementPoints > 0 ? '+' : ''}{data.improvementPoints} points
                      </div>
                    </div>
                  )}
                  {getStatusBadge(data.status, data.improvementPercentage)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImprovementTracker;