import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, Edit, ArrowLeft, HelpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Quiz {
  id: string;
  title: string;
  chapter_id: string;
  is_start_quiz: boolean;
  is_end_quiz: boolean;
  passing_score: number;
  created_at: string;
}

interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  type: 'multiple_choice' | 'true_false';
  options: any;
  correct_answer: string;
  explanation: string;
  order_index: number;
}

interface QuizManagerProps {
  chapterId: string;
  chapterTitle: string;
  onBack: () => void;
}

const QuizManager: React.FC<QuizManagerProps> = ({ chapterId, chapterTitle, onBack }) => {
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);

  // Quiz form state
  const [quizForm, setQuizForm] = useState({
    title: '',
    passing_score: 70
  });

  // Question form state
  const [questionForm, setQuestionForm] = useState({
    question: '',
    type: 'multiple_choice' as 'multiple_choice' | 'true_false',
    options: [''],
    correct_answer: '',
    explanation: '',
    order_index: 1
  });

  useEffect(() => {
    fetchQuizzes();
  }, [chapterId]);

  useEffect(() => {
    if (selectedQuiz) {
      fetchQuestions(selectedQuiz.id);
    }
  }, [selectedQuiz]);

  const fetchQuizzes = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('chapter_id', chapterId)
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch quizzes",
        variant: "destructive"
      });
    } else {
      setQuizzes(data || []);
      if (data && data.length > 0 && !selectedQuiz) {
        setSelectedQuiz(data[0]);
      }
    }
    setIsLoading(false);
  };

  const fetchQuestions = async (quizId: string) => {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', quizId)
      .order('order_index', { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch questions",
        variant: "destructive"
      });
    } else {
      setQuestions(data || []);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-determine quiz type based on existing quizzes
    const existingStartQuiz = quizzes.find(q => q.is_start_quiz);
    const existingEndQuiz = quizzes.find(q => q.is_end_quiz);
    
    let isStartQuiz = false;
    let isEndQuiz = false;
    
    if (!existingStartQuiz) {
      isStartQuiz = true;
    } else if (!existingEndQuiz) {
      isEndQuiz = true;
    } else {
      toast({
        title: "Error",
        description: "Both start and end quizzes already exist for this chapter.",
        variant: "destructive"
      });
      return;
    }
    
    const { data, error } = await supabase
      .from('quizzes')
      .insert([{
        ...quizForm,
        chapter_id: chapterId,
        is_start_quiz: isStartQuiz,
        is_end_quiz: isEndQuiz
      }])
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create quiz",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: `${isStartQuiz ? 'Start' : 'End'} quiz created successfully`,
      });
      setQuizForm({ title: '', passing_score: 70 });
      setIsDialogOpen(false);
      fetchQuizzes();
      setSelectedQuiz(data);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuiz) return;

    const formattedOptions = questionForm.type === 'multiple_choice' 
      ? questionForm.options.filter(opt => opt.trim() !== '')
      : questionForm.type === 'true_false' 
      ? ['True', 'False']
      : null;

    const questionData = {
      ...questionForm,
      quiz_id: selectedQuiz.id,
      options: formattedOptions,
      order_index: questions.length + 1
    };

    let error;
    if (editingQuestion) {
      const { error: updateError } = await supabase
        .from('quiz_questions')
        .update(questionData)
        .eq('id', editingQuestion.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('quiz_questions')
        .insert([questionData]);
      error = insertError;
    }

    if (error) {
      toast({
        title: "Error",
        description: `Failed to ${editingQuestion ? 'update' : 'create'} question`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: `Question ${editingQuestion ? 'updated' : 'created'} successfully`,
      });
      resetQuestionForm();
      setIsQuestionDialogOpen(false);
      fetchQuestions(selectedQuiz.id);
    }
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      question: '',
      type: 'multiple_choice',
      options: [''],
      correct_answer: '',
      explanation: '',
      order_index: 1
    });
    setEditingQuestion(null);
  };

  const handleEditQuestion = (question: QuizQuestion) => {
    setEditingQuestion(question);
    setQuestionForm({
      question: question.question,
      type: question.type,
options: question.options && question.options.length > 0 ? question.options : [''],
      correct_answer: question.correct_answer,
      explanation: question.explanation || '',
      order_index: question.order_index
    });
    setIsQuestionDialogOpen(true);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    const { error } = await supabase
      .from('quiz_questions')
      .delete()
      .eq('id', questionId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
      if (selectedQuiz) {
        fetchQuestions(selectedQuiz.id);
      }
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This will also delete all its questions.')) return;

    // First delete all questions for this quiz
    const { error: questionsError } = await supabase
      .from('quiz_questions')
      .delete()
      .eq('quiz_id', quizId);

    if (questionsError) {
      toast({
        title: "Error",
        description: "Failed to delete quiz questions",
        variant: "destructive"
      });
      return;
    }

    // Then delete the quiz
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete quiz",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Quiz deleted successfully",
      });
      fetchQuizzes();
      if (selectedQuiz?.id === quizId) {
        setSelectedQuiz(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chapter
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Quiz Manager</h2>
            <p className="text-muted-foreground">{chapterTitle}</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Quiz
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Quiz</DialogTitle>
              <DialogDescription>
                Create a quiz for this chapter
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateQuiz} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quiz-title">Quiz Title</Label>
                <Input
                  id="quiz-title"
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  placeholder="Enter quiz title"
                  required
                />
              </div>

              {/* Show existing quizzes info */}
              {(() => {
                const existingStartQuiz = quizzes.find(q => q.is_start_quiz);
                const existingEndQuiz = quizzes.find(q => q.is_end_quiz);
                
                if (existingStartQuiz && existingEndQuiz) {
                  return (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>Both quizzes exist:</strong> Start quiz "{existingStartQuiz.title}" and End quiz "{existingEndQuiz.title}". 
                        You cannot create more quizzes for this chapter.
                      </p>
                    </div>
                  );
                } else if (existingStartQuiz) {
                  return (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Info:</strong> Start quiz exists. This will create an End quiz.
                      </p>
                    </div>
                  );
                } else if (existingEndQuiz) {
                  return (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Info:</strong> End quiz exists. This will create a Start quiz.
                      </p>
                    </div>
                  );
                } else {
                  return (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <strong>Info:</strong> No quizzes exist. This will create a Start quiz.
                      </p>
                    </div>
                  );
                }
              })()}

              <div className="space-y-2">
                <Label htmlFor="passing-score">Passing Score (%)</Label>
                <Input
                  id="passing-score"
                  type="number"
                  min="0"
                  max="100"
                  value={quizForm.passing_score}
                  onChange={(e) => setQuizForm({ ...quizForm, passing_score: parseInt(e.target.value) || 70 })}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Quiz</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quiz List */}
        <Card>
          <CardHeader>
            <CardTitle>Quizzes</CardTitle>
            <CardDescription>Select a quiz to manage questions</CardDescription>
          </CardHeader>
          <CardContent>
            {quizzes.length === 0 ? (
              <p className="text-muted-foreground text-sm">No quizzes created yet</p>
            ) : (
              <div className="space-y-2">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className={`p-3 rounded-lg border ${
                      selectedQuiz?.id === quiz.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                    }`}
                  >
                    <div 
                      className="cursor-pointer"
                      onClick={() => setSelectedQuiz(quiz)}
                    >
                      <h4 className="font-medium">{quiz.title}</h4>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                        {quiz.is_start_quiz && <span>Start</span>}
                        {quiz.is_end_quiz && <span>End</span>}
                        <span>Pass: {quiz.passing_score}%</span>
                      </div>
                    </div>
                    <div className="flex justify-end mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteQuiz(quiz.id);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Questions Management */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Questions</CardTitle>
                  <CardDescription>
                    {selectedQuiz ? `Manage questions for "${selectedQuiz.title}"` : 'Select a quiz to manage questions'}
                  </CardDescription>
                </div>
                {selectedQuiz && (
                  <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={resetQuestionForm}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingQuestion ? 'Edit Question' : 'Add New Question'}
                        </DialogTitle>
                      </DialogHeader>
                      
                      <form onSubmit={handleCreateQuestion} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="question">Question</Label>
                          <Textarea
                            id="question"
                            value={questionForm.question}
                            onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                            placeholder="Enter your question"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="question-type">Question Type</Label>
                          <Select
                            value={questionForm.type}
                            onValueChange={(value: 'multiple_choice' | 'true_false') => 
                              setQuestionForm({ ...questionForm, type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                              <SelectItem value="true_false">True/False</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                      {questionForm.type === 'multiple_choice' && (
  <div className="space-y-2">
    <Label>Options</Label>
    {questionForm.options.map((option, index) => (
      <div key={index} className="flex gap-2 mb-2">
        <Input
          value={option}
          onChange={(e) => {
            const newOptions = [...questionForm.options];
            newOptions[index] = e.target.value;
            setQuestionForm({ ...questionForm, options: newOptions });
          }}
          placeholder={`Option ${index + 1}`}
        />
        {questionForm.options.length > 1 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const newOptions = questionForm.options.filter((_, i) => i !== index);
              setQuestionForm({ ...questionForm, options: newOptions });
            }}
          >
            Remove
          </Button>
        )}
      </div>
    ))}
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setQuestionForm({ ...questionForm, options: [...questionForm.options, ''] })}
    >
      Add Option
    </Button>
  </div>
)}
                        <div className="space-y-2">
                          <Label htmlFor="correct-answer">Correct Answer</Label>
                          {questionForm.type === 'multiple_choice' ? (
                            <Select
                              value={questionForm.correct_answer}
                              onValueChange={(value) => setQuestionForm({ ...questionForm, correct_answer: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select correct option" />
                              </SelectTrigger>
                              <SelectContent>
                                {questionForm.options.map((option, index) => (
                                  option.trim() && (
                                    <SelectItem key={index} value={option}>
                                      {option}
                                    </SelectItem>
                                  )
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Select
                              value={questionForm.correct_answer}
                              onValueChange={(value) => setQuestionForm({ ...questionForm, correct_answer: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="True">True</SelectItem>
                                <SelectItem value="False">False</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="explanation">Explanation (Optional)</Label>
                          <Textarea
                            id="explanation"
                            value={questionForm.explanation}
                            onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                            placeholder="Explain why this is the correct answer"
                          />
                        </div>

                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">
                            {editingQuestion ? 'Update Question' : 'Add Question'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedQuiz ? (
                <div className="text-center py-8">
                  <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a quiz to manage questions</p>
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-8">
                  <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No questions yet</p>
                  <Button onClick={() => { resetQuestionForm(); setIsQuestionDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Question
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <div key={question.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                              Q{index + 1}
                            </span>
                            <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded">
                              {question.type.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="font-medium mb-2">{question.question}</p>
                          {question.type === 'multiple_choice' && question.options && (
                            <div className="text-sm text-muted-foreground">
                              Options: {(question.options as string[]).join(', ')}
                            </div>
                          )}
                          <div className="text-sm text-green-600 mt-1">
                            Correct: {question.correct_answer}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditQuestion(question)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteQuestion(question.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuizManager;
