"use client";

import { Button } from "~/app/_components/shared/Button";
import { ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import React from "react";

export function Hero() {
  return (
    <div className="relative overflow-hidden pt-20 pb-20 md:pt-24 md:pb-24">
      {/* Background decorative elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -left-10 top-1/4 h-60 w-60 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute right-0 bottom-1/3 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-start lg:gap-20">
          <div className="flex-1 max-w-2xl text-center lg:text-left">
            <div className="mb-6 inline-flex items-center rounded-full border border-indigo-500/20 bg-indigo-500/5 px-3 py-1 text-sm font-medium text-indigo-600">
              <span className="mr-1 animate-pulse-slow">•</span> Now accepting
              coaches and students
            </div>

            <h1 className="animate-slide-up font-display text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              Elevate Your Badminton Game with Expert Coaching
            </h1>

            <p className="mt-6 animate-slide-up text-xl text-gray-600" style={{ animationDelay: "0.1s" }}>
              Connect with professional badminton coaches for personalized video analysis and live coaching sessions. Upload your gameplay, get expert feedback, and improve faster.
            </p>

            <div className="mt-8 flex animate-slide-up flex-col justify-center gap-4 sm:flex-row lg:justify-start" style={{ animationDelay: "0.2s" }}>
              <Link href="/sign-up" className="w-full sm:w-auto">
                <Button size="lg" className="w-full">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/coaches" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full">
                  Browse Coaches
                </Button>
              </Link>
            </div>

            <div className="mt-8 grid animate-slide-up grid-cols-1 gap-4 sm:grid-cols-3" style={{ animationDelay: "0.3s" }}>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-indigo-500" />
                <span className="text-sm text-gray-600">Expert coaches</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-indigo-500" />
                <span className="text-sm text-gray-600">Video analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-indigo-500" />
                <span className="text-sm text-gray-600">Live coaching</span>
              </div>
            </div>
          </div>

          <div className="w-full max-w-md flex-1 animate-slide-in-right mx-auto lg:mx-0 lg:max-w-lg">
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500/30 to-indigo-500/50 opacity-30 blur-xl" />
              <div className="relative z-10 overflow-hidden rounded-2xl glass-card">
                <div className="relative">
                  <div className="absolute top-2 right-2 rounded-full bg-white/90 px-2 py-1 text-xs font-medium backdrop-blur-lg">
                    1:00
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1613922241048-9c5ce93d150e?q=80&w=1000&auto=format&fit=crop"
                    alt="Badminton coaching session"
                    className="aspect-video w-full object-cover"
                  />
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold">
                        Live Session Coaching
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        Real-time feedback and guidance
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="relative overflow-hidden rounded-2xl glass-card">
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold">
                        Video Analysis
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        Detailed review of your gameplay
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                    <div className="text-sm text-gray-600">Personalized feedback</div>
                    <div className="text-sm text-gray-600">24hr turnaround</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;