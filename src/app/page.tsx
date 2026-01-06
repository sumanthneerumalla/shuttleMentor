import { HydrateClient } from "~/trpc/server";
import { Hero } from "~/app/_components/client/public/Hero";
import { Features } from "~/app/_components/server/Features";
import { HowItWorks } from "~/app/_components/server/HowItWorks";
import { FAQSection, studentFAQs, coachFAQs } from "~/app/_components/server/FAQ";
import { Button } from "~/app/_components/shared/Button";
import { ArrowRight, Calendar, Star, Users } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <HydrateClient>
      <div className="flex flex-col">
        <Hero />
        <Features />
        <HowItWorks />
        
        {/* Testimonials Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="section-heading animate-slide-up">
                What Our Users Say
              </h2>
              <p className="section-subheading animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Here's what students and coaches have to say about their experience with ShuttleMentor.
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-8">
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
                  quote: "ShuttleMentor has helped me expand my coaching business beyond local players. The platform is intuitive and the scheduling tools are excellent."
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
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* FAQ Sections */}
        <FAQSection title="Student FAQs" faqs={studentFAQs} id="student-faq" />
        
        {/* Stats Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-3 gap-8 text-center">
              {[
                {
                  label: "Active Coaches",
                  value: "200+",
                  icon: <Users className="h-8 w-8 text-indigo-500 mb-2" />
                },
                {
                  label: "Coaching Sessions",
                  value: "5,000+",
                  icon: <Calendar className="h-8 w-8 text-indigo-500 mb-2" />
                },
                {
                  label: "Average Rating",
                  value: "4.8/5",
                  icon: <Star className="h-8 w-8 text-indigo-500 mb-2 fill-indigo-500" />
                }
              ].map((stat, index) => (
                <div 
                  key={index} 
                  className="glass-card rounded-xl py-10 px-6 flex flex-col items-center animate-slide-up"
                  style={{ animationDelay: `${0.1 + index * 0.1}s` }}
                >
                  {stat.icon}
                  <div className="text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="glass-panel rounded-2xl p-16 text-center max-w-4xl mx-auto">
              <h2 className="section-heading mb-6 animate-slide-up">
                Ready to Transform Your Badminton Game?
              </h2>
              <p className="section-subheading mb-8 mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Join ShuttleMentor today and connect with expert coaches who can help you reach your full potential.
              </p>
              <div className="flex gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <Link href="/signup">
                  <Button size="lg" className="rounded-lg">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/coaches">
                  <Button size="lg" variant="outline" className="rounded-lg">
                    Browse Coaches
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </HydrateClient>
  );
}