-- Add show_in_comparison column to products table
ALTER TABLE products 
ADD COLUMN show_in_comparison TINYINT(1) NOT NULL DEFAULT 0 
AFTER is_active;
