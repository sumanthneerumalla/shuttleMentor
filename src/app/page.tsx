import Link from "next/link";

import Features from "@/app/_components/home/Features";
import Hero from "@/app/_components/home/Hero";
import HowItWorks from "@/app/_components/home/HowItWorks";
import Footer from "@/app/_components/layout/Footer";
import Navbar from "@/app/_components/layout/Navbar";
import { Button } from "@/app/_components/ui/button";
import { ArrowRight, Calendar, Star, Users } from "lucide-react";

import { LatestPost } from "~/app/_components/post";
import { HydrateClient, api } from "~/trpc/server";

export default async function Home() {
	const hello = await api.post.hello({ text: "from tRPC" });

	void api.post.getLatest.prefetch();

	return (
		<div className="flex flex-col min-h-screen">
		  <Navbar />
		  
		  <main className="flex-grow">
			<Hero />
			
			<Features />
			
			<HowItWorks />
			
			{/* Testimonials Section */}
			<section className="py-20">
			  <div className="container mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center max-w-3xl mx-auto mb-16">
				  <h2 className="section-heading animate-slide-up">
					What Our Users Say
				  </h2>
				  <p className="section-subheading animate-slide-up" style={{ animationDelay: '0.1s' }}>
					Here's what students and coaches have to say about their experience with ShuttleCoach.
				  </p>
				</div>
				
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
				  {[
					{
					  name: "Sarah Chen",
					  role: "Intermediate Player",
					  image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=250&q=80",
					  quote: "The video analysis from my coach completely transformed my backhand technique. In just three sessions, I saw a dramatic improvement in my game."
					},
					{
					  name: "Michael Wong",
					  role: "Professional Coach",
					  image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=250&q=80",
					  quote: "ShuttleCoach has helped me expand my coaching business beyond local players. The platform is intuitive and the scheduling tools are excellent."
					},
					{
					  name: "Aditya Patel",
					  role: "Advanced Player",
					  image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=250&q=80",
					  quote: "Having access to coaches from around the world has been incredible. My doubles strategy has improved dramatically thanks to specialized coaching."
					}
				  ].map((testimonial, index) => (
					<div 
					  key={index} 
					  className="glass-card rounded-xl p-6 animate-slide-up"
					  style={{ animationDelay: `${0.1 + index * 0.1}s` }}
					>
					  <div className="flex items-center space-x-1 text-yellow-500 mb-4">
						{[...Array(5)].map((_, i) => (
						  <Star key={i} className="h-4 w-4 fill-yellow-500" />
						))}
					  </div>
					  <blockquote className="text-lg mb-6">"{testimonial.quote}"</blockquote>
					  <div className="flex items-center">
						<img
						  src={testimonial.image}
						  alt={testimonial.name}
						  className="h-12 w-12 rounded-full mr-4 object-cover"
						/>
						<div>
						  <div className="font-medium">{testimonial.name}</div>
						  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
						</div>
					  </div>
					</div>
				  ))}
				</div>
			  </div>
			</section>
			
			{/* Stats Section */}
			<section className="py-16 bg-gray-50 dark:bg-gray-800/50">
			  <div className="container mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
				  {[
					{
					  label: "Active Coaches",
					  value: "200+",
					  icon: <Users className="h-8 w-8 text-shuttle-500 mb-2" />
					},
					{
					  label: "Coaching Sessions",
					  value: "5,000+",
					  icon: <Calendar className="h-8 w-8 text-shuttle-500 mb-2" />
					},
					{
					  label: "Average Rating",
					  value: "4.8/5",
					  icon: <Star className="h-8 w-8 text-shuttle-500 mb-2 fill-shuttle-500" />
					}
				  ].map((stat, index) => (
					<div 
					  key={index} 
					  className="glass-card rounded-xl py-10 px-6 flex flex-col items-center animate-slide-up"
					  style={{ animationDelay: `${0.1 + index * 0.1}s` }}
					>
					  {stat.icon}
					  <div className="text-3xl font-bold mb-1">{stat.value}</div>
					  <div className="text-muted-foreground">{stat.label}</div>
					</div>
				  ))}
				</div>
			  </div>
			</section>
			
			{/* CTA Section */}
			<section className="py-20">
			  <div className="container mx-auto px-4 sm:px-6 lg:px-8">
				<div className="glass-panel rounded-2xl p-8 md:p-16 text-center max-w-4xl mx-auto">
				  <h2 className="section-heading mb-6 animate-slide-up">
					Ready to Transform Your Badminton Game?
				  </h2>
				  <p className="section-subheading mb-8 mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
					Join ShuttleCoach today and connect with expert coaches who can help you reach your full potential.
				  </p>
				  <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
					<Button size="lg" className="rounded-lg">
					  Get Started <ArrowRight className="ml-2 h-4 w-4" />
					</Button>
					<Button size="lg" variant="outline" className="rounded-lg">
					  Browse Coaches
					</Button>
				  </div>
				</div>
			  </div>
			</section>
		  </main>
		  
		  <Footer />
		</div>
	  );
}
