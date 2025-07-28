import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Clock, Star, ShoppingCart, Play, Lock, User, GraduationCap, Settings } from 'lucide-react';
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
      <Card className="group relative overflow-hidden border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Thumbnail Section */}
        <div className="relative h-48 w-full overflow-hidden">
          {course.thumbnail_url ? (
            <img 
              src={course.thumbnail_url} 
              alt={course.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-100 via-orange-50 to-slate-50 flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="p-3 bg-white/80 rounded-full mx-auto w-fit backdrop-blur-sm">
                  <BookOpen className="h-8 w-8 text-orange-500" />
                </div>
                <p className="text-sm font-medium text-slate-700">Course Preview</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Course badges overlay */}
          <div className="absolute top-3 right-3 flex flex-col space-y-2">
            {isUniversityCourse && (
              <Badge className="bg-slate-800/90 hover:bg-slate-900 text-white border-0 text-xs px-2 py-1 backdrop-blur-sm">
                University Course
              </Badge>
            )}
            {course.is_free ? (
              <Badge className="bg-emerald-500/90 hover:bg-emerald-600 text-white border-0 text-xs px-2 py-1 font-semibold backdrop-blur-sm">
                FREE
              </Badge>
            ) : (
              course.type === 'public' && !isPurchased && (
                <Badge className="bg-white/90 text-slate-700 border-0 text-xs px-2 py-1 font-medium backdrop-blur-sm">
                  {course.currency} {course.price}
                </Badge>
              )
            )}
          </div>
        </div>

        <CardHeader className="relative z-10 pb-3">
          <div className="space-y-3">
            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              <BookOpen className="h-3 w-3 mr-1" />
              {course.category}
            </div>
            <CardTitle className="text-lg font-bold text-slate-800 group-hover:text-slate-900 transition-colors">
              {course.title}
            </CardTitle>
            <CardDescription className="line-clamp-2 text-slate-600 text-sm leading-relaxed">
              {course.description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 pt-0">
          <div className="space-y-4">
            {/* Progress bar for purchased courses */}
            {(isPurchased || isUniversityCourse) && progress && (
              <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700">Progress</span>
                  <span className="text-sm font-bold text-slate-800">{progress.completion_percentage}%</span>
                </div>
                <div className="relative">
                  <Progress 
                    value={progress.completion_percentage} 
                    className="h-2 bg-slate-200"
                  />
                  <div 
                    className="absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r from-slate-600 to-slate-800 transition-all duration-500"
                    style={{ width: `${progress.completion_percentage}%` }}
                  />
                </div>
                <p className="text-xs text-slate-600">
                  {progress.completed_chapters} of {progress.total_chapters} chapters completed
                </p>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-2">
              <div className="flex space-x-2">
                {(isPurchased || isUniversityCourse) ? (
                  <Button 
                    size="sm" 
                    asChild
                    className="bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 hover:from-orange-600 hover:via-pink-600 hover:to-rose-600 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-lg"
                  >
                    <Link to={`/course/${course.id}`}>
                      <Play className="h-4 w-4 mr-2" />
                      Continue Learning
                    </Link>
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePreviewCourse(course)}
                      className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 font-medium px-3 py-2 rounded-lg transition-all duration-200"
                    >
                      Preview
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handlePurchaseCourse(course.id, course)}
                      className="bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 hover:from-orange-600 hover:via-pink-600 hover:to-rose-600 text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-lg"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {course.is_free ? 'Get Free' : 'Buy Now'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-br from-orange-400 via-pink-400 to-rose-400 rounded-xl shadow-lg">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Skillzage</h1>
                <p className="text-sm text-slate-600 font-medium">
                  Welcome back, <span className="text-slate-800">{profile?.name}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {university && (
                <Badge className="flex items-center space-x-2 bg-gradient-to-r from-orange-100 via-pink-50 to-rose-50 text-orange-800 border-orange-200 hover:from-orange-200 hover:via-pink-100 hover:to-rose-100 px-3 py-1.5 rounded-full font-medium transition-all duration-200">
                  <User className="h-3 w-3" />
                  <span>{university.name}</span>
                </Badge>
              )}
              <Button
                variant={activeTab === 'profile' ? 'default' : 'outline'}
                onClick={() => setActiveTab('profile')}
                size="sm"
                className={`font-medium px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeTab === 'profile' 
                    ? 'bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 hover:from-orange-600 hover:via-pink-600 hover:to-rose-600 text-white shadow-lg' 
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                }`}
              >
                <Settings className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button
                variant={activeTab === 'courses' ? 'default' : 'outline'}
                onClick={() => setActiveTab('courses')}
                size="sm"
                className={`font-medium px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeTab === 'courses' 
                    ? 'bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 hover:from-orange-600 hover:via-pink-600 hover:to-rose-600 text-white shadow-lg' 
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                }`}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Courses
              </Button>
              <Button 
                variant="outline" 
                onClick={signOut}
                className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 font-medium px-4 py-2 rounded-lg transition-all duration-200"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {activeTab === 'profile' ? (
          <StudentProfile />
        ) : previewCourse ? (
          /* Course Preview Modal */
          <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h2 className="text-4xl font-bold text-slate-900">{previewCourse.title}</h2>
                <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">{previewCourse.description}</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setPreviewCourse(null)}
                className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 font-medium px-6 py-2 rounded-lg transition-all duration-200"
              >
                Back to Courses
              </Button>
            </div>
            
            <Card className="border-slate-200 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-orange-50 via-pink-50 to-rose-50 border-b border-orange-100 pb-6">
                <CardTitle className="flex items-center space-x-3 text-xl">
                  <div className="p-2 bg-gradient-to-br from-orange-400 via-pink-400 to-rose-400 rounded-lg shadow-lg">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-slate-900 font-bold">Course Content</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {previewChapters.map((chapter, index) => (
                    <div key={chapter.id} className="group flex items-center justify-between p-5 border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-md transition-all duration-200 bg-white hover:bg-slate-50">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-400 via-pink-400 to-rose-400 rounded-full flex items-center justify-center text-sm font-bold text-white group-hover:from-orange-500 group-hover:via-pink-500 group-hover:to-rose-500 transition-all duration-200 shadow-lg">{index + 1}</div>
                        <div className="space-y-1">
                          <h4 className="font-semibold text-slate-900 group-hover:text-slate-800 transition-colors">{chapter.title}</h4>
                          <p className="text-sm text-slate-600 leading-relaxed">{chapter.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {chapter.is_preview ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 px-3 py-1 rounded-full font-medium">
                            Preview Available
                          </Badge>
                        ) : (
                          <div className="p-2 bg-slate-100 rounded-full">
                            <Lock className="h-4 w-4 text-slate-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 pt-8 border-t border-slate-200">
                  <div className="flex justify-between items-center p-6 bg-gradient-to-r from-orange-50 via-pink-50 to-rose-50 rounded-xl border border-orange-100">
                    <div className="space-y-2">
                      <p className="text-xl font-bold text-slate-900">Ready to start learning?</p>
                      <p className="text-slate-600">
                        {previewCourse.is_free ? (
                          <span className="text-emerald-600 font-semibold">This course is completely free!</span>
                        ) : (
                          <span>Price: <span className="font-semibold text-slate-800">{previewCourse.currency} {previewCourse.price}</span></span>
                        )}
                      </p>
                    </div>
                    <Button 
                      size="lg"
                      onClick={() => handlePurchaseCourse(previewCourse.id, previewCourse)}
                      className="bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 hover:from-orange-600 hover:via-pink-600 hover:to-rose-600 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <ShoppingCart className="h-5 w-5 mr-3" />
                      {previewCourse.is_free ? 'Get Free Course' : 'Buy Now'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-12">
            {/* University Courses */}
            {universityCourses.length > 0 && (
              <section>
                <div className="flex items-center space-x-3 mb-8">
                  <div className="p-2 bg-gradient-to-br from-orange-400 via-pink-400 to-rose-400 rounded-xl shadow-lg">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">Your University Courses</h2>
                    <p className="text-slate-600 mt-1">Courses assigned by your institution</p>
                  </div>
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
                <div className="flex items-center space-x-3 mb-8">
                  <div className="p-2 bg-gradient-to-br from-orange-400 via-pink-400 to-rose-400 rounded-xl shadow-lg">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">My Courses</h2>
                    <p className="text-slate-600 mt-1">Continue your learning journey</p>
                  </div>
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
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-2 bg-gradient-to-br from-orange-400 via-pink-400 to-rose-400 rounded-xl shadow-lg">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Course Marketplace</h2>
                  <p className="text-slate-600 mt-1">Discover new skills and expand your knowledge</p>
                </div>
              </div>
              
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="animate-pulse border-slate-200 bg-white">
                      <CardHeader className="space-y-3">
                        <div className="h-4 bg-slate-200 rounded-lg w-3/4"></div>
                        <div className="space-y-2">
                          <div className="h-3 bg-slate-200 rounded w-full"></div>
                          <div className="h-3 bg-slate-200 rounded w-4/5"></div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-10 bg-slate-200 rounded-lg"></div>
                      </CardContent>
                    </Card>
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
                <Card className="border-slate-200 bg-white">
                  <CardContent className="py-16 text-center">
                    <div className="p-4 bg-slate-100 rounded-full w-fit mx-auto mb-6">
                      <BookOpen className="h-16 w-16 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No courses available</h3>
                    <p className="text-slate-600 max-w-md mx-auto">Check back later for new courses and learning opportunities.</p>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Empty State */}
            {universityCourses.length === 0 && purchasedCourses.length === 0 && publicCourses.length === 0 && !isLoading && (
              <div className="text-center py-20">
                <div className="p-6 bg-slate-100 rounded-full w-fit mx-auto mb-8">
                  <BookOpen className="h-20 w-20 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">No courses found</h3>
                <p className="text-lg text-slate-600 mb-6 max-w-md mx-auto">
                  {!profile?.university_id 
                    ? "Browse our course marketplace to get started on your learning journey!" 
                    : "Your university hasn't assigned any courses yet. Check back soon!"}
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
