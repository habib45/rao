-- Add note column to blog_posts table for admin-only personal notes
-- Migration: 013_add_blog_note.sql

ALTER TABLE blog_posts 
ADD COLUMN note TEXT NULL AFTER author_avatar_url;
