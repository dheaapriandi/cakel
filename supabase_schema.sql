-- Supabase Database Schema for Absensi & Nilai Siswa App

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Classes Table
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    nis VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Attendance Records Table
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Hadir', 'Izin', 'Sakit', 'Alpa')),
    time VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, date)
);

-- 4. Grades Table
CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'Ulangan',
    category VARCHAR(50) NOT NULL DEFAULT 'Ulangan',
    score NUMERIC(5, 2) NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Turn on Row Level Security (RLS) and enable public access for anon key
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on classes" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Allow public insert on classes" ON public.classes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on classes" ON public.classes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on classes" ON public.classes FOR DELETE USING (true);

CREATE POLICY "Allow public select on students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow public insert on students" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on students" ON public.students FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on students" ON public.students FOR DELETE USING (true);

CREATE POLICY "Allow public select on attendance" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Allow public insert on attendance" ON public.attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on attendance" ON public.attendance FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on attendance" ON public.attendance FOR DELETE USING (true);

CREATE POLICY "Allow public select on grades" ON public.grades FOR SELECT USING (true);
CREATE POLICY "Allow public insert on grades" ON public.grades FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on grades" ON public.grades FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on grades" ON public.grades FOR DELETE USING (true);

-- Insert Sample Seed Data for "Kelas X DKV"
INSERT INTO public.classes (id, name) VALUES ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Kelas X DKV') ON CONFLICT DO NOTHING;

INSERT INTO public.students (class_id, name, nis) VALUES 
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Ahmad Rizky', '1001'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Budi Santoso', '1002'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Citra Dewi', '1003'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Dian Pratama', '1004'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Eka Putri', '1005')
ON CONFLICT DO NOTHING;
