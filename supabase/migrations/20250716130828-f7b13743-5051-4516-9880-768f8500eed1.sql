-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

-- Create course types enum
CREATE TYPE public.course_type AS ENUM ('public', 'university');

-- Create quiz question types enum
CREATE TYPE public.question_type AS ENUM ('multiple_choice', 'true_false');

-- Create universities table
CREATE TABLE public.universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'student',
  university_id UUID REFERENCES public.universities(id),
  purchased_courses UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  type course_type NOT NULL DEFAULT 'public',
  category TEXT,
  thumbnail_url TEXT,
  university_id UUID REFERENCES public.universities(id),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chapters table
CREATE TABLE public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  content TEXT,
  pdf_attachments TEXT[],
  order_index INTEGER NOT NULL,
  lock_duration_minutes INTEGER DEFAULT 0,
  has_start_quiz BOOLEAN DEFAULT false,
  has_end_quiz BOOLEAN DEFAULT false,
  is_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_start_quiz BOOLEAN DEFAULT false,
  is_end_quiz BOOLEAN DEFAULT false,
  passing_score INTEGER DEFAULT 70,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create quiz questions table
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  type question_type NOT NULL DEFAULT 'multiple_choice',
  options JSONB, -- For multiple choice options
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create student progress table
CREATE TABLE public.student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  unlock_time TIMESTAMPTZ,
  quiz_attempts JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, chapter_id)
);

-- Create course purchases table
CREATE TABLE public.course_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  stripe_session_id TEXT,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable Row Level Security
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_purchases ENABLE ROW LEVEL SECURITY;

-- Create function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create RLS policies

-- Universities policies
CREATE POLICY "Everyone can view universities" ON public.universities
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage universities" ON public.universities
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.get_current_user_role() = 'admin');

-- Courses policies
CREATE POLICY "Everyone can view active public courses" ON public.courses
  FOR SELECT USING (is_active = true AND (type = 'public' OR type = 'university'));

CREATE POLICY "Admins can manage all courses" ON public.courses
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- Chapters policies
CREATE POLICY "Users can view chapters of accessible courses" ON public.chapters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.courses c 
      WHERE c.id = chapters.course_id 
      AND c.is_active = true
    )
  );

CREATE POLICY "Admins can manage all chapters" ON public.chapters
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- Quizzes policies
CREATE POLICY "Users can view quizzes of accessible chapters" ON public.quizzes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chapters ch
      JOIN public.courses c ON c.id = ch.course_id
      WHERE ch.id = quizzes.chapter_id 
      AND c.is_active = true
    )
  );

CREATE POLICY "Admins can manage all quizzes" ON public.quizzes
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- Quiz questions policies
CREATE POLICY "Users can view quiz questions" ON public.quiz_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.chapters ch ON ch.id = q.chapter_id
      JOIN public.courses c ON c.id = ch.course_id
      WHERE q.id = quiz_questions.quiz_id 
      AND c.is_active = true
    )
  );

CREATE POLICY "Admins can manage quiz questions" ON public.quiz_questions
  FOR ALL USING (public.get_current_user_role() = 'admin');

-- Student progress policies
CREATE POLICY "Users can view own progress" ON public.student_progress
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own progress" ON public.student_progress
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can modify own progress" ON public.student_progress
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all progress" ON public.student_progress
  FOR SELECT USING (public.get_current_user_role() = 'admin');

-- Course purchases policies
CREATE POLICY "Users can view own purchases" ON public.course_purchases
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own purchases" ON public.course_purchases
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all purchases" ON public.course_purchases
  FOR SELECT USING (public.get_current_user_role() = 'admin');

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    'student'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER update_universities_updated_at
  BEFORE UPDATE ON public.universities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at
  BEFORE UPDATE ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_progress_updated_at
  BEFORE UPDATE ON public.student_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('course-thumbnails', 'course-thumbnails', true),
  ('course-videos', 'course-videos', false),
  ('course-materials', 'course-materials', false);

-- Create storage policies
CREATE POLICY "Public can view course thumbnails" ON storage.objects
  FOR SELECT USING (bucket_id = 'course-thumbnails');

CREATE POLICY "Admins can upload course thumbnails" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'course-thumbnails' AND
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can manage course videos" ON storage.objects
  FOR ALL USING (
    bucket_id = 'course-videos' AND
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  );

CREATE POLICY "Students can view purchased course videos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'course-videos' AND
    EXISTS (
      SELECT 1 FROM public.course_purchases cp
      JOIN public.courses c ON c.id = cp.course_id
      WHERE cp.user_id = auth.uid() AND cp.payment_status = 'completed'
    )
  );

CREATE POLICY "Admins can manage course materials" ON storage.objects
  FOR ALL USING (
    bucket_id = 'course-materials' AND
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  );

CREATE POLICY "Students can view course materials" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'course-materials' AND
    EXISTS (
      SELECT 1 FROM public.course_purchases cp
      JOIN public.courses c ON c.id = cp.course_id
      WHERE cp.user_id = auth.uid() AND cp.payment_status = 'completed'
    )
  );