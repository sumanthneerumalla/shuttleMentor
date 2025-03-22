import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const fadeIn = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { duration: 0.6, ease: "easeOut" },
	},
};

export const slideUp = {
	hidden: { y: 20, opacity: 0 },
	visible: {
		y: 0,
		opacity: 1,
		transition: { duration: 0.5, ease: "easeOut" },
	},
};

export const slideDown = {
	hidden: { y: -20, opacity: 0 },
	visible: {
		y: 0,
		opacity: 1,
		transition: { duration: 0.5, ease: "easeOut" },
	},
};

export const slideInLeft = {
	hidden: { x: -30, opacity: 0 },
	visible: {
		x: 0,
		opacity: 1,
		transition: { duration: 0.5, ease: "easeOut" },
	},
};

export const slideInRight = {
	hidden: { x: 30, opacity: 0 },
	visible: {
		x: 0,
		opacity: 1,
		transition: { duration: 0.5, ease: "easeOut" },
	},
};

export const staggerContainer = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
			delayChildren: 0.2,
		},
	},
};

export const pageTransition = {
	initial: { opacity: 0, y: 10 },
	animate: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.4, ease: "easeOut" },
	},
	exit: {
		opacity: 0,
		y: -10,
		transition: { duration: 0.2, ease: "easeIn" },
	},
};

export const scaleIn = {
	hidden: { scale: 0.95, opacity: 0 },
	visible: {
		scale: 1,
		opacity: 1,
		transition: { duration: 0.4, ease: "easeOut" },
	},
};

export function getStaggeredDelay(index: number, baseDelay = 0.1) {
	return baseDelay * index;
}
