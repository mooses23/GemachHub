import React from "react";
import { ApplyForm } from "@/components/apply/apply-form";

export default function Apply() {
  return (
    <>
      {/* Meta tags */}
      <head>
        <title>Open a Baby Banz Earmuffs Gemach | Application Form</title>
        <meta name="description" content="Apply to open a Baby Banz Earmuffs Gemach in your community. Help protect babies' hearing at celebrations and events." />
        <meta property="og:title" content="Open a Baby Banz Earmuffs Gemach" />
        <meta property="og:description" content="Start your own Baby Banz Earmuffs Gemach to serve your community. Simple application process." />
        <meta property="og:url" content="https://earmuffsgemach.com/apply" />
        <meta property="og:type" content="website" />
      </head>
      
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-10">
            <div className="md:w-1/2">
              <h1 className="text-3xl font-bold text-neutral-800 mb-4">Open a Gemach in Your Community</h1>
              <p className="text-lg text-neutral-600 mb-6">
                Help protect babies' hearing in your community by starting your own Baby Banz Earmuffs Gemach location. It's simple to get started and we'll provide all the support you need.
              </p>
              
              <div className="bg-neutral-100 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-semibold mb-3">What You'll Need:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mt-1 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>A secure location to store earmuffs</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mt-1 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Ability to collect and refund deposits</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mt-1 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Time to manage borrowing and returns</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mt-1 mr-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Commitment to maintaining sanitized earmuffs</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-primary/10 rounded-xl p-6">
                <div className="flex items-start">
                  <svg className="h-6 w-6 text-yellow-400 mt-1 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Why Start a Gemach?</h3>
                    <p className="text-neutral-600">
                      Opening a gemach is a wonderful way to provide a valuable service to your community while performing a mitzvah. You'll be helping protect the hearing of the youngest members of your community during celebrations and events.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="md:w-1/2">
              <ApplyForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
