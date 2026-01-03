-- Create enum for complaint status
CREATE TYPE public.complaint_status AS ENUM ('received', 'assigned', 'in_progress', 'resolved');

-- Create enum for priority levels
CREATE TYPE public.priority_level AS ENUM ('critical', 'high', 'medium', 'low');

-- Create departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  email TEXT,
  phone TEXT,
  avg_resolution_hours INTEGER DEFAULT 48,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create complaints table
CREATE TABLE public.complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id TEXT NOT NULL UNIQUE,
  citizen_name TEXT NOT NULL,
  citizen_email TEXT,
  citizen_phone TEXT,
  description TEXT NOT NULL,
  location TEXT,
  category TEXT NOT NULL,
  sub_category TEXT,
  priority public.priority_level NOT NULL DEFAULT 'medium',
  priority_score INTEGER DEFAULT 50,
  status public.complaint_status NOT NULL DEFAULT 'received',
  department_id UUID REFERENCES public.departments(id),
  assigned_officer TEXT,
  sentiment_score NUMERIC(3,2),
  urgency_keywords TEXT[],
  impact_prediction TEXT,
  affected_people INTEGER DEFAULT 1,
  sla_hours INTEGER DEFAULT 48,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create complaint_clusters table for grouping similar complaints
CREATE TABLE public.complaint_clusters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cluster_name TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT,
  complaint_count INTEGER DEFAULT 1,
  priority public.priority_level NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cluster_complaints junction table
CREATE TABLE public.cluster_complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cluster_id UUID REFERENCES public.complaint_clusters(id) ON DELETE CASCADE,
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE,
  UNIQUE(cluster_id, complaint_id)
);

-- Enable RLS on all tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cluster_complaints ENABLE ROW LEVEL SECURITY;

-- Public read access for departments (anyone can see department info)
CREATE POLICY "Departments are publicly readable" 
ON public.departments FOR SELECT 
USING (true);

-- Public insert access for complaints (citizens can file without login)
CREATE POLICY "Anyone can file a complaint" 
ON public.complaints FOR INSERT 
WITH CHECK (true);

-- Public read access for complaints (for tracking by complaint_id)
CREATE POLICY "Anyone can view complaints" 
ON public.complaints FOR SELECT 
USING (true);

-- Public update for complaints (for status updates)
CREATE POLICY "Anyone can update complaints" 
ON public.complaints FOR UPDATE 
USING (true);

-- Public access for clusters
CREATE POLICY "Anyone can view clusters" 
ON public.complaint_clusters FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create clusters" 
ON public.complaint_clusters FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update clusters" 
ON public.complaint_clusters FOR UPDATE 
USING (true);

-- Public access for cluster_complaints
CREATE POLICY "Anyone can view cluster_complaints" 
ON public.cluster_complaints FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create cluster_complaints" 
ON public.cluster_complaints FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_complaints_updated_at
BEFORE UPDATE ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default departments
INSERT INTO public.departments (name, description, avg_resolution_hours) VALUES
('Municipal Corporation', 'Handles sanitation, garbage, and civic infrastructure', 24),
('Public Works Department', 'Responsible for roads, bridges, and public buildings', 48),
('Water Supply Department', 'Manages water supply and drainage issues', 12),
('Electricity Board', 'Handles power supply and electrical infrastructure', 6),
('Police Department', 'Manages law and order, safety concerns', 4),
('Health Department', 'Handles public health and hospital issues', 12),
('Education Department', 'Manages schools and educational institutions', 72),
('Transport Department', 'Handles public transport and traffic issues', 24);

-- Enable realtime for complaints
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaint_clusters;