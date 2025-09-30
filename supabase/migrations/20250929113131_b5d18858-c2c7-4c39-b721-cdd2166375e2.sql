-- Add business detail columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN business_name TEXT,
ADD COLUMN business_desc TEXT,
ADD COLUMN employee_count INTEGER,
ADD COLUMN customer_region TEXT,
ADD COLUMN offer_type TEXT CHECK (offer_type IN ('products', 'services')),
ADD COLUMN delivery_method TEXT CHECK (delivery_method IN ('physical', 'online', 'both', 'field_service'));