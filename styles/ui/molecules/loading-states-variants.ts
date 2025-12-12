import { tv, type VariantProps } from '@/styles/utils';
import { textTri } from '@/styles/shared-variants';

export const loadingStates = tv({
	base: 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-[hsl(var(--overlay))]/70 text-foreground',
	variants: {
		state: {
			idle: '',
			loading: '',
			success: 'bg-[hsl(var(--success))/0.1] text-[hsl(var(--success))]',
			error: 'bg-[hsl(var(--danger))/0.1] text-[hsl(var(--danger))]',
		},
		size: textTri,
	},
	defaultVariants: { state: 'idle', size: 'md' },
});

export type LoadingStatesVariants = VariantProps<typeof loadingStates>;



