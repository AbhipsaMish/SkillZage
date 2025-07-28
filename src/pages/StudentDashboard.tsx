import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Clock, Star, ShoppingCart, Play, Lock, User, GraduationCap, Settings, Users } from 'lucide-react';
import StudentProfile from '@/components/StudentProfile';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  type: 'public' | 'university';
  category: string;
  thumbnail_url: string | null;
  university_id: string | null;
  is_active: boolean;
  is_free: boolean;
}

interface Chapter {
  id: string;
  title: string;
  description: string;
  order_index: number;
  is_preview: boolean;
}

interface CourseProgress {
  course_id: string;
  completed_chapters: number;
  total_chapters: number;
  completion_percentage: number;
}

interface University {
  id: string;
  name: string;
  code: string;
}

const StudentDashboard = () => {
  const { profile, user, signOut } = useAuth();
  const { toast } = useToast();
  const [universityCourses, setUniversityCourses] = useState<Course[]>([]);
  const [publicCourses, setPublicCourses] = useState<Course[]>([]);
  const [purchasedCourses, setPurchasedCourses] = useState<Course[]>([]);
  const [university, setUniversity] = useState<University | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'courses' | 'profile'>('courses');
  const [courseProgress, setCourseProgress] = useState<Record<string, CourseProgress>>({});
  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);
  const [previewChapters, setPreviewChapters] = useState<Chapter[]>([]);

  useEffect(() => {
    if (profile) {
      fetchCourses();
      fetchCourseProgress();
      if (profile.university_id) {
        fetchUniversity();
      }
    }
  }, [profile]);

  const fetchUniversity = async () => {
    if (!profile?.university_id) return;

    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .eq('id', profile.university_id)
      .single();

    if (error) {
      console.error('Error fetching university:', error);
    } else {
      setUniversity(data);
    }
  };

  const fetchCourses = async () => {
    setIsLoading(true);

    // Fetch university-specific courses if user belongs to a university
    if (profile?.university_id) {
      const { data: uniCourses, error: uniError } = await supabase
        .from('courses')
        .select('*')
        .eq('university_id', profile.university_id)
        .eq('is_active', true);

      if (uniError) {
        console.error('Error fetching university courses:', uniError);
      } else {
        setUniversityCourses(uniCourses || []);
      }
    }

    // Fetch public courses
    const { data: pubCourses, error: pubError } = await supabase
      .from('courses')
      .select('*')
      .eq('type', 'public')
      .eq('is_active', true);

    if (pubError) {
      console.error('Error fetching public courses:', pubError);
    } else {
      setPublicCourses(pubCourses || []);
    }

    // Fetch purchased courses
    if (profile?.purchased_courses && profile.purchased_courses.length > 0) {
      const { data: purchCourses, error: purchError } = await supabase
        .from('courses')
        .select('*')
        .in('id', profile.purchased_courses);

      if (purchError) {
        console.error('Error fetching purchased courses:', purchError);
      } else {
        setPurchasedCourses(purchCourses || []);
      }
    }

    setIsLoading(false);
  };

  const fetchCourseProgress = async () => {
    if (!profile?.purchased_courses || profile.purchased_courses.length === 0) return;

    const progressData: Record<string, CourseProgress> = {};

    for (const courseId of profile.purchased_courses) {
      // Get total chapters for the course
      const { data: chapters } = await supabase
        .from('chapters')
        .select('id')
        .eq('course_id', courseId);

      // Get completed chapters for the user
      const { data: progress } = await supabase
        .from('student_progress')
        .select('chapter_id')
        .eq('course_id', courseId)
        .eq('user_id', profile.user_id)
        .eq('completed', true);

      const totalChapters = chapters?.length || 0;
      const completedChapters = progress?.length || 0;
      const completionPercentage = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

      progressData[courseId] = {
        course_id: courseId,
        completed_chapters: completedChapters,
        total_chapters: totalChapters,
        completion_percentage: completionPercentage
      };
    }

    setCourseProgress(progressData);
  };

  const handlePreviewCourse = async (course: Course) => {
    setPreviewCourse(course);
    
    // Fetch course chapters for preview
    const { data: chapters, error } = await supabase
      .from('chapters')
      .select('id, title, description, order_index, is_preview')
      .eq('course_id', course.id)
      .order('order_index');

    if (error) {
      console.error('Error fetching chapters:', error);
      toast({
        title: "Error",
        description: "Failed to load course preview",
        variant: "destructive"
      });
    } else {
      setPreviewChapters(chapters || []);
    }
  };

  const handlePurchaseCourse = async (courseId: string, course: Course) => {
    // If course is free, add it directly to purchased courses
    if (course.is_free) {
      try {
        const updatedPurchasedCourses = [...(profile?.purchased_courses || []), courseId];
        
        const { error } = await supabase
          .from('profiles')
          .update({ purchased_courses: updatedPurchasedCourses })
          .eq('user_id', profile?.user_id);

        if (error) throw error;

        toast({
          title: "Course Added!",
          description: "Free course has been added to your library.",
        });
        
        // Refresh courses to update UI
        fetchCourses();
      } catch (error) {
        console.error('Error adding free course:', error);
        toast({
          title: "Error",
          description: "Failed to add course. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      // This would integrate with payment gateway for paid courses
      toast({
        title: "Payment Integration",
        description: "Payment system coming soon!",
      });
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress === 0) return 'bg-[#9FABBA]';
    if (progress < 50) return 'bg-[#FA8231]';
    if (progress < 80) return 'bg-[#FED330]';
    return 'bg-[#EFB72E]';
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const CourseCard = ({ course, isPurchased = false, isUniversityCourse = false }: { 
    course: Course; 
    isPurchased?: boolean; 
    isUniversityCourse?: boolean; 
  }) => {
    const progress = courseProgress[course.id];
    
    return (
      <div className="bg-[#FFFFFF] rounded-xl shadow-sm overflow-hidden border border-[#9FABBA] hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative">
        <div className="relative">
          <img 
            src={course.thumbnail_url || 'https://via.placeholder.com/400x200/F0F0F0/999999?text=Course+Image'} 
            alt={course.title}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-4 right-4 bg-[#FFFFFF] px-2 py-1 rounded-lg text-sm font-bold text-[#000000]">
            {course.is_free ? 'FREE' : `${course.currency} ${course.price}`}
          </div>
          {(isPurchased || isUniversityCourse) && progress && progress.completion_percentage > 0 && (
            <div className="absolute top-4 left-4 bg-[#11283F] text-[#FFFFFF] px-2 py-1 rounded-lg text-xs font-medium">
              In Progress
            </div>
          )}
          {isUniversityCourse && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="secondary" className="bg-[#11283F] text-[#FFFFFF] text-xs">University Course</Badge>
            </div>
          )}
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#11283F] uppercase tracking-wider">
              {course.category}
            </span>
            <div className="flex items-center space-x-1">
              <Star className="text-[#EFB72E] fill-current" size={16} />
              <span className="text-sm text-[#4B6584]">4.8</span>
            </div>
          </div>

          <h3 className="text-lg font-bold text-[#000000] mb-2 line-clamp-2">{course.title}</h3>

          <p className="text-sm text-[#4B6584] mb-4 line-clamp-2">{course.description}</p>

          <div className="flex items-center justify-between text-sm text-[#9FABBA] mb-4">
            <div className="flex items-center space-x-1">
              <Users size={16} />
              <span>2.5k</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock size={16} />
              <span>8 weeks</span>
            </div>
          </div>

          {(isPurchased || isUniversityCourse) && progress && progress.completion_percentage > 0 && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-[#4B6584]">Progress</span>
                <span className="text-sm font-medium text-[#000000]">{progress.completion_percentage}%</span>
              </div>
              <div className="w-full bg-[#9FABBA] rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getProgressColor(progress.completion_percentage)}`}
                  style={{ width: `${progress.completion_percentage}%` }}
                />
              </div>
            </div>
          )}

          {(isPurchased || isUniversityCourse) ? (
            <Link to={`/course/${course.id}`}>
              <button className="w-full bg-gradient-to-r from-[#11283F] to-[#4B6584] text-[#FFFFFF] py-3 px-4 rounded-lg font-medium hover:from-[#000000] hover:to-[#11283F] transition-all duration-200 flex items-center justify-center space-x-2">
                <Play size={18} />
                <span>{progress && progress.completion_percentage > 0 ? 'Continue Learning' : 'Start Course'}</span>
              </button>
            </Link>
          ) : (
            <div className="flex space-x-2">
              <button 
                onClick={() => handlePreviewCourse(course)}
                className="flex-1 bg-[#9FABBA] text-[#FFFFFF] py-2 px-3 rounded-lg font-medium hover:bg-[#7A8B9A] transition-all duration-200 flex items-center justify-center space-x-1"
              >
                <BookOpen size={16} />
                <span>Preview</span>
              </button>
              <button 
                onClick={() => handlePurchaseCourse(course.id, course)}
                className="flex-1 bg-[#FA8231] text-[#FFFFFF] py-2 px-3 rounded-lg font-medium hover:bg-[#E8741C] transition-all duration-200 flex items-center justify-center space-x-1"
              >
                <ShoppingCart size={16} />
                <span>{course.is_free ? 'Get Free' : 'Buy Now'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Skillzage</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {profile?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {university && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>{university.name}</span>
              </Badge>
            )}
            <Button
              variant={activeTab === 'profile' ? 'default' : 'outline'}
              onClick={() => setActiveTab('profile')}
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              Profile
            </Button>
            <Button
              variant={activeTab === 'courses' ? 'default' : 'outline'}
              onClick={() => setActiveTab('courses')}
              size="sm"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Courses
            </Button>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {activeTab === 'profile' ? (
          <StudentProfile />
        ) : previewCourse ? (
          /* Course Preview Modal */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">{previewCourse.title}</h2>
                <p className="text-muted-foreground mt-2">{previewCourse.description}</p>
              </div>
              <Button variant="outline" onClick={() => setPreviewCourse(null)}>
                Back to Courses
              </Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-6 w-6" />
                  <span>Course Content</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {previewChapters.map((chapter, index) => (
                    <div key={chapter.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{chapter.title}</h4>
                          <p className="text-sm text-muted-foreground">{chapter.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {chapter.is_preview ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Preview Available
                          </Badge>
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="font-medium">Ready to start learning?</p>
                    <p className="text-sm text-muted-foreground">
                      {previewCourse.is_free ? 'This course is completely free!' : `Price: ${previewCourse.currency} ${previewCourse.price}`}
                    </p>
                  </div>
                  <Button 
                    size="lg"
                    onClick={() => handlePurchaseCourse(previewCourse.id, previewCourse)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {previewCourse.is_free ? 'Get Free Course' : 'Buy Now'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-8">
            {/* University Courses */}
            {universityCourses.length > 0 && (
              <section>
                <div className="flex items-center space-x-2 mb-6">
                  <GraduationCap className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">Your University Courses</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {universityCourses.map((course) => (
                    <CourseCard 
                      key={course.id} 
                      course={course} 
                      isUniversityCourse={true}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Purchased Courses */}
            {purchasedCourses.length > 0 && (
              <section>
                <div className="flex items-center space-x-2 mb-6">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-bold">My Courses</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {purchasedCourses.map((course) => (
                    <CourseCard 
                      key={course.id} 
                      course={course} 
                      isPurchased={true}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Public Course Marketplace */}
            <section>
              <div className="flex items-center space-x-2 mb-6">
                <ShoppingCart className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Course Marketplace</h2>
              </div>
              
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-[#FFFFFF] rounded-xl shadow-sm overflow-hidden border border-[#9FABBA] animate-pulse">
                      <div className="w-full h-48 bg-gray-300"></div>
                      <div className="p-6">
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-full mb-4"></div>
                        <div className="h-8 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : publicCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {publicCourses
                    .filter(course => !profile?.purchased_courses?.includes(course.id))
                    .map((course) => (
                      <CourseCard 
                        key={course.id} 
                        course={course} 
                        isPurchased={false}
                      />
                    ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No courses available yet.</p>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Empty State */}
            {universityCourses.length === 0 && purchasedCourses.length === 0 && publicCourses.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No courses found</h3>
                <p className="text-muted-foreground mb-4">
                  {!profile?.university_id 
                    ? "Browse our course marketplace to get started!" 
                    : "Your university hasn't assigned any courses yet."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;