import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative bg-gradient-to-b from-white to-gray-100">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-800 mb-4">
              Welcome to the Baby Banz Earmuffs Gemach
            </h1>
            <p className="text-lg text-neutral-600 mb-8">
              Protecting your baby's hearing at celebrations. We lend out Baby Banz Noise Cancelling Earmuffs for newborns to 2-year-olds with just a $20 refundable deposit.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg">
                <Link href="/locations">Find a Gemach Near You</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/apply">Open a New Gemach</Link>
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <img 
              src="https://i.imgur.com/ZAXpvh0.jpg" 
              alt="Baby wearing noise protection earmuffs" 
              className="rounded-xl shadow-lg max-w-full h-auto"
            />
          </div>
        </div>
      </div>
      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 1440 100" 
          fill="#ffffff" 
          preserveAspectRatio="none" 
          className="w-full h-16"
        >
          <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,100L1360,100C1280,100,1120,100,960,100C800,100,640,100,480,100C320,100,160,100,80,100L0,100Z"></path>
        </svg>
      </div>
    </section>
  );
}
