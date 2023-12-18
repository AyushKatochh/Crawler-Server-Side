import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Table 1: website_url
export const websiteURL = pgTable('website_url', {
  id: serial('id').primaryKey(),
  url: text('url'),
  createdAt: timestamp('created_at', { mode: 'date' }),
  updatedAt: timestamp('updated_at', { mode: 'date' }),
});

// Table 2: website_links
export const websiteLinks = pgTable('website_links', {
  id: serial('id').primaryKey(),
  webpages: text('webpages'),
  createdAt: timestamp('created_at', { mode: 'date' }),
  updatedAt: timestamp('updated_at', { mode: 'date' }),
});

// Table 3: website_content
export const websiteContent = pgTable('website_content', {
  id: serial('id').primaryKey(),
  linkId: integer('link_id'),
  content: text('content'),
  createdAt: timestamp('created_at', { mode: 'date' }),
  updatedAt: timestamp('updated_at', { mode: 'date' }),
});

// Table 4: website_content_chunks
export const websiteContentChunks = pgTable('website_content_chunks', {
  id: serial('id').primaryKey(),
  websiteContentId: integer('website_content_id'),
  chunk: text('chunk'),
});

// Define relations
// export const websiteRelations1 = relations(websiteURL, ({ one }) => ({
//   websiteContentLink: one(websiteContent, {
//     // fields: [websiteContent.linkId],
//     // references: [websiteLinks.id],
//   }),
// }));

// export const websiteRelations2 = relations(websiteContent, ({ many }) => ({
//   websiteChunks: many(websiteContentChunks, {
//     fields: [websiteContentChunks.websiteContentId],
//     references: [websiteContent.id],
//   }),
// }));
