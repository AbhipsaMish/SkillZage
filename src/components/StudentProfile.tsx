import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, GraduationCap, Phone, MapPin, Calendar, Save, Edit } from 'lucide-react';

interface University {
  id: string;
  name: string;
  code: string;
}

const StudentProfile = () => {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [universities, setUniversities] = useState<University[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: '',
    address: '',
    date_of_birth: '',
    student_id: '',
    university_id: profile?.university_id || 'no_university',
    year_of_study: '',
    major: '',
    bio: ''
  });

  useEffect(() => {
    fetchUniversities();
    if (profile) {
      loadProfileData();
    }
  }, [profile]);

  const fetchUniversities = async () => {
    const { data, error } = await supabase
      .from('universities')
      .select('*')
      .order('name');

    if (!error && data) {
      setUniversities(data);
    }
  };

  const loadProfileData = () => {
    if (profile) {
      setProfileForm({
        name: profile.name || '',
        email: profile.email || '',
        phone: (profile as any).phone || '',
        address: (profile as any).address || '',
        date_of_birth: (profile as any).date_of_birth || '',
        student_id: (profile as any).student_id || '',
        university_id: profile.university_id || 'no_university',
        year_of_study: (profile as any).year_of_study || '',
        major: (profile as any).major || '',
        bio: (profile as any).bio || ''
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profileForm.name,
          university_id: profileForm.university_id === 'no_university' ? null : profileForm.university_id,
          phone: profileForm.phone,
          address: profileForm.address,
          date_of_birth: profileForm.date_of_birth || null,
          student_id: profileForm.student_id,
          year_of_study: profileForm.year_of_study,
          major: profileForm.major,
          bio: profileForm.bio
        })
        .eq('user_id', profile?.user_id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      await refreshProfile();
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-7xl mx-auto border-[#9FABBA]/30 shadow-lg overflow-y-auto">
      <CardHeader className="pb-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-[#11283F] to-[#4B6584] rounded-xl shadow-lg">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-[#11283F]">Student Profile</CardTitle>
              <CardDescription className="text-[#4B6584] text-base mt-2">Manage your personal information and academic details</CardDescription>
            </div>
          </div>
          <Button
            variant={isEditing ? "outline" : "default"}
            onClick={() => setIsEditing(!isEditing)}
            className={`font-medium px-6 py-2.5 rounded-xl transition-all duration-200 ${
              isEditing 
                ? 'border-[#9FABBA] text-[#4B6584] hover:bg-[#9FABBA]/10 hover:border-[#4B6584]'
                : 'bg-[#11283F] hover:bg-[#1A344F] text-white shadow-lg'
            }`}
          >
            <Edit className="h-4 w-4 mr-2" />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSave} className="space-y-10">
          {/* Personal Information */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-[#9FABBA]/30">
              <div className="p-2 bg-[#11283F]/10 rounded-lg">
                <User className="h-5 w-5 text-[#11283F]" />
              </div>
              <h3 className="text-xl font-bold text-[#11283F]">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-sm font-semibold text-[#11283F]">Full Name</Label>
                <Input
                  id="name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  disabled={!isEditing}
                  required
                  className={`h-12 border-[#9FABBA]/50 rounded-xl ${isEditing ? 'focus:border-[#11283F] focus:ring-[#11283F]/20' : 'bg-slate-50'}`}
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="email" className="text-sm font-semibold text-[#11283F]">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  disabled={true}
                  className="h-12 bg-slate-50 border-[#9FABBA]/30 rounded-xl"
                />
                <p className="text-xs text-[#4B6584]">Email cannot be changed</p>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="phone" className="text-sm font-semibold text-[#11283F]">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="+1 (555) 123-4567"
                  className={`h-12 border-[#9FABBA]/50 rounded-xl ${isEditing ? 'focus:border-[#11283F] focus:ring-[#11283F]/20' : 'bg-slate-50'}`}
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="date_of_birth" className="text-sm font-semibold text-[#11283F]">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={profileForm.date_of_birth}
                  onChange={(e) => setProfileForm({ ...profileForm, date_of_birth: e.target.value })}
                  disabled={!isEditing}
                  className={`h-12 border-[#9FABBA]/50 rounded-xl ${isEditing ? 'focus:border-[#11283F] focus:ring-[#11283F]/20' : 'bg-slate-50'}`}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="address" className="text-sm font-semibold text-[#11283F]">Address</Label>
              <Textarea
                id="address"
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter your full address"
                rows={3}
                className={`border-[#9FABBA]/50 rounded-xl resize-none ${isEditing ? 'focus:border-[#11283F] focus:ring-[#11283F]/20' : 'bg-slate-50'}`}
              />
            </div>
          </div>

          {/* Academic Information */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-[#9FABBA]/30">
              <div className="p-2 bg-[#11283F]/10 rounded-lg">
                <GraduationCap className="h-5 w-5 text-[#11283F]" />
              </div>
              <h3 className="text-xl font-bold text-[#11283F]">Academic Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="university" className="text-sm font-semibold text-[#11283F]">University</Label>
                <Select
                  value={profileForm.university_id}
                  onValueChange={(value) => setProfileForm({ ...profileForm, university_id: value })}
                  disabled={!isEditing}
                >
                  <SelectTrigger className={`h-12 border-[#9FABBA]/50 rounded-xl ${isEditing ? 'focus:border-[#11283F] focus:ring-[#11283F]/20' : 'bg-slate-50'}`}>
                    <SelectValue placeholder="Select your university" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-[#9FABBA]/50">
                    <SelectItem value="no_university">No University</SelectItem>
                    {universities.map((uni) => (
                      <SelectItem key={uni.id} value={uni.id}>
                        {uni.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="student_id" className="text-sm font-semibold text-[#11283F]">Student ID</Label>
                <Input
                  id="student_id"
                  value={profileForm.student_id}
                  onChange={(e) => setProfileForm({ ...profileForm, student_id: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Your university student ID"
                  className={`h-12 border-[#9FABBA]/50 rounded-xl ${isEditing ? 'focus:border-[#11283F] focus:ring-[#11283F]/20' : 'bg-slate-50'}`}
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="year_of_study" className="text-sm font-semibold text-[#11283F]">Year of Study</Label>
                <Select
                  value={profileForm.year_of_study}
                  onValueChange={(value) => setProfileForm({ ...profileForm, year_of_study: value })}
                  disabled={!isEditing}
                >
                  <SelectTrigger className={`h-12 border-[#9FABBA]/50 rounded-xl ${isEditing ? 'focus:border-[#11283F] focus:ring-[#11283F]/20' : 'bg-slate-50'}`}>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-[#9FABBA]/50">
                    <SelectItem value="1">1st Year</SelectItem>
                    <SelectItem value="2">2nd Year</SelectItem>
                    <SelectItem value="3">3rd Year</SelectItem>
                    <SelectItem value="4">4th Year</SelectItem>
                    <SelectItem value="5">5th Year</SelectItem>
                    <SelectItem value="graduate">Graduate</SelectItem>
                    <SelectItem value="postgraduate">Postgraduate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="major" className="text-sm font-semibold text-[#11283F]">Major/Field of Study</Label>
                <Input
                  id="major"
                  value={profileForm.major}
                  onChange={(e) => setProfileForm({ ...profileForm, major: e.target.value })}
                  disabled={!isEditing}
                  placeholder="e.g., Computer Science, Medicine"
                  className={`h-12 border-[#9FABBA]/50 rounded-xl ${isEditing ? 'focus:border-[#11283F] focus:ring-[#11283F]/20' : 'bg-slate-50'}`}
                />
              </div>
            </div>
          </div>

          {/* Bio Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-[#9FABBA]/30">
              <div className="p-2 bg-[#11283F]/10 rounded-lg">
                <User className="h-5 w-5 text-[#11283F]" />
              </div>
              <h3 className="text-xl font-bold text-[#11283F]">About Me</h3>
            </div>
            <div className="space-y-3">
              <Label htmlFor="bio" className="text-sm font-semibold text-[#11283F]">Bio</Label>
              <Textarea
                id="bio"
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                disabled={!isEditing}
                placeholder="Tell us a bit about yourself..."
                rows={4}
                className={`border-[#9FABBA]/50 rounded-xl resize-none ${isEditing ? 'focus:border-[#11283F] focus:ring-[#11283F]/20' : 'bg-slate-50'}`}
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex justify-end space-x-4 pt-6 border-t border-[#9FABBA]/30">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  loadProfileData();
                }}
                className="border-[#9FABBA] text-[#4B6584] hover:bg-[#9FABBA]/10 hover:border-[#4B6584] font-medium px-6 py-2.5 rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-[#11283F] hover:bg-[#1A344F] text-white font-medium px-8 py-2.5 rounded-xl shadow-lg disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default StudentProfile;
