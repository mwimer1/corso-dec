import { tv, type VariantProps } from '@/styles/utils';

export const skeletonSuite = tv({
	base: 'rounded-md border border-border bg-surface p-md space-y-3',
	variants: {
		shape: { rect: '', circle: 'aspect-square', text: 'space-y-2' },
		size: { sm: 'p-sm', md: 'p-md', lg: 'p-lg' },
	},
	defaultVariants: { shape: 'rect', size: 'md' },
});

export type SkeletonSuiteVariants = VariantProps<typeof skeletonSuite>;



