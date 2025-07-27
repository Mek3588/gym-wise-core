-- Create custom types
CREATE TYPE public.membership_status AS ENUM ('active', 'expired', 'suspended', 'cancelled');
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE public.user_role AS ENUM ('admin', 'trainer', 'member');
CREATE TYPE public.class_status AS ENUM ('scheduled', 'ongoing', 'completed', 'cancelled');
CREATE TYPE public.booking_status AS ENUM ('confirmed', 'cancelled', 'waitlist');
CREATE TYPE public.notification_type AS ENUM ('email', 'sms', 'in_app');

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  profile_image_url TEXT,
  role user_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create membership plans table
CREATE TABLE public.membership_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_months INTEGER NOT NULL,
  features TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create memberships table
CREATE TABLE public.memberships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.membership_plans(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status membership_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  check_out_time TIMESTAMP WITH TIME ZONE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create workouts table
CREATE TABLE public.workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  difficulty_level TEXT,
  muscle_groups TEXT[],
  equipment_needed TEXT[],
  instructions TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create workout schedules table
CREATE TABLE public.workout_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create classes table
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_capacity INTEGER NOT NULL DEFAULT 20,
  current_bookings INTEGER NOT NULL DEFAULT 0,
  status class_status NOT NULL DEFAULT 'scheduled',
  room_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create class bookings table
CREATE TABLE public.class_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  status booking_status NOT NULL DEFAULT 'confirmed',
  booking_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, class_id)
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  membership_id UUID REFERENCES public.memberships(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  status payment_status NOT NULL DEFAULT 'pending',
  payment_date TIMESTAMP WITH TIME ZONE,
  due_date DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create equipment table
CREATE TABLE public.equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  brand TEXT,
  model TEXT,
  purchase_date DATE,
  warranty_end_date DATE,
  maintenance_schedule TEXT,
  status TEXT NOT NULL DEFAULT 'operational',
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create equipment usage table
CREATE TABLE public.equipment_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_membership_plans_updated_at BEFORE UPDATE ON public.membership_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON public.memberships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON public.workouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workout_schedules_updated_at BEFORE UPDATE ON public.workout_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_class_bookings_updated_at BEFORE UPDATE ON public.class_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON public.equipment FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for membership_plans
CREATE POLICY "Anyone can view membership plans" ON public.membership_plans FOR SELECT USING (true);
CREATE POLICY "Only admins can modify membership plans" ON public.membership_plans FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for memberships
CREATE POLICY "Users can view their own memberships" ON public.memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all memberships" ON public.memberships FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Only admins can modify memberships" ON public.memberships FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for attendance
CREATE POLICY "Users can view their own attendance" ON public.attendance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own attendance" ON public.attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own attendance" ON public.attendance FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins and trainers can view all attendance" ON public.attendance FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
);

-- RLS Policies for workouts
CREATE POLICY "Anyone can view workouts" ON public.workouts FOR SELECT USING (true);
CREATE POLICY "Trainers and admins can create workouts" ON public.workouts FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
);
CREATE POLICY "Creators and admins can update workouts" ON public.workouts FOR UPDATE USING (
  auth.uid() = created_by OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for workout_schedules
CREATE POLICY "Users can view their own workout schedules" ON public.workout_schedules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Trainers can view schedules they created" ON public.workout_schedules FOR SELECT USING (auth.uid() = trainer_id);
CREATE POLICY "Admins can view all workout schedules" ON public.workout_schedules FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Trainers and admins can create workout schedules" ON public.workout_schedules FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
);
CREATE POLICY "Users can update their own workout schedules" ON public.workout_schedules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Trainers can update schedules they created" ON public.workout_schedules FOR UPDATE USING (auth.uid() = trainer_id);

-- RLS Policies for classes
CREATE POLICY "Anyone can view classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Trainers and admins can create classes" ON public.classes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
);
CREATE POLICY "Trainers can update their own classes" ON public.classes FOR UPDATE USING (auth.uid() = trainer_id);
CREATE POLICY "Admins can update any class" ON public.classes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for class_bookings
CREATE POLICY "Users can view their own bookings" ON public.class_bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own bookings" ON public.class_bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bookings" ON public.class_bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Trainers and admins can view all bookings" ON public.class_bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'trainer'))
);

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Only admins can modify payments" ON public.payments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can create notifications" ON public.notifications FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for equipment
CREATE POLICY "Anyone can view equipment" ON public.equipment FOR SELECT USING (true);
CREATE POLICY "Only admins can modify equipment" ON public.equipment FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for equipment_usage
CREATE POLICY "Users can view their own equipment usage" ON public.equipment_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own equipment usage" ON public.equipment_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own equipment usage" ON public.equipment_usage FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all equipment usage" ON public.equipment_usage FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Insert sample membership plans
INSERT INTO public.membership_plans (name, description, price, duration_months, features) VALUES
('Basic Monthly', 'Access to gym equipment and basic facilities', 29.99, 1, ARRAY['Gym access', 'Locker room']),
('Premium Monthly', 'Full access including classes and personal training consultation', 59.99, 1, ARRAY['Gym access', 'All classes', 'Locker room', 'Personal training consultation']),
('Basic Annual', 'Annual basic membership with 2 months free', 299.99, 12, ARRAY['Gym access', 'Locker room']),
('Premium Annual', 'Annual premium membership with 2 months free', 599.99, 12, ARRAY['Gym access', 'All classes', 'Locker room', 'Personal training consultation', 'Nutrition guidance']);