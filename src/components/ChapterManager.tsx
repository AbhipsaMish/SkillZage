import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Video, FileText, ArrowLeft, Upload, Trash2, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import QuizManager from '@/components/QuizManager';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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
  lock_duration_minutes: number;
  pdf_attachments: string[];
  created_at: string;
}

interface ChapterManagerProps {
  courseId: string;
  courseTitle: string;
  onBack: () => void;
}

const ChapterManager: React.FC<ChapterManagerProps> = ({ courseId, courseTitle, onBack }) => {
  const { toast } = useToast();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedChapterForQuiz, setSelectedChapterForQuiz] = useState<string | null>(null);

  // Form state
  const [chapterForm, setChapterForm] = useState({
    title: '',
    description: '',
    content: '',
    order_index: 1,
    is_preview: false,
    has_start_quiz: false,
    has_end_quiz: false,
    lock_duration_minutes: 0
  });

  useEffect(() => {
    fetchChapters();
  }, [courseId]);

  const fetchChapters = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch chapters",
        variant: "destructive"
      });
    } else {
      setChapters(data || []);
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setChapterForm({
      title: '',
      description: '',
      content: '',
      order_index: chapters.length + 1,
      is_preview: false,
      has_start_quiz: false,
      has_end_quiz: false,
      lock_duration_minutes: 0
    });
    setVideoFile(null);
    setEditingChapter(null);
  };

  const handleFileUpload = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${courseId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('course-videos')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('course-videos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let videoUrl = editingChapter?.video_url || '';

      // Upload video if a new file is selected
      if (videoFile) {
        const uploadedUrl = await handleFileUpload(videoFile);
        if (uploadedUrl) {
          videoUrl = uploadedUrl;
        }
      }

      // Check if this is the last chapter based on order_index
      const isLastChapter = chapterForm.order_index === chapters.length + (editingChapter ? 0 : 1);
      
      const finalChapterData = {
        ...chapterForm,
        course_id: courseId,
        video_url: videoUrl,
        has_end_quiz: chapterForm.has_end_quiz
      };

      let error;
      let newChapterId: string | null = null;

      if (editingChapter) {
        // Update existing chapter
        const { error: updateError } = await supabase
          .from('chapters')
          .update(finalChapterData)
          .eq('id', editingChapter.id);
        error = updateError;
        newChapterId = editingChapter.id;
      } else {
        // Create new chapter
        const { data: insertData, error: insertError } = await supabase
          .from('chapters')
          .insert([finalChapterData])
          .select('id');
        error = insertError;
        newChapterId = insertData?.[0]?.id || null;
      }

      if (error) {
        throw error;
      }

      // If this is the last chapter and we have a new chapter ID, create an end quiz (only for new chapters)
      if (!editingChapter && isLastChapter && newChapterId && chapterForm.has_end_quiz) {
        const quizData = {
          title: `End Quiz - ${finalChapterData.title}`,
          chapter_id: newChapterId,
          is_start_quiz: false,
          is_end_quiz: true,
          passing_score: 70
        };

        const { error: quizError } = await supabase
          .from('quizzes')
          .insert([quizData]);

        if (quizError) {
          console.error('Failed to create end quiz:', quizError);
          toast({
            title: "Warning",
            description: "Chapter created but failed to create end quiz. You can add it manually.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Success",
            description: `Chapter created successfully with end quiz!`,
          });
        }
      } else {
        toast({
          title: "Success",
          description: `Chapter ${editingChapter ? 'updated' : 'created'} successfully`,
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchChapters();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${editingChapter ? 'update' : 'create'} chapter`,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setChapterForm({
      title: chapter.title,
      description: chapter.description || '',
      content: chapter.content || '',
      order_index: chapter.order_index,
      is_preview: chapter.is_preview || false,
      has_start_quiz: chapter.has_start_quiz || false,
      has_end_quiz: chapter.has_end_quiz || false,
      lock_duration_minutes: chapter.lock_duration_minutes || 0
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (chapterId: string) => {
    if (!confirm('Are you sure you want to delete this chapter?')) return;

    const { error } = await supabase
      .from('chapters')
      .delete()
      .eq('id', chapterId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete chapter",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Chapter deleted successfully",
      });
      fetchChapters();
    }
  };

  const openNewChapterDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Show quiz manager if a chapter is selected for quiz management
  if (selectedChapterForQuiz) {
    const selectedChapter = chapters.find(chapter => chapter.id === selectedChapterForQuiz);
    return (
      <QuizManager
        chapterId={selectedChapterForQuiz}
        chapterTitle={selectedChapter?.title || 'Chapter'}
        onBack={() => setSelectedChapterForQuiz(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Manage Chapters</h2>
            <p className="text-muted-foreground">{courseTitle}</p>
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewChapterDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Chapter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingChapter ? 'Edit Chapter' : 'Create New Chapter'}
              </DialogTitle>
              <DialogDescription>
                Add video content, text materials, and configure chapter settings
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="chapter-title">Chapter Title</Label>
                  <Input
                    id="chapter-title"
                    value={chapterForm.title}
                    onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                    placeholder="Enter chapter title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order-index">Order</Label>
                  <Input
                    id="order-index"
                    type="number"
                    min="1"
                    value={chapterForm.order_index}
                    onChange={(e) => setChapterForm({ ...chapterForm, order_index: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chapter-description">Description</Label>
                <ReactQuill
                  id="chapter-description"
                  value={chapterForm.description}
                  onChange={(value) => setChapterForm({ ...chapterForm, description: value })}
                  modules={{
                    toolbar: [
                      [{ 'font': [] }, { 'size': [] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'color': [] }, { 'background': [] }],
                      [{ 'align': [] }],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link'],
                      ['clean']
                    ]
                  }}
                  formats={[
                    'font', 'size', 'bold', 'italic', 'underline', 'strike',
                    'color', 'background', 'align', 'list', 'bullet', 'link'
                  ]}
                  placeholder="Brief description of the chapter"
                  style={{ height: '120px', marginBottom: '80px' }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="video-upload">Video Upload</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  />
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
                {editingChapter?.video_url && !videoFile && (
                  <p className="text-sm text-muted-foreground">
                    Current video: {editingChapter.video_url.split('/').pop()}
                  </p>
                )}
              </div>

            <div className="space-y-2">
             <Label htmlFor="chapter-content">Text Content</Label>
              <ReactQuill
                id="chapter-content"
                value={chapterForm.content}
                onChange={(value) => setChapterForm({ ...chapterForm, content: value })}
                modules={{
                  toolbar: [
                    [{ 'font': [] }, { 'size': [] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'align': [] }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link', 'image'],
                    ['blockquote', 'code-block'],
                    ['clean']
                  ]
                }}
                formats={[
                  'font', 'size', 'bold', 'italic', 'underline', 'strike',
                  'color', 'background', 'align', 'list', 'bullet', 'link', 'image',
                  'blockquote', 'code-block'
                ]}
                placeholder="Chapter text content, notes, or materials"
                style={{ height: '200px', marginBottom: '80px' }}
              />
            </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-preview"
                    checked={chapterForm.is_preview}
                    onCheckedChange={(checked) => setChapterForm({ ...chapterForm, is_preview: checked })}
                  />
                  <Label htmlFor="is-preview">Free Preview</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lock-duration">Lock Duration</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="lock-duration"
                      type="number"
                      min="0"
                      value={Math.floor(chapterForm.lock_duration_minutes / (24 * 60))}
                      onChange={(e) => {
                        const days = parseInt(e.target.value) || 0;
                        const currentHours = Math.floor((chapterForm.lock_duration_minutes % (24 * 60)) / 60);
                        const currentMinutes = chapterForm.lock_duration_minutes % 60;
                        setChapterForm({ 
                          ...chapterForm, 
                          lock_duration_minutes: (days * 24 * 60) + (currentHours * 60) + currentMinutes 
                        });
                      }}
                      placeholder="Days"
                    />
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      value={Math.floor((chapterForm.lock_duration_minutes % (24 * 60)) / 60)}
                      onChange={(e) => {
                        const hours = parseInt(e.target.value) || 0;
                        const currentDays = Math.floor(chapterForm.lock_duration_minutes / (24 * 60));
                        const currentMinutes = chapterForm.lock_duration_minutes % 60;
                        setChapterForm({ 
                          ...chapterForm, 
                          lock_duration_minutes: (currentDays * 24 * 60) + (hours * 60) + currentMinutes 
                        });
                      }}
                      placeholder="Hours"
                    />
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={chapterForm.lock_duration_minutes % 60}
                      onChange={(e) => {
                        const minutes = parseInt(e.target.value) || 0;
                        const currentDays = Math.floor(chapterForm.lock_duration_minutes / (24 * 60));
                        const currentHours = Math.floor((chapterForm.lock_duration_minutes % (24 * 60)) / 60);
                        setChapterForm({ 
                          ...chapterForm, 
                          lock_duration_minutes: (currentDays * 24 * 60) + (currentHours * 60) + minutes 
                        });
                      }}
                      placeholder="Minutes"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Days - Hours - Minutes format
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="has-start-quiz"
                      checked={chapterForm.has_start_quiz}
                      onCheckedChange={(checked) => setChapterForm({ ...chapterForm, has_start_quiz: checked })}
                    />
                    <Label htmlFor="has-start-quiz">Start Quiz</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="has-end-quiz"
                      checked={chapterForm.has_end_quiz}
                      onCheckedChange={(checked) => setChapterForm({ ...chapterForm, has_end_quiz: checked })}
                    />
                    <Label htmlFor="has-end-quiz">End Quiz</Label>
                  </div>
                </div>
                
                {(() => {
                  const isLastChapter = chapterForm.order_index === chapters.length + (editingChapter ? 0 : 1);
                  return (
                    <>
                      {isLastChapter && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Note:</strong> This appears to be the last chapter. Enable "End Quiz" to automatically create 
                            a final assessment for students to take after completing the entire course.
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? 'Uploading...' : editingChapter ? 'Update Chapter' : 'Create Chapter'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Chapters List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Course Chapters</span>
          </CardTitle>
          <CardDescription>
            Manage your course content and structure
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading chapters...</p>
          ) : chapters.length === 0 ? (
            <div className="text-center py-8">
              <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No chapters yet</p>
              <Button onClick={openNewChapterDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Chapter
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {chapters.map((chapter) => (
                <div key={chapter.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                          Chapter {chapter.order_index}
                        </span>
                        {chapter.is_preview && (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                            Free Preview
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold mb-1">{chapter.title}</h4>
                      {chapter.description && (
                        <p className="text-sm text-muted-foreground mb-2">{chapter.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        {chapter.video_url && (
                          <span className="flex items-center space-x-1">
                            <Video className="h-3 w-3" />
                            <span>Video</span>
                          </span>
                        )}
                        {chapter.content && (
                          <span className="flex items-center space-x-1">
                            <FileText className="h-3 w-3" />
                            <span>Text Content</span>
                          </span>
                        )}
                        {chapter.has_start_quiz && (
                          <button
                            className="text-blue-600 hover:underline text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedChapterForQuiz(chapter.id);
                            }}
                          >
                            Start Quiz
                          </button>
                        )}
                        {chapter.has_end_quiz && (
                          <button
                            className="text-blue-600 hover:underline text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedChapterForQuiz(chapter.id);
                            }}
                          >
                            End Quiz
                          </button>
                        )}
                        {chapter.lock_duration_minutes > 0 && (
                          <span>
                            Lock: {Math.floor(chapter.lock_duration_minutes / (24 * 60))}d{' '}
                            {Math.floor((chapter.lock_duration_minutes % (24 * 60)) / 60)}h{' '}
                            {chapter.lock_duration_minutes % 60}m
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(chapter)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(chapter.id)}
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
  );
};

export default ChapterManager;
