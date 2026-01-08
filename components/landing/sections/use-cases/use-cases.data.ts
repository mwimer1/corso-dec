import { TrendingUp, Target, FileText, BarChart3, MapPin, Search, Calendar } from 'lucide-react';
import type { Industry } from './types';

// Streamlined data structure for Use Case Explorer
export const STREAMLINED_INDUSTRIES: Industry[] = [
  {
    id: 'developers',
    label: 'Developers & Real Estate',
    tagline: 'Spot demand early and de-risk site selection with real permit signals.',
    helperLine: 'Tap a workflow to see an example preview and the artifacts you can export.',
    quickProof: ['Texas statewide', 'Updated regularly', 'Export-ready'],
    useCases: [
      {
        id: 'deal-sourcing',
        title: 'Deal sourcing & pipeline',
        oneLiner: 'Identify development opportunities before they hit the market',
        pain: 'Finding off-market deals and early-stage development opportunities requires constant monitoring of multiple data sources, making it hard to spot trends and act quickly.',
        howCorsoHelps: 'Corso aggregates permit data across jurisdictions, giving you a unified view of new developments, zoning changes, and project approvals. Set alerts for your target criteria and get notified the moment opportunities match your investment thesis.',
        outputs: ['New development alerts', 'Pipeline dashboard', 'Owner contact data'],
        icon: Search,
        preview: {
          headline: 'New development permit signals',
          highlights: [
            'Track new developments by city, zip, and corridor',
            'See scope/value changes over time',
            'Drill into contractors + owners to build an outreach list',
          ],
          kpis: [
            { label: 'New developments', value: '234' },
            { label: 'Total investment', value: '$342.1M' },
            { label: 'Market growth', value: '28%' },
          ],
          sampleRecord: [
            { label: 'Address', value: '123 Main St, Austin, TX 78701' },
            { label: 'Zoning', value: 'Commercial' },
            { label: 'Units', value: '12' },
            { label: 'Value', value: '$2.5M' },
          ],
        },
      },
      {
        id: 'competitive-intel',
        title: 'Competitive intel',
        oneLiner: 'Track competitor activity and market share by region',
        pain: 'Understanding where competitors are building and how market share is shifting requires manual research across multiple jurisdictions and time periods.',
        howCorsoHelps: 'Corso provides automated competitive intelligence by tracking permit activity by developer, contractor, and region. See market share trends, identify emerging players, and spot gaps in your coverage.',
        outputs: ['Competitor reports', 'Market share analysis', 'Territory maps'],
        icon: BarChart3,
        preview: {
          headline: 'Competitive activity dashboard',
          highlights: [
            'Monitor competitor permit activity by region',
            'Track market share trends over time',
            'Identify emerging players and market gaps',
          ],
          kpis: [
            { label: 'Active competitors', value: '47' },
            { label: 'Market share', value: '18%' },
            { label: 'YoY growth', value: '+12%' },
          ],
          sampleRecord: [
            { label: 'Developer', value: 'ABC Development Group' },
            { label: 'Projects (30d)', value: '8' },
            { label: 'Total value', value: '$12.4M' },
            { label: 'Primary region', value: 'Austin Metro' },
          ],
        },
      },
      {
        id: 'timing-capital',
        title: 'Timing & capital planning',
        oneLiner: 'Optimize investment timing with permit-driven market signals',
        pain: 'Timing capital deployment and identifying the right entry points requires understanding market cycles, but permit data is fragmented and hard to analyze at scale.',
        howCorsoHelps: 'Corso transforms permit data into actionable market signals. Track permit volume trends, project value distributions, and approval timelines to identify optimal investment windows and plan capital deployment.',
        outputs: ['Market timing reports', 'Capital planning dashboards', 'Trend forecasts'],
        icon: Calendar,
        preview: {
          headline: 'Market timing intelligence',
          highlights: [
            'Track permit volume trends by region and asset class',
            'Identify optimal investment windows',
            'Plan capital deployment with data-driven forecasts',
          ],
          kpis: [
            { label: 'Permit volume (30d)', value: '1,247' },
            { label: 'Avg project value', value: '$145K' },
            { label: 'Approval time', value: '18 days' },
          ],
          sampleRecord: [
            { label: 'Region', value: 'Dallas-Fort Worth' },
            { label: 'Trend', value: '↑ 15% MoM' },
            { label: 'Peak season', value: 'Q2-Q3' },
            { label: 'Forecast', value: 'Strong growth' },
          ],
        },
      },
    ],
  },
  {
    id: 'contractors',
    label: 'Contractors & Builders',
    tagline: 'Be first to every job with permit-matched leads.',
    helperLine: 'Tap a workflow to see an example preview and the artifacts you can export.',
    quickProof: ['Texas statewide', 'Updated regularly', 'Export-ready'],
    useCases: [
      {
        id: 'lead-generation',
        title: 'Lead generation',
        oneLiner: 'Find active projects by trade and territory',
        pain: 'Finding new projects requires constant monitoring of permit filings across multiple jurisdictions, making it easy to miss opportunities or waste time on projects that don\'t match your trade or territory.',
        howCorsoHelps: 'Corso matches permits to your trade specialties and target territories, delivering qualified leads as soon as they\'re filed. Filter by project type, value, location, and contractor to focus on the opportunities that matter most.',
        outputs: ['Qualified leads', 'Territory reports', 'Project details'],
        icon: Target,
        preview: {
          headline: 'Permit-matched leads dashboard',
          highlights: [
            'Find active projects by trade and territory',
            'Score leads by project value and timing',
            'Auto-route and track follow-ups',
          ],
          kpis: [
            { label: 'Active projects', value: '892' },
            { label: 'Total project value', value: '$156.8M' },
            { label: 'Lead conversion', value: '22%' },
          ],
          sampleRecord: [
            { label: 'Project', value: 'Electrical permit - 123 Main St' },
            { label: 'Trade', value: 'Electrical' },
            { label: 'Status', value: 'Approved' },
            { label: 'Value', value: '$45K' },
          ],
        },
      },
      {
        id: 'territory-management',
        title: 'Territory management',
        oneLiner: 'Optimize coverage and identify gaps in your service area',
        pain: 'Managing territory coverage and identifying underserved areas requires analyzing permit activity across regions, but data is scattered and hard to visualize.',
        howCorsoHelps: 'Corso provides territory-level analytics showing permit volume, project types, and competitive activity. Identify high-opportunity areas, optimize rep assignments, and spot gaps in your coverage.',
        outputs: ['Territory maps', 'Coverage reports', 'Opportunity scores'],
        icon: MapPin,
        preview: {
          headline: 'Territory coverage dashboard',
          highlights: [
            'Visualize permit activity by territory',
            'Identify high-opportunity areas',
            'Optimize rep assignments and coverage',
          ],
          kpis: [
            { label: 'Active territories', value: '24' },
            { label: 'Avg projects/territory', value: '37' },
            { label: 'Coverage rate', value: '68%' },
          ],
          sampleRecord: [
            { label: 'Territory', value: 'Austin Metro' },
            { label: 'Projects (30d)', value: '142' },
            { label: 'Opportunity score', value: 'High' },
            { label: 'Rep coverage', value: '2 reps' },
          ],
        },
      },
    ],
  },
  {
    id: 'insurance',
    label: 'Insurance Brokers',
    tagline: 'Prospect the moment coverage is needed.',
    helperLine: 'Tap a workflow to see an example preview and the artifacts you can export.',
    quickProof: ['Texas statewide', 'Updated regularly', 'Export-ready'],
    useCases: [
      {
        id: 'underwriting',
        title: 'Underwriting',
        oneLiner: 'Identify new construction and remodeling projects that need coverage',
        pain: 'Finding property owners who need insurance coverage requires monitoring construction activity, but permit data is scattered across jurisdictions and hard to track at scale.',
        howCorsoHelps: 'Corso aggregates permit data and enriches it with owner contact information, delivering qualified prospects as soon as projects are approved. Route leads to agents by territory and trigger outreach cadences automatically.',
        outputs: ['New prospect alerts', 'Owner contact data', 'Territory routing'],
        icon: FileText,
        preview: {
          headline: 'New construction permit alerts',
          highlights: [
            'Track new construction permits by city, zip, and corridor',
            'See scope/value changes over time',
            'Drill into contractors + owners to build an outreach list',
          ],
          kpis: [
            { label: 'New permits (30d)', value: '412' },
            { label: 'Total job value', value: '$128.4M' },
            { label: 'Top GC share', value: '18%' },
          ],
          sampleRecord: [
            { label: 'Address', value: '123 Main St, Austin, TX' },
            { label: 'Owner', value: 'John Smith' },
            { label: 'Type', value: 'New construction' },
            { label: 'Est. value', value: '$250K' },
          ],
        },
      },
    ],
  },
  {
    id: 'suppliers',
    label: 'Building Materials Suppliers',
    tagline: 'Win the order before the PO.',
    helperLine: 'Tap a workflow to see an example preview and the artifacts you can export.',
    quickProof: ['Texas statewide', 'Updated regularly', 'Export-ready'],
    useCases: [
      {
        id: 'demand-forecast',
        title: 'Demand forecast',
        oneLiner: 'Predict material needs by tracking contractor permit activity',
        pain: 'Forecasting material demand requires understanding upcoming projects, but permit data is fragmented and contractor activity is hard to track across regions.',
        howCorsoHelps: 'Corso tracks contractor permit activity and correlates it with project types and timelines. Forecast material demand by region, identify high-opportunity contractors, and optimize inventory and sales outreach.',
        outputs: ['Demand forecasts', 'Contractor activity reports', 'Inventory planning'],
        icon: TrendingUp,
        preview: {
          headline: 'Material demand forecast',
          highlights: [
            'Monitor contractor permit activity by region',
            'Identify project opportunities early',
            'Track share-of-wallet by contractor',
          ],
          kpis: [
            { label: 'Active contractors', value: '1,247' },
            { label: 'Project opportunities', value: '$89.2M' },
            { label: 'Quote win rate', value: '24%' },
          ],
          sampleRecord: [
            { label: 'Contractor', value: 'ABC Construction' },
            { label: 'Project type', value: 'Kitchen renovation' },
            { label: 'Value', value: '$45K' },
            { label: 'Status', value: 'Permit approved' },
          ],
        },
      },
    ],
  },
];



