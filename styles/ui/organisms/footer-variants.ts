import { tv } from '@/styles/utils';

export const footer = tv({
	base: '',
	variants: {
		mode: {
			landing: 'border-t border-border bg-surface text-foreground',
			app: 'w-full border-t border-border bg-foreground text-background',
		},
		padding: {
			none: '',
			sm: 'px-sm py-sm',
			md: 'px-md py-md',
			lg: 'px-lg py-2xl',
			xl: 'px-xl py-3xl',
			'2xl': 'px-xl py-2xl',
		},
		inset: { true: '', false: '' },
	},
	defaultVariants: { mode: 'landing', padding: 'xl', inset: false },
});

