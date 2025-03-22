export interface Coach {
	id: string;
	name: string;
	profileImage: string;
	hourlyRate: number;
	rating: number;
	reviewCount: number;
	specialties: string[];
	description: string;
	location: string;
	experience: number;
	badges: string[];
	teachingStyles: TeachingStyle[];
	availability?: AvailabilitySlot[];
}

// Changed from a type to an interface for possible future expansion
export interface TeachingStyle {
	id: string;
	name: string;
	description?: string;
	isActive: boolean;
}

export interface CoachingCategory {
	name: string;
	description: string;
	icon?: string;
}

export interface AvailabilitySlot {
	id: string;
	startTime: Date;
	endTime: Date;
	isBooked: boolean;
}

export interface VideoUpload {
	id: string;
	title: string;
	url: string;
	thumbnailUrl: string;
	uploadDate: Date;
	duration: number;
	coachId?: string;
}

export interface VideoGroup {
	id: string;
	name: string;
	videos: VideoUpload[];
	createdAt: Date;
	coachId?: string;
}

export interface User {
	id: string;
	name: string;
	email: string;
	profileImage?: string;
	role: "student" | "coach" | "admin";
	timezone: string;
}

export interface Session {
	id: string;
	studentId: string;
	coachId: string;
	startTime: Date;
	endTime: Date;
	status: "scheduled" | "completed" | "cancelled";
	meetingUrl?: string;
	recordingUrl?: string;
	price: number;
	isPaid: boolean;
	notes?: {
		coach?: string;
		student?: string;
		ai?: string;
	};
}

export interface Payment {
	id: string;
	sessionId: string;
	amount: number;
	currency: string;
	status: "pending" | "succeeded" | "failed";
	stripePaymentId?: string;
	createdAt: Date;
}

export interface Review {
	id: string;
	sessionId: string;
	studentId: string;
	coachId: string;
	rating: number;
	comment?: string;
	selectedTeachingStyles: string[]; // IDs of up to 3 teaching styles
	createdAt: Date;
}

export type Testimonial = {
	name: string;
	role: string;
	image: string;
	quote: string;
};

export type Stat = {
	label: string;
	value: string;
	icon: React.ReactNode;
};
