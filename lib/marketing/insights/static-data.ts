// Simple asset URL constructor
// Use the `getPublicEnv` helper at call time so build-time collection isn't affected.
import { publicEnv } from '@/lib/shared';
import type { InsightItem } from '@/types/marketing';
import type { ISODateString } from '@/types/shared';

const asset = (path: string) => {
  const base = publicEnv.NEXT_PUBLIC_PLACEHOLDER_IMAGE_BASE ?? '';
  return `${base}${path}`;
};

export const staticInsights: InsightItem[] = [
  {
    id: 'welcome',
    slug: 'welcome-to-corso',
    title: 'Welcome to Corso Insights',
    description: 'An introduction to Corso\'s comprehensive insights platform, designed to provide actionable intelligence for construction professionals and industry stakeholders.',
    publishDate: '2025-01-01T09:00:00Z' as ISODateString,
    imageUrl: asset('/demos/projects-interface.png'),
    categories: [{ slug: 'general', name: 'General' }],
    content: `
      <p>We're excited to launch Corso Insights, a dedicated platform for construction industry professionals seeking data-driven insights and market intelligence.</p>

      <h2>What is Corso?</h2>
      <p>Corso is a comprehensive construction management platform that combines project management, financial tracking, and business intelligence into a single, unified solution. Our mission is to empower construction companies with the tools and insights they need to build more efficiently and profitably.</p>

      <h2>Why Insights Matter</h2>
      <p>In today's competitive construction landscape, data-driven decision making is no longer optional—it's essential. Corso Insights provides:</p>
      <ul>
        <li><strong>Market Analysis:</strong> Real-time trends and forecasts for construction materials, labor costs, and regional markets</li>
        <li><strong>Project Intelligence:</strong> Performance metrics and benchmarking data from thousands of completed projects</li>
        <li><strong>Industry Reports:</strong> In-depth analysis of construction technology, sustainability practices, and regulatory changes</li>
        <li><strong>Best Practices:</strong> Proven strategies for cost optimization, risk management, and operational efficiency</li>
      </ul>

      <h2>Our Commitment</h2>
      <p>Corso Insights is committed to delivering accurate, actionable intelligence that helps construction professionals make informed decisions. Our team of industry experts and data analysts work continuously to ensure our content reflects the latest market conditions and emerging trends.</p>

      <p>Stay tuned for regular updates, deep-dive analyses, and practical guides that will help you navigate the evolving construction industry landscape.</p>
    `,
    author: { name: 'Corso Team' },
  },
  {
    id: 'trends',
    slug: 'industry-trends',
    title: 'Top Industry Trends',
    description: 'Key construction tech trends to watch.',
    publishDate: '2025-02-15T10:00:00Z' as ISODateString,
    imageUrl: asset('/demos/projects-interface.png'),
    categories: [{ slug: 'technology', name: 'Technology' }],
    content: '<p>Here are the latest trends...</p>',
    author: { name: 'Corso Research' },
  },
  {
    id: 'market-analysis',
    slug: 'construction-market-analysis-2025',
    title: 'Construction Market Analysis 2025',
    description: 'Comprehensive analysis of construction industry trends and forecasts.',
    publishDate: '2025-01-15T11:00:00Z' as ISODateString,
    imageUrl: asset('/demos/projects-interface.png'),
    categories: [{ slug: 'market-analysis', name: 'Market Analysis' }],
    content: '<p>Detailed market insights and predictions for the construction sector...</p>',
    author: { name: 'Market Research Team' },
  },
  {
    id: 'sustainability',
    slug: 'sustainable-construction-practices',
    title: 'Sustainable Construction Practices',
    description: 'How to implement eco-friendly building methods and materials.',
    publishDate: '2025-02-01T14:00:00Z' as ISODateString,
    imageUrl: asset('/demos/projects-interface.png'),
    categories: [{ slug: 'sustainability', name: 'Sustainability' }],
    content: '<p>Best practices for sustainable construction and green building initiatives...</p>',
    author: { name: 'Sustainability Experts' },
  },
  {
    id: 'digital-transformation',
    slug: 'digital-transformation-construction',
    title: 'Digital Transformation in Construction',
    description: 'How technology is reshaping the construction industry.',
    publishDate: '2025-01-20T10:30:00Z' as ISODateString,
    imageUrl: asset('/demos/projects-interface.png'),
    categories: [{ slug: 'technology', name: 'Technology' }],
    content: '<p>The impact of digital tools and software on modern construction workflows...</p>',
    author: { name: 'Tech Innovation Team' },
  },
  {
    id: 'cost-optimization',
    slug: 'construction-cost-optimization',
    title: 'Construction Cost Optimization Strategies',
    description: 'Effective ways to reduce construction costs without sacrificing quality.',
    publishDate: '2025-02-10T09:15:00Z' as ISODateString,
    imageUrl: asset('/demos/projects-interface.png'),
    categories: [{ slug: 'cost-management', name: 'Cost Management' }],
    content: `
      <p>Construction cost optimization is crucial for maintaining profitability in today's competitive market. Here are proven strategies that can help reduce expenses while maintaining quality standards.</p>

      <h2>1. Strategic Planning and Design Optimization</h2>
      <p>Effective cost management begins during the planning phase. Value engineering techniques can identify opportunities to reduce costs while maintaining functionality.</p>

      <h2>2. Material Selection and Procurement</h2>
      <p>Strategic sourcing and bulk purchasing can significantly reduce material costs. Consider alternative materials that offer similar performance at lower price points.</p>

      <h2>3. Labor Efficiency and Training</h2>
      <p>Investing in workforce training and process optimization can improve productivity and reduce labor costs over time.</p>

      <h2>4. Technology Integration</h2>
      <p>Construction management software and digital tools can help identify cost-saving opportunities and improve project efficiency.</p>

      <p>Remember, cost optimization should never compromise safety or quality. The goal is to build more efficiently, not cut corners.</p>
    `,
    author: { name: 'Cost Management Specialists' },
  },
  {
    id: 'safety-innovation',
    slug: 'construction-safety-innovation',
    title: 'Construction Safety Innovation and Technology',
    description: 'How emerging technologies are revolutionizing construction site safety and risk management.',
    publishDate: '2025-02-05T14:30:00Z' as ISODateString,
    imageUrl: asset('/demos/projects-interface.png'),
    categories: [{ slug: 'safety', name: 'Safety' }],
    content: `
      <p>Construction site safety has evolved dramatically with the integration of innovative technologies. These advancements are not only reducing accidents but also improving overall project efficiency.</p>

      <h2>Wearable Technology for Worker Safety</h2>
      <p>Smart helmets and wearable devices can monitor worker fatigue, detect hazardous conditions, and provide real-time alerts to prevent accidents.</p>

      <h2>AI-Powered Risk Assessment</h2>
      <p>Machine learning algorithms analyze project data to identify potential safety risks before they become incidents, allowing proactive intervention.</p>

      <h2>Drone Technology for Site Monitoring</h2>
      <p>Drones provide aerial surveillance of construction sites, enabling safety managers to identify hazards from a safe distance and monitor compliance.</p>

      <h2>Virtual Reality Training</h2>
      <p>VR simulations allow workers to experience hazardous situations in a controlled environment, improving safety awareness and response times.</p>

      <p>These innovations represent a paradigm shift in construction safety, moving from reactive to proactive risk management.</p>
    `,
    author: { name: 'Safety Innovation Team' },
  },
  {
    id: 'sustainable-materials',
    slug: 'sustainable-construction-materials',
    title: 'Sustainable Construction Materials Guide',
    description: 'A comprehensive overview of eco-friendly building materials and their applications in modern construction.',
    publishDate: '2025-01-25T11:00:00Z' as ISODateString,
    imageUrl: asset('/demos/projects-interface.png'),
    categories: [{ slug: 'sustainability', name: 'Sustainability' }],
    content: `
      <p>As environmental concerns become increasingly important, the construction industry is turning to sustainable materials that reduce environmental impact while maintaining structural integrity.</p>

      <h2>Bamboo: The Renewable Alternative</h2>
      <p>Bamboo is one of the most sustainable building materials available. It grows rapidly, requires minimal water, and has excellent strength-to-weight ratios.</p>

      <h2>Recycled Steel and Concrete</h2>
      <p>Using recycled materials in steel production and concrete manufacturing significantly reduces the carbon footprint of construction projects.</p>

      <h2>Cross-Laminated Timber (CLT)</h2>
      <p>CLT offers a sustainable alternative to traditional concrete and steel construction, with superior thermal performance and lower environmental impact.</p>

      <h2>Green Insulation Materials</h2>
      <p>Innovative insulation materials made from recycled denim, sheep's wool, and cellulose provide excellent thermal performance with minimal environmental impact.</p>

      <p>Choosing sustainable materials is not just about environmental responsibility—it's also becoming a requirement for many building certifications and client expectations.</p>
    `,
    author: { name: 'Sustainability Research Team' },
  },
  {
    id: 'data-insights-1',
    slug: 'data-driven-decision-making',
    title: 'Data-Driven Decision Making in Construction',
    description: 'How construction companies are leveraging data analytics for better project outcomes.',
    publishDate: '2025-03-01T10:00:00Z' as ISODateString,
    imageUrl: asset('/demos/projects-interface.png'),
    categories: [{ slug: 'data', name: 'Data' }],
    content: '<p>Construction companies are increasingly using data analytics to improve project outcomes and operational efficiency...</p>',
    author: { name: 'Data Analytics Team' },
  },
  {
    id: 'data-insights-2',
    slug: 'construction-analytics-trends',
    title: 'Construction Analytics Trends 2025',
    description: 'The latest trends in construction data analytics and business intelligence.',
    publishDate: '2025-01-01T09:00:00Z' as ISODateString,
    imageUrl: asset('/demos/projects-interface.png'),
    categories: [{ slug: 'data', name: 'Data' }],
    content: '<p>Explore the emerging trends in construction analytics that are reshaping how projects are planned and executed...</p>',
    author: { name: 'Analytics Research Team' },
  },
];

// Extract categories from static insights
export const CATEGORIES = Array.from(
  new Set(
    staticInsights.flatMap(insight =>
      (insight.categories || []).map(cat => cat.slug)
    )
  )
).map(slug => {
  const insight = staticInsights.find(i =>
    (i.categories || []).some(cat => cat.slug === slug)
  );
  const category = (insight?.categories || []).find(cat => cat.slug === slug);
  return {
    slug,
    name: category?.name || slug.charAt(0).toUpperCase() + slug.slice(1)
  };
});

export function getInsightBySlug(slug: string): InsightItem | undefined {
  return staticInsights.find((i) => i.slug === slug);
}

