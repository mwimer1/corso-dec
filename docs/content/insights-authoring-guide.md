---
title: "Content"
description: "Documentation and resources for documentation functionality. Located in content/."
last_updated: "2025-12-31"
category: "documentation"
status: "active"
---
# Insights Content Authoring Guide

**Comprehensive guide for content creators writing insights articles for the Corso platform.**

## TL;DR

- **Hero Images**: Use 16:9 aspect ratio, minimum 1200×675px resolution
- **Headings**: Use H2 and H3 for structure; avoid deep nesting beyond H3
- **Captions**: Hero image captions supported via `heroCaption` frontmatter field
- **CTAs**: Built-in CTA appears at article end; avoid redundant CTAs in body
- **Format**: Markdown with frontmatter; supports GFM (GitHub Flavored Markdown)

## 📝 Article Structure

### Frontmatter

All insights articles require frontmatter at the top of the markdown file:

```yaml
---
id: "unique-article-id"
slug: "article-url-slug"
title: "Article Title"
description: "Brief description for previews and SEO"
publishDate: "2025-01-20T00:00:00Z"
updatedDate: "2025-01-20T00:00:00Z"  # Optional, only if article was updated
imageUrl: "https://example.com/hero-image.jpg"  # Optional
heroCaption: "Photo by Author Name via Source"  # Optional, for hero image caption
categories:
  - slug: "technology"
    name: "Technology"
  - slug: "market-analysis"
    name: "Market Analysis"
author:
  name: "Author Name"
  avatar: "https://example.com/avatar.jpg"  # Optional
status: "published"  # Use "draft" to hide from public
---
```

### Required Fields

- `slug`: URL-friendly identifier (e.g., `"understanding-data-warehouses"`)
- `title`: Article title (displayed as H1)
- `publishDate`: ISO 8601 date string

### Optional Fields

- `description`: Used for preview cards and SEO meta description
- `updatedDate`: Only include if article was significantly updated after publication
- `imageUrl`: Hero image URL (see Hero Images section below)
- `heroCaption`: Caption text for hero image (displayed below image)
- `categories`: Array of category objects with `slug` and `name`
- `author`: Author information with optional avatar
- `status`: Set to `"draft"` to prevent publication

## 🖼️ Hero Images

### Aspect Ratio & Dimensions

**Critical**: Hero images are automatically cropped to a **16:9 aspect ratio** for consistent display across all devices.

**Recommended Dimensions:**
- **Minimum**: 1200×675 pixels
- **Optimal**: 1920×1080 pixels (Full HD)
- **Maximum**: 2560×1440 pixels (2K) for best quality without excessive file size

### Hero Image Best Practices

1. **Composition**: Important content should be centered, as edges may be cropped
2. **File Format**: Use JPEG for photographs, PNG for graphics with transparency
3. **File Size**: Optimize images before upload (aim for <500KB)
4. **Alt Text**: Always provide descriptive `alt` text (automatically uses article title if not specified)

### Captions

Hero image captions are supported via the `heroCaption` field in frontmatter:

```yaml
heroCaption: "Photo by John Doe via Unsplash"
```

Captions appear below the hero image in a muted, centered style. Use captions to:
- Credit photographers or image sources
- Provide context about the image
- Include copyright or licensing information

**Note**: Captions are optional. If not provided, no caption will be displayed.

## 📐 Heading Structure

### Hierarchy

Use headings to create a clear content hierarchy:

- **H1**: Reserved for article title (automatically generated from frontmatter)
- **H2**: Main section headings (e.g., "Introduction", "Key Findings", "Conclusion")
- **H3**: Subsections within H2 sections
- **H4-H6**: Avoid deep nesting; restructure content if you need more than 3 levels

### Best Practices

1. **Descriptive Headings**: Use clear, descriptive headings that summarize the section
2. **Consistency**: Maintain consistent heading style throughout the article
3. **Anchor Links**: All headings automatically receive anchor IDs (e.g., `#introduction`)
4. **Table of Contents**: Automatically generated from H2 and H3 headings (see Table of Contents section below)

