import { useEffect } from "react";

export default function SmsPolicy() {
  useEffect(() => {
    document.title = "SMS Policy | Baby Banz Earmuffs Gemach";
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 py-10 sm:py-14">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="text-3xl font-bold text-neutral-800 mb-2">SMS Policy</h1>
        <p className="text-sm text-neutral-500 mb-8">
          A quick overview of how text messages work with EarmuffsGemach.
        </p>

        <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 space-y-6 text-neutral-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">When We Text You</h2>
            <p>
              EarmuffsGemach sends SMS only for operational communication tied to your activity
              with the Gemach. We don't send marketing or promotional messages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">Types of Messages</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Request confirmations</li>
              <li>Pickup updates</li>
              <li>Return reminders</li>
              <li>Onboarding messages for new Gemach locations</li>
              <li>Support replies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">How You Opt In</h2>
            <p>
              You opt in by entering your phone number on one of our website forms and checking
              the SMS consent box. No box checked, no texts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">How to Opt Out or Get Help</h2>
            <p>
              Reply <strong>STOP</strong> at any time to unsubscribe. Reply <strong>HELP</strong>{" "}
              for assistance. You can also email us at{" "}
              <a href="mailto:earmuffsgemach@gmail.com" className="text-primary hover:underline">
                earmuffsgemach@gmail.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">Frequency & Rates</h2>
            <p>
              Message frequency varies based on your activity. Message and data rates may apply
              depending on your mobile carrier and plan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-neutral-800 mb-2">Privacy</h2>
            <p>
              Your SMS consent and phone number are not sold or shared with third parties for
              marketing purposes. See our{" "}
              <a href="/privacy-policy" className="text-primary hover:underline">
                Privacy Policy
              </a>{" "}
              for full details.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
