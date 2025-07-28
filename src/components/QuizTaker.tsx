import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Trophy } from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  chapter_id: string;
  is_start_quiz: boolean;
  is_end_quiz: boolean;
  passing_score: number;
}

interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  type: 'multiple_choice' | 'true_false';
  options: string[];
  correct_answer: string;
  explanation: string;
  order_index: number;
}

interface QuizTakerProps {
  quiz: Quiz;
  questions: QuizQuestion[];
  onQuizComplete: (score: number, passed: boolean) => void;
  onBack: () => void;
}

const QuizTaker: React.FC<QuizTakerProps> = ({ quiz, questions, onQuizComplete, onBack }) => {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);
    
    // Calculate score
    let correctAnswers = 0;
    questions.forEach(question => {
      if (answers[question.id] === question.correct_answer) {
        correctAnswers++;
      }
    });

    const calculatedScore = Math.round((correctAnswers / questions.length) * 100);
    const passed = calculatedScore >= quiz.passing_score;

    setScore(calculatedScore);
    setShowResults(true);

    // Save quiz attempt to student progress
    try {
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        // Get current progress record
        const { data: progressData } = await supabase
          .from('student_progress')
          .select('*')
          .eq('user_id', user.user.id)
          .eq('chapter_id', quiz.chapter_id)
          .single();

        const quizAttempt = {
          quiz_id: quiz.id,
          score: calculatedScore,
          passed,
          answers,
          completed_at: new Date().toISOString(),
          is_start_quiz: quiz.is_start_quiz,
          is_end_quiz: quiz.is_end_quiz
        };

        let updatedQuizAttempts = [];
        if (progressData?.quiz_attempts) {
          updatedQuizAttempts = Array.isArray(progressData.quiz_attempts) 
            ? [...progressData.quiz_attempts, quizAttempt]
            : [quizAttempt];
        } else {
          updatedQuizAttempts = [quizAttempt];
        }

        await supabase
          .from('student_progress')
          .upsert({
            user_id: user.user.id,
            course_id: progressData?.course_id,
            chapter_id: quiz.chapter_id,
            quiz_attempts: updatedQuizAttempts,
            started_at: progressData?.started_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        toast({
          title: passed ? "Quiz Passed!" : "Quiz Completed",
          description: `You scored ${calculatedScore}%. ${passed ? 'Great job!' : 'Keep practicing!'}`,
          variant: passed ? "default" : "destructive"
        });

        onQuizComplete(calculatedScore, passed);
      }
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
      toast({
        title: "Error",
        description: "Failed to save quiz results",
        variant: "destructive"
      });
    }

    setIsSubmitting(false);
  };

  if (showResults) {
    const passed = score >= quiz.passing_score;
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-8">
          <div className="text-center space-y-6">
            {passed ? (
              <Trophy className="h-16 w-16 text-yellow-500 mx-auto" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            )}
            
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {passed ? "Congratulations!" : "Quiz Completed"}
              </h2>
              <p className="text-lg text-muted-foreground mb-4">
                You scored {score}% on "{quiz.title}"
              </p>
              <p className="text-sm text-muted-foreground">
                {passed 
                  ? `You passed! (Required: ${quiz.passing_score}%)`
                  : `You need ${quiz.passing_score}% to pass. Keep studying!`
                }
              </p>
            </div>

            <Button onClick={onBack} className="w-full max-w-sm">
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) {
    return <div>Loading...</div>;
  }

  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const canProceed = answers[currentQuestion.id];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{quiz.title}</CardTitle>
          <CardDescription>
            Question {currentQuestionIndex + 1}: {currentQuestion.type === 'multiple_choice' ? 'Multiple Choice' : 'True/False'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">{currentQuestion.question}</h3>
            
            <RadioGroup
              value={answers[currentQuestion.id] || ''}
              onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            >
              {currentQuestion.type === 'multiple_choice' ? (
                currentQuestion.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="True" id="true" />
                    <Label htmlFor="true" className="cursor-pointer">True</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="False" id="false" />
                    <Label htmlFor="false" className="cursor-pointer">False</Label>
                  </div>
                </>
              )}
            </RadioGroup>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>

            {isLastQuestion ? (
              <Button
                onClick={handleSubmitQuiz}
                disabled={!canProceed || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Quiz"}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed}
              >
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizTaker;