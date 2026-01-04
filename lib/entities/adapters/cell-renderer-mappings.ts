/**
 * @module lib/entities/adapters/cell-renderer-mappings
 * @description Domain-specific mappings for cell renderer styling
 * Maps status values, property types, and other categorical data to Badge color variants
 */

/**
 * Badge color variant type - matches Badge component variants
 */
export type BadgeColorVariant = 'default' | 'success' | 'info' | 'primary' | 'secondary' | 'warning' | 'error';

/**
 * Status style mapping - maps status values to display text and badge color variant
 */
export interface StatusStyle {
  text: string;
  variant: BadgeColorVariant;
}

/**
 * Status styles for permit/project statuses
 * Maps status values (case-insensitive) to display text and badge variants
 */
export const STATUS_STYLES: Record<string, StatusStyle> = {
  // Active statuses
  active: { text: 'Active', variant: 'success' },
  approved: { text: 'Approved', variant: 'success' },
  completed: { text: 'Completed', variant: 'success' },
  in_progress: { text: 'In Progress', variant: 'success' },
  
  // Pending/Review statuses
  pending: { text: 'Pending', variant: 'warning' },
  under_review: { text: 'Under Review', variant: 'warning' },
  submitted: { text: 'Submitted', variant: 'warning' },
  
  // Inactive/Closed statuses
  inactive: { text: 'Inactive', variant: 'default' },
  closed: { text: 'Closed', variant: 'default' },
  
  // Error/Rejected statuses
  rejected: { text: 'Rejected', variant: 'error' },
};

/**
 * Property type styles - maps property categories to badge variants
 */
export const PROPERTY_TYPE_STYLES: Record<string, StatusStyle> = {
  residential: { text: 'Residential', variant: 'info' },
  commercial: { text: 'Commercial', variant: 'primary' },
  industrial: { text: 'Industrial', variant: 'secondary' },
  mixed_use: { text: 'Mixed Use', variant: 'info' },
  agricultural: { text: 'Agricultural', variant: 'default' },
};

/**
 * Insurance status styles
 */
export const INSURANCE_STATUS_STYLES: Record<string, StatusStyle> = {
  active: { text: 'Active', variant: 'success' },
  expired: { text: 'Expired', variant: 'error' },
  pending: { text: 'Pending', variant: 'warning' },
};

/**
 * Common construction/industry keywords to highlight in descriptions
 * Used by DescriptionCellRenderer for keyword highlighting
 */
export const DESCRIPTION_KEYWORDS = [
  // Systems
  'HVAC', 'hvac',
  'plumbing',
  'electrical',
  'roofing',
  'framing',
  
  // Materials
  'concrete',
  'steel',
  'lumber',
  'drywall',
  'insulation',
  
  // Actions
  'renovation',
  'remodel',
  'addition',
  'repair',
  'replacement',
  'installation',
  
  // Areas
  'kitchen',
  'bathroom',
  'basement',
  'garage',
  'deck',
  'patio',
];

/**
 * Get status style for a status value
 * Performs case-insensitive lookup with fallback to default
 */
export function getStatusStyle(status: string | null | undefined): StatusStyle {
  if (!status) {
    return { text: String(status || ''), variant: 'default' };
  }
  
  const normalized = status.toLowerCase().trim();
  return STATUS_STYLES[normalized] || { text: status, variant: 'default' };
}

/**
 * Get property type style for a property type value
 * Performs case-insensitive lookup with fallback to default
 */
export function getPropertyTypeStyle(propertyType: string | null | undefined): StatusStyle {
  if (!propertyType) {
    return { text: String(propertyType || ''), variant: 'default' };
  }
  
  const normalized = propertyType.toLowerCase().trim().replace(/\s+/g, '_');
  return PROPERTY_TYPE_STYLES[normalized] || { text: propertyType, variant: 'default' };
}

/**
 * Get insurance status style
 */
export function getInsuranceStatusStyle(status: string | null | undefined): StatusStyle {
  if (!status) {
    return { text: String(status || ''), variant: 'default' };
  }
  
  const normalized = status.toLowerCase().trim();
  return INSURANCE_STATUS_STYLES[normalized] || { text: status, variant: 'default' };
}
