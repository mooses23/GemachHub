import React from "react";
import { Card, CardContent } from "@/components/ui/card";

type Testimonial = {
  content: string;
  name: string;
  location: string;
  rating: number;
};

const testimonials: Testimonial[] = [
  {
    content: "The earmuffs were a lifesaver at my sister's wedding! My 6-month-old was able to stay with us the entire time and slept peacefully despite the loud music.",
    name: "Rachel K.",
    location: "Parent from New York",
    rating: 5,
  },
  {
    content: "Running the gemach in our community has been such a rewarding experience. Parents are so grateful, and it's wonderful to see babies at simchas protected from the noise.",
    name: "Deborah L.",
    location: "Gemach Operator in Chicago",
    rating: 5,
  },
  {
    content: "I was hesitant at first, but my baby actually likes wearing the earmuffs! The process of borrowing was simple, and it saved us from having to purchase a pair we'd only use occasionally.",
    name: "David M.",
    location: "Parent from Los Angeles",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-800 mb-4">What People Are Saying</h2>
          <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
            Hear from parents and gemach operators about their experiences with Baby Banz Earmuffs.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="text-yellow-400 flex">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-neutral-600 mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <div className="font-medium">
                    <p className="text-neutral-800">{testimonial.name}</p>
                    <p className="text-neutral-500 text-sm">{testimonial.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
