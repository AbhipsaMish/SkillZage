import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { University, Settings, BookOpen, Users, BarChart3, Plus } from 'lucide-react';
import ChapterManager from '@/components/ChapterManager';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface University {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  type: 'public' | 'university';
  category: string;
  university_id: string | null;
  is_active: boolean;
  is_free: boolean;
  created_at: string;
}

const AdminDashboard = () => {
  const { profile, user, signOut } = useAuth();
  const { toast } = useToast();
  const [universities, setUniversities] = useState<University[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [newUniversityName, setNewUniversityName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Course form state
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'USD',
    type: 'public' as 'public' | 'university',
    category: '',
    university_id: '',
    is_free: false
  });

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchUniversities();
      fetchCourses();
    }
  }, [profile]);

  const fetchUniversities = async () => {
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch universities",
        variant: "destructive"
      });
    } else {
      setUniversities(data || []);
    }
  };

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch courses",
        variant: "destructive"
      });
    } else {
      setCourses(data || []);
    }
  };

  const generateUniversityCode = (name: string) => {
    return name.toUpperCase().replace(/\s+/g, '').slice(0, 6) + Math.random().toString(36).substring(2, 6).toUpperCase();
  };

  const handleCreateUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const code = generateUniversityCode(newUniversityName);
    
    const { error } = await supabase
      .from('universities')
      .insert([{
        name: newUniversityName,
        code: code
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create university",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: `University created with code: ${code}`,
      });
      setNewUniversityName('');
      fetchUniversities();
    }
    setIsLoading(false);
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase
      .from('courses')
      .insert([{
        title: courseForm.title,
        description: courseForm.description,
        price: courseForm.is_free ? 0 : parseFloat(courseForm.price),
        currency: courseForm.currency,
        type: courseForm.type,
        category: courseForm.category,
        university_id: courseForm.university_id || null,
        is_free: courseForm.is_free,
        created_by: user?.id
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create course",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Course created successfully",
      });
      setCourseForm({
        title: '',
        description: '',
        price: '',
        currency: 'USD',
        type: 'public',
        category: '',
        university_id: '',
        is_free: false
      });
      fetchCourses();
    }
    setIsLoading(false);
  };
 const handleDeleteCourse = async (courseId: string) => {
    setIsLoading(true);
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
      fetchCourses(); // Refresh course list
    }
    setIsLoading(false);
  };




  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Show chapter manager if a course is selected
  if (selectedCourse) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Settings className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            </div>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <ChapterManager
            courseId={selectedCourse.id}
            courseTitle={selectedCourse.title}
            onBack={() => setSelectedCourse(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Settings className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="universities" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="universities" className="flex items-center space-x-2">
              <University className="h-4 w-4" />
              <span>Universities</span>
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Courses</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Students</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="universities" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Add New University</span>
                </CardTitle>
                <CardDescription>
                  Create a new university and generate an access code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUniversity} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="university-name">University Name</Label>
                    <Input
                      id="university-name"
                      value={newUniversityName}
                      onChange={(e) => setNewUniversityName(e.target.value)}
                      placeholder="Enter university name"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isLoading}>
                    Create University
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Universities</CardTitle>
                <CardDescription>
                  Manage your universities and view access codes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {universities.map((university) => (
                    <div key={university.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{university.name}</h3>
                        <p className="text-sm text-muted-foreground">Code: {university.code}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(university.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Create New Course</span>
                </CardTitle>
                <CardDescription>
                  Add a new course to your platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCourse} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="course-title">Course Title</Label>
                      <Input
                        id="course-title"
                        value={courseForm.title}
                        onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                        placeholder="Enter course title"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="course-category">Category</Label>
                      <Input
                        id="course-category"
                        value={courseForm.category}
                        onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                        placeholder="e.g., Programming, Design"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="course-description">Description</Label>
                    <ReactQuill
                      id="course-description"
                      value={courseForm.description}
                      onChange={(value) => setCourseForm({ ...courseForm, description: value })}
                      modules={{
                        toolbar: [
                          [{ 'font': [] }, { 'size': [] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ 'color': [] }, { 'background': [] }],
                          [{ 'align': [] }],
                          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                          ['link', 'image'],
                          ['clean']
                        ]
                      }}
                      formats={[
                        'font', 'size', 'bold', 'italic', 'underline', 'strike',
                        'color', 'background', 'align', 'list', 'bullet', 'link', 'image'
                      ]}
                      placeholder="Enter course description"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="course-price">Price</Label>
                      <Input
                        id="course-price"
                        type="number"
                        step="0.01"
                        value={courseForm.price}
                        onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })}
                        placeholder="0.00"
                        disabled={courseForm.is_free}
                        required={!courseForm.is_free}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="course-currency">Currency</Label>
                      <Select
                        value={courseForm.currency}
                        onValueChange={(value) => setCourseForm({ ...courseForm, currency: value })}
                        disabled={courseForm.is_free}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="INR">INR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="course-type">Course Type</Label>
                      <Select
                        value={courseForm.type}
                        onValueChange={(value: 'public' | 'university') => setCourseForm({ ...courseForm, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="university">University Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="is-free">Free Course</Label>
                      <div className="flex items-center space-x-2 pt-2">
                        <Switch
                          id="is-free"
                          checked={courseForm.is_free}
                          onCheckedChange={(checked) => {
                            setCourseForm({ ...courseForm, is_free: checked });
                            if (checked) {
                              setCourseForm(prev => ({ ...prev, price: '0' }));
                            }
                          }}
                        />
                        <Label htmlFor="is-free" className="text-sm">Make this course free</Label>
                      </div>
                    </div>
                  </div>

                  {courseForm.type === 'university' && (
                    <div className="space-y-2">
                      <Label htmlFor="course-university">University</Label>
                      <Select
                        value={courseForm.university_id}
                        onValueChange={(value) => setCourseForm({ ...courseForm, university_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select university" />
                        </SelectTrigger>
                        <SelectContent>
                          {universities.map((university) => (
                            <SelectItem key={university.id} value={university.id}>
                              {university.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button type="submit" disabled={isLoading}>
                    Create Course
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Existing Courses</CardTitle>
                <CardDescription>
                  Manage your courses and add chapters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courses.map((course) => (
                    <div key={course.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{course.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{course.description}</p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                              {course.type}
                            </span>
                            {course.is_free ? (
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                                FREE
                              </span>
                            ) : (
                              <span>{course.currency} {course.price}</span>
                            )}
                            <span className="text-muted-foreground">{course.category}</span>
                          </div>
                        </div>
                       <div className="flex flex-row gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedCourse(course)}
                          >
                            Manage Chapters
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteCourse(course.id)}
                            disabled={isLoading}
                          >
                            Delete
                          </Button>
                        </div>



                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Student Management</CardTitle>
                <CardDescription>
                  View and manage student accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Student management features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>
                  View platform statistics and insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Analytics features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
