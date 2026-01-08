// Mock atoms components for tests
export const Button = ({ children, ..._props }: any) => children;
export const Input = ({ children, ..._props }: any) => children;
export const Label = ({ children, ..._props }: any) => children;

// Export all other atoms components as simple passthroughs
export * from '@/components/ui/atoms';

