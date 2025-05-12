import React from "react";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-800 mb-4">How The Gemach Works</h2>
          <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
            Our gemach provides Baby Banz earmuffs to protect infants' hearing at loud events through a simple borrowing process.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-neutral-100 rounded-xl p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Find a Location</h3>
            <p className="text-neutral-600">
              Locate the gemach nearest to you from our worldwide directory of locations.
            </p>
          </div>
          
          {/* Step 2 */}
          <div className="bg-neutral-100 rounded-xl p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Borrow With Deposit</h3>
            <p className="text-neutral-600">
              Pay a $20 refundable deposit and borrow the sanitized Baby Banz Earmuffs for your event.
            </p>
          </div>
          
          {/* Step 3 */}
          <div className="bg-neutral-100 rounded-xl p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Enjoy With Peace of Mind</h3>
            <p className="text-neutral-600">
              Every pair is thoroughly sanitized between uses with our medical-grade cleaning protocol.
            </p>
          </div>
          
          {/* Step 4 */}
          <div className="bg-neutral-100 rounded-xl p-6 text-center hover:shadow-md transition-shadow">
            <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold">4</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Return & Refund</h3>
            <p className="text-neutral-600">
              Return the earmuffs in good condition and receive your deposit back. It's that simple!
            </p>
          </div>
        </div>
        
        <div className="mt-12 bg-primary/10 rounded-xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/4 mb-4 md:mb-0 flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11.5 2.5a.5.5 0 0 1 1 0 .5.5 0 0 1-1 0zm5 0a.5.5 0 0 1 1 0 .5.5 0 0 1-1 0zm-10 0a.5.5 0 0 1 1 0 .5.5 0 0 1-1 0z" />
                <path d="M18.29 5.7a.5.5 0 1 0-.58-.8.5.5 0 0 0 .58.8zm-12 8.6a.5.5 0 1 0-.58-.8.5.5 0 0 0 .58.8zm12 0a.5.5 0 1 0-.58-.8.5.5 0 0 0 .58.8zm-12-8.6a.5.5 0 1 0-.58-.8.5.5 0 0 0 .58.8zM2.5 11.5a.5.5 0 0 0 0 1 .5.5 0 0 0 0-1zm19 0a.5.5 0 0 0 0 1 .5.5 0 0 0 0-1z" />
                <path d="M19 8.4v.4a2 2 0 0 1-1 1.73V13a2 2 0 0 1-2 2h-2v2h-4v-2H8a2 2 0 0 1-2-2v-2.42A2 2 0 0 1 5 8.76V8.4a2 2 0 0 1 2.8-1.85 2 2 0 0 1 3.4-.85 2 2 0 0 1 3.4.85A2 2 0 0 1 19 8.4z" />
              </svg>
            </div>
            <div className="md:w-3/4">
              <h3 className="text-xl font-semibold mb-2">Why Protect Your Baby's Hearing?</h3>
              <p className="text-neutral-600 mb-4">
                Babies and young children have sensitive ears that can be damaged by loud noises at events like weddings, concerts, and celebrations. Noise-cancelling earmuffs specially designed for infants help protect their developing auditory system.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Prevents hearing damage</span>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Reduces stress and anxiety</span>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Helps babies sleep at events</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
