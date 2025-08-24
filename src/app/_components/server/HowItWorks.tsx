import { ArrowRight } from "lucide-react";
import React from "react";

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Create Your Profile",
      description:
        "Sign up and create your profile, specifying whether you're a student looking for coaching or a coach offering services.",
      color: "indigo",
    },
    {
      number: "02",
      title: "Upload Videos or Browse Coaches",
      description:
        "Students can upload gameplay videos and browse available coaches. Coaches can set up their profile, hourly rates, and availability.",
      color: "blue",
    },
    {
      number: "03",
      title: "Book a Coaching Session",
      description:
        "Students can book 30-minute or longer sessions with coaches in their local timezone. Coaches can accept bookings that fit their schedule.",
      color: "indigo",
    },
    {
      number: "04",
      title: "Attend Virtual Sessions",
      description:
        "Join live video coaching sessions where coaches provide feedback, analyze technique, and offer personalized guidance.",
      color: "blue",
    },
  ];

  return (
    <section className="bg-gray-50 py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="section-heading animate-slide-up">
            How ShuttleMentor Works
          </h2>
          <p
            className="section-subheading animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            Our platform makes it easy to connect students with coaches through
            a simple, streamlined process designed for the best coaching
            experience.
          </p>
        </div>

        <div className="relative grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Connection line for desktop */}
          <div className="absolute top-1/2 left-0 right-0 z-0 h-0.5 -translate-y-1/2 bg-gray-200 hidden lg:block" />

          {steps.map((step, index) => (
            <div
              key={index}
              className="relative z-10 animate-slide-up"
              style={{ animationDelay: `${0.1 + index * 0.1}s` }}
            >
              <div className="glass-card flex h-full flex-col rounded-xl p-6 transition-all hover:shadow-lg">
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${
                    step.color === "indigo" 
                      ? "bg-indigo-100 text-indigo-600" 
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {step.number}
                </div>
                <h3 className="mb-2 text-xl font-bold">{step.title}</h3>
                <p className="text-sm text-gray-600">
                  {step.description}
                </p>

                {index < steps.length - 1 && (
                  <div className="absolute top-1/2 -right-4 z-20 -translate-y-1/2 hidden lg:flex">
                    <div className="rounded-full border border-gray-200 bg-white p-1">
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;