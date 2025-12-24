import { defineCollection, z } from 'astro:content';

const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string().optional(),
  }),
});

const programs = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    stage: z.string().optional(),
    ageRange: z.string().optional(),
    duration: z.string().optional(),
    price: z.string().optional(),
    image: z.string().optional(),
  }),
});

const coaches = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    title: z.string(),
    bio: z.string().optional(),
    qualifications: z.array(z.string()).optional(),
    image: z.string().optional(),
  }),
});

const testimonials = defineCollection({
  type: 'content',
  schema: z.object({
    author: z.string(),
    program: z.string().optional(),
    date: z.string().optional(),
  }),
});

const announcements = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.string(),
    category: z.string().optional(),
  }),
});

export const collections = {
  pages,
  programs,
  coaches,
  testimonials,
  announcements,
};
