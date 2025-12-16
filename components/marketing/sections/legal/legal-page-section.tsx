// components/marketing/legal/legal-page-section.tsx
import type { ReactNode } from "react";
import * as React from "react";
import { LegalSection } from "./legal-section";

interface LegalPageSectionProps
	// Inherit all props from LegalSection except 'as' (we manage default)
	extends Omit<React.ComponentProps<typeof LegalSection>, "as"> {
	title: string;
	subtitle?: ReactNode;
	lastUpdated?: string | Date;
	/** Downshift heading level if a route-level H1 already exists */
	headingLevel?: 1 | 2;
	/** Optional wrapper element; defaults to 'article' */
	as?: keyof React.JSX.IntrinsicElements;
}

/**
 * LegalPageSection – shared page wrapper for legal content pages.
 * Renders a consistent heading block and wraps the provided policy body.
 */
export function LegalPageSection(props: LegalPageSectionProps) {
	const {
		title,
		subtitle,
		lastUpdated,
		headingLevel = 1,
		as = "article",
		className,
		children,
		...rest
	} = props;

	const HeadingTag: keyof React.JSX.IntrinsicElements = headingLevel === 1 ? "h1" : "h2";

	function toDate(v: string | Date) {
		return typeof v === "string" ? new Date(v) : v;
	}

	return (
		<LegalSection as={as} className={className} {...rest}>
			<header>
				<HeadingTag>{title}</HeadingTag>
				{subtitle ? <p>{subtitle}</p> : null}
				{lastUpdated ? (
					<p className="text-sm text-muted-foreground">
						Last updated:{" "}
						<time dateTime={toDate(lastUpdated).toISOString()}>
							{toDate(lastUpdated).toLocaleDateString(undefined, {
								year: "numeric",
								month: "long",
								day: "numeric",
							})}
						</time>
					</p>
				) : null}
			</header>
			<div>{children}</div>
		</LegalSection>
	);
}


