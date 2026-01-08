import { getAllInsights } from '@/lib/marketing/server';

/** @knipignore */
export async function GET() {
  const insights = await getAllInsights() as any[]; // Cast to avoid type issues with author property

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Corso Insights</title>
    <description>Construction industry trends, market intelligence, and practical playbooks from Corso</description>
    <link>https://getcorso.com/insights</link>
    <atom:link href="https://getcorso.com/insights/rss" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Corso Insights RSS Generator</generator>

    ${insights.map(insight => `
    <item>
      <title><![CDATA[${insight.title}]]></title>
      <description><![CDATA[${insight.description || ''}]]></description>
      <link>https://getcorso.com/insights/${insight.slug}</link>
      <guid>https://getcorso.com/insights/${insight.slug}</guid>
      <pubDate>${insight.publishDate ? new Date(insight.publishDate).toUTCString() : new Date().toUTCString()}</pubDate>
      ${insight.author?.name ? `<author>${insight.author.name}</author>` : ''}
      ${insight.categories?.map((cat: any) => `<category>${cat.name}</category>`).join('')}
    </item>`).join('\n    ')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

