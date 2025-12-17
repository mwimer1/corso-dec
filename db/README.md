---
title: "Database Assets"
description: "Construction permit and contractor data for the Dallas-Fort Worth metro area, supporting development and testing workflows."
category: data
last_updated: 2025-12-15
---

# Database Assets

> **Construction permit and contractor data for the Dallas-Fort Worth metro area, supporting development and testing workflows.**

## 📋 Quick Reference

**Key Points:**
- **1,008 projects**: Comprehensive construction permit records with geospatial and financial data
- **365 contractors**: Company permit statistics and performance metrics
- **50 address types**: Property permit aggregations by location characteristics
- **Synthetic data**: 46 addresses marked for testing scenarios
- **Dallas-Fort Worth focus**: All data localized to DFW metro area

## 📑 Table of Contents

- [Overview](#overview)
- [Data Files](#data-files)
- [Data Dictionary](#data-dictionary)
- [Usage Examples](#usage-examples)
- [Data Quality](#data-quality)
- [Development Guidelines](#development-guidelines)

---

## Overview

This directory contains curated construction permit and contractor datasets for the Dallas-Fort Worth metropolitan area. The data supports development workflows, analytics testing, and application prototyping within the Corso platform.

### Architecture

The datasets form a relational structure:
- **Projects** (1,008 records): Core permit data with full project lifecycle
- **Companies** (365 records): Contractor performance and permit history
- **Addresses** (50 records): Geographic permit aggregations and property metrics

### Data Sources

All datasets are derived from municipal construction permit records for the Dallas-Fort Worth area, with synthetic records added for testing scenarios.

## 📊 Data Files

### projects.csv (1,008 records)
Primary dataset containing detailed construction permit information.

**Key Fields:**
- `id_permit_atm`: Unique permit identifier
- `permit_type`: Type of construction work
- `job_value`: Total project value ($)
- `company_name`: Contractor performing work
- `property_address_type_key`: Property type classification
- `latitude/longitude`: Geospatial coordinates
- `status`: Current permit status (COMPLETE, ISSUED, EXPIRED, etc.)

### companies.csv (365 records)
Contractor performance and permit statistics.

**Key Fields:**
- `id_contractor`: Unique contractor identifier
- `company_name`: Business name
- `permits_total`: Total permits issued
- `total_value`: Aggregate project value
- `top_permit_types`: Most common work types
- `Synthetic`: Data source indicator (False = real data)

### addresses.csv (50 records)
Permit aggregations by property address characteristics.

**Key Fields:**
- `property_address_type_key`: Address classification
- `permits_total`: Total permits for type
- `total_value`: Aggregate value for type
- `avg_value`: Average permit value
- `Synthetic`: 46 records marked as synthetic test data

## 📖 Data Dictionary

### Common Fields Across Datasets

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `permits_total` | integer | Total number of permits | 935 |
| `permits_recent` | integer | Recent permit count | 935 |
| `total_value` | decimal | Aggregate project value | 72264480.0 |
| `avg_value` | decimal | Average permit value | 134320.59 |
| `latest_permit_date` | date | Most recent permit date | 2000-12-29 |
| `earliest_permit_date` | date | Oldest permit date | 2000-01-03 |

### Permit Types (Most Common)

| Type | Description | Frequency |
|------|-------------|-----------|
| Single family residence (new) | New home construction | High |
| Electrical | Electrical work | High |
| Mechanical | HVAC/plumbing | High |
| Parent | Master permit | Medium |
| Swimming pool - commercial | Pool construction | Medium |

## 💡 Usage Examples

### Basic Data Analysis
```bash
# Count permits by type
cut -d',' -f7 db/projects.csv | sort | uniq -c | sort -nr | head -10

# Find highest value projects
sort -t',' -k12 -nr db/projects.csv | head -5 | cut -d',' -f10,12

# Geographic distribution
cut -d',' -f40 db/projects.csv | sort | uniq -c | sort -nr
```

### Python/Pandas Analysis
```python
import pandas as pd

# Load and analyze projects
projects = pd.read_csv('db/projects.csv')
companies = pd.read_csv('db/companies.csv')

# Top contractors by total value
top_contractors = companies.nlargest(10, 'total_value')[['company_name', 'total_value']]

# Permit distribution by type
permit_dist = projects['permit_type'].value_counts().head(10)

# Geographic clustering
tx_projects = projects[projects['state'] == 'TX']
```

### Development Integration
```typescript
// Type-safe data loading
interface Project {
  id_permit_atm: string;
  permit_type: string;
  job_value: number;
  company_name: string;
  latitude: number;
  longitude: number;
  status: string;
}

// Load projects data
const projects: Project[] = await loadProjectsFromCSV('db/projects.csv');
```

## ✅ Data Quality

### Validation Rules
- ✅ **Geographic consistency**: All records within Dallas-Fort Worth metro area
- ✅ **Date integrity**: `latest_permit_date` >= `earliest_permit_date`
- ✅ **Value consistency**: `total_value` >= `avg_value` where applicable
- ✅ **ID uniqueness**: Unique identifiers across datasets
- ✅ **Synthetic marking**: Clear distinction between real and test data

### Known Characteristics
- **Date range**: All permits from year 2000
- **Geographic focus**: Primarily Dallas and Irving, TX
- **Value distribution**: Wide range from $0 to $36M+ projects
- **Synthetic data**: 46 addresses marked for testing scenarios

## 🔧 Development Guidelines

### File Organization
```
db/
├── projects.csv      # Core permit data (1,008 records)
├── companies.csv     # Contractor data (365 records)
├── addresses.csv     # Geographic aggregations (50 records)
└── README.md         # This documentation
```

### Data Loading Best Practices

```typescript
// ✅ Recommended: Async loading with error handling
async function loadPermitData() {
  try {
    const projects = await loadCSV('db/projects.csv');
    const companies = await loadCSV('db/companies.csv');
    return { projects, companies };
  } catch (error) {
    console.error('Failed to load permit data:', error);
    throw error;
  }
}

// ✅ Recommended: Type validation
interface PermitRecord {
  id_permit_atm: string;
  job_value: number;
  latitude: number;
  longitude: number;
}

// ❌ Avoid: Synchronous loading for large datasets
const data = fs.readFileSync('db/projects.csv', 'utf8'); // Blocks event loop
```

### Testing with Synthetic Data
```typescript
// Use synthetic records for predictable testing
const syntheticAddresses = addresses.filter(addr => addr.Synthetic === 'True');

// Test data integrity
describe('Address Data', () => {
  it('should have valid synthetic records', () => {
    expect(syntheticAddresses).toHaveLength(46);
    syntheticAddresses.forEach(addr => {
      expect(addr.total_value).toBeGreaterThan(0);
    });
  });
});
```

### Performance Considerations
- **Memory usage**: projects.csv (~2MB) loads efficiently in most environments
- **Indexing**: Consider database import for complex queries
- **Caching**: Cache aggregations for frequently accessed metrics
- **Streaming**: Use streaming parsers for memory-constrained environments

### Temporary Feature Flag: Use Mock DB

During early development, you can force dashboard entity queries to read from the CSVs in this folder instead of ClickHouse.

- Enable by setting either environment variable to `true`:
  - `NEXT_PUBLIC_USE_MOCK_DB=true` (browser-visible; dev only)
  - `USE_MOCK_DB=true` (server-only)

When enabled, the API route `app/api/v1/entity/{entity}/query/route.ts` will respond from `db/projects.csv`, `db/companies.csv`, or `db/addresses.csv` for entity queries.

This flag is intended for local development and will be removed before production. Remove the flag and conditional once ClickHouse is fully available.

## 📈 Analytics Use Cases

### Contractor Performance
```sql
-- Top contractors by project value
SELECT company_name, total_value, permits_total
FROM companies
ORDER BY total_value DESC
LIMIT 10;
```

### Geographic Analysis
```sql
-- Permit density by city
SELECT city, COUNT(*) as permit_count, AVG(job_value) as avg_value
FROM projects
GROUP BY city
ORDER BY permit_count DESC;
```

### Temporal Trends
```sql
-- Monthly permit activity
SELECT DATE_TRUNC('month', latest_permit_date) as month, COUNT(*) as permits
FROM projects
GROUP BY month
ORDER BY month;
```

## 🏷️ Tags

`#data` `#construction` `#permits` `#dallas-fort-worth` `#analytics` `#development`

---

_Last updated: 2025-09-10_