### Example Structure

```markdown
## Introduction

Content here...

## Key Findings

### Market Trends

Content here...

### Technology Impact

Content here...

## Conclusion
```

## ✍️ Content Guidelines

### Writing Style

- **Tone**: Professional yet accessible
- **Length**: Aim for 800-2000 words for optimal engagement
- **Readability**: Use short paragraphs (3-4 sentences), bullet points, and lists
- **Links**: Include relevant internal and external links with descriptive anchor text

### Markdown Features

The platform supports **GitHub Flavored Markdown (GFM)**, including:

- **Bold** and *italic* text
- Code blocks with syntax highlighting
- Blockquotes
- Lists (ordered and unordered)
- Tables
- Links and images

### Code Blocks

Use fenced code blocks with language specification:

````markdown
```typescript
function example() {
  return "Hello, World!";
}
```
````

### Blockquotes

Use blockquotes for quotes, callouts, or important notes:

```markdown
> This is an important note or quote that stands out from the main content.
```

### Images in Content

Images within article content (not hero images) should:

- Be relevant and add value to the content
- Include descriptive alt text
- Be optimized for web (compressed, appropriate dimensions)
- Use relative paths or absolute URLs

## 🎯 Call-to-Action (CTA)

### Built-in CTA

Every article automatically includes a CTA section at the bottom with:
- "Start for free" button (links to sign-up)
- "Talk to sales" button (links to contact page)

### CTA Best Practices

1. **Avoid Redundancy**: Don't include additional CTAs in the article body that duplicate the built-in CTA
2. **Natural Integration**: If you mention sign-up or contact, do so naturally within the content flow
3. **Focus on Value**: Let the built-in CTA handle conversion; focus article content on providing value

## 📑 Table of Contents

### Automatic Generation

A **Table of Contents (TOC)** is automatically generated from H2 and H3 headings in your article. The TOC:

- **Desktop**: Appears as a sticky sidebar on the right side of the article
- **Mobile**: Appears as a collapsible dropdown above the article content
- **Updates**: Automatically reflects all H2 and H3 headings in your article
- **Navigation**: Clicking TOC items smoothly scrolls to the corresponding section

### TOC Behavior

- **Visibility**: TOC only appears if your article has at least one H2 or H3 heading
- **Hierarchy**: H2 headings appear in bold; H3 headings are indented and appear in regular weight
- **Scrolling**: Smooth scroll animation with proper offset for sticky navigation header
- **Accessibility**: Full keyboard navigation and screen reader support

### Best Practices for TOC

1. **Use Clear Headings**: Since headings appear in the TOC, make them descriptive and scannable
2. **Limit Depth**: Stick to H2 and H3 for best TOC readability
3. **Logical Structure**: Organize content hierarchically so the TOC provides a clear content outline

## 🔗 Anchor Links & Navigation

### Automatic ID Generation

All headings automatically receive anchor IDs based on their text:

- Heading: `## Market Analysis` → ID: `#market-analysis`
- Heading: `### Key Trends in 2025` → ID: `#key-trends-in-2025`

### Using Anchor Links

You can link to specific sections within the article:

```markdown
[Link to Market Analysis section](#market-analysis)
```

**Note**: Anchor links work automatically once headings are rendered. The scroll position accounts for the sticky navigation header. The Table of Contents also provides quick navigation to all sections.

## 📊 Categories

### Available Categories

Current categories include:
- `technology` - Technology
- `market-analysis` - Market Analysis
- `sustainability` - Sustainability
- `cost-management` - Cost Management
- `safety` - Safety

### Category Selection

- Select 1-3 relevant categories per article
- Use the most specific category that applies
- Categories appear as badges below the article title

## 👤 Author Information

### Author Fields

