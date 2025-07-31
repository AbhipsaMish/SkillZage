import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Clock, Star, ShoppingCart, Play, Lock, User, GraduationCap, Settings, Menu, X } from 'lucide-react';
import StudentProfile from '@/components/StudentProfile';
import logo from "../../src/assets/skillzage-logo-final.svg";
import Footer from "../../components/Footer"

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      <Card className="group relative overflow-hidden border-slate-200 hover:border-slate-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white p-4 sm:p-6 md:p-8 flex flex-col h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Thumbnail Section */}
        <div className="relative h-36 xs:h-40 sm:h-48 md:h-56 lg:h-64 w-full overflow-hidden rounded-xl mb-4 sm:mb-6">
          {course.thumbnail_url ? (
            <img 
              src={course.thumbnail_url} 
              alt={course.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-slate-800/10 flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="p-3 bg-white/80 rounded-full mx-auto w-fit backdrop-blur-sm">
                  <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-slate-700">Course Preview</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Course badges overlay */}
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex flex-col space-y-1 sm:space-y-2">
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

        <CardHeader className="relative z-10 pb-2 p-2 sm:p-4 md:p-6">
          <div className="space-y-2 sm:space-y-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              {course.category}
            </div>
            <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-slate-800 group-hover:text-slate-900 transition-colors line-clamp-2">
              {course.title}
            </CardTitle>
            <div
              className="line-clamp-2 text-slate-600 text-sm md:text-base leading-relaxed"
              dangerouslySetInnerHTML={{ __html: course.description }}
            />
          </div>
        </CardHeader>
        <CardContent className="relative z-10 pt-0 p-4 sm:p-6 md:p-8 flex flex-col flex-1">
          <div className="space-y-3 sm:space-y-5 flex-1">
            {/* Progress bar for purchased courses */}
            {(isPurchased || isUniversityCourse) && progress && (
              <div className="sm:space-y-3 p-0">
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

            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center pt-2 space-y-2 sm:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full">
                {(isPurchased || isUniversityCourse) ? (
                  <Button 
                    size="sm" 
                    asChild
                    className="w-full bg-[#11283F] hover:bg-[#1A344F] text-white font-medium rounded-lg transition-all duration-200 hover:shadow-lg text-xs py-3"
                  >
                    <Link to={`/course/${course.id}`}>
                      <Play className="h-4 w-4 mr-1" />
                      <span className="hidden xs:inline">Continue Learning</span>
                      <span className="xs:hidden">Learn</span>
                    </Link>
                  </Button>
                ) : (
                  <div className="flex flex-col sm:flex-row w-full sm:space-x-2 space-y-2 sm:space-y-0">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePreviewCourse(course)}
                      className="w-full sm:w-1/2 border-slate-300 text-slate-700 hover:bg-[#1A344F] hover:border-slate-400 font-medium px-3 py-3 rounded-lg transition-all duration-200"
                    >
                      Preview
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handlePurchaseCourse(course.id, course)}
                      className="w-full sm:w-1/2 bg-[#11283F] hover:bg-[#1A344F] text-white font-medium px-3 py-3 rounded-lg transition-all duration-200 hover:shadow-lg text-xs"
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
    <>
    <div className="min-h-screen bg-[#F5F5F5] from-slate-50 to-white">
      {/* Header */}
     <header className="border-b border-[#9FABBA]/30 bg-white sticky top-0 z-50">
        <div className="px-2 sm:px-4 lg:px-6 py-0">
          <div className="flex justify-between items-center max-h-[100px]">
            <div className="flex items-center flex-1 min-w-0">
              <div>
                <img 
                  src={logo} 
                  alt="Skillzage Logo" 
                  className="logo" 
                  style={{ height: "100px", width: "100px", objectFit: "contain" }}
                  loading="lazy"
                />
              </div>
              <div className="leading-tight">
                <h1 className="text-xl lg:text-2xl font-bold text-[#000000]">Skillzage</h1>
                <p className="text-sm text-[#000000] font-medium">
                  Welcome back, <span className="text-[#000000] font-medium">{profile?.name}</span>
                </p>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="flex items-center gap-2 lg:gap-4">
              {university && (
                <Badge className="hidden sm:flex items-center space-x-2 text-[#11283F] border-[#9FABBA]/30 px-3 lg:px-4 py-1.5 rounded-full font-medium transition-all duration-200">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline truncate max-w-20">{university.name}</span>
                </Badge>
              )}
              
              {/* Desktop Navigation */}
              <div className="hidden sm:flex items-center gap-3">
                <Button
                  variant={activeTab === 'profile' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('profile')}
                  size="sm"
                  className={`font-medium px-4 lg:px-5 py-1.5 rounded-xl transition-all duration-200 ${
                    activeTab === 'profile' 
                      ? 'bg-[#11283F] hover:bg-[#1A344F] text-white shadow-lg' 
                      : 'border-[#9FABBA] text-[#4B6584] hover:bg-[#9FABBA]/10 hover:border-[#4B6584]'
                  }`}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Profile</span>
                </Button>
                <Button
                  variant={activeTab === 'courses' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('courses')}
                  size="sm"
                  className={`font-medium px-4 lg:px-5 py-1.5 rounded-xl transition-all duration-200 ${
                    activeTab === 'courses' 
                      ? 'bg-[#11283F] hover:bg-[#1A344F] text-white shadow-lg' 
                      : 'border-[#9FABBA] text-[#4B6584] hover:bg-[#9FABBA]/10 hover:border-[#4B6584]'
                  }`}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Courses</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={signOut}
                  className="border-[#9FABBA] text-[#4B6584] hover:bg-[#9FABBA]/10 hover:border-[#4B6584] font-medium px-4 lg:px-5 py-1.5 rounded-xl transition-all duration-200"
                >
                  <span className="hidden sm:inline">Sign Out</span>
                  <span className="sm:hidden">Out</span>
                </Button>
              </div>

              {/* Mobile menu button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="sm:hidden p-2 border-[#9FABBA] text-[#4B6584] hover:bg-[#9FABBA]/10"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMobileMenuOpen && (
            <div className="sm:hidden mt-3 pt-3 border-t border-[#9FABBA]/30 space-y-2">
              {university && (
                <div className="mb-2">
                  <Badge className="bg-[#11283F] text-white font-medium px-3 py-1.5 rounded-lg text-xs">
                    <User className="h-3 w-3 mr-1" />
                    <span>{university.name}</span>
                  </Badge>
                </div>
              )}
              <Button
                variant={activeTab === 'profile' ? 'default' : 'outline'}
                onClick={() => {
                  setActiveTab('profile');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full justify-start text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200 ${
                  activeTab === 'profile' 
                    ? 'bg-[#11283F] hover:bg-[#1A344F] text-white shadow-lg' 
                    : 'border-[#9FABBA] text-[#4B6584] hover:bg-[#9FABBA]/10 hover:border-[#4B6584]'
                }`}
              >
                <Settings className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button
                variant={activeTab === 'courses' ? 'default' : 'outline'}
                onClick={() => {
                  setActiveTab('courses');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full justify-start text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200 ${
                  activeTab === 'courses' 
                    ? 'bg-[#11283F] hover:bg-[#1A344F] text-white shadow-lg' 
                    : 'border-[#9FABBA] text-[#4B6584] hover:bg-[#9FABBA]/10 hover:border-[#4B6584]'
                }`}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Courses
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  signOut();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full justify-start border-[#9FABBA] text-[#4B6584] hover:bg-[#9FABBA]/10 hover:border-[#4B6584] font-medium px-4 py-2 rounded-xl transition-all duration-200"
              >
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </header>

<div className="mx-auto max-w-[1300px] px-6 sm:px-12 lg:px-20 py-8 sm:py-12 bg-[#F5F5F5]">
          {activeTab === 'profile' ? (
          <StudentProfile />
        ) : previewCourse ? (
          /* Course Preview Modal */
          <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 leading-tight">{previewCourse.title}</h2>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed">{previewCourse.description}</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setPreviewCourse(null)}
                className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 font-medium px-4 sm:px-6 py-2 rounded-lg transition-all duration-200 w-full sm:w-auto"
              >
                Back to Courses
              </Button>
            </div>
            
            <Card className="border-slate-200 shadow-lg bg-white">
              <CardHeader className="bg-blue-50 border-b border-blue-100 pb-4 sm:pb-6 p-4 sm:p-6">
                <CardTitle className="flex items-center space-x-3 text-lg sm:text-xl">
                  <div className="p-1.5 sm:p-2 bg-blue-900 rounded-lg shadow-lg">
                    <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <span className="text-slate-900 font-bold">Course Content</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {previewChapters.map((chapter, index) => (
                    <div key={chapter.id} className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 border border-slate-200 rounded-xl hover:border-slate-300 hover:shadow-md transition-all duration-200 bg-white hover:bg-slate-50 space-y-3 sm:space-y-0">
                      <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold text-white group-hover:bg-blue-700 transition-all duration-200 shadow-lg">{index + 1}</div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <h4 className="font-semibold text-slate-900 group-hover:text-slate-800 transition-colors text-sm sm:text-base">{chapter.title}</h4>
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{chapter.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                        {chapter.is_preview ? (
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 px-2 sm:px-3 py-1 rounded-full font-medium text-xs">
                            Preview Available
                          </Badge>
                        ) : (
                          <div className="p-1.5 sm:p-2 bg-slate-100 rounded-full">
                            <Lock className="h-3 w-3 sm:h-4 sm:w-4 text-slate-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-6 bg-blue-50 rounded-xl border border-blue-100 space-y-4 sm:space-y-0">
                    <div className="space-y-2">
                      <p className="text-lg sm:text-xl font-bold text-slate-900">Ready to start learning?</p>
                      <p className="text-slate-600 text-sm sm:text-base">
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
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 w-full sm:w-auto text-sm sm:text-base"
                    >
                      <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                      {previewCourse.is_free ? 'Get Free Course' : 'Buy Now'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-8 sm:space-y-12">
            {/* University Courses */}
            {universityCourses.length > 0 && (
              <section>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="p-1.5 sm:p-2 bg-blue-900 rounded-xl shadow-lg">
                    <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Your University Courses</h2>
                    <p className="text-slate-600 mt-1 text-sm sm:text-base">Courses assigned by your institution</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="p-1.5 sm:p-2 bg-[#1A344F] rounded-xl shadow-lg">
                    <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">My Courses</h2>
                    <p className="text-slate-600 mt-1 text-sm sm:text-base">Continue your learning journey</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-1.5 sm:p-2 bg-[#1A344F] rounded-xl shadow-lg">
                  <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Course Marketplace</h2>
                  <p className="text-slate-600 mt-1 text-sm sm:text-base">Discover new skills and expand your knowledge</p>
                </div>
              </div>
              
              {isLoading ? (
                <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse space-y-6">
  {/* Header Loading */}
  <div className="flex justify-between items-center">
    <div className="flex items-center space-x-4">
      <div className="h-10 w-10 rounded-full bg-[#C4CBD4]" />
      <div className="space-y-2">
        <div className="h-4 w-40 bg-[#D0D5DD] rounded" />
        <div className="h-3 w-24 bg-[#E5E9F0] rounded" />
      </div>
    </div>
    <div className="h-9 w-24 bg-[#C4CBD4] rounded-md" />
  </div>

  {/* Stats/Progress Boxes */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="rounded-xl border border-[#9FABBA]/30 bg-white p-4 space-y-3">
        <div className="h-4 w-1/3 bg-[#D0D5DD] rounded" />
        <div className="h-6 w-full bg-[#C4CBD4] rounded" />
        <div className="h-2 w-3/4 bg-[#E5E9F0] rounded" />
      </div>
    ))}
  </div>

  {/* Course Section Placeholder */}
  <div className="space-y-3">
    <div className="h-4 w-1/4 bg-[#9FABBA] rounded" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg bg-white p-4 border border-[#9FABBA]/30 space-y-3">
          <div className="h-4 w-3/4 bg-[#D0D5DD] rounded" />
          <div className="h-3 w-2/3 bg-[#E5E9F0] rounded" />
          <div className="h-9 w-1/2 bg-[#C4CBD4] rounded-md" />
        </div>
      ))}
    </div>
  </div>
</div>

              ) : publicCourses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4">
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
                <Card className="w-full max-w-sm mx-auto hover:shadow-lg transition-shadow">
                  <CardContent className="py-12 sm:py-16 text-center p-4 sm:p-6">
                    <div className="p-3 sm:p-4 bg-slate-100 rounded-full w-fit mx-auto mb-4 sm:mb-6">
                      <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 text-slate-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">No courses available</h3>
                    <p className="text-slate-600 max-w-md mx-auto text-sm sm:text-base">Check back later for new courses and learning opportunities.</p>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Empty State */}
            {universityCourses.length === 0 && purchasedCourses.length === 0 && publicCourses.length === 0 && !isLoading && (
              <div className="text-center py-16 sm:py-20 px-4">
                <div className="p-4 sm:p-6 bg-slate-100 rounded-full w-fit mx-auto mb-6 sm:mb-8">
                  <BookOpen className="h-16 w-16 sm:h-20 sm:w-20 text-slate-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">No courses found</h3>
                <p className="text-base sm:text-lg text-slate-600 mb-4 sm:mb-6 max-w-md mx-auto leading-relaxed">
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
    <Footer />
    </>
  );
};

export default StudentDashboard;
