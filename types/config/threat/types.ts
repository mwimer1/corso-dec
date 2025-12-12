/**
 * @module types/config/threat/types
 * @description Type definitions for threat modeling and classification
 * @author Corso Development Team
 */

export type SecurityThreatType =
  | 'sql_injection'
  | 'xss'
  | 'csrf'
  | 'prompt_injection'
  | 'auth_bypass'
  | 'data_leak'
  | 'denial_of_service';