```yaml
author:
  name: "Author Name"
  avatar: "https://example.com/avatar.jpg"  # Optional
```

### Author Best Practices

- Use consistent author names across articles
- Avatar images should be square (1:1 aspect ratio), minimum 200×200px
- Author information appears in article metadata and preview cards

## 📅 Dates

### Date Format

Use ISO 8601 format for dates:

```yaml
publishDate: "2025-01-20T00:00:00Z"
updatedDate: "2025-01-20T15:30:00Z"  # Only if article was updated
```

### Date Best Practices

- **Publish Date**: Set to the intended publication date
- **Updated Date**: Only include if article was significantly revised after publication
- **Time Zone**: Use UTC (Z suffix) for consistency

## 🔍 SEO Considerations

### Meta Description

The `description` field in frontmatter is used for:
- Article preview cards on listing pages
- SEO meta description
- Social media sharing (Open Graph, Twitter Cards)

**Best Practices:**
- Keep descriptions between 120-160 characters
- Include key terms naturally
- Write compelling summaries that encourage clicks

### Title Optimization

- Keep titles under 60 characters for optimal display
- Include relevant keywords naturally
- Make titles compelling and descriptive

## 🚫 Common Mistakes to Avoid

1. **Wrong Aspect Ratio**: Using non-16:9 hero images (will be cropped)
2. **Deep Heading Nesting**: Using H4-H6 unnecessarily (restructure instead)
3. **Missing Alt Text**: Not providing descriptive alt text for images
4. **Redundant CTAs**: Adding multiple CTAs when built-in CTA exists
5. **Inconsistent Dates**: Using different date formats or time zones
6. **Overly Long Descriptions**: Meta descriptions exceeding 160 characters

## 📚 Examples

### Complete Frontmatter Example

```yaml
---
id: "data-warehouse-guide-2025"
slug: "data-warehouse-best-practices-2025"
title: "Data Warehouse Best Practices for 2025"
description: "Explore the latest trends and best practices for modern data warehouse architecture, including cloud migration strategies and performance optimization."
publishDate: "2025-01-20T00:00:00Z"
updatedDate: "2025-01-25T10:00:00Z"
imageUrl: "https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg"
heroCaption: "Photo by John Doe via Pexels"
categories:
  - slug: "technology"
    name: "Technology"
  - slug: "market-analysis"
    name: "Market Analysis"
author:
  name: "Jane Smith"
  avatar: "https://example.com/jane-smith-avatar.jpg"
status: "published"
---

## Introduction

Your article content starts here...
```

### Article Content Example

```markdown
## Introduction

Data warehouses have evolved significantly in recent years. This guide covers the latest best practices.

## Key Trends

### Cloud Migration

Many organizations are moving to cloud-based solutions...

### Performance Optimization

Optimizing query performance is crucial for...

## Conclusion

In summary, modern data warehouses require...
```

## 🔄 Content Updates

### Updating Published Articles

1. Make your content changes in the markdown file
2. Update `updatedDate` in frontmatter if changes are significant
3. The article will be regenerated on the next build (ISR revalidation every 5 minutes)

### Draft Articles

Set `status: "draft"` in frontmatter to prevent publication. Draft articles:
- Are not included in public listings
- Are not indexed by search engines
- Can still be accessed via direct URL (if you know the slug)

## 📞 Support

For questions or issues with content authoring:

1. Check this guide first
2. Review existing published articles for examples
3. Contact the platform team for assistance

## 🎨 Design System Integration

Articles automatically use the Corso design system:

- **Typography**: Consistent heading styles, readable body text
- **Spacing**: Optimized vertical rhythm and spacing
- **Colors**: Theme-aware colors (light/dark mode support)
- **Components**: Styled code blocks, blockquotes, lists, and more

No additional styling is needed or supported in article content.

---

**Last Updated**: December 20, 2025  
**Maintained By**: Platform Team  
**Questions**: Contact [platform@corso.io](mailto:platform@corso.io)
