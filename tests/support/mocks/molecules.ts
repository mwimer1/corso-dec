// Mock molecules components for tests
export const LinkTrack = ({ children, ..._props }: any) => children;
export const TabSwitcher = ({ children, ..._props }: any) => children;
export const DataTablePagination = ({ children, ..._props }: any) => children;
export const DataTableToolbar = ({ children, ..._props }: any) => children;
export const DataTableViewOptions = ({ children, ..._props }: any) => children;
export const PaginationButton = ({ children, ..._props }: any) => children;
export const TableHeadBase = ({ children, ..._props }: any) => children;
export const SectionHeader = ({ children, ..._props }: any) => children;

// Export all other molecules components as simple passthroughs
export * from '@/components/ui/molecules';

